"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  emergencyContactWrite,
  emptyEmergencyContact,
  fromApiEmergencyContact,
} from "./emergencyContact";
import type { ProfileEmergencyContact } from "./emergencyContact";
import {
  getEmergencyContact,
  removeEmergencyContact,
  saveEmergencyContact,
} from "./emergencyContact.repository";
import { requireScope, scopedKey, usePatientScope } from "./patientScope";

/** The one person this app will offer to ring in an emergency, from the
 *  API (Phase 4). `null` from the server is "not set": empty fields. */
export function useEmergencyContact(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const queryKey = scopedKey(scope, "emergency-contact");

  const query = useQuery({
    queryKey,
    queryFn: () => getEmergencyContact(requireScope(scope)),
  });
  const isSet = query.data != null;

  const write = useMutation({
    mutationFn: async (contact: ProfileEmergencyContact) => {
      const next = emergencyContactWrite(contact);
      if (next.kind === "put")
        return saveEmergencyContact(requireScope(scope), next.body);
      /* No number: remove the saved one, if there is one. */
      if (isSet) await removeEmergencyContact(requireScope(scope));
      return null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const { mutate } = write;

  return {
    contact: query.data
      ? fromApiEmergencyContact(query.data)
      : emptyEmergencyContact(),
    isSet,
    save: useCallback(
      (contact: ProfileEmergencyContact, onSaved?: () => void) =>
        mutate(contact, { onSuccess: () => onSaved?.() }),
      [mutate],
    ),

    isPending: query.isPending,
    error: query.error,
    isError: query.isError,
    refetch: () => void query.refetch(),
    /* Worth surfacing loudly: a member who believes this is saved will not
       check it again until the day they need it. */
    saveError: write.error,
    isSaving: write.isPending,
  };
}
