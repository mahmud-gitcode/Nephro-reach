import type { BadgeProps } from "@/components/ui";
import type {
  AllergyRow,
  AllergySeverity,
  ConditionStatus,
  HistoryRow,
} from "./health.types";

/* The demo rows, and the badge tone each severity and status takes.
   Deletable in one commit when real records arrive. */

/* The demo patient's sample record (client review, 2026-10-08: the old
   rows had no names, so every allergy read "Introduction to Wellness",
   and the history listed the same conditions as both current and past).
   A member who registered starts with an empty record. */
export const rawAllergyRows: Omit<AllergyRow, "id">[] = [
  {
    name: "Penicillin",
    type: "Medication",
    reactionKey: "rashHives",
    reactionDefault: "Rash, Hives",
    severity: "Severe",
    notes: "Reaction as a child. Tell every new provider.",
  },
  {
    name: "Shellfish",
    type: "Food",
    reactionDefault: "Swelling of lips and throat",
    severity: "Severe",
    notes: "Carries an EpiPen.",
  },
  {
    name: "Latex",
    type: "Environmental",
    reactionDefault: "Itching, Redness",
    severity: "Moderate",
    notes: "Ask for latex-free gloves at dialysis.",
  },
  {
    name: "Sulfa drugs",
    type: "Medication",
    reactionDefault: "Rash",
    severity: "Mild",
    notes: "",
  },
];

export const rawHistoryRows: Omit<HistoryRow, "id">[] = [
  {
    conditionKey: "ckd",
    conditionDefault: "Chronic Kidney Disease (CKD)",
    status: "Current",
    diagnosed: "05/07/2016",
    notes: "Stage 5, on in-center hemodialysis since 2022.",
  },
  {
    conditionKey: "hypertension",
    conditionDefault: "Hypertension (High Blood Pressure)",
    status: "Current",
    diagnosed: "10/28/2012",
    notes: "",
  },
  {
    conditionKey: "diabetes",
    conditionDefault: "Type 2 Diabetes",
    status: "Current",
    diagnosed: "08/16/2013",
    notes: "",
  },
  {
    conditionDefault: "Anemia of CKD",
    status: "Current",
    diagnosed: "03/14/2019",
    notes: "Treated at dialysis.",
  },
  {
    conditionKey: "appendectomy",
    conditionDefault: "Appendectomy",
    status: "Past",
    diagnosed: "08/15/2009",
    notes: "",
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
