"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, sampleOr, storageKey, writeJson } from "@/lib/data/storage";
import {
  mockDialysisEntries,
  type DialysisLogEntry,
} from "../dialysisTreatmentData";
import { missedEntry, upsertEntry } from "./treatmentLog";

/* The member's charted treatments (member-owned, see lib/data/storage).
   The demo patient starts with the sample sessions; a new member with none. */
const KEY = storageKey("dialysis-treatments");
export const treatmentLogKey = ["dialysis", "treatments"] as const;

async function listTreatments(): Promise<DialysisLogEntry[]> {
  const stored = await readJson<DialysisLogEntry[] | null>(KEY, null);
  if (Array.isArray(stored)) return stored;
  return sampleOr(KEY, mockDialysisEntries, []);
}

export function useTreatmentLog() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: treatmentLogKey,
    queryFn: listTreatments,
  });
  const write = useMutation({
    mutationFn: async (
      transform: (current: DialysisLogEntry[]) => DialysisLogEntry[],
    ) => writeJson(KEY, transform(await listTreatments())),
    onSuccess: (list) => queryClient.setQueryData(treatmentLogKey, list),
  });
  const { mutate, mutateAsync } = write;
  const entries = useMemo(
    () =>
      [...(query.data ?? [])].sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          (b.startTime ?? "").localeCompare(a.startTime ?? ""),
      ),
    [query.data],
  );

  return {
    entries,
    isPending: query.isPending,
    error: query.error,
    isSaving: write.isPending,
    saveError: write.error,
    save: useCallback(
      (entry: DialysisLogEntry) =>
        mutateAsync((current) =>
          upsertEntry(
            current,
            entry.id ? entry : { ...entry, id: `tx-${Date.now()}` },
          ),
        ),
      [mutateAsync],
    ),
    /** A scheduled day the member says they missed. */
    markMissed: useCallback(
      (date: string, modality: "in-center-hd" | "home-hd") =>
        mutate((current) =>
          upsertEntry(current, missedEntry(date, modality, Date.now())),
        ),
      [mutate],
    ),
    remove: useCallback(
      (id: string) => mutate((current) => current.filter((e) => e.id !== id)),
      [mutate],
    ),
  };
}
