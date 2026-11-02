"use client";

/* ==========================================================================
   The member's latest typed draw, in the shape the office feed reads
   --------------------------------------------------------------------------
   The member's own labs are rows on the API now (useMemberLabs). The
   office's member feed (OFFICE, `clinic/memberFeed.ts`) still reads one
   "custom lab result" object; until OFFICE moves it to per-patient reads
   (Phase 9), this builds that object from the API: the newest
   PATIENT_ENTERED draw, values keyed by panel name. With no patient in
   context (an office), there is no scope and it reads nothing (D33).
   ========================================================================== */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { listLabResults } from "./labs.repository";
import { LAB_CATEGORIES } from "./labs.panels.seed";
import { newestFirst } from "./labs.view";
import type { ApiLabResult } from "./labs.mapper";
import type { CustomLabResult } from "./labs.types";
import { LABS_FEATURE } from "./useMemberLabs";

export type { CustomLabResult } from "./labs.types";

const NAME_BY_CODE = new Map(
  LAB_CATEGORIES.flatMap((c) => c.tests.map((t) => [t.id, t.name] as const)),
);

/** The newest typed draw as one object (null when there is none). */
export function latestDrawOf(
  rows: readonly ApiLabResult[],
): CustomLabResult | null {
  const own = newestFirst(rows).filter((r) => r.source === "PATIENT_ENTERED");
  const day = own[0]?.collectedOn.slice(0, 10);
  if (!day) return null;
  const draw = own.filter((r) => r.collectedOn.slice(0, 10) === day);
  const values: Record<string, string> = {};
  for (const row of draw)
    values[NAME_BY_CODE.get(row.testCode) ?? row.testName] = row.value;
  const notes = draw.find((r) => r.notes)?.notes ?? undefined;
  return { date: day, values, ...(notes ? { notes } : {}) };
}

export function useCustomLabResult(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const query = useQuery({
    queryKey: scopedKey(scope, LABS_FEATURE, "own-latest"),
    queryFn: async () =>
      (
        await listLabResults(
          requireScope(scope),
          { limit: 40 },
          { source: "PATIENT_ENTERED" },
        )
      ).items,
  });
  const result = useMemo(() => latestDrawOf(query.data ?? []), [query.data]);
  return {
    result,
    isPending: query.isPending,
    error: query.error,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
