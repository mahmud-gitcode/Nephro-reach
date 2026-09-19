"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRefills,
  listDoses,
  listMood,
  listSideEffects,
  saveDoses,
  saveMood,
  saveRefills,
  saveSideEffects,
} from "./medicationLog.repository";
import * as rules from "./medicationLog.rules";
import type {
  DoseRecord,
  DoseStatus,
  MoodEntry,
  RefillFlags,
  SideEffect,
  SideEffectRecord,
} from "./medicationLog.types";

export const doseLogKey = ["medications", "doses"] as const;
export const refillsKey = ["medications", "refills"] as const;
export const moodKey = ["medications", "mood"] as const;
export const sideEffectsKey = ["medications", "side-effects"] as const;

/**
 * Everything the member records on the medication page.
 *
 * One hook because one page reads all three, and because the adherence
 * tracker at the bottom is derived from the dose statuses tapped at the top
 * — they have to come from the same cache or the figure lags the taps.
 *
 * Each write is read-modify-write against storage rather than the cache, so
 * it applies to what is actually saved. With a real API each transform
 * becomes the request body and nothing above this file changes.
 */
export function useMedicationLog() {
  const queryClient = useQueryClient();

  const dosesQuery = useQuery({ queryKey: doseLogKey, queryFn: listDoses });
  const refillsQuery = useQuery({ queryKey: refillsKey, queryFn: getRefills });
  const moodQuery = useQuery({ queryKey: moodKey, queryFn: listMood });
  const sideEffectsQuery = useQuery({
    queryKey: sideEffectsKey,
    queryFn: listSideEffects,
  });

  const writeDoses = useMutation({
    mutationFn: async (transform: (current: DoseRecord[]) => DoseRecord[]) =>
      saveDoses(transform(await listDoses())),
    onSuccess: (doses) => queryClient.setQueryData(doseLogKey, doses),
  });

  const writeRefills = useMutation({
    mutationFn: async (transform: (current: RefillFlags) => RefillFlags) =>
      saveRefills(transform(await getRefills())),
    onSuccess: (flags) => queryClient.setQueryData(refillsKey, flags),
  });

  const writeSideEffects = useMutation({
    mutationFn: async (
      transform: (current: SideEffectRecord[]) => SideEffectRecord[],
    ) => saveSideEffects(transform(await listSideEffects())),
    onSuccess: (records) => queryClient.setQueryData(sideEffectsKey, records),
  });

  const writeMood = useMutation({
    mutationFn: async (transform: (current: MoodEntry[]) => MoodEntry[]) =>
      saveMood(transform(await listMood())),
    onSuccess: (entries) => queryClient.setQueryData(moodKey, entries),
  });

  /* `?? []` inline would hand out a new array every render and re-run every
     adherence figure derived from it. */
  const doses = useMemo(() => dosesQuery.data ?? [], [dosesQuery.data]);
  const refills = useMemo(() => refillsQuery.data ?? {}, [refillsQuery.data]);
  const moodEntries = useMemo(() => moodQuery.data ?? [], [moodQuery.data]);
  const sideEffects = useMemo(
    () => sideEffectsQuery.data ?? [],
    [sideEffectsQuery.data],
  );

  const { mutate: mutateDoses } = writeDoses;
  const { mutate: mutateRefills } = writeRefills;
  const { mutate: mutateMood } = writeMood;
  const { mutate: mutateSideEffects } = writeSideEffects;

  const setDoseStatus = useCallback(
    (date: string, medication: string, time: string, status: DoseStatus) =>
      mutateDoses((current) =>
        rules.setDoseStatus(current, date, medication, time, status),
      ),
    [mutateDoses],
  );

  const setRefill = useCallback(
    (medication: string, value: boolean) =>
      mutateRefills((current) => rules.setRefill(current, medication, value)),
    [mutateRefills],
  );

  const setSideEffect = useCallback(
    (
      date: string,
      medication: string,
      time: string,
      effect: SideEffect | null,
    ) =>
      mutateSideEffects((current) =>
        rules.setSideEffect(current, date, medication, time, effect),
      ),
    [mutateSideEffects],
  );

  const saveMoodEntry = useCallback(
    (entry: MoodEntry) =>
      mutateMood((current) => rules.upsertMood(current, entry)),
    [mutateMood],
  );

  const dosesOn = useCallback(
    (date: string) => doses.filter((dose) => dose.date === date),
    [doses],
  );

  const moodOn = useCallback(
    (date: string) => rules.findMood(moodEntries, date),
    [moodEntries],
  );

  return {
    doses,
    refills,
    moodEntries,

    dosesOn,
    moodOn,
    statusOf: useCallback(
      (date: string, medication: string, time: string) =>
        rules.statusOf(doses, date, medication, time),
      [doses],
    ),
    stampOf: useCallback(
      (date: string, medication: string, time: string) =>
        rules.findDose(doses, date, medication, time)?.stampedAt,
      [doses],
    ),
    needsRefill: useCallback(
      (medication: string) => rules.needsRefill(refills, medication),
      [refills],
    ),
    refillCount: useMemo(() => rules.refillCount(refills), [refills]),

    sideEffects,
    sideEffectOf: useCallback(
      (date: string, medication: string, time: string) =>
        rules.sideEffectOf(sideEffects, date, medication, time),
      [sideEffects],
    ),
    reportedSideEffectCount: useCallback(
      (date: string) => rules.reportedSideEffectCount(sideEffects, date),
      [sideEffects],
    ),

    setDoseStatus,
    setRefill,
    setSideEffect,
    saveMoodEntry,

    /* One pending flag for all three: the page renders them together, and a
       half-loaded page shows an adherence figure built from nothing. */
    isPending:
      dosesQuery.isPending ||
      refillsQuery.isPending ||
      moodQuery.isPending ||
      sideEffectsQuery.isPending,
    error:
      dosesQuery.error ??
      refillsQuery.error ??
      moodQuery.error ??
      sideEffectsQuery.error,
    refetch: () => {
      void dosesQuery.refetch();
      void refillsQuery.refetch();
      void moodQuery.refetch();
      void sideEffectsQuery.refetch();
    },
    /* A dose that silently failed to save matters: the member believes they
       recorded taking their medication. */
    saveError:
      writeDoses.error ??
      writeRefills.error ??
      writeMood.error ??
      writeSideEffects.error,
    isSavingMood: writeMood.isPending,
  };
}

/** What the panels take as a prop. */
export type MedicationLog = ReturnType<typeof useMedicationLog>;
