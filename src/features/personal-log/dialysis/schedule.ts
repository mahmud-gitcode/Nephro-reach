/* ==========================================================================
   Dialysis schedule — the date arithmetic
   --------------------------------------------------------------------------
   Pulled out of a 2,240-line page, where it sat above a 1,857-line
   component and had never been tested: reaching any of it meant rendering
   the whole dashboard.

   This is the part of that screen most worth testing. It decides which days
   a member is prescribed treatment on, which treatment they are in now, and
   what number this one is in the month — and it does that across schedule
   changes, because saving a new weekly schedule appends a period rather
   than rewriting history. A treatment run last month keeps the schedule it
   was actually run on.

   Everything here is pure: dates in, dates out, no React and no storage.
   ========================================================================== */

export const ALL_WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const WEEKDAY_ES: Record<string, string> = {
  Sunday: "Domingo",
  Monday: "Lunes",
  Tuesday: "Martes",
  Wednesday: "Miércoles",
  Thursday: "Jueves",
  Friday: "Viernes",
  Saturday: "Sábado",
};

export const MONTH_SHORT_EN = [
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
export const MONTH_SHORT_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export type TreatmentStatus = "past" | "current" | "upcoming";

/** Unscheduled extra session. Its card is derived from the weekly schedule. */
export interface ExtraTreatment {
  id: string;
  dateKey: string; // yyyy-mm-dd
  reason: string;
  notes?: string;
}

export function pad2(value: number) {
  return `${value}`.padStart(2, "0");
}

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function fromDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(d: Date, amount: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + amount);
}

export function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** "Friday, Jun 19, 2026" — shape kept so parseDayAndDate keeps working. */
export function formatFullDate(d: Date, isEs: boolean) {
  const weekday = ALL_WEEKDAYS[d.getDay()];
  const dayLabel = isEs ? WEEKDAY_ES[weekday] : weekday;
  const month = isEs
    ? MONTH_SHORT_ES[d.getMonth()]
    : MONTH_SHORT_EN[d.getMonth()];
  return `${dayLabel}, ${month} ${d.getDate()}, ${d.getFullYear()}`;
}

export type IsTreatmentDay = (date: Date) => boolean;

/** How far back a saved week setting reaches. */
export type ApplyScope = "today" | "currentTreatment" | "month";

export const SCOPE_OPTIONS: {
  id: ApplyScope;
  labelEn: string;
  labelEs: string;
  descEn: string;
  descEs: string;
}[] = [
  {
    id: "currentTreatment",
    labelEn: "From Current Treatment",
    labelEs: "Desde el Tratamiento Actual",
    descEn: "Changes the treatment you are in now and all the ones after it.",
    descEs: "Cambia el tratamiento en curso y todos los siguientes.",
  },
  {
    id: "today",
    labelEn: "From Today",
    labelEs: "Desde Hoy",
    descEn:
      "Changes treatments from today onward. Today's treatment keeps its day.",
    descEs: "Cambia los tratamientos desde hoy. El de hoy mantiene su día.",
  },
  {
    id: "month",
    labelEn: "Full Month",
    labelEs: "Mes Completo",
    descEn: "Changes every treatment in this month, starting from the 1st.",
    descEs: "Cambia todos los tratamientos de este mes, desde el día 1.",
  },
];

/**
 * A weekly schedule and the date it takes effect from. Saving the schedule
 * appends a new period instead of rewriting history, so treatments before the
 * effective date keep the schedule they were actually run on.
 */
export interface SchedulePeriod {
  fromKey: string; // inclusive, yyyy-mm-dd
  days: string[];
  /**
   * The assigned chair time per prescribed weekday, "HH:MM" on a 24h clock.
   *
   * Every member is given one by their unit — "Monday, Wednesday, Friday at
   * 5:30" — and it is the fact the whole day is built around. The schedule
   * used to hold only a reminder time, which is a different thing: it
   * answered "when do you want to be nudged" and never recorded when the
   * member is actually due in the chair.
   */
  chairTimes: Record<string, string>;
  /**
   * How long before chair time to remind, in minutes.
   *
   * The reminder is derived rather than stored, so a chair time that moves
   * takes its reminder with it. Storing both independently is how somebody
   * ends up being reminded for a slot they no longer have.
   */
  reminderLeadMinutes: number;
  /** Session length in minutes. One amount shared by every prescribed day. */
  durationMinutes: number;
}

/** Chair time given to a day that was just added to the schedule. */
export const DEFAULT_CHAIR_TIME = "07:30";
/** An hour's notice, which is travel time for most people. */
export const DEFAULT_REMINDER_LEAD_MINUTES = 60;

/** Kept for stored records written before chair time existed. */
export const DEFAULT_REMINDER = DEFAULT_CHAIR_TIME;

/** Clock arithmetic on "HH:MM", wrapping backwards past midnight. */
export function shiftClock(value: string, minutes: number): string {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;

  const total = (hour * 60 + minute - minutes + 24 * 60) % (24 * 60);
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

/** When to nudge for a given day: chair time, less the lead. */
export function reminderTimeFor(period: SchedulePeriod, day: string): string {
  const chair = period.chairTimes[day] ?? DEFAULT_CHAIR_TIME;
  return shiftClock(chair, period.reminderLeadMinutes);
}

/**
 * Fill in a period stored before chair time existed.
 *
 * The old `reminders` map is read as the chair time with no lead, because
 * that is what members were typing into it — the time they had to be there.
 * Nothing shifts until they edit it, which is the only honest migration
 * when one field was doing two jobs.
 */
export function normaliseSchedulePeriod(
  period: SchedulePeriod & { reminders?: Record<string, string> },
): SchedulePeriod {
  return {
    fromKey: period.fromKey,
    days: period.days ?? [],
    chairTimes: period.chairTimes ?? period.reminders ?? {},
    reminderLeadMinutes: period.reminderLeadMinutes ?? 0,
    durationMinutes: period.durationMinutes ?? DEFAULT_DURATION_MINUTES,
  };
}
/** 4h, the usual in-centre hemodialysis run. */
export const DEFAULT_DURATION_MINUTES = 240;

/** "07:30" -> "7:30 AM" in English; Spanish stays on the 24h clock. */
export function formatReminder(value: string, isEs: boolean) {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
  if (isEs) return `${pad2(hour)}:${pad2(minute)}`;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 === 0 ? 12 : hour % 12}:${pad2(minute)} ${suffix}`;
}

/** 240 -> "4h 00m" */
export function formatDuration(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${pad2(minutes % 60)}m`;
}

/** The prescribed days in force on a given date. */
export function daysForDate(periods: SchedulePeriod[], date: Date) {
  const key = toDateKey(date);
  let active = periods[0]?.days ?? [];
  for (const period of periods) {
    if (period.fromKey > key) break;
    active = period.days;
  }
  return active;
}

export function makeIsTreatmentDay(periods: SchedulePeriod[]): IsTreatmentDay {
  return (date: Date) =>
    daysForDate(periods, date).includes(ALL_WEEKDAYS[date.getDay()]);
}

/** First prescribed treatment day strictly after `from`. */
export function nextScheduledDate(from: Date, isTreatmentDay: IsTreatmentDay) {
  for (let i = 1; i <= 62; i++) {
    const candidate = addDays(from, i);
    if (isTreatmentDay(candidate)) return candidate;
  }
  return addDays(from, 7);
}

/** Most recent prescribed treatment day on or before `from`. */
export function scheduledOnOrBefore(
  from: Date,
  isTreatmentDay: IsTreatmentDay,
) {
  for (let i = 0; i <= 62; i++) {
    const candidate = addDays(from, -i);
    if (isTreatmentDay(candidate)) return candidate;
  }
  return from;
}

/** Walks `offset` prescribed treatment days from `base`. */
export function shiftScheduledDate(
  base: Date,
  offset: number,
  isTreatmentDay: IsTreatmentDay,
) {
  let cursor = base;
  for (let step = 0; step < Math.abs(offset); step++) {
    cursor =
      offset > 0
        ? nextScheduledDate(cursor, isTreatmentDay)
        : scheduledOnOrBefore(addDays(cursor, -1), isTreatmentDay);
  }
  return cursor;
}

/** Position of a treatment date within its own month (1-based). */
export function treatmentNumberInMonth(
  d: Date,
  isTreatmentDay: IsTreatmentDay,
) {
  let count = 0;
  for (let day = 1; day <= d.getDate(); day++) {
    const candidate = new Date(d.getFullYear(), d.getMonth(), day);
    if (isTreatmentDay(candidate)) count++;
  }
  return count || 1;
}

/** The draft a member fills in on the Edit Weekly Schedule form. */
export interface ScheduleDraft {
  days: string[];
  chairTimes: Record<string, string>;
  reminderLeadMinutes: number;
  durationHours: string;
  durationMinutes: string;
}

/**
 * Turns the form's draft into the period that gets appended.
 *
 * The clamping is the point: hours come from a text input, so "abc", "99"
 * and "" all have to become a session length somebody could actually be
 * prescribed. 15 minutes is the floor and 12 hours the ceiling.
 */
export function buildSchedulePeriod(
  draft: ScheduleDraft,
  fromKey: string,
): SchedulePeriod {
  const days = [...draft.days].sort(
    (a, b) => ALL_WEEKDAYS.indexOf(a) - ALL_WEEKDAYS.indexOf(b),
  );

  // A chair time for every prescribed day, and one session length for all.
  const chairTimes: Record<string, string> = {};
  for (const day of days) {
    chairTimes[day] = draft.chairTimes[day] || DEFAULT_CHAIR_TIME;
  }

  const hours = Math.min(12, Math.max(0, Number(draft.durationHours) || 0));
  const durationMinutes = Math.max(
    15,
    hours * 60 + (Number(draft.durationMinutes) || 0),
  );

  return {
    fromKey,
    days,
    chairTimes,
    reminderLeadMinutes: Math.max(
      0,
      Math.min(24 * 60, draft.reminderLeadMinutes),
    ),
    durationMinutes,
  };
}

/**
 * Appends a period, dropping any that started on or after the same date.
 * Everything before it keeps the schedule it was actually run on — a
 * treatment in the past is a record, not a projection.
 */
export function appendSchedulePeriod(
  periods: SchedulePeriod[],
  period: SchedulePeriod,
): SchedulePeriod[] {
  const kept = periods.filter((entry) => entry.fromKey < period.fromKey);
  const base = kept.length > 0 ? kept : periods.slice(0, 1);
  return [...base, period];
}
