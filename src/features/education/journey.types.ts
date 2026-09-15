/* ==========================================================================
   The 21-day journey — the shape of a member's progress
   --------------------------------------------------------------------------
   Progress is a map keyed by day slug rather than an array, because the day
   list is content (it can grow, reorder, be translated) and a member's
   progress must survive that. An index would not.
   ========================================================================== */

export type JourneyDayStatus = "not-started" | "in-progress" | "completed";

export interface JourneyDayProgress {
  status: JourneyDayStatus;
  /** 0-100. How far through the lesson video the learner reached. */
  percent: number;
  updatedAt: string;
}

export type JourneyProgressMap = Record<string, JourneyDayProgress>;

/** One note per journey day, keyed the same way. */
export type JourneyNotesMap = Record<string, string>;
