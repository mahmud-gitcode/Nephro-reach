"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_GOALS } from "./nutrition.constants";
import {
  listFoods,
  readFluids,
  readGoals,
  saveFluids,
  saveFoods,
  saveGoals,
} from "./nutrition.repository";
import * as rules from "./nutrition.rules";
import type { FluidByDate, FoodEntry } from "./nutrition.types";

export const nutritionFoodsKey = [
  "personal-log",
  "nutrition",
  "foods",
] as const;
export const nutritionFluidsKey = [
  "personal-log",
  "nutrition",
  "fluids",
] as const;
export const nutritionGoalsKey = [
  "personal-log",
  "nutrition",
  "goals",
] as const;

/* Stable empties, so a render before the read lands does not hand every
   memo below a new array and re-run it. */
const NO_FOODS: FoodEntry[] = [];
const NO_FLUIDS: FluidByDate = {};

/**
 * The member's food, fluid and goals, read for one day at a time.
 *
 * Same read-modify-write shape as `useCheckIns`: every write applies to
 * what is stored rather than the cache, so two quick taps on "Add Water"
 * both count.
 */
export function useNutritionLog(date: string) {
  const queryClient = useQueryClient();

  const foodsQuery = useQuery({
    queryKey: nutritionFoodsKey,
    queryFn: listFoods,
  });
  const fluidsQuery = useQuery({
    queryKey: nutritionFluidsKey,
    queryFn: readFluids,
  });
  const goalsQuery = useQuery({
    queryKey: nutritionGoalsKey,
    queryFn: readGoals,
  });

  const foodsWrite = useMutation({
    mutationFn: async (transform: (current: FoodEntry[]) => FoodEntry[]) =>
      saveFoods(transform(await listFoods())),
    onSuccess: (foods) => queryClient.setQueryData(nutritionFoodsKey, foods),
  });
  const fluidsWrite = useMutation({
    mutationFn: async (transform: (current: FluidByDate) => FluidByDate) =>
      saveFluids(transform(await readFluids())),
    onSuccess: (fluids) => queryClient.setQueryData(nutritionFluidsKey, fluids),
  });
  const goalsWrite = useMutation({
    mutationFn: saveGoals,
    onSuccess: (goals) => queryClient.setQueryData(nutritionGoalsKey, goals),
  });

  const allFoods = foodsQuery.data ?? NO_FOODS;
  const fluids = fluidsQuery.data ?? NO_FLUIDS;

  const foods = useMemo(() => rules.foodsOn(allFoods, date), [allFoods, date]);
  const totals = useMemo(() => rules.totalsFor(foods), [foods]);

  const { mutate: mutateFoods, reset: resetFoods } = foodsWrite;
  const { mutate: mutateFluids, reset: resetFluids } = fluidsWrite;
  const { reset: resetGoals } = goalsWrite;

  /* The day is taken from the hook, not the form, so a food is always filed
     under the day the member is looking at. */
  const addFood = useCallback(
    (food: Omit<FoodEntry, "id" | "date">) =>
      mutateFoods((current) =>
        rules.addFood(current, {
          ...food,
          id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          date,
        }),
      ),
    [mutateFoods, date],
  );

  const removeFood = useCallback(
    (id: string) => mutateFoods((current) => rules.removeFood(current, id)),
    [mutateFoods],
  );

  const addWater = useCallback(
    (ml: number) =>
      mutateFluids((current) => rules.addFluid(current, date, ml)),
    [mutateFluids, date],
  );

  const dismissSaveError = useCallback(() => {
    resetFoods();
    resetFluids();
    resetGoals();
  }, [resetFoods, resetFluids, resetGoals]);

  return {
    foods,
    totals,
    fluidMl: rules.fluidOn(fluids, date),
    goals: goalsQuery.data ?? DEFAULT_GOALS,

    addFood,
    removeFood,
    addWater,
    saveGoals: goalsWrite.mutate,

    isPending:
      foodsQuery.isPending || fluidsQuery.isPending || goalsQuery.isPending,
    error: foodsQuery.error ?? fluidsQuery.error ?? goalsQuery.error,
    refetch: () => {
      void foodsQuery.refetch();
      void fluidsQuery.refetch();
      void goalsQuery.refetch();
    },
    saveError: foodsWrite.error ?? fluidsWrite.error ?? goalsWrite.error,
    dismissSaveError,
    isSaving:
      foodsWrite.isPending || fluidsWrite.isPending || goalsWrite.isPending,
  };
}
