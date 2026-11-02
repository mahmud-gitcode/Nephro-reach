"use client";

/* ==========================================================================
   One day's PD exchanges, from the API (Phase 7)
   --------------------------------------------------------------------------
   `/patients/:id/dialysis/pd-exchanges?from=<day>&to=<day>`: a PD member
   does four or five a day, so the log reads the day it shows, not months.
   Ultrafiltration and the "call your unit" clarity flag come from the
   server's row.
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { usePagedList } from "@/features/profile/usePagedList";
import type { PdExchangeDraft } from "./pdExchange";
import { fromApiPdExchange, toPdExchangeBody } from "./pdExchange.mapper";
import {
  createPdExchange,
  listPdExchanges,
  removePdExchange,
  updatePdExchange,
} from "./dialysis.repository";

export const PD_EXCHANGES_FEATURE = "dialysis-pd-exchanges";

export function usePdExchanges(
  date: string,
  explicitScope?: PatientScope | null,
) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const range = useMemo(() => ({ from: date, to: date }), [date]);

  const list = usePagedList({
    scope,
    queryKey: scopedKey(scope, PD_EXCHANGES_FEATURE, "list", range),
    params: { ...range, limit: 150 },
    fetch: listPdExchanges,
    map: fromApiPdExchange,
  });

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: scopedKey(scope, PD_EXCHANGES_FEATURE),
    });

  const save = useMutation({
    mutationFn: ({ draft, id }: { draft: PdExchangeDraft; id?: string }) => {
      const target = requireScope(scope);
      const body = toPdExchangeBody(draft);
      return id
        ? updatePdExchange(target, id, body)
        : createPdExchange(target, body);
    },
    onSuccess: refresh,
  });
  const drop = useMutation({
    mutationFn: (id: string) => removePdExchange(requireScope(scope), id),
    onSuccess: refresh,
  });

  const exchanges = useMemo(
    () =>
      [...list.items].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [list.items],
  );
  const { mutateAsync: saveAsync } = save;
  const { mutate: dropMutate } = drop;

  return {
    exchanges,
    /** The day's ultrafiltration, summed from the server's per-exchange values. */
    dailyUltrafiltrationMl: exchanges.reduce(
      (sum, e) => sum + e.ultrafiltrationMl,
      0,
    ),
    /** Exchanges whose fluid the server marks urgent (cloudy, blood-stained). */
    urgent: exchanges.filter((e) => e.urgentClarity),
    isPending: list.isPending,
    error: list.error,
    isError: list.isError,
    refetch: list.refetch,
    hasMore: list.hasMore,
    loadMore: list.loadMore,
    isSaving: save.isPending || drop.isPending,
    saveError: save.error ?? drop.error,
    dismissSaveError: () => {
      save.reset();
      drop.reset();
    },
    saveExchange: useCallback(
      (draft: PdExchangeDraft, id?: string) => saveAsync({ draft, id }),
      [saveAsync],
    ),
    deleteExchange: useCallback((id: string) => dropMutate(id), [dropMutate]),
  };
}
