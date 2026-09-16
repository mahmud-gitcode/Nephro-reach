"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listClinicNotices,
  saveClinicNotices,
} from "./clinicNotice.repository";
import * as rules from "./clinicNotice.rules";
import type { BetweenTreatmentCheckIn } from "./checkIn.types";
import type { ClinicNotice } from "./clinicNotice.types";

export const clinicNoticesKey = ["personal-log", "clinic-notices"] as const;

/**
 * Every day the member has asked to send to their clinic.
 *
 * Same read-modify-write shape as `useCheckIns`: a save applies to what is
 * actually stored, so two tabs open on the same log cannot lose a notice.
 */
export function useClinicNotices() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: clinicNoticesKey,
    queryFn: listClinicNotices,
  });

  const write = useMutation({
    mutationFn: async (
      transform: (current: ClinicNotice[]) => ClinicNotice[],
    ) => saveClinicNotices(transform(await listClinicNotices())),
    onSuccess: (notices) => queryClient.setQueryData(clinicNoticesKey, notices),
  });

  const { mutate, reset } = write;
  const notices = useMemo(() => query.data ?? [], [query.data]);

  /**
   * Raise a notice for this day, or withdraw the one already queued.
   *
   * Every ordinary save comes through here, so the two cases that change
   * nothing return early: saving a day nobody asked to send, and re-saving
   * one the clinic already has. Writing either would put a storage failure
   * banner in front of a member who did not ask for anything to be sent.
   */
  const setNotify = useCallback(
    (entry: BetweenTreatmentCheckIn, notify: boolean) => {
      const existing = rules.findNotice(notices, entry.date);
      if (!notify && !existing) return;
      if (notify && existing && rules.isDelivered(existing)) return;

      mutate((current) =>
        notify
          ? rules.upsertNotice(current, rules.buildNotice(entry))
          : rules.withdrawNotice(current, entry.date),
      );
    },
    [mutate, notices],
  );

  /** A day the member deleted takes its notice with it. */
  const dropNotice = useCallback(
    (checkInDate: string) =>
      mutate((current) => rules.removeNotice(current, checkInDate)),
    [mutate],
  );

  const getByDate = useCallback(
    (checkInDate: string) => rules.findNotice(notices, checkInDate),
    [notices],
  );

  return {
    notices,
    pending: useMemo(() => rules.pendingNotices(notices), [notices]),

    getByDate,
    setNotify,
    dropNotice,

    isPending: query.isPending,
    error: query.error,
    /* A notice that failed to save is worth surfacing loudly: the member
       has just been told their clinic will hear about a missed treatment. */
    saveError: write.error,
    dismissSaveError: reset,
    isSaving: write.isPending,
  };
}
