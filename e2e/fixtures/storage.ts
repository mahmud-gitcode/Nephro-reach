/* Storage dump (ADR 0006, INT-17): after a flow, nothing the page's
   JavaScript can read holds a password, a token, a session secret, a TOTP
   secret, a backup code or a one-time id.

   Scope: localStorage, sessionStorage, IndexedDB values, Cache Storage
   keys, JS-readable cookies, and the URL. The httpOnly auth cookies are
   expected; they must BE httpOnly.

   Phase 2 scope: features that have not moved to the API yet still keep
   their data under `nr:*` keys (staged purge, INTEGRATION_PROGRESS). The
   dump allows those keys but checks their values for secrets. The strict
   end state (only `preferred_language` + the marker, no PHI) is Phase 15:
   pass `{ strict: true }`. Findings print keys and labels, never values. */
import type { BrowserContext, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { ACCOUNTS, MFA_NURSE_TOTP_SECRET } from "./env";
import { LEGACY_DEMO_COOKIE } from "./session";

export const KEPT_KEYS = ["preferred_language", "nr:storage-version"];

/** Keys retired by Phase 2: they must never come back. */
const RETIRED_KEYS = ["nr-registered-users", LEGACY_DEMO_COOKIE];

const SECRET_VALUE_PATTERNS: Array<[string, RegExp]> = [
  ["JWT", /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/],
  ["password field", /"(password|passwordHash|tempPassword)"\s*:/i],
  [
    "token field",
    /"(refreshToken|accessToken|refresh_token|access_token|idToken)"\s*:/i,
  ],
  ["challenge or reset id", /"(challengeId|resetId)"\s*:/i],
  ["TOTP secret / otpauth", /otpauth:\/\/|"secret"\s*:/i],
  ["backup codes", /"backupCodes"\s*:/i],
];

/* Synthetic seed identifiers that would be PHI if real (Phase 15 only). */
const SEED_PHI_STRINGS = ["223344", "John Taylor", "Grace Taylor"];

export type StorageRule = {
  /** Phase 15: only KEPT_KEYS may exist, and no seed PHI. */
  strict?: boolean;
  /** Extra strings that must appear nowhere (a throwaway password, a code). */
  forbidStrings?: string[];
};

type Dump = {
  local: Record<string, string>;
  session: Record<string, string>;
  idb: Record<string, string>;
  caches: string[];
  jsCookies: string;
  url: string;
};

export async function dumpStorage(page: Page): Promise<Dump> {
  return page.evaluate(async () => {
    const read = (s: Storage) => {
      const out: Record<string, string> = {};
      for (let i = 0; i < s.length; i++) {
        const k = s.key(i)!;
        out[k] = s.getItem(k) ?? "";
      }
      return out;
    };
    const idb: Record<string, string> = {};
    try {
      const dbs = (await indexedDB.databases?.()) ?? [];
      for (const d of dbs) {
        if (!d.name) continue;
        const db: IDBDatabase = await new Promise((res, rej) => {
          const r = indexedDB.open(d.name!);
          r.onsuccess = () => res(r.result);
          r.onerror = () => rej(r.error);
        });
        for (const store of Array.from(db.objectStoreNames)) {
          const all: unknown[] = await new Promise((res) => {
            const r = db.transaction(store).objectStore(store).getAll();
            r.onsuccess = () => res(r.result);
            r.onerror = () => res([]);
          });
          idb[`${d.name}/${store}`] = JSON.stringify(all);
        }
        db.close();
      }
    } catch {
      /* blocked storage: nothing to read */
    }
    const cacheKeys = "caches" in self ? await caches.keys() : [];
    return {
      local: read(localStorage),
      session: read(sessionStorage),
      idb,
      caches: cacheKeys,
      jsCookies: document.cookie,
      url: location.href,
    };
  });
}

export async function expectCleanStorage(
  page: Page,
  context: BrowserContext,
  rule: StorageRule = {},
): Promise<void> {
  const dump = await dumpStorage(page);
  const problems: string[] = [];
  const passwords = Object.values(ACCOUNTS).map((a) => a.password);
  const forbidden = [
    ...passwords,
    MFA_NURSE_TOTP_SECRET,
    ...(rule.forbidStrings ?? []),
  ];

  const areas = [
    ["localStorage", dump.local],
    ["sessionStorage", dump.session],
    ["indexedDB", dump.idb],
  ] as const;
  for (const [area, kv] of areas) {
    for (const [k, v] of Object.entries(kv)) {
      if (RETIRED_KEYS.includes(k)) problems.push(`${area}: retired key ${k}`);
      if (rule.strict && area === "localStorage" && !KEPT_KEYS.includes(k))
        problems.push(`${area}: unexpected key ${k}`);
      for (const [label, re] of SECRET_VALUE_PATTERNS)
        if (re.test(v)) problems.push(`${area}[${k}]: ${label}`);
      for (const s of forbidden)
        if (s.length >= 6 && v.includes(s))
          problems.push(`${area}[${k}]: a password, secret or code`);
      if (rule.strict)
        for (const s of SEED_PHI_STRINGS)
          if (v.includes(s)) problems.push(`${area}[${k}]: seed PHI`);
    }
  }
  for (const [label, re] of SECRET_VALUE_PATTERNS)
    if (re.test(dump.jsCookies)) problems.push(`document.cookie: ${label}`);
  if (dump.jsCookies.includes(`${LEGACY_DEMO_COOKIE}=`))
    problems.push("document.cookie: the retired demo session cookie");
  for (const s of forbidden)
    if (s.length >= 6 && dump.url.includes(s))
      problems.push("URL: a password, secret or code");
  if (/[?&](token|challengeId|resetId|code)=/i.test(dump.url))
    problems.push("URL: a one-time value in the query");

  for (const c of await context.cookies()) {
    if (/^(access_token|refresh_token)$/.test(c.name) && !c.httpOnly)
      problems.push(`cookie ${c.name} is not httpOnly`);
    if (c.name === LEGACY_DEMO_COOKIE)
      problems.push("cookie jar: the retired demo session cookie");
  }

  expect(problems, `storage dump findings:\n${problems.join("\n")}`).toEqual(
    [],
  );
}
