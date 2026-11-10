/* Phase 16c: click-through crawl of every office / clinic staff page.

   For each office role (dialysis owner, office manager, nurse, the access
   center's front desk, the access center owner, the nephrology owner) the
   crawler signs in, takes the pages from the sidebar, and on every page:
   - clicks every visible button, tab, menu item, dropdown option, toggle,
     filter, sort, pagination control and row action in the page body;
   - checks every link that leaves the page (a 404 is an issue) and clicks
     the ones that stay on it (drawers opened by ?query links);
   - opens every modal, submits its form empty, then with an invalid email
     where there is one, then with valid synthetic data (only empty fields
     are filled, so edit forms keep their values) and expects a validation
     message for the first two;
   - uploads small synthetic files and downloads every export;
   - runs a destructive action (delete, archive, revoke, cancel, remove) only
     on a row that carries the crawler's own P16C marker;
   - after every action records console errors, uncaught exceptions, API
     5xx, unexpected 4xx (a 403 must show the not-shared state), Next error
     overlays, error / blank / stuck states, controls that do nothing, and a
     horizontal overflow at 1280px and 390px.
   Results: one JSON file per role in E2E_P16_OUT (default
   <outputDir>/p16c), with coverage counts and the issue list. The test
   fails on any blocker or high issue that is not listed in KNOWN with its
   reason. Synthetic data only: seed accounts and invented "P16C" values;
   mail goes to the env's SMTP sink. --workers=1. */
import fs from "node:fs";
import path from "node:path";
import type { Locator, Page, Request, Response } from "@playwright/test";
import { ACCOUNTS, apiOrigin, appOrigin, type Account } from "./fixtures/env";
import { cookieSession } from "./fixtures/session";
import { expect, test } from "./fixtures/test";

type Severity = "blocker" | "high" | "medium" | "low";
type Issue = {
  role: string;
  page: string;
  control: string;
  steps: string;
  expected: string;
  actual: string;
  severity: Severity;
  kind: string;
  screenshot?: string;
};
type Role = {
  id: string;
  account: Account;
  /** The portal's routes in src/app, crawled with the sidebar links. */
  routes: readonly string[];
  /** Least-privilege staff: a role refusal shown as not shared is fine. */
  limited?: boolean;
};

const staff = (email: string): Account => ({
  email,
  password: "staff123",
  name: email,
});

/* Every page under src/app/(portal)/dashboard/(clinic|access|nephrology).
   Deep-link-only pages are reached this way too; a route the role may not
   open must redirect or show the no-access state, never crash. */
const CLINIC_ROUTES = [
  "/dashboard",
  "/dashboard/clinic",
  "/dashboard/clinic/billing",
  "/dashboard/clinic/checkins",
  "/dashboard/clinic/curriculum-progress",
  "/dashboard/clinic/enroll-patients",
  "/dashboard/clinic/labs",
  "/dashboard/clinic/live-class",
  "/dashboard/clinic/members",
  "/dashboard/clinic/messages",
  "/dashboard/clinic/reports",
  "/dashboard/clinic/settings",
  "/dashboard/clinic/support",
  "/dashboard/clinic/team",
  "/dashboard/clinic/travel",
  "/dashboard/clinic/vascular-access",
] as const;
const ACCESS_ROUTES = [
  "/dashboard",
  "/dashboard/access-center",
  "/dashboard/access-center/messages",
  "/dashboard/access-center/support",
  "/dashboard/access-center/team",
] as const;
const NEPHROLOGY_ROUTES = [
  "/dashboard",
  "/dashboard/nephrology",
  "/dashboard/nephrology/access-messages",
  "/dashboard/nephrology/messages",
  "/dashboard/nephrology/settings",
  "/dashboard/nephrology/team",
] as const;

const ROLES: Role[] = [
  { id: "dialysis-owner", account: ACCOUNTS.clinic, routes: CLINIC_ROUTES },
  {
    id: "dialysis-office-manager",
    routes: CLINIC_ROUTES,
    account: staff("officemanager@nephroreach.com"),
    limited: true,
  },
  {
    id: "dialysis-nurse",
    routes: CLINIC_ROUTES,
    account: staff("nurse@nephroreach.com"),
    limited: true,
  },
  {
    id: "access-front-desk",
    routes: ACCESS_ROUTES,
    account: staff("frontdesk@nephroreach.com"),
    limited: true,
  },
  { id: "access-owner", account: ACCOUNTS.access, routes: ACCESS_ROUTES },
  {
    id: "nephrology-owner",
    account: ACCOUNTS.nephrology,
    routes: NEPHROLOGY_ROUTES,
  },
];

/* Blocker/high issues that are recorded in REPORT.md with their reason and
   are not fixed in this lane: "<role> <page> <kind>" keys. */
const KNOWN = new Map<string, string>([]);

const OUT =
  process.env.E2E_P16_OUT ??
  path.join(process.env.E2E_OUTPUT_DIR ?? "test-results", "p16c");
const MARK = `P16C${Date.now().toString(36).slice(-5)}`;
/** Rows the crawler made (any run): its names carry P16C, its emails p16c. */
const OWN = /p16c/i;
const MAX_ACTIONS_PER_PAGE = Number(process.env.E2E_P16_MAX_ACTIONS ?? 120);

/* Uploads go to the env's LOCAL S3 stand-in (E2E_STORAGE_ORIGIN, loopback
   only), as in e2e/52: the page may reach that one origin. Every other
   host stays blocked by the shared guard. */
const STORAGE_ORIGIN = (() => {
  const raw = process.env.E2E_STORAGE_ORIGIN ?? "";
  if (!raw) return null;
  const u = new URL(raw);
  if (!["localhost", "127.0.0.1"].includes(u.hostname))
    throw new Error("E2E_STORAGE_ORIGIN must be the local S3 stand-in");
  return u.origin;
})();
const GOTO_TIMEOUT = 90_000;

const NOT_SHARED = /not been shared with you/i;
/* Domain refusals the API answers on purpose and the screen explains in
   words (code -> why it is expected). They are notes, not issues. */
const EXPECTED_4XX = new Map<string, string>([
  [
    "check_ins.notice_check_in_deleted",
    "the member deleted the check-in behind an old notice; the notice shows that",
  ],
  [
    "vascular_access.referral_patient_not_linked",
    "the crawler picked a patient not linked to both offices; the modal says so and stays open (AccessReferrals.test.tsx)",
  ],
]);
/* 403s a least-privilege role gets with no not-shared state on screen. The
   server refuses each one by the role's permissions (QA-SEC negative tests,
   phase-16/16c/qa-round1); the screen neither hides the control nor says
   why. Whether it should is an open product question (D4 / D38, recorded in
   16c/REPORT.md as decisionsNeeded), so each one is listed here with its
   reason and recorded as a medium "silent-403" issue, never as passed.
   Any other 403 without the not-shared state is a high issue, for every
   role. Keys: role id, "<METHOD> <path with :id>". */
const SILENT_403: Array<{ role: string; call: RegExp; why: string }> = [
  {
    role: "dialysis-office-manager",
    call: /^GET \/organizations\/:id\/conversations$/,
    why: "no messages permission; the clinic shell reads the office inbox (unread count, message links) on every page",
  },
  {
    role: "dialysis-office-manager",
    call: /^POST \/organizations\/:id\/conversations$/,
    why: "no messages permission; Check-ins still offers 'Send a check-in reminder' and the send is refused",
  },
  {
    role: "dialysis-nurse",
    call: /^GET \/organizations\/:id\/patients$/,
    why: "no patients permission; pages that pick a patient (vascular access, check-ins reminder) read the roster",
  },
  {
    role: "access-front-desk",
    call: /^GET \/organizations\/:id\/(conversations|patients|referrals)$/,
    why: "vascular_access only; the Access Center dashboard reads messages, patients and referrals and shows none of them",
  },
];
const ID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const ERROR_STATE = /^try again$/i;
const DESTRUCTIVE =
  /\b(delete|remove|archive|revoke|deactivate|discharge|unenroll|disenroll|end (care|access)|disable|cancel (the )?(trip|ride|visit|request|enrol|invitation|class)|decline|reject|close (thread|case|ticket)|withdraw)\b/i;
const NEVER = /\b(sign out|log ?out|switch (portal|office)|change portal)\b/i;
const SUBMIT =
  /^(save|submit|send|create|add|invite|enrol|enroll|confirm|book|request|schedule|upload|import|update|apply|post|reply|share|continue|next|done)\b/i;
const CLOSE = /^(close|cancel|not now|back|dismiss|no)\b/i;
const VALIDATION =
  /(required|enter a|enter an|must|invalid|please|valid|at least|too (long|short)|choose|select|pick)/i;

function fileFor(accept: string) {
  if (/csv|text/i.test(accept))
    return {
      name: "p16c-labs.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "mrn,test,value,unit,date\nP16C-0001,Potassium,4.2,mmol/L,2026-11-01\n",
      ),
    };
  if (/pdf/i.test(accept))
    return {
      name: "p16c.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(
        "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n",
        "utf8",
      ),
    };
  return {
    name: "p16c.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    ),
  };
}

const day = (offset: number) =>
  new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

class Crawl {
  issues: Issue[] = [];
  coverage = {
    pages: 0,
    controlsClicked: 0,
    linksChecked: 0,
    dialogsOpened: 0,
    /** Valid submits that reached the server (at least one API call). */
    formsSubmitted: 0,
    /** Empty and invalid submits (each expects a validation message). */
    emptySubmits: 0,
    invalidSubmits: 0,
    /** Valid submits that sent nothing (client refused the synthetic fill). */
    validSubmitsBlocked: 0,
    /** The submit's own marker found on the page after a reload. */
    persistedAfterReload: 0,
    validationShown: 0,
    downloads: 0,
    uploads: 0,
    /** Destructive actions on the crawler's own rows, answered 2xx. */
    destructive: 0,
    skippedDestructive: 0,
    /** Native file pickers answered with a synthetic file. */
    fileChoosers: 0,
    /** Link checks that answered on the second try (dev server stall). */
    linkRetries: 0,
    /** API 5xx on a GET that answered < 500 when replayed once. */
    transient5xx: 0,
    /** A tab / filter already selected, clicked again: not a no-op. */
    alreadySelected: 0,
    noOps: 0,
    /** Repeated rows of one list past the first ROW_SAMPLE, not clicked. */
    rowsSampledOut: 0,
  };
  pagesVisited: string[] = [];
  /** Per page: actions, controls clicked, forms submitted, redirect target. */
  perPage: Record<
    string,
    {
      source: string;
      actions: number;
      clicked: number;
      forms: number;
      redirectedTo?: string;
    }
  > = {};
  notes: string[] = [];
  /** Allowed silent 403s (SILENT_403), counted per role call. */
  silent403: Record<string, { count: number; pages: string[]; why: string }> =
    {};
  current = "";
  step = "";
  /** Expected 4xx: refusals of an invalid submit, not-shared areas. */
  allow4xx = false;
  private apiCalls = 0;
  private shots = 0;
  private consoleErrors: string[] = [];
  private pageErrors: string[] = [];
  private api5xx: Array<Promise<{ tag: string; replay: number }>> = [];
  /** Non-GET API answers since the last takeWrites(). */
  private writes: Array<{ method: string; path: string; status: number }> = [];
  private api4xx: Array<{
    status: number;
    path: string;
    code: string;
    refreshSeq?: number;
  }> = [];
  /** Successful POST /auth/refresh responses seen so far. */
  private refreshes = 0;

  constructor(
    readonly page: Page,
    readonly role: Role,
  ) {
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const t = m.text();
      // The browser's own line for an HTTP error status; the response
      // listener records the status itself.
      if (/^Failed to load resource/i.test(t)) return;
      this.consoleErrors.push(t.slice(0, 300));
    });
    page.on("pageerror", (e) => this.pageErrors.push(String(e).slice(0, 300)));
    page.on("request", (r: Request) => {
      if (r.url().startsWith(apiOrigin)) this.apiCalls++;
    });
    page.on("response", async (res: Response) => {
      if (!res.url().startsWith(apiOrigin)) return;
      const p = new URL(res.url()).pathname.replace(/^\/api\/v1/, "");
      const s = res.status();
      if (p === "/auth/refresh" && s < 300) this.refreshes++;
      const method = res.request().method();
      if (method !== "GET" && method !== "OPTIONS")
        this.writes.push({ method, path: p, status: s });
      if (s >= 500) this.api5xx.push(this.replay(res, `${s} ${method} ${p}`));
      else if (s >= 400 && s !== 401) {
        const body = (await res.json().catch(() => null)) as {
          code?: unknown;
        } | null;
        this.api4xx.push({
          status: s,
          path: `${res.request().method()} ${p}`,
          code: typeof body?.code === "string" ? body.code : "",
        });
      } else if (s === 401 && !/\/auth\//.test(p)) {
        const refreshSeq = this.refreshes;
        const body = (await res.json().catch(() => null)) as {
          code?: unknown;
        } | null;
        this.api4xx.push({
          status: s,
          path: `${res.request().method()} ${p}`,
          code: typeof body?.code === "string" ? body.code : "",
          refreshSeq,
        });
      }
    });
  }

  get calls() {
    return this.apiCalls;
  }

  takeWrites() {
    return this.writes.splice(0);
  }

  /** A GET that answered 5xx is asked once more after a second. The
      shared env's Postgres pool timed out under load once (QA-SEC round 1,
      "timeout exceeded when trying to connect"); a GET that then answers
      is recorded as a transient 5xx (medium, with the replay status), one
      that fails again stays a high issue. Writes are never replayed. */
  private async replay(res: Response, tag: string) {
    const req = res.request();
    if (req.method() !== "GET") return { tag, replay: 0 };
    await new Promise((r) => setTimeout(r, 1_000));
    const h = await req
      .allHeaders()
      .catch(() => ({}) as Record<string, string>);
    const headers: Record<string, string> = {};
    for (const k of ["x-organization-id", "accept"])
      if (h[k]) headers[k] = h[k];
    const again = await this.page.request
      .get(req.url(), { headers, timeout: 20_000 })
      .catch(() => null);
    return { tag, replay: again?.status() ?? 0 };
  }

  /** next dev served a half-written chunk (seen while it compiles a route
      under load): the page is reloaded once before anything is recorded. */
  takeChunkError() {
    const i = this.pageErrors.findIndex((e) =>
      /SyntaxError: (Invalid or unexpected token|Unexpected end of input)/.test(
        e,
      ),
    );
    if (i < 0) return false;
    this.pageErrors.splice(i, 1);
    return true;
  }

  async issue(i: Omit<Issue, "role" | "page" | "steps"> & { steps?: string }) {
    const key = `${this.role.id}|${this.current}|${i.kind}|${i.control}|${i.actual}`;
    if (
      this.issues.some(
        (x) => `${x.role}|${x.page}|${x.kind}|${x.control}|${x.actual}` === key,
      )
    )
      return;
    let screenshot: string | undefined;
    if (i.severity !== "low" || i.kind === "layout" || i.kind === "no-op") {
      screenshot = path.join(
        OUT,
        "screens",
        `${this.role.id}-${String(++this.shots).padStart(3, "0")}.png`,
      );
      await this.page
        .screenshot({ path: screenshot, timeout: 5_000 })
        .catch(() => (screenshot = undefined));
    }
    this.issues.push({
      role: this.role.id,
      page: this.current,
      steps: i.steps ?? this.step,
      ...i,
      screenshot: screenshot ? path.relative(OUT, screenshot) : undefined,
    });
  }

  /** Turns everything the listeners saw since the last flush into issues. */
  async flush(control: string) {
    const ce = this.consoleErrors.splice(0);
    const pe = this.pageErrors.splice(0);
    const e5 = await Promise.all(this.api5xx.splice(0));
    const e4 = this.api4xx.splice(0);
    for (const e of pe)
      await this.issue({
        control,
        kind: "uncaught-exception",
        expected: "no uncaught exception",
        actual: e,
        severity: "blocker",
      });
    for (const e of ce)
      await this.issue({
        control,
        kind: "console-error",
        expected: "no console error",
        actual: e,
        severity: "medium",
      });
    for (const e of e5) {
      const transient = e.replay > 0 && e.replay < 500;
      if (transient) this.coverage.transient5xx++;
      await this.issue({
        control,
        kind: transient ? "api-5xx-transient" : "api-5xx",
        expected: "no API 5xx",
        actual: transient
          ? `${e.tag}; the same GET answered ${e.replay} a second later`
          : `${e.tag}${e.replay ? `; replayed: ${e.replay}` : ""}`,
        severity: transient ? "medium" : "high",
      });
    }
    if (e4.length) {
      const notShared = await this.page
        .getByText(NOT_SHARED)
        .count()
        .catch(() => 0);
      // Give a refresh that is still in flight a moment to land.
      for (
        let t = 0;
        t < 20 &&
        e4.some(
          (e) =>
            e.status === 401 &&
            !e.code &&
            e.refreshSeq !== undefined &&
            this.refreshes <= e.refreshSeq,
        );
        t++
      )
        await this.page.waitForTimeout(150);
      for (const e of e4) {
        const tag = `${e.status} ${e.path}${e.code ? ` ${e.code}` : ""}`;
        /* The access cookie lives 15 minutes. A bare 401 is the client's
           cue to refresh once and retry (src/lib/api/client.ts); when a
           refresh succeeded after it, the read was retried and nothing was
           lost. A 401 with no successful refresh stays an issue. */
        if (
          e.status === 401 &&
          !e.code &&
          e.refreshSeq !== undefined &&
          this.refreshes > e.refreshSeq
        ) {
          this.notes.push(
            `${this.current} ${control}: ${tag} on an expired access cookie, refreshed and retried`,
          );
          continue;
        }
        if (e.status === 403 && notShared) {
          this.notes.push(
            `${this.current} ${control}: refused ${tag} (not-shared state shown)`,
          );
          continue;
        }
        const call = e.path.replace(ID, ":id");
        const silent =
          e.status === 403
            ? SILENT_403.find(
                (x) => x.role === this.role.id && x.call.test(call),
              )
            : undefined;
        if (silent) {
          const s = (this.silent403[call] ??= {
            count: 0,
            pages: [],
            why: silent.why,
          });
          s.count++;
          if (!s.pages.includes(this.current)) s.pages.push(this.current);
          if (s.count === 1)
            await this.issue({
              control,
              kind: "silent-403",
              expected:
                "a refused area shows the no-access state or is not offered",
              actual: `${call} 403 with no no-access state (${silent.why}); decision pending (D4/D38)`,
              severity: "medium",
            });
          continue;
        }
        if (e.code && EXPECTED_4XX.has(e.code)) {
          this.notes.push(
            `${this.current} ${control}: expected ${tag} (${EXPECTED_4XX.get(e.code)})`,
          );
          continue;
        }
        if (this.allow4xx && [400, 409, 422].includes(e.status)) {
          this.notes.push(`${this.current} ${control}: submit refused ${tag}`);
          continue;
        }
        await this.issue({
          control,
          kind: e.status === 403 || e.status === 401 ? "api-403" : "api-4xx",
          expected:
            e.status === 403
              ? "a 403 shows the not-shared / no-access state"
              : "no unexpected 4xx",
          actual: tag,
          severity: e.status === 403 || e.status === 401 ? "high" : "medium",
        });
      }
    }
    await this.checkState(control);
  }

  /** Crash overlay, error state, 404, blank page. */
  async checkState(control: string) {
    const p = this.page;
    if (
      await p
        // nextjs-portal itself is always there in next dev (dev indicator).
        // The open dialog only: the "N Issues" badge is not a crash.
        .locator("[data-nextjs-dialog]:visible")
        .count()
        .catch(() => 0)
    )
      await this.issue({
        control,
        kind: "next-error-overlay",
        expected: "no Next error overlay",
        actual: "Next.js error overlay shown",
        severity: "blocker",
      });
    const body = await p
      .locator("body")
      .innerText({ timeout: 3_000 })
      .catch(() => "");
    if (/Application error: a client-side exception/i.test(body))
      await this.issue({
        control,
        kind: "crash",
        expected: "page renders",
        actual: "client-side exception page",
        severity: "blocker",
      });
    if (/This page could not be found|^404$/m.test(body))
      await this.issue({
        control,
        kind: "404",
        expected: "page exists",
        actual: `404 at ${p.url()}`,
        severity: "high",
      });
    if (
      await p
        .getByRole("button", { name: ERROR_STATE })
        .count()
        .catch(() => 0)
    )
      await this.issue({
        control,
        kind: "error-state",
        expected: "data loads (healthy API)",
        actual: "error state with Try again",
        severity: "high",
      });
  }
}

async function settle(page: Page, ms = 350) {
  await page.waitForTimeout(ms);
  await page
    .locator('[aria-busy="true"]')
    .first()
    .waitFor({ state: "hidden", timeout: 4_000 })
    .catch(() => undefined);
}

async function waitReady(c: Crawl) {
  const p = c.page;
  await p
    .locator("main")
    .first()
    .waitFor({ timeout: 20_000 })
    .catch(() => undefined);
  await settle(p, 500);
  // Stuck loading: a busy region or a skeleton still there after 8s.
  const busy = p.locator('main [aria-busy="true"], main .animate-pulse');
  if (await busy.count().catch(() => 0)) {
    await busy
      .first()
      .waitFor({ state: "hidden", timeout: 8_000 })
      .catch(async () => {
        await c.issue({
          control: "(page load)",
          kind: "stuck-loading",
          expected: "loading ends",
          actual: "busy / skeleton still shown after 8s",
          severity: "high",
        });
      });
  }
  const text = (
    await p
      .locator("main")
      .first()
      .innerText()
      .catch(() => "")
  ).trim();
  if (text.length < 15)
    await c.issue({
      control: "(page load)",
      kind: "blank",
      expected: "page content",
      actual: `main has ${text.length} characters`,
      severity: "high",
    });
}

/** Horizontal overflow of the page or of an element past the viewport. */
async function checkLayout(c: Crawl, label: string) {
  const res = await c.page.evaluate(() => {
    const w = window.innerWidth;
    const doc = document.documentElement.scrollWidth;
    const off: string[] = [];
    for (const el of Array.from(document.querySelectorAll("main *"))) {
      const r = (el as HTMLElement).getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > w + 2) {
        let scroller: HTMLElement | null = el.parentElement;
        let clipped = false;
        while (scroller && scroller !== document.body) {
          const cs = getComputedStyle(scroller);
          if (/(auto|scroll|hidden|clip)/.test(cs.overflowX)) {
            clipped = true;
            break;
          }
          scroller = scroller.parentElement;
        }
        if (!clipped) {
          const t = (el.textContent ?? "").trim().slice(0, 40);
          off.push(
            `${el.tagName.toLowerCase()} "${t}" right=${Math.round(r.right)}`,
          );
        }
      }
      if (off.length >= 3) break;
    }
    // A select squeezed narrower than its chosen option's words.
    const ctx = document.createElement("canvas").getContext("2d");
    for (const el of Array.from(document.querySelectorAll("main select"))) {
      const sel = el as HTMLSelectElement;
      if (!ctx || !sel.offsetWidth || off.length >= 3) continue;
      const cs = getComputedStyle(sel);
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const text = sel.selectedOptions[0]?.text ?? "";
      const room =
        sel.clientWidth -
        parseFloat(cs.paddingLeft) -
        parseFloat(cs.paddingRight);
      if (text && ctx.measureText(text).width > room + 2)
        off.push(
          `select "${text.slice(0, 40)}" is ${sel.clientWidth}px, too narrow`,
        );
    }
    return { w, doc, off };
  });
  if (res.doc > res.w + 2 || res.off.length)
    await c.issue({
      control: `(layout ${label})`,
      kind: "layout",
      expected: `no horizontal overflow at ${res.w}px`,
      actual: `document ${res.doc}px wide${res.off.length ? `; past the edge: ${res.off.join("; ")}` : ""}`,
      severity: label === "390px" ? "medium" : "low",
    });
}

type Ctl = {
  id: string;
  key: string;
  kind: string;
  name: string;
  href: string;
  /** Visible words (not the aria-label) of a control inside a list row. */
  rowLabel: string;
};

/** Tags every visible, enabled control in the page body and returns them. */
async function collect(page: Page): Promise<Ctl[]> {
  return page.evaluate(() => {
    const roots = Array.from(
      document.querySelectorAll('main, [role="dialog"], [role="alertdialog"]'),
    );
    const sel =
      'button, a[href], [role="tab"], [role="switch"], [role="checkbox"], [role="radio"], [role="combobox"], [role="menuitem"], [role="option"], select, input[type="checkbox"], input[type="radio"], summary';
    const out: Array<{
      id: string;
      key: string;
      kind: string;
      name: string;
      href: string;
      rowLabel: string;
    }> = [];
    const seen = new Set<Element>();
    const counts = new Map<string, number>();
    let n = 0;
    /* Tags from an earlier pass stay on elements that are hidden now; a
       second element with the same tag made the locator ambiguous, so a
       control "could not be clicked" or a select did not change. */
    for (const old of Array.from(document.querySelectorAll("[data-p16c]")))
      old.removeAttribute("data-p16c");
    for (const root of roots)
      for (const el of Array.from(root.querySelectorAll(sel))) {
        if (seen.has(el)) continue;
        seen.add(el);
        const h = el as HTMLElement;
        const r = h.getBoundingClientRect();
        const style = getComputedStyle(h);
        if (
          (r.width === 0 && r.height === 0) ||
          style.visibility === "hidden" ||
          style.display === "none"
        )
          continue;
        if (
          (h as HTMLButtonElement).disabled ||
          h.getAttribute("aria-disabled") === "true"
        )
          continue;
        const tag = h.tagName.toLowerCase();
        const role = h.getAttribute("role") ?? "";
        const type = h.getAttribute("type") ?? "";
        const kind = role || (tag === "input" ? type : tag);
        const name = (
          h.getAttribute("aria-label") ||
          h.textContent ||
          h.getAttribute("title") ||
          h.getAttribute("name") ||
          ""
        )
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 80);
        const href = tag === "a" ? (h.getAttribute("href") ?? "") : "";
        const base = `${kind}|${name}|${href}`;
        const k = (counts.get(base) ?? 0) + 1;
        counts.set(base, k);
        const id = `c${n++}`;
        h.setAttribute("data-p16c", id);
        const inRow = h.parentElement?.closest('tr, li, [role="row"]');
        const words = (h.textContent ?? "").replace(/\s+/g, " ").trim();
        /* An icon-only row action keeps its verb: "Change role of X" ->
           "Change role of". */
        const rowLabel = !inRow
          ? ""
          : words && words !== name && name.includes(words)
            ? words
            : !words && /\b(of|for|to|from)\b/i.test(name)
              ? name.replace(/\b(of|for|to|from)\b.*$/i, "$1")
              : "";
        out.push({ id, key: `${base}|${k}`, kind, name, href, rowLabel });
      }
    return out;
  });
}

async function signature(page: Page) {
  return page.evaluate(() => {
    const t = document.body.innerText;
    let h = 0;
    for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
    const states = Array.from(
      document.querySelectorAll(
        "[aria-expanded],[aria-selected],[aria-pressed],[aria-checked],[data-state]",
      ),
    )
      .map(
        (e) =>
          `${e.getAttribute("aria-expanded")}${e.getAttribute("aria-selected")}${e.getAttribute("aria-pressed")}${e.getAttribute("aria-checked")}${e.getAttribute("data-state")}`,
      )
      .join("");
    const inputs = Array.from(
      document.querySelectorAll("input,select,textarea"),
    )
      .map((e) => {
        const i = e as HTMLInputElement;
        return `${i.value}${i.checked ? 1 : 0}`;
      })
      .join("|");
    return `${location.href}#${h}#${states}#${inputs}#${document.querySelectorAll('[role="dialog"],[role="alertdialog"],[role="menu"],[role="listbox"]').length}`;
  });
}

const openDialogs = (page: Page) =>
  page
    .locator('[role="dialog"]:visible, [role="alertdialog"]:visible')
    .count()
    .catch(() => 0);

const openDialog = (page: Page) =>
  page.locator('[role="dialog"]:visible, [role="alertdialog"]:visible').last();

async function closeOverlays(page: Page) {
  for (let i = 0; i < 3; i++) {
    const d = openDialog(page);
    const menus = page.locator(
      '[role="menu"]:visible, [role="listbox"]:visible',
    );
    if (!(await d.count()) && !(await menus.count())) return;
    await page.keyboard.press("Escape").catch(() => undefined);
    await page.waitForTimeout(150);
    if (await d.count()) {
      const close = d.getByRole("button", { name: CLOSE }).first();
      if (await close.count())
        await close.click({ timeout: 1_500 }).catch(() => undefined);
      await page.waitForTimeout(150);
    }
  }
}

/** Fills the empty fields of a form scope with synthetic values. Free
    text gets `token` (MARK plus a per-submit number), so a reload can look
    for this submit's own record. Returns whether the token was typed. */
async function fill(
  scope: Locator,
  mode: "valid" | "invalid",
  c: Crawl,
  token = MARK,
) {
  let typedMark = false;
  const fields = scope.locator(
    "input:visible:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=submit]):not([type=button]):not([readonly]):not([disabled]), textarea:visible:not([readonly]):not([disabled])",
  );
  const n = await fields.count();
  for (let i = 0; i < n; i++) {
    const f = fields.nth(i);
    const type = ((await f.getAttribute("type")) ?? "text").toLowerCase();
    /* The visible label and hint count too: the enroll form's MRN field
       has no name or placeholder, only the label "MRN" and the hint "Six
       digits" (QA-SEC round 1, F4). */
    const described = await f
      .evaluate((e) => {
        const el = e as HTMLInputElement;
        const ids = (el.getAttribute("aria-describedby") ?? "").split(/\s+/);
        return [
          ...Array.from(el.labels ?? []).map((l) => l.textContent ?? ""),
          ...ids.map((id) =>
            id ? (document.getElementById(id)?.textContent ?? "") : "",
          ),
          el.getAttribute("inputmode") ?? "",
          el.maxLength > 0 ? `maxlength${el.maxLength}` : "",
        ].join(" ");
      })
      .catch(() => "");
    const name =
      `${(await f.getAttribute("name")) ?? ""} ${(await f.getAttribute("id")) ?? ""} ${(await f.getAttribute("aria-label")) ?? ""} ${(await f.getAttribute("placeholder")) ?? ""} ${described}`.toLowerCase();
    if (type === "password") continue;
    if (type === "search" || /search/.test(name)) continue;
    const current = await f.inputValue().catch(() => "");
    if (mode === "valid" && current) continue;
    let v: string;
    if (type === "email" || /email/.test(name))
      v =
        mode === "invalid"
          ? "not-an-email"
          : `p16c.${Date.now().toString(36)}@example.test`;
    else if (mode === "invalid") continue;
    else if (type === "date" && /\b(birth|dob)\b/.test(name)) v = "1960-01-15";
    else if (type === "date") v = day(7);
    else if (type === "datetime-local") v = `${day(7)}T10:00`;
    else if (type === "time") v = "10:00";
    else if (type === "month") v = day(7).slice(0, 7);
    else if (type === "number" || type === "range") v = "1";
    else if (type === "tel" || /phone|\btel\b/.test(name)) v = "5550100123";
    else if (type === "url") v = "https://example.test/p16c";
    else if (/zip|postal/.test(name)) v = "10001";
    else if (/\bmrn\b|medical record|six digits|\b6 digits/.test(name))
      v = String(100_000 + Math.floor(Math.random() * 900_000));
    else if (/\b(date|dob|birth)\b/.test(name)) v = "01/15/1960";
    else if (/numeric/.test(name)) {
      const len = Number(/maxlength(\d+)/.exec(name)?.[1] ?? 6);
      v = String(Math.floor(Math.random() * 10 ** len)).padStart(len, "1");
    } else {
      v = `${token} synthetic`;
      typedMark = true;
    }
    await f.fill(v, { timeout: 1_500 }).catch(() => undefined);
  }
  if (mode === "valid") {
    const selects = scope.locator("select:visible:not([disabled])");
    for (let i = 0; i < (await selects.count()); i++) {
      const s = selects.nth(i);
      if (await s.inputValue().catch(() => "x")) continue;
      const opts = await s
        .locator("option")
        .evaluateAll((o) =>
          o.map((x) => (x as HTMLOptionElement).value).filter(Boolean),
        );
      if (opts[0])
        await s
          .selectOption(opts[0], { timeout: 1_500 })
          .catch(() => undefined);
    }
    const radios = scope.locator(
      '[role="radiogroup"]:visible, fieldset:visible',
    );
    for (let i = 0; i < (await radios.count()); i++) {
      const g = radios.nth(i);
      const r = g.locator('input[type=radio]:visible, [role="radio"]:visible');
      if (!(await r.count())) continue;
      if (
        await g
          .locator(
            'input[type=radio]:checked, [role="radio"][aria-checked="true"]',
          )
          .count()
      )
        continue;
      await r
        .first()
        .click({ timeout: 1_500 })
        .catch(() => undefined);
    }
    const required = scope.locator(
      "input[type=checkbox][required]:visible:not(:checked)",
    );
    for (let i = 0; i < (await required.count()); i++)
      await required
        .nth(i)
        .check({ timeout: 1_500 })
        .catch(() => undefined);
    const files = scope.locator('input[type="file"]');
    for (let i = 0; i < (await files.count()); i++) {
      const accept = (await files.nth(i).getAttribute("accept")) ?? "";
      await files
        .nth(i)
        .setInputFiles(fileFor(accept))
        .then(() => c.coverage.uploads++)
        .catch(() => undefined);
    }
  }
  return typedMark;
}

async function submitButton(scope: Locator) {
  const typed = scope.locator('button[type="submit"]:visible');
  if (await typed.count()) return typed.last();
  const named = scope.getByRole("button", { name: SUBMIT });
  if (await named.count()) return named.last();
  return null;
}

async function validationShown(scope: Locator, page: Page) {
  await page.waitForTimeout(250);
  if (
    await scope
      .locator('[aria-invalid="true"]')
      .count()
      .catch(() => 0)
  )
    return true;
  const alerts = scope.locator(
    '[role="alert"], [role="status"], .text-danger, [id$="-error"]',
  );
  const n = await alerts.count().catch(() => 0);
  for (let i = 0; i < n; i++) {
    const t = await alerts
      .nth(i)
      .innerText()
      .catch(() => "");
    if (VALIDATION.test(t)) return true;
  }
  const invalid = await scope
    .locator("input:invalid, textarea:invalid, select:invalid")
    .count()
    .catch(() => 0);
  return invalid > 0;
}

let submitSeq = 0;
const SUCCESS =
  /(saved|sent|added|created|invited|enrolled|updated|scheduled|booked|uploaded|imported|requested|done|success|withdrawn)/i;

async function successTexts(page: Page) {
  return page
    .locator('[role="status"], [role="alert"]')
    .filter({ hasText: SUCCESS })
    .allInnerTexts()
    .catch(() => [] as string[]);
}

/** The first validation-looking message in a form scope. */
async function validationText(scope: Locator) {
  const texts = await scope
    .locator('[role="alert"], [id$="-error"], .text-danger')
    .allInnerTexts()
    .catch(() => [] as string[]);
  return texts.map((t) => t.trim()).find((t) => t && VALIDATION.test(t)) ?? "";
}

/** Empty, invalid, then valid submit of one form scope. */
async function exerciseForm(
  c: Crawl,
  scope: Locator,
  control: string,
  isDialog: boolean,
  depth = 0,
): Promise<void> {
  const page = c.page;
  const fields = await scope
    .locator(
      "input:visible:not([type=hidden]), textarea:visible, select:visible",
    )
    .count();
  if (!fields) return;
  if (await scope.locator('input[type="password"]').count()) {
    c.notes.push(`${c.current} ${control}: password form left alone`);
    return;
  }
  let btn = await submitButton(scope);
  if (!btn) return;
  const btnName = ((await btn.innerText().catch(() => "")) || "submit").trim();
  if (DESTRUCTIVE.test(btnName) || NEVER.test(btnName)) return;
  c.allow4xx = true;
  try {
    // 1. Empty (only when a field is empty and required-looking).
    const emptyRequired = await scope
      .locator(
        "input[required]:visible, textarea[required]:visible, select[required]:visible",
      )
      .evaluateAll(
        (els) => els.filter((e) => !(e as HTMLInputElement).value).length,
      );
    if (emptyRequired) {
      c.step = `${control} → submit "${btnName}" empty`;
      if (await btn.isEnabled().catch(() => false)) {
        await btn.click({ timeout: 2_000 }).catch(() => undefined);
        c.coverage.emptySubmits++;
        const still = isDialog ? await openDialog(page).count() : 1;
        if (still && (await validationShown(scope, page)))
          c.coverage.validationShown++;
        else if (still)
          await c.issue({
            control: `${control} → ${btnName}`,
            kind: "no-validation",
            expected: "an empty required field shows a validation message",
            actual: "no message, aria-invalid or :invalid field after submit",
            severity: "low",
          });
        else
          await c.issue({
            control: `${control} → ${btnName}`,
            kind: "empty-accepted",
            expected: "an empty required field blocks the submit",
            actual: "dialog closed after an empty submit",
            severity: "medium",
          });
        await c.flush(`${control} → ${btnName} (empty)`);
        if (isDialog && !(await openDialog(page).count())) return;
      } else c.coverage.validationShown++; // submit disabled until filled
    }
    // 2. Invalid email, where there is an email field.
    const emails = scope.locator('input[type="email"]:visible');
    if (await emails.count()) {
      c.step = `${control} → email "not-an-email" → ${btnName}`;
      await fill(scope, "invalid", c);
      btn = (await submitButton(scope)) ?? btn;
      if (await btn.isEnabled().catch(() => false)) {
        await btn.click({ timeout: 2_000 }).catch(() => undefined);
        c.coverage.invalidSubmits++;
        if (await validationShown(scope, page)) c.coverage.validationShown++;
        else if (!isDialog || (await openDialog(page).count()))
          await c.issue({
            control: `${control} → ${btnName}`,
            kind: "no-validation",
            expected: "an invalid email shows a validation message",
            actual: "no message after submitting not-an-email",
            severity: "low",
          });
        await c.flush(`${control} → ${btnName} (invalid)`);
      }
      if (isDialog && !(await openDialog(page).count())) return;
      for (let i = 0; i < (await emails.count()); i++)
        await emails
          .nth(i)
          .fill("")
          .catch(() => undefined);
    }
    // 3. Valid synthetic data in the empty fields.
    c.step = `${control} → fill synthetic → ${btnName}`;
    const token = `${MARK}n${++submitSeq}`;
    const typedMark = await fill(scope, "valid", c, token);
    btn = (await submitButton(scope)) ?? btn;
    if (!(await btn.isEnabled().catch(() => false)) && isDialog) {
      /* An acknowledgement gate (the external-share notice before an
         export): its checkbox is not marked required, the button waits
         for it. */
      const boxes = scope.locator("input[type=checkbox]:visible:not(:checked)");
      for (let i = (await boxes.count()) - 1; i >= 0; i--)
        await boxes
          .nth(i)
          .check({ timeout: 1_500 })
          .catch(() => undefined);
      btn = (await submitButton(scope)) ?? btn;
    }
    if (!(await btn.isEnabled().catch(() => false))) {
      c.notes.push(
        `${c.current} ${control}: submit stays disabled after the synthetic fill`,
      );
      return;
    }
    const before = c.calls;
    const dialogsBefore = await openDialogs(page);
    const successBefore = await successTexts(page);
    c.takeWrites();
    // An export confirmed in the dialog downloads after the click.
    const download = /download|export|csv|pdf/i.test(btnName)
      ? page.waitForEvent("download", { timeout: 8_000 }).catch(() => null)
      : null;
    await btn.click({ timeout: 2_000 }).catch(() => undefined);
    const dl = download ? await download : null;
    if (download && !dl)
      await c.issue({
        control: `${control} → ${btnName}`,
        kind: "download",
        expected: "the confirmed export downloads",
        actual: "no download within 8s",
        severity: "medium",
      });
    if (dl) {
      c.coverage.downloads++;
      const fail = await dl.failure();
      if (fail)
        await c.issue({
          control: `${control} → ${btnName}`,
          kind: "download",
          expected: "the export downloads",
          actual: `download failed: ${fail}`,
          severity: "high",
        });
      else
        c.notes.push(
          `${c.current} ${control}: downloaded ${dl.suggestedFilename()}`,
        );
      await dl.delete().catch(() => undefined);
    }
    await settle(page, 700);
    if (
      depth === 0 &&
      c.calls === before &&
      (await openDialogs(page)) > dialogsBefore
    ) {
      /* The submit opened a confirm step on top (the external-share
         notice: tick the box, then confirm). It is exercised as its own
         form; the outer submit is not a no-op. */
      c.notes.push(`${c.current} ${control}: a confirm step opened`);
      c.coverage.dialogsOpened++;
      await exerciseForm(
        c,
        openDialog(page),
        `${control} → ${btnName}`,
        true,
        depth + 1,
      );
      return;
    }
    const sent = c.calls - before;
    const stillOpen = isDialog ? await openDialog(page).count() : 0;
    const saved = c.takeWrites().filter((w) => w.status < 300);
    /* Success belongs to this submit: a success message that was not on
       the page before the click, or a write the server accepted. */
    const fresh = (await successTexts(page)).filter(
      (t) => !successBefore.includes(t),
    );
    if (sent > 0 || dl) c.coverage.formsSubmitted++;
    c.notes.push(
      `${c.current} ${control}: valid submit → ${sent} API call(s)${saved.length ? ` (${saved.map((w) => `${w.status} ${w.method}`).join(", ")})` : ""}, ${stillOpen ? "dialog still open" : "closed"}${fresh.length ? ", success message" : ""}`,
    );
    if (!sent && !dl && stillOpen) {
      /* A valid submit that sent nothing and left the dialog open: either
         the crawler's synthetic fill did not satisfy the form (its message
         is recorded, low) or the button does nothing (medium). */
      c.coverage.validSubmitsBlocked++;
      const msg = await validationText(scope);
      await c.issue({
        control: `${control} → ${btnName}`,
        kind: msg ? "valid-fill-refused" : "submit-did-nothing",
        expected: "a valid submit reaches the server",
        actual: msg
          ? `0 API calls; the form says: ${msg.slice(0, 160)}`
          : "0 API calls, dialog still open, no message",
        severity: msg ? "low" : "medium",
      });
    }
    await c.flush(`${control} → ${btnName} (valid)`);
    if (typedMark && saved.length && !stillOpen) {
      // Persistence: this submit's own marker after a reload.
      await page.reload({ timeout: GOTO_TIMEOUT });
      await waitReady(c);
      const body = await page
        .locator("main")
        .innerText()
        .catch(() => "");
      if (body.includes(token)) c.coverage.persistedAfterReload++;
      else
        c.notes.push(
          `${c.current} ${control}: saved (${saved.map((w) => `${w.status} ${w.method} ${w.path.replace(ID, ":id")}`).join(", ")}); its marker ${token} is not on this page after a reload (it is listed elsewhere or not shown)`,
        );
    }
  } finally {
    c.allow4xx = false;
  }
}

async function handleDialog(c: Crawl, control: string) {
  const page = c.page;
  const d = openDialog(page);
  if (!(await d.count())) return;
  c.coverage.dialogsOpened++;
  await exerciseForm(c, d, control, true);
  // Exports inside the dialog.
  await closeOverlays(page);
}

const OWN_TOKEN = /[\w.-]*p16c[\w.@-]*/i;

/** The text of the row (tr, li, article, role=row) holding a control. */
async function rowText(el: Locator) {
  return el
    .evaluate((e) => {
      let p: HTMLElement | null = e.parentElement;
      for (let i = 0; i < 6 && p; i++, p = p.parentElement)
        if (
          /^(TR|LI|ARTICLE)$/.test(p.tagName) ||
          p.getAttribute("role") === "row"
        )
          return p.innerText;
      return "";
    })
    .catch(() => "");
}

/** Scroll position (window and scrolled containers) and the focused
    control: a jump to an anchor or a focus move is a visible effect the
    text signature does not see. */
async function viewState(page: Page) {
  return page
    .evaluate(() => {
      let scroll = Math.round(window.scrollY);
      for (const el of Array.from(document.querySelectorAll("main, main *")))
        if ((el as HTMLElement).scrollTop > 0)
          scroll += Math.round((el as HTMLElement).scrollTop);
      const a = document.activeElement as HTMLElement | null;
      const focus =
        a?.getAttribute("data-p16c") ??
        (a && a !== document.body
          ? `${a.tagName.toLowerCase()}#${a.id || a.getAttribute("name") || ""}`
          : "body");
      return { scroll, focus };
    })
    .catch(() => ({ scroll: 0, focus: "" }));
}

/** Runs one control and records what it did. */
async function act(
  c: Crawl,
  ctl: Ctl,
  href: string,
): Promise<"navigated" | "ok"> {
  const page = c.page;
  const el = page.locator(`[data-p16c="${ctl.id}"]`);
  const label = `${ctl.kind} "${ctl.name || ctl.href}"`;
  c.step = `open ${href} → click ${label}`;

  // Links: a link off the page is checked, not followed.
  if (ctl.href) {
    if (
      /^(mailto|tel|sms|javascript):/i.test(ctl.href) ||
      ctl.href.startsWith("#")
    )
      return "ok";
    const u = new URL(ctl.href, page.url());
    if (u.origin !== appOrigin) {
      c.notes.push(`${href}: external link ${u.origin} not followed`);
      return "ok";
    }
    if (u.pathname !== new URL(page.url()).pathname) {
      c.coverage.linksChecked++;
      const get = () =>
        page.request
          .get(u.toString(), { maxRedirects: 3, timeout: GOTO_TIMEOUT })
          .catch(() => null);
      let res = await get();
      /* next dev stalls now and then while it compiles under load (QA-SEC
         round 1: "no answer", the same link then answered 200 in 153 ms).
         No answer or a 5xx is asked once more before it is recorded. */
      if (!res || res.status() >= 500) {
        const first = res?.status() ?? "no answer";
        await page.waitForTimeout(2_000);
        res = await get();
        if (res && res.status() < 400) {
          c.coverage.linkRetries++;
          c.notes.push(
            `${href}: link ${u.pathname} → ${first}, then ${res.status()} on the retry`,
          );
        }
      }
      if (!res || res.status() >= 400)
        await c.issue({
          control: label,
          kind: "broken-link",
          expected: "the link opens a page",
          actual: `GET ${u.pathname} → ${res?.status() ?? "no answer"}`,
          severity: "high",
        });
      return "ok";
    }
  }
  if (NEVER.test(ctl.name)) return "ok";
  const row = await rowText(el);
  /* A destructive control runs only on a row the crawler made. The marker
     test ignores case: the crawler's emails are p16c.<ts>@example.test
     (QA-SEC round 1, F5: a case-sensitive test skipped them all). */
  let ownDestructive = "";
  if (
    DESTRUCTIVE.test(ctl.name) &&
    !(await el
      .getAttribute("type")
      .then((t) => t === "submit")
      .catch(() => false))
  ) {
    if (!OWN.test(row) && !OWN.test(ctl.name)) {
      c.coverage.skippedDestructive++;
      return "ok";
    }
    ownDestructive = OWN_TOKEN.exec(`${ctl.name} ${row}`)?.[0] ?? "p16c";
  }

  const preSelected = await el
    .evaluate(
      (e) =>
        e.getAttribute("aria-selected") === "true" ||
        e.getAttribute("aria-pressed") === "true" ||
        e.getAttribute("aria-current") === "page" ||
        e.getAttribute("data-state") === "active",
    )
    .catch(() => false);
  const viewBefore = await viewState(page);
  const before = await signature(page).catch(() => "");
  const callsBefore = c.calls;
  c.takeWrites();
  const download = page
    .waitForEvent("download", { timeout: 1_500 })
    .catch(() => null);
  const chooser = page
    .waitForEvent("filechooser", { timeout: 1_500 })
    .catch(() => null);
  if (ctl.kind === "select") {
    const opts = await el
      .locator("option")
      .evaluateAll((o) => o.map((x) => (x as HTMLOptionElement).value));
    const cur = await el.inputValue().catch(() => "");
    const next = opts.find((o) => o !== cur);
    if (next === undefined) return "ok";
    await el.selectOption(next, { timeout: 2_000 }).catch(() => undefined);
  } else {
    const clicked = await el
      .click({ timeout: 2_000 })
      .then(() => true)
      .catch(() => false);
    if (!clicked) {
      c.notes.push(
        `${href}: ${label} could not be clicked (covered or detached)`,
      );
      return "ok";
    }
  }
  c.coverage.controlsClicked++;
  const fc = await chooser;
  if (fc) {
    // A native file picker (e.g. "Attach a file"): answer it.
    const accept =
      (await fc
        .element()
        .getAttribute("accept")
        .catch(() => "")) ?? "";
    await fc
      .setFiles(fileFor(accept))
      .then(() => {
        c.coverage.fileChoosers++;
        c.coverage.uploads++;
      })
      .catch(() => undefined);
  }
  if (ownDestructive) {
    // A confirm step, when there is one, is confirmed.
    await settle(page, 200);
    const d = openDialog(page);
    if (await d.count()) {
      const yes = d
        .getByRole("button", { name: DESTRUCTIVE })
        .or(d.getByRole("button", { name: /^(confirm|yes)\b/i }));
      if (await yes.count())
        await yes
          .last()
          .click({ timeout: 2_000 })
          .catch(() => undefined);
    }
  }
  const dl = await download;
  if (dl) {
    c.coverage.downloads++;
    const fail = await dl.failure();
    if (fail)
      await c.issue({
        control: label,
        kind: "download",
        expected: "the export downloads",
        actual: `download failed: ${fail}`,
        severity: "high",
      });
    else c.notes.push(`${href}: ${label} downloaded ${dl.suggestedFilename()}`);
    await dl.delete().catch(() => undefined);
  }
  await settle(page);
  /* Taken before any dialog is exercised and closed: a control whose
     dialog closed again leaves the page as it was, and that is not a
     no-op. */
  const mid = await signature(page).catch(() => "");
  const dialogs0 = c.coverage.dialogsOpened;

  // A listbox or menu opened: pick an option / item (one per visit).
  const lb = page.locator('[role="listbox"]:visible').last();
  if (await lb.count()) {
    const opts = lb.locator('[role="option"]');
    const k = await opts.count();
    if (k)
      await opts
        .nth(k > 1 ? 1 : 0)
        .click({ timeout: 1_500 })
        .catch(() => undefined);
    await settle(page, 200);
  }
  const menu = page.locator('[role="menu"]:visible').last();
  if (await menu.count()) {
    const items = await menu.locator('[role="menuitem"]').allInnerTexts();
    await closeOverlays(page);
    for (const [j, text] of items.entries()) {
      if (NEVER.test(text)) continue;
      if (DESTRUCTIVE.test(text)) {
        /* Menu actions that destroy are left alone; on the crawler's own
           row they are counted as skipped with the reason in the notes. */
        c.coverage.skippedDestructive++;
        if (OWN.test(row))
          c.notes.push(
            `${href}: menu item "${text.trim()}" on the crawler's own row not run (menu destructive actions are out of the crawl)`,
          );
        continue;
      }
      await el.click({ timeout: 1_500 }).catch(() => undefined);
      await page
        .locator('[role="menu"]:visible [role="menuitem"]')
        .nth(j)
        .click({ timeout: 1_500 })
        .catch(() => undefined);
      c.coverage.controlsClicked++;
      await settle(page);
      await handleDialog(c, `${label} → ${text.trim()}`);
      await c.flush(`${label} → ${text.trim()}`);
      if (new URL(page.url()).pathname !== new URL(href, appOrigin).pathname)
        return "navigated";
    }
  }

  await handleDialog(c, label);
  await c.flush(label);

  if (ownDestructive) {
    const done = c.takeWrites().filter((w) => w.status < 300);
    if (done.length) {
      c.coverage.destructive++;
      // Persistence: the crawler's row is gone (or marked) after a reload.
      await page.reload({ timeout: GOTO_TIMEOUT });
      await waitReady(c);
      const body = await page
        .locator("main")
        .innerText()
        .catch(() => "");
      c.notes.push(
        `${href}: ${label} on the crawler's own row → ${done.map((w) => `${w.status} ${w.method} ${w.path.replace(ID, ":id")}`).join(", ")}; after a reload ${body.toLowerCase().includes(ownDestructive.toLowerCase()) ? "the row is still listed (check its status)" : "the row is gone"}`,
      );
      return "navigated";
    }
    c.notes.push(
      `${href}: ${label} on the crawler's own row sent no accepted write`,
    );
  }

  const after = await signature(page).catch(() => "");
  const viewAfter = await viewState(page);
  const moved =
    viewAfter.scroll !== viewBefore.scroll ||
    (viewAfter.focus !== viewBefore.focus && viewAfter.focus !== ctl.id);
  if (
    before &&
    before === mid &&
    before === after &&
    c.coverage.dialogsOpened === dialogs0 &&
    c.calls === callsBefore &&
    !dl &&
    !fc
  ) {
    if (preSelected) {
      c.coverage.alreadySelected++;
      c.notes.push(`${href}: ${label} was already selected`);
      return "ok";
    }
    if (moved) {
      c.notes.push(
        `${href}: ${label} moved focus or scrolled (${viewBefore.focus}/${viewBefore.scroll} → ${viewAfter.focus}/${viewAfter.scroll})`,
      );
      return "ok";
    }
    c.coverage.noOps++;
    await c.issue({
      control: label,
      kind: "no-op",
      expected: "the control changes something",
      actual: "no visible change, no request, no download",
      severity: "low",
    });
  }
  if (new URL(page.url()).pathname !== new URL(href, appOrigin).pathname)
    return "navigated";
  return "ok";
}

/** Opens a page: retries once after a dev-server compile hiccup, and signs
    in again (recording it) when the session ended under the crawl. */
async function open(c: Crawl, href: string) {
  const page = c.page;
  await page
    .goto(href, { timeout: GOTO_TIMEOUT })
    .catch(() => page.goto(href, { timeout: GOTO_TIMEOUT }));
  await page
    .locator("main")
    .first()
    .waitFor({ timeout: 20_000 })
    .catch(() => undefined);
  if (c.takeChunkError()) {
    c.notes.push(`${href}: dev chunk SyntaxError on load, reloaded once`);
    await page.reload({ timeout: GOTO_TIMEOUT });
  }
  if (new URL(page.url()).pathname === "/login") {
    await c.issue({
      control: "(page load)",
      kind: "session-ended",
      expected: "the session stays signed in during the crawl",
      actual: "sent to /login (see the API log for the failed refresh)",
      severity: "high",
    });
    await cookieSession(page.context(), c.role.account);
    await page.goto("/dashboard", { timeout: GOTO_TIMEOUT });
    if (/\/select-portal/.test(page.url()))
      await page
        .getByRole("button", { name: /^Open: / })
        .first()
        .click();
    await page.goto(href, { timeout: GOTO_TIMEOUT });
  }
  await waitReady(c);
}

const ROW_SAMPLE = 3;
/** A control's name with its counts, times and ids taken out. */
function shapeOf(ctl: Ctl) {
  /* A row action's aria-label names its row ("Change title of <person>");
     its visible words ("Change title") are the shape. */
  const name = (ctl.rowLabel || ctl.name)
    .replace(/\bjust now\b/gi, "#")
    .replace(/\d+/g, "#")
    .replace(/[#\s·:]+$/g, "");
  const href = ctl.href.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/g, ":id");
  return `${ctl.kind}|${name}|${href}`;
}

async function crawlPage(c: Crawl, href: string, source: string) {
  const page = c.page;
  c.current = href;
  c.step = `open ${href}`;
  const stat = {
    source,
    actions: 0,
    clicked: 0,
    forms: 0,
  } as Crawl["perPage"][string];
  c.perPage[href] = stat;
  // next dev compiles a route on its first visit, which can take ~20s.
  await open(c, href);
  c.coverage.pages++;
  c.pagesVisited.push(href);
  await c.flush("(page load)");
  const landed = new URL(page.url()).pathname;
  if (landed !== new URL(href, appOrigin).pathname) {
    // A deep link the role may not open: the guard sent it elsewhere. The
    // page it landed on is crawled under its own entry.
    stat.redirectedTo = landed;
    c.notes.push(`${href}: redirected to ${landed}`);
    return;
  }
  const clicked0 = c.coverage.controlsClicked;
  const forms0 = c.coverage.formsSubmitted;
  await checkLayout(c, "1280px");
  await page.setViewportSize({ width: 390, height: 844 });
  await settle(page, 300);
  await checkLayout(c, "390px");
  await page.setViewportSize({ width: 1280, height: 800 });
  await settle(page, 200);

  const done = new Set<string>();
  const shapes = new Map<string, number>();
  let actions = 0;
  /* Tabs go last, so the open tab's content is crawled before the next
     tab hides it; after a reload the last tab clicked is opened again
     (Team: the Invitations panel was never reached, QA-SEC round 1 F5). */
  let lastTab = "";
  while (actions < MAX_ACTIONS_PER_PAGE) {
    await closeOverlays(page);
    if (lastTab) {
      const t = page
        .locator(`main [role="tab"]`)
        .filter({ hasText: lastTab })
        .first();
      if (
        (await t.count()) &&
        (await t.getAttribute("aria-selected").catch(() => "true")) !== "true"
      ) {
        await t.click({ timeout: 2_000 }).catch(() => undefined);
        await settle(page, 300);
      }
    }
    const ctls = (await collect(page).catch(() => [] as Ctl[]))
      .filter((x) => !done.has(x.key))
      .sort((a, b) => Number(a.kind === "tab") - Number(b.kind === "tab"));
    if (!ctls.length) break;
    const ctl = ctls[0];
    done.add(ctl.key);
    if (ctl.kind === "tab") lastTab = ctl.name;
    /* Rows of one list (threads, notices) differ only in counts and
       times; the first ROW_SAMPLE of each shape are exercised, the rest
       are counted as sampled. The list grows on every crawl (each run
       sends new threads), so clicking them all would not end. */
    const sh = shapeOf(ctl);
    const seen = (shapes.get(sh) ?? 0) + 1;
    shapes.set(sh, seen);
    // Destructive actions on the crawler's own rows are never sampled out.
    if (
      seen > ROW_SAMPLE &&
      !(OWN.test(ctl.name) && DESTRUCTIVE.test(ctl.name))
    ) {
      c.coverage.rowsSampledOut++;
      if (seen === ROW_SAMPLE + 1)
        c.notes.push(
          `${href}: ${ctl.kind} rows like "${ctl.name.slice(0, 50)}" sampled (first ${ROW_SAMPLE} exercised)`,
        );
      continue;
    }
    actions++;
    const r = await act(c, ctl, href).catch(async (e: unknown) => {
      c.notes.push(
        `${href}: ${ctl.kind} "${ctl.name}" threw ${String(e).slice(0, 120)}`,
      );
      return "navigated" as const;
    });
    if (
      r === "navigated" ||
      new URL(page.url()).pathname !== new URL(href, appOrigin).pathname
    ) {
      await open(c, href);
      await c.flush("(back to page)");
    }
  }
  if (actions >= MAX_ACTIONS_PER_PAGE)
    c.notes.push(`${href}: stopped at ${MAX_ACTIONS_PER_PAGE} actions`);
  stat.actions = actions;
  stat.clicked = c.coverage.controlsClicked - clicked0;
  stat.forms = c.coverage.formsSubmitted - forms0;
}

test.setTimeout(45 * 60_000);
test.use({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });

for (const role of ROLES) {
  test(`click-through every page: ${role.id} @phase16`, async ({
    asUser,
    api,
  }) => {
    const me = await (await api(role.account)).context();
    expect(me.memberships.length, "an office account").toBeGreaterThan(0);
    const { page } = await asUser(role.account);
    if (STORAGE_ORIGIN)
      await page.route(
        (url) => url.origin === STORAGE_ORIGIN,
        (route) => route.continue(),
      );
    const c = new Crawl(page, role);
    fs.mkdirSync(path.join(OUT, "screens"), { recursive: true });
    page.on("dialog", (d) => void d.dismiss().catch(() => undefined));

    /* next dev compiles /dashboard on a role's first visit; under load
       that took 22 s (QA-SEC round 1, F2), past the 20 s default. */
    await page
      .goto("/dashboard", { timeout: GOTO_TIMEOUT })
      .catch(() => page.goto("/dashboard", { timeout: GOTO_TIMEOUT }));
    if (/\/select-portal/.test(page.url()))
      await page
        .getByRole("button", { name: /^Open: / })
        .first()
        .click();
    await page
      .locator('aside a[href^="/dashboard"]')
      .first()
      .waitFor({ timeout: GOTO_TIMEOUT });
    const hrefs = [
      ...new Set(
        await page
          .locator('aside a[href^="/dashboard"]')
          .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? "")),
      ),
    ].filter(Boolean);
    const sidebar = new Set(hrefs.map((h) => h.split(/[?#]/)[0]));
    const all = [
      ...new Set([...sidebar, ...role.routes.filter((r) => !sidebar.has(r))]),
    ];

    for (const href of all)
      await crawlPage(c, href, sidebar.has(href) ? "sidebar" : "src/app").catch(
        async (e: unknown) => {
          // One page that fails to open must not lose the rest of the crawl.
          await c.issue({
            control: "(page load)",
            kind: "page-failed",
            expected: "the page opens and can be crawled",
            actual: String(e).split("\n")[0].slice(0, 200),
            severity: "high",
          });
        },
      );

    const result = {
      role: role.id,
      account: role.account.email,
      marker: MARK,
      pages: c.pagesVisited,
      perPage: c.perPage,
      coverage: c.coverage,
      silent403: c.silent403,
      issues: c.issues,
      notes: c.notes,
    };
    fs.writeFileSync(
      path.join(OUT, `results-${role.id}.json`),
      JSON.stringify(result, null, 2),
    );
    const open = c.issues.filter(
      (i) =>
        (i.severity === "blocker" || i.severity === "high") &&
        !KNOWN.has(`${i.role} ${i.page} ${i.kind}`),
    );
    for (const i of c.issues.filter((x) => x.severity === "medium"))
      test.info().annotations.push({
        type: "medium",
        description: `${i.page} ${i.control}: ${i.actual}`,
      });
    expect(
      open.map((i) => `${i.severity} ${i.page} ${i.control}: ${i.actual}`),
      `${role.id}: unexplained blocker/high issues`,
    ).toEqual([]);
  });
}
