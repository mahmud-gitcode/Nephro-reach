"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  defaultClinicSettings,
  readClinicSettings,
  writeClinicSettings,
  type ClinicSettings,
} from "./settings.data";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import { organizationFor } from "@/features/staff/staff";

export const clinicSettingsKey = ["clinic", "settings"] as const;

/** The office's profile, notification choices and portal preferences. */
export function useClinicSettings() {
  const queryClient = useQueryClient();
  const user = useOptionalAuth()?.user;
  /* Each office reads and saves its own record: the nephrology office's
     on-call phone and hours must never overwrite the dialysis center's.
     A member (no organization) reads the dialysis center's, whose hours
     drive the after-hours reply on their messages. */
  const org = organizationFor(user);
  const queryKey = useMemo(
    () => [...clinicSettingsKey, org?.id ?? "clinic"],
    [org?.id],
  );

  const query = useQuery({
    queryKey,
    queryFn: () => readClinicSettings(org),
  });

  const write = useMutation({
    mutationFn: (settings: ClinicSettings) =>
      writeClinicSettings(settings, org),
    onSuccess: (settings) => queryClient.setQueryData(queryKey, settings),
  });

  const { mutate } = write;
  const stored = query.data;
  const settings = useMemo(
    () => stored ?? defaultClinicSettings(org),
    [stored, org],
  );

  return {
    settings,
    /* Each section saves only itself, on top of what is stored — a toggle
       flipped while the profile form holds unsaved edits must not save
       those edits along with it. */
    update: useCallback(
      (change: Partial<ClinicSettings>) =>
        mutate({
          ...(queryClient.getQueryData<ClinicSettings>(queryKey) ??
            defaultClinicSettings(org)),
          ...change,
        }),
      [mutate, queryClient, queryKey, org],
    ),

    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    saveError: write.error,
    isSaving: write.isPending,
  };
}
