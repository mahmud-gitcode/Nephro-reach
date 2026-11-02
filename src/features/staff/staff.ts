/* ==========================================================================
   Staff: organisations, role names, page permissions
   --------------------------------------------------------------------------
   Every person who opens a patient's record signs in as themselves: HIPAA
   expects a unique user for each, so what they see and do can be traced to
   them.

   Phase 3 (D4): what a staff member may do is the server's answer. Their
   membership's permission levels come from `GET /me/context`, and
   `userCan` reads them through one fixed table
   (features/permissions/permissionMap.ts). The prototype's per-role
   matrices, the organisation's saved custom choices (`nr:role-permissions`)
   and the staff list in this browser (`nr:staff-accounts`) are gone; the
   team screens read and write the API (staff.api.ts, roles.api.ts).

   `ORGANIZATIONS` and `organizationFor` remain only for the screens of
   other lanes that still read the prototype's demo organisations by name
   (clinic settings, reports, CCM, hospital, support, travel); each of those
   phases replaces its own use.
   ========================================================================== */

import type { UserRole } from "@/features/auth/auth";
import {
  canWith,
  type ContextKind,
  type PermissionContext,
} from "@/features/permissions/permissionMap";

export type Organization = {
  id: string;
  name: string;
  /** Which portal its staff sign into. */
  portal: Extract<
    UserRole,
    "clinic" | "access" | "nephrology" | "admin" | "hospital"
  >;
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
  /* A hospital (client, 2026-10-13): kidney education and the move home,
     not care coordination. */
  {
    id: "riverside-general",
    name: "Riverside General Hospital",
    portal: "hospital",
    kind: "Hospital",
  },
  /* NephroReach's own team (client, 2026-10-12): the admin adds people —
     a virtual office manager to start — each with the parts of the admin
     portal their role allows. The admin's own login owns the account. */
  {
    id: "nephroreach",
    name: "NephroReach",
    portal: "admin",
    kind: "Platform Team",
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

/** Every role any organisation uses. Which ones an organisation offers is
 *  ROLES_BY_PORTAL below. */
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
  /* The Vascular Access Center's own set (client, 2026-10-06). */
  "Access Center Administrator",
  "Physician / APP",
  "Access Coordinator",
  "Scheduler / Front Desk",
  "Billing / Administrative Staff",
  /* NephroReach's own admin team (client, 2026-10-12). */
  "Administrative Support",
  "Content Manager",
  /* A hospital's own set (client, 2026-10-13). */
  "Hospital Administrator",
  "Case Manager / Social Worker",
  "Hospital RN",
  "Nephrology Physician / APP",
  "Education Coordinator",
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
  /* The Vascular Access Center (client, 2026-10-06): specific permissions
     rather than one "See vascular access", for cleaner role-based access
     control. With a server they are also organisation-scoped — a center
     sees only patients and referrals routed to it. */
  {
    id: "access.workspace",
    label: "Open the access center workspace",
    detail: "The Access Patients page, limited to what the role allows",
  },
  {
    id: "access.dashboard",
    label: "See dashboard & patient/referral list",
    detail: "Every patient and referral routed to your center",
  },
  {
    id: "access.referrals",
    label: "See incoming referrals",
    detail: "The full referral queue",
  },
  {
    id: "access.referrals.assigned",
    label: "See assigned referrals",
    detail: "Referrals assigned to this person",
  },
  {
    id: "access.concerns",
    label: "View access concerns",
    detail: "Concerns patients and offices report",
  },
  {
    id: "access.photos",
    label: "View submitted photos",
    detail: "Photos sent with concerns and messages",
  },
  {
    id: "access.messages",
    label: "Read/send messages",
    detail: "The center's messages",
  },
  {
    id: "access.message.nephrology",
    label: "Message nephrology offices",
    detail: "Write to referring nephrology offices",
  },
  {
    id: "access.message.dialysis",
    label: "Message dialysis centers",
    detail: "Write to dialysis centers",
  },
  {
    id: "access.message.patients",
    label: "Message patients",
    detail: "Write to patients in their access conversation",
  },
  {
    id: "access.scheduling.info",
    label: "See information needed for scheduling",
    detail: "Names, contact and appointment details only",
  },
  {
    id: "access.appointments",
    label: "Manage appointment requests",
    detail: "Receive and coordinate appointment requests",
  },
  {
    id: "access.appointments.confirm",
    label: "Schedule, confirm & reschedule appointments",
    detail: "Book and change access appointments",
  },
  {
    id: "access.appointments.status",
    label: "Update appointment status",
    detail: "Mark appointments completed",
  },
  {
    id: "access.appointments.view",
    label: "See appointment information",
    detail: "Upcoming and past access appointments",
  },
  {
    id: "access.referral.status",
    label: "Update referral status",
    detail: "Acknowledge, schedule or close referrals",
  },
  {
    id: "access.coordination.status",
    label: "Update access coordination status",
    detail: "The access status on a patient's record",
  },
  {
    id: "access.transport.view",
    label: "See transportation requests",
    detail: "Rides patients requested for access visits",
  },
  {
    id: "access.transport.coordinate",
    label: "Coordinate transportation",
    detail: "Transportation information for access visits",
  },
  {
    id: "access.tracking",
    label: "Track outstanding requests",
    detail: "Referrals and requests still open",
  },
  {
    id: "access.documentation",
    label: "Document coordination activity",
    detail: "Notes on coordination work",
  },
  {
    id: "account.manage",
    label: "Manage account information",
    detail: "The organisation's account details",
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
    id: "messages.team",
    label: "Message physicians",
    detail: "Write to the office's physicians and colleagues",
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
  /* The NephroReach admin portal's own parts (client, 2026-10-12). */
  {
    id: "admin.support",
    label: "Answer support requests",
    detail: "The Support Inbox from every dashboard",
  },
  {
    id: "admin.reviews",
    label: "Moderate reviews and stories",
    detail: "Member reviews and From Fear to Hope testimonials",
  },
  {
    id: "admin.community",
    label: "Moderate the community",
    detail: "Hide or remove community posts",
  },
  {
    id: "admin.content",
    label: "Manage content",
    detail: "Curriculum, library, Table Talk and live classes",
  },
  {
    id: "admin.members",
    label: "See members and subscriptions",
    detail: "The members list, subscriptions and SMS analytics",
  },
  /* A hospital's portal (client, 2026-10-13). */
  {
    id: "hospital.overview",
    label: "See the hospital overview",
    detail: "Enrollment and education totals",
  },
  {
    id: "hospital.patients",
    label: "See enrolled patients",
    detail: "Patients enrolled through this hospital, and their status",
  },
  {
    id: "hospital.enroll",
    label: "Enroll patients",
    detail: "Enroll patients and update their enrollment status",
  },
  {
    id: "hospital.education.assign",
    label: "Assign education programs",
    detail: "Give a patient access to a course",
  },
  {
    id: "hospital.education.monitor",
    label: "Monitor education progress",
    detail: "Course progress, knowledge checks and completion",
  },
  {
    id: "hospital.reports",
    label: "See education reports",
    detail: "Enrollment, participation and completion reports",
  },
  {
    id: "hospital.reports.download",
    label: "Download reports",
    detail: "Export education reports as CSV",
  },
  {
    id: "hospital.messages",
    label: "Message patients and outpatient teams",
    detail: "Secure messages with enrolled patients",
  },
] as const;
export type Permission = (typeof PERMISSIONS)[number]["id"];

/** The office or platform context a signed-in user acts in, or null for a
 *  patient, a caregiver, or anyone the server sent no membership for. */
export function permissionContextOf(
  user:
    | {
        role: UserRole;
        organizationId?: string;
        isOwner?: boolean;
        orgPermissions?: Record<string, number>;
      }
    | null
    | undefined,
): PermissionContext | null {
  if (!user || !user.organizationId || !isStaffPortal(user.role)) return null;
  const kind: ContextKind = user.role === "admin" ? "platform" : "office";
  return {
    kind,
    isOwner: user.isOwner === true,
    permissions: user.orgPermissions ?? {},
  };
}

/**
 * What a signed-in user may do, from the server's levels for the active
 * membership (D4). The owner holds every page of its own kind of
 * organisation; anyone else needs the levels the table names. A patient or
 * caregiver holds no staff page. An unknown user or id is always false.
 */
export function userCan(
  user: Parameters<typeof permissionContextOf>[0],
  permission: Permission,
): boolean {
  return canWith(permissionContextOf(user), permission);
}
