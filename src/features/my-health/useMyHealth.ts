"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, sampleOr, storageKey, writeJson } from "@/lib/data/storage";
import { rawAllergyRows, rawHistoryRows } from "./health.seed";
import type { AllergyRow, HistoryRow } from "./health.types";

/* The member's allergies and medical history, kept on this device
   (member-owned, see lib/data/storage). They lived only in page state
   before, so an allergy added was gone on the next visit. */
type HealthRecord = { allergies: AllergyRow[]; history: HistoryRow[] };

const KEY = storageKey("my-health");
const queryKey = ["my-health"] as const;

const SAMPLE: HealthRecord = {
  allergies: rawAllergyRows.map((row, i) => ({
    ...row,
    id: `allergy-seed-${i}`,
  })),
  history: rawHistoryRows.map((row, i) => ({
    ...row,
    id: `history-seed-${i}`,
  })),
};

async function read(): Promise<HealthRecord> {
  const stored = await readJson<Partial<HealthRecord> | null>(KEY, null);
  if (
    stored &&
    Array.isArray(stored.allergies) &&
    Array.isArray(stored.history)
  ) {
    return { allergies: stored.allergies, history: stored.history };
  }
  return sampleOr(KEY, SAMPLE, { allergies: [], history: [] });
}

export function useMyHealth() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey, queryFn: read });
  const write = useMutation({
    mutationFn: async (transform: (r: HealthRecord) => HealthRecord) =>
      writeJson(KEY, transform(await read())),
    onSuccess: (record) => queryClient.setQueryData(queryKey, record),
  });
  const { mutate } = write;
  const record = useMemo(
    () => query.data ?? { allergies: [], history: [] },
    [query.data],
  );
  return {
    allergies: record.allergies,
    history: record.history,
    isPending: query.isPending,
    error: query.error,
    saveError: write.error,
    setAllergies: useCallback(
      (fn: (rows: AllergyRow[]) => AllergyRow[]) =>
        mutate((r) => ({ ...r, allergies: fn(r.allergies) })),
      [mutate],
    ),
    setHistory: useCallback(
      (fn: (rows: HistoryRow[]) => HistoryRow[]) =>
        mutate((r) => ({ ...r, history: fn(r.history) })),
      [mutate],
    ),
  };
}
