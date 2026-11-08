/* ==========================================================================
   Vascular access: API rows → the shapes the screens draw (Phase 10)
   --------------------------------------------------------------------------
   Unknown enum values are kept as sent where a screen only shows them, and
   narrowed to a safe default where a screen branches on them (a party, a
   status), so a new server value can never open a control by accident.
   ========================================================================== */

import type {
  ApiAccessAppointment,
  ApiAccessConcern,
  ApiAccessHistoryEntry,
  ApiAccessMessage,
  ApiAccessProfile,
  ApiAccessRosterEntry,
  ApiAccessUpdate,
  ApiQueuedRide,
  ApiTransportRequest,
} from "./access.repository";
import {
  ACCESS_STATUSES,
  type AccessAppointment,
  type AccessConcern,
  type AccessHistoryEntry,
  type AccessMessage,
  type AccessOverview,
  type AccessParty,
  type AccessProfileSummary,
  type AccessRecord,
  type AccessRosterRow,
  type AccessStatus,
  type AccessTeam,
  type AccessUpdate,
  type ConcernRecipient,
  type HistoryType,
  type MobilityLevel,
  type QueuedRide,
  type TransportRequest,
  type TransportStatus,
  type UpdateKind,
} from "./vascularAccess.data";

const PARTIES: readonly AccessParty[] = ["member", "access", "dialysis"];
const TRANSPORT_STATUSES: readonly TransportStatus[] = [
  "Requested",
  "Acknowledged",
  "Confirmed",
  "Cancelled",
];

/** A party the client knows; anything else reads as the dialysis center
 *  (the party with the fewest controls). */
export function toParty(value: string): AccessParty {
  return (PARTIES as readonly string[]).includes(value)
    ? (value as AccessParty)
    : "dialysis";
}

function toStatus(value: string): AccessStatus {
  return (ACCESS_STATUSES as readonly string[]).includes(value)
    ? (value as AccessStatus)
    : "Review Requested";
}

function toTransportStatus(value: string | null): TransportStatus | null {
  if (value === null) return null;
  return (TRANSPORT_STATUSES as readonly string[]).includes(value)
    ? (value as TransportStatus)
    : "Requested";
}

const day = (value: string | null | undefined) =>
  value ? value.slice(0, 10) : "";

export function toOverview(row: ApiAccessProfile): AccessOverview {
  return {
    type: row.type,
    location: row.location,
    createdOn: day(row.createdOn),
    status: toStatus(row.status),
    lastAssessment: day(row.lastAssessmentOn),
  };
}

export function toAppointment(row: ApiAccessAppointment): AccessAppointment {
  return {
    id: row.id,
    date: day(row.date),
    time: row.time,
    title: row.title,
    place: row.place,
    team: (row.team === "dialysis" ? "dialysis" : "vascular") as AccessTeam,
    ...(row.completedAt
      ? {
          completed: {
            result: row.result ?? "",
            performedBy: row.performedBy ?? "",
          },
        }
      : {}),
    transportStatus: toTransportStatus(row.transportStatus),
  };
}

export function toUpdate(row: ApiAccessUpdate): AccessUpdate {
  return {
    id: row.id,
    date: day(row.date),
    title: row.title,
    detail: row.detail,
    kind: (["done", "scheduled", "received"].includes(row.kind)
      ? row.kind
      : "received") as UpdateKind,
  };
}

export function toHistory(row: ApiAccessHistoryEntry): AccessHistoryEntry {
  return {
    id: row.id,
    date: day(row.date),
    type: row.type as HistoryType,
    procedure: row.procedure,
    location: row.location,
    performedBy: row.performedBy,
    result: row.result,
  };
}

export function toConcern(row: ApiAccessConcern): AccessConcern {
  return {
    id: row.id,
    reportedAt: row.reportedAt,
    kinds: row.kinds,
    detail: row.detail,
    hasImage: row.hasImage,
    status: row.status === "Reviewed" ? "Reviewed" : "Open",
    ...(row.editedAt ? { editedAt: row.editedAt } : {}),
    ...(row.resentAt ? { resentAt: row.resentAt } : {}),
    sendTo: row.sendTo.filter(
      (who): who is ConcernRecipient => who === "access" || who === "dialysis",
    ),
  };
}

export function toTransport(row: ApiTransportRequest): TransportRequest {
  const status = toTransportStatus(row.status) ?? "Requested";
  return {
    id: row.id,
    profileId: row.profileId,
    requestedAt: row.requestedAt,
    appointmentId: row.appointmentId,
    appointment: row.appointment
      ? {
          id: row.appointment.id,
          date: day(row.appointment.date),
          time: row.appointment.time,
          title: row.appointment.title,
          place: row.appointment.place,
          completed: !!row.appointment.completedAt,
        }
      : null,
    status,
    handledBy: row.handledBy,
    pickupAddress: row.pickupAddress,
    returnTrip: row.returnTrip,
    mobility: row.mobility as MobilityLevel,
    memberNote: row.memberNote,
    ...(row.acknowledgedAt ? { acknowledgedAt: row.acknowledgedAt } : {}),
    ...(row.confirmedAt ? { confirmedAt: row.confirmedAt } : {}),
    /* The booked details, nested as the screens draw them. */
    ...(row.confirmedAt && row.pickupTime
      ? {
          confirmation: {
            pickupTime: row.pickupTime,
            ...(row.returnPickupTime
              ? { returnPickupTime: row.returnPickupTime }
              : {}),
            provider: row.provider ?? "",
            phone: row.phone ?? "",
            confirmationNumber: row.confirmationNumber ?? "",
            ...(row.confirmationNote ? { note: row.confirmationNote } : {}),
          },
        }
      : {}),
    ...(row.confirmedByName ? { confirmedBy: row.confirmedByName } : {}),
    ...(row.cancelledAt ? { cancelledAt: row.cancelledAt } : {}),
    ...(row.cancelledBy === "member" || row.cancelledBy === "dialysis"
      ? { cancelledBy: row.cancelledBy }
      : {}),
  };
}

export function toQueuedRide(row: ApiQueuedRide): QueuedRide {
  return {
    request: toTransport(row),
    patientId: row.patientId,
    memberName: `${row.firstName} ${row.lastName}`.trim(),
    mrn: row.mrn,
  };
}

/** A hidden message keeps only its place in the thread: the server sent no
 *  body, picture or author, and nothing here adds one. */
export function toMessage(row: ApiAccessMessage): AccessMessage {
  if (row.hidden) {
    return {
      id: row.id,
      author: toParty(row.party),
      authorName: null,
      body: null,
      sentAt: row.sentAt,
      hasImage: false,
      private: row.isPrivate,
      hidden: true,
      mine: false,
    };
  }
  return {
    id: row.id,
    author: toParty(row.party),
    authorName: row.authorName,
    body: row.body,
    sentAt: row.sentAt,
    hasImage: row.hasImage,
    private: row.isPrivate,
    hidden: false,
    mine: row.mine,
  };
}

export function toRosterRow(row: ApiAccessRosterEntry): AccessRosterRow {
  return {
    id: row.id,
    patientId: row.patientId,
    memberName: `${row.firstName} ${row.lastName}`.trim(),
    mrn: row.mrn,
    accessCenter: row.accessCenter,
    dialysisCenter: row.dialysisCenter,
    party: toParty(row.party),
    unread: row.unread,
    dialysisCanPost: row.dialysisCanPost,
    overview: toOverview(row),
    openConcerns: row.openConcerns,
    nextAppointment: row.nextAppointment
      ? toAppointment(row.nextAppointment)
      : null,
  };
}

/** The member's profiles, for the selector: one per access center. */
export function toProfileList(
  rows: ApiAccessProfile[],
): AccessProfileSummary[] {
  return rows.map((row) => ({
    id: row.id,
    patientId: row.patientId,
    accessCenter: row.accessCenter,
    dialysisCenter: row.dialysisCenter,
    party: toParty(row.party),
    unread: row.unread,
    overview: toOverview(row),
  }));
}

/** The record a screen draws, from the profile and its parts. */
export function toRecord(
  profile: ApiAccessProfile,
  parts: {
    memberName: string;
    mrn: string | null;
    appointments: ApiAccessAppointment[];
    updates: ApiAccessUpdate[];
    history: ApiAccessHistoryEntry[];
    concerns: ApiAccessConcern[];
    transport: ApiTransportRequest[];
    /** Newest first, as the API pages them. */
    messages: ApiAccessMessage[];
  },
): AccessRecord {
  return {
    id: profile.id,
    patientId: profile.patientId,
    memberName: parts.memberName,
    mrn: parts.mrn,
    accessCenter: profile.accessCenter,
    dialysisCenter: profile.dialysisCenter,
    party: toParty(profile.party),
    unread: profile.unread,
    overview: toOverview(profile),
    appointments: parts.appointments.map(toAppointment),
    updates: parts.updates.map(toUpdate),
    history: parts.history.map(toHistory),
    concerns: parts.concerns.map(toConcern),
    transport: parts.transport.map(toTransport),
    conversation: {
      messages: [...parts.messages].reverse().map(toMessage),
      dialysisCanPost: profile.dialysisCanPost,
    },
  };
}
