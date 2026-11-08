/* ==========================================================================
   Vascular access on the API: one function per server operation
   (Phase 10; ADR 0007 §1)
   --------------------------------------------------------------------------
   A record is reached two ways, and every function takes which:
   - the member (or a caregiver acting for them, D1):
     `/patients/:patientId/access-profiles/...`, no office header;
   - an office: `/organizations/:organizationId/access-profiles/...`.
   The profile id is in every path; an MRN or a name never is. Pictures
   travel as file ids (`uploadFile`) and open through a short-lived link
   asked for on demand. No whole-array writes, no browser storage.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";

/** Whose record: the patient's own routes, or an office's. */
export type AccessTarget =
  | { kind: "patient"; patientId: string }
  | { kind: "office"; organizationId: string };

const enc = encodeURIComponent;

/** The profile collection for a target. */
export function profilesPath(target: AccessTarget): string {
  return target.kind === "patient"
    ? `/patients/${enc(target.patientId)}/access-profiles`
    : `/organizations/${enc(target.organizationId)}/access-profiles`;
}

const profilePath = (target: AccessTarget, profileId: string, rest = "") =>
  `${profilesPath(target)}/${enc(profileId)}${rest}`;

/* ------------------------------------------------------------ API shapes */

export type ApiOrg = { id: string; name: string };

export type ApiAccessProfile = {
  id: string;
  patientId: string;
  accessCenter: ApiOrg;
  dialysisCenter: ApiOrg | null;
  type: string;
  location: string;
  createdOn: string | null;
  status: string;
  lastAssessmentOn: string | null;
  dialysisCanPost: boolean;
  party: string;
  unread: number;
  createdAt: string;
  updatedAt: string;
};

export type ApiAccessAppointment = {
  id: string;
  profileId: string;
  date: string;
  time: string;
  title: string;
  place: string;
  team: string;
  completedAt: string | null;
  result: string | null;
  performedBy: string | null;
  transportStatus: string | null;
  createdAt: string;
};

export type ApiAccessRosterEntry = ApiAccessProfile & {
  firstName: string;
  lastName: string;
  mrn: string | null;
  openConcerns: number;
  nextAppointment: ApiAccessAppointment | null;
};

export type ApiAccessUpdate = {
  id: string;
  profileId: string;
  date: string;
  title: string;
  detail: string;
  kind: string;
  createdAt: string;
};

export type ApiAccessHistoryEntry = {
  id: string;
  profileId: string;
  date: string;
  type: string;
  procedure: string;
  location: string;
  performedBy: string;
  result: string;
  createdAt: string;
};

export type ApiAccessConcern = {
  id: string;
  profileId: string;
  kinds: string[];
  detail: string;
  hasImage: boolean;
  sendTo: string[];
  status: string;
  reportedAt: string;
  editedAt: string | null;
  resentAt: string | null;
  reviewedAt: string | null;
};

export type ApiTransportRequest = {
  id: string;
  profileId: string;
  appointmentId: string;
  appointment: {
    id: string;
    date: string;
    time: string;
    title: string;
    place: string;
    completedAt: string | null;
  } | null;
  status: string;
  handledBy: string;
  pickupAddress: string;
  returnTrip: boolean;
  mobility: string;
  memberNote: string;
  pickupTime: string | null;
  returnPickupTime: string | null;
  provider: string | null;
  phone: string | null;
  confirmationNumber: string | null;
  confirmationNote: string | null;
  confirmedByName: string | null;
  requestedAt: string;
  acknowledgedAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
};

/** A ride on the office queue (BE-12, spec 048). */
export type ApiQueuedRide = ApiTransportRequest & {
  patientId: string;
  firstName: string;
  lastName: string;
  mrn: string | null;
};

export type ApiAccessMessage = {
  id: string;
  profileId: string;
  party: string;
  authorName: string | null;
  mine: boolean;
  body: string | null;
  hasImage: boolean;
  isPrivate: boolean;
  hidden: boolean;
  sentAt: string;
};

export type ApiFileLink = { url: string; expiresIn: number };

/* ----------------------------------------------------------------- bodies */

export type CreateProfileBody = {
  patientId: string;
  type: string;
  location?: string;
  createdOn?: string;
  status?: string;
  dialysisCenterId?: string | null;
};

export type OverviewBody = {
  type?: string;
  location?: string;
  createdOn?: string | null;
  dialysisCenterId?: string | null;
};

export type BookAppointmentBody = {
  date: string;
  /** HH:mm, 24-hour. */
  time: string;
  title: string;
  place: string;
  team: string;
};

export type ReportConcernBody = {
  kinds: string[];
  detail: string;
  sendTo: string[];
  imageFileId?: string;
};

export type EditConcernBody = {
  kinds?: string[];
  detail?: string;
  sendTo?: string[];
  /** A new photo's file id, or null to remove the photo. */
  imageFileId?: string | null;
};

export type TransportBody = {
  appointmentId: string;
  pickupAddress: string;
  returnTrip: boolean;
  mobility: string;
  memberNote?: string;
};

export type ConfirmTransportBody = {
  /** HH:mm, 24-hour. */
  pickupTime: string;
  returnPickupTime?: string;
  provider: string;
  phone: string;
  confirmationNumber: string;
  note?: string;
};

export type PostMessageBody = {
  body?: string;
  imageFileId?: string;
  isPrivate?: boolean;
};

/* -------------------------------------------------------------- profiles */

export type ApiRosterParams = PageParams & { status?: string; search?: string };
export type ApiQueueParams = PageParams & { status?: string; active?: boolean };

export const listProfiles = (target: AccessTarget, params: PageParams = {}) =>
  fetchPage<ApiAccessProfile>(profilesPath(target), params);

/** The office roster (an office target only): ACTIVE relationships only. */
export const listRoster = (
  organizationId: string,
  params: ApiRosterParams = {},
) => {
  const { status, search, ...page } = params;
  return fetchPage<ApiAccessRosterEntry>(
    profilesPath({ kind: "office", organizationId }),
    page,
    { query: { status: status || undefined, search: search || undefined } },
  );
};

export const getProfile = (target: AccessTarget, profileId: string) =>
  api<ApiAccessProfile>(profilePath(target, profileId));

export const createProfile = (
  organizationId: string,
  body: CreateProfileBody,
) =>
  api<ApiAccessProfile>(profilesPath({ kind: "office", organizationId }), {
    method: "POST",
    body,
  });

export const updateOverview = (
  organizationId: string,
  profileId: string,
  body: OverviewBody,
) =>
  api<ApiAccessProfile>(
    profilePath({ kind: "office", organizationId }, profileId),
    { method: "PATCH", body },
  );

export const setStatus = (
  organizationId: string,
  profileId: string,
  status: string,
) =>
  api<ApiAccessProfile>(
    profilePath({ kind: "office", organizationId }, profileId, "/status"),
    { method: "PATCH", body: { status } },
  );

/* ------------------------------------------ appointments, updates, history */

export const listAppointments = (
  target: AccessTarget,
  profileId: string,
  params: PageParams & { state?: "upcoming" | "completed" | "all" } = {},
) => {
  const { state, ...page } = params;
  return fetchPage<ApiAccessAppointment>(
    profilePath(target, profileId, "/appointments"),
    page,
    { query: { state: state ?? undefined } },
  );
};

export const bookAppointment = (
  organizationId: string,
  profileId: string,
  body: BookAppointmentBody,
) =>
  api<ApiAccessAppointment>(
    profilePath({ kind: "office", organizationId }, profileId, "/appointments"),
    { method: "POST", body },
  );

export const completeAppointment = (
  organizationId: string,
  profileId: string,
  appointmentId: string,
  body: { result: string; performedBy: string },
) =>
  api<ApiAccessAppointment>(
    profilePath(
      { kind: "office", organizationId },
      profileId,
      `/appointments/${enc(appointmentId)}/complete`,
    ),
    { method: "POST", body },
  );

export const listUpdates = (
  target: AccessTarget,
  profileId: string,
  params: PageParams = {},
) =>
  fetchPage<ApiAccessUpdate>(
    profilePath(target, profileId, "/updates"),
    params,
  );

export const listHistory = (
  target: AccessTarget,
  profileId: string,
  params: PageParams = {},
) =>
  fetchPage<ApiAccessHistoryEntry>(
    profilePath(target, profileId, "/history"),
    params,
  );

/* --------------------------------------------------------------- concerns */

export const listConcerns = (
  target: AccessTarget,
  profileId: string,
  params: PageParams & { status?: "Open" | "Reviewed" } = {},
) => {
  const { status, ...page } = params;
  return fetchPage<ApiAccessConcern>(
    profilePath(target, profileId, "/concerns"),
    page,
    { query: { status: status ?? undefined } },
  );
};

/** Member routes only (patientSideOnly). */
export const reportConcern = (
  patientId: string,
  profileId: string,
  body: ReportConcernBody,
) =>
  api<ApiAccessConcern>(
    profilePath({ kind: "patient", patientId }, profileId, "/concerns"),
    { method: "POST", body },
  );

export const editConcern = (
  patientId: string,
  profileId: string,
  concernId: string,
  body: EditConcernBody,
) =>
  api<ApiAccessConcern>(
    profilePath(
      { kind: "patient", patientId },
      profileId,
      `/concerns/${enc(concernId)}`,
    ),
    { method: "PATCH", body },
  );

export const deleteConcern = (
  patientId: string,
  profileId: string,
  concernId: string,
) =>
  api<unknown>(
    profilePath(
      { kind: "patient", patientId },
      profileId,
      `/concerns/${enc(concernId)}`,
    ),
    { method: "DELETE" },
  );

export const resendConcern = (
  patientId: string,
  profileId: string,
  concernId: string,
) =>
  api<ApiAccessConcern>(
    profilePath(
      { kind: "patient", patientId },
      profileId,
      `/concerns/${enc(concernId)}/resend`,
    ),
    { method: "POST" },
  );

export const reviewConcern = (
  organizationId: string,
  profileId: string,
  concernId: string,
) =>
  api<ApiAccessConcern>(
    profilePath(
      { kind: "office", organizationId },
      profileId,
      `/concerns/${enc(concernId)}/review`,
    ),
    { method: "POST" },
  );

export const concernImageLink = (
  target: AccessTarget,
  profileId: string,
  concernId: string,
) =>
  api<ApiFileLink>(
    profilePath(target, profileId, `/concerns/${enc(concernId)}/image`),
  );

/* -------------------------------------------------------------- transport */

export const listTransport = (
  target: AccessTarget,
  profileId: string,
  params: PageParams & { status?: string } = {},
) => {
  const { status, ...page } = params;
  return fetchPage<ApiTransportRequest>(
    profilePath(target, profileId, "/transport"),
    page,
    { query: { status: status ?? undefined } },
  );
};

/** The office's ride queue across all its records (BE-12, spec 048). */
export const listOrganizationTransport = (
  organizationId: string,
  params: ApiQueueParams = {},
) => {
  const { status, active, ...page } = params;
  return fetchPage<ApiQueuedRide>(
    `/organizations/${enc(organizationId)}/transport`,
    page,
    { query: { status: status ?? undefined, active: active ?? undefined } },
  );
};

/** The member asks (POST on the member route). */
export const requestTransport = (
  patientId: string,
  profileId: string,
  body: TransportBody,
) =>
  api<ApiTransportRequest>(
    profilePath({ kind: "patient", patientId }, profileId, "/transport"),
    { method: "POST", body },
  );

/** The dialysis center sets one up (office route, dialysis center only). */
export const setUpTransport = (
  organizationId: string,
  profileId: string,
  body: TransportBody,
) =>
  api<ApiTransportRequest>(
    profilePath({ kind: "office", organizationId }, profileId, "/transport"),
    { method: "POST", body },
  );

export const acknowledgeTransport = (
  organizationId: string,
  profileId: string,
  requestId: string,
) =>
  api<ApiTransportRequest>(
    profilePath(
      { kind: "office", organizationId },
      profileId,
      `/transport/${enc(requestId)}/acknowledge`,
    ),
    { method: "POST" },
  );

/** Confirm, or correct a confirmed ride (same route). */
export const confirmTransport = (
  organizationId: string,
  profileId: string,
  requestId: string,
  body: ConfirmTransportBody,
) =>
  api<ApiTransportRequest>(
    profilePath(
      { kind: "office", organizationId },
      profileId,
      `/transport/${enc(requestId)}/confirm`,
    ),
    { method: "POST", body },
  );

/** Member or dialysis center, each on its own route. */
export const cancelTransport = (
  target: AccessTarget,
  profileId: string,
  requestId: string,
) =>
  api<ApiTransportRequest>(
    profilePath(target, profileId, `/transport/${enc(requestId)}/cancel`),
    { method: "POST" },
  );

/* --------------------------------------------------------------- messages */

/** Newest first, paged. */
export const listMessages = (
  target: AccessTarget,
  profileId: string,
  params: PageParams = {},
) =>
  fetchPage<ApiAccessMessage>(
    profilePath(target, profileId, "/messages"),
    params,
  );

export const postMessage = (
  target: AccessTarget,
  profileId: string,
  body: PostMessageBody,
) =>
  api<ApiAccessMessage>(profilePath(target, profileId, "/messages"), {
    method: "POST",
    body,
  });

export const setMessagePrivacy = (
  target: AccessTarget,
  profileId: string,
  messageId: string,
  isPrivate: boolean,
) =>
  api<ApiAccessMessage>(
    profilePath(target, profileId, `/messages/${enc(messageId)}/privacy`),
    { method: "PATCH", body: { isPrivate } },
  );

export const setDialysisCanPost = (
  target: AccessTarget,
  profileId: string,
  dialysisCanPost: boolean,
) =>
  api<unknown>(profilePath(target, profileId, "/messages/settings"), {
    method: "PATCH",
    body: { dialysisCanPost },
  });

export const markRead = (target: AccessTarget, profileId: string) =>
  api<unknown>(profilePath(target, profileId, "/messages/read"), {
    method: "POST",
  });

export const messageImageLink = (
  target: AccessTarget,
  profileId: string,
  messageId: string,
) =>
  api<ApiFileLink>(
    profilePath(target, profileId, `/messages/${enc(messageId)}/image`),
  );
