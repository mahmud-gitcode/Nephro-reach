import { afterEach, describe, expect, it } from "vitest";
import { readJson, resolveKey, storageKey, writeJson } from "./storage";
import { DEMO_MEMBER_EMAIL } from "./demoIdentity";

function signIn(role: string, email: string) {
  document.cookie = `nr-session=${encodeURIComponent(
    JSON.stringify({ role, email, name: "x" }),
  )}; path=/`;
}

afterEach(() => {
  document.cookie = "nr-session=; path=/; max-age=0";
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
