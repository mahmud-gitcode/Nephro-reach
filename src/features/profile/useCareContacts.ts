"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EMPTY_CONTACTS,
  readCareContacts,
  writeCareContacts,
  type CareContacts,
} from "./careContacts";

export const careContactsKey = ["profile", "care-contacts"] as const;

/** The member's vascular, nephrology and primary care offices. */
export function useCareContacts() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: careContactsKey,
    queryFn: readCareContacts,
  });
  const write = useMutation({
    mutationFn: writeCareContacts,
    onSuccess: (contacts) =>
      queryClient.setQueryData(careContactsKey, contacts),
  });
  return {
    contacts: query.data ?? EMPTY_CONTACTS,
    isPending: query.isPending,
    save: (contacts: CareContacts) => write.mutateAsync(contacts),
    isSaving: write.isPending,
    saveError: write.error,
  };
}
