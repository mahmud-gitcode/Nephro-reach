/* ==========================================================================
   Nutrition <-> the API (Phase 5): `/patients/:id/nutrition/*`
   --------------------------------------------------------------------------
   Foods are records (one call each); fluids are a running total per day
   (POST adds, in the unit the member tapped, so the server's `amountMl` is
   the only conversion); goals are one row the server owns, with its own
   defaults (`isDefault`); the day's totals and progress come from
   `/summary`. No demo day, no client defaults.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import { patientPath } from "@/features/profile/patientScope";
import type { FluidUnit } from "./fluidUnit";
import type { FoodEntry, Goals, MealKey, NutrientKey } from "./nutrition.types";

export type ApiFood = {
  id: string;
  patientId: string;
  entryDate: string;
  meal: MealKey;
  name: string;
  portion: string;
  calories: number;
  sodiumMg: number;
  potassiumMg: number;
  phosphorusMg: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  fiberG: number;
  createdAt: string;
};

export type FoodBody = Omit<ApiFood, "id" | "patientId" | "createdAt">;

export type ApiGoals = {
  calories: number;
  sodiumMg: number;
  potassiumMg: number;
  phosphorusMg: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  fiberG: number;
  fluidMl: number;
  isDefault?: boolean;
};

export type ApiNutritionDay = {
  date: string;
  nutrients: { key: NutrientKey; consumed: number; goal: number }[];
  fluid: {
    consumedMl: number;
    consumed: number;
    goalMl: number;
    goal: number;
    unit: FluidUnit;
    percent: number;
  };
};

export type ApiNutritionSummary = {
  from: string;
  to: string;
  goalsAreDefault: boolean;
  fluidUnit: FluidUnit;
  days: ApiNutritionDay[];
};

export type ApiFluidDay = {
  entryDate: string;
  amountMl: number;
  amount: number;
  unit: FluidUnit;
};

export function fromApiFood(row: ApiFood): FoodEntry {
  return {
    id: row.id,
    date: row.entryDate,
    meal: row.meal,
    name: row.name,
    portion: row.portion ?? "",
    calories: row.calories,
    sodium: row.sodiumMg,
    potassium: row.potassiumMg,
    phosphorus: row.phosphorusMg,
    protein: row.proteinG,
    carbs: row.carbsG,
    fats: row.fatsG,
    fiber: row.fiberG,
  };
}

export function toFoodBody(
  food: Omit<FoodEntry, "id" | "date">,
  entryDate: string,
): FoodBody {
  return {
    entryDate,
    meal: food.meal,
    name: food.name.trim(),
    portion: food.portion.trim(),
    calories: food.calories,
    sodiumMg: food.sodium,
    potassiumMg: food.potassium,
    phosphorusMg: food.phosphorus,
    proteinG: food.protein,
    carbsG: food.carbs,
    fatsG: food.fats,
    fiberG: food.fiber,
  };
}

export function fromApiGoals(row: ApiGoals): Goals {
  return {
    calories: row.calories,
    sodium: row.sodiumMg,
    potassium: row.potassiumMg,
    phosphorus: row.phosphorusMg,
    protein: row.proteinG,
    carbs: row.carbsG,
    fats: row.fatsG,
    fiber: row.fiberG,
    fluid: row.fluidMl,
  };
}

export function toGoalsBody(goals: Goals): Omit<ApiGoals, "isDefault"> {
  return {
    calories: goals.calories,
    sodiumMg: goals.sodium,
    potassiumMg: goals.potassium,
    phosphorusMg: goals.phosphorus,
    proteinG: goals.protein,
    carbsG: goals.carbs,
    fatsG: goals.fats,
    fiberG: goals.fiber,
    fluidMl: goals.fluid,
  };
}

/** The day's totals per nutrient, as the server summed them. */
export function totalsFromSummary(
  day: ApiNutritionDay | undefined,
): Record<NutrientKey, number> {
  const totals = {
    sodium: 0,
    potassium: 0,
    phosphorus: 0,
    protein: 0,
    calories: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
  } as Record<NutrientKey, number>;
  for (const nutrient of day?.nutrients ?? [])
    if (nutrient.key in totals) totals[nutrient.key] = nutrient.consumed;
  return totals;
}

const base = (scope: PatientScope) => patientPath(scope, "/nutrition");

export const listFoodsOn = (scope: PatientScope, day: string) =>
  fetchPage<ApiFood>(`${base(scope)}/foods`, {
    from: day,
    to: day,
    limit: 150,
  });

export const createFood = (scope: PatientScope, body: FoodBody) =>
  api<ApiFood>(`${base(scope)}/foods`, { method: "POST", body });

export const removeFood = (scope: PatientScope, id: string) =>
  api<unknown>(`${base(scope)}/foods/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

/** Adds to the day's total, in the unit the member used. */
export const addFluid = (
  scope: PatientScope,
  entryDate: string,
  amount: number,
  unit: FluidUnit,
) =>
  api<ApiFluidDay>(`${base(scope)}/fluids`, {
    method: "POST",
    body: { entryDate, amount, unit },
  });

export const getGoals = (scope: PatientScope) =>
  api<ApiGoals>(`${base(scope)}/goals`);

export const saveGoals = (scope: PatientScope, goals: Goals) =>
  api<ApiGoals>(`${base(scope)}/goals`, {
    method: "PUT",
    body: toGoalsBody(goals),
  });

export const getDaySummary = (scope: PatientScope, day: string) =>
  api<ApiNutritionSummary>(`${base(scope)}/summary`, { query: { date: day } });
