"use client";

/* ==========================================================================
   The member's labs, from the API (Phase 6)
   --------------------------------------------------------------------------
   One window of days (a year by default): the result rows of every source
   (paged, "load more"), and the server's trend series for the same window
   for every chart. Adding a draw is one POST that adds rows (it never
   overwrites the last draw); the member changes or removes only their own
   typed rows, by id. A report file is uploaded through /files first and
   only its id is sent; it opens through the result's own link.

   "Seen" is the patient's own act: a caregiver reading the results is not
   the member seeing them, so `canMarkSeen` is false for a caregiver and the
   server refuses it anyway (labs.only_patient_marks_seen).
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lastDays } from "@/lib/api/paging";
import { uploadFile } from "@/lib/api/upload";
import type { PatientScope } from "@/lib/data/queryKeys";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { usePagedList } from "@/features/profile/usePagedList";
import {
  toDrawBody,
  type ApiLabResult,
  type LabDraft,
  type UpdateResultBody,
} from "./labs.mapper";
import {
  createDraw,
  getLabTrends,
  labReportLink,
  listLabResults,
  markLabsSeen,
  removeLabResult,
  updateLabResult,
} from "./labs.repository";

export const LABS_FEATURE = "labs";
export const LABS_WINDOW_DAYS = 365;

const identity = (row: ApiLabResult) => row;

/** Whether the signed-in user is the patient (not a caregiver). */
export function useIsPatientSelf(): boolean {
  return useOptionalAuth()?.user?.role === "user";
}

export function useMemberLabs(
  explicitScope?: PatientScope | null,
  days: number = LABS_WINDOW_DAYS,
) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const isPatient = useIsPatientSelf();
  const window = useMemo(() => lastDays(days), [days]);
  const featureKey = scopedKey(scope, LABS_FEATURE);

  const list = usePagedList({
    scope,
    queryKey: scopedKey(scope, LABS_FEATURE, "list", window),
    params: { ...window, limit: 150 },
    fetch: (target, params) => listLabResults(target, params),
    map: identity,
  });
  const trends = useQuery({
    queryKey: scopedKey(scope, LABS_FEATURE, "trends", window),
    queryFn: () => getLabTrends(requireScope(scope), window),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: featureKey });

  const add = useMutation({
    mutationFn: async ({
      draft,
      report,
    }: {
      draft: LabDraft;
      report?: File | null;
    }) => {
      const target = requireScope(scope);
      /* Shape the body first: nothing is uploaded for a draw that the
         form would refuse anyway. */
      toDrawBody(draft);
      const reportFileId = report ? await uploadFile(report) : undefined;
      return createDraw(target, toDrawBody(draft, reportFileId));
    },
    onSuccess: refresh,
  });
  const change = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateResultBody }) =>
      updateLabResult(requireScope(scope), id, body),
    onSuccess: refresh,
  });
  const drop = useMutation({
    mutationFn: (id: string) => removeLabResult(requireScope(scope), id),
    onSuccess: refresh,
  });
  const seen = useMutation({
    mutationFn: () => markLabsSeen(requireScope(scope)),
    onSuccess: refresh,
  });

  const { mutateAsync: addAsync } = add;
  const { mutateAsync: changeAsync } = change;
  const { mutateAsync: dropAsync } = drop;
  const { mutate: seenMutate } = seen;

  return {
    window,
    rows: list.items,
    list,
    trends: trends.data ?? [],
    isPending: list.isPending || trends.isPending,
    error: list.error ?? trends.error,
    isError: list.isError || trends.isError,
    refetch: () => {
      list.refetch();
      void trends.refetch();
    },
    saveError: add.error ?? change.error ?? drop.error,
    isSaving: add.isPending || change.isPending || drop.isPending,
    addDraw: useCallback(
      (draft: LabDraft, report?: File | null) => addAsync({ draft, report }),
      [addAsync],
    ),
    updateResult: useCallback(
      (id: string, body: UpdateResultBody) => changeAsync({ id, body }),
      [changeAsync],
    ),
    removeResult: useCallback((id: string) => dropAsync(id), [dropAsync]),
    /** Only the patient marks the care team's results seen. */
    canMarkSeen: isPatient,
    markSeen: useCallback(() => {
      if (isPatient) seenMutate();
    }, [isPatient, seenMutate]),
    /** The result's report link, fetched when the member opens it. */
    reportLink: useCallback(
      (id: string) => labReportLink(requireScope(scope), id),
      [scope],
    ),
  };
}
