/* Phase 2: MFA enrolment and verification (D17).
   - Sign-in with 2FA: the API puts { challengeId, methods } at the response
     root; the UI asks for the code on /two-factor.
   - Negatives on THROWAWAY accounts (never a seeded one, a lock would block
     the rest of the run): TOTP replay refused, 5 wrong codes kill the
     challenge, a backup code works once.
   - Forced enrolment: a test API with AUTH_REQUIRE_STAFF_MFA=true
     (E2E_STAFF_MFA=true) sends staff without 2FA to /setup/mfa, and the API
     refuses patient data until they enrol. */
import { ApiClient, json, registerViaApi } from "./fixtures/api";
import { appOrigin, env, throwawayAccount } from "./fixtures/env";
import { extractOtp, mailMark, waitForMail } from "./fixtures/mail";
import { ACCOUNTS } from "./fixtures/env";
import { HOME, loginViaUi } from "./fixtures/session";
import { expect, requireEnv, test } from "./fixtures/test";
import { pace } from "./fixtures/throttle";
import { freshTotp } from "./fixtures/totp";

/** Register a throwaway member, verify the email from the sink, create
 *  the patient record, enrol TOTP behind sudo. Returns the secret. */
async function throwawayWithTotp(tag: string) {
  const account = throwawayAccount(tag);
  const since = mailMark();
  expect((await registerViaApi(account)).status()).toBeLessThan(300);
  const c = await ApiClient.login(account);
  const mail = await waitForMail(account.email, { since });
  await json(
    await c.post("/auth/email/verify/confirm", { code: extractOtp(mail) }),
    "verify email",
  );
  await c.sudoPassword();
  const enrol = (
    await json(await c.post("/auth/2fa/enroll/totp"), "enroll totp")
  ).data as { secret: string };
  expect(enrol.secret).toMatch(/^[A-Z2-7]+=*$/);
  const conf = (
    await json(
      await c.post("/auth/2fa/enroll/totp/confirm", {
        code: await freshTotp(enrol.secret),
      }),
      "confirm totp",
    )
  ).data as { backupCodes?: string[] };
  expect(conf.backupCodes?.length ?? 0).toBeGreaterThan(0);
  await c.dispose();
  return { account, secret: enrol.secret, backupCodes: conf.backupCodes! };
}

async function challengeFor(anon: ApiClient, email: string, password: string) {
  await pace("login");
  const r = await anon.post("/auth/login", { email, password });
  const body = (await json(r, "login")) as { challengeId?: string };
  expect(body.challengeId, "login answered a 2FA challenge").toBeTruthy();
  return body.challengeId!;
}

async function verify(anon: ApiClient, challengeId: string, code: string) {
  await pace("twofa");
  return anon.ctx.post(`${env.apiURL}/auth/2fa/challenge/verify`, {
    headers: { "X-Auth-Transport": "bearer", Origin: appOrigin },
    data: { challengeId, type: "TOTP", code },
  });
}

test.describe.serial("MFA with a throwaway member @needs-mail", () => {
  let t: Awaited<ReturnType<typeof throwawayWithTotp>>;
  test.beforeAll(async () => {
    test.setTimeout(120_000);
    t = await throwawayWithTotp("mfa");
  });

  test("UI: password then the TOTP challenge lands on the member portal @phase2", async ({
    page,
    storageClean,
  }) => {
    await loginViaUi(page, t.account);
    await expect(page).toHaveURL(/\/two-factor/);
    /* A fresh step: the enrolment confirm used the current one. */
    await page
      .getByLabel(/code/i)
      .first()
      .fill(await freshTotp(t.secret));
    await page
      .getByRole("button", { name: /verify|continue|sign in/i })
      .click();
    await expect(page).toHaveURL(/\/dashboard|\/setup\/patient/, {
      timeout: 20_000,
    });
    await storageClean(page, {
      forbidStrings: [t.secret, t.account.password, ...t.backupCodes],
    });
  });

  test("a TOTP code is refused the second time (replay) @phase2 @api", async () => {
    const anon = await ApiClient.anonymous();
    const code = await freshTotp(t.secret);
    const first = await verify(
      anon,
      await challengeFor(anon, t.account.email, t.account.password),
      code,
    );
    expect(first.status()).toBe(200);
    const second = await verify(
      anon,
      await challengeFor(anon, t.account.email, t.account.password),
      code,
    );
    expect(second.status()).toBe(401);
    await anon.dispose();
  });

  test("5 wrong codes lock the challenge: even the right code then fails @phase2 @api", async () => {
    const anon = await ApiClient.anonymous();
    const id = await challengeFor(anon, t.account.email, t.account.password);
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++)
      statuses.push((await verify(anon, id, "000000")).status());
    expect(statuses.every((s) => s >= 400 && s < 500)).toBeTruthy();
    const right = await verify(anon, id, await freshTotp(t.secret));
    expect(right.ok()).toBeFalsy();
    expect((await right.json()).code).toMatch(/locked|invalid_or_expired/);
    await anon.dispose();
  });

  test("a backup code works once @phase2 @api", async () => {
    const anon = await ApiClient.anonymous();
    const code = t.backupCodes[0];
    const first = await verify(
      anon,
      await challengeFor(anon, t.account.email, t.account.password),
      code,
    );
    expect(first.status()).toBe(200);
    const again = await verify(
      anon,
      await challengeFor(anon, t.account.email, t.account.password),
      code,
    );
    expect(again.status()).toBe(401);
    await anon.dispose();
  });
});

test.describe("forced enrolment for staff (AUTH_REQUIRE_STAFF_MFA=true)", () => {
  test.beforeEach(() =>
    requireEnv(
      process.env.E2E_STAFF_MFA === "true",
      "needs a test API with AUTH_REQUIRE_STAFF_MFA=true",
    ),
  );

  test("staff without MFA land on enrolment and the API refuses patient data @phase2", async ({
    page,
    context,
    storageClean,
  }) => {
    await loginViaUi(page, ACCOUNTS.socialWorker);
    await expect(page).toHaveURL(/\/setup\/mfa/, { timeout: 20_000 });
    /* A direct URL to a portal page is sent back to enrolment. */
    await page.goto("/dashboard/clinic/members");
    await expect(page).toHaveURL(/\/setup\/mfa/, { timeout: 20_000 });
    await expect(page.getByText(/John Taylor|Grace Taylor/)).toHaveCount(0);

    const me = await (
      await context.request.get(`${env.apiURL}/me/context`, {
        headers: { Origin: appOrigin },
      })
    ).json();
    expect(me.data.user.mfaSetupRequired).toBe(true);
    const orgId = me.data.memberships[0].organizationId as string;
    const r = await context.request.get(
      `${env.apiURL}/organizations/${orgId}/patients`,
      { headers: { Origin: appOrigin, "X-Organization-Id": orgId } },
    );
    expect(r.status()).toBe(403);
    expect((await r.json()).code).toBe("access.mfa_required");
    await storageClean(page);
  });

  test("a patient is not forced to enrol @phase2", async ({ page }) => {
    await loginViaUi(page, ACCOUNTS.grace);
    await expect(page).toHaveURL(HOME.member, { timeout: 20_000 });
  });
});
