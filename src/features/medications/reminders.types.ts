/* ==========================================================================
   Medication reminders: the shape of the data (Phase 6)
   --------------------------------------------------------------------------
   One reminder per medication, keyed by the medication's server id (the
   API refuses a second one). Times travel as HH:mm, 24-hour, in the
   patient's own time zone; the 12-hour forms are for display only.
   Whether a reminder actually rings is the server's job, including the
   member's "Medication Reminders" mute (D21, spec 020): not decided here.
   ========================================================================== */

export type ReminderChannel = "in_app" | "sms";

export interface MedicationReminder {
  /** The server's id. */
  id: string;
  medicationId: string;
  /** For display, from the medication list ("" when not on it). */
  medicationName: string;
  /** HH:mm, earliest first (what the API stores). */
  times: string[];
  /** The first time, as the member reads it, e.g. "08:00 AM". */
  time: string;
  /** The other times of the day, same form as `time`. */
  extraTimes: string[];
  frequency: string;
  channels: ReminderChannel[];
  enabled: boolean;
  notes?: string;
}
