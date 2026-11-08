/* Phase 2: logout across tabs.
   Sign-out = POST /auth/logout, caches cleared, "signed-out" broadcast on
   BroadcastChannel("nr-auth"), then the landing page (session-journeys.md
   §6). Another tab on a portal page reloads into the guard -> /login. */
import type { Page } from "@playwright/test";
import { ACCOUNTS, appOrigin, env } from "./fixtures/env";
import { HOME } from "./fixtures/session";
import { expect, test } from "./fixtures/test";

/** The existing "Log out" control (sidebar; protected UI, unchanged). */
async function signOut(page: Page) {
  /* The first-visit tour opens a modal over the page; close it. */
  const skip = page.getByRole("button", { name: /^skip tour$/i });
  if (
    await skip
      .waitFor({ state: "visible", timeout: 4_000 })
      .then(() => true)
      .catch(() => false)
  )
    await skip.click();
  await page
    .getByRole("button", { name: /^log out$/i })
    .first()
    .click();
}

test.describe("logout across tabs", () => {
  test("logout in tab A sends tab B to login and the server session is dead @phase2", async ({
    asUser,
    storageClean,
  }) => {
    const { context, page: tabA } = await asUser(ACCOUNTS.john);
    await tabA.goto("/dashboard");
    await expect(tabA).toHaveURL(HOME.member);
    const tabB = await context.newPage();
    await tabB.goto("/dashboard/personal-log");
    await expect(tabB).toHaveURL(/\/dashboard\/personal-log/);

    const logout = tabA.waitForRequest(
      (r) => r.url().endsWith("/auth/logout") && r.method() === "POST",
    );
    await signOut(tabA);
    await logout;
    await expect(tabA).not.toHaveURL(/\/dashboard/);
    await expect(tabB).toHaveURL(/\/login/, { timeout: 15_000 });

    await expect
      .poll(async () => (await context.cookies()).map((c) => c.name))
      .not.toContain("access_token");
    const r = await context.request.get(`${env.apiURL}/me/context`, {
      headers: { Origin: appOrigin },
    });
    expect(r.status()).toBe(401);
    await storageClean(tabA);
    await storageClean(tabB);
  });

  test("Back after logout shows no patient data @phase2", async ({
    asUser,
  }) => {
    const { page } = await asUser(ACCOUNTS.john);
    await page.goto("/dashboard");
    await expect(page.getByText(/John/).first()).toBeVisible();
    await signOut(page);
    await expect(page).not.toHaveURL(/\/dashboard/);
    await page.goBack();
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await expect(page.getByText("John Taylor")).toHaveCount(0);
  });

  test("a tab opened after logout cannot use the old session @phase2", async ({
    asUser,
  }) => {
    const { context, page } = await asUser(ACCOUNTS.grace);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(HOME.member);
    await signOut(page);
    await expect(page).not.toHaveURL(/\/dashboard/);
    const fresh = await context.newPage();
    await fresh.goto("/dashboard/personal-log");
    await expect(fresh).toHaveURL(/\/login/);
  });

  test("logout-all ends the session in a second browser @phase2", async ({
    asUser,
  }) => {
    const one = await asUser(ACCOUNTS.grace);
    const two = await asUser(ACCOUNTS.grace);
    await one.page.goto("/dashboard");
    await two.page.goto("/dashboard");
    await expect(two.page).toHaveURL(HOME.member);
    const r = await one.context.request.post(`${env.apiURL}/auth/logout-all`, {
      headers: { Origin: appOrigin },
    });
    expect(r.ok()).toBeTruthy();
    /* The app may already be leaving for /login when the reload starts (it
       notices the ended session first); that aborts the reload, which is fine:
       the expectation below is what matters. */
    await two.page.reload().catch(() => undefined);
    await expect(two.page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});
