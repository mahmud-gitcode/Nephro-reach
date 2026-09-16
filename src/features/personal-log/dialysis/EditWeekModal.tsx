"use client";

import React, { useState } from "react";
import { AlertCircle, Check, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button, Modal } from "@/components/ui";
import {
  ALL_WEEKDAYS,
  DEFAULT_CHAIR_TIME,
  DEFAULT_DURATION_MINUTES,
  prevailingChairTime,
  prevailingDuration,
  SCOPE_OPTIONS,
  WEEKDAY_ES,
  formatFullDate,
  type ApplyScope,
  type ScheduleDraft,
} from "./schedule";

/* ==========================================================================
   EditWeekModal
   --------------------------------------------------------------------------
   Lifted out of the dialysis management dashboard, where it was 236 lines of
   JSX in the middle of an 1,857-line component and its six pieces of draft
   state sat alongside the page's own.

   The draft lives here now, which is where it belongs: nothing outside this
   form has any use for a half-edited schedule. The page gives it the current
   schedule to start from and gets back a finished one — and because the
   component is keyed on `open` by its caller, reopening it starts clean
   without an effect syncing anything.

   What it deliberately does not know: which date the new schedule takes
   effect from. That depends on the calendar the page is showing, so the page
   passes `effectiveDateFor` and the form just asks it.
   ========================================================================== */

export type EditWeekResult = {
  draft: ScheduleDraft;
  scope: ApplyScope;
  hideBlankDays: boolean;
};

export function EditWeekModal({
  open,
  onClose,
  initialDays,
  initialChairTimes,
  initialReminderLead,
  initialDurations,
  initialHideBlankDays,
  effectiveDateFor,
  monthLabel,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initialDays: string[];
  initialChairTimes: Record<string, string>;
  initialReminderLead: number;
  initialDurations: Record<string, number>;
  initialHideBlankDays: boolean;
  /** Where the chosen scope starts, decided by the page's calendar. */
  effectiveDateFor: (scope: ApplyScope) => Date;
  /** "June 2026", already in the member's language. */
  monthLabel: string;
  onSave: (result: EditWeekResult) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [tempDays, setTempDays] = useState<string[]>(initialDays);
  const [tempChairTimes, setTempChairTimes] =
    useState<Record<string, string>>(initialChairTimes);
  const [tempLead, setTempLead] = useState<number>(initialReminderLead);
  const [tempDurations, setTempDurations] =
    useState<Record<string, number>>(initialDurations);
  const [tempHideBlankDays, setTempHideBlankDays] =
    useState(initialHideBlankDays);
  const [applyScope, setApplyScope] = useState<ApplyScope>("currentTreatment");

  /* A member must stay prescribed at least one day: removing the last one
     is not a schedule, it is a mistake. */
  const toggleDaySelection = (day: string) => {
    if (tempDays.includes(day)) {
      if (tempDays.length > 1) {
        setTempDays(tempDays.filter((entry) => entry !== day));
      }
      return;
    }
    setTempDays([...tempDays, day]);
    /* A new day joins the slot the others are already on, because that is
       what a prescription looks like: one chair time across the week. */
    setTempChairTimes((prev: Record<string, string>) =>
      prev[day] ? prev : { ...prev, [day]: prevailingChairTime(prev) },
    );
    setTempDurations((prev: Record<string, number>) =>
      prev[day] ? prev : { ...prev, [day]: prevailingDuration(prev) },
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({
      draft: {
        days: tempDays,
        chairTimes: tempChairTimes,
        reminderLeadMinutes: tempLead,
        durations: tempDurations,
      },
      scope: applyScope,
      hideBlankDays: tempHideBlankDays,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title={isEs ? "Editar Horario Semanal" : "Edit Weekly Schedule"}
      description={
        isEs
          ? "Selecciona los días en que tienes diálisis"
          : "Select which days of the week you receive dialysis"
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button type="submit" form="week-schedule-form">
            {isEs ? "Guardar Horario" : "Save Schedule"}
          </Button>
        </>
      }
    >
      <form
        id="week-schedule-form"
        onSubmit={handleSubmit}
        className="space-y-stack-lg"
      >
        <div>
          <label className="mb-2 block font-semibold text-fg-secondary">
            {isEs ? "Días de Diálisis" : "Prescribed Dialysis Days"}
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ALL_WEEKDAYS.map((day) => {
              const isSelected = tempDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDaySelection(day)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 text-left font-bold transition-all ${
                    isSelected
                      ? "border-[var(--color-brand-600)] bg-primary-soft text-fg-brand"
                      : "border-line bg-surface text-fg-secondary hover:bg-surface-sunken"
                  }`}
                >
                  <span>{isEs ? WEEKDAY_ES[day] : day}</span>
                  {isSelected && (
                    <Check className="h-[18px] w-[18px] stroke-[3]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Blank-day display option for the Dialysis Schedule card */}
        <button
          type="button"
          onClick={() => setTempHideBlankDays((prev) => !prev)}
          aria-pressed={tempHideBlankDays}
          className="flex w-full cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:bg-surface-sunken"
        >
          <span
            className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
              tempHideBlankDays
                ? "border-[var(--color-brand-600)] bg-action"
                : "border-line-strong"
            }`}
          >
            {tempHideBlankDays && (
              <Check className="h-3 w-3 stroke-[3.5] text-white" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-fg-secondary">
              {isEs ? "Ocultar días en blanco" : "Remove blank days"}
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed font-medium text-fg-muted">
              {isEs
                ? "La semana muestra solo tus días de tratamiento, sin los espacios vacíos."
                : "The week shows only your treatment days, with no empty placeholders."}
            </span>
          </span>
        </button>

        {/* Chair time and session length together, per prescribed day.

          They belong on the same row because they are one fact — "Monday at
          5:30 for four hours" — and splitting the length into a separate
          panel made it look like one number shared by the week, which it is
          not. */}
        <div>
          <label className="mb-2 block font-semibold text-fg-secondary">
            {isEs ? "Hora del Sillón y Duración" : "Chair Time & Duration"}
          </label>
          <div className="space-y-2">
            {ALL_WEEKDAYS.filter((day) => tempDays.includes(day)).map((day) => {
              const minutes = tempDurations[day] ?? DEFAULT_DURATION_MINUTES;
              const dayName = isEs ? WEEKDAY_ES[day] : day;

              return (
                <div
                  key={day}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2"
                >
                  <span className="inline-flex items-center gap-2 font-bold text-fg-secondary">
                    <Clock className="h-4 w-4 shrink-0 stroke-[2.4] text-fg-subtle" />
                    {dayName}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="time"
                      aria-label={`${isEs ? "Hora del sillón" : "Chair time"} — ${dayName}`}
                      value={tempChairTimes[day] ?? DEFAULT_CHAIR_TIME}
                      onChange={(e) =>
                        setTempChairTimes((prev: Record<string, string>) => ({
                          ...prev,
                          [day]: e.target.value,
                        }))
                      }
                      className="cursor-pointer rounded-lg border border-line bg-surface-sunken px-2.5 py-1.5 font-bold text-fg-secondary transition-colors outline-none focus:border-[var(--color-brand-600)] focus:bg-surface focus:ring-2 focus:ring-ring"
                    />

                    <span className="font-bold text-fg-muted">
                      {isEs ? "por" : "for"}
                    </span>

                    {/* Hours and minutes as two boxes, because a session is
                      spoken as "four hours" or "three and a half", never as
                      210. */}
                    <input
                      type="number"
                      min={0}
                      max={12}
                      aria-label={`${isEs ? "Horas" : "Hours"} — ${dayName}`}
                      value={Math.floor(minutes / 60)}
                      onChange={(e) =>
                        setTempDurations((prev: Record<string, number>) => ({
                          ...prev,
                          [day]:
                            (Number(e.target.value) || 0) * 60 + (minutes % 60),
                        }))
                      }
                      className="w-14 rounded-lg border border-line bg-surface-sunken px-2 py-1.5 text-center font-bold text-fg-secondary transition-colors outline-none focus:border-[var(--color-brand-600)] focus:bg-surface focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-xs font-bold text-fg-muted">
                      {isEs ? "h" : "h"}
                    </span>

                    <input
                      type="number"
                      min={0}
                      max={59}
                      step={5}
                      aria-label={`${isEs ? "Minutos" : "Minutes"} — ${dayName}`}
                      value={minutes % 60}
                      onChange={(e) =>
                        setTempDurations((prev: Record<string, number>) => ({
                          ...prev,
                          [day]:
                            Math.floor(minutes / 60) * 60 +
                            (Number(e.target.value) || 0),
                        }))
                      }
                      className="w-14 rounded-lg border border-line bg-surface-sunken px-2 py-1.5 text-center font-bold text-fg-secondary transition-colors outline-none focus:border-[var(--color-brand-600)] focus:bg-surface focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-xs font-bold text-fg-muted">
                      {isEs ? "m" : "m"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* The reminder is expressed against the chair time, not as its own
          clock time, so moving a chair time moves the reminder with it. */}
        <div>
          <label
            htmlFor="reminder-lead"
            className="mb-2 block font-semibold text-fg-secondary"
          >
            {isEs ? "Recordarme" : "Remind me"}
          </label>
          <select
            id="reminder-lead"
            value={tempLead}
            onChange={(e) => setTempLead(Number(e.target.value))}
            className="w-full cursor-pointer rounded-xl border border-line bg-surface px-3 py-2.5 font-bold text-fg-secondary transition-colors outline-none focus:border-[var(--color-brand-600)] focus:ring-2 focus:ring-ring"
          >
            {[0, 30, 60, 90, 120, 180].map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes === 0
                  ? isEs
                    ? "A la hora del sillón"
                    : "At my chair time"
                  : isEs
                    ? `${minutes} minutos antes`
                    : `${minutes} minutes before`}
              </option>
            ))}
          </select>
        </div>

        {/* Apply scope: how far back this schedule reaches */}
        <div className="space-y-2">
          <label className="block font-semibold text-fg-secondary">
            {isEs ? "Aplicar Este Horario A" : "Apply This Schedule To"}
          </label>

          <div className="space-y-2">
            {SCOPE_OPTIONS.map((option) => {
              const isSelected = applyScope === option.id;
              const effective = effectiveDateFor(option.id);

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setApplyScope(option.id)}
                  aria-pressed={isSelected}
                  className={`flex w-full cursor-pointer items-start gap-2.5 rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? "border-[var(--color-brand-600)] bg-primary-soft"
                      : "border-line bg-surface hover:bg-surface-sunken"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? "border-[var(--color-brand-600)]"
                        : "border-line-strong"
                    }`}
                  >
                    {isSelected && (
                      <span className="h-2.5 w-2.5 rounded-full bg-action" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    {/* Title on the left, effective date right-aligned beside it */}
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <span
                        className={`font-bold ${
                          isSelected ? "text-fg-brand" : "text-fg-secondary"
                        }`}
                      >
                        {isEs ? option.labelEs : option.labelEn}
                      </span>
                      <span className="ml-auto text-right text-xs font-bold text-fg">
                        {isEs ? "Desde" : "Starts"}{" "}
                        {formatFullDate(effective, isEs)}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed font-medium text-fg-muted">
                      {isEs ? option.descEs : option.descEn}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Full month rebuilds treatments that already happened */}
          {applyScope === "month" && (
            <div className="flex items-start gap-2 rounded-xl border border-warning-line bg-warning-surface p-3">
              <AlertCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-warning" />
              <p className="text-xs leading-relaxed font-medium text-warning-900">
                <strong className="font-bold">
                  {isEs ? "Aviso:" : "Heads up:"}
                </strong>{" "}
                {isEs
                  ? `Esto reconstruye todo ${monthLabel} desde el día 1, incluidos los tratamientos ya pasados. Puede generar una gran cantidad de tarjetas y los registros guardados con el horario anterior podrían dejar de coincidir.`
                  : `This rebuilds all of ${monthLabel} from the 1st, including treatments that already happened. It can create a large number of cards, and records logged against the old schedule may no longer line up.`}
              </p>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

export default EditWeekModal;
