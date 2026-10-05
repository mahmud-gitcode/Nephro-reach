"use client";

import { useDialysisClinic } from "@/features/travel/useDialysisClinic";
import { isNetworkClinic } from "./clinicEnrollment";

/** Whether the signed-in member's dialysis clinic is on NephroReach.
 *  `ready` is false while the clinic record loads, so a caller can wait
 *  rather than flash the wrong thing. */
export function useClinicEnrollment() {
  const { clinic, isPending } = useDialysisClinic();
  return {
    ready: !isPending,
    enrolled: isNetworkClinic(clinic?.name),
    clinic,
  };
}
