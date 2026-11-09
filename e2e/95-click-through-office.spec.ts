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
const MAX_ACTIONS_PER_PAGE = Number(process.env.E2E_P16_MAX_ACTIONS ?? 90);

const NOT_SHARED = /not been shared with you/i;
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
    formsSubmitted: 0,
    validationShown: 0,
    downloads: 0,
    uploads: 0,
    destructive: 0,
    skippedDestructive: 0,
    noOps: 0,
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
  current = "";
  step = "";
  /** Expected 4xx: refusals of an invalid submit, not-shared areas. */
  allow4xx = false;
  private apiCalls = 0;
  private shots = 0;
  private consoleErrors: string[] = [];
  private pageErrors: string[] = [];
  private api5xx: string[] = [];
  private api4xx: Array<{ status: number; path: string; code: string }> = [];

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
      if (s >= 500) this.api5xx.push(`${s} ${res.request().method()} ${p}`);
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
        this.api4xx.push({
          status: s,
          path: `${res.request().method()} ${p}`,
          code: "",
        });
      }
    });
  }

  get calls() {
    return this.apiCalls;
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
    if (i.severity !== "low" || i.kind === "layout") {
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
    const e5 = this.api5xx.splice(0);
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
    for (const e of e5)
      await this.issue({
        control,
        kind: "api-5xx",
        expected: "no API 5xx",
        actual: e,
        severity: "high",
      });
    if (e4.length) {
      const notShared = await this.page
        .getByText(NOT_SHARED)
        .count()
        .catch(() => 0);
      for (const e of e4) {
        const tag = `${e.status} ${e.path}${e.code ? ` ${e.code}` : ""}`;
        if (e.status === 403 && (notShared || this.role.limited)) {
          this.notes.push(
            `${this.current} ${control}: refused ${tag}${notShared ? " (not-shared state shown)" : " (limited role)"}`,
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
        .locator(
          "nextjs-portal, [data-nextjs-dialog], #nextjs__container_errors_label",
        )
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
    }> = [];
    const seen = new Set<Element>();
    const counts = new Map<string, number>();
    let n = 0;
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
        out.push({ id, key: `${base}|${k}`, kind, name, href });
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

/** Fills the empty fields of a form scope with synthetic values. */
async function fill(scope: Locator, mode: "valid" | "invalid", c: Crawl) {
  let typedMark = false;
  const fields = scope.locator(
    "input:visible:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=submit]):not([type=button]):not([readonly]):not([disabled]), textarea:visible:not([readonly]):not([disabled])",
  );
  const n = await fields.count();
  for (let i = 0; i < n; i++) {
    const f = fields.nth(i);
    const type = ((await f.getAttribute("type")) ?? "text").toLowerCase();
    const name =
      `${(await f.getAttribute("name")) ?? ""} ${(await f.getAttribute("id")) ?? ""} ${(await f.getAttribute("aria-label")) ?? ""} ${(await f.getAttribute("placeholder")) ?? ""}`.toLowerCase();
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
    else if (type === "date") v = day(7);
    else if (type === "datetime-local") v = `${day(7)}T10:00`;
    else if (type === "time") v = "10:00";
    else if (type === "month") v = day(7).slice(0, 7);
    else if (type === "number" || type === "range") v = "1";
    else if (type === "tel" || /phone|tel/.test(name)) v = "5550100123";
    else if (type === "url") v = "https://example.test/p16c";
    else if (/zip|postal/.test(name)) v = "10001";
    else if (/mrn|record/.test(name))
      v = `${MARK}-${Math.floor(Math.random() * 1e4)}`;
    else if (/date|dob|birth/.test(name)) v = "01/15/1960";
    else {
      v = `${MARK} synthetic`;
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

/** Empty, invalid, then valid submit of one form scope. */
async function exerciseForm(
  c: Crawl,
  scope: Locator,
  control: string,
  isDialog: boolean,
) {
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
        c.coverage.formsSubmitted++;
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
        c.coverage.formsSubmitted++;
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
    const typedMark = await fill(scope, "valid", c);
    btn = (await submitButton(scope)) ?? btn;
    if (!(await btn.isEnabled().catch(() => false))) {
      c.notes.push(
        `${c.current} ${control}: submit stays disabled after the synthetic fill`,
      );
      return;
    }
    const before = c.calls;
    await btn.click({ timeout: 2_000 }).catch(() => undefined);
    c.coverage.formsSubmitted++;
    await settle(page, 700);
    const sent = c.calls - before;
    const stillOpen = isDialog ? await openDialog(page).count() : 0;
    const ok = await page
      .locator('[role="status"]')
      .filter({
        hasText:
          /(saved|sent|added|created|invited|enrolled|updated|scheduled|booked|uploaded|imported|requested|done|success)/i,
      })
      .count();
    c.notes.push(
      `${c.current} ${control}: valid submit → ${sent} API call(s), ${stillOpen ? "dialog still open" : "closed"}${ok ? ", success message" : ""}`,
    );
    await c.flush(`${control} → ${btnName} (valid)`);
    if (ok && typedMark && !isDialog) {
      // Persistence: the saved marker must survive a reload.
      await page.reload();
      await waitReady(c);
      const body = await page
        .locator("main")
        .innerText()
        .catch(() => "");
      if (!body.includes(MARK))
        c.notes.push(
          `${c.current} ${control}: success shown; marker not on the page after reload (check by hand)`,
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
      const res = await page.request
        .get(u.toString(), { maxRedirects: 3 })
        .catch(() => null);
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
  if (
    DESTRUCTIVE.test(ctl.name) &&
    !(await el
      .getAttribute("type")
      .then((t) => t === "submit")
      .catch(() => false))
  ) {
    const row = await el
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
    if (!row.includes("P16C")) {
      c.coverage.skippedDestructive++;
      return "ok";
    }
    c.coverage.destructive++;
  }

  const before = await signature(page).catch(() => "");
  const callsBefore = c.calls;
  const download = page
    .waitForEvent("download", { timeout: 1_500 })
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
        c.coverage.skippedDestructive++;
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

  const after = await signature(page).catch(() => "");
  if (before && before === after && c.calls === callsBefore && !dl) {
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
  await page.goto(href);
  await waitReady(c);
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
  let actions = 0;
  while (actions < MAX_ACTIONS_PER_PAGE) {
    await closeOverlays(page);
    const ctls = (await collect(page).catch(() => [] as Ctl[])).filter(
      (x) => !done.has(x.key),
    );
    if (!ctls.length) break;
    const ctl = ctls[0];
    done.add(ctl.key);
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
      await page.goto(href);
      await waitReady(c);
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
    const c = new Crawl(page, role);
    fs.mkdirSync(path.join(OUT, "screens"), { recursive: true });
    page.on("dialog", (d) => void d.dismiss().catch(() => undefined));

    await page.goto("/dashboard");
    if (/\/select-portal/.test(page.url()))
      await page
        .getByRole("button", { name: /^Open: / })
        .first()
        .click();
    await page
      .locator('aside a[href^="/dashboard"]')
      .first()
      .waitFor({ timeout: 30_000 });
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
      await crawlPage(c, href, sidebar.has(href) ? "sidebar" : "src/app");

    const result = {
      role: role.id,
      account: role.account.email,
      marker: MARK,
      pages: c.pagesVisited,
      perPage: c.perPage,
      coverage: c.coverage,
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
