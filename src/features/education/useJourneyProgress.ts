"use client";

import { useCallback, useMemo, useRef } from "react";
import { useClassroom } from "./classroom";
import * as rules from "./journey.rules";
import { useLearnerCourse } from "./useLearnerCourse";

export type {
  JourneyDayProgress,
  JourneyDayStatus,
  JourneyProgressMap,
} from "./journey.types";

/** Send the watched percent on 10-point steps, and at the finish line. */
const WATCH_STEP = 10;
const WATCH_DONE = 95;

/** Whether a new watched percent is worth a request, given the last one
 *  sent (or saved) for that class. */
export function shouldSendWatched(last: number, next: number): boolean {
  const capped = Math.max(0, Math.min(100, Math.round(next)));
  if (capped <= last) return false;
  if (capped >= WATCH_DONE && last < WATCH_DONE) return true;
  return Math.floor(capped / WATCH_STEP) > Math.floor(last / WATCH_STEP);
}

/**
 * Which journey days the patient has watched or completed, from the
 * server's learner record (Phase 13). One cached read for every component
 * that asks. Each change is one server call for one class:
 *   unlockDay -> open, recordWatched -> watched (throttled: 10-point steps
 *   and 95 %; the server completes a lesson at 95 % once its activities
 *   are answered), markComplete -> complete, markIncomplete -> reopen.
 * Course percent and the next day are the server's.
 */
export function useJourneyProgress<T extends { slug: string }>(
  /** Kept for the callers' shape; the lessons come from the course. */
  days?: readonly T[],
) {
  const classroom = useClassroom();
  const learner = useLearnerCourse(classroom.course);
  const lessons = classroom.lessons;
  const { progress } = learner;
  const ordered = (days ?? lessons) as readonly { slug: string }[];

  const classIdOf = useCallback(
    (slug: string) => lessons.find((lesson) => lesson.slug === slug)?.classId,
    [lessons],
  );

  const { mutate } = learner.classCall;
  const sentRef = useRef<Record<string, number>>({});
  const canWrite = learner.canWrite;

  const call = useCallback(
    (
      action: "open" | "watched" | "complete" | "reopen",
      slug: string,
      percent?: number,
    ) => {
      const classId = classIdOf(slug);
      if (!classId || !canWrite) return;
      mutate({ action, classId, percent });
    },
    [classIdOf, mutate, canWrite],
  );

  const unlockDay = useCallback((slug: string) => call("open", slug), [call]);
  const markComplete = useCallback(
    (slug: string) => call("complete", slug),
    [call],
  );
  const markIncomplete = useCallback(
    (slug: string) => call("reopen", slug),
    [call],
  );

  /* The player reports every second; only steps go to the server. */
  const recordWatched = useCallback(
    (slug: string, percent: number) => {
      const saved = rules.dayProgress(progress, slug);
      if (saved.status === "completed") return;
      const last = Math.max(saved.percent, sentRef.current[slug] ?? 0);
      if (!shouldSendWatched(last, percent)) return;
      sentRef.current[slug] = Math.round(percent);
      call("watched", slug, Math.min(100, percent));
    },
    [call, progress],
  );

  const getDayProgress = useCallback(
    (slug: string) => rules.dayProgress(progress, slug),
    [progress],
  );

  const nextDay = useMemo(() => {
    const next = learner.nextClassId
      ? lessons.find((lesson) => lesson.classId === learner.nextClassId)
      : undefined;
    /* Everything done: "continue" stays on the last day, as before. */
    return (next ?? (learner.nextClassId ? undefined : lessons.at(-1))) as
      (T & (typeof lessons)[number]) | undefined;
  }, [lessons, learner.nextClassId]);

  return {
    progress,
    getProgress: getDayProgress,
    unlockDay,
    markComplete,
    markIncomplete,
    recordWatched,
    completedCount: rules.completedCount(progress, ordered),
    overallPercent: learner.percent,
    nextDay,
    hasStarted: rules.hasStarted(progress, ordered),
    access: learner.access,
    canWrite,

    isPending: classroom.isPending || learner.isPending,
    error: classroom.error ?? learner.error,
    refetch: () => {
      classroom.refetch();
      learner.refetch();
    },
    /* A failed write is worth surfacing: a member who finished a lesson and
       was not recorded will come back to find it unfinished. */
    saveError: learner.classCall.error,
  };
}
