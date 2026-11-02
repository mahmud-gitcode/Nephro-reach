"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { getSupplyMonth, saveSupplyMonth } from "./homeDialysis.repository";
import { fromApiSupplyMonth, toSupplyMonthBody } from "./homeDialysis.mapper";
import {
  emptyMonth,
  monthKeyOf,
  summarise,
  type SupplyCount,
  type SupplyMonth,
} from "./supplies";
import type { DialysisModality } from "./modality";

/* ==========================================================================
   The supply checklist for one month, from the API (Phase 7)
   --------------------------------------------------------------------------
   `GET /patients/:id/dialysis/supplies/{yyyy-mm}` (null = nothing counted
   yet) and `PUT` the month whole: the month is the record. Ticks come
   quickly, so each change is shown at once (optimistic) and every PUT is
   built from the latest shown month; a refused PUT puts the month back as
   the server last had it and the error is shown.

   The month is state here rather than in the page, because changing month
   changes what is read.
   ========================================================================== */

export const SUPPLIES_FEATURE = "dialysis-supplies";

export function useSupplyChecklist(
  modality: DialysisModality,
  explicitScope?: PatientScope | null,
) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const [monthKey, setMonthKey] = useState(() => monthKeyOf(new Date()));

  const key = useMemo(
    () => scopedKey(scope, SUPPLIES_FEATURE, monthKey),
    [scope, monthKey],
  );

  const monthQuery = useQuery({
    queryKey: key,
    queryFn: async () => {
      const raw = await getSupplyMonth(requireScope(scope), monthKey);
      return raw ? fromApiSupplyMonth(raw) : emptyMonth(monthKey);
    },
  });

  const write = useMutation({
    /* One PUT at a time, in order: the last change shown is the last saved. */
    scope: { id: "dialysis-supplies" },
    mutationFn: ({ next }: { next: SupplyMonth; previous?: SupplyMonth }) =>
      saveSupplyMonth(
        requireScope(scope),
        next.monthKey,
        toSupplyMonthBody(next),
      ),
    onError: (_error, { previous }) => {
      if (previous) queryClient.setQueryData(key, previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const month = monthQuery.data ?? emptyMonth(monthKey);
  const { mutate } = write;

  const save = useCallback(
    (patch: Partial<Omit<SupplyMonth, "monthKey" | "updatedAt">>) => {
      /* The latest shown month, so two quick ticks never undo each other. */
      const current = queryClient.getQueryData<SupplyMonth>(key) ?? month;
      const next = { ...current, ...patch, monthKey };
      /* Shown at once (synchronously), so the next tick builds on it. */
      queryClient.setQueryData(key, next);
      mutate({ next, previous: current });
    },
    [mutate, month, monthKey, queryClient, key],
  );

  /** Change one line without disturbing the rest of the month. */
  const setCount = useCallback(
    (itemId: string, patch: Partial<SupplyCount>) => {
      const counts = (queryClient.getQueryData<SupplyMonth>(key) ?? month)
        .counts;
      const current = counts[itemId] ?? {
        have: 0,
        needed: undefined,
        checked: false,
      };
      save({ counts: { ...counts, [itemId]: { ...current, ...patch } } });
    },
    [month, save, queryClient, key],
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
    isError: monthQuery.isError,
    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
    refetch: () => void monthQuery.refetch(),
  };
}

export type SupplyChecklistLog = ReturnType<typeof useSupplyChecklist>;
