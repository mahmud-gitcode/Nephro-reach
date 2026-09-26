import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHARING,
  addUser,
  defaultSettingsActions,
  describeBrowser,
  exportDocument,
  exportFilename,
  keepsAnAdmin,
  loginActivity,
  normaliseSettingsActions,
  passwordError,
  removeUser,
  resendInvite,
  seedUsers,
  sessionsFor,
  setUserStatus,
  userError,
  type ManagedUser,
} from "./settings.actions";

const NOW = new Date("2026-09-26T12:00:00.000Z");

function user(patch: Partial<ManagedUser> & { email: string }): ManagedUser {
  return {
    name: "Someone",
    role: "Staff",
    status: "Active",
    ...patch,
  };
}

describe("adding someone to the office", () => {
  const existing = seedUsers();

  it("needs a name and a usable email", () => {
    expect(userError({ name: "", email: "a@b.com" }, [])).toBe(
      "Enter the person's name.",
    );
    expect(userError({ name: "Angela Brooks", email: "nope" }, [])).toBe(
      "Enter a valid email address.",
    );
    expect(
      userError({ name: "Angela Brooks", email: "a@b.com" }, []),
    ).toBeNull();
  });

  it("refuses an email the office already has, whatever the case", () => {
    // Email is what identifies a person here and what an invite is sent to;
    // two rows sharing one cannot be told apart afterwards.
    const taken = existing[0].email.toUpperCase();
    expect(userError({ name: "Someone Else", email: taken }, existing)).toBe(
      "Someone with that email is already on the list.",
    );
  });

  it("adds them as Pending, never Active", () => {
    // They have not accepted the invite yet. A roster that says Active
    // before a first sign-in is a roster nobody can audit.
    const next = addUser(existing, {
      name: "Angela Brooks",
      email: "abrooks@example.com",
      role: "MA",
    });

    expect(next).toHaveLength(existing.length + 1);
    expect(next.at(-1)).toMatchObject({ status: "Pending", role: "MA" });
    expect(next.at(-1)?.addedAt).toBeTruthy();
  });

  it("trims what it stores", () => {
    const [added] = addUser([], {
      name: "  Angela Brooks  ",
      email: "  abrooks@example.com  ",
      role: "Staff",
    });
    expect(added.name).toBe("Angela Brooks");
    expect(added.email).toBe("abrooks@example.com");
  });
});

describe("not locking the office out of its own portal", () => {
  const office = [
    user({ email: "admin@x.com", role: "Admin" }),
    user({ email: "staff@x.com", role: "Staff" }),
  ];

  it("sees an active admin when there is one", () => {
    expect(keepsAnAdmin(office)).toBe(true);
  });

  it("refuses to call a suspended admin an admin", () => {
    // Suspending the last admin locks everyone out just as surely as
    // removing them, and nobody left can undo either.
    const suspended = setUserStatus(office, "admin@x.com", "Pending");
    expect(keepsAnAdmin(suspended)).toBe(false);
  });

  it("sees the roster losing its last admin to a removal", () => {
    expect(keepsAnAdmin(removeUser(office, "admin@x.com"))).toBe(false);
  });

  it("is happy while a second admin remains", () => {
    const two = [...office, user({ email: "admin2@x.com", role: "Admin" })];
    expect(keepsAnAdmin(removeUser(two, "admin@x.com"))).toBe(true);
  });

  it("changes only the person named", () => {
    const next = setUserStatus(office, "staff@x.com", "Pending");
    expect(next[0].status).toBe("Active");
    expect(next[1].status).toBe("Pending");
  });

  it("stamps a resent invite on the right row", () => {
    const next = resendInvite(office, "staff@x.com");
    expect(next[0].invitedAt).toBeUndefined();
    expect(next[1].invitedAt).toBeTruthy();
  });
});

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
    expect(parsed.users).toHaveLength(actions.users.length);
    expect(parsed.sharing).toEqual(DEFAULT_SHARING);
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
  it("starts from the seeded roster when nothing is stored", () => {
    expect(normaliseSettingsActions(null).users).toHaveLength(
      seedUsers().length,
    );
    expect(normaliseSettingsActions("nonsense").sharing).toEqual(
      DEFAULT_SHARING,
    );
  });

  it("keeps a roster somebody emptied rather than re-seeding it", () => {
    // An empty list is a decision, not a broken record. Re-seeding would
    // resurrect people an office had just removed.
    expect(normaliseSettingsActions({ users: [] }).users).toEqual([]);
  });

  it("drops a row with no name or email and repairs a bad role", () => {
    const read = normaliseSettingsActions({
      users: [
        { email: "a@b.com" },
        { name: "No Email" },
        { name: "Real", email: "r@b.com", role: "Wizard", status: "Odd" },
      ],
    });

    expect(read.users).toHaveLength(1);
    expect(read.users[0]).toMatchObject({ role: "Staff", status: "Active" });
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
