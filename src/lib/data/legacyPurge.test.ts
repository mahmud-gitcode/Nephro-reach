import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  isRetiredKey,
  KEPT_KEYS,
  LEGACY_SESSION_COOKIE,
  purgeLegacyStorage,
  purgeSignOutStores,
  RETIRED_STORES,
  SIGN_OUT_STORES,
  STORAGE_VERSION,
  STORAGE_VERSION_KEY,
} from "./legacyPurge";

/* The staged purge removes retired keys only. Live feature keys stay until
   their feature moves to the API (INTEGRATION_PROGRESS deviations). */

const LIVE = [
  /* Home-HD session vitals stay until D8: the one remaining member PHI
     store, filed under the account id (PM-4) and removed on sign-out by
     purgeSignOutStores, not by the boot purge. */
  "nr:member-id:0f0f0f0f-0000-4000-8000-000000000001:dialysis-treatment-vitals",
  "nr:dialysis-treatment-vitals",
];

const RETIRED = [
  /* PM-4: the email-keyed copy of the home-HD vitals. */
  "nr:member:new.member@example.test:dialysis-treatment-vitals",
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
  /* Phase 11: messaging, outside shares and support moved to the API. */
  "nr:messaging",
  "nr:outside-shares",
  "nr:support-tickets",
  /* Phase 10: vascular access, rides and referrals moved to the API. */
  "nr:vascular-access",
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
    for (const store of [...RETIRED_STORES, ...SIGN_OUT_STORES]) {
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

/* PM-4 (P15a, D8 stays open): the home-HD vitals never outlive the session
   that wrote them, and no key carries an email. */
describe("PM-4: sign-out stores", () => {
  const VITALS = [
    "nr:member-id:0f0f0f0f-0000-4000-8000-000000000001:dialysis-treatment-vitals",
    "nr:member-id:0f0f0f0f-0000-4000-8000-000000000002:dialysis-treatment-vitals",
    "nr:member:new.member@example.test:dialysis-treatment-vitals",
    "nr:dialysis-treatment-vitals",
    "nr:caregiver-none:dialysis-treatment-vitals",
  ];

  it("removes every copy of the vitals and nothing else", () => {
    window.localStorage.setItem("preferred_language", "ES");
    window.localStorage.setItem("nr:member-appointments", "[]");
    for (const key of VITALS) window.localStorage.setItem(key, "{}");
    expect(purgeSignOutStores().sort()).toEqual([...VITALS].sort());
    expect(keys()).toEqual(["nr:member-appointments", "preferred_language"]);
  });

  it("matches the store name whole", () => {
    window.localStorage.setItem("nr:dialysis-treatment-vitals-extra", "{}");
    window.localStorage.setItem("nr:member-id:x:dialysis-treatments", "{}");
    expect(purgeSignOutStores()).toEqual([]);
  });

  it("the boot purge drops the old email-keyed copy (no email left in a key)", () => {
    window.localStorage.setItem(
      "nr:member:new.member@example.test:dialysis-treatment-vitals",
      JSON.stringify({ "2026-11-01": { preWeight: 80 } }),
    );
    purgeLegacyStorage();
    expect(keys().some((k) => k.includes("@"))).toBe(false);
  });

  it("does not throw when storage is blocked", () => {
    const blocked = {
      get length(): number {
        throw new DOMException("blocked", "SecurityError");
      },
    } as unknown as Storage;
    expect(purgeSignOutStores(blocked)).toEqual([]);
    expect(purgeSignOutStores(null)).toEqual([]);
  });
});
