/* Phase 16e: click-through crawl of every platform admin page.
   For each platform role (the owner with MANAGE everywhere, Administrative
   Support with support WRITE + content MANAGE, and a custom "write-only"
   admin, required: fixture-write-admin.mjs makes it and run-crawl.sh passes
   its login), the crawler signs in, collects the pages from the
   sidebar plus every admin route, and on each page:
   - clicks every visible button, link, tab, switch, checkbox, select option,
     menu item and pagination control (each distinct control name at most
     twice, so long tables are sampled, not exhausted);
   - opens every modal and drawer; submits each form empty and with invalid
     input (a validation message is expected), and with valid synthetic data
     when the form creates something (or edits a crawler-made record), then
     reloads to confirm the saved text is still there;
   - uploads local synthetic files, downloads every export;
   - runs destructive actions only inside rows that hold this run's tag;
   - records console errors, uncaught exceptions, API 5xx, unexpected 4xx,
     Next error overlays, blank or stuck pages, 404 links, controls that do
     nothing, and horizontal overflow at 1280px and 390px.
   The issue list and coverage counts go to E2E_CRAWL_OUT (default
   test-results/click-through-admin). The test fails on a blocker or high
   issue that is not listed in KNOWN below with its reason.
   Synthetic data only. --workers=1. Never networkidle. */
import fs from "node:fs";
import path from "node:path";
import type { BrowserContext, Locator, Page } from "@playwright/test";
import { ApiClient } from "./fixtures/api";
import {
  ACCOUNTS,
  apiOrigin,
  appOrigin,
  env,
  type Account,
} from "./fixtures/env";
import { cookieSession } from "./fixtures/session";
import { expect, test } from "./fixtures/test";

type Severity = "blocker" | "high" | "medium" | "low";
type Issue = {
  role: string;
  page: string;
  control: string;
  kind: string;
  steps: string;
  expected: string;
  actual: string;
  severity: Severity;
  screenshot?: string;
};
type Coverage = {
  pages: string[];
  controlsClicked: number;
  controlsSkipped: { page: string; control: string; why: string }[];
  disabledControls: { page: string; control: string }[];
  modalsOpened: number;
  formsSubmitted: {
    page: string;
    form: string;
    mode: string;
    result: string;
  }[];
  downloads: { page: string; control: string; file: string; bytes: number }[];
  uploads: number;
  links: number;
  mobilePages: number;
};

const OUT = path.resolve(
  process.env.E2E_CRAWL_OUT ?? "test-results/click-through-admin",
);
const TAG = `P16E${Date.now().toString(36).toUpperCase()}`;
const STORAGE_ORIGIN = process.env.E2E_STORAGE_ORIGIN ?? "";

/* Every admin route (src/app/(portal)/dashboard/(admin)) plus the shared
   dashboard home; a role that may not use one must get the no-access state
   or a redirect, never a crash. */
const ADMIN_ROUTES = [
  "/dashboard",
  "/dashboard/members",
  "/dashboard/manage-curriculum",
  "/dashboard/manage-library",
  "/dashboard/manage-table-talk",
  "/dashboard/live-class",
  "/dashboard/sms-analytics",
  "/dashboard/subscriptions",
  "/dashboard/admin-reviews",
  "/dashboard/admin-community",
  "/dashboard/admin-testimonials",
  "/dashboard/portal-comparison",
  "/dashboard/design-system",
  "/dashboard/admin-support",
  "/dashboard/admin-team",
];

/* Issues reviewed and recorded in REPORT.md with their reason (decision
   pending or outside this lane's fix rules). key = `${kind}|${page}|${control}`. */
const KNOWN: Record<string, string> = {
  "form-empty-accepted|/dashboard/manage-table-talk|Topics / Done":
    "Done only closes the topic manager; a topic is saved by its own Add button, which is disabled while the name is empty (CategoryManager.tsx).",
  "form-empty-accepted|/dashboard/design-system|Add a ride / Save ride":
    "The design-system page is a static component gallery; its demo modal saves nothing by design.",
  "form-empty-accepted|/dashboard/live-class|Zoom Integration / Save":
    "Every Zoom setting is optional: the meeting link may be empty (a non-https link is refused) and the rest are switches, so an empty save is valid (SETTING_FIELDS.zoom).",
};
/* The same, for controls named after a row (any staff member). */
const KNOWN_PATTERNS: [RegExp, string][] = [
  [
    /^form-empty-accepted\|\/dashboard\/admin-team\|Title for .+ \/ Save title$/,
    "The staff title is optional: saving it empty clears the title (PATCH title null), which is the intended way to remove it.",
  ],
];
function known(i: Issue): string | undefined {
  const key = `${i.kind}|${i.page}|${i.control}`;
  return KNOWN[key] ?? KNOWN_PATTERNS.find(([re]) => re.test(key))?.[1];
}

type Role = { id: string; account: Account };
const ROLES: Role[] = [
  { id: "admin-owner", account: ACCOUNTS.admin },
  {
    id: "admin-support",
    account: {
      email: "support@nephroreach.com",
      password: "staff123",
      name: "Dana Brooks",
    },
  },
  {
    id: "admin-write",
    account: {
      email: process.env.E2E_P16E_WRITE_ADMIN_EMAIL ?? "",
      password: process.env.E2E_P16E_WRITE_ADMIN_PASSWORD ?? "",
      name: "Synthetic Write Admin",
    },
  },
];

/* Never clicked by the generic crawl: they end the session, change the
   language of every later label, or leave the app. Covered elsewhere. */
const NEVER =
  /^(sign out|log ?out|cerrar sesión)$|español|^es$|^en$|english|skip to/i;
/* Destructive or state-changing outside a form: only inside a row/card that
   holds this run's tag. */
const DESTRUCTIVE =
  /delete|remove|archive|revoke|deactivate|retire|reject|decline|ban\b|suspend|reset|transfer|mark (as )?paid|refund|unpublish|disable|approve|publish|resolve|close ticket|deny|end class|cancel (class|subscription|invitation)|activate|hide|restore|move back|make owner|reopen/i;
/* A select that saves the row as soon as it changes (a record's status or
   role): only inside a row that holds this run's tag. */
const ROW_STATE = /^(status|role|access|level|plan|permission)s? (for|of) /i;
/* Buttons that save a row's state at once (feature it, reorder it). */
const ROW_STATE_BUTTON = /^feature |^move .+ (up|down)$/i;
const SUBMIT =
  /^(save|create|add|submit|send|invite|publish|schedule|confirm|upload|update|post|reply|apply|continue|next|import|done|ok|yes)\b|save changes|create|add |send|invite/i;
const CREATES =
  /add|new|create|invite|compose|schedule|upload|post|reply|send|write|import/i;
const VALIDATION =
  /required|must|please|enter|invalid|at least|too (short|long)|choose|select|cannot be|can't be|valid|missing|fill/i;
const NO_ACCESS =
  /no access|do not have access|don't have access|not been shared with you|not available to (your role|you)|permission/i;
const SUCCESS =
  /saved|created|added|sent|updated|invited|published|scheduled|uploaded|submitted|deleted|removed|done/i;

const CONTROL_SELECTOR = [
  "button",
  "a[href]",
  '[role="tab"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="combobox"]',
  '[role="menuitem"]',
  '[role="button"]',
  "select",
  'input[type="checkbox"]',
  'input[type="radio"]',
  "summary",
].join(", ");

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

/** next dev compiles a route on its first visit: wait for the DOM, not
 *  "load", and give the first compile one retry. */
async function go(page: Page, url: string) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  } catch {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  }
}

class Crawl {
  issues: Issue[] = [];
  cov: Coverage = {
    pages: [],
    controlsClicked: 0,
    controlsSkipped: [],
    disabledControls: [],
    modalsOpened: 0,
    formsSubmitted: [],
    downloads: [],
    uploads: 0,
    links: 0,
    mobilePages: 0,
  };
  current = "";
  control = "";
  /** While true, 400/409/422 answers are the expected result of a test input. */
  expectingRejection = false;
  apiCalls = 0;
  shots = new Set<string>();
  rejections: string[] = [];
  constructor(
    readonly role: string,
    readonly page: Page,
  ) {}

  add(i: Omit<Issue, "role" | "page" | "control"> & { control?: string }) {
    const issue: Issue = {
      role: this.role,
      page: this.current,
      control: i.control ?? this.control,
      ...i,
    } as Issue;
    const dup = this.issues.find(
      (x) =>
        x.kind === issue.kind &&
        x.page === issue.page &&
        x.actual === issue.actual,
    );
    if (dup) return;
    this.issues.push(issue);
    void this.shot(issue);
  }

  async shot(issue: Issue) {
    const key = `${issue.page}|${issue.kind}`;
    if (this.shots.has(key) || this.shots.size > 60) return;
    this.shots.add(key);
    const name = `${this.role}-${issue.page.replace(/[^a-z0-9]+/gi, "_")}-${issue.kind}-${this.shots.size}.png`;
    const file = path.join(OUT, "screens", name);
    issue.screenshot = path.relative(OUT, file).replace(/\\/g, "/");
    await this.page
      .screenshot({ path: file, timeout: 5_000 })
      .catch(() => undefined);
  }

  attach() {
    const { page } = this;
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      // The network listener reports failed requests with their status.
      if (/Failed to load resource/i.test(text)) return;
      const at = msg.location();
      const where = at.url
        ? ` [at ${at.url.replace(/^https?:\/\/[^/]+/, "")}:${at.lineNumber}]`
        : "";
      this.add({
        kind: "console-error",
        steps: `On ${this.current}, after "${this.control || "page load"}"`,
        expected: "No console error",
        actual: `${text.slice(0, 400)}${where}`,
        severity: "medium",
      });
    });
    page.on("pageerror", (err) => {
      if (err.name === "SyntaxError")
        this.chunkError = `${err.name}: ${err.message}`.slice(0, 400);
      this.add({
        kind: "uncaught-exception",
        steps: `On ${this.current}, after "${this.control || "page load"}"`,
        expected: "No uncaught exception",
        actual: `${err.name}: ${err.message}`.slice(0, 400),
        severity: "high",
      });
    });
    page.on("response", async (res) => {
      let u: URL;
      try {
        u = new URL(res.url());
      } catch {
        return;
      }
      if (u.origin !== apiOrigin) return;
      this.apiCalls++;
      const s = res.status();
      const p = `${res.request().method()} ${u.pathname.replace(/^\/api\/v1/, "")}`;
      if (s >= 500) {
        this.add({
          kind: "api-5xx",
          steps: `On ${this.current}, "${this.control || "page load"}"`,
          expected: "No server error",
          actual: `${s} on ${p}`,
          severity: "blocker",
        });
        return;
      }
      if (s < 400) {
        // The client renewed the access token: the 401s it answered were
        // the designed expiry-and-retry, not a failure.
        if (/\/auth\/refresh$/.test(u.pathname)) {
          this.pending401 = [];
          this.refreshedAt = Date.now();
        }
        this.okAt.set(p, Date.now());
        return;
      }
      const body = (await res.json().catch(() => null)) as {
        code?: string;
      } | null;
      const code = body?.code ?? "";
      if (this.expectingRejection && [400, 409, 422].includes(s)) {
        this.rejections.push(`${s} ${p} ${code}`);
        return;
      }
      if (s === 401 && /\/auth\/(refresh|logout)/.test(u.pathname)) return;
      if (s === 401) {
        // Judged after the action: an expired access token is renewed by
        // POST /auth/refresh and the call retried (session tiers, D2).
        this.pending401.push({
          at: Date.now(),
          call: p,
          what: `${s} on ${p} ${code}`.trim(),
          steps: `On ${this.current}, "${this.control || "page load"}"`,
        });
        return;
      }
      if (s === 403) {
        // Judged after the action: an intended refusal shows the no-access state.
        this.pending403.push(`${p} ${code}`);
        return;
      }
      if (s === 429) {
        this.add({
          kind: "api-429",
          steps: `On ${this.current}, "${this.control || "page load"}"`,
          expected: "The crawl stays under the API throttle",
          actual: `${s} on ${p} ${code}`,
          severity: "low",
        });
        return;
      }
      this.add({
        kind: `api-${s}`,
        steps: `On ${this.current}, "${this.control || "page load"}"`,
        expected: "No unexpected 4xx",
        actual: `${s} on ${p} ${code}`.trim(),
        severity: s === 401 ? "high" : "medium",
      });
    });
    page.on("download", async (d) => {
      this.downloadsStarted++;
      const dir = path.join(OUT, "downloads");
      ensureDir(dir);
      const file = path.join(
        dir,
        `${this.role}-${d.suggestedFilename().replace(/[^\w.-]+/g, "_")}`,
      );
      try {
        await d.saveAs(file);
        const bytes = fs.statSync(file).size;
        this.cov.downloads.push({
          page: this.current,
          control: this.control,
          file: path.relative(OUT, file).replace(/\\/g, "/"),
          bytes,
        });
        if (!bytes)
          this.add({
            kind: "empty-download",
            steps: `Click "${this.control}"`,
            expected: "A file with content",
            actual: `${d.suggestedFilename()} is empty`,
            severity: "medium",
          });
      } catch (e) {
        this.add({
          kind: "download-failed",
          steps: `Click "${this.control}"`,
          expected: "The export downloads",
          actual: String(e).slice(0, 200),
          severity: "medium",
        });
      }
    });
  }

  pending403: string[] = [];
  /** Downloads begun (a blob export changes neither the DOM nor the network). */
  downloadsStarted = 0;
  /** The last SyntaxError a script threw (see settle). */
  chunkError: string | null = null;
  pending401: { at: number; call: string; what: string; steps: string }[] = [];
  /** When the client last renewed its access token. */
  refreshedAt = 0;
  /** When each call (method + path) last answered 2xx/3xx. */
  okAt = new Map<string, number>();

  /** A 401 counts only when no token renewal answered it within 8 s. */
  judge401() {
    const now = Date.now();
    const stale = this.pending401.filter((x) => now - x.at > 8_000);
    this.pending401 = this.pending401.filter((x) => now - x.at <= 8_000);
    // A call sent with the old token can answer 401 just after the renewal
    // landed; the client retries it. Such a 401 counts only when there was
    // no renewal around it and the same call never succeeded afterwards.
    const renewed = (x: (typeof stale)[number]) =>
      Math.abs(x.at - this.refreshedAt) <= 8_000 ||
      (this.okAt.get(x.call) ?? 0) > x.at;
    for (const x of stale.filter((y) => !renewed(y)))
      this.add({
        kind: "api-401",
        steps: x.steps,
        expected: "No unexpected 4xx (an expired token is renewed)",
        actual: x.what,
        severity: "high",
      });
  }

  /** After an action: 403s only count when no no-access state is shown. */
  async judge403() {
    if (!this.pending403.length) return;
    const list = [...new Set(this.pending403)];
    this.pending403 = [];
    const shown = await this.page
      .getByText(NO_ACCESS)
      .first()
      .isVisible()
      .catch(() => false);
    if (shown) return;
    this.add({
      kind: "api-403-silent",
      steps: `On ${this.current}, "${this.control || "page load"}"`,
      expected: "An intended 403 shows the no-access state",
      actual: `403 with no no-access state: ${list.slice(0, 3).join(", ")}`,
      severity: "medium",
    });
  }

  async health(after: string) {
    const { page } = this;
    const overlay = await page
      .locator("nextjs-portal")
      .count()
      .catch(() => 0);
    if (overlay) {
      const text = await page
        .locator("nextjs-portal")
        .first()
        .innerText()
        .catch(() => "");
      // The dev overlay's issue badge is present for console errors too;
      // only an open error dialog is a crash.
      if (/Unhandled Runtime Error|Runtime Error|Build Error/i.test(text))
        this.add({
          kind: "next-error-overlay",
          steps: `On ${this.current}, after "${after}"`,
          expected: "No crash",
          actual: text.slice(0, 300),
          severity: "blocker",
        });
    }
    const crash = await page
      .getByText(
        /Application error|Something went wrong|This page could not be found/i,
      )
      .first()
      .isVisible()
      .catch(() => false);
    if (crash) {
      const t = await page
        .locator("body")
        .innerText()
        .catch(() => "");
      this.add({
        kind: /could not be found/i.test(t) ? "404" : "crash",
        steps: `On ${this.current}, after "${after}"`,
        expected: "The page renders",
        actual: t.replace(/\s+/g, " ").slice(0, 200),
        severity: /could not be found/i.test(t) ? "high" : "blocker",
      });
    }
    await this.judge403();
    this.judge401();
  }

  /** Waits for skeletons and busy regions to clear; reports blank or stuck. */
  async settle(label: string, ms = 10_000, retried = false) {
    const { page } = this;
    const mark = this.issues.length;
    const main = page.locator("main").first();
    await main.waitFor({ state: "visible", timeout: 20_000 }).catch(() => {
      this.add({
        kind: "blank-page",
        steps: `Open ${this.current}`,
        expected: "The page renders its main region",
        actual: "No <main> after 20 s",
        severity: "high",
      });
    });
    const busy = main.locator('[aria-busy="true"], .animate-pulse');
    const until = Date.now() + ms;
    while (Date.now() < until && (await busy.count().catch(() => 0)) > 0)
      await page.waitForTimeout(200);
    if ((await busy.count().catch(() => 0)) > 0)
      this.add({
        kind: "stuck-loading",
        steps: `Open ${this.current} (${label})`,
        expected: `Loading ends within ${ms / 1000} s`,
        actual: "A skeleton or busy region is still shown",
        severity: "medium",
      });
    const text = (await main.innerText().catch(() => "")).trim();
    if (text.length < 15)
      this.add({
        kind: "blank-page",
        steps: `Open ${this.current} (${label})`,
        expected: "Content or an empty state",
        actual: `main has ${text.length} characters`,
        severity: "high",
      });
    const blank = this.issues.slice(mark).some((i) => i.kind === "blank-page");
    if (blank && !retried && this.chunkError) {
      // next dev served a script while it was recompiling (a webpack
      // chunk that does not parse). Reload once: a page that renders then
      // is a dev-server race, recorded low; one that stays blank stands.
      const err = this.chunkError;
      this.chunkError = null;
      const dropped = this.issues.splice(mark);
      const exception = this.issues.findIndex(
        (i) =>
          i.kind === "uncaught-exception" &&
          i.page === this.current &&
          i.actual === err,
      );
      const removed =
        exception >= 0 ? this.issues.splice(exception, 1) : ([] as Issue[]);
      await page
        .reload({ waitUntil: "domcontentloaded", timeout: 60_000 })
        .catch(() => undefined);
      const again = this.issues.length;
      await this.settle(label, ms, true);
      if (this.issues.slice(again).some((i) => i.kind === "blank-page")) {
        this.issues.push(...removed, ...dropped);
      } else {
        this.add({
          kind: "dev-chunk-error",
          steps: `Open ${this.current} (${label}) on next dev`,
          expected: "The page renders on the first load",
          actual: `${err}; blank until one reload, then rendered (next dev compile race, not seen on a warm server)`,
          severity: "low",
        });
      }
    }
  }

  async overflow(width: number) {
    const res = await this.page
      .evaluate(() => {
        const doc = document.documentElement;
        const over = doc.scrollWidth - window.innerWidth;
        if (over <= 1) return null;
        let widest = "";
        let max = 0;
        for (const el of Array.from(document.querySelectorAll("main *"))) {
          const r = (el as HTMLElement).getBoundingClientRect();
          if (r.right - window.innerWidth > max && r.width > 0) {
            max = r.right - window.innerWidth;
            const e = el as HTMLElement;
            widest = `${e.tagName.toLowerCase()}${e.className && typeof e.className === "string" ? "." + e.className.split(" ").slice(0, 3).join(".") : ""} "${(e.innerText || "").slice(0, 40)}"`;
          }
        }
        return { over, widest };
      })
      // A late client redirect can replace the document mid-measure; the
      // page is measured again on the next pass.
      .catch(() => null);
    if (res)
      this.add({
        kind: `overflow-${width}`,
        control: "(layout)",
        steps: `Open ${this.current} at ${width}px wide`,
        expected: "No horizontal page scroll",
        actual: `Page is ${res.over}px wider than the viewport; widest: ${res.widest}`,
        severity: width < 500 ? "medium" : "low",
      });
  }
}

/* -------------------------------------------------------------- controls */

type Seen = { key: string; name: string; tag: string; role: string };

async function listControls(scope: Locator): Promise<
  (Seen & {
    idx: number;
    disabled: boolean;
    href: string;
    inTagged: boolean;
    external: boolean;
  })[]
> {
  return scope.locator(CONTROL_SELECTOR).evaluateAll(
    (els, tag) =>
      els
        .map((el, idx) => {
          const e = el as HTMLElement;
          const r = e.getBoundingClientRect();
          const style = getComputedStyle(e);
          const visible =
            r.width > 0 &&
            r.height > 0 &&
            style.visibility !== "hidden" &&
            style.display !== "none";
          const label =
            e.getAttribute("aria-label") ||
            (e.innerText || "").replace(/\s+/g, " ").trim() ||
            e.getAttribute("title") ||
            (e as HTMLInputElement).value ||
            e.getAttribute("name") ||
            "";
          const roleAttr = e.getAttribute("role") || e.tagName.toLowerCase();
          const href = e.getAttribute("href") || "";
          const container = e.closest(
            "tr, article, li, [role=row], [role=listitem]",
          );
          return {
            idx,
            key: `${roleAttr}|${label.slice(0, 60)}`,
            name: label.slice(0, 80),
            tag: e.tagName.toLowerCase(),
            role: roleAttr,
            disabled:
              !visible ||
              (e as HTMLButtonElement).disabled ||
              e.getAttribute("aria-disabled") === "true",
            visible,
            href,
            inTagged: Boolean(
              container && (container as HTMLElement).innerText.includes(tag),
            ),
            external:
              /^(mailto:|tel:)/.test(href) ||
              (/^https?:/.test(href) && !href.startsWith(location.origin)) ||
              e.getAttribute("target") === "_blank",
          };
        })
        .filter((c) => c.visible || c.disabled),
    TAG,
  ) as never;
}

async function mutationCount(page: Page): Promise<number> {
  return page
    .evaluate(
      () => (window as unknown as { __p16eMut?: number }).__p16eMut ?? 0,
    )
    .catch(() => 0);
}

const openDialog = (page: Page) =>
  page.locator('[role="dialog"]:visible, [role="alertdialog"]:visible').last();

async function closeDialogs(page: Page) {
  for (let i = 0; i < 3; i++) {
    const d = openDialog(page);
    if (!(await d.count())) return;
    await page.keyboard.press("Escape").catch(() => undefined);
    await page.waitForTimeout(150);
    if (await d.count()) {
      const close = d
        .getByRole("button", {
          name: /^(cancel|close|close dialog|no|not now|keep)/i,
        })
        .first();
      if (await close.count())
        await close.click({ timeout: 2_000 }).catch(() => undefined);
      await page.waitForTimeout(150);
    }
  }
}

function fileFor(accept: string) {
  const a = accept.toLowerCase();
  if (/csv/.test(a))
    return {
      name: `${TAG}.csv`,
      mimeType: "text/csv",
      buffer: Buffer.from("name,value\nSynthetic,1\n"),
    };
  if (/pdf/.test(a))
    return {
      name: `${TAG}.pdf`,
      mimeType: "application/pdf",
      buffer: Buffer.from(
        "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
      ),
    };
  if (/video|mp4/.test(a))
    return {
      name: `${TAG}.mp4`,
      mimeType: "video/mp4",
      buffer: Buffer.from(
        "000000186674797069736f6d0000020069736f6d69736f32",
        "hex",
      ),
    };
  if (/audio|mp3/.test(a))
    return {
      name: `${TAG}.mp3`,
      mimeType: "audio/mpeg",
      buffer: Buffer.from("494433030000000000", "hex"),
    };
  // A 1x1 PNG.
  return {
    name: `${TAG}.png`,
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    ),
  };
}

type FillMode = "empty" | "invalid" | "valid";

/** Fills the dialog's fields. Returns how many fields it touched. */
async function fillFields(
  c: Crawl,
  scope: Locator,
  mode: FillMode,
  token: string,
) {
  const fields = scope.locator(
    'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]), textarea, select',
  );
  const n = await fields.count();
  let touched = 0;
  for (let i = 0; i < n; i++) {
    const f = fields.nth(i);
    if (!(await f.isVisible().catch(() => false))) {
      // File inputs are usually hidden behind a styled button.
      const t = await f.getAttribute("type").catch(() => "");
      if (t !== "file" || mode !== "valid") continue;
    }
    if (await f.isDisabled().catch(() => true)) continue;
    const tag = await f.evaluate((e) => e.tagName.toLowerCase());
    const type = ((await f.getAttribute("type")) ?? "text").toLowerCase();
    const readOnly = await f.evaluate((e) => (e as HTMLInputElement).readOnly);
    if (readOnly) continue;
    const label = (
      (await f.getAttribute("aria-label")) ??
      (await f.getAttribute("name")) ??
      (await f.getAttribute("id")) ??
      ""
    ).toLowerCase();
    try {
      if (tag === "select") {
        if (mode === "valid") {
          const opts = await f
            .locator("option")
            .evaluateAll((os) =>
              os
                .map((o) => (o as HTMLOptionElement).value)
                .filter((v) => v !== ""),
            );
          if (opts.length)
            await f.selectOption(opts[Math.min(1, opts.length - 1)]);
        }
        touched++;
        continue;
      }
      if (type === "file") {
        if (mode !== "valid") continue;
        const accept = (await f.getAttribute("accept")) ?? "";
        await f.setInputFiles(fileFor(accept));
        c.cov.uploads++;
        touched++;
        continue;
      }
      if (mode === "empty") {
        await f.fill("", { timeout: 2_000 });
        touched++;
        continue;
      }
      let value = "";
      if (mode === "invalid") {
        if (type === "email" || /email/.test(label)) value = "not-an-email";
        else if (type === "url" || /url|link/.test(label)) value = "not a url";
        else if (type === "number") value = "-999999";
        else continue;
      } else if (type === "email" || /email/.test(label))
        value = `${token.toLowerCase()}@example.test`;
      else if (type === "url" || /url|link/.test(label))
        value = `https://example.test/${token.toLowerCase()}`;
      else if (type === "number")
        value = /price|amount|cents|\$/.test(label) ? "12.50" : "3";
      else if (type === "date")
        value = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
      else if (type === "datetime-local")
        value = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 16);
      else if (type === "time") value = "09:30";
      else if (type === "tel" || /phone/.test(label)) value = "5555550100";
      else if (type === "password") continue;
      else if (type === "search") continue;
      else if (type === "color") value = "#336699";
      else
        value =
          tag === "textarea"
            ? `${token} synthetic text for the click-through crawl.`
            : `${token} ${label.replace(/[^a-z ]/g, "").slice(0, 12) || "name"}`.trim();
      await f.fill(value, { timeout: 2_000 });
      touched++;
    } catch {
      /* A field the crawl cannot type into (masked, custom); the submit
         result still shows whether the form handles it. */
    }
  }
  if (mode === "valid") {
    // Required checkboxes (consent-like) and the first radio of each group.
    const boxes = scope.locator('input[type="checkbox"][required]:visible');
    for (let i = 0; i < (await boxes.count()); i++)
      await boxes
        .nth(i)
        .check({ timeout: 1_000 })
        .catch(() => undefined);
    const radios = scope.locator('[role="radiogroup"]');
    for (let i = 0; i < (await radios.count()); i++) {
      const r = radios
        .nth(i)
        .locator('[role="radio"], input[type="radio"]')
        .first();
      if (await r.isVisible().catch(() => false))
        await r.click({ timeout: 1_000 }).catch(() => undefined);
    }
  }
  return touched;
}

async function submitButton(scope: Locator): Promise<Locator | null> {
  const buttons = scope.locator("button:visible");
  const n = await buttons.count();
  for (let i = n - 1; i >= 0; i--) {
    const b = buttons.nth(i);
    const name = (
      (await b.getAttribute("aria-label")) ??
      (await b.innerText().catch(() => ""))
    )
      .replace(/\s+/g, " ")
      .trim();
    if (
      !name ||
      /cancel|close|back|collapse|expand|remove file|^x$/i.test(name)
    )
      continue;
    if ((await b.getAttribute("type")) === "submit" || SUBMIT.test(name))
      return b;
  }
  return null;
}

/** Runs the form checks on an open dialog. */
async function exerciseDialog(c: Crawl, opener: string, allowSave: boolean) {
  const { page } = c;
  const dialog = openDialog(page);
  c.cov.modalsOpened++;
  const title = (
    (await dialog
      .locator("h1, h2, h3")
      .first()
      .innerText()
      .catch(() => "")) || opener
  )
    .replace(/\s+/g, " ")
    .slice(0, 60);
  // Tabs inside the dialog.
  const tabs = dialog.locator('[role="tab"]:visible');
  for (let i = 0; i < Math.min(await tabs.count(), 6); i++) {
    await tabs
      .nth(i)
      .click({ timeout: 2_000 })
      .catch(() => undefined);
    c.cov.controlsClicked++;
  }
  const fieldCount = await dialog
    .locator("input:not([type=hidden]), textarea, select")
    .count();
  const submit = await submitButton(dialog);
  if (!submit) return;
  const submitName = (
    (await submit.innerText().catch(() => "")) || "submit"
  ).trim();
  const isConfirm = fieldCount === 0;
  if (isConfirm) {
    // A confirmation: confirm only for this run's records.
    if (allowSave) {
      await submit.click({ timeout: 3_000 }).catch(() => undefined);
      c.cov.formsSubmitted.push({
        page: c.current,
        form: title,
        mode: "confirm",
        result: "confirmed",
      });
      await page.waitForTimeout(600);
    }
    return;
  }

  for (const mode of ["empty", "invalid"] as const) {
    if (!(await dialog.isVisible().catch(() => false))) return;
    const touched = await fillFields(c, dialog, mode, TAG);
    if (!touched) continue;
    c.expectingRejection = true;
    c.rejections = [];
    const before = c.apiCalls;
    const b = await submitButton(dialog);
    const disabled = b ? await b.isDisabled().catch(() => true) : true;
    if (b && !disabled)
      await b.click({ timeout: 3_000 }).catch(() => undefined);
    await page.waitForTimeout(500);
    c.expectingRejection = false;
    const invalidShown =
      (await dialog
        .locator('[aria-invalid="true"]')
        .count()
        .catch(() => 0)) > 0 ||
      (await dialog
        .getByRole("alert")
        .filter({ hasText: VALIDATION })
        .count()
        .catch(() => 0)) > 0 ||
      (await dialog
        .getByText(VALIDATION)
        .count()
        .catch(() => 0)) > 0 ||
      (await dialog
        .locator("input:invalid, textarea:invalid, select:invalid")
        .count()
        .catch(() => 0)) > 0;
    const stillOpen = await dialog.isVisible().catch(() => false);
    const result = disabled
      ? "submit disabled"
      : invalidShown
        ? "validation shown"
        : c.rejections.length
          ? `server refused (${c.rejections[0]})`
          : stillOpen
            ? "no message"
            : "dialog closed";
    c.cov.formsSubmitted.push({ page: c.current, form: title, mode, result });
    if (
      !disabled &&
      !invalidShown &&
      (!stillOpen || c.apiCalls > before) &&
      !c.rejections.length
    )
      c.add({
        kind: `form-${mode}-accepted`,
        control: `${title} / ${submitName}`,
        steps: `Open "${opener}", ${mode === "empty" ? "clear every field" : "type invalid email/url/number"}, click "${submitName}"`,
        expected: "A validation message; nothing saved",
        actual: stillOpen
          ? "Request sent with no message shown"
          : "The dialog closed as if saved",
        severity: "high",
      });
    else if (!disabled && !invalidShown && c.rejections.length)
      c.add({
        kind: `form-${mode}-no-message`,
        control: `${title} / ${submitName}`,
        steps: `Open "${opener}", ${mode} input, click "${submitName}"`,
        expected: "A validation message on the form",
        actual: `The server refused (${c.rejections[0]}) and the form shows no message`,
        severity: "medium",
      });
    else if (!disabled && !invalidShown && stillOpen && mode === "empty")
      c.add({
        kind: "form-empty-silent",
        control: `${title} / ${submitName}`,
        steps: `Open "${opener}", clear every field, click "${submitName}"`,
        expected: "A validation message",
        actual: "Nothing happened and no message was shown",
        severity: "low",
      });
    if (!stillOpen) return;
  }

  if (!allowSave) return;
  if (!(await dialog.isVisible().catch(() => false))) return;
  const token = `${TAG}-${c.cov.formsSubmitted.length}`;
  await fillFields(c, dialog, "valid", token);
  const b = await submitButton(dialog);
  if (!b || (await b.isDisabled().catch(() => true))) {
    c.cov.formsSubmitted.push({
      page: c.current,
      form: title,
      mode: "valid",
      result: "submit disabled after valid fill",
    });
    return;
  }
  c.rejections = [];
  c.expectingRejection = true;
  await b.click({ timeout: 3_000 }).catch(() => undefined);
  await dialog
    .waitFor({ state: "hidden", timeout: 6_000 })
    .catch(() => undefined);
  c.expectingRejection = false;
  const closed = !(await dialog.isVisible().catch(() => false));
  const toast = await page
    .getByRole("status")
    .filter({ hasText: SUCCESS })
    .count()
    .catch(() => 0);
  const result = c.rejections.length
    ? `server refused (${c.rejections[0]})`
    : closed
      ? "saved (dialog closed)"
      : "still open";
  c.cov.formsSubmitted.push({
    page: c.current,
    form: title,
    mode: "valid",
    result,
  });
  if (c.rejections.length) {
    const msg = await dialog
      .getByRole("alert")
      .first()
      .innerText()
      .catch(() => "");
    if (!msg)
      c.add({
        kind: "form-valid-refused-silent",
        control: `${title} / ${submitName}`,
        steps: `Open "${opener}", fill valid synthetic data, click "${submitName}"`,
        expected: "Saved, or a clear message",
        actual: `Server refused (${c.rejections[0]}) with no message shown`,
        severity: "medium",
      });
    else
      c.add({
        kind: "form-valid-refused",
        control: `${title} / ${submitName}`,
        steps: `Open "${opener}", fill the crawler's generic synthetic data, click "${submitName}"`,
        expected: "Saved",
        actual: `Refused with a message: ${msg.slice(0, 160)} (${c.rejections[0]}); review whether the generic data was valid`,
        severity: "low",
      });
    await closeDialogs(page);
    return;
  }
  if (closed && (toast || CREATES.test(opener))) {
    // Persistence: the saved text is still on the page after a reload.
    await page.reload();
    await c.settle("after save reload");
    const kept = await page
      .getByText(token, { exact: false })
      .first()
      .isVisible({ timeout: 4_000 })
      .catch(() => false);
    if (!kept && toast)
      c.add({
        kind: "saved-not-shown",
        control: `${title} / ${submitName}`,
        steps: `Open "${opener}", fill valid data (${token}), save, reload`,
        expected: "The saved record shows after a reload",
        actual:
          "Success shown, but the text is not on the page after a reload (it may be on another tab/page; review)",
        severity: "medium",
      });
  }
}

/** Clicks every control in main, once per distinct name (twice for rows). */
async function crawlPage(c: Crawl, route: string, budgetMs: number) {
  const { page } = c;
  const started = Date.now();
  const clicked = new Map<string, number>();
  const home = () => go(page, route).then(() => c.settle("return"));
  let pass = 0;
  while (Date.now() - started < budgetMs && pass < 400) {
    pass++;
    const main = page.locator("main").first();
    const controls = await listControls(main).catch(() => []);
    const next = controls.find((ctl) => {
      if (ctl.disabled) return false;
      const n = clicked.get(ctl.key) ?? 0;
      return (
        n < (ctl.inTagged ? 3 : 2) && !clicked.has(`${ctl.key}#${ctl.idx}`)
      );
    });
    for (const ctl of controls.filter((x) => x.disabled && x.name))
      if (
        !c.cov.disabledControls.some(
          (d) => d.page === route && d.control === ctl.name,
        )
      )
        c.cov.disabledControls.push({ page: route, control: ctl.name });
    if (!next) break;
    clicked.set(next.key, (clicked.get(next.key) ?? 0) + 1);
    clicked.set(`${next.key}#${next.idx}`, 1);
    const name = next.name || `(${next.tag} without a name)`;
    c.control = name;
    if (!next.name && next.tag !== "select") {
      c.add({
        kind: "control-without-name",
        steps: `On ${route}`,
        expected: "Every control has an accessible name",
        actual: `A ${next.role} has no accessible name`,
        severity: "low",
      });
    }
    if (NEVER.test(name)) {
      c.cov.controlsSkipped.push({
        page: route,
        control: name,
        why: "ends the session or switches language",
      });
      continue;
    }
    if (next.external) {
      c.cov.links++;
      c.cov.controlsSkipped.push({
        page: route,
        control: `${name} → ${next.href}`,
        why: "external / mailto link (href checked, not opened)",
      });
      continue;
    }
    if (DESTRUCTIVE.test(name) && !next.inTagged) {
      c.cov.controlsSkipped.push({
        page: route,
        control: name,
        why: "destructive on a record this crawl did not create",
      });
      continue;
    }
    if (
      ((next.tag === "select" && ROW_STATE.test(name)) ||
        ROW_STATE_BUTTON.test(name)) &&
      !next.inTagged
    ) {
      c.cov.controlsSkipped.push({
        page: route,
        control: name,
        why: "saves at once (status, role, feature or order of a record this crawl did not create)",
      });
      continue;
    }
    const loc = main.locator(CONTROL_SELECTOR).nth(next.idx);
    const urlBefore = page.url();
    const mutBefore = await mutationCount(page);
    const apiBefore = c.apiCalls;
    const downloadsBefore = c.downloadsStarted;
    // The tab, filter or page already chosen: clicking it again changes nothing.
    const alreadyOn = await loc
      .evaluate((el) =>
        ["aria-selected", "aria-pressed", "aria-current"].some((a) => {
          const v = el.getAttribute(a);
          return v !== null && v !== "false";
        }),
      )
      .catch(() => false);
    try {
      if (next.tag === "select") {
        const opts = await loc
          .locator("option")
          .evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
        const original = await loc.inputValue().catch(() => opts[0]);
        for (const v of opts.slice(0, 5)) {
          await loc.selectOption(v, { timeout: 2_000 });
          await page.waitForTimeout(150);
        }
        // Back to what it was, so a filter or a saved setting is unchanged.
        if (opts.length)
          await loc.selectOption(original ?? opts[0]).catch(() => undefined);
      } else {
        await loc.click({ timeout: 3_000 });
      }
      c.cov.controlsClicked++;
      if (next.tag === "a") c.cov.links++;
    } catch (e) {
      c.cov.controlsSkipped.push({
        page: route,
        control: name,
        why: `not clickable: ${String(e).split("\n")[0].slice(0, 100)}`,
      });
      continue;
    }
    await page.waitForTimeout(350);
    await c.health(name);

    // A modal or drawer.
    if (await openDialog(page).count()) {
      const allow = next.inTagged || CREATES.test(name);
      await exerciseDialog(c, name, allow).catch(() => undefined);
      await closeDialogs(page);
      await c.health(`${name} dialog`);
      if (new URL(page.url()).pathname !== route) await home();
      continue;
    }
    // A menu or listbox.
    const menu = page
      .locator('[role="menu"]:visible, [role="listbox"]:visible')
      .last();
    if (await menu.count()) {
      const items = menu.locator(
        '[role="menuitem"], [role="option"], [role="menuitemradio"], [role="menuitemcheckbox"]',
      );
      const names = await items.allInnerTexts().catch(() => [] as string[]);
      await page.keyboard.press("Escape").catch(() => undefined);
      for (const [i, itemName] of names.slice(0, 8).entries()) {
        if (
          NEVER.test(itemName) ||
          (DESTRUCTIVE.test(itemName) && !next.inTagged)
        ) {
          c.cov.controlsSkipped.push({
            page: route,
            control: `${name} › ${itemName}`,
            why: "destructive / session menu item",
          });
          continue;
        }
        await loc.click({ timeout: 2_000 }).catch(() => undefined);
        const again = page
          .locator('[role="menu"]:visible, [role="listbox"]:visible')
          .last();
        c.control = `${name} › ${itemName.trim()}`;
        await again
          .locator(
            '[role="menuitem"], [role="option"], [role="menuitemradio"], [role="menuitemcheckbox"]',
          )
          .nth(i)
          .click({ timeout: 2_000 })
          .catch(() => undefined);
        c.cov.controlsClicked++;
        await page.waitForTimeout(300);
        await c.health(c.control);
        if (await openDialog(page).count()) {
          await exerciseDialog(
            c,
            c.control,
            next.inTagged || CREATES.test(itemName),
          ).catch(() => undefined);
          await closeDialogs(page);
        }
        if (new URL(page.url()).pathname !== route) await home();
      }
      continue;
    }
    // Navigation.
    if (page.url() !== urlBefore) {
      const now = new URL(page.url());
      if (now.pathname !== route) {
        await c.settle(`link from ${route}`, 6_000);
        await c.health(name);
        if (
          !c.cov.pages.includes(now.pathname) &&
          now.pathname.startsWith("/dashboard/")
        ) {
          c.cov.pages.push(now.pathname);
        }
        await home();
      }
      continue;
    }
    // A control that did nothing.
    const changed =
      (await mutationCount(page)) !== mutBefore ||
      c.apiCalls !== apiBefore ||
      c.downloadsStarted !== downloadsBefore;
    if (!changed && next.tag !== "a" && !alreadyOn)
      c.add({
        kind: "no-op-control",
        steps: `On ${route}, click "${name}"`,
        expected: "Something visible happens",
        actual: "No DOM change, no request, no navigation",
        severity: "low",
      });
  }
  // Text inputs on the page itself (search, filters): type and clear.
  const inputs = page.locator(
    'main input[type="search"]:visible, main input[type="text"]:visible, main input:not([type]):visible',
  );
  for (let i = 0; i < Math.min(await inputs.count(), 4); i++) {
    const f = inputs.nth(i);
    c.control = `input ${(await f.getAttribute("aria-label")) ?? (await f.getAttribute("placeholder")) ?? i}`;
    await f.fill("zz-no-match-zz", { timeout: 2_000 }).catch(() => undefined);
    await page.waitForTimeout(400);
    await c.health(c.control);
    await f.fill("", { timeout: 2_000 }).catch(() => undefined);
    c.cov.controlsClicked++;
  }
}

async function newSession(
  browser: import("@playwright/test").Browser,
  account: Account,
) {
  const context: BrowserContext = await browser.newContext();
  const allowed = new Set([appOrigin, apiOrigin]);
  if (STORAGE_ORIGIN) allowed.add(new URL(STORAGE_ORIGIN).origin);
  const blocked: string[] = [];
  await context.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith("data:") || url.startsWith("blob:"))
      return route.continue();
    try {
      if (allowed.has(new URL(url).origin)) return route.continue();
    } catch {
      /* fall through */
    }
    blocked.push(url);
    return route.abort("blockedbyclient");
  });
  await context.addInitScript(() => {
    const w = window as unknown as { __p16eMut: number };
    w.__p16eMut = 0;
    new MutationObserver((m) => {
      w.__p16eMut += m.length;
    }).observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });
  });
  await cookieSession(context, account);
  return { context, blocked };
}

/** Records this crawl owns, so the moderation and support screens have
 *  tagged rows to approve, decline, reply to and resolve. */
/* The review queue lists the oldest pending review first, ten to a page.
   Earlier runs' crawler-made reviews (still pending when a run stops early)
   would push this run's review off page 1, so the owner declines them
   first. Only reviews whose comment carries a crawler tag. */
async function declineStaleTaggedReviews() {
  const owner = await ApiClient.login(ACCOUNTS.admin);
  try {
    const res = await owner.get("/platform/content/reviews?limit=100");
    expect(res.status(), "owner reads the review queue").toBe(200);
    const stale = rows(await res.json()).filter(
      (r) =>
        String(r.status).toUpperCase() === "PENDING" &&
        /^P16E[A-Z0-9]+ synthetic review /.test(String(r.comment ?? "")) &&
        !String(r.comment).startsWith(`${TAG} `),
    );
    for (const r of stale) {
      const d = await owner.post(
        `/platform/content/reviews/${String(r.id)}/decline`,
        { reason: "Synthetic review from an earlier admin crawl." },
      );
      expect(d.status(), "decline an earlier crawl's review").toBe(200);
    }
  } finally {
    await owner.logout().catch(() => undefined);
    await owner.dispose();
  }
}

async function seedTaggedRecords() {
  await declineStaleTaggedReviews();
  const john = await ApiClient.login(ACCOUNTS.john);
  try {
    const made = [
      await john.post("/community/posts", {
        categoryId: "general",
        body: `${TAG} synthetic community post for the admin crawl.`,
      }),
      await john.post("/reviews", {
        rating: 4,
        role: "Dialysis Member",
        comment: `${TAG} synthetic review for the admin crawl.`,
      }),
      await john.post("/me/support-tickets", {
        dashboard: "Patient",
        subject: `${TAG} synthetic ticket`,
        category: "technical",
        message: `${TAG} synthetic support message for the admin crawl.`,
      }),
    ];
    for (const r of made)
      expect(r.status(), `seed ${r.url()}`).toBeLessThan(300);
  } finally {
    await john.logout().catch(() => undefined);
    await john.dispose();
  }
}

test.describe.configure({ mode: "serial" });
test.setTimeout(75 * 60_000);

const allIssues: Issue[] = [];
const allCoverage: Record<string, Coverage> = {};
/** The crawl that is running now: flushed with the finished ones, so a
 *  failed or timed-out run still leaves what it found. */
let live: Crawl | null = null;

function flush() {
  ensureDir(OUT);
  const issues = live ? [...allIssues, ...live.issues] : allIssues;
  const coverage = live
    ? { ...allCoverage, [live.role]: live.cov }
    : allCoverage;
  fs.writeFileSync(
    path.join(OUT, "issues.json"),
    JSON.stringify(
      {
        tag: TAG,
        at: new Date().toISOString(),
        partial: Boolean(live),
        issues: issues.map((i) => ({ ...i, known: known(i) })),
      },
      null,
      1,
    ),
  );
  fs.writeFileSync(
    path.join(OUT, "coverage.json"),
    JSON.stringify(coverage, null, 1),
  );
}

test.beforeAll(async () => {
  ensureDir(path.join(OUT, "screens"));
  flush();
  await seedTaggedRecords();
});

test.afterAll(() => {
  flush();
});

const WRITE_ADMIN = ROLES.find((r) => r.id === "admin-write")!.account;
function requireWriteAdmin() {
  if (!WRITE_ADMIN.email || !WRITE_ADMIN.password)
    throw new Error(
      "E2E_P16E_WRITE_ADMIN_EMAIL / _PASSWORD are required for this lane (run fixture-write-admin.mjs, then run-crawl.sh)",
    );
}

/* MANAGE-only actions (backend @RequirePlatformPermission /
   @RequireOrganizationPermission at PermissionLevel.MANAGE) that the
   WRITE-only admin must be refused. Guards run before validation, so the
   server answers 403 whatever the body; the ids are random and the bodies
   empty, so even a broken guard could not change a real record.
   Organization settings and profile need only WRITE on the server, so they
   are not MANAGE-only and are not probed here. */
const NO_ID = "00000000-0000-4000-8000-0000000000aa";
type Probe = {
  what: string;
  method: "post" | "patch" | "put" | "delete";
  path: (org: string) => string;
  ownerControl?: boolean;
};
const MANAGE_ONLY: Probe[] = [
  // Staff and roles (platform team).
  {
    what: "invite staff",
    method: "post",
    path: (o) => `/organizations/${o}/invitations`,
  },
  {
    what: "revoke an invitation",
    method: "post",
    path: (o) => `/organizations/${o}/invitations/${NO_ID}/revoke`,
    ownerControl: true,
  },
  {
    what: "resend an invitation",
    method: "post",
    path: (o) => `/organizations/${o}/invitations/${NO_ID}/resend`,
    ownerControl: true,
  },
  {
    what: "change a member role",
    method: "patch",
    path: (o) => `/organizations/${o}/staff/${NO_ID}/role`,
    ownerControl: true,
  },
  {
    what: "deactivate a member",
    method: "post",
    path: (o) => `/organizations/${o}/staff/${NO_ID}/deactivate`,
    ownerControl: true,
  },
  {
    what: "reactivate a member",
    method: "post",
    path: (o) => `/organizations/${o}/staff/${NO_ID}/reactivate`,
    ownerControl: true,
  },
  {
    what: "transfer ownership",
    method: "post",
    path: (o) => `/organizations/${o}/staff/ownership-transfer`,
  },
  {
    what: "create a role",
    method: "post",
    path: (o) => `/organizations/${o}/roles`,
  },
  {
    what: "change role permissions",
    method: "put",
    path: (o) => `/organizations/${o}/roles/permissions`,
  },
  {
    what: "delete a role",
    method: "delete",
    path: (o) => `/organizations/${o}/roles`,
  },
  // Plans.
  {
    what: "publish a member plan",
    method: "post",
    path: () => `/platform/member-plans/${NO_ID}/publish`,
    ownerControl: true,
  },
  {
    what: "retire a member plan",
    method: "post",
    path: () => `/platform/member-plans/${NO_ID}/retire`,
    ownerControl: true,
  },
  {
    what: "publish an organization plan",
    method: "post",
    path: () => `/platform/organization-plans/${NO_ID}/publish`,
    ownerControl: true,
  },
  {
    what: "retire an organization plan",
    method: "post",
    path: () => `/platform/organization-plans/${NO_ID}/retire`,
    ownerControl: true,
  },
  // Contracts and invoices.
  {
    what: "mark an invoice paid",
    method: "post",
    path: () => `/platform/invoices/${NO_ID}/mark-paid`,
    ownerControl: true,
  },
  {
    what: "resolve a contract change request",
    method: "post",
    path: () => `/platform/contract-change-requests/${NO_ID}/resolve`,
    ownerControl: true,
  },
  // Organizations (create, edit, suspend, close, reactivate).
  {
    what: "create an organization",
    method: "post",
    path: () => `/platform/organizations`,
  },
  {
    what: "edit an organization",
    method: "patch",
    path: () => `/platform/organizations/${NO_ID}`,
    ownerControl: true,
  },
  {
    what: "suspend an organization",
    method: "post",
    path: () => `/platform/organizations/${NO_ID}/suspend`,
    ownerControl: true,
  },
  {
    what: "close an organization",
    method: "post",
    path: () => `/platform/organizations/${NO_ID}/close`,
    ownerControl: true,
  },
  {
    what: "reactivate an organization",
    method: "post",
    path: () => `/platform/organizations/${NO_ID}/reactivate`,
    ownerControl: true,
  },
  // Content moderation (CONTENT MANAGE).
  {
    what: "approve a review",
    method: "post",
    path: () => `/platform/content/reviews/${NO_ID}/approve`,
    ownerControl: true,
  },
  {
    what: "decline a review",
    method: "post",
    path: () => `/platform/content/reviews/${NO_ID}/decline`,
    ownerControl: true,
  },
  {
    what: "approve a testimonial",
    method: "post",
    path: () => `/platform/content/testimonials/${NO_ID}/approve`,
    ownerControl: true,
  },
  {
    what: "decline a testimonial",
    method: "post",
    path: () => `/platform/content/testimonials/${NO_ID}/decline`,
    ownerControl: true,
  },
  {
    what: "approve a community post",
    method: "post",
    path: () => `/platform/content/community/posts/${NO_ID}/approve`,
    ownerControl: true,
  },
  {
    what: "reject a community post",
    method: "post",
    path: () => `/platform/content/community/posts/${NO_ID}/reject`,
    ownerControl: true,
  },
];

/* MANAGE-only UI controls. Each one is checked for the owner first (it must
   be there, so a selector that matches nothing cannot pass) and then for the
   WRITE-only admin (it must be absent). Some exist only when a row needs the
   action: `needs` names that row, and when the owner's API read shows there
   is none the check is recorded as not exercised instead of passing. */
type UiControl = {
  route: string;
  what: string;
  name: RegExp;
  needs?: "unpaid-invoice" | "open-change-request" | "pending-review";
  /** The tab the control lives on, opened first. */
  tab?: RegExp;
};
const MANAGE_UI: UiControl[] = [
  {
    route: "/dashboard/admin-team",
    what: "make a member the owner",
    name: /^make .+ the owner$/i,
    tab: /^people$/i,
  },
  {
    route: "/dashboard/admin-team",
    what: "invite staff",
    name: /^invite staff$/i,
    tab: /^invitations$/i,
  },
  {
    route: "/dashboard/subscriptions",
    what: "publish or retire a plan",
    name: /^(publish|retire) /i,
  },
  {
    route: "/dashboard/subscriptions",
    what: "mark an invoice paid",
    name: /^mark .+ paid$/i,
    needs: "unpaid-invoice",
  },
  {
    route: "/dashboard/subscriptions",
    what: "resolve a change request",
    name: /^resolve the /i,
    needs: "open-change-request",
  },
  {
    route: "/dashboard/admin-reviews",
    what: "accept or decline a review",
    name: /^(accept|decline)\b/i,
    needs: "pending-review",
  },
];
/** Moderation buttons on the three queues (reviews, testimonials, community). */
const MODERATION_BUTTON =
  /^(approve|accept|decline|reject|re-approve|feature|hide)\b/i;
const MODERATION_ROUTES = [
  "/dashboard/admin-reviews",
  "/dashboard/admin-testimonials",
  "/dashboard/admin-community",
];

/** The API answers { success, data }, where data is the list or a page
 *  ({ items, ... }). */
function rows(body: unknown): Record<string, unknown>[] {
  const data = (body as { data?: unknown } | null)?.data ?? body;
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  const items = (data as { items?: unknown } | null)?.items;
  return Array.isArray(items) ? (items as Record<string, unknown>[]) : [];
}
/** MANAGE-only reads: the moderation queues. */
const MANAGE_ONLY_READS = [
  "/platform/content/reviews",
  "/platform/content/testimonials",
  "/platform/content/community/posts",
];

async function send(api: ApiClient, method: string, url: string, org: string) {
  const opts = { headers: api.headers(org), data: {} };
  const full = `${env.apiURL}${url}`;
  if (method === "post") return api.ctx.post(full, opts);
  if (method === "patch") return api.ctx.patch(full, opts);
  if (method === "put") return api.ctx.put(full, opts);
  return api.ctx.delete(full, opts);
}

type UiCheck = {
  role: "owner" | "admin-write";
  route: string;
  what: string;
  /** "not-exercised" when no row on the page needs the action. */
  result: "present" | "absent" | "not-exercised";
};
type Anchors = Partial<Record<NonNullable<UiControl["needs"]>, string | null>>;

/** Opens each MANAGE_UI route as one admin. The owner must see every
 *  exercised control; the WRITE-only admin must see none. The page's own
 *  content (and the row that needs the action) is awaited first, so an
 *  absence is never read off a page that has not loaded yet. */
async function checkManageUi(
  browser: import("@playwright/test").Browser,
  role: UiCheck["role"],
  account: Account,
  anchors: Anchors,
  checks: UiCheck[],
  issues: Issue[],
) {
  const expectPresent = role === "owner";
  const { context } = await newSession(browser, account);
  const page = await context.newPage();
  const c = new Crawl(`${role}-manage-ui`, page);
  c.attach();
  try {
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const route of [...new Set(MANAGE_UI.map((u) => u.route))]) {
      c.current = route;
      await go(page, route);
      await c.settle("open");
      await expect(page.getByRole("heading").first()).toBeVisible();
      if (route === "/dashboard/subscriptions")
        // WRITE on plans: both admins may edit a plan, and the cards loaded.
        await expect(
          page.getByRole("button", { name: /^edit plan$/i }).first(),
        ).toBeVisible();
      if (route === "/dashboard/admin-team")
        // The staff list loaded (support staff is a seeded member).
        await expect(page.getByText(/Dana Brooks/).first()).toBeVisible();
      for (const u of MANAGE_UI.filter((x) => x.route === route)) {
        if (u.needs) {
          const anchor = anchors[u.needs];
          if (!anchor) {
            checks.push({ role, route, what: u.what, result: "not-exercised" });
            continue;
          }
          // The row that needs the action is on screen, unless the whole
          // page is refused to the WRITE-only admin (a MANAGE-only queue):
          // then the redirect or the no-access state is the refusal.
          const refusedPage =
            !expectPresent &&
            (new URL(page.url()).pathname !== route ||
              (await page
                .getByText(NO_ACCESS)
                .first()
                .isVisible()
                .catch(() => false)));
          if (!refusedPage)
            await expect(page.getByText(anchor).first()).toBeVisible();
        }
        if (u.tab) {
          const tab = page.getByRole("tab", { name: u.tab }).first();
          await tab.click();
          await expect(tab).toHaveAttribute("aria-selected", "true");
        }
        const control = page.getByRole("button", { name: u.name });
        if (expectPresent)
          await expect(
            control.first(),
            `${u.what}: the owner (MANAGE) must see it on ${route}`,
          ).toBeVisible();
        else
          await expect(
            control,
            `${u.what}: the WRITE-only admin must not see it on ${route}`,
          ).toHaveCount(0);
        checks.push({
          role,
          route,
          what: u.what,
          result: expectPresent ? "present" : "absent",
        });
      }
    }

    // Moderation queues: the owner gets the page; the WRITE-only admin gets
    // the no-access state or a redirect, and no moderation button.
    for (const route of MODERATION_ROUTES) {
      c.current = route;
      await go(page, route);
      await c.settle("open");
      const landed = new URL(page.url()).pathname;
      const refused = await page
        .getByText(NO_ACCESS)
        .first()
        .isVisible()
        .catch(() => false);
      if (expectPresent) {
        expect(landed, `${route}: the owner stays on the page`).toBe(route);
        expect(refused, `${route}: no no-access state for the owner`).toBe(
          false,
        );
      } else {
        expect(
          landed !== route || refused,
          `${route}: the no-access state or a redirect`,
        ).toBe(true);
        await expect(
          page.getByRole("button", { name: MODERATION_BUTTON }),
        ).toHaveCount(0);
      }
      checks.push({
        role,
        route,
        what: "moderation queue",
        result: expectPresent ? "present" : "absent",
      });
    }
    // The WRITE-only admin's 403s on the queues are the intended refusal.
    if (!expectPresent) c.pending403 = [];
    const bad = c.issues.filter(
      (i) => i.severity === "blocker" || i.severity === "high",
    );
    expect(
      bad,
      bad.map((i) => `${i.kind} ${i.page}: ${i.actual}`).join("\n"),
    ).toEqual([]);
  } finally {
    issues.push(...c.issues);
    await context.close().catch(() => undefined);
  }
}

test("admin-write: MANAGE-only actions are refused (API 403 and UI) @phase16", async ({
  browser,
}) => {
  requireWriteAdmin();
  const results: {
    what: string;
    path: string;
    writeAdmin: number;
    owner?: number;
  }[] = [];
  const ui: UiCheck[] = [];
  const anchors: Anchors = {};
  const save = () => {
    ensureDir(OUT);
    fs.writeFileSync(
      path.join(OUT, "write-admin-refusals.json"),
      JSON.stringify({ api: results, ui }, null, 1),
    );
  };
  const write = await ApiClient.login(WRITE_ADMIN);
  const owner = await ApiClient.login(ACCOUNTS.admin);
  try {
    const ctx = (await write.context()) as unknown as {
      platform?: { organizationId?: string };
    };
    const org = ctx.platform?.organizationId ?? "";
    expect(org, "the write-only admin has a platform membership").not.toBe("");

    // Positive controls: WRITE-level reads still work for this admin.
    for (const p of [`/platform/organizations`, `/organizations/${org}/staff`])
      expect((await write.get(p, org)).status(), `GET ${p}`).toBe(200);

    for (const pr of MANAGE_ONLY) {
      const url = pr.path(org);
      const w = await send(write, pr.method, url, org);
      const row: (typeof results)[number] = {
        what: pr.what,
        path: `${pr.method.toUpperCase()} ${url.replace(org, ":platformOrg")}`,
        writeAdmin: w.status(),
      };
      // The owner (MANAGE) passes the guard: a random id is a 404 (or a 400
      // for the empty body), never 403.
      if (pr.ownerControl)
        row.owner = (await send(owner, pr.method, url, org)).status();
      results.push(row);
    }
    for (const p of MANAGE_ONLY_READS)
      results.push({
        what: `list ${p}`,
        path: `GET ${p}`,
        writeAdmin: (await write.get(p, org)).status(),
        owner: (await owner.get(p, org)).status(),
      });

    // Rows the data-dependent UI controls need, read as the owner (page 1,
    // as the screens show it).
    const read = async (p: string) => {
      const res = await owner.get(p, org);
      return res.ok() ? rows(await res.json()) : [];
    };
    const unpaid = (await read("/platform/invoices")).find(
      (i) => i.status !== "PAID",
    );
    anchors["unpaid-invoice"] = unpaid ? String(unpaid.number) : null;
    const open = (await read("/platform/contract-change-requests")).find(
      (r) => !r.resolvedAt,
    );
    if (open) {
      const orgs = await read("/platform/organizations");
      const name = orgs.find((o) => o.id === open.organizationId)?.name;
      anchors["open-change-request"] = name ? String(name) : null;
    } else anchors["open-change-request"] = null;
    const pending = (await read("/platform/content/reviews")).find(
      (r) =>
        String(r.status).toUpperCase() === "PENDING" &&
        String(r.comment ?? "").includes(TAG),
    );
    anchors["pending-review"] = pending ? String(pending.comment) : null;
  } finally {
    save();
    await write.logout().catch(() => undefined);
    await owner.logout().catch(() => undefined);
    await write.dispose();
    await owner.dispose();
  }
  expect(results.length).toBe(MANAGE_ONLY.length + MANAGE_ONLY_READS.length);
  for (const r of results) {
    expect(
      r.writeAdmin,
      `${r.what} (${r.path}) must be 403 for the WRITE-only admin`,
    ).toBe(403);
    if (r.owner !== undefined)
      expect(r.owner, `${r.what}: the owner must pass the guard`).not.toBe(403);
  }
  // The crawl seeded this review, so its control is always exercised.
  expect(
    anchors["pending-review"],
    "the seeded review is pending",
  ).toBeTruthy();

  // UI: the owner first (positive control: a selector that matches nothing
  // fails here), then the WRITE-only admin must see none of the controls.
  const issues: Issue[] = [];
  try {
    await checkManageUi(browser, "owner", ACCOUNTS.admin, anchors, ui, issues);
    await checkManageUi(
      browser,
      "admin-write",
      WRITE_ADMIN,
      anchors,
      ui,
      issues,
    );
  } finally {
    allIssues.push(...issues);
    flush();
    save();
  }
  const key = (u: UiCheck) =>
    `${u.route} ${u.what} ${u.result === "not-exercised"}`;
  expect(ui.filter((u) => u.role === "admin-write").map(key)).toEqual(
    ui.filter((u) => u.role === "owner").map(key),
  );
});

for (const role of ROLES) {
  test(`click-through every admin page: ${role.id} @phase16`, async ({
    browser,
  }) => {
    if (role.id === "admin-write") requireWriteAdmin();
    const { context, blocked } = await newSession(browser, role.account);
    const page = await context.newPage();
    context.on("page", (p) => {
      if (p !== page) void p.close();
    });
    const c = new Crawl(role.id, page);
    live = c;
    c.attach();
    try {
      await page.setViewportSize({ width: 1280, height: 900 });

      c.current = "/dashboard";
      await go(page, "/dashboard");
      await c.settle("home");
      const sidebar = [
        ...new Set(
          await page
            .locator('aside a[href^="/dashboard"]')
            .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? "")),
        ),
      ].filter(Boolean);
      expect(sidebar.length, "the admin sidebar lists pages").toBeGreaterThan(
        0,
      );
      const routes = [...new Set([...sidebar, ...ADMIN_ROUTES])];
      const budget = Number(process.env.E2E_CRAWL_PAGE_MS ?? 60_000);

      // The header once (notifications, user menu, breadcrumbs).
      c.control = "header";
      const header = page.locator("header").first();
      const headerControls = await listControls(header).catch(() => []);
      for (const h of headerControls.filter((x) => !x.disabled)) {
        if (NEVER.test(h.name) || h.external) continue;
        c.control = `header: ${h.name}`;
        await header
          .locator(CONTROL_SELECTOR)
          .nth(h.idx)
          .click({ timeout: 2_000 })
          .catch(() => undefined);
        c.cov.controlsClicked++;
        await page.waitForTimeout(300);
        await c.health(c.control);
        await closeDialogs(page);
        await page.keyboard.press("Escape").catch(() => undefined);
        if (new URL(page.url()).pathname !== "/dashboard") {
          await c.settle("header link", 6_000);
          await go(page, "/dashboard");
        }
      }

      for (const route of routes) {
        c.current = route;
        c.control = "";
        const inSidebar = sidebar.includes(route);
        await go(page, route);
        await c.settle("open");
        await c.health("page load");
        const landed = new URL(page.url()).pathname;
        if (!inSidebar) {
          // A page this role's menu does not offer: a redirect home or the
          // no-access state is the intended result.
          const refused = await page
            .getByText(NO_ACCESS)
            .first()
            .isVisible()
            .catch(() => false);
          c.cov.controlsSkipped.push({
            page: route,
            control: "(page)",
            why: `not in this role's sidebar: ${landed !== route ? `redirected to ${landed}` : refused ? "no-access state shown" : "page rendered"}`,
          });
          if (landed !== route || refused) continue;
        }
        if (landed !== route) {
          c.add({
            kind: "sidebar-redirect",
            control: "(sidebar link)",
            steps: `Open ${route} from the sidebar`,
            expected: "The page opens",
            actual: `Redirected to ${landed}`,
            severity: "medium",
          });
          continue;
        }
        c.cov.pages.push(route);
        await c.overflow(1280);
        await crawlPage(c, route, budget);
        flush();
        // Course detail pages.
        if (route === "/dashboard/manage-curriculum") {
          await go(page, route);
          await c.settle("open");
          const course = page
            .locator('main a[href^="/dashboard/manage-curriculum/"]')
            .first();
          if (await course.count()) {
            const href = (await course.getAttribute("href")) ?? "";
            c.current = href;
            await go(page, href);
            await c.settle("open");
            await c.health("page load");
            c.cov.pages.push(href);
            await crawlPage(c, href, budget);
          }
        }
      }

      // Mobile width: every page again for layout, errors and the bottom bar.
      await page.setViewportSize({ width: 390, height: 844 });
      for (const route of c.cov.pages) {
        c.current = route;
        c.control = "(390px)";
        await go(page, route);
        await c.settle("mobile");
        await c.health("mobile load");
        await c.overflow(390);
        c.cov.mobilePages++;
      }
      flush();
      const more = page.getByRole("button", { name: /^more$/i }).first();
      if (await more.isVisible().catch(() => false)) {
        c.control = "bottom bar: More";
        await more.click().catch(() => undefined);
        c.cov.controlsClicked++;
        await page.waitForTimeout(300);
        await c.health("More");
        await closeDialogs(page);
      }

      // Sign out through the UI ends the crawl.
      await page.setViewportSize({ width: 1280, height: 900 });
      await go(page, "/dashboard");
      await c.settle("sign out");
      c.current = "/dashboard";
      c.control = "Log out";
      await page
        .getByRole("button", { name: /^log out$/i })
        .first()
        .click({ timeout: 45_000 });
      c.cov.controlsClicked++;
      // Sign-out lands on the public home page (AuthContext.logout,
      // destination "/"), and the server session is dead.
      await expect(page).not.toHaveURL(/\/dashboard/, { timeout: 20_000 });
      await expect
        .poll(async () =>
          (
            await context.request.get(`${env.apiURL}/me/context`, {
              headers: { Origin: appOrigin },
            })
          ).status(),
        )
        .toBe(401);

      for (const b of blocked)
        c.add({
          kind: "third-party-request",
          control: "(network)",
          steps: "Any",
          expected:
            "Only the app, the API and the local storage stand-in are contacted",
          actual: b.slice(0, 200),
          severity: "high",
        });
    } finally {
      allIssues.push(...c.issues);
      allCoverage[role.id] = c.cov;
      live = null;
      flush();
      await context.close().catch(() => undefined);
    }

    // Judged in the last test, so every role is crawled even when one
    // role's crawl finds a blocker.
    expect(c.cov.pages.length, `${role.id} visited pages`).toBeGreaterThan(0);
  });
}

test("no unexplained blocker or high issue on any admin page @phase16", () => {
  const open = allIssues.filter(
    (i) => (i.severity === "blocker" || i.severity === "high") && !known(i),
  );
  expect(
    open,
    `blocker/high issues:\n${open.map((i) => `${i.role} ${i.severity} ${i.kind} ${i.page} "${i.control}": ${i.actual}`).join("\n")}`,
  ).toEqual([]);
  for (const role of ROLES)
    expect(allCoverage[role.id], `${role.id} was crawled`).toBeTruthy();
});
