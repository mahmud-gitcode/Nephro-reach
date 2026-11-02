/* ==========================================================================
   Medications given during a dialysis run (Phase 7)
   --------------------------------------------------------------------------
   Rows on `/patients/:id/dialysis/treatment-medications`, each with the day
   it was given (`givenOn`, YYYY-MM-DD) and, when charted from a treatment,
   that treatment's id. The old display-date rows ("May 31, 2024") are not
   imported: the store that held them is retired.
   ========================================================================== */

/** One medication administered during a dialysis run, as the UI shows it. */
export interface TreatmentMedication {
  id: string;
  /** YYYY-MM-DD, the day it was given. */
  givenOn: string;
  /** As displayed, e.g. "May 31, 2024" (built from givenOn). */
  date: string;
  treatmentId: string | null;
  medication: string;
  /** Amount and unit together, e.g. "100 mg". */
  dose: string;
  reason: string;
  given: boolean;
}

export type ApiTreatmentMedication = {
  id: string;
  patientId: string;
  treatmentId: string | null;
  givenOn: string;
  medication: string;
  dose: string;
  reason: string;
  given: boolean;
  createdById: string | null;
  createdAt: string;
};

export type TreatmentMedicationBody = {
  givenOn: string;
  treatmentId?: string;
  medication: string;
  dose: string;
  reason?: string;
  given?: boolean;
};

/** "May 31, 2024" for a YYYY-MM-DD day (local calendar). */
export function rowDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fromApiTreatmentMedication(
  raw: ApiTreatmentMedication,
): TreatmentMedication {
  const givenOn = raw.givenOn.slice(0, 10);
  return {
    id: raw.id,
    givenOn,
    date: rowDate(givenOn),
    treatmentId: raw.treatmentId,
    medication: raw.medication,
    dose: raw.dose,
    reason: raw.reason,
    given: raw.given,
  };
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** A day the member typed ("May 31, 2024" or "2024-05-31") as YYYY-MM-DD,
 *  or null when it cannot be read. */
export function parseGivenOn(value: string): string | null {
  const trimmed = value.trim();
  if (DAY.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (!trimmed || Number.isNaN(parsed.getTime())) return null;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function toTreatmentMedicationBody(draft: {
  givenOn: string;
  treatmentId?: string | null;
  medication: string;
  dose: string;
  reason?: string;
  given?: boolean;
}): TreatmentMedicationBody {
  const reason = draft.reason?.trim();
  return {
    givenOn: draft.givenOn,
    ...(draft.treatmentId ? { treatmentId: draft.treatmentId } : {}),
    medication: draft.medication.trim().slice(0, 120),
    dose: draft.dose.trim().slice(0, 60),
    ...(reason ? { reason: reason.slice(0, 500) } : {}),
    ...(draft.given === undefined ? {} : { given: draft.given }),
  };
}
