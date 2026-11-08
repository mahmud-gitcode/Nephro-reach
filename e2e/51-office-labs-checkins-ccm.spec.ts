/* Phase 9 (OFFICE lane B): office labs CSV import and chart, check-in
   notices, CCM worklist and activities, cross-office isolation, API failure,
   retired stores.
   - J9-1: staff uploads a synthetic CSV (matched, unknown MRN, future date)
     as TEXT in a JSON body, sees the server's row statuses, imports, and the
     chart shows the result; closing a staged batch cancels it on the server;
   - J9-2: a member's rough-day check-in sent to the clinic shows in the
     office's notices; opening it reads the check-in and marks it seen;
   - J9-3: CCM: 20 minutes logged -> Below Threshold, 10 more -> Ready for
     Review (the server's status);
   - J9-4: one account in two offices (Office Manager in Riverside Dialysis
     and Riverside Nephrology) only ever reads the office it is working in;
   - no access and API failure: a 403 is "not shared" (no retry, no empty
     list), a 500 is an error with Try again that recovers;
   - J9-5: legacy nr:clinic-ccm / nr:clinic-labs / nr:ccm-condition-library
     are purged and never shown.
   Synthetic data only: seed accounts, fresh *.example.test accounts and
   fresh synthetic roster patients. */
import { request, type Page } from "@playwright/test";
import { ApiClient, currentConsent, json } from "./fixtures/api";
import {
  ACCOUNTS,
  appOrigin,
  env,
  throwawayAccount,
  type Account,
} from "./fixtures/env";
import { extractOtp, mailMark, waitForMail } from "./fixtures/mail";
import { failApi, recordApiCalls } from "./fixtures/network";
import { loginViaUi } from "./fixtures/session";
import { expect, test } from "./fixtures/test";
import { pace } from "./fixtures/throttle";

test.setTimeout(240_000);

const PHASE_9 =
  /\/(ccm|lab-imports|check-in-notices|check-ins\/summary|er-visits\/summary)(\/|$)/;

const RETIRED = ["nr:clinic-ccm", "nr:clinic-labs", "nr:ccm-condition-library"];

/** A past day unique to this run (the chart window is the last year). */
function pastDay(): string {
  const back = 2 + (Math.floor(Date.now() / 60_000) % 300);
  return new Date(Date.now() - back * 86_400_000).toISOString().slice(0, 10);
}
const usDate = (day: string) =>
  `${day.slice(5, 7)}/${day.slice(8, 10)}/${day.slice(0, 4)}`;
const todayIso = () => new Date().toISOString().slice(0, 10);

async function noRetiredKeys(page: Page) {
  const keys = await page.evaluate(() => Object.keys(localStorage));
  for (const k of keys)
    for (const r of RETIRED) expect(k.endsWith(r.slice(3))).toBe(false);
}

/** Every /organizations/ call names `orgId` in its path; a header, when
 *  sent, names it too, and every Phase 9 call sends it. (The staff list
 *  used for follow-up assignees is FE-ORG's hook and sends no header.) */
function expectOnlyOffice(
  calls: ReturnType<typeof recordApiCalls>,
  orgId: string,
) {
  const org = calls.filter((c) => c.path.startsWith("/organizations/"));
  expect(org.length).toBeGreaterThan(0);
  for (const c of org) {
    expect(c.path.startsWith(`/organizations/${orgId}/`), c.path).toBe(true);
    const header = c.headers["x-organization-id"];
    if (header || PHASE_9.test(c.path)) expect(header, c.path).toBe(orgId);
  }
}

/** A new synthetic person on an office's roster, enrolled in its CCM. */
async function ccmPatient(client: ApiClient, orgId: string, tag: string) {
  const lastName = `Ccm${tag}${Date.now().toString(36)}`;
  const added = await json(
    await client.post(
      `/organizations/${orgId}/patients`,
      { firstName: "Pnine", lastName, dateOfBirth: "1950-03-04" },
      orgId,
    ),
    "roster patient",
  );
  const data = added.data as {
    patientId?: string;
    patient?: { id: string };
    id?: string;
  };
  const patientId = data.patientId ?? data.patient?.id ?? data.id;
  expect(patientId).toBeTruthy();
  const res = await client.post(
    `/organizations/${orgId}/ccm/enrollments`,
    {
      patientId,
      providerName: "P9 E2E Provider",
      careManagerName: "P9 E2E Care Manager",
      conditions: ["ckd-4", "htn"],
    },
    orgId,
  );
  expect(res.status(), "ccm enroll").toBe(201);
  return { patientId: patientId!, name: `Pnine ${lastName}` };
}

/* ------------------------------------------------------------- J9-1 */

test("J9-1 lab CSV: JSON body, server row statuses, import, chart @phase9", async ({
  asUser,
  api,
  storageClean,
}) => {
  const owner = await api(ACCOUNTS.clinic);
  const R = await owner.orgId("DIALYSIS_CENTER");
  const roster = (
    await json(
      await owner.get(`/organizations/${R}/patients?limit=50`, R),
      "roster",
    )
  ).data as Array<{ patientId: string; firstName: string; mrn: string | null }>;
  const john = roster.find((p) => p.firstName === "John")!;
  const day = pastDay();
  const unknownMrn = `9${Date.now().toString().slice(-6)}`;
  const csv = [
    "mrn,date,test,value,unit,reference",
    `${john.mrn},${day},Potassium,4.6,mmol/L,3.5-5.1`,
    `${unknownMrn},${day},Potassium,4.0,mmol/L,3.5-5.1`,
    `${john.mrn},2099-01-01,Potassium,4.1,mmol/L,3.5-5.1`,
  ].join("\n");

  const { page } = await asUser(ACCOUNTS.clinic);
  const calls = recordApiCalls(page);
  const bodies: unknown[] = [];
  page.on("request", (req) => {
    if (
      req.method() === "POST" &&
      /\/lab-imports$/.test(new URL(req.url()).pathname)
    )
      bodies.push(req.postDataJSON());
  });
  await page.goto("/dashboard/clinic/labs");
  await page
    .getByRole("button", { name: /Upload Labs \(CSV\)/ })
    .click({ timeout: 20_000 });
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel(/^Patient/)
    .selectOption({ label: "Several patients (the file has an MRN column)" });
  await dialog.locator('input[type="file"]').setInputFiles({
    name: "p9-e2e.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv, "utf8"),
  });
  await dialog.getByRole("button", { name: "Review file" }).click();
  await expect(dialog.getByText("Ready to import").first()).toBeVisible({
    timeout: 20_000,
  });
  await expect(dialog.getByText("No matching patient").first()).toBeVisible();
  await expect(dialog.getByText("Invalid").first()).toBeVisible();
  /* No manual re-match control: an unmatched row is read-only. */
  await expect(dialog.getByRole("button", { name: /match/i })).toHaveCount(0);
  expect(bodies).toHaveLength(1);
  expect(bodies[0]).toMatchObject({ fileName: "p9-e2e.csv", csv });
  expect(Object.keys(bodies[0] as object)).not.toContain("patientId");

  await dialog.getByRole("button", { name: "Import 1 result" }).click();
  await expect(
    page.getByText(/1 lab result added to patient charts/),
  ).toBeVisible({ timeout: 20_000 });
  await page
    .getByRole("combobox", { name: "Patient" })
    .selectOption(john.patientId);
  const row = page
    .getByRole("row")
    .filter({ hasText: usDate(day) })
    .filter({ hasText: "Potassium" });
  await expect(row.first()).toBeVisible({ timeout: 20_000 });
  await expect(row.first()).toContainText("4.6");
  expectOnlyOffice(calls, R);
  await noRetiredKeys(page);
  /* The CSV text is never kept in the browser. */
  await storageClean(page, { forbidStrings: [unknownMrn, "p9-e2e.csv"] });
});

test("J9-1 closing a staged batch cancels it on the server @phase9", async ({
  asUser,
}) => {
  const { page } = await asUser(ACCOUNTS.clinic);
  const calls = recordApiCalls(page);
  await page.goto("/dashboard/clinic/labs");
  await page
    .getByRole("button", { name: /Upload Labs \(CSV\)/ })
    .click({ timeout: 20_000 });
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel(/^Patient/)
    .selectOption({ label: "Several patients (the file has an MRN column)" });
  await dialog.locator('input[type="file"]').setInputFiles({
    name: "p9-cancel.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      `mrn,date,test,value\n8${Date.now().toString().slice(-6)},${pastDay()},Albumin,3.9`,
      "utf8",
    ),
  });
  await dialog.getByRole("button", { name: "Review file" }).click();
  await expect(dialog.getByText("No matching patient").first()).toBeVisible({
    timeout: 20_000,
  });
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect
    .poll(
      () =>
        calls.filter(
          (c) =>
            c.method === "POST" && /\/lab-imports\/[^/]+\/cancel$/.test(c.path),
        ).length,
    )
    .toBe(1);
  expect(calls.some((c) => /\/confirm$/.test(c.path))).toBe(false);
});

/* ------------------------------------------------------------- J9-2 */

test("J9-2 a rough-day check-in reaches the office; opening it marks it seen @phase9", async ({
  asUser,
  api,
}) => {
  const owner = await api(ACCOUNTS.clinic);
  const R = await owner.orgId("DIALYSIS_CENTER");
  const member = await api(ACCOUNTS.john);
  const JOHN = await member.patientId();
  /* A notice raised on a closed day waits for the next open day: open the
     office every day for this test, and put the setting back after. */
  const settings = (
    await json(await owner.get(`/organizations/${R}/settings`, R), "settings")
  ).data as { closedWeekdays: string[] };
  expect(
    (
      await owner.patch(
        `/organizations/${R}/settings`,
        { closedWeekdays: [] },
        R,
      )
    ).status(),
  ).toBe(200);
  let checkInId: string | null = null;
  try {
    const today = todayIso();
    const existing = (
      await json(
        await member.get(
          `/patients/${JOHN}/check-ins?from=${today}&to=${today}`,
        ),
        "today",
      )
    ).data as Array<{ id: string; checkInDate: string }>;
    for (const c of existing)
      if (c.checkInDate === today)
        await member.delete(`/patients/${JOHN}/check-ins/${c.id}`);
    const made = await member.post(`/patients/${JOHN}/check-ins`, {
      checkInDate: today,
      feeling: "rough",
      symptoms: [],
      notes: "P9 E2E synthetic rough day",
      bloodPressure: "151/96",
      notifyClinic: true,
    });
    expect(made.status(), "member check-in").toBe(201);
    checkInId = ((await made.json()).data as { id: string }).id;

    const { page } = await asUser(ACCOUNTS.clinic);
    const calls = recordApiCalls(page);
    await page.goto("/dashboard/clinic/checkins");
    const view = page
      .getByRole("button", { name: "View — John Taylor" })
      .first();
    await expect(view).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Rough day").first()).toBeVisible();
    await view.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("151/96")).toBeVisible({ timeout: 20_000 });
    await expect
      .poll(
        () =>
          calls.filter(
            (c) =>
              c.method === "POST" &&
              /\/check-in-notices\/[^/]+\/seen$/.test(c.path),
          ).length,
      )
      .toBe(1);
    const seen = (
      await json(
        await owner.get(
          `/organizations/${R}/check-in-notices?patientId=${JOHN}&seen=false`,
          R,
        ),
        "unseen",
      )
    ).data as unknown[];
    expect(seen).toHaveLength(0);
    expectOnlyOffice(calls, R);
  } finally {
    await owner.patch(
      `/organizations/${R}/settings`,
      { closedWeekdays: settings.closedWeekdays },
      R,
    );
    if (checkInId)
      await member.delete(`/patients/${JOHN}/check-ins/${checkInId}`);
  }
});

/* ------------------------------------------------------------- J9-3 */

async function logMinutes(page: Page, minutes: number) {
  await page.getByRole("button", { name: "Log Activity" }).click();
  const form = page.getByRole("region", { name: "Add CCM activity" });
  await form.getByLabel(/^Activity Type/).selectOption("Patient Communication");
  await form.getByLabel(/^Minutes/).fill(String(minutes));
  await form.getByRole("button", { name: "Save Activity" }).click();
  await expect(form).toHaveCount(0, { timeout: 20_000 });
}

test("J9-3 CCM: 20 minutes is Below Threshold, 30 is Ready for Review (server) @phase9", async ({
  asUser,
  api,
}) => {
  const owner = await api(ACCOUNTS.nephrology);
  const N = await owner.orgId("NEPHROLOGY_OFFICE");
  const patient = await ccmPatient(owner, N, "j93");

  const { page } = await asUser(ACCOUNTS.nephrology);
  const calls = recordApiCalls(page);
  await page.goto("/dashboard/nephrology");
  await page.getByLabel("Search patients").fill(patient.name.split(" ")[1]);
  await page
    .getByRole("button", { name: `Open ${patient.name}` })
    .click({ timeout: 20_000 });
  const sheet = page.getByRole("dialog");
  await logMinutes(page, 20);
  await expect(sheet.getByText("Below Threshold").first()).toBeVisible({
    timeout: 20_000,
  });
  await logMinutes(page, 10);
  await expect(sheet.getByText("Ready for Review").first()).toBeVisible({
    timeout: 20_000,
  });

  const posts = calls.filter(
    (c) =>
      c.method === "POST" &&
      c.path.endsWith(`/ccm/enrollments/${patient.patientId}/activities`),
  );
  expect(posts).toHaveLength(2);
  const server = (
    await json(
      await owner.get(
        `/organizations/${N}/ccm/enrollments/${patient.patientId}?month=${todayIso().slice(0, 7)}`,
        N,
      ),
      "enrollment",
    )
  ).data as { status: string; minutes: number };
  expect(server).toMatchObject({ status: "Ready for Review", minutes: 30 });
  expectOnlyOffice(calls, N);
  await noRetiredKeys(page);
});

/* ------------------------------------------------------------- J9-4 */

async function freshAccount(tag: string): Promise<Account> {
  const account = throwawayAccount(tag);
  const consent = await currentConsent();
  const since = mailMark();
  await pace("register");
  const ctx = await request.newContext();
  try {
    const res = await ctx.post(`${env.apiURL}/auth/register`, {
      headers: { "X-Auth-Transport": "bearer", Origin: appOrigin },
      data: { ...account, consent },
    });
    const body = await json(res, `register ${tag}`);
    const access = (body.tokens as { access: { token: string } }).access.token;
    const mail = await waitForMail(account.email, { since });
    const v = await ctx.post(`${env.apiURL}/auth/email/verify/confirm`, {
      headers: { Authorization: `Bearer ${access}`, Origin: appOrigin },
      data: { code: extractOtp(mail) },
    });
    expect(v.ok(), `verify ${tag}: ${v.status()}`).toBeTruthy();
  } finally {
    await ctx.dispose();
  }
  return account;
}

async function acceptAllStaff(account: Account) {
  for (;;) {
    const client = await ApiClient.login(account);
    try {
      const list = (await json(await client.get("/me/invitations"), "mine"))
        .data as Array<{ id: string; kind: string; status: string }>;
      const next = list.find(
        (i) => i.kind === "STAFF" && i.status === "PENDING",
      );
      if (!next) return;
      const res = await client.post(`/me/invitations/${next.id}/accept`);
      expect(res.ok(), `accept: ${res.status()}`).toBeTruthy();
    } finally {
      await client.dispose();
    }
  }
}

test("J9-4 one account in two offices reads only the office it works in @phase9 @needs-mail", async ({
  page,
  api,
  storageClean,
}) => {
  const clinic = await api(ACCOUNTS.clinic);
  const neph = await api(ACCOUNTS.nephrology);
  const R = await clinic.orgId("DIALYSIS_CENTER");
  const N = await neph.orgId("NEPHROLOGY_OFFICE");
  /* A patient only Riverside Dialysis has in its CCM, and one only the
     nephrology office has. */
  const rOnly = await ccmPatient(clinic, R, "ronly");
  const nOnly = await ccmPatient(neph, N, "nonly");

  const person = await freshAccount("p9-two-offices");
  for (const [client, org] of [
    [clinic, R],
    [neph, N],
  ] as const)
    expect(
      (
        await client.post(
          `/organizations/${org}/invitations`,
          { email: person.email, role: "Office Manager" },
          org,
        )
      ).status(),
    ).toBe(201);
  await acceptAllStaff(person);

  const calls = recordApiCalls(page);
  await loginViaUi(page, person);
  await expect(page).toHaveURL(/\/select-portal/, { timeout: 20_000 });
  await page
    .getByRole("button", { name: "Open: Riverside Nephrology Associates" })
    .click();
  await expect(page).not.toHaveURL(/\/select-portal/, { timeout: 20_000 });
  await page.goto("/dashboard/nephrology");
  await page.getByLabel("Search patients").fill("Pnine");
  await expect(
    page.getByRole("button", { name: `Open ${nOnly.name}` }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(rOnly.name)).toHaveCount(0);
  const inN = calls.length;
  expectOnlyOffice(calls.slice(0, inN), N);

  /* The browser forging another office's header (one it is not a member
     of) is refused by the server. */
  const access = await api(ACCOUNTS.access);
  const M = await access.orgId("ACCESS_CENTER");
  const forged = await page.evaluate(
    async ({ api, M }) =>
      (
        await fetch(`${api}/organizations/${M}/ccm/inbox`, {
          credentials: "include",
          headers: { "X-Organization-Id": M },
        })
      ).status,
    { api: env.apiURL, M },
  );
  expect(forged).toBe(403);

  /* Switch to Riverside Dialysis: its labs, never the nephrology office's. */
  const switchAt = calls.length;
  await page.getByRole("link", { name: "Switch portal" }).click();
  await expect(page).toHaveURL(/\/select-portal/);
  await page
    .getByRole("button", { name: "Open: Riverside Dialysis Center" })
    .click();
  await expect(page).not.toHaveURL(/\/select-portal/, { timeout: 20_000 });
  /* /dashboard/clinic/* is shared by both office kinds, so a full reload
     would ask which portal again (D5): move inside the app instead. */
  await page
    .getByRole("complementary")
    .getByRole("link", { name: "Labs" })
    .click({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/dashboard\/clinic\/labs/);
  await expect(page.getByRole("heading", { name: "Lab Results" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText(nOnly.name)).toHaveCount(0);
  /* The test's own forged request to M is left out; the app made the rest. */
  const after = calls
    .slice(switchAt)
    .filter(
      (c) =>
        c.path.startsWith("/organizations/") &&
        c.path !== `/organizations/${M}/ccm/inbox`,
    );
  expect(after.length).toBeGreaterThan(0);
  for (const c of after) {
    expect(c.path.startsWith(`/organizations/${R}/`), c.path).toBe(true);
    const header = c.headers["x-organization-id"];
    if (header || PHASE_9.test(c.path)) expect(header, c.path).toBe(R);
  }
  await noRetiredKeys(page);
  await storageClean(page, { forbidStrings: [person.password] });
});

/* -------------------------------------------- no access, API failure */

test("a 403 is the not-shared state, never an empty CCM or labs list @phase9", async ({
  asUser,
}) => {
  const { page } = await asUser(ACCOUNTS.nephrology);
  const f = await failApi(
    page,
    /^\/organizations\/[^/]+\/ccm\/enrollments$/,
    {
      kind: "status",
      status: 403,
      code: "access.permission_denied",
    },
    "GET",
  );
  await page.goto("/dashboard/nephrology");
  await expect(
    page.getByText("This has not been shared with you").first(),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("No patients match these filters.")).toHaveCount(
    0,
  );
  expect(f.hits()).toBeGreaterThan(0);

  const clinic = await asUser(ACCOUNTS.clinic);
  await failApi(
    clinic.page,
    /^\/patients\/[^/]+\/labs$/,
    {
      kind: "status",
      status: 403,
      code: "access.patient_access_denied",
    },
    "GET",
  );
  await clinic.page.goto("/dashboard/clinic/labs");
  await expect(
    clinic.page.getByText("This has not been shared with you").first(),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    clinic.page.getByText("No lab results on this chart in the last year."),
  ).toHaveCount(0);
  await expect(
    clinic.page.getByRole("button", { name: /try again/i }),
  ).toHaveCount(0);
});

test("API failure: worklist and notices 500 show an error with Try again, then recover @phase9", async ({
  asUser,
}) => {
  const { page } = await asUser(ACCOUNTS.nephrology);
  const f = await failApi(
    page,
    /^\/organizations\/[^/]+\/ccm\/enrollments$/,
    { kind: "status", status: 500 },
    "GET",
  );
  await page.goto("/dashboard/nephrology");
  await expect(page.getByText("The worklist could not be loaded")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("No patients match these filters.")).toHaveCount(
    0,
  );
  f.lift();
  await page
    .getByRole("button", { name: /try again/i })
    .first()
    .click();
  await expect(page.getByText("The worklist could not be loaded")).toHaveCount(
    0,
    { timeout: 20_000 },
  );

  const clinic = await asUser(ACCOUNTS.clinic);
  const g = await failApi(
    clinic.page,
    /^\/organizations\/[^/]+\/check-in-notices$/,
    { kind: "status", status: 500 },
    "GET",
  );
  await clinic.page.goto("/dashboard/clinic/checkins");
  await expect(
    clinic.page.getByText("Check-in notices could not be loaded").first(),
  ).toBeVisible({ timeout: 20_000 });
  g.lift();
  await clinic.page
    .getByRole("button", { name: /try again/i })
    .first()
    .click();
  await expect(
    clinic.page.getByText("Check-in notices could not be loaded"),
  ).toHaveCount(0, { timeout: 20_000 });
});

/* ------------------------------------------------------------- J9-5 */

test("J9-5 legacy CCM, labs and condition stores are purged and never shown @phase9", async ({
  asUser,
}) => {
  const { page } = await asUser(ACCOUNTS.nephrology);
  await page.addInitScript(() => {
    if (sessionStorage.getItem("p9-seeded")) return;
    sessionStorage.setItem("p9-seeded", "1");
    localStorage.setItem(
      "nr:clinic-ccm",
      JSON.stringify({
        version: 6,
        state: {
          inbox: [
            {
              id: "legacy",
              mrn: "999999",
              kind: "Lab alert",
              text: "Legacy alert P9-LEGACY-999",
              resolved: false,
            },
          ],
        },
      }),
    );
    localStorage.setItem(
      "nr:clinic-labs",
      JSON.stringify({
        version: 2,
        state: { results: [{ mrn: "999999", test: "P9-LEGACY-LAB" }] },
      }),
    );
    localStorage.setItem(
      "nr:ccm-condition-library",
      JSON.stringify({ custom: [{ label: "P9-LEGACY-CONDITION" }] }),
    );
    localStorage.setItem("nr:storage-version", "1");
  });
  await page.goto("/dashboard/nephrology");
  await expect(page.getByRole("tab", { name: /Patient Worklist/ })).toBeVisible(
    { timeout: 20_000 },
  );
  await page.getByRole("tab", { name: /CCM Inbox/ }).click();
  await expect(page.getByText(/P9-LEGACY/)).toHaveCount(0);
  await noRetiredKeys(page);
  for (const k of RETIRED)
    expect(
      await page.evaluate((key) => localStorage.getItem(key), k),
    ).toBeNull();
  expect(
    Number(
      await page.evaluate(() => localStorage.getItem("nr:storage-version")),
    ),
  ).toBeGreaterThanOrEqual(10);
});
