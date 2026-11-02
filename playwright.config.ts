/* =============================================================================
   NephroReach Playwright config (DRAFT, E2E-DESIGN, 2026-11-02)
   QA-E2E moves this to Nephro-reach-frontend/playwright.config.ts.

   - Runs ONLY against an isolated agent env (API 31nn, frontend 41nn, SMTP
     sink 25nn). It refuses the user's dev ports 3000/4000 and any non-local
     host, so a run can never touch the dev DB or a real service.
   - One worker: every test in an env shares one database, one Redis index and
     the per-IP login throttle (10/min, auth-session.controller.ts:103 on
     int/w2-be-auth), so tests run serially per env. Parallelism = more envs.
   - Chromium only (decided for this project).
   - Phase gating: E2E_MAX_PHASE=N runs @phase0..@phaseN tags only; or pass
     --grep yourself. @api tests drive only the API and can run before the UI
     phase lands.
   ========================================================================== */
import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "";
const API_URL = process.env.E2E_API_URL ?? "";

function assertIsolatedEnv(name: string, value: string): void {
  if (!value) throw new Error(`${name} is required (see e2e/README.md).`);
  const u = new URL(value);
  if (!["localhost", "127.0.0.1"].includes(u.hostname)) {
    throw new Error(`${name} must be a local agent env, got ${u.hostname}.`);
  }
  // 3000/4000 are the user's own dev API/frontend holding the `nephroreach` DB.
  if (["3000", "4000", ""].includes(u.port)) {
    throw new Error(
      `${name} must use an agent port (31nn/41nn), never ${u.port || "80"}.`,
    );
  }
}
assertIsolatedEnv("E2E_BASE_URL", BASE_URL);
assertIsolatedEnv("E2E_API_URL", API_URL);

/** E2E_MAX_PHASE=3 -> /@phase(0|1|2|3)\b/ */
function phaseGrep(): RegExp | undefined {
  const raw = process.env.E2E_MAX_PHASE;
  if (!raw) return undefined;
  const max = Number(raw);
  if (!Number.isInteger(max) || max < 0 || max > 15) {
    throw new Error("E2E_MAX_PHASE must be an integer 0..15");
  }
  const phases = Array.from({ length: max + 1 }, (_, i) => i).join("|");
  return new RegExp(`@phase(${phases})\\b`);
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.spec\.ts$/,
  // Vitest only picks up src/**/*.test.*; keep these names *.spec.ts in e2e/.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 60_000,
  expect: { timeout: 10_000 },
  grep: phaseGrep(),
  // @needs-* tags mark tests that need something the env may not have
  // (see README "What each tag needs"); skip them explicitly with --grep-invert.
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder: process.env.E2E_REPORT_DIR ?? "playwright-report",
      },
    ],
  ],
  outputDir: process.env.E2E_OUTPUT_DIR ?? "test-results",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    // No real browser state leaks in or out.
    storageState: undefined,
    locale: "en-US",
    timezoneId: "America/New_York",
    // Service workers could bypass page.route interception.
    serviceWorkers: "block",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Defence in depth on top of the per-context route block in
        // fixtures/network.ts: map every non-local host to nowhere.
        launchOptions: {
          args: [
            "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1",
            "--disable-background-networking",
            "--disable-component-update",
            "--disable-domain-reliability",
            "--no-pings",
          ],
        },
      },
    },
  ],
  // No webServer block: the agent's stack is started by integration-tools
  // (README "Running an agent's stack"); the suite never starts servers.
});
