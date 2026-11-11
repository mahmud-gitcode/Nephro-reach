/* Phase 16 lane 16b: click-through crawl of the caregiver portal and the
   public pages (user request 2026-11-09: "check all the pages by opening a
   browser and test it by clicking everywhere").

   Roles:
   - anonymous: landing, pricing, about, contact, FAQ, login, registration,
     forgot/reset password, verify email, two-factor, invitation and share
     links, and MFA setup for a freshly registered account;
   - caregiver-sarah: My Patients, then every page acting for John (FULL
     grant), then a quick page pass acting for Grace;
   - caregiver-limited: a caregiver registered through the UI by this crawl
     and invited by Grace with a custom map (profile and logs view only,
     medications edit, everything else not shared).

   On every page the crawler clicks every visible control in the page body
   (buttons, links, tabs, switches, selects, menus), opens each dialog,
   submits it empty, then fills it with synthetic data and submits it, and
   deletes again what it created. After each action it records console
   errors, uncaught exceptions, API 5xx, unexpected 4xx, error overlays,
   404 links, controls that do nothing, stuck loading and overflow at 390px.

   Synthetic data only. Never clicks sign-out, leave, revoke or delete on a
   record it did not create. --workers=1. Results: $P16_OUT_DIR (the lane's
   evidence directory) or test-results/p16b. */
import fs from "node:fs";
import path from "node:path";
import { request, type Locator, type Page } from "@playwright/test";
import { ApiClient, currentConsent, json } from "./fixtures/api";
import {
  ACCOUNTS,
  apiOrigin,
  appOrigin,
  env,
  throwawayAccount,
  type Account,
} from "./fixtures/env";
import {
  extractLink,
  extractOtp,
  mailMark,
  waitForMail,
} from "./fixtures/mail";
import { expect, test } from "./fixtures/test";
import { pace } from "./fixtures/throttle";

/* ------------------------------------------------------------------ */
/* Results                                                             */
/* ------------------------------------------------------------------ */

type Severity = "blocker" | "high" | "medium" | "low";
type Issue = {
  role: string;
  page: string;
  control: string;
  steps: string;
  expected: string;
  actual: string;
  severity: Severity;
  screenshot?: string;
  /** Set for a high issue on the ALLOWED_HIGH list. */
  allowedReason?: string;
};
type Coverage = {
  role: string;
  pages: string[];
  controlsClicked: number;
  formsSubmitted: number;
  /** Of formsSubmitted: in-app submits with invalid input (P16b QA round 2). */
  invalidSubmitted: number;
  /** In-page (not dialog) forms the page-form pass filled and sent. */
  pageForms: number;
  dialogsOpened: number;
  downloads: number;
  notes: string[];
};

const OUT = path.resolve(
  process.env.P16_OUT_DIR ?? path.join("test-results", "p16b"),
);
const SHOTS = path.join(OUT, "screenshots");

function writeResult(name: string, data: unknown) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(
    path.join(OUT, `result-${name}.json`),
    JSON.stringify(data, null, 2),
  );
}

/** High issues that stay open on purpose, each with its reason (the
 *  acceptance criterion: 0 blocker/high unfixed unless recorded with a
 *  reason). Blockers are never allowed. Empty means every high fails. */
const ALLOWED_HIGH: {
  role?: RegExp;
  page?: RegExp;
  actual: RegExp;
  reason: string;
}[] = [];

function markAllowed(issues: Issue[]) {
  for (const i of issues) {
    if (i.severity !== "high") continue;
    const rule = ALLOWED_HIGH.find(
      (r) =>
        r.actual.test(i.actual) &&
        (!r.role || r.role.test(i.role)) &&
        (!r.page || r.page.test(i.page)),
    );
    if (rule) i.allowedReason = rule.reason;
  }
}

/** Fails on any blocker and on any high issue without an allow-list reason. */
function expectNoOpenSevere(issues: Issue[]) {
  const open = issues.filter(
    (i) =>
      i.severity === "blocker" || (i.severity === "high" && !i.allowedReason),
  );
  expect(
    open.map((i) => `${i.severity} ${i.page} ${i.control}: ${i.actual}`),
    "blocker/high issues with no recorded reason",
  ).toEqual([]);
}

/* ------------------------------------------------------------------ */
/* Classification rules                                                */
/* ------------------------------------------------------------------ */

/** Never clicked by the generic pass. */
const DANGER =
  /sign ?out|log ?out|cerrar sesi|leave|revoke|deactivate|delete|remove|archive|discharge|disable|end session|end all|cancel (trip|ride|request|subscription)|transfer ownership|unlink|decline/i;
/** Language toggles change a saved preference: clicked twice explicitly. */
const LANGUAGE = /^(es|en|español|english|espa)/i;
/** Submit-like buttons in a dialog or form. */
const SUBMIT =
  /^(save|submit|send|add|create|invite|confirm|log |record|update|book|request|share|post|reply|verify|continue|next|sign in|sign up|reset|apply|done|accept|enable|generate|start)/i;
const NOT_SHARED = /not been shared with you|has not shared|not shared/i;
const VALIDATION =
  /required|please (enter|select|choose|fill|add|provide)|must|invalid|enter a|is not valid|at least|too (short|long)|can'?t be|cannot be|select a|choose a|valid /i;

/** 4xx answers the page handles on purpose, each with the text it shows
 *  (checked by hand on the crawl screenshots; see REPORT.md). */
const HANDLED_4XX: { status: number; code: RegExp; why: string }[] = [
  {
    status: 404,
    code: /^dialysis\.prescription_not_found$/,
    why: "no prescription on file: the page shows its empty state",
  },
  {
    status: 400,
    code: /^education\.join_not_open_yet$/,
    why: "Join class before the class opens: 'The class opens 30 minutes before it starts.'",
  },
  {
    status: 403,
    code: /^auth\.sudo_required$/,
    why: "turning MFA on needs a re-authentication: the sudo prompt opens (the crawl cancels it; the generic text after a cancel is recorded in REPORT.md)",
  },
  {
    status: 400,
    code: /^education\.class_activities_unanswered$/,
    why: "I finished Day N before the day's activities are answered: 'That did not save. Finish the day's activities and try again.'",
  },
];

/** Console lines that are dev-server noise, not app errors. */
const CONSOLE_NOISE = [
  /Download the React DevTools/i,
  /\[HMR\]/,
  /\[Fast Refresh\]/,
  /webpack-hmr/i,
  /net::ERR_BLOCKED_BY_CLIENT/,
];

/* ------------------------------------------------------------------ */
/* Monitor: one per page                                               */
/* ------------------------------------------------------------------ */

type ApiHit = {
  method: string;
  path: string;
  status: number;
  code: string;
  at: number;
};

class Monitor {
  consoleErrors: string[] = [];
  pageErrors: string[] = [];
  api: ApiHit[] = [];
  requests = 0;
  downloads: string[] = [];
  /** Other-origin addresses the page asked window.open for (not opened). */
  externalOpens: string[] = [];

  constructor(readonly page: Page) {
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const t = m.text();
      if (CONSOLE_NOISE.some((r) => r.test(t))) return;
      this.consoleErrors.push(t.slice(0, 300));
    });
    page.on("pageerror", (e) =>
      this.pageErrors.push(`${e.name}: ${e.message}`.slice(0, 300)),
    );
    page.on("request", () => this.requests++);
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
        status,
        code,
        at: Date.now(),
      });
    });
    page.on("download", async (d) => {
      const name = d.suggestedFilename();
      this.downloads.push(name);
      await d
        .saveAs(path.join(OUT, "downloads", `${Date.now()}-${name}`))
        .catch(() => undefined);
    });
  }

  mark() {
    return {
      c: this.consoleErrors.length,
      p: this.pageErrors.length,
      a: this.api.length,
      r: this.requests,
      d: this.downloads.length,
    };
  }
}

/* ------------------------------------------------------------------ */
/* Crawler                                                             */
/* ------------------------------------------------------------------ */

type Ctx = {
  role: string;
  page: Page;
  mon: Monitor;
  issues: Issue[];
  cov: Coverage;
  /** In-app navigation to a page (keeps the caregiver's in-memory patient). */
  go: (href: string) => Promise<void>;
  /** Root that holds the page body (dashboard: main; public: body). */
  root: string;
  /** Refusals that are intended for a route the area table below does not
   *  cover (invitation/share tokens; the server's not-shared code). */
  intended403: (apiPath: string, code: string, method: string) => boolean;
  /** The caregiver map this role acts under (area -> 0 none, 1 view,
   *  2 edit). A refusal on a patient route is judged by the route's own
   *  area against this map, not by text elsewhere on the page. */
  perms?: Record<string, number>;
  /** Whether the role may write here (view-only caregiver: false). */
  current: string;
};

let shotN = 0;
async function shot(ctx: Ctx, tag: string): Promise<string> {
  fs.mkdirSync(SHOTS, { recursive: true });
  const file = path.join(
    SHOTS,
    `${ctx.role}-${String(++shotN).padStart(3, "0")}-${tag.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)}.png`,
  );
  await ctx.page.screenshot({ path: file }).catch(() => undefined);
  return path.relative(OUT, file).replace(/\\/g, "/");
}

async function issue(
  ctx: Ctx,
  control: string,
  steps: string,
  expected: string,
  actual: string,
  severity: Severity,
) {
  const key = `${ctx.current}|${control}|${actual}`;
  if (ctx.issues.some((i) => `${i.page}|${i.control}|${i.actual}` === key))
    return;
  ctx.issues.push({
    role: ctx.role,
    page: ctx.current,
    control,
    steps,
    expected,
    actual,
    severity,
    screenshot: await shot(ctx, control),
  });
}

/** The caregiver key each patient route needs, from the backend's
 *  @RequirePatientAccess (src/modules/access/patient-area.constants.ts).
 *  null: the patient alone (account, caregivers, share grants, ...);
 *  a caregiver never reaches it. Matched against the path after
 *  /patients/{id}/. */
const PATIENT_ROUTE_KEYS: [RegExp, string | null][] = [
  [/^(dialysis|access-profiles|trips)(\/|$)/, "dialysis"],
  [/^nutrition(\/|$)/, "nutrition"],
  [/^check-ins(\/|$)/, "check-ins"],
  [/^er-visits(\/|$)/, "er-visits"],
  [/^labs(\/|$)/, "labs"],
  [/^(medications|reminders)(\/|$)/, "medications"],
  [/^journal(\/|$)/, "journal"],
  [/^conversations(\/|$)/, "messages"],
  [
    /^(appointments|blood-pressure|exercise|urine-output|weight-fluid|care-team-questions)(\/|$)/,
    "personal-logs",
  ],
  [
    /^(allergies|medical-conditions|emergency-contact|care-contacts|care-team-contacts|home-dialysis-clinic|ride-contacts|education)(\/|$)/,
    "profile",
  ],
  [/^outside-shares(\/|$)/, "sharing"],
  [/^(caregivers|caregiver-invitations|share-grants|subscription)(\/|$)/, null],
];

/** Sarah's FULL grant (journal and sharing stay off in every preset). */
const FULL_MAP: Record<string, number> = {
  profile: 2,
  "personal-logs": 2,
  nutrition: 2,
  "check-ins": 2,
  "er-visits": 2,
  dialysis: 2,
  medications: 2,
  labs: 2,
  messages: 2,
};

/** Whether a 403/404 on this API call is what the role's map says:
 *  "intended" (the area is not shared at the level the call needs),
 *  "wrong" (the map covers it, so the refusal is a bug) or "unknown"
 *  (not a patient route, or a route missing from the table). */
function refusalVerdict(
  perms: Record<string, number> | undefined,
  method: string,
  apiPath: string,
): "intended" | "wrong" | "unknown" {
  if (!perms) return "unknown";
  const m = /^\/patients\/[^/]+(?:\/(.*))?$/.exec(apiPath);
  if (!m) return "unknown";
  const rest = m[1] ?? "";
  let key: string | null | undefined;
  if (rest === "") key = null;
  else if (/^care-relationships(\/|$)/.test(rest))
    key = method === "GET" ? "profile" : null;
  else if (/^dialysis\/prescription\/transfers(\/|$)/.test(rest))
    /* GET is PRESCRIPTION READ (caregiver key dialysis); every write is
       PRESCRIPTION MANAGE, which no caregiver map reaches (P16b QA r2). */
    key = method === "GET" ? "dialysis" : null;
  else key = PATIENT_ROUTE_KEYS.find(([re]) => re.test(rest))?.[1];
  if (key === undefined) return "unknown";
  const level = key === null ? 0 : (perms[key] ?? 0);
  return level < (method === "GET" ? 1 : 2) ? "intended" : "wrong";
}

/** Problems that appeared since `m` (console, crash, API). */
async function checkSince(
  ctx: Ctx,
  m: ReturnType<Monitor["mark"]>,
  control: string,
  steps: string,
  opts: { invalidSubmit?: boolean } = {},
) {
  const { mon } = ctx;
  for (const e of mon.pageErrors.slice(m.p))
    await issue(ctx, control, steps, "no uncaught exception", e, "high");
  for (const e of mon.consoleErrors.slice(m.c)) {
    /* A failed request already shows up as its own API finding. */
    if (/Failed to load resource/.test(e)) continue;
    await issue(ctx, control, steps, "no console error", e, "medium");
  }
  const notShared = (await ctx.page.getByText(NOT_SHARED).count()) > 0;
  for (const h of mon.api.slice(m.a)) {
    if (h.status >= 500)
      await issue(
        ctx,
        control,
        steps,
        "no API 5xx",
        `${h.status} ${h.method} ${h.path} ${h.code}`,
        "high",
      );
    else if (h.status >= 400) {
      if (h.status === 429) {
        ctx.cov.notes.push(`429 throttle on ${h.method} ${h.path}`);
        continue;
      }
      if (opts.invalidSubmit && [400, 422].includes(h.status)) continue;
      const handled = HANDLED_4XX.find(
        (x) => x.status === h.status && x.code.test(h.code),
      );
      if (handled) {
        ctx.cov.notes.push(
          `${ctx.current}: handled ${h.status} ${h.method} ${h.path} ${h.code} (${handled.why})`,
        );
        continue;
      }
      if (h.status === 401 && /\/auth\/(refresh|me)|\/me\/context/.test(h.path))
        continue;
      /* An expired access cookie: the API's guard sends a bare 401, the
         client refreshes once and retries (src/lib/api/client.ts). Fine
         when that refresh succeeded. */
      /* The refresh can come back after this check on a busy machine (run
         9: 1.7 s): wait for it, bounded. */
      const refreshed = () =>
        mon.api.some(
          (x) =>
            x.path === "/auth/refresh" && x.status < 400 && x.at >= h.at - 2000,
        );
      if (h.status === 401 && h.code === "" && !refreshed())
        for (let w = 0; w < 20 && !refreshed(); w++)
          await ctx.page.waitForTimeout(250);
      if (h.status === 401 && h.code === "" && refreshed()) {
        ctx.cov.notes.push(
          `${ctx.current}: bare 401 ${h.method} ${h.path} then a successful refresh (access cookie expired; the client retried)`,
        );
        continue;
      }
      if (h.status === 403 || h.status === 404) {
        /* A patient route: judged by its own area against the role's map,
           whatever the body said (it may be unread after a navigation)
           and whatever other text is on the page. */
        const verdict = refusalVerdict(ctx.perms, h.method, h.path);
        if (verdict === "intended") {
          if (h.method === "GET") {
            if (!notShared)
              ctx.cov.notes.push(
                `${ctx.current}: intended ${h.status} ${h.path} ${h.code || "(no code read)"} (area not shared; no "not shared" text on screen)`,
              );
            continue;
          }
          /* A write the map does not allow: fine when the page says so. */
          if (await refusalShown(ctx.page)) {
            ctx.cov.notes.push(
              `${ctx.current}: refused write ${h.method} ${h.path} ${h.code} (refusal shown)`,
            );
            continue;
          }
        } else if (verdict === "unknown") {
          /* Not a patient route (or not in the table): only the role's
             own list of intended refusals counts, never page text. */
          if (
            h.status === 403 &&
            h.method !== "GET" &&
            ctx.intended403(h.path, h.code, "GET") &&
            (await refusalShown(ctx.page))
          ) {
            ctx.cov.notes.push(
              `${ctx.current}: refused write ${h.method} ${h.path} ${h.code} (refusal shown)`,
            );
            continue;
          }
          if (ctx.intended403(h.path, h.code, h.method)) {
            if (!notShared && h.method === "GET")
              ctx.cov.notes.push(
                `${ctx.current}: intended ${h.status} ${h.path} ${h.code} (no "not shared" text on screen)`,
              );
            continue;
          }
        }
        /* verdict "wrong": the map covers this area, so the refusal is
           a finding even if "not shared" shows for another section. */
      }
      await issue(
        ctx,
        control,
        steps,
        "no unexpected 4xx (an intended 403 shows the no-access state)",
        `${h.status} ${h.method} ${h.path} ${h.code}`,
        h.status === 403 ? "medium" : "low",
      );
    }
  }
  /* Next.js dev error overlay or an error boundary. */
  const overlay = await ctx.page
    .locator("[data-nextjs-dialog], [data-nextjs-dialog-overlay]")
    .count();
  if (overlay)
    await issue(
      ctx,
      control,
      steps,
      "no error overlay",
      "Next error overlay shown",
      "blocker",
    );
  /* A crash (Next's client-exception page). A form's own error line such
     as "Something went wrong. Try again." is not a crash. */
  const crashed = await ctx.page
    .getByText(/Application error|Unhandled Runtime Error/i)
    .count();
  if (crashed)
    await issue(
      ctx,
      control,
      steps,
      "page renders",
      "error boundary shown",
      "high",
    );
  /* The generic ErrorState fallback: a read or action failed with no
     readable reason. */
  const generic = await ctx.page
    .getByText(/Something went wrong on this device/i)
    .count();
  if (generic)
    await issue(
      ctx,
      control,
      steps,
      "content, or an error that says what failed",
      "generic error state shown",
      "medium",
    );
}

/** A refusal message on screen (alert, toast or inline text). */
const REFUSAL =
  /not allowed|permission|no access|not shared|(do not|don'?t) have access|can'?t (do|change|edit)|view[- ]only|access denied/i;
async function refusalShown(page: Page): Promise<boolean> {
  return page
    .locator('[role="alert"], [role="status"], [data-sonner-toast]')
    .filter({ hasText: REFUSAL })
    .or(page.getByText(REFUSAL))
    .first()
    .waitFor({ state: "visible", timeout: 1_500 })
    .then(() => true)
    .catch(() => false);
}

/** Wait (briefly) until the page shows no loading indicator. */
async function settled(ctx: Ctx, what: string) {
  const busy = ctx.page.locator(
    `${ctx.root} [aria-busy="true"], ${ctx.root} .animate-pulse`,
  );
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    const n = await busy.count().catch(() => 0);
    const loadingText = await ctx.page
      .locator(ctx.root)
      .getByText(/^Loading( |…|\.\.\.|$)/)
      .count()
      .catch(() => 0);
    if (!n && !loadingText) return;
    await ctx.page.waitForTimeout(250);
  }
  await issue(
    ctx,
    what,
    `open ${ctx.current} and wait 12 s`,
    "content or an empty/error state",
    "still loading after 12 s",
    "high",
  );
}

/** The page-level checks: 404, overflow at 390 px. */
async function pageChecks(ctx: Ctx) {
  const { page } = ctx;
  if (
    (await page
      .getByText(
        /This page could not be found|404 ?[-|:]? ?Not Found|Page not found/i,
      )
      .count()) > 0
  )
    await issue(
      ctx,
      "(page)",
      `open ${ctx.current}`,
      "the page",
      "404 page",
      "high",
    );
  const desk = page.viewportSize() ?? { width: 1280, height: 720 };
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(350);
  const over = await page.evaluate(() => {
    const doc = document.documentElement;
    const out: string[] = [];
    if (doc.scrollWidth > doc.clientWidth + 1) {
      for (const el of Array.from(document.querySelectorAll("body *"))) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.right <= doc.clientWidth + 1) continue;
        const cs = getComputedStyle(el);
        if (cs.position === "fixed") continue;
        // Skip children of an element that scrolls horizontally on purpose.
        let p = el.parentElement;
        let inScroller = false;
        while (p) {
          const ps = getComputedStyle(p);
          if (/(auto|scroll|hidden)/.test(ps.overflowX)) {
            inScroller = true;
            break;
          }
          p = p.parentElement;
        }
        if (inScroller) continue;
        const id =
          el.tagName.toLowerCase() +
          (el.id ? `#${el.id}` : "") +
          ((el.textContent ?? "").trim()
            ? ` "${(el.textContent ?? "").trim().slice(0, 40)}"`
            : "");
        out.push(`${id} right=${Math.round(r.right)}`);
        if (out.length >= 3) break;
      }
      if (!out.length) out.push(`scrollWidth ${doc.scrollWidth}`);
    }
    return out;
  });
  if (over.length)
    await issue(
      ctx,
      "(layout 390px)",
      `open ${ctx.current} at 390 px`,
      "no horizontal page scroll",
      `overflow: ${over.join("; ")}`,
      "low",
    );
  await page.setViewportSize(desk);
  await page.waitForTimeout(150);
}

type Control = { kind: string; name: string; nth: number };

const CONTROL_SEL = [
  "button",
  "a[href]",
  '[role="tab"]',
  '[role="switch"]',
  '[role="combobox"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="menuitem"]',
  "select",
  "summary",
].join(", ");

/** Visible controls in the page body, by kind and accessible-ish name. */
async function listControls(page: Page, root: string): Promise<Control[]> {
  const raw = await page
    .locator(root)
    .first()
    .evaluate((rootEl, sel) => {
      const seen = new Map<string, number>();
      const out: { kind: string; name: string; nth: number }[] = [];
      for (const el of Array.from(rootEl.querySelectorAll(sel))) {
        const h = el as HTMLElement;
        if (h.closest("aside, [role=dialog]")) continue;
        const r = h.getBoundingClientRect();
        const cs = getComputedStyle(h);
        if (
          r.width === 0 ||
          r.height === 0 ||
          cs.visibility === "hidden" ||
          cs.display === "none"
        )
          continue;
        if ((h as HTMLButtonElement).disabled) continue;
        const kind =
          h.getAttribute("role") ??
          (h.tagName === "A" ? "link" : h.tagName.toLowerCase());
        const name = (
          h.getAttribute("aria-label") ??
          h.textContent ??
          h.getAttribute("title") ??
          ""
        )
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 80);
        const key = `${kind}|${name}`;
        const nth = seen.get(key) ?? 0;
        seen.set(key, nth + 1);
        out.push({ kind, name, nth });
      }
      return out;
    }, CONTROL_SEL);
  return raw;
}

/** Find the n-th visible control with that kind and name again. */
async function find(page: Page, root: string, c: Control) {
  const handle = await page
    .locator(root)
    .first()
    .evaluateHandle(
      (rootEl, arg) => {
        let k = 0;
        for (const el of Array.from(rootEl.querySelectorAll(arg.sel))) {
          const h = el as HTMLElement;
          if (h.closest("aside, [role=dialog]")) continue;
          const r = h.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const kind =
            h.getAttribute("role") ??
            (h.tagName === "A" ? "link" : h.tagName.toLowerCase());
          const name = (
            h.getAttribute("aria-label") ??
            h.textContent ??
            h.getAttribute("title") ??
            ""
          )
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 80);
          if (kind !== arg.kind || name !== arg.name) continue;
          if (k++ === arg.nth) return h;
        }
        return null;
      },
      { sel: CONTROL_SEL, kind: c.kind, name: c.name, nth: c.nth },
    )
    .catch(() => null);
  const el = handle?.asElement();
  if (!el) return null;
  return el;
}

const today = () => new Date().toISOString().slice(0, 10);

/** Fill every empty field of a form/dialog with synthetic values. */
async function fillValid(scope: Locator, marker: string) {
  const fields = scope.locator(
    "input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])",
  );
  const n = await fields.count();
  for (let i = 0; i < n; i++) {
    const f = fields.nth(i);
    if (!(await f.isVisible().catch(() => false))) continue;
    /* One bounded read: the dialog may close while it is being filled. */
    const meta = await f
      .evaluate(
        (el) => {
          const label = el.id
            ? (document.querySelector(`label[for="${el.id}"]`)?.textContent ??
              "")
            : "";
          return {
            type: (el.getAttribute("type") ?? "text").toLowerCase(),
            mode: el.getAttribute("inputmode") ?? "",
            name: [
              el.getAttribute("name"),
              el.id,
              el.getAttribute("placeholder"),
              el.getAttribute("aria-label"),
              label,
            ]
              .join(" ")
              .toLowerCase(),
          };
        },
        undefined,
        { timeout: 2_000 },
      )
      .catch(() => null);
    if (!meta) continue;
    const { name } = meta;
    /* Numeric text fields (inputmode, or a unit in the label) get a number. */
    const type =
      meta.type === "text" &&
      (/numeric|decimal/.test(meta.mode) ||
        /\((mg|g|kcal|kg|lb|ml|oz|mmhg|bpm)\)/.test(name))
        ? "number"
        : meta.type;
    const current = await f.inputValue({ timeout: 2_000 }).catch(() => "");
    if (current && type !== "number") continue;
    let v = marker;
    if (type === "email" || /email/.test(name))
      v = `p16b-${Date.now().toString(36)}@example.test`;
    else if (type === "tel" || /phone/.test(name)) v = "5555550100";
    else if (type === "number") {
      const min = Number(
        (await f.getAttribute("min", { timeout: 2_000 }).catch(() => null)) ??
          "NaN",
      );
      const max = Number(
        (await f.getAttribute("max", { timeout: 2_000 }).catch(() => null)) ??
          "NaN",
      );
      v = String(
        Number.isFinite(min) && Number.isFinite(max)
          ? Math.round((min + max) / 2)
          : Number.isFinite(min)
            ? min + 1
            : /systolic/.test(name)
              ? 120
              : /diastolic/.test(name)
                ? 80
                : 5,
      );
    } else if (type === "date") v = today();
    else if (type === "time") v = "09:00";
    else if (type === "datetime-local") v = `${today()}T09:00`;
    else if (type === "month") v = today().slice(0, 7);
    else if (type === "url" || /url|link/.test(name))
      v = "https://example.test/p16b";
    else if (type === "password") v = "Synthetic-P16b-pass1";
    else if (/systolic/.test(name)) v = "120";
    else if (/diastolic/.test(name)) v = "80";
    else if (/(pulse|heart)/.test(name)) v = "70";
    else if (/weight/.test(name)) v = "70";
    else if (/zip|postal/.test(name)) v = "10001";
    else if (/code|otp/.test(name)) v = "000000";
    await f.fill(v, { timeout: 2_000 }).catch(() => undefined);
  }
  const selects = scope.locator("select:not([disabled])");
  for (let i = 0; i < (await selects.count()); i++) {
    const s = selects.nth(i);
    if (!(await s.isVisible().catch(() => false))) continue;
    const opts = await s
      .locator("option")
      .evaluateAll((os) =>
        os.map((o) => (o as HTMLOptionElement).value).filter((v) => v !== ""),
      );
    if (opts.length)
      await s.selectOption(opts[0], { timeout: 2_000 }).catch(() => undefined);
  }
  /* Custom radio groups / segmented choices: pick the first when none is. */
  const groups = scope.locator('[role="radiogroup"]');
  for (let i = 0; i < (await groups.count()); i++) {
    const g = groups.nth(i);
    if ((await g.locator('[aria-checked="true"]').count()) === 0)
      await g
        .locator('[role="radio"]')
        .first()
        .click({ timeout: 2_000 })
        .catch(() => undefined);
  }
  /* Comboboxes (custom selects): open and take the first option. */
  const combos = scope.locator('[role="combobox"]:not(input)');
  for (let i = 0; i < (await combos.count()); i++) {
    const cb = combos.nth(i);
    if (!(await cb.isVisible().catch(() => false))) continue;
    await cb.click({ timeout: 2_000 }).catch(() => undefined);
    const opt = scope.page().locator('[role="option"]').first();
    if (await opt.isVisible().catch(() => false))
      await opt.click({ timeout: 2_000 }).catch(() => undefined);
    else await scope.page().keyboard.press("Escape");
  }
  /* A synthetic file where the form takes one (local test file). */
  const files = scope.locator('input[type="file"]');
  for (let i = 0; i < (await files.count()); i++) {
    const accept =
      (await files
        .nth(i)
        .getAttribute("accept", { timeout: 2_000 })
        .catch(() => null)) ?? "";
    const isCsv = /csv/.test(accept);
    await files
      .nth(i)
      .setInputFiles(
        isCsv
          ? {
              name: "p16b-synthetic.csv",
              mimeType: "text/csv",
              buffer: Buffer.from("name,value\nSynthetic,1\n"),
            }
          : {
              name: "p16b-synthetic.png",
              mimeType: "image/png",
              buffer: PNG_1PX,
            },
      )
      .catch(() => undefined);
  }
}

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

/** Fields of a validly filled form set to invalid input (P16b QA round 2):
 *  a negative number, a malformed email or phone, over-long text where the
 *  field has no maxlength, a future date where the label says the day has
 *  already happened. Returns what was changed and how to put it back. */
async function fillInvalid(scope: Locator): Promise<{
  kinds: string[];
  restore: () => Promise<void>;
}> {
  const fields = scope.locator(
    "input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=search]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])",
  );
  const changed: { f: Locator; old: string }[] = [];
  const kinds = new Set<string>();
  const n = await fields.count();
  for (let i = 0; i < n; i++) {
    const f = fields.nth(i);
    if (!(await f.isVisible().catch(() => false))) continue;
    const meta = await f
      .evaluate(
        (el) => {
          const label = el.id
            ? (document.querySelector(`label[for="${el.id}"]`)?.textContent ??
              "")
            : "";
          return {
            tag: el.tagName.toLowerCase(),
            type: (el.getAttribute("type") ?? "text").toLowerCase(),
            mode: el.getAttribute("inputmode") ?? "",
            maxLength: (el as HTMLInputElement).maxLength,
            value: (el as HTMLInputElement).value,
            name: [
              el.getAttribute("name"),
              el.id,
              el.getAttribute("placeholder"),
              el.getAttribute("aria-label"),
              label,
            ]
              .join(" ")
              .toLowerCase(),
          };
        },
        undefined,
        { timeout: 2_000 },
      )
      .catch(() => null);
    if (!meta) continue;
    const { name, type } = meta;
    const numeric =
      type === "number" ||
      (type === "text" &&
        (/numeric|decimal/.test(meta.mode) ||
          /\((mg|g|kcal|kg|lb|lbs|ml|oz|mmhg|bpm)\)/.test(name)));
    let v: string | null = null;
    let kind = "";
    if (numeric) {
      v = "-5";
      kind = "negative number";
    } else if (type === "email" || /e-?mail/.test(name)) {
      v = "not-an-email";
      kind = "malformed email";
    } else if (type === "tel" || /phone/.test(name)) {
      v = "not-a-phone";
      kind = "malformed phone";
    } else if (type === "date") {
      if (
        /birth|dob|diagnos|onset|occurred|happened|visit|taken|logged|measured/.test(
          name,
        )
      ) {
        v = "2099-01-01";
        kind = "future date";
      }
    } else if (
      (type === "text" || meta.tag === "textarea") &&
      meta.maxLength < 0 &&
      !/search|filter|code|otp/.test(name)
    ) {
      /* Past every text limit a caregiver can reach (the largest server
         limit is 50,000; a 5,001 one was within some of them). */
      v = "x".repeat(60_001);
      kind = "over-long text";
    }
    if (v === null) continue;
    await f.fill(v, { timeout: 2_000 }).catch(() => undefined);
    changed.push({ f, old: meta.value });
    kinds.add(kind);
  }
  return {
    kinds: [...kinds],
    restore: async () => {
      for (const { f, old } of changed)
        await f.fill(old, { timeout: 2_000 }).catch(() => undefined);
    },
  };
}

/** Submit a validly filled form with invalid input and expect a message
 *  (a field message, an alert, the browser's own field check, a disabled
 *  submit, or a refused 400 shown in the form), never a save. Returns
 *  false when the form closed (it saved or went away). */
async function invalidPass(
  ctx: Ctx,
  scope: Locator,
  opener: string,
): Promise<boolean> {
  const { page, mon } = ctx;
  const { kinds, restore } = await fillInvalid(scope);
  if (!kinds.length) {
    ctx.cov.notes.push(
      `${ctx.current}: "${opener}": no field takes an invalid value (selects, bounded text); invalid pass skipped`,
    );
    return true;
  }
  const what = kinds.join(", ");
  const submit = await submitOf(scope);
  if (!submit || !(await submit.isEnabled().catch(() => false))) {
    ctx.cov.notes.push(
      `${ctx.current}: "${opener}" with ${what}: submit disabled (refused before sending)`,
    );
    await restore();
    return true;
  }
  const label = ((await submit.textContent()) ?? "").trim();
  /* A page form may answer in the page's own alert (above the form). */
  const pageAlerts = () =>
    page
      .locator('main [role="alert"]')
      .filter({ visible: true })
      .allTextContents()
      .then((t) => t.join("|"))
      .catch(() => "");
  const alertsBefore = await pageAlerts();
  const dialogsBefore = await page.getByRole("dialog").count();
  const m = mon.mark();
  await submit.click({ timeout: 3_000 }).catch(() => undefined);
  await page.waitForTimeout(700);
  /* A confirmation step (the messaging safety notice) opened: answer it,
     so what is judged is what the form does with the input. */
  if ((await page.getByRole("dialog").count()) > dialogsBefore) {
    const confirm = page
      .getByRole("dialog")
      .last()
      .getByRole("button", {
        name: /continue|confirm|understand|agree|send|^ok|yes/i,
      })
      .last();
    if (await confirm.isVisible().catch(() => false)) {
      ctx.cov.notes.push(
        `${ctx.current}: "${opener}" with invalid input: a confirmation step opened and was confirmed`,
      );
      await confirm.click({ timeout: 3_000 }).catch(() => undefined);
      await page.waitForTimeout(900);
    }
  }
  ctx.cov.formsSubmitted++;
  ctx.cov.invalidSubmitted++;
  const control = `${opener} > ${label} (invalid: ${what})`;
  const steps = `open "${opener}", fill it, then enter ${what}, and submit "${label}"`;
  /* Uploads (/files) may run before the form's own check. */
  const writes = mon.api
    .slice(m.a)
    .filter((h) => h.method !== "GET" && !/^\/files(\/|$)/.test(h.path));
  const saved = writes.filter((h) => h.status < 400);
  const refused400 = writes.filter((h) => [400, 422].includes(h.status));
  const open = await scope.isVisible().catch(() => false);
  const alertsAfter = await pageAlerts();
  const pageMessage = alertsAfter !== "" && alertsAfter !== alertsBefore;
  const message =
    pageMessage ||
    (open &&
      ((await scope
        .getByText(VALIDATION)
        .count()
        .catch(() => 0)) > 0 ||
        (await scope
          .locator('[aria-invalid="true"], [role="alert"]')
          .count()
          .catch(() => 0)) > 0 ||
        (await scope
          .locator("input:invalid, textarea:invalid, select:invalid")
          .count()
          .catch(() => 0)) > 0));
  if (saved.length)
    await issue(
      ctx,
      control,
      steps,
      "a validation message, nothing saved",
      `saved invalid input (${saved.map((h) => `${h.status} ${h.method} ${h.path}`).join(", ")})`,
      "medium",
    );
  else if (refused400.length && !message)
    await issue(
      ctx,
      control,
      steps,
      "the server's refusal shown in the form",
      `${refused400.map((h) => `${h.status} ${h.method} ${h.path} ${h.code}`).join(", ")} with no message in the form`,
      "medium",
    );
  else if (!message)
    await issue(
      ctx,
      control,
      steps,
      "a validation message",
      open
        ? "nothing sent and no message (a control that does nothing)"
        : "the form closed with nothing sent and no message",
      "low",
    );
  else
    ctx.cov.notes.push(
      `${ctx.current}: "${opener}" with ${what}: ${refused400.length ? "server 400 shown in the form" : "validation message shown"}, nothing saved`,
    );
  await checkSince(ctx, m, control, steps, { invalidSubmit: true });
  if (!open) return false;
  await restore();
  return true;
}

/** The submit button of a dialog or form. */
async function submitOf(scope: Locator): Promise<Locator | null> {
  const typed = scope
    .locator('button[type="submit"]')
    .filter({ visible: true });
  if (await typed.count()) return typed.last();
  const named = scope.getByRole("button").filter({ hasText: SUBMIT });
  const n = await named.count();
  for (let i = n - 1; i >= 0; i--) {
    const b = named.nth(i);
    const t = ((await b.textContent()) ?? "").trim();
    if (DANGER.test(t)) continue;
    if (await b.isVisible()) return b;
  }
  return null;
}

/** Empty submit, invalid submit, then valid submit, of an open dialog. Returns the marker
 *  when a valid submit closed the dialog with a successful write. */
async function exerciseDialog(
  ctx: Ctx,
  opener: string,
  allowWrites: boolean,
): Promise<string | null> {
  const { page, mon } = ctx;
  const dialog = page.getByRole("dialog").last();
  ctx.cov.dialogsOpened++;
  const submit = await submitOf(dialog);
  if (!submit) return null;
  const label = ((await submit.textContent()) ?? "").trim();
  /* 1. Empty submit: a validation message, a disabled button, or a refusal
        that is shown; never a silent save. */
  const writesBefore = mon.api.filter((h) => h.method !== "GET").length;
  /* Empty text fields the user would have to fill. A form with none (every
     field has a default, e.g. a check-in that defaults to "Good") may save
     as it is. */
  const emptyFields = await dialog
    .locator(
      "input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=date]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])",
    )
    .evaluateAll(
      (els) =>
        els.filter(
          (e) =>
            (e as HTMLInputElement).value === "" &&
            (e as HTMLElement).offsetParent !== null &&
            (e.hasAttribute("required") ||
              e.getAttribute("aria-required") === "true"),
        ).length,
    )
    .catch(() => 0);
  const m0 = mon.mark();
  const enabled = await submit.isEnabled().catch(() => false);
  if (enabled) {
    await submit.click({ timeout: 3_000 }).catch(() => undefined);
    await page.waitForTimeout(500);
    ctx.cov.formsSubmitted++;
    const okWrites = mon.api
      .slice(m0.a)
      .filter((h) => h.method !== "GET" && h.status < 400).length;
    const stillOpen = await dialog.isVisible().catch(() => false);
    const hasValidation =
      (await dialog
        .getByText(VALIDATION)
        .count()
        .catch(() => 0)) > 0 ||
      (await dialog
        .locator('[aria-invalid="true"], [role="alert"]')
        .count()
        .catch(() => 0)) > 0;
    if (
      okWrites > 0 &&
      emptyFields === 0 &&
      mon.api.filter((h) => h.method !== "GET").length > writesBefore
    )
      ctx.cov.notes.push(
        `${ctx.current}: "${opener}" > "${label}" saved untouched: no required field was empty (defaults)`,
      );
    else if (
      okWrites > 0 &&
      mon.api.filter((h) => h.method !== "GET").length > writesBefore
    )
      await issue(
        ctx,
        `${opener} > ${label} (empty)`,
        `open "${opener}", submit "${label}" with the form untouched`,
        "a validation message, nothing saved",
        `saved with an empty form (${mon.api
          .slice(m0.a)
          .filter((h) => h.method !== "GET")
          .map((h) => `${h.status} ${h.method} ${h.path}`)
          .join(", ")})`,
        "medium",
      );
    else if (stillOpen && !hasValidation)
      ctx.cov.notes.push(
        `${ctx.current}: "${opener}" > "${label}" empty submit kept the dialog open with no visible message`,
      );
    await checkSince(
      ctx,
      m0,
      `${opener} > ${label} (empty)`,
      `submit "${opener}" empty`,
      {
        invalidSubmit: true,
      },
    );
    if (!stillOpen) return null;
  }
  if (!allowWrites) return null;
  const marker = `Synthetic P16b ${Date.now().toString(36)}`;
  await fillValid(dialog, marker);
  /* 2. Invalid input on a validly filled form (P16b QA round 2: Goals
        saved "-5" as 0, and no in-app form was ever sent invalid input). */
  if (!(await invalidPass(ctx, dialog, opener))) return null;
  /* 3. Valid synthetic data, then submit. */
  await fillValid(dialog, marker);
  const m1 = mon.mark();
  const s2 = await submitOf(dialog);
  if (!s2 || !(await s2.isEnabled().catch(() => false))) {
    ctx.cov.notes.push(
      `${ctx.current}: "${opener}": submit stays disabled after the generic fill (form needs specific input)`,
    );
    return null;
  }
  await s2.click({ timeout: 3_000 }).catch(() => undefined);
  ctx.cov.formsSubmitted++;
  await dialog
    .waitFor({ state: "hidden", timeout: 6_000 })
    .catch(() => undefined);
  const writes = mon.api.slice(m1.a).filter((h) => h.method !== "GET");
  await checkSince(
    ctx,
    m1,
    `${opener} > ${label}`,
    `fill "${opener}" with synthetic data and submit`,
    {
      invalidSubmit: true,
    },
  );
  const ok = writes.some((h) => h.status < 400);
  const stillOpen = await dialog.isVisible().catch(() => false);
  if (writes.some((h) => h.status === 403) && stillOpen) {
    const shown =
      (await dialog.locator('[role="alert"]').count()) > 0 ||
      (await dialog
        .getByText(/not allowed|permission|access|not shared/i)
        .count()) > 0;
    if (!shown)
      await issue(
        ctx,
        `${opener} > ${label}`,
        `submit "${opener}" as a role without write access`,
        "the refusal is shown",
        "403 with no message in the dialog",
        "medium",
      );
  }
  return ok && !stillOpen ? marker : null;
}

/** An empty full-screen click-away layer. */
const BACKDROP = "div.fixed.inset-0:empty";

/** Upper bound for the clicks on one page (the crawl must stay fast). */
const PAGE_BUDGET_MS = 4 * 60_000;

/** Click every control on the current page. */
async function crawlPage(
  ctx: Ctx,
  opts: { allowWrites: boolean; maxControls?: number },
) {
  const { page, mon } = ctx;
  await settled(ctx, "(page load)");
  await pageChecks(ctx);
  const startUrl = page.url();
  const controls = await listControls(page, ctx.root);
  const created: string[] = [];
  const done = new Set<string>();
  let clicked = 0;
  /* A time budget per page keeps the crawl bounded; what is left is noted. */
  const deadline = Date.now() + PAGE_BUDGET_MS;
  for (const c of controls) {
    if (Date.now() > deadline) {
      ctx.cov.notes.push(
        `${ctx.current}: page time budget reached (${controls.length} controls, ${clicked} clicked)`,
      );
      break;
    }
    if (clicked >= (opts.maxControls ?? 70)) {
      ctx.cov.notes.push(
        `${ctx.current}: control cap reached (${controls.length} controls, ${clicked} clicked)`,
      );
      break;
    }
    const label = `${c.kind} "${c.name}"${c.nth ? ` #${c.nth + 1}` : ""}`;
    if (DANGER.test(c.name) || (LANGUAGE.test(c.name) && c.name.length <= 8))
      continue;
    /* Same-name repeats in lists (row actions): click the first three. */
    const key = `${c.kind}|${c.name}`;
    if (c.nth >= 3 || done.has(`${key}|${c.nth}`)) continue;
    done.add(`${key}|${c.nth}`);
    if (page.url() !== startUrl) {
      await ctx.go(new URL(startUrl).pathname + new URL(startUrl).search);
      await settled(ctx, "(back to page)");
    }
    const el = await find(page, ctx.root, c);
    if (!el) continue;
    const href = c.kind === "link" ? await el.getAttribute("href") : null;
    const target = c.kind === "link" ? await el.getAttribute("target") : null;
    /* External links (mailto/tel/other origin) are checked, not followed. */
    if (href && /^(mailto:|tel:|sms:)/.test(href)) {
      clicked++;
      continue;
    }
    if (
      href &&
      /^https?:/.test(href) &&
      !href.startsWith(new URL(startUrl).origin)
    ) {
      ctx.cov.notes.push(
        `${ctx.current}: external link ${href} (not followed)`,
      );
      clicked++;
      continue;
    }
    if (target === "_blank") {
      ctx.cov.notes.push(
        `${ctx.current}: new-tab link ${href ?? c.name} (checked by URL only)`,
      );
    }
    const m = mon.mark();
    const before = await page
      .locator(ctx.root)
      .first()
      .evaluate(
        (n) => n.innerHTML.length + ":" + n.innerHTML.slice(0, 2000).length,
      )
      .catch(() => "");
    const htmlBefore = await page
      .locator("body")
      .innerHTML()
      .catch(() => "");
    const dialogsBefore = await page.getByRole("dialog").count();
    const layersBefore = await page.locator(BACKDROP).count();
    /* Already the selected tab/filter/option: clicking it changes nothing,
       on purpose. */
    const alreadyOn = await el
      .evaluate(
        (e) =>
          ["aria-selected", "aria-pressed", "aria-checked"].some(
            (a) => e.getAttribute(a) === "true",
          ) ||
          e.getAttribute("aria-current") === "page" ||
          (e as HTMLInputElement).checked === true,
      )
      .catch(() => false);
    const opensBefore = mon.externalOpens.length;
    let chooser = false;
    const onChooser = () => {
      chooser = true;
    };
    page.on("filechooser", onChooser);
    if (c.kind === "select") {
      const opts2 = await el.$$eval("option", (os) =>
        os.map((o) => (o as HTMLOptionElement).value),
      );
      if (opts2.length > 1)
        await el
          .selectOption(opts2[1], { timeout: 2_000 })
          .catch(() => undefined);
    } else {
      const res = await el
        .click({ timeout: 3_000 })
        .then(() => "ok")
        .catch((e: Error) => e.message.split("\n")[0]);
      if (res !== "ok") {
        page.off("filechooser", onChooser);
        ctx.cov.notes.push(`${ctx.current}: could not click ${label}: ${res}`);
        continue;
      }
    }
    clicked++;
    ctx.cov.controlsClicked++;
    await page.waitForTimeout(350);
    /* A click that navigates: wait for the new document (bounded), so the
       checks below never queue behind a navigation that has not committed
       (run 3 hung 40 minutes on one). */
    if (page.url() !== startUrl)
      await page
        .waitForLoadState("domcontentloaded", { timeout: 20_000 })
        .catch(() => undefined);
    const steps = `on ${ctx.current}, click ${label}`;
    const dialogsAfter = await page.getByRole("dialog").count();
    const urlChanged = page.url() !== startUrl;
    const htmlAfter = await page
      .locator("body")
      .innerHTML()
      .catch(() => "");
    const after = await page
      .locator(ctx.root)
      .first()
      .evaluate(
        (n) => n.innerHTML.length + ":" + n.innerHTML.slice(0, 2000).length,
      )
      .catch(() => "");
    if (dialogsAfter > dialogsBefore) {
      /* The click that opened it; what the dialog then does is checked in
         exerciseDialog, and only its closing below (no double count). */
      await checkSince(ctx, m, label, steps);
      const made = await exerciseDialog(ctx, c.name, opts.allowWrites);
      if (made) created.push(made);
      const dialogMark = mon.mark();
      /* Close whatever is still open. */
      for (let i = 0; i < 3 && (await page.getByRole("dialog").count()); i++) {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(150);
      }
      if (await page.getByRole("dialog").count()) {
        const close = page
          .getByRole("dialog")
          .last()
          .getByRole("button", { name: /close|cancel|not now|back/i })
          .first();
        await close.click({ timeout: 2_000 }).catch(() => undefined);
      }
      Object.assign(m, dialogMark);
    } else if (urlChanged) {
      await settled(ctx, label);
      if (
        (await page
          .getByText(
            /This page could not be found|404 ?[-|:]? ?Not Found|Page not found/i,
          )
          .count()) > 0
      )
        await issue(
          ctx,
          label,
          steps,
          "a working page",
          `404 at ${page.url()}`,
          "high",
        );
    } else if (
      htmlAfter === htmlBefore &&
      before === after &&
      mon.requests === m.r &&
      mon.downloads.length === m.d &&
      mon.externalOpens.length === opensBefore &&
      c.kind !== "link" &&
      /* A select's new value shows on submit; a file picker or the print
         dialog opens outside the page. */
      c.kind !== "select" &&
      !chooser &&
      !alreadyOn &&
      !/^print$/i.test(c.name)
    ) {
      await issue(
        ctx,
        label,
        steps,
        "a visible effect (state change, navigation, dialog, request or download)",
        "nothing happened",
        "low",
      );
    }
    page.off("filechooser", onChooser);
    if (chooser)
      ctx.cov.notes.push(`${ctx.current}: ${label} opened the file picker`);
    for (const u of mon.externalOpens.slice(opensBefore))
      ctx.cov.notes.push(
        `${ctx.current}: ${label} asked to open ${u} in a new tab (external, not followed)`,
      );
    await checkSince(ctx, m, label, steps);
    /* Menus/popovers opened by the click: close. */
    if (
      !urlChanged &&
      (await page.locator('[role="menu"], [role="listbox"]').count())
    )
      await page.keyboard.press("Escape");
    /* A click-away backdrop (an empty full-screen layer, e.g. the landing
       header's language list, which Escape does not close): click it away
       so it does not swallow the next clicks. */
    const backdrop = page.locator(BACKDROP).last();
    if (!urlChanged && (await page.locator(BACKDROP).count()) > layersBefore) {
      ctx.cov.notes.push(
        `${ctx.current}: ${label} left a click-away layer open (closed by a click on it)`,
      );
      await backdrop
        .click({ position: { x: 2, y: 2 }, timeout: 2_000 })
        .catch(() => undefined);
    }
  }
  /* In-page forms (not in a dialog): invalid input, then valid input. */
  if (opts.allowWrites && ctx.root === "main")
    await pageForms(ctx, startUrl, created);
  /* Persistence and clean-up of what this crawl created. */
  for (const marker of created) {
    await ctx.go(new URL(startUrl).pathname + new URL(startUrl).search);
    await settled(ctx, "(reload check)");
    const shown = page.getByText(marker).first();
    if (!(await shown.isVisible({ timeout: 4_000 }).catch(() => false))) {
      ctx.cov.notes.push(
        `${ctx.current}: saved "${marker}" not listed on this page after re-open (may be shown elsewhere; review)`,
      );
      continue;
    }
    /* Delete it again through its own row action, when the row has one. */
    const row = page
      .locator("li, tr, article, [data-row], div")
      .filter({ hasText: marker })
      .filter({ has: page.getByRole("button", { name: /delete|remove/i }) })
      .last();
    if (await row.count()) {
      const m = mon.mark();
      await row
        .getByRole("button", { name: /delete|remove/i })
        .first()
        .click({ timeout: 3_000 })
        .catch(() => undefined);
      const confirm = page
        .getByRole("dialog")
        .last()
        .getByRole("button", { name: /delete|remove|confirm|yes/i })
        .last();
      if (await confirm.isVisible({ timeout: 1_500 }).catch(() => false))
        await confirm.click({ timeout: 3_000 }).catch(() => undefined);
      await page.waitForTimeout(600);
      await checkSince(
        ctx,
        m,
        `delete "${marker}"`,
        "delete the record the crawl created",
      );
      ctx.cov.notes.push(`${ctx.current}: created and deleted "${marker}"`);
    }
  }
}

/** Forms in the page body, which the control clicks only sent as they
 *  were: each visible one (search forms aside) is filled, sent with
 *  invalid input, then sent valid (P16b QA round 2). */
async function pageForms(ctx: Ctx, startUrl: string, created: string[]) {
  const { page, mon } = ctx;
  const path0 = new URL(startUrl).pathname + new URL(startUrl).search;
  for (let i = 0; i < 6; i++) {
    if (page.url() !== startUrl) {
      await ctx.go(path0);
      await settled(ctx, "(back to page)");
    }
    for (let k = 0; k < 3 && (await page.getByRole("dialog").count()); k++)
      await page.keyboard.press("Escape");
    const forms = page
      .locator(`${ctx.root} form:not([role="search"])`)
      .filter({ visible: true })
      .filter({
        has: page.locator(
          "input:not([type=hidden]):not([type=search]):not([type=checkbox]):not([type=radio]), textarea",
        ),
      });
    const count = await forms.count().catch(() => 0);
    if (i >= count) return;
    const form = forms.nth(i);
    if ((await form.locator("xpath=ancestor::*[@role='dialog']").count()) > 0)
      continue;
    if (!(await submitOf(form))) continue;
    const name = (
      (await form
        .evaluate(
          (el) =>
            el.getAttribute("aria-label") ??
            el.querySelector("h1,h2,h3,legend,label")?.textContent ??
            "",
        )
        .catch(() => "")) || `form #${i + 1}`
    )
      .trim()
      .slice(0, 50);
    ctx.cov.pageForms++;
    const marker = `Synthetic P16b ${Date.now().toString(36)}`;
    await fillValid(form, marker);
    if (!(await invalidPass(ctx, form, `page form "${name}"`))) continue;
    await fillValid(form, marker);
    const s = await submitOf(form);
    if (!s || !(await s.isEnabled().catch(() => false))) {
      ctx.cov.notes.push(
        `${ctx.current}: page form "${name}": submit stays disabled after the generic fill`,
      );
      continue;
    }
    const label = ((await s.textContent()) ?? "").trim();
    const m = mon.mark();
    await s.click({ timeout: 3_000 }).catch(() => undefined);
    await page.waitForTimeout(800);
    ctx.cov.formsSubmitted++;
    await checkSince(
      ctx,
      m,
      `page form "${name}" > ${label}`,
      `fill page form "${name}" with synthetic data and submit`,
      { invalidSubmit: true },
    );
    const ok = mon.api
      .slice(m.a)
      .some(
        (h) =>
          h.method !== "GET" &&
          h.status < 400 &&
          !/^\/files(\/|$)/.test(h.path),
      );
    if (ok) created.push(marker);
  }
}

/** The env's local S3 stand-in (E2E_STORAGE_ORIGIN, local hosts only, as
 *  in e2e/52): photos the pages show are read from it. Nothing else is
 *  let through; the fixture still blocks and records every other host. */
const storageOrigin = (() => {
  const raw = process.env.E2E_STORAGE_ORIGIN ?? "";
  if (!raw) return null;
  const u = new URL(raw);
  if (!["localhost", "127.0.0.1"].includes(u.hostname))
    throw new Error("E2E_STORAGE_ORIGIN must be the local S3 stand-in");
  return u.origin;
})();

async function allowLocalStorage(page: Page) {
  if (!storageOrigin) return;
  await page.route(
    (url) => url.origin === storageOrigin,
    (route) => route.continue(),
  );
}

/** window.open to another origin (e.g. "Directions" to a map site) is
 *  recorded and not opened: the crawl never leaves the env, and the
 *  third-party block would otherwise fail the run on a user-chosen link. */
async function guardExternalOpen(page: Page, mon: Monitor) {
  await page.exposeFunction("__p16ExternalOpen", (url: string) => {
    mon.externalOpens.push(url);
  });
  await page.addInitScript(() => {
    const w = window as unknown as {
      open: typeof window.open;
      __p16ExternalOpen: (u: string) => void;
    };
    const real = w.open.bind(window);
    w.open = (url?: string | URL, ...rest) => {
      const href = url === undefined ? "" : String(url);
      let other = false;
      try {
        other = new URL(href, location.href).origin !== location.origin;
      } catch {
        other = false;
      }
      if (other) {
        w.__p16ExternalOpen(href);
        return null;
      }
      return real(url, ...rest);
    };
  });
}

/** A setup sign-in through the API, once more when the busy machine makes
 *  the first one time out (run 4: a 10 s timeout on POST /auth/login). */
async function loginRetry(account: Account) {
  try {
    return await ApiClient.login(account);
  } catch (e) {
    if (!/Timeout/i.test(String(e))) throw e;
    return ApiClient.login(account);
  }
}

/* ------------------------------------------------------------------ */
/* Navigation helpers                                                  */
/* ------------------------------------------------------------------ */

/** page.goto that survives a `next dev` stall: the dev server compiles on
 *  demand and a Fast Refresh full reload can leave one navigation hanging
 *  (runs 1 and 2 on env 08). One retry with a longer timeout; a second
 *  failure is a real failure. */
async function gotoSafe(page: Page, href: string) {
  try {
    await page.goto(href, { waitUntil: "domcontentloaded", timeout: 30_000 });
  } catch {
    await page.goto(href, { waitUntil: "domcontentloaded", timeout: 60_000 });
  }
}

/** In-app navigation through the Next router when the page exposes it in
 *  dev, else a click on a matching link, else page.goto. */
function inAppGo(page: Page, reopen?: () => Promise<void>) {
  return async (href: string) => {
    /* A dialog the last page left open (e.g. "Share Outside NephroReach",
       run 6) covers the sidebar: close it first. */
    for (let i = 0; i < 3; i++) {
      if (
        !(await page
          .getByRole("dialog")
          .count()
          .catch(() => 0))
      )
        break;
      await page.keyboard.press("Escape");
      await page.waitForTimeout(150);
    }
    const link = page.locator(`aside a[href="${href}"]`).first();
    if (await link.isVisible().catch(() => false)) {
      await link.click({ timeout: 5_000 }).catch(() => gotoSafe(page, href));
    } else {
      const pushed = await page.evaluate((h) => {
        const w = window as unknown as {
          next?: { router?: { push: (h: string) => void } };
          nd?: { router?: { push: (h: string) => void } };
        };
        const r = w.next?.router ?? w.nd?.router;
        if (!r) return false;
        r.push(h);
        return true;
      }, href);
      if (!pushed) await gotoSafe(page, href);
    }
    await page
      .waitForURL(
        (u) =>
          u.pathname.replace(/\/$/, "") ===
          href.split("?")[0].replace(/\/$/, ""),
        {
          timeout: 20_000,
        },
      )
      .catch(() => undefined);
    if (
      reopen &&
      /\/dashboard\/caregiver\/?$/.test(new URL(page.url()).pathname) &&
      href !== "/dashboard/caregiver"
    ) {
      await reopen();
      await page.evaluate((h) => {
        const w = window as unknown as {
          next?: { router?: { push: (h: string) => void } };
        };
        w.next?.router?.push(h);
      }, href);
      await page
        .waitForURL(`**${href}`, { timeout: 20_000 })
        .catch(() => undefined);
    }
  };
}

/** Sidebar pages, after opening every collapsed group. */
async function sidebarPages(page: Page): Promise<string[]> {
  await page
    .locator("aside a[href^='/dashboard']")
    .first()
    .waitFor({ timeout: 30_000 });
  const toggles = page.locator('aside button[aria-expanded="false"]');
  for (let i = 0; i < 10 && (await toggles.count()); i++)
    await toggles
      .first()
      .click({ timeout: 2_000 })
      .catch(() => undefined);
  return [
    ...new Set(
      await page
        .locator('aside a[href^="/dashboard"]')
        .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? "")),
    ),
  ].filter(Boolean);
}

/** Internal dashboard links found in a page body (sub-pages). */
async function bodyLinks(page: Page): Promise<string[]> {
  return [
    ...new Set(
      await page
        .locator('main a[href^="/dashboard"]')
        .evaluateAll((els) =>
          els.map((e) => (e.getAttribute("href") ?? "").split("#")[0]),
        ),
    ),
  ].filter(Boolean);
}

/** One representative per dynamic route (ids collapse to :id). */
function routeKey(href: string) {
  return href
    .split("?")[0]
    .replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "/:id")
    .replace(/\/\d+(?=\/|$)/g, "/:n");
}

function newCoverage(role: string): Coverage {
  return {
    role,
    pages: [],
    controlsClicked: 0,
    formsSubmitted: 0,
    invalidSubmitted: 0,
    pageForms: 0,
    dialogsOpened: 0,
    downloads: 0,
    notes: [],
  };
}

/** Crawl a role's portal: sidebar pages, then sub-pages found in them. */
async function crawlPortal(
  ctx: Ctx,
  opts: { allowWrites: boolean; extra?: string[]; maxPages?: number },
) {
  const queue = [...(await sidebarPages(ctx.page)), ...(opts.extra ?? [])];
  const seen = new Set<string>();
  while (queue.length) {
    const href = queue.shift()!;
    const key = routeKey(href);
    if (seen.has(key)) continue;
    /* My Patients is crawled on its own without writes: its Open buttons
       switch the patient, which would move the rest of this crawl to
       another person. */
    if (/^\/dashboard\/caregiver\/?$/.test(href)) continue;
    if (
      /\/dashboard\/(admin|clinic|hospital|nephrology|access-center|platform)/.test(
        href,
      )
    )
      continue;
    seen.add(key);
    if (seen.size > (opts.maxPages ?? 60)) break;
    ctx.current = href;
    const m = ctx.mon.mark();
    await ctx.go(href);
    ctx.cov.pages.push(href);
    await checkSince(ctx, m, "(open page)", `open ${href}`);
    for (const l of await bodyLinks(ctx.page))
      if (!seen.has(routeKey(l))) queue.push(l);
    await crawlPage(ctx, { allowWrites: opts.allowWrites });
    for (const l of await bodyLinks(ctx.page).catch(() => []))
      if (!seen.has(routeKey(l))) queue.push(l);
  }
}

/* ------------------------------------------------------------------ */
/* Shared state between the tests (serial)                              */
/* ------------------------------------------------------------------ */

/* Not serial: a failing role must not skip the next roles (the limited
   caregiver is set up through the API when the public test did not). */
test.describe.configure({ timeout: 45 * 60_000 });

/** The running test's results, written by afterEach even on a failure. */
let open: {
  name: string;
  issues: Issue[];
  cov: Coverage;
  mon: Monitor;
} | null = null;

test.afterEach(async ({}, info) => {
  if (!open) return;
  const { name, issues, cov, mon } = open;
  open = null;
  cov.downloads = mon.downloads.length;
  markAllowed(issues);
  writeResult(name, {
    status: info.status,
    error: info.error?.message?.split("\n")[0] ?? null,
    coverage: cov,
    issues,
  });
});

/** Grace's custom map for the limited caregiver: profile and logs view,
 *  medications edit, everything else not shared. */
const LIMITED_MAP = {
  profile: 1,
  "personal-logs": 1,
  nutrition: 0,
  "check-ins": 0,
  "er-visits": 0,
  dialysis: 0,
  medications: 2,
  labs: 0,
  journal: 0,
  messages: 0,
};

/** The limited caregiver through the API: register (D6 consent), verify the
 *  mailed code, Grace invites with LIMITED_MAP, the account accepts. */
async function setupLimitedCaregiver(): Promise<Account> {
  const acct = throwawayAccount("p16b-cg");
  const consent = await currentConsent();
  const since = mailMark();
  await pace("register");
  const ctx = await request.newContext();
  try {
    const res = await ctx.post(`${env.apiURL}/auth/register`, {
      headers: { "X-Auth-Transport": "bearer", Origin: appOrigin },
      data: { ...acct, consent },
    });
    const body = await json(res, "register limited caregiver");
    const access = (body.tokens as { access: { token: string } }).access.token;
    const mail = await waitForMail(acct.email, { since, subject: /verify/i });
    const v = await ctx.post(`${env.apiURL}/auth/email/verify/confirm`, {
      headers: { Authorization: `Bearer ${access}`, Origin: appOrigin },
      data: { code: extractOtp(mail) },
    });
    expect(v.ok(), `verify limited caregiver: ${v.status()}`).toBeTruthy();
  } finally {
    await ctx.dispose();
  }
  const grace = await loginRetry(ACCOUNTS.grace);
  try {
    const inv = await grace.post(
      `/patients/${await grace.patientId()}/caregiver-invitations`,
      {
        email: acct.email,
        relationship: "Son",
        preset: "custom",
        permissions: LIMITED_MAP,
      },
    );
    expect(inv.ok(), `invite ${inv.status()}`).toBeTruthy();
  } finally {
    await grace.logout();
    await grace.dispose();
  }
  const me = await ApiClient.login(acct);
  try {
    const list = (await json(await me.get("/me/invitations"), "mine"))
      .data as Array<{ id: string; status: string }>;
    const pending = list.find((i) => i.status === "PENDING");
    expect(pending, "pending caregiver invitation").toBeTruthy();
    const res = await me.post(`/me/invitations/${pending!.id}/accept`);
    expect(res.ok(), `accept ${res.status()}`).toBeTruthy();
  } finally {
    await me.logout();
    await me.dispose();
  }
  return acct;
}

/** Registered through the UI by the public test, then invited by Grace. */
let limited: Account | null = null;

const PUBLIC_PAGES = [
  "/",
  "/pricing",
  "/about-us",
  "/contact-us",
  "/faq",
  "/login",
  "/registration",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/two-factor",
  "/confirm-email",
  "/invitations/p16b-not-a-real-token",
  "/secure/p16b-not-a-real-token",
];

/** `next dev` compiles a route on its first request, which can take longer
 *  than the navigation timeout on a busy machine (run 1 timed out on "/").
 *  Request every route of the lane once before the crawl so the crawl
 *  measures the app, not the compiler. */
const WARM_ROUTES = [
  ...PUBLIC_PAGES,
  "/setup/patient",
  "/setup/mfa",
  "/dashboard",
  "/dashboard/caregiver",
  "/dashboard/my-health",
  "/dashboard/personal-log",
  "/dashboard/messages",
  "/dashboard/my-caregivers",
  "/dashboard/settings",
];

test.beforeAll(async () => {
  test.setTimeout(10 * 60_000);
  const ctx = await request.newContext({ baseURL: appOrigin });
  try {
    for (const r of WARM_ROUTES)
      await ctx
        .get(r, { timeout: 180_000, maxRedirects: 0 })
        .catch(() => undefined);
  } finally {
    await ctx.dispose();
  }
});

test("anonymous: every public page and control @phase16", async ({ page }) => {
  const issues: Issue[] = [];
  const cov = newCoverage("anonymous");
  const mon = new Monitor(page);
  open = { name: "anonymous", issues, cov, mon };
  await allowLocalStorage(page);
  await guardExternalOpen(page, mon);
  const ctx: Ctx = {
    role: "anonymous",
    page,
    mon,
    issues,
    cov,
    root: "body",
    current: "/",
    go: async (href) => {
      await gotoSafe(page, href);
    },
    /* Public pages read nothing private; a bad invitation/share token is
       refused on purpose. */
    intended403: (p, code, method) =>
      /^\/(invitations|shared)\//.test(p) ||
      /* After "Continue" this is the limited caregiver (Grace's custom
         map): reads of the areas she did not share are refused on purpose. */
      (method === "GET" && code === "access.patient_access_denied"),
    /* After MFA setup the account acts for Grace under LIMITED_MAP; the
       public pages call no patient route. */
    perms: LIMITED_MAP,
  };
  for (const href of PUBLIC_PAGES) {
    ctx.current = href;
    const m = mon.mark();
    await gotoSafe(page, href);
    cov.pages.push(href);
    await checkSince(ctx, m, "(open page)", `open ${href}`);
    /* The login/registration forms are exercised explicitly below. */
    await crawlPage(ctx, { allowWrites: false, maxControls: 60 });
  }

  /* Login: empty, wrong password, then a valid sign-in and sign-out. */
  ctx.current = "/login";
  await gotoSafe(page, "/login");
  let m = mon.mark();
  await page.getByRole("button", { name: /^sign in$/i }).click();
  cov.formsSubmitted++;
  /* An empty submit must not sign in and must say something. The login form
     has no client-side check (no `required`), so the API refuses it and the
     page shows its error line. Login is protected UI (phase-16 brief): when
     that line is the generic one instead of a validation message, it is
     recorded, not fixed. */
  const loginError = page
    .locator("form p.text-red-500")
    .or(page.locator("#login-email:invalid"))
    .first();
  await expect(loginError).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
  const loginErrorText = (await loginError.textContent())?.trim() ?? "";
  if (!VALIDATION.test(loginErrorText))
    await issue(
      ctx,
      'button "Sign in" (empty form)',
      "open /login, leave email and password empty, click Sign in",
      "a validation message such as 'Enter your email and password' (or a field-level required hint)",
      `generic error "${loginErrorText}" after an API ${
        mon.api
          .slice(m.a)
          .filter((h) => /\/auth\/login/.test(h.path))
          .map((h) => `${h.status} ${h.code}`)
          .join(", ") || "(no request)"
      }; Login is protected UI, recorded only`,
      "medium",
    );
  await pace("login");
  await page.locator("#login-email").fill(ACCOUNTS.caregiver.email);
  await page.locator("#login-password").fill("wrong-password-1");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
  cov.formsSubmitted++;
  await checkSince(
    ctx,
    m,
    "login form",
    "submit empty, then a wrong password",
    {
      invalidSubmit: true,
    },
  );
  /* The wrong-password 401 and the empty-form 400 on /auth/login are the
     intended answers (the empty-form text is recorded above). */
  issues.splice(
    0,
    issues.length,
    ...issues.filter(
      (i) =>
        !/^(401|400) POST \/auth\/login/.test(i.actual) ||
        i.control.startsWith('button "Sign in" (empty'),
    ),
  );

  /* Registration: empty, invalid email, mismatched passwords, then valid. */
  ctx.current = "/registration";
  await gotoSafe(page, "/registration");
  m = mon.mark();
  await page.getByRole("button", { name: /^sign up$/i }).click();
  cov.formsSubmitted++;
  await expect(page).toHaveURL(/\/registration/);
  const regInvalid = page
    .getByText(VALIDATION)
    .first()
    .or(page.locator(":invalid").first());
  await expect(regInvalid).toBeVisible();
  await page.locator("#full-name").fill("Synthetic P16b");
  await page.locator("#email").fill("not-an-email");
  await page.locator("#password").fill("Short1!");
  await page.locator("#confirm-password").fill("Different1!");
  await page.getByRole("button", { name: /^sign up$/i }).click();
  cov.formsSubmitted++;
  await expect(page).toHaveURL(/\/registration/);
  const acct = throwawayAccount("p16b-cg");
  /* Grace invites the address first (any email may be invited, D48 open). */
  const grace = await loginRetry(ACCOUNTS.grace);
  const graceId = await grace.patientId();
  const inviteSince = mailMark();
  const inv = await grace.post(`/patients/${graceId}/caregiver-invitations`, {
    email: acct.email,
    relationship: "Son",
    preset: "custom",
    permissions: LIMITED_MAP,
  });
  expect(inv.ok(), `invite ${inv.status()}`).toBeTruthy();
  await grace.logout();
  await grace.dispose();
  const since = mailMark();
  await pace("register");
  await page.locator("#email").fill(acct.email);
  await page.locator("#password").fill(acct.password);
  await page.locator("#confirm-password").fill(acct.password);
  await page.locator("#full-name").fill(acct.name);
  const consent = page.getByRole("checkbox");
  if (!(await consent.isChecked())) await consent.click();
  await page.getByRole("button", { name: /^sign up$/i }).click();
  cov.formsSubmitted++;
  await expect(page).toHaveURL(/\/verify-email/, { timeout: 20_000 });
  await checkSince(
    ctx,
    m,
    "registration form",
    "submit empty, invalid, then valid",
    {
      invalidSubmit: true,
    },
  );

  /* Verify email: a wrong code first, then the code from the sink. */
  ctx.current = "/verify-email";
  m = mon.mark();
  const mail = await waitForMail(acct.email, { since, subject: /verify/i });
  await page.getByLabel("Code").fill("000000");
  await page.getByRole("button", { name: "Verify email" }).click();
  cov.formsSubmitted++;
  /* The form's own alert (in main): Next's route announcer is also a
     role=alert, and matching it let the real code be typed while the wrong
     one was still being checked; the page then cleared the field (run 9). */
  await expect(
    page
      .locator('main [role="alert"]')
      .filter({ hasText: /invalid|incorrect|expired|wrong/i })
      .first(),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByRole("button", { name: "Verify email" }),
  ).not.toHaveAttribute("aria-busy", "true");
  await page.getByLabel("Code").fill(extractOtp(mail));
  await page.getByRole("button", { name: "Verify email" }).click();
  cov.formsSubmitted++;
  await expect(page).toHaveURL(/\/setup\/patient/, { timeout: 20_000 });
  await checkSince(
    ctx,
    m,
    "verify-email form",
    "wrong code, then the mailed code",
    {
      invalidSubmit: true,
    },
  );
  ctx.current = "/setup/patient";
  cov.pages.push("/setup/patient");
  await pageChecks(ctx);

  /* The invitation link from the sink: accept as the new account. */
  const invMail = await waitForMail(acct.email, {
    since: inviteSince,
    subject: /invit|caregiver/i,
  });
  const link = extractLink(invMail, /^\/invitations\//);
  ctx.current = "/invitations/[token]";
  cov.pages.push("/invitations/[token]");
  m = mon.mark();
  await gotoSafe(page, link.pathname);
  await settled(ctx, "(invitation)");
  await pageChecks(ctx);
  await page
    .getByRole("button", { name: /accept/i })
    .first()
    .click();
  cov.controlsClicked++;
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  await checkSince(
    ctx,
    m,
    "Accept invitation",
    "open the mailed link and accept",
  );
  limited = acct;

  /* MFA setup self-service for a caregiver (D17, D31): open, wrong code. */
  ctx.current = "/setup/mfa";
  m = mon.mark();
  await gotoSafe(page, "/setup/mfa");
  cov.pages.push("/setup/mfa");
  await crawlPage(ctx, { allowWrites: false, maxControls: 15 });
  await checkSince(
    ctx,
    m,
    "(mfa setup)",
    "open /setup/mfa and click its controls",
    {
      invalidSubmit: true,
    },
  );

  /* Sign out through the API (the dashboard's sign-out is in the protected
     header; the multitab spec 02 covers it), then forgot/reset password. */
  await page.context().clearCookies();
  ctx.current = "/forgot-password";
  await gotoSafe(page, "/forgot-password");
  m = mon.mark();
  /* Empty: Continue stays disabled (the form needs 3+ characters). */
  const fpSubmit = page.locator('form button[type="submit"]').first();
  await expect(fpSubmit).toBeDisabled();
  await page.getByRole("textbox").first().fill(acct.email);
  await fpSubmit.click();
  cov.formsSubmitted++;
  /* Pick the e-mail channel; the code arrives in the sink. */
  const resetSince = mailMark();
  const channel = page
    .locator('form button[type="button"]')
    .filter({ visible: true })
    .first();
  await channel.click({ timeout: 15_000 });
  cov.controlsClicked++;
  const resetMail = await waitForMail(acct.email, {
    since: resetSince,
  }).catch(() => null);
  if (!resetMail) {
    await issue(
      ctx,
      "forgot password",
      "submit the account email and pick the e-mail channel",
      "a reset code in the sink",
      "no mail within 20 s",
      "high",
    );
  } else {
    const pw = page.locator('input[type="password"]');
    const newPass = `${acct.password}x`;
    const code = page.locator('input[autocomplete="one-time-code"]');
    const go = page.locator('form button[type="submit"]').first();
    /* Wrong code, then mismatched passwords, then the real reset. */
    await code.fill("000000");
    await pw.nth(0).fill(newPass);
    await pw.nth(1).fill(newPass);
    await go.click();
    cov.formsSubmitted++;
    await expect(page.locator('main [role="alert"]').first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(go).not.toHaveAttribute("aria-busy", "true");
    await code.fill(extractOtp(resetMail));
    await pw.nth(1).fill(`${newPass}y`);
    await go.click();
    cov.formsSubmitted++;
    await expect(page).toHaveURL(/\/forgot-password/);
    await pw.nth(1).fill(newPass);
    await go.click();
    cov.formsSubmitted++;
    await expect(page).toHaveURL(/\/login\?reason=password-reset/, {
      timeout: 15_000,
    });
    acct.password = newPass;
  }
  await checkSince(
    ctx,
    m,
    "forgot password",
    "empty, the account email, wrong code, mismatch, then reset",
    { invalidSubmit: true },
  );

  /* Reset by link with a token that is not real: the refusal is shown. */
  ctx.current = "/reset-password?token=…";
  m = mon.mark();
  await gotoSafe(page, "/reset-password?token=p16b-not-a-real-token");
  const rpw = page.locator('input[type="password"]');
  await rpw.nth(0).fill("Synthetic-P16b-pass1");
  await rpw.nth(1).fill("Synthetic-P16b-pass1");
  await page.locator('form button[type="submit"]').first().click();
  cov.formsSubmitted++;
  await expect(page.locator('main [role="alert"]').first()).toBeVisible({
    timeout: 15_000,
  });
  await checkSince(ctx, m, "reset password", "a made-up token", {
    invalidSubmit: true,
  });

  cov.downloads = mon.downloads.length;
  markAllowed(issues);
  /* Written by afterEach (also when the test fails part way). */
  test
    .info()
    .annotations.push({ type: "issues", description: String(issues.length) });
  expectNoOpenSevere(issues);
});

async function caregiverCrawl(
  ctx: Ctx,
  page: Page,
  patient: string | null,
  allowWrites: boolean,
) {
  const reopen = patient
    ? async () => {
        await page.getByRole("button", { name: `Open ${patient}` }).click();
        await page
          .waitForURL((u) => !/\/dashboard\/caregiver\/?$/.test(u.pathname), {
            timeout: 30_000,
          })
          .catch(() => undefined);
      }
    : undefined;
  ctx.go = inAppGo(page, reopen);
  await crawlPortal(ctx, { allowWrites });
}

function caregiverCtx(
  role: string,
  page: Page,
  mon: Monitor,
  issues: Issue[],
  cov: Coverage,
): Ctx {
  return {
    role,
    page,
    mon,
    issues,
    cov,
    root: "main",
    current: "/dashboard",
    go: async (h) => {
      await gotoSafe(page, h);
    },
    /* Patient routes outside the grant are refused on purpose, and must
       show the not-shared state (checked by checkSince). Staff and
       platform routes are never called by a caregiver. */
    intended403: () => false,
    /* Sarah: FULL on John and on Grace (phase-15 role-journeys). The
       limited caregiver's test replaces it with LIMITED_MAP. */
    perms: FULL_MAP,
  };
}

test("caregiver-sarah: My Patients and every page for John, then Grace @phase16", async ({
  asUser,
  api,
}) => {
  for (const a of [ACCOUNTS.caregiver]) {
    const c = await api(a);
    await c.post("/me/preferences/tour-completed");
  }
  const issues: Issue[] = [];
  const cov = newCoverage("caregiver-sarah");
  const { page } = await asUser(ACCOUNTS.caregiver);
  const mon = new Monitor(page);
  open = { name: "caregiver-sarah", issues, cov, mon };
  await allowLocalStorage(page);
  await guardExternalOpen(page, mon);
  const ctx = caregiverCtx("caregiver-sarah", page, mon, issues, cov);

  await gotoSafe(page, "/dashboard");
  await page
    .waitForURL(/\/dashboard\/caregiver/, { timeout: 30_000 })
    .catch(() => undefined);
  ctx.current = "/dashboard/caregiver";
  cov.pages.push("/dashboard/caregiver");
  /* My Patients itself: no writes (its controls open patients). */
  await crawlPage(ctx, { allowWrites: false, maxControls: 20 });
  await gotoSafe(page, "/dashboard/caregiver");
  await page.getByRole("button", { name: "Open John Taylor" }).click();
  await page.waitForURL((u) => !/\/dashboard\/caregiver\/?$/.test(u.pathname), {
    timeout: 30_000,
  });
  await caregiverCrawl(ctx, page, "John Taylor", true);

  /* Grace: every page opens cleanly (no clicks), after the switch. */
  ctx.role = "caregiver-sarah (Grace)";
  await gotoSafe(page, "/dashboard/caregiver");
  await page.getByRole("button", { name: "Open Grace Taylor" }).click();
  await page.waitForURL((u) => !/\/dashboard\/caregiver\/?$/.test(u.pathname), {
    timeout: 30_000,
  });
  ctx.go = inAppGo(page, async () => {
    await page.getByRole("button", { name: "Open Grace Taylor" }).click();
  });
  for (const href of await sidebarPages(page)) {
    ctx.current = href;
    const m = mon.mark();
    await ctx.go(href);
    cov.pages.push(`${href} (Grace)`);
    await settled(ctx, "(page load)");
    await checkSince(ctx, m, "(open page)", `open ${href} acting for Grace`);
  }

  cov.downloads = mon.downloads.length;
  markAllowed(issues);
  /* Written by afterEach (also when the test fails part way). */
  expectNoOpenSevere(issues);
});

test("caregiver-limited: every page with a custom map from Grace @phase16", async ({
  asUser,
}) => {
  /* Never skipped: when the anonymous test did not register the account in
     this run (a --grep run, or an earlier failure), it is set up here
     through the API with the same custom map. */
  const issues: Issue[] = [];
  const cov = newCoverage("caregiver-limited");
  const acct = limited ?? (await setupLimitedCaregiver());
  const c = await loginRetry(acct);
  await c.post("/me/preferences/tour-completed");
  await c.logout();
  await c.dispose();
  const { page } = await asUser(acct);
  const mon = new Monitor(page);
  open = { name: "caregiver-limited", issues, cov, mon };
  await allowLocalStorage(page);
  await guardExternalOpen(page, mon);
  const ctx = caregiverCtx("caregiver-limited", page, mon, issues, cov);
  /* Reads of an area Grace did not share are refused on purpose (the
     server's access.patient_access_denied); a refused WRITE still has to
     show its refusal (checked in exerciseDialog and here). */
  ctx.perms = LIMITED_MAP;
  ctx.intended403 = (_p, code, method) =>
    method === "GET" && code === "access.patient_access_denied";
  await gotoSafe(page, "/dashboard");
  await page.waitForURL((u) => !/\/login/.test(u.pathname), {
    timeout: 30_000,
  });
  /* My Patients (one patient here): its controls, no writes. */
  await gotoSafe(page, "/dashboard/caregiver");
  ctx.current = "/dashboard/caregiver";
  cov.pages.push("/dashboard/caregiver");
  await crawlPage(ctx, { allowWrites: false, maxControls: 20 });
  await gotoSafe(page, "/dashboard");
  await caregiverCrawl(ctx, page, null, true);
  cov.downloads = mon.downloads.length;
  markAllowed(issues);
  /* Written by afterEach (also when the test fails part way). */
  expectNoOpenSevere(issues);
});
