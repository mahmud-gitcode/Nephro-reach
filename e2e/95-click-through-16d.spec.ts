/* Phase 16 (lane 16d): click-through crawl of the hospital portal, the
   nephrology office's CCM and its own pages, and a staff account that holds
   two memberships (portal switch).

   For each role the crawler signs in (cookie session), reads the sidebar,
   and on every page:
   - clicks every visible control in the page body (buttons, tabs, switches,
     selects, checkboxes, menus, pagination, row actions) and, once per role,
     the header's own controls;
   - opens every modal and drawer, submits it empty and expects a validation
     message (or a disabled submit), then closes it;
   - follows every internal link once and flags a 404;
   - checks desktop and phone (390 px) width for horizontal overflow.
   Destructive controls (delete, archive, revoke, discharge, deactivate,
   sign out, transfer) are never clicked on seeded records; the targeted
   journeys below create their own records and act only on those.
   After every action it records console errors, uncaught exceptions, API
   5xx, API 4xx (an intended 403 must show the no-access state), the Next
   error overlay, blank or stuck loading states and controls that did
   nothing. Results go to E2E_P16_OUT (the lane's evidence dir) as one JSON
   file per role plus screenshots; the test fails on any blocker/high issue
   that is not in KNOWN with its recorded reason.

   Synthetic data only: seed accounts and fresh *.example.test accounts.
   Run with --workers=1 (one browser per lane). Never uses networkidle. */
import fs from "node:fs";
import path from "node:path";
import { request, type Page } from "@playwright/test";
import { ApiClient, currentConsent, json } from "./fixtures/api";
import {
  ACCOUNTS,
  apiOrigin,
  appOrigin,
  env,
  throwawayAccount,
  type Account,
} from "./fixtures/env";
import { extractOtp, mailMark, waitForMail } from "./fixtures/mail";
import { expect, test } from "./fixtures/test";
import { pace } from "./fixtures/throttle";

/* ------------------------------------------------------------------ setup */

const OUT = process.env.E2E_P16_OUT
  ? path.resolve(process.env.E2E_P16_OUT)
  : path.resolve("test-results", "p16d");
const SHOTS = path.join(OUT, "screenshots");

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
  account: Account | (() => Promise<Account>);
  /** Portal to open on /select-portal (multi-membership accounts). */
  portal?: string;
  /** Limited staff role: a refusal shown as the no-access state is fine. */
  limited?: boolean;
  /** Only these sidebar pages (prefixes); default: every sidebar page. */
  only?: RegExp;
};

const staff = (email: string): Account => ({
  email,
  password: "staff123",
  name: email,
});

/* Never clicked by the generic crawler (seeded records); the targeted
   journeys act only on what they created. */
const DESTRUCTIVE =
  /\b(delete|remove|archive|revoke|deactivate|discharge|sign ?out|log ?out|transfer|unenroll|withdraw|disable|reset|leave|decline|reject|end (the )?(session|class)|cancel (subscription|plan|request|invitation)|mark .* (paid|void)|void|suspend|ban|deny|turn (off|on)|owner|resend|change role|role of|unlink|stop sharing|close (the )?(case|thread|conversation))\b/i;
/* Opens another browser tab / an outside service, or changes the language
   of the whole app; checked as links, not clicked. */
const NOT_CLICKED = /^(español|english|es|en)$/i;

/** Issues fixed or recorded with a reason (REPORT.md); key = kind|page|control. */
const KNOWN: Record<string, string> = {};

const SEVERITY_FAILS: Severity[] = ["blocker", "high"];

/* ------------------------------------------------------------- the crawler */

class Recorder {
  issues: Issue[] = [];
  counts = {
    pages: 0,
    controlsClicked: 0,
    controlsSkippedDestructive: 0,
    dialogsOpened: 0,
    formsSubmittedEmpty: 0,
    formsSubmittedValid: 0,
    linksChecked: 0,
    downloads: 0,
    mobileChecks: 0,
  };
  skipped: string[] = [];
  notes: string[] = [];
  api4xx: string[] = [];
  /** Events since the last drain. */
  private consoleErrors: string[] = [];
  private pageErrors: string[] = [];
  private server5xx: string[] = [];
  private client4xx: Array<{ status: number; path: string; code: string }> = [];
  mutations = 0;
  requests = 0;
  /** Successful POST /auth/refresh responses so far. */
  refreshes = 0;
  private refreshesSeen = 0;
  shot = 0;

  constructor(
    readonly role: string,
    readonly page: Page,
  ) {
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      /* The browser logs every refused fetch; those are judged by status. */
      if (/Failed to load resource/i.test(text)) return;
      this.consoleErrors.push(text.slice(0, 300));
    });
    page.on("pageerror", (err) =>
      this.pageErrors.push(String(err.message ?? err).slice(0, 300)),
    );
    page.on("request", (req) => {
      const u = new URL(req.url());
      if (u.origin !== apiOrigin) return;
      this.requests++;
      if (req.method() !== "GET") this.mutations++;
    });
    page.on("response", async (res) => {
      const u = new URL(res.url());
      if (u.origin !== apiOrigin) return;
      const p = `${res.request().method()} ${u.pathname.replace(/^\/api\/v1/, "")}`;
      const s = res.status();
      if (s >= 500) this.server5xx.push(`${s} ${p}`);
      else if (p === "POST /auth/refresh" && s < 300) this.refreshes++;
      else if (s >= 400) {
        const body = (await res.json().catch(() => null)) as {
          code?: unknown;
        } | null;
        this.client4xx.push({
          status: s,
          path: p,
          code: typeof body?.code === "string" ? body.code : "",
        });
      }
    });
    page.on("download", () => this.counts.downloads++);
  }

  async screenshot(label: string): Promise<string> {
    fs.mkdirSync(SHOTS, { recursive: true });
    const file = path.join(
      SHOTS,
      `${this.role}-${String(++this.shot).padStart(3, "0")}-${label
        .replace(/[^a-z0-9]+/gi, "-")
        .slice(0, 50)}.png`,
    );
    await this.page
      .screenshot({ path: file, fullPage: false, timeout: 5000 })
      .catch(() => undefined);
    return path.relative(OUT, file).replace(/\\/g, "/");
  }

  async add(issue: Omit<Issue, "role" | "screenshot">, shot = true) {
    const full: Issue = { ...issue, role: this.role };
    if (shot) full.screenshot = await this.screenshot(issue.kind);
    this.issues.push(full);
  }

  /** Judge what happened since the last drain, for one action. */
  async drain(pagePath: string, control: string, steps: string) {
    /* A bare 401 (no code) is the API's "access cookie expired": the client
       refreshes once and retries (src/lib/api/client.ts). It is a failure
       only when no refresh succeeds after it. */
    const bare401 = this.client4xx.filter(
      (r) => r.status === 401 && r.code === "",
    ).length;
    if (bare401) {
      const end = Date.now() + 15_000;
      while (this.refreshes <= this.refreshesSeen && Date.now() < end)
        await this.page.waitForTimeout(250);
    }
    const refreshed = this.refreshes > this.refreshesSeen;
    this.refreshesSeen = this.refreshes;
    const noAccess = await hasNoAccessState(this.page);
    for (const e of this.pageErrors)
      await this.add({
        page: pagePath,
        control,
        steps,
        expected: "no uncaught exception",
        actual: `uncaught: ${e}`,
        severity: "blocker",
        kind: "pageerror",
      });
    for (const e of this.consoleErrors)
      await this.add({
        page: pagePath,
        control,
        steps,
        expected: "no console error",
        actual: `console.error: ${e}`,
        severity: "high",
        kind: "console",
      });
    for (const e of this.server5xx)
      await this.add({
        page: pagePath,
        control,
        steps,
        expected: "no API 5xx",
        actual: e,
        severity: "blocker",
        kind: "api5xx",
      });
    for (const r of this.client4xx) {
      this.api4xx.push(
        `${pagePath} | ${control} | ${r.status} ${r.path} ${r.code}`,
      );
      const intendedDenial = (r.status === 403 || r.status === 404) && noAccess;
      if (r.status === 401 && r.code === "" && refreshed) {
        this.notes.push(
          `${pagePath} | ${control}: 401 ${r.path} (expired access cookie), refreshed and retried`,
        );
      } else if (r.status === 401) {
        await this.add({
          page: pagePath,
          control,
          steps,
          expected: "the signed-in session is accepted",
          actual: `401 ${r.path} ${r.code}`,
          severity: "high",
          kind: "api401",
        });
      } else if (
        r.status === 403 &&
        !intendedDenial &&
        !SERVICE_DENIALS.has(r.code)
      ) {
        await this.add({
          page: pagePath,
          control,
          steps,
          expected: "an intended 403 shows the no-access state",
          actual: `403 ${r.path} ${r.code} with no no-access state on the page`,
          severity: r.path.startsWith("GET") ? "medium" : "medium",
          kind: "api403",
        });
      } else if (
        r.status === 404 &&
        r.path.startsWith("GET") &&
        !intendedDenial
      ) {
        await this.add({
          page: pagePath,
          control,
          steps,
          expected: "reads succeed",
          actual: `404 ${r.path} ${r.code}`,
          severity: "medium",
          kind: "api404",
        });
      }
      /* 400/409/422 are judged by the form checks (validation shown). */
    }
    if (await errorOverlay(this.page))
      await this.add({
        page: pagePath,
        control,
        steps,
        expected: "no Next error overlay",
        actual: "Next.js error overlay shown",
        severity: "blocker",
        kind: "overlay",
      });
    if (await crashed(this.page))
      await this.add({
        page: pagePath,
        control,
        steps,
        expected: "the page renders",
        actual: "error boundary / crash text shown",
        severity: "blocker",
        kind: "crash",
      });
    this.consoleErrors = [];
    this.pageErrors = [];
    this.server5xx = [];
    this.client4xx = [];
  }
}

/* spec 048 §2: an office that keeps no access records is refused the list. */
const SERVICE_DENIALS = new Set(["vascular_access.profiles_not_kept_here"]);

async function hasNoAccessState(page: Page): Promise<boolean> {
  return (
    (await page
      .getByText(
        /Not available for your role|not been shared with you|No access|don't have access|do not have access|not available for your role/i,
      )
      .count()
      .catch(() => 0)) > 0
  );
}

async function errorOverlay(page: Page): Promise<boolean> {
  return page
    .evaluate(() => {
      const portal = document.querySelector("nextjs-portal");
      const root = portal?.shadowRoot;
      if (!root) return false;
      return Boolean(
        root.querySelector("[data-nextjs-dialog], [data-nextjs-error-overlay]"),
      );
    })
    .catch(() => false);
}

async function crashed(page: Page): Promise<boolean> {
  return (
    (await page
      .getByText(
        /Application error|Something went wrong|Unhandled Runtime Error|This page could not be found/i,
      )
      .count()
      .catch(() => 0)) > 0
  );
}

/* A page still busy after this long counts as stuck. The lane shares one
   Postgres with four other lanes, so a read can take several seconds. */
const STUCK_MS = 20_000;

/** Wait until the page body shows and nothing is busy (short waits only). */
async function settle(page: Page, maxMs = STUCK_MS): Promise<"ok" | "stuck"> {
  await page
    .locator("main")
    .first()
    .waitFor({ timeout: 15_000 })
    .catch(() => undefined);
  const end = Date.now() + maxMs;
  while (Date.now() < end) {
    const busy = await page
      .evaluate(() => {
        const visible = (el: Element) =>
          (el as HTMLElement).offsetParent !== null ||
          el.getClientRects().length > 0;
        const b = [...document.querySelectorAll('[aria-busy="true"]')].filter(
          visible,
        ).length;
        const text = document.querySelector("main")?.textContent ?? "";
        return b > 0 || /Loading…|Loading\.\.\./.test(text);
      })
      .catch(() => false);
    if (!busy) return "ok";
    await page.waitForTimeout(150);
  }
  return "stuck";
}

type Control = {
  key: string;
  label: string;
  tag: string;
  role: string;
  href: string;
  type: string;
  scope: "main" | "header";
};

/** Every visible, enabled control in main (and the header when asked). */
async function listControls(
  page: Page,
  withHeader: boolean,
): Promise<Control[]> {
  return page.evaluate((withHeader) => {
    const roots: Array<[Element, "main" | "header"]> = [];
    const main = document.querySelector("main");
    if (main) roots.push([main, "main"]);
    if (withHeader) {
      const header = document.querySelector("header");
      if (header && !main?.contains(header)) roots.push([header, "header"]);
    }
    const sel =
      'button, a[href], [role="tab"], [role="switch"], [role="checkbox"], [role="radio"], [role="combobox"], [role="menuitem"], select, input[type="checkbox"], input[type="radio"], input[type="search"], input[type="file"], summary';
    const seen = new Map<string, number>();
    const out: Array<{
      key: string;
      label: string;
      tag: string;
      role: string;
      href: string;
      type: string;
      scope: "main" | "header";
    }> = [];
    for (const [root, scope] of roots) {
      for (const el of root.querySelectorAll(sel)) {
        const h = el as HTMLElement;
        if (h.closest("aside")) continue;
        if (h.closest('[role="dialog"], [role="alertdialog"]')) continue;
        const isFile = h instanceof HTMLInputElement && h.type === "file";
        const rects = h.getClientRects();
        if (!isFile && (rects.length === 0 || h.offsetParent === null))
          continue;
        if (
          (h as HTMLButtonElement).disabled ||
          h.getAttribute("aria-disabled") === "true"
        )
          continue;
        const label = (
          h.getAttribute("aria-label") ||
          h.innerText ||
          h.getAttribute("title") ||
          (h as HTMLInputElement).placeholder ||
          (h as HTMLInputElement).name ||
          h.id ||
          ""
        )
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 80);
        const tag = h.tagName.toLowerCase();
        const role = h.getAttribute("role") ?? "";
        const base = `${scope}|${tag}|${role}|${label}`;
        const n = seen.get(base) ?? 0;
        seen.set(base, n + 1);
        out.push({
          key: `${base}|${n}`,
          label,
          tag,
          role,
          href: h.getAttribute("href") ?? "",
          type: (h as HTMLInputElement).type ?? "",
          scope,
        });
      }
    }
    return out;
  }, withHeader);
}

/** Mark the control with this key so a locator can reach it. */
async function mark(page: Page, key: string): Promise<boolean> {
  return page.evaluate((key) => {
    document
      .querySelectorAll("[data-p16]")
      .forEach((e) => e.removeAttribute("data-p16"));
    const [scope, tag, role, label, nStr] = key.split("|");
    const n = Number(nStr);
    const root =
      scope === "header"
        ? document.querySelector("header")
        : document.querySelector("main");
    if (!root) return false;
    let i = 0;
    for (const el of root.querySelectorAll(tag)) {
      const h = el as HTMLElement;
      if (h.closest("aside")) continue;
      if (h.closest('[role="dialog"], [role="alertdialog"]')) continue;
      if ((h.getAttribute("role") ?? "") !== role) continue;
      const isFile = h instanceof HTMLInputElement && h.type === "file";
      if (
        !isFile &&
        (h.getClientRects().length === 0 || h.offsetParent === null)
      )
        continue;
      if (
        (h as HTMLButtonElement).disabled ||
        h.getAttribute("aria-disabled") === "true"
      )
        continue;
      const l = (
        h.getAttribute("aria-label") ||
        h.innerText ||
        h.getAttribute("title") ||
        (h as HTMLInputElement).placeholder ||
        (h as HTMLInputElement).name ||
        h.id ||
        ""
      )
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      if (l !== label) continue;
      if (i++ === n) {
        h.setAttribute("data-p16", "1");
        return true;
      }
    }
    return false;
  }, key);
}

/** A cheap fingerprint of what the user can see. */
async function snapshot(page: Page): Promise<string> {
  return page
    .evaluate(() => {
      const text = document.body.innerText;
      let h = 0;
      for (let i = 0; i < text.length; i++)
        h = (h * 31 + text.charCodeAt(i)) | 0;
      const states = [
        ...document.querySelectorAll(
          "[aria-expanded],[aria-selected],[aria-pressed],[aria-checked],input,select,textarea",
        ),
      ]
        .map(
          (e) =>
            `${e.getAttribute("aria-expanded")}${e.getAttribute("aria-selected")}${e.getAttribute("aria-pressed")}${e.getAttribute("aria-checked")}${(e as HTMLInputElement).checked ?? ""}${(e as HTMLInputElement).value ?? ""}`,
        )
        .join(",");
      let s = 0;
      for (let i = 0; i < states.length; i++)
        s = (s * 31 + states.charCodeAt(i)) | 0;
      /* A control that only moves the view (scroll to a section, focus a
         field) is a visible result too. */
      const focused = document.activeElement;
      const field =
        focused && /^(INPUT|TEXTAREA|SELECT)$/.test(focused.tagName)
          ? `${focused.tagName}${focused.id}${focused.getAttribute("name") ?? ""}`
          : "";
      const where = `${Math.round(window.scrollY)}:${Math.round(document.querySelector("main")?.scrollTop ?? 0)}:${field}`;
      return `${location.pathname}${location.search}#${h}#${s}#${document.querySelectorAll('[role="dialog"],[role="alertdialog"]').length}#${where}`;
    })
    .catch(() => "gone");
}

async function openDialog(page: Page) {
  const d = page.locator(
    '[role="dialog"]:visible, [role="alertdialog"]:visible',
  );
  return (await d.count()) ? d.last() : null;
}

const SUBMIT =
  /^(save|send|submit|create|add|invite|enroll|confirm|continue|next|request|assign|apply|update|book|schedule|post|upload|share|start)\b/i;

/* A dialog opened from a row action edits a record that already exists
   (often a seeded one): it is opened, its choices clicked and closed, never
   saved. The journeys save their own records. */
const EDIT_OPENER =
  /^(update|edit|change|manage|reschedule|rename|view|open|review|assign|reassign|move|details?)\b/i;

/** Submit an open modal empty, expect validation, click its inner choices,
    then close it without saving. */
async function exerciseDialog(rec: Recorder, pagePath: string, opener: string) {
  const page = rec.page;
  const dlg = await openDialog(page);
  if (!dlg) return;
  rec.counts.dialogsOpened++;
  const title =
    (await dlg.getAttribute("aria-label")) ||
    (await dlg
      .locator("h1,h2,h3")
      .first()
      .innerText({ timeout: 500 })
      .catch(() => "")) ||
    opener;
  const destructiveDialog = DESTRUCTIVE.test(title) || DESTRUCTIVE.test(opener);
  /* An edit dialog opens prefilled: "empty" would mean re-saving an
     existing record, so it is only opened, explored and closed. Judged
     before anything in it is clicked. */
  const prefilled =
    EDIT_OPENER.test(opener) ||
    (await dlg
      .evaluate((d) =>
        [...d.querySelectorAll("input, textarea")].some((e) => {
          const i = e as HTMLInputElement;
          if (
            [
              "checkbox",
              "radio",
              "hidden",
              "file",
              "date",
              "time",
              "number",
            ].includes(i.type)
          )
            return false;
          return !i.disabled && !i.readOnly && i.value.trim() !== "";
        }),
      )
      .catch(() => true));
  if (prefilled)
    rec.notes.push(
      `${pagePath} | ${title}: edit dialog opened and explored, not saved`,
    );

  /* 1. Empty submit, before any choice in the form is touched. */
  const buttons = dlg.locator("button:visible");
  const names = await buttons.allInnerTexts().catch(() => [] as string[]);
  let submitIdx = -1;
  for (let i = names.length - 1; i >= 0; i--) {
    const n = names[i].trim();
    if (SUBMIT.test(n) && !DESTRUCTIVE.test(n)) {
      submitIdx = i;
      break;
    }
  }
  const hasFields =
    (await dlg
      .locator("input:visible, textarea:visible, select:visible")
      .count()) > 0;
  if (!destructiveDialog && !prefilled && submitIdx >= 0 && hasFields) {
    const submit = buttons.nth(submitIdx);
    const label = names[submitIdx].trim();
    if (await submit.isDisabled().catch(() => false)) {
      rec.counts.formsSubmittedEmpty++;
      rec.notes.push(
        `${pagePath} | ${title}: "${label}" disabled while empty (validation by disabling)`,
      );
    } else {
      const m0 = rec.mutations;
      const invalidBefore = await dlg
        .locator('[aria-invalid="true"], [role="alert"]')
        .count();
      await submit.click({ timeout: 3000 }).catch(() => undefined);
      await page.waitForTimeout(500);
      rec.counts.formsSubmittedEmpty++;
      const still = await dlg.isVisible().catch(() => false);
      const shown =
        still &&
        ((await dlg
          .locator('[aria-invalid="true"], [role="alert"]')
          .count()
          .catch(() => 0)) > invalidBefore ||
          (await dlg
            .evaluate(
              (d) =>
                d.querySelectorAll(
                  "input:invalid, textarea:invalid, select:invalid",
                ).length > 0,
            )
            .catch(() => false)) ||
          (await dlg
            .getByText(
              /required|please (enter|choose|select|add|pick)|must|enter a|choose a|select a|is not valid|invalid/i,
            )
            .count()
            .catch(() => 0)) > 0);
      if (!still && rec.mutations > m0)
        await rec.add({
          page: pagePath,
          control: `${opener} > ${label}`,
          steps: `open "${title}", submit with every field empty`,
          expected: "a validation message, nothing saved",
          actual: "the empty form was sent and the dialog closed",
          severity: "high",
          kind: "empty-accepted",
        });
      else if (still && !shown)
        await rec.add({
          page: pagePath,
          control: `${opener} > ${label}`,
          steps: `open "${title}", submit with every field empty`,
          expected: "a validation message",
          actual: "nothing visible happened (no message, dialog still open)",
          severity: "low",
          kind: "empty-no-message",
        });
      await rec.drain(pagePath, `${opener} > ${label}`, "empty submit");
    }
  }

  /* 2. Inner choices (tabs, segmented choices, radios, selects): each once;
     a select is put back to its own value. Nothing is saved afterwards. */
  if (!destructiveDialog && (await dlg.isVisible().catch(() => false))) {
    const inner = dlg.locator(
      '[role="tab"]:visible, [role="radio"]:visible, [aria-pressed]:visible, input[type="radio"]:visible, input[type="checkbox"]:visible, [role="switch"]:visible',
    );
    const n = Math.min(await inner.count().catch(() => 0), 24);
    for (let i = 0; i < n; i++) {
      const el = inner.nth(i);
      if (await el.isDisabled().catch(() => true)) continue;
      const label = (
        (await el.getAttribute("aria-label").catch(() => null)) ||
        (await el.innerText({ timeout: 500 }).catch(() => "")) ||
        ""
      ).trim();
      if (DESTRUCTIVE.test(label)) continue;
      await el.click({ timeout: 2000 }).catch(() => undefined);
      rec.counts.controlsClicked++;
      await page.waitForTimeout(120);
      if (!(await dlg.isVisible().catch(() => false))) {
        rec.notes.push(
          `${pagePath} | ${title}: inner "${label}" closed the dialog`,
        );
        await rec.drain(
          pagePath,
          `${opener} > ${label}`,
          `click ${label} in ${title}`,
        );
        return;
      }
    }
    const selects = dlg.locator("select:visible");
    const s = Math.min(await selects.count().catch(() => 0), 8);
    for (let i = 0; i < s; i++) {
      const sel = selects.nth(i);
      if (await sel.isDisabled().catch(() => true)) continue;
      const cur = await sel.inputValue().catch(() => null);
      const values = await sel
        .evaluate((x) =>
          [...(x as HTMLSelectElement).options].map((o) => o.value),
        )
        .catch(() => [] as string[]);
      const other = values.find((v) => v !== cur);
      if (cur !== null && other !== undefined) {
        await sel.selectOption(other, { timeout: 2000 }).catch(() => undefined);
        rec.counts.controlsClicked++;
        await sel.selectOption(cur, { timeout: 2000 }).catch(() => undefined);
      }
    }
    await rec.drain(
      pagePath,
      `${opener} > (inner controls)`,
      `click the choices in ${title}`,
    );
  }
  await closeDialog(rec, pagePath, title);
}

async function closeDialog(rec: Recorder, pagePath: string, title: string) {
  const page = rec.page;
  for (let attempt = 0; attempt < 3; attempt++) {
    const dlg = await openDialog(page);
    if (!dlg) return;
    if (attempt === 0) await page.keyboard.press("Escape");
    else {
      const close = dlg
        .getByRole("button", {
          name: /^(cancel|close|done|not now|×|x|back)$/i,
        })
        .first();
      if (await close.count())
        await close.click({ timeout: 2000 }).catch(() => undefined);
      else await page.keyboard.press("Escape");
    }
    await page.waitForTimeout(250);
  }
  if (await openDialog(page))
    await rec.add({
      page: pagePath,
      control: title,
      steps: `open "${title}", press Escape, then Cancel/Close`,
      expected: "the dialog closes",
      actual: "the dialog stays open",
      severity: "medium",
      kind: "dialog-stuck",
    });
}

async function overflowCheck(
  rec: Recorder,
  pagePath: string,
  width: "desktop" | "mobile",
) {
  const res = await rec.page
    .evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const pageWide = document.documentElement.scrollWidth > vw + 1;
      const scrollsX = (el: Element | null): boolean => {
        for (let e = el; e && e !== document.body; e = e.parentElement) {
          const s = getComputedStyle(e);
          if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) return true;
        }
        return false;
      };
      const out: string[] = [];
      for (const el of document.querySelectorAll("main *")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right > vw + 1 && !scrollsX(el.parentElement)) {
          const h = el as HTMLElement;
          out.push(
            `${h.tagName.toLowerCase()}.${String(h.className).split(" ").slice(0, 3).join(".")} "${(h.innerText ?? "").slice(0, 40)}"`,
          );
          if (out.length >= 4) break;
        }
      }
      return { pageWide, out };
    })
    .catch(() => ({ pageWide: false, out: [] as string[] }));
  if (res.pageWide || res.out.length)
    await rec.add({
      page: pagePath,
      control: "(layout)",
      steps: `open the page at ${width === "mobile" ? "390x844" : "1280x800"}`,
      expected: "no horizontal page scroll; content fits",
      actual: `${res.pageWide ? "page scrolls sideways; " : ""}overflowing: ${res.out.join("; ")}`,
      severity: width === "mobile" ? "medium" : "medium",
      kind: `overflow-${width}`,
    });
}

const pathOf = (page: Page) => new URL(page.url()).pathname;

/** One progress line per page on stdout (the list reporter shows it). */
function progress(rec: Recorder, what: string) {
  const c = rec.counts;
  process.stdout.write(
    `[p16d ${rec.role}] ${what} (controls ${c.controlsClicked}, dialogs ${c.dialogsOpened}, issues ${rec.issues.length})
`,
  );
}

/* next dev compiles a route on its first visit, which can take far longer
   than the 20 s navigation default on a busy machine. */
const NAV_TIMEOUT = 90_000;

async function gotoPage(rec: Recorder, href: string) {
  await rec.page.goto(href, {
    waitUntil: "domcontentloaded",
    timeout: NAV_TIMEOUT,
  });
  const state = await settle(rec.page);
  if (state === "stuck")
    await rec.add({
      page: href,
      control: "(load)",
      steps: `open ${href}`,
      expected: "the page finishes loading",
      actual: `still busy / Loading… after ${STUCK_MS / 1000} s`,
      severity: "high",
      kind: "stuck",
    });
  const text = await rec.page
    .locator("main")
    .first()
    .innerText({ timeout: 2000 })
    .catch(() => "");
  if (text.trim().length < 15)
    await rec.add({
      page: href,
      control: "(load)",
      steps: `open ${href}`,
      expected: "page content",
      actual: "blank main area",
      severity: "high",
      kind: "blank",
    });
}

/** Crawl one page: every control once, every dialog, every link. */
async function crawlPage(
  rec: Recorder,
  href: string,
  links: Set<string>,
  withHeader: boolean,
) {
  const page = rec.page;
  rec.counts.pages++;
  const t0 = Date.now();
  progress(rec, `${href}: crawl`);
  await gotoPage(rec, href);
  await rec.drain(href, "(load)", `open ${href}`);
  await overflowCheck(rec, href, "desktop");
  const done = new Set<string>();
  const started = Date.now();
  for (let step = 0; step < 120 && Date.now() - started < 150_000; step++) {
    if (pathOf(page) !== href) {
      await gotoPage(rec, href);
      await rec.drain(href, "(reload)", `reopen ${href}`);
    }
    if (await openDialog(page)) await closeDialog(rec, href, "(left open)");
    const controls = await listControls(page, withHeader);
    const next = controls.find((c) => !done.has(c.key));
    if (!next) break;
    done.add(next.key);
    const name = `${next.scope === "header" ? "[header] " : ""}${next.tag}${next.role ? `[${next.role}]` : ""} "${next.label}"`;
    if (DESTRUCTIVE.test(next.label)) {
      rec.counts.controlsSkippedDestructive++;
      rec.skipped.push(`${href} | ${name}`);
      continue;
    }
    if (next.tag === "a" && next.href) {
      const u = new URL(next.href, appOrigin);
      if (u.origin === appOrigin && u.pathname !== href) {
        links.add(u.pathname + u.search);
        continue;
      }
      if (u.origin !== appOrigin) {
        rec.notes.push(
          `${href} | outside link ${u.protocol}${u.host}${u.pathname}`,
        );
        continue;
      }
    }
    if (NOT_CLICKED.test(next.label)) continue;
    if (!(await mark(page, next.key))) continue;
    const target = page.locator("[data-p16]").first();
    /* Clicking the tab or choice already shown is expected to do nothing. */
    const current = await target
      .evaluate(
        (e) =>
          e.getAttribute("aria-selected") === "true" ||
          e.getAttribute("aria-pressed") === "true" ||
          e.getAttribute("aria-checked") === "true" ||
          e.getAttribute("aria-current") !== null,
      )
      .catch(() => false);
    /* Scrolled into view first, so the click itself moves nothing. */
    await target
      .scrollIntoViewIfNeeded({ timeout: 2000 })
      .catch(() => undefined);
    let before = await snapshot(page);
    const r0 = rec.requests;
    const d0 = rec.counts.downloads;
    rec.counts.controlsClicked++;
    try {
      if (next.tag === "select") {
        const values = await target.evaluate((s) =>
          [...(s as HTMLSelectElement).options].map((o) => o.value),
        );
        const cur = await target.inputValue();
        const other = values.find((v) => v !== cur);
        /* Pick another option, see the page react, then put the original
           back so a later "Save" on the page never changes seeded settings. */
        if (other !== undefined) {
          await target.selectOption(other, { timeout: 3000 });
          await page.waitForTimeout(300);
          await rec.drain(href, name, `choose "${other}" in ${name}`);
          before = await snapshot(page);
          await target
            .selectOption(cur, { timeout: 3000 })
            .catch(() => undefined);
        }
      } else if (next.type === "search") {
        /* Judged while filled: the list must react to the query. */
        await target.fill("zz synthetic", { timeout: 3000 });
        await page.waitForTimeout(400);
        const filled = await snapshot(page);
        await target.fill("", { timeout: 3000 });
        const textChanged =
          filled.split("#")[1] !== before.split("#")[1] || rec.requests > r0;
        if (!textChanged)
          await rec.add({
            page: href,
            control: name,
            steps: `type "zz synthetic" in ${name}`,
            expected: "the list filters (or says nothing matches)",
            actual: "nothing on the page changed",
            severity: "low",
            kind: "search-no-op",
          });
        await rec.drain(href, name, `search in ${name}`);
        continue;
      } else if (next.type === "file") {
        await target.setInputFiles(
          {
            name: "p16-synthetic.pdf",
            mimeType: "application/pdf",
            buffer: Buffer.from("%PDF-1.4\n% synthetic p16 test file\n%%EOF\n"),
          },
          { timeout: 3000 },
        );
      } else {
        await target.click({ timeout: 3000 });
        /* A toggle is put back (a switch may save at once). */
        if (
          ["switch", "checkbox"].includes(next.role) ||
          next.type === "checkbox"
        ) {
          await page.waitForTimeout(400);
          const toggled = await snapshot(page);
          await rec.drain(href, name, `toggle ${name}`);
          if (!(await openDialog(page))) {
            await target.click({ timeout: 3000 }).catch(() => undefined);
            await page.waitForTimeout(300);
            if (toggled === before && rec.requests === r0)
              await rec.add({
                page: href,
                control: name,
                steps: `click ${name}`,
                expected: "the toggle changes",
                actual: "nothing changed",
                severity: "low",
                kind: "no-op",
              });
            await rec.drain(href, name, `toggle ${name} back`);
            continue;
          }
        }
      }
    } catch (e) {
      rec.notes.push(
        `${href} | ${name}: not clickable (${String(e).slice(0, 80)})`,
      );
      continue;
    }
    await page.waitForTimeout(350);
    const dlg = await openDialog(page);
    if (dlg) {
      await rec.drain(href, name, `click ${name}`);
      await exerciseDialog(rec, href, next.label);
    } else {
      const after = await snapshot(page);
      const moved = pathOf(page) !== href;
      if (
        after === before &&
        rec.requests === r0 &&
        rec.counts.downloads === d0 &&
        !moved &&
        !current &&
        next.tag !== "a"
      ) {
        await page.waitForTimeout(500);
        if ((await snapshot(page)) === before && rec.requests === r0)
          await rec.add({
            page: href,
            control: name,
            steps: `open ${href}, click ${name}`,
            expected: "a visible result",
            actual: "nothing changed on the page and no request was made",
            severity: "low",
            kind: "no-op",
          });
      }
      if (moved) {
        await settle(page, 5000);
        if (await crashed(page))
          await rec.add({
            page: href,
            control: name,
            steps: `click ${name}`,
            expected: "the target page renders",
            actual: `landed on ${pathOf(page)} with an error / 404`,
            severity: "high",
            kind: "nav-error",
          });
      }
      await rec.drain(href, name, `click ${name}`);
    }
  }
  /* Phone width. */
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoPage(rec, href);
  rec.counts.mobileChecks++;
  await overflowCheck(rec, href, "mobile");
  await rec.drain(href, "(mobile)", `open ${href} at 390 px`);
  await page.setViewportSize({ width: 1280, height: 800 });
  progress(rec, `${href}: done in ${Math.round((Date.now() - t0) / 1000)} s`);
}

async function checkLinks(rec: Recorder, links: Set<string>, pages: string[]) {
  for (const link of links) {
    rec.counts.linksChecked++;
    /* A sidebar page was already opened and crawled. */
    if (pages.includes(link.split("?")[0])) continue;
    const res = await rec.page
      .goto(link, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT })
      .catch(() => null);
    await settle(rec.page, 5000);
    const notFound =
      (res?.status() ?? 200) === 404 ||
      (await rec.page.getByText(/This page could not be found|404/).count()) >
        0;
    if (notFound)
      await rec.add({
        page: link,
        control: "(link)",
        steps: `follow the in-page link ${link}`,
        expected: "an existing page",
        actual: "404",
        severity: "high",
        kind: "link-404",
      });
    await rec.drain(link, "(link)", `open ${link}`);
  }
}

/* ------------------------------------------------------------- the roles */

async function verifiedFreshAccount(tag: string): Promise<Account> {
  const account = throwawayAccount(tag);
  const consent = await currentConsent();
  const since = mailMark();
  await pace("register");
  const ctx = await request.newContext();
  try {
    const res = await ctx.post(`${env.apiURL}/auth/register`, {
      headers: { "X-Auth-Transport": "bearer", Origin: appOrigin },
      data: { ...account, consent },
    });
    const body = await json(res, `register ${tag}`);
    const access = (body.tokens as { access: { token: string } }).access.token;
    const mail = await waitForMail(account.email, { since });
    const v = await ctx.post(`${env.apiURL}/auth/email/verify/confirm`, {
      headers: { Authorization: `Bearer ${access}`, Origin: appOrigin },
      data: { code: extractOtp(mail) },
    });
    expect(v.ok(), `verify ${tag}: ${v.status()}`).toBeTruthy();
  } finally {
    await ctx.dispose();
  }
  return account;
}

/** A fresh account that is staff at the hospital AND the nephrology office. */
async function twoPortalAccount(): Promise<Account> {
  const person = await verifiedFreshAccount("p16d-two");
  const hospital = await ApiClient.login(ACCOUNTS.hospital);
  const neph = await ApiClient.login(ACCOUNTS.nephrology);
  try {
    const H = await hospital.orgId("HOSPITAL");
    const N = await neph.orgId("NEPHROLOGY_OFFICE");
    for (const [c, org, role] of [
      [hospital, H, "Education Coordinator"],
      [neph, N, "Care Coordinator"],
    ] as const) {
      const r = await c.post(`/organizations/${org}/invitations`, {
        email: person.email,
        role,
      });
      expect(r.status(), `invite ${role}`).toBe(201);
    }
  } finally {
    await hospital.dispose();
    await neph.dispose();
  }
  for (;;) {
    const client = await ApiClient.login(person);
    try {
      const list = (await json(await client.get("/me/invitations"), "mine"))
        .data as Array<{ id: string; kind: string; status: string }>;
      const next = list.find(
        (i) => i.kind === "STAFF" && i.status === "PENDING",
      );
      if (!next) break;
      const r = await client.post(`/me/invitations/${next.id}/accept`);
      expect(r.ok(), `accept: ${r.status()}`).toBeTruthy();
    } finally {
      await client.dispose();
    }
  }
  return person;
}

let twoPortal: Account | null = null;
const getTwoPortal = async () => (twoPortal ??= await twoPortalAccount());

const ROLES: Role[] = [
  { id: "hospital-owner", account: ACCOUNTS.hospital },
  {
    id: "hospital-rn",
    account: staff("hospitalrn@nephroreach.com"),
    limited: true,
  },
  {
    id: "hospital-educator",
    account: staff("educator@nephroreach.com"),
    limited: true,
  },
  { id: "nephrology-owner", account: ACCOUNTS.nephrology },
  {
    id: "nephrology-ccm",
    account: staff("ccm@nephroreach.com"),
    limited: true,
  },
  {
    id: "two-portal-hospital",
    account: getTwoPortal,
    portal: "Riverside General Hospital",
    limited: true,
  },
  {
    id: "two-portal-nephrology",
    account: getTwoPortal,
    portal: "Riverside Nephrology Associates",
    limited: true,
  },
];

const ONLY = process.env.E2E_P16_ROLES
  ? new Set(process.env.E2E_P16_ROLES.split(","))
  : null;

test.setTimeout(40 * 60_000);

for (const role of ROLES) {
  test(`click-through: ${role.id} @phase16`, async ({ asUser }) => {
    test.skip(Boolean(ONLY && !ONLY.has(role.id)), "not selected");
    test.skip(
      typeof role.account === "function" && !env.mailDir,
      "needs E2E_MAIL_DIR (the two-portal fixture verifies its email)",
    );
    const account =
      typeof role.account === "function" ? await role.account() : role.account;
    const { page } = await asUser(account);
    await page.setViewportSize({ width: 1280, height: 800 });
    const rec = new Recorder(role.id, page);

    await page.goto("/dashboard", {
      waitUntil: "domcontentloaded",
      timeout: NAV_TIMEOUT,
    });
    await page.waitForURL(/\/(dashboard|select-portal)/, {
      timeout: NAV_TIMEOUT,
    });
    if (/\/select-portal/.test(page.url()) || role.portal) {
      if (!/\/select-portal/.test(page.url()))
        await page.goto("/select-portal");
      const open = role.portal
        ? page.getByRole("button", { name: `Open: ${role.portal}` })
        : page.getByRole("button", { name: /^Open: / }).first();
      await open.click({ timeout: NAV_TIMEOUT });
      await page.waitForURL(/\/dashboard/, { timeout: NAV_TIMEOUT });
    }
    await page
      .locator('aside a[href^="/dashboard"]')
      .first()
      .waitFor({ timeout: NAV_TIMEOUT });
    await rec.drain("/dashboard", "(sign-in)", "sign in and open the portal");
    const pages = [
      ...new Set(
        await page
          .locator('aside a[href^="/dashboard"]')
          .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? "")),
      ),
    ].filter((h) => h && (!role.only || role.only.test(h)));

    /* Pages are opened through the sidebar link first (client navigation,
       portal context kept in memory, D45), then crawled in place. */
    const links = new Set<string>();
    let first = true;
    for (const href of pages) {
      await page.locator(`aside a[href="${href}"]`).first().click();
      await page
        .waitForURL((u) => u.pathname.startsWith(href), {
          timeout: NAV_TIMEOUT,
        })
        .catch(() => undefined);
      const landed = pathOf(page);
      await crawlPage(rec, landed, links, first);
      first = false;
      /* A reload of a multi-portal account returns to the picker (D45):
         re-open the same portal before the next page. */
      if (/\/select-portal/.test(page.url()) && role.portal) {
        await page
          .getByRole("button", { name: `Open: ${role.portal}` })
          .click({ timeout: NAV_TIMEOUT });
        await page.waitForURL(/\/dashboard/, { timeout: NAV_TIMEOUT });
      }
    }
    await checkLinks(rec, links, pages);

    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(
      path.join(OUT, `results-${role.id}.json`),
      JSON.stringify(
        {
          role: role.id,
          account: account.email.endsWith("@example.test")
            ? "fresh two-membership account (*.example.test)"
            : account.email,
          pages,
          counts: rec.counts,
          issues: rec.issues,
          skippedDestructive: rec.skipped,
          api4xx: rec.api4xx,
          notes: rec.notes,
        },
        null,
        2,
      ),
    );
    const failing = rec.issues.filter(
      (i) =>
        SEVERITY_FAILS.includes(i.severity) &&
        !KNOWN[`${i.kind}|${i.page}|${i.control}`],
    );
    expect(
      failing.map(
        (i) => `${i.severity} ${i.kind} ${i.page} ${i.control}: ${i.actual}`,
      ),
      `${role.id}: blocker/high issues`,
    ).toEqual([]);
  });
}

/* --------------------------------------------------------------- journeys
   Valid forms, persistence after a reload, and destructive actions on the
   crawler's own records only. Each journey also fails on any blocker/high
   event the recorder saw (console error, 5xx, crash, overlay). */

const stamp = () => Date.now().toString(36).slice(-5);

async function journeyEnd(rec: Recorder, name: string) {
  await rec.drain(name, "(end)", name);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(
    path.join(OUT, `results-${rec.role}.json`),
    JSON.stringify(
      {
        role: rec.role,
        counts: rec.counts,
        issues: rec.issues,
        api4xx: rec.api4xx,
        notes: rec.notes,
      },
      null,
      2,
    ),
  );
  expect(
    rec.issues
      .filter((i) => SEVERITY_FAILS.includes(i.severity))
      .map((i) => `${i.kind} ${i.page} ${i.control}: ${i.actual}`),
  ).toEqual([]);
}

test("journey: hospital enrolls, discharges and withdraws its own synthetic patient @phase16", async ({
  asUser,
}) => {
  test.skip(Boolean(ONLY && !ONLY.has("journeys")), "not selected");
  const { page } = await asUser(ACCOUNTS.hospital);
  await page.setViewportSize({ width: 1280, height: 800 });
  const rec = new Recorder("journey-hospital-enrollment", page);
  const t = stamp();
  const first = `Pxvi${t}`;
  const last = "Synthetic";
  const mrn = `P16D-${t}`.toUpperCase();
  const H = "/dashboard/hospital/patients";

  await gotoPage(rec, H);
  await page.getByRole("button", { name: "Enroll patient" }).first().click();
  const dlg = page.getByRole("dialog", { name: "Enroll a patient" });
  await expect(dlg).toBeVisible();
  test.skip(
    (await dlg.getByText(/No hospital program is published yet/).count()) > 0,
    "no published hospital program on this env",
  );
  /* Empty, then invalid (blank names), then valid. */
  const submit = dlg.getByRole("button", { name: "Enroll patient" });
  await submit.click();
  rec.counts.formsSubmittedEmpty++;
  await expect(dlg.getByText("Enter the patient's first name.")).toBeVisible();
  await dlg.getByLabel("First name").fill("   ");
  await submit.click();
  await expect(dlg.getByText("Enter the patient's first name.")).toBeVisible();
  await dlg.getByLabel("First name").fill(first);
  await dlg.getByLabel("Last name").fill(last);
  await dlg.getByLabel("MRN").fill(mrn);
  await dlg.getByRole("radio", { name: /Already receiving dialysis/ }).click();
  await submit.click();
  await expect(dlg).toBeHidden({ timeout: 15_000 });
  rec.counts.formsSubmittedValid++;
  const row = page.getByRole("row").filter({ hasText: mrn });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row).toContainText("Admitted");

  /* Saved on the server: still there after a reload. */
  await page.reload({ waitUntil: "domcontentloaded" });
  await settle(page);
  await expect(row).toBeVisible({ timeout: 15_000 });
  await rec.drain(H, "Enroll patient", "enroll a synthetic patient");

  /* Discharge today (own record). */
  await row.getByRole("button", { name: /^Update / }).click();
  const edit = page.getByRole("dialog");
  await edit.getByRole("radio", { name: "Discharged" }).click();
  await expect(edit.getByLabel("Discharge date")).toBeVisible();
  await edit.getByRole("button", { name: "Save" }).click();
  await expect(edit).toBeHidden({ timeout: 15_000 });
  rec.counts.formsSubmittedValid++;
  await page.reload({ waitUntil: "domcontentloaded" });
  await settle(page);
  await expect(row).toContainText("Discharged", { timeout: 15_000 });
  await expect(row).not.toContainText("While admitted");
  await rec.drain(H, "Update > Discharged", "discharge today");

  /* Withdraw (own record): access ends. */
  await row.getByRole("button", { name: /^Update / }).click();
  await page
    .getByRole("dialog")
    .getByRole("radio", { name: "Withdrawn" })
    .click();
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 15_000 });
  rec.counts.formsSubmittedValid++;
  await page.reload({ waitUntil: "domcontentloaded" });
  await settle(page);
  await expect(row).toContainText("Withdrawn", { timeout: 15_000 });
  await expect(row).toContainText("Ended");
  await rec.drain(H, "Update > Withdrawn", "withdraw");

  /* The report counts from the server; its export downloads. */
  await gotoPage(rec, "/dashboard/hospital/reports");
  const dl = page.getByRole("button", { name: /^Download$/ });
  if (await dl.count()) {
    const wait = page.waitForEvent("download", { timeout: 15_000 });
    await dl.first().click();
    const file = await wait;
    expect(file.suggestedFilename()).toMatch(/\.csv$/i);
  }
  await journeyEnd(rec, "journey hospital enrollment");
});

test("journey: hospital team invitation (empty, invalid, valid) and withdrawing its own invitation @phase16", async ({
  asUser,
}) => {
  test.skip(Boolean(ONLY && !ONLY.has("journeys")), "not selected");
  const { page } = await asUser(ACCOUNTS.hospital);
  await page.setViewportSize({ width: 1280, height: 800 });
  const rec = new Recorder("journey-hospital-team", page);
  const email = `p16d-invite-${stamp()}@example.test`;
  const T = "/dashboard/hospital/team";
  await gotoPage(rec, T);
  const invitations = page.getByRole("tab", { name: /Invitations/i });
  if (await invitations.count()) await invitations.first().click();
  await page.getByRole("button", { name: "Invite staff" }).click();
  const dlg = page.getByRole("dialog", { name: "Invite staff" });
  const send = dlg.getByRole("button", { name: "Send invitation" });
  await send.click();
  rec.counts.formsSubmittedEmpty++;
  await expect(dlg.getByText("Enter a valid email address.")).toBeVisible();
  await expect(dlg.getByText("Choose a role.")).toBeVisible();
  await dlg.getByLabel("Their email").fill("not-an-email");
  await send.click();
  await expect(dlg.getByText("Enter a valid email address.")).toBeVisible();
  await dlg.getByLabel("Their email").fill(email);
  const roleSelect = dlg.getByLabel("Role");
  const values = await roleSelect.evaluate((s) =>
    [...(s as HTMLSelectElement).options].map((o) => o.value).filter(Boolean),
  );
  await roleSelect.selectOption(values[0]);
  await send.click();
  await expect(dlg).toBeHidden({ timeout: 15_000 });
  rec.counts.formsSubmittedValid++;
  /* The row, not the "Invitation sent to …" toast that also names it. */
  const sent = page.getByRole("cell", { name: email, exact: true });
  await expect(sent).toBeVisible({ timeout: 15_000 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await settle(page);
  if (await invitations.count()) await invitations.first().click();
  await expect(sent).toBeVisible({ timeout: 15_000 });
  await rec.drain(T, "Invite staff", "invite a synthetic address");

  const withdraw = page.getByRole("button", {
    name: `Withdraw the invitation to ${email}`,
  });
  await withdraw.click();
  const confirm = page.getByRole("dialog");
  if (await confirm.count())
    await confirm
      .getByRole("button", { name: /withdraw/i })
      .last()
      .click();
  await expect(withdraw).toHaveCount(0, { timeout: 15_000 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await settle(page);
  if (await invitations.count()) await invitations.first().click();
  await expect(withdraw).toHaveCount(0);
  await journeyEnd(rec, "journey hospital team");
});

test("journey: hospital support request (empty, then valid, listed after reload) @phase16", async ({
  asUser,
}) => {
  test.skip(Boolean(ONLY && !ONLY.has("journeys")), "not selected");
  const { page } = await asUser(ACCOUNTS.hospital);
  await page.setViewportSize({ width: 1280, height: 800 });
  const rec = new Recorder("journey-hospital-support", page);
  const subject = `P16D synthetic request ${stamp()}`;
  const S = "/dashboard/hospital/support";
  await gotoPage(rec, S);
  await page.getByRole("button", { name: "New Request" }).click();
  const dlg = page.getByRole("dialog", { name: "New Support Request" });
  const send = dlg.getByRole("button", { name: "Send" });
  await send.click();
  rec.counts.formsSubmittedEmpty++;
  await expect(dlg).toBeVisible();
  await expect(
    dlg.locator('[aria-invalid="true"], [role="alert"]').first(),
  ).toBeVisible();
  await dlg.getByLabel("Subject").fill(subject);
  await dlg
    .getByLabel("How can we help?")
    .fill("Synthetic test request from the Phase 16 crawler. No patient data.");
  await send.click();
  await expect(dlg).toBeHidden({ timeout: 15_000 });
  rec.counts.formsSubmittedValid++;
  await expect(page.getByText(subject).first()).toBeVisible({
    timeout: 15_000,
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await settle(page);
  await expect(page.getByText(subject).first()).toBeVisible({
    timeout: 15_000,
  });
  await journeyEnd(rec, "journey hospital support");
});

test("journey: two-membership staff switches portal; each portal calls only its own office @phase16", async ({
  asUser,
}) => {
  test.skip(Boolean(ONLY && !ONLY.has("journeys")), "not selected");
  test.skip(!env.mailDir, "needs E2E_MAIL_DIR");
  const person = await getTwoPortal();
  const c = await ApiClient.login(person);
  const me = await c.context().finally(() => c.dispose());
  const hosp = me.memberships.find((m) => m.organizationType === "HOSPITAL");
  const neph = me.memberships.find(
    (m) => m.organizationType === "NEPHROLOGY_OFFICE",
  );
  expect(hosp && neph, "two memberships").toBeTruthy();
  const { page } = await asUser(person);
  await page.setViewportSize({ width: 1280, height: 800 });
  const rec = new Recorder("journey-portal-switch", page);
  const orgCalls: string[] = [];
  page.on("request", (req) => {
    const u = new URL(req.url());
    if (u.origin !== apiOrigin) return;
    const m = /\/organizations\/([0-9a-f-]{36})/.exec(u.pathname);
    if (m) orgCalls.push(m[1]);
    const h = req.headers()["x-organization-id"];
    if (h) orgCalls.push(h);
  });

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/select-portal/, { timeout: 30_000 });
  await page
    .getByRole("button", { name: `Open: ${hosp!.organizationName}` })
    .click();
  await expect(page).toHaveURL(/\/dashboard\/hospital/, { timeout: 30_000 });
  await settle(page);
  await expect(
    page.getByText(`You are working in ${hosp!.organizationName}`),
  ).toBeVisible();
  const before = orgCalls.length;
  expect(orgCalls.every((o) => o === hosp!.organizationId)).toBe(true);

  await page.getByRole("link", { name: "Switch portal" }).click();
  await expect(page).toHaveURL(/\/select-portal/);
  await page
    .getByRole("button", { name: `Open: ${neph!.organizationName}` })
    .click();
  await page.waitForURL(/\/dashboard\/(clinic|nephrology)/, {
    timeout: 30_000,
  });
  await settle(page);
  await expect(
    page.getByText(`You are working in ${neph!.organizationName}`),
  ).toBeVisible();
  /* The hospital menu is gone; the nephrology CCM is there. */
  await expect(page.locator('aside a[href="/dashboard/hospital"]')).toHaveCount(
    0,
  );
  await page.locator('aside a[href="/dashboard/nephrology"]').click();
  await settle(page);
  expect(
    orgCalls.slice(before).filter((o) => o !== neph!.organizationId),
    "after the switch only the nephrology office is called",
  ).toEqual([]);
  await journeyEnd(rec, "journey portal switch");
});
