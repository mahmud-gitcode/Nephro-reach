"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import {
  createExercise,
  fromApiExercise,
  listExerciseOn,
  removeExercise,
  toExerciseBody,
  updateExercise,
} from "./exercise.repository";
import * as rules from "./exercise.rules";
import type { ExerciseDraft, ExerciseEntry } from "./exercise.types";

const NO_ENTRIES: ExerciseEntry[] = [];

/**
 * The member's exercise notes for one day, from the API (Phase 5). Each
 * row of the form is its own call: the first row edits the note being
 * edited, any further rows are added beside it, on the day being viewed.
 */
export function useExerciseLog(
  date: string,
  explicitScope?: PatientScope | null,
) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const featureKey = scopedKey(scope, "exercise");
  const queryKey = scopedKey(scope, "exercise", "day", date);

  const query = useQuery({
    queryKey,
    queryFn: async () =>
      (await listExerciseOn(requireScope(scope), date)).items.map(
        fromApiExercise,
      ),
  });

  const write = useMutation({
    mutationFn: async ({
      drafts,
      editId,
    }: {
      drafts: ExerciseDraft[];
      editId?: string;
    }) => {
      const target = requireScope(scope);
      for (const [index, draft] of drafts.entries()) {
        if (index === 0 && editId) {
          const { entryDate: _day, ...body } = toExerciseBody(draft, date);
          void _day;
          await updateExercise(target, editId, body);
        } else {
          await createExercise(target, toExerciseBody(draft, date));
        }
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: featureKey }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeExercise(requireScope(scope), id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: featureKey }),
  });

  const { mutate, reset } = write;
  const { mutate: mutateRemove } = remove;
  const all = query.data ?? NO_ENTRIES;
  const entries = useMemo(() => rules.entriesOn(all, date), [all, date]);

  const saveEntries = useCallback(
    (drafts: ExerciseDraft[], editId?: string, onSaved?: () => void) =>
      mutate({ drafts, editId }, { onSuccess: () => onSaved?.() }),
    [mutate],
  );

  const deleteEntry = useCallback(
    (id: string) => mutateRemove(id),
    [mutateRemove],
  );

  return {
    entries,
    saveEntries,
    deleteEntry,

    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    saveError: write.error ?? remove.error,
    dismissSaveError: () => {
      reset();
      remove.reset();
    },
    isSaving: write.isPending || remove.isPending,
  };
}
