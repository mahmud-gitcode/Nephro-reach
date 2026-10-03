"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import * as rules from "./labs.data";
import type { LabsState } from "./labs.data";

/* ==========================================================================
   Clinic labs — storage
   ========================================================================== */

const KEY = storageKey("clinic-labs");

/** Bump when LabsState changes shape, so old data re-seeds. */
const VERSION = 1;

type StoredEnvelope = { version: number; state: unknown };

function isState(value: unknown): value is LabsState {
  return (
    !!value &&
    typeof value === "object" &&
    Array.isArray((value as Partial<LabsState>).results)
  );
}

async function readState(): Promise<LabsState> {
  const stored = await readJson<Partial<StoredEnvelope> | null>(KEY, null);
  if (stored && stored.version === VERSION && isState(stored.state)) {
    return stored.state;
  }
  const seeded = rules.seedLabs(Date.now());
  await writeJson(KEY, { version: VERSION, state: seeded });
  return seeded;
}

export const clinicLabsKey = ["clinic", "labs"] as const;

const EMPTY: LabsState = { results: [] };

export function useClinicLabs() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: clinicLabsKey, queryFn: readState });

  const write = useMutation({
    mutationFn: async (transform: (current: LabsState) => LabsState) => {
      const next = transform(await readState());
      await writeJson(KEY, { version: VERSION, state: next });
      return next;
    },
    onSuccess: (state) => queryClient.setQueryData(clinicLabsKey, state),
  });

  const { mutate } = write;
  const state = useMemo(() => query.data ?? EMPTY, [query.data]);

  const importLabs = useCallback(
    (rows: rules.LabRow[], by: string) =>
      mutate((s) => rules.importLabs(s, rows, by, Date.now())),
    [mutate],
  );

  return {
    state,
    isPending: query.isPending,
    isFetching: query.isFetching,
    error: query.error,
    updatedAt: query.dataUpdatedAt,
    refetch: () => void query.refetch(),
    writeError: write.error,
    isSaving: write.isPending,
    clearWriteError: write.reset,
    importLabs,
  };
}

export type ClinicLabsStore = ReturnType<typeof useClinicLabs>;
