import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { SEED_REMINDERS } from "./reminders.seed";
import type { MedicationReminder } from "./reminders.types";

const KEY = storageKey("medication-reminders");

export async function listReminders(): Promise<MedicationReminder[]> {
  /* null, not the seed, so "never set a reminder" and "deleted them all"
     stay different answers. The old version handed the demo reminders back
     to anyone who deleted the last one. */
  const stored = await readJson<MedicationReminder[] | null>(KEY, null);
  return Array.isArray(stored) ? stored : SEED_REMINDERS;
}

export async function saveReminders(
  reminders: MedicationReminder[],
): Promise<MedicationReminder[]> {
  return writeJson(KEY, reminders);
}
