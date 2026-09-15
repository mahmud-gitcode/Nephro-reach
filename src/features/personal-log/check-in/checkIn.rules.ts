import type { BetweenTreatmentCheckIn, CheckInFeeling } from "./checkIn.types";

/* ==========================================================================
   Between Treatment Check-in — pure rules
   --------------------------------------------------------------------------
   Dates are handled as `yyyy-mm-dd` strings throughout and never as Date
   objects in storage, because a Date is a moment in time and a check-in is
   a calendar day. Parsing "2026-09-15" with `new Date()` in a timezone
   behind UTC lands on the 14th, which is how a log entry ends up filed
   under the wrong day.
   ========================================================================== */

/** Today as `yyyy-mm-dd` in the member's own timezone, not UTC. */
export function todayIso(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** A local Date at midnight, safe to format. */
export function parseIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function isValidIso(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const date = parseIso(iso);
  return !Number.isNaN(date.getTime()) && todayIso(date) === iso;
}

/** "Monday, Jun 22" — the way a member would say it. */
export function formatDayLabel(iso: string, isEs: boolean): string {
  if (!isValidIso(iso)) return iso;
  return parseIso(iso).toLocaleDateString(isEs ? "es-ES" : "en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** "Today" and "Yesterday" beat any date format for the two most-used days. */
export function relativeDayLabel(
  iso: string,
  isEs: boolean,
  now = new Date(),
): string {
  const today = todayIso(now);
  if (iso === today) return isEs ? "Hoy" : "Today";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (iso === todayIso(yesterday)) return isEs ? "Ayer" : "Yesterday";

  return formatDayLabel(iso, isEs);
}

/** Newest day first. */
export function sortByDate(
  entries: BetweenTreatmentCheckIn[],
): BetweenTreatmentCheckIn[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

export function findByDate(
  entries: BetweenTreatmentCheckIn[],
  date: string,
): BetweenTreatmentCheckIn | undefined {
  return entries.find((entry) => entry.date === date);
}

/**
 * One check-in per day: saving the same date again edits that day rather
 * than stacking a second entry under it.
 */
export function upsertCheckIn(
  entries: BetweenTreatmentCheckIn[],
  entry: BetweenTreatmentCheckIn,
): BetweenTreatmentCheckIn[] {
  const index = entries.findIndex((current) => current.date === entry.date);
  if (index === -1) return sortByDate([entry, ...entries]);

  const next = [...entries];
  next[index] = entry;
  return sortByDate(next);
}

export function removeCheckIn(
  entries: BetweenTreatmentCheckIn[],
  date: string,
): BetweenTreatmentCheckIn[] {
  return entries.filter((entry) => entry.date !== date);
}

export function emptyCheckIn(date = todayIso()): BetweenTreatmentCheckIn {
  return {
    date,
    treatmentDay: false,
    feeling: "good",
    symptoms: [],
    severity: "mild",
    missedTreatment: false,
    notes: "",
    savedAt: new Date().toISOString(),
  };
}

/** A date is required and cannot be in the future — nobody knows yet. */
export function checkInError(
  entry: BetweenTreatmentCheckIn,
  now = new Date(),
): string | null {
  if (!isValidIso(entry.date)) return "invalid-date";
  if (entry.date > todayIso(now)) return "future-date";
  return null;
}

export function canSave(
  entry: BetweenTreatmentCheckIn,
  now = new Date(),
): boolean {
  return checkInError(entry, now) === null;
}

export function toggleSymptom(symptoms: string[], symptom: string): string[] {
  return symptoms.includes(symptom)
    ? symptoms.filter((entry) => entry !== symptom)
    : [...symptoms, symptom];
}

/* ==========================================================================
   What the summary row reads from
   ========================================================================== */

const FEELINGS: CheckInFeeling[] = ["good", "okay", "rough"];

export interface CheckInSummary {
  logged: number;
  /** Consecutive days ending today or yesterday. */
  streak: number;
  missedTreatments: number;
  byFeeling: Record<CheckInFeeling, number>;
  /** The symptom logged most often, if any stands out. */
  topSymptom: string | null;
}

/**
 * A streak counts back from today, and tolerates today being unlogged so it
 * does not read zero every morning until the member opens the app.
 */
export function currentStreak(
  entries: BetweenTreatmentCheckIn[],
  now = new Date(),
): number {
  const dates = new Set(entries.map((entry) => entry.date));
  const cursor = new Date(now);
  if (!dates.has(todayIso(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (dates.has(todayIso(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function summarise(
  entries: BetweenTreatmentCheckIn[],
  now = new Date(),
): CheckInSummary {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    for (const symptom of entry.symptoms) {
      counts[symptom] = (counts[symptom] ?? 0) + 1;
    }
  }

  const ranked = Object.entries(counts).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );

  return {
    logged: entries.length,
    streak: currentStreak(entries, now),
    missedTreatments: entries.filter((entry) => entry.missedTreatment).length,
    byFeeling: FEELINGS.reduce(
      (totals, feeling) => ({
        ...totals,
        [feeling]: entries.filter((entry) => entry.feeling === feeling).length,
      }),
      {} as Record<CheckInFeeling, number>,
    ),
    topSymptom: ranked[0]?.[0] ?? null,
  };
}

/**
 * The last `days` days, oldest first, with a null for every day not logged.
 *
 * Gaps are kept rather than closed up: a fortnight with four entries is a
 * different picture from four days in a row, and a chart that closed the
 * gaps would show them as the same.
 */
export function recentDays(
  entries: BetweenTreatmentCheckIn[],
  days = 14,
  now = new Date(),
): { date: string; entry: BetweenTreatmentCheckIn | null }[] {
  const byDate = new Map(entries.map((entry) => [entry.date, entry]));
  const out: { date: string; entry: BetweenTreatmentCheckIn | null }[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const cursor = new Date(now);
    cursor.setDate(cursor.getDate() - offset);
    const iso = todayIso(cursor);
    out.push({ date: iso, entry: byDate.get(iso) ?? null });
  }
  return out;
}
