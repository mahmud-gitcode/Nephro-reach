/* ==========================================================================
   Caregivers on the API (Phase 3; D1; ADR 0007 §1)
   --------------------------------------------------------------------------
   Patient side (`/patients/{patientId}/caregivers | caregiver-invitations`):
   the server allows these to the patient only (area `account`, which no
   caregiver and no office ever holds). Caregiver side (`/me/caregiving`,
   `/me/invitations`): the caller's own. Invitation links
   (`/invitations/{token}`): the preview is public; accept and decline need
   a session with the invited email.

   Every call sends NO office header (`organizationId: null`): a staff member
   who is also a patient or a caregiver is judged as that person, never as
   staff (INT-6). The invitation token is passed through, never stored,
   logged or put in a query key.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage } from "@/lib/api/paging";

const NO_HEADER = { organizationId: null } as const;

/* -------------------------------------------------------------- shapes */

export const CAREGIVER_RELATIONSHIPS = [
  "Spouse / partner",
  "Son",
  "Daughter",
  "Parent",
  "Grandchild",
  "Sibling",
  "Friend",
  "Professional caregiver",
  "Other",
] as const;
export type CaregiverRelationship = (typeof CAREGIVER_RELATIONSHIPS)[number];

export const CAREGIVER_PRESETS = [
  "full",
  "view-only",
  "support",
  "custom",
] as const;
export type CaregiverPreset = (typeof CAREGIVER_PRESETS)[number];

/** The areas a patient can open to a caregiver in a custom map, in the
 *  order the editor lists them. `journal` and `sharing` are never part of a
 *  preset: the journal has its own explicit control (D1); outside sharing
 *  is not offered while D30 is open. */
export const CAREGIVER_AREAS = [
  "profile",
  "personal-logs",
  "nutrition",
  "check-ins",
  "er-visits",
  "dialysis",
  "medications",
  "labs",
  "messages",
] as const;
export type CaregiverArea = (typeof CAREGIVER_AREAS)[number];

export type CaregiverPermissions = Record<string, number>;

/** `GET /patients/{pid}/caregivers` row. */
export type CaregiverGrant = {
  id: string;
  patientId: string;
  caregiverId: string;
  caregiverName: string | null;
  caregiverEmail: string | null;
  relationship: string;
  preset: string;
  permissions: CaregiverPermissions;
  status: string;
  acceptedAt: string;
  revokedAt: string | null;
};

/** `GET /patients/{pid}/caregiver-invitations` row. No token, ever. */
export type CaregiverInvitation = {
  id: string;
  email: string;
  status: string;
  relationship: string;
  preset: string;
  permissions: CaregiverPermissions;
  expiresAt: string;
  createdAt: string;
  respondedAt: string | null;
};

export type CaregiverActivity = {
  module: string;
  action: string;
  outcome: string;
  createdAt: string;
};

/** `GET /me/caregiving` row. */
export type CaregivingRow = {
  grantId: string;
  patientId: string;
  patientFirstName: string;
  patientLastName: string;
  relationship: string;
  preset: string;
  permissions: CaregiverPermissions;
};

/** `GET /invitations/{token}` (public) and `GET /me/invitations` rows. */
export type InvitationPreview = {
  kind: string;
  organizationName: string | null;
  inviterFirstName: string | null;
  role: string | null;
  preset: string | null;
  expiresAt: string;
  status: string;
};
export type MyInvitation = InvitationPreview & { id: string };

export type InvitationAcceptance = {
  kind: string;
  organizationId: string | null;
  patientId: string | null;
};

export type InviteCaregiverBody = {
  email: string;
  relationship: CaregiverRelationship;
  preset: CaregiverPreset;
  /** Only with `custom` (the server refuses it with a named preset). */
  permissions?: CaregiverPermissions;
};

const patient = (patientId: string, rest: string) =>
  `/patients/${encodeURIComponent(patientId)}${rest}`;

/* ------------------------------------------------------------ patient */

export const listCaregivers = (
  patientId: string,
  q: { status?: "ACTIVE" | "REVOKED"; page?: number; limit?: number } = {},
) =>
  fetchPage<CaregiverGrant>(
    patient(patientId, "/caregivers"),
    { page: q.page ?? 1, limit: q.limit ?? 50 },
    { query: { status: q.status }, ...NO_HEADER },
  );

export const listCaregiverInvitations = (
  patientId: string,
  q: { status?: string; page?: number; limit?: number } = {},
) =>
  fetchPage<CaregiverInvitation>(
    patient(patientId, "/caregiver-invitations"),
    { page: q.page ?? 1, limit: q.limit ?? 50 },
    { query: { status: q.status }, ...NO_HEADER },
  );

/** The body exactly as the server accepts it: `permissions` only with the
 *  custom preset, and the custom map never opens the journal (that is its
 *  own explicit grant, D1). */
export function inviteBody(body: InviteCaregiverBody) {
  return {
    email: body.email.trim().toLowerCase(),
    relationship: body.relationship,
    preset: body.preset,
    ...(body.preset === "custom"
      ? { permissions: { ...(body.permissions ?? {}), journal: 0 } }
      : {}),
  };
}

export const inviteCaregiver = (patientId: string, body: InviteCaregiverBody) =>
  api<CaregiverInvitation>(patient(patientId, "/caregiver-invitations"), {
    method: "POST",
    body: inviteBody(body),
    ...NO_HEADER,
  });

export const revokeCaregiverInvitation = (patientId: string, id: string) =>
  api<CaregiverInvitation>(
    patient(
      patientId,
      `/caregiver-invitations/${encodeURIComponent(id)}/revoke`,
    ),
    { method: "POST", ...NO_HEADER },
  );

export const resendCaregiverInvitation = (patientId: string, id: string) =>
  api<CaregiverInvitation>(
    patient(
      patientId,
      `/caregiver-invitations/${encodeURIComponent(id)}/resend`,
    ),
    { method: "POST", ...NO_HEADER },
  );

/** Ends the caregiver's access at once: their next request is refused. */
export const revokeCaregiver = (patientId: string, grantId: string) =>
  api<CaregiverGrant>(
    patient(patientId, `/caregivers/${encodeURIComponent(grantId)}/revoke`),
    { method: "POST", ...NO_HEADER },
  );

export const updateCaregiver = (
  patientId: string,
  grantId: string,
  preset: CaregiverPreset,
  permissions?: CaregiverPermissions,
) =>
  api<CaregiverGrant>(
    patient(patientId, `/caregivers/${encodeURIComponent(grantId)}`),
    {
      method: "PATCH",
      body: { preset, ...(preset === "custom" ? { permissions } : {}) },
      ...NO_HEADER,
    },
  );

export const caregiverActivity = (
  patientId: string,
  grantId: string,
  q: { page?: number; limit?: number } = {},
) =>
  fetchPage<CaregiverActivity>(
    patient(patientId, `/caregivers/${encodeURIComponent(grantId)}/activity`),
    { page: q.page ?? 1, limit: q.limit ?? 5 },
    NO_HEADER,
  );

/* ----------------------------------------------------------- caregiver */

export const myCaregiving = (q: { page?: number; limit?: number } = {}) =>
  fetchPage<CaregivingRow>(
    "/me/caregiving",
    { page: q.page ?? 1, limit: q.limit ?? 50 },
    NO_HEADER,
  );

export const leaveCaregiving = (grantId: string) =>
  api<unknown>(`/me/caregiving/${encodeURIComponent(grantId)}/leave`, {
    method: "POST",
    ...NO_HEADER,
  });

/* ---------------------------------------------------------- invitations */

export const myInvitations = () =>
  api<MyInvitation[]>("/me/invitations", NO_HEADER);

export const acceptMyInvitation = (id: string) =>
  api<InvitationAcceptance>(
    `/me/invitations/${encodeURIComponent(id)}/accept`,
    { method: "POST", ...NO_HEADER },
  );

export const declineMyInvitation = (id: string) =>
  api<unknown>(`/me/invitations/${encodeURIComponent(id)}/decline`, {
    method: "POST",
    ...NO_HEADER,
  });

/** Public preview of an emailed link (no session needed). */
export const previewInvitation = (token: string) =>
  api<InvitationPreview>(
    `/invitations/${encodeURIComponent(token)}`,
    NO_HEADER,
  );

export const acceptInvitation = (token: string) =>
  api<InvitationAcceptance>(
    `/invitations/${encodeURIComponent(token)}/accept`,
    { method: "POST", ...NO_HEADER },
  );

export const declineInvitation = (token: string) =>
  api<unknown>(`/invitations/${encodeURIComponent(token)}/decline`, {
    method: "POST",
    ...NO_HEADER,
  });
