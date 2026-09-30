"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, sampleOr, storageKey, writeJson } from "@/lib/data/storage";
import { SEED_ENTRIES } from "./fluid.seed";
import type { WeightFluidEntry } from "./fluid.types";

/* The member's weight and fluid log (member-owned, see lib/data/storage).
   It used to be component state, so a weight vanished on refresh; stored,
   it is also what the care team's CCM dashboard reads for weight change. */
const KEY = storageKey("weight-fluid-log");

async function listEntries(): Promise<WeightFluidEntry[]> {
  const stored = await readJson<WeightFluidEntry[] | null>(KEY, null);
  return Array.isArray(stored) ? stored : sampleOr(KEY, SEED_ENTRIES, []);
}

export const weightLogKey = ["personal-log", "weight-fluid-log"] as const;

export function useWeightLog() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: weightLogKey, queryFn: listEntries });
  const write = useMutation({
    mutationFn: async (
      transform: (current: WeightFluidEntry[]) => WeightFluidEntry[],
    ) => writeJson(KEY, transform(await listEntries())),
    onSuccess: (entries) => queryClient.setQueryData(weightLogKey, entries),
  });
  const { mutate } = write;
  const entries = useMemo(() => query.data ?? [], [query.data]);

  return {
    entries,
    isPending: query.isPending,
    saveError: write.error,
    /** Newest first, as the page lists them. */
    add: useCallback(
      (entry: WeightFluidEntry) => mutate((current) => [entry, ...current]),
      [mutate],
    ),
  };
}
