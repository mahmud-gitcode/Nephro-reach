import type { MealKey, NutrientKey } from "./nutrition.types";

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

/* No client default goals (Phase 5): the server owns them and says when
   they are its defaults (`isDefault`). */
