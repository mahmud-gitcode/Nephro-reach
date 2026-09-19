"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  Clock,
  Flame,
  Footprints,
  Frown,
  HeartPulse,
  Info,
  Meh,
  Pencil,
  PersonStanding,
  Plus,
  Smile,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ModalShell } from "@/features/personal-log/nutrition/NutritionModals";
import { toNumber } from "@/features/personal-log/nutrition/nutrition.format";
import {
  ACTIVITY_OPTIONS,
  FEELING_OPTIONS,
  INTENSITY_OPTIONS,
  UNIT_OPTIONS,
} from "./exercise.options";
import {
  activityLabel,
  defaultUnit,
  emptyDraft,
  estimateCalories,
  exerciseError,
  feelingLabel,
  feelingSaidBack,
  formatAmount,
  intensityLabel,
  lowestFeeling,
  minutesOn,
  unitLabel,
  type ExerciseError,
} from "./exercise.rules";
import type {
  ExerciseActivity,
  ExerciseDraft,
  ExerciseEntry,
  ExerciseFeeling,
  ExerciseIntensity,
  ExerciseUnit,
} from "./exercise.types";

/* The exercise half of the nutrition screen: a read-back of the day in four
   tiles, the activities logged on it, and the panel that adds one without
   leaving the page. The day itself is chosen by the picker above this card,
   so nothing here repeats it. */

const FIELD_CLASS =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-medium text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-primary-edge focus:ring-1 focus:ring-ring";

const ICON_BUTTON =
  "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-colors";

const LABEL_CLASS = "block text-xs font-bold text-fg-secondary";

/* The standing-to-sprinting glyphs the intensity row is read by. */
const INTENSITY_ICON: Record<
  ExerciseIntensity,
  React.ComponentType<{ className?: string }>
> = {
  light: PersonStanding,
  moderate: Footprints,
  vigorous: Zap,
};

/* Four faces, best to worst. `tone` colours the face; `selected` tints the
   whole button once it is chosen. */
const FEELING_FACE: Record<
  ExerciseFeeling,
  {
    icon: React.ComponentType<{ className?: string }>;
    tone: string;
    selected: string;
  }
> = {
  good: {
    icon: Smile,
    tone: "text-success",
    selected: "border-success-line bg-success-surface",
  },
  okay: {
    icon: Meh,
    tone: "text-warning",
    selected: "border-warning-line bg-warning-surface",
  },
  tired: {
    icon: Frown,
    tone: "text-danger",
    selected: "border-danger-line bg-danger-surface",
  },
  unwell: {
    icon: Meh,
    tone: "text-fg-muted",
    selected: "border-line bg-surface-sunken",
  },
};

function StatTile({
  icon: Icon,
  iconClass,
  iconBg,
  tint,
  value,
  label,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  iconBg: string;
  tint: string;
  value: string;
  label: string;
  /* Shown as a tooltip and read out to screen readers, because every tile
     here is an estimate or a summary rather than a plain count. */
  hint?: string;
}) {
  return (
    <article
      className={`flex items-center gap-3 rounded-[10px] border border-line p-4 ${tint}`}
      title={hint}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconBg}`}
      >
        <Icon className={`h-5 w-5 ${iconClass}`} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xl leading-7 font-semibold tracking-[0.1px] text-fg">
          {value}
        </p>
        <p className="flex items-center gap-1 text-sm leading-5 font-medium tracking-[0.07px] text-fg-muted">
          <span className="truncate">{label}</span>
          {hint ? (
            <Info
              className="h-3.5 w-3.5 shrink-0 text-fg-subtle"
              aria-hidden="true"
            />
          ) : null}
        </p>
        {hint ? <span className="sr-only">{hint}</span> : null}
      </div>
    </article>
  );
}

export function ExerciseCard({
  entries,
  date,
  isToday,
  dayLabel,
  isFormOpen,
  onFormOpenChange,
  onLog,
  onEdit,
  onDelete,
}: {
  entries: ExerciseEntry[];
  /** The day being shown, `yyyy-mm-dd`. New activity is filed under it. */
  date: string;
  isToday: boolean;
  dayLabel: string;
  isFormOpen: boolean;
  onFormOpenChange: (open: boolean) => void;
  onLog: (draft: ExerciseDraft) => void;
  onEdit: (entry: ExerciseEntry) => void;
  onDelete: (entry: ExerciseEntry) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const minutes = minutesOn(entries);
  const calories = estimateCalories(entries);
  const feeling = lowestFeeling(entries);

  return (
    <section className="space-y-6 rounded-[10px] border border-line bg-[var(--surface)] p-6">
      <header className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100">
          <Activity className="h-6 w-6 text-fg-brand" />
        </span>
        <div className="min-w-0">
          <h2 className="text-heading-4 text-fg">
            {isEs ? "Ejercicio y Movimiento" : "Exercise & Movement"}
          </h2>
          <p className="mt-0.5 text-body-md text-fg-muted">
            {isEs
              ? "Registra tu actividad física como parte de tu salud renal."
              : "Track your physical activity as part of your kidney health journey."}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={Clock}
          iconClass="text-fg-brand"
          iconBg="bg-brand-100"
          tint="bg-brand-50"
          value={`${minutes} min`}
          label={isEs ? "Actividad total" : "Total activity"}
          hint={
            isEs
              ? "Suma solo las actividades registradas en minutos."
              : "Counts only the activities you logged in minutes."
          }
        />
        <StatTile
          icon={Footprints}
          iconClass="text-success"
          iconBg="bg-success-100"
          tint="bg-success-surface"
          value={`${entries.length}`}
          label={isEs ? "Actividades registradas" : "Activities logged"}
        />
        <StatTile
          icon={Flame}
          iconClass="text-warning"
          iconBg="bg-warning-100"
          tint="bg-warning-surface"
          value={`${calories}`}
          label={isEs ? "Calorías estimadas" : "Estimated calories"}
          hint={
            isEs
              ? "Una estimación aproximada a partir de la duración y la intensidad. No es una cifra clínica."
              : "A rough estimate from duration and intensity. Not a clinical figure."
          }
        />
        <StatTile
          icon={HeartPulse}
          iconClass="text-danger"
          iconBg="bg-danger-surface"
          tint="bg-danger-surface"
          value={feeling ? feelingLabel(feeling, isEs) : "—"}
          label={isEs ? "Cómo te sentiste" : "How you felt"}
          hint={
            isEs
              ? "Muestra lo más bajo que registraste este día, no un promedio."
              : "Shows the lowest you logged on this day, not an average."
          }
        />
      </div>

      <div>
        <h3 className="text-lg leading-7 font-medium tracking-[0.09px] text-fg">
          {isToday
            ? isEs
              ? "Actividades de hoy"
              : "Today's Activities"
            : isEs
              ? `Actividades · ${dayLabel}`
              : `Activities · ${dayLabel}`}
        </h3>

        {entries.length === 0 ? (
          <div className="mt-3 rounded-xl border border-line bg-surface px-4 py-10 text-center">
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
                ? "Por ejemplo: 15 minutos de caminata."
                : "For example: 15 minutes of walking."}
            </p>
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {entries.map((entry) => {
              const label = activityLabel(entry, isEs);
              return (
                <li
                  key={entry.id}
                  className="flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3"
                >
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                    <Activity className="h-5 w-5 text-fg-brand" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-fg">{label}</p>
                    {/* Amount, intensity and feeling read as one line, the
                        feeling dropped when it was never answered. */}
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-fg-muted">
                      <span>
                        {formatAmount(entry.amount, entry.unit, isEs)}
                      </span>
                      <span aria-hidden="true" className="text-fg-subtle">
                        |
                      </span>
                      <span>
                        {isEs
                          ? `Intensidad ${intensityLabel(entry.intensity, isEs).toLowerCase()}`
                          : `${intensityLabel(entry.intensity, isEs)} intensity`}
                      </span>
                      {entry.feeling ? (
                        <>
                          <span aria-hidden="true" className="text-fg-subtle">
                            |
                          </span>
                          <span>{feelingSaidBack(entry.feeling, isEs)}</span>
                        </>
                      ) : null}
                    </p>
                    {entry.note ? (
                      <p className="mt-1 text-sm text-fg-subtle">
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
        )}
      </div>

      <LogActivityPanel
        date={date}
        isOpen={isFormOpen}
        onOpenChange={onFormOpenChange}
        onLog={onLog}
      />

      <p className="flex items-start gap-2 rounded-xl border border-warning-line bg-warning-surface p-4 text-sm font-medium text-warning">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          {isEs
            ? "Elige actividades apropiadas para tu salud y sigue las recomendaciones de tu equipo de cuidado. Detente y contacta a tu proveedor si te sientes mal."
            : "Choose activities appropriate for your health and follow your care team's recommendations. Stop and contact your provider if you feel unwell."}
        </span>
      </p>
    </section>
  );
}

/* ==========================================================================
   Log a New Activity — the inline panel
   --------------------------------------------------------------------------
   Adding happens here, in place. Editing an existing note opens the modal
   below, which is these fields plus the unit, because an old entry may have
   been counted in steps or reps rather than minutes.
   ========================================================================== */

function LogActivityPanel({
  date,
  isOpen,
  onOpenChange,
  onLog,
}: {
  date: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLog: (draft: ExerciseDraft) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [row, setRow] = useState<ExerciseRow>(() => rowFrom(emptyDraft()));
  const [error, setError] = useState<ExerciseError | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* Opened from the page header, the panel can sit far below the fold. */
  useEffect(() => {
    if (isOpen) panelRef.current?.scrollIntoView({ block: "nearest" });
  }, [isOpen]);

  const update = (patch: Partial<ExerciseRow>) => {
    setRow((current) => ({ ...current, ...patch }));
    setError(null);
  };

  const reset = () => {
    setRow(rowFrom(emptyDraft()));
    setError(null);
  };

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const draft = toDraft(row);
    const problem = exerciseError(draft, date);
    if (problem) {
      setError(problem);
      return;
    }
    onLog(draft);
    /* The panel stays open: logging two activities in a row is the common
       case, and a cleared form is the invitation to do it. */
    reset();
  };

  return (
    <div
      ref={panelRef}
      className="overflow-hidden rounded-xl border border-primary-edge bg-surface"
    >
      <button
        type="button"
        onClick={() => (isOpen ? close() : onOpenChange(true))}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer items-center gap-3 bg-brand-50 px-4 py-3.5 text-left transition-colors hover:bg-brand-100"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-action text-white">
          {isOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </span>
        <span className="text-lg leading-7 font-medium tracking-[0.09px] text-fg-brand">
          {isEs ? "Registrar Nueva Actividad" : "Log a New Activity"}
        </span>
      </button>

      {isOpen ? (
        <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-6">
          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-danger-line bg-danger-surface p-3 text-sm font-semibold text-danger"
            >
              {isEs ? ERROR_TEXT[error].es : ERROR_TEXT[error].en}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="exercise-new-activity" className={LABEL_CLASS}>
                {isEs ? "Tipo de actividad" : "Activity Type"}{" "}
                <span className="text-danger">*</span>
              </label>
              <select
                id="exercise-new-activity"
                value={row.activity}
                onChange={(event) => {
                  const activity = event.target.value as ExerciseActivity;
                  /* Picking an exercise brings its usual unit with it, so
                     the duration field relabels to match. */
                  update({ activity, unit: defaultUnit(activity) });
                }}
                className={`${FIELD_CLASS} cursor-pointer`}
              >
                {ACTIVITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {isEs ? option.labelEs : option.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="exercise-new-amount" className={LABEL_CLASS}>
                {isEs ? "Duración" : "Duration"}{" "}
                <span className="text-fg-muted">
                  ({unitLabel(row.unit, isEs)})
                </span>{" "}
                <span className="text-danger">*</span>
              </label>
              <input
                id="exercise-new-amount"
                type="text"
                inputMode="decimal"
                value={row.amount}
                onChange={(event) => update({ amount: event.target.value })}
                placeholder={
                  isEs
                    ? `Ingresa ${unitLabel(row.unit, isEs)}`
                    : `Enter ${unitLabel(row.unit, isEs)}`
                }
                className={FIELD_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <p className={LABEL_CLASS} id="exercise-new-intensity-label">
                {isEs ? "Nivel de intensidad" : "Intensity Level"}
              </p>
              <div
                role="radiogroup"
                aria-labelledby="exercise-new-intensity-label"
                className="grid grid-cols-3 gap-2"
              >
                {INTENSITY_OPTIONS.map((option) => {
                  const Icon = INTENSITY_ICON[option.value];
                  const selected = row.intensity === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => update({ intensity: option.value })}
                      className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-sm font-semibold transition-colors ${
                        selected
                          ? "border-success-line bg-success-surface text-success"
                          : "border-line bg-surface-sunken text-fg-muted hover:bg-surface"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {isEs ? option.labelEs : option.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {row.activity === "other" ? (
            <div className="space-y-1.5">
              <label htmlFor="exercise-new-name" className={LABEL_CLASS}>
                {isEs ? "Nombre del ejercicio" : "Exercise name"}{" "}
                <span className="text-danger">*</span>
              </label>
              <input
                id="exercise-new-name"
                value={row.customName}
                onChange={(event) => update({ customName: event.target.value })}
                placeholder={isEs ? "ej. Bailar" : "e.g. Dancing"}
                className={FIELD_CLASS}
                autoFocus
              />
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-1.5">
              <p className={LABEL_CLASS} id="exercise-new-feeling-label">
                {isEs ? "¿Cómo te sentiste?" : "How did you feel?"}
              </p>
              <div
                role="radiogroup"
                aria-labelledby="exercise-new-feeling-label"
                className="grid grid-cols-4 gap-2"
              >
                {FEELING_OPTIONS.map((option) => {
                  const face = FEELING_FACE[option.value];
                  const Icon = face.icon;
                  const selected = row.feeling === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      /* Tapping the chosen face again clears it: the
                         question is optional and carries no "prefer not to
                         say" of its own. */
                      onClick={() =>
                        update({ feeling: selected ? null : option.value })
                      }
                      className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-1 py-2.5 transition-colors ${
                        selected
                          ? face.selected
                          : "border-transparent hover:bg-surface-sunken"
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${face.tone}`} />
                      <span className="truncate text-xs font-semibold text-fg-muted">
                        {isEs ? option.labelEs : option.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="exercise-new-note" className={LABEL_CLASS}>
                {isEs ? "Notas (opcional)" : "Notes (optional)"}
              </label>
              <textarea
                id="exercise-new-note"
                rows={3}
                value={row.note}
                onChange={(event) => update({ note: event.target.value })}
                placeholder={
                  isEs
                    ? "Síntomas, comentarios o detalles…"
                    : "Any symptoms, comments, or details…"
                }
                className={`${FIELD_CLASS} resize-y`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-line-subtle pt-4 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={close}
              className="cursor-pointer rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-fg-muted transition-colors hover:bg-surface-sunken"
            >
              {isEs ? "Cancelar" : "Cancel"}
            </button>
            <button
              type="submit"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-action px-5 py-2.5 text-sm font-bold text-white shadow-control transition-colors hover:bg-action-hover"
            >
              <Plus className="h-4 w-4" />
              {isEs ? "Registrar Actividad" : "Log Activity"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
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

/* One row of a form. Amount stays a string while typing so "1." and "" are
   allowed on the way to a number. */
interface ExerciseRow {
  key: string;
  activity: ExerciseActivity;
  customName: string;
  amount: string;
  unit: ExerciseUnit;
  intensity: ExerciseIntensity;
  feeling: ExerciseFeeling | null;
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
    intensity: draft.intensity,
    feeling: draft.feeling,
    note: draft.note,
  };
}

const toDraft = (row: ExerciseRow): ExerciseDraft => ({
  activity: row.activity,
  customName: row.customName,
  amount: toNumber(row.amount),
  unit: row.unit,
  intensity: row.intensity,
  feeling: row.feeling,
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
                      className={LABEL_CLASS}
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
                      <label htmlFor={`${idBase}-name`} className={LABEL_CLASS}>
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
                    <label htmlFor={`${idBase}-unit`} className={LABEL_CLASS}>
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
                    <label htmlFor={`${idBase}-amount`} className={LABEL_CLASS}>
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
                  <p className={LABEL_CLASS} id={`${idBase}-intensity-label`}>
                    {isEs ? "Nivel de intensidad" : "Intensity Level"}
                  </p>
                  <div
                    role="radiogroup"
                    aria-labelledby={`${idBase}-intensity-label`}
                    className="grid grid-cols-3 gap-2"
                  >
                    {INTENSITY_OPTIONS.map((option) => {
                      const Icon = INTENSITY_ICON[option.value];
                      const selected = row.intensity === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() =>
                            updateRow(row.key, { intensity: option.value })
                          }
                          className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition-colors ${
                            selected
                              ? "border-success-line bg-success-surface text-success"
                              : "border-line bg-surface text-fg-muted hover:bg-surface-sunken"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {isEs ? option.labelEs : option.labelEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className={LABEL_CLASS} id={`${idBase}-feeling-label`}>
                    {isEs ? "¿Cómo te sentiste?" : "How did you feel?"}
                  </p>
                  <div
                    role="radiogroup"
                    aria-labelledby={`${idBase}-feeling-label`}
                    className="grid grid-cols-4 gap-2"
                  >
                    {FEELING_OPTIONS.map((option) => {
                      const face = FEELING_FACE[option.value];
                      const Icon = face.icon;
                      const selected = row.feeling === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() =>
                            updateRow(row.key, {
                              feeling: selected ? null : option.value,
                            })
                          }
                          className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-1 py-2 transition-colors ${
                            selected
                              ? face.selected
                              : "border-transparent hover:bg-surface"
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${face.tone}`} />
                          <span className="truncate text-[11px] font-semibold text-fg-muted">
                            {isEs ? option.labelEs : option.labelEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor={`${idBase}-note`} className={LABEL_CLASS}>
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
