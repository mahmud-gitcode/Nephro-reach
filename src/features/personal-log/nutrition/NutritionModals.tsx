"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { FormField, Input, Modal } from "@/components/ui";
import { toNumber } from "./nutrition.format";
import {
  MEAL_KEYS,
  NUTRIENT_ORDER,
  NUTRIENT_UNITS,
} from "./nutrition.constants";
import type { FoodEntry, Goals, MealKey, NutrientKey } from "./nutrition.types";

/* The three forms: log a food, change the goals, add water. */

const FIELD_CLASS =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-medium text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-primary-edge focus:ring-1 focus:ring-ring";

export function ModalShell({
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
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={title}
      description={subtitle}
    >
      {children}
    </Modal>
  );
}

export function NumberField({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <FormField
      label={
        <>
          {label} <span className="text-fg-muted">({unit})</span>
        </>
      }
    >
      {(props) => (
        <Input
          {...props}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="0"
        />
      )}
    </FormField>
  );
}

export function AddFoodModal({
  defaultMeal,
  dayLabel,
  mealLabels,
  onClose,
  onSave,
}: {
  defaultMeal: MealKey;
  /** The day the food is filed under, as the member reads it. */
  dayLabel: string;
  mealLabels: Record<MealKey, string>;
  onClose: () => void;
  onSave: (food: Omit<FoodEntry, "id" | "date">) => void;
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
          ? `Agrega un alimento a una comida · ${dayLabel}.`
          : `Add a food to a meal · ${dayLabel}.`
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        {error ? (
          <p className="rounded-xl border border-danger-line bg-danger-surface p-3 text-xs font-semibold text-danger">
            {error}
          </p>
        ) : null}

        <div className="space-y-1.5">
          <label
            htmlFor="food-meal"
            className="block text-xs font-bold text-fg-secondary"
          >
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
            <label
              htmlFor="food-name"
              className="block text-xs font-bold text-fg-secondary"
            >
              {n?.mealsTable?.headers?.food || "Food"}{" "}
              <span className="text-danger">*</span>
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
            <label
              htmlFor="food-portion"
              className="block text-xs font-bold text-fg-secondary"
            >
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

        <div className="space-y-2 rounded-xl border border-line-subtle bg-surface-sunken p-3.5">
          <p className="text-xs font-bold tracking-wider text-fg-muted uppercase">
            {isEs ? "Nutrientes Renales" : "Kidney Nutrients"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={nutrientLabel("calories", "Calories")}
              unit={NUTRIENT_UNITS.calories}
              value={values.calories}
              onChange={(next) => setValue("calories", next)}
            />
            <NumberField
              label={nutrientLabel("sodium", "Sodium")}
              unit={NUTRIENT_UNITS.sodium}
              value={values.sodium}
              onChange={(next) => setValue("sodium", next)}
            />
            <NumberField
              label={nutrientLabel("potassium", "Potassium")}
              unit={NUTRIENT_UNITS.potassium}
              value={values.potassium}
              onChange={(next) => setValue("potassium", next)}
            />
            <NumberField
              label={nutrientLabel("phosphorus", "Phosphorus")}
              unit={NUTRIENT_UNITS.phosphorus}
              value={values.phosphorus}
              onChange={(next) => setValue("phosphorus", next)}
            />
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-line-subtle bg-surface-sunken p-3.5">
          <p className="text-xs font-bold tracking-wider text-fg-muted uppercase">
            {isEs ? "Macronutrientes (opcional)" : "Macros (optional)"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={nutrientLabel("protein", "Protein")}
              unit={NUTRIENT_UNITS.protein}
              value={values.protein}
              onChange={(next) => setValue("protein", next)}
            />
            <NumberField
              label={nutrientLabel("carbs", "Carbs")}
              unit={NUTRIENT_UNITS.carbs}
              value={values.carbs}
              onChange={(next) => setValue("carbs", next)}
            />
            <NumberField
              label={nutrientLabel("fats", "Fats")}
              unit={NUTRIENT_UNITS.fats}
              value={values.fats}
              onChange={(next) => setValue("fats", next)}
            />
            <NumberField
              label={nutrientLabel("fiber", "Fiber")}
              unit={NUTRIENT_UNITS.fiber}
              value={values.fiber}
              onChange={(next) => setValue("fiber", next)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line-subtle pt-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-fg-muted transition-colors hover:bg-surface-sunken"
          >
            {isEs ? "Cancelar" : "Cancel"}
          </button>
          <button
            type="submit"
            className="cursor-pointer rounded-xl bg-action px-5 py-2.5 text-sm font-bold text-white shadow-control transition-colors hover:bg-action-hover"
          >
            {n?.mealsTable?.addFood || "Add Food"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function GoalsModal({
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
              label={
                n?.nutrientOverview?.nutrients?.[key] || fallbackNames[key]
              }
              unit={NUTRIENT_UNITS[key]}
              value={draft[key]}
              onChange={(next) =>
                setDraft((prev) => ({ ...prev, [key]: next }))
              }
            />
          ))}
          <NumberField
            label={n?.keyMetrics?.fluids?.title || "Fluids"}
            unit="ml"
            value={draft.fluid}
            onChange={(next) => setDraft((prev) => ({ ...prev, fluid: next }))}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line-subtle pt-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-fg-muted transition-colors hover:bg-surface-sunken"
          >
            {isEs ? "Cancelar" : "Cancel"}
          </button>
          <button
            type="submit"
            className="cursor-pointer rounded-xl bg-action px-5 py-2.5 text-sm font-bold text-white shadow-control transition-colors hover:bg-action-hover"
          >
            {isEs ? "Guardar Metas" : "Save Goals"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

const WATER_PRESETS = [120, 240, 330, 500];

export function AddWaterModal({
  dayLabel,
  onClose,
  onSave,
}: {
  /** The day the water is filed under, as the member reads it. */
  dayLabel: string;
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
        isEs
          ? `Registra lo que bebiste · ${dayLabel}.`
          : `Log what you drank · ${dayLabel}.`
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
                className={`cursor-pointer rounded-xl border px-2 py-2.5 text-sm font-bold transition-all ${
                  isSelected
                    ? "border-primary-edge bg-primary-soft text-fg-brand"
                    : "border-line bg-surface text-fg-secondary hover:bg-surface-sunken"
                }`}
              >
                {preset} ml
              </button>
            );
          })}
        </div>

        <NumberField
          label={isEs ? "Cantidad" : "Amount"}
          unit="ml"
          value={amount}
          onChange={setAmount}
        />

        <div className="flex items-center justify-end gap-2 border-t border-line-subtle pt-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-fg-muted transition-colors hover:bg-surface-sunken"
          >
            {isEs ? "Cancelar" : "Cancel"}
          </button>
          <button
            type="submit"
            className="cursor-pointer rounded-xl bg-action px-5 py-2.5 text-sm font-bold text-white shadow-control transition-colors hover:bg-action-hover"
          >
            {n?.fluidTracker?.addWater || "Add Water"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
