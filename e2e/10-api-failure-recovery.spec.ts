/* Phase 2: API failure and recovery on a guarded page.
   ADR 0007: an error is not empty and not a sign-out. A failed /me/context
   read shows the guard's error state with "Try again"; lifting the failure
   and retrying renders the portal. A coded 401 ends the session. Later
   phases add their own pages (integration-design/e2e 10-*.spec.ts). */
import { ACCOUNTS } from "./fixtures/env";
import { failApi } from "./fixtures/network";
import { HOME } from "./fixtures/session";
import { expect, test } from "./fixtures/test";

const errorRegion = (page: import("@playwright/test").Page) =>
  page
    .getByRole("alert")
    .filter({ has: page.getByRole("button", { name: /try again/i }) });

test("/me/context 500 -> error state with retry, not a logout -> recovers @phase2", async ({
  asUser,
}) => {
  const { page, context } = await asUser(ACCOUNTS.john);
  const f = await failApi(
    page,
    /^\/me\/context$/,
    { kind: "status", status: 500 },
    "GET",
  );
  await page.goto("/dashboard");
  await expect(errorRegion(page).first()).toBeVisible({ timeout: 20_000 });
  expect(f.hits()).toBeGreaterThan(0);
  await expect(page).not.toHaveURL(/\/login/);
  expect((await context.cookies()).map((c) => c.name)).toContain(
    "access_token",
  );
  f.lift();
  await errorRegion(page)
    .first()
    .getByRole("button", { name: /try again/i })
    .click();
  await expect(errorRegion(page)).toHaveCount(0);
  await expect(page).toHaveURL(HOME.member);
  await expect(page.getByText(/John/).first()).toBeVisible();
});

test("/me/context offline -> error state, never a sign-out @phase2", async ({
  asUser,
}) => {
  const { page } = await asUser(ACCOUNTS.grace);
  const f = await failApi(page, /^\/me\/context$/, { kind: "offline" }, "GET");
  await page.goto("/dashboard");
  await expect(errorRegion(page).first()).toBeVisible({ timeout: 20_000 });
  await expect(page).not.toHaveURL(/\/login/);
  f.lift();
});

for (const code of [
  "auth.session_no_longer_active",
  "auth.account_no_longer_available",
]) {
  test(`a 401 ${code} ends the session -> /login?reason=expired @phase2`, async ({
    asUser,
  }) => {
    const { page } = await asUser(ACCOUNTS.john);
    await failApi(page, /^\/me\/context$/, {
      kind: "status",
      status: 401,
      code,
    });
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?reason=expired/, {
      timeout: 20_000,
    });
  });
}
