/* ==========================================================================
   Medication reminders — the shape of the data
   --------------------------------------------------------------------------
   One reminder per medication, matched by name. Name is a poor key and the
   backend will give these a real medication id; until then the matching is
   done in one place (reminders.rules.ts) so that change is one file.
   ========================================================================== */

export type ReminderChannel = "in_app" | "sms";

export interface MedicationReminder {
  id: string;
  medicationName: string;
  /** As the member picked it, e.g. "08:00 AM". */
  time: string;
  frequency: string;
  channels: ReminderChannel[];
  enabled: boolean;
  notes?: string;
}
