/* ==========================================================================
   Allergies and medical history <-> the API (Phase 4)
   --------------------------------------------------------------------------
   `/patients/:id/allergies` and `/patients/:id/medical-conditions`. The
   screens keep their capitalised labels ("Severe", "Current"); the API
   takes lower case. Every transform lives here so it is tested once.
   The forms use "—" for "nothing written"; the API stores an empty string.
   ========================================================================== */

import type {
  AllergyRow,
  AllergySeverity,
  AllergyType,
  ConditionStatus,
  HistoryRow,
} from "./health.types";

export type ApiAllergy = {
  id: string;
  patientId: string;
  name: string;
  type: "medication" | "food" | "environmental";
  reaction: string;
  severity: "severe" | "moderate" | "mild";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiCondition = {
  id: string;
  patientId: string;
  name: string;
  status: "current" | "past";
  diagnosed: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AllergyBody = {
  name: string;
  type: ApiAllergy["type"];
  reaction: string;
  severity: ApiAllergy["severity"];
  notes: string;
};

export type ConditionBody = {
  name: string;
  status: ApiCondition["status"];
  diagnosed: string;
  notes: string;
};

const TYPES: Record<AllergyType, ApiAllergy["type"]> = {
  Medication: "medication",
  Food: "food",
  Environmental: "environmental",
};
const SEVERITIES: Record<AllergySeverity, ApiAllergy["severity"]> = {
  Severe: "severe",
  Moderate: "moderate",
  Mild: "mild",
};
const STATUSES: Record<ConditionStatus, ApiCondition["status"]> = {
  Current: "current",
  Past: "past",
};

function invert<K extends string, V extends string>(map: Record<K, V>) {
  return Object.fromEntries(
    Object.entries(map).map(([k, v]) => [v, k]),
  ) as Record<V, K>;
}
const TYPE_LABEL = invert(TYPES);
const SEVERITY_LABEL = invert(SEVERITIES);
const STATUS_LABEL = invert(STATUSES);

const EMPTY = "—";
const toText = (value: string | undefined) => {
  const trimmed = (value ?? "").trim();
  return trimmed === EMPTY ? "" : trimmed;
};
const fromText = (value: string | null | undefined) =>
  value && value.trim() !== "" ? value : EMPTY;

export function fromApiAllergy(row: ApiAllergy): AllergyRow {
  return {
    id: row.id,
    name: row.name,
    type: TYPE_LABEL[row.type] ?? "Medication",
    reactionDefault: row.reaction ?? "",
    severity: SEVERITY_LABEL[row.severity] ?? "Moderate",
    notes: fromText(row.notes),
  };
}

export function toAllergyBody(row: Omit<AllergyRow, "id">): AllergyBody {
  return {
    name: (row.name ?? "").trim(),
    type: TYPES[row.type],
    reaction: toText(row.reactionDefault),
    severity: SEVERITIES[row.severity],
    notes: toText(row.notes),
  };
}

export function fromApiCondition(row: ApiCondition): HistoryRow {
  return {
    id: row.id,
    conditionDefault: row.name,
    status: STATUS_LABEL[row.status] ?? "Current",
    diagnosed: fromText(row.diagnosed),
    notes: fromText(row.notes),
  };
}

export function toConditionBody(row: Omit<HistoryRow, "id">): ConditionBody {
  return {
    name: row.conditionDefault.trim(),
    status: STATUSES[row.status],
    diagnosed: toText(row.diagnosed),
    notes: toText(row.notes),
  };
}

/** The fields of `next` that differ from `before`: a PATCH sends only
 *  what the member changed, so an office's edit to another field is not
 *  overwritten from a stale copy. */
export function changedFields<T extends Record<string, unknown>>(
  before: T,
  next: T,
): Partial<T> {
  const patch: Partial<T> = {};
  for (const key of Object.keys(next) as (keyof T)[]) {
    if (next[key] !== before[key]) patch[key] = next[key];
  }
  return patch;
}
