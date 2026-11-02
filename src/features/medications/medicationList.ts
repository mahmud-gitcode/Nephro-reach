/* ==========================================================================
   The member's medication list: UI shapes and pure rules (Phase 6)
   --------------------------------------------------------------------------
   The list lives on the API (`/patients/:id/medications`), one row per
   medication with a server id. Nothing here decides what is stored: the
   server sets the first status, records every edit as a revision (the
   change history) and keeps the refill flag on the medication. These are
   the shapes the screens read, the form checks, and the dose rows built
   from the medications and their reminders, all keyed by medication id.
   ========================================================================== */

import type { BadgeTone } from "@/components/ui";
import type { MedicationReminder } from "./reminders.types";
import { formatTo12Hour } from "./reminders.time";

/** One medication as the screens read it (mapped from the API row). */
export type Medication = {
  /** The server's id: reminders, doses and side effects hang off it. */
  id: string;
  name: string;
  dose: string;
  route: string;
  frequencyEn: string;
  frequencyEs: string;
  /** "—" when there is none. */
  purposeEn: string;
  purposeEs: string;
  /** MM/DD/YYYY, the list's date form. */
  startDate: string;
  /** MM/DD/YYYY, or "---" while ongoing. */
  endDate: string;
  /** yyyy-mm-dd, or "" (the edit form's form). */
  startIso: string;
  endIso: string;
  /** "—" when there is none. */
  pharmacy: string;
  status: string;
  provider?: string;
  instructions?: string;
  /** The member says they are running low. */
  needsRefill: boolean;
  /** Opened only through `GET …/medications/:id/photo`, never stored. */
  photoFileId: string | null;
};

/** One revision of a medication, from `GET …/:id/history`. */
export type MedicationEdit = {
  id: string;
  /** ISO timestamp of the change. */
  at: string;
  /** "PATIENT" | "CAREGIVER" | "STAFF" | … (who made it). */
  actorKind: string;
  changes: { field: string; from: string; to: string }[];
};

/** What a member can change on a medication already on the list. The name
 *  and start date stay (the server does not accept them on an edit). */
export type MedicationChange = Pick<
  MedicationDraft,
  | "dose"
  | "route"
  | "frequency"
  | "purpose"
  | "endDate"
  | "provider"
  | "pharmacy"
  | "instructions"
>;

/** "09/30/2026" → "2026-09-30"; "---" → "". */
export function isoFromUs(us: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(us);
  return m ? `${m[3]}-${m[1]}-${m[2]}` : "";
}

/** "2026-09-30" → "09/30/2026", the list's date form; "" stays "". */
export function usDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[2]}/${m[3]}/${m[1]}` : "";
}

/** The edit form, filled from the medication as it stands. */
export function changeFrom(m: Medication): MedicationChange {
  const blank = (v: string | undefined) => (!v || v === "—" ? "" : v);
  return {
    dose: m.dose,
    route: m.route,
    frequency: m.frequencyEn,
    purpose: blank(m.purposeEn),
    endDate: m.endIso,
    provider: blank(m.provider),
    pharmacy: blank(m.pharmacy),
    instructions: blank(m.instructions),
  };
}

export const ROUTES = [
  { value: "PO", en: "By mouth (PO)", es: "Por boca (PO)" },
  { value: "IV", en: "Intravenous (IV)", es: "Intravenosa (IV)" },
  { value: "SC", en: "Injection under the skin (SC)", es: "Subcutánea (SC)" },
  { value: "IM", en: "Injection in the muscle (IM)", es: "Intramuscular (IM)" },
  { value: "Topical", en: "On the skin", es: "Sobre la piel" },
  { value: "Inhaled", en: "Inhaled", es: "Inhalada" },
] as const;

export const FREQUENCIES = [
  { en: "Once daily", es: "Una vez al día" },
  { en: "Twice daily", es: "Dos veces al día" },
  { en: "Three times daily", es: "Tres veces al día" },
  { en: "With meals", es: "Con las comidas" },
  { en: "At bedtime", es: "Al acostarse" },
  { en: "On dialysis days", es: "Los días de diálisis" },
  { en: "Weekly", es: "Semanal" },
  { en: "As needed (PRN)", es: "Según necesidad (PRN)" },
] as const;

export type MedicationDraft = {
  name: string;
  dose: string;
  route: string;
  /** One of FREQUENCIES, by its English label. */
  frequency: string;
  purpose: string;
  /** yyyy-mm-dd */
  startDate: string;
  /** yyyy-mm-dd, or "" while ongoing. */
  endDate: string;
  provider: string;
  pharmacy: string;
  instructions: string;
};

export type MedicationError =
  "name" | "dose" | "route" | "frequency" | "startDate" | "endDate";

export function medicationError(
  draft: MedicationDraft,
): MedicationError | null {
  if (draft.name.trim().length < 2) return "name";
  if (!draft.dose.trim()) return "dose";
  if (!draft.route) return "route";
  if (!draft.frequency) return "frequency";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.startDate)) return "startDate";
  if (draft.endDate && draft.endDate < draft.startDate) return "endDate";
  return null;
}

/** The statuses a member can set (client, 2026-10-05). */
export const MEDICATION_STATUSES = [
  { value: "Active", en: "Active", es: "Activo" },
  { value: "PRN", en: "PRN (as needed)", es: "PRN (según necesidad)" },
  { value: "Paused", en: "Paused", es: "En pausa" },
  { value: "Stopped", en: "Stopped", es: "Suspendido" },
] as const;
export type MedicationStatus = (typeof MEDICATION_STATUSES)[number]["value"];

/** The badge colour of a medication status. */
export const STATUS_TONE: Record<string, BadgeTone> = {
  Active: "success",
  PRN: "info",
  Stopped: "danger",
  Taken: "success",
  Late: "warning",
  Missed: "danger",
};

/** How many medications the member flagged as running low. */
export function refillCount(medications: Medication[]): number {
  return medications.filter((m) => m.needsRefill).length;
}

/** One scheduled dose of the day. */
export type DoseRow = {
  medicationId: string;
  /** HH:mm (24-hour): with the day and the medication id, its identity. */
  time: string;
  /** "08:00 AM", as the member reads it. */
  timeLabel: string;
  medication: string;
  generic: string;
  instructionsEn: string;
  instructionsEs: string;
};

/**
 * Today's doses, as the server schedules them (adherence.service): one row
 * per time on the enabled reminder of each Active medication, matched by
 * the medication's id. A medication with no reminder has no scheduled dose
 * (spec 042 B6-4). Earliest first.
 */
export function doseRows(
  medications: Medication[],
  reminders: MedicationReminder[],
): DoseRow[] {
  const rows: DoseRow[] = [];
  for (const m of medications) {
    if (m.status !== "Active") continue;
    const reminder = reminders.find(
      (r) => r.medicationId === m.id && r.enabled,
    );
    if (!reminder) continue;
    for (const time of reminder.times) {
      rows.push({
        medicationId: m.id,
        time,
        timeLabel: formatTo12Hour(time),
        medication: m.name,
        generic: m.dose,
        instructionsEn: m.instructions ?? "—",
        instructionsEs: m.instructions ?? "—",
      });
    }
  }
  return rows.sort(
    (a, b) =>
      a.time.localeCompare(b.time) || a.medication.localeCompare(b.medication),
  );
}

/** "08:00" (24-hour, from a time input) → "08:00 AM", for display only. */
export function reminderClock(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
