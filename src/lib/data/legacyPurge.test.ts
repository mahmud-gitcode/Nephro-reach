import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  isRetiredKey,
  KEPT_KEYS,
  LEGACY_SESSION_COOKIE,
  purgeLegacyStorage,
  RETIRED_STORES,
  STORAGE_VERSION,
  STORAGE_VERSION_KEY,
} from "./legacyPurge";

/* The staged purge removes retired keys only. Live feature keys stay until
   their feature moves to the API (INTEGRATION_PROGRESS deviations). */

const LIVE = [
  /* Home-HD session vitals stay until D8 (retired by Phase 15 at the
     latest): the one remaining member PHI store. */
  "nr:member:new.member@example.test:dialysis-treatment-vitals",
  "nr:dialysis-treatment-vitals",
];

const RETIRED = [
  /* Phase 2: the prototype's accounts with plain-text passwords. */
  "nr-registered-users",
  "nr:medication-mood",
  "nr:member:new.member@example.test:medication-mood",
  "nr:caregiver-none:medication-mood",
  /* Phase 6: medications and member labs moved to the API. */
  "nr:member-medications",
  "nr:medication-doses",
  /* Phase 3: client RBAC, staff list, caregiver grants and viewing. */
  "nr:role-permissions",
  "nr:staff-accounts",
  "nr:caregiver-grants",
  "nr:caregiver-viewing:caregiver@example.test",
  /* Phase 7: dialysis and home dialysis moved to the API. */
  "nr:member:new.member@example.test:dialysis-treatments",
  "nr:dialysis-schedule",
  "nr:dialysis-access-photos",
];

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

function keys(): string[] {
  return Object.keys(window.localStorage).sort();
}

describe("purgeLegacyStorage", () => {
  it("leaves preferred_language, the marker and still-live keys", () => {
    window.localStorage.setItem("preferred_language", "ES");
    for (const key of [...LIVE, ...RETIRED])
      window.localStorage.setItem(key, "[]");

    const result = purgeLegacyStorage();

    expect(result.removed.sort()).toEqual([...RETIRED].sort());
    expect(keys()).toEqual(
      ["preferred_language", STORAGE_VERSION_KEY, ...LIVE].sort(),
    );
    expect(window.localStorage.getItem("preferred_language")).toBe("ES");
    expect(window.localStorage.getItem(STORAGE_VERSION_KEY)).toBe(
      String(STORAGE_VERSION),
    );
  });

  it("is idempotent", () => {
    window.localStorage.setItem("nr:medication-mood", "[]");
    purgeLegacyStorage();
    const after = keys();
    expect(purgeLegacyStorage().removed).toEqual([]);
    expect(keys()).toEqual(after);
  });

  it("does not throw when storage is blocked", () => {
    const blocked = {
      get length(): number {
        throw new DOMException("blocked", "SecurityError");
      },
    } as unknown as Storage;
    expect(() => purgeLegacyStorage(blocked)).not.toThrow();
    expect(() => purgeLegacyStorage(null)).not.toThrow();
  });
});

describe("the registry", () => {
  it("never retires a kept key", () => {
    for (const key of KEPT_KEYS) expect(isRetiredKey(key)).toBe(false);
  });

  it("matches only whole store names", () => {
    expect(isRetiredKey("nr:medication-mood-extra")).toBe(false);
    expect(isRetiredKey("other:medication-mood")).toBe(false);
  });

  it("explains why each retired store is safe to delete", () => {
    for (const store of RETIRED_STORES) {
      expect(store.why.length).toBeGreaterThan(20);
      expect(store.since).toBeLessThanOrEqual(STORAGE_VERSION);
    }
  });
});

/* Phase 2 (ADR 0006 step 2): demo credentials and the editable demo session
   must not survive in a browser that used the prototype, and must not come
   back when an old tab writes them again. */
describe("Phase 2: demo credentials and the demo session", () => {
  const forgedAdmin = encodeURIComponent(
    JSON.stringify({ email: "x@example.test", name: "x", role: "admin" }),
  );

  function seedLegacy() {
    document.cookie = `${LEGACY_SESSION_COOKIE}=${forgedAdmin}; path=/`;
    window.localStorage.setItem(
      "nr-registered-users",
      JSON.stringify([
        { email: "a@example.test", password: "secret-1", role: "user" },
      ]),
    );
    window.localStorage.setItem(
      "nr:staff-accounts",
      JSON.stringify([
        { id: "s1", email: "s1@example.test", password: "staff-pass" },
        { id: "s2", email: "s2@example.test" },
      ]),
    );
  }

  function assertClean() {
    expect(document.cookie).not.toContain(`${LEGACY_SESSION_COOKIE}=`);
    expect(window.localStorage.getItem("nr-registered-users")).toBeNull();
    /* Phase 3 retired the whole staff list (it was stripped in Phase 2). */
    expect(window.localStorage.getItem("nr:staff-accounts")).toBeNull();
  }

  it("expires the cookie, drops stored accounts and the staff list", () => {
    seedLegacy();
    const result = purgeLegacyStorage();
    assertClean();
    expect(result.removed).toContain("nr-registered-users");
    expect(result.removed).toContain("nr:staff-accounts");
    expect(result.version).toBe(STORAGE_VERSION);
  });

  it("purges again when an old tab writes them back", () => {
    seedLegacy();
    purgeLegacyStorage();
    seedLegacy();
    purgeLegacyStorage();
    assertClean();
  });

  it("removes an unreadable staff list rather than keep what it cannot check", () => {
    window.localStorage.setItem("nr:staff-accounts", "{not json");
    purgeLegacyStorage();
    expect(window.localStorage.getItem("nr:staff-accounts")).toBeNull();
  });
});
