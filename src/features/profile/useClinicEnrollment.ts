"use client";

import type { PatientScope } from "@/lib/data/queryKeys";
import { EMPTY_CLINIC } from "./homeDialysisClinic";
import { useHomeDialysisClinic } from "./useHomeDialysisClinic";

/** Whether the member's dialysis clinic is on NephroReach: the server's
 *  `onNephroReach` (the clinic is linked to a center that cares for the
 *  patient), never a match on the clinic's name. `ready` is false while the
 *  clinic record loads, so a caller can wait rather than flash the wrong
 *  thing. */
export function useClinicEnrollment(explicitScope?: PatientScope | null) {
  const { clinic, isPending, error, refetch } =
    useHomeDialysisClinic(explicitScope);
  return {
    ready: !isPending,
    isPending,
    error,
    isError: !!error,
    refetch,
    enrolled: clinic?.onNephroReach === true,
    clinic: clinic === undefined ? undefined : (clinic ?? EMPTY_CLINIC),
  };
}
