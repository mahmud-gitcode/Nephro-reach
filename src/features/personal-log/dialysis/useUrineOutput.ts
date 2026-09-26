"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import {
  entriesOn,
  normaliseEntries,
  removeEntry,
  totalOn,
  upsertEntry,
  type UrineEntry,
  type UrineEntryDraft,
} from "./urineOutput";

/* ==========================================================================
   Urine output — storage and state
   --------------------------------------------------------------------------
   Small enough that the repository lives here rather than in a file of its
   own: one key, one list, no seed. A member opening this should see what
   they actually passed, not an invented day.
   ========================================================================== */

const URINE_KEY = storageKey("dialysis-urine-output");
const QUERY_KEY = ["dialysis-urine-output"];
const NO_ENTRIES: UrineEntry[] = [];

async function listEntries(): Promise<UrineEntry[]> {
  return normaliseEntries(await readJson<unknown>(URINE_KEY, null));
}

/** Today as yyyy-mm-dd in the member's own timezone, not UTC. */
function todayIso(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function useUrineOutput() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayIso);

  const entriesQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: listEntries,
  });

  const write = useMutation({
    mutationFn: async (transform: (current: UrineEntry[]) => UrineEntry[]) =>
      writeJson(URINE_KEY, transform(await listEntries())),
    onSuccess: (entries) => queryClient.setQueryData(QUERY_KEY, entries),
  });

  const entries = entriesQuery.data ?? NO_ENTRIES;
  const { mutate } = write;

  return {
    date,
    setDate,
    entries,
    /** The chosen day's passings, earliest first. */
    dayEntries: useMemo(() => entriesOn(entries, date), [entries, date]),
    /** The chosen day's total in mL. */
    dayTotalMl: useMemo(() => totalOn(entries, date), [entries, date]),

    save: useCallback(
      (draft: UrineEntryDraft, editId?: string) => {
        const entry: UrineEntry = {
          ...draft,
          id:
            editId ??
            `urine-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        };
        mutate((current) => upsertEntry(current, entry));
      },
      [mutate],
    ),
    remove: useCallback(
      (id: string) => mutate((current) => removeEntry(current, id)),
      [mutate],
    ),

    isPending: entriesQuery.isPending,
    error: entriesQuery.error,
    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
  };
}

export type UrineOutputLog = ReturnType<typeof useUrineOutput>;
