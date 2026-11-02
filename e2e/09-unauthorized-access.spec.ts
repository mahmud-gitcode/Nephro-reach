/* Phase 2: unauthorized access (the Phase 2 subset).
   - Direct URLs to other portals bounce to the role's home (the UI guard is
     only a hint; the API refuses either way).
   - Forged cookies grant nothing: an unsigned JWT-looking access cookie and
     the retired demo `nr-session` cookie claiming admin (INT-2).
   - Signed out, every portal URL goes to /login with `next`.
   - A cookie-authenticated state change from a foreign Origin is refused. */
import { ACCOUNTS, appOrigin, env } from "./fixtures/env";
import { blockThirdParty, recordApiCalls } from "./fixtures/network";
import { HOME, LEGACY_DEMO_COOKIE, setForgedCookies } from "./fixtures/session";
import { expect, test } from "./fixtures/test";

const PROBES: Array<[keyof typeof ACCOUNTS, RegExp, string[]]> = [
  [
    "john",
    HOME.member,
    [
      "/dashboard/clinic",
      "/dashboard/access-center",
      "/dashboard/hospital",
      "/dashboard/caregiver",
    ],
  ],
  [
    "clinic",
    HOME.clinic,
    [
      "/dashboard/access-center",
      "/dashboard/hospital",
      "/dashboard/personal-log",
    ],
  ],
  [
    "access",
    HOME.access,
    ["/dashboard/clinic", "/dashboard/hospital/patients"],
  ],
];

test.describe("direct URLs to other portals", () => {
  for (const [who, home, paths] of PROBES) {
    test(`${who} is sent home from other portals @phase2`, async ({
      asUser,
    }) => {
      const { page } = await asUser(ACCOUNTS[who]);
      for (const p of paths) {
        await page.goto(p);
        await expect(page, `${who} -> ${p}`).toHaveURL(home, {
          timeout: 15_000,
        });
      }
    });
  }
});

test("signed out, portal URLs go to /login with next @phase2", async ({
  page,
}) => {
  for (const p of [
    "/dashboard",
    "/dashboard/clinic",
    "/dashboard/personal-log",
  ]) {
    await page.goto(p);
    await expect(page).toHaveURL(
      new RegExp(`/login\\?next=${encodeURIComponent(p)}$`),
    );
  }
});

test("a forged access cookie and a forged nr-session claiming admin grant nothing @phase2", async ({
  browser,
  blocked,
}) => {
  const context = await browser.newContext();
  await blockThirdParty(context, blocked);
  await setForgedCookies(context);
  const page = await context.newPage();
  const calls = recordApiCalls(page);
  for (const p of ["/dashboard", "/dashboard/clinic"]) {
    await page.goto(p);
    await expect(page, p).toHaveURL(/\/login/, { timeout: 15_000 });
  }
  const r = await context.request.get(`${env.apiURL}/me/context`, {
    headers: { Origin: appOrigin },
  });
  expect(r.status()).toBe(401);
  expect(calls.filter((c) => c.path.includes("/patients"))).toEqual([]);
  /* The proxy expires the retired demo cookie. */
  const left = (await context.cookies()).map((c) => c.name);
  expect(left).not.toContain(LEGACY_DEMO_COOKIE);
  await context.close();
});

test("editing nr-session while signed in as John unlocks nothing (INT-2) @phase2", async ({
  asUser,
}) => {
  const { context, page } = await asUser(ACCOUNTS.john);
  await context.addCookies([
    {
      name: LEGACY_DEMO_COOKIE,
      value: encodeURIComponent(JSON.stringify({ role: "admin" })),
      url: env.baseURL,
    },
  ]);
  await page.goto("/dashboard/clinic");
  await expect(page).toHaveURL(HOME.member, { timeout: 15_000 });
});

test("a cookie-authenticated state change from a foreign Origin is refused @phase2 @api", async ({
  asUser,
}) => {
  const { context } = await asUser(ACCOUNTS.john);
  const r = await context.request.post(`${env.apiURL}/auth/logout-all`, {
    headers: { Origin: "http://evil.localhost:9" },
  });
  expect(r.status()).toBe(403);
  /* And the session is still alive. */
  const me = await context.request.get(`${env.apiURL}/me/context`, {
    headers: { Origin: appOrigin },
  });
  expect(me.status()).toBe(200);
});
