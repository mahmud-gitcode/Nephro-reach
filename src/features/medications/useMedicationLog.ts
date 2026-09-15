"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRefills,
  listDoses,
  listMood,
  saveDoses,
  saveMood,
  saveRefills,
} from "./medicationLog.repository";
import * as rules from "./medicationLog.rules";
import type {
  DoseRecord,
  DoseStatus,
  MoodEntry,
  RefillFlags,
} from "./medicationLog.types";

export const doseLogKey = ["medications", "doses"] as const;
export const refillsKey = ["medications", "refills"] as const;
export const moodKey = ["medications", "mood"] as const;

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

  const { mutate: mutateDoses } = writeDoses;
  const { mutate: mutateRefills } = writeRefills;
  const { mutate: mutateMood } = writeMood;

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

    setDoseStatus,
    setRefill,
    saveMoodEntry,

    /* One pending flag for all three: the page renders them together, and a
       half-loaded page shows an adherence figure built from nothing. */
    isPending:
      dosesQuery.isPending || refillsQuery.isPending || moodQuery.isPending,
    error: dosesQuery.error ?? refillsQuery.error ?? moodQuery.error,
    refetch: () => {
      void dosesQuery.refetch();
      void refillsQuery.refetch();
      void moodQuery.refetch();
    },
    /* A dose that silently failed to save matters: the member believes they
       recorded taking their medication. */
    saveError: writeDoses.error ?? writeRefills.error ?? writeMood.error,
    isSavingMood: writeMood.isPending,
  };
}

/** What the panels take as a prop. */
export type MedicationLog = ReturnType<typeof useMedicationLog>;
