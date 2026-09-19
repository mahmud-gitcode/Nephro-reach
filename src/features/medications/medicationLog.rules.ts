export type { AdherenceBand as AdherenceBandValue } from "./medicationLog.types";

import type {
  AdherenceBand,
  AdherenceSummary,
  DoseRecord,
  DoseStatus,
  MoodEntry,
  RefillFlags,
  SideEffect,
  SideEffectRecord,
} from "./medicationLog.types";

/* ==========================================================================
   The medication log — pure rules
   --------------------------------------------------------------------------
   Dates are `yyyy-mm-dd` strings, never Date objects in storage: a Date is a
   moment and a dose belongs to a calendar day. Parsing "2026-09-15" with
   `new Date()` west of UTC lands on the 14th, which is how a dose gets filed
   against the wrong day.
   ========================================================================== */

export function todayIso(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

/** Days either side of a date, as an ISO string. */
export function shiftDay(iso: string, days: number): string {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  return todayIso(date);
}

export function formatDayLabel(iso: string, isEs: boolean): string {
  const date = parseIso(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(isEs ? "es-ES" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

export function isToday(iso: string, now = new Date()): boolean {
  return iso === todayIso(now);
}

/** Identity of one dose: a day, a medication, and the time it was due. */
export function doseKey(date: string, medication: string, time: string) {
  return `${date}|${medication}|${time}`;
}

export function findDose(
  doses: DoseRecord[],
  date: string,
  medication: string,
  time: string,
): DoseRecord | undefined {
  return doses.find(
    (dose) =>
      dose.date === date &&
      dose.medication === medication &&
      dose.time === time,
  );
}

export function statusOf(
  doses: DoseRecord[],
  date: string,
  medication: string,
  time: string,
): DoseStatus {
  return findDose(doses, date, medication, time)?.status ?? "pending";
}

/**
 * Setting a status stamps the moment it was set, which is what the schedule
 * shows and what a care team reads. Setting it back to `pending` clears the
 * stamp rather than leaving a time next to a dose nobody has decided about.
 */
export function setDoseStatus(
  doses: DoseRecord[],
  date: string,
  medication: string,
  time: string,
  status: DoseStatus,
  now = new Date(),
): DoseRecord[] {
  const rest = doses.filter(
    (dose) =>
      !(
        dose.date === date &&
        dose.medication === medication &&
        dose.time === time
      ),
  );

  if (status === "pending") return rest;

  return [
    ...rest,
    { date, medication, time, status, stampedAt: now.toISOString() },
  ];
}

/** "14:05" style stamp for the table, in the member's own locale. */
export function formatStamp(
  stampedAt: string | undefined,
  isEs: boolean,
): string | null {
  if (!stampedAt) return null;
  const date = new Date(stampedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString(isEs ? "es-ES" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ==========================================================================
   Adherence
   --------------------------------------------------------------------------
   The tracker at the bottom of the page. It counts only doses that have been
   decided: a dose still pending is not a failure, and counting it as one
   would mean a member's score fell every morning and recovered every night.
   ========================================================================== */

export function bandFor(percent: number): AdherenceBand {
  if (percent >= 90) return "good";
  if (percent >= 70) return "fair";
  return "poor";
}

export function summariseAdherence(
  doses: DoseRecord[],
  /** Total doses scheduled across the days being counted. */
  scheduledTotal: number,
): AdherenceSummary {
  const taken = doses.filter((dose) => dose.status === "taken").length;
  const late = doses.filter((dose) => dose.status === "late").length;
  const missed = doses.filter((dose) => dose.status === "missed").length;
  const decided = taken + late + missed;
  const pending = Math.max(0, scheduledTotal - decided);

  /* A late dose was still taken. Counting it as a miss would tell a member
     who took every dose, a little late, that they adhered to none of them. */
  const percent =
    decided === 0 ? null : Math.round(((taken + late) / decided) * 100);

  return {
    taken,
    late,
    missed,
    pending,
    percent,
    band: percent === null ? null : bandFor(percent),
  };
}

/** The last `days` days of adherence, oldest first, for the chart. */
export function adherenceByDay(
  doses: DoseRecord[],
  dosesPerDay: number,
  days = 7,
  now = new Date(),
): { date: string; summary: AdherenceSummary }[] {
  const out: { date: string; summary: AdherenceSummary }[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const iso = shiftDay(todayIso(now), -offset);
    const forDay = doses.filter((dose) => dose.date === iso);
    out.push({ date: iso, summary: summariseAdherence(forDay, dosesPerDay) });
  }
  return out;
}

/* ==========================================================================
   Refills and mood
   ========================================================================== */

export function needsRefill(flags: RefillFlags, medication: string): boolean {
  return flags[medication] === true;
}

export function setRefill(
  flags: RefillFlags,
  medication: string,
  value: boolean,
): RefillFlags {
  return { ...flags, [medication]: value };
}

export function refillCount(flags: RefillFlags): number {
  return Object.values(flags).filter(Boolean).length;
}

export function findMood(
  entries: MoodEntry[],
  date: string,
): MoodEntry | undefined {
  return entries.find((entry) => entry.date === date);
}

/** One entry per day: saving again edits that day rather than stacking. */
export function upsertMood(
  entries: MoodEntry[],
  entry: MoodEntry,
): MoodEntry[] {
  const rest = entries.filter((current) => current.date !== entry.date);
  return [entry, ...rest].sort((a, b) => b.date.localeCompare(a.date));
}

/* ==========================================================================
   Side effects
   --------------------------------------------------------------------------
   One record per scheduled dose, identified the same way a DoseRecord is.
   `null` means the member has not answered, which is not the same as "none"
   — an unanswered dose must not be counted as a dose that went fine.
   ========================================================================== */

export function findSideEffect(
  records: SideEffectRecord[],
  date: string,
  medication: string,
  time: string,
): SideEffectRecord | undefined {
  return records.find(
    (record) =>
      record.date === date &&
      record.medication === medication &&
      record.time === time,
  );
}

export function sideEffectOf(
  records: SideEffectRecord[],
  date: string,
  medication: string,
  time: string,
): SideEffect | null {
  return findSideEffect(records, date, medication, time)?.effect ?? null;
}

/**
 * Record what the member felt, or clear it with `null`.
 *
 * Clearing removes the record rather than storing a blank one, so "not
 * answered" has exactly one representation and no row can disagree with
 * itself about whether it was ever filled in.
 */
export function setSideEffect(
  records: SideEffectRecord[],
  date: string,
  medication: string,
  time: string,
  effect: SideEffect | null,
  now = new Date(),
): SideEffectRecord[] {
  const rest = records.filter(
    (record) =>
      !(
        record.date === date &&
        record.medication === medication &&
        record.time === time
      ),
  );

  if (effect === null) return rest;

  return [
    ...rest,
    { date, medication, time, effect, savedAt: now.toISOString() },
  ];
}

/**
 * How many doses on this day the member reported something for.
 *
 * "none" is an answer, not a symptom, so it does not count — this figure
 * drives the notice telling the member the page will not pass any of it to
 * their care team, and that notice should only appear when there is
 * something worth passing on.
 */
export function reportedSideEffectCount(
  records: SideEffectRecord[],
  date: string,
): number {
  return records.filter(
    (record) => record.date === date && record.effect !== "none",
  ).length;
}
