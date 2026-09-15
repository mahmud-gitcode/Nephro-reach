"use client";

import React, { useState } from "react";
import { Calendar } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button, Modal, MonthCalendar } from "@/components/ui";

/* ==========================================================================
   ExtraTreatmentModal
   --------------------------------------------------------------------------
   Booking an unscheduled session. Lifted out of the dialysis management
   dashboard along with the calendar state and the two draft fields it
   owned — a half-filled extra-treatment form is of no use to the page
   behind it.

   The session number is not the form's to work out. Which interval a date
   falls in, and how many extra sessions are already in it, depends on the
   member's whole schedule and record history; the page knows that, so it
   passes `sessionFor` and the form just asks about the date on screen.
   ========================================================================== */

export type ExtraTreatmentSession = {
  /** "2.1" — the first extra session inside Treatment 2's interval. */
  sessionNumber: string;
  intervalName: string;
  intervalLabel: string;
  /** 1 for the first extra session in this interval, 2 for the next. */
  extraIndex: number;
};

export type ExtraTreatmentDraft = {
  date: Date;
  reason: string;
  notes: string;
};

export function ExtraTreatmentModal({
  open,
  onClose,
  initialDate,
  sessionFor,
  formatDayLabel,
  monthNames,
  weekdayLabels,
  isMarked,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initialDate: Date;
  sessionFor: (date: Date) => ExtraTreatmentSession;
  formatDayLabel: (date: Date) => string;
  /** Twelve month names in the member's language. */
  monthNames: string[];
  weekdayLabels: string[];
  isMarked?: (date: Date) => boolean;
  onSave: (draft: ExtraTreatmentDraft) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [year, setYear] = useState(initialDate.getFullYear());
  const [month, setMonth] = useState(initialDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(initialDate.getDate());
  const [reason, setReason] = useState("Fluid Overload");
  const [notes, setNotes] = useState("");

  const handleMonthChange = (nextYear: number, nextMonth: number) => {
    setYear(nextYear);
    setMonth(nextMonth);
  };

  /* The whole form hangs off this one date. */
  const pickedDate = new Date(year, month, selectedDay);
  const session = sessionFor(pickedDate);
  const dateLabel = formatDayLabel(pickedDate);
  const monthLabel = `${monthNames[month]} ${year}`;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({ date: pickedDate, reason, notes });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title={isEs ? "Tomar Tratamiento Extra" : "Take Extra Treatment"}
      description={
        isEs
          ? "Selecciona la fecha en el calendario para agendar la sesión extra"
          : "Select a date on the calendar to schedule an extra treatment session"
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button type="submit" form="extra-tx-form">
            {isEs ? "Crear Sesión Extra" : "Create Extra Treatment"}
          </Button>
        </>
      }
    >
      <form
        id="extra-tx-form"
        onSubmit={handleSubmit}
        className="space-y-stack-xl"
      >
        {/* 1. Interactive Calendar Date Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold tracking-wider text-fg-secondary uppercase sm:text-sm">
            {isEs
              ? "Seleccionar Fecha en el Calendario"
              : "Select Date on Calendar"}
          </label>

          <div className="space-y-4 rounded-card border border-line bg-surface-sunken p-4 sm:p-5">
            <MonthCalendar
              year={year}
              month={month}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onMonthChange={handleMonthChange}
              monthLabel={monthLabel}
              weekdayLabels={weekdayLabels}
              formatDayLabel={formatDayLabel}
              /* A dot on prescribed days, so an extra session can be
                 placed relative to the run schedule at a glance. */
              isMarked={isMarked}
              previousMonthLabel={isEs ? "Mes anterior" : "Previous month"}
              nextMonthLabel={isEs ? "Mes siguiente" : "Next month"}
            />

            {/* Selected Date Confirmation */}
            <div className="flex items-center gap-2 border-t border-line/80 pt-2 text-xs font-semibold text-fg-secondary sm:text-sm">
              <Calendar className="h-4 w-4 text-fg-brand" />
              <span>{isEs ? "Fecha Seleccionada:" : "Selected Date:"}</span>
              <strong className="font-bold text-fg">{dateLabel}</strong>
            </div>
          </div>
        </div>

        {/* 2. Auto-Calculated Session Number */}
        <div className="flex flex-col justify-between gap-3 rounded-card border border-accent-soft-line bg-accent-soft/50 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="space-y-0.5">
            <label className="text-xs font-bold tracking-wider text-accent-fg uppercase">
              {isEs
                ? "Número de Sesión (Automático)"
                : "Session Number (Auto-Assigned)"}
            </label>
            <p className="text-xl font-extrabold tracking-tight text-accent-900 sm:text-2xl">
              Treatment {session.sessionNumber}
            </p>
            <p className="text-xs font-medium text-accent-fg">
              {isEs
                ? `Calculado automáticamente para ${session.intervalName} (${session.intervalLabel})`
                : `Auto-calculated for ${session.intervalName} (${session.intervalLabel})`}
            </p>
          </div>

          <span className="self-start rounded-xl border border-accent-300 bg-accent-200/80 px-3 py-1.5 text-xs font-bold text-accent-900 sm:self-center">
            Extra #{session.extraIndex}
          </span>
        </div>

        {/* 3. Clinical Reason */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-fg-secondary sm:text-sm">
            {isEs ? "Motivo Clínico" : "Clinical Reason"}
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-fg-secondary shadow-control outline-none focus:border-primary-edge focus:ring-1 focus:ring-ring sm:text-base"
          >
            <option value="Fluid Overload">
              Fluid Overload (Extra Ultrafiltration needed)
            </option>
            <option value="High Potassium">
              High Potassium Alert / Lab Result
            </option>
            <option value="Doctor Order">
              Nephrologist / Doctor Direct Prescription
            </option>
            <option value="Missed Session">
              Make-up for a Missed Regular Session
            </option>
          </select>
        </div>

        {/* 4. Additional Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-fg-secondary sm:text-sm">
            {isEs ? "Notas Adicionales" : "Additional Notes / Symptoms"}
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              isEs
                ? "Describe los síntomas o indicaciones médicas para esta sesión..."
                : "Symptoms, fluid overload indicators, or instructions for this extra session..."
            }
            className="w-full resize-none rounded-xl border border-line bg-surface p-3.5 text-sm font-medium text-fg-secondary shadow-control outline-none focus:border-primary-edge focus:ring-1 focus:ring-ring sm:text-base"
          />
        </div>
      </form>
    </Modal>
  );
}

export default ExtraTreatmentModal;
