/* ==========================================================================
   Legacy storage purge (staged; ADR 0007, INTEGRATION_PROGRESS deviations)
   --------------------------------------------------------------------------
   The prototype kept patient data, demo passwords and a demo session in
   this browser. As each part moves to the API, its old keys must go, so no
   stale health data or credential lingers in a browser that used the
   prototype.

   It is staged on purpose. Until a feature moves to the API, its
   localStorage key IS its data, so purging every `nr:*` key now would break
   live screens. Instead:
   - a registry lists RETIRED keys; a phase adds its feature's keys in the
     same change that moves the feature to the API (Phase 2 added the demo
     credentials and the demo session cookie, and strips the demo passwords
     from the staff accounts that stay live until Phase 3);
   - the purge removes only retired keys, in every per-member and
     per-caregiver variant, and never a live one;
   - `preferred_language` and the version marker are always kept.
   The end state (Phase 15) is: only `preferred_language` and the marker.

   It runs on boot, sign-in and sign-out. It is cheap and idempotent, so it
   runs every time rather than only when the marker is old: an older tab can
   still write a retired key after this tab purged it.
   ========================================================================== */

/** Survives every purge. */
export const STORAGE_VERSION_KEY = "nr:storage-version";

/** Bumped whenever the registry below grows. */
export const STORAGE_VERSION = 2;

/** Never removed. */
export const KEPT_KEYS: readonly string[] = [
  "preferred_language",
  STORAGE_VERSION_KEY,
];

type RetiredStore = {
  /** The store name, as passed to storageKey() (without `nr:`). */
  name: string;
  /** STORAGE_VERSION that retired it. */
  since: number;
  /** Why it is safe to delete: the evidence it is dead. */
  why: string;
};

/**
 * Member stores no screen reads or writes any more. Each name removes
 * `nr:<name>`, the per-member copies `nr:member:<email>:<name>` and the
 * caregiver's empty view `nr:caregiver-none:<name>`.
 */
export const RETIRED_STORES: readonly RetiredStore[] = [
  {
    name: "medication-mood",
    since: 1,
    why: "Mood section removed from the medications page (PROJECT_AUDIT §14). No component reads moodEntries/moodOn or calls saveMoodEntry; whether mood returns is D8, and it would come from the API, never from this key.",
  },
];

/** The prototype's demo session: an unsigned, editable JSON cookie that
 *  decided who was signed in. Retired in Phase 2 (`GET /me/context` is the
 *  session source); expired here and by the proxy. */
export const LEGACY_SESSION_COOKIE = "nr-session";

/** Exact keys (not member stores) that are retired. */
export const RETIRED_KEYS: readonly string[] = [
  /* Phase 2: the prototype's registered accounts, with plain-text
     passwords. Sign-up goes to POST /auth/register now. */
  "nr-registered-users",
];

/** Cookies to expire. */
export const RETIRED_COOKIES: readonly string[] = [LEGACY_SESSION_COOKIE];

/**
 * Stores that stay live but must lose fields: `nr:staff-accounts` still
 * feeds the staff team screen until FE-ORG moves it to the API in Phase 3,
 * but its demo `password` fields go now (Phase 2). Each entry names the key
 * and the fields stripped from every object in its array.
 */
export const STRIPPED_FIELDS: readonly { key: string; fields: string[] }[] = [
  { key: "nr:staff-accounts", fields: ["password"] },
];

/** Whether a localStorage key belongs to a retired store or is retired. */
export function isRetiredKey(key: string): boolean {
  if (KEPT_KEYS.includes(key)) return false;
  if (RETIRED_KEYS.includes(key)) return true;
  if (!key.startsWith("nr:")) return false;
  return RETIRED_STORES.some(
    ({ name }) =>
      key === `nr:${name}` ||
      key === `nr:caregiver-none:${name}` ||
      (key.startsWith("nr:member:") && key.endsWith(`:${name}`)),
  );
}

export type PurgeResult = { removed: string[]; version: number };

/** Removes `fields` from each object in the JSON array at `key`. Returns
 *  whether anything changed. Unreadable data is removed outright: it may
 *  hold a field this cannot see. */
function stripFields(storage: Storage, key: string, fields: string[]): boolean {
  const raw = storage.getItem(key);
  if (raw === null) return false;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    storage.removeItem(key);
    return true;
  }
  if (!Array.isArray(parsed)) {
    storage.removeItem(key);
    return true;
  }
  let changed = false;
  const cleaned = parsed.map((item: unknown) => {
    if (!item || typeof item !== "object") return item;
    const copy = { ...(item as Record<string, unknown>) };
    for (const field of fields) {
      if (field in copy) {
        delete copy[field];
        changed = true;
      }
    }
    return copy;
  });
  if (changed) storage.setItem(key, JSON.stringify(cleaned));
  return changed;
}

function storageOrNull(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Removes every retired key and cookie and writes the version marker.
 * Never throws: blocked storage simply has nothing to purge.
 */
export function purgeLegacyStorage(
  storage: Storage | null = storageOrNull(),
): PurgeResult {
  const removed: string[] = [];
  if (storage) {
    try {
      const keys: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key !== null) keys.push(key);
      }
      for (const key of keys) {
        if (isRetiredKey(key)) {
          storage.removeItem(key);
          removed.push(key);
        }
      }
      for (const { key, fields } of STRIPPED_FIELDS) {
        if (stripFields(storage, key, fields)) removed.push(`${key}#fields`);
      }
      storage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
    } catch {
      /* Blocked or full storage: nothing more we can do here. */
    }
  }
  if (typeof document !== "undefined") {
    for (const name of RETIRED_COOKIES) {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    }
  }
  return { removed, version: STORAGE_VERSION };
}
