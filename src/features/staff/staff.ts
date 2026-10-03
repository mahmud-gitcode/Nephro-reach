/* ==========================================================================
   Staff accounts — organisations, roles, permissions
   --------------------------------------------------------------------------
   Every person who opens a patient's record signs in as themselves: HIPAA
   expects a unique user for each, so what they see and do can be traced to
   them. A shared "clinic" login cannot do that.

   Each organisation manages its own people (2026-09-30): its
   administrator adds staff, sets their role and turns sign-in off, from
   the organisation's own portal. Each account belongs to one organisation
   (a dialysis center, a vascular access center or a nephrology office,
   each its own portal)
   and has one role, and the role decides what they may do.
   The organisation logins from the demo (clinic@, access@, nephrology@)
   stand for that
   organisation's administrator and may do everything.

   Pure: state in, state out. Storage lives in staff.repository.ts.
   ========================================================================== */

import type { UserRole } from "@/features/auth/auth";

export type Organization = {
  id: string;
  name: string;
  /** Which portal its staff sign into. */
  portal: Extract<UserRole, "clinic" | "access" | "nephrology">;
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
  {
    id: "riverside-nephrology",
    name: "Riverside Nephrology Associates",
    portal: "nephrology",
    kind: "Nephrology Office",
  },
];

/** The portals staff sign into: everyone else is a member or the admin. */
export function isStaffPortal(role: UserRole): boolean {
  return ORGANIZATIONS.some((org) => org.portal === role);
}

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

/** The usual roles in a dialysis, access or nephrology practice. */
export const STAFF_ROLES = [
  "Office Manager",
  "Administrator",
  "Physician",
  "Nurse",
  "Social Worker",
  "Dietitian",
  "Care Coordinator",
  "Medical Assistant",
  "Front Desk",
] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const PERMISSIONS = [
  /* Seeing a page. Each menu entry names the one it needs. */
  {
    id: "dashboard.view",
    label: "See the dashboard and members",
    detail: "The clinic dashboard and the members list",
  },
  {
    id: "programs.view",
    label: "See programs",
    detail: "Curriculum progress and live classes",
  },
  {
    id: "checkins.view",
    label: "See check-ins",
    detail: "Patients' check-ins and what they report",
  },
  {
    id: "access.view",
    label: "See vascular access",
    detail: "Access records and the access center",
  },
  {
    id: "travel.view",
    label: "See travel requests",
    detail: "Patients' travel dialysis requests",
  },
  {
    id: "messages.view",
    label: "Read messages",
    detail: "Patients' conversations and messages with other offices",
  },
  {
    id: "labs.view",
    label: "See labs",
    detail: "Patients' lab results",
  },
  {
    id: "labs.upload",
    label: "Upload labs",
    detail: "Import lab results by CSV into patient charts",
  },
  /* Doing something. */
  {
    id: "patients.enroll",
    label: "Enroll patients",
    detail: "Add patients to the clinic and its programs",
  },
  {
    id: "messages.reply",
    label: "Message patients",
    detail: "Write to patients and reply in their conversations",
  },
  {
    id: "rides.manage",
    label: "Arrange rides",
    detail: "Acknowledge, confirm and cancel ride requests",
  },
  {
    id: "travel.manage",
    label: "Arrange travel dialysis",
    detail: "Place patients at a dialysis center while they travel",
  },
  {
    id: "access.schedule",
    label: "Schedule access visits",
    detail: "Book and complete appointments, add access patients",
  },
  {
    id: "ccm.log",
    label: "Log CCM time",
    detail: "Add CCM activities, patients and checklist updates",
  },
  {
    id: "reports.view",
    label: "See reports",
    detail: "Program outcomes and exports",
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

const EVERY: Permission[] = PERMISSIONS.map((p) => p.id);

/* Who may do what at an access center or a nephrology office. Messages to
   clinicians and those who handle questions; scheduling and CCM time to
   the clinical team; money, settings and staff to the managers. */
export const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  "Office Manager": EVERY.filter(
    (p) => p !== "messages.view" && p !== "messages.reply",
  ),
  Administrator: EVERY,
  Physician: [
    "messages.view",
    "messages.reply",
    "access.view",
    "access.schedule",
    "ccm.log",
    "reports.view",
  ],
  Nurse: [
    "messages.view",
    "messages.reply",
    "access.view",
    "access.schedule",
    "ccm.log",
  ],
  "Social Worker": ["messages.view", "messages.reply", "access.view"],
  Dietitian: ["messages.view", "messages.reply", "labs.view"],
  "Care Coordinator": [
    "messages.view",
    "messages.reply",
    "access.view",
    "access.schedule",
    "ccm.log",
    "reports.view",
  ],
  "Medical Assistant": ["access.view", "access.schedule", "ccm.log"],
  "Front Desk": ["access.view", "access.schedule"],
};

/* The dialysis center, as the client set it out (2026-10-01): each person
   sees what their job needs, and only the office manager sees reports and
   billing — the whole clinic panel, but not other people's messages. */
export const DIALYSIS_ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  "Office Manager": [
    "dashboard.view",
    "programs.view",
    "checkins.view",
    "access.view",
    "travel.view",
    "labs.view",
    "patients.enroll",
    "reports.view",
    "billing.view",
    "settings.manage",
    "staff.manage",
  ],
  Administrator: [
    "dashboard.view",
    "patients.enroll",
    "travel.view",
    "travel.manage",
    "rides.manage",
    "access.view",
    "access.schedule",
    "messages.view",
    "messages.reply",
    "labs.view",
    "labs.upload",
  ],
  "Social Worker": [
    "dashboard.view",
    "patients.enroll",
    "travel.view",
    "travel.manage",
    "rides.manage",
    "messages.view",
    "messages.reply",
  ],
  Nurse: [
    "messages.view",
    "messages.reply",
    "access.view",
    "access.schedule",
    "checkins.view",
    "labs.view",
  ],
  Dietitian: ["messages.view", "messages.reply", "labs.view"],
  /* Not in the client's list: set from their jobs, to confirm. */
  Physician: [
    "dashboard.view",
    "checkins.view",
    "access.view",
    "access.schedule",
    "messages.view",
    "messages.reply",
    "labs.view",
  ],
  "Care Coordinator": [
    "dashboard.view",
    "programs.view",
    "patients.enroll",
    "checkins.view",
    "travel.view",
    "travel.manage",
    "rides.manage",
    "access.view",
    "access.schedule",
    "messages.view",
    "messages.reply",
  ],
  "Medical Assistant": [
    "checkins.view",
    "access.view",
    "access.schedule",
    "labs.view",
  ],
  "Front Desk": [
    "dashboard.view",
    "patients.enroll",
    "access.view",
    "access.schedule",
  ],
};

type StaffPortal = Organization["portal"];

/** What a role may do in one kind of portal: the dialysis center has its
 *  own matrix; the access center and nephrology office share one. */
export function roleCan(
  role: StaffRole,
  permission: Permission,
  portal: StaffPortal = "clinic",
): boolean {
  const matrix =
    portal === "clinic" ? DIALYSIS_ROLE_PERMISSIONS : ROLE_PERMISSIONS;
  return matrix[role].includes(permission);
}

/**
 * What a signed-in user may do. Members and the platform admin are not
 * governed by staff roles; an organisation's own login (no staff role) is
 * its account owner and may do everything.
 */
export function userCan(
  user: { role: UserRole; staffRole?: StaffRole } | null | undefined,
  permission: Permission,
): boolean {
  if (!user) return false;
  if (!isStaffPortal(user.role) || !user.staffRole) return true;
  return roleCan(user.staffRole, permission, user.role as StaffPortal);
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
      "seed-s8",
      "Karen Hughes",
      "officemanager@nephroreach.com",
      "riverside",
      "Office Manager",
    ),
    person(
      "seed-s9",
      "Priya Shah, RD",
      "dietitian@nephroreach.com",
      "riverside",
      "Dietitian",
    ),
    person(
      "seed-s10",
      "Tom Becker",
      "administrator@nephroreach.com",
      "riverside",
      "Administrator",
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
    person(
      "seed-s6",
      "Dr. Samuel Reed",
      "nephrologist@nephroreach.com",
      "riverside-nephrology",
      "Physician",
    ),
    person(
      "seed-s7",
      "Maria Lopez, RN",
      "ccm@nephroreach.com",
      "riverside-nephrology",
      "Care Coordinator",
    ),
  ];
}
