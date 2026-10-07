/* ==========================================================================
   The member's medication list
   --------------------------------------------------------------------------
   It used to be a fixed demo list the "Add Medication" form could not add
   to. It is stored now (member-owned, lib/data/storage): the demo patient
   starts with the sample list, a member who registered starts with none,
   and whatever is added shows in the list, the dose schedule and the
   adherence figures alike.
   ========================================================================== */

import { doseScheduleData, medicationsData } from "./medications.seed";
import type { MedicationReminder } from "./reminders.types";
import { reminderTimes } from "./reminders.rules";

export type Medication = (typeof medicationsData)[number] & {
  id: string;
  provider?: string;
  instructions?: string;
  /** A photo of the bottle or label (client, 2026-10-06). */
  photo?: string;
  /** Every edit, oldest first (client, 2026-10-07: a dose going from
   *  5 mg to 10 mg is a change to record, not a silent overwrite). */
  history?: MedicationEdit[];
};

export type MedicationEdit = {
  /** yyyy-mm-dd */
  date: string;
  field: string;
  from: string;
  to: string;
};

/** What a member can change on a medication already on the list. The name
 *  stays: reminders and the dose log are kept by it. */
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

/** The edit form, filled from the medication as it stands. */
export function changeFrom(m: Medication): MedicationChange {
  const blank = (v: string | undefined) => (!v || v === "—" ? "" : v);
  return {
    dose: m.dose,
    route: m.route,
    frequency: m.frequencyEn,
    purpose: blank(m.purposeEn),
    endDate: isoFromUs(m.endDate),
    provider: blank(m.provider),
    pharmacy: blank(m.pharmacy),
    instructions: blank(m.instructions),
  };
}

/** Applies an edit and records each field that changed. */
export function updateMedication(
  list: Medication[],
  id: string,
  change: MedicationChange,
  today: string,
): Medication[] {
  return list.map((m) => {
    if (m.id !== id) return m;
    const before = changeFrom(m);
    const labels: Record<keyof MedicationChange, string> = {
      dose: "Dose",
      route: "Route",
      frequency: "Frequency",
      purpose: "Purpose",
      endDate: "End date",
      provider: "Provider",
      pharmacy: "Pharmacy",
      instructions: "Instructions",
    };
    const edits: MedicationEdit[] = (
      Object.keys(labels) as Array<keyof MedicationChange>
    )
      .filter((k) => before[k].trim() !== change[k].trim())
      .map((k) => ({
        date: today,
        field: labels[k],
        from: before[k].trim() || "—",
        to: change[k].trim() || "—",
      }));
    if (edits.length === 0) return m;
    const frequency =
      FREQUENCIES.find((f) => f.en === change.frequency) ??
      ({ en: change.frequency, es: change.frequency } as const);
    const stopped = !!change.endDate && change.endDate < today;
    return {
      ...m,
      dose: change.dose.trim(),
      route: change.route,
      frequencyEn: frequency.en,
      frequencyEs: frequency.es,
      purposeEn: change.purpose.trim() || "—",
      purposeEs: change.purpose.trim() || "—",
      endDate: change.endDate ? usDate(change.endDate) : "---",
      pharmacy: change.pharmacy.trim() || "—",
      provider: change.provider.trim() || undefined,
      instructions: change.instructions.trim() || undefined,
      ...(stopped ? { status: "Stopped" } : {}),
      history: [...(m.history ?? []), ...edits],
    };
  });
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
  /** Data URL of a photo taken with the camera, when there is one. */
  photo?: string;
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

/** "2026-09-30" → "09/30/2026", the list's date form. */
function usDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

export function addMedication(
  list: Medication[],
  draft: MedicationDraft,
  today: string,
  now: number,
): Medication[] {
  const frequency =
    FREQUENCIES.find((f) => f.en === draft.frequency) ??
    ({ en: draft.frequency, es: draft.frequency } as const);
  const stopped = !!draft.endDate && draft.endDate < today;
  const prn = frequency.en.startsWith("As needed");
  return [
    ...list,
    {
      id: `med-${now}`,
      name: draft.name.trim(),
      dose: draft.dose.trim(),
      route: draft.route,
      frequencyEn: frequency.en,
      frequencyEs: frequency.es,
      purposeEn: draft.purpose.trim() || "—",
      purposeEs: draft.purpose.trim() || "—",
      startDate: usDate(draft.startDate),
      endDate: draft.endDate ? usDate(draft.endDate) : "---",
      pharmacy: draft.pharmacy.trim() || "—",
      status: stopped ? "Stopped" : prn ? "PRN" : "Active",
      ...(draft.provider.trim() ? { provider: draft.provider.trim() } : {}),
      ...(draft.instructions.trim()
        ? { instructions: draft.instructions.trim() }
        : {}),
      ...(draft.photo ? { photo: draft.photo } : {}),
    },
  ];
}

/** The statuses a member can set (client, 2026-10-05). */
export const MEDICATION_STATUSES = [
  { value: "Active", en: "Active", es: "Activo" },
  { value: "PRN", en: "PRN (as needed)", es: "PRN (según necesidad)" },
  { value: "Paused", en: "Paused", es: "En pausa" },
  { value: "Stopped", en: "Stopped", es: "Suspendido" },
] as const;
export type MedicationStatus = (typeof MEDICATION_STATUSES)[number]["value"];

export function setMedicationStatus(
  list: Medication[],
  id: string,
  status: MedicationStatus,
): Medication[] {
  return list.map((m) => (m.id === id ? { ...m, status } : m));
}

/** Paused and stopped medications have no doses to take. */
function onSchedule(m: Medication): boolean {
  return m.status !== "Paused" && m.status !== "Stopped";
}

export function removeMedication(list: Medication[], id: string): Medication[] {
  return list.filter((m) => m.id !== id);
}

export const SEED_MEDICATIONS: Medication[] = medicationsData.map((m, i) => ({
  ...m,
  id: `seed-med-${i}`,
}));

export type DoseRow = (typeof doseScheduleData)[number];

/**
 * Today's doses: the sample schedule for the sample medications still on
 * the list, then one dose for each added, active medication that has a
 * reminder time.
 */
export function doseRows(
  medications: Medication[],
  reminders: MedicationReminder[],
): DoseRow[] {
  const scheduled = medications.filter(onSchedule);
  const names = new Set(scheduled.map((m) => m.name.toLowerCase()));
  const sample = doseScheduleData.filter((row) =>
    names.has(row.medication.toLowerCase()),
  );
  /* One row per reminder time not already in the sample schedule, so a
     medication taken twice a day has two rows. */
  const added = scheduled
    .filter((m) => m.status === "Active")
    .flatMap((m) => {
      const reminder = reminders.find(
        (r) =>
          r.medicationName.toLowerCase() === m.name.toLowerCase() && r.enabled,
      );
      if (!reminder) return [];
      return reminderTimes(reminder)
        .map((t) => t.toLowerCase())
        .filter(
          (time) =>
            !sample.some(
              (row) =>
                row.medication.toLowerCase() === m.name.toLowerCase() &&
                row.time.toLowerCase() === time,
            ),
        )
        .map((time) => ({
          time,
          medication: m.name,
          generic: m.dose,
          instructionsEn: m.instructions ?? "—",
          instructionsEs: m.instructions ?? "—",
          status: "Pending",
          stamp: "---",
          sideEffectsEn: "None",
          sideEffectsEs: "Ninguno",
        }));
    });
  return [...sample, ...added];
}

/** "08:00" (24-hour, from a time input) → "08:00 AM", as reminders keep it. */
export function reminderClock(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
