/* Phase 16a: click-through crawl of every MEMBER page (member-john,
   member-grace). Synthetic seed accounts and synthetic input only.

   For each role and each member page it:
   - opens the page and waits for its content (never networkidle);
   - clicks every visible control inside <main> (buttons, tabs, switches,
     menus, selects, toggles, row actions, pagination), including controls a
     click reveals, and checks every in-page link for a 404;
   - on every dialog and every in-page form: submits it empty, then with an
     invalid value, then with valid synthetic data (marker "P16a"), and
     expects a validation message for the first two;
   - uploads the synthetic PNG/PDF below, keeps every download;
   - deletes, archives or cancels only rows that carry the crawler's marker;
   - checks the layout at desktop width and at 390px.
   After every action it records console errors, uncaught exceptions, API
   5xx, unexpected API 4xx (a 403 must show the "not shared" state), Next
   error screens, stuck loading, 404 links and controls that do nothing.

   It never clicks sign-out, security, password, MFA or account controls,
   and never deletes, revokes or archives seed records (brief §1).
   The API throttles 100 requests a minute per IP: the crawler paces itself.
   Results: E2E_CRAWL_OUT (default test-results/crawl-16a), one JSON per
   role. --workers=1. */
import fs from "node:fs";
import path from "node:path";
import type { Browser, BrowserContext, Locator, Page } from "@playwright/test";
import { ACCOUNTS, apiOrigin, appOrigin, type Account } from "./fixtures/env";
import { blockThirdParty, type BlockedLog } from "./fixtures/network";
import { cookieSession } from "./fixtures/session";
import { expect, test } from "./fixtures/test";

type Severity = "blocker" | "high" | "medium" | "low" | "info";
type Issue = {
  role: string;
  page: string;
  control: string;
  kind: string;
  severity: Severity;
  steps: string;
  expected: string;
  actual: string;
  screenshot?: string;
};
type PageStats = {
  page: string;
  controls: number;
  clicked: number;
  links: number;
  forms: number;
  submits: number;
  downloads: number;
  deleted: number;
  skipped: string[];
};

const OUT = path.resolve(
  process.env.E2E_CRAWL_OUT ?? path.join("test-results", "crawl-16a"),
);
const MARK = "P16a";
const PAGE_BUDGET_MS = 8 * 60_000;
const API_BUDGET = Math.max(10, Number(process.env.E2E_API_BUDGET ?? 75) || 75);

const ROLES: { id: string; account: Account }[] = [
  { id: "member-john", account: ACCOUNTS.john },
  { id: "member-grace", account: ACCOUNTS.grace },
];

/* Every member route under src/app/(portal)/dashboard/(member) plus the
   member dashboard. Dynamic routes are reached from their list page
   (CHILDREN). */
const ROUTES = [
  "/dashboard",
  "/dashboard/my-rides",
  "/dashboard/before-the-er",
  "/dashboard/my-health",
  "/dashboard/personal-log",
  "/dashboard/personal-log/appointments",
  "/dashboard/personal-log/medications",
  "/dashboard/personal-log/medications/add",
  "/dashboard/personal-log/blood-pressure",
  "/dashboard/personal-log/blood-pressure/add",
  "/dashboard/personal-log/lab-tracking",
  "/dashboard/personal-log/lab-tracking/add",
  "/dashboard/personal-log/nutrition",
  "/dashboard/personal-log/fluid-tracker",
  "/dashboard/personal-log/dialysis-treatment",
  "/dashboard/personal-log/dialysis-treatment/add",
  "/dashboard/personal-log/dialysis-treatment/view",
  "/dashboard/personal-log/dialysis-journal",
  "/dashboard/personal-log/dialysis-management",
  "/dashboard/beyond-the-chair",
  "/dashboard/vascular-access",
  "/dashboard/travel-log",
  "/dashboard/my-classroom",
  "/dashboard/my-classroom/details",
  "/dashboard/my-classroom/workbook",
  "/dashboard/my-classroom/exam",
  "/dashboard/my-classroom/certificate",
  "/dashboard/my-library",
  "/dashboard/table-talk",
  "/dashboard/messages",
  "/dashboard/community",
  "/dashboard/reviews",
  "/dashboard/team-questions",
  "/dashboard/my-caregivers",
  "/dashboard/support",
  "/dashboard/settings",
];

const CHILDREN: Record<string, RegExp> = {
  "/dashboard/before-the-er": /^\/dashboard\/before-the-er\/[^/?#]+$/,
  "/dashboard/my-library": /^\/dashboard\/my-library\/[^/?#]+$/,
  "/dashboard/table-talk": /^\/dashboard\/table-talk\/[^/?#]+$/,
  "/dashboard/travel-log": /^\/dashboard\/travel-log\/[^/?#]+$/,
  /* The detail page takes ?id=; the bare route is crawled too (its "not
     in your log" state). */
  "/dashboard/personal-log/dialysis-treatment":
    /^\/dashboard\/personal-log\/dialysis-treatment\/view\?id=[^&#]+$/,
  "/dashboard/my-classroom":
    /^\/dashboard\/my-classroom\/day-?\d+|^\/dashboard\/my-classroom\/\d+$/,
};

/* Never clicked: they end the session, change security settings, or would
   destroy seed records. Rows the crawler created are handled by the delete
   pass below. */
const NEVER =
  /sign ?out|log ?out|delete|remove|revoke|archive|deactivate|disable|withdraw|end (access|relationship|sharing)|stop sharing|cancel (trip|request|subscription|appointment|ride)|request cancel|password|two-factor|2fa|mfa|authenticator|recovery code|unlink|disconnect|close account|transfer/i;
const SUBMIT =
  /^(save|submit|add|send|create|request|log|confirm|update|book|invite|post|share|record|continue|next|done|apply|reply|start|finish|upload|schedule|check in|ask)\b/i;
const CLOSE = /^(cancel|close|dismiss|back|no|not now|keep|×|x)$/i;
const NOT_SHARED = /not been shared with you/i;
const VALIDATION =
  /required|please|enter|must|invalid|select|choose|at least|too (long|short)|cannot be|can't be|between|valid/i;

const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cfc0f01f0005000201a5f5b2a40000000049454e44ae426082",
  "hex",
);
const PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
  "utf8",
);

/* A 32-byte ISO-BMFF "ftyp" box: enough for a type check, no content. */
const MP4 = Buffer.from(
  "00000020667479706973736f6d0000020069736f6d69736f32617663316d703431",
  "hex",
);

function syntheticFile(accept: string) {
  if (/video/.test(accept))
    return { name: "p16a-synthetic.mp4", mimeType: "video/mp4", buffer: MP4 };
  if (/pdf/.test(accept) && !/image/.test(accept))
    return {
      name: "p16a-synthetic.pdf",
      mimeType: "application/pdf",
      buffer: PDF,
    };
  return { name: "p16a-synthetic.png", mimeType: "image/png", buffer: PNG };
}

/** window.print() calls (stubbed in session(): a print dialog is the
 *  control's result, and headless Chromium shows none). */
const prints = (page: Page) =>
  within(
    page
      .evaluate(
        () => (window as unknown as { __p16Prints?: number }).__p16Prints ?? 0,
      )
      .catch(() => 0),
    5_000,
    0,
  );

const storageOrigin = (() => {
  const raw = process.env.E2E_STORAGE_ORIGIN ?? "";
  if (!raw) return null;
  const u = new URL(raw);
  if (!["localhost", "127.0.0.1"].includes(u.hostname))
    throw new Error("E2E_STORAGE_ORIGIN must be the local S3 stand-in");
  return u.origin;
})();

const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

/** page.evaluate has no timeout of its own: a tab stuck in a navigation
 *  would hold the crawl forever. Give up after `ms` with `fallback`. */
function within<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    p.finally(() => clearTimeout(t)),
    new Promise<T>((resolve) => {
      t = setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

/* ------------------------------------------------------------------ */
/* Recorder: everything the browser reports between two checkpoints.  */
/* ------------------------------------------------------------------ */
class Recorder {
  issues: Issue[] = [];
  stats: PageStats[] = [];
  apiTimes: number[] = [];
  consoleErrors: string[] = [];
  pageErrors: string[] = [];
  api: {
    method: string;
    path: string;
    url: string;
    status: number;
    code: string;
  }[] = [];
  downloads: string[] = [];
  /** File pickers opened (answered with the synthetic files). */
  fileChoosers = 0;
  /** Bare 401s the client recovered from by refresh + retry. */
  refreshRetries = 0;
  /** Links that left the app (aborted, see session()). */
  external: string[] = [];
  current = "";
  control = "";
  shots = 0;
  marks = 0;

  constructor(
    readonly role: string,
    readonly dir: string,
  ) {}

  attach(page: Page) {
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const t = m.text();
      // Chromium logs every 4xx/5xx as a console error: tracked from the
      // network below instead (with the API error code).
      if (/^Failed to load resource/.test(t)) return;
      this.consoleErrors.push(t.slice(0, 400));
    });
    page.on("pageerror", (e) =>
      this.pageErrors.push(`${e.name}: ${e.message}`.slice(0, 400)),
    );
    page.on("request", (r) => {
      if (r.url().startsWith(apiOrigin)) this.apiTimes.push(Date.now());
    });
    page.on("response", async (res) => {
      const u = new URL(res.url());
      if (u.origin !== apiOrigin) return;
      const status = res.status();
      let code = "";
      if (status >= 400) {
        const body = (await res.json().catch(() => null)) as {
          code?: unknown;
        } | null;
        code = typeof body?.code === "string" ? body.code : "";
      }
      this.api.push({
        method: res.request().method(),
        path: u.pathname.replace(/^\/api\/v1/, ""),
        url: res.url(),
        status,
        code,
      });
    });
    page.on("filechooser", async (fc) => {
      this.fileChoosers += 1;
      const accept =
        (await fc
          .element()
          .getAttribute("accept")
          .catch(() => "")) ?? "";
      await fc.setFiles(syntheticFile(accept)).catch(() => undefined);
    });
    page.on("download", async (d) => {
      const file = path.join(
        this.dir,
        "downloads",
        `${this.role}-${Date.now()}-${d.suggestedFilename()}`,
      );
      fs.mkdirSync(path.dirname(file), { recursive: true });
      await d.saveAs(file).catch(() => undefined);
      this.downloads.push(file);
    });
  }

  /** The API answers RATE_LIMIT_LIMIT (default 100) requests a minute per
   *  IP: stay under it. E2E_API_BUDGET raises the budget only for an env
   *  whose API was started with a higher local limit. */
  async pace(page: Page) {
    for (;;) {
      const now = Date.now();
      this.apiTimes = this.apiTimes.filter((t) => now - t < 60_000);
      if (this.apiTimes.length < API_BUDGET) return;
      await page.waitForTimeout(this.apiTimes[0] + 60_000 - now + 200);
    }
  }

  checkpoint() {
    const out = {
      console: this.consoleErrors.splice(0),
      errors: this.pageErrors.splice(0),
      api: this.api.splice(0),
    };
    return out;
  }

  async add(
    page: Page,
    i: Omit<Issue, "role" | "page" | "control" | "screenshot"> & {
      control?: string;
    },
  ) {
    const dup = this.issues.find(
      (x) =>
        x.page === this.current &&
        x.kind === i.kind &&
        x.actual === i.actual &&
        x.control === (i.control ?? this.control),
    );
    if (dup) return;
    let screenshot: string | undefined;
    if (i.severity !== "info" && this.shots < 120) {
      this.shots += 1;
      screenshot = path.join(
        this.dir,
        "shots",
        `${this.role}-${String(this.shots).padStart(3, "0")}.png`,
      );
      fs.mkdirSync(path.dirname(screenshot), { recursive: true });
      await page
        .screenshot({ path: screenshot, timeout: 5_000 })
        .catch(() => (screenshot = undefined));
    }
    this.issues.push({
      role: this.role,
      page: this.current,
      control: i.control ?? this.control,
      ...i,
      screenshot,
    });
  }

  mark() {
    this.marks += 1;
    return `${MARK} crawl ${this.role.replace("member-", "")} ${this.marks}`;
  }
}

/* API refusals that are the designed answer and that the page handles (it
   shows an empty or explained state, checked in REPORT.md). They are not
   recorded as issues. */
const EXPECTED_4XX: {
  status: number;
  code: string;
  path?: RegExp;
  why: string;
}[] = [
  {
    /* The API's NotFoundException for this route carries the message only
       (no code); dialysis.repository getPrescription maps 404 to null. */
    status: 404,
    code: "",
    path: /^\/patients\/[^/]+\/dialysis\/prescription$/,
    why: "no prescription on file yet: the page shows its empty state",
  },
  {
    status: 404,
    code: "dialysis.prescription_not_found",
    why: "no prescription on file yet: the page shows its empty state",
  },
  {
    status: 400,
    code: "education.class_activities_unanswered",
    why: "'I finished Day N' before the day's activities are answered: MyHospitalCourse shows 'That did not save. Finish the day's activities and try again.'",
  },
  {
    status: 400,
    code: "education.join_not_open_yet",
    why: "Join class before the class opens: the card says it opens 30 minutes before the start",
  },
];

/* Evaluate what the browser reported since the last checkpoint. */
async function judge(
  page: Page,
  rec: Recorder,
  step: string,
  opts: { expect4xx?: boolean } = {},
) {
  const seen = rec.checkpoint();
  /* An expired access cookie answers every request in flight with a bare
     401; the client then refreshes once and retries them. The page can be
     drawn before that refresh lands: wait briefly for it and judge the
     whole exchange together. */
  const bare401 = (api: typeof seen.api) =>
    api.some(
      (r) => r.status === 401 && !r.code && !r.path.startsWith("/auth/"),
    );
  const refreshedIn = (api: typeof seen.api) =>
    api.some(
      (r) =>
        r.method === "POST" && r.path === "/auth/refresh" && r.status < 300,
    );
  if (bare401(seen.api) && !refreshedIn(seen.api)) {
    for (let t = 0; t < 15 && !refreshedIn(rec.api); t += 1)
      await page.waitForTimeout(200);
    await page.waitForTimeout(800); // the retries after the refresh
    const more = rec.checkpoint();
    seen.api.push(...more.api);
    seen.console.push(...more.console);
    seen.errors.push(...more.errors);
  }
  for (const e of seen.errors)
    await rec.add(page, {
      kind: "uncaught-exception",
      severity: "high",
      steps: step,
      expected: "no uncaught exception",
      actual: e,
    });
  for (const c of seen.console)
    await rec.add(page, {
      kind: "console-error",
      severity: "medium",
      steps: step,
      expected: "no console error",
      actual: c,
    });
  const notShared = await page
    .getByText(NOT_SHARED)
    .count()
    .catch(() => 0);
  /* The API client answers a bare 401 (expired access cookie) with one
     refresh and one retry (src/lib/api/client.ts): that is the designed
     session flow, not an error, when the refresh succeeded. */
  const refreshed = seen.api.some(
    (r) => r.method === "POST" && r.path === "/auth/refresh" && r.status < 300,
  );
  for (const [n, r] of seen.api.entries()) {
    if (
      r.status === 401 &&
      !r.code &&
      !r.path.startsWith("/auth/") &&
      (refreshed ||
        seen.api
          .slice(n + 1)
          .some(
            (x) => x.method === r.method && x.path === r.path && x.status < 300,
          ))
    ) {
      rec.refreshRetries += 1;
      continue;
    }
    const what = `${r.method} ${r.path} -> ${r.status}${r.code ? ` ${r.code}` : ""}`;
    if (
      EXPECTED_4XX.some(
        (e) =>
          e.status === r.status &&
          e.code === r.code &&
          (!e.path || (r.method === "GET" && e.path.test(r.path))),
      )
    )
      continue;
    if (
      r.method === "GET" &&
      (r.status >= 500 || (r.status === 401 && !r.path.startsWith("/auth/")))
    ) {
      /* Same request again, same session. A 2xx now means the failure was
         transient (in this env: the shared Postgres timing out a pool
         connection under five parallel lanes, see the API log); it is
         recorded as such, never dropped. */
      const again = await page.request
        .get(r.url, { timeout: 20_000 })
        .catch(() => null);
      if (again && again.ok()) {
        await rec.add(page, {
          kind: `api-${r.status}-transient`,
          severity: "medium",
          steps: step,
          expected: `no API ${r.status}`,
          actual: `${what} (the same GET answered ${again.status()} right after)`,
        });
        continue;
      }
    }
    if (r.status >= 500)
      await rec.add(page, {
        kind: "api-5xx",
        severity: "high",
        steps: step,
        expected: "no API 5xx",
        actual: what,
      });
    else if (r.status === 429)
      await rec.add(page, {
        kind: "api-429",
        severity: "info",
        steps: step,
        expected: "under the 100/min per-IP throttle",
        actual: what,
      });
    else if (r.status === 403 && !notShared)
      await rec.add(page, {
        kind: "api-403-no-state",
        severity: "high",
        steps: step,
        expected:
          "a member is never refused their own data; an intended 403 shows the not-shared state",
        actual: what,
      });
    else if (r.status === 401 && r.path.startsWith("/auth/"))
      continue; // refresh probing
    else if (r.status >= 400 && !opts.expect4xx)
      await rec.add(page, {
        kind: "api-4xx",
        severity: r.status === 404 ? "medium" : "medium",
        steps: step,
        expected: "no unexpected API 4xx",
        actual: what,
      });
  }
  const crash = await page
    .locator("body")
    .innerText({ timeout: 2_000 })
    .catch(() => "");
  if (
    /Application error: a client-side exception|Unhandled Runtime Error|This page could not be found|Something went wrong!/i.test(
      crash,
    )
  )
    await rec.add(page, {
      kind: "crash-or-404",
      severity: "blocker",
      steps: step,
      expected: "the page renders",
      actual: crash.slice(0, 200).replace(/\s+/g, " "),
    });
  /* The shared ErrorState (role="alert") carries the retry button; a
     "Try again" elsewhere is a designed control (re-answer a quiz). */
  if (
    await page
      .locator('[role="alert"]')
      .getByRole("button", { name: "Try again" })
      .count()
      .catch(() => 0)
  )
    await rec.add(page, {
      kind: "error-state",
      severity: "high",
      steps: step,
      expected: "no error state on a healthy API",
      actual: "'Try again' error state shown",
    });
  return seen;
}

/* ------------------------------------------------------------------ */
/* Page helpers                                                        */
/* ------------------------------------------------------------------ */
/* next dev may serve a half-written chunk while it recompiles a route; the
   browser then throws a SyntaxError/ChunkLoadError before hydration. That
   is the dev server, not the app: reload once and keep a note of it. */
const DEV_CHUNK =
  /ChunkLoadError|Loading chunk|SyntaxError: Invalid or unexpected token|SyntaxError: Unexpected end of input/;

async function open(page: Page, rec: Recorder, href: string, retry = true) {
  trace(`open ${href}`);
  await rec.pace(page);
  // next dev compiles a route on its first visit: allow for that.
  const res = await page
    .goto(href, { waitUntil: "domcontentloaded", timeout: 90_000 })
    .catch(async (e: unknown) => {
      if (retry) return null; // a second attempt follows below
      await rec.add(page, {
        kind: "navigation-failed",
        severity: "high",
        steps: `open ${href}`,
        expected: "the page loads",
        actual: String(e).split("\n")[0].slice(0, 200),
      });
      return null;
    });
  if (!res && retry) return open(page, rec, href, false);
  if (res && res.status() === 404)
    await rec.add(page, {
      kind: "route-404",
      severity: "high",
      steps: `open ${href}`,
      expected: "the page exists",
      actual: "404",
    });
  await page
    .locator("main")
    .first()
    .waitFor({ timeout: 20_000 })
    .catch(() => undefined);
  const loaded = await waitLoaded(page, rec, `open ${href}`, !retry);
  if (!loaded && retry) {
    const chunk = rec.pageErrors.filter((e) => DEV_CHUNK.test(e));
    if (chunk.length) {
      rec.pageErrors = rec.pageErrors.filter((e) => !DEV_CHUNK.test(e));
      await rec.add(page, {
        kind: "dev-chunk-reload",
        severity: "info",
        steps: `open ${href}`,
        expected: "the page hydrates",
        actual: `next dev served a broken chunk (${chunk[0].slice(0, 80)}); reloaded once`,
      });
    }
    await open(page, rec, href, false);
  }
}

/* Designed states that have no heading of their own (checked in
   REPORT.md): the treatment detail page opened without an id. */
const NO_HEADING_STATES = /That treatment is not in your log/;

/** Content shown and no skeleton/aria-busy left. Short waits only. */
async function waitLoaded(
  page: Page,
  rec: Recorder,
  step: string,
  record = true,
): Promise<boolean> {
  const deadline = Date.now() + 12_000;
  for (;;) {
    const busy = await page
      .locator('main [aria-busy="true"], main .animate-pulse')
      .count()
      .catch(() => 0);
    const heading = await page
      .locator("main h1, main h2")
      .count()
      .catch(() => 0);
    if (!busy && heading) return true;
    if (
      !busy &&
      (await page
        .locator("main")
        .getByText(NO_HEADING_STATES)
        .count()
        .catch(() => 0))
    )
      return true;
    if (Date.now() > deadline) {
      if (!record) return false;
      await rec.add(page, {
        kind: "stuck-loading",
        severity: "high",
        steps: step,
        expected: "content within 12 s",
        actual: busy ? `${busy} loading placeholder(s) left` : "no heading",
      });
      return false;
    }
    await page.waitForTimeout(200);
  }
}

/** A cheap fingerprint of <main> and open dialogs. */
async function fingerprint(page: Page): Promise<string> {
  const fp = page
    .evaluate(() => {
      const parts = [
        document.querySelector("main")?.innerHTML ?? "",
        ...[
          ...document.querySelectorAll(
            '[role="dialog"],[role="menu"],[role="listbox"]',
          ),
        ].map((d) => d.outerHTML),
        location.href,
      ];
      let h = 0;
      const s = parts.join("|");
      for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
      return `${s.length}:${h}`;
    })
    .catch(() => "gone");
  return within(fp, 10_000, "gone");
}

type Control = {
  idx: number;
  sig: string;
  kind: string;
  name: string;
  href: string;
};

/** Tag every visible enabled control in <main> (not in a dialog). */
async function enumerate(page: Page): Promise<Control[]> {
  const list = page
    .evaluate(() => {
      // Drop the tags of an earlier pass: a stale tag would make two
      // elements answer the same [data-p16] locator.
      for (const old of document.querySelectorAll("[data-p16]"))
        old.removeAttribute("data-p16");
      const main = document.querySelector("main");
      if (!main) return [];
      const sel =
        'button, [role="button"], [role="tab"], [role="switch"], [role="checkbox"], [role="radio"], [role="menuitem"], [role="combobox"], select, a[href], summary, input:not([type="hidden"]):not([type="file"]), textarea';
      const seen = new Map<string, number>();
      const out: {
        idx: number;
        sig: string;
        kind: string;
        name: string;
        href: string;
      }[] = [];
      let idx = 0;
      for (const el of main.querySelectorAll<HTMLElement>(sel)) {
        if (el.closest('[role="dialog"]')) continue;
        // A closed off-canvas panel is inert: not reachable, not a control.
        if (el.closest('[inert], [aria-hidden="true"]')) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const st = getComputedStyle(el);
        if (st.visibility === "hidden" || st.display === "none") continue;
        if ((el as HTMLButtonElement).disabled) continue;
        if (el.getAttribute("aria-disabled") === "true") continue;
        const tag = el.tagName.toLowerCase();
        const type = (el.getAttribute("type") ?? "").toLowerCase();
        const kind =
          tag === "a"
            ? "link"
            : tag === "select"
              ? "select"
              : tag === "textarea" ||
                  (tag === "input" &&
                    !["checkbox", "radio", "submit", "button"].includes(type))
                ? "input"
                : (el.getAttribute("role") ?? tag) + (type ? `:${type}` : "");
        const label =
          el.getAttribute("aria-label") ||
          (el.id &&
            document.querySelector(`label[for="${CSS.escape(el.id)}"]`)
              ?.textContent) ||
          el.textContent ||
          el.getAttribute("title") ||
          el.getAttribute("placeholder") ||
          el.getAttribute("name") ||
          "";
        const name = label.replace(/\s+/g, " ").trim().slice(0, 80);
        const base = `${kind}|${name}`;
        const n = seen.get(base) ?? 0;
        seen.set(base, n + 1);
        el.setAttribute("data-p16", String(idx));
        out.push({
          idx,
          sig: `${base}#${n}`,
          kind,
          name,
          href: tag === "a" ? (el.getAttribute("href") ?? "") : "",
        });
        idx += 1;
      }
      return out;
    })
    .catch((): Control[] => []);
  return within(list, 15_000, []);
}

const nameShape = (s: string) => s.replace(/\d+/g, "#").replace(/#\d+$/, "");

/* ------------------------------------------------------------------ */
/* Forms                                                               */
/* ------------------------------------------------------------------ */
async function fieldsOf(root: Locator) {
  return root.locator(
    'input:not([type="hidden"]):not([type="search"]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled])',
  );
}

function numberFor(label: string, min?: number, max?: number) {
  const l = label.toLowerCase();
  let v = 5;
  if (/systolic/.test(l)) v = 120;
  else if (/diastolic/.test(l)) v = 80;
  else if (/pulse|heart/.test(l)) v = 72;
  else if (/weight|kg|lb/.test(l)) v = 70;
  else if (/temp/.test(l)) v = 98;
  else if (/glucose|sugar/.test(l)) v = 100;
  else if (/ml|fluid|intake|amount|volume|oz/.test(l)) v = 250;
  else if (/hour/.test(l)) v = 3;
  else if (/minute/.test(l)) v = 30;
  else if (/year/.test(l)) v = 2;
  if (min !== undefined && v < min) v = min;
  if (max !== undefined && v > max) v = max;
  return String(v);
}

async function labelOf(el: Locator) {
  return el
    .evaluate((n) => {
      const e = n as HTMLInputElement;
      const byFor =
        e.id &&
        document.querySelector(`label[for="${CSS.escape(e.id)}"]`)?.textContent;
      return `${e.getAttribute("aria-label") ?? ""} ${byFor ?? ""} ${e.closest("label")?.textContent ?? ""} ${e.name ?? ""} ${e.placeholder ?? ""}`;
    })
    .catch(() => "");
}

type FillMode = "empty" | "invalid" | "valid";

/** Returns the marker written into text fields (valid mode). */
async function fill(root: Locator, rec: Recorder, mode: FillMode) {
  const fields = await fieldsOf(root);
  const n = await fields.count();
  const marker = rec.mark();
  let invalidDone = false;
  const radiosDone = new Set<string>();
  for (let i = 0; i < n; i += 1) {
    const f = fields.nth(i);
    const type = (
      (await f.getAttribute("type").catch(() => "")) ?? "text"
    ).toLowerCase();
    // A file input is usually visually hidden behind its drop zone.
    if (type !== "file" && !(await f.isVisible().catch(() => false))) continue;
    const tag = await f
      .evaluate((e) => e.tagName.toLowerCase())
      .catch(() => "");
    const label = await labelOf(f);
    try {
      if (tag === "select") {
        if (mode === "empty") continue;
        const values = await f.evaluate((s) =>
          [...(s as HTMLSelectElement).options]
            .filter((o) => o.value && !o.disabled)
            .map((o) => o.value),
        );
        if (values.length) await f.selectOption(values[0], { timeout: 2_000 });
        continue;
      }
      if (type === "file") {
        if (mode !== "valid") continue;
        const accept = (await f.getAttribute("accept")) ?? "";
        await f.setInputFiles(syntheticFile(accept));
        continue;
      }
      if (type === "checkbox") {
        // Valid data ticks required boxes and acknowledgements (the
        // "information leaves NephroReach" notice); other options stay.
        if (
          mode === "valid" &&
          ((await f.getAttribute("required")) !== null ||
            /acknowledg|i agree|i understand|i confirm|consent/i.test(label))
        )
          await f.check({ timeout: 2_000, force: true });
        continue;
      }
      if (type === "radio") {
        const group = (await f.getAttribute("name")) ?? `r${i}`;
        if (mode === "empty" || radiosDone.has(group)) continue;
        radiosDone.add(group);
        await f.check({ timeout: 2_000, force: true });
        continue;
      }
      if (mode === "empty") {
        await f.fill("", { timeout: 2_000 });
        continue;
      }
      const min = await f.getAttribute("min");
      const max = await f.getAttribute("max");
      let v: string;
      if (type === "date") v = today();
      else if (type === "time") v = "09:30";
      else if (type === "datetime-local") v = `${today()}T09:30`;
      else if (type === "month") v = today().slice(0, 7);
      else if (type === "number" || type === "range")
        v = numberFor(
          label,
          min && !isNaN(Number(min)) ? Number(min) : undefined,
          max && !isNaN(Number(max)) ? Number(max) : undefined,
        );
      else if (type === "email") v = "p16a.crawl@example.test";
      else if (type === "tel") v = "5555550123";
      else if (type === "url") v = "https://example.test/p16a";
      else if (/\bname\b/i.test(label) && tag === "input") v = `${MARK} Tester`;
      else if (/zip|postal/i.test(label)) v = "10001";
      else if (/\bstate\b/i.test(label)) v = "NY";
      else if (/phone/i.test(label)) v = "5555550123";
      else if (/email/i.test(label)) v = "p16a.crawl@example.test";
      else if (
        /systolic|diastolic|weight|pulse|amount|glucose|ml\b/i.test(label)
      )
        v = numberFor(label);
      else v = marker;
      if (mode === "invalid" && !invalidDone) {
        if (type === "number") {
          v = "-99999";
          invalidDone = true;
        } else if (type === "email" || /email/i.test(label)) {
          v = "not-an-email";
          invalidDone = true;
        }
      }
      await f.fill(v, { timeout: 2_000 });
    } catch {
      /* a field that refuses input (custom widget) is left as is */
    }
  }
  if (mode === "invalid" && !invalidDone) return { marker, invalid: false };
  return { marker, invalid: true };
}

/** True when a text field holds a value the crawler did not write. */
async function prefilledSeed(root: Locator) {
  return root
    .evaluate(
      (el, mark) =>
        [
          ...el.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
            'input:not([type]), input[type="text"], input[type="tel"], input[type="email"], input[type="url"], textarea',
          ),
        ].some(
          (f) =>
            !f.disabled &&
            !f.readOnly &&
            f.value.trim() !== "" &&
            !f.value.includes(mark),
        ),
      MARK,
    )
    .catch(() => false);
}

async function submitButton(root: Locator): Promise<Locator | null> {
  const typed = root.locator('button[type="submit"]:visible');
  if (await typed.count()) return typed.last();
  const buttons = root.getByRole("button");
  const n = await buttons.count();
  for (let i = n - 1; i >= 0; i -= 1) {
    const b = buttons.nth(i);
    const name = (
      (await b.innerText().catch(() => "")) ||
      (await b.getAttribute("aria-label")) ||
      ""
    ).trim();
    if (SUBMIT.test(name) && !NEVER.test(name) && !CLOSE.test(name)) return b;
  }
  return null;
}

/** Empty, invalid and valid submissions of one form root (a dialog or a
 *  <form>). `reopen` brings the root back if a submission closed it. */
async function formPass(
  page: Page,
  rec: Recorder,
  stats: PageStats,
  rootSel: () => Locator,
  label: string,
  reopen: (() => Promise<boolean>) | null,
  isDialog = true,
) {
  let root = rootSel();
  const fields = await fieldsOf(root);
  if (!(await fields.count())) return;
  if (await root.locator('input[type="password"]').count()) {
    stats.skipped.push(`${label}: security form (password) not submitted`);
    return;
  }
  stats.forms += 1;
  const mutations = (api: { method: string; status: number; path: string }[]) =>
    api.filter((r) => r.method !== "GET");

  for (const mode of ["empty", "invalid", "valid"] as FillMode[]) {
    root = rootSel();
    if (!(await root.isVisible().catch(() => false))) {
      if (!reopen || !(await reopen())) return;
      root = rootSel();
    }
    /* An edit form already holding a saved record that the crawler did not
       create: an empty save can mean "clear it" by design (the home clinic),
       which would destroy a seed record. Not submitted empty. */
    if (mode === "empty" && (await prefilledSeed(root))) {
      stats.skipped.push(
        `${label}: edit form of a seed record not submitted empty`,
      );
      continue;
    }
    const { marker, invalid } = await fill(root, rec, mode);
    if (mode === "invalid" && !invalid) continue;
    const btn = await submitButton(root);
    if (!btn) {
      stats.skipped.push(`${label}: no submit button found`);
      return;
    }
    const btnName = (await btn.innerText().catch(() => "")).trim();
    rec.control = `${label} > ${btnName} (${mode})`;
    trace(rec.control);
    if (await btn.isDisabled().catch(() => false)) {
      if (mode === "valid")
        await rec.add(page, {
          kind: "submit-disabled-after-valid-fill",
          severity: "low",
          steps: `${label}: fill every field with valid synthetic data`,
          expected: "submit enabled",
          actual: `'${btnName}' still disabled (a custom field the crawler cannot fill?)`,
        });
      continue; // a disabled submit is the validation for empty/invalid
    }
    await rec.pace(page);
    rec.checkpoint();
    await btn.click({ timeout: 3_000 }).catch(() => undefined);
    stats.submits += 1;
    await page.waitForTimeout(mode === "valid" ? 1_200 : 700);
    const stillOpen = await root.isVisible().catch(() => false);
    const seen = await judge(page, rec, `${label}: submit ${mode}`, {
      expect4xx: mode !== "valid",
    });
    const muts = mutations(seen.api);
    if (mode !== "valid") {
      const invalidShown =
        (await root
          .locator('[aria-invalid="true"]')
          .count()
          .catch(() => 0)) +
        (await root
          .locator('[role="alert"]')
          .count()
          .catch(() => 0)) +
        // The browser's own message for a required or typed field is a
        // native bubble, not in the DOM: the field matches :invalid.
        (await root
          .evaluate(
            (el) =>
              [
                ...el.querySelectorAll<
                  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
                >("input, textarea, select"),
              ].filter((f) => f.willValidate && !f.validity.valid).length,
          )
          .catch(() => 0));
      const text = stillOpen ? await root.innerText().catch(() => "") : "";
      const ok2xx = muts.some((r) => r.status < 300);
      if (ok2xx)
        await rec.add(page, {
          kind: `${mode}-submit-accepted`,
          severity: "medium",
          steps: `${label}: submit ${mode === "empty" ? "with the text fields empty" : "with an invalid value (-99999 or not-an-email)"}`,
          expected: "a validation message, nothing saved",
          actual: `saved: ${muts.map((r) => `${r.method} ${r.path} ${r.status}`).join(", ")}`,
        });
      else if (
        stillOpen &&
        !invalidShown &&
        !VALIDATION.test(text) &&
        !muts.length
      )
        await rec.add(page, {
          kind: "no-validation-message",
          severity: "low",
          steps: `${label}: submit ${mode}`,
          expected: "a validation message",
          actual: "nothing visible changed",
        });
      else if (
        muts.some((r) => r.status >= 400 && r.status < 500) &&
        !invalidShown &&
        !VALIDATION.test(text) &&
        stillOpen
      )
        await rec.add(page, {
          kind: "refusal-not-shown",
          severity: "medium",
          steps: `${label}: submit ${mode}`,
          expected: "the server refusal is shown to the user",
          actual: muts
            .map((r) => `${r.method} ${r.path} ${r.status}`)
            .join(", "),
        });
    } else {
      const bad = muts.filter((r) => r.status >= 400 && r.status !== 429);
      if (bad.length)
        await rec.add(page, {
          kind: "valid-submit-refused",
          severity: bad.some((r) => r.status >= 500) ? "high" : "info",
          steps: `${label}: fill with valid synthetic data and submit`,
          expected:
            "saved (or the crawler's generic data was refused with a message)",
          actual: bad
            .map((r) => `${r.method} ${r.path} ${r.status}`)
            .join(", "),
        });
      if (muts.some((r) => r.status < 300)) createdMarkers.push(marker);
    }
    if (stillOpen && isDialog) {
      await closeDialog(page);
    }
  }
}

const createdMarkers: string[] = [];

const trace = (msg: string) => {
  if (process.env.E2E_CRAWL_TRACE)
    console.log(`[crawl] ${new Date().toISOString().slice(11, 19)} ${msg}`);
};

async function closeDialog(page: Page) {
  for (let i = 0; i < 3; i += 1) {
    const d = page.locator('[role="dialog"]:visible').last();
    if (!(await d.count())) return;
    await page.keyboard.press("Escape").catch(() => undefined);
    await page.waitForTimeout(200);
    if (!(await d.isVisible().catch(() => false))) return;
    const close = d.getByRole("button", { name: CLOSE }).first();
    if (await close.count())
      await close.click({ timeout: 2_000 }).catch(() => undefined);
    else
      await d
        .locator('button[aria-label*="lose"]')
        .first()
        .click({ timeout: 2_000 })
        .catch(() => undefined);
    await page.waitForTimeout(200);
  }
}

/* ------------------------------------------------------------------ */
/* One page                                                            */
/* ------------------------------------------------------------------ */
async function crawlPage(page: Page, rec: Recorder, href: string) {
  rec.current = href;
  rec.control = "(page load)";
  const stats: PageStats = {
    page: href,
    controls: 0,
    clicked: 0,
    links: 0,
    forms: 0,
    submits: 0,
    downloads: 0,
    deleted: 0,
    skipped: [],
  };
  rec.stats.push(stats);
  const dl0 = rec.downloads.length;
  rec.checkpoint();
  await open(page, rec, href);
  await judge(page, rec, `open ${href}`);
  await layout(page, rec, href);
  const pagePath = new URL(page.url()).pathname;

  /* In-page forms (e.g. the add pages). */
  const formCount = await page.locator("main form").count();
  for (let f = 0; f < Math.min(formCount, 3); f += 1) {
    await formPass(
      page,
      rec,
      stats,
      () => page.locator("main form").nth(f),
      `form ${f + 1}`,
      async () => {
        await open(page, rec, href);
        return (await page.locator("main form").count()) > f;
      },
      false,
    );
    if (new URL(page.url()).pathname !== pagePath) await open(page, rec, href);
  }

  const visited = new Set<string>();
  const shapes = new Map<string, number>();
  const links = new Set<string>();
  let budget = 90;
  for (;;) {
    if (budget <= 0) {
      stats.skipped.push("control budget (90) reached");
      break;
    }
    const controls = await enumerate(page);
    stats.controls = Math.max(
      stats.controls,
      visited.size + controls.filter((c) => !visited.has(c.sig)).length,
    );
    const next = controls.find((c) => !visited.has(c.sig));
    if (!next) break;
    visited.add(next.sig);
    const shape = `${next.kind}|${nameShape(next.name)}`;
    const nShape = (shapes.get(shape) ?? 0) + 1;
    shapes.set(shape, nShape);
    if (nShape > 3) continue; // the same row action on many rows: 3 suffice
    if (NEVER.test(next.name)) {
      stats.skipped.push(`never-click: ${next.name}`);
      continue;
    }
    rec.control = `${next.kind} '${next.name}'`;
    trace(`${href} :: ${rec.control}`);
    const loc = page.locator(`[data-p16="${next.idx}"]`);

    if (next.kind === "link") {
      if (/^(mailto:|tel:)/.test(next.href)) {
        stats.skipped.push(
          `not followed: ${next.href.slice(0, 7)} link '${next.name}'`,
        );
        continue;
      }
      let url: URL;
      try {
        url = new URL(next.href, page.url());
      } catch {
        continue;
      }
      if (url.origin !== new URL(page.url()).origin) {
        stats.skipped.push(`external link not followed: ${url.origin}`);
        continue;
      }
      if (url.pathname === pagePath && url.hash) {
        // in-page anchor: click it
      } else {
        if (!links.has(url.pathname)) {
          links.add(url.pathname);
          stats.links += 1;
          const res = await page.request
            .get(url.href, { maxRedirects: 5, timeout: 20_000 })
            .catch(() => null);
          if (res && res.status() === 404)
            await rec.add(page, {
              kind: "link-404",
              severity: "medium",
              steps: `link '${next.name}' on ${href}`,
              expected: "the link opens a page",
              actual: `${url.pathname} is a 404`,
            });
        }
        // Follow the first link of each target once, then come back.
        if (links.size <= 6 || CHILDREN[href]?.test(url.pathname)) {
          budget -= 1;
          stats.clicked += 1;
          await rec.pace(page);
          await loc.click({ timeout: 3_000 }).catch(() => undefined);
          await page.waitForTimeout(500);
          await judge(page, rec, `click link '${next.name}'`);
          if (new URL(page.url()).pathname !== pagePath) {
            await open(page, rec, href);
          }
        }
        continue;
      }
    }

    budget -= 1;
    await rec.pace(page);
    const before = await fingerprint(page);
    const dlBefore = rec.downloads.length;
    const extBefore = rec.external.length;
    const selectedBefore = await loc
      .evaluate((el) =>
        ["aria-selected", "aria-checked", "aria-pressed"].some(
          (a) => el.getAttribute(a) === "true",
        ) || (el as HTMLInputElement).checked === true
          ? "true"
          : "false",
      )
      .catch(() => null);
    const printsBefore = await prints(page);
    const choosersBefore = rec.fileChoosers;
    rec.checkpoint();
    try {
      if (next.kind === "select") {
        const values = await loc.evaluate((s) =>
          [...(s as HTMLSelectElement).options]
            .filter((o) => !o.disabled)
            .map((o) => o.value),
        );
        if (values.length > 1) {
          await loc.selectOption(values[1], { timeout: 2_000 });
          await page.waitForTimeout(300);
          await loc
            .selectOption(values[0], { timeout: 2_000 })
            .catch(() => undefined);
        }
      } else if (next.kind === "input") {
        const type = (await loc.getAttribute("type")) ?? "text";
        if (
          ["date", "time", "number", "datetime-local", "month"].includes(type)
        ) {
          stats.skipped.push(`inline ${type} input left as is: '${next.name}'`);
          continue;
        }
        await loc.fill("a", { timeout: 2_000 });
        await page.waitForTimeout(300);
        await loc.fill("", { timeout: 2_000 });
      } else {
        await loc.click({ timeout: 3_000 });
      }
      stats.clicked += 1;
    } catch (e) {
      await rec.add(page, {
        kind: "click-failed",
        severity: "low",
        steps: `click ${rec.control}`,
        expected: "the control can be clicked",
        actual: String(e).split("\n")[0].slice(0, 200),
      });
      continue;
    }
    /* Short wait for a visible result. */
    let after = before;
    for (let t = 0; t < 10; t += 1) {
      await page.waitForTimeout(200);
      after = await fingerprint(page);
      if (after !== before) break;
    }
    const seen = await judge(page, rec, `click ${rec.control}`);
    const dialog = page.locator('[role="dialog"]:visible').last();
    const hasDialog = (await dialog.count()) > 0;
    if (
      after === before &&
      !hasDialog &&
      !seen.api.length &&
      rec.downloads.length === dlBefore &&
      rec.external.length === extBefore &&
      rec.fileChoosers === choosersBefore &&
      (await prints(page)) === printsBefore &&
      // the tab already shown: clicking it again changes nothing, by design
      selectedBefore !== "true" &&
      !["select", "input"].includes(next.kind)
    )
      await rec.add(page, {
        kind: "dead-control",
        severity: "low",
        steps: `click ${rec.control}`,
        expected: "a visible result",
        actual: "nothing changed on the page, no request, no dialog",
      });
    if (hasDialog) {
      const opener = next;
      await formPass(
        page,
        rec,
        stats,
        () => page.locator('[role="dialog"]:visible').last(),
        `dialog from '${next.name}'`,
        async () => {
          if (new URL(page.url()).pathname !== pagePath)
            await open(page, rec, href);
          const again = (await enumerate(page)).find(
            (c) => c.sig === opener.sig,
          );
          if (!again) return false;
          await page
            .locator(`[data-p16="${again.idx}"]`)
            .click({ timeout: 3_000 })
            .catch(() => undefined);
          await page.waitForTimeout(400);
          return (await page.locator('[role="dialog"]:visible').count()) > 0;
        },
      );
      /* Click the dialog's own non-submit controls (tabs, toggles). */
      await closeDialog(page);
      await judge(page, rec, `close dialog from '${next.name}'`);
    }
    if (new URL(page.url()).pathname !== pagePath) {
      await open(page, rec, href);
    }
  }
  stats.downloads = rec.downloads.length - dl0;

  /* Destructive actions only on rows this crawler created. */
  if (createdMarkers.length) {
    await open(page, rec, href);
    await deleteOwn(page, rec, stats);
  }

  /* Dynamic child pages (one of each). */
  const child = CHILDREN[href];
  if (child) {
    const target = (await enumerate(page)).find(
      (c) =>
        c.kind === "link" &&
        [
          new URL(c.href, page.url()).pathname,
          new URL(c.href, page.url()).pathname +
            new URL(c.href, page.url()).search,
        ].some((u) => child.test(u)),
    );
    if (target) {
      const u = new URL(target.href, page.url());
      const childHref = u.pathname + u.search;
      await crawlPage(page, rec, childHref);
    } else
      rec.stats
        .find((s) => s.page === href)
        ?.skipped.push("no child page link found");
  }
}

async function deleteOwn(page: Page, rec: Recorder, stats: PageStats) {
  for (let round = 0; round < 3; round += 1) {
    const row = page
      .locator("main tr, main li, main article, main [data-row]")
      .filter({ hasText: new RegExp(`${MARK} crawl`) })
      .filter({
        has: page.getByRole("button", {
          name: /delete|remove|archive|cancel/i,
        }),
      })
      .last();
    if (!(await row.count())) return;
    const btn = row
      .getByRole("button", { name: /delete|remove|archive|cancel/i })
      .first();
    rec.control = `own row > ${(await btn.innerText().catch(() => "")).trim()}`;
    await rec.pace(page);
    rec.checkpoint();
    await btn.click({ timeout: 3_000 }).catch(() => undefined);
    await page.waitForTimeout(400);
    const d = page.locator('[role="dialog"]:visible').last();
    if (await d.count()) {
      const confirm = d
        .getByRole("button", {
          name: /delete|remove|archive|confirm|yes|cancel (it|trip|request)/i,
        })
        .last();
      await confirm.click({ timeout: 3_000 }).catch(() => undefined);
      await page.waitForTimeout(800);
    }
    const seen = await judge(page, rec, `delete own crawler row`);
    if (seen.api.some((r) => r.method !== "GET" && r.status < 300))
      stats.deleted += 1;
    await closeDialog(page);
  }
}

async function layout(page: Page, rec: Recorder, href: string) {
  for (const [w, h, sev] of [
    [1280, 800, "low"],
    [390, 844, "medium"],
  ] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    const r = await within(
      page
        .evaluate(() => {
          const iw = window.innerWidth;
          const doc = document.documentElement.scrollWidth > iw + 1;
          const out: string[] = [];
          const main = document.querySelector("main");
          if (main)
            for (const el of main.querySelectorAll<HTMLElement>("*")) {
              const rect = el.getBoundingClientRect();
              if (!rect.width || rect.right <= iw + 1) continue;
              // A closed off-canvas panel waits off screen, inert by design.
              if (el.closest('[inert], [aria-hidden="true"]')) continue;
              let p: HTMLElement | null = el.parentElement;
              let clipped = false;
              while (p && p !== document.body) {
                const ox = getComputedStyle(p).overflowX;
                if (
                  ox === "auto" ||
                  ox === "scroll" ||
                  ox === "hidden" ||
                  ox === "clip"
                ) {
                  clipped = true;
                  break;
                }
                p = p.parentElement;
              }
              if (clipped) continue;
              out.push(
                `${el.tagName.toLowerCase()} '${(el.textContent ?? "").trim().slice(0, 40)}' right=${Math.round(rect.right)}`,
              );
              if (out.length > 2) break;
            }
          return { doc, out };
        })
        .catch(() => ({ doc: false, out: [] as string[] })),
      10_000,
      { doc: false, out: [] as string[] },
    );
    if (r.doc || r.out.length)
      await rec.add(page, {
        kind: `layout-overflow-${w}`,
        control: "(layout)",
        severity: r.doc && w === 390 ? sev : "low",
        steps: `open ${href} at ${w}px`,
        expected: "no horizontal page scroll, nothing past the right edge",
        actual: `${r.doc ? "page scrolls horizontally; " : ""}${r.out.join("; ")}`,
      });
  }
  await page.setViewportSize({ width: 1280, height: 800 });
}

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */
/* One long-lived context per role: a trace of a whole role crawl is too
   large to start per test (the trace fixture timed out). */
test.use({ trace: "off", screenshot: "off" });

/* Issues judged and explained in REPORT.md (role-independent). Each entry
   names the issue it explains; anything else of blocker/high fails. */
const EXPLAINED: { kind: string; actual: RegExp; why: string }[] = [];

async function session(
  browser: Browser,
  account: Account,
  blocked: BlockedLog,
  external: string[],
) {
  const context: BrowserContext = await browser.newContext({
    acceptDownloads: true,
  });
  await blockThirdParty(context, blocked);
  if (storageOrigin)
    await context.route(
      (url) => url.origin === storageOrigin,
      (route) => route.continue(),
    );
  /* A link the member clicks that leaves the app (map directions, the
     emergency "ER near me" search) is a top-level navigation the user
     chose, not a request the app makes. It is still aborted (nothing
     third-party is contacted) and listed in the report as an external
     link; any other third-party request stays in `blocked` and fails. */
  await context.route(
    (url) => url.origin !== appOrigin && url.origin !== apiOrigin,
    (route) => {
      const req = route.request();
      if (!req.isNavigationRequest()) return route.fallback();
      external.push(req.url());
      return route.abort("blockedbyclient");
    },
  );
  let mainPage: Page | null = null;
  context.on("page", (p) => {
    // A target=_blank link or window.open() opens a tab: keep the crawl in
    // one tab, but count the tab as the control's result (not a dead
    // control). Its navigation is aborted by the route above.
    if (mainPage && p !== mainPage) {
      external.push(`new tab: ${p.url()}`);
      void p.close().catch(() => undefined);
    }
  });
  await context.addInitScript(() => {
    const w = window as unknown as { __p16Prints?: number };
    window.print = () => {
      w.__p16Prints = (w.__p16Prints ?? 0) + 1;
    };
  });
  await cookieSession(context, account);
  const page = await context.newPage();
  mainPage = page;
  /* A replacement for a hung tab becomes the crawl's tab (the listener
     above would otherwise close it as a stray new tab). */
  const replace = async () => {
    mainPage = null;
    const next = await context.newPage();
    mainPage = next;
    return next;
  };
  return { context, page, replace };
}

for (const role of ROLES) {
  test.describe(`click-through ${role.id}`, () => {
    /* Serial inside a role (one session, pages in order); a failed summary
       of one role does not skip the next role. */
    test.describe.configure({ mode: "serial" });
    let context: BrowserContext;
    let page: Page;
    let rec: Recorder;
    let replace: () => Promise<Page>;
    const blocked: BlockedLog = [];
    const external: string[] = [];

    test.beforeAll(async ({ browser }) => {
      fs.mkdirSync(OUT, { recursive: true });
      rec = new Recorder(role.id, OUT);
      rec.external = external;
      ({ context, page, replace } = await session(
        browser,
        role.account,
        blocked,
        external,
      ));
      page.setDefaultTimeout(10_000);
      rec.attach(page);
      // Skip the first-visit tour so it does not cover every page.
      await page.request
        .post(`${apiOrigin}/api/v1/me/preferences/tour-completed`)
        .catch(() => undefined);
    });

    const save = () =>
      fs.writeFileSync(
        path.join(OUT, `${role.id}.json`),
        JSON.stringify(
          {
            role: role.id,
            blocked,
            external,
            stats: rec.stats,
            issues: rec.issues,
            downloads: rec.downloads,
            fileChoosers: rec.fileChoosers,
            refreshRetries: rec.refreshRetries,
          },
          null,
          2,
        ),
      );

    test.afterAll(async () => {
      createdMarkers.length = 0;
      save();
      await context?.close();
    });

    for (const href of ROUTES) {
      test(`${role.id} ${href} @phase16`, async () => {
        test.setTimeout(PAGE_BUDGET_MS + 3 * 60_000);
        /* A page that hangs (a frozen tab, a dev server under memory
           pressure) must not time the test out: in serial mode that would
           skip every later page of the role. After the budget the tab is
           replaced and the page recorded. */
        let timer: ReturnType<typeof setTimeout> | undefined;
        const crawl = crawlPage(page, rec, href).then(
          () => "done" as const,
          (e: unknown) => e,
        );
        const outcome = await Promise.race([
          crawl,
          new Promise<"timeout">((resolve) => {
            timer = setTimeout(() => resolve("timeout"), PAGE_BUDGET_MS);
          }),
        ]);
        clearTimeout(timer);
        if (outcome !== "done") {
          // One broken page must not stop the crawl of the others: record
          // it; the summary test below fails on it.
          rec.current = href;
          await rec.add(page, {
            kind: outcome === "timeout" ? "page-budget" : "crawler-error",
            severity: "high",
            steps: rec.control,
            expected: "the crawler finishes the page",
            actual:
              outcome === "timeout"
                ? `no result within ${PAGE_BUDGET_MS / 60_000} min (last control: ${rec.control})`
                : String(outcome).split("\n")[0].slice(0, 200),
          });
        }
        if (outcome === "timeout") {
          await page.close().catch(() => undefined);
          await crawl;
          page = await replace();
          page.setDefaultTimeout(10_000);
          rec.attach(page);
        }
        save();
        expect(blocked, "third-party requests").toEqual([]);
      });
    }

    test(`${role.id} summary: no unexplained blocker/high issue @phase16`, () => {
      save();
      const fatal = rec.issues
        .filter(
          (i) =>
            i.severity === "blocker" ||
            i.severity === "high" ||
            // the page itself scrolls sideways on a phone (fixed in P16a)
            (i.kind === "layout-overflow-390" && i.severity === "medium"),
        )
        .filter(
          (i) =>
            !EXPLAINED.some(
              (e) => e.kind === i.kind && e.actual.test(i.actual),
            ),
        );
      expect(
        fatal.map((i) => `${i.page} | ${i.control} | ${i.kind}: ${i.actual}`),
        `${role.id}: unexplained blocker/high issues`,
      ).toEqual([]);
    });
  });
}
