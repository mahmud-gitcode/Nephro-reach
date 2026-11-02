"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { getTreatmentVitals, saveTreatmentVitals } from "./homeHd.repository";
import { getHomeSystem, saveHomeSystem } from "./homeDialysis.repository";
import {
  fromApiChecks,
  fromApiHomeSystem,
  toHomeSystemBody,
} from "./homeDialysis.mapper";
import {
  DEFAULT_SYSTEM,
  emptyVitals,
  fluidRemovedL,
  type HomeSystem,
  type TreatmentVitals,
} from "./homeHd";

/* ==========================================================================
   The home machine and its water, from the API (Phase 7)
   --------------------------------------------------------------------------
   `GET /patients/:id/dialysis/home-system?today=` returns the system (null
   until it is set up) with the server's two checks and whether anything
   needs attention; `PUT` saves it whole. The default system (NxStage,
   7 and 30 days) stands in only after a successful `null`, so the member
   has something to fill in; it is never saved until they change a field.
   The checks shown are always the server's.
   ========================================================================== */

export const HOME_SYSTEM_FEATURE = "dialysis-home-system";

export function homeSystemKey(scope: PatientScope | null) {
  return scopedKey(scope, HOME_SYSTEM_FEATURE);
}

/** Today as yyyy-mm-dd in the member's own timezone, not UTC. */
function todayIso(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** The machine and its water, plus where its two dated jobs stand. */
export function useHomeSystem(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const today = todayIso();
  const queryKey = scopedKey(scope, HOME_SYSTEM_FEATURE, today);

  const systemQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const raw = await getHomeSystem(requireScope(scope), today);
      return raw
        ? {
            system: fromApiHomeSystem(raw),
            checks: fromApiChecks(raw.checks),
            needsAttention: raw.needsAttention === true,
            isSet: true,
          }
        : null;
    },
  });

  type Shown = NonNullable<typeof systemQuery.data>;
  /* Each change is shown at once (synchronously) so a second quick change
     builds on the first; it is put back as the server last had it when the
     PUT is refused. The checks are the server's and refresh after it. */
  const write = useMutation({
    /* One PUT at a time, in order: the last change shown is the last saved. */
    scope: { id: "dialysis-home-system" },
    mutationFn: ({ next }: { next: HomeSystem; previous: Shown | null }) =>
      saveHomeSystem(requireScope(scope), toHomeSystemBody(next)),
    onError: (_error, { previous }) => {
      queryClient.setQueryData(queryKey, previous);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: homeSystemKey(scope) }),
  });

  const data = systemQuery.data;
  const system = data?.system ?? DEFAULT_SYSTEM;
  const { mutate } = write;

  return {
    system,
    today,
    /** False until the member first saves the system (server data: null). */
    isSet: !!data,
    /* The server's checks; before set-up, both "not recorded". */
    checks: useMemo(
      () =>
        data?.checks?.length
          ? data.checks
          : [
              {
                id: "disinfection" as const,
                dueIso: "",
                state: "unknown" as const,
              },
              { id: "filter" as const, dueIso: "", state: "unknown" as const },
            ],
      [data],
    ),
    needsAttention: data ? data.needsAttention : systemQuery.isSuccess,

    save: useCallback(
      (patch: Partial<Omit<HomeSystem, "updatedAt">>) => {
        const previous =
          queryClient.getQueryData<Shown | null>(queryKey) ?? null;
        const next = { ...(previous?.system ?? system), ...patch };
        const shown: Shown = {
          checks: previous?.checks ?? [],
          needsAttention: previous?.needsAttention ?? true,
          isSet: true,
          system: next,
        };
        queryClient.setQueryData(queryKey, shown);
        mutate({ next, previous });
      },
      [mutate, system, queryClient, queryKey],
    ),

    isPending: systemQuery.isPending,
    error: systemQuery.error,
    isError: systemQuery.isError,
    refetch: () => void systemQuery.refetch(),
    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
  };
}

/** One session's observations, for the day being looked at. Still in this
 *  browser until D8 (see homeHd.repository.ts); no screen uses it today. */
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
