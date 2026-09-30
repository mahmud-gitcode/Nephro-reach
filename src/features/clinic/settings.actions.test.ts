import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHARING,
  defaultSettingsActions,
  describeBrowser,
  exportDocument,
  exportFilename,
  loginActivity,
  normaliseSettingsActions,
  passwordError,
  sessionsFor,
} from "./settings.actions";

const NOW = new Date("2026-09-26T12:00:00.000Z");

describe("what makes a password acceptable", () => {
  it("wants length above all", () => {
    expect(passwordError("Ab1", "Ab1")).toBe("Use at least 12 characters.");
  });

  it("wants both cases and a number", () => {
    expect(passwordError("abcdefghijkl1", "abcdefghijkl1")).toBe(
      "Use both upper and lower case.",
    );
    expect(passwordError("Abcdefghijkl", "Abcdefghijkl")).toBe(
      "Include a number.",
    );
  });

  it("catches a mistyped confirmation", () => {
    expect(passwordError("Abcdefghijk1", "Abcdefghijk2")).toBe(
      "The two passwords do not match.",
    );
  });

  it("accepts one that meets every rule", () => {
    expect(passwordError("Abcdefghijk1", "Abcdefghijk1")).toBeNull();
  });
});

describe("sessions and sign-ins", () => {
  it("names the browser most-specific first", () => {
    // Edge and Chrome both claim Chrome, and Chrome claims Safari; testing
    // in the wrong order labels every Edge user as a Chrome user.
    const edge =
      "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120 Safari/537.36 Edg/120";
    const chrome =
      "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36";
    const safari =
      "Mozilla/5.0 (iPhone) AppleWebKit/605.1 Version/17 Safari/605";

    expect(describeBrowser(edge)).toBe("Windows · Edge");
    expect(describeBrowser(chrome)).toBe("macOS · Chrome");
    expect(describeBrowser(safari)).toBe("iOS · Safari");
  });

  it("does not guess at a user agent it cannot read", () => {
    expect(describeBrowser("")).toBe("Unknown · Browser");
  });

  it("marks exactly one session as this device", () => {
    const sessions = sessionsFor("Mozilla/5.0 (Windows NT 10.0)", NOW);
    expect(sessions.filter((entry) => entry.current)).toHaveLength(1);
    expect(sessions[0].current).toBe(true);
  });

  it("lists sign-ins newest first, failures included", () => {
    // A failed sign-in is the one worth seeing, so it must not be filtered.
    const events = loginActivity(NOW);
    const times = events.map((event) => event.at);

    expect([...times].sort().reverse()).toEqual(times);
    expect(events.some((event) => !event.ok)).toBe(true);
  });
});

describe("the data export", () => {
  it("carries the settings, roster and choices", () => {
    const actions = defaultSettingsActions();
    const parsed = JSON.parse(
      exportDocument({ profile: { name: "Sunshine" } }, actions, NOW),
    );

    expect(parsed.exportedAt).toBe(NOW.toISOString());
    expect(parsed.settings.profile.name).toBe("Sunshine");
    expect(parsed.staff).toEqual([]);
    expect(parsed.sharing).toEqual(DEFAULT_SHARING);
  });

  it("lists staff without their passwords", () => {
    const parsed = JSON.parse(
      exportDocument({}, defaultSettingsActions(), NOW, [
        {
          name: "Ann Lee",
          email: "ann@x.com",
          role: "Nurse",
          status: "Active",
          password: "secret",
        } as never,
      ]),
    );
    expect(parsed.staff).toEqual([
      { name: "Ann Lee", email: "ann@x.com", role: "Nurse", status: "Active" },
    ]);
  });

  it("never carries a secret, only the date one changed", () => {
    // An export is exactly where a credential would leak, so the shape is
    // asserted rather than assumed.
    const parsed = JSON.parse(
      exportDocument({}, defaultSettingsActions(), NOW),
    );
    expect(Object.keys(parsed.security).sort()).toEqual([
      "passwordChangedAt",
      "twoFactor",
    ]);
  });

  it("dates the filename so two exports do not collide", () => {
    expect(exportFilename(NOW)).toBe("nephroreach-settings-2026-09-26.json");
  });
});

describe("reading the stored record back", () => {
  it("starts from the defaults when nothing is stored", () => {
    expect(normaliseSettingsActions("nonsense").sharing).toEqual(
      DEFAULT_SHARING,
    );
  });

  it("defaults every sharing choice to off", () => {
    // Opt-in is the only defensible default for patient-derived data: a
    // clinic makes that decision, it does not discover it already made it.
    const read = normaliseSettingsActions({ sharing: { analytics: "yes" } });
    expect(read.sharing).toEqual(DEFAULT_SHARING);
  });

  it("refuses a two-factor method it does not recognise", () => {
    expect(
      normaliseSettingsActions({ security: { twoFactor: "carrier pigeon" } })
        .security.twoFactor,
    ).toBeNull();
    expect(
      normaliseSettingsActions({ security: { twoFactor: "app" } }).security
        .twoFactor,
    ).toBe("app");
  });
});
