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
     same change that moves the feature to the API (Phase 2 adds the demo
     credentials and the `nr-session` cookie);
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
export const STORAGE_VERSION = 1;

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

/** Exact keys (not member stores) that are retired. Phase 2 adds the demo
 *  credentials here (`nr-registered-users`, staff accounts). */
export const RETIRED_KEYS: readonly string[] = [];

/** Cookies to expire. Phase 2 adds `nr-session` when demo auth goes. */
export const RETIRED_COOKIES: readonly string[] = [];

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
