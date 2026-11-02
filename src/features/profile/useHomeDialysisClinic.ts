"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { PatientScope } from "@/lib/data/queryKeys";
import type { DialysisClinic } from "@/features/travel/clinic.types";
import {
  clinicWrite,
  fromApiClinic,
  type ApiHomeDialysisClinic,
  type HomeDialysisClinicBody,
} from "./homeDialysisClinic";
import {
  patientPath,
  requireScope,
  scopedKey,
  usePatientScope,
} from "./patientScope";

const path = (scope: PatientScope) =>
  patientPath(scope, "/home-dialysis-clinic");

export const getHomeDialysisClinic = (scope: PatientScope) =>
  api<ApiHomeDialysisClinic | null>(path(scope));

export const saveHomeDialysisClinic = (
  scope: PatientScope,
  body: HomeDialysisClinicBody,
) => api<ApiHomeDialysisClinic>(path(scope), { method: "PUT", body });

export const removeHomeDialysisClinic = (scope: PatientScope) =>
  api<unknown>(path(scope), { method: "DELETE" });

/** The member's home dialysis clinic, from the API. `clinic` is null when
 *  none is saved ("not set"), undefined while loading or after a failure. */
export function useHomeDialysisClinic(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const queryKey = scopedKey(scope, "home-dialysis-clinic");

  const query = useQuery({
    queryKey,
    queryFn: async () =>
      fromApiClinic(await getHomeDialysisClinic(requireScope(scope))),
  });

  const save = useMutation({
    mutationFn: async (
      input: DialysisClinic & { organizationId?: string | null },
    ) => {
      const next = clinicWrite(input);
      if (next.kind === "put")
        return fromApiClinic(
          await saveHomeDialysisClinic(requireScope(scope), next.body),
        );
      if (query.data) await removeHomeDialysisClinic(requireScope(scope));
      return null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    clinic: query.isSuccess ? query.data : undefined,
    isPending: query.isPending,
    error: query.error,
    isError: query.isError,
    refetch: () => void query.refetch(),
    save,
    isSaving: save.isPending,
    saveError: save.error,
  };
}
