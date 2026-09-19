import { isValidIso, todayIso } from "../check-in/checkIn.rules";
import {
  ACTIVITY_OPTIONS,
  FEELING_OPTIONS,
  INTENSITY_OPTIONS,
  UNIT_OPTIONS,
} from "./exercise.options";
import type {
  ExerciseActivity,
  ExerciseDraft,
  ExerciseEntry,
  ExerciseFeeling,
  ExerciseIntensity,
  ExerciseUnit,
} from "./exercise.types";

/* ==========================================================================
   Exercise log — pure rules
   ========================================================================== */

export function entriesOn(
  entries: ExerciseEntry[],
  date: string,
): ExerciseEntry[] {
  return entries
    .filter((entry) => entry.date === date)
    .sort((a, b) => a.savedAt.localeCompare(b.savedAt));
}

/** Saving an id that already exists edits it rather than adding a second. */
export function upsertEntry(
  entries: ExerciseEntry[],
  entry: ExerciseEntry,
): ExerciseEntry[] {
  const index = entries.findIndex((current) => current.id === entry.id);
  if (index === -1) return [...entries, entry];
  const next = [...entries];
  next[index] = entry;
  return next;
}

export function removeEntry(
  entries: ExerciseEntry[],
  id: string,
): ExerciseEntry[] {
  return entries.filter((entry) => entry.id !== id);
}

export function emptyDraft(
  activity: ExerciseActivity = "walking",
): ExerciseDraft {
  return {
    activity,
    customName: "",
    amount: 0,
    unit: defaultUnit(activity),
    intensity: "light",
    feeling: null,
    note: "",
  };
}

export function defaultUnit(activity: ExerciseActivity): ExerciseUnit {
  return (
    ACTIVITY_OPTIONS.find((option) => option.value === activity)?.unit ??
    "minutes"
  );
}

export type ExerciseError =
  "missing-name" | "missing-amount" | "invalid-date" | "future-date";

export function exerciseError(
  draft: ExerciseDraft,
  date: string,
  now = new Date(),
): ExerciseError | null {
  if (!isValidIso(date)) return "invalid-date";
  if (date > todayIso(now)) return "future-date";
  if (draft.activity === "other" && !draft.customName.trim()) {
    return "missing-name";
  }
  if (!(draft.amount > 0)) return "missing-amount";
  return null;
}

export function activityLabel(
  entry: Pick<ExerciseEntry, "activity" | "customName">,
  isEs: boolean,
): string {
  if (entry.activity === "other" && entry.customName.trim()) {
    return entry.customName.trim();
  }
  const option = ACTIVITY_OPTIONS.find((item) => item.value === entry.activity);
  if (!option) return entry.customName || entry.activity;
  return isEs ? option.labelEs : option.labelEn;
}

export function unitLabel(unit: ExerciseUnit, isEs: boolean): string {
  const option = UNIT_OPTIONS.find((item) => item.value === unit);
  if (!option) return unit;
  return isEs ? option.labelEs : option.labelEn;
}

/** "2,000 steps", "10 times" — the line a member reads back. */
export function formatAmount(
  amount: number,
  unit: ExerciseUnit,
  isEs: boolean,
): string {
  const value = amount.toLocaleString(isEs ? "es-ES" : "en-US", {
    maximumFractionDigits: 2,
  });
  return `${value} ${unitLabel(unit, isEs)}`;
}

export interface DayTotal {
  key: string;
  label: string;
  amount: number;
  unit: ExerciseUnit;
}

/**
 * One line per activity and unit, summed across the day, so two walks
 * read as one total. Kept separate by unit: steps and minutes of walking
 * do not add up.
 */
export function dayTotals(entries: ExerciseEntry[], isEs: boolean): DayTotal[] {
  const totals = new Map<string, DayTotal>();
  for (const entry of entries) {
    const label = activityLabel(entry, isEs);
    const key = `${label.toLowerCase()}|${entry.unit}`;
    const current = totals.get(key);
    if (current) current.amount += entry.amount;
    else
      totals.set(key, { key, label, amount: entry.amount, unit: entry.unit });
  }
  return [...totals.values()];
}

/* ==========================================================================
   Intensity, feeling and the day's summary
   ========================================================================== */

export function intensityLabel(
  intensity: ExerciseIntensity,
  isEs: boolean,
): string {
  const option = INTENSITY_OPTIONS.find((item) => item.value === intensity);
  if (!option) return intensity;
  return isEs ? option.labelEs : option.labelEn;
}

export function feelingLabel(feeling: ExerciseFeeling, isEs: boolean): string {
  const option = FEELING_OPTIONS.find((item) => item.value === feeling);
  if (!option) return feeling;
  return isEs ? option.labelEs : option.labelEn;
}

/** The phrase the activity list reads back: "Felt good", "Slight fatigue". */
export function feelingSaidBack(
  feeling: ExerciseFeeling,
  isEs: boolean,
): string {
  const option = FEELING_OPTIONS.find((item) => item.value === feeling);
  if (!option) return feeling;
  return isEs ? option.pastEs : option.pastEn;
}

/**
 * Minutes of activity on the day. Only entries actually counted in minutes
 * are summed — 2,000 steps is a real log but not a duration, and guessing
 * one from the other would put a number on the screen nobody entered.
 */
export function minutesOn(entries: ExerciseEntry[]): number {
  return entries
    .filter((entry) => entry.unit === "minutes")
    .reduce((total, entry) => total + entry.amount, 0);
}

/**
 * A rough kcal estimate: minutes × the intensity's per-minute average,
 * again only for entries logged in minutes. Never stored, never shown
 * without the word "estimated".
 */
export function estimateCalories(entries: ExerciseEntry[]): number {
  const total = entries
    .filter((entry) => entry.unit === "minutes")
    .reduce((sum, entry) => {
      const option = INTENSITY_OPTIONS.find(
        (item) => item.value === entry.intensity,
      );
      return sum + entry.amount * (option?.kcalPerMinute ?? 0);
    }, 0);
  return Math.round(total);
}

/* Worst first is deliberate: the day's summary reports the lowest feeling
   logged, so one session that left the member unwell is never averaged
   away behind three that went fine. */
const FEELING_RANK: ExerciseFeeling[] = ["unwell", "tired", "okay", "good"];

export function lowestFeeling(
  entries: ExerciseEntry[],
): ExerciseFeeling | null {
  for (const feeling of FEELING_RANK) {
    if (entries.some((entry) => entry.feeling === feeling)) return feeling;
  }
  return null;
}
