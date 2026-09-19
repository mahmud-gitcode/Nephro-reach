/* ==========================================================================
   Exercise log — the shapes
   --------------------------------------------------------------------------
   A note of what the member did, how much, how hard it felt and how they
   felt afterwards. Calories are never stored: they are a rough estimate
   derived from duration and intensity, recomputed on read, so a change to
   the estimate never rewrites what the member actually logged.
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

/** How hard it felt. Drives the calorie estimate. */
export type ExerciseIntensity = "light" | "moderate" | "vigorous";

/** How the member felt during or after it. Never required. */
export type ExerciseFeeling = "good" | "okay" | "tired" | "unwell";

export interface ExerciseEntry {
  id: string;
  /** `yyyy-mm-dd` in the member's timezone. */
  date: string;
  activity: ExerciseActivity;
  /** Only read when `activity` is `other`. */
  customName: string;
  amount: number;
  unit: ExerciseUnit;
  intensity: ExerciseIntensity;
  /** `null` when the member skipped the question. */
  feeling: ExerciseFeeling | null;
  note: string;
  savedAt: string;
}

export type ExerciseDraft = Omit<ExerciseEntry, "id" | "date" | "savedAt">;
