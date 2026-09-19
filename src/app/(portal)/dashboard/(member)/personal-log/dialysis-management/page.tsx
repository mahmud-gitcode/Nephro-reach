"use client";

import React, { useState, Suspense } from "react";
import {
  Bell,
  Clock,
  Hourglass,
  Settings,
  Undo2,
  Redo2,
  Eraser,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  ALL_WEEKDAYS,
  DEFAULT_DURATION_MINUTES,
  DEFAULT_CHAIR_TIME,
  durationFor,
  WEEKDAY_ES,
  formatDuration,
  formatFullDate,
  formatReminder,
  reminderTimeFor,
  fromDateKey,
  appendSchedulePeriod,
  buildSchedulePeriod,
  makeIsTreatmentDay,
  nextScheduledDate,
  pad2,
  scheduledOnOrBefore,
  startOfToday,
  toDateKey,
  treatmentNumberInMonth,
  type ApplyScope,
  type ExtraTreatment,
  type SchedulePeriod,
} from "@/features/personal-log/dialysis/schedule";
import {
  EditWeekModal,
  type EditWeekResult,
} from "@/features/personal-log/dialysis/EditWeekModal";
import {
  ExtraTreatmentModal,
  type ExtraTreatmentDraft,
} from "@/features/personal-log/dialysis/ExtraTreatmentModal";
import type {} from "@/features/personal-log/dialysis/treatment.types";
import CareTeamQuestionsSection from "@/features/care-team/CareTeamQuestionsSection";
import DialysisClinicCard from "@/features/travel/DialysisClinicCard";
import ProviderOrdersSection from "@/features/personal-log/dialysis/ProviderOrdersSection";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import ModalityCard from "@/features/personal-log/dialysis/ModalityCard";
import { useDialysisModality } from "@/features/personal-log/dialysis/useDialysisModality";
import { NoticeRailLayout } from "@/components/layout/NoticeRailLayout";
import { Alert, SectionTitle } from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";

function DialysisManagementDashboard() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const modalityLog = useDialysisModality();

  // Section 2 State: Dialysis Schedule
  // Dated schedule history. The last period is the one currently in force.
  const [schedulePeriods, setSchedulePeriods] = useState<SchedulePeriod[]>([
    /* A typical week: Monday, Wednesday and Friday, a 4-hour run in the
       chair at 5:30 AM, and a reminder at 4:00 AM (90 minutes before). */
    {
      fromKey: "0000-01-01",
      days: ["Monday", "Wednesday", "Friday"],
      chairTimes: {
        Monday: "05:30",
        Wednesday: "05:30",
        Friday: "05:30",
      },
      reminderLeadMinutes: 90,
      durations: {
        Monday: DEFAULT_DURATION_MINUTES,
        Wednesday: DEFAULT_DURATION_MINUTES,
        Friday: DEFAULT_DURATION_MINUTES,
      },
    },
  ]);
  const currentSchedule = schedulePeriods[schedulePeriods.length - 1];
  const selectedDays = currentSchedule.days;
  // Display option: drop the empty placeholder tiles for non-treatment days.
  const [hideBlankDays, setHideBlankDays] = useState(false);
  /* Only treatment days are listed; a row of blank days says nothing. */
  const visibleWeekdays = ALL_WEEKDAYS.filter((day) =>
    selectedDays.includes(day),
  );
  // How a saved week setting should be applied
  const [isEditWeekModalOpen, setIsEditWeekModalOpen] = useState(false);

  // Extra Treatments (unscheduled sessions). Their cards are derived from the
  // weekly schedule, so they stay correctly numbered if the week setting changes.
  const [extraTreatments, setExtraTreatments] = useState<ExtraTreatment[]>([
    {
      id: "tx-extra-3-1",
      dateKey: "2026-06-26",
      reason: "Fluid Overload",
      notes:
        "Unscheduled extra session between treatment 3 and 4 to remove excess interdialytic fluid (+2.4 kg).",
    },
  ]);

  // Temp state for editing week

  // Section 2: Quick Note State with Undo / Redo / Clean
  const [weeklyNote, setWeeklyNote] = useState<string>("");
  const [noteHistory, setNoteHistory] = useState<string[]>([""]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setWeeklyNote(val);
    setNoteHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      next.push(val);
      if (next.length > 50) next.shift();
      return next;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  };

  const handleUndoNote = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setWeeklyNote(noteHistory[newIndex]);
    }
  };

  const handleRedoNote = () => {
    if (historyIndex < noteHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setWeeklyNote(noteHistory[newIndex]);
    }
  };

  const handleCleanNote = () => {
    if (!weeklyNote) return;
    setWeeklyNote("");
    setNoteHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      next.push("");
      return next;
    });
    setHistoryIndex((prev) => prev + 1);
  };

  // Take Extra Treatment Modal State
  const [isExtraTxModalOpen, setIsExtraTxModalOpen] = useState(false);
  // Details / History Modal State

  // Interactive Calendar State (Month & Year) — opens on today

  // ---------------------------------------------------------------------------
  // SCHEDULE ENGINE
  // Treatments are not hardcoded: for any month they are generated from the
  // prescribed weekday list in the Dialysis Schedule card. Treatment N of a month is
  // the Nth prescribed weekday in it, and its interval runs until treatment N+1.
  // ---------------------------------------------------------------------------

  const today = React.useMemo(() => startOfToday(), []);

  // Month currently shown in the treatment cards list (defaults to this month)
  const [viewMonthKey, setViewMonthKey] = useState(
    () => `${today.getFullYear()}-${pad2(today.getMonth() + 1)}`,
  );
  const viewYear = Number(viewMonthKey.slice(0, 4));
  const viewMonth = Number(viewMonthKey.slice(5, 7)) - 1;

  // Resolves whether any given date is a treatment day, honouring the schedule
  // that was in force on that date
  const isTreatmentDay = React.useMemo(
    () => makeIsTreatmentDay(schedulePeriods),
    [schedulePeriods],
  );

  // Interval that contains a date picked in the Take Extra Treatment calendar
  const detectIntervalForDate = (year: number, month: number, day: number) => {
    const picked = new Date(year, month, day);
    const start = scheduledOnOrBefore(picked, isTreatmentDay);
    const end = nextScheduledDate(start, isTreatmentDay);
    const baseNumber = treatmentNumberInMonth(start, isTreatmentDay);
    const nextNumber = baseNumber + 1;

    return {
      startKey: toDateKey(start),
      intervalId: `int-${toDateKey(start)}`,
      baseNumber: `${baseNumber}`,
      intervalName: isEs
        ? `Entre Tratamiento ${baseNumber} y ${nextNumber}`
        : `Between Treatment ${baseNumber} to ${nextNumber}`,
      intervalLabel: isEs
        ? `Tratamiento ${baseNumber} ➜ Tratamiento ${nextNumber}`
        : `Treatment ${baseNumber} ➜ Treatment ${nextNumber}`,
      startDate: formatFullDate(start, isEs),
      endDate: formatFullDate(end, isEs),
    };
  };

  /* Which interval a date falls in, and how many extra sessions are already
     inside it. A function rather than three derived values, because the
     date it depends on now lives in the form that asks. */
  const extraSessionFor = (date: Date) => {
    const interval = detectIntervalForDate(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const alreadyInInterval = extraTreatments.filter(
      (extra) =>
        toDateKey(
          scheduledOnOrBefore(fromDateKey(extra.dateKey), isTreatmentDay),
        ) === interval.startKey,
    ).length;

    return {
      intervalId: interval.intervalId,
      intervalName: interval.intervalName,
      intervalLabel: interval.intervalLabel,
      extraIndex: alreadyInInterval + 1,
      // e.g. first extra inside Treatment 2's interval -> 2.1, the next -> 2.2
      sessionNumber: `${interval.baseNumber}.${alreadyInInterval + 1}`,
    };
  };

  // Month and Weekday labels for Calendar
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthNamesEs = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const daysOfWeekEs = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

  const handleOpenEditWeek = () => setIsEditWeekModalOpen(true);

  // Date the new schedule starts applying from, per the chosen scope
  const scopeEffectiveDate = (scope: ApplyScope) => {
    if (scope === "month") return new Date(viewYear, viewMonth, 1);
    if (scope === "currentTreatment")
      return scheduledOnOrBefore(today, isTreatmentDay);
    return today;
  };

  const handleSaveWeekSetting = ({
    draft,
    scope,
    hideBlankDays: nextHideBlankDays,
  }: EditWeekResult) => {
    const fromKey = toDateKey(scopeEffectiveDate(scope));
    const period = buildSchedulePeriod(draft, fromKey);
    setSchedulePeriods((prev) => appendSchedulePeriod(prev, period));
    setHideBlankDays(nextHideBlankDays);
    setIsEditWeekModalOpen(false);
  };

  const handleSaveExtraTreatment = ({
    date,
    reason,
    notes,
  }: ExtraTreatmentDraft) => {
    const dateKey = toDateKey(date);

    setExtraTreatments((prev) => [
      ...prev,
      {
        id: `tx-extra-${dateKey}-${Date.now()}`,
        dateKey,
        reason,
        notes: notes.trim(),
      },
    ]);

    // Jump the cards list to the month the extra session belongs to
    setViewMonthKey(`${date.getFullYear()}-${pad2(date.getMonth() + 1)}`);
    setIsExtraTxModalOpen(false);
  };

  return (
    <NoticeRailLayout
      title={<PageTitle href="/dashboard/personal-log/dialysis-management" />}
      notices={
        <>
          <PersonalLogDisclaimer spaced={false} stacked />

          {/* Freeform note, alongside the schedule */}
          <section
            aria-label={isEs ? "Notas del horario" : "Schedule notes"}
            className="flex flex-col gap-2 rounded-card border border-line bg-surface p-6 transition-all focus-within:border-primary-soft-line focus-within:ring-2 focus-within:ring-ring/60"
          >
            {/* Note head bar: label on the left, Undo / Redo / Clean on the right */}
            <div className="flex items-center justify-between gap-2 border-b border-line/70 pb-1.5">
              <span className="text-xs font-bold text-fg-secondary">
                {isEs ? "Notas del horario" : "Schedule Notes"}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleUndoNote}
                  disabled={historyIndex <= 0}
                  title={isEs ? "Deshacer (Undo)" : "Undo"}
                  className="cursor-pointer rounded-lg p-1.5 text-fg-muted transition-all hover:bg-line/80 hover:text-fg-secondary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleRedoNote}
                  disabled={historyIndex >= noteHistory.length - 1}
                  title={isEs ? "Rehacer (Redo)" : "Redo"}
                  className="cursor-pointer rounded-lg p-1.5 text-fg-muted transition-all hover:bg-line/80 hover:text-fg-secondary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Redo2 className="h-3.5 w-3.5" />
                </button>

                <div className="mx-0.5 h-3.5 w-px bg-line" />

                <button
                  type="button"
                  onClick={handleCleanNote}
                  disabled={!weeklyNote}
                  title={isEs ? "Limpiar nota (Clean)" : "Clean Note"}
                  className="cursor-pointer rounded-lg p-1.5 text-fg-muted transition-all hover:bg-danger-surface hover:text-danger disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Eraser className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Note area */}
            <textarea
              value={weeklyNote}
              onChange={handleNoteChange}
              rows={2}
              placeholder={
                isEs
                  ? "Escribe cualquier nota, síntoma o recordatorio aquí..."
                  : "Write any notes, symptoms, or reminders here..."
              }
              className="min-h-[160px] w-full flex-1 resize-none bg-transparent text-xs font-medium text-fg-secondary outline-none placeholder:text-fg-subtle sm:text-sm"
            />
          </section>
        </>
      }
    >
      <div className="space-y-6 pb-12">
        {/* The modality comes first: it decides whether the schedule below
            makes sense at all. The weekly grid describes runs with gaps
            between them, which is not how PD works. */}
        <ModalityCard log={modalityLog} />

        <DialysisClinicCard />

        {/* Said plainly rather than by quietly hiding the schedule: a
            member who switched to PD should know why the week below still
            looks the way it does, not wonder whether the app lost it. */}
        {!modalityLog.hasIntervals ? (
          <Alert
            tone="info"
            title={
              isEs
                ? "Tu horario semanal es para hemodiálisis"
                : "The weekly schedule below is for hemodialysis"
            }
          >
            {isEs
              ? "En diálisis peritoneal haces intercambios todos los días, así que no hay días de tratamiento ni tiempo entre ellos. Registra cada intercambio en Tratamiento de Diálisis."
              : "On peritoneal dialysis you exchange every day, so there are no treatment days with gaps between them. Log each exchange under Dialysis Treatment instead."}
          </Alert>
        ) : null}

        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* 2-COLUMN ROW: CURRENT TREATMENT (COL 1) & WEEK SETTING (COL 2)            */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* CARD 2: DIALYSIS SCHEDULE — day rows on the left, freeform note on the right */}
          <section className="flex flex-col rounded-card border border-line bg-surface p-6 sm:p-6 xl:col-span-12">
            {/* Card head: title on the left, Edit Week on the right */}
            <SectionTitle
              title={isEs ? "Horario de Diálisis" : "Dialysis Schedule"}
              action={
                <button
                  type="button"
                  onClick={handleOpenEditWeek}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-bold text-fg-secondary shadow-control transition-colors hover:border-line-strong hover:bg-surface-sunken sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <Settings className="h-4 w-4 text-fg-muted" />
                  <span>{isEs ? "Editar Semana" : "Edit Week"}</span>
                </button>
              }
            />

            <div>
              {/* One card per treatment day, in an even grid: the day as the
                card's title, then how long, then the chair time. Only
                treatment days are listed. */}
              <ul className="grid grid-cols-1 gap-inline-md sm:grid-cols-2 lg:grid-cols-3">
                {visibleWeekdays.map((day) => (
                  <li
                    key={day}
                    className="flex min-w-0 flex-col gap-stack-sm rounded-xl border border-line bg-gradient-to-r from-primary-soft via-surface to-surface p-inset-sm shadow-card transition-all hover:border-line-strong hover:shadow-md"
                  >
                    <span className="truncate text-label-md text-fg-brand select-none">
                      {isEs ? WEEKDAY_ES[day] : day}
                    </span>

                    <dl className="flex flex-col gap-stack-xs text-body-sm">
                      <div className="flex items-center justify-between gap-inline-md">
                        <dt className="inline-flex items-center gap-inline-xs text-fg-muted">
                          <Hourglass
                            aria-hidden="true"
                            className="h-3.5 w-3.5 shrink-0"
                          />
                          {isEs ? "Tiempo de sesión" : "Run time"}
                        </dt>
                        <dd className="font-semibold text-fg tabular-nums">
                          {formatDuration(durationFor(currentSchedule, day))}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-inline-md">
                        <dt className="inline-flex items-center gap-inline-xs text-fg-muted">
                          <Clock
                            aria-hidden="true"
                            className="h-3.5 w-3.5 shrink-0"
                          />
                          {isEs ? "Hora del sillón" : "Chair time"}
                        </dt>
                        <dd className="rounded-lg border border-line bg-surface-sunken px-2 py-0.5 font-bold text-fg tabular-nums">
                          {formatReminder(
                            currentSchedule.chairTimes[day] ??
                              DEFAULT_CHAIR_TIME,
                            isEs,
                          )}
                        </dd>
                      </div>
                      {/* When the alarm goes off: the chair time less the lead. */}
                      <div className="flex items-center justify-between gap-inline-md">
                        <dt className="inline-flex items-center gap-inline-xs text-fg-muted">
                          <Bell
                            aria-hidden="true"
                            className="h-3.5 w-3.5 shrink-0"
                          />
                          {isEs ? "Recordatorio" : "Reminder"}
                        </dt>
                        <dd className="rounded-lg border border-line bg-surface-sunken px-2 py-0.5 font-bold text-fg tabular-nums">
                          {formatReminder(
                            reminderTimeFor(currentSchedule, day),
                            isEs,
                          )}
                        </dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* 2. Provider orders and instructions */}
        <ProviderOrdersSection />

        {/* 4. Questions for the care team */}
        <CareTeamQuestionsSection />

        {/* ========================================================================= */}
        {/* MODAL 1: EDIT WEEK SETTING                                                */}
        {/* ========================================================================= */}
        <EditWeekModal
          /* Keyed on open: a reopened form starts from the saved schedule
           again, with no effect syncing the draft. */
          key={`edit-week-${isEditWeekModalOpen ? "open" : "closed"}`}
          open={isEditWeekModalOpen}
          onClose={() => setIsEditWeekModalOpen(false)}
          initialDays={selectedDays}
          initialChairTimes={currentSchedule.chairTimes}
          initialReminderLead={currentSchedule.reminderLeadMinutes}
          initialDurations={currentSchedule.durations}
          initialHideBlankDays={hideBlankDays}
          onSave={handleSaveWeekSetting}
        />

        {/* ========================================================================= */}
        {/* MODAL 2: TAKE EXTRA TREATMENT (WITH INTERACTIVE CALENDAR & AUTO SESSION) */}
        {/* ========================================================================= */}
        <ExtraTreatmentModal
          /* Keyed on open: reopening starts from today again, with no effect
           resetting the calendar. */
          key={`extra-tx-${isExtraTxModalOpen ? "open" : "closed"}`}
          open={isExtraTxModalOpen}
          onClose={() => setIsExtraTxModalOpen(false)}
          initialDate={today}
          sessionFor={extraSessionFor}
          formatDayLabel={(date) => formatFullDate(date, isEs)}
          monthNames={isEs ? monthNamesEs : monthNames}
          weekdayLabels={isEs ? daysOfWeekEs : daysOfWeek}
          isMarked={isTreatmentDay}
          onSave={handleSaveExtraTreatment}
        />
      </div>
    </NoticeRailLayout>
  );
}

export default function DialysisManagementPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center text-fg-muted">Loading...</div>}
    >
      <DialysisManagementDashboard />
    </Suspense>
  );
}
