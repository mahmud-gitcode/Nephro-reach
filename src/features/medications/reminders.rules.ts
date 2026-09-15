import type { MedicationReminder } from "./reminders.types";

/* ==========================================================================
   Medication reminders — the rules
   --------------------------------------------------------------------------
   Reminders are matched to a medication by name, case-insensitively. That
   comparison was written out at three call sites in the page, which is
   three chances for one of them to forget the .toLowerCase() and quietly
   create a second reminder for the same drug.
   ========================================================================== */

const sameMedication = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

export const reminderFor = (
  reminders: MedicationReminder[],
  medicationName: string,
) =>
  reminders.find((reminder) =>
    sameMedication(reminder.medicationName, medicationName),
  );

/**
 * Setting a time for a medication that already has a reminder moves that
 * reminder rather than adding a second one — two alarms for one drug is a
 * dosing hazard, not a duplicate row.
 */
export function setReminderTime(
  reminders: MedicationReminder[],
  medicationName: string,
  time: string,
  id = crypto.randomUUID(),
): MedicationReminder[] {
  const existing = reminderFor(reminders, medicationName);

  if (existing) {
    return reminders.map((reminder) =>
      reminder === existing ? { ...reminder, time, enabled: true } : reminder,
    );
  }

  return [
    {
      id,
      medicationName,
      time,
      frequency: "Daily",
      channels: ["in_app"],
      enabled: true,
    },
    ...reminders,
  ];
}

export const removeReminderFor = (
  reminders: MedicationReminder[],
  medicationName: string,
) =>
  reminders.filter(
    (reminder) => !sameMedication(reminder.medicationName, medicationName),
  );
