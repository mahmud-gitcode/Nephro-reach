/* ==========================================================================
   Staff accounts — organisations, roles, permissions
   --------------------------------------------------------------------------
   Every person who opens a patient's record signs in as themselves: HIPAA
   expects a unique user for each, so what they see and do can be traced to
   them. A shared "clinic" login cannot do that.

   Each organisation manages its own people (2026-09-30): its
   administrator adds staff, sets their role and turns sign-in off, from
   the organisation's own portal. Each account belongs to one organisation
   (a dialysis center or a vascular access center, each its own portal)
   and has one role, and the role decides what they may do.
   The organisation logins from the demo (clinic@, access@) stand for that
   organisation's administrator and may do everything.

   Pure: state in, state out. Storage lives in staff.repository.ts.
   ========================================================================== */

import type { UserRole } from "@/features/auth/auth";

export type Organization = {
  id: string;
  name: string;
  /** Which portal its staff sign into. */
  portal: Extract<UserRole, "clinic" | "access">;
  kind: string;
};

export const ORGANIZATIONS: Organization[] = [
  {
    id: "riverside",
    name: "Riverside Dialysis Center",
    portal: "clinic",
    kind: "Dialysis Center",
  },
  {
    id: "metro-access",
    name: "Metro Vascular Access Center",
    portal: "access",
    kind: "Vascular Access Center",
  },
];

export function organization(id: string): Organization | undefined {
  return ORGANIZATIONS.find((org) => org.id === id);
}

/** The organisation a signed-in user works for: a staff member's own, or
 *  the one behind an organisation's demo login. */
export function organizationFor(
  user: { role: UserRole; org?: string } | null | undefined,
): Organization | undefined {
  if (!user) return undefined;
  if (user.org) return ORGANIZATIONS.find((org) => org.name === user.org);
  return ORGANIZATIONS.find((org) => org.portal === user.role);
}

/** The usual roles in a dialysis or access practice. */
export const STAFF_ROLES = [
  "Administrator",
  "Physician",
  "Nurse",
  "Social Worker",
  "Care Coordinator",
  "Medical Assistant",
  "Front Desk",
] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const PERMISSIONS = [
  {
    id: "rides.manage",
    label: "Arrange rides",
    detail: "Acknowledge, confirm and cancel ride requests",
  },
  {
    id: "access.reply",
    label: "Reply in access conversations",
    detail: "Post in the patient's access conversation",
  },
  {
    id: "access.schedule",
    label: "Schedule access visits",
    detail: "Book and complete appointments, set access status",
  },
  {
    id: "ccm.log",
    label: "Log CCM time",
    detail: "Add CCM activities and update the checklist",
  },
  {
    id: "billing.view",
    label: "See contract & billing",
    detail: "Invoices and the contract",
  },
  {
    id: "settings.manage",
    label: "Manage settings",
    detail: "Organisation profile, notifications and preferences",
  },
  {
    id: "staff.manage",
    label: "Manage staff",
    detail: "Add staff, change roles, turn off sign-in",
  },
] as const;
export type Permission = (typeof PERMISSIONS)[number]["id"];

/* Who may do what. Rides belong to the social worker (and whoever
   coordinates care); clinical replies to clinicians and those who handle
   patients' questions; money and settings to administrators. */
export const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  Administrator: [
    "rides.manage",
    "access.reply",
    "access.schedule",
    "ccm.log",
    "billing.view",
    "settings.manage",
    "staff.manage",
  ],
  Physician: ["access.reply", "access.schedule", "ccm.log"],
  Nurse: ["access.reply", "access.schedule", "ccm.log"],
  "Social Worker": ["rides.manage", "access.reply"],
  "Care Coordinator": [
    "rides.manage",
    "access.reply",
    "access.schedule",
    "ccm.log",
  ],
  "Medical Assistant": ["access.schedule", "ccm.log"],
  "Front Desk": ["access.schedule"],
};

export function roleCan(role: StaffRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * What a signed-in user may do. Members and the platform admin are not
 * governed by staff roles; an organisation login without a staff role is
 * that organisation's administrator.
 */
export function userCan(
  user: { role: UserRole; staffRole?: StaffRole } | null | undefined,
  permission: Permission,
): boolean {
  if (!user) return false;
  if (user.role !== "clinic" && user.role !== "access") return true;
  return roleCan(user.staffRole ?? "Administrator", permission);
}

/* -------------------------------------------------------------- accounts */

export type StaffStatus = "Active" | "Deactivated";

export type StaffAccount = {
  id: string;
  name: string;
  email: string;
  orgId: string;
  role: StaffRole;
  status: StaffStatus;
  /** Demo only: kept in the browser until a server holds real credentials. */
  password: string;
  /** ISO 8601 */
  createdAt: string;
};

export type StaffDraft = Pick<
  StaffAccount,
  "name" | "email" | "orgId" | "role" | "password"
>;

export const MIN_PASSWORD = 8;

export function normalEmail(email: string) {
  return email.trim().toLowerCase();
}

export type StaffError =
  "name" | "email" | "email-taken" | "organization" | "password";

/**
 * What is wrong with a new or edited account, or null. `taken` is every
 * email already in use elsewhere (demo logins, members, other staff).
 */
export function staffError(
  draft: StaffDraft,
  taken: string[],
  { checkPassword = true } = {},
): StaffError | null {
  if (draft.name.trim().length < 2) return "name";
  const email = normalEmail(draft.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "email";
  if (taken.includes(email)) return "email-taken";
  if (!organization(draft.orgId)) return "organization";
  if (checkPassword && draft.password.length < MIN_PASSWORD) return "password";
  return null;
}

export function addStaff(
  accounts: StaffAccount[],
  draft: StaffDraft,
  now: number,
): StaffAccount[] {
  return [
    ...accounts,
    {
      id: `staff-${now}`,
      name: draft.name.trim(),
      email: normalEmail(draft.email),
      orgId: draft.orgId,
      role: draft.role,
      status: "Active",
      password: draft.password,
      createdAt: new Date(now).toISOString(),
    },
  ];
}

export function updateStaff(
  accounts: StaffAccount[],
  id: string,
  change: Partial<Pick<StaffAccount, "name" | "role" | "status" | "password">>,
): StaffAccount[] {
  return accounts.map((account) =>
    account.id === id
      ? {
          ...account,
          ...change,
          ...(change.name !== undefined ? { name: change.name.trim() } : {}),
        }
      : account,
  );
}

/** An active account matching the credentials, or null. */
export function findLogin(
  accounts: StaffAccount[],
  email: string,
  password: string,
): StaffAccount | null {
  const wanted = normalEmail(email);
  return (
    accounts.find(
      (account) =>
        account.email === wanted &&
        account.password === password &&
        account.status === "Active",
    ) ?? null
  );
}

export type StaffFilters = { query: string; orgId: string; role: string };
export const ALL = "All";

export function filterStaff(
  accounts: StaffAccount[],
  filters: StaffFilters,
): StaffAccount[] {
  const q = filters.query.trim().toLowerCase();
  return accounts
    .filter(
      (account) =>
        (filters.orgId === ALL || account.orgId === filters.orgId) &&
        (filters.role === ALL || account.role === filters.role) &&
        (q === "" ||
          account.name.toLowerCase().includes(q) ||
          account.email.includes(q)),
    )
    .sort(
      (a, b) =>
        (a.status === b.status ? 0 : a.status === "Active" ? -1 : 1) ||
        a.name.localeCompare(b.name),
    );
}

/* ------------------------------------------------------------------ seed */

/** One password for every seeded staff account, so the demo is easy. */
export const DEMO_STAFF_PASSWORD = "staff123";

export function seedStaff(now: number): StaffAccount[] {
  const at = new Date(now).toISOString();
  const person = (
    id: string,
    name: string,
    email: string,
    orgId: string,
    role: StaffRole,
  ): StaffAccount => ({
    id,
    name,
    email,
    orgId,
    role,
    status: "Active",
    password: DEMO_STAFF_PASSWORD,
    createdAt: at,
  });
  return [
    person(
      "seed-s1",
      "Linda Moore, LMSW",
      "socialworker@nephroreach.com",
      "riverside",
      "Social Worker",
    ),
    person(
      "seed-s2",
      "Nurse Wilson, RN",
      "nurse@nephroreach.com",
      "riverside",
      "Nurse",
    ),
    person(
      "seed-s3",
      "Dr. Melissa Carter",
      "physician@nephroreach.com",
      "riverside",
      "Physician",
    ),
    person(
      "seed-s4",
      "Dr. Raj Patel",
      "surgeon@nephroreach.com",
      "metro-access",
      "Physician",
    ),
    person(
      "seed-s5",
      "Rachel Kim",
      "frontdesk@nephroreach.com",
      "metro-access",
      "Front Desk",
    ),
  ];
}
