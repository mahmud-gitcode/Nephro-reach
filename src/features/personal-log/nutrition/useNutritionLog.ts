"use client";

/* ==========================================================================
   The member's food, fluid and goals for one day, from the API (Phase 5)
   --------------------------------------------------------------------------
   Reads: the day's foods, the goals and the day's `/summary` (totals and
   fluid, summed by the server). Writes: one call each. Two quick taps on
   "Add Fluid" are two POSTs, and the server adds them: no
   read-modify-write. Goals show only after a successful read (the server
   owns the defaults and says when they are defaults).
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import type { FluidUnit } from "./fluidUnit";
import {
  addFluid,
  createFood,
  fromApiFood,
  fromApiGoals,
  getDaySummary,
  getGoals,
  listFoodsOn,
  removeFood as removeFoodCall,
  saveGoals as saveGoalsCall,
  toFoodBody,
  totalsFromSummary,
} from "./nutrition.repository";
import type { FoodEntry, Goals } from "./nutrition.types";

const NO_FOODS: FoodEntry[] = [];

/** Shown only while the reads are pending (the page shows its skeleton). */
const PENDING_GOALS: Goals = {
  sodium: 0,
  potassium: 0,
  phosphorus: 0,
  protein: 0,
  calories: 0,
  carbs: 0,
  fats: 0,
  fiber: 0,
  fluid: 0,
};

export function useNutritionLog(
  date: string,
  explicitScope?: PatientScope | null,
) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const featureKey = scopedKey(scope, "nutrition");

  const foodsQuery = useQuery({
    queryKey: scopedKey(scope, "nutrition", "foods", date),
    queryFn: async () =>
      (await listFoodsOn(requireScope(scope), date)).items.map(fromApiFood),
  });
  const goalsQuery = useQuery({
    queryKey: scopedKey(scope, "nutrition", "goals"),
    queryFn: () => getGoals(requireScope(scope)),
  });
  const summaryQuery = useQuery({
    queryKey: scopedKey(scope, "nutrition", "summary", date),
    queryFn: () => getDaySummary(requireScope(scope), date),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: featureKey });

  const foodAdd = useMutation({
    mutationFn: (food: Omit<FoodEntry, "id" | "date">) =>
      createFood(requireScope(scope), toFoodBody(food, date)),
    onSuccess: refresh,
  });
  const foodRemove = useMutation({
    mutationFn: (id: string) => removeFoodCall(requireScope(scope), id),
    onSuccess: refresh,
  });
  const fluidAdd = useMutation({
    mutationFn: ({ amount, unit }: { amount: number; unit: FluidUnit }) =>
      addFluid(requireScope(scope), date, amount, unit),
    onSuccess: refresh,
  });
  const goalsSave = useMutation({
    mutationFn: (goals: Goals) => saveGoalsCall(requireScope(scope), goals),
    onSuccess: refresh,
  });

  const foods = foodsQuery.data ?? NO_FOODS;
  const day = summaryQuery.data?.days.find((d) => d.date === date);
  const totals = useMemo(() => totalsFromSummary(day), [day]);

  const { mutate: addFoodMutate, reset: resetFoodAdd } = foodAdd;
  const { mutate: removeFoodMutate, reset: resetFoodRemove } = foodRemove;
  const { mutate: addFluidMutate, reset: resetFluid } = fluidAdd;
  const { reset: resetGoals } = goalsSave;

  const addFood = useCallback(
    (food: Omit<FoodEntry, "id" | "date">, onSaved?: () => void) =>
      addFoodMutate(food, { onSuccess: () => onSaved?.() }),
    [addFoodMutate],
  );
  const removeFood = useCallback(
    (id: string) => removeFoodMutate(id),
    [removeFoodMutate],
  );
  /** Adds what the member drank, in the unit they used. */
  const addWater = useCallback(
    (amount: number, unit: FluidUnit, onSaved?: () => void) =>
      addFluidMutate({ amount, unit }, { onSuccess: () => onSaved?.() }),
    [addFluidMutate],
  );

  const dismissSaveError = useCallback(() => {
    resetFoodAdd();
    resetFoodRemove();
    resetFluid();
    resetGoals();
  }, [resetFoodAdd, resetFoodRemove, resetFluid, resetGoals]);

  return {
    foods,
    totals,
    /** Millilitres drunk that day, as the server summed them. */
    fluidMl: day?.fluid.consumedMl ?? 0,
    goals: goalsQuery.data ? fromApiGoals(goalsQuery.data) : PENDING_GOALS,
    /** The server's default goals, not ones the member or a dietitian set. */
    goalsAreDefault: goalsQuery.data?.isDefault === true,

    addFood,
    removeFood,
    addWater,
    saveGoals: (goals: Goals, onSaved?: () => void) =>
      goalsSave.mutate(goals, { onSuccess: () => onSaved?.() }),

    isPending:
      foodsQuery.isPending || goalsQuery.isPending || summaryQuery.isPending,
    error: foodsQuery.error ?? goalsQuery.error ?? summaryQuery.error,
    isError: foodsQuery.isError || goalsQuery.isError || summaryQuery.isError,
    refetch: () => {
      void foodsQuery.refetch();
      void goalsQuery.refetch();
      void summaryQuery.refetch();
    },
    saveError:
      foodAdd.error ?? foodRemove.error ?? fluidAdd.error ?? goalsSave.error,
    dismissSaveError,
    isSaving:
      foodAdd.isPending ||
      foodRemove.isPending ||
      fluidAdd.isPending ||
      goalsSave.isPending,
  };
}
