/* ==========================================================================
   Allergies and medical history — the shapes
   --------------------------------------------------------------------------
   Both tables mix seeded rows with rows the member added, which is why the
   optional fields exist: a seeded row translates through a dictionary key,
   an added one carries its own text.
   ========================================================================== */

export type HealthTab = "allergies" | "history";

export type AllergyType = "Medication" | "Food" | "Environmental";
export type AllergySeverity = "Severe" | "Moderate" | "Mild";
export type ConditionStatus = "Current" | "Past";

export type AllergyRow = {
  id: string;
  /** Set on user-added rows; seeded rows fall back to the sample name. */
  name?: string;
  type: AllergyType;
  /** Seeded rows translate through this key; user-added rows omit it. */
  reactionKey?: string;
  reactionDefault: string;
  severity: AllergySeverity;
  /** Set on user-added rows; seeded rows show "Week N". */
  notes?: string;
  week?: number;
};

export type HistoryRow = {
  id: string;
  conditionKey?: string;
  conditionDefault: string;
  status: ConditionStatus;
  diagnosed: string;
  notes?: string;
  week?: number;
};
