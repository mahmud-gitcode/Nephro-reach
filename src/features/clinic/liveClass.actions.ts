import {
  classDate,
  type RecentClass,
  settings as SETTING_CARDS,
  type RegistrationStatus,
  type UpcomingClass,
} from "./liveClass.data";

/* ==========================================================================
   Live Class — what the buttons actually do
   --------------------------------------------------------------------------
   Seven controls on this page rendered and did nothing: Schedule New Class,
   View All, the per-row Edit and actions menu, View on a recording, View All
   Recordings, and Manage on each of the six settings. They are wired here,
   front end only.

   There is no Zoom integration and no video host, so nothing here creates a
   meeting or streams a recording. What NephroReach actually does in those
   tools is keep a link, so that is what this keeps: paste the Zoom or Vimeo
   URL and the button opens it as a link (noopener), never embedded (D18).

   Phase 13: the schedule, recordings and settings live on the server
   (useLiveClasses). What stays here is pure: validation, ordering, the
   calendar, and the settings panels' fields.
   ========================================================================== */

/**
 * A scheduled class, as the clinic can edit it.
 *
 * "Cancelled" is added to the seed's two statuses rather than the row being
 * deleted: a class people registered for and that then did not happen is a
 * fact the office needs to see, and a vanished row looks like a mistake.
 */
export type ClassStatus = RegistrationStatus | "Cancelled";

export interface ManagedClass extends Omit<UpcomingClass, "status"> {
  /** The server id. */
  id: string;
  /** The instant it starts (ISO); `date`/`time` are its browser-local day
   *  and 24-hour "HH:mm". */
  startsAt?: string;
  status: ClassStatus;
  /** Where members join the live session (Zoom, Teams…). Only the platform
   *  team reads it; a member gets it from attendance, in the join window. */
  joinUrl?: string;
  /** The recording link, once posted (opened as a link, never embedded). */
  recordingUrl?: string;
  /** Platform only: how many joined, and their average rating. */
  attended?: number | null;
  averageRating?: number | null;
}

export interface ClassDraft {
  date: string;
  time: string;
  topic: string;
  educator: string;
  program: string;
  capacity: number;
  status: ClassStatus;
  joinUrl: string;
}

export const CLASS_STATUSES: ClassStatus[] = [
  "Open",
  "Not Yet Open",
  "Cancelled",
];

export const PROGRAMS = [
  "Journey to Dialysis",
  "Crash Dialysis",
  "All Programs",
] as const;

export function emptyClassDraft(date: string): ClassDraft {
  return {
    date,
    time: "18:00",
    topic: "",
    educator: "",
    program: "All Programs",
    capacity: 50,
    status: "Not Yet Open",
    joinUrl: "",
  };
}

export function toDraft(item: ManagedClass): ClassDraft {
  return {
    date: item.date,
    time: item.time,
    topic: item.topic,
    educator: item.educator,
    program: item.program,
    capacity: item.capacity,
    status: item.status,
    joinUrl: item.joinUrl ?? "",
  };
}

/**
 * Why a class cannot be saved, or null when it can.
 *
 * The clash check skips the row being edited, or changing a class's topic
 * would report it as clashing with itself.
 */
export function classError(
  draft: ClassDraft,
  existing: ManagedClass[],
  editingId?: string,
): string | null {
  if (!draft.date) return "Pick a date.";
  if (!draft.time) return "Pick a time.";
  if (draft.topic.trim().length < 3) return "Give the class a topic.";
  if (!Number.isFinite(draft.capacity) || draft.capacity < 1) {
    return "Capacity must be at least 1.";
  }
  const linkError = recordingLinkError(draft.joinUrl ?? "");
  if (linkError) return `Meeting link: ${linkError}`;

  const clash = existing.some(
    (item) =>
      item.id !== editingId &&
      item.status !== "Cancelled" &&
      item.date === draft.date &&
      item.time === draft.time,
  );
  if (clash) return "Another class is already booked for that day and time.";

  return null;
}

/** Soonest first. Same day, earlier time first. */
export function sortClasses(classes: ManagedClass[]): ManagedClass[] {
  return [...classes].sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
  );
}

/** Still to come and not called off. */
export function upcomingFrom(
  classes: ManagedClass[],
  todayIso: string,
): ManagedClass[] {
  return sortClasses(
    classes.filter(
      (item) => item.date >= todayIso && item.status !== "Cancelled",
    ),
  );
}

export function seatsLeft(item: ManagedClass): number {
  return Math.max(0, item.capacity - item.registered);
}

export function isFull(item: ManagedClass): boolean {
  return item.registered >= item.capacity;
}

/** Add days to a yyyy-mm-dd date. */
export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;

  const date = new Date(year, month - 1, day + days);
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

/**
 * The form values for a copy of a class in the same slot a week later.
 *
 * Registrations do not come with it — they belong to the session people
 * signed up for — and the copy opens closed, so nobody is registered for a
 * class the team has not finished setting up. Sent as one new class.
 */
export function duplicateDraft(source: ManagedClass): ClassDraft {
  return {
    ...toDraft(source),
    date: addDays(source.date, 7),
    status: "Not Yet Open",
  };
}

/**
 * The classes on one calendar day.
 *
 * Takes the live list rather than reading the seed, so a class scheduled
 * this morning is on the calendar this morning. Cancelled ones are still
 * shown here — somebody looking up a date needs to see that it was called
 * off, not an empty day.
 */
export function classesOnDay(
  classes: ManagedClass[],
  year: number,
  month: number,
  day: number,
): ManagedClass[] {
  return sortClasses(
    classes.filter((item) => {
      const date = classDate(item.date);
      return (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      );
    }),
  );
}

/* --------------------------------------------------------------------------
   Recordings
   -------------------------------------------------------------------------- */

/** Where a past class's recording lives, keyed by the class id. */
export type RecordingLinks = Record<string, string>;

/**
 * Whether a pasted recording link is usable.
 *
 * http and https only. A `javascript:` URL in an href that the page later
 * opens is a script the clinic did not mean to run.
 */
export function recordingLinkError(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "Enter a full link, starting with https://";
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return "Only https:// links can be saved.";
  }
  return null;
}

/**
 * Classes that have taken place, newest first: every class whose day has
 * passed and that was not called off — so each live class can have its
 * recording published (client, 2026-10-08). Each keeps its own id, so a
 * topic held twice keeps both sessions.
 */
export function pastClasses(
  classes: ManagedClass[] = [],
  today = "",
): RecentClass[] {
  return classes
    .filter((c) => c.status !== "Cancelled" && !!today && c.date < today)
    .map((c) => ({
      id: c.id,
      title: c.topic,
      date: c.date,
      attended: c.attended ?? null,
      rating: c.averageRating ?? 0,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/* --------------------------------------------------------------------------
   The six settings panels
   -------------------------------------------------------------------------- */

export type SettingId = (typeof SETTING_CARDS)[number]["id"];

export type SettingFieldKind = "switch" | "text" | "number" | "select";

export interface SettingField {
  key: string;
  label: string;
  kind: SettingFieldKind;
  /** For `select`. */
  options?: string[];
  placeholder?: string;
  /** For `number`. */
  min?: number;
  max?: number;
  note?: string;
}

/**
 * What each Manage dialog asks for.
 *
 * Declared as data rather than six hand-written dialogs: they are all the
 * same shape — a few fields that persist — and six near-identical
 * components would drift apart the first time one was touched.
 */
export const SETTING_FIELDS: Record<SettingId, SettingField[]> = {
  zoom: [
    {
      key: "link",
      label: "Default meeting link",
      kind: "text",
      placeholder: "https://zoom.us/j/0000000000",
    },
    { key: "autoCreate", label: "Create a meeting per class", kind: "switch" },
    { key: "waitingRoom", label: "Use a waiting room", kind: "switch" },
  ],
  reminders: [
    { key: "email", label: "Email reminder", kind: "switch" },
    { key: "sms", label: "SMS reminder", kind: "switch" },
    {
      key: "lead",
      label: "Send",
      kind: "select",
      options: ["1 day before", "2 hours before", "1 hour before"],
    },
  ],
  limits: [
    {
      key: "capacity",
      label: "Default capacity",
      kind: "number",
      min: 1,
      max: 1000,
    },
    {
      key: "waitlist",
      label: "Take a waitlist when full",
      kind: "switch",
    },
  ],
  resources: [
    {
      key: "handouts",
      label: "Handout link",
      kind: "text",
      placeholder: "https://…",
    },
    { key: "sendAfter", label: "Send handouts after class", kind: "switch" },
  ],
  surveys: [
    { key: "send", label: "Send a survey after class", kind: "switch" },
    {
      key: "surveyLink",
      label: "Survey link",
      kind: "text",
      placeholder: "https://…",
    },
  ],
  certificates: [
    { key: "issue", label: "Issue certificates", kind: "switch" },
    {
      key: "minAttendance",
      label: "Minimum attendance",
      kind: "number",
      min: 0,
      max: 100,
      note: "Percent of the class a member must attend.",
    },
  ],
};

export type SettingValue = string | number | boolean;
export type SettingValues = Record<string, SettingValue>;

/** Everything off, empty, or at a safe default until the clinic says otherwise. */
export function defaultSettingValues(id: SettingId): SettingValues {
  const values: SettingValues = {};

  for (const field of SETTING_FIELDS[id]) {
    if (field.kind === "switch") values[field.key] = false;
    else if (field.kind === "number") values[field.key] = field.min ?? 0;
    else if (field.kind === "select")
      values[field.key] = field.options?.[0] ?? "";
    else values[field.key] = "";
  }

  /* One sensible exception: a default capacity of zero would schedule a
     class nobody can register for. */
  if (id === "limits") values.capacity = 50;
  return values;
}

export function defaultSettings(): Record<SettingId, SettingValues> {
  const out = {} as Record<SettingId, SettingValues>;
  for (const card of SETTING_CARDS)
    out[card.id] = defaultSettingValues(card.id);
  return out;
}

/** A one-line summary of a panel, for the card behind the Manage button. */
export function settingSummary(
  id: SettingId,
  values: SettingValues,
): string | null {
  const on = SETTING_FIELDS[id]
    .filter((field) => field.kind === "switch" && values[field.key] === true)
    .map((field) => field.label);

  if (on.length > 0) return on.join(", ");
  return null;
}

/** Re-exported so the page does not import the seed and the rules both. */
export { classDate };
