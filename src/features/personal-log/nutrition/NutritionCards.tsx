"use client";

import React from "react";
import { ChevronRight, Droplet, Plus, Trash2, Utensils } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Progress } from "@/components/ui";
import { formatNumber, statusForPercent } from "./nutrition.format";
import {
  MEAL_KEYS,
  NUTRIENT_ORDER,
  NUTRIENT_UNITS,
} from "./nutrition.constants";
import type { FoodEntry, Goals, MealKey, NutrientKey } from "./nutrition.types";

/* The read-only half of the nutrition screen: the four metric cards, the
   nutrient breakdown, the meal table and the fluid ring. */

export interface MetricItem {
  title: string;
  description: string;
  value?: string;
  progress?: number;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  iconBg: string;
  footer?: string;
  onFooterClick?: () => void;
}

export function KeyMetricCard({ metric }: { metric: MetricItem }) {
  return (
    <article className="rounded-[10px] border border-line bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${metric.iconBg}`}
        >
          <metric.icon className={`h-5 w-5 ${metric.iconClass}`} />
        </div>
        {metric.value && (
          <p className="text-xl leading-7 font-semibold tracking-[0.1px] text-fg">
            {metric.value}
          </p>
        )}
      </div>
      <h2 className="mt-3 text-lg leading-7 font-medium tracking-[0.09px] text-fg">
        {metric.title}
      </h2>
      <p className="mt-1 text-sm leading-5 font-medium tracking-[0.07px] text-fg-muted">
        {metric.description}
      </p>
      {metric.progress !== undefined && (
        <div className="mt-3">
          <Progress value={metric.progress} label={metric.title} />
        </div>
      )}
      {metric.footer && (
        <button
          type="button"
          onClick={metric.onFooterClick}
          className="mt-3 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-fg-brand hover:text-fg-brand"
        >
          {metric.footer}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </article>
  );
}

export function NutrientOverview({
  totals,
  goals,
}: {
  totals: Record<NutrientKey, number>;
  goals: Goals;
}) {
  const { dictionary } = useLanguage();
  const n = dictionary?.nutrition;

  const statusStyles = {
    within: {
      label: n?.nutrientOverview?.statuses?.within || "Within Goal",
      dot: "bg-success-600",
      text: "text-success",
      track: "bg-success-600",
      bg: "bg-success-surface",
    },
    near: {
      label: n?.nutrientOverview?.statuses?.near || "Near Limit",
      dot: "bg-warning-500",
      text: "text-warning",
      track: "bg-warning-500",
      bg: "bg-warning-surface",
    },
    over: {
      label: n?.nutrientOverview?.statuses?.over || "Over Limit",
      dot: "bg-danger-solid",
      text: "text-danger",
      track: "bg-danger-solid",
      bg: "bg-danger-surface",
    },
  };

  const fallbackNames: Record<NutrientKey, string> = {
    sodium: "Sodium",
    potassium: "Potassium",
    phosphorus: "Phosphorus",
    protein: "Protein",
    calories: "Calories",
    carbs: "Carbs",
    fats: "Fats",
    fiber: "Fiber",
  };

  return (
    <section className="rounded-[10px] border border-line bg-[var(--color-gray-100)] p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl leading-7 font-medium tracking-[0.1px] text-fg">
          {n?.nutrientOverview?.title || "Nutrient Overview"}
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-fg-muted">
          {Object.entries(statusStyles).map(([key, style]) => (
            <span key={key} className="inline-flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
              {style.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {NUTRIENT_ORDER.map((key) => {
          const consumed = totals[key];
          const goal = goals[key];
          const percent = goal > 0 ? Math.round((consumed / goal) * 100) : 0;
          const style = statusStyles[statusForPercent(percent)];
          const name =
            n?.nutrientOverview?.nutrients?.[key] || fallbackNames[key];

          return (
            <article
              key={key}
              className="rounded-xl border border-[var(--color-gray-200)] bg-surface p-3.5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base leading-6 font-medium tracking-[0.08px] text-fg">
                    {name}
                  </h3>
                  <p className="mt-1 text-sm leading-5 font-medium tracking-[0.07px] text-fg-muted">
                    {formatNumber(consumed)} / {formatNumber(goal)}{" "}
                    {NUTRIENT_UNITS[key]}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold ${style.bg} ${style.text}`}
                >
                  {percent}%
                </span>
              </div>
              <div className="mt-3">
                <Progress
                  value={percent}
                  label={`${name} against goal`}
                  tone={
                    status === "over"
                      ? "danger"
                      : status === "near"
                        ? "warning"
                        : "success"
                  }
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function MealTable({
  foods,
  mealLabels,
  onAddFood,
  onRemoveFood,
}: {
  foods: FoodEntry[];
  mealLabels: Record<MealKey, string>;
  onAddFood: (meal?: MealKey) => void;
  onRemoveFood: (id: string) => void;
}) {
  const { language, dictionary } = useLanguage();
  const n = dictionary?.nutrition;
  const isEs = language === "ES";

  const mealsWithFood = MEAL_KEYS.map((key) => ({
    key,
    label: mealLabels[key],
    foods: foods.filter((food) => food.meal === key),
  })).filter((meal) => meal.foods.length > 0);

  return (
    <section className="rounded-[10px] border border-line bg-[var(--color-gray-100)] p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl leading-7 font-medium tracking-[0.1px] text-fg">
            {n?.mealsTable?.title || "Today's Meals"}
          </h2>
          <p className="mt-1 text-sm leading-5 font-medium tracking-[0.07px] text-fg-muted">
            {n?.mealsTable?.subtitle ||
              "Review meals and key kidney-related nutrients."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAddFood()}
          className="flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded bg-action px-4 text-sm font-bold tracking-[0.07px] text-white shadow-[inset_0_-1px_0_var(--color-brand-100)] transition-colors hover:bg-action-hover"
        >
          <Plus className="h-5 w-5" />
          {n?.mealsTable?.addFood || "Add Food"}
        </button>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-gray-200)] bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-surface-sunken text-xs font-semibold tracking-[0.06px] text-fg-muted uppercase">
              <tr>
                <th className="px-4 py-3">
                  {n?.mealsTable?.headers?.food || "Food"}
                </th>
                <th className="px-4 py-3">
                  {n?.mealsTable?.headers?.portion || "Portion"}
                </th>
                <th className="px-4 py-3">
                  {n?.mealsTable?.headers?.calories || "Calories"}
                </th>
                <th className="px-4 py-3">
                  {n?.mealsTable?.headers?.sodium || "Sodium"}
                </th>
                <th className="px-4 py-3">
                  {n?.mealsTable?.headers?.potassium || "Potassium"}
                </th>
                <th className="px-4 py-3">
                  {n?.mealsTable?.headers?.phosphorus || "Phosphorus"}
                </th>
                <th className="px-4 py-3 text-right">
                  {n?.mealsTable?.headers?.action || "Action"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {mealsWithFood.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <p className="text-sm font-semibold text-fg-muted">
                      {isEs
                        ? "Aún no hay comidas registradas hoy."
                        : "No meals logged yet today."}
                    </p>
                    <p className="mt-1 text-sm text-fg-subtle">
                      {isEs
                        ? "Usa Agregar Alimento para empezar."
                        : "Use Add Food to get started."}
                    </p>
                  </td>
                </tr>
              ) : (
                mealsWithFood.map((meal) => {
                  const mealCalories = meal.foods.reduce(
                    (sum, food) => sum + food.calories,
                    0,
                  );

                  return (
                    <React.Fragment key={meal.key}>
                      <tr className="bg-[var(--color-gray-50)]">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-2 text-base font-medium text-fg">
                              <Utensils className="h-5 w-5 text-fg-brand" />
                              {meal.label}
                            </span>
                            <span className="text-sm font-medium text-fg-muted">
                              {formatNumber(mealCalories)} kcal
                            </span>
                          </div>
                        </td>
                      </tr>
                      {meal.foods.map((food) => (
                        <tr key={food.id} className="text-fg-secondary">
                          <td className="px-4 py-3 font-medium text-fg">
                            {food.name}
                          </td>
                          <td className="px-4 py-3">{food.portion || "—"}</td>
                          <td className="px-4 py-3">
                            {formatNumber(food.calories)}
                          </td>
                          <td className="px-4 py-3">
                            {formatNumber(food.sodium)} mg
                          </td>
                          <td className="px-4 py-3">
                            {formatNumber(food.potassium)} mg
                          </td>
                          <td className="px-4 py-3">
                            {formatNumber(food.phosphorus)} mg
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => onRemoveFood(food.id)}
                              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-danger-surface hover:text-danger"
                              aria-label={
                                isEs
                                  ? `Eliminar ${food.name}`
                                  : `Remove ${food.name}`
                              }
                              title={isEs ? "Eliminar" : "Remove"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onAddFood()}
        className="mt-3 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded border border-line bg-[var(--color-gray-50)] px-4 text-base font-bold tracking-[0.08px] text-fg-brand transition-colors hover:bg-surface"
      >
        <Plus className="h-5 w-5" />
        {n?.mealsTable?.logMeal || "Log Meal"}
      </button>
    </section>
  );
}

export function FluidTracker({
  fluidMl,
  goalMl,
  onAddWater,
}: {
  fluidMl: number;
  goalMl: number;
  onAddWater: () => void;
}) {
  const { dictionary } = useLanguage();
  const n = dictionary?.nutrition;

  const percent = goalMl > 0 ? Math.round((fluidMl / goalMl) * 100) : 0;
  // Each drop represents a seventh of the daily goal
  const filledDrops = Math.min(7, Math.round((percent / 100) * 7));

  return (
    <section className="rounded-[10px] border border-line bg-[var(--color-gray-100)] p-3">
      <h2 className="text-lg leading-7 font-medium tracking-[0.09px] text-fg">
        {n?.fluidTracker?.title || "Fluid Tracker"}
      </h2>
      <div className="mt-3 rounded-xl border border-[var(--color-gray-200)] bg-surface p-3.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[32px] leading-none font-semibold text-fg">
              {formatNumber(fluidMl)} ml
            </p>
            <p className="mt-1 text-sm leading-5 font-medium text-fg-muted">
              of {formatNumber(goalMl)} ml
            </p>
          </div>
          <p
            className={`text-xl font-semibold ${
              percent >= 100 ? "text-danger" : "text-fg-brand"
            }`}
          >
            {percent}%
          </p>
        </div>
        <div className="mt-4">
          <Progress
            value={percent}
            label="Fluid intake against goal"
            tone={percent >= 100 ? "danger" : "primary"}
          />
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }).map((_, index) => (
            <span
              key={index}
              className={`flex h-8 items-center justify-center rounded-lg ${
                index < filledDrops
                  ? "bg-brand-100 text-fg-brand"
                  : "bg-surface-sunken text-fg-subtle"
              }`}
            >
              <Droplet className="h-4 w-4" />
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={onAddWater}
          className="mt-4 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded bg-action px-4 text-sm font-bold text-white transition-colors hover:bg-action-hover"
        >
          <Plus className="h-4 w-4" />
          {n?.fluidTracker?.addWater || "Add Water"}
        </button>
      </div>
    </section>
  );
}
