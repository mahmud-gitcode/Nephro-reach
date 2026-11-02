/* ==========================================================================
   Dialysis schedule periods: wire shapes and transforms (Phase 7)
   --------------------------------------------------------------------------
   `GET /patients/:id/dialysis/schedule` returns every dated period (not
   paged); `POST` appends one and replaces the periods from its
   `effectiveFrom` on. The UI's `fromKey/days/durations` become
   `effectiveFrom/weekdays/durationsMinutes`; chair times are already
   HH:mm and are checked here, never reformatted.
   ========================================================================== */

import { ALL_WEEKDAYS, type SchedulePeriod } from "./schedule";

export type ApiSchedulePeriod = {
  id: string;
  patientId: string;
  effectiveFrom: string;
  weekdays: string[];
  chairTimes: Record<string, string>;
  durationsMinutes: Record<string, number>;
  reminderLeadMinutes: number;
  createdById: string | null;
  createdAt: string;
};

export type SchedulePeriodBody = {
  effectiveFrom: string;
  weekdays: string[];
  chairTimes: Record<string, string>;
  durationsMinutes: Record<string, number>;
  reminderLeadMinutes: number;
};

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function fromApiSchedulePeriod(raw: ApiSchedulePeriod): SchedulePeriod {
  return {
    fromKey: raw.effectiveFrom.slice(0, 10),
    days: raw.weekdays.filter((d) => ALL_WEEKDAYS.includes(d)),
    chairTimes: { ...(raw.chairTimes ?? {}) },
    reminderLeadMinutes: raw.reminderLeadMinutes ?? 0,
    durations: { ...(raw.durationsMinutes ?? {}) },
  };
}

/** Oldest first, the order the schedule rules expect. */
export function fromApiSchedule(raw: ApiSchedulePeriod[]): SchedulePeriod[] {
  return raw
    .map(fromApiSchedulePeriod)
    .sort((a, b) => a.fromKey.localeCompare(b.fromKey));
}

/**
 * The POST body for a period the member saved. Throws (a programming error,
 * never sent) for the default week's placeholder date or a chair time that
 * is not HH:mm.
 */
export function toSchedulePeriodBody(
  period: SchedulePeriod,
): SchedulePeriodBody {
  if (!DAY.test(period.fromKey) || period.fromKey.startsWith("0000"))
    throw new RangeError(`Not a real start day: ${period.fromKey}`);
  const weekdays = period.days.filter((d) => ALL_WEEKDAYS.includes(d));
  const chairTimes: Record<string, string> = {};
  const durationsMinutes: Record<string, number> = {};
  for (const day of weekdays) {
    const time = period.chairTimes[day];
    if (time !== undefined) {
      if (!HH_MM.test(time))
        throw new RangeError(`Chair time not HH:mm: ${time}`);
      chairTimes[day] = time;
    }
    const minutes = period.durations[day];
    if (minutes !== undefined)
      durationsMinutes[day] = Math.min(720, Math.max(15, Math.round(minutes)));
  }
  return {
    effectiveFrom: period.fromKey,
    weekdays,
    chairTimes,
    durationsMinutes,
    reminderLeadMinutes: Math.min(
      1440,
      Math.max(0, Math.round(period.reminderLeadMinutes)),
    ),
  };
}
