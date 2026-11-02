"use client";

/* ==========================================================================
   Extra (unscheduled) treatments, from the API (Phase 7)
   --------------------------------------------------------------------------
   Page state until now (with one invented sample session). A window of
   days around today (a year back, two months ahead), add and remove; the
   server has no edit. Whether the member may add one follows the
   prescription's `memberCanEdit`, decided on the server.
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toDay } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { usePagedList } from "@/features/profile/usePagedList";
import { fromApiExtraTreatment, toExtraTreatmentBody } from "./extraTreatments";
import {
  createExtraTreatment,
  listExtraTreatments,
  removeExtraTreatment,
} from "./dialysis.repository";

export const EXTRA_TREATMENTS_FEATURE = "dialysis-extra-treatments";

/** A year back and two months ahead of `today`. */
export function extraTreatmentWindow(today: Date = new Date()) {
  const from = new Date(today);
  from.setFullYear(from.getFullYear() - 1);
  const to = new Date(today);
  to.setMonth(to.getMonth() + 2);
  return { from: toDay(from), to: toDay(to) };
}

export function useExtraTreatments(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const range = useMemo(() => extraTreatmentWindow(), []);

  const list = usePagedList({
    scope,
    queryKey: scopedKey(scope, EXTRA_TREATMENTS_FEATURE, "list", range),
    params: { ...range, limit: 150 },
    fetch: listExtraTreatments,
    map: fromApiExtraTreatment,
  });

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: scopedKey(scope, EXTRA_TREATMENTS_FEATURE),
    });

  const create = useMutation({
    mutationFn: (draft: { dateKey: string; reason: string; notes?: string }) =>
      createExtraTreatment(requireScope(scope), toExtraTreatmentBody(draft)),
    onSuccess: refresh,
  });
  const drop = useMutation({
    mutationFn: (id: string) => removeExtraTreatment(requireScope(scope), id),
    onSuccess: refresh,
  });

  const extras = useMemo(
    () => [...list.items].sort((a, b) => a.dateKey.localeCompare(b.dateKey)),
    [list.items],
  );
  const { mutateAsync: createAsync } = create;
  const { mutate: dropMutate } = drop;

  return {
    extras,
    isPending: list.isPending,
    error: list.error,
    isError: list.isError,
    refetch: list.refetch,
    hasMore: list.hasMore,
    loadMore: list.loadMore,
    isSaving: create.isPending || drop.isPending,
    saveError: create.error ?? drop.error,
    dismissSaveError: () => {
      create.reset();
      drop.reset();
    },
    add: useCallback(
      (draft: { dateKey: string; reason: string; notes?: string }) =>
        createAsync(draft),
      [createAsync],
    ),
    remove: useCallback((id: string) => dropMutate(id), [dropMutate]),
  };
}
