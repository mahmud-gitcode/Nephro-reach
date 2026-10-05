import type { MedicationReminder } from "./reminders.types";
import { minutesOf } from "./reminders.time";

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

/** Every time of day a reminder rings, earliest first. */
export function reminderTimes(reminder: MedicationReminder): string[] {
  return [reminder.time, ...(reminder.extraTimes ?? [])];
}

/**
 * A medication taken several times a day gets several times on its one
 * reminder (client, 2026-10-05): sorted, without repeats. An empty list
 * removes the reminder.
 */
export function setReminderTimes(
  reminders: MedicationReminder[],
  medicationName: string,
  times: string[],
  id = crypto.randomUUID(),
): MedicationReminder[] {
  const clean = [...new Set(times.map((t) => t.trim().toUpperCase()))]
    .filter(Boolean)
    .sort((a, b) => minutesOf(a) - minutesOf(b));
  if (clean.length === 0) return removeReminderFor(reminders, medicationName);
  const [first, ...rest] = clean;
  const moved = setReminderTime(reminders, medicationName, first, id);
  return moved.map((reminder) =>
    sameMedication(reminder.medicationName, medicationName)
      ? { ...reminder, extraTimes: rest }
      : reminder,
  );
}
