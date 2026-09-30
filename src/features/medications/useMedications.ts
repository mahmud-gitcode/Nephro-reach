"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as rules from "./medicationList";
import { listMedications, saveMedications } from "./medicationList.repository";

export const medicationsKey = ["medications", "list"] as const;

/** The member's medication list, with add and remove. */
export function useMedications() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: medicationsKey,
    queryFn: listMedications,
  });
  const write = useMutation({
    mutationFn: async (
      transform: (current: rules.Medication[]) => rules.Medication[],
    ) => saveMedications(transform(await listMedications())),
    onSuccess: (list) => queryClient.setQueryData(medicationsKey, list),
  });
  const { mutateAsync, mutate } = write;
  const medications = useMemo(() => query.data ?? [], [query.data]);

  return {
    medications,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    saveError: write.error,
    isSaving: write.isPending,
    add: useCallback(
      (draft: rules.MedicationDraft, today: string) =>
        mutateAsync((current) =>
          rules.addMedication(current, draft, today, Date.now()),
        ),
      [mutateAsync],
    ),
    remove: useCallback(
      (id: string) => mutate((current) => rules.removeMedication(current, id)),
      [mutate],
    ),
  };
}
