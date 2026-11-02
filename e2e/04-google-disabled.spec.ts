/* Phase 2: Google sign-in while it is disabled (D5-G).
   No Google credentials exist yet, so GET /auth/providers says google:false;
   the button and its "Or" divider are hidden and no Google script is ever
   requested. The enabled path against a local fake issuer belongs to a
   later run (integration-design/e2e/e2e/04-google-oauth.spec.ts). */
import { ApiClient } from "./fixtures/api";
import { appOrigin } from "./fixtures/env";
import { expect, test } from "./fixtures/test";
import { pace } from "./fixtures/throttle";

test("GET /auth/providers says google:false and the oauth route refuses @phase2 @api", async () => {
  const anon = await ApiClient.anonymous();
  try {
    const p = (await (await anon.get("/auth/providers")).json()).data;
    expect(p).toEqual({ google: false, apple: false });
    await pace("google");
    const r = await anon.post("/auth/oauth/google", {
      idToken: "x".repeat(40),
    });
    expect(r.status()).toBe(400);
    expect(JSON.stringify(await r.json())).toMatch(/oauth_not_configured/);
  } finally {
    await anon.dispose();
  }
});

test("login and registration hide the Google button and never contact Google @phase2", async ({
  page,
  blocked,
}) => {
  const requested: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.origin !== appOrigin) requested.push(u.host);
  });
  for (const path of ["/login", "/registration"]) {
    await page.goto(path);
    await expect(page.locator("form").first()).toBeVisible();
    /* Let the providers read settle. */
    await page.waitForTimeout(2_000);
    await expect(page.getByRole("button", { name: /google/i })).toHaveCount(0);
    await expect(page.getByText(/google/i)).toHaveCount(0);
  }
  expect(requested.filter((h) => /google|gstatic/.test(h))).toEqual([]);
  expect(blocked.filter((u) => /google|gstatic/.test(u))).toEqual([]);
});
