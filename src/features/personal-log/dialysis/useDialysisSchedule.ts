"use client";

/* ==========================================================================
   The member's dialysis schedule, from the API (Phase 7)
   --------------------------------------------------------------------------
   `GET /patients/:id/dialysis/schedule` returns every dated period; saving
   a week appends one (`POST`), and the server replaces the periods from its
   start day on, so past treatments keep the schedule they were run on.

   The typical week (`DEFAULT_SCHEDULE`) shows only after a SUCCESSFUL read
   that returned no period, flagged `isDefault` so screens can say it is a
   suggestion. It is never saved implicitly, never shown for a failed read
   or a 403 (ADR 0007 §5), and its placeholder start day is never sent.
   Whether the member may change it is the prescription's `memberCanEdit`.
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { DEFAULT_DURATION_MINUTES, type SchedulePeriod } from "./schedule";
import { fromApiSchedule, toSchedulePeriodBody } from "./schedule.mapper";
import { addSchedulePeriod, listSchedulePeriods } from "./dialysis.repository";

export const SCHEDULE_FEATURE = "dialysis-schedule";

export function scheduleKey(scope: PatientScope | null) {
  return scopedKey(scope, SCHEDULE_FEATURE);
}

/** A typical week: Monday, Wednesday and Friday, four hours at 5:30 AM. */
export const DEFAULT_SCHEDULE: SchedulePeriod[] = [
  {
    fromKey: "0000-01-01",
    days: ["Monday", "Wednesday", "Friday"],
    chairTimes: { Monday: "05:30", Wednesday: "05:30", Friday: "05:30" },
    reminderLeadMinutes: 90,
    durations: {
      Monday: DEFAULT_DURATION_MINUTES,
      Wednesday: DEFAULT_DURATION_MINUTES,
      Friday: DEFAULT_DURATION_MINUTES,
    },
  },
];

const NO_PERIODS: SchedulePeriod[] = [];

export function useDialysisSchedule(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const queryKey = scheduleKey(scope);

  const query = useQuery({
    queryKey,
    queryFn: async () =>
      fromApiSchedule(await listSchedulePeriods(requireScope(scope))),
  });

  const write = useMutation({
    mutationFn: (period: SchedulePeriod) =>
      addSchedulePeriod(requireScope(scope), toSchedulePeriodBody(period)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  /* The suggestion only after a successful, empty read. */
  const isDefault = query.isSuccess && query.data.length === 0;
  const periods = useMemo(
    () =>
      query.isSuccess
        ? isDefault
          ? DEFAULT_SCHEDULE
          : query.data
        : NO_PERIODS,
    [query.isSuccess, query.data, isDefault],
  );

  const { mutate, mutateAsync } = write;
  return {
    periods,
    /** True when `periods` is the typical week, not the member's own. */
    isDefault,
    isPending: query.isPending,
    error: query.error,
    isError: query.isError,
    refetch: () => void query.refetch(),
    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
    /** Appends a dated period: past treatments keep their schedule. */
    append: useCallback((period: SchedulePeriod) => mutate(period), [mutate]),
    /** The same, resolving once the server has it (rejects on refusal). */
    appendAsync: useCallback(
      (period: SchedulePeriod) => mutateAsync(period),
      [mutateAsync],
    ),
  };
}
