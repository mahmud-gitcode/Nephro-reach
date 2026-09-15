import { RECOVERY_WINDOWS } from "./checkIn.options";
import { sortByDate } from "./checkIn.rules";
import type { BetweenTreatmentCheckIn, EnergyLevel } from "./checkIn.types";

/* ==========================================================================
   Recovery trends
   --------------------------------------------------------------------------
   Everything the architecture guide asks this tab to be able to trend:
   average recovery time, whether recovery is changing, symptom frequency,
   between-treatment weight change, blood pressure, and how the member feels
   on treatment days versus the days between.

   Every figure is null when there is not enough to say, and the screen shows
   nothing rather than a number. A trend built from one entry is not a trend,
   and presenting it as one invites a member to read a single bad Tuesday as
   a decline in their health.
   ========================================================================== */

/** How many entries a figure needs before it is worth showing. */
export const MIN_FOR_TREND = 2;

/* --------------------------------------------------------------------------
   Numbers typed by hand

   Weight, blood pressure and urine output are free text because members read
   them off a home machine in whatever unit it shows. Parsing is forgiving on
   the way in and strict on the way out: anything that does not read as a
   number is left out of a trend rather than counted as zero, which would
   drag every average down.
   -------------------------------------------------------------------------- */

export function parseNumber(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

/** "128/74" into its two numbers. Anything else is null, not a guess. */
export function parseBloodPressure(
  value: string | undefined,
): { systolic: number; diastolic: number } | null {
  if (!value) return null;
  const match = value.match(/^\s*(\d{2,3})\s*\/\s*(\d{2,3})\s*$/);
  if (!match) return null;
  return { systolic: Number(match[1]), diastolic: Number(match[2]) };
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function round(value: number | null, places = 1): number | null {
  if (value === null) return null;
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/** Hours for the windows that map to one; the rest drop out. */
function recoveryHours(entries: BetweenTreatmentCheckIn[]): number[] {
  return entries
    .map(
      (entry) =>
        RECOVERY_WINDOWS.find((window) => window.value === entry.recoveryWindow)
          ?.hours ?? null,
    )
    .filter((value): value is number => value !== null);
}

export interface SymptomFrequency {
  symptom: string;
  count: number;
  /** Share of check-ins that mentioned it, 0-100. */
  percent: number;
}

export interface RecoveryTrends {
  /** Mean recovery time in hours across treatment days that gave one. */
  averageRecoveryHours: number | null;
  /** Recent mean minus earlier mean. Negative means recovering faster. */
  recoveryChangeHours: number | null;
  /** Treatment days where recovery never came before the next run. */
  stillNotRecoveredCount: number;

  symptomFrequency: SymptomFrequency[];

  /** Latest weight minus earliest, in whatever unit was typed. */
  weightChange: number | null;
  averageSystolic: number | null;
  averageDiastolic: number | null;
  /** Mean 24-hour urine output in mL, for members still making urine. */
  averageUrineOutputMl: number | null;

  /** Mean energy 1-5 by day type. Null until that side has enough. */
  treatmentDayEnergy: number | null;
  nonTreatmentDayEnergy: number | null;

  /** Share of each day type logged as "rough", 0-100. */
  treatmentDayRoughPercent: number | null;
  nonTreatmentDayRoughPercent: number | null;

  /** True when any figure above is worth rendering. */
  hasAnything: boolean;
}

function roughPercent(entries: BetweenTreatmentCheckIn[]): number | null {
  if (entries.length < MIN_FOR_TREND) return null;
  const rough = entries.filter((entry) => entry.feeling === "rough").length;
  return Math.round((rough / entries.length) * 100);
}

export function analyseTrends(
  entries: BetweenTreatmentCheckIn[],
): RecoveryTrends {
  /* Newest first, so "the recent half" is the front of the list. */
  const byDate = sortByDate(entries);
  const treatmentDays = byDate.filter((entry) => entry.treatmentDay);
  const otherDays = byDate.filter((entry) => !entry.treatmentDay);

  const allHours = recoveryHours(treatmentDays);

  const withHours = treatmentDays.filter(
    (entry) => recoveryHours([entry]).length > 0,
  );
  const half = Math.floor(withHours.length / 2);
  const recentMean =
    half >= MIN_FOR_TREND
      ? mean(recoveryHours(withHours.slice(0, half)))
      : null;
  const earlierMean =
    half >= MIN_FOR_TREND ? mean(recoveryHours(withHours.slice(half))) : null;

  const counts = new Map<string, number>();
  for (const entry of byDate) {
    for (const symptom of entry.symptoms) {
      counts.set(symptom, (counts.get(symptom) ?? 0) + 1);
    }
  }
  const symptomFrequency: SymptomFrequency[] = [...counts.entries()]
    .map(([symptom, count]) => ({
      symptom,
      count,
      percent: Math.round((count / Math.max(1, byDate.length)) * 100),
    }))
    .sort((a, b) => b.count - a.count || a.symptom.localeCompare(b.symptom));

  /* Oldest to newest, so a rise reads as a positive change. */
  const weights = [...byDate]
    .reverse()
    .map((entry) => parseNumber(entry.weight))
    .filter((value): value is number => value !== null);

  const pressures = byDate
    .map((entry) => parseBloodPressure(entry.bloodPressure))
    .filter(
      (value): value is { systolic: number; diastolic: number } =>
        value !== null,
    );

  const urine = byDate
    .map((entry) => parseNumber(entry.urineOutputMl))
    .filter((value): value is number => value !== null);

  const energyOf = (list: BetweenTreatmentCheckIn[]) =>
    list
      .map((entry) => entry.energyLevel)
      .filter((value): value is EnergyLevel => value !== undefined);

  const treatmentEnergy = energyOf(treatmentDays);
  const otherEnergy = energyOf(otherDays);

  const trends: Omit<RecoveryTrends, "hasAnything"> = {
    averageRecoveryHours:
      allHours.length >= MIN_FOR_TREND ? round(mean(allHours)) : null,
    recoveryChangeHours:
      recentMean !== null && earlierMean !== null
        ? round(recentMean - earlierMean)
        : null,
    stillNotRecoveredCount: treatmentDays.filter(
      (entry) => entry.recoveryWindow === "still-not-recovered",
    ).length,

    symptomFrequency,

    weightChange:
      weights.length >= MIN_FOR_TREND
        ? round(weights[weights.length - 1] - weights[0])
        : null,
    averageSystolic:
      pressures.length >= MIN_FOR_TREND
        ? round(mean(pressures.map((entry) => entry.systolic)), 0)
        : null,
    averageDiastolic:
      pressures.length >= MIN_FOR_TREND
        ? round(mean(pressures.map((entry) => entry.diastolic)), 0)
        : null,
    averageUrineOutputMl:
      urine.length >= MIN_FOR_TREND ? round(mean(urine), 0) : null,

    treatmentDayEnergy:
      treatmentEnergy.length >= MIN_FOR_TREND
        ? round(mean(treatmentEnergy))
        : null,
    nonTreatmentDayEnergy:
      otherEnergy.length >= MIN_FOR_TREND ? round(mean(otherEnergy)) : null,

    treatmentDayRoughPercent: roughPercent(treatmentDays),
    nonTreatmentDayRoughPercent: roughPercent(otherDays),
  };

  return {
    ...trends,
    hasAnything:
      trends.averageRecoveryHours !== null ||
      trends.stillNotRecoveredCount > 0 ||
      trends.symptomFrequency.length > 0 ||
      trends.weightChange !== null ||
      trends.averageSystolic !== null ||
      trends.averageUrineOutputMl !== null ||
      trends.treatmentDayEnergy !== null ||
      trends.nonTreatmentDayEnergy !== null,
  };
}
