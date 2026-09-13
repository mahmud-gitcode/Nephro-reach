"use client";

import React, { useMemo, useState } from "react";
import {
  Apple,
  CheckCircle2,
  ChevronRight,
  Droplet,
  FileText,
  Plus,
  Target,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";

type MealKey = "breakfast" | "lunch" | "dinner" | "snack";

type NutrientKey =
  | "sodium"
  | "potassium"
  | "phosphorus"
  | "protein"
  | "calories"
  | "carbs"
  | "fats"
  | "fiber";

interface FoodEntry {
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

type Goals = Record<NutrientKey, number> & { fluid: number };

const MEAL_KEYS: MealKey[] = ["breakfast", "lunch", "dinner", "snack"];

/** Units per nutrient, used by the overview cards and the goals form. */
const NUTRIENT_UNITS: Record<NutrientKey, string> = {
  sodium: "mg",
  potassium: "mg",
  phosphorus: "mg",
  protein: "g",
  calories: "kcal",
  carbs: "g",
  fats: "g",
  fiber: "g",
};

const NUTRIENT_ORDER: NutrientKey[] = [
  "sodium",
  "potassium",
  "phosphorus",
  "protein",
  "calories",
  "carbs",
  "fats",
  "fiber",
];

const DEFAULT_GOALS: Goals = {
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

const INITIAL_FOODS: FoodEntry[] = [
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

const INITIAL_FLUID_ML = 1100;

function toNumber(value: string) {
  const parsed = parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function formatNumber(value: number) {
  return Math.round(value).toLocaleString();
}

/** Under 80% is on track, 80-94% is close to the limit, 95%+ is over. */
function statusForPercent(percent: number) {
  if (percent >= 95) return "over" as const;
  if (percent >= 80) return "near" as const;
  return "within" as const;
}

function ProgressBar({ value, className }: { value: number; className: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${className}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

interface MetricItem {
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

function KeyMetricCard({ metric }: { metric: MetricItem }) {
  return (
    <article className="rounded-[10px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${metric.iconBg}`}
        >
          <metric.icon className={`h-5 w-5 ${metric.iconClass}`} />
        </div>
        {metric.value && (
          <p className="text-xl font-semibold leading-7 tracking-[0.1px] text-slate-950">
            {metric.value}
          </p>
        )}
      </div>
      <h2 className="mt-3 text-lg font-medium leading-7 tracking-[0.09px] text-slate-950">
        {metric.title}
      </h2>
      <p className="mt-1 text-sm font-medium leading-5 tracking-[0.07px] text-slate-500">
        {metric.description}
      </p>
      {metric.progress !== undefined && (
        <div className="mt-3">
          <ProgressBar value={metric.progress} className="bg-blue-600" />
        </div>
      )}
      {metric.footer && (
        <button
          type="button"
          onClick={metric.onFooterClick}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          {metric.footer}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </article>
  );
}

function NutrientOverview({
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
      dot: "bg-emerald-500",
      text: "text-emerald-600",
      track: "bg-emerald-500",
      bg: "bg-emerald-50",
    },
    near: {
      label: n?.nutrientOverview?.statuses?.near || "Near Limit",
      dot: "bg-amber-500",
      text: "text-amber-600",
      track: "bg-amber-500",
      bg: "bg-amber-50",
    },
    over: {
      label: n?.nutrientOverview?.statuses?.over || "Over Limit",
      dot: "bg-red-500",
      text: "text-red-600",
      track: "bg-red-500",
      bg: "bg-red-50",
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
    <section className="rounded-[10px] border border-slate-200 bg-[#F1F5FA] p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">
          {n?.nutrientOverview?.title || "Nutrient Overview"}
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
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
          const name = n?.nutrientOverview?.nutrients?.[key] || fallbackNames[key];

          return (
            <article
              key={key}
              className="rounded-xl border border-[#E9EEF4] bg-white p-3.5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
                    {name}
                  </h3>
                  <p className="mt-1 text-sm font-medium leading-5 tracking-[0.07px] text-slate-500">
                    {formatNumber(consumed)} / {formatNumber(goal)} {NUTRIENT_UNITS[key]}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold ${style.bg} ${style.text}`}
                >
                  {percent}%
                </span>
              </div>
              <div className="mt-3">
                <ProgressBar value={percent} className={style.track} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MealTable({
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
    <section className="rounded-[10px] border border-slate-200 bg-[#F1F5FA] p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">
            {n?.mealsTable?.title || "Today's Meals"}
          </h2>
          <p className="mt-1 text-sm font-medium leading-5 tracking-[0.07px] text-slate-500">
            {n?.mealsTable?.subtitle || "Review meals and key kidney-related nutrients."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAddFood()}
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-sm font-bold tracking-[0.07px] text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700 cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          {n?.mealsTable?.addFood || "Add Food"}
        </button>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-[#E9EEF4] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.06px] text-slate-500">
              <tr>
                <th className="px-4 py-3">{n?.mealsTable?.headers?.food || "Food"}</th>
                <th className="px-4 py-3">{n?.mealsTable?.headers?.portion || "Portion"}</th>
                <th className="px-4 py-3">{n?.mealsTable?.headers?.calories || "Calories"}</th>
                <th className="px-4 py-3">{n?.mealsTable?.headers?.sodium || "Sodium"}</th>
                <th className="px-4 py-3">{n?.mealsTable?.headers?.potassium || "Potassium"}</th>
                <th className="px-4 py-3">{n?.mealsTable?.headers?.phosphorus || "Phosphorus"}</th>
                <th className="px-4 py-3 text-right">
                  {n?.mealsTable?.headers?.action || "Action"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mealsWithFood.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <p className="text-sm font-semibold text-slate-600">
                      {isEs ? "Aún no hay comidas registradas hoy." : "No meals logged yet today."}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
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
                      <tr className="bg-[#F8FAFC]">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-2 text-base font-medium text-slate-950">
                              <Utensils className="h-5 w-5 text-blue-600" />
                              {meal.label}
                            </span>
                            <span className="text-sm font-medium text-slate-500">
                              {formatNumber(mealCalories)} kcal
                            </span>
                          </div>
                        </td>
                      </tr>
                      {meal.foods.map((food) => (
                        <tr key={food.id} className="text-slate-700">
                          <td className="px-4 py-3 font-medium text-slate-950">{food.name}</td>
                          <td className="px-4 py-3">{food.portion || "—"}</td>
                          <td className="px-4 py-3">{formatNumber(food.calories)}</td>
                          <td className="px-4 py-3">{formatNumber(food.sodium)} mg</td>
                          <td className="px-4 py-3">{formatNumber(food.potassium)} mg</td>
                          <td className="px-4 py-3">{formatNumber(food.phosphorus)} mg</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => onRemoveFood(food.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                              aria-label={
                                isEs ? `Eliminar ${food.name}` : `Remove ${food.name}`
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
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold tracking-[0.08px] text-blue-600 transition-colors hover:bg-white cursor-pointer"
      >
        <Plus className="h-5 w-5" />
        {n?.mealsTable?.logMeal || "Log Meal"}
      </button>
    </section>
  );
}

function FluidTracker({
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
    <section className="rounded-[10px] border border-slate-200 bg-[#F1F5FA] p-3">
      <h2 className="text-lg font-medium leading-7 tracking-[0.09px] text-slate-950">
        {n?.fluidTracker?.title || "Fluid Tracker"}
      </h2>
      <div className="mt-3 rounded-xl border border-[#E9EEF4] bg-white p-3.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[32px] font-semibold leading-none text-slate-950">
              {formatNumber(fluidMl)} ml
            </p>
            <p className="mt-1 text-sm font-medium leading-5 text-slate-500">
              of {formatNumber(goalMl)} ml
            </p>
          </div>
          <p
            className={`text-xl font-semibold ${
              percent >= 100 ? "text-red-600" : "text-blue-600"
            }`}
          >
            {percent}%
          </p>
        </div>
        <div className="mt-4">
          <ProgressBar
            value={percent}
            className={percent >= 100 ? "bg-red-500" : "bg-blue-600"}
          />
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }).map((_, index) => (
            <span
              key={index}
              className={`flex h-8 items-center justify-center rounded-lg ${
                index < filledDrops
                  ? "bg-blue-100 text-blue-600"
                  : "bg-slate-100 text-slate-300"
              }`}
            >
              <Droplet className="h-4 w-4" />
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={onAddWater}
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded bg-blue-600 px-4 text-sm font-bold text-white transition-colors hover:bg-blue-700 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {n?.fluidTracker?.addWater || "Add Water"}
        </button>
      </div>
    </section>
  );
}

function ResourceCard() {
  const { dictionary } = useLanguage();
  const n = dictionary?.nutrition;

  const defaultResources = [
    "CKD Renal Diet Guide",
    "Phosphorus & Potassium Guide",
    "Low Sodium Shopping List",
  ];

  const items = n?.resources?.items || defaultResources;

  return (
    <section className="rounded-[10px] border border-slate-200 bg-[#F1F5FA] p-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium leading-7 tracking-[0.09px] text-slate-950">
          {n?.resources?.title || "Resources"}
        </h2>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((resource: string) => (
          <button
            key={resource}
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-[#E9EEF4] bg-white p-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50 cursor-pointer"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <FileText className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium leading-5 text-slate-950">
              {resource}
            </span>
            <span className="rounded bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-600">
              PDF
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function TipsCard() {
  const { dictionary } = useLanguage();
  const n = dictionary?.nutrition;

  const defaultTips = [
    "Choose fresh foods and cook at home to control sodium.",
    "Avoid high potassium foods like bananas, oranges, and potatoes.",
    "Choose lean proteins in the right portions.",
    "Track your fluid intake every day.",
  ];

  const items = n?.dietTips?.items || defaultTips;

  return (
    <section className="rounded-[10px] border border-slate-200 bg-[#F1F5FA] p-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium leading-7 tracking-[0.09px] text-slate-950">
          {n?.dietTips?.title || "Diet Tips"}
        </h2>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((tip: string) => (
          <div key={tip} className="flex gap-2 rounded-xl border border-[#E9EEF4] bg-white p-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm font-medium leading-5 text-slate-700">{tip}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const FIELD_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function NumberField({
  id,
  label,
  unit,
  value,
  onChange,
}: {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold text-slate-800">
        {label} <span className="font-semibold text-slate-400">({unit})</span>
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0"
        className={FIELD_CLASS}
      />
    </div>
  );
}

function AddFoodModal({
  defaultMeal,
  mealLabels,
  onClose,
  onSave,
}: {
  defaultMeal: MealKey;
  mealLabels: Record<MealKey, string>;
  onClose: () => void;
  onSave: (food: Omit<FoodEntry, "id">) => void;
}) {
  const { language, dictionary } = useLanguage();
  const n = dictionary?.nutrition;
  const isEs = language === "ES";

  const [meal, setMeal] = useState<MealKey>(defaultMeal);
  const [name, setName] = useState("");
  const [portion, setPortion] = useState("");
  const [values, setValues] = useState<Record<NutrientKey, string>>({
    calories: "",
    sodium: "",
    potassium: "",
    phosphorus: "",
    protein: "",
    carbs: "",
    fats: "",
    fiber: "",
  });
  const [error, setError] = useState("");

  const setValue = (key: NutrientKey, next: string) =>
    setValues((prev) => ({ ...prev, [key]: next }));

  const nutrientLabel = (key: NutrientKey, fallback: string) =>
    n?.nutrientOverview?.nutrients?.[key] || fallback;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(isEs ? "Ingrese el nombre del alimento." : "Enter a food name.");
      return;
    }

    onSave({
      meal,
      name: name.trim(),
      portion: portion.trim(),
      calories: toNumber(values.calories),
      sodium: toNumber(values.sodium),
      potassium: toNumber(values.potassium),
      phosphorus: toNumber(values.phosphorus),
      protein: toNumber(values.protein),
      carbs: toNumber(values.carbs),
      fats: toNumber(values.fats),
      fiber: toNumber(values.fiber),
    });
  };

  return (
    <ModalShell
      title={n?.mealsTable?.addFood || "Add Food"}
      subtitle={
        isEs
          ? "Agrega un alimento a una comida de hoy."
          : "Add a food to one of today's meals."
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="space-y-1.5">
          <label htmlFor="food-meal" className="block text-xs font-bold text-slate-800">
            {isEs ? "Comida" : "Meal"}
          </label>
          <select
            id="food-meal"
            value={meal}
            onChange={(event) => setMeal(event.target.value as MealKey)}
            className={`${FIELD_CLASS} cursor-pointer`}
          >
            {MEAL_KEYS.map((key) => (
              <option key={key} value={key}>
                {mealLabels[key]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="food-name" className="block text-xs font-bold text-slate-800">
              {n?.mealsTable?.headers?.food || "Food"}{" "}
              <span className="text-rose-500">*</span>
            </label>
            <input
              id="food-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={isEs ? "ej. Avena" : "e.g. Oatmeal"}
              className={FIELD_CLASS}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="food-portion" className="block text-xs font-bold text-slate-800">
              {n?.mealsTable?.headers?.portion || "Portion"}
            </label>
            <input
              id="food-portion"
              value={portion}
              onChange={(event) => setPortion(event.target.value)}
              placeholder={isEs ? "ej. 1 taza" : "e.g. 1 cup"}
              className={FIELD_CLASS}
            />
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {isEs ? "Nutrientes Renales" : "Kidney Nutrients"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              id="food-calories"
              label={nutrientLabel("calories", "Calories")}
              unit={NUTRIENT_UNITS.calories}
              value={values.calories}
              onChange={(next) => setValue("calories", next)}
            />
            <NumberField
              id="food-sodium"
              label={nutrientLabel("sodium", "Sodium")}
              unit={NUTRIENT_UNITS.sodium}
              value={values.sodium}
              onChange={(next) => setValue("sodium", next)}
            />
            <NumberField
              id="food-potassium"
              label={nutrientLabel("potassium", "Potassium")}
              unit={NUTRIENT_UNITS.potassium}
              value={values.potassium}
              onChange={(next) => setValue("potassium", next)}
            />
            <NumberField
              id="food-phosphorus"
              label={nutrientLabel("phosphorus", "Phosphorus")}
              unit={NUTRIENT_UNITS.phosphorus}
              value={values.phosphorus}
              onChange={(next) => setValue("phosphorus", next)}
            />
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {isEs ? "Macronutrientes (opcional)" : "Macros (optional)"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              id="food-protein"
              label={nutrientLabel("protein", "Protein")}
              unit={NUTRIENT_UNITS.protein}
              value={values.protein}
              onChange={(next) => setValue("protein", next)}
            />
            <NumberField
              id="food-carbs"
              label={nutrientLabel("carbs", "Carbs")}
              unit={NUTRIENT_UNITS.carbs}
              value={values.carbs}
              onChange={(next) => setValue("carbs", next)}
            />
            <NumberField
              id="food-fats"
              label={nutrientLabel("fats", "Fats")}
              unit={NUTRIENT_UNITS.fats}
              value={values.fats}
              onChange={(next) => setValue("fats", next)}
            />
            <NumberField
              id="food-fiber"
              label={nutrientLabel("fiber", "Fiber")}
              unit={NUTRIENT_UNITS.fiber}
              value={values.fiber}
              onChange={(next) => setValue("fiber", next)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
          >
            {isEs ? "Cancelar" : "Cancel"}
          </button>
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-2xs transition-colors hover:bg-blue-700 cursor-pointer"
          >
            {n?.mealsTable?.addFood || "Add Food"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function GoalsModal({
  goals,
  onClose,
  onSave,
}: {
  goals: Goals;
  onClose: () => void;
  onSave: (next: Goals) => void;
}) {
  const { language, dictionary } = useLanguage();
  const n = dictionary?.nutrition;
  const isEs = language === "ES";

  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = { fluid: `${goals.fluid}` };
    NUTRIENT_ORDER.forEach((key) => {
      initial[key] = `${goals[key]}`;
    });
    return initial;
  });

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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = { fluid: toNumber(draft.fluid) } as Goals;
    NUTRIENT_ORDER.forEach((key) => {
      next[key] = toNumber(draft[key]);
    });
    onSave(next);
  };

  return (
    <ModalShell
      title={n?.keyMetrics?.dailyGoal?.footer || "Daily Goals"}
      subtitle={
        isEs
          ? "Define tus límites diarios. Confírmalos con tu equipo de nefrología."
          : "Set your daily targets. Confirm them with your nephrology team."
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          {NUTRIENT_ORDER.map((key) => (
            <NumberField
              key={key}
              id={`goal-${key}`}
              label={n?.nutrientOverview?.nutrients?.[key] || fallbackNames[key]}
              unit={NUTRIENT_UNITS[key]}
              value={draft[key]}
              onChange={(next) => setDraft((prev) => ({ ...prev, [key]: next }))}
            />
          ))}
          <NumberField
            id="goal-fluid"
            label={n?.keyMetrics?.fluids?.title || "Fluids"}
            unit="ml"
            value={draft.fluid}
            onChange={(next) => setDraft((prev) => ({ ...prev, fluid: next }))}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
          >
            {isEs ? "Cancelar" : "Cancel"}
          </button>
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-2xs transition-colors hover:bg-blue-700 cursor-pointer"
          >
            {isEs ? "Guardar Metas" : "Save Goals"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

const WATER_PRESETS = [120, 240, 330, 500];

function AddWaterModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (ml: number) => void;
}) {
  const { language, dictionary } = useLanguage();
  const n = dictionary?.nutrition;
  const isEs = language === "ES";

  const [amount, setAmount] = useState("240");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const ml = toNumber(amount);
    if (ml > 0) onSave(ml);
  };

  return (
    <ModalShell
      title={n?.fluidTracker?.addWater || "Add Water"}
      subtitle={
        isEs ? "Registra lo que acabas de beber." : "Log what you just drank."
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="grid grid-cols-4 gap-2">
          {WATER_PRESETS.map((preset) => {
            const isSelected = toNumber(amount) === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(`${preset}`)}
                className={`rounded-xl border px-2 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {preset} ml
              </button>
            );
          })}
        </div>

        <NumberField
          id="water-amount"
          label={isEs ? "Cantidad" : "Amount"}
          unit="ml"
          value={amount}
          onChange={setAmount}
        />

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
          >
            {isEs ? "Cancelar" : "Cancel"}
          </button>
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-2xs transition-colors hover:bg-blue-700 cursor-pointer"
          >
            {n?.fluidTracker?.addWater || "Add Water"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

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

  const mainMealsLogged = (["breakfast", "lunch", "dinner"] as MealKey[]).filter(
    (key) => foods.some((food) => food.meal === key),
  ).length;

  const nutrientsWithinGoal = NUTRIENT_ORDER.filter((key) => {
    const goal = goals[key];
    return goal > 0 ? totals[key] / goal < 0.95 : true;
  }).length;

  const sodiumPercent =
    goals.sodium > 0 ? Math.round((totals.sodium / goals.sodium) * 100) : 0;
  const fluidPercent = goals.fluid > 0 ? Math.round((fluidMl / goals.fluid) * 100) : 0;

  const keyMetrics: MetricItem[] = [
    {
      title: n?.keyMetrics?.dailyGoal?.title || "Daily Goal",
      description:
        n?.keyMetrics?.dailyGoal?.description || "Stay within your daily nutrient goals",
      value: `${nutrientsWithinGoal} / ${NUTRIENT_ORDER.length}`,
      icon: Target,
      iconClass: "text-blue-600",
      iconBg: "bg-blue-100",
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
      iconClass: "text-emerald-600",
      iconBg: "bg-emerald-100",
    },
    {
      title: n?.keyMetrics?.fluids?.title || "Fluids",
      description: `${formatNumber(fluidMl)} / ${formatNumber(goals.fluid)} ml`,
      value: `${fluidPercent}%`,
      progress: fluidPercent,
      icon: Droplet,
      iconClass: "text-sky-600",
      iconBg: "bg-sky-100",
    },
    {
      title: n?.keyMetrics?.sodium?.title || "Sodium",
      description: `${formatNumber(totals.sodium)} / ${formatNumber(goals.sodium)} mg`,
      value: `${sodiumPercent}%`,
      progress: sodiumPercent,
      icon: Apple,
      iconClass: "text-orange-600",
      iconBg: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
      <PersonalLogDisclaimer />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[32px] font-medium leading-none text-slate-950">
            {n?.header?.greeting || "Good morning, Sarah"}
          </h1>
          <p className="mt-1 text-lg font-medium leading-7 tracking-[0.09px] text-slate-700">
            {n?.header?.subtitle ||
              "Track your daily food and nutrients to support your kidney health."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddFoodMeal("breakfast")}
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold tracking-[0.08px] text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700 cursor-pointer"
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
