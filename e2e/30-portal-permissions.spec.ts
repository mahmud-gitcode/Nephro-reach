/* Phase 3: portal context, server permissions, staff invitations (D3),
   the role editor (D4), caregivers (D1). FE-ORG lane.
   - office switch + two-membership isolation: one account in two offices
     picks a portal; each office's staff list shows only its own people, and
     only that office's id is ever used;
   - UI controls follow the server's levels for four roles;
   - an escalation the editor would not offer is refused by the server and
     the refusal is shown;
   - staff invitation: invite in the UI, wrong account refused, the invited
     account accepts and is signed out to sign in again (D2), withdrawn link
     shows withdrawn; no password field anywhere;
   - caregiver: Full Access needs the explicit authorization; the caregiver
     accepts through the link; the patient revokes and the caregiver's next
     page shows no access; the caregiver can't open caregiver management or
     the journal;
   - MEMBER re-test under a caregiver: switching patients clears the cache,
     no office header, the area the patient closed shows "not shared";
   - retired stores are purged and can't come back.
   Synthetic data only: seed accounts and fresh *.example.test accounts. */
import { request, type Page } from "@playwright/test";
import { ApiClient, currentConsent, json } from "./fixtures/api";
import {
  ACCOUNTS,
  appOrigin,
  env,
  throwawayAccount,
  type Account,
} from "./fixtures/env";
import {
  extractLink,
  extractOtp,
  mailMark,
  waitForMail,
} from "./fixtures/mail";
import { recordApiCalls } from "./fixtures/network";
import { cookieSession, loginViaUi } from "./fixtures/session";
import { expect, test } from "./fixtures/test";
import { pace } from "./fixtures/throttle";

const OFFICE_MANAGER: Account = {
  email: "officemanager@nephroreach.com",
  password: "staff123",
  name: "Office Manager (seed)",
};

/** A fresh, verified synthetic account (D6 consent sent at registration). */
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

async function inviteLink(email: string, since: number): Promise<string> {
  const mail = await waitForMail(email, { since, subject: /invit/i });
  const url = extractLink(mail, /^\/invitations\/[A-Za-z0-9_-]{20,}$/);
  return url.pathname;
}

/** Accept every waiting STAFF invitation through the API (setup only).
 *  Each acceptance ends the account's sessions (D2), so sign in for each. */
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

/* These journeys register fresh accounts and sign in several people; the
   API throttles both per IP (fixtures/throttle.ts paces them), so they get
   more time than the default. */
test.setTimeout(240_000);

async function noRetiredKeys(page: Page) {
  const keys = await page.evaluate(() => Object.keys(localStorage));
  for (const k of keys) {
    expect(k).not.toBe("nr:role-permissions");
    expect(k).not.toBe("nr:staff-accounts");
    expect(k).not.toBe("nr:caregiver-grants");
    expect(k.startsWith("nr:caregiver-viewing:")).toBe(false);
  }
}

test("office switch and two-membership isolation @phase3 @needs-mail", async ({
  page,
  api,
  storageClean,
}) => {
  const person = await freshAccount("two-offices");
  const clinic = await api(ACCOUNTS.clinic);
  const access = await api(ACCOUNTS.access);
  const riverside = await clinic.orgId("DIALYSIS_CENTER");
  const metro = await access.orgId("ACCESS_CENTER");
  expect(
    (
      await clinic.post(`/organizations/${riverside}/invitations`, {
        email: person.email,
        role: "Office Manager",
      })
    ).status(),
  ).toBe(201);
  expect(
    (
      await access.post(`/organizations/${metro}/invitations`, {
        email: person.email,
        role: "Office Manager",
      })
    ).status(),
  ).toBe(201);
  await acceptAllStaff(person);

  const calls = recordApiCalls(page);
  await loginViaUi(page, person);
  await expect(page).toHaveURL(/\/select-portal/, { timeout: 20_000 });
  await expect(page.getByText("Riverside Dialysis Center")).toBeVisible();
  await expect(page.getByText("Metro Vascular Access Center")).toBeVisible();

  await page
    .getByRole("button", { name: "Open: Riverside Dialysis Center" })
    .click();
  await page.goto("/dashboard/clinic/team");
  await expect(page.getByText("socialworker@nephroreach.com")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("access@nephroreach.com")).toHaveCount(0);
  await expect(
    page.getByText(/You are working in Riverside Dialysis Center/),
  ).toBeVisible();

  /* Switch through the bar's link: the picker, then Metro. */
  await page.getByRole("link", { name: "Switch portal" }).click();
  await expect(page).toHaveURL(/\/select-portal/);
  await page
    .getByRole("button", { name: "Open: Metro Vascular Access Center" })
    .click();
  await page.goto("/dashboard/access-center/team");
  await expect(page.getByText("access@nephroreach.com")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("socialworker@nephroreach.com")).toHaveCount(0);

  /* Only the chosen office's id is used; a header, when sent, names it. */
  const orgCalls = calls.filter((c) => c.path.startsWith("/organizations/"));
  const firstMetro = orgCalls.findIndex((c) =>
    c.path.startsWith(`/organizations/${metro}`),
  );
  expect(firstMetro).toBeGreaterThan(0);
  for (const c of orgCalls.slice(0, firstMetro))
    expect(c.path.startsWith(`/organizations/${riverside}/`)).toBe(true);
  for (const c of orgCalls.slice(firstMetro))
    expect(c.path.startsWith(`/organizations/${metro}/`)).toBe(true);
  for (const c of calls) {
    const header = c.headers["x-organization-id"];
    if (header) expect([riverside, metro]).toContain(header);
  }
  await noRetiredKeys(page);
  await storageClean(page, { forbidStrings: [person.password] });
});

test("UI controls follow the server's levels for four roles @phase3", async ({
  asUser,
}) => {
  /* Social Worker (no staff level): no Staff menu; the typed address
     sends them to a page they have (the guard), never the team. */
  const sw = await asUser(ACCOUNTS.socialWorker);
  await sw.page.goto("/dashboard/clinic");
  await expect(
    sw.page.getByRole("link", { name: "Dashboard" }).first(),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    sw.page.getByRole("link", { name: "Staff & Roles" }),
  ).toHaveCount(0);
  await expect(
    sw.page.getByRole("complementary").getByRole("link", { name: "Labs" }),
  ).toHaveCount(0);
  await expect(
    sw.page
      .getByRole("complementary")
      .getByRole("link", { name: "Travel Requests" }),
  ).toHaveCount(1);
  await sw.page.goto("/dashboard/clinic/team");
  await expect(sw.page).not.toHaveURL(/\/team/, { timeout: 20_000 });
  await expect(sw.page.getByText("socialworker@nephroreach.com")).toHaveCount(
    0,
  );

  /* Office Manager (staff Manage, roles View): invites; the editor is read only. */
  const om = await asUser(OFFICE_MANAGER);
  await om.page.goto("/dashboard/clinic/team");
  await expect(om.page.getByText("socialworker@nephroreach.com")).toBeVisible({
    timeout: 20_000,
  });
  await om.page.getByRole("tab", { name: "Invitations" }).click();
  await expect(
    om.page.getByRole("button", { name: "Invite staff" }),
  ).toBeVisible();
  await om.page.getByRole("button", { name: "Invite staff" }).click();
  const options = await om.page
    .getByRole("dialog")
    .getByLabel("Role")
    .locator("option")
    .allTextContents();
  expect(options).not.toContain(
    "Physician",
  ); /* prescriptions Manage > own View */
  expect(options).not.toContain("Owner");
  expect(options).toContain("Front Desk");
  await om.page.getByRole("button", { name: "Cancel" }).click();
  await om.page.getByRole("tab", { name: "Roles & permissions" }).click();
  await expect(
    om.page.getByText(/View only: your role can't change roles/),
  ).toBeVisible();
  await expect(om.page.getByRole("button", { name: "Save role" })).toHaveCount(
    0,
  );
  await expect(om.page.getByRole("button", { name: "New role" })).toHaveCount(
    0,
  );

  /* Owner: everything, including new roles and the separate permissions. */
  const owner = await asUser(ACCOUNTS.clinic);
  await owner.page.goto("/dashboard/clinic/team");
  await owner.page.getByRole("tab", { name: "Roles & permissions" }).click();
  await expect(
    owner.page.getByRole("button", { name: "New role" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(owner.page.getByText("Dialysis prescriptions")).toBeVisible();
  await expect(
    owner.page.getByText("Sensitive clinical actions"),
  ).toBeVisible();
  await expect(owner.page.getByText("Transport (rides)")).toBeVisible();
  await expect(
    owner.page.getByRole("button", { name: /Make .* the owner/ }).first(),
  ).toHaveCount(0);
  await owner.page.getByRole("tab", { name: "People" }).click();
  await expect(
    owner.page.getByRole("button", { name: /Make .* the owner/ }).first(),
  ).toBeVisible();

  /* Nurse (no staff, no patients level): labs, no dashboard, no Staff. */
  const nurse = await asUser({
    email: "nurse@nephroreach.com",
    password: "staff123",
    name: "Nurse",
  });
  await nurse.page.goto("/dashboard/clinic/team");
  await expect(nurse.page).not.toHaveURL(/\/team/, { timeout: 20_000 });
  await expect(
    nurse.page.getByRole("complementary").getByRole("link", { name: "Labs" }),
  ).toHaveCount(1);
  await expect(
    nurse.page.getByRole("link", { name: "Staff & Roles" }),
  ).toHaveCount(0);
  await expect(
    nurse.page
      .getByRole("complementary")
      .getByRole("link", { name: "Enroll Patients" }),
  ).toHaveCount(0);
});

test("an escalation is refused by the server and the refusal is shown @phase3 @needs-mail", async ({
  api,
  browser,
}) => {
  /* A role administrator with limited levels: roles Manage, staff View,
     referrals View, nothing else (a custom role made by the owner). */
  const clinic = await api(ACCOUNTS.clinic);
  const riverside = await clinic.orgId("DIALYSIS_CENTER");
  const roleName = `E2E Role Admin ${Date.now().toString(36)}`;
  expect(
    (
      await clinic.post(`/organizations/${riverside}/roles`, {
        name: roleName,
        permissions: { roles: 3, staff: 1, referrals: 1 },
      })
    ).ok(),
  ).toBeTruthy();
  const admin = await freshAccount("role-admin");
  expect(
    (
      await clinic.post(`/organizations/${riverside}/invitations`, {
        email: admin.email,
        role: roleName,
      })
    ).status(),
  ).toBe(201);
  await acceptAllStaff(admin);

  const ctx = await browser.newContext();
  await cookieSession(ctx, admin);
  const page = await ctx.newPage();
  await page.goto("/dashboard/clinic/team");
  await page.getByRole("tab", { name: "Roles & permissions" }).click();
  const roleSelect = page.getByLabel("Role", { exact: true });
  const value = await roleSelect
    .locator("option", { hasText: /^Front Desk \(/ })
    .getAttribute("value");
  await roleSelect.selectOption(value!);
  /* Levels above the editor's own are not offered. */
  await expect(page.getByLabel("Patients and charts level")).toBeDisabled();
  await expect(
    page.getByLabel("Check-ins level").locator('option[value="1"]'),
  ).toBeDisabled();

  /* Send the escalation anyway (rewritten on the wire): the server refuses
     it and the editor shows the server's reason. */
  await page.route("**/organizations/*/roles/permissions", async (route) => {
    const body = route.request().postDataJSON() as {
      role: string;
      permissions: Record<string, number>;
    };
    await route.continue({
      postData: JSON.stringify({
        ...body,
        permissions: { ...body.permissions, check_ins: 1 },
      }),
    });
  });
  await page.getByLabel("Referrals level").selectOption("0");
  await page.getByRole("button", { name: "Save role" }).click();
  await page.getByRole("button", { name: "Save and sign out" }).click();
  await expect(
    page.getByText(
      "You can't give or take away a permission level you don't hold yourself.",
    ),
  ).toBeVisible({ timeout: 20_000 });
  await ctx.close();
});

test("staff invitation: invite, wrong account refused, accept, withdraw @phase3 @needs-mail", async ({
  asUser,
  browser,
}) => {
  const invitee = await freshAccount("invitee");
  const stranger = await freshAccount("stranger");
  const owner = await asUser(ACCOUNTS.clinic);
  const { page } = owner;
  await page.goto("/dashboard/clinic/team");
  await page.getByRole("tab", { name: "Invitations" }).click();
  await page.getByRole("button", { name: "Invite staff" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel(/password/i)).toHaveCount(0);
  await dialog.getByLabel("Their email").fill(invitee.email);
  await dialog.getByLabel("Role").selectOption("Front Desk");
  const since = mailMark();
  await dialog.getByRole("button", { name: "Send invitation" }).click();
  await expect(
    page.getByText(`Invitation sent to ${invitee.email}`),
  ).toBeVisible({ timeout: 20_000 });
  const row = page.getByRole("row", { name: new RegExp(invitee.email) });
  await expect(row.getByText("Waiting")).toBeVisible();
  const link = await inviteLink(invitee.email, since);

  /* The wrong account is refused. */
  const wrongCtx = await browser.newContext();
  await cookieSession(wrongCtx, stranger);
  const wrong = await wrongCtx.newPage();
  await wrong.goto(link);
  await wrong.getByRole("button", { name: "Accept invitation" }).click();
  await expect(
    wrong.getByText(/sent to a different email address/),
  ).toBeVisible({ timeout: 20_000 });
  await expect(wrong.getByText(invitee.email)).toHaveCount(0);
  await wrongCtx.close();

  /* The invited account accepts and is sent to sign in again (D2). */
  const rightCtx = await browser.newContext();
  await cookieSession(rightCtx, invitee);
  const right = await rightCtx.newPage();
  await right.goto(link);
  await right.getByRole("button", { name: "Accept invitation" }).click();
  await expect(right).toHaveURL(/\/login\?reason=access-changed/, {
    timeout: 20_000,
  });
  const keys = await right.evaluate(() =>
    JSON.stringify({ ...localStorage, ...sessionStorage }),
  );
  expect(keys).not.toContain(link.split("/").pop()!);
  await loginViaUi(right, invitee);
  await expect(right).toHaveURL(/\/dashboard\/clinic/, { timeout: 20_000 });
  await rightCtx.close();

  /* Single use: the link now shows accepted. */
  const anon = await browser.newContext();
  const a = await anon.newPage();
  await a.goto(link);
  await expect(
    a.getByText("This invitation was already accepted."),
  ).toBeVisible({ timeout: 20_000 });

  /* Withdraw a second invitation: its link shows withdrawn. */
  const second = await freshAccount("withdrawn");
  await page.goto("/dashboard/clinic/team");
  await page.getByRole("tab", { name: "Invitations" }).click();
  await page.getByRole("button", { name: "Invite staff" }).click();
  await page.getByRole("dialog").getByLabel("Their email").fill(second.email);
  await page.getByRole("dialog").getByLabel("Role").selectOption("Front Desk");
  const since2 = mailMark();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Send invitation" })
    .click();
  const link2 = await inviteLink(second.email, since2);
  await page
    .getByRole("button", { name: `Withdraw the invitation to ${second.email}` })
    .click();
  await expect(
    page.getByText(`The invitation to ${second.email} was withdrawn.`),
  ).toBeVisible();
  await a.goto(link2);
  await expect(a.getByText("This invitation was withdrawn.")).toBeVisible({
    timeout: 20_000,
  });
  await anon.close();
});

test("caregiver: Full Access needs the patient's authorization; revoke ends access at once @phase3 @needs-mail", async ({
  asUser,
  api,
  browser,
}) => {
  const helper = await freshAccount("caregiver");
  /* The first-visit tour is on the account: finish it so its dialog does
     not cover the page under test (as in the Phase 4-5 journeys). */
  await (await api(ACCOUNTS.john)).post("/me/preferences/tour-completed");
  const john = await asUser(ACCOUNTS.john);
  const p = john.page;
  await p.goto("/dashboard/my-caregivers");
  await p.getByRole("button", { name: "Invite caregiver" }).first().click();
  const d = p.getByRole("dialog");
  await d.getByLabel("Their email").fill(helper.email);
  await d.getByLabel("Relationship").selectOption("Friend");
  /* Nothing is preselected. */
  await expect(d.getByRole("radio", { checked: true })).toHaveCount(0);
  /* Keyboard: the radio cards sit in a scrolling dialog body. */
  await d.getByRole("radio", { name: /Full access/ }).focus();
  await p.keyboard.press("Space");
  await expect(d.getByRole("radio", { name: /Full access/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await d.getByRole("button", { name: "Continue" }).click();
  await expect(p.getByText("It never covers")).toBeVisible();
  await expect(p.getByText("Your password and sign-in methods")).toBeVisible();
  await expect(p.getByText(/Your private journal/)).toBeVisible();
  const since = mailMark();
  await p.getByRole("button", { name: "I authorize Full Access" }).click();
  await expect(p.getByText("Invitation sent")).toBeVisible({ timeout: 20_000 });
  await p.getByRole("button", { name: "Done" }).click();
  await expect(p.getByText(helper.email)).toBeVisible();
  const link = await inviteLink(helper.email, since);

  const cgCtx = await browser.newContext();
  await cookieSession(cgCtx, helper);
  const cg = await cgCtx.newPage();
  const calls = recordApiCalls(cg);
  await cg.goto(link);
  await cg.getByRole("button", { name: "Accept invitation" }).click();
  await expect(cg).toHaveURL(/\/dashboard\/caregiver/, { timeout: 20_000 });
  await cg.getByRole("button", { name: "Open John Taylor" }).click();
  await cg.goto("/dashboard/my-health");
  await expect(cg.getByText("You are caring for")).toBeVisible({
    timeout: 20_000,
  });
  await expect(
    cg.getByRole("button", { name: /add allergy/i }).first(),
  ).toBeVisible({ timeout: 20_000 });

  /* No caregiver management, no journal without its own grant. */
  await cg.goto("/dashboard/my-caregivers");
  await expect(cg).not.toHaveURL(/my-caregivers/, { timeout: 20_000 });
  const johnApi = await api(ACCOUNTS.john);
  const johnId = await johnApi.patientId();
  const journal = await cg.evaluate(
    async ([apiURL, id]) =>
      (
        await fetch(`${apiURL}/patients/${id}/journal`, {
          credentials: "include",
        })
      ).status,
    [env.apiURL, johnId] as const,
  );
  expect(journal).toBe(403);
  for (const c of calls.filter((x) => x.path.startsWith("/patients/")))
    expect(c.headers["x-organization-id"]).toBeUndefined();

  /* The patient revokes; the caregiver's next page shows no access. */
  await p.reload();
  await p.getByRole("button", { name: "Remove caregiver" }).first().click();
  await p
    .getByRole("dialog")
    .getByRole("button", { name: "Remove caregiver" })
    .click();
  await expect(p.getByText(helper.email)).toHaveCount(0, { timeout: 20_000 });
  /* The caregiver's next page (client-side, no reload): refused, and the
     page shows no access, never the data read before. */
  await cg.locator('a[href="/dashboard/my-health"]').first().click();
  await expect(
    cg.getByText("This has not been shared with you").first(),
  ).toBeVisible({ timeout: 20_000 });
  await cgCtx.close();
});

test("MEMBER re-test under a caregiver: switch clears the cache, closed area shows not shared @phase3", async ({
  asUser,
  api,
}) => {
  const john = await api(ACCOUNTS.john);
  const johnId = await john.patientId();
  const grace = await api(ACCOUNTS.grace);
  const graceId = await grace.patientId();
  const sarah = await api(ACCOUNTS.caregiver);
  const grants = (await sarah.context()).caregiving;
  const toJohn = grants.find((g) => g.patientId === johnId)!;
  const name = `Synthetic E2E ${Date.now().toString(36)}`;
  const made = await (
    await john.post(`/patients/${johnId}/allergies`, {
      name,
      type: "food",
      reaction: "Hives",
      severity: "mild",
    })
  ).json();
  /* John closes his profile area to Sarah for this test (custom map). */
  const full = (
    await (
      await john.get(`/patients/${johnId}/caregivers?status=ACTIVE`)
    ).json()
  ).data.find((g: { id: string }) => g.id === toJohn.grantId);
  try {
    const { page } = await asUser(ACCOUNTS.caregiver);
    const calls = recordApiCalls(page);
    await page.goto("/dashboard/caregiver");
    await page.getByRole("button", { name: "Open John Taylor" }).click();
    /* In-app navigation: the chosen patient is the in-memory portal
       context (a reload of a multi-patient caregiver lands on My Patients). */
    await page.locator('a[href="/dashboard/my-health"]').first().click();
    await expect(
      page.getByText(name).filter({ visible: true }).first(),
    ).toBeVisible({ timeout: 20_000 });

    /* Switch to Grace from the bar: John's data is gone, Grace's calls only. */
    const mark = calls.length;
    await page
      .getByRole("button", { name: /Switch/ })
      .first()
      .click();
    await page.getByRole("menuitemradio", { name: /Grace Taylor/ }).click();
    await expect(page.getByText("Grace Taylor").first()).toBeVisible();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(name)).toHaveCount(0);
    const after = calls
      .slice(mark)
      .filter((c) => c.path.startsWith("/patients/"));
    expect(after.length).toBeGreaterThan(0);
    for (const c of after)
      expect(c.path.startsWith(`/patients/${graceId}/`)).toBe(true);
    for (const c of calls)
      expect(c.headers["x-organization-id"]).toBeUndefined();
    /* Preferences stay the caregiver's own (/me), never the patient's. */
    expect(
      calls.some((c) => /\/patients\/[^/]+\/preferences/.test(c.path)),
    ).toBe(false);

    /* Without the area: John closes profile; Sarah's page says not shared. */
    expect(
      (
        await john.patch(`/patients/${johnId}/caregivers/${toJohn.grantId}`, {
          preset: "custom",
          permissions: { ...full.permissions, profile: 0 },
        })
      ).ok(),
    ).toBeTruthy();
    await page
      .getByRole("button", { name: /Switch/ })
      .first()
      .click();
    await page.getByRole("menuitemradio", { name: /John Taylor/ }).click();
    await expect(
      page.getByText("This has not been shared with you").first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(name)).toHaveCount(0);
  } finally {
    await john.patch(`/patients/${johnId}/caregivers/${toJohn.grantId}`, {
      preset: "full",
    });
    await john.delete(`/patients/${johnId}/allergies/${made.data.id}`);
  }
});

test("retired Phase 3 stores are purged and can't grant anything @phase3", async ({
  asUser,
}) => {
  const { page } = await asUser(ACCOUNTS.socialWorker);
  await page.goto("/dashboard/clinic");
  await page.evaluate(() => {
    localStorage.setItem(
      "nr:role-permissions",
      JSON.stringify({
        riverside: {
          permissions: { "Social Worker": ["staff.manage"] },
          custom: [],
        },
      }),
    );
    localStorage.setItem(
      "nr:staff-accounts",
      JSON.stringify([
        { id: "x", email: "legacy@example.test", password: "x" },
      ]),
    );
    localStorage.setItem(
      "nr:caregiver-grants",
      JSON.stringify({
        version: 4,
        state: { grants: [{ id: "cg-legacy", status: "active" }] },
      }),
    );
    localStorage.setItem(
      "nr:caregiver-viewing:caregiver@nephroreach.com",
      "user@nephroreach.com",
    );
  });
  await page.reload();
  await page.goto("/dashboard/clinic/team");
  /* The stored "Social Worker may manage staff" grants nothing. */
  await expect(page).not.toHaveURL(/\/team/, { timeout: 20_000 });
  await expect(page.getByRole("link", { name: "Staff & Roles" })).toHaveCount(
    0,
  );
  await noRetiredKeys(page);
});
