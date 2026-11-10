"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  FormField,
  Input,
  Modal,
  SegmentedChoice,
} from "@/components/ui";
import {
  FLUID_PRESETS,
  formatFluid,
  fromMl,
  toMl,
  useFluidUnit,
  type FluidUnit,
} from "./fluidUnit";
import {
  amountProblem,
  parseAmount,
  toNumber,
  type AmountProblem,
} from "./nutrition.format";
import {
  FLUID_ML_MAX,
  FOOD_NAME_MAX_LENGTH,
  FOOD_PORTION_MAX_LENGTH,
  MEAL_KEYS,
  NUTRIENT_ORDER,
  NUTRIENT_UNITS,
  NUTRIENT_VALUE_MAX,
} from "./nutrition.constants";
import type { FoodEntry, Goals, MealKey, NutrientKey } from "./nutrition.types";

/** The field message for an amount that cannot be saved (P16b QA: Goals
 *  saved "-5" as 0 with no message). */
export function amountMessage(
  problem: AmountProblem,
  max: number,
  unit: string,
  isEs: boolean,
) {
  if (problem === "not-a-number") {
    return isEs
      ? "Ingrese un número de 0 o más."
      : "Enter a number of 0 or more.";
  }
  const limit = `${max.toLocaleString()} ${unit}`;
  return isEs
    ? `Ingrese un número de hasta ${limit}.`
    : `Enter a number up to ${limit}.`;
}

/* The three forms: log a food, change the goals, add water. */

const FIELD_CLASS =
  "w-full rounded-card border border-line bg-surface px-3.5 py-2.5 text-body-sm font-medium text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-primary-edge focus:ring-1 focus:ring-ring";

export function ModalShell({
  title,
  subtitle,
  onClose,
  saveError,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  /** Why the last save failed. The form stays open on a failed save, so
   *  the reason is shown here, in front of the member (the page's own
   *  banner sits behind the modal). */
  saveError?: string | null;
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
      {saveError ? (
        <Alert tone="danger" className="mt-4">
          {saveError}
        </Alert>
      ) : null}
      {children}
    </Modal>
  );
}

export function NumberField({
  label,
  unit,
  value,
  onChange,
  error,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (next: string) => void;
  /** Why the typed value cannot be saved (shown under the field). */
  error?: string | null;
}) {
  return (
    <FormField
      label={
        <>
          {label} <span className="text-fg-muted">({unit})</span>
        </>
      }
      error={error || undefined}
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
  saveError,
}: {
  defaultMeal: MealKey;
  /** The day the food is filed under, as the member reads it. */
  dayLabel: string;
  mealLabels: Record<MealKey, string>;
  onClose: () => void;
  onSave: (food: Omit<FoodEntry, "id" | "date">) => void;
  /** Why the last save failed (shown in the form). */
  saveError?: string | null;
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
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<NutrientKey, string>>
  >({});

  const setValue = (key: NutrientKey, next: string) => {
    setValues((prev) => ({ ...prev, [key]: next }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const nutrientLabel = (key: NutrientKey, fallback: string) =>
    n?.nutrientOverview?.nutrients?.[key] || fallback;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(isEs ? "Ingrese el nombre del alimento." : "Enter a food name.");
      return;
    }
    if (name.trim().length > FOOD_NAME_MAX_LENGTH) {
      setError(
        isEs
          ? `El nombre puede tener hasta ${FOOD_NAME_MAX_LENGTH} caracteres.`
          : `The food name can be up to ${FOOD_NAME_MAX_LENGTH} characters.`,
      );
      return;
    }
    if (portion.trim().length > FOOD_PORTION_MAX_LENGTH) {
      setError(
        isEs
          ? `La porción puede tener hasta ${FOOD_PORTION_MAX_LENGTH} caracteres.`
          : `The portion can be up to ${FOOD_PORTION_MAX_LENGTH} characters.`,
      );
      return;
    }

    /* A minus sign or letters in an amount used to be saved as 0 with no
       word to the member (P16b QA round 2). Each such field now says why. */
    const found: Partial<Record<NutrientKey, string>> = {};
    const parsed = {} as Record<NutrientKey, number>;
    NUTRIENT_ORDER.forEach((key) => {
      const problem = amountProblem(values[key], NUTRIENT_VALUE_MAX);
      if (problem) {
        found[key] = amountMessage(
          problem,
          NUTRIENT_VALUE_MAX,
          NUTRIENT_UNITS[key],
          isEs,
        );
      } else {
        parsed[key] = parseAmount(values[key]) ?? 0;
      }
    });
    setFieldErrors(found);
    if (Object.keys(found).length > 0) {
      setError(
        isEs
          ? "Revise las cantidades marcadas."
          : "Check the amounts marked below.",
      );
      return;
    }

    /* A valid submit clears the earlier "Enter a food name." so it does not
       sit next to a save failure (saveError) shown in the same form. */
    setError("");
    onSave({
      meal,
      name: name.trim(),
      portion: portion.trim(),
      calories: parsed.calories,
      sodium: parsed.sodium,
      potassium: parsed.potassium,
      phosphorus: parsed.phosphorus,
      protein: parsed.protein,
      carbs: parsed.carbs,
      fats: parsed.fats,
      fiber: parsed.fiber,
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
      saveError={saveError}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        {error ? (
          <p className="rounded-card-nested border border-danger-line bg-danger-surface p-3 text-caption font-semibold text-danger">
            {error}
          </p>
        ) : null}

        <div className="space-y-1.5">
          <label
            htmlFor="food-meal"
            className="block text-caption font-bold text-fg-secondary"
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
              className="block text-caption font-bold text-fg-secondary"
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
              className="block text-caption font-bold text-fg-secondary"
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

        <div className="space-y-2 rounded-card border border-line-subtle bg-surface-sunken p-3.5">
          <p className="text-caption font-bold text-fg-muted">
            {isEs ? "Nutrientes Renales" : "Kidney Nutrients"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={nutrientLabel("calories", "Calories")}
              unit={NUTRIENT_UNITS.calories}
              value={values.calories}
              onChange={(next) => setValue("calories", next)}
              error={fieldErrors.calories}
            />
            <NumberField
              label={nutrientLabel("sodium", "Sodium")}
              unit={NUTRIENT_UNITS.sodium}
              value={values.sodium}
              onChange={(next) => setValue("sodium", next)}
              error={fieldErrors.sodium}
            />
            <NumberField
              label={nutrientLabel("potassium", "Potassium")}
              unit={NUTRIENT_UNITS.potassium}
              value={values.potassium}
              onChange={(next) => setValue("potassium", next)}
              error={fieldErrors.potassium}
            />
            <NumberField
              label={nutrientLabel("phosphorus", "Phosphorus")}
              unit={NUTRIENT_UNITS.phosphorus}
              value={values.phosphorus}
              onChange={(next) => setValue("phosphorus", next)}
              error={fieldErrors.phosphorus}
            />
          </div>
        </div>

        <div className="space-y-2 rounded-card border border-line-subtle bg-surface-sunken p-3.5">
          <p className="text-caption font-bold text-fg-muted">
            {isEs ? "Macronutrientes (opcional)" : "Macros (optional)"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={nutrientLabel("protein", "Protein")}
              unit={NUTRIENT_UNITS.protein}
              value={values.protein}
              onChange={(next) => setValue("protein", next)}
              error={fieldErrors.protein}
            />
            <NumberField
              label={nutrientLabel("carbs", "Carbs")}
              unit={NUTRIENT_UNITS.carbs}
              value={values.carbs}
              onChange={(next) => setValue("carbs", next)}
              error={fieldErrors.carbs}
            />
            <NumberField
              label={nutrientLabel("fats", "Fats")}
              unit={NUTRIENT_UNITS.fats}
              value={values.fats}
              onChange={(next) => setValue("fats", next)}
              error={fieldErrors.fats}
            />
            <NumberField
              label={nutrientLabel("fiber", "Fiber")}
              unit={NUTRIENT_UNITS.fiber}
              value={values.fiber}
              onChange={(next) => setValue("fiber", next)}
              error={fieldErrors.fiber}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line-subtle pt-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-card border border-line bg-surface px-4 py-2.5 text-body-sm font-semibold text-fg-muted transition-colors hover:bg-surface-sunken"
          >
            {isEs ? "Cancelar" : "Cancel"}
          </button>
          <button
            type="submit"
            className="cursor-pointer rounded-card-nested bg-action px-5 py-2.5 text-body-sm font-bold text-white shadow-control transition-colors hover:bg-action-hover"
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
  saveError,
}: {
  goals: Goals;
  onClose: () => void;
  onSave: (next: Goals) => void;
  /** Why the last save failed (shown in the form). */
  saveError?: string | null;
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

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setField = (key: string, next: string) => {
    setDraft((prev) => ({ ...prev, [key]: next }));
    setFieldErrors((prev) => {
      const rest = { ...prev };
      delete rest[key];
      return rest;
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    /* "-5" or "abc" used to be saved as a goal of 0 with no message
       (P16b QA round 2). Each such field now says why and nothing is sent.
       An empty field is still 0, the server's "no goal". */
    const found: Record<string, string> = {};
    const next = {} as Goals;
    const read = (key: NutrientKey | "fluid", max: number, unit: string) => {
      const problem = amountProblem(draft[key] ?? "", max);
      if (problem) found[key] = amountMessage(problem, max, unit, isEs);
      else next[key] = parseAmount(draft[key] ?? "") ?? 0;
    };
    NUTRIENT_ORDER.forEach((key) =>
      read(key, NUTRIENT_VALUE_MAX, NUTRIENT_UNITS[key]),
    );
    read("fluid", FLUID_ML_MAX, "ml");
    setFieldErrors(found);
    if (Object.keys(found).length > 0) return;
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
      saveError={saveError}
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
              onChange={(next) => setField(key, next)}
              error={fieldErrors[key]}
            />
          ))}
          <NumberField
            label={n?.keyMetrics?.fluids?.title || "Fluids"}
            unit="ml"
            value={draft.fluid}
            onChange={(next) => setField("fluid", next)}
            error={fieldErrors.fluid}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line-subtle pt-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-card border border-line bg-surface px-4 py-2.5 text-body-sm font-semibold text-fg-muted transition-colors hover:bg-surface-sunken"
          >
            {isEs ? "Cancelar" : "Cancel"}
          </button>
          <button
            type="submit"
            className="cursor-pointer rounded-card-nested bg-action px-5 py-2.5 text-body-sm font-bold text-white shadow-control transition-colors hover:bg-action-hover"
          >
            {isEs ? "Guardar Metas" : "Save Goals"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function AddWaterModal({
  dayLabel,
  onClose,
  onSave,
  saveError,
}: {
  /** The day the water is filed under, as the member reads it. */
  dayLabel: string;
  onClose: () => void;
  /** What the member drank, in the unit they chose (the server converts). */
  onSave: (amount: number, unit: FluidUnit) => void;
  /** Why the last save failed (shown in the form). */
  saveError?: string | null;
}) {
  const { language, dictionary } = useLanguage();
  const n = dictionary?.nutrition;
  const isEs = language === "ES";

  /* Ounces first (client, 2026-10-12); the log stores millilitres. */
  const { unit, setUnit } = useFluidUnit();
  const [amount, setAmount] = useState(unit === "oz" ? "8" : "240");

  const [amountError, setAmountError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    /* An empty, zero, negative or unreadable amount used to do nothing at
       all (P16b QA round 2: a control that does nothing). It now says why. */
    const value = parseAmount(amount);
    if (value === null || value <= 0) {
      setAmountError(
        isEs
          ? "Ingrese una cantidad mayor que 0."
          : "Enter an amount greater than 0.",
      );
      return;
    }
    if (toMl(value, unit) > FLUID_ML_MAX) {
      setAmountError(
        amountMessage("too-large", fromMl(FLUID_ML_MAX, unit), unit, isEs),
      );
      return;
    }
    setAmountError(null);
    onSave(value, unit);
  };

  return (
    <ModalShell
      title={n?.fluidTracker?.addWater || "Add Fluid"}
      subtitle={
        isEs
          ? `Registra lo que bebiste · ${dayLabel}.`
          : `Log what you drank · ${dayLabel}.`
      }
      onClose={onClose}
      saveError={saveError}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <SegmentedChoice<FluidUnit>
          label={isEs ? "Unidad" : "Unit"}
          value={unit}
          onChange={(next) => {
            /* The amount follows the unit, so 8 oz becomes 237 ml. */
            const value = toNumber(amount);
            if (value > 0) setAmount(`${fromMl(toMl(value, unit), next)}`);
            setUnit(next);
          }}
          options={[
            { value: "oz", label: isEs ? "Onzas (oz)" : "Ounces (oz)" },
            {
              value: "ml",
              label: isEs ? "Mililitros (ml)" : "Millilitres (ml)",
            },
          ]}
        />

        <div className="grid grid-cols-4 gap-2">
          {FLUID_PRESETS[unit].map((preset) => {
            const isSelected = toNumber(amount) === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAmount(`${preset}`);
                  setAmountError(null);
                }}
                className={`cursor-pointer rounded-card border px-2 py-2.5 text-body-sm font-bold transition-all ${
                  isSelected
                    ? "border-primary-edge bg-primary-soft text-fg-brand"
                    : "border-line bg-surface text-fg-secondary hover:bg-surface-sunken"
                }`}
              >
                {preset} {unit}
              </button>
            );
          })}
        </div>

        <NumberField
          label={isEs ? "Cantidad" : "Amount"}
          unit={unit}
          value={amount}
          onChange={(next) => {
            setAmount(next);
            setAmountError(null);
          }}
          error={amountError}
        />
        {toNumber(amount) > 0 ? (
          <p className="text-caption text-fg-muted">
            ={" "}
            {formatFluid(
              toMl(toNumber(amount), unit),
              unit === "oz" ? "ml" : "oz",
            )}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2 border-t border-line-subtle pt-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-card border border-line bg-surface px-4 py-2.5 text-body-sm font-semibold text-fg-muted transition-colors hover:bg-surface-sunken"
          >
            {isEs ? "Cancelar" : "Cancel"}
          </button>
          <button
            type="submit"
            className="cursor-pointer rounded-card-nested bg-action px-5 py-2.5 text-body-sm font-bold text-white shadow-control transition-colors hover:bg-action-hover"
          >
            {n?.fluidTracker?.addWater || "Add Fluid"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
