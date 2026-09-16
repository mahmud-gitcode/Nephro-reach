import { todayIso } from "./trip.rules";
import type { TripRequest } from "./trip.types";
import type { TravelTreatment } from "./travelTreatment.types";
import { REFLECTION_MAX } from "./travelTreatment.types";

/* ==========================================================================
   Travel treatment log — pure rules
   --------------------------------------------------------------------------
   Dates stay `yyyy-mm-dd` strings for the reason set out in trip.rules: a
   treatment happened on a calendar day, not at a UTC instant, and parsing
   one with `new Date()` west of Greenwich files it under the day before.
   ========================================================================== */

export function emptyTreatment(
  tripId: string,
  facilityName = "",
  now = new Date(),
): TravelTreatment {
  return {
    id: `tx-${Date.now().toString(36)}`,
    tripId,
    date: todayIso(now),
    /* Pre-filled from the placement: on a three-treatment trip the member
       would otherwise type the same unfamiliar facility name three times. */
    facilityName,
    completed: true,
    notes: "",
    savedAt: now.toISOString(),
  };
}

/** A date is required, and nobody can log a treatment that has not happened. */
export function treatmentError(
  treatment: TravelTreatment,
  now = new Date(),
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(treatment.date)) return "invalid-date";
  if (treatment.date > todayIso(now)) return "future-date";
  return null;
}

export function canSaveTreatment(
  treatment: TravelTreatment,
  now = new Date(),
): boolean {
  return treatmentError(treatment, now) === null;
}

/** Newest first, which is the order a member scans for "what just happened". */
export function sortTreatments(
  treatments: TravelTreatment[],
): TravelTreatment[] {
  return [...treatments].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || b.savedAt.localeCompare(a.savedAt),
  );
}

export function treatmentsForTrip(
  treatments: TravelTreatment[],
  tripId: string,
): TravelTreatment[] {
  return sortTreatments(
    treatments.filter((treatment) => treatment.tripId === tripId),
  );
}

/** One entry per id: re-saving edits rather than stacking a duplicate row. */
export function upsertTreatment(
  treatments: TravelTreatment[],
  treatment: TravelTreatment,
): TravelTreatment[] {
  const index = treatments.findIndex((current) => current.id === treatment.id);
  if (index === -1) return sortTreatments([treatment, ...treatments]);

  const next = [...treatments];
  next[index] = treatment;
  return sortTreatments(next);
}

export function removeTreatment(
  treatments: TravelTreatment[],
  id: string,
): TravelTreatment[] {
  return treatments.filter((treatment) => treatment.id !== id);
}

/** A trip that is deleted takes its treatment log with it. */
export function removeTreatmentsForTrip(
  treatments: TravelTreatment[],
  tripId: string,
): TravelTreatment[] {
  return treatments.filter((treatment) => treatment.tripId !== tripId);
}

/* ==========================================================================
   What the summary row reads from
   ========================================================================== */

export interface TreatmentProgress {
  /** Treatments the member has logged on this trip. */
  logged: number;
  /** What the request said they would need. */
  expected: number;
  /** Logged and finished. */
  completed: number;
  /** Logged but cut short — the number the team back home cares about. */
  incomplete: number;
}

export function treatmentProgress(
  treatments: TravelTreatment[],
  trip: TripRequest,
): TreatmentProgress {
  const mine = treatmentsForTrip(treatments, trip.id);
  const completed = mine.filter((treatment) => treatment.completed).length;

  return {
    logged: mine.length,
    /* The placement is what was actually booked, so it beats the member's
       original estimate once the facility has confirmed. */
    expected: trip.placement?.treatments.length || trip.treatmentsNeeded,
    completed,
    incomplete: mine.length - completed,
  };
}

/* ==========================================================================
   Reflections
   ========================================================================== */

/** Clipped rather than rejected: losing what someone wrote is worse. */
export function clipReflection(body: string): string {
  return body.slice(0, REFLECTION_MAX);
}

export function reflectionRemaining(body: string): number {
  return REFLECTION_MAX - body.length;
}
