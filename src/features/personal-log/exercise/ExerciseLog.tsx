"use client";

import React, { useState } from "react";
import { Dumbbell, Pencil, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ModalShell } from "@/features/personal-log/nutrition/NutritionModals";
import { toNumber } from "@/features/personal-log/nutrition/nutrition.format";
import { ACTIVITY_OPTIONS, UNIT_OPTIONS } from "./exercise.options";
import {
  activityLabel,
  dayTotals,
  defaultUnit,
  emptyDraft,
  exerciseError,
  formatAmount,
  unitLabel,
  type ExerciseError,
} from "./exercise.rules";
import type {
  ExerciseActivity,
  ExerciseDraft,
  ExerciseEntry,
  ExerciseUnit,
} from "./exercise.types";

/* The exercise notes on the nutrition screen: what the member did on the
   day being shown, and how much. Styled as a sibling of the meal table. */

const FIELD_CLASS =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-medium text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-primary-edge focus:ring-1 focus:ring-ring";

const ICON_BUTTON =
  "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-colors";

export function ExerciseCard({
  entries,
  isToday,
  onAdd,
  onEdit,
  onDelete,
}: {
  entries: ExerciseEntry[];
  isToday: boolean;
  onAdd: () => void;
  onEdit: (entry: ExerciseEntry) => void;
  onDelete: (entry: ExerciseEntry) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const totals = dayTotals(entries, isEs);

  return (
    <section className="rounded-[10px] border border-line bg-[var(--color-gray-100)] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-heading-4 text-fg">
            {isEs ? "Ejercicio" : "Exercise"}
          </h2>
          <p className="mt-0.5 text-body-md text-fg-muted">
            {isEs
              ? "Anota qué hiciste y cuánto. Consulta a tu equipo antes de empezar un ejercicio nuevo."
              : "Note what you did and how much. Check with your care team before starting new exercise."}
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded bg-action px-4 text-sm font-bold tracking-[0.07px] text-white shadow-[inset_0_-1px_0_var(--color-brand-100)] transition-colors hover:bg-action-hover"
        >
          <Plus className="h-5 w-5" />
          {isEs ? "Registrar Actividad" : "Log Activity"}
        </button>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-line bg-surface">
        {entries.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-semibold text-fg-muted">
              {isToday
                ? isEs
                  ? "Aún no hay actividad registrada hoy."
                  : "No activity logged yet today."
                : isEs
                  ? "No hay actividad registrada este día."
                  : "No activity logged on this day."}
            </p>
            <p className="mt-1 text-sm text-fg-subtle">
              {isEs
                ? "Por ejemplo: 2.000 pasos o 10 flexiones."
                : "For example: 2,000 steps or 10 push-ups."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 border-b border-line-subtle bg-[var(--color-gray-50)] px-4 py-3">
              {totals.map((total) => (
                <span
                  key={total.key}
                  className="rounded-full bg-primary-soft px-2.5 py-1 text-sm font-semibold text-fg-brand"
                >
                  {total.label} · {formatAmount(total.amount, total.unit, isEs)}
                </span>
              ))}
            </div>
            <ul className="divide-y divide-line-subtle">
              {entries.map((entry) => {
                const label = activityLabel(entry, isEs);
                return (
                  <li
                    key={entry.id}
                    className="flex items-start gap-3 px-4 py-3"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                      <Dumbbell className="h-4 w-4 text-fg-brand" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fg">
                        {label}
                        <span className="text-fg-muted">
                          {" — "}
                          {formatAmount(entry.amount, entry.unit, isEs)}
                        </span>
                      </p>
                      {entry.note ? (
                        <p className="mt-0.5 text-sm text-fg-muted">
                          {entry.note}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(entry)}
                        className={`${ICON_BUTTON} hover:bg-surface-sunken hover:text-fg`}
                        aria-label={isEs ? `Editar ${label}` : `Edit ${label}`}
                        title={isEs ? "Editar" : "Edit"}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(entry)}
                        className={`${ICON_BUTTON} hover:bg-danger-surface hover:text-danger`}
                        aria-label={
                          isEs ? `Eliminar ${label}` : `Remove ${label}`
                        }
                        title={isEs ? "Eliminar" : "Remove"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

const ERROR_TEXT: Record<ExerciseError, { en: string; es: string }> = {
  "missing-name": {
    en: "Enter the name of the exercise.",
    es: "Ingrese el nombre del ejercicio.",
  },
  "missing-amount": {
    en: "Enter how much you did.",
    es: "Ingrese cuánto hiciste.",
  },
  "invalid-date": {
    en: "Pick a valid day.",
    es: "Elige un día válido.",
  },
  "future-date": {
    en: "You can't log activity for a day that hasn't happened yet.",
    es: "No puedes registrar actividad de un día que aún no llega.",
  },
};

/* One row of the form. Amount stays a string while typing so "1." and ""
   are allowed on the way to a number. */
interface ExerciseRow {
  key: string;
  activity: ExerciseActivity;
  customName: string;
  amount: string;
  unit: ExerciseUnit;
  note: string;
}

let rowCounter = 0;
const newRowKey = () => `row-${++rowCounter}`;

function rowFrom(draft: ExerciseDraft): ExerciseRow {
  return {
    key: newRowKey(),
    activity: draft.activity,
    customName: draft.customName,
    amount: draft.amount > 0 ? `${draft.amount}` : "",
    unit: draft.unit,
    note: draft.note,
  };
}

const toDraft = (row: ExerciseRow): ExerciseDraft => ({
  activity: row.activity,
  customName: row.customName,
  amount: toNumber(row.amount),
  unit: row.unit,
  note: row.note,
});

export function ExerciseModal({
  entry,
  date,
  dayLabel,
  onClose,
  onSave,
}: {
  /** An existing note, reopened. Omit to add new ones. */
  entry?: ExerciseEntry;
  date: string;
  dayLabel: string;
  onClose: () => void;
  onSave: (drafts: ExerciseDraft[]) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [rows, setRows] = useState<ExerciseRow[]>(() => [
    rowFrom(entry ?? emptyDraft()),
  ]);
  /* Errors by row key, so the message sits under the row it is about. */
  const [errors, setErrors] = useState<Record<string, ExerciseError>>({});

  const updateRow = (key: string, patch: Partial<ExerciseRow>) => {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  /* Picking an exercise brings its usual unit with it; the unit can still
     be changed afterwards. */
  const pickActivity = (key: string, activity: ExerciseActivity) =>
    updateRow(key, { activity, unit: defaultUnit(activity) });

  const addRow = () =>
    setRows((current) => [...current, rowFrom(emptyDraft())]);

  const removeRow = (key: string) =>
    setRows((current) =>
      current.length > 1 ? current.filter((row) => row.key !== key) : current,
    );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const day = entry?.date ?? date;
    const found: Record<string, ExerciseError> = {};
    for (const row of rows) {
      const problem = exerciseError(toDraft(row), day);
      if (problem) found[row.key] = problem;
    }
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    onSave(rows.map(toDraft));
  };

  const count = rows.length;

  return (
    <ModalShell
      title={
        entry
          ? isEs
            ? "Editar Actividad"
            : "Edit Activity"
          : isEs
            ? "Registrar Actividad"
            : "Log Activity"
      }
      subtitle={
        isEs
          ? `Anota lo que hiciste · ${dayLabel}. Puedes agregar varios ejercicios a la vez.`
          : `Note what you did · ${dayLabel}. You can add several exercises at once.`
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <ol className="space-y-3">
          {rows.map((row, index) => {
            const error = errors[row.key];
            const idBase = `exercise-${row.key}`;
            return (
              <li
                key={row.key}
                className="space-y-3 rounded-xl border border-line-subtle bg-surface-sunken p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-fg-muted">
                    {isEs ? `Ejercicio ${index + 1}` : `Exercise ${index + 1}`}
                  </p>
                  {count > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeRow(row.key)}
                      className={`${ICON_BUTTON} hover:bg-danger-surface hover:text-danger`}
                      aria-label={
                        isEs
                          ? `Quitar ejercicio ${index + 1}`
                          : `Remove exercise ${index + 1}`
                      }
                      title={isEs ? "Quitar" : "Remove"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                {error ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-danger-line bg-danger-surface p-3 text-xs font-semibold text-danger"
                  >
                    {isEs ? ERROR_TEXT[error].es : ERROR_TEXT[error].en}
                  </p>
                ) : null}

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`${idBase}-activity`}
                      className="block text-xs font-bold text-fg-secondary"
                    >
                      {isEs ? "Ejercicio" : "Exercise"}{" "}
                      <span className="text-danger">*</span>
                    </label>
                    <select
                      id={`${idBase}-activity`}
                      value={row.activity}
                      onChange={(event) =>
                        pickActivity(
                          row.key,
                          event.target.value as ExerciseActivity,
                        )
                      }
                      className={`${FIELD_CLASS} cursor-pointer`}
                    >
                      {ACTIVITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {isEs ? option.labelEs : option.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {row.activity === "other" ? (
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`${idBase}-name`}
                        className="block text-xs font-bold text-fg-secondary"
                      >
                        {isEs ? "Nombre del ejercicio" : "Exercise name"}{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <input
                        id={`${idBase}-name`}
                        value={row.customName}
                        onChange={(event) =>
                          updateRow(row.key, { customName: event.target.value })
                        }
                        placeholder={isEs ? "ej. Bailar" : "e.g. Dancing"}
                        className={FIELD_CLASS}
                        autoFocus
                      />
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`${idBase}-unit`}
                      className="block text-xs font-bold text-fg-secondary"
                    >
                      {isEs ? "Unidad" : "Unit"}
                    </label>
                    <select
                      id={`${idBase}-unit`}
                      value={row.unit}
                      onChange={(event) =>
                        updateRow(row.key, {
                          unit: event.target.value as ExerciseUnit,
                        })
                      }
                      className={`${FIELD_CLASS} cursor-pointer`}
                    >
                      {UNIT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {isEs ? option.labelEs : option.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`${idBase}-amount`}
                      className="block text-xs font-bold text-fg-secondary"
                    >
                      {isEs ? "Cantidad" : "Amount"}{" "}
                      <span className="text-fg-muted">
                        ({unitLabel(row.unit, isEs)})
                      </span>{" "}
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      id={`${idBase}-amount`}
                      type="text"
                      inputMode="decimal"
                      value={row.amount}
                      onChange={(event) =>
                        updateRow(row.key, { amount: event.target.value })
                      }
                      placeholder="0"
                      className={FIELD_CLASS}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`${idBase}-note`}
                    className="block text-xs font-bold text-fg-secondary"
                  >
                    {isEs ? "Nota (opcional)" : "Note (optional)"}
                  </label>
                  <input
                    id={`${idBase}-note`}
                    value={row.note}
                    onChange={(event) =>
                      updateRow(row.key, { note: event.target.value })
                    }
                    placeholder={
                      isEs ? "ej. 10 flexiones extra" : "e.g. 10 extra push-ups"
                    }
                    className={FIELD_CLASS}
                  />
                </div>
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          onClick={addRow}
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded border border-line bg-[var(--color-gray-50)] px-4 text-sm font-bold tracking-[0.07px] text-fg-brand transition-colors hover:bg-surface"
        >
          <Plus className="h-4 w-4" />
          {isEs ? "Agregar otro ejercicio" : "Add another exercise"}
        </button>

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
            {count > 1
              ? isEs
                ? `Guardar ${count} ejercicios`
                : `Save ${count} exercises`
              : isEs
                ? "Guardar"
                : "Save"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
