"use client";

/* ==========================================================================
   Between-treatment check-ins, from the API (Phase 5)
   --------------------------------------------------------------------------
   A 90-day window, one full page, "load more" when there is more. Saving a
   day: PUT by its id when the day is already written, POST otherwise; a
   POST answered 409 `check_ins.check_in_exists` (written meanwhile, e.g.
   on another device) re-reads that day and saves it as a PUT once, so
   re-saving the same day never ends in a 409. The clinic notice is the
   server's, read back on each check-in. Deleting a day whose notice the
   clinic already received keeps that notice; the server's sentence says
   so and the page shows it.
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isApiError } from "@/lib/api/client";
import { lastDays } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { usePagedList } from "@/features/profile/usePagedList";
import {
  fromApiCheckIn,
  noticeFromApi,
  toCheckInBody,
  type ApiCheckIn,
} from "./checkIn.mapper";
import {
  createCheckIn,
  findCheckInOn,
  listCheckIns,
  removeCheckIn,
  updateCheckIn,
} from "./checkIn.repository";
import * as rules from "./checkIn.rules";
import type { BetweenTreatmentCheckIn } from "./checkIn.types";
import type { ClinicNotice } from "./clinicNotice.types";

export const CHECK_IN_WINDOW_DAYS = 90;
export const CHECK_IN_EXISTS = "check_ins.check_in_exists";

const identity = (row: ApiCheckIn) => row;

export function useCheckIns(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const window = useMemo(() => lastDays(CHECK_IN_WINDOW_DAYS), []);
  const featureKey = scopedKey(scope, "check-ins");

  const read = usePagedList({
    scope,
    queryKey: scopedKey(scope, "check-ins", "list", window),
    params: { ...window, limit: 150 },
    fetch: listCheckIns,
    map: identity,
  });
  const rows = read.items;

  const refresh = () => queryClient.invalidateQueries({ queryKey: featureKey });

  const write = useMutation({
    mutationFn: async ({
      entry,
      notifyClinic,
    }: {
      entry: BetweenTreatmentCheckIn;
      notifyClinic: boolean;
    }) => {
      const target = requireScope(scope);
      const body = toCheckInBody(entry, notifyClinic);
      const known =
        entry.id ?? rows.find((row) => row.checkInDate === entry.date)?.id;
      if (known) return updateCheckIn(target, known, body);
      try {
        return await createCheckIn(target, entry.date, body);
      } catch (error) {
        if (!isApiError(error, { status: 409, code: CHECK_IN_EXISTS }))
          throw error;
        /* Written meanwhile: save over that day once. */
        const existing = await findCheckInOn(target, entry.date);
        if (!existing) throw error;
        return updateCheckIn(target, existing.id, body);
      }
    },
    onSettled: refresh,
  });

  const drop = useMutation({
    mutationFn: (id: string) => removeCheckIn(requireScope(scope), id),
    onSuccess: refresh,
  });

  const { mutate, reset } = write;
  const { mutate: dropMutate } = drop;

  const entries = useMemo(() => rows.map(fromApiCheckIn), [rows]);
  const notices = useMemo(
    () =>
      rows
        .map(noticeFromApi)
        .filter((notice): notice is ClinicNotice => notice !== null),
    [rows],
  );

  const saveCheckIn = useCallback(
    (
      entry: BetweenTreatmentCheckIn,
      notifyClinic: boolean,
      onSaved?: () => void,
    ) => mutate({ entry, notifyClinic }, { onSuccess: () => onSaved?.() }),
    [mutate],
  );

  /** Deletes the day; `onDone` receives the server's sentence. */
  const deleteCheckIn = useCallback(
    (date: string, onDone?: (message: string) => void) => {
      const id = rows.find((row) => row.checkInDate === date)?.id;
      if (!id) return;
      dropMutate(id, { onSuccess: (message) => onDone?.(message) });
    },
    [dropMutate, rows],
  );

  const getByDate = useCallback(
    (date: string) => rules.findByDate(entries, date),
    [entries],
  );

  return {
    entries: useMemo(() => rules.sortByDate(entries), [entries]),
    summary: useMemo(() => rules.summarise(entries), [entries]),
    recentDays: useMemo(() => rules.recentDays(entries), [entries]),
    /** The server's clinic notices, one per check-in that has one. */
    notices,
    read,

    getByDate,
    saveCheckIn,
    deleteCheckIn,

    isPending: read.isPending,
    error: read.error,
    refetch: read.refetch,
    /* A check-in that failed to save is worth surfacing: the member has
       just described feeling unwell and would otherwise assume it landed. */
    saveError: write.error ?? drop.error,
    dismissSaveError: () => {
      reset();
      drop.reset();
    },
    isSaving: write.isPending || drop.isPending,
  };
}
