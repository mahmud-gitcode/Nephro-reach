/* Network guard and API failure injection.
   - Every request to a host other than the app/API origins is ABORTED and
     recorded; a test fails if any was attempted (D18: nothing third-party
     without disclosure). Allow-list additions need the Lead's sign-off.
   - failApi(): route interception to simulate 500 / offline / 403 on chosen
     API paths, then lift it to test "retry recovers". */
import type { BrowserContext, Page, Route } from "@playwright/test";
import { apiOrigin, appOrigin, env } from "./env";

export type BlockedLog = string[];

export async function blockThirdParty(
  context: BrowserContext,
  log: BlockedLog,
): Promise<void> {
  const allowed = new Set([appOrigin, apiOrigin]);
  if (env.fakeIssuerPort) allowed.add(`http://127.0.0.1:${env.fakeIssuerPort}`);
  await context.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith("data:") || url.startsWith("blob:"))
      return route.continue();
    let origin: string;
    try {
      origin = new URL(url).origin;
    } catch {
      return route.abort("blockedbyclient");
    }
    if (allowed.has(origin)) return route.continue();
    log.push(url);
    return route.abort("blockedbyclient");
  });
}

type Failure =
  | { kind: "status"; status: number; code?: string; message?: string }
  | { kind: "offline" }
  | { kind: "slow"; ms: number };

/**
 * Fail API calls whose path matches. Returns a function that lifts the
 * failure (later calls go through), for the retry half of the journey.
 * Match on the API path WITHOUT the /api/v1 prefix, e.g. /patients\/[^/]+\/blood-pressure/.
 */
export async function failApi(
  page: Page,
  pathPattern: RegExp,
  failure: Failure,
  method?: string,
) {
  let active = true;
  let hits = 0;
  const matcher = (url: URL) =>
    url.origin === apiOrigin &&
    pathPattern.test(url.pathname.replace(/^\/api\/v1/, ""));
  const handler = async (route: Route) => {
    if (!active || (method && route.request().method() !== method))
      return route.fallback();
    hits++;
    if (failure.kind === "offline") return route.abort("internetdisconnected");
    if (failure.kind === "slow") {
      await new Promise((r) => setTimeout(r, failure.ms));
      return route.fallback();
    }
    // Same envelope the API uses for errors (backend specs/019 §4).
    return route.fulfill({
      status: failure.status,
      contentType: "application/json",
      headers: {
        "access-control-allow-origin": appOrigin,
        "access-control-allow-credentials": "true",
      },
      body: JSON.stringify({
        success: false,
        statusCode: failure.status,
        message: failure.message ?? "Injected failure (E2E)",
        code: failure.code ?? null,
        data: null,
      }),
    });
  };
  await page.route(matcher, handler);
  return {
    lift: () => {
      active = false;
    },
    hits: () => hits,
  };
}

/** Collect every API request a page makes (to assert headers, e.g. no X-Organization-Id on caregiver calls). */
export function recordApiCalls(page: Page) {
  const calls: Array<{
    method: string;
    path: string;
    headers: Record<string, string>;
  }> = [];
  page.on("request", (req) => {
    const u = new URL(req.url());
    if (u.origin !== apiOrigin) return;
    calls.push({
      method: req.method(),
      path: u.pathname.replace(/^\/api\/v1/, ""),
      headers: req.headers(),
    });
  });
  return calls;
}
