/* ==========================================================================
   Exercise log <-> the API (Phase 5): `/patients/:id/exercise`
   --------------------------------------------------------------------------
   One call per server operation (ADR 0007 §1). The enums are the API's
   own; only the day (`entryDate`) and the save time (`createdAt`) are
   renamed. No seed: a workout the member never did has no place in their
   log.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import { patientPath } from "@/features/profile/patientScope";
import type {
  ExerciseActivity,
  ExerciseDraft,
  ExerciseEntry,
  ExerciseFeeling,
  ExerciseIntensity,
  ExerciseUnit,
} from "./exercise.types";

export type ApiExerciseEntry = {
  id: string;
  patientId: string;
  entryDate: string;
  activity: ExerciseActivity;
  customName: string;
  amount: number;
  unit: ExerciseUnit;
  intensity: ExerciseIntensity;
  feeling: ExerciseFeeling | null;
  note: string;
  estimatedCalories: number;
  createdAt: string;
  updatedAt: string;
};

export type ExerciseBody = {
  entryDate: string;
  activity: ExerciseActivity;
  customName?: string;
  amount: number;
  unit: ExerciseUnit;
  intensity: ExerciseIntensity;
  feeling: ExerciseFeeling | null;
  note: string;
};

export function fromApiExercise(row: ApiExerciseEntry): ExerciseEntry {
  return {
    id: row.id,
    date: row.entryDate,
    activity: row.activity,
    customName: row.customName ?? "",
    amount: row.amount,
    unit: row.unit,
    intensity: row.intensity,
    feeling: row.feeling ?? null,
    note: row.note ?? "",
    savedAt: row.createdAt,
  };
}

export function toExerciseBody(
  draft: ExerciseDraft,
  entryDate: string,
): ExerciseBody {
  const customName =
    draft.activity === "other" ? draft.customName.trim() : undefined;
  return {
    entryDate,
    activity: draft.activity,
    ...(customName ? { customName } : {}),
    amount: draft.amount,
    unit: draft.unit,
    intensity: draft.intensity,
    feeling: draft.feeling ?? null,
    note: draft.note.trim(),
  };
}

const base = (scope: PatientScope) => patientPath(scope, "/exercise");

/** One day's notes (a day holds a handful; one full page). */
export const listExerciseOn = (scope: PatientScope, day: string) =>
  fetchPage<ApiExerciseEntry>(base(scope), { from: day, to: day, limit: 150 });

export const createExercise = (scope: PatientScope, body: ExerciseBody) =>
  api<ApiExerciseEntry>(base(scope), { method: "POST", body });

export const updateExercise = (
  scope: PatientScope,
  id: string,
  body: Partial<ExerciseBody>,
) =>
  api<ApiExerciseEntry>(`${base(scope)}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });

export const removeExercise = (scope: PatientScope, id: string) =>
  api<unknown>(`${base(scope)}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
