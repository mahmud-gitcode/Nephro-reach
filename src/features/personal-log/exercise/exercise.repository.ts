import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import type {
  ExerciseEntry,
  ExerciseFeeling,
  ExerciseIntensity,
} from "./exercise.types";

/* ==========================================================================
   Exercise log — storage
   --------------------------------------------------------------------------
   No seed: a workout the member never did has no place in their log.
   ========================================================================== */

const KEY = storageKey("exercise-log");

const INTENSITIES: ExerciseIntensity[] = ["light", "moderate", "vigorous"];
const FEELINGS: ExerciseFeeling[] = ["good", "okay", "tired", "unwell"];

/* Intensity and feeling were added after the first members had already
   logged activity, so anything saved before then comes back without them.
   Read as the gentlest reading — light, and no feeling claimed — rather
   than dropping the entry or inventing how someone felt. */
function normalize(entry: ExerciseEntry): ExerciseEntry {
  return {
    ...entry,
    intensity: INTENSITIES.includes(entry.intensity)
      ? entry.intensity
      : "light",
    feeling:
      entry.feeling && FEELINGS.includes(entry.feeling) ? entry.feeling : null,
  };
}

export async function listExercise(): Promise<ExerciseEntry[]> {
  const stored = await readJson<ExerciseEntry[] | null>(KEY, null);
  return Array.isArray(stored) ? stored.map(normalize) : [];
}

export async function saveExercise(
  entries: ExerciseEntry[],
): Promise<ExerciseEntry[]> {
  return writeJson(KEY, entries);
}
