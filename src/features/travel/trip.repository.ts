/* ==========================================================================
   Travel dialysis: one function per server operation (Phase 8; ADR 0007)
   --------------------------------------------------------------------------
   Member side: `/patients/:patientId/trips…` (the member, or a caregiver
   acting under their own session, D1). Office side:
   `/organizations/:organizationId/trips…` for the office picked in the
   portal. No whole-list writes, no seed fallback (an empty log is empty),
   and no browser storage: `nr:travel-trip-requests` is retired and purged.

   There is no trip delete (D20): a member asks to cancel, and the status,
   history and audit are kept.

   Documents go through `uploadFile` (ADR 0007 §4) and are attached by file
   id; a download link is fetched on demand and never stored.
   ========================================================================== */

import { api, apiRequest } from "@/lib/api/client";
import { fetchPage, type Page } from "@/lib/api/paging";
import { uploadFile } from "@/lib/api/upload";
import type { PatientScope } from "@/lib/data/queryKeys";
import { patientPath } from "@/features/profile/patientScope";
import { officePath } from "@/features/clinic/office.scope";
import type {
  ApiOfficeTrip,
  ApiOfficeTripSummary,
  ApiTimeChange,
  ApiTrip,
  ApiTripDocument,
  CreateTripBody,
  TripBody,
} from "./trip.mapping";
import type {
  TimePreference,
  TravelDocumentKey,
  TravelPrepKey,
  TripStatus,
  Weekday,
} from "./trip.types";

const id = (value: string) => encodeURIComponent(value);
const memberTrip = (scope: PatientScope, tripId: string, rest = "") =>
  patientPath(scope, `/trips/${id(tripId)}${rest}`);
const officeTrip = (organizationId: string, tripId: string, rest = "") =>
  officePath(organizationId, `/trips/${id(tripId)}${rest}`);

/** The member's own list is one bounded page: a member has a handful of
 *  trips; `pagination.total` says if there are more. */
export const MEMBER_TRIP_WINDOW = 100;

/* ------------------------------------------------------------ member side */

export function listTrips(
  scope: PatientScope,
  q: { status?: TripStatus; page?: number; limit?: number } = {},
): Promise<Page<ApiTrip>> {
  return fetchPage<ApiTrip>(
    patientPath(scope, "/trips"),
    { page: q.page, limit: q.limit ?? MEMBER_TRIP_WINDOW },
    { query: { status: q.status } },
  );
}

export const getTrip = (scope: PatientScope, tripId: string) =>
  api<ApiTrip>(memberTrip(scope, tripId));

/** `message` is the server's (`trip_created`, or `trip_created_outside`
 *  when the home clinic is not on NephroReach, so no office received it). */
export async function createTrip(scope: PatientScope, body: CreateTripBody) {
  const envelope = await apiRequest<ApiTrip>(patientPath(scope, "/trips"), {
    method: "POST",
    body,
  });
  return { trip: envelope.data, message: envelope.message };
}

/** Only while `submitted` and not asked to cancel (409 trip_not_editable). */
export const updateTrip = (
  scope: PatientScope,
  tripId: string,
  body: TripBody,
) => api<ApiTrip>(memberTrip(scope, tripId), { method: "PUT", body });

export const setChecklist = (
  scope: PatientScope,
  tripId: string,
  body: { documentsReady?: TravelDocumentKey[]; prepDone?: TravelPrepKey[] },
) =>
  api<ApiTrip>(memberTrip(scope, tripId, "/checklist"), {
    method: "PUT",
    body,
  });

/** Idempotent; 409 trip_closed once the trip is closed. */
export const requestCancellation = (scope: PatientScope, tripId: string) =>
  api<ApiTrip>(memberTrip(scope, tripId, "/cancellation-request"), {
    method: "POST",
  });

export const requestTimeChange = (
  scope: PatientScope,
  tripId: string,
  body: {
    preferredTime: TimePreference;
    preferredDays?: Weekday[];
    note: string;
  },
) =>
  api<ApiTimeChange>(memberTrip(scope, tripId, "/time-change-requests"), {
    method: "POST",
    body,
  });

export const withdrawTimeChange = (
  scope: PatientScope,
  tripId: string,
  requestId: string,
) =>
  api<unknown>(
    memberTrip(scope, tripId, `/time-change-requests/${id(requestId)}`),
    { method: "DELETE" },
  );

/** Uploads the file (presigned, ADR 0007 §4) and attaches it by file id. */
export async function addDocument(
  scope: PatientScope,
  tripId: string,
  key: TravelDocumentKey,
  file: File,
) {
  const fileId = await uploadFile(file);
  return api<ApiTripDocument>(memberTrip(scope, tripId, "/documents"), {
    method: "POST",
    body: { key, fileId },
  });
}

export const removeDocument = (
  scope: PatientScope,
  tripId: string,
  documentId: string,
) =>
  api<unknown>(memberTrip(scope, tripId, `/documents/${id(documentId)}`), {
    method: "DELETE",
  });

/** A short-lived link, fetched when the member opens the file; never kept. */
export const documentLink = (
  scope: PatientScope,
  tripId: string,
  documentId: string,
) =>
  api<{ url: string; expiresAt?: string }>(
    memberTrip(scope, tripId, `/documents/${id(documentId)}/download-link`),
  );

/* ------------------------------------------------------------ office side */

export type OfficeTripQuery = {
  status?: TripStatus;
  /** Trips still going on at or after this day. */
  from?: string;
  /** Trips that ended before this day (BE-5, spec 045). */
  before?: string;
  /** Patient name, MRN or city (BE-1, spec 045). */
  search?: string;
  cancelRequested?: boolean;
  openTimeChange?: boolean;
  page?: number;
  limit?: number;
};

export function listOrgTrips(
  organizationId: string,
  q: OfficeTripQuery = {},
): Promise<Page<ApiOfficeTripSummary>> {
  return fetchPage<ApiOfficeTripSummary>(
    officePath(organizationId, "/trips"),
    { page: q.page, limit: q.limit },
    {
      query: {
        status: q.status,
        from: q.from,
        before: q.before,
        search: q.search?.trim() || undefined,
        cancelRequested: q.cancelRequested,
        openTimeChange: q.openTimeChange,
      },
    },
  );
}

export const getOrgTrip = (organizationId: string, tripId: string) =>
  api<ApiOfficeTrip>(officeTrip(organizationId, tripId));

/** 409 status_unchanged for the same status; confirm_needs_placement. */
export const setStatus = (
  organizationId: string,
  tripId: string,
  status: TripStatus,
) =>
  api<unknown>(officeTrip(organizationId, tripId, "/status"), {
    method: "PUT",
    body: { status },
  });

export const setPlacement = (
  organizationId: string,
  tripId: string,
  body: {
    facilityName: string | null;
    address: string | null;
    phone: string | null;
    treatments: { date: string; time: string }[];
  },
) =>
  api<unknown>(officeTrip(organizationId, tripId, "/placement"), {
    method: "PUT",
    body,
  });

export const setFacilityNote = (
  organizationId: string,
  tripId: string,
  note: string,
) =>
  api<unknown>(officeTrip(organizationId, tripId, "/facility-note"), {
    method: "PUT",
    body: { note },
  });

export const answerTimeChange = (
  organizationId: string,
  tripId: string,
  requestId: string,
  reply: string,
) =>
  api<unknown>(
    officeTrip(
      organizationId,
      tripId,
      `/time-change-requests/${id(requestId)}/answer`,
    ),
    { method: "POST", body: { reply } },
  );

/** Closes a trip the member asked to cancel (instead of PUT …/status). */
export const closeCancellation = (
  organizationId: string,
  tripId: string,
  note?: string,
) =>
  api<unknown>(officeTrip(organizationId, tripId, "/cancellation/close"), {
    method: "POST",
    body: note?.trim() ? { note: note.trim() } : {},
  });

/** A short-lived link, fetched when staff open the file; never kept. */
export const orgDocumentLink = (
  organizationId: string,
  tripId: string,
  documentId: string,
) =>
  api<{ url: string; expiresAt?: string }>(
    officeTrip(
      organizationId,
      tripId,
      `/documents/${id(documentId)}/download-link`,
    ),
  );
