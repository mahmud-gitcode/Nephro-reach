import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import type {
  DoseRecord,
  MoodEntry,
  RefillFlags,
  SideEffectRecord,
} from "./medicationLog.types";

/* ==========================================================================
   The medication log — storage
   --------------------------------------------------------------------------
   Three keys rather than one blob. Dose statuses are tapped several times a
   day, refills change once a month, and the mood note is written each
   evening. One record would mean each write racing the other two.

   There is no seed. An unlogged day is genuinely unlogged, and showing a
   member doses they never confirmed taking would be a lie about their own
   medication record — the one kind of demo data this page must not have.
   ========================================================================== */

const DOSES_KEY = storageKey("medication-doses");
const REFILLS_KEY = storageKey("medication-refills");
const MOOD_KEY = storageKey("medication-mood");
const SIDE_EFFECTS_KEY = storageKey("medication-side-effects");

export async function listDoses(): Promise<DoseRecord[]> {
  const stored = await readJson<DoseRecord[] | null>(DOSES_KEY, null);
  return Array.isArray(stored) ? stored : [];
}

export async function saveDoses(doses: DoseRecord[]): Promise<DoseRecord[]> {
  return writeJson(DOSES_KEY, doses);
}

export async function getRefills(): Promise<RefillFlags> {
  const stored = await readJson<RefillFlags | null>(REFILLS_KEY, null);
  return stored !== null && typeof stored === "object" && !Array.isArray(stored)
    ? stored
    : {};
}

export async function saveRefills(flags: RefillFlags): Promise<RefillFlags> {
  return writeJson(REFILLS_KEY, flags);
}

export async function listMood(): Promise<MoodEntry[]> {
  const stored = await readJson<MoodEntry[] | null>(MOOD_KEY, null);
  return Array.isArray(stored) ? stored : [];
}

export async function saveMood(entries: MoodEntry[]): Promise<MoodEntry[]> {
  return writeJson(MOOD_KEY, entries);
}

export async function listSideEffects(): Promise<SideEffectRecord[]> {
  const stored = await readJson<SideEffectRecord[] | null>(
    SIDE_EFFECTS_KEY,
    null,
  );
  return Array.isArray(stored) ? stored : [];
}

export async function saveSideEffects(
  records: SideEffectRecord[],
): Promise<SideEffectRecord[]> {
  return writeJson(SIDE_EFFECTS_KEY, records);
}
