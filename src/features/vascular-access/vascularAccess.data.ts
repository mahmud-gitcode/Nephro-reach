/* ==========================================================================
   Vascular access — shapes, seed and rules
   --------------------------------------------------------------------------
   One record per patient, shared by two screens: the member's Vascular
   Access tab and the clinic's. An appointment the access team books on the
   clinic side is the same record the member sees, and a concern the member
   reports is the one the clinic reviews.

   It is kept apart from the general care-team inbox on purpose. The client
   asked for access communication to stand on its own for compliance, so it
   has its own store rather than a category inside Messages.

   Three parties work each record (client, 2026-09-30), following common
   US practice:
     · the patient
     · the Vascular Access Center: a separate organisation that creates and
       repairs the access, with its own login
     · the Dialysis Center: sees the access every treatment, refers
       problems, and (its social worker) arranges rides

   Messages are one three-way conversation. The dialysis center reads what
   is shared and may post once the patient or the access center allows it;
   either of those two can mark a message private, which the dialysis
   center then sees only as a placeholder.

   Staff refer to the access center directly, without the patient: the
   dialysis center (a nurse who finds no thrill or bruit) and the
   nephrology office (a patient who needs an access placed) send a
   referral, and the two sides talk it through on the referral itself
   (client, 2026-10-01). The access center acknowledges, schedules or
   closes it. The same threads are the access center's Messages page, and
   it can start one with either office too.

   A ride request goes to the dialysis center's social worker and moves
   Requested → Acknowledged → Confirmed (pickup time, company, phone,
   confirmation number), and the confirmation posts back to the patient's
   updates. Either side can cancel.

   Pure: state in, state out. Storage lives in useVascularAccess.ts.
   ========================================================================== */

import { DEMO_MEMBER } from "@/features/messaging/messaging.seed";
import { DEMO_MEMBER_MRN } from "@/lib/data/demoIdentity";

export type AccessTeam = "vascular" | "dialysis";

export const TEAM_LABEL: Record<AccessTeam, string> = {
  vascular: "Vascular Access Team",
  dialysis: "Dialysis Center",
};

/** Workflow states, not a clinical verdict (client, 2026-10-01): "No
 *  Active Concern" says nothing is open, without implying the access was
 *  assessed as working. */
export const ACCESS_STATUSES = [
  "No Active Concern",
  "Review Requested",
  "Concern Reported",
  "Appointment Scheduled",
  "Follow-Up Needed",
  "Closed",
] as const;
export type AccessStatus = (typeof ACCESS_STATUSES)[number];

export const ACCESS_TYPES = [
  "AV Fistula",
  "AV Graft",
  "Tunneled Catheter",
  "PD Catheter",
] as const;

export type AccessOverview = {
  type: string;
  location: string;
  /** YYYY-MM-DD */
  createdOn: string;
  status: AccessStatus;
  /** YYYY-MM-DD, or "" when there has not been one. */
  lastAssessment: string;
};

export type AccessAppointment = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, 24-hour. */
  time: string;
  title: string;
  place: string;
  team: AccessTeam;
  /** Set when the visit happened; it then moves to history. */
  completed?: { result: string; performedBy: string };
};

export const APPOINTMENT_TYPES = [
  "Access Follow-Up",
  "Ultrasound (Access)",
  "Fistulogram",
  "Access Check",
  "Catheter Exchange",
  "Surgical Consult",
  "Access Placement Surgery",
  "PD Catheter Placement",
] as const;

export type UpdateKind = "done" | "scheduled" | "received";

export type AccessUpdate = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  detail: string;
  kind: UpdateKind;
};

export type HistoryType = "Imaging" | "Procedure" | "Surgery" | "Consult";

export type AccessHistoryEntry = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  type: HistoryType;
  procedure: string;
  location: string;
  performedBy: string;
  result: string;
};

export const CONCERN_KINDS = [
  { id: "bleeding", en: "Bleeding", es: "Sangrado" },
  { id: "swelling", en: "Swelling", es: "Hinchazón" },
  { id: "redness", en: "Redness or warmth", es: "Enrojecimiento o calor" },
  { id: "pain", en: "Pain", es: "Dolor" },
  { id: "thrill", en: "No thrill or bruit", es: "Sin frémito ni soplo" },
  { id: "drainage", en: "Drainage", es: "Secreción" },
  { id: "other", en: "Other", es: "Otro" },
] as const;

export type AccessConcern = {
  id: string;
  /** ISO 8601 */
  reportedAt: string;
  kinds: string[];
  detail: string;
  imageUrl?: string;
  status: "Open" | "Reviewed";
};

/** Who arranges rides: the dialysis center's social worker, as is usual
 *  for dialysis patients' non-emergency transport. */
export const TRANSPORT_COORDINATOR = "Social Worker, Riverside Dialysis Center";

/** The standard non-emergency transport levels. */
export const MOBILITY_LEVELS = [
  { id: "ambulatory", en: "Can walk", es: "Puede caminar" },
  { id: "wheelchair", en: "Wheelchair", es: "Silla de ruedas" },
  { id: "stretcher", en: "Stretcher", es: "Camilla" },
] as const;
export type MobilityLevel = (typeof MOBILITY_LEVELS)[number]["id"];

export type TransportStatus =
  "Requested" | "Acknowledged" | "Confirmed" | "Cancelled";

export type TransportConfirmation = {
  /** HH:MM, 24-hour. */
  pickupTime: string;
  /** HH:MM, when a return trip was asked for. */
  returnPickupTime?: string;
  /** The transport company or driver. */
  provider: string;
  phone: string;
  confirmationNumber: string;
  note?: string;
};

export type TransportRequest = {
  id: string;
  /** ISO 8601 */
  requestedAt: string;
  appointmentId: string;
  status: TransportStatus;
  /** Who the request went to. */
  handledBy: string;
  pickupAddress: string;
  returnTrip: boolean;
  mobility: MobilityLevel;
  /** Anything else the driver should know, from the patient. */
  memberNote: string;
  /** ISO 8601 */
  acknowledgedAt?: string;
  /** ISO 8601 */
  confirmedAt?: string;
  confirmation?: TransportConfirmation;
  /** Who booked it, when a staff member signed in as themselves. */
  confirmedBy?: string;
  /** ISO 8601 */
  cancelledAt?: string;
  cancelledBy?: "member" | "dialysis";
};

export type TransportDetails = Pick<
  TransportRequest,
  "appointmentId" | "pickupAddress" | "returnTrip" | "mobility" | "memberNote"
>;

/* ------------------------------------------------------------ messages */

export type AccessParty = "member" | "access" | "dialysis";

export const PARTY_LABEL: Record<AccessParty, string> = {
  member: "Patient",
  access: "Vascular Access Center",
  dialysis: "Dialysis Center",
};

/** The access center the demo's access login belongs to. */
export const ACCESS_CENTER_NAME = "Metro Vascular Access Center";
export const DIALYSIS_CENTER_NAME = "Riverside Dialysis Center";

export type AccessMessage = {
  id: string;
  author: AccessParty;
  /** Who wrote it on that side: "Dr. Patel", "Nurse Wilson". */
  authorName: string;
  body: string;
  /** ISO 8601 */
  sentAt: string;
  imageUrl?: string;
  /** Between the patient and the access center only. */
  private?: boolean;
};

export type AccessConversation = {
  messages: AccessMessage[];
  /** The dialysis center may post. Reading shared messages is always on. */
  dialysisCanPost: boolean;
  unread: Record<AccessParty, number>;
};

export type AccessRecord = {
  memberName: string;
  mrn: string;
  overview: AccessOverview;
  appointments: AccessAppointment[];
  updates: AccessUpdate[];
  history: AccessHistoryEntry[];
  concerns: AccessConcern[];
  transport: TransportRequest[];
  conversation: AccessConversation;
};

/* ------------------------------------------------------------ referrals */

/** Who refers to the access center: each office from its own portal. */
export type ReferralSource = "dialysis" | "nephrology";

export const NEPHROLOGY_OFFICE_NAME = "Riverside Nephrology Associates";

export const REFERRAL_KINDS = [
  "Access Concern",
  "New Access Referral",
  "Appointment Request",
  "General Message",
] as const;
export type ReferralKind = (typeof REFERRAL_KINDS)[number];

export type ReferralStatus = "New" | "Acknowledged" | "Scheduled" | "Closed";

export type ReferralReply = {
  id: string;
  /** Which side wrote it. */
  author: "access" | ReferralSource;
  authorName: string;
  body: string;
  /** ISO 8601 */
  sentAt: string;
};

export type AccessReferral = {
  id: string;
  /** ISO 8601 */
  sentAt: string;
  /** The office on the other side of the thread from the access center. */
  source: ReferralSource;
  /** Set when the access center wrote first, to `source`. */
  startedBy?: "access";
  /** The person who wrote first: "Nurse Wilson". */
  sentBy: string;
  /** Both "" for a general message about no one patient. */
  memberName: string;
  mrn: string;
  kind: ReferralKind;
  /** CONCERN_KINDS ids, for an access concern. */
  findings: string[];
  detail: string;
  urgent: boolean;
  status: ReferralStatus;
  /** Who at the access center last moved it on. */
  handledBy?: string;
  /** ISO 8601 */
  handledAt?: string;
  replies: ReferralReply[];
};

export type ReferralInput = Pick<
  AccessReferral,
  | "source"
  | "startedBy"
  | "sentBy"
  | "memberName"
  | "mrn"
  | "kind"
  | "findings"
  | "detail"
  | "urgent"
>;

export const SOURCE_LABEL: Record<ReferralSource, string> = {
  dialysis: "Riverside Dialysis Center",
  nephrology: NEPHROLOGY_OFFICE_NAME,
};

export type AccessState = {
  records: AccessRecord[];
  /** Staff-to-staff referrals. Optional so older shapes still read. */
  referrals?: AccessReferral[];
};

/* ------------------------------------------------------------------ dates */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2026-10-05" → "Oct 5, 2026". Parsed by hand so no time zone shifts it. */
export function formatDay(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return "—";
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "2026-10-05" → { month: "OCT", day: "5", year: "2026" } for a date tile. */
export function dayParts(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return {
    month: (MONTHS[m - 1] ?? "").toUpperCase(),
    day: String(d ?? ""),
    year: String(y ?? ""),
  };
}

/** "14:30" → "2:30 PM". */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** The local calendar day of a timestamp, as YYYY-MM-DD. */
export function dayKey(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** A day key moved by whole days. */
export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + days).getTime());
}

/* ------------------------------------------------------------------ reads */

/** Appointments still to happen, soonest first. */
export function upcomingAppointments(
  record: AccessRecord,
  today: string,
): AccessAppointment[] {
  return record.appointments
    .filter((entry) => !entry.completed && entry.date >= today)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

export function nextAppointment(
  record: AccessRecord,
  today: string,
): AccessAppointment | null {
  return upcomingAppointments(record, today)[0] ?? null;
}

/** Newest first. */
export function sortedUpdates(record: AccessRecord): AccessUpdate[] {
  return [...record.updates].sort((a, b) => b.date.localeCompare(a.date));
}

export function sortedHistory(record: AccessRecord): AccessHistoryEntry[] {
  return [...record.history].sort((a, b) => b.date.localeCompare(a.date));
}

export function openConcerns(record: AccessRecord): AccessConcern[] {
  return record.concerns
    .filter((concern) => concern.status === "Open")
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
}

/** Requests the coordinator still has to work: not yet confirmed. */
export function pendingTransport(record: AccessRecord): TransportRequest[] {
  return record.transport.filter(
    (entry) => entry.status === "Requested" || entry.status === "Acknowledged",
  );
}

/** Every request not cancelled, for an appointment still ahead. */
export function activeTransport(record: AccessRecord): TransportRequest[] {
  return record.transport.filter((entry) => {
    if (entry.status === "Cancelled") return false;
    const appointment = record.appointments.find(
      (a) => a.id === entry.appointmentId,
    );
    return !!appointment && !appointment.completed;
  });
}

/** The live request for an appointment, if any. */
export function transportFor(
  record: AccessRecord,
  appointmentId: string,
): TransportRequest | null {
  return (
    record.transport.find(
      (entry) =>
        entry.appointmentId === appointmentId && entry.status !== "Cancelled",
    ) ?? null
  );
}

/** Whether a party may read a message's content. */
export function canRead(message: AccessMessage, party: AccessParty): boolean {
  return !message.private || party !== "dialysis";
}

/** Whether a party may post. The dialysis center needs permission. */
export function canPost(
  conversation: AccessConversation,
  party: AccessParty,
): boolean {
  return party !== "dialysis" || conversation.dialysisCanPost;
}

/** The patient and the access center decide what is private and who may
 *  post; the dialysis center does not. */
export function canManagePrivacy(party: AccessParty): boolean {
  return party === "member" || party === "access";
}

export function unreadFor(record: AccessRecord, party: AccessParty): number {
  return record.conversation.unread[party] ?? 0;
}

export function lastMessage(
  conversation: AccessConversation,
  party: AccessParty,
): AccessMessage | null {
  const shown = conversation.messages.filter((m) => canRead(m, party));
  return shown[shown.length - 1] ?? null;
}

export function recordFor(
  state: AccessState,
  mrn: string,
): AccessRecord | null {
  return state.records.find((record) => record.mrn === mrn) ?? null;
}

export function recordForMember(
  state: AccessState,
  memberName: string,
): AccessRecord | null {
  return (
    state.records.find((record) => record.memberName === memberName) ?? null
  );
}

/* ----------------------------------------------------------------- writes */

function updateRecord(
  state: AccessState,
  mrn: string,
  change: (record: AccessRecord) => AccessRecord,
): AccessState {
  return {
    ...state,
    records: state.records.map((record) =>
      record.mrn === mrn ? change(record) : record,
    ),
  };
}

/** Starts an access record for one of the clinic's patients: an access
 *  that is already in place, or one being planned. */
export function addAccessRecord(
  state: AccessState,
  patient: { memberName: string; mrn: string },
  overview: AccessOverview,
): AccessState {
  if (state.records.some((record) => record.mrn === patient.mrn)) return state;
  return {
    ...state,
    records: [
      ...state.records,
      {
        ...patient,
        overview,
        appointments: [],
        updates: [],
        history: [],
        concerns: [],
        transport: [],
        conversation: {
          messages: [],
          dialysisCanPost: false,
          unread: { member: 0, access: 0, dialysis: 0 },
        },
      },
    ],
  };
}

export function editOverview(
  state: AccessState,
  mrn: string,
  overview: Partial<AccessOverview>,
): AccessState {
  return updateRecord(state, mrn, (record) => ({
    ...record,
    overview: { ...record.overview, ...overview },
  }));
}

/** Booking a visit also posts it to the member's updates timeline, and
 *  moves the access to "Appointment Scheduled". */
export function scheduleAppointment(
  state: AccessState,
  mrn: string,
  appointment: Omit<AccessAppointment, "id" | "completed">,
  now: number,
): AccessState {
  const id = `appt-${now}`;
  return updateRecord(state, mrn, (record) => ({
    ...record,
    overview: { ...record.overview, status: "Appointment Scheduled" },
    appointments: [...record.appointments, { ...appointment, id }],
    updates: [
      ...record.updates,
      {
        id: `upd-${now}`,
        date: dayKey(now),
        title: "Appointment Scheduled",
        detail: `${appointment.title} – ${formatDay(appointment.date)}`,
        kind: "scheduled",
      },
    ],
  }));
}

const HISTORY_TYPE: Record<string, HistoryType> = {
  "Ultrasound (Access)": "Imaging",
  Fistulogram: "Procedure",
  "Catheter Exchange": "Procedure",
  "Surgical Consult": "Consult",
  "Access Placement Surgery": "Surgery",
  "PD Catheter Placement": "Surgery",
};

/**
 * A visit that happened: it leaves the upcoming list, lands in history, is
 * posted as an update, and becomes the access's last assessment.
 */
export function completeAppointment(
  state: AccessState,
  mrn: string,
  appointmentId: string,
  result: string,
  performedBy: string,
  now: number,
): AccessState {
  return updateRecord(state, mrn, (record) => {
    const appointment = record.appointments.find(
      (entry) => entry.id === appointmentId,
    );
    if (!appointment || appointment.completed) return record;
    /* What is still open decides the status the visit leaves behind. */
    const othersBooked = record.appointments.some(
      (entry) => entry.id !== appointmentId && !entry.completed,
    );
    const status: AccessStatus = record.concerns.some(
      (concern) => concern.status === "Open",
    )
      ? "Concern Reported"
      : othersBooked
        ? "Appointment Scheduled"
        : "No Active Concern";
    return {
      ...record,
      overview: {
        ...record.overview,
        status,
        lastAssessment: appointment.date,
      },
      appointments: record.appointments.map((entry) =>
        entry.id === appointmentId
          ? { ...entry, completed: { result, performedBy } }
          : entry,
      ),
      history: [
        ...record.history,
        {
          id: `hist-${now}`,
          date: appointment.date,
          type: HISTORY_TYPE[appointment.title] ?? "Consult",
          procedure: appointment.title,
          location: appointment.place,
          performedBy,
          result,
        },
      ],
      updates: [
        ...record.updates,
        {
          id: `upd-${now}`,
          date: dayKey(now),
          title: `${appointment.title} Completed`,
          detail: result,
          kind: "done",
        },
      ],
    };
  });
}

/** A reported problem flags the access until the team reviews it. */
export function reportConcern(
  state: AccessState,
  mrn: string,
  concern: Pick<AccessConcern, "kinds" | "detail" | "imageUrl">,
  now: number,
): AccessState {
  return updateRecord(state, mrn, (record) => ({
    ...record,
    overview: { ...record.overview, status: "Concern Reported" },
    concerns: [
      ...record.concerns,
      {
        id: `concern-${now}`,
        reportedAt: new Date(now).toISOString(),
        ...concern,
        status: "Open",
      },
    ],
  }));
}

/** Reviewing the last open concern moves the access to "Follow-Up
 *  Needed": someone has looked, and the next step is still to come. */
export function reviewConcern(
  state: AccessState,
  mrn: string,
  concernId: string,
): AccessState {
  return updateRecord(state, mrn, (record) => {
    const concerns = record.concerns.map((concern) =>
      concern.id === concernId
        ? { ...concern, status: "Reviewed" as const }
        : concern,
    );
    const stillOpen = concerns.some((concern) => concern.status === "Open");
    return {
      ...record,
      concerns,
      overview: {
        ...record.overview,
        status:
          !stillOpen && record.overview.status === "Concern Reported"
            ? "Follow-Up Needed"
            : record.overview.status,
      },
    };
  });
}

function post(
  record: AccessRecord,
  now: number,
  title: string,
  detail: string,
  kind: UpdateKind,
): AccessRecord {
  return {
    ...record,
    updates: [
      ...record.updates,
      { id: `upd-${now}`, date: dayKey(now), title, detail, kind },
    ],
  };
}

function appointmentLabel(record: AccessRecord, appointmentId: string) {
  const appointment = record.appointments.find((a) => a.id === appointmentId);
  return appointment
    ? `${appointment.title} – ${formatDay(appointment.date)}`
    : "Appointment";
}

/** One live request per appointment; a cancelled one can be asked again. */
export function requestTransport(
  state: AccessState,
  mrn: string,
  details: TransportDetails,
  now: number,
): AccessState {
  return updateRecord(state, mrn, (record) => {
    if (transportFor(record, details.appointmentId)) return record;
    return {
      ...record,
      transport: [
        ...record.transport,
        {
          id: `ride-${now}`,
          requestedAt: new Date(now).toISOString(),
          status: "Requested",
          handledBy: TRANSPORT_COORDINATOR,
          ...details,
          pickupAddress: details.pickupAddress.trim(),
          memberNote: details.memberNote.trim(),
        },
      ],
    };
  });
}

function changeRequest(
  state: AccessState,
  mrn: string,
  requestId: string,
  change: (entry: TransportRequest, record: AccessRecord) => AccessRecord,
): AccessState {
  return updateRecord(state, mrn, (record) => {
    const entry = record.transport.find((t) => t.id === requestId);
    if (!entry || entry.status === "Cancelled") return record;
    return change(entry, record);
  });
}

function replaceRequest(record: AccessRecord, next: TransportRequest) {
  return {
    ...record,
    transport: record.transport.map((t) => (t.id === next.id ? next : t)),
  };
}

/** The coordinator has it and is working on it. */
export function acknowledgeTransport(
  state: AccessState,
  mrn: string,
  requestId: string,
  now: number,
): AccessState {
  return changeRequest(state, mrn, requestId, (entry, record) =>
    entry.status !== "Requested"
      ? record
      : replaceRequest(record, {
          ...entry,
          status: "Acknowledged",
          acknowledgedAt: new Date(now).toISOString(),
        }),
  );
}

/** Booked: the details go to the patient, and into their updates. Also
 *  used to correct a confirmed ride. */
export function confirmTransport(
  state: AccessState,
  mrn: string,
  requestId: string,
  confirmation: TransportConfirmation,
  now: number,
  confirmedBy?: string,
): AccessState {
  return changeRequest(state, mrn, requestId, (entry, record) => {
    const clean: TransportConfirmation = {
      pickupTime: confirmation.pickupTime,
      provider: confirmation.provider.trim(),
      phone: confirmation.phone.trim(),
      confirmationNumber: confirmation.confirmationNumber.trim(),
      ...(entry.returnTrip && confirmation.returnPickupTime
        ? { returnPickupTime: confirmation.returnPickupTime }
        : {}),
      ...(confirmation.note?.trim() ? { note: confirmation.note.trim() } : {}),
    };
    const next = replaceRequest(record, {
      ...entry,
      status: "Confirmed",
      acknowledgedAt: entry.acknowledgedAt ?? new Date(now).toISOString(),
      confirmedAt: new Date(now).toISOString(),
      confirmation: clean,
      ...(confirmedBy ? { confirmedBy } : {}),
    });
    return post(
      next,
      now,
      entry.status === "Confirmed"
        ? "Transportation Updated"
        : "Transportation Confirmed",
      `${appointmentLabel(record, entry.appointmentId)} · pickup ${formatTime(clean.pickupTime)} · ${clean.provider}`,
      "scheduled",
    );
  });
}

export function cancelTransport(
  state: AccessState,
  mrn: string,
  requestId: string,
  by: "member" | "dialysis",
  now: number,
): AccessState {
  return changeRequest(state, mrn, requestId, (entry, record) => {
    const next = replaceRequest(record, {
      ...entry,
      status: "Cancelled",
      cancelledAt: new Date(now).toISOString(),
      cancelledBy: by,
    });
    return post(
      next,
      now,
      "Transportation Cancelled",
      `${appointmentLabel(record, entry.appointmentId)} · by ${by === "member" ? "the patient" : "the dialysis center"}`,
      "received",
    );
  });
}

/**
 * Nothing at all is not a message; a photo alone is. The dialysis center
 * posts only with permission, and cannot mark anything private. Each party
 * that can read the message counts it unread, except its author.
 */
export function sendAccessMessage(
  state: AccessState,
  mrn: string,
  author: AccessParty,
  authorName: string,
  body: string,
  now: number,
  options: { imageUrl?: string; private?: boolean } = {},
): AccessState {
  const text = body.trim();
  if (!text && !options.imageUrl) return state;
  return updateRecord(state, mrn, (record) => {
    const conversation = record.conversation;
    if (!canPost(conversation, author)) return record;
    const message: AccessMessage = {
      id: `${mrn}-msg-${now}`,
      author,
      authorName,
      body: text,
      sentAt: new Date(now).toISOString(),
      ...(options.imageUrl ? { imageUrl: options.imageUrl } : {}),
      ...(options.private && canManagePrivacy(author) ? { private: true } : {}),
    };
    const unread = { ...conversation.unread };
    for (const party of Object.keys(unread) as AccessParty[]) {
      if (party !== author && canRead(message, party)) unread[party] += 1;
    }
    return {
      ...record,
      conversation: {
        ...conversation,
        messages: [...conversation.messages, message],
        unread,
      },
    };
  });
}

/** The patient or the access center hides a message from the dialysis
 *  center, or shares it again. Not the dialysis center's own messages. */
export function setMessagePrivate(
  state: AccessState,
  mrn: string,
  messageId: string,
  isPrivate: boolean,
  by: AccessParty,
): AccessState {
  if (!canManagePrivacy(by)) return state;
  return updateRecord(state, mrn, (record) => ({
    ...record,
    conversation: {
      ...record.conversation,
      messages: record.conversation.messages.map((m) =>
        m.id === messageId && m.author !== "dialysis"
          ? { ...m, private: isPrivate }
          : m,
      ),
    },
  }));
}

/** The patient or the access center lets the dialysis center post. */
export function setDialysisCanPost(
  state: AccessState,
  mrn: string,
  allowed: boolean,
  by: AccessParty,
): AccessState {
  if (!canManagePrivacy(by)) return state;
  return updateRecord(state, mrn, (record) => ({
    ...record,
    conversation: { ...record.conversation, dialysisCanPost: allowed },
  }));
}

export function markConversationRead(
  state: AccessState,
  mrn: string,
  reader: AccessParty,
): AccessState {
  return updateRecord(state, mrn, (record) =>
    record.conversation.unread[reader] === 0
      ? record
      : {
          ...record,
          conversation: {
            ...record.conversation,
            unread: { ...record.conversation.unread, [reader]: 0 },
          },
        },
  );
}

/* ------------------------------------------------------------------- seed

   Dates are laid out around today so the demo always has visits ahead and a
   history behind, whatever day it is opened. */

type SeedMessage = [AccessParty, string, string, number, boolean?];

/** [author, author name, body, days ago, private?]. Unread counts follow
 *  from the last message each party did not write. */
function conversation(
  mrn: string,
  now: number,
  rows: SeedMessage[],
  dialysisCanPost: boolean,
): AccessConversation {
  const messages: AccessMessage[] = rows.map(
    ([author, authorName, body, daysAgo, isPrivate], index) => ({
      id: `${mrn}-seed-${index}`,
      author,
      authorName,
      body,
      sentAt: new Date(now - daysAgo * 86_400_000).toISOString(),
      ...(isPrivate ? { private: true } : {}),
    }),
  );
  const last = messages[messages.length - 1];
  const unread: Record<AccessParty, number> = {
    member: 0,
    access: 0,
    dialysis: 0,
  };
  if (last) {
    for (const party of Object.keys(unread) as AccessParty[]) {
      if (party !== last.author && canRead(last, party)) unread[party] = 1;
    }
  }
  return { messages, dialysisCanPost, unread };
}

export function seedAccessState(now: number): AccessState {
  const today = dayKey(now);
  const day = (offset: number) => addDays(today, offset);

  const member: AccessRecord = {
    memberName: DEMO_MEMBER,
    mrn: DEMO_MEMBER_MRN,
    overview: {
      type: "AV Fistula",
      location: "Left Forearm",
      createdOn: day(-560),
      status: "No Active Concern",
      lastAssessment: day(-38),
    },
    appointments: [
      {
        id: "seed-a1",
        date: day(8),
        time: "10:00",
        title: "Access Follow-Up",
        place: "Vascular Access Center",
        team: "vascular",
      },
      {
        id: "seed-a2",
        date: day(21),
        time: "13:30",
        title: "Ultrasound (Access)",
        place: "Imaging Center",
        team: "vascular",
      },
      {
        id: "seed-a3",
        date: day(36),
        time: "09:00",
        title: "Access Check",
        place: "Riverside Dialysis Center",
        team: "dialysis",
      },
    ],
    updates: [
      {
        id: "seed-u1",
        date: day(-38),
        title: "Ultrasound Completed",
        detail: "Results sent to the access team",
        kind: "done",
      },
      {
        id: "seed-u2",
        date: day(-43),
        title: "Procedure Scheduled",
        detail: `Fistulogram – ${formatDay(day(8))}`,
        kind: "scheduled",
      },
      {
        id: "seed-u3",
        date: day(-61),
        title: "Referral Received",
        detail: "From Riverside Dialysis Center",
        kind: "received",
      },
      {
        id: "seed-u4",
        date: day(-69),
        title: "Consult Completed",
        detail: "Plan: monitor and repeat ultrasound",
        kind: "done",
      },
    ],
    history: [
      {
        id: "seed-h1",
        date: day(-38),
        type: "Imaging",
        procedure: "Access Ultrasound",
        location: "Vascular Access Center",
        performedBy: "Dr. Patel",
        result: "Normal flow",
      },
      {
        id: "seed-h2",
        date: day(-104),
        type: "Procedure",
        procedure: "Fistulogram",
        location: "City Vascular Center",
        performedBy: "Dr. Lee",
        result: "Successful – no intervention",
      },
      {
        id: "seed-h3",
        date: day(-560),
        type: "Surgery",
        procedure: "AV Fistula Creation",
        location: "General Hospital",
        performedBy: "Dr. Nguyen",
        result: "Successful",
      },
      {
        id: "seed-h4",
        date: day(-596),
        type: "Consult",
        procedure: "Initial Access Evaluation",
        location: "Vascular Access Center",
        performedBy: "Dr. Patel",
        result: "Recommended left arm AVF",
      },
    ],
    concerns: [],
    transport: [],
    conversation: conversation(
      DEMO_MEMBER_MRN,
      now,
      [
        [
          "access",
          "Dr. Patel",
          "Your fistulogram went well. Keep checking your thrill every day.",
          30,
        ],
        [
          "dialysis",
          "Nurse Wilson",
          "We will check your access during your next treatment.",
          29,
        ],
        [
          "access",
          "Dr. Patel",
          "Your ultrasound results are available. Flow looks normal.",
          26,
        ],
      ],
      true,
    ),
  };

  const others: AccessRecord[] = [
    {
      memberName: "John D. Smith",
      mrn: "123456",
      overview: {
        type: "AV Graft",
        location: "Right Upper Arm",
        createdOn: day(-400),
        status: "Appointment Scheduled",
        lastAssessment: day(-12),
      },
      appointments: [
        {
          id: "seed-b1",
          date: day(3),
          time: "08:30",
          title: "Fistulogram",
          place: "City Vascular Center",
          team: "vascular",
        },
      ],
      updates: [],
      history: [
        {
          id: "seed-b-h1",
          date: day(-12),
          type: "Imaging",
          procedure: "Access Ultrasound",
          location: "Imaging Center",
          performedBy: "Dr. Patel",
          result: "Narrowing at venous outflow",
        },
      ],
      concerns: [],
      transport: [
        {
          id: "seed-b-r1",
          requestedAt: new Date(now - 86_400_000).toISOString(),
          appointmentId: "seed-b1",
          status: "Requested",
          handledBy: TRANSPORT_COORDINATOR,
          pickupAddress: "418 Oak Street, Columbia, SC",
          returnTrip: true,
          mobility: "ambulatory",
          memberNote: "Sedation, so I cannot drive home.",
        },
      ],
      conversation: conversation(
        "123456",
        now,
        [
          [
            "access",
            "Dr. Patel",
            "We booked a fistulogram to look at the narrowing.",
            2,
          ],
          [
            "member",
            "John D. Smith",
            "Thank you. Do I need someone to drive me home?",
            1,
          ],
        ],
        false,
      ),
    },
    {
      memberName: "Mary S. Johnson",
      mrn: "789012",
      overview: {
        type: "Tunneled Catheter",
        location: "Right Chest",
        createdOn: day(-45),
        status: "Concern Reported",
        lastAssessment: day(-20),
      },
      appointments: [
        {
          id: "seed-c1",
          date: day(10),
          time: "11:00",
          title: "Surgical Consult",
          place: "Vascular Access Center",
          team: "vascular",
        },
      ],
      updates: [],
      history: [],
      concerns: [
        {
          id: "seed-c-k1",
          reportedAt: new Date(now - 5 * 3_600_000).toISOString(),
          kinds: ["redness", "drainage"],
          detail: "Redness around the exit site since yesterday.",
          status: "Open",
        },
      ],
      transport: [],
      conversation: conversation(
        "789012",
        now,
        [
          [
            "member",
            "Mary S. Johnson",
            "My dressing came loose last night.",
            0.4,
          ],
          [
            "member",
            "Mary S. Johnson",
            "Also, I have been very worried about paying for the surgery.",
            0.3,
            true,
          ],
        ],
        true,
      ),
    },
    {
      memberName: "James K. Wilson",
      mrn: "567890",
      overview: {
        type: "AV Fistula",
        location: "Left Upper Arm",
        createdOn: day(-900),
        status: "No Active Concern",
        lastAssessment: day(-60),
      },
      appointments: [
        {
          id: "seed-d1",
          date: day(15),
          time: "14:00",
          title: "Ultrasound (Access)",
          place: "Imaging Center",
          team: "vascular",
        },
      ],
      updates: [],
      history: [],
      concerns: [],
      transport: [],
      conversation: conversation("567890", now, [], false),
    },
    {
      memberName: "Angela T. Brown",
      mrn: "901234",
      overview: {
        type: "AV Fistula",
        location: "Left Forearm",
        createdOn: day(-70),
        status: "Review Requested",
        lastAssessment: day(-7),
      },
      appointments: [],
      updates: [],
      history: [],
      concerns: [],
      transport: [],
      conversation: conversation("901234", now, [], false),
    },
  ];

  /* One referral from each office: the dialysis nurse's no-thrill finding
     on a record the access center already has, and the nephrology
     office's referral for a patient with no access yet. */
  const at = (hoursAgo: number) =>
    new Date(now - hoursAgo * 3_600_000).toISOString();
  const referrals: AccessReferral[] = [
    {
      id: "seed-ref-1",
      sentAt: at(3),
      source: "dialysis",
      sentBy: "Nurse Wilson",
      memberName: "Angela T. Brown",
      mrn: "901234",
      kind: "Access Concern",
      findings: ["thrill"],
      detail:
        "No palpable thrill and a faint bruit at cannulation this morning. Cannulated with difficulty. Please evaluate and schedule.",
      urgent: true,
      status: "New",
      replies: [],
    },
    {
      id: "seed-ref-2",
      sentAt: at(26),
      source: "nephrology",
      sentBy: "Dr. Samuel Reed",
      memberName: "Robert L. Davis",
      mrn: "345678",
      kind: "New Access Referral",
      findings: [],
      detail:
        "CKD stage 5, eGFR 12. Expected to start hemodialysis within 3–6 months. Referred for vein mapping and AV fistula placement.",
      urgent: false,
      status: "Acknowledged",
      handledBy: "Dr. Patel",
      handledAt: at(20),
      replies: [
        {
          id: "seed-ref-2-r1",
          author: "access",
          authorName: "Dr. Patel",
          body: "Received. We will call the patient to book vein mapping this week.",
          sentAt: at(20),
        },
      ],
    },
  ];

  return { records: [member, ...others], referrals };
}

/* ------------------------------------------------------ referral rules */

/** Still to work first, urgent first, newest first. */
export function referralsOf(state: AccessState): AccessReferral[] {
  const rank = (r: AccessReferral) =>
    r.status === "New" ? 0 : r.status === "Closed" ? 2 : 1;
  return [...(state.referrals ?? [])].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      Number(b.urgent) - Number(a.urgent) ||
      b.sentAt.localeCompare(a.sentAt),
  );
}

/** Who answers a thread: the access center, or the office it wrote to. */
export function receiverOf(
  referral: AccessReferral,
): "access" | ReferralSource {
  return referral.startedBy === "access" ? referral.source : "access";
}

/** New threads waiting on the access center. */
export function newReferralCount(state: AccessState): number {
  return (state.referrals ?? []).filter(
    (r) => r.status === "New" && receiverOf(r) === "access",
  ).length;
}

function updateReferral(
  state: AccessState,
  id: string,
  change: (referral: AccessReferral) => AccessReferral,
): AccessState {
  return {
    ...state,
    referrals: (state.referrals ?? []).map((referral) =>
      referral.id === id ? change(referral) : referral,
    ),
  };
}

/**
 * A referral goes straight to the access center. When the patient already
 * has an access record it is flagged there too: a concern as "Concern
 * Reported", a referral or request as "Review Requested". A general
 * message, or one the access center starts, flags nothing. It is
 * staff-to-staff, so nothing is posted to the patient.
 */
export function sendReferral(
  state: AccessState,
  input: ReferralInput,
  now: number,
): AccessState {
  const referral: AccessReferral = {
    ...input,
    findings: input.kind === "Access Concern" ? input.findings : [],
    detail: input.detail.trim(),
    id: `ref-${now}`,
    sentAt: new Date(now).toISOString(),
    status: "New",
    replies: [],
  };
  const flags =
    input.startedBy !== "access" && input.kind !== "General Message";
  const flagged = !flags
    ? state
    : updateRecord(state, input.mrn, (record) => ({
        ...record,
        overview: {
          ...record.overview,
          status:
            input.kind === "Access Concern"
              ? "Concern Reported"
              : "Review Requested",
        },
      }));
  return { ...flagged, referrals: [...(state.referrals ?? []), referral] };
}

/** The access center moves a referral on. The access record keeps its own
 *  status; scheduling sets that separately. */
export function setReferralStatus(
  state: AccessState,
  id: string,
  status: Exclude<ReferralStatus, "New">,
  by: string,
  now: number,
): AccessState {
  return updateReferral(state, id, (referral) => ({
    ...referral,
    status,
    handledBy: by,
    handledAt: new Date(now).toISOString(),
  }));
}

/** Either side writes on the thread. The receiving side's first reply
 *  acknowledges a new one. */
export function replyToReferral(
  state: AccessState,
  id: string,
  author: ReferralReply["author"],
  authorName: string,
  body: string,
  now: number,
): AccessState {
  const clean = body.trim();
  if (!clean) return state;
  return updateReferral(state, id, (referral) => ({
    ...referral,
    ...(author === receiverOf(referral) && referral.status === "New"
      ? {
          status: "Acknowledged" as const,
          handledBy: authorName,
          handledAt: new Date(now).toISOString(),
        }
      : {}),
    replies: [
      ...referral.replies,
      {
        id: `${referral.id}-r${now}`,
        author,
        authorName,
        body: clean,
        sentAt: new Date(now).toISOString(),
      },
    ],
  }));
}
