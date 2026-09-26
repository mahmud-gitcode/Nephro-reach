import { officeUsers, type OfficeUser, type UserStatus } from "./settings.data";

/* ==========================================================================
   Clinic Settings — what the buttons actually do
   --------------------------------------------------------------------------
   Nine controls on Settings rendered and did nothing: Add User, the row
   menu, Change Password, Two-Factor, Active Sessions, Login Activity, and
   the three under Data & Privacy. They are wired here, front end only.

   There is no auth service, so "change password" cannot check the old one
   and "sign out a session" cannot revoke a token. Those record the act and
   the date, which is what the page can honestly show. The two that ARE
   complete without a server are the data export — a file built in the
   browser is a real file — and every preference toggle.
   ========================================================================== */

export type OfficeRole = OfficeUser["role"];

export const OFFICE_ROLES: OfficeRole[] = [
  "Admin",
  "Provider",
  "Staff",
  "Coordinator",
  "MA",
];

/**
 * A user the clinic can act on.
 *
 * `id` is the email, because that is what actually identifies a person in
 * an office portal and what an invite is sent to. Two rows cannot share one.
 */
export interface ManagedUser extends OfficeUser {
  /** ISO 8601, set when the row was added here rather than seeded. */
  addedAt?: string;
  /** ISO 8601, set when an invite was last sent again. */
  invitedAt?: string;
}

export type UserAction = "activate" | "suspend" | "resend" | "remove";

/** The seeded roster, as the starting point for a clinic's own edits. */
export function seedUsers(): ManagedUser[] {
  return officeUsers.map((user) => ({ ...user }));
}

/** Why a new user cannot be added, or null when they can. */
export function userError(
  draft: { name: string; email: string },
  existing: ManagedUser[],
): string | null {
  if (draft.name.trim().length < 2) return "Enter the person's name.";

  const email = draft.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
  }
  if (existing.some((user) => user.email.toLowerCase() === email)) {
    return "Someone with that email is already on the list.";
  }
  return null;
}

export function addUser(
  users: ManagedUser[],
  draft: { name: string; email: string; role: OfficeRole },
): ManagedUser[] {
  /* Pending, not Active. An invited person has not accepted yet, and a
     roster that says Active before they have logged in once is a roster
     nobody can audit. */
  return [
    ...users,
    {
      name: draft.name.trim(),
      email: draft.email.trim(),
      role: draft.role,
      status: "Pending" as UserStatus,
      addedAt: new Date().toISOString(),
    },
  ];
}

export function setUserStatus(
  users: ManagedUser[],
  email: string,
  status: UserStatus,
): ManagedUser[] {
  return users.map((user) =>
    user.email === email ? { ...user, status } : user,
  );
}

export function resendInvite(
  users: ManagedUser[],
  email: string,
): ManagedUser[] {
  return users.map((user) =>
    user.email === email
      ? { ...user, invitedAt: new Date().toISOString() }
      : user,
  );
}

export function removeUser(users: ManagedUser[], email: string): ManagedUser[] {
  return users.filter((user) => user.email !== email);
}

/**
 * Whether the roster would still have an admin after a change.
 *
 * An office that removes or suspends its last admin locks itself out of its
 * own portal, and no one left can undo it. The dialog refuses rather than
 * asking the person to be careful.
 */
export function keepsAnAdmin(users: ManagedUser[]): boolean {
  return users.some(
    (user) => user.role === "Admin" && user.status === "Active",
  );
}

/* --------------------------------------------------------------------------
   Security
   -------------------------------------------------------------------------- */

export type TwoFactorMethod = "app" | "sms";

export interface SecurityState {
  /** ISO 8601, or empty when never changed here. */
  passwordChangedAt: string;
  twoFactor: TwoFactorMethod | null;
  /** Session ids the clinic has signed out from this page. */
  signedOutSessions: string[];
}

export const EMPTY_SECURITY: SecurityState = {
  passwordChangedAt: "",
  twoFactor: null,
  signedOutSessions: [],
};

/**
 * Why a new password is not acceptable, or null when it is.
 *
 * Length first, because it is the rule that actually matters; the character
 * classes are the ones an office's own IT policy will expect to see.
 */
export function passwordError(next: string, confirm: string): string | null {
  if (next.length < 12) return "Use at least 12 characters.";
  if (!/[a-z]/.test(next) || !/[A-Z]/.test(next)) {
    return "Use both upper and lower case.";
  }
  if (!/\d/.test(next)) return "Include a number.";
  if (next !== confirm) return "The two passwords do not match.";
  return null;
}

export interface Session {
  id: string;
  device: string;
  location: string;
  /** ISO 8601. */
  lastSeen: string;
  current: boolean;
}

/** The demo session list, with this browser as the current one. */
export function sessionsFor(userAgent: string, now: Date): Session[] {
  return [
    {
      id: "current",
      device: describeBrowser(userAgent),
      location: "This device",
      lastSeen: now.toISOString(),
      current: true,
    },
    {
      id: "phone",
      device: "iPhone · Safari",
      location: "Tampa, FL",
      lastSeen: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      current: false,
    },
    {
      id: "front-desk",
      device: "Windows · Edge",
      location: "Front desk",
      lastSeen: new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString(),
      current: false,
    },
  ];
}

/** A readable name for the browser, from its user agent. */
export function describeBrowser(userAgent: string): string {
  const os = /Windows/.test(userAgent)
    ? "Windows"
    : /Mac/.test(userAgent)
      ? "macOS"
      : /Android/.test(userAgent)
        ? "Android"
        : /iPhone|iPad/.test(userAgent)
          ? "iOS"
          : "Unknown";

  /* Order matters: Edge and Chrome both claim to be Chrome, and Chrome
     claims to be Safari. Most specific first. */
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Chrome\//.test(userAgent)
      ? "Chrome"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : "Browser";

  return `${os} · ${browser}`;
}

export interface LoginEvent {
  id: string;
  who: string;
  device: string;
  /** ISO 8601. */
  at: string;
  ok: boolean;
}

/** Recent sign-ins, most recent first. */
export function loginActivity(now: Date): LoginEvent[] {
  const hoursAgo = (hours: number) =>
    new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

  return [
    {
      id: "1",
      who: "Dr. Melissa Carter",
      device: "Windows · Edge",
      at: hoursAgo(1),
      ok: true,
    },
    {
      id: "2",
      who: "James Wilson, RN",
      device: "iPhone · Safari",
      at: hoursAgo(5),
      ok: true,
    },
    {
      id: "3",
      who: "Tiffany Moore",
      device: "macOS · Chrome",
      at: hoursAgo(27),
      ok: true,
    },
    {
      id: "4",
      who: "Unknown",
      device: "Windows · Chrome",
      at: hoursAgo(50),
      ok: false,
    },
  ];
}

/* --------------------------------------------------------------------------
   Data & privacy
   -------------------------------------------------------------------------- */

export const SHARING_OPTIONS = [
  {
    id: "analytics",
    label: "Usage analytics",
    note: "Anonymous counts of which pages your office uses.",
  },
  {
    id: "outcomes",
    label: "Aggregate outcomes",
    note: "De-identified education outcomes, pooled across clinics.",
  },
  {
    id: "research",
    label: "Research partnerships",
    note: "De-identified data shared with named research partners.",
  },
] as const;

export type SharingId = (typeof SHARING_OPTIONS)[number]["id"];

export type SharingState = Record<SharingId, boolean>;

/**
 * Everything off by default.
 *
 * Sharing patient-derived data is a decision a clinic makes, never one it
 * discovers it already made. Opt-in is the only defensible default in a
 * HIPAA-scoped product.
 */
export const DEFAULT_SHARING: SharingState = {
  analytics: false,
  outcomes: false,
  research: false,
};

/** Everything this page records locally. One record, one key. */
export interface SettingsActions {
  users: ManagedUser[];
  security: SecurityState;
  sharing: SharingState;
  updatedAt: string;
}

export function defaultSettingsActions(): SettingsActions {
  return {
    users: seedUsers(),
    security: { ...EMPTY_SECURITY },
    sharing: { ...DEFAULT_SHARING },
    updatedAt: "",
  };
}

/** Read the stored record back, repairing anything unusable. */
export function normaliseSettingsActions(stored: unknown): SettingsActions {
  const base = defaultSettingsActions();
  if (!stored || typeof stored !== "object") return base;

  const raw = stored as Partial<SettingsActions>;

  const users = Array.isArray(raw.users)
    ? raw.users.flatMap((value) => {
        if (!value || typeof value !== "object") return [];
        const user = value as Partial<ManagedUser>;
        if (typeof user.email !== "string" || typeof user.name !== "string") {
          return [];
        }

        return [
          {
            name: user.name,
            email: user.email,
            role: OFFICE_ROLES.includes(user.role as OfficeRole)
              ? (user.role as OfficeRole)
              : "Staff",
            status: user.status === "Pending" ? "Pending" : "Active",
            addedAt:
              typeof user.addedAt === "string" ? user.addedAt : undefined,
            invitedAt:
              typeof user.invitedAt === "string" ? user.invitedAt : undefined,
          } satisfies ManagedUser,
        ];
      })
    : base.users;

  const security = raw.security as Partial<SecurityState> | undefined;
  const sharing = raw.sharing as Partial<SharingState> | undefined;

  return {
    /* An empty stored roster is a roster somebody emptied, not a broken
       record, so it is kept rather than re-seeded. */
    users,
    security: {
      passwordChangedAt:
        typeof security?.passwordChangedAt === "string"
          ? security.passwordChangedAt
          : "",
      twoFactor:
        security?.twoFactor === "app" || security?.twoFactor === "sms"
          ? security.twoFactor
          : null,
      signedOutSessions: Array.isArray(security?.signedOutSessions)
        ? security.signedOutSessions.filter(
            (id): id is string => typeof id === "string",
          )
        : [],
    },
    sharing: {
      analytics: sharing?.analytics === true,
      outcomes: sharing?.outcomes === true,
      research: sharing?.research === true,
    },
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "",
  };
}

/* --------------------------------------------------------------------------
   The data export
   -------------------------------------------------------------------------- */

/**
 * Everything this office has set, as JSON.
 *
 * Genuinely complete without a server: the file is built in the browser
 * from what the browser already holds. Nothing patient-identifying is in
 * it, because none of it lives in these records.
 */
export function exportDocument(
  settings: unknown,
  actions: SettingsActions,
  exportedAt = new Date(),
): string {
  return JSON.stringify(
    {
      exportedAt: exportedAt.toISOString(),
      source: "NephroReach clinic portal",
      settings,
      users: actions.users,
      security: {
        /* The record of WHEN, never a password or a secret — neither is
           held here, and an export is exactly where one would leak. */
        passwordChangedAt: actions.security.passwordChangedAt,
        twoFactor: actions.security.twoFactor,
      },
      sharing: actions.sharing,
    },
    null,
    2,
  );
}

/** The filename a downloaded export lands under, dated so two do not clash. */
export function exportFilename(exportedAt = new Date()): string {
  return `nephroreach-settings-${exportedAt.toISOString().slice(0, 10)}.json`;
}
