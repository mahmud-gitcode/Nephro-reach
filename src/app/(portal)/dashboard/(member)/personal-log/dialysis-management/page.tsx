"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import {
  Bell,
  Clock,
  Plus,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Undo2,
  Redo2,
  Eraser,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  ALL_WEEKDAYS,
  DEFAULT_DURATION_MINUTES,
  DEFAULT_REMINDER,
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
  shiftScheduledDate,
  startOfToday,
  toDateKey,
  treatmentNumberInMonth,
  type ApplyScope,
  type ExtraTreatment,
  type SchedulePeriod,
  type TreatmentStatus,
} from "@/features/personal-log/dialysis/schedule";
import {
  EditWeekModal,
  type EditWeekResult,
} from "@/features/personal-log/dialysis/EditWeekModal";
import { TreatmentDetailsModal } from "@/features/personal-log/dialysis/TreatmentDetailsModal";
import { TreatmentAnalyticsTab } from "@/features/personal-log/dialysis/TreatmentAnalyticsTab";
import {
  ExtraTreatmentModal,
  type ExtraTreatmentDraft,
} from "@/features/personal-log/dialysis/ExtraTreatmentModal";
import type {
  IntervalRecord,
  TreatmentCardItem,
  TreatmentInterval,
} from "@/features/personal-log/dialysis/treatment.types";
import CareTeamQuestionsSection from "@/features/care-team/CareTeamQuestionsSection";
import DialysisClinicCard from "@/features/travel/DialysisClinicCard";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";

const DEFAULT_INTERVALS: TreatmentInterval[] = [
  {
    id: "int-tx-1",
    name: "Between Treatment 1 to 2",
    label: "Treatment 1 ➔ Treatment 2",
    startDate: "Friday, Jun 19, 2026",
    endDate: "Monday, Jun 22, 2026",
    previousTxPostWeight: 72.7,
    previousTxPostBp: "106/68 mmHg",
    targetDryWeight: 72.0,
  },
  {
    id: "int-tx-2",
    name: "Between Treatment 2 to 3",
    label: "Treatment 2 ➔ Treatment 3",
    startDate: "Monday, Jun 22, 2026",
    endDate: "Wednesday, Jun 24, 2026",
    previousTxPostWeight: 72.4,
    previousTxPostBp: "118/76 mmHg",
    targetDryWeight: 72.0,
  },
  {
    id: "int-tx-3",
    name: "Between Treatment 3 to 4",
    label: "Treatment 3 ➔ Treatment 4",
    startDate: "Wednesday, Jun 24, 2026",
    endDate: "Saturday, Jun 27, 2026",
    previousTxPostWeight: 72.2,
    previousTxPostBp: "124/80 mmHg",
    targetDryWeight: 72.0,
  },
  {
    id: "int-tx-4",
    name: "Between Treatment 4 to 5",
    label: "Treatment 4 ➔ Treatment 5",
    startDate: "Saturday, Jun 27, 2026",
    endDate: "Tuesday, Jun 30, 2026",
    previousTxPostWeight: 72.1,
    previousTxPostBp: "120/78 mmHg",
    targetDryWeight: 72.0,
  },
];

const INITIAL_RECORDS: IntervalRecord[] = [
  {
    id: "rec-1",
    intervalId: "int-tx-2",
    date: "Tuesday, Jun 23, 2026",
    dayLabel: "Tuesday",
    morningWeight: 73.8,
    fluidGainedKg: 1.4,
    homeBp: "122/80 mmHg",
    pulse: 74,
    fluidOz: 28,
    symptoms: ["Mild ankle tightness"],
    notes: "Felt good after walking. Fluid intake stayed within 32 oz limit.",
  },
  {
    id: "rec-extra-3-1",
    intervalId: "int-tx-3",
    date: "Friday, Jun 26, 2026",
    dayLabel: "Friday",
    morningWeight: 74.5,
    fluidGainedKg: 1.9,
    homeBp: "130/86 mmHg",
    pulse: 78,
    fluidOz: 32,
    symptoms: ["Fluid overload symptoms", "Mild ankle edema"],
    notes: "Extra treatment 3.1 administered between treatment 3 and 4.",
    isExtraTreatment: true,
    extraTreatmentNumber: "3.1",
    extraReason: "Fluid Overload",
  },
];

function DialysisManagementDashboard() {
  const { language } = useLanguage();
  const isEs = language === "ES";

  // Section 1 State: Intervals
  const [intervals] = useState<TreatmentInterval[]>(DEFAULT_INTERVALS);
  // Last treatment is the current treatment (Treatment 4 / int-tx-4)
  const [selectedIntervalId] = useState("int-tx-4");
  const selectedInterval =
    intervals.find((i) => i.id === selectedIntervalId) ||
    intervals[intervals.length - 1];

  // Records logged
  const [records, setRecords] = useState<IntervalRecord[]>(INITIAL_RECORDS);

  // Section 2 State: Dialysis Schedule
  // Dated schedule history. The last period is the one currently in force.
  const [schedulePeriods, setSchedulePeriods] = useState<SchedulePeriod[]>([
    {
      fromKey: "0000-01-01",
      days: ["Tuesday", "Thursday", "Saturday"],
      reminders: {
        Tuesday: DEFAULT_REMINDER,
        Thursday: DEFAULT_REMINDER,
        Saturday: DEFAULT_REMINDER,
      },
      durationMinutes: DEFAULT_DURATION_MINUTES,
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
  // 0 is the treatment period around today; the arrows step either way.
  const [treatmentOffset, setTreatmentOffset] = useState(0);
  const [isEditWeekModalOpen, setIsEditWeekModalOpen] = useState(false);
  const [selectedCard] = useState<string>("tx-4");
  const [activeTab, setActiveTab] = useState<
    "treatments" | "analytics" | "questions"
  >("treatments");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Interactive Calendar State (Month & Year) — opens on today

  // ---------------------------------------------------------------------------
  // SCHEDULE ENGINE
  // Treatments are not hardcoded: for any month they are generated from the
  // prescribed weekday list in the Dialysis Schedule card. Treatment N of a month is
  // the Nth prescribed weekday in it, and its interval runs until treatment N+1.
  // ---------------------------------------------------------------------------

  const today = React.useMemo(() => startOfToday(), []);
  const todayTime = today.getTime();

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

  // Every scheduled treatment date inside the viewed month
  const monthSchedule = React.useMemo(() => {
    const daysInViewedMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const dates: Date[] = [];
    for (let day = 1; day <= daysInViewedMonth; day++) {
      const date = new Date(viewYear, viewMonth, day);
      if (isTreatmentDay(date)) dates.push(date);
    }
    return dates;
  }, [isTreatmentDay, viewYear, viewMonth]);

  // Month picker range: one year back through three months ahead
  const monthOptions = React.useMemo(() => {
    const options: {
      key: string;
      year: number;
      month: number;
      isCurrent: boolean;
    }[] = [
      {
        key: `${today.getFullYear()}-${pad2(today.getMonth() + 1)}`,
        year: today.getFullYear(),
        month: today.getMonth(),
        isCurrent: true,
      },
    ];

    for (let offset = 3; offset >= -12; offset--) {
      if (offset === 0) continue; // already pinned at the top
      const date = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      options.push({
        key: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`,
        year: date.getFullYear(),
        month: date.getMonth(),
        isCurrent: false,
      });
    }
    return options;
  }, [today]);

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
    const session = extraSessionFor(date);
    const dateLabel = formatFullDate(date, isEs);

    const newRecord: IntervalRecord = {
      id: `extra-rec-${Date.now()}`,
      intervalId: session.intervalId,
      date: dateLabel,
      dayLabel: dateLabel.split(",")[0],
      isExtraTreatment: true,
      extraTreatmentNumber: session.sessionNumber,
      extraReason: reason,
      notes: notes.trim(),
      morningWeight: 74.2,
      fluidGainedKg: 1.8,
      homeBp: "128/84 mmHg",
    };

    setRecords((prev) => [newRecord, ...prev]);
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

  // Helper to format card dates: omit current year (e.g. 2026), but preserve past years (e.g. 2025, 2024)
  const formatCardDate = (dateStr: string) => {
    if (!dateStr) return "";
    const currentSystemYear = new Date().getFullYear().toString();
    const currentYears = Array.from(new Set([currentSystemYear, "2026"]));

    const yearMatch = dateStr.match(/\b(19\d\d|20\d\d)\b/);
    if (yearMatch) {
      const year = yearMatch[1];
      if (currentYears.includes(year)) {
        return dateStr.replace(new RegExp(`,?\\s*${year}\\b`), "").trim();
      }
      return dateStr;
    }
    return dateStr;
  };

  // Helper to parse day and date (e.g. "Friday, Jun 19, 2026" -> { day: "Friday", date: "Jun 19" })
  const parseDayAndDate = (dateStr: string) => {
    if (!dateStr) return { day: "", date: "" };
    const parts = dateStr.split(",");
    if (parts.length >= 2) {
      const day = parts[0].trim();
      const rest = parts.slice(1).join(",").trim();
      return { day, date: formatCardDate(rest) };
    }
    return { day: "", date: dateStr };
  };

  // Base Treatment Cards: one per prescribed treatment day in the viewed month
  const baseTreatmentCards: TreatmentCardItem[] = monthSchedule.map(
    (start, index) => {
      const end =
        index < monthSchedule.length - 1
          ? monthSchedule[index + 1]
          : nextScheduledDate(start, isTreatmentDay);
      const number = index + 1;
      const startKey = toDateKey(start);

      // Past: the interval is over. Current: today sits inside it. Upcoming: not started.
      const status: TreatmentStatus =
        todayTime >= end.getTime()
          ? "past"
          : todayTime >= start.getTime()
            ? "current"
            : "upcoming";

      return {
        id: `tx-${startKey}`,
        intervalId: `int-${startKey}`,
        orderKey: number,
        title: isEs ? `Tratamiento ${number}` : `Treatment ${number}`,
        subtitle: isEs
          ? `Entre tratamiento ${number} y ${number + 1}`
          : `Between treatment ${number} to ${number + 1}`,
        startDate: formatFullDate(start, isEs),
        endDate: formatFullDate(end, isEs),
        startKey,
        endKey: toDateKey(end),
        status,
        isExtra: false,
      };
    },
  );

  // Extra Treatment Cards: numbered against the base treatment they follow
  // (e.g. an extra inside Treatment 2's interval becomes Treatment 2.1)
  const extraTreatmentCards: TreatmentCardItem[] = (() => {
    const grouped = new Map<string, ExtraTreatment[]>();

    extraTreatments.forEach((extra) => {
      const date = fromDateKey(extra.dateKey);
      if (date.getFullYear() !== viewYear || date.getMonth() !== viewMonth)
        return;
      const intervalStartKey = toDateKey(
        scheduledOnOrBefore(date, isTreatmentDay),
      );
      const bucket = grouped.get(intervalStartKey) || [];
      bucket.push(extra);
      grouped.set(intervalStartKey, bucket);
    });

    const cards: TreatmentCardItem[] = [];

    grouped.forEach((bucket, intervalStartKey) => {
      const base = baseTreatmentCards.find(
        (card) => card.startKey === intervalStartKey,
      );
      const baseNumber = base
        ? base.orderKey
        : treatmentNumberInMonth(fromDateKey(intervalStartKey), isTreatmentDay);

      [...bucket]
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
        .forEach((extra, position) => {
          const sessionNumber = `${baseNumber}.${position + 1}`;
          const date = fromDateKey(extra.dateKey);

          cards.push({
            id: extra.id,
            intervalId: `int-${intervalStartKey}`,
            orderKey: baseNumber + (position + 1) / 10,
            title: isEs
              ? `Tratamiento ${sessionNumber}`
              : `Treatment ${sessionNumber}`,
            subtitle: isEs
              ? `Entre tratamiento ${sessionNumber} y ${baseNumber + 1}`
              : `Between treatment ${sessionNumber} to ${baseNumber + 1}`,
            startDate: formatFullDate(date, isEs),
            endDate: base?.endDate || formatFullDate(date, isEs),
            startKey: extra.dateKey,
            endKey: base?.endKey || extra.dateKey,
            // Extra sessions stay fully editable whenever they were taken
            status: todayTime >= date.getTime() ? "past" : "current",
            isExtra: true,
            extraReason: extra.reason,
            notes: extra.notes,
          });
        });
    });

    return cards;
  })();

  // Combined and sorted cards (Extra treatment is placed in its proper chronological place by orderKey)
  const combinedTreatmentCards = [
    ...baseTreatmentCards,
    ...extraTreatmentCards,
  ].sort((a, b) => a.orderKey - b.orderKey);

  const displayedTreatmentCards =
    sortOrder === "desc"
      ? [...combinedTreatmentCards].reverse()
      : combinedTreatmentCards;

  // The live current treatment for the summary card — always relative to today,
  // independent of whichever month the list below is showing.
  const currentTreatment = (() => {
    if (selectedDays.length === 0) return null;
    const start = shiftScheduledDate(
      scheduledOnOrBefore(today, isTreatmentDay),
      treatmentOffset,
      isTreatmentDay,
    );
    const end = nextScheduledDate(start, isTreatmentDay);
    const number = treatmentNumberInMonth(start, isTreatmentDay);

    return {
      id: `tx-${toDateKey(start)}`,
      name: isEs
        ? `Entre Tratamiento ${number} y ${number + 1}`
        : `Between Treatment ${number} to ${number + 1}`,
      startDate: formatFullDate(start, isEs),
      endDate: formatFullDate(end, isEs),
    };
  })();

  const currentStartInfo = parseDayAndDate(
    currentTreatment?.startDate || selectedInterval.startDate,
  );
  const currentEndInfo = parseDayAndDate(
    currentTreatment?.endDate || selectedInterval.endDate,
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12">
      <DialysisClinicCard />

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2-COLUMN ROW: CURRENT TREATMENT (COL 1) & WEEK SETTING (COL 2)            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* CARD 1: CURRENT RUNNING TREATMENT, DATES & ACTION BUTTONS */}
        <section className="flex flex-col justify-between space-y-5 rounded-card border border-line bg-surface p-6 shadow-control sm:p-7 xl:col-span-4 2xl:col-span-4">
          <div className="space-y-4">
            {/* Currently Running Treatment Display */}
            <div>
              <span className="mb-1 block text-sm font-semibold text-fg-muted">
                {isEs ? "Tratamiento actual" : "Current Treatment"}
              </span>
              <h2 className="text-[22px] font-bold tracking-tight text-fg-secondary sm:text-[26px]">
                {currentTreatment?.name || selectedInterval.name}
              </h2>
            </div>

            {/* Date Section: arrows step through prescribed treatment periods */}
            <div className="my-4 space-y-3.5 rounded-card border border-line-subtle/90 bg-surface-sunken p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setTreatmentOffset((value) => value - 1)}
                  aria-label={
                    isEs ? "Tratamiento anterior" : "Previous treatment"
                  }
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {treatmentOffset === 0 ? (
                  <span className="text-[11px] font-bold tracking-wide text-fg-subtle uppercase">
                    {isEs ? "Actual" : "Current"}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTreatmentOffset(0)}
                    className="cursor-pointer rounded-lg bg-primary-soft px-2.5 py-1 text-[11px] font-bold tracking-wide text-fg-brand uppercase transition-colors hover:bg-brand-100"
                  >
                    {isEs ? "Volver a hoy" : "Back to today"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setTreatmentOffset((value) => value + 1)}
                  aria-label={isEs ? "Tratamiento siguiente" : "Next treatment"}
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              {/* Start Block */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-label-md text-fg-secondary">
                    {isEs ? "Inicio" : "Start"}
                  </span>
                  <div className="h-px flex-1 bg-line" />
                </div>
                <div className="flex items-center justify-between pt-0.5 text-label-lg text-fg-secondary">
                  <span>{currentStartInfo.day}</span>
                  <span className="text-right">{currentStartInfo.date}</span>
                </div>
              </div>

              {/* End Block */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-label-md text-fg-secondary">
                    {isEs ? "Fin" : "End"}
                  </span>
                  <div className="h-px flex-1 bg-line" />
                </div>
                <div className="flex items-center justify-between pt-0.5 text-label-lg text-fg-secondary">
                  <span>{currentEndInfo.day}</span>
                  <span className="text-right">{currentEndInfo.date}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2 Buttons placed below - full width to fill right side */}
          <div className="flex w-full flex-col gap-2.5">
            {/* Button 1: Add New Record (Opens View Details Page) */}
            <Link
              href={`/dashboard/personal-log/dialysis-management/view?treatment=${
                currentTreatment?.id || "tx-4"
              }&title=${encodeURIComponent(currentTreatment?.name || "")}`}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-action px-4 py-2.5 text-center text-xs font-bold text-white shadow-control transition-all hover:bg-action-hover hover:shadow active:scale-[0.98] sm:py-3 sm:text-sm"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>{isEs ? "Agregar Nuevo Registro" : "Add New Record"}</span>
            </Link>

            {/* Button 2: Take Extra Treatment */}
            <button
              type="button"
              onClick={() => setIsExtraTxModalOpen(true)}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-accent-300 bg-accent-soft px-4 py-2.5 text-center text-xs font-bold text-accent-800 shadow-control transition-all hover:bg-accent-100/80 active:scale-[0.98] sm:py-3 sm:text-sm"
            >
              <Clock className="h-4 w-4 stroke-[2.5] text-accent-fg" />
              <span>
                {isEs ? "Tomar Tratamiento Extra" : "Take Extra Treatment"}
              </span>
            </button>
          </div>
        </section>

        {/* CARD 2: DIALYSIS SCHEDULE — day rows on the left, freeform note on the right */}
        <section className="flex flex-col rounded-card border border-line bg-surface p-5 shadow-control sm:p-6 xl:col-span-8 2xl:col-span-8">
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
              {/* One amount shared by every prescribed day */}
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-line bg-surface px-3.5 py-2.5">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-fg-secondary sm:text-sm">
                  <Clock className="h-4 w-4 shrink-0 stroke-[2.4] text-fg-muted" />
                  {isEs ? "Duración de la sesión" : "Session duration"}
                </span>
                <span className="text-sm font-bold text-fg-brand sm:text-base">
                  {formatDuration(currentSchedule.durationMinutes)}
                  <span className="ml-1.5 text-[11px] font-semibold text-fg-subtle">
                    {isEs ? "(todos los días)" : "(all days)"}
                  </span>
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
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface-sunken px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-fg select-none sm:text-xs">
                          <Bell className="h-3.5 w-3.5 shrink-0 stroke-[2.4] text-fg-muted" />
                          {formatReminder(
                            currentSchedule.reminders[day] ?? DEFAULT_REMINDER,
                            isEs,
                          )}
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

      {/* ========================================================================= */}
      {/* TABS: Treatments, Analytics, Care Team Questions & Sort Dropdown          */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full items-center gap-1 rounded-card border border-line/80 bg-surface-sunken/90 p-1 sm:w-fit sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("treatments")}
            className={`flex-1 cursor-pointer rounded-xl px-5 py-2.5 text-center text-xs font-bold transition-all select-none sm:flex-initial sm:text-sm ${
              activeTab === "treatments"
                ? "border border-line/60 bg-surface text-fg shadow-control"
                : "text-fg-muted hover:bg-surface/50 hover:text-fg"
            }`}
          >
            {isEs ? "Tratamientos" : "Treatments"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`flex-1 cursor-pointer rounded-xl px-5 py-2.5 text-center text-xs font-bold transition-all select-none sm:flex-initial sm:text-sm ${
              activeTab === "analytics"
                ? "border border-line/60 bg-surface text-fg shadow-control"
                : "text-fg-muted hover:bg-surface/50 hover:text-fg"
            }`}
          >
            {isEs ? "Analíticas" : "Analytics"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("questions")}
            className={`flex-1 cursor-pointer rounded-xl px-5 py-2.5 text-center text-xs font-bold transition-all select-none sm:flex-initial sm:text-sm ${
              activeTab === "questions"
                ? "border border-line/60 bg-surface text-fg shadow-control"
                : "text-fg-muted hover:bg-surface/50 hover:text-fg"
            }`}
          >
            {isEs ? "Preguntas del Equipo" : "Care Team Questions"}
          </button>
        </div>

        {/* Right Side: Month Picker + Sort Dropdown */}
        {activeTab === "treatments" && (
          <div className="flex items-center gap-2">
            {/* Month Picker — treatments are regenerated for the chosen month */}
            <div className="relative">
              <select
                value={viewMonthKey}
                onChange={(e) => setViewMonthKey(e.target.value)}
                aria-label={isEs ? "Seleccionar mes" : "Select month"}
                className="cursor-pointer appearance-none rounded-xl border border-line bg-surface py-2.5 pr-8 pl-9 text-xs font-bold text-fg-secondary shadow-control transition-all hover:border-line-strong focus:ring-2 focus:ring-[var(--color-brand-600)]/20 focus:outline-none sm:text-sm"
              >
                {monthOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.isCurrent
                      ? isEs
                        ? "Este Mes"
                        : "This Month"
                      : `${(isEs ? monthNamesEs : monthNames)[option.month]} ${option.year}`}
                  </option>
                ))}
              </select>
              <CalendarDays className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-fg-muted" />
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            </div>

            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                aria-label="Sort order"
                className="cursor-pointer appearance-none rounded-xl border border-line bg-surface px-4 py-2.5 pr-8 text-xs font-bold text-fg-secondary shadow-control transition-all hover:border-line-strong focus:ring-2 focus:ring-[var(--color-brand-600)]/20 focus:outline-none sm:text-sm"
              >
                <option value="asc">{isEs ? "Ascendente" : "Ascending"}</option>
                <option value="desc">
                  {isEs ? "Descendente" : "Descending"}
                </option>
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Treatments */}
      {activeTab === "treatments" && (
        <section className="animate-in fade-in space-y-3 duration-200">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {displayedTreatmentCards.map((card) => {
              // Lifecycle comes from the schedule: only the interval containing
              // today is current, and anything after it cannot be logged yet.
              const isSelected = card.status === "current";
              const isUpcoming = card.status === "upcoming";
              const isExtra = !!card.isExtra;
              const startInfo = parseDayAndDate(card.startDate);
              const endInfo = parseDayAndDate(card.endDate);

              if (isExtra) {
                return (
                  <div
                    key={card.id}
                    className="group flex min-h-[320px] w-full flex-col justify-between rounded-panel border border-accent-soft-line bg-accent-soft/20 p-6 shadow-control transition-all duration-200 select-none hover:border-accent-400 hover:shadow-md sm:min-h-[340px] sm:p-7"
                  >
                    {/* Content: Text 1 & Text 2 (Normal layout, no tag, pure purple color) */}
                    <div className="space-y-1.5">
                      <h3 className="text-xl font-bold tracking-tight text-accent-900 transition-colors group-hover:text-accent-fg sm:text-2xl">
                        {isEs
                          ? card.title.replace("Treatment", "Tratamiento")
                          : card.title}
                      </h3>
                      <p className="text-sm leading-snug font-semibold text-accent-fg sm:text-base">
                        {isEs
                          ? card.subtitle
                              .replace("Between", "Entre")
                              .replace("treatment", "tratamiento")
                              .replace("to", "y")
                          : card.subtitle}
                      </p>
                    </div>

                    {/* Date & Reason Section: Single Date when extra treatment was taken + Reason underneath */}
                    <div className="my-5 space-y-3.5 rounded-card border border-accent-soft-line bg-accent-soft/60 p-3.5 sm:p-4">
                      {/* Treatment Date Block */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-accent-800 sm:text-[13px]">
                            {isEs ? "Fecha" : "Date"}
                          </span>
                          <div className="h-px flex-1 bg-accent-200" />
                        </div>
                        <div className="flex items-center justify-between pt-0.5 text-sm font-bold text-accent-950 sm:text-base">
                          <span>{startInfo.day}</span>
                          <span className="text-right">{startInfo.date}</span>
                        </div>
                      </div>

                      {/* Reason Block */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-accent-800 sm:text-[13px]">
                            {isEs ? "Motivo" : "Reason"}
                          </span>
                          <div className="h-px flex-1 bg-accent-200" />
                        </div>
                        <div className="pt-0.5">
                          <span className="inline-flex items-center rounded-lg border border-accent-soft-line/80 bg-surface px-2.5 py-1 text-xs leading-snug font-bold text-accent-900 shadow-control sm:text-[13px]">
                            {card.extraReason ||
                              (isEs
                                ? "Sobrecarga de Líquidos"
                                : "Fluid Overload")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* View Details Button Inside Extra Card */}
                    <div className="w-full pt-1">
                      <Link
                        href={
                          card.isExtra
                            ? `/dashboard/personal-log/dialysis-management/view?treatment=${encodeURIComponent(
                                card.id,
                              )}&title=${encodeURIComponent(card.title)}&reason=${encodeURIComponent(
                                card.extraReason || "",
                              )}&notes=${encodeURIComponent(card.notes || "")}&isExtra=true`
                            : `/dashboard/personal-log/dialysis-management/view?treatment=${card.id}`
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-accent-solid px-4 py-2.5 text-center text-xs font-bold text-white shadow-control transition-all hover:bg-accent-700 hover:shadow active:scale-[0.98] sm:py-3 sm:text-sm"
                      >
                        <span>{isEs ? "Ver Detalles" : "View Details"}</span>
                      </Link>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={card.id}
                  aria-disabled={isUpcoming}
                  title={
                    isUpcoming
                      ? isEs
                        ? "Tratamiento próximo — aún no disponible"
                        : "Upcoming treatment — not available yet"
                      : undefined
                  }
                  className={`group flex min-h-[320px] w-full flex-col justify-between rounded-panel border p-6 shadow-control transition-all duration-200 select-none sm:min-h-[340px] sm:p-7 ${
                    isUpcoming
                      ? "pointer-events-none border-line bg-surface opacity-20"
                      : isSelected
                        ? "border-[var(--color-brand-600)] bg-primary-soft/20 ring-2 ring-[var(--color-brand-600)]/20 hover:shadow-md"
                        : "border-line bg-surface hover:border-primary-soft-line hover:shadow-md"
                  }`}
                >
                  {/* Content: Text 1 & Text 2 (With Current badge for current treatment) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xl font-bold tracking-tight text-fg transition-colors group-hover:text-fg-brand sm:text-2xl">
                        {card.title}
                      </h3>
                      {isSelected ? (
                        <span className="inline-flex items-center rounded-full bg-action px-2.5 py-0.5 text-xs font-bold text-white shadow-control">
                          {isEs ? "Actual" : "Current"}
                        </span>
                      ) : isUpcoming ? (
                        <span className="inline-flex items-center rounded-full bg-line px-2.5 py-0.5 text-xs font-bold text-fg-secondary">
                          {isEs ? "Próximo" : "Upcoming"}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm leading-snug font-semibold text-fg-muted sm:text-base">
                      {card.subtitle}
                    </p>
                  </div>

                  {/* Date Section: Start and End blocks inside an inner gray card */}
                  {/* 20px gap from top title & subtitle and 20px gap before buttons */}
                  <div className="my-5 space-y-3.5 rounded-card border border-line-subtle/90 bg-surface-sunken p-3.5 sm:p-4">
                    {/* Start Block */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-label-md text-fg-secondary">
                          {isEs ? "Inicio" : "Start"}
                        </span>
                        <div className="h-px flex-1 bg-line" />
                      </div>
                      <div className="flex items-center justify-between pt-0.5 text-label-lg text-fg-secondary">
                        <span>{startInfo.day}</span>
                        <span className="text-right">{startInfo.date}</span>
                      </div>
                    </div>

                    {/* End Block */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-label-md text-fg-secondary">
                          {isEs ? "Fin" : "End"}
                        </span>
                        <div className="h-px flex-1 bg-line" />
                      </div>
                      <div className="flex items-center justify-between pt-0.5 text-label-lg text-fg-secondary">
                        <span>{endInfo.day}</span>
                        <span className="text-right">{endInfo.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* View Details Button Inside Treatment Card */}
                  <div className="w-full pt-1">
                    {isUpcoming ? (
                      <button
                        type="button"
                        disabled
                        tabIndex={-1}
                        className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-control border border-line bg-surface-sunken px-inset-md py-2.5 text-center text-label-md text-fg-subtle sm:py-inset-sm"
                      >
                        <span>{isEs ? "Próximo" : "Upcoming"}</span>
                      </button>
                    ) : (
                      <Link
                        href={`/dashboard/personal-log/dialysis-management/view?treatment=${
                          card.id
                        }&title=${encodeURIComponent(card.title)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-action px-4 py-2.5 text-center text-xs font-bold text-white shadow-control transition-all hover:bg-action-hover hover:shadow active:scale-[0.98] sm:py-3 sm:text-sm"
                      >
                        <span>{isEs ? "Ver Detalles" : "View Details"}</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {displayedTreatmentCards.length === 0 && (
            <div className="rounded-panel border border-dashed border-line bg-surface p-10 text-center">
              <p className="text-sm font-bold text-fg-secondary">
                {isEs
                  ? "No hay tratamientos programados para este mes."
                  : "No treatments scheduled for this month."}
              </p>
              <p className="mt-1 text-xs font-medium text-fg-muted">
                {isEs
                  ? "Usa Editar Semana para elegir tus días de diálisis."
                  : "Use Edit Week to choose your prescribed dialysis days."}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Analytics (Week-by-week aggregated analytics) */}
      {activeTab === "analytics" && <TreatmentAnalyticsTab />}

      {/* Tab 3: Care Team Questions (title hidden on main page) */}
      {activeTab === "questions" && (
        <section className="animate-in fade-in space-y-4 duration-200">
          <CareTeamQuestionsSection hideTitle />
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT WEEK SETTING                                                */}
      {/* ========================================================================= */}
      <EditWeekModal
        /* Keyed on open: a reopened form starts from the saved schedule
           again, with no effect syncing the draft. */
        key={isEditWeekModalOpen ? "open" : "closed"}
        open={isEditWeekModalOpen}
        onClose={() => setIsEditWeekModalOpen(false)}
        initialDays={selectedDays}
        initialReminders={currentSchedule.reminders}
        initialDurationMinutes={currentSchedule.durationMinutes}
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
        key={isExtraTxModalOpen ? "open" : "closed"}
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

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW DETAILS / HISTORY                                           */}
      {/* ========================================================================= */}
      <TreatmentDetailsModal
        open={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        interval={selectedInterval}
        records={records}
        viewHref={`/dashboard/personal-log/dialysis-management/view?treatment=${selectedCard}`}
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
