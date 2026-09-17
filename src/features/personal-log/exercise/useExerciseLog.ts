"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listExercise, saveExercise } from "./exercise.repository";
import * as rules from "./exercise.rules";
import type { ExerciseDraft, ExerciseEntry } from "./exercise.types";

export const exerciseKey = ["personal-log", "exercise"] as const;

const NO_ENTRIES: ExerciseEntry[] = [];

/**
 * The member's exercise notes for one day. Same read-modify-write shape as
 * `useCheckIns`, so a save applies to what is actually stored.
 */
export function useExerciseLog(date: string) {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: exerciseKey, queryFn: listExercise });

  const write = useMutation({
    mutationFn: async (
      transform: (current: ExerciseEntry[]) => ExerciseEntry[],
    ) => saveExercise(transform(await listExercise())),
    onSuccess: (entries) => queryClient.setQueryData(exerciseKey, entries),
  });

  const { mutate, reset } = write;
  const all = query.data ?? NO_ENTRIES;
  const entries = useMemo(() => rules.entriesOn(all, date), [all, date]);

  /* Saves every row of the form in one write. With `editId`, the first row
     edits that note and any further rows are added beside it. The day comes
     from the hook, so new notes land on the day being viewed. */
  const saveEntries = useCallback(
    (drafts: ExerciseDraft[], editId?: string) => {
      const existing = editId
        ? all.find((entry) => entry.id === editId)
        : undefined;
      const now = Date.now();
      const toSave: ExerciseEntry[] = drafts.map((draft, index) => {
        const target = index === 0 ? existing : undefined;
        return {
          ...draft,
          customName: draft.activity === "other" ? draft.customName.trim() : "",
          note: draft.note.trim(),
          id:
            target?.id ??
            `exercise-${now}-${index}-${Math.random().toString(36).slice(2, 7)}`,
          date: target?.date ?? existing?.date ?? date,
          /* Offset by the row index so the list keeps the order typed. */
          savedAt: target?.savedAt ?? new Date(now + index).toISOString(),
        };
      });
      mutate((current) => toSave.reduce(rules.upsertEntry, current));
    },
    [mutate, all, date],
  );

  const deleteEntry = useCallback(
    (id: string) => mutate((current) => rules.removeEntry(current, id)),
    [mutate],
  );

  return {
    entries,
    saveEntries,
    deleteEntry,

    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    saveError: write.error,
    dismissSaveError: reset,
    isSaving: write.isPending,
  };
}
