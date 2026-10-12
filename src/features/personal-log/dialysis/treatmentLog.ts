import type { DialysisLogEntry } from "../dialysisTreatmentData";
import {
  ALL_WEEKDAYS,
  DEFAULT_CHAIR_TIME,
  addDays,
  daysForDate,
  durationFor,
  fromDateKey,
  toDateKey,
  type SchedulePeriod,
} from "./schedule";

/* ==========================================================================
   The member's treatment log — sessions, not free-form entries
   --------------------------------------------------------------------------
   The client (2026-10-12), with the developer's proposal she agreed to:
   "Add treatment" picks one of the member's scheduled sessions and charts
   it — attended, missed, or a make-up for a missed one — so every record
   ties back to the schedule. A scheduled day that was never charted is
   asked about ("Did you miss a treatment?"), and a make-up session is a
   rescheduled treatment.

   Self-input journaling only: the clinic never writes here, contract or
   not. Pure: entries and schedule in, answers out.
   ========================================================================== */

export type SessionStatus = "attended" | "missed" | "rescheduled";

export type ScheduledSession = {
  /** yyyy-mm-dd */
  date: string;
  /** "HH:MM", the chair time for that weekday. */
  chairTime: string;
  durationMinutes: number;
  /** The entry already charted for this day, if any. */
  entry: DialysisLogEntry | null;
};

/** Prescribed days from `days` days ago up to today, newest first. */
export function recentSessions(
  periods: SchedulePeriod[],
  entries: DialysisLogEntry[],
  today: string,
  days = 21,
): ScheduledSession[] {
  const end = fromDateKey(today);
  const out: ScheduledSession[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(end, -i);
    const weekday = ALL_WEEKDAYS[date.getDay()];
    if (!daysForDate(periods, date).includes(weekday)) continue;
    const key = toDateKey(date);
    const period =
      [...periods].reverse().find((p) => p.fromKey <= key) ?? periods[0];
    out.push({
      date: key,
      chairTime: period?.chairTimes[weekday] ?? DEFAULT_CHAIR_TIME,
      durationMinutes: period ? durationFor(period, weekday) : 240,
      entry: entries.find((e) => e.date === key) ?? null,
    });
  }
  return out;
}

/** Scheduled days before today, in the last `days` days, with nothing
 *  charted and no make-up pointing at them. */
export function uncharted(
  periods: SchedulePeriod[],
  entries: DialysisLogEntry[],
  today: string,
  days = 7,
): ScheduledSession[] {
  return recentSessions(periods, entries, today, days).filter(
    (s) =>
      s.date < today &&
      !s.entry &&
      !entries.some((e) => e.makeupFor === s.date),
  );
}

/** "HH:MM" plus minutes, as "HH:MM". */
export function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Minutes from start to end, across midnight if need be; null if unread. */
export function minutesBetween(start: string, end: string): number | null {
  const parse = (v: string) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };
  const a = parse(start);
  const b = parse(end);
  if (a === null || b === null) return null;
  return (b - a + 1440) % 1440;
}

/** "4h 15m". */
export function durationLabel(minutes: number | null): string {
  if (minutes === null) return "—";
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

/** "14:30" → "2:30 PM". */
export function clock12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/** Pre-weight minus post-weight, in kg (1 kg of fluid ≈ 1 L). */
export function fluidRemovedKg(pre: string, post: string): number | null {
  const a = Number.parseFloat(pre);
  const b = Number.parseFloat(post);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((a - b) * 10) / 10;
}

/** What a list or badge shows for an entry. */
export function attendanceOf(
  entry: Pick<
    DialysisLogEntry,
    "status" | "arrivedLate" | "endedEarly" | "attendance"
  >,
): DialysisLogEntry["attendance"] {
  if (entry.status === "missed") return "Missed";
  if (entry.status) {
    if (entry.endedEarly === "Yes") return "Ended Early";
    if (entry.arrivedLate === "Yes") return "Arrived Late";
    return "Attended";
  }
  return entry.attendance;
}

export type MonthSummary = {
  scheduled: number;
  attended: number;
  arrivedLate: number;
  endedEarly: number;
  missed: number;
  rescheduled: number;
};

/** The month's attendance, as the summary cards show it. */
export function monthSummary(
  entries: DialysisLogEntry[],
  monthKey: string,
): MonthSummary {
  const inMonth = entries.filter((e) => e.date.startsWith(monthKey));
  const missed = inMonth.filter((e) => attendanceOf(e) === "Missed").length;
  const rescheduled = inMonth.filter((e) => e.status === "rescheduled").length;
  const attended = inMonth.length - missed;
  return {
    scheduled: inMonth.length - rescheduled,
    attended,
    arrivedLate: inMonth.filter((e) => e.arrivedLate === "Yes").length,
    endedEarly: inMonth.filter((e) => e.endedEarly === "Yes").length,
    missed,
    rescheduled,
  };
}

/** Times a symptom was recorded during treatment (Yes or any severity). */
export function intraSymptomCounts(
  entries: DialysisLogEntry[],
): Array<{ key: string; count: number }> {
  const fields: Array<keyof DialysisLogEntry> = [
    "cramping",
    "dizziness",
    "swelling",
    "shortnessOfBreath",
    "lowBp",
    "highBp",
    "fatigue",
  ];
  return fields.map((field) => ({
    key: field as string,
    count: entries.filter((e) => {
      const value = e[field];
      return typeof value === "string" && value !== "No" && value !== "";
    }).length,
  }));
}

export function upsertEntry(
  entries: DialysisLogEntry[],
  entry: DialysisLogEntry,
): DialysisLogEntry[] {
  const index = entries.findIndex((e) => e.id === entry.id);
  if (index === -1) return [...entries, entry];
  const next = [...entries];
  next[index] = entry;
  return next;
}

/** A scheduled day the member says they missed, with nothing else to fill. */
export function missedEntry(
  date: string,
  modality: "in-center-hd" | "home-hd",
  now: number,
): DialysisLogEntry {
  return {
    id: `tx-${now}`,
    date,
    displayDate: displayDate(date),
    isDialysisDay: true,
    treatmentType:
      modality === "home-hd" ? "Home hemodialysis" : "In-center hemodialysis",
    modality,
    status: "missed",
    startTime: "",
    endTime: "",
    duration: "",
    location: "",
    careTeam: "",
    postWeightSummary: "",
    attendance: "Missed",
    attended: "No",
    arrivedLate: "No",
    endedEarly: "No",
    missedTreatments: 1,
    rescheduled: "No",
    preOverallFeel: 3,
    preSymptoms: [],
    preSeverity: {},
    hadIntraSymptoms: false,
    cramping: "No",
    lowBp: "No",
    fatigue: "No",
    intraSymptoms: [],
    intraSeverity: {},
    intraNotes: "",
    postOverallFeel: 3,
    recoveryTime: "No",
    medsTakenPrescribed: "Yes",
    fluidRemoved: "",
    preWeight: "",
    postWeight: "",
    weightDiff: "",
    bloodPressurePost: "",
    heartRatePost: "",
    medicationsGiven: [],
    otherNotes: "",
  };
}

/** "Wednesday, Jun 24, 2026". */
export function displayDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
