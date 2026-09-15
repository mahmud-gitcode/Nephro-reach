"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listTreatmentMedications,
  saveTreatmentMedications,
} from "./treatmentMedications.repository";
import type { TreatmentMedication } from "./treatmentMedications.types";

export type { TreatmentMedication } from "./treatmentMedications.types";

export const treatmentMedicationsKey = [
  "personal-log",
  "treatment-medications",
] as const;

/** Medications given during dialysis: the run-by-run record. */
export function useTreatmentMedications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: treatmentMedicationsKey,
    queryFn: listTreatmentMedications,
  });

  const write = useMutation({
    mutationFn: async (
      transform: (current: TreatmentMedication[]) => TreatmentMedication[],
    ) => saveTreatmentMedications(transform(await listTreatmentMedications())),
    onSuccess: (medications) =>
      queryClient.setQueryData(treatmentMedicationsKey, medications),
  });

  return {
    medications: query.data ?? [],
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),

    add: (entry: TreatmentMedication) =>
      write.mutateAsync((current) => [entry, ...current]),
    toggleGiven: (id: string) =>
      write.mutateAsync((current) =>
        current.map((medication) =>
          medication.id === id
            ? { ...medication, given: !medication.given }
            : medication,
        ),
      ),
    remove: (id: string) =>
      write.mutateAsync((current) =>
        current.filter((medication) => medication.id !== id),
      ),
    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
  };
}
