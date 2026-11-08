/* Phase 15 CSP in the browser (INTEGRATION_PLAN Phase 15 "CSP crawl of
   every page"). DRAFT, prepared for the Lead: copy to
   Nephro-reach-frontend/e2e/91-csp-console.spec.ts.

   The Node crawl (integration-evidence/phase-15/scripts/csp-crawl.mjs)
   checks the headers; this one checks what the browser ENFORCES while the
   app runs. Per role it opens every sidebar page and records:
   - `securitypolicyviolation` events (an init script listens before any
     app code runs; report-only would not catch blocked inline handlers);
   - console messages about a Content Security Policy / "Refused to";
   - uncaught page errors (a CSP block often surfaces as one);
   - the document response headers of each full navigation (CSP present,
     frame-ancestors 'none', private no-store on /dashboard*);
   - any third-party request (the fixture's `blocked` log fails the test).
   Evidence: E2E_EVIDENCE_DIR (default test-results/csp-console) as
   csp-console.json; directive, blocked URI origin and page only.
   Synthetic seed accounts only. Run with --workers=1. */
import fs from "node:fs";
import path from "node:path";
import type { Page, Response } from "@playwright/test";
import { ApiClient } from "./fixtures/api";
import { ACCOUNTS, env, type Account } from "./fixtures/env";
import { expect, test } from "./fixtures/test";

const EVIDENCE_DIR = path.resolve(
  process.env.E2E_EVIDENCE_DIR ?? path.join("test-results", "csp-console"),
);

type Role = { id: string; account: Account; patients?: string[] };
const ROLES: Role[] = [
  { id: "member-john", account: ACCOUNTS.john },
  {
    id: "caregiver-sarah",
    account: ACCOUNTS.caregiver,
    patients: ["John Taylor"],
  },
  { id: "dialysis-owner", account: ACCOUNTS.clinic },
  { id: "access-owner", account: ACCOUNTS.access },
  { id: "nephrology-owner", account: ACCOUNTS.nephrology },
  { id: "hospital-owner", account: ACCOUNTS.hospital },
  { id: "platform-admin", account: ACCOUNTS.admin },
];

type Violation = {
  role: string;
  page: string;
  kind: string;
  detail: string;
};

declare global {
  interface Window {
    __p15Csp?: Array<{ directive: string; blocked: string; sample: string }>;
  }
}

async function listen(page: Page, role: string, out: Violation[]) {
  await page.addInitScript(() => {
    window.__p15Csp = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      let blocked = e.blockedURI;
      try {
        blocked = new URL(e.blockedURI).origin; // no paths/queries (tokens)
      } catch {
        /* inline, eval, data… */
      }
      window.__p15Csp!.push({
        directive: e.effectiveDirective,
        blocked,
        sample: (e.sample ?? "").slice(0, 40),
      });
    });
  });
  page.on("console", (m) => {
    const t = m.text();
    if (
      /content security policy|refused to (load|execute|connect|frame|apply)/i.test(
        t,
      )
    )
      out.push({
        role,
        page: new URL(page.url()).pathname,
        kind: "console",
        detail: t
          .replace(/https?:\/\/[^\s'"]+/g, (u) => {
            try {
              return new URL(u).origin; // no paths or queries (tokens)
            } catch {
              return "<url>";
            }
          })
          .slice(0, 300),
      });
  });
  page.on("pageerror", (e) =>
    out.push({
      role,
      page: new URL(page.url()).pathname,
      kind: "pageerror",
      detail: e.message.slice(0, 300),
    }),
  );
}

function checkDocument(
  res: Response | null,
  role: string,
  href: string,
  out: Violation[],
) {
  if (!res) return;
  const h = res.headers();
  const csp = h["content-security-policy"] ?? "";
  const add = (detail: string) =>
    out.push({ role, page: href, kind: "header", detail });
  if (!csp) add("no Content-Security-Policy");
  if (!/frame-ancestors 'none'/.test(csp)) add("frame-ancestors is not 'none'");
  if ((h["x-frame-options"] ?? "").toUpperCase() !== "DENY")
    add("X-Frame-Options is not DENY");
  if (href.startsWith("/dashboard")) {
    const cc = h["cache-control"] ?? "";
    if (!/no-store/.test(cc) || !/private/.test(cc))
      add(`Cache-Control "${cc}" (needs private, no-store)`);
  }
}

async function drain(page: Page, role: string, out: Violation[]) {
  const got = await page.evaluate(() => {
    const v = window.__p15Csp ?? [];
    window.__p15Csp = [];
    return v;
  });
  for (const v of got)
    out.push({
      role,
      page: new URL(page.url()).pathname,
      kind: "securitypolicyviolation",
      detail: `${v.directive} blocked ${v.blocked} ${v.sample}`.trim(),
    });
}

async function settle(page: Page) {
  await page
    .waitForLoadState("networkidle", { timeout: 10_000 })
    .catch(() => undefined);
}

test.beforeAll(async () => {
  for (const a of [ACCOUNTS.john, ACCOUNTS.caregiver]) {
    const c = await ApiClient.login(a);
    try {
      await c.post("/me/preferences/tour-completed");
      await c.logout();
    } finally {
      await c.dispose();
    }
  }
});

test.setTimeout(10 * 60_000);

for (const role of ROLES) {
  test(`CSP in the browser: ${role.id} @phase15`, async ({ asUser }) => {
    const out: Violation[] = [];
    const { page } = await asUser(role.account);
    await listen(page, role.id, out);
    checkDocument(await page.goto("/dashboard"), role.id, "/dashboard", out);
    await settle(page);
    if (/\/select-portal/.test(page.url()))
      await page
        .getByRole("button", { name: /^Open: / })
        .first()
        .click();
    if (role.patients) {
      await page
        .getByRole("button", { name: `Open ${role.patients[0]}` })
        .click();
      await settle(page);
    }
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
    for (const href of hrefs) {
      if (role.patients) {
        // In-app navigation keeps the caregiver's in-memory patient choice.
        await page.locator(`aside a[href="${href}"]`).first().click();
      } else {
        checkDocument(await page.goto(href), role.id, href, out);
      }
      await settle(page);
      await drain(page, role.id, out);
    }
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(EVIDENCE_DIR, `${role.id}.json`),
      JSON.stringify(
        { role: role.id, baseURL: env.baseURL, pages: hrefs, violations: out },
        null,
        1,
      ),
    );
    expect(
      out,
      `CSP/console findings for ${role.id}:\n${out.map((v) => `${v.page} [${v.kind}] ${v.detail}`).join("\n")}`,
    ).toEqual([]);
  });
}
