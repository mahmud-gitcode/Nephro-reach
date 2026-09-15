import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { SEED_TREATMENT_MEDICATIONS } from "./treatmentMedications.seed";
import type { TreatmentMedication } from "./treatmentMedications.types";

const KEY = storageKey("treatment-medications");

export async function listTreatmentMedications(): Promise<
  TreatmentMedication[]
> {
  const stored = await readJson<TreatmentMedication[] | null>(KEY, null);
  return Array.isArray(stored) ? stored : SEED_TREATMENT_MEDICATIONS;
}

export async function saveTreatmentMedications(
  medications: TreatmentMedication[],
): Promise<TreatmentMedication[]> {
  return writeJson(KEY, medications);
}
