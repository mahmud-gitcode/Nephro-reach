/* Phase 2: sign-in and registration through the API.
   - every seeded role signs in through the real form and lands on its
     portal; the storage dump is clean after each;
   - a wrong password gets one generic message;
   - registration creates the account, verifies the email with the code
     from the local mail sink, sets up the patient record and lands on the
     member dashboard;
   - D6 (consent record) waits for BE-AUTH-2: fixme with the reason. */
import { ACCOUNTS, throwawayAccount, type Account } from "./fixtures/env";
import { extractOtp, mailMark, waitForMail } from "./fixtures/mail";
import { HOME, loginViaUi } from "./fixtures/session";
import { expect, test } from "./fixtures/test";

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

test.fixme("D6: registration records Terms and Privacy consent @phase2 @needs-d6", async () => {
  /* Waits for BE-AUTH-2 (spec 030): the API has no consent field yet and
       refuses unknown fields. The adapter is features/auth/consent.ts. */
});
