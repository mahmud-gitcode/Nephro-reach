import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import type { ExerciseEntry } from "./exercise.types";

/* ==========================================================================
   Exercise log — storage
   --------------------------------------------------------------------------
   No seed: a workout the member never did has no place in their log.
   ========================================================================== */

const KEY = storageKey("exercise-log");

export async function listExercise(): Promise<ExerciseEntry[]> {
  const stored = await readJson<ExerciseEntry[] | null>(KEY, null);
  return Array.isArray(stored) ? stored : [];
}

export async function saveExercise(
  entries: ExerciseEntry[],
): Promise<ExerciseEntry[]> {
  return writeJson(KEY, entries);
}
