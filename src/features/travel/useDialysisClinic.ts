"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getClinic, saveClinic } from "./clinic.repository";
import type { DialysisClinic } from "./clinic.types";

export { toTelHref } from "./clinic.repository";
export type { DialysisClinic } from "./clinic.types";

export const clinicKey = ["travel", "dialysis-clinic"] as const;

/**
 * One record rather than a list, so there is no empty state — but the
 * loading and error states are the same three lines, and the card that uses
 * this shows a phone number a member calls in an emergency. Showing a stale
 * or blank number silently is the failure worth avoiding here.
 */
export function useDialysisClinic() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: clinicKey,
    queryFn: getClinic,
  });

  const save = useMutation({
    mutationFn: (clinic: DialysisClinic) => saveClinic(clinic),
    onSuccess: (clinic) => queryClient.setQueryData(clinicKey, clinic),
  });

  return {
    clinic: query.data,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    save,
    isSaving: save.isPending,
    saveError: save.error,
  };
}
