"use client";

import React from "react";
import {
  AlertCircle,
  Apple,
  CheckCircle2,
  ChevronRight,
  Droplet,
  FileText,
  MoreHorizontal,
  Plus,
  Target,
  Utensils,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

function ProgressBar({ value, className }: { value: number; className: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${value}%` }} />
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
}

function KeyMetricCard({ metric }: { metric: MetricItem }) {
  return (
    <article className="rounded-[10px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${metric.iconBg}`}>
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
      {metric.progress && (
        <div className="mt-3">
          <ProgressBar value={metric.progress} className="bg-blue-600" />
        </div>
      )}
      {metric.footer && (
        <button
          type="button"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          {metric.footer}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </article>
  );
}

function NutrientOverview() {
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

  const nutrients = [
    {
      name: n?.nutrientOverview?.nutrients?.sodium || "Sodium",
      amount: "1,280 / 2,000 mg",
      percent: 64,
      status: "within" as const,
    },
    {
      name: n?.nutrientOverview?.nutrients?.potassium || "Potassium",
      amount: "2,100 / 2,500 mg",
      percent: 84,
      status: "near" as const,
    },
    {
      name: n?.nutrientOverview?.nutrients?.phosphorus || "Phosphorus",
      amount: "960 / 1,000 mg",
      percent: 96,
      status: "over" as const,
    },
    {
      name: n?.nutrientOverview?.nutrients?.protein || "Protein",
      amount: "45 / 70 g",
      percent: 64,
      status: "within" as const,
    },
    {
      name: n?.nutrientOverview?.nutrients?.calories || "Calories",
      amount: "1,640 / 1,900 kcal",
      percent: 86,
      status: "near" as const,
    },
    {
      name: n?.nutrientOverview?.nutrients?.carbs || "Carbs",
      amount: "185 / 220 g",
      percent: 84,
      status: "near" as const,
    },
    {
      name: n?.nutrientOverview?.nutrients?.fats || "Fats",
      amount: "52 / 70 g",
      percent: 74,
      status: "within" as const,
    },
    {
      name: n?.nutrientOverview?.nutrients?.fiber || "Fiber",
      amount: "22 / 30 g",
      percent: 73,
      status: "within" as const,
    },
  ];

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
        {nutrients.map((nutrient) => {
          const style = statusStyles[nutrient.status];

          return (
            <article key={nutrient.name} className="rounded-xl border border-[#E9EEF4] bg-white p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
                    {nutrient.name}
                  </h3>
                  <p className="mt-1 text-sm font-medium leading-5 tracking-[0.07px] text-slate-500">
                    {nutrient.amount}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-sm font-semibold ${style.bg} ${style.text}`}>
                  {nutrient.percent}%
                </span>
              </div>
              <div className="mt-3">
                <ProgressBar value={nutrient.percent} className={style.track} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MealTable() {
  const { dictionary } = useLanguage();
  const n = dictionary?.nutrition;

  const meals = [
    {
      name: n?.mealsTable?.mealNames?.breakfast || "Breakfast",
      calories: "390 kcal",
      foods: [
        {
          food: n?.mealsTable?.foods?.oatmeal || "Oatmeal",
          portion: n?.mealsTable?.portions?.oneCup || "1 cup",
          calories: "150",
          sodium: "120 mg",
          potassium: "164 mg",
          phosphorus: "180 mg",
        },
        {
          food: n?.mealsTable?.foods?.blueberries || "Blueberries",
          portion: n?.mealsTable?.portions?.halfCup || "1/2 cup",
          calories: "42",
          sodium: "1 mg",
          potassium: "57 mg",
          phosphorus: "9 mg",
        },
      ],
    },
    {
      name: n?.mealsTable?.mealNames?.lunch || "Lunch",
      calories: "830 kcal",
      foods: [
        {
          food: n?.mealsTable?.foods?.grilledChickenSalad || "Grilled chicken salad",
          portion: n?.mealsTable?.portions?.onePlate || "1 plate",
          calories: "460",
          sodium: "520 mg",
          potassium: "610 mg",
          phosphorus: "285 mg",
        },
        {
          food: n?.mealsTable?.foods?.appleSlices || "Apple slices",
          portion: n?.mealsTable?.portions?.oneMedium || "1 medium",
          calories: "95",
          sodium: "2 mg",
          potassium: "195 mg",
          phosphorus: "20 mg",
        },
      ],
    },
    {
      name: n?.mealsTable?.mealNames?.dinner || "Dinner",
      calories: "420 kcal",
      foods: [
        {
          food: n?.mealsTable?.foods?.bakedSalmon || "Baked salmon",
          portion: n?.mealsTable?.portions?.threeOz || "3 oz",
          calories: "175",
          sodium: "55 mg",
          potassium: "326 mg",
          phosphorus: "252 mg",
        },
        {
          food: n?.mealsTable?.foods?.whiteRice || "White rice",
          portion: n?.mealsTable?.portions?.oneCup || "1 cup",
          calories: "205",
          sodium: "2 mg",
          potassium: "55 mg",
          phosphorus: "68 mg",
        },
        {
          food: n?.mealsTable?.foods?.greenBeans || "Green beans",
          portion: n?.mealsTable?.portions?.halfCup || "1/2 cup",
          calories: "40",
          sodium: "6 mg",
          potassium: "90 mg",
          phosphorus: "19 mg",
        },
      ],
    },
  ];

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
                <th className="px-4 py-3 text-right">{n?.mealsTable?.headers?.action || "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {meals.map((meal) => (
                <React.Fragment key={meal.name}>
                  <tr className="bg-[#F8FAFC]">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2 text-base font-medium text-slate-950">
                          <Utensils className="h-5 w-5 text-blue-600" />
                          {meal.name}
                        </span>
                        <span className="text-sm font-medium text-slate-500">{meal.calories}</span>
                      </div>
                    </td>
                  </tr>
                  {meal.foods.map((food) => (
                    <tr key={`${meal.name}-${food.food}`} className="text-slate-700">
                      <td className="px-4 py-3 font-medium text-slate-950">{food.food}</td>
                      <td className="px-4 py-3">{food.portion}</td>
                      <td className="px-4 py-3">{food.calories}</td>
                      <td className="px-4 py-3">{food.sodium}</td>
                      <td className="px-4 py-3">{food.potassium}</td>
                      <td className="px-4 py-3">{food.phosphorus}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 cursor-pointer"
                          aria-label={`Open ${food.food} details`}
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        type="button"
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold tracking-[0.08px] text-blue-600 transition-colors hover:bg-white cursor-pointer"
      >
        <Plus className="h-5 w-5" />
        {n?.mealsTable?.logMeal || "Log Meal"}
      </button>
    </section>
  );
}

function FluidTracker() {
  const { dictionary } = useLanguage();
  const n = dictionary?.nutrition;

  return (
    <section className="rounded-[10px] border border-slate-200 bg-[#F1F5FA] p-3">
      <h2 className="text-lg font-medium leading-7 tracking-[0.09px] text-slate-950">
        {n?.fluidTracker?.title || "Fluid Tracker"}
      </h2>
      <div className="mt-3 rounded-xl border border-[#E9EEF4] bg-white p-3.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[32px] font-semibold leading-none text-slate-950">1,100 ml</p>
            <p className="mt-1 text-sm font-medium leading-5 text-slate-500">
              {n?.fluidTracker?.of || "of 1,500 ml"}
            </p>
          </div>
          <p className="text-xl font-semibold text-blue-600">73%</p>
        </div>
        <div className="mt-4">
          <ProgressBar value={73} className="bg-blue-600" />
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }).map((_, index) => (
            <span
              key={index}
              className={`flex h-8 items-center justify-center rounded-lg ${
                index < 5 ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-300"
              }`}
            >
              <Droplet className="h-4 w-4" />
            </span>
          ))}
        </div>
        <button
          type="button"
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
        <button type="button" className="text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
          {n?.resources?.viewAll || "View all"}
        </button>
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
        <button type="button" className="text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
          {n?.dietTips?.viewMore || "View More"}
        </button>
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

function Disclaimer() {
  const { dictionary } = useLanguage();
  const n = dictionary?.nutrition;

  return (
    <aside className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-3.5">
      <div className="flex gap-2">
        <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
        <div>
          <h2 className="text-lg font-medium leading-7 text-slate-950">
            {n?.disclaimer?.title || "Important Disclaimer"}
          </h2>
          <p className="mt-2 max-w-[760px] text-sm leading-5 text-slate-700">
            {n?.disclaimer?.text ||
              "This tool is for education and tracking only. Always discuss diet changes, lab results, and treatment decisions with your nephrology provider."}
          </p>
        </div>
      </div>
    </aside>
  );
}

export default function NutritionPage() {
  const { dictionary } = useLanguage();
  const n = dictionary?.nutrition;

  const keyMetrics: MetricItem[] = [
    {
      title: n?.keyMetrics?.dailyGoal?.title || "Daily Goal",
      description: n?.keyMetrics?.dailyGoal?.description || "Stay within your daily nutrient goals",
      icon: Target,
      iconClass: "text-blue-600",
      iconBg: "bg-blue-100",
      footer: n?.keyMetrics?.dailyGoal?.footer || "View Goals",
    },
    {
      title: n?.keyMetrics?.mealsLogged?.title || "Meals Logged",
      description: n?.keyMetrics?.mealsLogged?.description || "Good job!",
      value: "3 / 3",
      icon: Utensils,
      iconClass: "text-emerald-600",
      iconBg: "bg-emerald-100",
    },
    {
      title: n?.keyMetrics?.fluids?.title || "Fluids",
      description: n?.keyMetrics?.fluids?.description || "1,100 / 1,500 ml",
      value: "73%",
      progress: 73,
      icon: Droplet,
      iconClass: "text-sky-600",
      iconBg: "bg-sky-100",
    },
    {
      title: n?.keyMetrics?.sodium?.title || "Sodium",
      description: n?.keyMetrics?.sodium?.description || "1,280 / 2,000 mg",
      value: "64%",
      progress: 64,
      icon: Apple,
      iconClass: "text-orange-600",
      iconBg: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[32px] font-medium leading-none text-slate-950">
            {n?.header?.greeting || "Good morning, Sarah"}
          </h1>
          <p className="mt-1 text-lg font-medium leading-7 tracking-[0.09px] text-slate-700">
            {n?.header?.subtitle || "Track your daily food and nutrients to support your kidney health."}
          </p>
        </div>
        <button
          type="button"
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

      <NutrientOverview />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
        <MealTable />
        <div className="space-y-6">
          <FluidTracker />
          <ResourceCard />
          <TipsCard />
        </div>
      </section>

      <Disclaimer />
    </div>
  );
}
