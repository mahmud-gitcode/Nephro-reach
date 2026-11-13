/* ==========================================================================
   Vascular access — shapes, labels and display rules
   --------------------------------------------------------------------------
   The record lives on the API (Phase 10): a patient may have several access
   profiles, one per access center (`/patients/:id/access-profiles`), and
   each office reads the ones naming it
   (`/organizations/:id/access-profiles`). Every response says which party
   the viewer is on that record (`party`: member, access or dialysis); the
   screens follow it, and the server decides every write.

   Three parties work each record (client, 2026-09-30):
     · the patient
     · the Vascular Access Center: creates and repairs the access
     · the Dialysis Center: sees the access every treatment, refers
       problems, and (its social worker) arranges rides

   Messages are one three-way conversation. The server hides a private
   message from the dialysis center (`hidden: true`, no body, no picture,
   no author): the screens render only what it sends and never decide
   privacy themselves.

   Pure: the shapes the screens draw, the labels, dates and display sorts.
   No seed, no storage and no state reducer: one function per server
   operation lives in access.repository.ts.
   ========================================================================== */

export type AccessTeam = "vascular" | "dialysis";

export const TEAM_LABEL: Record<AccessTeam, string> = {
  vascular: "Vascular Access Team",
  dialysis: "Dialysis Center",
};

/** Workflow states, not a clinical verdict (client, 2026-10-01): "No
 *  Active Concern" says nothing is open, without implying the access was
 *  assessed as working. The server's enum, string for string. */
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
  /* Not decided yet — a patient referred before an access is chosen
     (client, 2026-10-06). */
  "TBD",
] as const;

export type AccessOverview = {
  type: string;
  location: string;
  /** YYYY-MM-DD, or "" when not known. */
  createdOn: string;
  status: AccessStatus;
  /** YYYY-MM-DD, or "" when there has not been one. */
  lastAssessment: string;
};

export type TransportStatus =
  "Requested" | "Acknowledged" | "Confirmed" | "Cancelled";

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
  /** The live ride for this visit, from the server (none: null). */
  transportStatus?: TransportStatus | null;
};

/** The server's appointment titles, string for string. */
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

export type ConcernRecipient = "access" | "dialysis";

export type AccessConcern = {
  id: string;
  /** ISO 8601 */
  reportedAt: string;
  kinds: string[];
  detail: string;
  /** A photo is on the server; it opens through a short-lived link. */
  hasImage: boolean;
  status: "Open" | "Reviewed";
  /** ISO 8601. The member changed it after sending. */
  editedAt?: string;
  /** ISO 8601. The member sent it to the team again. */
  resentAt?: string;
  /** Who the member sent it to (client, 2026-10-12). An office's list
   *  holds only the reports sent to it: the server filters. */
  sendTo: ConcernRecipient[];
};

/** The standard non-emergency transport levels (the server's enum). */
export const MOBILITY_LEVELS = [
  { id: "ambulatory", en: "Can walk", es: "Puede caminar" },
  { id: "wheelchair", en: "Wheelchair", es: "Silla de ruedas" },
  { id: "stretcher", en: "Stretcher", es: "Camilla" },
] as const;
export type MobilityLevel = (typeof MOBILITY_LEVELS)[number]["id"];

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

/** The visit a ride is for, as the ride's own response carries it. */
export type TransportVisit = {
  id: string;
  date: string;
  time: string;
  title: string;
  place: string;
  completed: boolean;
};

export type TransportRequest = {
  id: string;
  profileId: string;
  /** ISO 8601 */
  requestedAt: string;
  appointmentId: string;
  appointment: TransportVisit | null;
  status: TransportStatus;
  /** Who the request went to (the dialysis center, from the server). */
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
  /** Who booked it at the dialysis center, from the server. */
  confirmedBy?: string;
  /** ISO 8601 */
  cancelledAt?: string;
  cancelledBy?: "member" | "dialysis";
};

/** A ride on an office's queue: the ride and its patient as that office
 *  knows them. */
export type QueuedRide = {
  request: TransportRequest;
  patientId: string;
  memberName: string;
  mrn: string | null;
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

export type AccessMessage = {
  id: string;
  /** The party that wrote it. */
  author: AccessParty;
  /** Who wrote it on that side, from the server; null when hidden. */
  authorName: string | null;
  /** null when hidden, or a photo with no text. */
  body: string | null;
  /** ISO 8601 */
  sentAt: string;
  /** A photo is on the server; it opens through a short-lived link. */
  hasImage: boolean;
  /** Between the patient and the access center only. */
  private: boolean;
  /** The server withheld it from this viewer (the dialysis center): only a
   *  placeholder is drawn, and nothing about it is asked for. */
  hidden: boolean;
  /** The viewer wrote it (server-decided; names are never compared). */
  mine: boolean;
};

export type AccessConversation = {
  /** Oldest first, for display. */
  messages: AccessMessage[];
  /** The dialysis center may post. Reading shared messages is always on. */
  dialysisCanPost: boolean;
};

export type AccessOrg = { id: string; name: string };

/** One access profile as one viewer sees it, with what its tabs show. */
export type AccessRecord = {
  /** The profile id: the record's identity (never the MRN or a name). */
  id: string;
  patientId: string;
  /** "First Last" for an office; the member's own name on their page. */
  memberName: string;
  /** The viewing office's MRN, display only; null for the member. */
  mrn: string | null;
  accessCenter: AccessOrg;
  dialysisCenter: AccessOrg | null;
  /** The viewer's party on this record, from the server. */
  party: AccessParty;
  /** The viewer's unread count, from the server. */
  unread: number;
  overview: AccessOverview;
  appointments: AccessAppointment[];
  updates: AccessUpdate[];
  history: AccessHistoryEntry[];
  concerns: AccessConcern[];
  transport: TransportRequest[];
  conversation: AccessConversation;
};

/** One of the member's profiles, for choosing between access centers. */
export type AccessProfileSummary = {
  id: string;
  patientId: string;
  accessCenter: AccessOrg;
  dialysisCenter: AccessOrg | null;
  party: AccessParty;
  unread: number;
  overview: AccessOverview;
};

/** An office roster row: the profile without its parts. */
export type AccessRosterRow = {
  id: string;
  patientId: string;
  memberName: string;
  mrn: string | null;
  accessCenter: AccessOrg;
  dialysisCenter: AccessOrg | null;
  party: AccessParty;
  unread: number;
  dialysisCanPost: boolean;
  overview: AccessOverview;
  /** Open concerns sent to this office (server count). */
  openConcerns: number;
  nextAppointment: AccessAppointment | null;
};

/* ------------------------------------------------------------ referrals */

/** The office types an access center talks to. */
export type ReferralSource = "dialysis" | "nephrology";

export const REFERRAL_KINDS = [
  "Access Concern",
  "New Access Referral",
  "Appointment Request",
  "General Message",
] as const;
export type ReferralKind = (typeof REFERRAL_KINDS)[number];

/** What an access center may start (the server's ACCESS_CENTER_REFERRAL_KINDS). */
export const ACCESS_CENTER_REFERRAL_KINDS: readonly ReferralKind[] = [
  "General Message",
  "Appointment Request",
];

export type ReferralStatus = "New" | "Acknowledged" | "Scheduled" | "Closed";

export type ReferralReply = {
  id: string;
  authorName: string | null;
  /** The office that wrote it: "mine" when it is the viewer's office. */
  authorOrgId: string;
  body: string;
  /** ISO 8601 */
  sentAt: string;
};

export type AccessReferral = {
  id: string;
  /** ISO 8601 */
  sentAt: string;
  /** Always the office (dialysis center or nephrology office). */
  from: AccessOrg;
  /** Always the access center. */
  to: AccessOrg;
  /** The access center wrote first, to `from`. */
  startedByAccess: boolean;
  /** The person who wrote first, from the server. */
  sentBy: string | null;
  /** null for a general message about no one patient. */
  patient: { id: string; name: string } | null;
  /** The sending office's MRN, display only. */
  mrn: string | null;
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
  assignedTo?: { id: string; name: string | null };
  replyCount: number;
  /** New, and this office answers it (server). */
  waitingOnYou: boolean;
  /** Present on the thread read (GET …/referrals/:id). */
  replies?: ReferralReply[];
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
const MONTHS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sept",
  "oct",
  "nov",
  "dic",
];

export function formatDay(key: string, isEs = false): string {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return "—";
  if (isEs) return `${d} ${MONTHS_ES[m - 1]} ${y}`;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "2026-10-05" → { month: "OCT", day: "5", year: "2026" } for a date tile. */
export function dayParts(key: string, isEs = false) {
  const [y, m, d] = key.split("-").map(Number);
  return {
    month: ((isEs ? MONTHS_ES : MONTHS)[m - 1] ?? "").toUpperCase(),
    day: String(d ?? ""),
    year: String(y ?? ""),
  };
}

/** "14:30" → "2:30 PM". Display only: forms send HH:mm. */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** A time input's value as the API's HH:mm (24-hour), or null. */
export function toHhMm(value: string): string | null {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/.exec(
    value.trim(),
  );
  if (!match) return null;
  let h = Number(match[1]);
  const m = Number(match[2]);
  const suffix = match[3]?.toUpperCase();
  if (suffix) {
    /* 12-hour text ("4:30 PM"): never read as 04:30. */
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (suffix === "PM" ? 12 : 0);
  }
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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

/* ------------------------------------------------------- display rules */

/** Appointments still to happen, soonest first. */
export function upcomingAppointments(
  record: Pick<AccessRecord, "appointments">,
  today: string,
): AccessAppointment[] {
  return record.appointments
    .filter((entry) => !entry.completed && entry.date >= today)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

export function nextAppointment(
  record: Pick<AccessRecord, "appointments">,
  today: string,
): AccessAppointment | null {
  return upcomingAppointments(record, today)[0] ?? null;
}

/** Newest first. */
export function sortedUpdates(
  record: Pick<AccessRecord, "updates">,
): AccessUpdate[] {
  return [...record.updates].sort((a, b) => b.date.localeCompare(a.date));
}

export function sortedHistory(
  record: Pick<AccessRecord, "history">,
): AccessHistoryEntry[] {
  return [...record.history].sort((a, b) => b.date.localeCompare(a.date));
}

/** Open reports, newest first. An office's list already holds only the
 *  ones sent to it (the server filters; nothing is filtered here). */
export function openConcerns(
  record: Pick<AccessRecord, "concerns">,
): AccessConcern[] {
  return record.concerns
    .filter((concern) => concern.status === "Open")
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
}

/** Every report, open first, then newest first. */
export function concernsNewestFirst(
  record: Pick<AccessRecord, "concerns">,
): AccessConcern[] {
  return [...record.concerns].sort(
    (a, b) =>
      Number(b.status === "Open") - Number(a.status === "Open") ||
      b.reportedAt.localeCompare(a.reportedAt),
  );
}

/** Every request not cancelled, for an appointment still ahead. */
export function activeTransport(
  record: Pick<AccessRecord, "transport">,
): TransportRequest[] {
  return record.transport.filter(
    (entry) =>
      entry.status !== "Cancelled" &&
      !!entry.appointment &&
      !entry.appointment.completed,
  );
}

/** The live request for an appointment, if any. */
export function transportFor(
  record: Pick<AccessRecord, "transport">,
  appointmentId: string,
): TransportRequest | null {
  return (
    record.transport.find(
      (entry) =>
        entry.appointmentId === appointmentId && entry.status !== "Cancelled",
    ) ?? null
  );
}

/** Whether a party may post: a hint only, the server refuses anyway. */
export function canPost(
  conversation: Pick<AccessConversation, "dialysisCanPost">,
  party: AccessParty,
): boolean {
  return party !== "dialysis" || conversation.dialysisCanPost;
}

/** The patient and the access center decide what is private and who may
 *  post; the dialysis center does not (a hint; the server decides). */
export function canManagePrivacy(party: AccessParty): boolean {
  return party === "member" || party === "access";
}

/** The newest message, hidden ones included (they show as a placeholder). */
export function lastMessage(
  conversation: Pick<AccessConversation, "messages">,
): AccessMessage | null {
  return conversation.messages[conversation.messages.length - 1] ?? null;
}

/** Still to work first, urgent first, newest first. */
export function sortReferrals(referrals: AccessReferral[]): AccessReferral[] {
  const rank = (r: AccessReferral) =>
    r.status === "New" ? 0 : r.status === "Closed" ? 2 : 1;
  return [...referrals].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      Number(b.urgent) - Number(a.urgent) ||
      b.sentAt.localeCompare(a.sentAt),
  );
}

/* ------------------------------------------------------ Spanish display */

/* Spanish display text for the server's fixed access lists (the same terms
   as the clinic screens). The values sent to the server stay English; text
   from the server that is not in a list is shown as it came. */
const APPOINTMENT_TITLE_ES: Record<string, string> = {
  "Access Follow-Up": "Seguimiento del acceso",
  "Ultrasound (Access)": "Ecografía (acceso)",
  Fistulogram: "Fistulografía",
  "Access Check": "Revisión del acceso",
  "Catheter Exchange": "Cambio de catéter",
  "Surgical Consult": "Consulta quirúrgica",
  "Access Placement Surgery": "Cirugía de colocación del acceso",
  "PD Catheter Placement": "Colocación de catéter de DP",
};

const ACCESS_TYPE_ES: Record<string, string> = {
  "AV Fistula": "Fístula AV",
  "AV Graft": "Injerto AV",
  "Tunneled Catheter": "Catéter tunelizado",
  "PD Catheter": "Catéter de DP",
  TBD: "Por determinar",
};

/** An appointment title as the member reads it. */
export function appointmentTitleLabel(title: string, isEs = false): string {
  return isEs ? (APPOINTMENT_TITLE_ES[title] ?? title) : title;
}

/** An access type as the member reads it. */
export function accessTypeLabel(type: string, isEs = false): string {
  return isEs ? (ACCESS_TYPE_ES[type] ?? type) : type;
}
