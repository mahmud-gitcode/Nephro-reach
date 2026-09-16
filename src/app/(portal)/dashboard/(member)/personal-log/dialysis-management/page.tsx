"use client";

import React, { useState, Suspense } from "react";
import {
  Bell,
  Clock,
  Settings,
  CalendarDays,
  Undo2,
  Redo2,
  Eraser,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  ALL_WEEKDAYS,
  DEFAULT_DURATION_MINUTES,
  DEFAULT_CHAIR_TIME,
  DEFAULT_REMINDER_LEAD_MINUTES,
  durationFor,
  WEEKDAY_ES,
  formatDuration,
  formatFullDate,
  formatReminder,
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

function DialysisManagementDashboard() {
  const { language } = useLanguage();
  const isEs = language === "ES";

  // Section 2 State: Dialysis Schedule
  // Dated schedule history. The last period is the one currently in force.
  const [schedulePeriods, setSchedulePeriods] = useState<SchedulePeriod[]>([
    {
      fromKey: "0000-01-01",
      days: ["Tuesday", "Thursday", "Saturday"],
      chairTimes: {
        Tuesday: DEFAULT_CHAIR_TIME,
        Thursday: DEFAULT_CHAIR_TIME,
        Saturday: DEFAULT_CHAIR_TIME,
      },
      reminderLeadMinutes: DEFAULT_REMINDER_LEAD_MINUTES,
      durations: {
        Tuesday: DEFAULT_DURATION_MINUTES,
        Thursday: DEFAULT_DURATION_MINUTES,
        Saturday: DEFAULT_DURATION_MINUTES,
      },
    },
  ]);
  const currentSchedule = schedulePeriods[schedulePeriods.length - 1];
  const selectedDays = currentSchedule.days;
  // Display option: drop the empty placeholder tiles for non-treatment days.
  const [hideBlankDays, setHideBlankDays] = useState(false);
  const visibleWeekdays = hideBlankDays
    ? ALL_WEEKDAYS.filter((day) => selectedDays.includes(day))
    : ALL_WEEKDAYS;
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
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12">
      <DialysisClinicCard />

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2-COLUMN ROW: CURRENT TREATMENT (COL 1) & WEEK SETTING (COL 2)            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* CARD 2: DIALYSIS SCHEDULE — day rows on the left, freeform note on the right */}
        <section className="flex flex-col rounded-card border border-line bg-surface p-5 shadow-control sm:p-6 xl:col-span-12">
          {/* Card head: title on the left, Edit Week on the right */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="h-[22px] w-[22px] shrink-0 stroke-[2.2] text-fg-secondary sm:h-6 sm:w-6" />
              <h2 className="text-[22px] font-bold tracking-tight text-fg-secondary sm:text-[26px]">
                {isEs ? "Horario de Diálisis" : "Dialysis Schedule"}
              </h2>
            </div>

            <button
              type="button"
              onClick={handleOpenEditWeek}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-bold text-fg-secondary shadow-control transition-colors hover:border-line-strong hover:bg-surface-sunken sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <Settings className="h-4 w-4 text-fg-muted" />
              <span>{isEs ? "Editar Semana" : "Edit Week"}</span>
            </button>
          </div>

          {/* Schedule down the left, notes down the right */}
          <div className="mt-5 grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(236px,0.72fr)]">
            {/* Session duration on top, then one row per day */}
            <div className="space-y-3 rounded-xl border border-line-subtle bg-surface-sunken p-3.5 sm:p-4">
              {/* The reminder, said once. It is the same offset for every
                day, unlike the chair time and the length, which are not. */}
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-line bg-surface px-3.5 py-2.5">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-fg-secondary sm:text-sm">
                  <Bell className="h-4 w-4 shrink-0 stroke-[2.4] text-fg-muted" />
                  {isEs ? "Recordatorio" : "Reminder"}
                </span>
                <span className="text-sm font-bold text-fg-brand sm:text-base">
                  {currentSchedule.reminderLeadMinutes === 0
                    ? isEs
                      ? "A la hora del sillón"
                      : "At chair time"
                    : isEs
                      ? `${currentSchedule.reminderLeadMinutes} min antes`
                      : `${currentSchedule.reminderLeadMinutes} min before`}
                </span>
              </div>

              {/* Two columns read top-to-bottom: Sunday..Wednesday down the
                  first, the rest down the second. Blank days drop out entirely
                  when "Remove blank days" is on. */}
              <div className="-mb-1.5 columns-1 gap-x-1.5 sm:columns-2">
                {visibleWeekdays.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  const fullDayName = isEs ? WEEKDAY_ES[day] : day;

                  return (
                    <div
                      key={day}
                      className={`mb-1.5 flex min-w-0 break-inside-avoid items-center justify-between gap-2 rounded-xl px-2.5 py-2 transition-all ${
                        isSelected
                          ? "border border-line bg-gradient-to-r from-primary-soft via-surface to-surface shadow-card hover:border-line-strong hover:shadow-md"
                          : "border border-dashed border-line/70 bg-surface/40"
                      }`}
                    >
                      <span
                        className={`min-w-0 truncate text-xs font-bold tracking-tight select-none sm:text-sm ${
                          isSelected ? "text-fg-brand" : "text-fg-subtle"
                        }`}
                      >
                        {fullDayName}
                      </span>

                      {isSelected ? (
                        /* Chair time, then how long they are in it. Two
                           clock times stacked here read as two appointments,
                           which is why the reminder is stated once above
                           rather than repeated on every day. */
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface-sunken px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-fg select-none sm:text-xs">
                          <Clock className="h-3.5 w-3.5 shrink-0 stroke-[2.4] text-fg-muted" />
                          {formatReminder(
                            currentSchedule.chairTimes[day] ??
                              DEFAULT_CHAIR_TIME,
                            isEs,
                          )}
                          <span className="font-semibold text-fg-muted">
                            ·{" "}
                            {formatDuration(durationFor(currentSchedule, day))}
                          </span>
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs font-bold text-fg-subtle select-none">
                          —
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Freeform note, alongside the schedule */}
            <div className="flex h-full flex-col justify-between gap-2 rounded-card border border-line/80 bg-surface-sunken p-3 transition-all focus-within:border-primary-soft-line focus-within:bg-surface focus-within:ring-2 focus-within:ring-ring/60 sm:p-3.5">
              {/* Note head bar: label on the left, Undo / Redo / Clean on the right */}
              <div className="flex items-center justify-between gap-2 border-b border-line/70 pb-1.5">
                <span className="text-xs font-bold text-fg-secondary">
                  {isEs ? "Notas" : "Notes"}
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
                className="min-h-[120px] w-full flex-1 resize-none bg-transparent text-xs font-medium text-fg-secondary outline-none placeholder:text-fg-subtle sm:text-sm"
              />
            </div>
          </div>
        </section>
      </div>

      {/* 2. Provider orders and instructions */}
      <ProviderOrdersSection />

      {/* 4. Questions for the care team */}
      <section className="animate-in fade-in space-y-4 duration-200">
        <CareTeamQuestionsSection />
      </section>

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
        effectiveDateFor={scopeEffectiveDate}
        monthLabel={`${(isEs ? monthNamesEs : monthNames)[viewMonth]} ${viewYear}`}
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
  );
}

export default function DialysisManagementPage() {
  return (
    <>
      <PersonalLogDisclaimer />

      <Suspense
        fallback={
          <div className="p-8 text-center text-fg-muted">Loading...</div>
        }
      >
        <DialysisManagementDashboard />
      </Suspense>
    </>
  );
}
