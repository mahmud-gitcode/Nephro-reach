"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  defaultClinicSettings,
  readClinicSettings,
  writeClinicSettings,
  type ClinicSettings,
} from "./settings.data";

export const clinicSettingsKey = ["clinic", "settings"] as const;

/** The office's profile, notification choices and portal preferences. */
export function useClinicSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: clinicSettingsKey,
    queryFn: readClinicSettings,
  });

  const write = useMutation({
    mutationFn: writeClinicSettings,
    onSuccess: (settings) =>
      queryClient.setQueryData(clinicSettingsKey, settings),
  });

  const { mutate } = write;
  const settings = query.data ?? defaultClinicSettings();

  return {
    settings,
    /* Each section saves only itself, on top of what is stored — a toggle
       flipped while the profile form holds unsaved edits must not save
       those edits along with it. */
    update: useCallback(
      (change: Partial<ClinicSettings>) =>
        mutate({
          ...(queryClient.getQueryData<ClinicSettings>(clinicSettingsKey) ??
            defaultClinicSettings()),
          ...change,
        }),
      [mutate, queryClient],
    ),

    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    saveError: write.error,
    isSaving: write.isPending,
  };
}
