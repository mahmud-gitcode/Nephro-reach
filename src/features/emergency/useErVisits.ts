"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, sampleOr, storageKey, writeJson } from "@/lib/data/storage";
import {
  recordAnswer,
  seedErVisits,
  type ErAnswer,
  type ErVisitReport,
} from "./erVisits";

/* ==========================================================================
   ER visit log — storage
   --------------------------------------------------------------------------
   The member's own record, filed under the signed-in member. The demo
   patient opens on a sample history; a new member on an empty one.
   ========================================================================== */

const KEY = storageKey("er-visits");

function isLog(value: unknown): value is ErVisitReport[] {
  return (
    Array.isArray(value) &&
    value.every(
      (r) =>
        r &&
        typeof r === "object" &&
        typeof (r as ErVisitReport).weekOf === "string" &&
        ((r as ErVisitReport).answer === "yes" ||
          (r as ErVisitReport).answer === "no"),
    )
  );
}

async function readLog(): Promise<ErVisitReport[]> {
  const stored = await readJson<unknown>(KEY, null);
  if (isLog(stored)) return stored;
  return sampleOr(KEY, seedErVisits(Date.now()), []);
}

export const erVisitsKey = ["emergency", "er-visits"] as const;

export function useErVisits() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: erVisitsKey, queryFn: readLog });

  const write = useMutation({
    mutationFn: async (answer: ErAnswer) => {
      const next = recordAnswer(await readLog(), answer, Date.now());
      await writeJson(KEY, next);
      return next;
    },
    onSuccess: (log) => queryClient.setQueryData(erVisitsKey, log),
  });

  const { mutate } = write;

  return {
    log: query.data ?? [],
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    answer: useCallback((answer: ErAnswer) => mutate(answer), [mutate]),
    isSaving: write.isPending,
    saveError: write.error,
  };
}
