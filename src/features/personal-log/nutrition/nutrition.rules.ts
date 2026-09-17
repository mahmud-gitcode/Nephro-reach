import { parseIso, todayIso } from "../check-in/checkIn.rules";
import { NUTRIENT_ORDER } from "./nutrition.constants";
import type { FluidByDate, FoodEntry, NutrientKey } from "./nutrition.types";

/* ==========================================================================
   Nutrition log — pure rules
   --------------------------------------------------------------------------
   Days are `yyyy-mm-dd` strings, the same as every other personal log, so
   "what did I eat on Tuesday" never drifts across a timezone boundary.
   ========================================================================== */

/** The day `offset` days from `iso`, as `yyyy-mm-dd`. */
export function shiftDay(iso: string, offset: number): string {
  const date = parseIso(iso);
  date.setDate(date.getDate() + offset);
  return todayIso(date);
}

/** Nobody has eaten tomorrow's lunch yet. */
export function isFutureDay(iso: string, now = new Date()): boolean {
  return iso > todayIso(now);
}

export function foodsOn(foods: FoodEntry[], date: string): FoodEntry[] {
  return foods.filter((food) => food.date === date);
}

export function addFood(foods: FoodEntry[], food: FoodEntry): FoodEntry[] {
  return [...foods, food];
}

export function removeFood(foods: FoodEntry[], id: string): FoodEntry[] {
  return foods.filter((food) => food.id !== id);
}

export function totalsFor(foods: FoodEntry[]): Record<NutrientKey, number> {
  const totals = Object.fromEntries(
    NUTRIENT_ORDER.map((key) => [key, 0]),
  ) as Record<NutrientKey, number>;
  for (const food of foods) {
    for (const key of NUTRIENT_ORDER) totals[key] += food[key] || 0;
  }
  return totals;
}

export function fluidOn(fluids: FluidByDate, date: string): number {
  return fluids[date] ?? 0;
}

export function addFluid(
  fluids: FluidByDate,
  date: string,
  ml: number,
): FluidByDate {
  if (!(ml > 0)) return fluids;
  return { ...fluids, [date]: fluidOn(fluids, date) + ml };
}
