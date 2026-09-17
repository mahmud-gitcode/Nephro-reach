/* ==========================================================================
   Exercise log — the shapes
   --------------------------------------------------------------------------
   A note of what the member did and how much, nothing more: no calorie
   maths, no targets. "2,000 steps", "10 push-ups".
   ========================================================================== */

export type ExerciseUnit = "steps" | "reps" | "minutes" | "km" | "miles";

/** A preset from the activity list, or `other` with a name typed in. */
export type ExerciseActivity =
  | "walking"
  | "push-ups"
  | "sit-ups"
  | "squats"
  | "stretching"
  | "cycling"
  | "chair-exercises"
  | "yoga"
  | "swimming"
  | "other";

export interface ExerciseEntry {
  id: string;
  /** `yyyy-mm-dd` in the member's timezone. */
  date: string;
  activity: ExerciseActivity;
  /** Only read when `activity` is `other`. */
  customName: string;
  amount: number;
  unit: ExerciseUnit;
  note: string;
  savedAt: string;
}

export type ExerciseDraft = Omit<ExerciseEntry, "id" | "date" | "savedAt">;
