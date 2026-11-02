import type { StaffRole } from "@/features/staff/staff";

/* "access" is a Vascular Access Center: its own organisation, which shares
   each patient's access record with the dialysis clinic (2026-09-30).
   "nephrology" is a nephrology office (client, 2026-10-03: each office has
   its own login): CCM, and its messages with the access center. */
/* "hospital" (client, 2026-10-13): a kidney education and patient
   transition portal — the hospital enrolls, NephroReach teaches, staff
   follow progress. Not another care-coordination system. */
/* "caregiver" (client spec, confirmed 2026-10-13): one person a patient
   invites, signed in as themselves, seeing only what that patient shares. */
export type UserRole =
  | "admin"
  | "user"
  | "clinic"
  | "access"
  | "nephrology"
  | "hospital"
  | "caregiver";

/**
 * The signed-in person in the context they are using, derived from
 * `GET /me/context` (features/auth/auth.mapping.ts). The server decides every
 * permission; this only picks the portal and hides what the role cannot use.
 */
export type AuthUser = {
  /** The account id (context.user.id). */
  id: string;
  /** For display and the legacy local stores only; never a key on the API. */
  email: string;
  name: string;
  role: UserRole;
  /** Office and platform contexts: the organization acted for. */
  organizationId?: string;
  /** The organization's name, read by the staff screens until Phase 3. */
  org?: string;
  /** The membership's role name. Undefined for the organization's owner,
   *  who may do everything (features/staff/staff.ts userCan). */
  staffRole?: StaffRole;
  isOwner?: boolean;
  /** The membership's permission levels (0-3) for Phase 3. */
  orgPermissions?: Record<string, number>;
  /** Patient: their own patient record. Caregiver: the first patient they
   *  look after (Phase 3 adds the switcher). */
  patientId?: string;
  caregivingGrantId?: string;
};

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
/* A hospital has its own portal under its own prefix. */
export const HOSPITAL_HOME = "/dashboard/hospital";
/* A caregiver's pages, under their own prefix. */
export const CAREGIVER_HOME = "/dashboard/caregiver";

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
  "/dashboard/admin-team",
  "/dashboard/portal-comparison",
];

export const CLINIC_PREFIX = "/dashboard/clinic";
export const ACCESS_PREFIX = "/dashboard/access-center";
export const NEPHROLOGY_PREFIX = "/dashboard/nephrology";
export const HOSPITAL_PREFIX = "/dashboard/hospital";
export const CAREGIVER_PREFIX = "/dashboard/caregiver";
const NEPHROLOGY_EXCLUDED = [
  "/dashboard/clinic/travel",
  "/dashboard/clinic/messages",
  "/dashboard/clinic/settings",
  "/dashboard/clinic/team",
];

export function homeForRole(role: UserRole) {
  if (role === "clinic") return CLINIC_HOME;
  if (role === "access") return ACCESS_HOME;
  if (role === "nephrology") return NEPHROLOGY_HOME;
  if (role === "hospital") return HOSPITAL_HOME;
  if (role === "caregiver") return CAREGIVER_HOME;
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

export function isHospitalRoute(pathname: string) {
  return (
    pathname === HOSPITAL_PREFIX || pathname.startsWith(`${HOSPITAL_PREFIX}/`)
  );
}

export function isCaregiverRoute(pathname: string) {
  return (
    pathname === CAREGIVER_PREFIX || pathname.startsWith(`${CAREGIVER_PREFIX}/`)
  );
}

export function isNephrologyRoute(pathname: string) {
  return (
    pathname === NEPHROLOGY_PREFIX ||
    pathname.startsWith(`${NEPHROLOGY_PREFIX}/`)
  );
}

export function canAccessPath(role: UserRole, pathname: string): boolean {
  if (!pathname.startsWith("/dashboard")) return true;
  /* A caregiver has their own page (their patients), and every member page
     — acting for the patient they switched to — except inviting other
     caregivers (2026-10-14). */
  if (isCaregiverRoute(pathname)) return role === "caregiver";
  if (role === "caregiver") {
    return (
      !pathname.startsWith("/dashboard/my-caregivers") &&
      canAccessPath("user", pathname)
    );
  }
  /* A hospital sees its own routes and nothing else. */
  if (isHospitalRoute(pathname)) return role === "hospital";
  if (role === "hospital") return false;
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
