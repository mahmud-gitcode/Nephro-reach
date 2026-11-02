/* ==========================================================================
   Allergies and medical history — the shapes
   --------------------------------------------------------------------------
   The rows come from the API (Phase 4; `health.mapper.ts`). The labels
   stay as the screens show them; the mapper lower-cases them for the API.
   ========================================================================== */

export type HealthTab = "allergies" | "history";

export type AllergyType = "Medication" | "Food" | "Environmental";
export type AllergySeverity = "Severe" | "Moderate" | "Mild";
export type ConditionStatus = "Current" | "Past";

export type AllergyRow = {
  id: string;
  name?: string;
  type: AllergyType;
  /** The reaction as the member wrote it (API `reaction`). */
  reactionDefault: string;
  severity: AllergySeverity;
  notes?: string;
};

export type HistoryRow = {
  id: string;
  /** The condition as the member wrote it (API `name`). */
  conditionDefault: string;
  status: ConditionStatus;
  diagnosed: string;
  notes?: string;
};
