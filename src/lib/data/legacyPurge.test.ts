import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  isRetiredKey,
  KEPT_KEYS,
  purgeLegacyStorage,
  RETIRED_STORES,
  STORAGE_VERSION,
  STORAGE_VERSION_KEY,
} from "./legacyPurge";

/* The staged purge removes retired keys only. Live feature keys stay until
   their feature moves to the API (INTEGRATION_PROGRESS deviations). */

const LIVE = [
  "nr:blood-pressure-readings",
  "nr:member:new.member@example.test:weight-fluid-log",
  "nr:caregiver-grants",
  "nr:dialysis-schedule",
  "nr-registered-users",
  "nr:medication-doses",
];

const RETIRED = [
  "nr:medication-mood",
  "nr:member:new.member@example.test:medication-mood",
  "nr:caregiver-none:medication-mood",
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
