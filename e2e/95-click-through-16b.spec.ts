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
  /** Areas this role may see; a 403 there is unexpected. */
  intended403: (apiPath: string, code: string) => boolean;
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
      if (h.status === 401 && /\/auth\/(refresh|me)|\/me\/context/.test(h.path))
        continue;
      if (
        (h.status === 403 || h.status === 404) &&
        (ctx.intended403(h.path, h.code) || notShared)
      ) {
        if (!notShared && h.method === "GET")
          ctx.cov.notes.push(
            `${ctx.current}: intended ${h.status} ${h.path} ${h.code} (no "not shared" text on screen)`,
          );
        continue;
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
  const crashed = await ctx.page
    .getByText(
      /Application error|Unhandled Runtime Error|Something went wrong/i,
    )
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
    const type = ((await f.getAttribute("type")) ?? "text").toLowerCase();
    const name =
      `${(await f.getAttribute("name")) ?? ""} ${(await f.getAttribute("id")) ?? ""} ${(await f.getAttribute("placeholder")) ?? ""} ${(await f.getAttribute("aria-label")) ?? ""}`.toLowerCase();
    const current = await f.inputValue().catch(() => "");
    if (current && type !== "number") continue;
    let v = marker;
    if (type === "email" || /email/.test(name))
      v = `p16b-${Date.now().toString(36)}@example.test`;
    else if (type === "tel" || /phone/.test(name)) v = "5555550100";
    else if (type === "number") {
      const min = Number((await f.getAttribute("min")) ?? "NaN");
      const max = Number((await f.getAttribute("max")) ?? "NaN");
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
    const accept = (await files.nth(i).getAttribute("accept")) ?? "";
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

/** Empty submit, then valid submit, of an open dialog. Returns the marker
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
  /* 2. Valid synthetic data, then submit. */
  const marker = `Synthetic P16b ${Date.now().toString(36)}`;
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
      const made = await exerciseDialog(ctx, c.name, opts.allowWrites);
      if (made) created.push(made);
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
      c.kind !== "link"
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
    await checkSince(ctx, m, label, steps);
    /* Menus/popovers opened by the click: close. */
    if (
      !urlChanged &&
      (await page.locator('[role="menu"], [role="listbox"]').count())
    )
      await page.keyboard.press("Escape");
  }
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
    const link = page.locator(`aside a[href="${href}"]`).first();
    if (await link.isVisible().catch(() => false)) {
      await link.click();
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
test.setTimeout(45 * 60_000);

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
    const mail = await waitForMail(acct.email, { since });
    const v = await ctx.post(`${env.apiURL}/auth/email/verify/confirm`, {
      headers: { Authorization: `Bearer ${access}`, Origin: appOrigin },
      data: { code: extractOtp(mail) },
    });
    expect(v.ok(), `verify limited caregiver: ${v.status()}`).toBeTruthy();
  } finally {
    await ctx.dispose();
  }
  const grace = await ApiClient.login(ACCOUNTS.grace);
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
    intended403: (p) => /^\/(invitations|shared)\//.test(p),
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
  const grace = await ApiClient.login(ACCOUNTS.grace);
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
  const mail = await waitForMail(acct.email, { since });
  await page.getByLabel("Code").fill("000000");
  await page.getByRole("button", { name: "Verify email" }).click();
  cov.formsSubmitted++;
  await expect(
    page
      .locator('[role="alert"]')
      .or(page.getByText(/invalid|incorrect|expired|wrong/i))
      .first(),
  ).toBeVisible();
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
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
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
  await expect(page.locator('[role="alert"]').first()).toBeVisible();
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
  const c = await ApiClient.login(acct);
  await c.post("/me/preferences/tour-completed");
  await c.logout();
  await c.dispose();
  const { page } = await asUser(acct);
  const mon = new Monitor(page);
  open = { name: "caregiver-limited", issues, cov, mon };
  const ctx = caregiverCtx("caregiver-limited", page, mon, issues, cov);
  /* Areas Grace did not share: refused on purpose (the page must say so). */
  ctx.intended403 = (_p, code) => /not_shared|no_access|caregiver/i.test(code);
  await gotoSafe(page, "/dashboard");
  await page.waitForURL((u) => !/\/login/.test(u.pathname), {
    timeout: 30_000,
  });
  await caregiverCrawl(ctx, page, null, true);
  cov.downloads = mon.downloads.length;
  markAllowed(issues);
  /* Written by afterEach (also when the test fails part way). */
  expectNoOpenSevere(issues);
});
