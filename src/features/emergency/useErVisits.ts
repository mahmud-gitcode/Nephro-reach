"use client";

/* ==========================================================================
   ER visit log, from the API (Phase 5)
   --------------------------------------------------------------------------
   `GET /patients/:id/er-visits/summary` gives the server's week (the
   Monday in the patient's time zone), this week's answer and the monthly
   counts; `GET …/er-visits` the weeks of the same six months (for the
   screens that read the log); `PUT …/er-visits/:weekOf` answers. The week
   always comes from the server, which refuses a non-Monday or future week.

   A log of what the member says, nothing more: never read for symptoms,
   never triage (client rule, Before the ER).
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { fetchPage } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  patientPath,
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import type { ErAnswer, ErVisitReport } from "./erVisits";

export const ER_MONTHS = 6;

type ApiErWeek = {
  patientId: string;
  weekOf: string;
  answer: ErAnswer;
  wentToEr: boolean;
  reportedAt: string;
};

export type ErSummary = {
  weekOf: string;
  thisWeek: ApiErWeek | null;
  months: { month: string; visits: number }[];
};

export function toReport(row: ApiErWeek): ErVisitReport {
  return { weekOf: row.weekOf, answer: row.answer, reportedAt: row.reportedAt };
}

/** The first day of the oldest month in the summary's window. */
export function windowStart(summary: ErSummary): string | null {
  const first = summary.months[0]?.month;
  return first ? `${first}-01` : null;
}

export const getErSummary = (scope: PatientScope) =>
  api<ErSummary>(patientPath(scope, "/er-visits/summary"), {
    query: { months: ER_MONTHS },
  });

export const listErWeeks = (scope: PatientScope, from: string, to: string) =>
  fetchPage<ApiErWeek>(patientPath(scope, "/er-visits"), {
    from,
    to,
    limit: 150,
  });

export const answerErWeek = (
  scope: PatientScope,
  weekOf: string,
  answer: ErAnswer,
) =>
  api<ApiErWeek>(
    patientPath(scope, `/er-visits/${encodeURIComponent(weekOf)}`),
    { method: "PUT", body: { answer } },
  );

export function useErVisits(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const featureKey = scopedKey(scope, "er-visits");

  const summary = useQuery({
    queryKey: scopedKey(scope, "er-visits", "summary", ER_MONTHS),
    queryFn: () => getErSummary(requireScope(scope)),
  });

  const from = summary.data ? windowStart(summary.data) : null;
  const to = summary.data?.weekOf ?? null;
  const weeks = useQuery({
    queryKey: scopedKey(scope, "er-visits", "weeks", { from, to }),
    queryFn: async () =>
      (await listErWeeks(requireScope(scope), from ?? "", to ?? "")).items.map(
        toReport,
      ),
    enabled: from !== null && to !== null,
  });

  const write = useMutation({
    mutationFn: (answer: ErAnswer) => {
      if (!summary.data) throw new Error("The week is not known yet.");
      return answerErWeek(requireScope(scope), summary.data.weekOf, answer);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: featureKey }),
  });

  const { mutate } = write;
  const thisWeek = summary.data?.thisWeek ?? null;

  /* The weeks the screens read: the list, with this week's answer from the
     summary (the freshest read) in place of the listed copy. */
  const log = useMemo(() => {
    const rows = weeks.data ?? [];
    if (!thisWeek) return rows;
    return [
      toReport(thisWeek),
      ...rows.filter((r) => r.weekOf !== thisWeek.weekOf),
    ];
  }, [weeks.data, thisWeek]);

  const error = summary.error ?? weeks.error ?? null;
  return {
    log,
    /** The server's week (the Monday, in the patient's time zone). */
    weekOf: summary.data?.weekOf ?? null,
    thisWeek: thisWeek ? toReport(thisWeek) : null,
    /** Monthly counts from the server, oldest first. */
    months: summary.data?.months ?? [],
    isPending: summary.isPending || (from !== null && weeks.isPending),
    error,
    isError: error !== null,
    refetch: () => {
      void summary.refetch();
      void weeks.refetch();
    },
    answer: useCallback((answer: ErAnswer) => mutate(answer), [mutate]),
    isSaving: write.isPending,
    saveError: write.error,
  };
}
