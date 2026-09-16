import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { sampleReflections, sampleTreatments } from "./trip.seed";
import type {
  TravelReflection,
  TravelTreatment,
} from "./travelTreatment.types";

/* ==========================================================================
   Travel treatment log — storage
   --------------------------------------------------------------------------
   Placeholder rows alongside the placeholder trip, for the same reason:
   frontend phase, and a log screen with nothing in it shows none of the
   columns a reviewer needs to see.
   ========================================================================== */

const TREATMENTS_KEY = storageKey("travel-treatments");
const REFLECTIONS_KEY = storageKey("travel-reflections");

export async function listTravelTreatments(): Promise<TravelTreatment[]> {
  const stored = await readJson<TravelTreatment[] | null>(TREATMENTS_KEY, null);
  const rows = Array.isArray(stored) ? stored : [];
  return rows.length > 0 ? rows : sampleTreatments();
}

export async function saveTravelTreatments(
  treatments: TravelTreatment[],
): Promise<TravelTreatment[]> {
  return writeJson(TREATMENTS_KEY, treatments);
}

export async function listTravelReflections(): Promise<TravelReflection[]> {
  const stored = await readJson<TravelReflection[] | null>(
    REFLECTIONS_KEY,
    null,
  );
  const rows = Array.isArray(stored) ? stored : [];
  return rows.length > 0 ? rows : sampleReflections();
}

export async function saveTravelReflections(
  reflections: TravelReflection[],
): Promise<TravelReflection[]> {
  return writeJson(REFLECTIONS_KEY, reflections);
}
