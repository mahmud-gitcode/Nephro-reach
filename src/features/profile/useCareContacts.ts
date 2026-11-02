"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  careContactWrite,
  EMPTY_CONTACTS,
  fromApiCareContacts,
  toApiKind,
  type ApiCareContact,
  type CareOffice,
  type OfficeKind,
} from "./careContacts";
import {
  patientPath,
  requireScope,
  scopedKey,
  usePatientScope,
} from "./patientScope";

export const listCareContacts = (scope: PatientScope) =>
  api<ApiCareContact[]>(patientPath(scope, "/care-contacts"));

export const saveCareContact = (
  scope: PatientScope,
  kind: OfficeKind,
  body: { name: string; phone?: string; address?: string },
) =>
  api<ApiCareContact>(patientPath(scope, `/care-contacts/${toApiKind(kind)}`), {
    method: "PUT",
    body,
  });

export const removeCareContact = (scope: PatientScope, kind: OfficeKind) =>
  api<unknown>(patientPath(scope, `/care-contacts/${toApiKind(kind)}`), {
    method: "DELETE",
  });

/** The member's vascular, nephrology, transplant and primary care offices,
 *  from the API (Phase 4). Each office saves on its own. */
export function useCareContacts(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const queryKey = scopedKey(scope, "care-contacts");
  const query = useQuery({
    queryKey,
    queryFn: () => listCareContacts(requireScope(scope)),
  });
  const write = useMutation({
    mutationFn: async ({
      kind,
      office,
    }: {
      kind: OfficeKind;
      office: CareOffice;
    }) => {
      const next = careContactWrite(office);
      if (next.kind === "put")
        return saveCareContact(requireScope(scope), kind, next.body);
      const saved = (query.data ?? []).some(
        (row) => row.kind === toApiKind(kind),
      );
      if (saved) await removeCareContact(requireScope(scope), kind);
      return null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  return {
    contacts: query.data ? fromApiCareContacts(query.data) : EMPTY_CONTACTS,
    isPending: query.isPending,
    error: query.error,
    isError: query.isError,
    refetch: () => void query.refetch(),
    save: (kind: OfficeKind, office: CareOffice) =>
      write.mutateAsync({ kind, office }),
    isSaving: write.isPending,
    saveError: write.error,
  };
}
