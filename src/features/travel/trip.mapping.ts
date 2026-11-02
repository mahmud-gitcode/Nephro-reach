/* ==========================================================================
   Travel dialysis: API <-> screen (Phase 8; ADR 0007)
   --------------------------------------------------------------------------
   The API sends a trip flat (street, city, emergencyName, insurancePlan,
   placementFacilityName, …); the screens read the nested `TripRequest` they
   were built on. These pure functions are the only place the two shapes
   meet. Days stay `YYYY-MM-DD`, times `HH:mm`, statuses are the backend's
   six (D10 keeps them), and every optional string the API sends as null is
   "" on screen. Nothing here stores anything.
   ========================================================================== */

import type {
  ConfirmedTreatment,
  TimeChangeRequest,
  TimePreference,
  TravelDocumentFile,
  TravelDocumentKey,
  TravelPrepKey,
  TripRequest,
  TripStatus,
  Weekday,
} from "./trip.types";

/* ---------------------------------------------------------------- the API */

export type ApiTripStatusEvent = {
  id: string;
  status: TripStatus;
  changedById: string | null;
  at: string;
};

export type ApiTripDocument = {
  id: string;
  key: TravelDocumentKey;
  fileName: string | null;
  contentType: string;
  sizeBytes: number | null;
  attachedAt: string;
};

export type ApiTimeChange = {
  id: string;
  preferredTime: TimePreference;
  preferredDays: Weekday[];
  note: string;
  requestedAt: string;
  resolvedAt: string | null;
  facilityReply: string | null;
};

export type ApiTrip = {
  id: string;
  patientId: string;
  organizationId: string | null;
  street: string;
  city: string;
  state: string;
  zip: string | null;
  departDate: string;
  returnDate: string;
  treatmentsNeeded: number;
  preferredDays: Weekday[];
  preferredTime: TimePreference;
  emergencyName: string;
  emergencyPhone: string;
  contactPhone: string | null;
  emergencyRelationship: string | null;
  insurancePlan: string | null;
  insuranceMemberId: string | null;
  documentsReady: TravelDocumentKey[];
  prepDone: TravelPrepKey[];
  notes: string | null;
  status: TripStatus;
  facilityNote: string | null;
  placementFacilityName: string | null;
  placementAddress: string | null;
  placementPhone: string | null;
  confirmedTreatments: { id: string; date: string; time: string }[];
  cancelRequestedAt: string | null;
  statusEvents: ApiTripStatusEvent[];
  documents: ApiTripDocument[];
  timeChangeRequests: ApiTimeChange[];
  submittedAt: string;
  updatedAt: string;
};

/** The office's detail read adds whose trip it is. */
export type ApiOfficeTrip = ApiTrip & {
  firstName: string;
  lastName: string;
  mrn: string | null;
};

/** One row of the office inbox (`GET /organizations/:id/trips`). */
export type ApiOfficeTripSummary = {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  mrn: string | null;
  city: string;
  state: string;
  departDate: string;
  returnDate: string;
  treatmentsNeeded: number;
  confirmedTreatmentCount: number;
  status: TripStatus;
  placementFacilityName: string | null;
  hasOpenTimeChange: boolean;
  cancelRequestedAt: string | null;
  submittedAt: string;
  updatedAt: string;
};

/** What the member sends on create and on edit (UpdateTripDto replaces
 *  every request field). */
export type TripBody = {
  street: string;
  city: string;
  state: string;
  zip?: string;
  departDate: string;
  returnDate: string;
  treatmentsNeeded: number;
  preferredDays: Weekday[];
  preferredTime: TimePreference;
  emergencyName: string;
  emergencyPhone: string;
  contactPhone?: string;
  emergencyRelationship?: string;
  insurancePlan?: string;
  insuranceMemberId?: string;
  notes?: string;
};

export type CreateTripBody = TripBody & {
  documentsReady: TravelDocumentKey[];
  prepDone: TravelPrepKey[];
};

/* ------------------------------------------------------------- helpers */

const text = (value: string | null | undefined) => value ?? "";
/** A day as `YYYY-MM-DD`, whether the API sent a day or a timestamp. */
export const day = (value: string | null | undefined) =>
  (value ?? "").slice(0, 10);
/** An optional string to send: trimmed, or left out when empty. */
const optional = (value: string | undefined) => {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : undefined;
};

export function toTimeChange(raw: ApiTimeChange): TimeChangeRequest {
  return {
    id: raw.id,
    requestedAt: raw.requestedAt,
    preferredTime: raw.preferredTime,
    preferredDays: raw.preferredDays ?? [],
    note: text(raw.note),
    resolvedAt: raw.resolvedAt ?? undefined,
    facilityReply: raw.facilityReply ?? undefined,
  };
}

/** The open request if there is one, else the newest answered one. */
export function currentTimeChange(
  list: readonly TimeChangeRequest[],
): TimeChangeRequest | undefined {
  const newest = [...list].sort((a, b) =>
    b.requestedAt.localeCompare(a.requestedAt),
  );
  return newest.find((r) => !r.resolvedAt) ?? newest[0];
}

export function toDocumentFile(raw: ApiTripDocument): TravelDocumentFile {
  return {
    id: raw.id,
    key: raw.key,
    fileName: raw.fileName ?? null,
    sizeBytes: raw.sizeBytes ?? null,
    contentType: raw.contentType,
    attachedAt: raw.attachedAt,
  };
}

/* ---------------------------------------------------------- API -> screen */

export function toTrip(raw: ApiTrip | ApiOfficeTrip): TripRequest {
  const treatments: ConfirmedTreatment[] = (raw.confirmedTreatments ?? []).map(
    (t) => ({ id: t.id, date: day(t.date), time: t.time }),
  );
  const hasPlacement =
    Boolean(raw.placementFacilityName) ||
    Boolean(raw.placementAddress) ||
    Boolean(raw.placementPhone) ||
    treatments.length > 0;
  const timeChanges = (raw.timeChangeRequests ?? [])
    .map(toTimeChange)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  const office = "firstName" in raw;
  return {
    id: raw.id,
    patientId: raw.patientId,
    organizationId: raw.organizationId ?? null,
    patient: office
      ? {
          name: `${raw.firstName} ${raw.lastName}`.trim(),
          mrn: raw.mrn ?? undefined,
        }
      : undefined,
    destination: {
      street: text(raw.street),
      city: text(raw.city),
      state: text(raw.state),
      zip: text(raw.zip),
    },
    departDate: day(raw.departDate),
    returnDate: day(raw.returnDate),
    treatmentsNeeded: raw.treatmentsNeeded,
    preferredDays: raw.preferredDays ?? [],
    preferredTime: raw.preferredTime ?? "any",
    contactPhone: text(raw.contactPhone),
    emergencyContact: {
      name: text(raw.emergencyName),
      phone: text(raw.emergencyPhone),
      relationship: text(raw.emergencyRelationship),
    },
    insurance: {
      plan: text(raw.insurancePlan),
      memberId: text(raw.insuranceMemberId),
    },
    documentsReady: raw.documentsReady ?? [],
    prepDone: raw.prepDone ?? [],
    documentFiles: (raw.documents ?? []).map(toDocumentFile),
    notes: text(raw.notes),
    status: raw.status,
    submittedAt: raw.submittedAt,
    updatedAt: raw.updatedAt,
    /* Oldest first, for the timeline (sorted here for display only). */
    statusHistory: [...(raw.statusEvents ?? [])]
      .sort((a, b) => a.at.localeCompare(b.at))
      .map((e) => ({ status: e.status, at: e.at })),
    facilityNote: text(raw.facilityNote),
    placement: hasPlacement
      ? {
          facilityName: text(raw.placementFacilityName),
          address: text(raw.placementAddress),
          phone: text(raw.placementPhone),
          treatments,
        }
      : undefined,
    timeChange: currentTimeChange(timeChanges),
    timeChanges,
    cancelRequestedAt: raw.cancelRequestedAt ?? undefined,
  };
}

/** One office inbox row, as the facility table reads it. */
export type OfficeTripRow = {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  city: string;
  state: string;
  departDate: string;
  returnDate: string;
  treatmentsNeeded: number;
  bookedCount: number;
  status: TripStatus;
  facilityName: string;
  hasOpenTimeChange: boolean;
  cancelRequestedAt?: string;
  submittedAt: string;
};

export function toOfficeRow(raw: ApiOfficeTripSummary): OfficeTripRow {
  return {
    id: raw.id,
    patientId: raw.patientId,
    patientName: `${raw.firstName} ${raw.lastName}`.trim(),
    mrn: text(raw.mrn),
    city: text(raw.city),
    state: text(raw.state),
    departDate: day(raw.departDate),
    returnDate: day(raw.returnDate),
    treatmentsNeeded: raw.treatmentsNeeded,
    bookedCount: raw.confirmedTreatmentCount ?? 0,
    status: raw.status,
    facilityName: text(raw.placementFacilityName),
    hasOpenTimeChange: raw.hasOpenTimeChange === true,
    cancelRequestedAt: raw.cancelRequestedAt ?? undefined,
    submittedAt: raw.submittedAt,
  };
}

/* ---------------------------------------------------------- screen -> API */

/** The request fields of a trip, flat, for create and edit. */
export function toTripBody(trip: TripRequest): TripBody {
  return {
    street: trip.destination.street.trim(),
    city: trip.destination.city.trim(),
    state: trip.destination.state.trim().toUpperCase(),
    zip: optional(trip.destination.zip),
    departDate: trip.departDate,
    returnDate: trip.returnDate,
    treatmentsNeeded: trip.treatmentsNeeded,
    preferredDays: trip.preferredDays,
    preferredTime: trip.preferredTime,
    emergencyName: trip.emergencyContact.name.trim(),
    emergencyPhone: trip.emergencyContact.phone.trim(),
    contactPhone: optional(trip.contactPhone),
    emergencyRelationship: optional(trip.emergencyContact.relationship),
    insurancePlan: optional(trip.insurance.plan),
    insuranceMemberId: optional(trip.insurance.memberId),
    notes: optional(trip.notes),
  };
}

export function toCreateTripBody(trip: TripRequest): CreateTripBody {
  return {
    ...toTripBody(trip),
    documentsReady: trip.documentsReady,
    prepDone: trip.prepDone,
  };
}

/** The placement as the API takes it: names or null, treatments `HH:mm`. */
export function toPlacementBody(placement: {
  facilityName: string;
  address: string;
  phone: string;
  treatments: ConfirmedTreatment[];
}) {
  const orNull = (value: string) => (value.trim() ? value.trim() : null);
  return {
    facilityName: orNull(placement.facilityName),
    address: orNull(placement.address),
    phone: orNull(placement.phone),
    treatments: placement.treatments.map((t) => ({
      date: t.date,
      time: t.time.slice(0, 5),
    })),
  };
}
