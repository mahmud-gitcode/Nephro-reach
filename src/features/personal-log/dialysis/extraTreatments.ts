/* ==========================================================================
   Extra (unscheduled) treatments: wire shapes and transforms (Phase 7)
   --------------------------------------------------------------------------
   `/patients/:id/dialysis/extra-treatments`: list (windowed), create,
   delete. The server has no PATCH, so an extra session is added or removed,
   never edited. The reasons are the server's exact strings, which are the
   values the modal already offers.
   ========================================================================== */

import type { ExtraTreatment } from "./schedule";

export const EXTRA_REASONS = [
  "Fluid Overload",
  "High Potassium",
  "Doctor Order",
  "Missed Session",
] as const;
export type ExtraReason = (typeof EXTRA_REASONS)[number];

export type ApiExtraTreatment = {
  id: string;
  patientId: string;
  date: string;
  reason: ExtraReason;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
};

export type ExtraTreatmentBody = {
  date: string;
  reason: ExtraReason;
  notes?: string | null;
};

export function isExtraReason(value: string): value is ExtraReason {
  return (EXTRA_REASONS as readonly string[]).includes(value);
}

export function fromApiExtraTreatment(raw: ApiExtraTreatment): ExtraTreatment {
  return {
    id: raw.id,
    dateKey: raw.date.slice(0, 10),
    reason: raw.reason,
    ...(raw.notes ? { notes: raw.notes } : {}),
  };
}

/** Throws for a reason the server would refuse (never sent). */
export function toExtraTreatmentBody(draft: {
  dateKey: string;
  reason: string;
  notes?: string;
}): ExtraTreatmentBody {
  if (!isExtraReason(draft.reason))
    throw new RangeError(`Unknown extra treatment reason: ${draft.reason}`);
  const notes = draft.notes?.trim();
  return {
    date: draft.dateKey,
    reason: draft.reason,
    notes: notes ? notes.slice(0, 4000) : null,
  };
}
