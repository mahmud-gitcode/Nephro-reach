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

/* The server's limits (backend nutrition.constants.ts), so a form can say
   what is wrong before a refused save. */
export const NUTRIENT_VALUE_MAX = 100_000;
export const FLUID_ML_MAX = 10_000;
export const FOOD_NAME_MAX_LENGTH = 200;
export const FOOD_PORTION_MAX_LENGTH = 100;
