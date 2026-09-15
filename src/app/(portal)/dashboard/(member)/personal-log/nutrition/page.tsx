"use client";

import React, { useMemo, useState } from "react";
import { Apple, Droplet, Plus, Target, Utensils } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import {
  KeyMetricCard,
  MealTable,
  NutrientOverview,
  FluidTracker,
  type MetricItem,
} from "@/features/personal-log/nutrition/NutritionCards";
import {
  ResourceCard,
  TipsCard,
} from "@/features/personal-log/nutrition/NutritionAsides";
import {
  AddFoodModal,
  AddWaterModal,
  GoalsModal,
} from "@/features/personal-log/nutrition/NutritionModals";
import {
  DEFAULT_GOALS,
  INITIAL_FLUID_ML,
  INITIAL_FOODS,
  NUTRIENT_ORDER,
} from "@/features/personal-log/nutrition/nutrition.constants";
import { formatNumber } from "@/features/personal-log/nutrition/nutrition.format";
import type {
  FoodEntry,
  Goals,
  MealKey,
  NutrientKey,
} from "@/features/personal-log/nutrition/nutrition.types";
export default function NutritionPage() {
  const { language, dictionary } = useLanguage();
  const n = dictionary?.nutrition;
  const isEs = language === "ES";

  const [foods, setFoods] = useState<FoodEntry[]>(INITIAL_FOODS);
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [fluidMl, setFluidMl] = useState(INITIAL_FLUID_ML);

  const [addFoodMeal, setAddFoodMeal] = useState<MealKey | null>(null);
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [isWaterOpen, setIsWaterOpen] = useState(false);

  const mealLabels: Record<MealKey, string> = {
    breakfast: n?.mealsTable?.mealNames?.breakfast || "Breakfast",
    lunch: n?.mealsTable?.mealNames?.lunch || "Lunch",
    dinner: n?.mealsTable?.mealNames?.dinner || "Dinner",
    // Not in the dictionary yet, so translated inline
    snack: isEs ? "Merienda" : "Snack",
  };

  // Everything on the page is derived from the logged foods
  const totals = useMemo(() => {
    const empty: Record<NutrientKey, number> = {
      sodium: 0,
      potassium: 0,
      phosphorus: 0,
      protein: 0,
      calories: 0,
      carbs: 0,
      fats: 0,
      fiber: 0,
    };
    return foods.reduce((sum, food) => {
      NUTRIENT_ORDER.forEach((key) => {
        sum[key] += food[key];
      });
      return sum;
    }, empty);
  }, [foods]);

  const handleAddFood = (food: Omit<FoodEntry, "id">) => {
    setFoods((prev) => [...prev, { ...food, id: `food-${Date.now()}` }]);
    setAddFoodMeal(null);
  };

  const handleRemoveFood = (id: string) => {
    setFoods((prev) => prev.filter((food) => food.id !== id));
  };

  const mainMealsLogged = (
    ["breakfast", "lunch", "dinner"] as MealKey[]
  ).filter((key) => foods.some((food) => food.meal === key)).length;

  const nutrientsWithinGoal = NUTRIENT_ORDER.filter((key) => {
    const goal = goals[key];
    return goal > 0 ? totals[key] / goal < 0.95 : true;
  }).length;

  const sodiumPercent =
    goals.sodium > 0 ? Math.round((totals.sodium / goals.sodium) * 100) : 0;
  const fluidPercent =
    goals.fluid > 0 ? Math.round((fluidMl / goals.fluid) * 100) : 0;

  const keyMetrics: MetricItem[] = [
    {
      title: n?.keyMetrics?.dailyGoal?.title || "Daily Goal",
      description:
        n?.keyMetrics?.dailyGoal?.description ||
        "Stay within your daily nutrient goals",
      value: `${nutrientsWithinGoal} / ${NUTRIENT_ORDER.length}`,
      icon: Target,
      iconClass: "text-fg-brand",
      iconBg: "bg-brand-100",
      footer: n?.keyMetrics?.dailyGoal?.footer || "View Goals",
      onFooterClick: () => setIsGoalsOpen(true),
    },
    {
      title: n?.keyMetrics?.mealsLogged?.title || "Meals Logged",
      description:
        mainMealsLogged === 3
          ? n?.keyMetrics?.mealsLogged?.description || "Good job!"
          : isEs
            ? "Sigue registrando tus comidas."
            : "Keep logging your meals.",
      value: `${mainMealsLogged} / 3`,
      icon: Utensils,
      iconClass: "text-success",
      iconBg: "bg-success-100",
    },
    {
      title: n?.keyMetrics?.fluids?.title || "Fluids",
      description: `${formatNumber(fluidMl)} / ${formatNumber(goals.fluid)} ml`,
      value: `${fluidPercent}%`,
      progress: fluidPercent,
      icon: Droplet,
      iconClass: "text-brand-600",
      iconBg: "bg-brand-100",
    },
    {
      title: n?.keyMetrics?.sodium?.title || "Sodium",
      description: `${formatNumber(totals.sodium)} / ${formatNumber(goals.sodium)} mg`,
      value: `${sodiumPercent}%`,
      progress: sodiumPercent,
      icon: Apple,
      iconClass: "text-warning",
      iconBg: "bg-warning-100",
    },
  ];

  return (
    <div className="space-y-6">
      <PersonalLogDisclaimer />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[32px] leading-none font-medium text-fg">
            {n?.header?.greeting || "Good morning, Sarah"}
          </h1>
          <p className="mt-1 text-lg leading-7 font-medium tracking-[0.09px] text-fg-secondary">
            {n?.header?.subtitle ||
              "Track your daily food and nutrients to support your kidney health."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddFoodMeal("breakfast")}
          className="flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded bg-action px-4 text-base font-bold tracking-[0.08px] text-white shadow-[inset_0_-1px_0_var(--color-brand-100)] transition-colors hover:bg-action-hover"
        >
          <Plus className="h-5 w-5" />
          {n?.header?.logMeal || "Log Meal"}
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {keyMetrics.map((metric) => (
          <KeyMetricCard key={metric.title} metric={metric} />
        ))}
      </section>

      <NutrientOverview totals={totals} goals={goals} />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
        <MealTable
          foods={foods}
          mealLabels={mealLabels}
          onAddFood={(meal) => setAddFoodMeal(meal ?? "breakfast")}
          onRemoveFood={handleRemoveFood}
        />
        <div className="space-y-6">
          <FluidTracker
            fluidMl={fluidMl}
            goalMl={goals.fluid}
            onAddWater={() => setIsWaterOpen(true)}
          />
          <ResourceCard />
          <TipsCard />
        </div>
      </section>

      {addFoodMeal ? (
        <AddFoodModal
          defaultMeal={addFoodMeal}
          mealLabels={mealLabels}
          onClose={() => setAddFoodMeal(null)}
          onSave={handleAddFood}
        />
      ) : null}

      {isGoalsOpen ? (
        <GoalsModal
          goals={goals}
          onClose={() => setIsGoalsOpen(false)}
          onSave={(next) => {
            setGoals(next);
            setIsGoalsOpen(false);
          }}
        />
      ) : null}

      {isWaterOpen ? (
        <AddWaterModal
          onClose={() => setIsWaterOpen(false)}
          onSave={(ml) => {
            setFluidMl((prev) => prev + ml);
            setIsWaterOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
