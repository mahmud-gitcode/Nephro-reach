/* ==========================================================================
   Medication reminders <-> the API (Phase 6, ADR 0007 §1)
   --------------------------------------------------------------------------
   The API keeps one MEDICATION reminder per medication id, with `times` as
   HH:mm (24-hour) in the patient's time zone. The reminder dialog speaks
   "08:00 AM"; the conversion happens here and only here.
   ========================================================================== */

import type { MedicationReminder, ReminderChannel } from "./reminders.types";
import { formatTo12Hour } from "./reminders.time";

/** `ReminderResponseDto` (backend medications module). */
export type ApiReminder = {
  id: string;
  patientId: string;
  kind: "MEDICATION" | "BLOOD_PRESSURE" | "CUSTOM";
  medicationId: string | null;
  title: string | null;
  times: string[];
  frequency: string;
  channels: string[];
  enabled: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateReminderBody = {
  kind: "MEDICATION";
  medicationId: string;
  times: string[];
  frequency: string;
  channels: ReminderChannel[];
  enabled: boolean;
};

export type UpdateReminderBody = { times: string[]; enabled: boolean };

const HH_MM = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const CLOCK = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i;

/** "08:00 AM" | "8:00 pm" | "20:00" → "HH:mm", or null when it is not a
 *  time of day. Midnight is 12 AM (00:xx) and noon is 12 PM (12:xx). */
export function toHHmm(clock: string): string | null {
  const match = CLOCK.exec(clock.trim());
  if (!match) return null;
  let h = Number(match[1]);
  const m = match[2];
  const half = match[3]?.toUpperCase();
  if (half) {
    if (h < 1 || h > 12) return null;
    if (half === "PM" && h < 12) h += 12;
    if (half === "AM" && h === 12) h = 0;
  }
  const out = `${String(h).padStart(2, "0")}:${m}`;
  return HH_MM.test(out) ? out : null;
}

/** The times to send: HH:mm, without repeats or blanks, earliest first. */
export function toTimes(clocks: string[]): string[] {
  const out = new Set<string>();
  for (const clock of clocks) {
    const t = toHHmm(clock);
    if (t) out.add(t);
  }
  return [...out].sort();
}

const CHANNELS: readonly ReminderChannel[] = ["in_app", "sms"];

export function fromApiReminder(
  api: ApiReminder,
  nameOf: (medicationId: string) => string = () => "",
): MedicationReminder {
  const times = [...api.times].filter((t) => HH_MM.test(t)).sort();
  const [first, ...rest] = times.map(formatTo12Hour);
  return {
    id: api.id,
    medicationId: api.medicationId ?? "",
    medicationName: api.medicationId ? nameOf(api.medicationId) : "",
    times,
    time: first ?? "",
    extraTimes: rest,
    frequency: api.frequency,
    channels: api.channels.filter((c): c is ReminderChannel =>
      CHANNELS.includes(c as ReminderChannel),
    ),
    enabled: api.enabled,
    ...(api.notes ? { notes: api.notes } : {}),
  };
}

/** A new reminder for one medication: rings in the app, every day. */
export function toCreateReminderBody(
  medicationId: string,
  times: string[],
): CreateReminderBody {
  return {
    kind: "MEDICATION",
    medicationId,
    times,
    frequency: "Daily",
    channels: ["in_app"],
    enabled: true,
  };
}
