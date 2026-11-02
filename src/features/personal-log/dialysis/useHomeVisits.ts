"use client";

/* ==========================================================================
   Home visits, from the API (Phase 7)
   --------------------------------------------------------------------------
   `/patients/:id/dialysis/home-visits`, up to 150 a page with "load more".
   With a modality, the server returns that modality's visits plus the ones
   saved without one (they show under both, as before). One call per add,
   edit or delete.
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { usePagedList } from "@/features/profile/usePagedList";
import {
  nextVisit,
  sortVisits,
  type HomeVisitDraft,
  type HomeVisitModality,
} from "./homeVisits";
import { fromApiHomeVisit, toHomeVisitBody } from "./homeDialysis.mapper";
import {
  createHomeVisit,
  listHomeVisits,
  removeHomeVisit,
  updateHomeVisit,
} from "./homeDialysis.repository";

export const HOME_VISITS_FEATURE = "dialysis-home-visits";

/** Today as yyyy-mm-dd in the member's own timezone, not UTC. */
function todayIso(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** The member's home visits; with a modality, only that modality's. */
export function useHomeVisits(
  modality?: HomeVisitModality,
  explicitScope?: PatientScope | null,
) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();

  const list = usePagedList({
    scope,
    queryKey: scopedKey(scope, HOME_VISITS_FEATURE, "list", modality ?? "all"),
    params: { limit: 150 },
    fetch: (target, params) =>
      listHomeVisits(target, { ...params, ...(modality ? { modality } : {}) }),
    map: fromApiHomeVisit,
  });

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: scopedKey(scope, HOME_VISITS_FEATURE),
    });

  const write = useMutation({
    mutationFn: ({
      draft,
      editId,
    }: {
      draft: HomeVisitDraft;
      editId?: string;
    }) => {
      const target = requireScope(scope);
      const body = toHomeVisitBody({
        ...draft,
        ...(modality ? { modality } : {}),
      });
      return editId
        ? updateHomeVisit(target, editId, body)
        : createHomeVisit(target, body);
    },
    onSuccess: refresh,
  });
  const drop = useMutation({
    mutationFn: (id: string) => removeHomeVisit(requireScope(scope), id),
    onSuccess: refresh,
  });

  const visits = list.items;
  const today = todayIso();
  const { mutate } = write;
  const { mutate: dropMutate } = drop;

  return {
    visits,
    /** Soonest first among what is ahead, then the past. */
    ordered: useMemo(() => sortVisits(visits, today), [visits, today]),
    next: useMemo(() => nextVisit(visits, today), [visits, today]),
    today,
    hasMore: list.hasMore,
    loadMore: list.loadMore,

    /** Saves one visit; `onSaved` runs once the server has it. */
    save: useCallback(
      (draft: HomeVisitDraft, editId?: string, onSaved?: () => void) =>
        mutate({ draft, editId }, { onSuccess: () => onSaved?.() }),
      [mutate],
    ),
    remove: useCallback((id: string) => dropMutate(id), [dropMutate]),

    isPending: list.isPending,
    error: list.error,
    isError: list.isError,
    isSaving: write.isPending || drop.isPending,
    saveError: write.error ?? drop.error,
    dismissSaveError: () => {
      write.reset();
      drop.reset();
    },
    refetch: list.refetch,
  };
}

export type HomeVisitsLog = ReturnType<typeof useHomeVisits>;
