import {
  findLogin,
  organization,
  type StaffRole,
} from "@/features/staff/staff";
import { readStaffForLogin } from "@/features/staff/staff.repository";
import { DEMO_MEMBER_EMAIL, DEMO_MEMBER_NAME } from "@/lib/data/demoIdentity";

/* "access" is a Vascular Access Center: its own organisation, which shares
   each patient's access record with the dialysis clinic (2026-09-30).
   "nephrology" is a nephrology office (client, 2026-10-03: each office has
   its own login): CCM, and its messages with the access center. */
export type UserRole = "admin" | "user" | "clinic" | "access" | "nephrology";

export type AuthUser = {
  email: string;
  name: string;
  role: UserRole;
  /** Staff only: the organisation they work for, and their role there,
   *  which decides what they may do (features/staff/staff.ts). */
  org?: string;
  staffRole?: StaffRole;
};

export const AUTH_COOKIE = "nr-session";
export const AUTH_USERS_KEY = "nr-registered-users";

export const ADMIN_HOME = "/dashboard";
export const USER_HOME = "/dashboard";
/* A clinic never sees the shared /dashboard page — every one of its routes,
   its own dashboard included, lives under this prefix. */
export const CLINIC_HOME = "/dashboard/clinic";
/* Likewise for an access center, under its own prefix. */
export const ACCESS_HOME = "/dashboard/access-center";
/* A nephrology office opens on the clinic dashboard it shares
   (client, 2026-10-05: it has everything the clinic has but travel). */
export const NEPHROLOGY_HOME = "/dashboard/clinic";

const ADMIN_PREFIXES = [
  "/dashboard/members",
  "/dashboard/manage-curriculum",
  "/dashboard/manage-library",
  "/dashboard/manage-table-talk",
  "/dashboard/live-class",
  "/dashboard/sms-analytics",
  "/dashboard/subscriptions",
  "/dashboard/admin-reviews",
  "/dashboard/admin-testimonials",
  "/dashboard/admin-community",
  "/dashboard/design-system",
  "/dashboard/admin-support",
];

export const CLINIC_PREFIX = "/dashboard/clinic";
export const ACCESS_PREFIX = "/dashboard/access-center";
export const NEPHROLOGY_PREFIX = "/dashboard/nephrology";
const NEPHROLOGY_EXCLUDED = [
  "/dashboard/clinic/travel",
  "/dashboard/clinic/messages",
  "/dashboard/clinic/settings",
  "/dashboard/clinic/team",
];

export const DEMO_ACCOUNTS = [
  {
    email: "admin@nephroreach.com",
    password: "admin123",
    name: "Jenny Wilson",
    role: "admin" as const,
  },
  {
    email: DEMO_MEMBER_EMAIL,
    password: "user123",
    name: DEMO_MEMBER_NAME,
    role: "user" as const,
  },
  {
    email: "clinic@nephroreach.com",
    password: "clinic123",
    name: "Riverside Dialysis Center",
    role: "clinic" as const,
  },
  {
    email: "access@nephroreach.com",
    password: "access123",
    name: "Metro Vascular Access Center",
    role: "access" as const,
  },
  {
    email: "nephrology@nephroreach.com",
    password: "nephrology123",
    name: "Riverside Nephrology Associates",
    role: "nephrology" as const,
  },
];

export function homeForRole(role: UserRole) {
  if (role === "clinic") return CLINIC_HOME;
  if (role === "access") return ACCESS_HOME;
  if (role === "nephrology") return NEPHROLOGY_HOME;
  return role === "admin" ? ADMIN_HOME : USER_HOME;
}

export function isAdminRoute(pathname: string) {
  return ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isClinicRoute(pathname: string) {
  return pathname === CLINIC_PREFIX || pathname.startsWith(`${CLINIC_PREFIX}/`);
}

export function isAccessCenterRoute(pathname: string) {
  return pathname === ACCESS_PREFIX || pathname.startsWith(`${ACCESS_PREFIX}/`);
}

export function isNephrologyRoute(pathname: string) {
  return (
    pathname === NEPHROLOGY_PREFIX ||
    pathname.startsWith(`${NEPHROLOGY_PREFIX}/`)
  );
}

export function canAccessPath(role: UserRole, pathname: string) {
  if (!pathname.startsWith("/dashboard")) return true;
  /* An access center sees its own routes and nothing else. */
  if (isAccessCenterRoute(pathname)) return role === "access";
  /* …and the shared contract page (2026-10-06). No reports: the client
     took them off the access dashboard (2026-10-07). */
  if (role === "access") {
    return pathname === "/dashboard/clinic/billing";
  }
  /* A nephrology office: its own routes, and the clinic's pages except
     the dialysis center's own (travel, its patient inbox, its settings and
     staff — the office has its own staff page). */
  if (isNephrologyRoute(pathname)) return role === "nephrology";
  if (role === "nephrology") {
    return (
      isClinicRoute(pathname) &&
      !NEPHROLOGY_EXCLUDED.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      )
    );
  }
  /* Checked first: the clinic prefix sits under /dashboard, so the shared
     and admin rules below would otherwise claim it. */
  if (isClinicRoute(pathname)) return role === "clinic";
  /* /dashboard itself is shared by admin and member. A clinic is sent to
     its own home instead — it has no page there. */
  if (pathname === "/dashboard" || pathname === "/dashboard/")
    return role !== "clinic";
  if (isAdminRoute(pathname)) return role === "admin";
  return role === "user";
}

export function serializeSession(user: AuthUser) {
  return encodeURIComponent(JSON.stringify(user));
}

export function parseSession(
  value: string | undefined | null,
): AuthUser | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as AuthUser;
    if (
      typeof parsed.email === "string" &&
      typeof parsed.name === "string" &&
      (parsed.role === "admin" ||
        parsed.role === "user" ||
        parsed.role === "clinic" ||
        parsed.role === "access" ||
        parsed.role === "nephrology")
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function readSessionFromDocument(): AuthUser | null {
  if (typeof document === "undefined") return null;
  const row = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${AUTH_COOKIE}=`));
  if (!row) return null;
  return parseSession(row.slice(AUTH_COOKIE.length + 1));
}

export function writeSessionCookie(user: AuthUser) {
  document.cookie = `${AUTH_COOKIE}=${serializeSession(user)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearSessionCookie() {
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
}

type StoredAccount = {
  email: string;
  password: string;
  name: string;
  role: UserRole;
};

function readRegisteredUsers(): StoredAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRegisteredUsers(users: StoredAccount[]) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

/** Emails already used by a demo login or a member account, which a new
 *  staff account may not take. */
export function nonStaffEmailsInUse(): string[] {
  return [
    ...DEMO_ACCOUNTS.map((account) => account.email),
    ...readRegisteredUsers().map((account) => account.email.toLowerCase()),
  ];
}

export function authenticate(email: string, password: string): AuthUser | null {
  const normalized = email.trim().toLowerCase();
  const demo = DEMO_ACCOUNTS.find(
    (account) => account.email === normalized && account.password === password,
  );
  if (demo) {
    return { email: demo.email, name: demo.name, role: demo.role };
  }

  /* A staff member signs into their organisation's portal as themselves. */
  const staff = findLogin(readStaffForLogin(), normalized, password);
  const org = staff ? organization(staff.orgId) : undefined;
  if (staff && org) {
    return {
      email: staff.email,
      name: staff.name,
      role: org.portal,
      org: org.name,
      staffRole: staff.role,
    };
  }

  const registered = readRegisteredUsers().find(
    (account) =>
      account.email.toLowerCase() === normalized &&
      account.password === password,
  );
  if (registered) {
    return {
      email: registered.email,
      name: registered.name,
      role: registered.role,
    };
  }

  return null;
}

export function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): { user: AuthUser } | { error: "exists" } {
  const email = input.email.trim().toLowerCase();
  const exists =
    DEMO_ACCOUNTS.some((account) => account.email === email) ||
    readStaffForLogin().some((account) => account.email === email) ||
    readRegisteredUsers().some(
      (account) => account.email.toLowerCase() === email,
    );

  if (exists) return { error: "exists" };

  const user: StoredAccount = {
    email,
    password: input.password,
    name: input.name.trim() || "Member",
    role: "user",
  };
  writeRegisteredUsers([...readRegisteredUsers(), user]);
  return { user: { email: user.email, name: user.name, role: "user" } };
}
