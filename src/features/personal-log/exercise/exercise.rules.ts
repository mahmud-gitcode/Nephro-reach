import { isValidIso, todayIso } from "../check-in/checkIn.rules";
import { ACTIVITY_OPTIONS, UNIT_OPTIONS } from "./exercise.options";
import type {
  ExerciseActivity,
  ExerciseDraft,
  ExerciseEntry,
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
