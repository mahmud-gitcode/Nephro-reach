"use client";

import React, { useState } from "react";
import { Apple, Droplet, Dumbbell, Plus, Target, Utensils } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Alert, AsyncSection, Skeleton, TabPanel, Tabs } from "@/components/ui";
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
import { NutritionDayPicker } from "@/features/personal-log/nutrition/NutritionDayPicker";
import { NUTRIENT_ORDER } from "@/features/personal-log/nutrition/nutrition.constants";
import { formatNumber } from "@/features/personal-log/nutrition/nutrition.format";
import type { MealKey } from "@/features/personal-log/nutrition/nutrition.types";
import { useNutritionLog } from "@/features/personal-log/nutrition/useNutritionLog";
import {
  relativeDayLabel,
  todayIso,
} from "@/features/personal-log/check-in/checkIn.rules";
import {
  ExerciseCard,
  ExerciseModal,
} from "@/features/personal-log/exercise/ExerciseLog";
import { useExerciseLog } from "@/features/personal-log/exercise/useExerciseLog";
import type { ExerciseEntry } from "@/features/personal-log/exercise/exercise.types";
export default function NutritionPage() {
  const { language, dictionary } = useLanguage();
  const n = dictionary?.nutrition;
  const isEs = language === "ES";

  /* The day every card below is showing. Starts on today; the picker moves
     it back to fill in a day that was missed. */
  const [date, setDate] = useState(todayIso);
  const isToday = date === todayIso();
  const dayLabel = relativeDayLabel(date, isEs);

  const {
    foods,
    totals,
    fluidMl,
    goals,
    addFood,
    removeFood,
    addWater,
    saveGoals,
    isPending,
    error,
    refetch,
    saveError,
    dismissSaveError,
  } = useNutritionLog(date);
  const exercise = useExerciseLog(date);

  /* The modal only ever edits: new activity is logged in the panel on the
     card itself, so there is nothing to open it for. */
  const [exerciseEdit, setExerciseEdit] = useState<ExerciseEntry | null>(null);
  const [isExerciseFormOpen, setIsExerciseFormOpen] = useState(false);

  type LogTab = "food" | "exercise";
  const [tab, setTab] = useState<LogTab>("food");

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
            {isEs ? "Nutrición" : "Nutrition"}
          </h1>
        </div>
        {/* The main action follows the tab, so it always adds to what the
            member is looking at. */}
        <button
          type="button"
          onClick={() =>
            tab === "food"
              ? setAddFoodMeal("breakfast")
              : setIsExerciseFormOpen(true)
          }
          className="flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded bg-action px-3 text-sm font-bold tracking-[0.08px] text-white shadow-[inset_0_-1px_0_var(--color-brand-100)] transition-colors hover:bg-action-hover sm:h-12 sm:gap-2 sm:px-4 sm:text-base"
        >
          <Plus className="h-5 w-5" />
          {tab === "food"
            ? n?.header?.logMeal || "Log Meal"
            : isEs
              ? "Registrar Actividad"
              : "Log Activity"}
        </button>
      </header>

      <NutritionDayPicker date={date} onChange={setDate} />

      <div className="overflow-x-auto">
        <Tabs<LogTab>
          label={isEs ? "Secciones del registro" : "Log sections"}
          value={tab}
          onChange={setTab}
          items={[
            {
              id: "food",
              label: isEs ? "Alimentos y Nutrición" : "Food & Nutrition",
              icon: <Utensils aria-hidden="true" />,
            },
            {
              id: "exercise",
              label: `${isEs ? "Ejercicio" : "Exercise"}${
                exercise.entries.length > 0
                  ? ` (${exercise.entries.length})`
                  : ""
              }`,
              icon: <Dumbbell aria-hidden="true" />,
            },
          ]}
        />
      </div>

      {saveError || exercise.saveError ? (
        <Alert
          tone="danger"
          title={isEs ? "No se guardó tu cambio" : "Your change did not save"}
          onDismiss={() => {
            dismissSaveError();
            exercise.dismissSaveError();
          }}
        >
          {isEs
            ? "Inténtalo de nuevo. Si sigue pasando, tu navegador puede estar bloqueando el almacenamiento."
            : "Please try again. If it keeps happening, your browser may be blocking saved data."}
        </Alert>
      ) : null}

      <AsyncSection
        pending={isPending || exercise.isPending}
        error={error ?? exercise.error}
        onRetry={() => {
          refetch();
          exercise.refetch();
        }}
        errorTitle={
          isEs
            ? "Tu registro de nutrición no se cargó"
            : "Your nutrition log did not load"
        }
        skeleton={
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} height={140} />
              ))}
            </div>
            <Skeleton height={220} />
            <Skeleton height={320} />
          </div>
        }
      >
        <TabPanel id="food" value={tab} className="space-y-6">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {keyMetrics.map((metric) => (
              <KeyMetricCard key={metric.title} metric={metric} />
            ))}
          </section>

          <NutrientOverview totals={totals} goals={goals} />

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="min-w-0">
              <MealTable
                foods={foods}
                dayLabel={dayLabel}
                isToday={isToday}
                mealLabels={mealLabels}
                onAddFood={(meal) => setAddFoodMeal(meal ?? "breakfast")}
                onRemoveFood={removeFood}
              />
            </div>
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
        </TabPanel>

        <TabPanel id="exercise" value={tab}>
          <ExerciseCard
            entries={exercise.entries}
            date={date}
            isToday={isToday}
            dayLabel={dayLabel}
            isFormOpen={isExerciseFormOpen}
            onFormOpenChange={setIsExerciseFormOpen}
            onLog={(draft) => exercise.saveEntries([draft])}
            onEdit={(entry) => setExerciseEdit(entry)}
            onDelete={(entry) => exercise.deleteEntry(entry.id)}
          />
        </TabPanel>
      </AsyncSection>

      {addFoodMeal ? (
        <AddFoodModal
          defaultMeal={addFoodMeal}
          dayLabel={dayLabel}
          mealLabels={mealLabels}
          onClose={() => setAddFoodMeal(null)}
          onSave={(food) => {
            addFood(food);
            setAddFoodMeal(null);
          }}
        />
      ) : null}

      {isGoalsOpen ? (
        <GoalsModal
          goals={goals}
          onClose={() => setIsGoalsOpen(false)}
          onSave={(next) => {
            saveGoals(next);
            setIsGoalsOpen(false);
          }}
        />
      ) : null}

      {isWaterOpen ? (
        <AddWaterModal
          dayLabel={dayLabel}
          onClose={() => setIsWaterOpen(false)}
          onSave={(ml) => {
            addWater(ml);
            setIsWaterOpen(false);
          }}
        />
      ) : null}

      {exerciseEdit ? (
        <ExerciseModal
          key={exerciseEdit.id}
          entry={exerciseEdit}
          date={date}
          dayLabel={relativeDayLabel(exerciseEdit.date, isEs)}
          onClose={() => setExerciseEdit(null)}
          onSave={(drafts) => {
            exercise.saveEntries(drafts, exerciseEdit.id);
            setExerciseEdit(null);
          }}
        />
      ) : null}
    </div>
  );
}
