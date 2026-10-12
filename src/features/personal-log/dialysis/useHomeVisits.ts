"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listHomeVisits, saveHomeVisits } from "./homeVisits.repository";
import {
  nextVisit,
  removeVisit,
  sortVisits,
  upsertVisit,
  visitsFor,
  type HomeVisit,
  type HomeVisitDraft,
  type HomeVisitModality,
} from "./homeVisits";

const VISITS_KEY = ["dialysis-home-visits"];
const NO_VISITS: HomeVisit[] = [];

/** Today as yyyy-mm-dd in the member's own timezone, not UTC. */
function todayIso(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** The member's home visits; with a modality, only that modality's. */
export function useHomeVisits(modality?: HomeVisitModality) {
  const queryClient = useQueryClient();

  const visitsQuery = useQuery({
    queryKey: VISITS_KEY,
    queryFn: listHomeVisits,
  });

  const write = useMutation({
    mutationFn: async (transform: (current: HomeVisit[]) => HomeVisit[]) =>
      saveHomeVisits(transform(await listHomeVisits())),
    onSuccess: (visits) => queryClient.setQueryData(VISITS_KEY, visits),
  });

  const all = visitsQuery.data ?? NO_VISITS;
  const visits = useMemo(
    () => (modality ? visitsFor(all, modality) : all),
    [all, modality],
  );
  const { mutate } = write;
  const today = todayIso();

  const save = useCallback(
    (draft: HomeVisitDraft, editId?: string) => {
      const visit: HomeVisit = {
        ...draft,
        ...(modality ? { modality } : {}),
        id:
          editId ??
          `visit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      };
      mutate((current) => upsertVisit(current, visit));
    },
    [mutate, modality],
  );

  return {
    visits,
    /** Soonest first among what is ahead, then the past. */
    ordered: useMemo(() => sortVisits(visits, today), [visits, today]),
    next: useMemo(() => nextVisit(visits, today), [visits, today]),
    today,

    save,
    remove: useCallback(
      (id: string) => mutate((current) => removeVisit(current, id)),
      [mutate],
    ),

    isPending: visitsQuery.isPending,
    error: visitsQuery.error,
    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
    refetch: () => void visitsQuery.refetch(),
  };
}

export type HomeVisitsLog = ReturnType<typeof useHomeVisits>;
