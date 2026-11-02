/* UI sessions with the real httpOnly cookies.
   - loginViaUi(): drives /login (the journey under test).
   - cookieSession(): fast setup; POST /auth/login from the browser context's
     own request jar (no bearer header), so the context holds the same
     httpOnly cookies the UI would after a login. Cookies are host-scoped,
     so the cookies from localhost:31nn go with the app's API calls. */
import type { BrowserContext, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { appOrigin, env, type Account } from "./env";
import { pace } from "./throttle";
import { freshTotp } from "./totp";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";
/** The prototype's demo session cookie, retired in Phase 2. */
export const LEGACY_DEMO_COOKIE = "nr-session";

export async function cookieSession(
  context: BrowserContext,
  account: Account,
  opts: { totpSecret?: string } = {},
): Promise<void> {
  await pace("login");
  const res = await context.request.post(`${env.apiURL}/auth/login`, {
    data: { email: account.email, password: account.password },
    headers: { Origin: appOrigin },
  });
  expect(res.ok(), `login ${account.email}: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  expect(body.tokens, "cookie login put tokens in the body").toBeUndefined();
  if (body.challengeId) {
    if (!opts.totpSecret) throw new Error(`${account.email} has 2FA`);
    await pace("twofa");
    const v = await context.request.post(
      `${env.apiURL}/auth/2fa/challenge/verify`,
      {
        data: {
          challengeId: body.challengeId,
          type: "TOTP",
          code: await freshTotp(opts.totpSecret),
        },
        headers: { Origin: appOrigin },
      },
    );
    expect(v.ok(), `2FA verify: ${v.status()}`).toBeTruthy();
  }
  const names = (await context.cookies()).map((c) => c.name);
  expect(names).toContain(ACCESS_COOKIE);
}

/** The real login form (its selectors are unchanged since the prototype). */
export async function loginViaUi(
  page: Page,
  account: Pick<Account, "email" | "password">,
  path = "/login",
): Promise<void> {
  await pace("login");
  await page.goto(path);
  await page.locator("#login-email").fill(account.email);
  await page.locator("#login-password").fill(account.password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
}

/** Each role's home (frontend features/auth/auth.ts). */
export const HOME = {
  member: /\/dashboard\/?$/,
  clinic: /\/dashboard\/clinic\/?$/,
  access: /\/dashboard\/access-center\/?$/,
  nephrology: /\/dashboard\/clinic\/?$/,
  hospital: /\/dashboard\/hospital\/?$/,
  caregiver: /\/dashboard\/caregiver\/?$/,
  admin: /\/dashboard\/?$/,
} as const;

/** Forged cookies for the negative tests: an unsigned JWT-looking access
 *  cookie, and the prototype's demo cookie claiming admin. */
export async function setForgedCookies(context: BrowserContext): Promise<void> {
  const host = new URL(env.baseURL).hostname;
  await context.addCookies([
    {
      name: ACCESS_COOKIE,
      value: forgedJwt(),
      domain: host,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: LEGACY_DEMO_COOKIE,
      value: encodeURIComponent(
        JSON.stringify({
          role: "admin",
          email: "admin@nephroreach.com",
          name: "Forged",
        }),
      ),
      domain: host,
      path: "/",
    },
  ]);
}

function forgedJwt(): string {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "forged", role: "ADMIN", exp: 4102444800 })}.${"A".repeat(43)}`;
}
