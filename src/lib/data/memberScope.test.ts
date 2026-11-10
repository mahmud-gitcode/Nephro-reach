import { afterEach, describe, expect, it } from "vitest";
import {
  readJson,
  resolveKey,
  setLocalScope,
  storageKey,
  writeJson,
} from "./storage";
import { DEMO_MEMBER_EMAIL } from "./demoIdentity";
import { LEGACY_SESSION_COOKIE } from "./legacyPurge";

/* The scope comes from the server's /me/context (AuthContext), not from a
   cookie the browser can edit (Phase 2, INT-2). */
function signIn(role: string, email: string) {
  setLocalScope({ role, email });
}

afterEach(() => {
  setLocalScope(null);
  window.localStorage.clear();
});

describe("whose data a key holds", () => {
  /* A member-owned store name: the mechanism under test. Every such store
     but the D8 vitals is retired (P15c retired the appointments). */
  const LOG = storageKey("travel-reflections");

  it("files a member's own log under that member", () => {
    signIn("user", "ana@example.com");
    expect(resolveKey(LOG)).toBe(
      "nr:member:ana@example.com:travel-reflections",
    );
  });

  it("keeps the demo patient's plain key, which the clinic also reads", () => {
    signIn("user", DEMO_MEMBER_EMAIL);
    expect(resolveKey(LOG)).toBe(LOG);
    signIn("clinic", "clinic@nephroreach.com");
    expect(resolveKey(LOG)).toBe(LOG);
  });

  it("leaves shared records shared", () => {
    signIn("user", "ana@example.com");
    expect(resolveKey(storageKey("messaging"))).toBe("nr:messaging");
  });

  it("two members on one browser never read each other's log", async () => {
    signIn("user", "ana@example.com");
    await writeJson(LOG, ["ana's walk"]);
    signIn("user", "ben@example.com");
    expect(await readJson(LOG, [])).toEqual([]);
    signIn("user", "ana@example.com");
    expect(await readJson(LOG, [])).toEqual(["ana's walk"]);
  });
});

/* PM-4 (P15a): the home-HD vitals are filed under the account id, never
   the email. */
describe("the vitals store is keyed by the account id", () => {
  const VITALS = storageKey("dialysis-treatment-vitals");
  const ANA = "0f0f0f0f-0000-4000-8000-0000000000a1";
  const BEN = "0f0f0f0f-0000-4000-8000-0000000000b2";

  it("uses the id the server reported, with no email in the key", () => {
    setLocalScope({ role: "user", email: "ana@example.com", userId: ANA });
    expect(resolveKey(VITALS)).toBe(
      `nr:member-id:${ANA}:dialysis-treatment-vitals`,
    );
    expect(resolveKey(VITALS)).not.toContain("ana@example.com");
    /* The demo patient too: no shared plain copy for a member. */
    setLocalScope({ role: "user", email: DEMO_MEMBER_EMAIL, userId: BEN });
    expect(resolveKey(VITALS)).toBe(
      `nr:member-id:${BEN}:dialysis-treatment-vitals`,
    );
  });

  it("two members never read each other's vitals", async () => {
    setLocalScope({ role: "user", email: "ana@example.com", userId: ANA });
    await writeJson(VITALS, { "2026-11-01": { preWeight: 80 } });
    setLocalScope({ role: "user", email: "ben@example.com", userId: BEN });
    expect(await readJson(VITALS, null)).toBeNull();
    expect(Object.keys(window.localStorage).some((k) => k.includes("@"))).toBe(
      false,
    );
  });

  it("a caregiver reads an empty view, never the member's", () => {
    setLocalScope({ role: "caregiver", email: "c@example.com", userId: ANA });
    expect(resolveKey(VITALS)).toBe(
      "nr:caregiver-none:dialysis-treatment-vitals",
    );
  });
});

describe("the scope cannot be forged from the browser (INT-2)", () => {
  it("ignores a hand-written session cookie", () => {
    /* A member-owned store name: the mechanism under test. Every such store
     but the D8 vitals is retired (P15c retired the appointments). */
    const LOG = storageKey("travel-reflections");
    document.cookie = `${LEGACY_SESSION_COOKIE}=${encodeURIComponent(
      JSON.stringify({ role: "user", email: "victim@example.com", name: "x" }),
    )}; path=/`;
    /* Signed out: the plain key, never the victim's. */
    expect(resolveKey(LOG)).toBe(LOG);
    signIn("user", "ana@example.com");
    expect(resolveKey(LOG)).toBe(
      "nr:member:ana@example.com:travel-reflections",
    );
    document.cookie = `${LEGACY_SESSION_COOKIE}=; path=/; max-age=0`;
  });

  it("normalises the email the server reports", () => {
    signIn("user", " Ana@Example.com ");
    expect(resolveKey(storageKey("travel-reflections"))).toBe(
      "nr:member:ana@example.com:travel-reflections",
    );
  });
});
