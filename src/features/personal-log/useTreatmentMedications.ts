"use client";

/* ==========================================================================
   Medications given during dialysis, from the API (Phase 7)
   --------------------------------------------------------------------------
   `/patients/:id/dialysis/treatment-medications`, read as a window of days
   (the last 120 by default, so "the medications of the last treatment" can
   be brought forward). Each row carries the day it was given and, when
   charted against a treatment, that treatment's id. One call per add,
   given toggle or delete. No sample rows.
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { lastDays } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { usePagedList } from "@/features/profile/usePagedList";
import {
  createTreatmentMedication,
  listTreatmentMedications,
  removeTreatmentMedication,
  updateTreatmentMedication,
} from "./dialysis/dialysis.repository";
import {
  fromApiTreatmentMedication,
  toTreatmentMedicationBody,
  type TreatmentMedication,
} from "./treatmentMedications.types";

export type { TreatmentMedication } from "./treatmentMedications.types";

export const TREATMENT_MEDICATIONS_FEATURE = "dialysis-treatment-medications";

export type TreatmentMedicationDraft = {
  givenOn: string;
  treatmentId?: string | null;
  medication: string;
  dose: string;
  reason?: string;
  given?: boolean;
};

/** Medications given during dialysis: the run-by-run record. */
export function useTreatmentMedications(
  explicitScope?: PatientScope | null,
  days = 120,
) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const range = useMemo(() => lastDays(days), [days]);

  const list = usePagedList({
    scope,
    queryKey: scopedKey(scope, TREATMENT_MEDICATIONS_FEATURE, "list", range),
    params: { ...range, limit: 150 },
    fetch: listTreatmentMedications,
    map: fromApiTreatmentMedication,
  });

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: scopedKey(scope, TREATMENT_MEDICATIONS_FEATURE),
    });

  const create = useMutation({
    mutationFn: (draft: TreatmentMedicationDraft) =>
      createTreatmentMedication(
        requireScope(scope),
        toTreatmentMedicationBody(draft),
      ),
    onSuccess: refresh,
  });
  const change = useMutation({
    mutationFn: ({ id, given }: { id: string; given: boolean }) =>
      updateTreatmentMedication(requireScope(scope), id, { given }),
    onSuccess: refresh,
  });
  const drop = useMutation({
    mutationFn: (id: string) =>
      removeTreatmentMedication(requireScope(scope), id),
    onSuccess: refresh,
  });

  /* Newest day first, the order the section reads them in. */
  const medications: TreatmentMedication[] = useMemo(
    () => [...list.items].sort((a, b) => b.givenOn.localeCompare(a.givenOn)),
    [list.items],
  );
  const { mutateAsync: createAsync } = create;
  const { mutateAsync: changeAsync } = change;
  const { mutateAsync: dropAsync } = drop;

  return {
    medications,
    isPending: list.isPending,
    error: list.error,
    isError: list.isError,
    refetch: list.refetch,
    hasMore: list.hasMore,
    loadMore: list.loadMore,

    add: useCallback(
      (draft: TreatmentMedicationDraft) => createAsync(draft),
      [createAsync],
    ),
    toggleGiven: useCallback(
      (id: string) => {
        const row = medications.find((m) => m.id === id);
        return changeAsync({ id, given: !(row?.given ?? false) });
      },
      [changeAsync, medications],
    ),
    remove: useCallback((id: string) => dropAsync(id), [dropAsync]),
    isSaving: create.isPending || change.isPending || drop.isPending,
    saveError: create.error ?? change.error ?? drop.error,
    dismissSaveError: () => {
      create.reset();
      change.reset();
      drop.reset();
    },
  };
}
