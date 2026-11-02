/* ==========================================================================
   Staff administration on the API (Phase 3; D3, D4; ADR 0007 §1)
   --------------------------------------------------------------------------
   One function per server operation, all under the active office's own
   id: `/organizations/{orgId}/staff | invitations | roles`. The id comes
   from the office context the user picked (never from a URL or a demo
   organisation), and every route checks the caller's membership levels
   server-side:
   - list staff and invitations: staff View;
   - change a title: staff Edit;
   - invite, resend, revoke: staff Manage;
   - change a role, deactivate, reactivate: staff Manage + canGrant;
   - read roles: roles View; create, edit, reset, delete: roles Manage;
   - ownership transfer: the owner only.
   No password is ever set here (D3): a person registers their own account
   and accepts an invitation sent to that email.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage } from "@/lib/api/paging";

/* -------------------------------------------------------------- shapes */

export type StaffStatus = "ACTIVE" | "DEACTIVATED";

/** `GET /organizations/{orgId}/staff` row (StaffMemberResponseDto). */
export type StaffMember = {
  /** The membership id: every staff route takes this, not the user id. */
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  role: string;
  title: string | null;
  isOwner: boolean;
  status: StaffStatus | string;
  deactivatedAt: string | null;
  createdAt: string;
};

export type InvitationStatus =
  "PENDING" | "ACCEPTED" | "DECLINED" | "REVOKED" | "EXPIRED";

/** `GET /organizations/{orgId}/invitations` row. No token, ever. */
export type StaffInvitation = {
  id: string;
  email: string;
  role: string;
  status: InvitationStatus | string;
  expiresAt: string;
  createdAt: string;
  respondedAt: string | null;
};

/** `GET /organizations/{orgId}/roles` row (RoleResponseDto). */
export type OrgRole = {
  name: string;
  isBuiltIn: boolean;
  isCustom: boolean;
  /** A built-in role whose map this organisation changed. */
  isOverridden: boolean;
  /** resource → level (only levels ≥ 1 are listed). */
  permissions: Record<string, number>;
  defaultPermissions: Record<string, number> | null;
  memberCount: number;
};

export type StaffQuery = {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: StaffStatus;
};

/** Role names: invite, create and change all cap at 60 (spec 036). */
export const ROLE_NAME_MAX = 60;
export const TITLE_MAX = 60;
export const EMAIL_MAX = 320;

const org = (orgId: string, rest: string) =>
  `/organizations/${encodeURIComponent(orgId)}${rest}`;

/* Office administration routes carry the office in the path; the header is
   not needed and is never sent from here (it would only matter on patient
   routes). */
const NO_HEADER = { organizationId: null } as const;

/* --------------------------------------------------------------- staff */

export function listStaff(orgId: string, q: StaffQuery = {}) {
  return fetchPage<StaffMember>(
    org(orgId, "/staff"),
    { page: q.page ?? 1, limit: q.limit ?? 25 },
    {
      query: {
        search: q.search?.trim() || undefined,
        role: q.role || undefined,
        status: q.status,
      },
      ...NO_HEADER,
    },
  );
}

export const changeRole = (orgId: string, membershipId: string, role: string) =>
  api<StaffMember>(
    org(orgId, `/staff/${encodeURIComponent(membershipId)}/role`),
    { method: "PATCH", body: { role }, ...NO_HEADER },
  );

export const changeTitle = (
  orgId: string,
  membershipId: string,
  title: string | null,
) =>
  api<StaffMember>(
    org(orgId, `/staff/${encodeURIComponent(membershipId)}/title`),
    { method: "PATCH", body: { title }, ...NO_HEADER },
  );

export const deactivateStaff = (orgId: string, membershipId: string) =>
  api<StaffMember>(
    org(orgId, `/staff/${encodeURIComponent(membershipId)}/deactivate`),
    { method: "POST", ...NO_HEADER },
  );

export const reactivateStaff = (orgId: string, membershipId: string) =>
  api<StaffMember>(
    org(orgId, `/staff/${encodeURIComponent(membershipId)}/reactivate`),
    { method: "POST", ...NO_HEADER },
  );

/** Owner only. The server revokes both people's sessions, the caller's
 *  included (spec 025 §3): the caller must sign in again afterwards. */
export const transferOwnership = (
  orgId: string,
  membershipId: string,
  formerOwnerRole?: string,
) =>
  api<unknown>(org(orgId, "/staff/ownership-transfer"), {
    method: "POST",
    body: {
      membershipId,
      ...(formerOwnerRole ? { formerOwnerRole } : {}),
    },
    ...NO_HEADER,
  });

/* ---------------------------------------------------------- invitations */

export function listInvitations(
  orgId: string,
  q: { status?: InvitationStatus; page?: number; limit?: number } = {},
) {
  return fetchPage<StaffInvitation>(
    org(orgId, "/invitations"),
    { page: q.page ?? 1, limit: q.limit ?? 25 },
    { query: { status: q.status }, ...NO_HEADER },
  );
}

/** D3: invite a person's own (registered) email into a role. */
export const inviteStaff = (orgId: string, email: string, role: string) =>
  api<StaffInvitation>(org(orgId, "/invitations"), {
    method: "POST",
    body: { email: email.trim().toLowerCase(), role },
    ...NO_HEADER,
  });

export const revokeInvitation = (orgId: string, invitationId: string) =>
  api<StaffInvitation>(
    org(orgId, `/invitations/${encodeURIComponent(invitationId)}/revoke`),
    { method: "POST", ...NO_HEADER },
  );

/** Sends a new link; the old one stops working (single use, new expiry). */
export const resendInvitation = (orgId: string, invitationId: string) =>
  api<StaffInvitation>(
    org(orgId, `/invitations/${encodeURIComponent(invitationId)}/resend`),
    { method: "POST", ...NO_HEADER },
  );

/* ---------------------------------------------------------------- roles */

export const listRoles = (orgId: string) =>
  api<OrgRole[]>(org(orgId, "/roles"), NO_HEADER);

export const createRole = (
  orgId: string,
  name: string,
  permissions: Record<string, number>,
) =>
  api<OrgRole>(org(orgId, "/roles"), {
    method: "POST",
    body: { name: name.trim(), permissions },
    ...NO_HEADER,
  });

/** The whole map for one role, in one server operation. Every member of the
 *  role is signed out by the server (spec 025 §3). */
export const setRolePermissions = (
  orgId: string,
  role: string,
  permissions: Record<string, number>,
) =>
  api<OrgRole>(org(orgId, "/roles/permissions"), {
    method: "PUT",
    body: { role, permissions },
    ...NO_HEADER,
  });

/** A custom role: deleted (409 `staff.role_in_use` while anyone holds it).
 *  An overridden built-in role: reset to its default. */
export const deleteOrResetRole = (orgId: string, name: string) =>
  api<unknown>(org(orgId, "/roles"), {
    method: "DELETE",
    query: { name },
    ...NO_HEADER,
  });
