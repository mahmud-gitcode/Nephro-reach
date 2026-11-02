/* Phase 2: sign-in and registration through the API.
   - every seeded role signs in through the real form and lands on its
     portal; the storage dump is clean after each;
   - a wrong password gets one generic message;
   - registration creates the account, verifies the email with the code
     from the local mail sink, sets up the patient record and lands on the
     member dashboard;
   - D6: registration records the Terms and Privacy consent (spec 030), and
     a sign-up without it is refused with the server's message. */
import { ApiClient, currentConsent, json } from "./fixtures/api";
import { ACCOUNTS, env, throwawayAccount, type Account } from "./fixtures/env";
import { extractOtp, mailMark, waitForMail } from "./fixtures/mail";
import { HOME, loginViaUi } from "./fixtures/session";
import { expect, test } from "./fixtures/test";
import { pace } from "./fixtures/throttle";

const ROLES: Array<[string, Account, RegExp]> = [
  ["patient John", ACCOUNTS.john, HOME.member],
  ["patient Grace", ACCOUNTS.grace, HOME.member],
  ["caregiver", ACCOUNTS.caregiver, HOME.caregiver],
  ["dialysis center owner", ACCOUNTS.clinic, HOME.clinic],
  ["access center owner", ACCOUNTS.access, HOME.access],
  ["nephrology office owner", ACCOUNTS.nephrology, HOME.nephrology],
  ["hospital owner", ACCOUNTS.hospital, HOME.hospital],
  ["platform admin", ACCOUNTS.admin, HOME.admin],
  ["staff member (Social Worker)", ACCOUNTS.socialWorker, HOME.clinic],
];

test.describe("every seeded role signs in through the API", () => {
  for (const [label, account, home] of ROLES) {
    test(`${label} lands on its portal @phase2`, async ({
      page,
      storageClean,
    }) => {
      await loginViaUi(page, account);
      await expect(page).toHaveURL(home, { timeout: 20_000 });
      /* The portal rendered (not the guard's holding screen). */
      await expect(page.getByText("Loading...")).toHaveCount(0, {
        timeout: 20_000,
      });
      await storageClean(page);
    });
  }
});

test("a wrong password gets one generic message and no session @phase2", async ({
  page,
  context,
}) => {
  await loginViaUi(page, {
    email: ACCOUNTS.john.email,
    password: "wrong-pass",
  });
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
  const names = (await context.cookies()).map((c) => c.name);
  expect(names).not.toContain("access_token");
});

test("registration, email code, patient setup, dashboard @phase2 @needs-mail", async ({
  page,
  storageClean,
}) => {
  const account = throwawayAccount("reg");
  const since = mailMark();
  await page.goto("/registration");
  await page.locator("#full-name").fill(account.name);
  await page.locator("#email").fill(account.email);
  await page.locator("#password").fill(account.password);
  await page.locator("#confirm-password").fill(account.password);
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: /^sign up$/i }).click();

  await expect(page).toHaveURL(/\/verify-email/, { timeout: 20_000 });
  const mail = await waitForMail(account.email, { since });
  await page.getByLabel("Code").fill(extractOtp(mail));
  await page.getByRole("button", { name: "Verify email" }).click();

  await expect(page).toHaveURL(/\/setup\/patient/, { timeout: 20_000 });
  await page.getByLabel("Last name").fill("Example");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page).toHaveURL(HOME.member, { timeout: 20_000 });
  await storageClean(page, { forbidStrings: [account.password] });
});

test("registration refuses an email already in use @phase2", async ({
  page,
}) => {
  await page.goto("/registration");
  await page.locator("#full-name").fill("Someone");
  await page.locator("#email").fill(ACCOUNTS.john.email);
  await page.locator("#password").fill("Another-pass-1");
  await page.locator("#confirm-password").fill("Another-pass-1");
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: /^sign up$/i }).click();
  await expect(page.getByText(/already registered/i)).toBeVisible();
  await expect(page).toHaveURL(/\/registration/);
});

test("D6: registration records Terms and Privacy consent @phase3 @needs-mail", async ({
  page,
  api,
}) => {
  test.setTimeout(240_000);
  const account = throwawayAccount("consent");
  const expected = await currentConsent();
  const since = mailMark();
  let sent: unknown = null;
  page.on("request", (req) => {
    if (req.method() === "POST" && req.url().endsWith("/auth/register"))
      sent = req.postDataJSON();
  });
  await pace("register");
  await page.goto("/registration");
  await page.locator("#full-name").fill(account.name);
  await page.locator("#email").fill(account.email);
  await page.locator("#password").fill(account.password);
  await page.locator("#confirm-password").fill(account.password);
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: /^sign up$/i }).click();
  await expect(page).toHaveURL(/\/verify-email/, { timeout: 20_000 });

  /* The body carried the current versions and no bundled marketing choice. */
  expect((sent as { consent?: unknown } | null)?.consent).toEqual(expected);

  /* /me routes need a verified account: verify with the sink's code. */
  const mail = await waitForMail(account.email, { since });
  await page.getByLabel("Code").fill(extractOtp(mail));
  await page.getByRole("button", { name: "Verify email" }).click();
  await expect(page).toHaveURL(/\/setup\/patient/, { timeout: 20_000 });

  /* The server kept the record: both documents, source register. A 429
     from the per-IP sign-in throttle is waited out. */
  let client: ApiClient | null = null;
  for (let attempt = 0; attempt < 3 && !client; attempt++) {
    try {
      client = await api(account);
    } catch (cause) {
      if (!String(cause).includes("HTTP 429") || attempt === 2) throw cause;
      await new Promise((r) => setTimeout(r, 61_000));
    }
  }
  if (!client) throw new Error("no session for the new account");
  const consents = (await json(await client.get("/me/consents"), "consents"))
    .data as {
    records: Array<{
      documentType: string;
      documentVersion: string;
      source: string;
    }>;
    outstanding: unknown[];
    marketing: { optedIn: boolean } | null;
  };
  const kept = consents.records
    .map((r) => `${r.documentType}@${r.documentVersion}/${r.source}`)
    .sort();
  expect(kept).toEqual([
    `PRIVACY@${expected.privacyVersion}/register`,
    `TERMS@${expected.termsVersion}/register`,
  ]);
  expect(consents.outstanding).toEqual([]);
  expect(consents.marketing?.optedIn ?? false).toBe(false);
});

test("D6: a sign-up without consent is refused with the server's message and no account @phase3", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const account = throwawayAccount("noconsent");
  /* The page never sends a sign-up without the box ticked, so strip the
     consent on the wire to see what the server does with one. */
  await page.route("**/auth/register", async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;
    delete body.consent;
    await route.continue({ postData: JSON.stringify(body) });
  });
  await pace("register");
  await page.goto("/registration");
  await page.locator("#full-name").fill(account.name);
  await page.locator("#email").fill(account.email);
  await page.locator("#password").fill(account.password);
  await page.locator("#confirm-password").fill(account.password);
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: /^sign up$/i }).click();
  await expect(
    page.getByText(
      "Accept the Terms of Service and Privacy Notice to create your account.",
    ),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/registration/);

  /* No account was created: the same email can't sign in (a 429 from the
     per-IP sign-in throttle is waited out, never read as an answer). */
  const anon = await ApiClient.anonymous();
  try {
    let status = 429;
    for (let attempt = 0; attempt < 3 && status === 429; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 61_000));
      await pace("login");
      const res = await anon.ctx.post(`${env.apiURL}/auth/login`, {
        headers: { "X-Auth-Transport": "bearer" },
        data: { email: account.email, password: account.password },
      });
      status = res.status();
    }
    expect(status).toBe(401);
  } finally {
    await anon.dispose();
  }
});
