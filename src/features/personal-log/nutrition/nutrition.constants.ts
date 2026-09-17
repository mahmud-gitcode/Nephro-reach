import type { Goals, MealKey, NutrientKey } from "./nutrition.types";

/* Units and defaults. There is no demo day: foods are saved now, and a
   seeded plate would sit in a member's log as if they had eaten it. */

export const MEAL_KEYS: MealKey[] = ["breakfast", "lunch", "dinner", "snack"];

/** Units per nutrient, used by the overview cards and the goals form. */
export const NUTRIENT_UNITS: Record<NutrientKey, string> = {
  sodium: "mg",
  potassium: "mg",
  phosphorus: "mg",
  protein: "g",
  calories: "kcal",
  carbs: "g",
  fats: "g",
  fiber: "g",
};

export const NUTRIENT_ORDER: NutrientKey[] = [
  "sodium",
  "potassium",
  "phosphorus",
  "protein",
  "calories",
  "carbs",
  "fats",
  "fiber",
];

export const DEFAULT_GOALS: Goals = {
  sodium: 2000,
  potassium: 2500,
  phosphorus: 1000,
  protein: 70,
  calories: 1900,
  carbs: 220,
  fats: 70,
  fiber: 30,
  fluid: 1500,
};
