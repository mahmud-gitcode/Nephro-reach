"use client";

/* ==========================================================================
   The member's blood pressure, from the API (Phase 5)
   --------------------------------------------------------------------------
   The table reads a window of days (90 by default, a full page, "load
   more" when the server says there is more); the chart, averages and
   categories read `/summary` over the same window, never the raw rows.
   One call per add, edit or delete. A photo is uploaded through `/files`
   first and only its id is sent; it opens through the reading's own link.
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lastDays } from "@/lib/api/paging";
import { uploadFile } from "@/lib/api/upload";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { usePagedList } from "@/features/profile/usePagedList";
import type { BpDraft } from "./bloodPressure";
import { fromApiReading, toReadingBody } from "./bloodPressure.mapper";
import {
  createReading,
  getSummary,
  listReadings,
  photoLink,
  removeReading,
  updateReading,
} from "./bloodPressure.repository";

export const BP_WINDOW_DAYS = 90;

/** What to do with the photo on a save: keep it (undefined), attach a new
 *  file, or remove it (null). */
export type PhotoChange = File | null | undefined;

async function photoIdFor(change: PhotoChange) {
  if (change === undefined) return undefined;
  if (change === null) return null;
  return uploadFile(change);
}

export function useBloodPressure(
  explicitScope?: PatientScope | null,
  days: number = BP_WINDOW_DAYS,
) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  /* The window's last day is today, on the member's own calendar. */
  const window = useMemo(() => lastDays(days), [days]);
  const featureKey = scopedKey(scope, "blood-pressure");

  const list = usePagedList({
    scope,
    queryKey: scopedKey(scope, "blood-pressure", "list", window),
    params: { ...window, limit: 150 },
    fetch: listReadings,
    map: fromApiReading,
  });

  const summary = useQuery({
    queryKey: scopedKey(scope, "blood-pressure", "summary", window),
    queryFn: () => getSummary(requireScope(scope), window),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: featureKey });

  const create = useMutation({
    mutationFn: async ({
      draft,
      photo,
    }: {
      draft: BpDraft;
      photo?: PhotoChange;
    }) => {
      const target = requireScope(scope);
      const photoFileId = await photoIdFor(photo);
      return createReading(
        target,
        toReadingBody(draft, photoFileId ?? undefined),
      );
    },
    onSuccess: refresh,
  });
  const change = useMutation({
    mutationFn: async ({
      id,
      draft,
      photo,
    }: {
      id: string;
      draft: BpDraft;
      photo?: PhotoChange;
    }) => {
      const target = requireScope(scope);
      const photoFileId = await photoIdFor(photo);
      return updateReading(target, id, toReadingBody(draft, photoFileId));
    },
    onSuccess: refresh,
  });
  const drop = useMutation({
    mutationFn: (id: string) => removeReading(requireScope(scope), id),
    onSuccess: refresh,
  });

  const { mutateAsync: createAsync } = create;
  const { mutateAsync: changeAsync } = change;
  const { mutate: dropMutate } = drop;

  return {
    readings: list.items,
    list,
    window,
    summary: summary.data ?? null,
    summaryPending: summary.isPending,
    summaryError: summary.error,
    isPending: list.isPending,
    error: list.error,
    isError: list.isError,
    refetch: () => {
      list.refetch();
      void summary.refetch();
    },
    saveError: create.error ?? change.error ?? drop.error,
    isSaving: create.isPending || change.isPending || drop.isPending,
    add: useCallback(
      (draft: BpDraft, photo?: PhotoChange) => createAsync({ draft, photo }),
      [createAsync],
    ),
    update: useCallback(
      (id: string, draft: BpDraft, photo?: PhotoChange) =>
        changeAsync({ id, draft, photo }),
      [changeAsync],
    ),
    remove: useCallback((id: string) => dropMutate(id), [dropMutate]),
    /** The reading's photo link, fetched when the member opens it. */
    photoLink: useCallback(
      (id: string) => photoLink(requireScope(scope), id),
      [scope],
    ),
  };
}
