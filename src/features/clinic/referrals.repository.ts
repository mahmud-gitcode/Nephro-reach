/* ==========================================================================
   Staff-to-staff access referrals on the API (Phase 10; ADR 0007 §1)
   --------------------------------------------------------------------------
   `/organizations/:orgId/referrals`, always under the active office's own
   id. The other office is chosen by its directory id
   (`GET /directory/organizations`), the patient by their id from this
   office's roster; the MRN is never sent (the server derives it from the
   sending office's record). Which targets are allowed is the server's rule
   (D11 / COLLAB-3 is open: nothing stricter is invented here).
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";

const enc = encodeURIComponent;
const base = (orgId: string) => `/organizations/${enc(orgId)}/referrals`;

export type ApiReferralOrg = { id: string; name: string };

export type ApiReferral = {
  id: string;
  kind: string;
  findings: string[];
  detail: string;
  urgent: boolean;
  status: string;
  patient: { id: string; firstName: string; lastName: string } | null;
  mrn: string | null;
  fromOrganization: ApiReferralOrg;
  toOrganization: ApiReferralOrg;
  startedByAccess: boolean;
  sentById: string;
  sentByName: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  handledById: string | null;
  handledByName: string | null;
  handledAt: string | null;
  sentAt: string;
  replyCount: number;
  waitingOnYou: boolean;
};

export type ApiReferralReply = {
  id: string;
  referralId: string;
  authorId: string;
  authorName: string | null;
  authorOrgId: string;
  body: string;
  sentAt: string;
};

export type ApiReferralDetail = ApiReferral & { replies: ApiReferralReply[] };

export type ReferralListParams = PageParams & {
  status?: string;
  box?: "inbox" | "sent";
  urgent?: boolean;
  patientId?: string;
  assignedToMe?: boolean;
};

export type SendReferralBody = {
  toOrganizationId: string;
  kind: string;
  patientId?: string;
  findings?: string[];
  detail: string;
  urgent?: boolean;
};

export const listReferrals = (
  orgId: string,
  params: ReferralListParams = {},
) => {
  const { status, box, urgent, patientId, assignedToMe, ...page } = params;
  return fetchPage<ApiReferral>(base(orgId), page, {
    query: { status, box, urgent, patientId, assignedToMe },
  });
};

export const getReferral = (orgId: string, referralId: string) =>
  api<ApiReferralDetail>(`${base(orgId)}/${enc(referralId)}`);

export const sendReferral = (orgId: string, body: SendReferralBody) =>
  api<ApiReferral>(base(orgId), { method: "POST", body });

export const replyToReferral = (
  orgId: string,
  referralId: string,
  body: string,
) =>
  api<ApiReferralReply>(`${base(orgId)}/${enc(referralId)}/replies`, {
    method: "POST",
    body: { body },
  });

export const setReferralStatus = (
  orgId: string,
  referralId: string,
  status: "Acknowledged" | "Scheduled" | "Closed",
) =>
  api<ApiReferral>(`${base(orgId)}/${enc(referralId)}/status`, {
    method: "PATCH",
    body: { status },
  });

export const assignReferral = (
  orgId: string,
  referralId: string,
  assignedToId: string | null,
) =>
  api<ApiReferral>(`${base(orgId)}/${enc(referralId)}/assignee`, {
    method: "PATCH",
    body: { assignedToId },
  });

/* ------------------------------------------------- this office's patients */

/** `GET /organizations/:orgId/patients` row, as the pickers need it. */
export type ApiOfficePatient = {
  patientId: string;
  firstName: string;
  lastName: string;
  mrn: string | null;
  status: string;
};

/** This office's roster for a patient picker (one bounded page). */
export const listOfficePatients = (orgId: string, params: PageParams = {}) =>
  fetchPage<ApiOfficePatient>(`/organizations/${enc(orgId)}/patients`, {
    limit: 150,
    ...params,
  });

/** This office's ACTIVE patients whose name or MRN matches `search` (the
 *  server's roster search; one small page). */
export const searchOfficePatients = (orgId: string, search: string) =>
  fetchPage<ApiOfficePatient>(
    `/organizations/${enc(orgId)}/patients`,
    { limit: 10 },
    { query: { search, status: "ACTIVE" } },
  );
