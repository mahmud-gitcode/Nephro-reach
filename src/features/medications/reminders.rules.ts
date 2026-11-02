import type { MedicationReminder } from "./reminders.types";

/* ==========================================================================
   Medication reminders: the rules (Phase 6)
   --------------------------------------------------------------------------
   A reminder belongs to one medication, by the medication's server id. The
   name used to be the key, which a rename or a second "Norvasc" broke.
   ========================================================================== */

export const reminderFor = (
  reminders: MedicationReminder[],
  medicationId: string,
) => reminders.find((reminder) => reminder.medicationId === medicationId);

/** Every time of day a reminder rings, as the member reads it, earliest
 *  first. */
export function reminderTimes(reminder: MedicationReminder): string[] {
  return [reminder.time, ...reminder.extraTimes];
}
