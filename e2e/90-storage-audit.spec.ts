/* Phase 15 storage audit (INTEGRATION_PLAN Phase 15; launch checklist C9;
   ADR 0006 / ADR 0007 end state). DRAFT, prepared for the Lead: copy to
   Nephro-reach-frontend/e2e/90-storage-audit.spec.ts.

   For every seeded role it signs in (real httpOnly cookie session), opens
   every page the sidebar shows that role (in-app clicks, so a caregiver's
   in-memory patient choice survives), and after each page dumps:
   localStorage, sessionStorage, IndexedDB, Cache Storage, document.cookie
   and the cookie jar.

   It FAILS on:
   - a localStorage/sessionStorage key outside the allowed list
     (KEPT_KEYS from src/lib/data/legacyPurge.ts + DOCUMENTED_UI_PREF_KEYS,
     empty today: no UI-preference key is documented as allowed);
   - any IndexedDB database or Cache Storage entry (the app uses neither);
   - a PHI-looking or secret-looking value or key (seed names, MRNs, DOBs,
     phones, emails, data: URLs, JWTs, password/token/secret fields, clinical
     field names);
   - a JS-readable auth cookie, or any cookie other than the API's two
     httpOnly auth cookies;
   - a wrong storage-version marker.

   Known exception D8: `nr:dialysis-treatment-vitals` (and its per-member
   variants) is the last live member store (home-HD vitals wait on D8). It is
   listed separately in the evidence and does NOT fail the run unless
   E2E_D8_STRICT=true (set it once D8 is decided and the key is retired).

   Evidence: keys, value lengths and finding labels only, never values.
   Written to E2E_EVIDENCE_DIR (default test-results/storage-audit) as
   storage-audit.json + storage-audit.md, and attached to the report.
   Synthetic seed accounts only. Run with --workers=1 against the Lead env. */
import fs from "node:fs";
import path from "node:path";
import type { BrowserContext, Page } from "@playwright/test";
import {
  KEPT_KEYS,
  STORAGE_VERSION,
  STORAGE_VERSION_KEY,
  isRetiredKey,
} from "../src/lib/data/legacyPurge";
import { ApiClient } from "./fixtures/api";
import {
  ACCOUNTS,
  MFA_NURSE_TOTP_SECRET,
  env,
  type Account,
} from "./fixtures/env";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./fixtures/session";
import { dumpStorage } from "./fixtures/storage";
import { expect, test } from "./fixtures/test";

/* No UI-preference key is documented as allowed (ADR 0007: the end state
   is preferred_language + the marker). Add one here only with the doc that
   allows it, and say so in the Phase 15 evidence. */
const DOCUMENTED_UI_PREF_KEYS: readonly string[] = [];
const ALLOWED_KEYS = new Set([...KEPT_KEYS, ...DOCUMENTED_UI_PREF_KEYS]);

/** D8: home-HD vitals, every variant (nr:, nr:member:<email>:, caregiver). */
const D8_KEY = /^nr:(?:.*:)?dialysis-treatment-vitals$/;
const D8_STRICT = process.env.E2E_D8_STRICT === "true";

const STAFF_PASSWORD = "staff123"; // seed.ts DEMO_STAFF_PASSWORD (synthetic)
const staff = (email: string, name: string): Account => ({
  email,
  password: STAFF_PASSWORD,
  name,
});

type Role = {
  id: string;
  account: Account;
  totpSecret?: string;
  /** Caregiver: the patients to open from My Patients, one pass each. */
  patients?: string[];
  /** Account needs the SEED_SECURITY_FIXTURES DB. */
  needsFixtures?: boolean;
};

/* Every seeded role: members, the caregiver, the owner and one non-owner
   staff member of each office type, the platform admin and the platform
   support account (seed.ts STAFF / OFFICES / ADMINS). */
const ROLES: Role[] = [
  { id: "member-john", account: ACCOUNTS.john },
  { id: "member-grace", account: ACCOUNTS.grace },
  {
    id: "caregiver-sarah",
    account: ACCOUNTS.caregiver,
    patients: ["John Taylor", "Grace Taylor"],
  },
  { id: "dialysis-owner", account: ACCOUNTS.clinic },
  { id: "dialysis-social-worker", account: ACCOUNTS.socialWorker },
  {
    id: "dialysis-nurse-mfa",
    account: ACCOUNTS.mfaNurse,
    totpSecret: MFA_NURSE_TOTP_SECRET,
    needsFixtures: true,
  },
  { id: "access-owner", account: ACCOUNTS.access },
  {
    id: "access-front-desk",
    account: staff("frontdesk@nephroreach.com", "Rachel Kim"),
  },
  { id: "nephrology-owner", account: ACCOUNTS.nephrology },
  {
    id: "nephrology-care-coordinator",
    account: staff("ccm@nephroreach.com", "Care Coordinator (seed)"),
  },
  { id: "hospital-owner", account: ACCOUNTS.hospital },
  {
    id: "hospital-educator",
    account: staff("educator@nephroreach.com", "Education Coordinator (seed)"),
  },
  { id: "platform-admin", account: ACCOUNTS.admin },
  {
    id: "platform-support",
    account: staff("support@nephroreach.com", "Administrative Support (seed)"),
  },
];

/* Values that would be PHI or secrets if real. Seed identifiers come from
   prisma/seed.ts (patients ~330-395, offices ~150-200, STAFF ~203). */
const SEED_PHI = [
  "John Taylor",
  "Grace Taylor",
  "Sarah Taylor",
  "223344",
  "441872",
  "667120",
  "223389",
  "667121",
  "1968-05-14",
  "1941-09-22",
];
const VALUE_PATTERNS: Array<[string, RegExp]> = [
  ["data: URL", /data:[a-z]+\/[a-z0-9.+-]+[;,]/i],
  ["blob: URL", /blob:https?:/i],
  ["JWT", /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/],
  ["password field", /"(password|passwordHash|tempPassword)"\s*:/i],
  [
    "token field",
    /"(refreshToken|accessToken|refresh_token|access_token|idToken|token|inviteToken|shareToken)"\s*:/i,
  ],
  ["challenge/reset id", /"(challengeId|resetId)"\s*:/i],
  ["TOTP secret / otpauth", /otpauth:\/\/|"secret"\s*:/i],
  ["backup codes", /"backupCodes"\s*:/i],
  [
    "clinical/identity field",
    /"(mrn|medicalRecordNumber|dateOfBirth|dob|ssn|diagnosis|firstName|lastName|patientName|phone|address)"\s*:/i,
  ],
  ["email address", /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/],
  ["US phone", /\(\d{3}\)\s?\d{3}-\d{4}/],
];

type KeyRow = { key: string; length: number; class: string };
type PageRow = {
  role: string;
  page: string;
  url: string;
  local: KeyRow[];
  session: KeyRow[];
  idb: string[];
  caches: string[];
  jsCookieNames: string[];
  cookies: Array<{
    name: string;
    domain: string;
    path: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: string;
  }>;
  findings: string[];
  d8: string[];
};

/* Rows are written per role to EVIDENCE_DIR/roles/<role>.json as each test
   ends: Playwright starts a new worker after a failed test, and module
   state would be lost. afterAll aggregates whatever files exist. */
const EVIDENCE_DIR = path.resolve(
  process.env.E2E_EVIDENCE_DIR ?? path.join("test-results", "storage-audit"),
);
const rows: PageRow[] = [];
const notes: string[] = [];

function saveRole(role: string) {
  const dir = path.join(EVIDENCE_DIR, "roles");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `${role}.json`),
    JSON.stringify(
      {
        rows: rows.filter((r) => r.role === role),
        notes: notes.filter((n) => n.startsWith(`${role}:`)),
      },
      null,
      1,
    ),
  );
}

function loadAll(): { rows: PageRow[]; notes: string[] } {
  const dir = path.join(EVIDENCE_DIR, "roles");
  const out = { rows: [] as PageRow[], notes: [] as string[] };
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as {
      rows: PageRow[];
      notes: string[];
    };
    out.rows.push(...j.rows);
    out.notes.push(...j.notes);
  }
  return out;
}

function classify(key: string): string {
  if (ALLOWED_KEYS.has(key)) return "allowed";
  if (D8_KEY.test(key)) return "d8-exception";
  if (isRetiredKey(key)) return "RETIRED (purge missed it)";
  return "UNEXPECTED";
}

function valueFindings(where: string, key: string, value: string): string[] {
  const out: string[] = [];
  for (const s of SEED_PHI)
    if (value.includes(s) || key.includes(s))
      out.push(`${where}[${key}]: seed PHI`);
  for (const [label, re] of VALUE_PATTERNS) {
    if (re.test(value)) out.push(`${where}[${key}]: ${label}`);
    if (label === "email address" && re.test(key))
      out.push(`${where}[${key}]: email in the key name`);
  }
  const passwords = [
    ...Object.values(ACCOUNTS).map((a) => a.password),
    STAFF_PASSWORD,
    MFA_NURSE_TOTP_SECRET,
  ];
  for (const p of passwords)
    if (p.length >= 6 && value.includes(p))
      out.push(`${where}[${key}]: a password or secret`);
  return out;
}

async function audit(
  page: Page,
  context: BrowserContext,
  role: string,
  label: string,
): Promise<PageRow> {
  const dump = await dumpStorage(page);
  const findings: string[] = [];
  const d8: string[] = [];
  const keyRows = (area: string, kv: Record<string, string>) =>
    Object.entries(kv).map(([key, value]) => {
      const cls = classify(key);
      if (cls === "d8-exception") d8.push(`${area}:${key}`);
      else if (cls !== "allowed") findings.push(`${area}: ${cls} key ${key}`);
      // The D8 store is expected to hold vitals; its values are reported
      // under d8, not as findings, until D8 is decided.
      if (cls !== "d8-exception" || D8_STRICT)
        findings.push(...valueFindings(area, key, value));
      return { key, length: value.length, class: cls };
    });
  const local = keyRows("localStorage", dump.local);
  const session = keyRows("sessionStorage", dump.session);
  const marker = dump.local[STORAGE_VERSION_KEY];
  if (marker === undefined)
    findings.push(
      `localStorage: ${STORAGE_VERSION_KEY} missing (purge did not run)`,
    );
  else if (marker !== String(STORAGE_VERSION))
    findings.push(
      `localStorage: ${STORAGE_VERSION_KEY}=${marker}, expected ${STORAGE_VERSION}`,
    );
  if (D8_STRICT)
    for (const k of d8) findings.push(`D8 key still present: ${k}`);

  const idb = Object.keys(dump.idb);
  for (const k of idb) findings.push(`indexedDB: unexpected store ${k}`);
  for (const k of dump.caches) findings.push(`cacheStorage: unexpected ${k}`);

  const jsCookieNames = dump.jsCookies
    .split(";")
    .map((c) => c.split("=")[0].trim())
    .filter(Boolean);
  for (const n of jsCookieNames)
    findings.push(`document.cookie: JS-readable cookie ${n}`);

  const jar = await context.cookies();
  const cookies = jar.map((c) => ({
    name: c.name,
    domain: c.domain,
    path: c.path,
    httpOnly: c.httpOnly,
    secure: c.secure,
    sameSite: c.sameSite,
  }));
  for (const c of jar) {
    if (![ACCESS_COOKIE, REFRESH_COOKIE].includes(c.name))
      findings.push(`cookie jar: unexpected cookie ${c.name}`);
    else if (!c.httpOnly) findings.push(`cookie ${c.name} is not httpOnly`);
    for (const f of valueFindings(
      "cookie",
      c.name,
      decodeURIComponent(c.value),
    ))
      if (!/JWT/.test(f)) findings.push(f); // auth cookies ARE JWTs, httpOnly
  }
  if (/[?&](token|challengeId|resetId|code)=/i.test(dump.url))
    findings.push("URL: a one-time value in the query");

  const row: PageRow = {
    role,
    page: label,
    url: new URL(dump.url).pathname,
    local,
    session,
    idb,
    caches: dump.caches,
    jsCookieNames,
    cookies,
    findings,
    d8,
  };
  rows.push(row);
  return row;
}

async function settle(page: Page) {
  await page
    .waitForLoadState("networkidle", { timeout: 10_000 })
    .catch(() => undefined);
}

async function skipTour(page: Page) {
  const skip = page.getByRole("button", { name: /^skip tour$/i });
  if (
    await skip
      .waitFor({ state: "visible", timeout: 2_000 })
      .then(() => true)
      .catch(() => false)
  )
    await skip.click();
}

/** Sidebar hrefs as rendered for this account (aside = the desktop menu). */
async function sidebarHrefs(page: Page): Promise<string[]> {
  await page
    .locator('aside a[href^="/dashboard"]')
    .first()
    .waitFor({ timeout: 30_000 });
  const hrefs = await page
    .locator('aside a[href^="/dashboard"]')
    .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""));
  return [...new Set(hrefs.filter(Boolean))];
}

async function visitAll(
  page: Page,
  context: BrowserContext,
  role: string,
  prefix = "",
) {
  const hrefs = await sidebarHrefs(page);
  expect(hrefs.length, `${role}: sidebar has links`).toBeGreaterThan(0);
  for (const href of hrefs) {
    const link = page.locator(`aside a[href="${href}"]`).first();
    if (await link.isVisible().catch(() => false)) await link.click();
    else await page.goto(href);
    /* "/dashboard" may redirect to the role's own home page. */
    await expect(page).toHaveURL(
      href === "/dashboard"
        ? /\/dashboard(\/[^?]*)?(\?.*)?$/
        : new RegExp(`${href}/?(\\?.*)?$`),
      { timeout: 30_000 },
    );
    await settle(page);
    await skipTour(page);
    await audit(page, context, role, `${prefix}${href}`);
  }
}

/* Members and the caregiver would otherwise get the first-visit tour. */
test.beforeAll(async () => {
  for (const a of [ACCOUNTS.john, ACCOUNTS.grace, ACCOUNTS.caregiver]) {
    const c = await ApiClient.login(a);
    try {
      await c.post("/me/preferences/tour-completed");
      await c.logout();
    } finally {
      await c.dispose();
    }
  }
});

test.setTimeout(15 * 60_000);

for (const role of ROLES) {
  test(`storage audit: ${role.id} @phase15`, async ({ asUser }) => {
    test.skip(
      !!role.needsFixtures && !env.securityFixtures,
      "needs SEED_SECURITY_FIXTURES (E2E_SECURITY_FIXTURES=true)",
    );
    test.info().annotations.push({ type: "role", description: role.id });
    try {
      await auditRole(role, asUser);
    } finally {
      saveRole(role.id);
    }
    const mine = rows.filter((r) => r.role === role.id);
    const problems = mine.flatMap((r) =>
      r.findings.map((f) => `${r.page}: ${f}`),
    );
    expect(
      problems,
      `storage findings for ${role.id}:\n${problems.join("\n")}`,
    ).toEqual([]);
  });
}

type AsUser = (
  account: Account,
  opts?: { totpSecret?: string },
) => Promise<{ context: BrowserContext; page: Page }>;

async function auditRole(role: Role, asUser: AsUser) {
  const { context, page } = await asUser(
    role.account,
    role.totpSecret ? { totpSecret: role.totpSecret } : {},
  );
  await page.goto("/dashboard");
  await settle(page);
  if (/\/setup\/mfa/.test(page.url())) {
    notes.push(
      `${role.id}: staff MFA enrolment required (AUTH_REQUIRE_STAFF_MFA=true); audited the enrolment page only`,
    );
    await audit(page, context, role.id, "/setup/mfa");
    return;
  }
  if (/\/select-portal/.test(page.url())) {
    await audit(page, context, role.id, "/select-portal");
    await page
      .getByRole("button", { name: /^Open: / })
      .first()
      .click();
    await settle(page);
  }
  await skipTour(page);
  await audit(page, context, role.id, "(home)");

  if (role.patients) {
    for (const name of role.patients) {
      await page.goto("/dashboard/caregiver");
      await settle(page);
      await page.getByRole("button", { name: `Open ${name}` }).click();
      await expect(page).not.toHaveURL(/\/dashboard\/caregiver\/?$/, {
        timeout: 30_000,
      });
      await settle(page);
      await visitAll(page, context, role.id, `[${name}] `);
    }
  } else {
    await visitAll(page, context, role.id);
  }

  /* Sign out through the sidebar: the purge runs again; only the kept
       keys (and, until D8, the vitals store) may remain. */
  const out = page.getByRole("button", { name: /^log out$/i }).first();
  if (await out.isVisible().catch(() => false)) {
    await out.click();
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
    await settle(page);
    await audit(page, context, role.id, "(after sign-out)");
  } else {
    notes.push(
      `${role.id}: no visible "Log out" control; sign-out not audited`,
    );
  }
}

test.afterAll(async ({}, testInfo) => {
  const dir = EVIDENCE_DIR;
  fs.mkdirSync(dir, { recursive: true });
  const { rows, notes } = loadAll();
  const allKeys = new Map<string, Set<string>>();
  for (const r of rows)
    for (const k of [...r.local, ...r.session]) {
      const roles = allKeys.get(`${k.key} (${k.class})`) ?? new Set<string>();
      roles.add(r.role);
      allKeys.set(`${k.key} (${k.class})`, roles);
    }
  const d8 = rows.flatMap((r) => r.d8.map((k) => `${r.role} ${r.page}: ${k}`));
  const summary = {
    generatedAt: new Date().toISOString(),
    baseURL: env.baseURL,
    allowedKeys: [...ALLOWED_KEYS],
    storageVersion: STORAGE_VERSION,
    d8Strict: D8_STRICT,
    pagesAudited: rows.length,
    roles: [...new Set(rows.map((r) => r.role))],
    keysSeen: Object.fromEntries(
      [...allKeys].map(([k, v]) => [k, [...v].sort()]),
    ),
    d8Exception: d8,
    notes,
    findings: rows.flatMap((r) =>
      r.findings.map((f) => `${r.role} ${r.page}: ${f}`),
    ),
    pages: rows,
  };
  fs.writeFileSync(
    path.join(dir, "storage-audit.json"),
    JSON.stringify(summary, null, 1),
  );
  const md = [
    "# Phase 15 storage audit",
    "",
    `Generated ${summary.generatedAt} against ${env.baseURL}. Pages audited: ${rows.length}. Keys and lengths only, never values.`,
    "",
    "## Keys seen (all roles, all pages)",
    "",
    "| Key (class) | Roles |",
    "| --- | --- |",
    ...[...allKeys].map(
      ([k, v]) => `| \`${k}\` | ${[...v].sort().join(", ")} |`,
    ),
    "",
    `## D8 exception (nr:dialysis-treatment-vitals)${D8_STRICT ? " — STRICT: counted as findings" : ""}`,
    "",
    ...(d8.length ? d8.map((x) => `- ${x}`) : ["- none seen"]),
    "",
    "## Findings",
    "",
    ...(summary.findings.length
      ? summary.findings.map((x) => `- ${x}`)
      : ["- none"]),
    "",
    "## Notes",
    "",
    ...(notes.length ? notes.map((x) => `- ${x}`) : ["- none"]),
    "",
    "## Per page",
    "",
    "| Role | Page | localStorage keys | sessionStorage | IndexedDB | Cookies (httpOnly) |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows.map(
      (r) =>
        `| ${r.role} | ${r.page} | ${r.local.map((k) => `${k.key} (${k.length})`).join("<br>") || "—"} | ${r.session.map((k) => k.key).join("<br>") || "—"} | ${r.idb.join("<br>") || "—"} | ${r.cookies.map((c) => `${c.name}${c.httpOnly ? "" : " NOT-httpOnly"}`).join(", ") || "—"} |`,
    ),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(dir, "storage-audit.md"), md);
  await testInfo.attach("storage-audit.md", {
    body: md,
    contentType: "text/markdown",
  });
});
