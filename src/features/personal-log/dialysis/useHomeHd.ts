"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getHomeSystem,
  getTreatmentVitals,
  saveHomeSystem,
  saveTreatmentVitals,
} from "./homeHd.repository";
import {
  DEFAULT_SYSTEM,
  emptyVitals,
  fluidRemovedL,
  needsAttention,
  systemChecks,
  type HomeSystem,
  type TreatmentVitals,
} from "./homeHd";

const SYSTEM_KEY = ["dialysis-home-system"];

/** Today as yyyy-mm-dd in the member's own timezone, not UTC. */
function todayIso(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** The machine and its water, plus where its two dated jobs stand. */
export function useHomeSystem() {
  const queryClient = useQueryClient();
  const today = todayIso();

  const systemQuery = useQuery({
    queryKey: SYSTEM_KEY,
    queryFn: getHomeSystem,
  });

  const write = useMutation({
    mutationFn: (next: HomeSystem) => saveHomeSystem(next),
    onSuccess: (next) => queryClient.setQueryData(SYSTEM_KEY, next),
  });

  const system = systemQuery.data ?? DEFAULT_SYSTEM;
  const { mutate } = write;

  return {
    system,
    today,
    checks: useMemo(() => systemChecks(system, today), [system, today]),
    needsAttention: useMemo(
      () => needsAttention(system, today),
      [system, today],
    ),

    save: useCallback(
      (patch: Partial<Omit<HomeSystem, "updatedAt">>) =>
        mutate({ ...system, ...patch, updatedAt: new Date().toISOString() }),
      [mutate, system],
    ),

    isPending: systemQuery.isPending,
    error: systemQuery.error,
    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
  };
}

/** One session's observations, for the day being looked at. */
export function useTreatmentVitals(date: string) {
  const queryClient = useQueryClient();
  const key = useMemo(() => ["dialysis-treatment-vitals", date], [date]);

  const vitalsQuery = useQuery({
    queryKey: key,
    queryFn: () => getTreatmentVitals(date),
  });

  const write = useMutation({
    mutationFn: (next: TreatmentVitals) => saveTreatmentVitals(next),
    onSuccess: (next) => queryClient.setQueryData(key, next),
  });

  const vitals = vitalsQuery.data ?? emptyVitals(date);
  const { mutate } = write;

  return {
    vitals,
    /** Litres off, from the weight either side. Null until both are in. */
    fluidRemovedL: useMemo(() => fluidRemovedL(vitals), [vitals]),

    save: useCallback(
      (patch: Partial<Omit<TreatmentVitals, "date" | "updatedAt">>) =>
        mutate({
          ...vitals,
          ...patch,
          date,
          updatedAt: new Date().toISOString(),
        }),
      [mutate, vitals, date],
    ),

    isPending: vitalsQuery.isPending,
    error: vitalsQuery.error,
    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
  };
}
