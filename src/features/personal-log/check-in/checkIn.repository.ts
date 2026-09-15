import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import type { BetweenTreatmentCheckIn } from "./checkIn.types";

/* ==========================================================================
   Between Treatment Check-in — storage
   --------------------------------------------------------------------------
   No seed. An empty log is genuinely empty, and showing a member symptoms
   they never reported would be a lie about their own health record — the
   one kind of demo data this app must never have.
   ========================================================================== */

const KEY = storageKey("between-treatment-check-ins");

export async function listCheckIns(): Promise<BetweenTreatmentCheckIn[]> {
  const stored = await readJson<BetweenTreatmentCheckIn[] | null>(KEY, null);
  return Array.isArray(stored) ? stored : [];
}

export async function saveCheckIns(
  entries: BetweenTreatmentCheckIn[],
): Promise<BetweenTreatmentCheckIn[]> {
  return writeJson(KEY, entries);
}
