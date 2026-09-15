"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listCheckIns, saveCheckIns } from "./checkIn.repository";
import * as rules from "./checkIn.rules";
import type { BetweenTreatmentCheckIn } from "./checkIn.types";

export const checkInsKey = ["personal-log", "between-treatment"] as const;

/**
 * Every between-treatment check-in the member has written.
 *
 * Writes are read-modify-write against storage rather than the cache, so a
 * save applies to what is actually stored. With a real API each transform
 * becomes the request body and this hook does not change.
 */
export function useCheckIns() {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: checkInsKey, queryFn: listCheckIns });

  const write = useMutation({
    mutationFn: async (
      transform: (
        current: BetweenTreatmentCheckIn[],
      ) => BetweenTreatmentCheckIn[],
    ) => saveCheckIns(transform(await listCheckIns())),
    onSuccess: (entries) => queryClient.setQueryData(checkInsKey, entries),
  });

  const { mutate, reset } = write;
  /* `?? []` inline would hand out a new array every render and re-run every
     summary derived from it. */
  const entries = useMemo(() => query.data ?? [], [query.data]);

  const saveCheckIn = useCallback(
    (entry: BetweenTreatmentCheckIn) =>
      mutate((current) => rules.upsertCheckIn(current, entry)),
    [mutate],
  );

  const deleteCheckIn = useCallback(
    (date: string) => mutate((current) => rules.removeCheckIn(current, date)),
    [mutate],
  );

  const getByDate = useCallback(
    (date: string) => rules.findByDate(entries, date),
    [entries],
  );

  return {
    entries: useMemo(() => rules.sortByDate(entries), [entries]),
    summary: useMemo(() => rules.summarise(entries), [entries]),
    recentDays: useMemo(() => rules.recentDays(entries), [entries]),

    getByDate,
    saveCheckIn,
    deleteCheckIn,

    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    /* A check-in that failed to save is worth surfacing: the member has
       just described feeling unwell and would otherwise assume it landed. */
    saveError: write.error,
    dismissSaveError: reset,
    isSaving: write.isPending,
  };
}
