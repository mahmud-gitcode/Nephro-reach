import type { FoodEntry, Goals, MealKey, NutrientKey } from "./nutrition.types";

/* Units, defaults and the demo day. Deletable in one commit when real
   entries arrive. */

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

export const INITIAL_FOODS: FoodEntry[] = [
  {
    id: "seed-1",
    meal: "breakfast",
    name: "Oatmeal",
    portion: "1 cup",
    calories: 150,
    sodium: 120,
    potassium: 164,
    phosphorus: 180,
    protein: 5,
    carbs: 27,
    fats: 3,
    fiber: 4,
  },
  {
    id: "seed-2",
    meal: "breakfast",
    name: "Blueberries",
    portion: "1/2 cup",
    calories: 42,
    sodium: 1,
    potassium: 57,
    phosphorus: 9,
    protein: 1,
    carbs: 11,
    fats: 0,
    fiber: 2,
  },
  {
    id: "seed-3",
    meal: "lunch",
    name: "Grilled chicken salad",
    portion: "1 plate",
    calories: 460,
    sodium: 520,
    potassium: 610,
    phosphorus: 285,
    protein: 38,
    carbs: 18,
    fats: 26,
    fiber: 4,
  },
  {
    id: "seed-4",
    meal: "lunch",
    name: "Apple slices",
    portion: "1 medium",
    calories: 95,
    sodium: 2,
    potassium: 195,
    phosphorus: 20,
    protein: 1,
    carbs: 25,
    fats: 0,
    fiber: 4,
  },
  {
    id: "seed-5",
    meal: "dinner",
    name: "Baked salmon",
    portion: "3 oz",
    calories: 175,
    sodium: 55,
    potassium: 326,
    phosphorus: 252,
    protein: 19,
    carbs: 0,
    fats: 11,
    fiber: 0,
  },
  {
    id: "seed-6",
    meal: "dinner",
    name: "White rice",
    portion: "1 cup",
    calories: 205,
    sodium: 2,
    potassium: 55,
    phosphorus: 68,
    protein: 4,
    carbs: 45,
    fats: 0,
    fiber: 1,
  },
  {
    id: "seed-7",
    meal: "dinner",
    name: "Green beans",
    portion: "1/2 cup",
    calories: 40,
    sodium: 6,
    potassium: 90,
    phosphorus: 19,
    protein: 2,
    carbs: 5,
    fats: 0,
    fiber: 2,
  },
];

export const INITIAL_FLUID_ML = 1100;
