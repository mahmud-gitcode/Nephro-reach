/* ==========================================================================
   Nutrition log — the shapes
   --------------------------------------------------------------------------
   A dialysis diet is counted in milligrams: sodium, potassium and
   phosphorus are the three that matter clinically, and the rest are here
   because a member tracking those will want the ordinary ones too.
   ========================================================================== */

export type MealKey = "breakfast" | "lunch" | "dinner" | "snack";

export type NutrientKey =
  | "sodium"
  | "potassium"
  | "phosphorus"
  | "protein"
  | "calories"
  | "carbs"
  | "fats"
  | "fiber";

export interface FoodEntry {
  id: string;
  meal: MealKey;
  name: string;
  portion: string;
  calories: number;
  sodium: number;
  potassium: number;
  phosphorus: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

export type Goals = Record<NutrientKey, number> & { fluid: number };
