"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  Clock,
  Plus,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Scale,
  Activity,
  HeartPulse,
  AlertCircle,
  FilePlus2,
  X,
  Sparkles,
  CalendarDays,
  Trash2,
  Edit2,
  FileText,
  Undo2,
  Redo2,
  Eraser,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import RecoveryPatternSection from "@/features/personal-log/RecoveryPatternSection";
import CareTeamQuestionsSection from "@/features/care-team/CareTeamQuestionsSection";
import DialysisClinicCard from "@/features/travel/DialysisClinicCard";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import { Button, buttonStyles, Modal } from "@/components/ui";

interface TreatmentInterval {
  id: string;
  name: string; // e.g. "Between Treatment 2"
  label: string; // e.g. "Treatment 2 ➔ Treatment 3"
  startDate: string;
  endDate: string;
  previousTxPostWeight: number;
  previousTxPostBp: string;
  targetDryWeight: number;
}

interface IntervalRecord {
  id: string;
  intervalId: string;
  date: string;
  dayLabel: string;
  morningWeight?: number;
  fluidGainedKg?: number;
  homeBp?: string;
  pulse?: number;
  fluidOz?: number;
  symptoms?: string[];
  notes?: string;
  isExtraTreatment?: boolean;
  extraTreatmentNumber?: string; // e.g. "2.1"
  extraReason?: string;
}

interface TreatmentCardItem {
  id: string;
  intervalId: string;
  orderKey: number;
  title: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  startKey: string; // yyyy-mm-dd
  endKey: string;
  status: TreatmentStatus;
  isExtra?: boolean;
  extraReason?: string;
  notes?: string;
}

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

const ALL_WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const WEEKDAY_ES: Record<string, string> = {
  Sunday: "Domingo",
  Monday: "Lunes",
  Tuesday: "Martes",
  Wednesday: "Miércoles",
  Thursday: "Jueves",
  Friday: "Viernes",
  Saturday: "Sábado",
};

const MONTH_SHORT_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTH_SHORT_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

type TreatmentStatus = "past" | "current" | "upcoming";

/** Unscheduled extra session. Its card is derived from the weekly schedule. */
interface ExtraTreatment {
  id: string;
  dateKey: string; // yyyy-mm-dd
  reason: string;
  notes?: string;
}

function pad2(value: number) {
  return `${value}`.padStart(2, "0");
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function fromDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function addDays(d: Date, amount: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + amount);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** "Friday, Jun 19, 2026" — shape kept so parseDayAndDate keeps working. */
function formatFullDate(d: Date, isEs: boolean) {
  const weekday = ALL_WEEKDAYS[d.getDay()];
  const dayLabel = isEs ? WEEKDAY_ES[weekday] : weekday;
  const month = isEs ? MONTH_SHORT_ES[d.getMonth()] : MONTH_SHORT_EN[d.getMonth()];
  return `${dayLabel}, ${month} ${d.getDate()}, ${d.getFullYear()}`;
}

type IsTreatmentDay = (date: Date) => boolean;

/** How far back a saved week setting reaches. */
type ApplyScope = "today" | "currentTreatment" | "month";

const SCOPE_OPTIONS: {
  id: ApplyScope;
  labelEn: string;
  labelEs: string;
  descEn: string;
  descEs: string;
}[] = [
  {
    id: "currentTreatment",
    labelEn: "From Current Treatment",
    labelEs: "Desde el Tratamiento Actual",
    descEn: "Changes the treatment you are in now and all the ones after it.",
    descEs: "Cambia el tratamiento en curso y todos los siguientes.",
  },
  {
    id: "today",
    labelEn: "From Today",
    labelEs: "Desde Hoy",
    descEn: "Changes treatments from today onward. Today's treatment keeps its day.",
    descEs: "Cambia los tratamientos desde hoy. El de hoy mantiene su día.",
  },
  {
    id: "month",
    labelEn: "Full Month",
    labelEs: "Mes Completo",
    descEn: "Changes every treatment in this month, starting from the 1st.",
    descEs: "Cambia todos los tratamientos de este mes, desde el día 1.",
  },
];

/**
 * A weekly schedule and the date it takes effect from. Saving the schedule
 * appends a new period instead of rewriting history, so treatments before the
 * effective date keep the schedule they were actually run on.
 */
interface SchedulePeriod {
  fromKey: string; // inclusive, yyyy-mm-dd
  days: string[];
  /** Reminder clock time per prescribed weekday, as "HH:MM" on a 24h clock. */
  reminders: Record<string, string>;
  /** Session length in minutes. One amount shared by every prescribed day. */
  durationMinutes: number;
}

/** Reminder given to a day that was just added to the schedule. */
const DEFAULT_REMINDER = "07:30";
/** 4h, the usual in-centre hemodialysis run. */
const DEFAULT_DURATION_MINUTES = 240;

/** "07:30" -> "7:30 AM" in English; Spanish stays on the 24h clock. */
function formatReminder(value: string, isEs: boolean) {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
  if (isEs) return `${pad2(hour)}:${pad2(minute)}`;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 === 0 ? 12 : hour % 12}:${pad2(minute)} ${suffix}`;
}

/** 240 -> "4h 00m" */
function formatDuration(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${pad2(minutes % 60)}m`;
}

/** The prescribed days in force on a given date. */
function daysForDate(periods: SchedulePeriod[], date: Date) {
  const key = toDateKey(date);
  let active = periods[0]?.days ?? [];
  for (const period of periods) {
    if (period.fromKey > key) break;
    active = period.days;
  }
  return active;
}

function makeIsTreatmentDay(periods: SchedulePeriod[]): IsTreatmentDay {
  return (date: Date) =>
    daysForDate(periods, date).includes(ALL_WEEKDAYS[date.getDay()]);
}

/** First prescribed treatment day strictly after `from`. */
function nextScheduledDate(from: Date, isTreatmentDay: IsTreatmentDay) {
  for (let i = 1; i <= 62; i++) {
    const candidate = addDays(from, i);
    if (isTreatmentDay(candidate)) return candidate;
  }
  return addDays(from, 7);
}

/** Most recent prescribed treatment day on or before `from`. */
function scheduledOnOrBefore(from: Date, isTreatmentDay: IsTreatmentDay) {
  for (let i = 0; i <= 62; i++) {
    const candidate = addDays(from, -i);
    if (isTreatmentDay(candidate)) return candidate;
  }
  return from;
}

/** Walks `offset` prescribed treatment days from `base`. */
function shiftScheduledDate(
  base: Date,
  offset: number,
  isTreatmentDay: IsTreatmentDay,
) {
  let cursor = base;
  for (let step = 0; step < Math.abs(offset); step++) {
    cursor =
      offset > 0
        ? nextScheduledDate(cursor, isTreatmentDay)
        : scheduledOnOrBefore(addDays(cursor, -1), isTreatmentDay);
  }
  return cursor;
}

/** Position of a treatment date within its own month (1-based). */
function treatmentNumberInMonth(d: Date, isTreatmentDay: IsTreatmentDay) {
  let count = 0;
  for (let day = 1; day <= d.getDate(); day++) {
    const candidate = new Date(d.getFullYear(), d.getMonth(), day);
    if (isTreatmentDay(candidate)) count++;
  }
  return count || 1;
}

function DialysisManagementDashboard() {
  const router = useRouter();
  const { language } = useLanguage();
  const isEs = language === "ES";

  // Section 1 State: Intervals
  const [intervals, setIntervals] = useState<TreatmentInterval[]>(DEFAULT_INTERVALS);
  // Last treatment is the current treatment (Treatment 4 / int-tx-4)
  const [selectedIntervalId] = useState("int-tx-4");
  const selectedInterval =
    intervals.find((i) => i.id === selectedIntervalId) || intervals[intervals.length - 1];

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
  const [applyScope, setApplyScope] = useState<ApplyScope>("currentTreatment");
  // 0 is the treatment period around today; the arrows step either way.
  const [treatmentOffset, setTreatmentOffset] = useState(0);
  const [isEditWeekModalOpen, setIsEditWeekModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string>("tx-4");
  const [activeTab, setActiveTab] = useState<"treatments" | "analytics" | "questions">("treatments");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Extra Treatments (unscheduled sessions). Their cards are derived from the
  // weekly schedule, so they stay correctly numbered if the week setting changes.
  const [extraTreatments, setExtraTreatments] = useState<ExtraTreatment[]>([
    {
      id: "tx-extra-3-1",
      dateKey: "2026-06-26",
      reason: "Fluid Overload",
      notes: "Unscheduled extra session between treatment 3 and 4 to remove excess interdialytic fluid (+2.4 kg).",
    },
  ]);

  // Temp state for editing week
  const [tempDays, setTempDays] = useState<string[]>([
    "Tuesday",
    "Thursday",
    "Saturday",
  ]);
  const [tempReminders, setTempReminders] = useState<Record<string, string>>({
    Tuesday: DEFAULT_REMINDER,
    Thursday: DEFAULT_REMINDER,
    Saturday: DEFAULT_REMINDER,
  });
  const [tempDurationHours, setTempDurationHours] = useState("4");
  const [tempDurationMins, setTempDurationMins] = useState("00");
  const [tempHideBlankDays, setTempHideBlankDays] = useState(false);

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
  const [extraTxDate, setExtraTxDate] = useState(() =>
    formatFullDate(startOfToday(), language === "ES"),
  );
  const [extraTxReason, setExtraTxReason] = useState("Fluid Overload");
  const [extraTxNotes, setExtraTxNotes] = useState("");
  // Details / History Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Interactive Calendar State (Month & Year) — opens on today
  const [calYear, setCalYear] = useState(() => startOfToday().getFullYear());
  const [calMonth, setCalMonth] = useState(() => startOfToday().getMonth());
  const [selectedDay, setSelectedDay] = useState(() => startOfToday().getDate());

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

  // Detected interval for the currently clicked date:
  const activeDetectedInterval = detectIntervalForDate(calYear, calMonth, selectedDay);

  // Count existing extra treatments in this detected interval
  const existingExtraCount = extraTreatments.filter(
    (extra) =>
      toDateKey(scheduledOnOrBefore(fromDateKey(extra.dateKey), isTreatmentDay)) ===
      activeDetectedInterval.startKey,
  ).length;

  // Auto-calculated session number based on clicked date:
  // e.g. first extra inside Treatment 2's interval -> 2.1, the next -> 2.2
  const autoSessionNumber = `${activeDetectedInterval.baseNumber}.${existingExtraCount + 1}`;

  // Month and Weekday labels for Calendar
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthNamesEs = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const daysOfWeekEs = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    setExtraTxDate(formatFullDate(new Date(calYear, calMonth, day), isEs));
  };

  const handleOpenEditWeek = () => {
    setTempDays([...selectedDays]);
    setTempReminders({ ...currentSchedule.reminders });
    setTempDurationHours(String(Math.floor(currentSchedule.durationMinutes / 60)));
    setTempDurationMins(pad2(currentSchedule.durationMinutes % 60));
    setTempHideBlankDays(hideBlankDays);
    setApplyScope("currentTreatment");
    setIsEditWeekModalOpen(true);
  };

  const toggleDaySelection = (day: string) => {
    if (tempDays.includes(day)) {
      if (tempDays.length > 1) {
        setTempDays(tempDays.filter((d) => d !== day));
      }
    } else {
      setTempDays([...tempDays, day]);
      setTempReminders((prev) =>
        prev[day] ? prev : { ...prev, [day]: DEFAULT_REMINDER },
      );
    }
  };

  // Date the new schedule starts applying from, per the chosen scope
  const scopeEffectiveDate = (scope: ApplyScope) => {
    if (scope === "month") return new Date(viewYear, viewMonth, 1);
    if (scope === "currentTreatment") return scheduledOnOrBefore(today, isTreatmentDay);
    return today;
  };

  const handleSaveWeekSetting = (e: React.FormEvent) => {
    e.preventDefault();
    const sorted = [...tempDays].sort(
      (a, b) => ALL_WEEKDAYS.indexOf(a) - ALL_WEEKDAYS.indexOf(b)
    );
    const fromKey = toDateKey(scopeEffectiveDate(applyScope));

    // A reminder for every prescribed day, and one session length for all of them.
    const reminders: Record<string, string> = {};
    sorted.forEach((day) => {
      reminders[day] = tempReminders[day] || DEFAULT_REMINDER;
    });
    const hours = Math.min(12, Math.max(0, Number(tempDurationHours) || 0));
    const durationMinutes = Math.max(
      15,
      hours * 60 + (Number(tempDurationMins) || 0),
    );

    setSchedulePeriods((prev) => {
      // Drop any period starting on or after the new effective date, then append.
      // Everything before it keeps the schedule it was actually run on.
      const kept = prev.filter((period) => period.fromKey < fromKey);
      const base = kept.length > 0 ? kept : [prev[0]];
      return [...base, { fromKey, days: sorted, reminders, durationMinutes }];
    });

    setHideBlankDays(tempHideBlankDays);
    setIsEditWeekModalOpen(false);
  };

  // Extra treatment submission
  const handleSaveExtraTreatment = (e: React.FormEvent) => {
    e.preventDefault();

    const pickedDate = new Date(calYear, calMonth, selectedDay);
    const dateKey = toDateKey(pickedDate);

    const newRecord: IntervalRecord = {
      id: `extra-rec-${Date.now()}`,
      intervalId: activeDetectedInterval.intervalId,
      date: extraTxDate,
      dayLabel: extraTxDate.split(",")[0],
      isExtraTreatment: true,
      extraTreatmentNumber: autoSessionNumber, // Auto assigned e.g. 1.1, 2.1, 2.2
      extraReason: extraTxReason,
      notes: extraTxNotes.trim(),
      morningWeight: 74.2,
      fluidGainedKg: 1.8,
      homeBp: "128/84 mmHg",
    };

    setRecords([newRecord, ...records]);
    setExtraTreatments((prev) => [
      ...prev,
      {
        id: `tx-extra-${dateKey}-${Date.now()}`,
        dateKey,
        reason: extraTxReason,
        notes: extraTxNotes.trim(),
      },
    ]);

    // Jump the cards list to the month the extra session belongs to
    setViewMonthKey(`${pickedDate.getFullYear()}-${pad2(pickedDate.getMonth() + 1)}`);
    setIsExtraTxModalOpen(false);
    setExtraTxNotes("");
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
  const baseTreatmentCards: TreatmentCardItem[] = monthSchedule.map((start, index) => {
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
  });

  // Extra Treatment Cards: numbered against the base treatment they follow
  // (e.g. an extra inside Treatment 2's interval becomes Treatment 2.1)
  const extraTreatmentCards: TreatmentCardItem[] = (() => {
    const grouped = new Map<string, ExtraTreatment[]>();

    extraTreatments.forEach((extra) => {
      const date = fromDateKey(extra.dateKey);
      if (date.getFullYear() !== viewYear || date.getMonth() !== viewMonth) return;
      const intervalStartKey = toDateKey(scheduledOnOrBefore(date, isTreatmentDay));
      const bucket = grouped.get(intervalStartKey) || [];
      bucket.push(extra);
      grouped.set(intervalStartKey, bucket);
    });

    const cards: TreatmentCardItem[] = [];

    grouped.forEach((bucket, intervalStartKey) => {
      const base = baseTreatmentCards.find((card) => card.startKey === intervalStartKey);
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
            title: isEs ? `Tratamiento ${sessionNumber}` : `Treatment ${sessionNumber}`,
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
  const combinedTreatmentCards = [...baseTreatmentCards, ...extraTreatmentCards].sort(
    (a, b) => a.orderKey - b.orderKey
  );

  const displayedTreatmentCards =
    sortOrder === "desc" ? [...combinedTreatmentCards].reverse() : combinedTreatmentCards;

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
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      <DialysisClinicCard />

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2-COLUMN ROW: CURRENT TREATMENT (COL 1) & WEEK SETTING (COL 2)            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* CARD 1: CURRENT RUNNING TREATMENT, DATES & ACTION BUTTONS */}
        <section className="xl:col-span-4 2xl:col-span-4 rounded-card border border-line bg-surface p-6 sm:p-7 shadow-control flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Currently Running Treatment Display */}
            <div>
              <span className="block text-sm font-semibold text-fg-muted mb-1">
                {isEs ? "Tratamiento actual" : "Current Treatment"}
              </span>
              <h2 className="text-[22px] sm:text-[26px] font-bold text-fg-secondary tracking-tight">
                {currentTreatment?.name || selectedInterval.name}
              </h2>
            </div>

            {/* Date Section: arrows step through prescribed treatment periods */}
            <div className="my-4 rounded-card bg-surface-sunken border border-line-subtle/90 p-3.5 sm:p-4 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setTreatmentOffset((value) => value - 1)}
                  aria-label={isEs ? "Tratamiento anterior" : "Previous treatment"}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {treatmentOffset === 0 ? (
                  <span className="text-[11px] font-bold uppercase tracking-wide text-fg-subtle">
                    {isEs ? "Actual" : "Current"}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTreatmentOffset(0)}
                    className="rounded-lg bg-primary-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-fg-brand transition-colors hover:bg-brand-100 cursor-pointer"
                  >
                    {isEs ? "Volver a hoy" : "Back to today"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setTreatmentOffset((value) => value + 1)}
                  aria-label={isEs ? "Tratamiento siguiente" : "Next treatment"}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg cursor-pointer"
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
          <div className="flex flex-col gap-2.5 w-full">
            {/* Button 1: Add New Record (Opens View Details Page) */}
            <Link
              href={`/dashboard/personal-log/dialysis-management/view?treatment=${
                currentTreatment?.id || "tx-4"
              }&title=${encodeURIComponent(currentTreatment?.name || "")}`}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-action hover:bg-action-hover py-2.5 sm:py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-control hover:shadow transition-all active:scale-[0.98] cursor-pointer text-center"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>{isEs ? "Agregar Nuevo Registro" : "Add New Record"}</span>
            </Link>

            {/* Button 2: Take Extra Treatment */}
            <button
              type="button"
              onClick={() => setIsExtraTxModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-accent-300 bg-accent-soft hover:bg-accent-100/80 py-2.5 sm:py-3 px-4 text-xs sm:text-sm font-bold text-accent-800 shadow-control transition-all active:scale-[0.98] cursor-pointer text-center"
            >
              <Clock className="h-4 w-4 text-accent-fg stroke-[2.5]" />
              <span>{isEs ? "Tomar Tratamiento Extra" : "Take Extra Treatment"}</span>
            </button>
          </div>
        </section>

        {/* CARD 2: DIALYSIS SCHEDULE — day rows on the left, freeform note on the right */}
        <section className="xl:col-span-8 2xl:col-span-8 rounded-card border border-line bg-surface p-5 sm:p-6 shadow-control flex flex-col">
          {/* Card head: title on the left, Edit Week on the right */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="h-[22px] w-[22px] sm:h-6 sm:w-6 text-fg-secondary stroke-[2.2] shrink-0" />
              <h2 className="text-[22px] sm:text-[26px] font-bold text-fg-secondary tracking-tight">
                {isEs ? "Horario de Diálisis" : "Dialysis Schedule"}
              </h2>
            </div>

            <button
              type="button"
              onClick={handleOpenEditWeek}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface hover:bg-surface-sunken px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-fg-secondary shadow-control hover:border-line-strong transition-colors cursor-pointer"
            >
              <Settings className="h-4 w-4 text-fg-muted" />
              <span>{isEs ? "Editar Semana" : "Edit Week"}</span>
            </button>
          </div>

          {/* Schedule down the left, notes down the right */}
          <div className="mt-5 grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(236px,0.72fr)]">
            {/* Session duration on top, then one row per day */}
            <div className="rounded-xl border border-line-subtle bg-surface-sunken p-3.5 sm:p-4 space-y-3">
              {/* One amount shared by every prescribed day */}
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-line bg-surface px-3.5 py-2.5">
                <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-fg-secondary">
                  <Clock className="h-4 w-4 shrink-0 stroke-[2.4] text-fg-muted" />
                  {isEs ? "Duración de la sesión" : "Session duration"}
                </span>
                <span className="text-sm sm:text-base font-bold text-fg-brand">
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
                      className={`mb-1.5 flex min-w-0 break-inside-avoid items-center justify-between gap-2 rounded-xl px-2.5 py-2 transition-all ${isSelected
                          ? "bg-gradient-to-r from-primary-soft via-surface to-surface border border-line shadow-card hover:shadow-md hover:border-line-strong"
                          : "bg-surface/40 border border-dashed border-line/70"
                        }`}
                    >
                      <span
                        className={`min-w-0 truncate text-xs sm:text-sm font-bold tracking-tight select-none ${isSelected ? "text-fg-brand" : "text-fg-subtle"
                          }`}
                      >
                        {fullDayName}
                      </span>

                      {isSelected ? (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface-sunken px-2.5 py-1 text-[11px] sm:text-xs font-bold text-fg whitespace-nowrap select-none">
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
            <div className="flex h-full flex-col justify-between gap-2 rounded-card border border-line/80 bg-surface-sunken p-3 sm:p-3.5 transition-all focus-within:border-primary-soft-line focus-within:bg-surface focus-within:ring-2 focus-within:ring-ring/60">
              {/* Note head bar: label on the left, Undo / Redo / Clean on the right */}
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-line/70">
                <span className="text-xs font-bold text-fg-secondary">
                  {isEs ? "Notas" : "Notes"}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleUndoNote}
                    disabled={historyIndex <= 0}
                    title={isEs ? "Deshacer (Undo)" : "Undo"}
                    className="p-1.5 rounded-lg text-fg-muted hover:text-fg-secondary hover:bg-line/80 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleRedoNote}
                    disabled={historyIndex >= noteHistory.length - 1}
                    title={isEs ? "Rehacer (Redo)" : "Redo"}
                    className="p-1.5 rounded-lg text-fg-muted hover:text-fg-secondary hover:bg-line/80 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <Redo2 className="h-3.5 w-3.5" />
                  </button>

                  <div className="h-3.5 w-px bg-line mx-0.5" />

                  <button
                    type="button"
                    onClick={handleCleanNote}
                    disabled={!weeklyNote}
                    title={isEs ? "Limpiar nota (Clean)" : "Clean Note"}
                    className="p-1.5 rounded-lg text-fg-muted hover:text-danger hover:bg-danger-surface disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
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
                className="w-full flex-1 bg-transparent resize-none outline-none text-xs sm:text-sm font-medium text-fg-secondary placeholder:text-fg-subtle min-h-[120px]"
              />
            </div>
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* TABS: Treatments, Analytics, Care Team Questions & Sort Dropdown          */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 sm:gap-2 p-1 bg-surface-sunken/90 rounded-card w-full sm:w-fit border border-line/80">
          <button
            type="button"
            onClick={() => setActiveTab("treatments")}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none text-center ${activeTab === "treatments"
                ? "bg-surface text-fg shadow-control border border-line/60"
                : "text-fg-muted hover:text-fg hover:bg-surface/50"
              }`}
          >
            {isEs ? "Tratamientos" : "Treatments"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none text-center ${activeTab === "analytics"
                ? "bg-surface text-fg shadow-control border border-line/60"
                : "text-fg-muted hover:text-fg hover:bg-surface/50"
              }`}
          >
            {isEs ? "Analíticas" : "Analytics"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("questions")}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none text-center ${activeTab === "questions"
                ? "bg-surface text-fg shadow-control border border-line/60"
                : "text-fg-muted hover:text-fg hover:bg-surface/50"
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
                className="appearance-none bg-surface border border-line hover:border-line-strong rounded-xl pl-9 pr-8 py-2.5 text-xs sm:text-sm font-bold text-fg-secondary shadow-control focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)]/20 transition-all cursor-pointer"
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
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" />
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" />
            </div>

            <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              aria-label="Sort order"
              className="appearance-none bg-surface border border-line hover:border-line-strong rounded-xl px-4 py-2.5 pr-8 text-xs sm:text-sm font-bold text-fg-secondary shadow-control focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-600)]/20 transition-all cursor-pointer"
            >
              <option value="asc">{isEs ? "Ascendente" : "Ascending"}</option>
              <option value="desc">{isEs ? "Descendente" : "Descending"}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" />
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Treatments */}
      {activeTab === "treatments" && (
        <section className="space-y-3 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    className="min-h-[320px] sm:min-h-[340px] w-full rounded-panel border border-accent-soft-line bg-accent-soft/20 p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 select-none group shadow-control hover:shadow-md hover:border-accent-400"
                  >
                    {/* Content: Text 1 & Text 2 (Normal layout, no tag, pure purple color) */}
                    <div className="space-y-1.5">
                      <h3 className="text-xl sm:text-2xl font-bold text-accent-900 group-hover:text-accent-fg transition-colors tracking-tight">
                        {isEs ? card.title.replace("Treatment", "Tratamiento") : card.title}
                      </h3>
                      <p className="text-sm sm:text-base font-semibold text-accent-fg leading-snug">
                        {isEs
                          ? card.subtitle
                            .replace("Between", "Entre")
                            .replace("treatment", "tratamiento")
                            .replace("to", "y")
                          : card.subtitle}
                      </p>
                    </div>

                    {/* Date & Reason Section: Single Date when extra treatment was taken + Reason underneath */}
                    <div className="my-5 rounded-card bg-accent-soft/60 border border-accent-soft-line p-3.5 sm:p-4 space-y-3.5">
                      {/* Treatment Date Block */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-[13px] font-bold text-accent-800">
                            {isEs ? "Fecha" : "Date"}
                          </span>
                          <div className="h-px bg-accent-200 flex-1" />
                        </div>
                        <div className="flex items-center justify-between text-sm sm:text-base font-bold text-accent-950 pt-0.5">
                          <span>{startInfo.day}</span>
                          <span className="text-right">{startInfo.date}</span>
                        </div>
                      </div>

                      {/* Reason Block */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-[13px] font-bold text-accent-800">
                            {isEs ? "Motivo" : "Reason"}
                          </span>
                          <div className="h-px bg-accent-200 flex-1" />
                        </div>
                        <div className="pt-0.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs sm:text-[13px] font-bold bg-surface text-accent-900 border border-accent-soft-line/80 shadow-control leading-snug">
                            {card.extraReason || (isEs ? "Sobrecarga de Líquidos" : "Fluid Overload")}
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
                                card.id
                              )}&title=${encodeURIComponent(card.title)}&reason=${encodeURIComponent(
                                card.extraReason || ""
                              )}&notes=${encodeURIComponent(card.notes || "")}&isExtra=true`
                            : `/dashboard/personal-log/dialysis-management/view?treatment=${card.id}`
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-full inline-flex items-center justify-center rounded-xl bg-accent-solid hover:bg-accent-700 py-2.5 sm:py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-control hover:shadow transition-all active:scale-[0.98] cursor-pointer text-center"
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
                  className={`min-h-[320px] sm:min-h-[340px] w-full rounded-panel border p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 select-none group shadow-control ${isUpcoming
                      ? "border-line bg-surface opacity-20 pointer-events-none"
                      : isSelected
                        ? "border-[var(--color-brand-600)] bg-primary-soft/20 ring-2 ring-[var(--color-brand-600)]/20 hover:shadow-md"
                        : "border-line bg-surface hover:border-primary-soft-line hover:shadow-md"
                    }`}
                >
                  {/* Content: Text 1 & Text 2 (With Current badge for current treatment) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xl sm:text-2xl font-bold text-fg group-hover:text-fg-brand transition-colors tracking-tight">
                        {card.title}
                      </h3>
                      {isSelected ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-action text-white shadow-control">
                          {isEs ? "Actual" : "Current"}
                        </span>
                      ) : isUpcoming ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-line text-fg-secondary">
                          {isEs ? "Próximo" : "Upcoming"}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-fg-muted leading-snug">
                      {card.subtitle}
                    </p>
                  </div>

                  {/* Date Section: Start and End blocks inside an inner gray card */}
                  {/* 20px gap from top title & subtitle and 20px gap before buttons */}
                  <div className="my-5 rounded-card bg-surface-sunken border border-line-subtle/90 p-3.5 sm:p-4 space-y-3.5">
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
                        className="w-full inline-flex items-center justify-center rounded-xl bg-action hover:bg-action-hover py-2.5 sm:py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-control hover:shadow transition-all active:scale-[0.98] cursor-pointer text-center"
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
      {activeTab === "analytics" && (
        <section className="space-y-6 animate-in fade-in duration-200">
          <RecoveryPatternSection mode="weekly" />

          {/* Weekly Performance Breakdown */}
          <div className="rounded-panel border border-line bg-surface p-6 sm:p-7 shadow-control space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-fg">
                  {isEs ? "Desglose de Desempeño Semanal" : "Weekly Performance Breakdown"}
                </h3>
                <p className="text-xs text-fg-muted font-medium mt-0.5">
                  {isEs
                    ? "Historial de tratamientos y recuperación organizado por semanas"
                    : "Treatment completion and recovery outcomes aggregated week-by-week"}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-card border border-line/80">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-surface-sunken/90 text-xs font-bold uppercase tracking-wider text-fg-muted border-b border-line">
                    <th className="py-3 px-4 w-32">{isEs ? "Semana" : "Week"}</th>
                    <th className="py-3 px-4 w-44">{isEs ? "Período" : "Period"}</th>
                    <th className="py-3 px-4">{isEs ? "Tratamientos" : "Treatments Completed"}</th>
                    <th className="py-3 px-4">{isEs ? "Tiempo Promedio" : "Avg Recovery Time"}</th>
                    <th className="py-3 px-4">{isEs ? "Tasa de Recuperación" : "Good Recovery Rate"}</th>
                    <th className="py-3 px-4 text-center">{isEs ? "Estado" : "Status"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle font-medium text-fg-secondary">
                  <tr className="transition-colors duration-150 ease-standard hover:bg-surface-sunken">
                    <td className="px-inset-md py-inset-sm text-label-md whitespace-nowrap text-fg">
                      {isEs ? "Semana 4 (Actual)" : "Week 4 (Current)"}
                    </td>
                    <td className="px-inset-md py-inset-sm text-body-sm whitespace-nowrap text-fg-secondary">
                      Jun 22, 2026 - Jun 28, 2026
                    </td>
                    <td className="text-overline px-inset-md py-inset-sm text-fg-muted">
                      3 / 3 {isEs ? "sesiones" : "sessions"} (100%)
                    </td>
                    <td className="text-overline px-inset-md py-inset-sm text-fg-muted">
                      2.4 hrs
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-pill bg-surface-sunken">
                          <div className="h-2 rounded-pill bg-action" style={{ width: "85%" }} />
                        </div>
                        <span className="text-label-md text-fg">85%</span>
                      </div>
                    </td>
                    <td className="px-inset-md py-inset-sm text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-success-surface text-success border border-success-line">
                        {isEs ? "En Objetivo" : "On Target"}
                      </span>
                    </td>
                  </tr>

                  <tr className="transition-colors duration-150 ease-standard hover:bg-surface-sunken">
                    <td className="px-inset-md py-inset-sm text-label-md whitespace-nowrap text-fg">
                      {isEs ? "Semana 3" : "Week 3"}
                    </td>
                    <td className="px-inset-md py-inset-sm text-body-sm whitespace-nowrap text-fg-secondary">
                      Jun 15, 2026 - Jun 21, 2026
                    </td>
                    <td className="text-overline px-inset-md py-inset-sm text-fg-muted">
                      3 / 3 {isEs ? "sesiones" : "sessions"} (100%)
                    </td>
                    <td className="text-overline px-inset-md py-inset-sm text-fg-muted">
                      2.9 hrs
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-pill bg-surface-sunken">
                          <div className="h-2 rounded-pill bg-action" style={{ width: "74%" }} />
                        </div>
                        <span className="text-label-md text-fg">74%</span>
                      </div>
                    </td>
                    <td className="px-inset-md py-inset-sm text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-soft text-fg-brand border border-primary-soft-line">
                        {isEs ? "Estable" : "Stable"}
                      </span>
                    </td>
                  </tr>

                  <tr className="transition-colors duration-150 ease-standard hover:bg-surface-sunken">
                    <td className="px-inset-md py-inset-sm text-label-md whitespace-nowrap text-fg">
                      {isEs ? "Semana 2" : "Week 2"}
                    </td>
                    <td className="px-inset-md py-inset-sm text-body-sm whitespace-nowrap text-fg-secondary">
                      Jun 08, 2026 - Jun 14, 2026
                    </td>
                    <td className="text-overline px-inset-md py-inset-sm text-fg-muted">
                      3 / 3 {isEs ? "sesiones" : "sessions"} (100%)
                    </td>
                    <td className="text-overline px-inset-md py-inset-sm text-fg-muted">
                      3.2 hrs
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-pill bg-surface-sunken">
                          <div className="h-2 rounded-pill bg-action" style={{ width: "64%" }} />
                        </div>
                        <span className="text-label-md text-fg">64%</span>
                      </div>
                    </td>
                    <td className="px-inset-md py-inset-sm text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-accent-soft text-accent-fg border border-accent-soft-line">
                        {isEs ? "Mejorando" : "Improving"}
                      </span>
                    </td>
                  </tr>

                  <tr className="transition-colors duration-150 ease-standard hover:bg-surface-sunken">
                    <td className="px-inset-md py-inset-sm text-label-md whitespace-nowrap text-fg">
                      {isEs ? "Semana 1" : "Week 1"}
                    </td>
                    <td className="px-inset-md py-inset-sm text-body-sm whitespace-nowrap text-fg-secondary">
                      Jun 01, 2026 - Jun 07, 2026
                    </td>
                    <td className="text-overline px-inset-md py-inset-sm text-fg-muted">
                      3 / 3 {isEs ? "sesiones" : "sessions"} (100%)
                    </td>
                    <td className="text-overline px-inset-md py-inset-sm text-fg-muted">
                      3.8 hrs
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-pill bg-surface-sunken">
                          <div className="h-2 rounded-pill bg-action" style={{ width: "52%" }} />
                        </div>
                        <span className="text-label-md text-fg">52%</span>
                      </div>
                    </td>
                    <td className="px-inset-md py-inset-sm text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-warning-surface text-warning border border-warning-line">
                        {isEs ? "Monitoreado" : "Monitored"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Tab 3: Care Team Questions (title hidden on main page) */}
      {activeTab === "questions" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <CareTeamQuestionsSection hideTitle />
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT WEEK SETTING                                                */}
      {/* ========================================================================= */}
      <Modal
        open={isEditWeekModalOpen}
        onClose={() => setIsEditWeekModalOpen(false)}
        size="wide"
        title={isEs ? "Editar Horario Semanal" : "Edit Weekly Schedule"}
        description={
          isEs
            ? "Selecciona los días en que tienes diálisis"
            : "Select which days of the week you receive dialysis"
        }
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setIsEditWeekModalOpen(false)}
            >
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
              onSubmit={handleSaveWeekSetting}
              className="space-y-stack-lg"
            >
              <div>
                <label className="block font-semibold text-fg-secondary mb-2">
                  {isEs ? "Días de Diálisis" : "Prescribed Dialysis Days"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ALL_WEEKDAYS.map((day) => {
                    const isSelected = tempDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDaySelection(day)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${isSelected
                            ? "bg-primary-soft border-[var(--color-brand-600)] text-fg-brand"
                            : "bg-surface border-line text-fg-secondary hover:bg-surface-sunken"
                          }`}
                      >
                        <span>{isEs ? WEEKDAY_ES[day] : day}</span>
                        {isSelected && <Check className="h-[18px] w-[18px] stroke-[3]" />}
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
                className="flex w-full items-start gap-2.5 rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:bg-surface-sunken cursor-pointer"
              >
                <span
                  className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-2 transition-colors ${tempHideBlankDays
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
                  <span className="mt-0.5 block text-xs font-medium leading-relaxed text-fg-muted">
                    {isEs
                      ? "La semana muestra solo tus días de tratamiento, sin los espacios vacíos."
                      : "The week shows only your treatment days, with no empty placeholders."}
                  </span>
                </span>
              </button>

              {/* A reminder time per prescribed day */}
              <div>
                <label className="block font-semibold text-fg-secondary mb-2">
                  {isEs ? "Hora del Recordatorio" : "Reminder Time"}
                </label>
                <div className="space-y-2">
                  {ALL_WEEKDAYS.filter((day) => tempDays.includes(day)).map((day) => (
                    <div
                      key={day}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2"
                    >
                      <span className="inline-flex items-center gap-2 font-bold text-fg-secondary">
                        <Clock className="h-4 w-4 shrink-0 stroke-[2.4] text-fg-subtle" />
                        {isEs ? WEEKDAY_ES[day] : day}
                      </span>
                      <input
                        type="time"
                        value={tempReminders[day] ?? DEFAULT_REMINDER}
                        onChange={(e) =>
                          setTempReminders((prev) => ({
                            ...prev,
                            [day]: e.target.value,
                          }))
                        }
                        className="rounded-lg border border-line bg-surface-sunken px-2.5 py-1.5 font-bold text-fg-secondary outline-none transition-colors focus:border-[var(--color-brand-600)] focus:bg-surface focus:ring-2 focus:ring-ring cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Session length: one amount shared by every prescribed day */}
              <div>
                <label className="block font-semibold text-fg-secondary mb-2">
                  {isEs ? "Duración de la Sesión" : "Session Duration"}
                </label>
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={12}
                      value={tempDurationHours}
                      onChange={(e) => setTempDurationHours(e.target.value)}
                      className="w-16 rounded-lg border border-line bg-surface-sunken px-2.5 py-1.5 text-center font-bold text-fg-secondary outline-none transition-colors focus:border-[var(--color-brand-600)] focus:bg-surface focus:ring-2 focus:ring-ring"
                    />
                    <span className="font-bold text-fg-muted">
                      {isEs ? "h" : "hr"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={tempDurationMins}
                      onChange={(e) => setTempDurationMins(e.target.value)}
                      className="rounded-lg border border-line bg-surface-sunken px-2.5 py-1.5 font-bold text-fg-secondary outline-none transition-colors focus:border-[var(--color-brand-600)] focus:bg-surface focus:ring-2 focus:ring-ring cursor-pointer"
                    >
                      {["00", "15", "30", "45"].map((minute) => (
                        <option key={minute} value={minute}>
                          {minute}
                        </option>
                      ))}
                    </select>
                    <span className="font-bold text-fg-muted">min</span>
                  </div>
                  <span className="ml-auto text-xs font-semibold text-fg-subtle">
                    {isEs ? "Se aplica a todos los días" : "Applies to every day"}
                  </span>
                </div>
              </div>

              {/* Apply scope: how far back this schedule reaches */}
              <div className="space-y-2">
                <label className="block font-semibold text-fg-secondary">
                  {isEs ? "Aplicar Este Horario A" : "Apply This Schedule To"}
                </label>

                <div className="space-y-2">
                  {SCOPE_OPTIONS.map((option) => {
                    const isSelected = applyScope === option.id;
                    const effective = scopeEffectiveDate(option.id);

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setApplyScope(option.id)}
                        aria-pressed={isSelected}
                        className={`w-full flex items-start gap-2.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${isSelected
                            ? "bg-primary-soft border-[var(--color-brand-600)]"
                            : "bg-surface border-line hover:bg-surface-sunken"
                          }`}
                      >
                        <span
                          className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${isSelected
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
                              className={`font-bold ${isSelected ? "text-fg-brand" : "text-fg-secondary"
                                }`}
                            >
                              {isEs ? option.labelEs : option.labelEn}
                            </span>
                            <span className="ml-auto text-right text-xs font-bold text-fg">
                              {isEs ? "Desde" : "Starts"}{" "}
                              {formatFullDate(effective, isEs)}
                            </span>
                          </span>
                          <span className="mt-1 block text-xs font-medium leading-relaxed text-fg-muted">
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
                    <p className="text-xs font-medium leading-relaxed text-warning-900">
                      <strong className="font-bold">
                        {isEs ? "Aviso:" : "Heads up:"}
                      </strong>{" "}
                      {isEs
                        ? `Esto reconstruye todo ${monthNamesEs[viewMonth]} ${viewYear} desde el día 1, incluidos los tratamientos ya pasados. Puede generar una gran cantidad de tarjetas y los registros guardados con el horario anterior podrían dejar de coincidir.`
                        : `This rebuilds all of ${monthNames[viewMonth]} ${viewYear} from the 1st, including treatments that already happened. It can create a large number of cards, and records logged against the old schedule may no longer line up.`}
                    </p>
                  </div>
                )}
              </div>

            </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: TAKE EXTRA TREATMENT (WITH INTERACTIVE CALENDAR & AUTO SESSION) */}
      {/* ========================================================================= */}
      <Modal
        open={isExtraTxModalOpen}
        onClose={() => setIsExtraTxModalOpen(false)}
        size="wide"
        title={isEs ? "Tomar Tratamiento Extra" : "Take Extra Treatment"}
        description={
          isEs
            ? "Selecciona la fecha en el calendario para agendar la sesión extra"
            : "Select a date on the calendar to schedule an extra treatment session"
        }
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setIsExtraTxModalOpen(false)}
            >
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
              onSubmit={handleSaveExtraTreatment}
              className="space-y-stack-xl"
            >
              {/* 1. Interactive Calendar Date Selection */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-fg-secondary">
                  {isEs ? "Seleccionar Fecha en el Calendario" : "Select Date on Calendar"}
                </label>

                <div className="rounded-card border border-line bg-surface-sunken p-4 sm:p-5 space-y-4">
                  {/* Month & Year Navigation */}
                  <div className="flex items-center justify-between px-2">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-2 rounded-xl border border-line bg-surface hover:bg-surface-sunken text-fg-secondary transition-colors cursor-pointer shadow-control"
                      aria-label="Previous Month"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <h3 className="text-heading-5 text-fg">
                      {isEs ? monthNamesEs[calMonth] : monthNames[calMonth]} {calYear}
                    </h3>

                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-2 rounded-xl border border-line bg-surface hover:bg-surface-sunken text-fg-secondary transition-colors cursor-pointer shadow-control"
                      aria-label="Next Month"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Day-of-Week Headers */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-fg-subtle uppercase tracking-wider">
                    {(isEs ? daysOfWeekEs : daysOfWeek).map((d) => (
                      <div key={d} className="py-1">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {/* Blank slots before day 1 */}
                    {Array.from({ length: firstDayIndex }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="h-9 sm:h-11" />
                    ))}

                    {/* Active Month Days */}
                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const isSelected = dayNum === selectedDay;

                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => handleSelectDay(dayNum)}
                          className={`h-9 sm:h-11 rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center justify-center select-none ${isSelected
                              ? "bg-action text-white shadow-card scale-105"
                              : "bg-surface hover:bg-primary-soft text-fg-secondary border border-line/70 hover:border-primary-soft-line"
                            }`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Date Confirmation */}
                  <div className="flex items-center gap-2 pt-2 border-t border-line/80 text-xs sm:text-sm font-semibold text-fg-secondary">
                    <Calendar className="h-4 w-4 text-fg-brand" />
                    <span>{isEs ? "Fecha Seleccionada:" : "Selected Date:"}</span>
                    <strong className="text-fg font-bold">{extraTxDate}</strong>
                  </div>
                </div>
              </div>

              {/* 2. Auto-Calculated Session Number */}
              <div className="rounded-card border border-accent-soft-line bg-accent-soft/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-accent-fg">
                    {isEs ? "Número de Sesión (Automático)" : "Session Number (Auto-Assigned)"}
                  </label>
                  <p className="text-xl sm:text-2xl font-extrabold text-accent-900 tracking-tight">
                    Treatment {autoSessionNumber}
                  </p>
                  <p className="text-xs font-medium text-accent-fg">
                    {isEs
                      ? `Calculado automáticamente para ${activeDetectedInterval.intervalName} (${activeDetectedInterval.intervalLabel})`
                      : `Auto-calculated for ${activeDetectedInterval.intervalName} (${activeDetectedInterval.intervalLabel})`}
                  </p>
                </div>

                <span className="rounded-xl bg-accent-200/80 border border-accent-300 px-3 py-1.5 text-xs font-bold text-accent-900 self-start sm:self-center">
                  Extra #{existingExtraCount + 1}
                </span>
              </div>

              {/* 3. Clinical Reason */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-fg-secondary">
                  {isEs ? "Motivo Clínico" : "Clinical Reason"}
                </label>
                <select
                  value={extraTxReason}
                  onChange={(e) => setExtraTxReason(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm sm:text-base font-medium text-fg-secondary outline-none focus:border-primary-edge focus:ring-1 focus:ring-ring shadow-control"
                >
                  <option value="Fluid Overload">Fluid Overload (Extra Ultrafiltration needed)</option>
                  <option value="High Potassium">High Potassium Alert / Lab Result</option>
                  <option value="Doctor Order">Nephrologist / Doctor Direct Prescription</option>
                  <option value="Missed Session">Make-up for a Missed Regular Session</option>
                </select>
              </div>

              {/* 4. Additional Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-fg-secondary">
                  {isEs ? "Notas Adicionales" : "Additional Notes / Symptoms"}
                </label>
                <textarea
                  rows={3}
                  value={extraTxNotes}
                  onChange={(e) => setExtraTxNotes(e.target.value)}
                  placeholder={
                    isEs
                      ? "Describe los síntomas o indicaciones médicas para esta sesión..."
                      : "Symptoms, fluid overload indicators, or instructions for this extra session..."
                  }
                  className="w-full rounded-xl border border-line bg-surface p-3.5 text-sm sm:text-base font-medium text-fg-secondary outline-none focus:border-primary-edge focus:ring-1 focus:ring-ring resize-none shadow-control"
                />
              </div>

            </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW DETAILS / HISTORY                                           */}
      {/* ========================================================================= */}
      <Modal
        open={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        size="wide"
        title={selectedInterval.name}
        description={`${selectedInterval.startDate} – ${selectedInterval.endDate}`}
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setIsDetailsModalOpen(false)}
            >
              {isEs ? "Cerrar" : "Close"}
            </Button>
            <Link
              href={`/dashboard/personal-log/dialysis-management/view?treatment=${selectedCard}`}
              className={buttonStyles()}
            >
              {isEs ? "Ver Detalles Completos" : "View Full Details"}
            </Link>
          </>
        }
      >

            {/* Baseline Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-line-subtle bg-surface-sunken p-3.5 space-y-1">
                <span className="block text-[11px] font-semibold text-fg-subtle uppercase tracking-wider">
                  {isEs ? "Peso Post-Tx Previo" : "Previous Post-Weight"}
                </span>
                <h3 className="text-heading-5 text-fg">
                  {selectedInterval.previousTxPostWeight} kg
                </h3>
              </div>
              <div className="rounded-xl border border-line-subtle bg-surface-sunken p-3.5 space-y-1">
                <span className="block text-[11px] font-semibold text-fg-subtle uppercase tracking-wider">
                  {isEs ? "PA Post-Tx Previa" : "Previous Post-BP"}
                </span>
                <h3 className="text-heading-5 text-fg">
                  {selectedInterval.previousTxPostBp}
                </h3>
              </div>
              <div className="rounded-xl border border-line-subtle bg-surface-sunken p-3.5 space-y-1">
                <span className="block text-[11px] font-semibold text-fg-subtle uppercase tracking-wider">
                  {isEs ? "Peso Seco Objetivo" : "Target Dry Weight"}
                </span>
                <h3 className="text-heading-5 text-fg-brand">
                  {selectedInterval.targetDryWeight.toFixed(1)} kg
                </h3>
              </div>
            </div>

            {/* Logged Interdialytic Records for this interval */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-fg">
                {isEs ? "Registros Registrados en este Intervalo" : "Logged Records in this Interval"}
              </h4>

              {records.filter((r) => r.intervalId === selectedInterval.id).length > 0 ? (
                <div className="space-y-2.5">
                  {records
                    .filter((r) => r.intervalId === selectedInterval.id)
                    .map((rec) => (
                      <div
                        key={rec.id}
                        className="rounded-xl border border-line bg-surface-sunken/40 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-sm font-bold text-fg">
                            {rec.date}
                          </span>
                          {rec.isExtraTreatment && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-accent-100 text-accent-800">
                              Extra Tx {rec.extraTreatmentNumber}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-fg-subtle block">Morning Weight</span>
                            <span className="font-bold text-fg-secondary">{rec.morningWeight || "--"} kg</span>
                          </div>
                          <div>
                            <span className="text-fg-subtle block">Fluid Gain</span>
                            <span className="font-bold text-fg-secondary">+{rec.fluidGainedKg || "--"} kg</span>
                          </div>
                          <div>
                            <span className="text-fg-subtle block">Home BP</span>
                            <span className="font-bold text-fg-secondary">{rec.homeBp || "--"}</span>
                          </div>
                          <div>
                            <span className="text-fg-subtle block">Fluid Intake</span>
                            <span className="font-bold text-fg-secondary">{rec.fluidOz || "--"} oz</span>
                          </div>
                        </div>
                        {rec.notes && (
                          <p className="text-xs text-fg-muted bg-surface p-2 rounded-lg border border-line-subtle">
                            {rec.notes}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-line p-6 text-center text-xs sm:text-sm text-fg-subtle">
                  {isEs
                    ? "Aún no hay registros para este intervalo de tratamiento."
                    : "No records logged for this treatment interval yet."}
                </div>
              )}
            </div>

      </Modal>
    </div>
  );
}

export default function DialysisManagementPage() {
  return (
    <>
      <PersonalLogDisclaimer />

      <Suspense fallback={<div className="p-8 text-center text-fg-muted">Loading...</div>}>
        <DialysisManagementDashboard />
      </Suspense>
    </>
  );
}
