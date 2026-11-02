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
  const LOG = storageKey("exercise-log");

  it("files a member's own log under that member", () => {
    signIn("user", "ana@example.com");
    expect(resolveKey(LOG)).toBe("nr:member:ana@example.com:exercise-log");
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

describe("the scope cannot be forged from the browser (INT-2)", () => {
  it("ignores a hand-written session cookie", () => {
    const LOG = storageKey("exercise-log");
    document.cookie = `${LEGACY_SESSION_COOKIE}=${encodeURIComponent(
      JSON.stringify({ role: "user", email: "victim@example.com", name: "x" }),
    )}; path=/`;
    /* Signed out: the plain key, never the victim's. */
    expect(resolveKey(LOG)).toBe(LOG);
    signIn("user", "ana@example.com");
    expect(resolveKey(LOG)).toBe("nr:member:ana@example.com:exercise-log");
    document.cookie = `${LEGACY_SESSION_COOKIE}=; path=/; max-age=0`;
  });

  it("normalises the email the server reports", () => {
    signIn("user", " Ana@Example.com ");
    expect(resolveKey(storageKey("exercise-log"))).toBe(
      "nr:member:ana@example.com:exercise-log",
    );
  });
});
