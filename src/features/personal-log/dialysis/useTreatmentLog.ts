"use client";

/* ==========================================================================
   The member's charted treatments, from the API (Phase 7)
   --------------------------------------------------------------------------
   `/patients/:id/dialysis/treatments`, read as a window of days (the last
   90 by default, up to 150 rows a page, "load more" while the server says
   there is more). One call per save, missed day or delete; each refreshes
   every treatment read. No sample sessions: a member with none sees none.
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isApiError } from "@/lib/api/client";
import { lastDays } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { usePagedList } from "@/features/profile/usePagedList";
import type { DialysisLogEntry } from "../dialysisTreatmentData";
import {
  fromApiTreatment,
  missedTreatmentBody,
  toTreatmentBody,
  type TreatmentDraft,
} from "./treatment.mapper";
import {
  createTreatment,
  getTreatment,
  listTreatments,
  removeTreatment,
  treatmentPhotoLink,
  updateTreatment,
} from "./dialysis.repository";

export const TREATMENTS_FEATURE = "dialysis-treatments";

export function treatmentsKey(scope: PatientScope | null) {
  return scopedKey(scope, TREATMENTS_FEATURE);
}

/** The window a treatment log reads: the last `days` days. */
export const TREATMENT_WINDOW_DAYS = 90;

export function useTreatmentLog(
  explicitScope?: PatientScope | null,
  days = TREATMENT_WINDOW_DAYS,
) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const range = useMemo(() => lastDays(days), [days]);

  const list = usePagedList({
    scope,
    queryKey: scopedKey(scope, TREATMENTS_FEATURE, "list", range),
    params: { ...range, limit: 150 },
    fetch: listTreatments,
    map: fromApiTreatment,
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: treatmentsKey(scope) });

  const save = useMutation({
    mutationFn: async ({
      id,
      draft,
    }: {
      id?: string;
      draft: TreatmentDraft;
    }) => {
      const target = requireScope(scope);
      const body = toTreatmentBody(draft);
      const raw = id
        ? await updateTreatment(target, id, body)
        : await createTreatment(target, body);
      return fromApiTreatment(raw);
    },
    onSuccess: refresh,
  });
  const missed = useMutation({
    mutationFn: ({
      date,
      modality,
    }: {
      date: string;
      modality: "in-center-hd" | "home-hd";
    }) =>
      createTreatment(requireScope(scope), missedTreatmentBody(date, modality)),
    onSuccess: refresh,
  });
  const drop = useMutation({
    mutationFn: (id: string) => removeTreatment(requireScope(scope), id),
    onSuccess: refresh,
  });

  const entries = useMemo(
    () =>
      [...list.items].sort(
        (a: DialysisLogEntry, b: DialysisLogEntry) =>
          b.date.localeCompare(a.date) ||
          (b.startTime ?? "").localeCompare(a.startTime ?? ""),
      ),
    [list.items],
  );

  const { mutateAsync: saveAsync } = save;
  const { mutate: missedMutate } = missed;
  const { mutate: dropMutate } = drop;

  return {
    entries,
    range,
    hasMore: list.hasMore,
    loadMore: list.loadMore,
    isPending: list.isPending,
    error: list.error,
    isError: list.isError,
    refetch: list.refetch,
    isSaving: save.isPending || missed.isPending || drop.isPending,
    saveError: save.error ?? missed.error ?? drop.error,
    /** Creates (no id) or changes one treatment; resolves with the server's row. */
    save: useCallback(
      (draft: TreatmentDraft, id?: string) => saveAsync({ id, draft }),
      [saveAsync],
    ),
    /** A scheduled day the member says they missed. */
    markMissed: useCallback(
      (date: string, modality: "in-center-hd" | "home-hd") =>
        missedMutate({ date, modality }),
      [missedMutate],
    ),
    remove: useCallback((id: string) => dropMutate(id), [dropMutate]),
    /** The treatment photo's short-lived link, asked for on demand. */
    photoLink: useCallback(
      (id: string) => treatmentPhotoLink(requireScope(scope), id),
      [scope],
    ),
  };
}

/** One treatment by id (the view and edit pages); null when not found. */
export function useTreatmentEntry(
  id: string | null | undefined,
  explicitScope?: PatientScope | null,
) {
  const scope = usePatientScope(explicitScope);
  const query = useQuery({
    queryKey: scopedKey(scope, TREATMENTS_FEATURE, "one", id ?? ""),
    queryFn: async () => {
      try {
        return fromApiTreatment(await getTreatment(requireScope(scope), id!));
      } catch (error) {
        if (isApiError(error, { status: 404 })) return null;
        throw error;
      }
    },
    enabled: !!id,
  });
  return {
    entry: query.data ?? null,
    isPending: !!id && query.isPending,
    error: query.error,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
