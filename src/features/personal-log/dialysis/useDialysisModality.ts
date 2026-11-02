"use client";

/* ==========================================================================
   The member's dialysis type, from the prescription (Phase 7)
   --------------------------------------------------------------------------
   `GET /patients/:id/dialysis/prescription`. A 404 is "not set": the
   default type shows and the member's first choice is a POST. After that a
   change is a PATCH of the fields that changed.

   Who may change it is the server's: `memberCanEdit` (D16). When it is
   false (a facility manages an in-center prescription) the screens show it
   read-only; a write that slips through is refused by the server (403
   `dialysis.prescription_managed_by_facility`) and the refusal is shown.
   A 403 on the read (`dialysis.dialysis_not_shared`) is the no-access
   state, never the default type.

   PD exchanges moved to `usePdExchanges` (windowed per day).
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import {
  hasTreatmentIntervals,
  hasChairTime,
  isHemodialysis,
  isHomeModality,
  recordsLocation,
  type DialysisModality,
  type ModalitySettings,
} from "./modality";
import {
  NOT_SET,
  fromApiPrescription,
  toPrescriptionBody,
  type PrescriptionView,
} from "./prescription.mapper";
import {
  createPrescription,
  getPrescription,
  updatePrescription,
} from "./dialysis.repository";

export const PRESCRIPTION_FEATURE = "dialysis-prescription";

export function prescriptionKey(scope: PatientScope | null) {
  return scopedKey(scope, PRESCRIPTION_FEATURE);
}

type SettingsPatch = Partial<
  Pick<ModalitySettings, "modality" | "pdSchedule" | "exchangesPerDay">
>;

export function useDialysisModality(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const queryKey = prescriptionKey(scope);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const raw = await getPrescription(requireScope(scope));
      return raw ? fromApiPrescription(raw) : NOT_SET;
    },
  });

  const view: PrescriptionView = query.data ?? NOT_SET;

  const write = useMutation({
    mutationFn: async (patch: SettingsPatch) => {
      const target = requireScope(scope);
      const body = toPrescriptionBody(patch, view.settings, !view.isSet);
      const raw = view.isSet
        ? await updatePrescription(target, body)
        : await createPrescription(target, body);
      return fromApiPrescription(raw);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const { mutate } = write;
  const saveSettings = useCallback(
    (patch: SettingsPatch) => mutate(patch),
    [mutate],
  );
  const setModality = useCallback(
    (modality: DialysisModality) => mutate({ modality }),
    [mutate],
  );

  const { settings } = view;
  const modality = settings.modality;

  return {
    settings,
    modality,
    /** Whether the server holds a prescription (404 = false). */
    isSet: view.isSet,
    /** The server's flag; the screens follow it exactly. */
    memberCanEdit: view.memberCanEdit,
    /** The server's modality is "CKD, not on dialysis" (no tab for it). */
    notOnDialysis: view.notOnDialysis,
    facilityName: view.facilityName,
    nephrologistName: view.nephrologistName,
    /** EDW from the prescription; display only until D7. */
    dryWeightKg: view.dryWeightKg,

    /* Asked often enough by the pages that each one working it out from
       the modality string would be four copies of the same rule. */
    isHemodialysis: useMemo(() => isHemodialysis(modality), [modality]),
    isHome: useMemo(() => isHomeModality(modality), [modality]),
    showsLocation: useMemo(() => recordsLocation(modality), [modality]),
    hasIntervals: useMemo(() => hasTreatmentIntervals(modality), [modality]),
    hasChair: useMemo(() => hasChairTime(modality), [modality]),

    setModality,
    saveSettings,

    isPending: query.isPending,
    error: query.error,
    isError: query.isError,
    refetch: () => void query.refetch(),
    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
  };
}

export type DialysisModalityLog = ReturnType<typeof useDialysisModality>;
