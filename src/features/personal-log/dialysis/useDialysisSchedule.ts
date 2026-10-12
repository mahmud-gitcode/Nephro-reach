"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import {
  DEFAULT_DURATION_MINUTES,
  appendSchedulePeriod,
  normaliseSchedulePeriod,
  type SchedulePeriod,
} from "./schedule";

/* ==========================================================================
   The member's dialysis schedule — stored
   --------------------------------------------------------------------------
   It lived in the Dialysis Management page's state, so a changed run time
   was gone on the next visit (client, 2026-10-12: "I saved it… what did
   that do?"). Stored now, and the treatment log reads the same schedule to
   offer the sessions a member can chart.
   ========================================================================== */

const KEY = storageKey("dialysis-schedule");
export const scheduleKey = ["dialysis", "schedule"] as const;

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

async function readSchedule(): Promise<SchedulePeriod[]> {
  const stored = await readJson<unknown>(KEY, null);
  if (!Array.isArray(stored) || stored.length === 0) return DEFAULT_SCHEDULE;
  const periods = stored
    .filter(
      (p): p is SchedulePeriod =>
        !!p && typeof p === "object" && typeof p.fromKey === "string",
    )
    .map((p) => normaliseSchedulePeriod(p));
  return periods.length > 0 ? periods : DEFAULT_SCHEDULE;
}

export function useDialysisSchedule() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: scheduleKey, queryFn: readSchedule });
  const write = useMutation({
    mutationFn: async (period: SchedulePeriod) =>
      writeJson(KEY, appendSchedulePeriod(await readSchedule(), period)),
    onSuccess: (periods) => queryClient.setQueryData(scheduleKey, periods),
  });
  const periods = useMemo(() => query.data ?? DEFAULT_SCHEDULE, [query.data]);
  const { mutate } = write;
  return {
    periods,
    isPending: query.isPending,
    /** Appends a dated period: past treatments keep their schedule. */
    append: useCallback((period: SchedulePeriod) => mutate(period), [mutate]),
  };
}
