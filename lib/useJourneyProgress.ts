"use client";

import { useCallback, useMemo, useState } from "react";
import { JOURNEY_DAYS, TOTAL_JOURNEY_DAYS } from "@/lib/dialysisJourneyData";

export type JourneyDayStatus = "not-started" | "in-progress" | "completed";

export interface JourneyDayProgress {
  status: JourneyDayStatus;
  /** 0-100. How far through the lesson video the learner reached. */
  percent: number;
  updatedAt: string;
}

export type JourneyProgressMap = Record<string, JourneyDayProgress>;

const STORAGE_KEY = "nephroreach_journey_progress";

const EMPTY_PROGRESS: JourneyDayProgress = {
  status: "not-started",
  percent: 0,
  updatedAt: "",
};

function readStoredProgress(): JourneyProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as JourneyProgressMap;
  } catch {
    return {};
  }
}

function persistProgress(next: JourneyProgressMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private window, blocked site data). Progress
    // still works for the current session rather than breaking the page.
  }
}

/**
 * Tracks which of the 21 journey days a member has watched or completed.
 *
 * Backed by localStorage so it survives a refresh. Mount it once per page and
 * pass the pieces down — the day list and the player both read from one copy.
 */
export function useJourneyProgress() {
  const [progress, setProgress] = useState<JourneyProgressMap>(readStoredProgress);

  const update = useCallback(
    (slug: string, patch: Partial<JourneyDayProgress>) => {
      setProgress((current) => {
        const existing = current[slug] ?? EMPTY_PROGRESS;
        const next: JourneyProgressMap = {
          ...current,
          [slug]: {
            ...existing,
            ...patch,
            updatedAt: new Date().toISOString(),
          },
        };
        persistProgress(next);
        return next;
      });
    },
    [],
  );

  const getProgress = useCallback(
    (slug: string): JourneyDayProgress => progress[slug] ?? EMPTY_PROGRESS,
    [progress],
  );

  const markComplete = useCallback(
    (slug: string) => update(slug, { status: "completed", percent: 100 }),
    [update],
  );

  const markIncomplete = useCallback(
    (slug: string) => update(slug, { status: "in-progress", percent: 0 }),
    [update],
  );

  /** Raises the watched percentage; never walks it backwards on a rewatch. */
  const recordWatched = useCallback(
    (slug: string, percent: number) => {
      const capped = Math.max(0, Math.min(100, Math.round(percent)));
      setProgress((current) => {
        const existing = current[slug] ?? EMPTY_PROGRESS;
        if (existing.status === "completed" || capped <= existing.percent) {
          return current;
        }
        const next: JourneyProgressMap = {
          ...current,
          [slug]: {
            status: capped >= 95 ? "completed" : "in-progress",
            percent: capped,
            updatedAt: new Date().toISOString(),
          },
        };
        persistProgress(next);
        return next;
      });
    },
    [],
  );

  const completedCount = useMemo(
    () =>
      JOURNEY_DAYS.filter((day) => progress[day.slug]?.status === "completed")
        .length,
    [progress],
  );

  const overallPercent = useMemo(
    () => Math.round((completedCount / TOTAL_JOURNEY_DAYS) * 100),
    [completedCount],
  );

  /** The first day not yet finished — what the "continue" button points at. */
  const nextDay = useMemo(
    () =>
      JOURNEY_DAYS.find((day) => progress[day.slug]?.status !== "completed") ??
      JOURNEY_DAYS[JOURNEY_DAYS.length - 1],
    [progress],
  );

  const hasStarted = useMemo(
    () => JOURNEY_DAYS.some((day) => progress[day.slug]?.status),
    [progress],
  );

  return {
    progress,
    getProgress,
    markComplete,
    markIncomplete,
    recordWatched,
    completedCount,
    overallPercent,
    nextDay,
    hasStarted,
  };
}
