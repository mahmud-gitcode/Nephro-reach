import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { DEFAULT_GOALS } from "./nutrition.constants";
import type { FluidByDate, FoodEntry, Goals } from "./nutrition.types";

/* ==========================================================================
   Nutrition log — storage
   --------------------------------------------------------------------------
   Three keys, because they change at different rates: foods and fluids are
   written many times a day, goals a few times a year.
   ========================================================================== */

const FOODS_KEY = storageKey("nutrition-foods");
const FLUIDS_KEY = storageKey("nutrition-fluids");
const GOALS_KEY = storageKey("nutrition-goals");

export async function listFoods(): Promise<FoodEntry[]> {
  const stored = await readJson<FoodEntry[] | null>(FOODS_KEY, null);
  /* An entry without a day cannot be filed under one. */
  return Array.isArray(stored)
    ? stored.filter((food) => typeof food?.date === "string")
    : [];
}

export async function saveFoods(foods: FoodEntry[]): Promise<FoodEntry[]> {
  return writeJson(FOODS_KEY, foods);
}

export async function readFluids(): Promise<FluidByDate> {
  const stored = await readJson<FluidByDate | null>(FLUIDS_KEY, null);
  return stored && typeof stored === "object" && !Array.isArray(stored)
    ? stored
    : {};
}

export async function saveFluids(fluids: FluidByDate): Promise<FluidByDate> {
  return writeJson(FLUIDS_KEY, fluids);
}

export async function readGoals(): Promise<Goals> {
  const stored = await readJson<Partial<Goals> | null>(GOALS_KEY, null);
  /* Spread over the defaults so a goal added later still has a value. */
  return { ...DEFAULT_GOALS, ...(stored ?? {}) };
}

export async function saveGoals(goals: Goals): Promise<Goals> {
  return writeJson(GOALS_KEY, goals);
}
