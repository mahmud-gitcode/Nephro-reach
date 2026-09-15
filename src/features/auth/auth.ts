export type UserRole = "admin" | "user";

export type AuthUser = {
  email: string;
  name: string;
  role: UserRole;
};

export const AUTH_COOKIE = "nr-session";
export const AUTH_USERS_KEY = "nr-registered-users";

export const ADMIN_HOME = "/dashboard";
export const USER_HOME = "/dashboard";

const ADMIN_PREFIXES = [
  "/dashboard/members",
  "/dashboard/manage-curriculum",
  "/dashboard/manage-library",
  "/dashboard/manage-table-talk",
  "/dashboard/manage-travel",
  "/dashboard/live-class",
  "/dashboard/sms-analytics",
  "/dashboard/subscriptions",
  "/dashboard/admin-reviews",
  "/dashboard/admin-testimonials",
  "/dashboard/design-system",
];

export const DEMO_ACCOUNTS = [
  {
    email: "admin@nephroreach.com",
    password: "admin123",
    name: "Jenny Wilson",
    role: "admin" as const,
  },
  {
    email: "user@nephroreach.com",
    password: "user123",
    name: "Charles Xavier",
    role: "user" as const,
  },
];

export function homeForRole(role: UserRole) {
  return role === "admin" ? ADMIN_HOME : USER_HOME;
}

export function isAdminRoute(pathname: string) {
  return ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function canAccessPath(role: UserRole, pathname: string) {
  if (!pathname.startsWith("/dashboard")) return true;
  if (pathname === "/dashboard" || pathname === "/dashboard/") return true;
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
      (parsed.role === "admin" || parsed.role === "user")
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

export function authenticate(email: string, password: string): AuthUser | null {
  const normalized = email.trim().toLowerCase();
  const demo = DEMO_ACCOUNTS.find(
    (account) => account.email === normalized && account.password === password,
  );
  if (demo) {
    return { email: demo.email, name: demo.name, role: demo.role };
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
