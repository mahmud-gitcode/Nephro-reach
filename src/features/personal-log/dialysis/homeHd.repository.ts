import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import {
  normaliseSystem,
  normaliseVitals,
  type HomeSystem,
  type TreatmentVitals,
} from "./homeHd";

/* ==========================================================================
   Home system and session vitals — storage
   --------------------------------------------------------------------------
   Two keys. The system is one record the member edits a few times a year;
   the vitals are written twice a session. Sharing a key would mean every
   post-run weight rewrites the machine's serial number.
   ========================================================================== */

const SYSTEM_KEY = storageKey("dialysis-home-system");
const VITALS_KEY = storageKey("dialysis-treatment-vitals");

export async function getHomeSystem(): Promise<HomeSystem> {
  return normaliseSystem(await readJson<unknown>(SYSTEM_KEY, null));
}

export async function saveHomeSystem(system: HomeSystem): Promise<HomeSystem> {
  return writeJson(SYSTEM_KEY, system);
}

type StoredVitals = Record<string, unknown>;

export async function getTreatmentVitals(
  date: string,
): Promise<TreatmentVitals> {
  const stored = await readJson<StoredVitals | null>(VITALS_KEY, null);
  return normaliseVitals(stored?.[date] ?? null, date);
}

export async function saveTreatmentVitals(
  vitals: TreatmentVitals,
): Promise<TreatmentVitals> {
  const stored = (await readJson<StoredVitals | null>(VITALS_KEY, null)) ?? {};
  await writeJson(VITALS_KEY, { ...stored, [vitals.date]: vitals });
  return vitals;
}
