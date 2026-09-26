"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupplyMonth, saveSupplyMonth } from "./supplies.repository";
import {
  emptyMonth,
  monthKeyOf,
  summarise,
  type SupplyCount,
  type SupplyMonth,
} from "./supplies";
import type { DialysisModality } from "./modality";

/* ==========================================================================
   The supply checklist for one month
   --------------------------------------------------------------------------
   The month is state here rather than in the page, because changing month
   changes what is read; keeping the two together means there is no window
   where the heading says March and the rows still say February.
   ========================================================================== */

export function useSupplyChecklist(modality: DialysisModality) {
  const queryClient = useQueryClient();
  const [monthKey, setMonthKey] = useState(() => monthKeyOf(new Date()));

  const key = useMemo(() => ["dialysis-supplies", monthKey], [monthKey]);

  const monthQuery = useQuery({
    queryKey: key,
    queryFn: () => getSupplyMonth(monthKey),
  });

  const write = useMutation({
    mutationFn: (next: SupplyMonth) => saveSupplyMonth(next),
    onSuccess: (next) => queryClient.setQueryData(key, next),
  });

  const month = monthQuery.data ?? emptyMonth(monthKey);
  const { mutate } = write;

  const save = useCallback(
    (patch: Partial<Omit<SupplyMonth, "monthKey" | "updatedAt">>) =>
      mutate({
        ...month,
        ...patch,
        monthKey,
        updatedAt: new Date().toISOString(),
      }),
    [mutate, month, monthKey],
  );

  /** Change one line without disturbing the rest of the month. */
  const setCount = useCallback(
    (itemId: string, patch: Partial<SupplyCount>) => {
      const current = month.counts[itemId] ?? {
        have: 0,
        needed: undefined,
        checked: false,
      };
      save({ counts: { ...month.counts, [itemId]: { ...current, ...patch } } });
    },
    [month.counts, save],
  );

  return {
    monthKey,
    setMonthKey,
    month,
    counts: month.counts,
    setCount,
    setNotes: useCallback((notes: string) => save({ notes }), [save]),
    summary: useMemo(
      () => summarise(modality, month.counts),
      [modality, month.counts],
    ),

    isPending: monthQuery.isPending,
    error: monthQuery.error,
    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
    refetch: () => void monthQuery.refetch(),
  };
}

export type SupplyChecklistLog = ReturnType<typeof useSupplyChecklist>;
