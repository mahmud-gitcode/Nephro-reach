/* Phase 7: member dialysis and home dialysis on the API (MEMBER lane).
   - owner path (Grace, a member-owned home-HD prescription): she charts a
     treatment at 07:30; "165 lb" is refused in the form and nothing is
     sent; with kilograms it saves, and after a reload the treatment shows
     7:30 AM and the post-treatment symptom, read back from the server
     (HH:mm on the wire);
   - facility-owned (John, in-center at Riverside): the dialysis type and
     Edit Week are read-only from the server's memberCanEdit; when a stale
     screen still offers a change, the server's 403 is shown;
   - isolation: Grace never sees John's dialysis data, and her session
     cannot read it through the API;
   - API failure: error with retry (never an empty log), then recovery; a
     403 shows "not shared" with no retry;
   - retired dialysis stores are purged and never shown; the home-HD vitals
     store is the one kept (D8).
   Synthetic data only; treatments created are removed again. */
import { ACCOUNTS, env } from "./fixtures/env";
import { failApi, recordApiCalls } from "./fixtures/network";
import { expect, test } from "./fixtures/test";

const patientDay = (offset = 0) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + offset * 86_400_000));

test.beforeEach(async ({ api }) => {
  for (const account of [ACCOUNTS.john, ACCOUNTS.grace]) {
    const client = await api(account);
    await client.post("/me/preferences/tour-completed");
  }
});

test("owner path: a home-HD treatment saves HH:mm and post-symptoms; lb is refused @phase7", async ({
  asUser,
  api,
}) => {
  const graceApi = await api(ACCOUNTS.grace);
  const graceId = await graceApi.patientId();
  /* Grace's own (member-owned) home-HD prescription. */
  const rx = await graceApi.get(`/patients/${graceId}/dialysis/prescription`);
  if (rx.status() === 404)
    await graceApi.post(`/patients/${graceId}/dialysis/prescription`, {
      modality: "HOME_HD",
    });
  else
    await graceApi.patch(`/patients/${graceId}/dialysis/prescription`, {
      modality: "HOME_HD",
    });
  const day = patientDay(-1);
  const before = (
    await (
      await graceApi.get(
        `/patients/${graceId}/dialysis/treatments?from=${day}&to=${day}&limit=150`,
      )
    ).json()
  ).data as { id: string }[];
  for (const row of before)
    await graceApi.delete(`/patients/${graceId}/dialysis/treatments/${row.id}`);

  const { page } = await asUser(ACCOUNTS.grace);
  const calls = recordApiCalls(page);
  let made: string | undefined;
  try {
    await page.goto("/dashboard/personal-log/dialysis-treatment/add");
    const session = page.getByLabel("Scheduled session");
    await expect(session).toBeVisible({ timeout: 30_000 });
    await session.selectOption("__makeup__");
    await page.getByLabel("Date", { exact: true }).fill(day);
    await page.getByLabel("Start time").fill("07:30");
    await page.getByLabel("End time").fill("11:30");
    await page.getByPlaceholder("74.7").fill("165 lb");

    /* Through the steps to Save. */
    for (let i = 0; i < 3; i++)
      await page.getByRole("button", { name: "Next Page" }).click();
    await page.getByRole("button", { name: "Save Log" }).click();
    await expect(
      page.getByText(/Enter weights in kilograms as a number/),
    ).toBeVisible();
    expect(
      calls.some(
        (c) => c.method === "POST" && c.path.endsWith("/dialysis/treatments"),
      ),
      "nothing is sent with a weight in pounds",
    ).toBe(false);

    /* Back to step 1 for kilograms, step 3 for a post symptom. */
    await page.getByRole("button", { name: /Pre-Dialysis/ }).click();
    await page.getByPlaceholder("74.7").fill("74.7");
    await page.getByRole("button", { name: /Post & Vitals/ }).click();
    await page.getByRole("button", { name: "Dizziness" }).click();
    await page.getByPlaceholder("72.4").fill("72.4");
    await page.getByRole("button", { name: "Next Page" }).click();
    await page.getByRole("button", { name: "Save Log" }).click();
    await page.waitForURL(/\/dialysis-treatment$/, { timeout: 30_000 });

    const rows = (
      await (
        await graceApi.get(
          `/patients/${graceId}/dialysis/treatments?from=${day}&to=${day}&limit=150`,
        )
      ).json()
    ).data as {
      id: string;
      startTime: string;
      preWeight: string;
      modality: string;
      symptoms: { postSymptoms?: string[] };
    }[];
    expect(rows).toHaveLength(1);
    made = rows[0].id;
    expect(rows[0].startTime).toBe("07:30");
    expect(rows[0].preWeight).toBe("74.7");
    expect(rows[0].modality).toBe("HOME_HD");
    expect(rows[0].symptoms.postSymptoms).toEqual(["Dizziness"]);

    await page.goto(
      `/dashboard/personal-log/dialysis-treatment/view?id=${made}`,
    );
    await page.reload();
    await expect(page.getByText("7:30 AM").first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("Post-treatment symptoms")).toBeVisible();
    await expect(page.getByText("Dizziness").first()).toBeVisible();

    for (const call of calls.filter((c) => c.path.startsWith("/patients/"))) {
      expect(call.path.startsWith(`/patients/${graceId}/`)).toBe(true);
      expect(call.headers["x-organization-id"]).toBeUndefined();
    }
  } finally {
    if (made)
      await graceApi.delete(`/patients/${graceId}/dialysis/treatments/${made}`);
  }
});

test("facility-owned: read-only from memberCanEdit, and the server's 403 is shown @phase7", async ({
  asUser,
  api,
}) => {
  const johnApi = await api(ACCOUNTS.john);
  const johnId = await johnApi.patientId();
  const rx = await (
    await johnApi.get(`/patients/${johnId}/dialysis/prescription`)
  ).json();
  test.skip(
    rx.data?.memberCanEdit !== false,
    "needs John's in-center prescription held by a dialysis center (live-phase7.mjs sets it)",
  );

  const { page } = await asUser(ACCOUNTS.john);
  await page.goto("/dashboard/personal-log/dialysis-management");
  await expect(
    page.getByText(/manages your prescription and schedule/).first(),
  ).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByRole("tab", { name: /Home hemodialysis/ }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Edit Week" })).toBeDisabled();

  /* A stale screen that still thinks it may: the server refuses, and the
     refusal is shown (the UI never relies on hiding alone). */
  await page.route(
    /\/api\/v1\/patients\/[^/]+\/dialysis\/prescription$/,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      const res = await route.fetch();
      const body = await res.json();
      body.data.memberCanEdit = true;
      await route.fulfill({ response: res, json: body });
    },
  );
  const writes: number[] = [];
  page.on("response", (res) => {
    if (
      res.request().method() === "PATCH" &&
      /\/dialysis\/prescription$/.test(new URL(res.url()).pathname)
    )
      writes.push(res.status());
  });
  await page.reload();
  const home = page.getByRole("tab", { name: /Home hemodialysis/ });
  await expect(home).toBeEnabled({ timeout: 30_000 });
  await home.click();
  await expect(
    page.getByText(
      /Your dialysis center manages your prescription and schedule, so this was not changed/,
    ),
  ).toBeVisible({ timeout: 20_000 });
  expect(writes).toEqual([403]);
  await page.unroute(/\/api\/v1\/patients\/[^/]+\/dialysis\/prescription$/);
  const after = await (
    await johnApi.get(`/patients/${johnId}/dialysis/prescription`)
  ).json();
  expect(after.data.modality).toBe("IN_CENTER_HD");
});

test("isolation: Grace never sees John's dialysis data @phase7", async ({
  asUser,
  api,
}) => {
  const johnApi = await api(ACCOUNTS.john);
  const johnId = await johnApi.patientId();
  const note = `Synthetic John only ${Date.now().toString(36)}`;
  const made = await (
    await johnApi.post(`/patients/${johnId}/dialysis/treatments`, {
      treatmentDate: patientDay(-2),
      modality: "IN_CENTER_HD",
      status: "ATTENDED",
      startTime: "06:00",
      endTime: "10:00",
      notes: note,
    })
  ).json();
  try {
    const { page } = await asUser(ACCOUNTS.grace);
    const calls = recordApiCalls(page);
    for (const url of [
      "/dashboard/personal-log/dialysis-treatment",
      "/dashboard/personal-log/dialysis-management",
      `/dashboard/personal-log/dialysis-treatment/view?id=${made.data.id}`,
    ]) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(note)).toHaveCount(0);
    }
    expect(calls.some((c) => c.path.includes(johnId))).toBe(false);
    const direct = await page.evaluate(
      async ([apiURL, id, tx]) =>
        Promise.all(
          [
            "prescription",
            "schedule",
            "treatments",
            `treatments/${tx}`,
            "home-system",
            "access-photos",
            "provider-orders",
          ].map(
            async (p) =>
              (
                await fetch(`${apiURL}/patients/${id}/dialysis/${p}`, {
                  credentials: "include",
                })
              ).status,
          ),
        ),
      [env.apiURL, johnId, made.data.id] as const,
    );
    for (const status of direct) expect([403, 404]).toContain(status);
  } finally {
    await johnApi.delete(
      `/patients/${johnId}/dialysis/treatments/${made.data.id}`,
    );
  }
});

test("API failure on the dialysis log: error with retry, never empty; 403 is not shared @phase7", async ({
  asUser,
}) => {
  const { page } = await asUser(ACCOUNTS.grace);
  const tx = await failApi(
    page,
    /^\/patients\/[^/]+\/dialysis\/treatments$/,
    { kind: "status", status: 500 },
    "GET",
  );
  await page.goto("/dashboard/personal-log/dialysis-treatment");
  await expect(
    page.getByText("Your dialysis log could not be loaded").first(),
  ).toBeVisible({ timeout: 30_000 });
  expect(tx.hits()).toBeGreaterThan(0);
  tx.lift();
  await page
    .getByRole("button", { name: /try again/i })
    .first()
    .click();
  await expect(
    page.getByText("Your dialysis log could not be loaded"),
  ).toHaveCount(0, { timeout: 20_000 });

  await failApi(
    page,
    /^\/patients\/[^/]+\/dialysis\/prescription$/,
    { kind: "status", status: 403, code: "dialysis.dialysis_not_shared" },
    "GET",
  );
  await page.goto("/dashboard/personal-log/dialysis-management");
  await expect(
    page.getByText("This has not been shared with you").first(),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: /try again/i })).toHaveCount(0);
  /* No typical week stands in for a refused read. */
  await expect(page.getByText(/This is a typical week/)).toHaveCount(0);
});

test("retired dialysis stores are purged and never shown; home-HD vitals kept (D8) @phase7", async ({
  asUser,
}) => {
  const { page } = await asUser(ACCOUNTS.grace);
  await page.goto("/dashboard");
  const retired = [
    "nr:dialysis-modality",
    "nr:dialysis-schedule",
    "nr:dialysis-treatments",
    "nr:treatment-medications",
    "nr:dialysis-pd-exchanges",
    "nr:dialysis-home-system",
    "nr:dialysis-home-visits",
    "nr:dialysis-supplies",
    "nr:provider-orders",
    "nr:dialysis-access-photos",
    "nr:dialysis-urine-output",
  ];
  await page.evaluate((list) => {
    for (const key of list)
      localStorage.setItem(
        key,
        JSON.stringify([
          {
            id: "legacy-1",
            date: "2026-06-24",
            notes: "Legacy Dialysis Row",
            medication: "Legacy Dialysis Row",
            dataUrl: "data:image/jpeg;base64,/9j/4AAQ",
          },
        ]),
      );
    localStorage.setItem("nr:dialysis-treatment-vitals", "{}");
  }, retired);
  await page.reload();
  for (const url of [
    "/dashboard/personal-log/dialysis-treatment",
    "/dashboard/personal-log/dialysis-management",
  ]) {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Legacy Dialysis Row")).toHaveCount(0);
    expect(await page.locator('img[src^="data:"]').count()).toBe(0);
  }
  const left = await page.evaluate(
    (list) => list.filter((k) => localStorage.getItem(k) !== null),
    retired,
  );
  expect(left).toEqual([]);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("nr:dialysis-treatment-vitals"),
    ),
  ).toBe("{}");
});
