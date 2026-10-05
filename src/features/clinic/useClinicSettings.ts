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
  const user = useOptionalAuth()?.user;
  /* The stored profile is the dialysis center's. Another office reading
     the clinic pages it shares (the nephrology office) sees its own name
     on them — billing, reports — rather than the dialysis center's. */
  const org = organizationFor(user);
  const stored = query.data;
  const settings = useMemo(() => {
    const base = stored ?? defaultClinicSettings();
    return org && org.portal !== "clinic"
      ? { ...base, profile: { ...base.profile, name: org.name } }
      : base;
  }, [stored, org]);

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
