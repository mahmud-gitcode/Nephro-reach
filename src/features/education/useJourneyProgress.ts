"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProgress, saveProgress } from "./journey.repository";
import * as rules from "./journey.rules";
import type { JourneyProgressMap } from "./journey.types";

export type {
  JourneyDayProgress,
  JourneyDayStatus,
  JourneyProgressMap,
} from "./journey.types";

export const journeyProgressKey = ["education", "journey-progress"] as const;

/**
 * Which of the 21 journey days a member has watched or completed.
 *
 * This hook used to hold its own `useState`, which meant two components
 * mounting it held two copies that drifted apart — the day list and the
 * player each had their own idea of what was finished. One cache, one
 * answer, however many components ask.
 *
 * The rules live in journey.rules.ts as pure functions; this file only moves
 * data between them, storage and the screen.
 */
export function useJourneyProgress<T extends { slug: string }>(
  /** The course's lessons, in order. Defaults to the 21-day journey. */
  days?: readonly T[],
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: journeyProgressKey,
    queryFn: getProgress,
  });

  /* Each change is read-modify-write against storage rather than against the
     cache, so it applies to what is actually saved. With a real API this
     becomes the request body, and the conflict it implies becomes the
     server's to resolve. */
  const write = useMutation({
    mutationFn: async (
      transform: (current: JourneyProgressMap) => JourneyProgressMap,
    ) => saveProgress(transform(await getProgress())),
    onSuccess: (progress) =>
      queryClient.setQueryData(journeyProgressKey, progress),
  });

  const { mutate } = write;
  /* `?? {}` on its own would hand out a new empty object every render, and
     everything derived from it would recompute with it. */
  const progress = useMemo(() => query.data ?? {}, [query.data]);

  const unlockDay = useCallback(
    (slug: string) => mutate((current) => rules.unlockDay(current, slug)),
    [mutate],
  );

  const markComplete = useCallback(
    (slug: string) =>
      mutate((current) => rules.markComplete(current, slug, new Date(), days)),
    [mutate, days],
  );

  const markIncomplete = useCallback(
    (slug: string) => mutate((current) => rules.markIncomplete(current, slug)),
    [mutate],
  );

  /* `canComplete` is false while the lesson still has questions to
     answer, so watching to the end does not finish it on its own. */
  const recordWatched = useCallback(
    (slug: string, percent: number, canComplete = true) =>
      mutate((current) =>
        rules.recordWatched(current, slug, percent, new Date(), canComplete),
      ),
    [mutate],
  );

  const getDayProgress = useCallback(
    (slug: string) => rules.dayProgress(progress, slug),
    [progress],
  );

  return {
    progress,
    getProgress: getDayProgress,
    unlockDay,
    markComplete,
    markIncomplete,
    recordWatched,
    completedCount: rules.completedCount(progress, days),
    overallPercent: rules.overallPercent(progress, days),
    nextDay: days ? rules.nextDay(progress, days) : undefined,
    hasStarted: rules.hasStarted(progress, days),

    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    /* A failed write is worth surfacing: a member who finished a lesson and
       was not recorded will come back to find it unfinished. */
    saveError: write.error,
  };
}
