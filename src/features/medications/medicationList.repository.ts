import { readJson, sampleOr, storageKey, writeJson } from "@/lib/data/storage";
import { SEED_MEDICATIONS, type Medication } from "./medicationList";

/* The member's own list (member-owned, see lib/data/storage). */
const KEY = storageKey("member-medications");

export async function listMedications(): Promise<Medication[]> {
  const stored = await readJson<Medication[] | null>(KEY, null);
  return Array.isArray(stored) ? stored : sampleOr(KEY, SEED_MEDICATIONS, []);
}

export async function saveMedications(
  medications: Medication[],
): Promise<Medication[]> {
  return writeJson(KEY, medications);
}
