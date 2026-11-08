/* Phase 14a (EDU-BIZ): hospital portal, office settings, billing and
   reports on the API.
   - J14-1 hospital enrollment: the hospital enrolls a synthetic patient in
     the UI (roster then enrollment, no email sent, D11), the patient is
     listed, a discharge today shows the server's accessUntil (course days
     later), the education report counts the enrollment, no MRN in a URL;
   - J14-2 another hospital (needs E2E_HOSPITAL2, the fixture made by
     integration-evidence/phase-14a/make-hospital2.mjs): its staff never see
     the first hospital's patient, and a forged call is refused;
   - J14-3 clinic settings: hours and on-call phone saved per section and
     persisted after reload; a role without settings gets the no-access page;
   - J14-4 clinic billing: the contract from the API, no pay or renewal
     controls, a change request is sent and listed as yours;
   - J14-5 reports: the export downloads the server's CSV of counts, and the
     download appears in the office activity log;
   - J14-6 office staff cannot reach /platform/* (API 403 from the browser);
   - J14-7 API failure and 403 states; retired keys purged.
   Synthetic data only: seed accounts, fresh synthetic roster patients. */
import fs from "node:fs";
import type { Page } from "@playwright/test";
import { json } from "./fixtures/api";
import { ACCOUNTS, appOrigin, env, type Account } from "./fixtures/env";
import { failApi, recordApiCalls } from "./fixtures/network";
import { expect, test } from "./fixtures/test";

test.setTimeout(240_000);

const RETIRED = [
  "nr:hospital-enrollments",
  "nr:clinic-billing-actions",
  "nr:clinic-settings",
  "nr:clinic-settings-actions",
  "nr:org-settings-org-nephrology",
];

const NURSE: Account = {
  email: "nurse@nephroreach.com",
  password: "staff123",
  name: "Nurse (seed)",
};

const tag = () => Date.now().toString(36).slice(-5);

function hospital2(): Account | null {
  const file = process.env.E2E_HOSPITAL2;
  if (!file || !fs.existsSync(file)) return null;
  const o = JSON.parse(fs.readFileSync(file, "utf8")) as Account;
  return { email: o.email, password: o.password, name: "Second hospital" };
}

async function browserFetch(page: Page, path: string, org?: string) {
  return page.evaluate(
    async ({ url, org }) => {
      const r = await fetch(url, {
        credentials: "include",
        headers: org ? { "X-Organization-Id": org } : {},
      });
      return r.status;
    },
    { url: `${env.apiURL}${path}`, org },
  );
}

/* ------------------------------------------------------------- J14-1/2 */

test("J14-1 hospital enrolls, discharges today; accessUntil and the report come from the server @phase14", async ({
  asUser,
  api,
  storageClean,
}) => {
  const owner = await api(ACCOUNTS.hospital);
  const H1 = await owner.orgId("HOSPITAL");
  const before = (
    await json(
      await owner.get(`/organizations/${H1}/reports/education`, H1),
      "report",
    )
  ).data as { enrolled: number };
  const courses = (await json(await owner.get("/courses?limit=150"), "courses"))
    .data as Array<{
    id: string;
    titleEn: string;
    accessDaysAfterDischarge: number | null;
  }>;
  const course = courses.find((c) => c.accessDaysAfterDischarge !== null)!;
  expect(course, "a published hospital course").toBeTruthy();

  const { page } = await asUser(ACCOUNTS.hospital);
  await page.addInitScript(
    (keys) => {
      for (const k of keys)
        localStorage.setItem(
          k,
          JSON.stringify({
            version: 1,
            state: {
              enrollments: [{ patientName: "Legacy Sample", mrn: "000111" }],
            },
          }),
        );
    },
    RETIRED.slice(0, 1),
  );
  const calls = recordApiCalls(page);
  const bodies: Array<{ path: string; body: unknown }> = [];
  page.on("request", (req) => {
    if (req.method() === "POST" || req.method() === "PATCH")
      bodies.push({
        path: new URL(req.url()).pathname,
        body: req.postDataJSON(),
      });
  });

  await page.goto("/dashboard/hospital/patients");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Legacy Sample")).toHaveCount(0);

  const last = `Hosp${tag()}`;
  const mrn = `P14A${tag()}`;
  await page.getByRole("button", { name: "Enroll patient" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("First name").fill("Synth");
  await dialog.getByLabel("Last name").fill(last);
  await dialog.getByLabel("MRN").fill(mrn);
  await dialog
    .getByRole("radio", { name: /Already receiving dialysis/ })
    .click();
  await dialog.getByLabel("Education program").selectOption(course.id);
  await dialog.getByRole("button", { name: "Enroll patient" }).click();
  await expect(dialog).toHaveCount(0);

  const row = page.getByRole("row", { name: new RegExp(last) });
  await expect(row).toBeVisible();
  await expect(row.getByText("Admitted", { exact: true })).toBeVisible();
  await expect(row.getByText("While admitted")).toBeVisible();

  const posts = bodies.filter((b) => b.path.includes(`/organizations/${H1}/`));
  expect(posts.map((p) => p.path.replace(/^\/api\/v1/, ""))).toEqual([
    `/organizations/${H1}/patients`,
    `/organizations/${H1}/program-enrollments`,
  ]);
  expect(JSON.stringify(posts[0].body)).not.toMatch(/@/);
  expect(posts[1].body).toMatchObject({
    courseId: course.id,
    diagnosis: "on-dialysis",
  });

  /* Discharge today: the server sets accessUntil = today + course days. */
  await row.getByRole("button", { name: `Update Synth ${last}` }).click();
  await page
    .getByRole("dialog")
    .getByRole("radio", { name: "Discharged" })
    .click();
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const enrolled = (
    await json(
      await owner.get(`/organizations/${H1}/program-enrollments?limit=150`, H1),
      "list",
    )
  ).data as Array<{
    lastName: string;
    accessUntil: string | null;
    status: string;
  }>;
  const mine = enrolled.find((e) => e.lastName === last)!;
  expect(mine.status).toBe("discharged");
  expect(mine.accessUntil).toBeTruthy();
  const [y, m, d] = mine.accessUntil!.split("-").map(Number);
  const shown = new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  await expect(
    page.getByRole("row", { name: new RegExp(last) }).getByText(shown),
  ).toBeVisible();

  /* The report route counts it. */
  const after = (
    await json(
      await owner.get(`/organizations/${H1}/reports/education`, H1),
      "report",
    )
  ).data as { enrolled: number };
  expect(after.enrolled).toBe(before.enrolled + 1);
  await page.goto("/dashboard/hospital/reports");
  await expect(page.getByText("Patients enrolled")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Download patient report/ }),
  ).toBeDisabled();

  for (const c of calls) expect(c.path).not.toContain(mrn);
  expect(page.url()).not.toContain(mrn);
  await storageClean(page);
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).not.toContain("nr:hospital-enrollments");
});

test("J14-2 another hospital never sees the first hospital's enrollments @phase14", async ({
  asUser,
  api,
}) => {
  const other = hospital2();
  test.skip(!other, "E2E_HOSPITAL2 (make-hospital2.mjs fixture) is not set");
  const owner = await api(ACCOUNTS.hospital);
  const H1 = await owner.orgId("HOSPITAL");
  const theirs = (
    await json(
      await owner.get(`/organizations/${H1}/program-enrollments?limit=5`, H1),
      "list",
    )
  ).data as Array<{ lastName: string }>;
  expect(theirs.length).toBeGreaterThan(0);

  const { page } = await asUser(other!);
  const calls = recordApiCalls(page);
  await page.goto("/dashboard/hospital/patients");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("No patients here")).toBeVisible();
  for (const e of theirs)
    await expect(page.getByText(e.lastName)).toHaveCount(0);
  for (const c of calls.filter((c) => c.path.startsWith("/organizations/")))
    expect(c.path.startsWith(`/organizations/${H1}`)).toBe(false);
  expect(
    await browserFetch(page, `/organizations/${H1}/program-enrollments`, H1),
  ).toBe(403);
});

/* --------------------------------------------------------------- J14-3 */

test("J14-3 clinic settings save per section and persist; no settings role sees no access @phase14", async ({
  asUser,
  api,
}) => {
  const owner = await api(ACCOUNTS.clinic);
  const C1 = await owner.orgId("DIALYSIS_CENTER");
  const original = (
    await json(await owner.get(`/organizations/${C1}/settings`, C1), "settings")
  ).data as { opensAt: string; onCallPhone: string | null };

  const { page } = await asUser(ACCOUNTS.clinic);
  const patches: unknown[] = [];
  page.on("request", (req) => {
    if (req.method() === "PATCH") patches.push(req.postDataJSON());
  });
  await page.goto("/dashboard/clinic/settings");
  await expect(page.getByText("Organization Profile")).toBeVisible();
  await expect(page.getByLabel("Organization Name")).toBeDisabled();
  await page.getByLabel("Office Opens").fill("07:30");
  const phone = page.getByLabel("On-Call Nurse Manager Phone");
  await phone.fill("(702) 555-0144");
  await phone.blur();
  await expect.poll(() => patches.length).toBeGreaterThanOrEqual(2);
  expect(patches).toContainEqual({ opensAt: "07:30" });
  expect(patches).toContainEqual({ onCallPhone: "+17025550144" });

  await page.reload();
  await expect(page.getByLabel("Office Opens")).toHaveValue("07:30");
  await expect(page.getByLabel("On-Call Nurse Manager Phone")).toHaveValue(
    "(702) 555-0144",
  );

  await owner.patch(
    `/organizations/${C1}/settings`,
    { opensAt: original.opensAt, onCallPhone: original.onCallPhone },
    C1,
  );

  const nurse = await asUser(NURSE);
  await nurse.page.goto("/dashboard/clinic/settings");
  /* The guard sends a role without settings away, or shows no access;
     either way no settings are read or shown. */
  await expect(nurse.page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(nurse.page.getByText("Organization Profile")).toHaveCount(0);
  expect(
    await browserFetch(nurse.page, `/organizations/${C1}/settings`, C1),
  ).toBe(403);
});

/* --------------------------------------------------------------- J14-4 */

test("J14-4 clinic billing: contract from the API, no pay or renewal, change request listed @phase14", async ({
  asUser,
  api,
}) => {
  const owner = await api(ACCOUNTS.clinic);
  const C1 = await owner.orgId("DIALYSIS_CENTER");
  const contract = (
    await json(
      await owner.get(`/organizations/${C1}/billing/contract`, C1),
      "contract",
    )
  ).data as { contract: { contractNumber: string } };

  const { page } = await asUser(ACCOUNTS.clinic);
  await page.goto("/dashboard/clinic/billing");
  await expect(
    page.getByText(contract.contract.contractNumber).first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Pay/ })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Renewal Options/ }),
  ).toHaveCount(0);
  await expect(page.getByText(/Renewal choice:/)).toBeVisible();

  const detail = `Synthetic E2E change ${tag()}`;
  await page.getByRole("button", { name: "Request a Change" }).click();
  await page.getByRole("dialog").getByLabel("Details").fill(detail);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Send Request" })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText(/Change requested by you: Patient slots/),
  ).toBeVisible();
  const list = (
    await json(
      await owner.get(
        `/organizations/${C1}/billing/change-requests?limit=5`,
        C1,
      ),
      "requests",
    )
  ).data as Array<{ detail: string }>;
  expect(list.some((r) => r.detail === detail)).toBe(true);
});

/* --------------------------------------------------------------- J14-5 */

test("J14-5 report export is the server's audited CSV of counts @phase14", async ({
  asUser,
  api,
}) => {
  const owner = await api(ACCOUNTS.clinic);
  const C1 = await owner.orgId("DIALYSIS_CENTER");
  const exportRows = async () =>
    (
      (
        await json(
          await owner.get(`/organizations/${C1}/activity?limit=150`, C1),
          "activity",
        )
      ).data as Array<{ module: string; action: string }>
    ).filter((r) => r.module === "reports" && r.action === "export").length;
  const before = await exportRows();

  const { page } = await asUser(ACCOUNTS.clinic);
  await page.goto("/dashboard/clinic/reports");
  await expect(page.getByText("Total Members")).toBeVisible();
  await expect(page.getByText(/Sample figures/)).toHaveCount(0);
  await page.getByRole("button", { name: /Export Report/ }).click();
  await page.getByRole("checkbox").check();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Confirm/ }).click();
  const file = await download;
  const text = fs.readFileSync((await file.path())!, "utf8");
  expect(text.toLowerCase().startsWith("metric,group,value")).toBe(true);
  await expect.poll(exportRows, { timeout: 20_000 }).toBe(before + 1);
});

/* --------------------------------------------------------------- J14-6 */

test("J14-6 office staff cannot reach /platform/* @phase14", async ({
  asUser,
}) => {
  for (const account of [ACCOUNTS.clinic, ACCOUNTS.hospital]) {
    const { page } = await asUser(account);
    await page.goto("/dashboard");
    for (const path of [
      "/platform/member-plans",
      "/platform/contracts",
      "/platform/support-tickets",
      "/platform/reports/overview",
    ])
      expect(await browserFetch(page, path), `${account.email} ${path}`).toBe(
        403,
      );
  }
});

/* --------------------------------------------------------------- J14-7 */

test("J14-7 a 500 is an error with Try again; a 403 is not shared; retired keys are purged @phase14", async ({
  asUser,
  storageClean,
}) => {
  const { page } = await asUser(ACCOUNTS.hospital);
  await page.addInitScript((keys) => {
    for (const k of keys)
      localStorage.setItem(k, JSON.stringify({ legacy: true }));
  }, RETIRED);
  const fail = await failApi(page, /\/program-enrollments$/, {
    kind: "status",
    status: 500,
  });
  await page.goto("/dashboard/hospital/patients");
  await expect(page.getByText("Patients did not load")).toBeVisible();
  await expect(page.getByText("No patients here")).toHaveCount(0);
  fail.lift();
  await page
    .getByRole("button", { name: /Try again/ })
    .first()
    .click();
  await expect(page.getByText("Patients did not load")).toHaveCount(0);

  const deny = await failApi(page, /\/reports\/education$/, {
    kind: "status",
    status: 403,
    code: "access.permission_denied",
  });
  await page.goto("/dashboard/hospital/reports");
  await expect(
    page.getByText("This has not been shared with you").first(),
  ).toBeVisible();
  deny.lift();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  for (const k of RETIRED) expect(keys).not.toContain(k);
  await storageClean(page);
  expect(appOrigin).toBeTruthy();
});
