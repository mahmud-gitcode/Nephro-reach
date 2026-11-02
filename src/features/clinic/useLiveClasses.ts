"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toDay } from "@/lib/api/paging";
import { platformKey } from "@/lib/data/queryKeys";
import {
  createLiveClass,
  deleteLiveClass,
  getLiveClassSettings,
  listLiveSchedule,
  listPlatformLiveClasses,
  putLiveClassSettings,
  updateLiveClass,
} from "@/features/education/liveClasses.repository";
import {
  defaultSettings,
  duplicateDraft,
  pastClasses,
  sortClasses,
  upcomingFrom,
  type ClassDraft,
  type ClassStatus,
  type ManagedClass,
  type SettingId,
  type SettingValues,
} from "./liveClass.actions";
import {
  fromApiLiveClass,
  settingsFromApi,
  settingToApi,
  statusToApi,
  toLiveClassBody,
} from "./liveClass.mappers";

/* ==========================================================================
   Live Class — the schedule, recordings and settings, from the API
   --------------------------------------------------------------------------
   NephroReach hosts every live class (client, 2026-10-06).
   - `manage` (the NephroReach team, platform `content`): the full list in
     a window around today (with meeting links, attendance and ratings),
     and one call per create, edit, status change, copy, delete, recording
     link and settings card. The server refuses anyone else.
   - Otherwise (an office, D13 open: read-only): the published schedule,
     upcoming and past, with no meeting links and no actions.
   Nothing is kept in this browser.
   ========================================================================== */

/** The managed window: four months back (recordings) and six ahead. */
const WINDOW_BACK_DAYS = 120;
const WINDOW_AHEAD_DAYS = 183;
const PAGE = { limit: 150 } as const;

function windowAround(today: Date) {
  const from = new Date(today);
  from.setDate(from.getDate() - WINDOW_BACK_DAYS);
  from.setHours(0, 0, 0, 0);
  const to = new Date(today);
  to.setDate(to.getDate() + WINDOW_AHEAD_DAYS);
  to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

export const LIVE_SCHEDULE_KEY = ["education", "live-schedule"] as const;

export function useLiveClasses({ manage = false }: { manage?: boolean } = {}) {
  const queryClient = useQueryClient();
  const today = toDay(new Date());

  const platformList = useQuery({
    queryKey: platformKey("live-classes", today),
    queryFn: () => listPlatformLiveClasses(windowAround(new Date()), PAGE),
    enabled: manage,
  });
  const settingsQuery = useQuery({
    queryKey: platformKey("live-class-settings"),
    queryFn: getLiveClassSettings,
    enabled: manage,
  });
  const upcomingQuery = useQuery({
    queryKey: [...LIVE_SCHEDULE_KEY, "upcoming"],
    queryFn: () => listLiveSchedule("upcoming", { limit: 50 }),
    enabled: !manage,
  });
  const pastQuery = useQuery({
    queryKey: [...LIVE_SCHEDULE_KEY, "past"],
    queryFn: () => listLiveSchedule("past", { limit: 50 }),
    enabled: !manage,
  });

  const classes = useMemo(() => {
    const rows = manage
      ? (platformList.data?.items ?? [])
      : [
          ...(upcomingQuery.data?.items ?? []),
          ...(pastQuery.data?.items ?? []),
        ];
    const seen = new Set<string>();
    return sortClasses(
      rows
        .filter((row) => !seen.has(row.id) && seen.add(row.id))
        .map(fromApiLiveClass),
    );
  }, [manage, platformList.data, upcomingQuery.data, pastQuery.data]);

  const recordings = useMemo(() => {
    const out: Record<string, string> = {};
    for (const item of classes)
      if (item.recordingUrl) out[item.id] = item.recordingUrl;
    return out;
  }, [classes]);

  const settings = useMemo(
    () => settingsFromApi(settingsQuery.data ?? [], defaultSettings()),
    [settingsQuery.data],
  );

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: platformKey("live-classes") }),
      queryClient.invalidateQueries({ queryKey: LIVE_SCHEDULE_KEY }),
    ]);

  const write = useMutation({
    mutationFn: async (
      action:
        | { kind: "create"; draft: ClassDraft }
        | { kind: "update"; id: string; draft: ClassDraft }
        | { kind: "status"; id: string; status: ClassStatus }
        | { kind: "remove"; id: string }
        | { kind: "recording"; id: string; url: string },
    ) => {
      if (action.kind === "create")
        return createLiveClass(toLiveClassBody(action.draft, "create"));
      if (action.kind === "update")
        return updateLiveClass(
          action.id,
          toLiveClassBody(action.draft, "update"),
        );
      if (action.kind === "status")
        return updateLiveClass(action.id, {
          status: statusToApi(action.status),
        });
      if (action.kind === "recording")
        return updateLiveClass(action.id, {
          /* Clearing the box removes the link rather than storing "". */
          recordingUrl: action.url.trim() || null,
        });
      return deleteLiveClass(action.id);
    },
    onSuccess: refresh,
  });

  const settingWrite = useMutation({
    mutationFn: ({ id, values }: { id: SettingId; values: SettingValues }) =>
      putLiveClassSettings(settingToApi(id, values)),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: platformKey("live-class-settings"),
      }),
  });

  const { mutate } = write;
  const { mutate: mutateSetting } = settingWrite;
  const byId = useCallback(
    (id: string): ManagedClass | undefined =>
      classes.find((item) => item.id === id),
    [classes],
  );

  const reads = manage
    ? [platformList, settingsQuery]
    : [upcomingQuery, pastQuery];

  return {
    today,
    classes,
    /** Still to come and not called off — what the table shows. */
    upcoming: useMemo(() => upcomingFrom(classes, today), [classes, today]),
    /** Classes that have taken place — each can carry a recording. */
    past: useMemo(() => pastClasses(classes, today), [classes, today]),
    recordings,
    settings,

    addClass: useCallback(
      (draft: ClassDraft) => mutate({ kind: "create", draft }),
      [mutate],
    ),
    updateClass: useCallback(
      (id: string, draft: ClassDraft) => mutate({ kind: "update", id, draft }),
      [mutate],
    ),
    setStatus: useCallback(
      (id: string, status: ClassStatus) =>
        mutate({ kind: "status", id, status }),
      [mutate],
    ),
    /** One new class, a week later, closed for registration. */
    duplicate: useCallback(
      (id: string) => {
        const source = byId(id);
        if (source) mutate({ kind: "create", draft: duplicateDraft(source) });
      },
      [byId, mutate],
    ),
    /** The server refuses (409) once members registered: cancel instead. */
    remove: useCallback(
      (id: string) => mutate({ kind: "remove", id }),
      [mutate],
    ),
    setRecording: useCallback(
      (id: string, url: string) => mutate({ kind: "recording", id, url }),
      [mutate],
    ),
    setSetting: useCallback(
      (id: SettingId, values: SettingValues) => mutateSetting({ id, values }),
      [mutateSetting],
    ),

    isPending: reads.some((read) => read.isPending),
    error: reads.find((read) => read.error)?.error ?? null,
    refetch: () => {
      for (const read of reads) void read.refetch();
    },
    isSaving: write.isPending || settingWrite.isPending,
    saveError: write.error ?? settingWrite.error,
    dismissSaveError: () => {
      write.reset();
      settingWrite.reset();
    },
  };
}

export type LiveClassesLog = ReturnType<typeof useLiveClasses>;
