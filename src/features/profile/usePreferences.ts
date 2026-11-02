"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  completeTour,
  getPreferences,
  preferencesKey,
  updatePreferences,
  type PreferencesPatch,
} from "./preferences.repository";

/** The signed-in account's preferences: one read shared by the quick
 *  actions, the fluid unit and the tour. Every write invalidates it. */
export function usePreferences(options: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: preferencesKey,
    queryFn: getPreferences,
    enabled: options.enabled ?? true,
  });
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: preferencesKey });
  const update = useMutation({
    mutationFn: (patch: PreferencesPatch) => updatePreferences(patch),
    onSuccess: invalidate,
  });
  const finishTour = useMutation({
    mutationFn: completeTour,
    onSuccess: invalidate,
  });
  return {
    preferences: query.data ?? null,
    isPending: query.isPending,
    error: query.error,
    isError: query.isError,
    refetch: query.refetch,
    update,
    finishTour,
  };
}
