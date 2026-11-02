/* Phases 4-5: member profile and self-logs on the API (MEMBER lane).
   - owner path: John adds an allergy in the UI, it survives a reload (it is
     on the server), and every request names John's patient id with no
     office header;
   - isolation: Grace never sees John's allergy, and her browser session
     cannot read John's records through the API;
   - API failure on a member page: error state with "Try again" (never an
     empty table), then recovery; a 403 shows "not shared" with no retry;
   - retired prototype stores: legacy rows are purged and never shown.
   Synthetic data only; everything created is removed again. */
import { ACCOUNTS, env } from "./fixtures/env";
import { failApi, recordApiCalls } from "./fixtures/network";
import { expect, test } from "./fixtures/test";

const unique = () => `Synthetic E2E ${Date.now().toString(36)}`;

/* The first-visit tour is on the account since Phase 4 (tourCompletedAt):
   finish it for the synthetic members so its dialog does not cover the
   page under test. Idempotent. */
test.beforeEach(async ({ api }) => {
  for (const account of [ACCOUNTS.john, ACCOUNTS.grace]) {
    const client = await api(account);
    await client.post("/me/preferences/tour-completed");
  }
});

test("owner path: John adds an allergy, it is on the server after reload @phase4", async ({
  asUser,
  api,
}) => {
  const { page } = await asUser(ACCOUNTS.john);
  const johnApi = await api(ACCOUNTS.john);
  const johnId = await johnApi.patientId();
  const calls = recordApiCalls(page);
  const name = unique();

  await page.goto("/dashboard/my-health");
  await page
    .getByRole("button", { name: /add allergy/i })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/name/i).first().fill(name);
  await dialog.getByLabel(/reaction/i).fill("Rash");
  await dialog.getByRole("button", { name: /add allergy/i }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByText(name).filter({ visible: true }).first(),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByText(name).filter({ visible: true }).first(),
  ).toBeVisible();

  const patientCalls = calls.filter((c) => c.path.startsWith("/patients/"));
  expect(patientCalls.length).toBeGreaterThan(0);
  for (const call of patientCalls) {
    expect(call.path.startsWith(`/patients/${johnId}/`)).toBe(true);
    expect(call.headers["x-organization-id"]).toBeUndefined();
  }
  const post = patientCalls.find(
    (c) => c.method === "POST" && c.path.endsWith("/allergies"),
  );
  expect(post, "the add went to the API").toBeTruthy();

  /* Clean up through the API. */
  const list = await (
    await johnApi.get(`/patients/${johnId}/allergies?limit=150`)
  ).json();
  for (const row of list.data ?? [])
    if (row.name === name)
      await johnApi.delete(`/patients/${johnId}/allergies/${row.id}`);
});

test("isolation: Grace never sees John's allergy and cannot read his records @phase4", async ({
  asUser,
  api,
}) => {
  const johnApi = await api(ACCOUNTS.john);
  const johnId = await johnApi.patientId();
  const name = unique();
  const made = await (
    await johnApi.post(`/patients/${johnId}/allergies`, {
      name,
      type: "food",
      reaction: "Hives",
      severity: "mild",
    })
  ).json();

  try {
    const { page } = await asUser(ACCOUNTS.grace);
    const calls = recordApiCalls(page);
    await page.goto("/dashboard/my-health");
    await expect(
      page.getByRole("button", { name: /add allergy/i }).first(),
    ).toBeVisible();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(name)).toHaveCount(0);
    expect(calls.some((c) => c.path.includes(johnId))).toBe(false);

    /* Grace's own browser session asking for John's records directly. */
    const direct = await page.evaluate(
      async ([apiURL, id]) => {
        const res = await fetch(`${apiURL}/patients/${id}/allergies`, {
          credentials: "include",
        });
        return res.status;
      },
      [env.apiURL, johnId] as const,
    );
    expect([403, 404]).toContain(direct);
  } finally {
    await johnApi.delete(`/patients/${johnId}/allergies/${made.data.id}`);
  }
});

test("API failure on a member page: error with retry, never empty, then recovery @phase5", async ({
  asUser,
}) => {
  const { page } = await asUser(ACCOUNTS.john);
  const f = await failApi(
    page,
    /^\/patients\/[^/]+\/blood-pressure$/,
    { kind: "status", status: 500 },
    "GET",
  );
  await page.goto("/dashboard/personal-log/blood-pressure");
  await expect(
    page.getByText("Your readings could not be loaded").first(),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("No readings yet")).toHaveCount(0);
  expect(f.hits()).toBeGreaterThan(0);
  f.lift();
  await page
    .getByRole("button", { name: /try again/i })
    .first()
    .click();
  await expect(page.getByText("Your readings could not be loaded")).toHaveCount(
    0,
  );
});

test("a 403 on a member page shows not shared, with no retry and no rows @phase4", async ({
  asUser,
}) => {
  const { page } = await asUser(ACCOUNTS.john);
  await failApi(
    page,
    /^\/patients\/[^/]+\/allergies$/,
    {
      kind: "status",
      status: 403,
      code: "access.patient_access_denied",
    },
    "GET",
  );
  await page.goto("/dashboard/my-health");
  await expect(
    page.getByText("This has not been shared with you").first(),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: /try again/i })).toHaveCount(0);
});

test("retired prototype stores are purged and never shown @phase5", async ({
  asUser,
}) => {
  const { page } = await asUser(ACCOUNTS.grace);
  await page.goto("/dashboard");
  /* A browser that used the prototype: legacy rows under retired keys. */
  await page.evaluate(() => {
    const legacy = JSON.stringify([
      {
        id: "legacy",
        date: "2026-10-01",
        time: "08:00",
        systolic: 211,
        diastolic: 99,
        pulse: 70,
        position: "Sitting",
        symptoms: "None",
        medication: "Taken",
        notes: "Legacy BP row",
        photo: "data:image/png;base64,AAAA",
      },
    ]);
    localStorage.setItem("nr:blood-pressure-readings", legacy);
    localStorage.setItem(
      "nr:my-health",
      JSON.stringify({
        allergies: [{ id: "x", name: "Legacy Allergy Row" }],
        history: [],
      }),
    );
    localStorage.setItem("nr:quick-actions", JSON.stringify(["labs"]));
  });
  await page.reload();
  await page.goto("/dashboard/personal-log/blood-pressure");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Legacy BP row")).toHaveCount(0);
  await expect(page.locator('img[src^="data:"]')).toHaveCount(0);
  const left = await page.evaluate(() =>
    ["nr:blood-pressure-readings", "nr:my-health", "nr:quick-actions"].filter(
      (k) => localStorage.getItem(k) !== null,
    ),
  );
  expect(left).toEqual([]);
});
