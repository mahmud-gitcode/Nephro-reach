/* Phases 4-7 member pages under the Phase 3 caregiver context (MEMBER lane,
   Phase 7 follow-ups). Sarah (caregiver) holds a FULL grant on John and on
   Grace in the seed.
   - with the area: Sarah opens John's dialysis, treatment, medications,
     labs, blood pressure and health pages; every patient call is John's,
     no office header, no write; then she switches to Grace from the bar and
     John's synthetic marker is gone and every later call is Grace's;
     preferences are only ever /me/preferences (the caregiver's own);
   - without the area: John closes profile, personal logs, medications,
     labs and dialysis to Sarah (custom map); each page shows "not shared",
     never the default dialysis type or week, never John's marker, and
     nothing is written. John's FULL grant is restored afterwards.
   Synthetic data only; the marker is removed again. */
import type { Page } from "@playwright/test";
import { ACCOUNTS } from "./fixtures/env";
import { recordApiCalls } from "./fixtures/network";
import { expect, test } from "./fixtures/test";

const patientDay = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const NOT_SHARED = /not been shared with you/i;

/** The member pages of Phases 4-7 and the caregiver area each needs. */
const PAGES = [
  { href: "/dashboard/personal-log/dialysis-management", area: "dialysis" },
  { href: "/dashboard/personal-log/dialysis-treatment", area: "dialysis" },
  { href: "/dashboard/personal-log/medications", area: "medications" },
  { href: "/dashboard/personal-log/lab-tracking", area: "labs" },
  { href: "/dashboard/personal-log/blood-pressure", area: "personal-logs" },
] as const;

/** In-app navigation (a reload of a two-patient caregiver lands on My
 *  Patients, because the chosen patient is the in-memory portal context). */
async function openInApp(page: Page, href: string) {
  await page.locator('a[href="/dashboard/personal-log"]').first().click();
  await expect(page).toHaveURL(/\/dashboard\/personal-log\/?$/, {
    timeout: 30_000,
  });
  await page.locator(`a[href="${href}"]`).first().click();
  await expect(page).toHaveURL(new RegExp(`${href}/?$`), { timeout: 30_000 });
}

async function openPatient(page: Page, name: string) {
  await page.goto("/dashboard/caregiver");
  await page.getByRole("button", { name: `Open ${name}` }).click();
  await expect(page).not.toHaveURL(/\/dashboard\/caregiver\/?$/, {
    timeout: 30_000,
  });
}

test.beforeEach(async ({ api }) => {
  for (const account of [ACCOUNTS.john, ACCOUNTS.grace, ACCOUNTS.caregiver]) {
    const client = await api(account);
    await client.post("/me/preferences/tour-completed");
  }
});

test("caregiver with the area: John's member pages, then a switch to Grace clears them @phase7", async ({
  asUser,
  api,
}) => {
  const john = await api(ACCOUNTS.john);
  const johnId = await john.patientId();
  const grace = await api(ACCOUNTS.grace);
  const graceId = await grace.patientId();
  const marker = `Synthetic E2E caregiver ${Date.now().toString(36)}`;
  const made = await (
    await john.post(`/patients/${johnId}/dialysis/extra-treatments`, {
      date: patientDay(),
      reason: "Doctor Order",
      notes: marker,
    })
  ).json();
  try {
    const { page } = await asUser(ACCOUNTS.caregiver);
    const calls = recordApiCalls(page);
    await openPatient(page, "John Taylor");

    for (const { href } of PAGES) {
      await openInApp(page, href);
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(NOT_SHARED)).toHaveCount(0);
    }
    /* The management page shows John's extra treatment (his data). */
    await openInApp(page, "/dashboard/personal-log/dialysis-management");
    await expect(
      page.getByText(marker).filter({ visible: true }).first(),
    ).toBeVisible({ timeout: 30_000 });

    const johnCalls = calls.filter((c) => c.path.startsWith("/patients/"));
    expect(johnCalls.length).toBeGreaterThan(0);
    for (const c of johnCalls)
      expect(c.path.startsWith(`/patients/${johnId}/`)).toBe(true);
    /* Looking is not changing: no write on John's records. */
    expect(
      johnCalls.filter((c) => c.method !== "GET").map((c) => c.path),
    ).toEqual([]);

    /* Switch to Grace from the bar: John's data is gone, Grace's calls only. */
    const mark = calls.length;
    await page
      .getByRole("button", { name: /Switch/ })
      .first()
      .click();
    await page.getByRole("menuitemradio", { name: /Grace Taylor/ }).click();
    await expect(page.getByText("Grace Taylor").first()).toBeVisible();
    await openInApp(page, "/dashboard/personal-log/dialysis-management");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(NOT_SHARED)).toHaveCount(0);
    await expect(page.getByText(marker)).toHaveCount(0);
    const after = calls
      .slice(mark)
      .filter((c) => c.path.startsWith("/patients/"));
    expect(after.length).toBeGreaterThan(0);
    for (const c of after)
      expect(c.path.startsWith(`/patients/${graceId}/`)).toBe(true);

    for (const c of calls)
      expect(c.headers["x-organization-id"]).toBeUndefined();
    /* Preferences stay the caregiver's own: /me only, never a patient's. */
    expect(
      calls.some((c) => /\/patients\/[^/]+\/preferences/.test(c.path)),
    ).toBe(false);
    expect(calls.some((c) => c.path === "/me/preferences")).toBe(true);
  } finally {
    await john.delete(
      `/patients/${johnId}/dialysis/extra-treatments/${made.data.id}`,
    );
  }
});

test("caregiver without the area: each Phase 4-7 page is 'not shared', no default, nothing sent @phase7", async ({
  asUser,
  api,
}) => {
  const john = await api(ACCOUNTS.john);
  const johnId = await john.patientId();
  const sarah = await api(ACCOUNTS.caregiver);
  const toJohn = (await sarah.context()).caregiving.find(
    (g) => g.patientId === johnId,
  )!;
  const grant = (
    await (
      await john.get(`/patients/${johnId}/caregivers?status=ACTIVE`)
    ).json()
  ).data.find((g: { id: string }) => g.id === toJohn.grantId);
  const marker = `Synthetic E2E caregiver ${Date.now().toString(36)}`;
  const made = await (
    await john.post(`/patients/${johnId}/dialysis/extra-treatments`, {
      date: patientDay(),
      reason: "Doctor Order",
      notes: marker,
    })
  ).json();
  try {
    expect(
      (
        await john.patch(`/patients/${johnId}/caregivers/${toJohn.grantId}`, {
          preset: "custom",
          permissions: {
            ...grant.permissions,
            profile: 0,
            "personal-logs": 0,
            medications: 0,
            labs: 0,
            dialysis: 0,
          },
        })
      ).ok(),
    ).toBeTruthy();

    const { page } = await asUser(ACCOUNTS.caregiver);
    const calls = recordApiCalls(page);
    await openPatient(page, "John Taylor");

    for (const { href } of PAGES) {
      await openInApp(page, href);
      await expect(page.getByText(NOT_SHARED).first()).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText(marker)).toHaveCount(0);
    }
    /* The dialysis type is not offered and the typical week is not shown
       as if it were John's (fail closed, QA L5). */
    await openInApp(page, "/dashboard/personal-log/dialysis-management");
    await expect(page.getByText(NOT_SHARED).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/This is a typical week/)).toHaveCount(0);
    await expect(
      page.getByRole("tab", { name: /Home hemodialysis/ }),
    ).toHaveCount(0);

    await page.locator('a[href="/dashboard/my-health"]').first().click();
    await expect(page.getByText(NOT_SHARED).first()).toBeVisible({
      timeout: 30_000,
    });

    const patientCalls = calls.filter((c) => c.path.startsWith("/patients/"));
    for (const c of patientCalls)
      expect(c.path.startsWith(`/patients/${johnId}/`)).toBe(true);
    expect(
      patientCalls.filter((c) => c.method !== "GET").map((c) => c.path),
    ).toEqual([]);
    for (const c of calls)
      expect(c.headers["x-organization-id"]).toBeUndefined();
    expect(
      calls.some((c) => /\/patients\/[^/]+\/preferences/.test(c.path)),
    ).toBe(false);
  } finally {
    await john.patch(`/patients/${johnId}/caregivers/${toJohn.grantId}`, {
      preset: "full",
    });
    await john.delete(
      `/patients/${johnId}/dialysis/extra-treatments/${made.data.id}`,
    );
  }
});
