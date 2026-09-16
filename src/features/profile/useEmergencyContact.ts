"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  emptyEmergencyContact,
  readEmergencyContact,
  writeEmergencyContact,
} from "./emergencyContact";
import type { ProfileEmergencyContact } from "./emergencyContact";

export const emergencyContactKey = ["profile", "emergency-contact"] as const;

/** The one person this app will offer to ring in an emergency. */
export function useEmergencyContact() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: emergencyContactKey,
    queryFn: readEmergencyContact,
  });

  const write = useMutation({
    mutationFn: writeEmergencyContact,
    onSuccess: (contact) =>
      queryClient.setQueryData(emergencyContactKey, contact),
  });

  const { mutate } = write;

  return {
    contact: query.data ?? emptyEmergencyContact(),
    save: useCallback(
      (contact: ProfileEmergencyContact) => mutate(contact),
      [mutate],
    ),

    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    /* Worth surfacing loudly: a member who believes this is saved will not
       check it again until the day they need it. */
    saveError: write.error,
    isSaving: write.isPending,
  };
}
