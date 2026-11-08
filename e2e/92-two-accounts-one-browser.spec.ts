/* Phase 15, ADR 0006 step 11: "re-test the cross-user cases with two
   accounts in one browser". DRAFT, prepared for the Lead: copy to
   Nephro-reach-frontend/e2e/92-two-accounts-one-browser.spec.ts.

   For each pair, account A signs in through the real form, opens every
   sidebar page, and signs out through the sidebar; then account B signs in
   in the SAME browser context (same storage, same cookie jar, same query
   cache lifetime) and opens every page. B must never:
   - call the API with A's patient id (members) or A's office id, in the
     path or in X-Organization-Id (staff), or reach /platform (admin A);
   - render A's full name where B has no legitimate access to A;
   - find A's email in a storage key, or any key outside the allowed list
     other than the D8 vitals store.
   Pairs are chosen so that B has NO legitimate relationship with what is
   forbidden (seed links: e2e/fixtures/env.ts ORG_NAMES comment).
   Read-only: nothing is written. Synthetic seed accounts only. */
import type { Page } from "@playwright/test";
import { KEPT_KEYS } from "../src/lib/data/legacyPurge";
import { ApiClient } from "./fixtures/api";
import { ACCOUNTS, type Account } from "./fixtures/env";
import { recordApiCalls } from "./fixtures/network";
import { loginViaUi } from "./fixtures/session";
import { expect, test } from "./fixtures/test";

type Side = { account: Account; patient?: string };
type Forbid = {
  patientOf?: Account;
  orgOf?: { account: Account; type: string };
  platform?: boolean;
  nameOf?: string;
};
type Pair = { id: string; a: Side; b: Side; forbid: Forbid };

const PAIRS: Pair[] = [
  {
    id: "John then Grace",
    a: { account: ACCOUNTS.john },
    b: { account: ACCOUNTS.grace },
    forbid: { patientOf: ACCOUNTS.john, nameOf: "John Taylor" },
  },
  {
    id: "Grace then John",
    a: { account: ACCOUNTS.grace },
    b: { account: ACCOUNTS.john },
    forbid: { patientOf: ACCOUNTS.grace, nameOf: "Grace Taylor" },
  },
  {
    // Metro Vascular Access has no relationship with Grace.
    id: "Grace then the access center",
    a: { account: ACCOUNTS.grace },
    b: { account: ACCOUNTS.access },
    forbid: { patientOf: ACCOUNTS.grace, nameOf: "Grace Taylor" },
  },
  {
    id: "Caregiver (as John) then Grace",
    a: { account: ACCOUNTS.caregiver, patient: "John Taylor" },
    b: { account: ACCOUNTS.grace },
    forbid: { patientOf: ACCOUNTS.john, nameOf: "John Taylor" },
  },
  {
    id: "Dialysis center then Grace",
    a: { account: ACCOUNTS.clinic },
    b: { account: ACCOUNTS.grace },
    forbid: { orgOf: { account: ACCOUNTS.clinic, type: "DIALYSIS_CENTER" } },
  },
  {
    id: "Dialysis center then the access center",
    a: { account: ACCOUNTS.clinic },
    b: { account: ACCOUNTS.access },
    forbid: { orgOf: { account: ACCOUNTS.clinic, type: "DIALYSIS_CENTER" } },
  },
  {
    id: "Nephrology then the hospital",
    a: { account: ACCOUNTS.nephrology },
    b: { account: ACCOUNTS.hospital },
    forbid: {
      orgOf: { account: ACCOUNTS.nephrology, type: "NEPHROLOGY_OFFICE" },
    },
  },
  {
    id: "Platform admin then John",
    a: { account: ACCOUNTS.admin },
    b: { account: ACCOUNTS.john },
    forbid: { platform: true },
  },
  {
    // The admin has no care relationship with John.
    id: "John then the platform admin",
    a: { account: ACCOUNTS.john },
    b: { account: ACCOUNTS.admin },
    forbid: { patientOf: ACCOUNTS.john },
  },
];

async function settle(page: Page) {
  await page
    .waitForLoadState("networkidle", { timeout: 10_000 })
    .catch(() => undefined);
}

async function skipTour(page: Page) {
  const skip = page.getByRole("button", { name: /^skip tour$/i });
  if (
    await skip
      .waitFor({ state: "visible", timeout: 2_000 })
      .then(() => true)
      .catch(() => false)
  )
    await skip.click();
}

/** Signs in through the form and opens every sidebar page in-app. */
async function useEveryPage(page: Page, side: Side): Promise<string[]> {
  await loginViaUi(page, side.account);
  await expect(page).toHaveURL(/\/(dashboard|select-portal)/, {
    timeout: 30_000,
  });
  await settle(page);
  if (/\/select-portal/.test(page.url()))
    await page
      .getByRole("button", { name: /^Open: / })
      .first()
      .click();
  if (side.patient) {
    await page.getByRole("button", { name: `Open ${side.patient}` }).click();
    await expect(page).not.toHaveURL(/\/dashboard\/caregiver\/?$/, {
      timeout: 30_000,
    });
  }
  await skipTour(page);
  await page
    .locator('aside a[href^="/dashboard"]')
    .first()
    .waitFor({ timeout: 30_000 });
  const hrefs = [
    ...new Set(
      await page
        .locator('aside a[href^="/dashboard"]')
        .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? "")),
    ),
  ].filter(Boolean);
  for (const href of hrefs) {
    await page.locator(`aside a[href="${href}"]`).first().click();
    /* "/dashboard" may redirect to the role's own home page. */
    await expect(page).toHaveURL(
      href === "/dashboard"
        ? /\/dashboard(\/[^?]*)?(\?.*)?$/
        : new RegExp(`${href}/?(\\?.*)?$`),
      { timeout: 30_000 },
    );
    await settle(page);
    await skipTour(page);
  }
  return hrefs;
}

test.beforeAll(async () => {
  for (const a of [ACCOUNTS.john, ACCOUNTS.grace, ACCOUNTS.caregiver]) {
    const c = await ApiClient.login(a);
    try {
      await c.post("/me/preferences/tour-completed");
      await c.logout();
    } finally {
      await c.dispose();
    }
  }
});

test.setTimeout(10 * 60_000);

for (const pair of PAIRS) {
  test(`two accounts, one browser: ${pair.id} @phase15`, async ({
    page,
    api,
  }) => {
    const forbidPatient = pair.forbid.patientOf
      ? await (await api(pair.forbid.patientOf)).patientId()
      : null;
    const forbidOrg = pair.forbid.orgOf
      ? await (
          await api(pair.forbid.orgOf.account)
        ).orgId(pair.forbid.orgOf.type)
      : null;

    await useEveryPage(page, pair.a);
    await page
      .getByRole("button", { name: /^log out$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });

    const calls = recordApiCalls(page);
    const pages = await useEveryPage(page, pair.b);
    const problems: string[] = [];

    for (const c of calls) {
      if (forbidPatient && c.path.includes(forbidPatient))
        problems.push(`B called ${c.method} ${c.path} with A's patient id`);
      if (forbidOrg && c.path.includes(forbidOrg))
        problems.push(`B called ${c.method} ${c.path} with A's office id`);
      if (forbidOrg && c.headers["x-organization-id"] === forbidOrg)
        problems.push(`B sent A's office id in X-Organization-Id (${c.path})`);
      if (pair.forbid.platform && c.path.startsWith("/platform"))
        problems.push(`B called ${c.method} ${c.path} (platform)`);
    }

    if (pair.forbid.nameOf) {
      for (const href of pages) {
        await page.locator(`aside a[href="${href}"]`).first().click();
        await settle(page);
        if ((await page.getByText(pair.forbid.nameOf).count()) > 0)
          problems.push(`${href} shows "${pair.forbid.nameOf}" (A's name)`);
      }
    }

    const keys = await page.evaluate(() => [
      ...Object.keys(localStorage),
      ...Object.keys(sessionStorage),
    ]);
    const aEmail = pair.a.account.email.toLowerCase();
    /* D8: the home-HD vitals store is the one live member store left. Its
       per-member key embeds the member's email (lib/data/storage.ts
       storageKey) and survives sign-out, so B's browser still holds A's
       email and vitals. Reported as an annotation until D8 is decided;
       E2E_D8_STRICT=true makes it a failure. */
    const d8Strict = process.env.E2E_D8_STRICT === "true";
    for (const k of keys) {
      const d8 = /^nr:(?:.*:)?dialysis-treatment-vitals$/.test(k);
      const finding = k.toLowerCase().includes(aEmail)
        ? `storage key ${k} names account A`
        : !KEPT_KEYS.includes(k) && !d8
          ? `storage key ${k} is not allowed`
          : null;
      if (d8 && !d8Strict) {
        test.info().annotations.push({
          type: "D8",
          description: `${k} present after A signed out${finding ? ` (${finding})` : ""}`,
        });
        continue;
      }
      if (d8) problems.push(`D8 store still present: ${k}`);
      if (finding) problems.push(finding);
    }

    expect(
      problems,
      `${pair.id}: cross-user findings:\n${problems.join("\n")}`,
    ).toEqual([]);
  });
}
