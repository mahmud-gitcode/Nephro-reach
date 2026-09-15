import type { BadgeProps } from "@/components/ui";
import type { AllergySeverity, ConditionStatus } from "./health.types";

/* The demo rows, and the badge tone each severity and status takes.
   Deletable in one commit when real records arrive. */

export const rawAllergyRows = [
  {
    type: "Medication" as const,
    reactionKey: "rashHives",
    reactionDefault: "Rash, Hives",
    severity: "Severe" as const,
    week: 1,
  },
  {
    type: "Food" as const,
    reactionKey: "eczemaSwelling",
    reactionDefault: "Eczema, Swelling",
    severity: "Moderate" as const,
    week: 2,
  },
  {
    type: "Environmental" as const,
    reactionKey: "drySkinItching",
    reactionDefault: "Dry Skin, Itching",
    severity: "Severe" as const,
    week: 3,
  },
  {
    type: "Food" as const,
    reactionKey: "rednessPeeling",
    reactionDefault: "Redness, Peeling",
    severity: "Mild" as const,
    week: 4,
  },
  {
    type: "Environmental" as const,
    reactionKey: "blisteringSensitivity",
    reactionDefault: "Blistering, Sensitivity",
    severity: "Mild" as const,
    week: 5,
  },
  {
    type: "Medication" as const,
    reactionKey: "flakingCracking",
    reactionDefault: "Flaking, Cracking",
    severity: "Moderate" as const,
    week: 6,
  },
  {
    type: "Food" as const,
    reactionKey: "itchingRash",
    reactionDefault: "Itching, Rash Extension",
    severity: "Mild" as const,
    week: 7,
  },
  {
    type: "Medication" as const,
    reactionKey: "swellingHeat",
    reactionDefault: "Swelling, Heat",
    severity: "Moderate" as const,
    week: 8,
  },
  {
    type: "Environmental" as const,
    reactionKey: "dryPatches",
    reactionDefault: "Dry Patches, Red Spots",
    severity: "Mild" as const,
    week: 9,
  },
  {
    type: "Environmental" as const,
    reactionKey: "discomfortTenderness",
    reactionDefault: "Discomfort, Tenderness",
    severity: "Mild" as const,
    week: 10,
  },
];

export const rawHistoryRows = [
  {
    conditionKey: "ckd",
    conditionDefault: "Chronic Kidney Disease (CKD)",
    status: "Current" as const,
    diagnosed: "07/05/2016",
    week: 1,
  },
  {
    conditionKey: "hypertension",
    conditionDefault: "Hypertension (High Blood Pressure)",
    status: "Current" as const,
    diagnosed: "18/09/2016",
    week: 2,
  },
  {
    conditionKey: "diabetes",
    conditionDefault: "Type 2 Diabetes",
    status: "Current" as const,
    diagnosed: "16/08/2013",
    week: 3,
  },
  {
    conditionKey: "appendectomy",
    conditionDefault: "Appendectomy",
    status: "Current" as const,
    diagnosed: "15/08/2017",
    week: 4,
  },
  {
    conditionKey: "asthma",
    conditionDefault: "Asthma",
    status: "Current" as const,
    diagnosed: "28/10/2012",
    week: 5,
  },
  {
    conditionKey: "hypertension",
    conditionDefault: "Hypertension (High Blood Pressure)",
    status: "Past" as const,
    diagnosed: "07/05/2016",
    week: 2,
  },
  {
    conditionKey: "diabetes",
    conditionDefault: "Type 2 Diabetes",
    status: "Past" as const,
    diagnosed: "28/10/2012",
    week: 3,
  },
  {
    conditionKey: "appendectomy",
    conditionDefault: "Appendectomy",
    status: "Past" as const,
    diagnosed: "16/08/2013",
    week: 4,
  },
  {
    conditionKey: "ckd",
    conditionDefault: "Chronic Kidney Disease (CKD)",
    status: "Past" as const,
    diagnosed: "12/06/2020",
    week: 1,
  },
  {
    conditionKey: "hypertension",
    conditionDefault: "Hypertension (High Blood Pressure)",
    status: "Past" as const,
    diagnosed: "28/10/2012",
    week: 2,
  },
];

/* Colour is spent on what needs attention, not on everything.

   Severity and status say something a member may have to act on, so they
   carry tone. Allergy TYPE is a category — the word "Food" already says
   food — so it stays neutral and outlined. Previously all three types were
   coloured, which put five competing hues in one table row and left
   "Severe" with no more visual weight than "Environmental". */
export const severityBadge: Record<
  AllergySeverity,
  Pick<BadgeProps, "tone" | "variant">
> = {
  Severe: { tone: "danger", variant: "soft" },
  Moderate: { tone: "warning", variant: "soft" },
  Mild: { tone: "neutral", variant: "soft" },
};

export const statusBadge: Record<
  ConditionStatus,
  Pick<BadgeProps, "tone" | "variant">
> = {
  Current: { tone: "success", variant: "soft" },
  Past: { tone: "neutral", variant: "soft" },
};
