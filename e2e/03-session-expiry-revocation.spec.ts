/* Phase 2: session tiers, expiry and revocation (D2, spec 025).
   The UI expiry tests need a SESSION TEST API (E2E_SHORT_SESSIONS=true)
   started with short limits through env only (never by editing code):
     AUTH_MEMBER_SESSION_IDLE_TIMEOUT=40s   AUTH_MEMBER_SESSION_MAX_AGE=120s
     AUTH_STAFF_SESSION_IDLE_TIMEOUT=30s    AUTH_STAFF_SESSION_MAX_AGE=90s
     AUTH_PLATFORM_SESSION_IDLE_TIMEOUT=20s AUTH_PLATFORM_SESSION_MAX_AGE=60s
     JWT_ACCESS_EXPIRES_IN=15s */
import { ACCOUNTS, appOrigin, env } from "./fixtures/env";
import { HOME } from "./fixtures/session";
import { expect, requireEnv, test } from "./fixtures/test";

const SHORT = {
  member: { idle: 40, max: 120 },
  staff: { idle: 30, max: 90 },
  platform: { idle: 20, max: 60 },
};

test.describe("session tiers (API) @api", () => {
  for (const [who, tier] of [
    ["john", "member"],
    ["caregiver", "member"],
    ["clinic", "staff"],
    ["admin", "platform"],
  ] as const) {
    test(`${who} gets the ${tier} tier from GET /auth/session @phase2 @api`, async ({
      api,
    }) => {
      const c = await api(ACCOUNTS[who]);
      const r = await c.get("/auth/session");
      expect(r.ok()).toBeTruthy();
      const s = (await r.json()).data;
      expect(s.tier).toBe(tier);
      const want = env.shortSessions
        ? [SHORT[tier].idle, SHORT[tier].max]
        : {
            member: [1800, 43200],
            staff: [900, 28800],
            platform: [600, 14400],
          }[tier];
      expect([s.idleTimeoutSeconds, s.maxAgeSeconds]).toEqual(want);
    });
  }

  test("GET /auth/session is passive: reading it does not move the idle deadline @phase2 @api", async ({
    api,
  }) => {
    const c = await api(ACCOUNTS.grace);
    const first = (await (await c.get("/auth/session")).json()).data;
    await new Promise((r) => setTimeout(r, 2_000));
    const second = (await (await c.get("/auth/session")).json()).data;
    expect(second.idleExpiresAt).toBe(first.idleExpiresAt);
  });
});

test.describe("idle and absolute expiry (UI)", () => {
  test.beforeEach(() =>
    requireEnv(env.shortSessions, "needs the short-duration session test API"),
  );

  test("staff: idle warning appears before the limit, then the session ends -> /login?reason=expired @phase2", async ({
    asUser,
  }) => {
    test.setTimeout(3 * 60_000);
    const { page } = await asUser(ACCOUNTS.clinic);
    await page.goto("/dashboard/clinic");
    await expect(page).toHaveURL(HOME.clinic);
    const opened = Date.now();
    await expect(page.getByRole("dialog")).toBeVisible({
      timeout: SHORT.staff.idle * 1000,
    });
    expect(Date.now() - opened).toBeLessThan(SHORT.staff.idle * 1000);
    await expect(page).toHaveURL(/\/login\?reason=expired/, {
      timeout: (SHORT.staff.idle + 30) * 1000,
    });
  });

  test("staying active longer than the idle limit does NOT log out @phase2", async ({
    asUser,
  }) => {
    test.setTimeout(3 * 60_000);
    const { page } = await asUser(ACCOUNTS.john);
    await page.goto("/dashboard");
    /* Activity for 2x the idle limit, beyond the 15 s access token too:
       every visit makes authenticated calls (refresh on activity). */
    const until = Date.now() + SHORT.member.idle * 2000;
    const pages = ["/dashboard/personal-log", "/dashboard"];
    let i = 0;
    while (Date.now() < until) {
      await page.goto(pages[i++ % 2]);
      await expect(page).not.toHaveURL(/\/login/);
      await page.mouse.move(10 + (i % 50), 10);
      await page.keyboard.press("Shift");
      await page.waitForTimeout(8_000);
    }
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("the absolute limit ends an active session anyway @phase2", async ({
    asUser,
  }) => {
    test.setTimeout(4 * 60_000);
    const { page } = await asUser(ACCOUNTS.admin);
    await page.goto("/dashboard");
    const until = Date.now() + (SHORT.platform.max + 20) * 1000;
    while (Date.now() < until && !/\/login/.test(page.url())) {
      await page.goto("/dashboard").catch(() => undefined);
      await page.waitForTimeout(5_000);
    }
    await expect(page).toHaveURL(/\/login/);
  });

  test("a stale access cookie with no refresh cookie lands on login @phase2", async ({
    asUser,
  }) => {
    test.setTimeout(90_000);
    const { context, page } = await asUser(ACCOUNTS.john);
    const access = (await context.cookies()).find(
      (c) => c.name === "access_token",
    )!;
    await context.clearCookies();
    /* Keep the stale value but outlive the browser's own expiry. */
    await context.addCookies([{ ...access, expires: -1 }]);
    await page.waitForTimeout(20_000);
    await page.goto("/dashboard/personal-log");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("revocation", () => {
  test("revoking a session from another device ends it -> /login?reason=expired @phase2", async ({
    asUser,
    api,
  }) => {
    const { context, page } = await asUser(ACCOUNTS.grace);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(HOME.member);
    /* The browser's own session id: the list marks it current from the
       refresh cookie this context sends. */
    const mine = (
      await (
        await context.request.get(`${env.apiURL}/auth/sessions`, {
          headers: { Origin: appOrigin },
        })
      ).json()
    ).data as Array<{ id: string; current: boolean }>;
    const browserSession = mine.find((s) => s.current);
    expect(browserSession, "browser session is listed as current").toBeTruthy();
    /* Revoke it from another device (a separate bearer session). */
    const other = await api(ACCOUNTS.grace);
    expect(
      (await other.delete(`/auth/sessions/${browserSession!.id}`)).ok(),
    ).toBeTruthy();
    await page.goto("/dashboard/personal-log");
    await expect(page).toHaveURL(/\/login\?reason=expired/, {
      timeout: 15_000,
    });
  });

  test("a session ended by logout-all answers 401 session_no_longer_active @phase2 @api", async ({
    asUser,
  }) => {
    const { context } = await asUser(ACCOUNTS.grace);
    const headers = { Origin: appOrigin };
    const access = (await context.cookies()).find(
      (c) => c.name === "access_token",
    )!;
    expect(
      (
        await context.request.post(`${env.apiURL}/auth/logout-all`, {
          headers,
        })
      ).ok(),
    ).toBeTruthy();
    /* Replay the old access token: the session row is gone. */
    const r = await context.request.get(`${env.apiURL}/me/context`, {
      headers: { ...headers, Cookie: `access_token=${access.value}` },
    });
    expect(r.status()).toBe(401);
    expect((await r.json()).code).toBe("auth.session_no_longer_active");
  });
});
