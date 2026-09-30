import { readJson, sampleOr, storageKey, writeJson } from "@/lib/data/storage";
import { SEED_READINGS, type BpReading } from "./bloodPressure";

/* The member's own readings (member-owned: filed under the signed-in
   member, see lib/data/storage). */
const KEY = storageKey("blood-pressure-readings");

export async function listReadings(): Promise<BpReading[]> {
  const stored = await readJson<BpReading[] | null>(KEY, null);
  return Array.isArray(stored) ? stored : sampleOr(KEY, SEED_READINGS, []);
}

export async function saveReadings(
  readings: BpReading[],
): Promise<BpReading[]> {
  return writeJson(KEY, readings);
}
