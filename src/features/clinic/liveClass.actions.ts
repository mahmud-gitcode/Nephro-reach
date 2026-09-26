import {
  classDate,
  recentClasses,
  settings as SETTING_CARDS,
  upcomingClasses,
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
   meeting or streams a recording. What a clinic actually does in those
   tools is keep a link, so that is what this keeps: paste the Zoom or Vimeo
   URL and the button opens it. That is the real workflow, not a stand-in
   for one.
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
  id: string;
  status: ClassStatus;
}

export interface ClassDraft {
  date: string;
  time: string;
  topic: string;
  educator: string;
  program: string;
  capacity: number;
  status: ClassStatus;
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

/** The seeded schedule, as the starting point for a clinic's own edits. */
export function seedClasses(): ManagedClass[] {
  return upcomingClasses.map((item) => ({
    ...item,
    /* The seed has one class per date, so the date is already unique and
       makes a stable id across reloads. New ones get a minted one. */
    id: item.date,
  }));
}

export function emptyClassDraft(date: string): ClassDraft {
  return {
    date,
    time: "18:00",
    topic: "",
    educator: "",
    program: "All Programs",
    capacity: 50,
    status: "Not Yet Open",
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

export function addClass(
  classes: ManagedClass[],
  draft: ClassDraft,
): ManagedClass[] {
  return [
    ...classes,
    {
      ...draft,
      topic: draft.topic.trim(),
      educator: draft.educator.trim(),
      /* A class nobody has been told about yet has nobody registered. */
      registered: 0,
      id: `class-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    },
  ];
}

export function updateClass(
  classes: ManagedClass[],
  id: string,
  draft: ClassDraft,
): ManagedClass[] {
  return classes.map((item) =>
    item.id === id
      ? {
          ...item,
          ...draft,
          topic: draft.topic.trim(),
          educator: draft.educator.trim(),
          /* Capacity can be cut below what is already booked, but the
             registration count is a fact and is never trimmed to fit. */
          registered: item.registered,
        }
      : item,
  );
}

export function setClassStatus(
  classes: ManagedClass[],
  id: string,
  status: ClassStatus,
): ManagedClass[] {
  return classes.map((item) => (item.id === id ? { ...item, status } : item));
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
 * Copy a class to the same slot a week later.
 *
 * Registrations do not come with it — they belong to the session people
 * signed up for — and the copy opens closed, so nobody is registered for a
 * class the office has not finished setting up.
 */
export function duplicateClass(
  classes: ManagedClass[],
  id: string,
): ManagedClass[] {
  const source = classes.find((item) => item.id === id);
  if (!source) return classes;

  return [
    ...classes,
    {
      ...source,
      id: `class-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: addDays(source.date, 7),
      registered: 0,
      status: "Not Yet Open",
    },
  ];
}

export function removeClass(
  classes: ManagedClass[],
  id: string,
): ManagedClass[] {
  return classes.filter((item) => item.id !== id);
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

/** Where a past class's recording lives, keyed by the class title. */
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

export function pastClasses() {
  return [...recentClasses].sort((a, b) => b.date.localeCompare(a.date));
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

/* --------------------------------------------------------------------------
   Storage
   -------------------------------------------------------------------------- */

export interface LiveClassActions {
  classes: ManagedClass[];
  recordings: RecordingLinks;
  settings: Record<SettingId, SettingValues>;
  updatedAt: string;
}

export function defaultLiveClassActions(): LiveClassActions {
  return {
    classes: seedClasses(),
    recordings: {},
    settings: defaultSettings(),
    updatedAt: "",
  };
}

/** Read the stored record back, repairing anything unusable. */
export function normaliseLiveClassActions(stored: unknown): LiveClassActions {
  const base = defaultLiveClassActions();
  if (!stored || typeof stored !== "object") return base;

  const raw = stored as Partial<LiveClassActions>;

  const classes = Array.isArray(raw.classes)
    ? raw.classes.flatMap((value) => {
        if (!value || typeof value !== "object") return [];
        const item = value as Partial<ManagedClass>;
        if (typeof item.id !== "string" || typeof item.date !== "string") {
          return [];
        }

        const capacity =
          Number.isFinite(item.capacity) && Number(item.capacity) > 0
            ? Number(item.capacity)
            : 50;

        return [
          {
            id: item.id,
            date: item.date,
            time: typeof item.time === "string" ? item.time : "18:00",
            topic: typeof item.topic === "string" ? item.topic : "Class",
            educator: typeof item.educator === "string" ? item.educator : "",
            program: typeof item.program === "string" ? item.program : "",
            registered:
              Number.isFinite(item.registered) && Number(item.registered) >= 0
                ? Number(item.registered)
                : 0,
            capacity,
            status: CLASS_STATUSES.includes(item.status as ClassStatus)
              ? (item.status as ClassStatus)
              : "Not Yet Open",
          } satisfies ManagedClass,
        ];
      })
    : base.classes;

  const recordings: RecordingLinks = {};
  if (raw.recordings && typeof raw.recordings === "object") {
    for (const [title, url] of Object.entries(raw.recordings)) {
      /* A stored link that is not http(s) is dropped rather than shown:
         the page turns these into an href it will open. */
      if (typeof url === "string" && recordingLinkError(url) === null) {
        recordings[title] = url;
      }
    }
  }

  const settings = base.settings;
  if (raw.settings && typeof raw.settings === "object") {
    for (const card of SETTING_CARDS) {
      const stored = (raw.settings as Record<string, unknown>)[card.id];
      if (!stored || typeof stored !== "object") continue;

      const values = defaultSettingValues(card.id);
      for (const field of SETTING_FIELDS[card.id]) {
        const value = (stored as Record<string, unknown>)[field.key];

        if (field.kind === "switch" && typeof value === "boolean") {
          values[field.key] = value;
        } else if (field.kind === "number" && Number.isFinite(value)) {
          values[field.key] = Number(value);
        } else if (
          field.kind === "select" &&
          typeof value === "string" &&
          field.options?.includes(value)
        ) {
          values[field.key] = value;
        } else if (field.kind === "text" && typeof value === "string") {
          values[field.key] = value;
        }
      }
      settings[card.id] = values;
    }
  }

  return {
    /* An emptied schedule is a decision, not a broken record. */
    classes,
    recordings,
    settings,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "",
  };
}

/** Re-exported so the page does not import the seed and the rules both. */
export { classDate };
