"use client";

/* ==========================================================================
   The member's weight and fluid log, from the API (Phase 5)
   --------------------------------------------------------------------------
   One entry per day (`PUT …/weight-fluid/:entryDate` creates or replaces
   it, so re-saving a day updates it). The list reads a 90-day window in
   one full page: at most one row per day, so the page holds the whole
   window. The symptom counts the server keeps for the window come from
   `/summary`. Each entry's `weightKg` is the server's, which the care
   team's CCM dashboard reads for weight-change alerts.
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { fetchPage, lastDays, toDay } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  patientPath,
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import type { WeightFluidEntry } from "./fluid.types";
import {
  fromApiWeightFluid,
  toWeightFluidBody,
  type ApiWeightFluidEntry,
} from "./weightFluid.mapper";

export const WEIGHT_WINDOW_DAYS = 90;

export type WeightSummary = {
  from: string;
  to: string;
  entryCount: number;
  symptoms: { symptom: string; count: number }[];
};

const base = (scope: PatientScope) => patientPath(scope, "/weight-fluid");

export const listWeightFluid = (
  scope: PatientScope,
  window: { from: string; to: string },
) => fetchPage<ApiWeightFluidEntry>(base(scope), { ...window, limit: 150 });

export const getWeightSummary = (
  scope: PatientScope,
  window: { from: string; to: string },
) => api<WeightSummary>(`${base(scope)}/summary`, { query: window });

export const putWeightFluid = (
  scope: PatientScope,
  entryDate: string,
  body: ReturnType<typeof toWeightFluidBody>,
) =>
  api<ApiWeightFluidEntry>(`${base(scope)}/${encodeURIComponent(entryDate)}`, {
    method: "PUT",
    body,
  });

export const deleteWeightFluid = (scope: PatientScope, entryDate: string) =>
  api<unknown>(`${base(scope)}/${encodeURIComponent(entryDate)}`, {
    method: "DELETE",
  });

export function useWeightLog(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const window = useMemo(() => lastDays(WEIGHT_WINDOW_DAYS), []);
  const featureKey = scopedKey(scope, "weight-fluid");

  const query = useQuery({
    queryKey: scopedKey(scope, "weight-fluid", "list", window),
    queryFn: async () =>
      (await listWeightFluid(requireScope(scope), window)).items.map(
        fromApiWeightFluid,
      ),
  });
  const summary = useQuery({
    queryKey: scopedKey(scope, "weight-fluid", "summary", window),
    queryFn: () => getWeightSummary(requireScope(scope), window),
  });

  const write = useMutation({
    mutationFn: ({
      entry,
      unit,
    }: {
      entry: WeightFluidEntry;
      unit: "kg" | "lbs";
    }) =>
      putWeightFluid(
        requireScope(scope),
        entry.date ?? toDay(new Date()),
        toWeightFluidBody(entry, unit),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: featureKey }),
  });
  const drop = useMutation({
    mutationFn: (entryDate: string) =>
      deleteWeightFluid(requireScope(scope), entryDate),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: featureKey }),
  });

  const { mutate } = write;
  const entries = useMemo(
    () =>
      [...(query.data ?? [])].sort((a, b) =>
        (b.date ?? "").localeCompare(a.date ?? ""),
      ),
    [query.data],
  );

  return {
    /** Newest day first. */
    entries,
    summary: summary.data ?? null,
    isPending: query.isPending,
    error: query.error,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
      void summary.refetch();
    },
    saveError: write.error ?? drop.error,
    isSaving: write.isPending,
    /** Saves the day (creates or replaces it), with the unit typed in. */
    save: useCallback(
      (entry: WeightFluidEntry, unit: "kg" | "lbs", onSaved?: () => void) =>
        mutate({ entry, unit }, { onSuccess: () => onSaved?.() }),
      [mutate],
    ),
    remove: (entryDate: string) => drop.mutate(entryDate),
  };
}
