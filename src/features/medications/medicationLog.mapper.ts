/* ==========================================================================
   Dose and side-effect records <-> the API (Phase 6, ADR 0007 §1)
   --------------------------------------------------------------------------
   Identity is (medication id, day, HH:mm). Status and effect values are the
   same strings on both sides; pending is "no record" on the server.
   ========================================================================== */

import type {
  DoseRecord,
  DoseStatus,
  SideEffect,
  SideEffectRecord,
} from "./medicationLog.types";

/** `DoseResponseDto`. */
export type ApiDose = {
  id: string | null;
  patientId: string;
  medicationId: string;
  doseDate: string;
  doseTime: string;
  status: string;
  stampedAt: string | null;
  createdById: string | null;
};

/** `SideEffectResponseDto`. */
export type ApiSideEffect = {
  id: string | null;
  patientId: string;
  medicationId: string;
  effectDate: string;
  effectTime: string;
  effect: string | null;
  createdById: string | null;
  createdAt: string | null;
};

export type SetDoseBody = {
  doseDate: string;
  doseTime: string;
  status: DoseStatus;
};

export type SetSideEffectBody = {
  effectDate: string;
  effectTime: string;
  effect: SideEffect | null;
};

const STATUSES: readonly DoseStatus[] = ["pending", "taken", "late", "missed"];
export const SIDE_EFFECTS: readonly SideEffect[] = [
  "none",
  "fatigue",
  "nausea",
  "dizziness",
  "headache",
  "cramps",
  "itching",
  "low-bp",
  "upset-stomach",
  "rash",
  "other",
];

const HH_MM = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

/** A dose time must already be HH:mm: nothing name- or 12-hour-keyed is
 *  ever sent. */
export function assertHHmm(time: string): string {
  if (!HH_MM.test(time)) throw new RangeError(`Bad dose time: ${time}`);
  return time;
}

export function fromApiDose(
  api: ApiDose,
  nameOf: (medicationId: string) => string = () => "",
): DoseRecord | null {
  if (!STATUSES.includes(api.status as DoseStatus)) return null;
  return {
    medicationId: api.medicationId,
    medication: nameOf(api.medicationId),
    date: api.doseDate.slice(0, 10),
    time: api.doseTime,
    status: api.status as DoseStatus,
    ...(api.stampedAt ? { stampedAt: api.stampedAt } : {}),
  };
}

export function fromApiSideEffect(
  api: ApiSideEffect,
  nameOf: (medicationId: string) => string = () => "",
): SideEffectRecord | null {
  if (!api.effect || !SIDE_EFFECTS.includes(api.effect as SideEffect))
    return null;
  return {
    medicationId: api.medicationId,
    medication: nameOf(api.medicationId),
    date: api.effectDate.slice(0, 10),
    time: api.effectTime,
    effect: api.effect as SideEffect,
    savedAt: api.createdAt ?? "",
  };
}

export const toDoseBody = (
  date: string,
  time: string,
  status: DoseStatus,
): SetDoseBody => ({ doseDate: date, doseTime: assertHHmm(time), status });

export const toSideEffectBody = (
  date: string,
  time: string,
  effect: SideEffect | null,
): SetSideEffectBody => ({
  effectDate: date,
  effectTime: assertHHmm(time),
  effect,
});
