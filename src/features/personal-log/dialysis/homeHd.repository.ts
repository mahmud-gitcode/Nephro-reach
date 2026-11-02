import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { normaliseVitals, type TreatmentVitals } from "./homeHd";

/* ==========================================================================
   Home-HD session vitals: the one dialysis store still in this browser
   --------------------------------------------------------------------------
   The home system moved to the API in Phase 7 (`homeDialysis.repository`).
   The session vitals stay here until D8 decides whether they are one record
   with the treatment or two; `nr:dialysis-treatment-vitals` is then retired
   (Phase 15 at the latest). It is the one remaining member PHI key and is
   deliberately not in the purge registry until then. No screen reads it
   today (useTreatmentVitals has no caller).
   ========================================================================== */

const VITALS_KEY = storageKey("dialysis-treatment-vitals");

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
