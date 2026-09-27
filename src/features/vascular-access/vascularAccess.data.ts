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

   Pure: state in, state out. Storage lives in useVascularAccess.ts.
   ========================================================================== */

import { DEMO_MEMBER } from "@/features/messaging/messaging.seed";

export type AccessTeam = "vascular" | "dialysis";

export const TEAM_LABEL: Record<AccessTeam, string> = {
  vascular: "Vascular Access Team",
  dialysis: "Dialysis Center",
};

export const ACCESS_STATUSES = [
  "Working Well",
  "Needs Review",
  "Problem Reported",
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

export type TransportRequest = {
  id: string;
  /** ISO 8601 */
  requestedAt: string;
  appointmentId: string;
  status: "Requested" | "Arranged";
};

export type AccessMessage = {
  id: string;
  author: "member" | "team";
  body: string;
  /** ISO 8601 */
  sentAt: string;
  imageUrl?: string;
};

export type AccessThread = {
  team: AccessTeam;
  /** Who answers on that side: "Dr. Patel (Vascular Surgeon)". */
  contact: string;
  messages: AccessMessage[];
  unreadByMember: number;
  unreadByTeam: number;
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
  threads: AccessThread[];
};

export type AccessState = { records: AccessRecord[] };

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

export function pendingTransport(record: AccessRecord): TransportRequest[] {
  return record.transport.filter((entry) => entry.status === "Requested");
}

export function unreadForTeam(record: AccessRecord): number {
  return record.threads.reduce((sum, thread) => sum + thread.unreadByTeam, 0);
}

export function unreadForMember(record: AccessRecord): number {
  return record.threads.reduce((sum, thread) => sum + thread.unreadByMember, 0);
}

export function lastMessage(thread: AccessThread): AccessMessage | null {
  return thread.messages[thread.messages.length - 1] ?? null;
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
    records: state.records.map((record) =>
      record.mrn === mrn ? change(record) : record,
    ),
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

/** Booking a visit also posts it to the member's updates timeline. */
export function scheduleAppointment(
  state: AccessState,
  mrn: string,
  appointment: Omit<AccessAppointment, "id" | "completed">,
  now: number,
): AccessState {
  const id = `appt-${now}`;
  return updateRecord(state, mrn, (record) => ({
    ...record,
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
    return {
      ...record,
      overview: { ...record.overview, lastAssessment: appointment.date },
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
    overview: { ...record.overview, status: "Problem Reported" },
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

/** Reviewing the last open concern returns the access to "Needs Review". */
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
          !stillOpen && record.overview.status === "Problem Reported"
            ? "Needs Review"
            : record.overview.status,
      },
    };
  });
}

export function requestTransport(
  state: AccessState,
  mrn: string,
  appointmentId: string,
  now: number,
): AccessState {
  return updateRecord(state, mrn, (record) => {
    if (record.transport.some((entry) => entry.appointmentId === appointmentId))
      return record;
    return {
      ...record,
      transport: [
        ...record.transport,
        {
          id: `ride-${now}`,
          requestedAt: new Date(now).toISOString(),
          appointmentId,
          status: "Requested",
        },
      ],
    };
  });
}

export function arrangeTransport(
  state: AccessState,
  mrn: string,
  requestId: string,
): AccessState {
  return updateRecord(state, mrn, (record) => ({
    ...record,
    transport: record.transport.map((entry) =>
      entry.id === requestId ? { ...entry, status: "Arranged" } : entry,
    ),
  }));
}

/** Nothing at all is not a message; a photo alone is. */
export function sendAccessMessage(
  state: AccessState,
  mrn: string,
  team: AccessTeam,
  author: AccessMessage["author"],
  body: string,
  now: number,
  imageUrl?: string,
): AccessState {
  const text = body.trim();
  if (!text && !imageUrl) return state;
  return updateRecord(state, mrn, (record) => ({
    ...record,
    threads: record.threads.map((thread) =>
      thread.team === team
        ? {
            ...thread,
            unreadByMember: author === "team" ? thread.unreadByMember + 1 : 0,
            unreadByTeam: author === "member" ? thread.unreadByTeam + 1 : 0,
            messages: [
              ...thread.messages,
              {
                id: `${mrn}-${team}-${now}`,
                author,
                body: text,
                sentAt: new Date(now).toISOString(),
                ...(imageUrl ? { imageUrl } : {}),
              },
            ],
          }
        : thread,
    ),
  }));
}

export function markThreadRead(
  state: AccessState,
  mrn: string,
  team: AccessTeam,
  reader: AccessMessage["author"],
): AccessState {
  return updateRecord(state, mrn, (record) => ({
    ...record,
    threads: record.threads.map((thread) =>
      thread.team !== team
        ? thread
        : reader === "member"
          ? { ...thread, unreadByMember: 0 }
          : { ...thread, unreadByTeam: 0 },
    ),
  }));
}

/* ------------------------------------------------------------------- seed

   Dates are laid out around today so the demo always has visits ahead and a
   history behind, whatever day it is opened. */

function threads(
  mrn: string,
  surgeon: string,
  now: number,
  vascular: Array<[AccessMessage["author"], string, number]>,
  dialysis: Array<[AccessMessage["author"], string, number]>,
): AccessThread[] {
  const build = (
    team: AccessTeam,
    rows: Array<[AccessMessage["author"], string, number]>,
  ) =>
    rows.map(([author, body, daysAgo], index) => ({
      id: `${mrn}-${team}-seed-${index}`,
      author,
      body,
      sentAt: new Date(now - daysAgo * 86_400_000).toISOString(),
    }));
  const vascularMessages = build("vascular", vascular);
  const dialysisMessages = build("dialysis", dialysis);
  const lastIsTeam = (rows: AccessMessage[]) =>
    rows.length > 0 && rows[rows.length - 1].author === "team" ? 1 : 0;
  const lastIsMember = (rows: AccessMessage[]) =>
    rows.length > 0 && rows[rows.length - 1].author === "member" ? 1 : 0;
  return [
    {
      team: "vascular",
      contact: surgeon,
      messages: vascularMessages,
      unreadByMember: lastIsTeam(vascularMessages),
      unreadByTeam: lastIsMember(vascularMessages),
    },
    {
      team: "dialysis",
      contact: "Riverside Dialysis Center",
      messages: dialysisMessages,
      unreadByMember: lastIsTeam(dialysisMessages),
      unreadByTeam: lastIsMember(dialysisMessages),
    },
  ];
}

export function seedAccessState(now: number): AccessState {
  const today = dayKey(now);
  const day = (offset: number) => addDays(today, offset);

  const member: AccessRecord = {
    memberName: DEMO_MEMBER,
    mrn: "448120",
    overview: {
      type: "AV Fistula",
      location: "Left Forearm",
      createdOn: day(-560),
      status: "Working Well",
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
    threads: threads(
      "448120",
      "Dr. Patel (Vascular Surgeon)",
      now,
      [
        [
          "team",
          "Your fistulogram went well. Keep checking your thrill every day.",
          30,
        ],
        [
          "team",
          "Your ultrasound results are available. Flow looks normal.",
          26,
        ],
      ],
      [["team", "We will check your access during your next treatment.", 29]],
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
        status: "Needs Review",
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
        },
      ],
      threads: threads(
        "123456",
        "Dr. Patel (Vascular Surgeon)",
        now,
        [
          ["team", "We booked a fistulogram to look at the narrowing.", 2],
          ["member", "Thank you. Do I need someone to drive me home?", 1],
        ],
        [],
      ),
    },
    {
      memberName: "Mary S. Johnson",
      mrn: "789012",
      overview: {
        type: "Tunneled Catheter",
        location: "Right Chest",
        createdOn: day(-45),
        status: "Problem Reported",
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
      threads: threads(
        "789012",
        "Dr. Nguyen (Vascular Surgeon)",
        now,
        [],
        [["member", "My dressing came loose last night.", 0.3]],
      ),
    },
    {
      memberName: "James K. Wilson",
      mrn: "567890",
      overview: {
        type: "AV Fistula",
        location: "Left Upper Arm",
        createdOn: day(-900),
        status: "Working Well",
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
      threads: threads("567890", "Dr. Lee (Vascular Surgeon)", now, [], []),
    },
    {
      memberName: "Angela T. Brown",
      mrn: "901234",
      overview: {
        type: "AV Fistula",
        location: "Left Forearm",
        createdOn: day(-70),
        status: "Needs Review",
        lastAssessment: day(-7),
      },
      appointments: [],
      updates: [],
      history: [],
      concerns: [],
      transport: [],
      threads: threads("901234", "Dr. Patel (Vascular Surgeon)", now, [], []),
    },
  ];

  return { records: [member, ...others] };
}
