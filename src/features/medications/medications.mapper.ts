/* ==========================================================================
   Medications <-> the API (Phase 6, ADR 0007 §1)
   --------------------------------------------------------------------------
   Every transform between the list's shape and the API's lives here:
   - dates: the form gives yyyy-mm-dd, the API takes and sends yyyy-mm-dd,
     the list shows MM/DD/YYYY and "---" for an ongoing end date;
   - frequency: one English label goes to the API (60 characters at most);
     the Spanish label is looked up from FREQUENCIES, else the raw text;
   - purpose and pharmacy: "—" on screen is null on the API;
   - a new medication sends no status (the server sets the first one) and
     an edit never sends the name or start date (the API refuses both);
   - a photo goes up through /files first and only its id is sent.
   ========================================================================== */

import {
  FREQUENCIES,
  usDate,
  type Medication,
  type MedicationChange,
  type MedicationDraft,
  type MedicationEdit,
} from "./medicationList";

/** `MedicationResponseDto` (backend medications module). */
export type ApiMedication = {
  id: string;
  patientId: string;
  name: string;
  dose: string;
  route: string;
  frequency: string;
  purpose: string | null;
  startDate: string | null;
  endDate: string | null;
  pharmacy: string | null;
  status: string;
  provider: string | null;
  instructions: string | null;
  needsRefill: boolean;
  photoFileId: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
};

/** `ListMedicationHistoryResponseDto`. */
export type ApiMedicationRevision = {
  id: string;
  changes: { field: string; from: unknown; to: unknown }[];
  actorKind: string;
  createdAt: string;
};

export type CreateMedicationBody = {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  purpose: string | null;
  startDate: string;
  endDate: string | null;
  provider: string | null;
  pharmacy: string | null;
  instructions: string | null;
  photoFileId?: string;
};

export type UpdateMedicationBody = {
  dose?: string;
  route?: string;
  frequency?: string;
  purpose?: string | null;
  endDate?: string | null;
  provider?: string | null;
  pharmacy?: string | null;
  instructions?: string | null;
  status?: string;
  needsRefill?: boolean;
  photoFileId?: string | null;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const orNull = (value: string) => value.trim() || null;
const dayOrNull = (value: string) =>
  DAY.test(value.trim()) ? value.trim() : null;

/** The English label for the API (a known one, or the text as typed). */
export function frequencyLabel(value: string): string {
  return (FREQUENCIES.find((f) => f.en === value)?.en ?? value).trim();
}

export function toCreateBody(
  draft: MedicationDraft,
  photoFileId?: string,
): CreateMedicationBody {
  return {
    name: draft.name.trim(),
    dose: draft.dose.trim(),
    route: draft.route,
    frequency: frequencyLabel(draft.frequency),
    purpose: orNull(draft.purpose),
    startDate: draft.startDate.trim(),
    endDate: dayOrNull(draft.endDate),
    provider: orNull(draft.provider),
    pharmacy: orNull(draft.pharmacy),
    instructions: orNull(draft.instructions),
    ...(photoFileId ? { photoFileId } : {}),
  };
}

/** An edit: only what the form can change (never name or start date). */
export function toUpdateBody(change: MedicationChange): UpdateMedicationBody {
  return {
    dose: change.dose.trim(),
    route: change.route,
    frequency: frequencyLabel(change.frequency),
    purpose: orNull(change.purpose),
    endDate: dayOrNull(change.endDate),
    provider: orNull(change.provider),
    pharmacy: orNull(change.pharmacy),
    instructions: orNull(change.instructions),
  };
}

export function fromApiMedication(api: ApiMedication): Medication {
  const frequency = FREQUENCIES.find((f) => f.en === api.frequency);
  const startIso =
    api.startDate && DAY.test(api.startDate) ? api.startDate : "";
  const endIso = api.endDate && DAY.test(api.endDate) ? api.endDate : "";
  const purpose = api.purpose?.trim() || "—";
  return {
    id: api.id,
    name: api.name,
    dose: api.dose,
    route: api.route,
    frequencyEn: frequency?.en ?? api.frequency,
    frequencyEs: frequency?.es ?? api.frequency,
    purposeEn: purpose,
    purposeEs: purpose,
    startDate: usDate(startIso) || "---",
    endDate: usDate(endIso) || "---",
    startIso,
    endIso,
    pharmacy: api.pharmacy?.trim() || "—",
    status: api.status,
    ...(api.provider?.trim() ? { provider: api.provider.trim() } : {}),
    ...(api.instructions?.trim()
      ? { instructions: api.instructions.trim() }
      : {}),
    needsRefill: api.needsRefill === true,
    photoFileId: api.photoFileId ?? null,
  };
}

/** The history's field names, as the member reads them. */
export const HISTORY_FIELD_LABELS: Record<string, { en: string; es: string }> =
  {
    dose: { en: "Dose", es: "Dosis" },
    route: { en: "Route", es: "Vía" },
    frequency: { en: "Frequency", es: "Frecuencia" },
    purpose: { en: "Purpose", es: "Propósito" },
    endDate: { en: "End date", es: "Fecha de fin" },
    provider: { en: "Provider", es: "Médico" },
    pharmacy: { en: "Pharmacy", es: "Farmacia" },
    instructions: { en: "Instructions", es: "Instrucciones" },
    status: { en: "Status", es: "Estado" },
    needsRefill: { en: "Needs refill", es: "Necesita resurtido" },
    photo: { en: "Photo", es: "Foto" },
  };

function historyValue(value: unknown, isEs: boolean): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? (isEs ? "Sí" : "Yes") : "No";
  if (typeof value === "string" && DAY.test(value)) return usDate(value);
  return String(value);
}

/** One server revision as a list line. Unknown fields keep their name. */
export function fromApiRevision(
  api: ApiMedicationRevision,
  isEs = false,
): MedicationEdit {
  return {
    id: api.id,
    at: api.createdAt,
    actorKind: api.actorKind,
    changes: api.changes.map((c) => {
      const label = HISTORY_FIELD_LABELS[c.field];
      return {
        field: label ? (isEs ? label.es : label.en) : c.field,
        from: historyValue(c.from, isEs),
        to: historyValue(c.to, isEs),
      };
    }),
  };
}
