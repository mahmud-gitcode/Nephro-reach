import { JOURNEY_DAYS, TOTAL_JOURNEY_DAYS } from "./dialysisJourneyData";
import type { JourneyDayProgress, JourneyProgressMap } from "./journey.types";

/* ==========================================================================
   The 21-day journey — the rules
   --------------------------------------------------------------------------
   Pure functions, map in and map out. They were previously the bodies of six
   setState updaters inside the hook, where they could not be tested without
   rendering a component and could not be reused by the repository.

   Every one takes `now`, so the tests are not at the mercy of the clock.
   ========================================================================== */

export const EMPTY_PROGRESS: JourneyDayProgress = {
  status: "not-started",
  percent: 0,
  updatedAt: "",
};

export const dayProgress = (
  progress: JourneyProgressMap,
  slug: string,
): JourneyDayProgress => progress[slug] ?? EMPTY_PROGRESS;

const stamp = (now: Date) => now.toISOString();

export function patchDay(
  progress: JourneyProgressMap,
  slug: string,
  patch: Partial<JourneyDayProgress>,
  now = new Date(),
): JourneyProgressMap {
  return {
    ...progress,
    [slug]: { ...dayProgress(progress, slug), ...patch, updatedAt: stamp(now) },
  };
}

/** Opening a day starts it, but re-opening a finished day does not reset it. */
export function unlockDay(
  progress: JourneyProgressMap,
  slug: string,
  now = new Date(),
): JourneyProgressMap {
  if (dayProgress(progress, slug).status !== "not-started") return progress;
  return patchDay(progress, slug, { status: "in-progress" }, now);
}

/** Finishing a day also opens the next one, so the learner can go on. */
export function markComplete(
  progress: JourneyProgressMap,
  slug: string,
  now = new Date(),
): JourneyProgressMap {
  let next = patchDay(
    progress,
    slug,
    { status: "completed", percent: 100 },
    now,
  );

  const index = JOURNEY_DAYS.findIndex((day) => day.slug === slug);
  if (index >= 0 && index < JOURNEY_DAYS.length - 1) {
    next = unlockDay(next, JOURNEY_DAYS[index + 1].slug, now);
  }
  return next;
}

export function markIncomplete(
  progress: JourneyProgressMap,
  slug: string,
  now = new Date(),
): JourneyProgressMap {
  return patchDay(progress, slug, { status: "in-progress", percent: 0 }, now);
}

/**
 * Raises the watched percentage, and never lowers it: a member who rewatches
 * the first minute of a lesson they nearly finished has not un-watched it.
 * 95% counts as finished — video players rarely report the last few frames.
 */
export function recordWatched(
  progress: JourneyProgressMap,
  slug: string,
  percent: number,
  now = new Date(),
): JourneyProgressMap {
  const capped = Math.max(0, Math.min(100, Math.round(percent)));
  const existing = dayProgress(progress, slug);
  if (existing.status === "completed" || capped <= existing.percent) {
    return progress;
  }
  return patchDay(
    progress,
    slug,
    { status: capped >= 95 ? "completed" : "in-progress", percent: capped },
    now,
  );
}

export const completedCount = (progress: JourneyProgressMap) =>
  JOURNEY_DAYS.filter((day) => progress[day.slug]?.status === "completed")
    .length;

export const overallPercent = (progress: JourneyProgressMap) =>
  Math.round((completedCount(progress) / TOTAL_JOURNEY_DAYS) * 100);

/** The first day not yet finished — what the "continue" button points at. */
export const nextDay = (progress: JourneyProgressMap) =>
  JOURNEY_DAYS.find((day) => progress[day.slug]?.status !== "completed") ??
  JOURNEY_DAYS[JOURNEY_DAYS.length - 1];

export const hasStarted = (progress: JourneyProgressMap) =>
  JOURNEY_DAYS.some((day) => progress[day.slug]?.status);
