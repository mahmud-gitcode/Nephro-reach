"use client";

/* ==========================================================================
   What the member records on the medication page, from the API (Phase 6)
   --------------------------------------------------------------------------
   One day at a time (the schedule's day, today by default): the dose
   statuses and side effects of that day, keyed by (medication id, day,
   HH:mm). One PUT per change. A dose set back to pending is deleted on the
   server. Every write refreshes the medication reads, so the adherence
   figures (the server's, `useAdherence`) follow the taps that changed them.
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import {
  fromApiDose,
  fromApiSideEffect,
  toDoseBody,
  toSideEffectBody,
} from "./medicationLog.mapper";
import {
  getAdherence,
  listDoses,
  listSideEffects,
  setDose,
  setSideEffect as putSideEffect,
} from "./medicationLog.repository";
import * as rules from "./medicationLog.rules";
import type {
  DoseRecord,
  DoseStatus,
  SideEffect,
  SideEffectRecord,
} from "./medicationLog.types";
import {
  MEDICATIONS_FEATURE,
  medicationsKey,
  useMedications,
} from "./useMedications";

export function useMedicationLog(
  date?: string,
  explicitScope?: PatientScope | null,
) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const day = date ?? rules.todayIso();
  const window = useMemo(() => ({ from: day, to: day }), [day]);
  /* Names for display only: identity is the medication id. */
  const { nameOf } = useMedications(explicitScope);

  const dosesQuery = useQuery({
    queryKey: scopedKey(scope, MEDICATIONS_FEATURE, "doses", window),
    queryFn: () => listDoses(requireScope(scope), window),
  });
  const sideEffectsQuery = useQuery({
    queryKey: scopedKey(scope, MEDICATIONS_FEATURE, "side-effects", window),
    queryFn: () => listSideEffects(requireScope(scope), window),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: medicationsKey(scope) });

  const writeDose = useMutation({
    mutationFn: (input: {
      date: string;
      medicationId: string;
      time: string;
      status: DoseStatus;
    }) =>
      setDose(
        requireScope(scope),
        input.medicationId,
        toDoseBody(input.date, input.time, input.status),
      ),
    onSuccess: refresh,
  });
  const writeSideEffect = useMutation({
    mutationFn: (input: {
      date: string;
      medicationId: string;
      time: string;
      effect: SideEffect | null;
    }) =>
      putSideEffect(
        requireScope(scope),
        input.medicationId,
        toSideEffectBody(input.date, input.time, input.effect),
      ),
    onSuccess: refresh,
  });

  const doses: DoseRecord[] = useMemo(
    () =>
      (dosesQuery.data ?? [])
        .map((raw) => fromApiDose(raw, nameOf))
        .filter((d): d is DoseRecord => d !== null),
    [dosesQuery.data, nameOf],
  );
  const sideEffects: SideEffectRecord[] = useMemo(
    () =>
      (sideEffectsQuery.data ?? [])
        .map((raw) => fromApiSideEffect(raw, nameOf))
        .filter((r): r is SideEffectRecord => r !== null),
    [sideEffectsQuery.data, nameOf],
  );

  const { mutate: mutateDose } = writeDose;
  const { mutate: mutateSideEffect } = writeSideEffect;

  return {
    /** The day this log reads. */
    date: day,
    doses,
    sideEffects,
    statusOf: useCallback(
      (on: string, medicationId: string, time: string) =>
        rules.statusOf(doses, on, medicationId, time),
      [doses],
    ),
    stampOf: useCallback(
      (on: string, medicationId: string, time: string) =>
        rules.findDose(doses, on, medicationId, time)?.stampedAt,
      [doses],
    ),
    sideEffectOf: useCallback(
      (on: string, medicationId: string, time: string) =>
        rules.sideEffectOf(sideEffects, on, medicationId, time),
      [sideEffects],
    ),
    reportedSideEffectCount: useCallback(
      (on: string) => rules.reportedSideEffectCount(sideEffects, on),
      [sideEffects],
    ),
    setDoseStatus: useCallback(
      (on: string, medicationId: string, time: string, status: DoseStatus) =>
        mutateDose({ date: on, medicationId, time, status }),
      [mutateDose],
    ),
    setSideEffect: useCallback(
      (
        on: string,
        medicationId: string,
        time: string,
        effect: SideEffect | null,
      ) => mutateSideEffect({ date: on, medicationId, time, effect }),
      [mutateSideEffect],
    ),

    isPending: dosesQuery.isPending || sideEffectsQuery.isPending,
    error: dosesQuery.error ?? sideEffectsQuery.error,
    refetch: () => {
      void dosesQuery.refetch();
      void sideEffectsQuery.refetch();
    },
    /* A dose that silently failed to save matters: the member believes they
       recorded taking their medication. */
    saveError: writeDose.error ?? writeSideEffect.error,
    isSaving: writeDose.isPending || writeSideEffect.isPending,
  };
}

/** What the panels take as a prop. */
export type MedicationLog = ReturnType<typeof useMedicationLog>;

/** The server's adherence over the last `days` days (default a week). */
export function useAdherence(days = 7, explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const query = useQuery({
    queryKey: scopedKey(scope, MEDICATIONS_FEATURE, "adherence", days),
    queryFn: () => getAdherence(requireScope(scope), days),
  });
  return {
    report: query.data ?? null,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}
