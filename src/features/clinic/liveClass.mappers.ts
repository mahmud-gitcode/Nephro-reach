/* ==========================================================================
   Live classes: API shapes <-> page shapes (Phase 13)
   --------------------------------------------------------------------------
   Pure functions, no I/O.
   - A class starts at one instant (`startsAt`, ISO with offset). The page
     edits a calendar day and a 24-hour "HH:mm" time in the browser's own
     time zone; both ways go through the browser's Date, so a class booked
     across a daylight-saving change keeps its wall-clock time.
   - Status: open | not-yet-open | cancelled <-> "Open" | "Not Yet Open" |
     "Cancelled".
   - Program: the server's slug (journey-21-day, crash-5-day, crash-3-day, a
     published course slug, or "all") <-> the page's label.
   - Settings: the six cards keep the server's field names; only the
     reminder lead differs ("1-day" <-> "1 day before").
   ========================================================================== */

import type { RecentClass } from "./liveClass.data";
import type {
  ClassDraft,
  ClassStatus,
  ManagedClass,
  SettingId,
  SettingValues,
} from "./liveClass.actions";

/* ---- API shapes -------------------------------------------------------- */

export type ApiLiveClass = {
  id: string;
  startsAt: string;
  topic: string;
  educator: string | null;
  program: string;
  capacity: number;
  status: string;
  registeredCount: number;
  seatsLeft: number;
  recordingUrl: string | null;
};

export type ApiPlatformLiveClass = ApiLiveClass & {
  joinUrl: string | null;
  attendedCount: number;
  averageRating: number | null;
  createdAt?: string;
};

export type ApiLiveRegistration = {
  id: string;
  liveClassId: string;
  registeredAt: string;
  attendedAt: string | null;
  rating: number | null;
  liveClass: ApiLiveClass;
};

export type ApiAttendance = ApiLiveRegistration & { joinUrl: string };

export type ApiLiveClassSetting = {
  key: string;
  values: Record<string, string | number | boolean>;
  updatedAt: string | null;
};

/* ---- time -------------------------------------------------------------- */

const pad = (n: number) => String(n).padStart(2, "0");

/** The browser's calendar day and 24-hour time of an instant. */
export function fromStartsAt(iso: string): { date: string; time: string } {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return { date: "", time: "" };
  return {
    date: `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`,
    time: `${pad(at.getHours())}:${pad(at.getMinutes())}`,
  };
}

/** The instant of a day and "HH:mm" in the browser's time zone, or null
 *  for a value the form should have refused. */
export function toStartsAt(date: string, time: string): string | null {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const clock = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!day || !clock) return null;
  const [, y, m, d] = day.map(Number);
  const [, hh, mm] = clock.map(Number);
  if (hh > 23 || mm > 59) return null;
  const at = new Date(y, m - 1, d, hh, mm, 0, 0);
  if (at.getFullYear() !== y || at.getMonth() !== m - 1 || at.getDate() !== d)
    return null;
  return at.toISOString();
}

/** The short name of the browser's time zone at an instant ("EST", "EDT";
 *  "GMT+6" where the zone has no abbreviation). Shown next to class times. */
export function zoneLabel(iso: string | Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZoneName: "short",
    }).formatToParts(typeof iso === "string" ? new Date(iso) : iso);
    return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

/* ---- enums ------------------------------------------------------------- */

const STATUS_FROM_API: Record<string, ClassStatus> = {
  open: "Open",
  "not-yet-open": "Not Yet Open",
  cancelled: "Cancelled",
};
const STATUS_TO_API: Record<ClassStatus, string> = {
  Open: "open",
  "Not Yet Open": "not-yet-open",
  Cancelled: "cancelled",
};

export function statusFromApi(value: string): ClassStatus {
  return STATUS_FROM_API[value] ?? "Not Yet Open";
}

export function statusToApi(value: ClassStatus): string {
  return STATUS_TO_API[value];
}

/** The page's program labels and the server's program slugs. */
export const PROGRAM_SLUGS: Record<string, string> = {
  "Journey to Dialysis": "journey-21-day",
  "Crash Dialysis": "crash-5-day",
  "All Programs": "all",
};

export function programFromApi(slug: string): string {
  const label = Object.entries(PROGRAM_SLUGS).find(([, s]) => s === slug)?.[0];
  return label ?? slug;
}

export function programToApi(label: string): string {
  return PROGRAM_SLUGS[label] ?? label;
}

/* ---- classes ----------------------------------------------------------- */

export function fromApiLiveClass(
  api: ApiLiveClass | ApiPlatformLiveClass,
): ManagedClass {
  const { date, time } = fromStartsAt(api.startsAt);
  const platform = api as Partial<ApiPlatformLiveClass>;
  return {
    id: api.id,
    startsAt: api.startsAt,
    date,
    time,
    topic: api.topic,
    educator: api.educator ?? "",
    program: programFromApi(api.program),
    registered: api.registeredCount,
    capacity: api.capacity,
    status: statusFromApi(api.status),
    joinUrl: platform.joinUrl ?? undefined,
    recordingUrl: api.recordingUrl ?? undefined,
    attended:
      typeof platform.attendedCount === "number"
        ? platform.attendedCount
        : null,
    averageRating:
      typeof platform.averageRating === "number"
        ? platform.averageRating
        : null,
  };
}

/** A class that has taken place, for the recordings list. */
export function toRecentClass(item: ManagedClass): RecentClass {
  return {
    id: item.id,
    title: item.topic,
    date: item.date,
    attended: item.attended ?? null,
    rating: item.averageRating ?? 0,
  };
}

export type LiveClassBody = {
  startsAt: string;
  topic: string;
  educator?: string;
  program: string;
  capacity: number;
  status: string;
  joinUrl?: string | null;
};

/** A create or update body from the schedule form. Throws on a day or
 *  time the form should have refused, so nothing malformed is sent. */
export function toLiveClassBody(
  draft: ClassDraft,
  mode: "create" | "update",
): LiveClassBody {
  const startsAt = toStartsAt(draft.date, draft.time);
  if (!startsAt) throw new RangeError("Pick a valid day and time.");
  const body: LiveClassBody = {
    startsAt,
    topic: draft.topic.trim(),
    program: programToApi(draft.program),
    capacity: Math.trunc(draft.capacity),
    status: statusToApi(draft.status),
  };
  const educator = draft.educator.trim();
  if (educator) body.educator = educator;
  const link = draft.joinUrl.trim();
  if (link) body.joinUrl = link;
  else if (mode === "update") body.joinUrl = null;
  return body;
}

/* ---- settings ---------------------------------------------------------- */

const LEAD_FROM_API: Record<string, string> = {
  "1-day": "1 day before",
  "2-hours": "2 hours before",
  "1-hour": "1 hour before",
};

export function settingsFromApi(
  rows: ApiLiveClassSetting[],
  defaults: Record<SettingId, SettingValues>,
): Record<SettingId, SettingValues> {
  const out = { ...defaults };
  for (const row of rows) {
    if (!(row.key in out)) continue;
    const values: SettingValues = { ...row.values };
    if (row.key === "reminders" && typeof values.lead === "string")
      values.lead = LEAD_FROM_API[values.lead] ?? values.lead;
    out[row.key as SettingId] = { ...out[row.key as SettingId], ...values };
  }
  return out;
}

/** One card's PUT body (only that key). */
export function settingToApi(
  id: SettingId,
  values: SettingValues,
): Record<string, SettingValues> {
  const sent: SettingValues = { ...values };
  if (id === "reminders" && typeof sent.lead === "string") {
    const slug = Object.entries(LEAD_FROM_API).find(
      ([, label]) => label === sent.lead,
    )?.[0];
    if (slug) sent.lead = slug;
  }
  return { [id]: sent };
}
