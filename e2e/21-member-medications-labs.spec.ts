/* Phase 6: member medications and labs on the API (MEMBER lane).
   - owner path: John adds a medication with a reminder in the UI, a second
     reminder time is set, he marks the 08:00 dose Taken, and after a reload
     it is still Taken (on the server) and the tracker shows the server's
     adherence; he enters two lab draws on different days and both are
     points on the trend; a result his clinic entered is read-only;
   - isolation: Grace never sees John's medications or labs, and her browser
     session cannot read them through the API;
   - API failure: error state with "Try again" (never an empty list), then
     recovery; a 403 shows "not shared" with no retry;
   - retired prototype stores are purged and never shown.
   Synthetic data only; everything created is removed again. */
import type { Page } from "@playwright/test";
import { ACCOUNTS, env } from "./fixtures/env";
import { failApi, recordApiCalls } from "./fixtures/network";
import { expect, test } from "./fixtures/test";

const tag = () => Date.now().toString(36);

/* The patient's own calendar day (the API's "today"). */
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

async function addMedicationInUi(page: Page, name: string) {
  await page.goto("/dashboard/personal-log/medications/add");
  await page.getByLabel(/Medication Name/).fill(name);
  await page.getByLabel("Dose/Strength").fill("800 mg");
  await page.getByLabel("Route").selectOption("PO");
  await page.getByLabel("Frequency").selectOption("With meals");
  await page.getByRole("button", { name: "Add Medication" }).click();
  await page.waitForURL(/\/dashboard\/personal-log\/medications$/, {
    timeout: 20_000,
  });
}

test("owner path: medication, reminders, a dose, and the server's adherence @phase6", async ({
  asUser,
  api,
}) => {
  const { page } = await asUser(ACCOUNTS.john);
  const johnApi = await api(ACCOUNTS.john);
  const johnId = await johnApi.patientId();
  const calls = recordApiCalls(page);
  const name = `Synthetic Med ${tag()}`;
  let medId: string | undefined;

  try {
    await addMedicationInUi(page, name);
    const list = await (
      await johnApi.get(`/patients/${johnId}/medications?limit=150`)
    ).json();
    medId = list.data.find((m: { name: string }) => m.name === name)?.id;
    expect(medId, "the medication is on the server").toBeTruthy();

    /* The reminder made with it is keyed by the medication id, HH:mm. */
    const reminders = await (
      await johnApi.get(
        `/patients/${johnId}/reminders?kind=MEDICATION&medicationId=${medId}`,
      )
    ).json();
    expect(reminders.data).toHaveLength(1);
    expect(reminders.data[0].times).toEqual(["08:00"]);
    /* A second time of day (20:00), as the reminder dialog would send. */
    await johnApi.patch(
      `/patients/${johnId}/reminders/${reminders.data[0].id}`,
      {
        times: ["08:00", "20:00"],
      },
    );

    await page.reload();
    const status08 = page
      .getByLabel(`Status for ${name} at 08:00 AM`)
      .filter({ visible: true });
    await expect(status08).toBeVisible({ timeout: 20_000 });
    await expect(
      page
        .getByLabel(`Status for ${name} at 08:00 PM`)
        .filter({ visible: true }),
    ).toBeVisible();
    await status08.selectOption("taken");
    await expect
      .poll(
        async () =>
          (
            await (
              await johnApi.get(
                `/patients/${johnId}/medications/doses?from=${patientDay()}&to=${patientDay()}&medicationId=${medId}`,
              )
            ).json()
          ).data.length,
      )
      .toBe(1);

    await page.reload();
    await expect(
      page
        .getByLabel(`Status for ${name} at 08:00 AM`)
        .filter({ visible: true }),
    ).toHaveValue("taken", { timeout: 20_000 });

    const adherence = await (
      await johnApi.get(`/patients/${johnId}/medications/adherence?days=7`)
    ).json();
    const percent = adherence.data.overall.percent;
    expect(percent).not.toBeNull();
    await expect(page.getByText(`${percent}%`).first()).toBeVisible();

    const dosePut = calls.find(
      (c) =>
        c.method === "PUT" && c.path.endsWith(`/medications/${medId}/doses`),
    );
    expect(dosePut, "the dose went to the API by medication id").toBeTruthy();
    const patientCalls = calls.filter((c) => c.path.startsWith("/patients/"));
    for (const call of patientCalls) {
      expect(call.path.startsWith(`/patients/${johnId}/`)).toBe(true);
      expect(call.headers["x-organization-id"]).toBeUndefined();
    }
  } finally {
    if (medId) await johnApi.delete(`/patients/${johnId}/medications/${medId}`);
  }
});

test("labs: two draws are two points; a clinic result is read-only @phase6", async ({
  asUser,
  api,
}) => {
  const { page } = await asUser(ACCOUNTS.john);
  const johnApi = await api(ACCOUNTS.john);
  const clinicApi = await api(ACCOUNTS.clinic);
  const johnId = await johnApi.patientId();
  const clinicOrg = (await clinicApi.context()).memberships[0].organizationId;
  const days = [patientDay(-9), patientDay(-2)];
  const values = ["4.1", "4.7"];
  const created: string[] = [];
  let clinicRow: string | undefined;

  try {
    for (const [i, day] of days.entries()) {
      await page.goto("/dashboard/personal-log/lab-tracking/add");
      await page.getByLabel("Lab Draw Date").fill(day);
      await page.getByRole("button", { name: "Electrolytes" }).click();
      await page.getByLabel("Potassium result").fill(values[i]);
      await page.getByRole("button", { name: "Save Entry" }).click();
      await page.waitForURL(/\/lab-tracking$/, { timeout: 20_000 });
    }
    const rows = (
      await (
        await johnApi.get(
          `/patients/${johnId}/labs?testCode=potassium&source=PATIENT_ENTERED&from=${days[0]}&to=${days[1]}&limit=150`,
        )
      ).json()
    ).data as { id: string; collectedOn: string; value: string }[];
    for (const r of rows) created.push(r.id);
    expect(rows.map((r) => r.collectedOn).sort()).toEqual(days);

    const trends = (
      await (
        await johnApi.get(
          `/patients/${johnId}/labs/trends?testCode=potassium&from=${days[0]}&to=${days[1]}`,
        )
      ).json()
    ).data;
    expect(trends[0].points.map((p: { value: number }) => p.value)).toEqual([
      4.1, 4.7,
    ]);

    /* A result the clinic entered: shown, but with no edit or delete. */
    const prov = await (
      await clinicApi.post(
        `/patients/${johnId}/labs/provider-results`,
        {
          collectedOn: days[1],
          results: [{ testCode: "phosphorus", value: "5.9", unit: "mg/dL" }],
        },
        clinicOrg,
      )
    ).json();
    clinicRow = prov.data[0].id;

    await page.goto("/dashboard/personal-log/lab-tracking");
    await page.getByRole("tab", { name: "History" }).click();
    const draw = page.locator("button[aria-expanded]").first();
    await expect(draw).toBeVisible({ timeout: 20_000 });
    if ((await draw.getAttribute("aria-expanded")) !== "true")
      await draw.click();
    await expect(page.getByText("From your clinic").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Edit Potassium" }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "Edit Phosphorus" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Delete Phosphorus" }),
    ).toHaveCount(0);

    await page.getByRole("tab", { name: "Trends" }).click();
    await expect(page.getByText("Potassium").first()).toBeVisible();
  } finally {
    if (clinicRow)
      await clinicApi.ctx.delete(
        `${env.apiURL}/patients/${johnId}/labs/provider-results/${clinicRow}`,
        {
          headers: clinicApi.headers(clinicOrg),
          data: { reason: "Synthetic E2E result removed" },
        },
      );
    for (const id of created)
      await johnApi.delete(`/patients/${johnId}/labs/${id}`);
  }
});

test("isolation: Grace never sees John's medications or labs @phase6", async ({
  asUser,
  api,
}) => {
  const johnApi = await api(ACCOUNTS.john);
  const johnId = await johnApi.patientId();
  const name = `Synthetic John Only ${tag()}`;
  const made = await (
    await johnApi.post(`/patients/${johnId}/medications`, {
      name,
      dose: "1 mg",
      route: "PO",
      frequency: "Once daily",
      startDate: patientDay(-3),
    })
  ).json();
  const lab = await (
    await johnApi.post(`/patients/${johnId}/labs`, {
      collectedOn: patientDay(-1),
      notes: name,
      results: [{ testCode: "bun", value: "47" }],
    })
  ).json();

  try {
    const { page } = await asUser(ACCOUNTS.grace);
    const calls = recordApiCalls(page);
    for (const url of [
      "/dashboard/personal-log/medications",
      "/dashboard/personal-log/lab-tracking",
    ]) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(name)).toHaveCount(0);
    }
    expect(calls.some((c) => c.path.includes(johnId))).toBe(false);

    const direct = await page.evaluate(
      async ([apiURL, id]) =>
        Promise.all(
          ["medications", "labs", "medications/adherence", "labs/trends"].map(
            async (p) =>
              (
                await fetch(`${apiURL}/patients/${id}/${p}`, {
                  credentials: "include",
                })
              ).status,
          ),
        ),
      [env.apiURL, johnId] as const,
    );
    for (const status of direct) expect([403, 404]).toContain(status);
  } finally {
    await johnApi.delete(`/patients/${johnId}/medications/${made.data.id}`);
    for (const row of lab.data ?? [])
      await johnApi.delete(`/patients/${johnId}/labs/${row.id}`);
  }
});

test("API failure on medications and labs: error with retry, never empty @phase6", async ({
  asUser,
}) => {
  const { page } = await asUser(ACCOUNTS.john);
  const meds = await failApi(
    page,
    /^\/patients\/[^/]+\/medications$/,
    { kind: "status", status: 500 },
    "GET",
  );
  await page.goto("/dashboard/personal-log/medications");
  await expect(
    page.getByText("Your medications could not be loaded").first(),
  ).toBeVisible({ timeout: 20_000 });
  expect(meds.hits()).toBeGreaterThan(0);
  meds.lift();
  await page
    .getByRole("button", { name: /try again/i })
    .first()
    .click();
  await expect(
    page.getByText("Your medications could not be loaded"),
  ).toHaveCount(0);

  const labs = await failApi(
    page,
    /^\/patients\/[^/]+\/labs$/,
    { kind: "status", status: 500 },
    "GET",
  );
  await page.goto("/dashboard/personal-log/lab-tracking");
  await expect(
    page.getByText("Your lab results could not be loaded").first(),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("No lab results yet.")).toHaveCount(0);
  labs.lift();
  await page
    .getByRole("button", { name: /try again/i })
    .first()
    .click();
  await expect(
    page.getByText("Your lab results could not be loaded"),
  ).toHaveCount(0);
});

test("a 403 on medications or labs shows not shared, with no retry @phase6", async ({
  asUser,
}) => {
  const { page } = await asUser(ACCOUNTS.john);
  await failApi(
    page,
    /^\/patients\/[^/]+\/(medications|labs)(\/.*)?$/,
    {
      kind: "status",
      status: 403,
      code: "access.patient_access_denied",
    },
    "GET",
  );
  for (const url of [
    "/dashboard/personal-log/medications",
    "/dashboard/personal-log/lab-tracking",
  ]) {
    await page.goto(url);
    await expect(
      page.getByText("This has not been shared with you").first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: /try again/i })).toHaveCount(
      0,
    );
  }
});

test("retired medication and lab stores are purged and never shown @phase6", async ({
  asUser,
}) => {
  const { page } = await asUser(ACCOUNTS.grace);
  await page.goto("/dashboard");
  const keys = [
    "nr:member-medications",
    "nr:medication-doses",
    "nr:medication-refills",
    "nr:medication-side-effects",
    "nr:medication-reminders",
    "nr:custom-lab-results",
    "nr:clinic-labs-seen",
  ];
  await page.evaluate((list) => {
    localStorage.setItem(
      list[0],
      JSON.stringify([{ id: "seed-med-0", name: "Legacy Norvasc Row" }]),
    );
    localStorage.setItem(
      list[1],
      JSON.stringify([
        {
          date: "2026-10-01",
          time: "08:00 AM",
          medication: "Legacy Norvasc Row",
          status: "taken",
        },
      ]),
    );
    localStorage.setItem(
      list[2],
      JSON.stringify({ "Legacy Norvasc Row": true }),
    );
    localStorage.setItem(list[3], "[]");
    localStorage.setItem(list[4], "[]");
    localStorage.setItem(
      list[5],
      JSON.stringify({ date: "2026-10-01", values: { BUN: "999" } }),
    );
    localStorage.setItem(list[6], "2026-10-01T00:00:00.000Z");
  }, keys);
  await page.reload();
  await page.goto("/dashboard/personal-log/medications");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Legacy Norvasc Row")).toHaveCount(0);
  await page.goto("/dashboard/personal-log/lab-tracking");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("999")).toHaveCount(0);
  const left = await page.evaluate(
    (list) => list.filter((k) => localStorage.getItem(k) !== null),
    keys,
  );
  expect(left).toEqual([]);
});
