"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import {
  addClass,
  defaultLiveClassActions,
  duplicateClass,
  normaliseLiveClassActions,
  removeClass,
  setClassStatus,
  sortClasses,
  updateClass,
  upcomingFrom,
  type ClassDraft,
  type ClassStatus,
  type LiveClassActions,
  type SettingId,
  type SettingValues,
} from "./liveClass.actions";

/* ==========================================================================
   Live Class — local state for the page's actions
   --------------------------------------------------------------------------
   One key for the schedule, the recording links and the six settings
   panels. They are all the same record — how this office runs its classes.
   ========================================================================== */

const ACTIONS_KEY = storageKey("clinic-live-class");
const QUERY_KEY = ["clinic-live-class"];

async function readActions(): Promise<LiveClassActions> {
  return normaliseLiveClassActions(await readJson<unknown>(ACTIONS_KEY, null));
}

/** Today as yyyy-mm-dd in the office's own timezone, not UTC. */
function todayIso(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function useLiveClasses() {
  const queryClient = useQueryClient();

  const actionsQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: readActions,
  });

  const write = useMutation({
    mutationFn: async (
      transform: (current: LiveClassActions) => LiveClassActions,
    ) => {
      const next = transform(await readActions());
      return writeJson(ACTIONS_KEY, {
        ...next,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: (actions) => queryClient.setQueryData(QUERY_KEY, actions),
  });

  const actions = actionsQuery.data ?? defaultLiveClassActions();
  const { mutate } = write;
  const today = todayIso();

  const onClasses = useCallback(
    (
      transform: (
        classes: LiveClassActions["classes"],
      ) => LiveClassActions["classes"],
    ) =>
      mutate((current) => ({
        ...current,
        classes: transform(current.classes),
      })),
    [mutate],
  );

  return {
    today,
    classes: useMemo(() => sortClasses(actions.classes), [actions.classes]),
    /** Still to come and not called off — what the table shows. */
    upcoming: useMemo(
      () => upcomingFrom(actions.classes, today),
      [actions.classes, today],
    ),
    recordings: actions.recordings,
    settings: actions.settings,

    addClass: useCallback(
      (draft: ClassDraft) => onClasses((current) => addClass(current, draft)),
      [onClasses],
    ),
    updateClass: useCallback(
      (id: string, draft: ClassDraft) =>
        onClasses((current) => updateClass(current, id, draft)),
      [onClasses],
    ),
    setStatus: useCallback(
      (id: string, status: ClassStatus) =>
        onClasses((current) => setClassStatus(current, id, status)),
      [onClasses],
    ),
    duplicate: useCallback(
      (id: string) => onClasses((current) => duplicateClass(current, id)),
      [onClasses],
    ),
    remove: useCallback(
      (id: string) => onClasses((current) => removeClass(current, id)),
      [onClasses],
    ),

    setRecording: useCallback(
      (title: string, url: string) =>
        mutate((current) => {
          const recordings = { ...current.recordings };
          /* Clearing the box removes the link rather than storing "" —
             an empty string would render an Open button that goes nowhere. */
          if (url.trim()) recordings[title] = url.trim();
          else delete recordings[title];

          return { ...current, recordings };
        }),
      [mutate],
    ),

    setSetting: useCallback(
      (id: SettingId, values: SettingValues) =>
        mutate((current) => ({
          ...current,
          settings: { ...current.settings, [id]: values },
        })),
      [mutate],
    ),

    isPending: actionsQuery.isPending,
    error: actionsQuery.error,
    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
  };
}

export type LiveClassesLog = ReturnType<typeof useLiveClasses>;
