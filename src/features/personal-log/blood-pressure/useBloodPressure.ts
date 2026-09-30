"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as rules from "./bloodPressure";
import { listReadings, saveReadings } from "./bloodPressure.repository";

export const bloodPressureKey = ["personal-log", "blood-pressure"] as const;

/** The member's blood pressure readings, with add, edit and delete. */
export function useBloodPressure() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: bloodPressureKey, queryFn: listReadings });
  const write = useMutation({
    mutationFn: async (
      transform: (current: rules.BpReading[]) => rules.BpReading[],
    ) => saveReadings(transform(await listReadings())),
    onSuccess: (readings) =>
      queryClient.setQueryData(bloodPressureKey, readings),
  });
  const { mutate, mutateAsync } = write;
  const readings = useMemo(() => query.data ?? [], [query.data]);

  return {
    readings,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    saveError: write.error,
    isSaving: write.isPending,
    add: useCallback(
      (draft: rules.BpDraft) =>
        mutateAsync((current) => rules.addReading(current, draft, Date.now())),
      [mutateAsync],
    ),
    update: useCallback(
      (id: string, draft: rules.BpDraft) =>
        mutateAsync((current) => rules.updateReading(current, id, draft)),
      [mutateAsync],
    ),
    remove: useCallback(
      (id: string) => mutate((current) => rules.removeReading(current, id)),
      [mutate],
    ),
  };
}
