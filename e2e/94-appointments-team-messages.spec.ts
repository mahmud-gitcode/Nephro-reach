/* P15c (INT-P15-1, D73 option (a)): member appointments and office team
   messages are on the API; nothing of either is kept in the browser.
   - John adds an appointment in the UI; it is on the server after a
     reload, every call names his patient id with no office header, and no
     appointments key is written; Grace never sees it; Sarah (caregiver,
     grant on John) reads it through her grant; Grace's session cannot.
   - The Riverside owner messages a colleague in the UI; it is on the
     server after a reload, every call names the office in the path and in
     X-Organization-Id, and no team-messages key is written; another office
     never sees it and is refused on Riverside's route.
   Synthetic data only; what is created is removed again (appointments) or
   is a synthetic staff note in the lane DB (team messages have no delete
   route). */
import { ACCOUNTS } from "./fixtures/env";
import { recordApiCalls } from "./fixtures/network";
import { expect, test } from "./fixtures/test";

const unique = (tag: string) =>
  `Synthetic E2E ${tag} ${Date.now().toString(36)}`;

function inDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function localKeys(page: import("@playwright/test").Page) {
  return page.evaluate(() => Object.keys(window.localStorage));
}

/* Several portals compile on first visit under next dev. */
test.slow();

test.beforeEach(async ({ api }) => {
  for (const account of [ACCOUNTS.john, ACCOUNTS.grace]) {
    const client = await api(account);
    await client.post("/me/preferences/tour-completed");
  }
});

test("appointments: John adds one in the UI, it is on the server, nothing is stored locally @phase15", async ({
  asUser,
  api,
}) => {
  const johnApi = await api(ACCOUNTS.john);
  const johnId = await johnApi.patientId();
  const title = unique("visit");
  const { page } = await asUser(ACCOUNTS.john);
  const calls = recordApiCalls(page);

  await page.goto("/dashboard/personal-log/appointments");
  await page.getByRole("button", { name: "Add Appointment" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Specialty \/ Title/).fill(title);
  await dialog.getByLabel(/Doctor \/ Provider Name/).fill("Dr. Synthetic");
  await dialog.getByLabel(/^Date/).fill(inDays(2));
  await dialog.getByLabel(/^Starts/).fill("10:30");
  await dialog.getByRole("button", { name: "Save Appointment" }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByText(title).filter({ visible: true }).first(),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByText(title).filter({ visible: true }).first(),
  ).toBeVisible();

  const apptCalls = calls.filter((c) => c.path.includes("/appointments"));
  const post = apptCalls.find(
    (c) => c.method === "POST" && c.path === `/patients/${johnId}/appointments`,
  );
  expect(post, "the add went to the API").toBeTruthy();
  for (const c of apptCalls.filter((c) => c.path.startsWith("/patients/"))) {
    if (c.path.includes("/access-profiles/")) continue;
    expect(c.path.startsWith(`/patients/${johnId}/`)).toBe(true);
    expect(c.headers["x-organization-id"]).toBeUndefined();
  }
  expect(
    (await localKeys(page)).filter((k) => k.includes("appointments")),
  ).toEqual([]);

  /* Grace's own page never shows it, and her session cannot read John's. */
  const grace = await asUser(ACCOUNTS.grace);
  await grace.page.goto("/dashboard/personal-log/appointments");
  await expect(
    grace.page.getByRole("heading", { name: "Upcoming Appointments" }),
  ).toBeVisible();
  await expect(grace.page.getByText(title)).toHaveCount(0);
  const graceApi = await api(ACCOUNTS.grace);
  expect(
    (await graceApi.get(`/patients/${johnId}/appointments`)).status(),
  ).toBe(403);

  /* Sarah reads it through her grant on John (the server checks it). */
  const sarahApi = await api(ACCOUNTS.caregiver);
  const sarahRead = await sarahApi.get(
    `/patients/${johnId}/appointments?from=${inDays(0)}&order=asc&limit=150`,
  );
  expect(sarahRead.status()).toBe(200);
  const sarahRows = (await sarahRead.json()).data as { title: string }[];
  expect(sarahRows.some((r) => r.title === title)).toBe(true);

  /* Clean up through the API. */
  const list = await (
    await johnApi.get(
      `/patients/${johnId}/appointments?from=${inDays(0)}&order=asc&limit=150`,
    )
  ).json();
  for (const row of list.data ?? [])
    if (row.title === title)
      await johnApi.delete(`/patients/${johnId}/appointments/${row.id}`);
});

test("team messages: the Riverside owner messages a colleague, it stays in that office, nothing is stored locally @phase15", async ({
  asUser,
  api,
}) => {
  const clinicApi = await api(ACCOUNTS.clinic);
  const riverside = await clinicApi.orgId("DIALYSIS_CENTER");
  const text = unique("team note");
  const { page } = await asUser(ACCOUNTS.clinic);
  const calls = recordApiCalls(page);

  await page.goto("/dashboard/clinic/messages");
  const start = page.getByRole("button", { name: "Message a Physician" });
  await expect(start).toBeEnabled();
  await start.click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox").fill(text);
  await dialog.getByRole("button", { name: "Send" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(text)).toBeVisible();

  await page.reload();
  await expect(page.getByText(text)).toBeVisible();

  const teamCalls = calls.filter((c) => c.path.includes("/team-messages"));
  expect(
    teamCalls.some(
      (c) =>
        c.method === "POST" &&
        c.path === `/organizations/${riverside}/team-messages`,
    ),
  ).toBe(true);
  for (const c of teamCalls) {
    expect(c.path.startsWith(`/organizations/${riverside}/`)).toBe(true);
    expect(c.headers["x-organization-id"]).toBe(riverside);
  }
  expect(
    (await localKeys(page)).filter((k) => k.includes("team-messages")),
  ).toEqual([]);

  /* Another office never sees it and is refused on Riverside's route. */
  const nephrology = await asUser(ACCOUNTS.nephrology);
  await nephrology.page.goto("/dashboard/nephrology/messages");
  await expect(
    nephrology.page.getByRole("heading", { name: "Team Messages" }),
  ).toBeVisible();
  await expect(nephrology.page.getByText(text)).toHaveCount(0);
  const accessApi = await api(ACCOUNTS.access);
  const accessOrg = await accessApi.orgId("ACCESS_CENTER");
  expect(
    (
      await accessApi.get(
        `/organizations/${riverside}/team-messages`,
        accessOrg,
      )
    ).status(),
  ).toBe(403);
  expect(
    (
      await accessApi.get(
        `/organizations/${riverside}/team-messages`,
        riverside,
      )
    ).status(),
  ).toBe(403);
});
