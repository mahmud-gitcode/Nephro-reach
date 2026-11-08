"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgKey } from "@/lib/data/queryKeys";
import { officeKey, requireOffice, useOfficeScope } from "./office.scope";
import * as repo from "./orgSettings.repository";
import {
  toProfile,
  toSettings,
  type ApiOfficeProfile,
  type ApiOfficeSettings,
  type ProfilePatch,
  type SettingsPatch,
} from "./settings.data";

/* ==========================================================================
   Office profile and settings from the API (Phase 14; ADR 0007)
   --------------------------------------------------------------------------
   The office is the one picked in the portal picker. Members never read
   this (their after-hours reply is the server's since Phase 11). A failed
   read is an error (a 403 is "no access"), never a default record; each
   save sends one section's changed fields and refreshes from the answer.
   ========================================================================== */

export function useClinicSettings() {
  const { organizationId: orgId } = useOfficeScope();
  const queryClient = useQueryClient();
  const profileKey = officeKey(orgId, "profile");
  const settingsKey = officeKey(orgId, "settings");

  const profile = useQuery({
    queryKey: profileKey,
    queryFn: () => repo.getProfile(requireOffice(orgId)),
  });
  const settings = useQuery({
    queryKey: settingsKey,
    queryFn: () => repo.getSettings(requireOffice(orgId)),
  });

  const saveProfile = useMutation({
    mutationFn: (patch: ProfilePatch) =>
      repo.updateProfile(requireOffice(orgId), patch),
    onSuccess: (row) => {
      if (orgId)
        queryClient.setQueryData<ApiOfficeProfile>(
          orgKey(orgId, "profile"),
          row,
        );
    },
  });
  const saveSettings = useMutation({
    mutationFn: (patch: SettingsPatch) =>
      repo.updateSettings(requireOffice(orgId), patch),
    onSuccess: (row) => {
      if (orgId)
        queryClient.setQueryData<ApiOfficeSettings>(
          orgKey(orgId, "settings"),
          row,
        );
    },
    onError: () => {
      if (orgId)
        void queryClient.invalidateQueries({
          queryKey: orgKey(orgId, "settings"),
        });
    },
  });

  const value = useMemo(
    () =>
      profile.data && settings.data
        ? toSettings(toProfile(profile.data), settings.data)
        : null,
    [profile.data, settings.data],
  );

  return {
    orgId,
    settings: value,
    isPending: profile.isPending || settings.isPending,
    error: profile.error ?? settings.error,
    refetch: () => {
      void profile.refetch();
      void settings.refetch();
    },
    updateProfile: saveProfile.mutate,
    updateSettings: saveSettings.mutate,
    isSaving: saveProfile.isPending || saveSettings.isPending,
    saveError: saveProfile.error ?? saveSettings.error,
    dismissSaveError: () => {
      saveProfile.reset();
      saveSettings.reset();
    },
  };
}
