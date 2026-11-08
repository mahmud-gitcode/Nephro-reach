/* Phase 15 per-role page smoke: the floor under every role's journeys.
   DRAFT, prepared for the Lead: copy to
   Nephro-reach-frontend/e2e/93-role-page-smoke.spec.ts.

   For every seeded role, every sidebar page must open with:
   - no API answer >= 500 and no unexpected 401/403 for the account's OWN
     data (a 403 is allowed only where the page shows "not shared", i.e.
     a caregiver area the patient did not share);
   - no error state ("Try again") on a healthy API;
   - no "not shared" panel for an owner/member on their own pages;
   - no request to another office (X-Organization-Id always one of the
     account's memberships; never sent by members and caregivers);
   - no third-party request (fixture `blocked`).
   It does not replace the journey specs (role-journeys.md); it proves no
   page of any role is broken or silently cross-wired after all phases
   merged. Read-only. Synthetic seed accounts only. --workers=1. */
import type { Page } from "@playwright/test";
import { ApiClient } from "./fixtures/api";
import { ACCOUNTS, apiOrigin, type Account } from "./fixtures/env";
import { expect, test } from "./fixtures/test";

type Role = {
  id: string;
  account: Account;
  /** Members and caregivers never send X-Organization-Id (ADR 0006 §5). */
  sendsOrgHeader: boolean;
  patient?: string;
  /** A non-owner staff role: a role-permission refusal shown as the
   *  not-shared state is expected (least privilege, D4). */
  limitedRole?: boolean;
};

const staff = (email: string): Account => ({
  email,
  password: "staff123",
  name: email,
});

const ROLES: Role[] = [
  { id: "member-john", account: ACCOUNTS.john, sendsOrgHeader: false },
  { id: "member-grace", account: ACCOUNTS.grace, sendsOrgHeader: false },
  {
    id: "caregiver-sarah",
    account: ACCOUNTS.caregiver,
    sendsOrgHeader: false,
    patient: "John Taylor",
  },
  { id: "dialysis-owner", account: ACCOUNTS.clinic, sendsOrgHeader: true },
  {
    id: "dialysis-nurse",
    account: staff("nurse@nephroreach.com"),
    sendsOrgHeader: true,
    limitedRole: true,
  },
  { id: "access-owner", account: ACCOUNTS.access, sendsOrgHeader: true },
  {
    id: "nephrology-owner",
    account: ACCOUNTS.nephrology,
    sendsOrgHeader: true,
  },
  { id: "hospital-owner", account: ACCOUNTS.hospital, sendsOrgHeader: true },
  {
    id: "hospital-rn",
    account: staff("hospitalrn@nephroreach.com"),
    sendsOrgHeader: true,
    limitedRole: true,
  },
  { id: "platform-admin", account: ACCOUNTS.admin, sendsOrgHeader: true },
];

const NOT_SHARED = /not been shared with you/i;

/* Refusals a backend spec makes on purpose for a whole office type, not a
   missing share: spec 048 §2, an office that keeps no access records
   (nephrology, hospital) is refused the access-record list. */
const SERVICE_DENIALS = new Set(["vascular_access.profiles_not_kept_here"]);

async function settle(page: Page) {
  await page
    .waitForLoadState("networkidle", { timeout: 10_000 })
    .catch(() => undefined);
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

for (const role of ROLES) {
  test(`every sidebar page opens cleanly: ${role.id} @phase15`, async ({
    asUser,
    api,
  }) => {
    const me = await (await api(role.account)).context();
    const myOrgs = [
      ...me.memberships.map((m) => m.organizationId),
      ...(me.platform ? [me.platform.organizationId] : []),
    ];
    const { page } = await asUser(role.account);
    const problems: string[] = [];
    let current = "/dashboard";
    page.on("response", (res) => {
      const u = new URL(res.url());
      if (u.origin !== apiOrigin) return;
      const p = u.pathname.replace(/^\/api\/v1/, "");
      const s = res.status();
      if (s >= 500) problems.push(`${current}: ${s} on ${p}`);
      const org = res.request().headers()["x-organization-id"];
      if (org && !role.sendsOrgHeader)
        problems.push(`${current}: X-Organization-Id sent by ${role.id}`);
      if (org && !myOrgs.includes(org))
        problems.push(`${current}: X-Organization-Id of a foreign office`);
      const pathOrg = /^\/organizations\/([0-9a-f-]{36})/.exec(p)?.[1];
      if (pathOrg && !myOrgs.includes(pathOrg))
        problems.push(`${current}: request to a foreign office ${p}`);
    });
    const denied: string[] = [];
    const serviceDenied: string[] = [];
    page.on("response", async (res) => {
      const u = new URL(res.url());
      if (u.origin !== apiOrigin || ![401, 403].includes(res.status())) return;
      const p = u.pathname.replace(/^\/api\/v1/, "");
      const body = (await res.json().catch(() => null)) as {
        code?: unknown;
      } | null;
      const code = typeof body?.code === "string" ? body.code : "";
      if (SERVICE_DENIALS.has(code)) serviceDenied.push(`${p} ${code}`);
      else denied.push(`${p}${code ? ` ${code}` : ""}`);
    });
    const notes: string[] = [];

    await page.goto("/dashboard");
    await settle(page);
    if (/\/select-portal/.test(page.url()))
      await page
        .getByRole("button", { name: /^Open: / })
        .first()
        .click();
    if (role.patient) {
      await page.getByRole("button", { name: `Open ${role.patient}` }).click();
      await settle(page);
    }
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
      current = href;
      denied.length = 0;
      serviceDenied.length = 0;
      await page.locator(`aside a[href="${href}"]`).first().click();
      /* "/dashboard" may redirect to the role's own home page. */
      await expect(page).toHaveURL(
        href === "/dashboard"
          ? /\/dashboard(\/[^?]*)?(\?.*)?$/
          : new RegExp(`${href}/?(\\?.*)?$`),
        { timeout: 30_000 },
      );
      await settle(page);
      const notShared = await page.getByText(NOT_SHARED).count();
      if (await page.getByRole("button", { name: "Try again" }).count())
        problems.push(`${href}: error state shown`);
      const deniedList = [...new Set(denied)].slice(0, 3).join(", ");
      if (notShared && !role.patient && !role.limitedRole)
        problems.push(
          `${href}: "not shared" shown to the owner (${deniedList})`,
        );
      if (notShared && role.limitedRole)
        notes.push(`${href}: role refusal shown as not shared (${deniedList})`);
      if (serviceDenied.length)
        notes.push(
          `${href}: intended service denial ${[...new Set(serviceDenied)].join(", ")}`,
        );
      /* A limited staff role may be refused a side read its role does not
         grant (final-matrix.md: a dialysis Nurse has patients = None) while
         the page itself works. Recorded for the D38 review, not a failure.
         For an owner, member or caregiver it is a failure. */
      if (denied.length && !notShared && role.limitedRole)
        notes.push(
          `${href}: role refusal of a side read, page still usable (${deniedList})`,
        );
      else if (denied.length && !notShared)
        problems.push(
          `${href}: ${denied.length} API refusal(s) with no "not shared" state (${deniedList})`,
        );
    }

    for (const note of notes)
      test.info().annotations.push({ type: "note", description: note });
    expect(problems, `${role.id}:\n${problems.join("\n")}`).toEqual([]);
  });
}
