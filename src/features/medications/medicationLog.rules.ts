export type { AdherenceBand as AdherenceBandValue } from "./medicationLog.types";

import type {
  DoseRecord,
  DoseStatus,
  SideEffect,
  SideEffectRecord,
} from "./medicationLog.types";

/* ==========================================================================
   The medication log: pure rules (Phase 6)
   --------------------------------------------------------------------------
   Dates are `yyyy-mm-dd` strings, never Date objects: a Date is a moment
   and a dose belongs to a calendar day. Parsing "2026-09-15" with
   `new Date()` west of UTC lands on the 14th, which is how a dose gets
   filed against the wrong day.

   A dose is found by (medication id, day, HH:mm), the API's identity. What
   is stored, the stamp and the adherence figures are the server's; this
   file only reads the records the API returned.
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

export function findDose(
  doses: DoseRecord[],
  date: string,
  medicationId: string,
  time: string,
): DoseRecord | undefined {
  return doses.find(
    (dose) =>
      dose.date === date &&
      dose.medicationId === medicationId &&
      dose.time === time,
  );
}

export function statusOf(
  doses: DoseRecord[],
  date: string,
  medicationId: string,
  time: string,
): DoseStatus {
  return findDose(doses, date, medicationId, time)?.status ?? "pending";
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
   Side effects
   --------------------------------------------------------------------------
   `null` means the member has not answered, which is not the same as
   "none": an unanswered dose must not be counted as a dose that went fine.
   ========================================================================== */

export function sideEffectOf(
  records: SideEffectRecord[],
  date: string,
  medicationId: string,
  time: string,
): SideEffect | null {
  return (
    records.find(
      (record) =>
        record.date === date &&
        record.medicationId === medicationId &&
        record.time === time,
    )?.effect ?? null
  );
}

/**
 * How many doses on this day the member reported something for. "none" is
 * an answer, not a symptom, so it does not count: this figure drives the
 * notice that the page does not pass any of it to the care team.
 */
export function reportedSideEffectCount(
  records: SideEffectRecord[],
  date: string,
): number {
  return records.filter(
    (record) => record.date === date && record.effect !== "none",
  ).length;
}
