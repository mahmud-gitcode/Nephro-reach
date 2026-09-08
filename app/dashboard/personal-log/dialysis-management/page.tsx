"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
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
import RecoveryPatternSection from "@/components/dashboard/RecoveryPatternSection";
import CareTeamQuestionsSection from "@/components/dashboard/CareTeamQuestionsSection";

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
  isExtra?: boolean;
  extraReason?: string;
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
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

function DialysisManagementDashboard() {
  const router = useRouter();
  const { language } = useLanguage();
  const isEs = language === "ES";

  // Section 1 State: Intervals
  const [intervals, setIntervals] = useState<TreatmentInterval[]>(DEFAULT_INTERVALS);
  // Last treatment is the current treatment (Treatment 4 / int-tx-4)
  const [selectedIntervalId, setSelectedIntervalId] = useState("int-tx-4");
  const selectedInterval =
    intervals.find((i) => i.id === selectedIntervalId) || intervals[intervals.length - 1];

  // Records logged
  const [records, setRecords] = useState<IntervalRecord[]>(INITIAL_RECORDS);

  // Section 2 State: Week Setting
  // User requested: "Weekly 3 tretment = saturday, tusday , trusday"
  const [treatmentFrequency, setTreatmentFrequency] = useState(3);
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Saturday",
    "Tuesday",
    "Thursday",
  ]);
  const [isEditWeekModalOpen, setIsEditWeekModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string>("tx-4");
  const [activeTab, setActiveTab] = useState<"treatments" | "analytics" | "questions">("treatments");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Extra Treatments Cards State (Includes default example Treatment 3.1)
  const [extraTreatments, setExtraTreatments] = useState<TreatmentCardItem[]>([
    {
      id: "tx-extra-3-1",
      intervalId: "int-tx-3",
      orderKey: 3.1,
      title: "Treatment 3.1",
      subtitle: "Between treatment 3.1 to 4",
      startDate: "Friday, Jun 26, 2026",
      endDate: "Saturday, Jun 27, 2026",
      isExtra: true,
      extraReason: "Fluid Overload",
    },
  ]);

  // Temp state for editing week
  const [tempFrequency, setTempFrequency] = useState(3);
  const [tempDays, setTempDays] = useState<string[]>([
    "Saturday",
    "Tuesday",
    "Thursday",
  ]);

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
  const [extraTxDate, setExtraTxDate] = useState("Tuesday, Jun 23, 2026");
  const [extraTxReason, setExtraTxReason] = useState("Fluid Overload");
  const [extraTxNotes, setExtraTxNotes] = useState("");
  // Details / History Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Interactive Calendar State (Month & Year)
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(5); // June (0-indexed)
  const [selectedDay, setSelectedDay] = useState(23);

  // Dynamic interval detection based on clicked calendar date:
  // If date falls in Treatment 1 interval (June 19-21) -> Between Treatment 1 (base 1)
  // If date falls in Treatment 2 interval (June 22-24) -> Between Treatment 2 (base 2)
  // If date falls in Treatment 3 interval (June 25-27) -> Between Treatment 3 (base 3)
  // If date falls in Treatment 4 interval (June 28+)   -> Between Treatment 4 (base 4)
  const detectIntervalForDate = (year: number, month: number, day: number) => {
    if (year === 2026 && month === 5) {
      if (day <= 21) {
        return {
          intervalId: "int-tx-1",
          baseNumber: "1",
          intervalName: "Between Treatment 1 to 2",
          intervalLabel: "Treatment 1 ➔ Treatment 2",
        };
      } else if (day >= 22 && day <= 24) {
        return {
          intervalId: "int-tx-2",
          baseNumber: "2",
          intervalName: "Between Treatment 2 to 3",
          intervalLabel: "Treatment 2 ➔ Treatment 3",
        };
      } else if (day >= 25 && day <= 27) {
        return {
          intervalId: "int-tx-3",
          baseNumber: "3",
          intervalName: "Between Treatment 3 to 4",
          intervalLabel: "Treatment 3 ➔ Treatment 4",
        };
      } else {
        return {
          intervalId: "int-tx-4",
          baseNumber: "4",
          intervalName: "Between Treatment 4 to 5",
          intervalLabel: "Treatment 4 ➔ Treatment 5",
        };
      }
    }

    if (day <= 21) {
      return {
        intervalId: "int-tx-1",
        baseNumber: "1",
        intervalName: "Between Treatment 1 to 2",
        intervalLabel: "Treatment 1 ➔ Treatment 2",
      };
    } else if (day <= 24) {
      return {
        intervalId: "int-tx-2",
        baseNumber: "2",
        intervalName: "Between Treatment 2 to 3",
        intervalLabel: "Treatment 2 ➔ Treatment 3",
      };
    } else if (day <= 27) {
      return {
        intervalId: "int-tx-3",
        baseNumber: "3",
        intervalName: "Between Treatment 3 to 4",
        intervalLabel: "Treatment 3 ➔ Treatment 4",
      };
    } else {
      return {
        intervalId: "int-tx-4",
        baseNumber: "4",
        intervalName: "Between Treatment 4 to 5",
        intervalLabel: "Treatment 4 ➔ Treatment 5",
      };
    }
  };

  // Detected interval for the currently clicked date:
  const activeDetectedInterval = detectIntervalForDate(calYear, calMonth, selectedDay);

  // Count existing extra treatments in this detected interval
  const existingExtraCount = extraTreatments.filter(
    (e) => e.intervalId === activeDetectedInterval.intervalId
  ).length;

  // Auto-calculated session number based on clicked date:
  // e.g. clicking June 20 -> 1.1; clicking June 23 -> 2.1 (or 2.2 if 2.1 exists)
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
    const d = new Date(calYear, calMonth, day);
    const formatted = d.toLocaleDateString(language === "ES" ? "es-ES" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    setExtraTxDate(formatted);
  };

  const handleOpenEditWeek = () => {
    setTempFrequency(treatmentFrequency);
    setTempDays([...selectedDays]);
    setIsEditWeekModalOpen(true);
  };

  const toggleDaySelection = (day: string) => {
    if (tempDays.includes(day)) {
      if (tempDays.length > 1) {
        setTempDays(tempDays.filter((d) => d !== day));
      }
    } else {
      setTempDays([...tempDays, day]);
    }
  };

  const handleSaveWeekSetting = (e: React.FormEvent) => {
    e.preventDefault();
    setTreatmentFrequency(tempDays.length);
    setSelectedDays([...tempDays]);
    setIsEditWeekModalOpen(false);
  };

  // Extra treatment submission
  const handleSaveExtraTreatment = (e: React.FormEvent) => {
    e.preventDefault();

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

    // Create and add the new Extra Treatment Card in purple
    const targetInterval = intervals.find((i) => i.id === activeDetectedInterval.intervalId);
    const parsedOrder = parseFloat(autoSessionNumber);
    const nextNum = Math.floor(parsedOrder) + 1;

    const newExtraCard: TreatmentCardItem = {
      id: `tx-extra-${autoSessionNumber.replace(".", "-")}-${Date.now()}`,
      intervalId: activeDetectedInterval.intervalId,
      orderKey: parsedOrder,
      title: isEs ? `Tratamiento ${autoSessionNumber}` : `Treatment ${autoSessionNumber}`,
      subtitle: isEs
        ? `Entre tratamiento ${autoSessionNumber} y ${nextNum}`
        : `Between treatment ${autoSessionNumber} to ${nextNum}`,
      startDate: extraTxDate,
      endDate: targetInterval?.endDate || extraTxDate,
      isExtra: true,
      extraReason: extraTxReason,
    };

    setExtraTreatments((prev) => [...prev, newExtraCard]);
    setSelectedIntervalId(activeDetectedInterval.intervalId);
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

  // Base Treatment Cards: Treatment 1, 2, 3, 4
  const baseTreatmentCards: TreatmentCardItem[] = [
    {
      id: "tx-1",
      intervalId: "int-tx-1",
      orderKey: 1,
      title: isEs ? "Tratamiento 1" : "Treatment 1",
      subtitle: isEs ? "Entre tratamiento 1 y 2" : "Between treatment 1 to 2",
      startDate: intervals.find((i) => i.id === "int-tx-1")?.startDate || "Friday, Jun 19, 2026",
      endDate: intervals.find((i) => i.id === "int-tx-1")?.endDate || "Monday, Jun 22, 2026",
      isExtra: false,
    },
    {
      id: "tx-2",
      intervalId: "int-tx-2",
      orderKey: 2,
      title: isEs ? "Tratamiento 2" : "Treatment 2",
      subtitle: isEs ? "Entre tratamiento 2 y 3" : "Between treatment 2 to 3",
      startDate: intervals.find((i) => i.id === "int-tx-2")?.startDate || "Monday, Jun 22, 2026",
      endDate: intervals.find((i) => i.id === "int-tx-2")?.endDate || "Wednesday, Jun 24, 2026",
      isExtra: false,
    },
    {
      id: "tx-3",
      intervalId: "int-tx-3",
      orderKey: 3,
      title: isEs ? "Tratamiento 3" : "Treatment 3",
      subtitle: isEs ? "Entre tratamiento 3 y 4" : "Between treatment 3 to 4",
      startDate: intervals.find((i) => i.id === "int-tx-3")?.startDate || "Wednesday, Jun 24, 2026",
      endDate: intervals.find((i) => i.id === "int-tx-3")?.endDate || "Saturday, Jun 27, 2026",
      isExtra: false,
    },
    {
      id: "tx-4",
      intervalId: "int-tx-4",
      orderKey: 4,
      title: isEs ? "Tratamiento 4" : "Treatment 4",
      subtitle: isEs ? "Entre tratamiento 4 y 5" : "Between treatment 4 to 5",
      startDate: intervals.find((i) => i.id === "int-tx-4")?.startDate || "Saturday, Jun 27, 2026",
      endDate: intervals.find((i) => i.id === "int-tx-4")?.endDate || "Tuesday, Jun 30, 2026",
      isExtra: false,
    },
  ];

  // Combined and sorted cards (Extra treatment is placed in its proper chronological place by orderKey)
  const combinedTreatmentCards = [...baseTreatmentCards, ...extraTreatments].sort(
    (a, b) => a.orderKey - b.orderKey
  );

  const displayedTreatmentCards =
    sortOrder === "desc" ? [...combinedTreatmentCards].reverse() : combinedTreatmentCards;

  const currentStartInfo = parseDayAndDate(selectedInterval.startDate);
  const currentEndInfo = parseDayAndDate(selectedInterval.endDate);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb Navigation */}
      <div>
        <Link
          href="/dashboard/personal-log"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEs ? "Volver a Registro Personal" : "Back to Personal Log"}
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2-COLUMN ROW: CURRENT TREATMENT (COL 1) & WEEK SETTING (COL 2)            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* CARD 1: CURRENT RUNNING TREATMENT, DATES & ACTION BUTTONS */}
        <section className="xl:col-span-4 2xl:col-span-4 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Currently Running Treatment Display */}
            <div>
              <span className="block text-sm font-semibold text-slate-500 mb-1">
                {isEs ? "Tratamiento actual" : "Current Treatment"}
              </span>
              <h2 className="text-[22px] sm:text-[26px] font-bold text-slate-800 tracking-tight">
                {isEs
                  ? selectedInterval.name
                    .replace(/Between/g, "Entre")
                    .replace(/Treatment/g, "Tratamiento")
                    .replace(/\bto\b/g, "y")
                  : selectedInterval.name}
              </h2>
            </div>

            {/* Date Section: Start and End blocks inside an inner gray card (identical to treatment card) */}
            <div className="my-4 rounded-2xl bg-slate-50 border border-slate-100/90 p-3.5 sm:p-4 space-y-3.5">
              {/* Start Block */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-[13px] font-bold text-slate-700">
                    {isEs ? "Inicio" : "Start"}
                  </span>
                  <div className="h-px bg-slate-200/90 flex-1" />
                </div>
                <div className="flex items-center justify-between text-sm sm:text-base font-bold text-slate-800 pt-0.5">
                  <span>{currentStartInfo.day}</span>
                  <span className="text-right">{currentStartInfo.date}</span>
                </div>
              </div>

              {/* End Block */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-[13px] font-bold text-slate-700">
                    {isEs ? "Fin" : "End"}
                  </span>
                  <div className="h-px bg-slate-200/90 flex-1" />
                </div>
                <div className="flex items-center justify-between text-sm sm:text-base font-bold text-slate-800 pt-0.5">
                  <span>{currentEndInfo.day}</span>
                  <span className="text-right">{currentEndInfo.date}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2 Buttons placed below - full width to fill right side */}
          <div className="flex flex-col gap-2.5 w-full">
            {/* Button 1: Add New Record */}
            <Link
              href="/dashboard/personal-log/dialysis-management/add"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 py-2.5 sm:py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-2xs hover:shadow transition-all active:scale-[0.98] cursor-pointer text-center"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>{isEs ? "Agregar Nuevo Registro" : "Add New Record"}</span>
            </Link>

            {/* Button 2: Take Extra Treatment */}
            <button
              type="button"
              onClick={() => setIsExtraTxModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100/80 py-2.5 sm:py-3 px-4 text-xs sm:text-sm font-bold text-purple-800 shadow-2xs transition-all active:scale-[0.98] cursor-pointer text-center"
            >
              <Clock className="h-4 w-4 text-purple-700 stroke-[2.5]" />
              <span>{isEs ? "Tomar Tratamiento Extra" : "Take Extra Treatment"}</span>
            </button>
          </div>
        </section>

        {/* CARD 2: WEEK SETTING (Widened to give ample space for 7 full day names without overlap) */}
        <section className="xl:col-span-8 2xl:col-span-8 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="h-[22px] w-[22px] sm:h-6 sm:w-6 text-slate-800 stroke-[2.2] shrink-0" />
                <h2 className="text-[22px] sm:text-[26px] font-bold text-slate-800 tracking-tight">
                  {isEs ? "Configuración Semanal" : "Week Setting"}
                </h2>
              </div>

              <button
                type="button"
                onClick={handleOpenEditWeek}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
              >
                <Settings className="h-4 w-4 text-slate-500" />
                <span>{isEs ? "Editar Semana" : "Edit Week"}</span>
              </button>
            </div>

            {/* Weekly X treatment on top, 7-day schedule underneath with full day names - exact 24px gap from title */}
            <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3.5 sm:p-4 space-y-2.5">
              <p className="text-sm sm:text-base font-bold text-slate-800">
                {isEs ? "Semanal" : "Weekly"} {treatmentFrequency}{" "}
                {isEs ? "tratamientos" : "treatment"}
              </p>

              {/* 7 Days Schedule with horizontal scroll protection on tiny mobile screens */}
              <div className="overflow-x-auto pb-1 -mx-0.5 px-0.5">
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 pt-1 min-w-[520px] sm:min-w-0">
                  {ALL_WEEKDAYS.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    const fullDayName = isEs
                      ? day === "Saturday"
                        ? "Sábado"
                        : day === "Sunday"
                          ? "Domingo"
                          : day === "Monday"
                            ? "Lunes"
                            : day === "Tuesday"
                              ? "Martes"
                              : day === "Wednesday"
                                ? "Miércoles"
                                : day === "Thursday"
                                  ? "Jueves"
                                  : "Viernes"
                      : day;

                    return (
                      <div
                        key={day}
                        className={`min-w-0 h-10 sm:h-12 rounded-xl flex items-center justify-center text-center transition-all px-0.5 sm:px-1 overflow-hidden ${isSelected
                            ? "bg-blue-50 border border-blue-200/90 text-[#2563EB] font-bold shadow-2xs"
                            : "bg-white/40 border border-dashed border-slate-200/70"
                          }`}
                      >
                        {isSelected ? (
                          <span className="text-[10px] min-[420px]:text-[11px] sm:text-xs md:text-sm lg:text-sm xl:text-xs 2xl:text-sm font-bold tracking-tight whitespace-nowrap select-none">
                            {fullDayName}
                          </span>
                        ) : (
                          <span className="text-xs text-transparent select-none">&nbsp;</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Freeform Note Field: Exact 12px gap (mt-3) from Weekly 3 treatment schedule box */}
          <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-3 sm:p-3.5 space-y-2 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100/60 transition-all mt-3 flex-1 flex flex-col justify-between">
            {/* Note Head Bar: Only text label without side icon, with Undo, Redo, Clean on right */}
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200/70">
              <span className="text-xs font-bold text-slate-700">
                {isEs ? "Notas" : "Notes"}
              </span>

              {/* Action Icons: Undo, Redo, Clean */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleUndoNote}
                  disabled={historyIndex <= 0}
                  title={isEs ? "Deshacer (Undo)" : "Undo"}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleRedoNote}
                  disabled={historyIndex >= noteHistory.length - 1}
                  title={isEs ? "Rehacer (Redo)" : "Redo"}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Redo2 className="h-3.5 w-3.5" />
                </button>

                <div className="h-3.5 w-px bg-slate-200 mx-0.5" />

                <button
                  type="button"
                  onClick={handleCleanNote}
                  disabled={!weeklyNote}
                  title={isEs ? "Limpiar nota (Clean)" : "Clean Note"}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Eraser className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Note Area */}
            <textarea
              value={weeklyNote}
              onChange={handleNoteChange}
              rows={2}
              placeholder={
                isEs
                  ? "Escribe cualquier nota, síntoma o recordatorio aquí..."
                  : "Write any notes, symptoms, or reminders here..."
              }
              className="w-full flex-1 bg-transparent resize-none outline-none text-xs sm:text-sm font-medium text-slate-700 placeholder:text-slate-400 min-h-[48px] sm:min-h-[56px]"
            />
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* TABS: Treatments, Analytics, Care Team Questions & Sort Dropdown          */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 sm:gap-2 p-1 bg-slate-100/90 rounded-2xl w-full sm:w-fit border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab("treatments")}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none text-center ${activeTab === "treatments"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
          >
            {isEs ? "Tratamientos" : "Treatments"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none text-center ${activeTab === "analytics"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
          >
            {isEs ? "Analíticas" : "Analytics"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("questions")}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none text-center ${activeTab === "questions"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
          >
            {isEs ? "Preguntas del Equipo" : "Care Team Questions"}
          </button>
        </div>

        {/* Right Side Sort Dropdown (No label, 2 short options: Ascending / Descending) */}
        {activeTab === "treatments" && (
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              aria-label="Sort order"
              className="appearance-none bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 pr-8 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all cursor-pointer"
            >
              <option value="asc">{isEs ? "Ascendente" : "Ascending"}</option>
              <option value="desc">{isEs ? "Descendente" : "Descending"}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          </div>
        )}
      </div>

      {/* Tab 1: Treatments */}
      {activeTab === "treatments" && (
        <section className="space-y-3 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedTreatmentCards.map((card) => {
              // Only the regular Treatment 4 is marked as current
              const isSelected = card.id === "tx-4";
              const isExtra = !!card.isExtra;
              const startInfo = parseDayAndDate(card.startDate);
              const endInfo = parseDayAndDate(card.endDate);

              if (isExtra) {
                return (
                  <div
                    key={card.id}
                    className="min-h-[370px] sm:min-h-[390px] w-full rounded-3xl border border-purple-200 bg-purple-50/20 p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 select-none group shadow-xs hover:shadow-md hover:border-purple-400"
                  >
                    {/* Content: Text 1 & Text 2 (Normal layout, no tag, pure purple color) */}
                    <div className="space-y-1.5">
                      <h3 className="text-xl sm:text-2xl font-bold text-purple-900 group-hover:text-purple-700 transition-colors tracking-tight">
                        {isEs ? card.title.replace("Treatment", "Tratamiento") : card.title}
                      </h3>
                      <p className="text-sm sm:text-base font-semibold text-purple-700 leading-snug">
                        {isEs
                          ? card.subtitle
                            .replace("Between", "Entre")
                            .replace("treatment", "tratamiento")
                            .replace("to", "y")
                          : card.subtitle}
                      </p>
                    </div>

                    {/* Date Section: Start and End blocks inside an inner purple card */}
                    <div className="my-5 rounded-2xl bg-purple-50/60 border border-purple-100 p-3.5 sm:p-4 space-y-3.5">
                      {/* Start Block */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-[13px] font-bold text-purple-800">
                            {isEs ? "Inicio" : "Start"}
                          </span>
                          <div className="h-px bg-purple-200 flex-1" />
                        </div>
                        <div className="flex items-center justify-between text-sm sm:text-base font-bold text-purple-950 pt-0.5">
                          <span>{startInfo.day}</span>
                          <span className="text-right">{startInfo.date}</span>
                        </div>
                      </div>

                      {/* End Block */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-[13px] font-bold text-purple-800">
                            {isEs ? "Fin" : "End"}
                          </span>
                          <div className="h-px bg-purple-200 flex-1" />
                        </div>
                        <div className="flex items-center justify-between text-sm sm:text-base font-bold text-purple-950 pt-0.5">
                          <span>{endInfo.day}</span>
                          <span className="text-right">{endInfo.date}</span>
                        </div>
                      </div>
                    </div>

                    {/* 2 Purple Buttons Inside Card: New Record & View Details on 2 Separate Rows */}
                    <div className="flex flex-col gap-2.5 w-full">
                      <Link
                        href={`/dashboard/personal-log/dialysis-management/add?treatment=${card.intervalId}&extra=${card.title.replace(/\s+/g, "_")}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full inline-flex items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-700 py-2.5 sm:py-3 px-3 text-xs sm:text-sm font-bold text-white shadow-2xs hover:shadow transition-all active:scale-[0.98] cursor-pointer text-center"
                      >
                        <span>{isEs ? "Nuevo Registro" : "New Record"}</span>
                      </Link>

                      <Link
                        href={`/dashboard/personal-log/dialysis-management/view?treatment=${card.intervalId}&extra=${card.title.replace(/\s+/g, "_")}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full inline-flex items-center justify-center rounded-xl border border-purple-200 bg-white hover:bg-purple-50 py-2.5 px-3 text-xs sm:text-sm font-bold text-purple-800 shadow-2xs hover:border-purple-300 transition-all active:scale-[0.98] cursor-pointer text-center"
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
                  className={`min-h-[370px] sm:min-h-[390px] w-full rounded-3xl border p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 select-none group shadow-xs hover:shadow-md ${isSelected
                      ? "border-[#2563EB] bg-blue-50/20 ring-2 ring-[#2563EB]/20"
                      : "border-slate-200/90 bg-white hover:border-blue-300"
                    }`}
                >
                  {/* Content: Text 1 & Text 2 (With Current badge for current treatment) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors tracking-tight">
                        {card.title}
                      </h3>
                      {isSelected && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2563EB] text-white shadow-2xs">
                          {isEs ? "Actual" : "Current"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-slate-500 leading-snug">
                      {card.subtitle}
                    </p>
                  </div>

                  {/* Date Section: Start and End blocks inside an inner gray card */}
                  {/* 20px gap from top title & subtitle and 20px gap before buttons */}
                  <div className="my-5 rounded-2xl bg-slate-50 border border-slate-100/90 p-3.5 sm:p-4 space-y-3.5">
                    {/* Start Block */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-[13px] font-bold text-slate-700">
                          {isEs ? "Inicio" : "Start"}
                        </span>
                        <div className="h-px bg-slate-200/90 flex-1" />
                      </div>
                      <div className="flex items-center justify-between text-sm sm:text-base font-bold text-slate-800 pt-0.5">
                        <span>{startInfo.day}</span>
                        <span className="text-right">{startInfo.date}</span>
                      </div>
                    </div>

                    {/* End Block */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-[13px] font-bold text-slate-700">
                          {isEs ? "Fin" : "End"}
                        </span>
                        <div className="h-px bg-slate-200/90 flex-1" />
                      </div>
                      <div className="flex items-center justify-between text-sm sm:text-base font-bold text-slate-800 pt-0.5">
                        <span>{endInfo.day}</span>
                        <span className="text-right">{endInfo.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2 Buttons Inside Card: New Record & View Details on 2 Separate Rows */}
                  <div className="flex flex-col gap-2.5 w-full">
                    <Link
                      href={`/dashboard/personal-log/dialysis-management/add?treatment=${card.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full inline-flex items-center justify-center rounded-xl bg-[#2563EB] hover:bg-blue-700 py-2.5 sm:py-3 px-3 text-xs sm:text-sm font-bold text-white shadow-2xs hover:shadow transition-all active:scale-[0.98] cursor-pointer text-center"
                    >
                      <span>{isEs ? "Nuevo Registro" : "New Record"}</span>
                    </Link>

                    <Link
                      href={`/dashboard/personal-log/dialysis-management/view?treatment=${card.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2.5 px-3 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs hover:border-slate-300 transition-all active:scale-[0.98] cursor-pointer text-center"
                    >
                      <span>{isEs ? "Ver Detalles" : "View Details"}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tab 2: Analytics */}
      {activeTab === "analytics" && (
        <section className="space-y-6 animate-in fade-in duration-200">
          <RecoveryPatternSection treatmentId={selectedCard} />
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
      {isEditWeekModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isEs ? "Editar Horario Semanal" : "Edit Weekly Schedule"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isEs
                    ? "Selecciona los días en que tienes diálisis"
                    : "Select which days of the week you receive dialysis"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditWeekModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWeekSetting} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  {isEs ? "Días de Diálisis" : "Prescribed Dialysis Days"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_WEEKDAYS.map((day) => {
                    const isSelected = tempDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDaySelection(day)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${isSelected
                            ? "bg-blue-50 border-[#2563EB] text-[#2563EB]"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                      >
                        <span>{day}</span>
                        {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 font-medium">
                {isEs ? "Resultado:" : "Summary:"}{" "}
                <strong className="text-slate-900">
                  Weekly {tempDays.length} Treatments = {tempDays.join(", ")}
                </strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditWeekModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {isEs ? "Cancelar" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 font-bold text-white transition-colors cursor-pointer shadow-2xs"
                >
                  {isEs ? "Guardar Semana" : "Save Week Setting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TAKE EXTRA TREATMENT (WITH INTERACTIVE CALENDAR & AUTO SESSION) */}
      {/* ========================================================================= */}
      {isExtraTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header without Unscheduled Extra Treatment badge */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {isEs ? "Tomar Tratamiento Extra" : "Take Extra Treatment"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  {isEs
                    ? "Selecciona la fecha en el calendario para agendar la sesión extra"
                    : "Select a date on the calendar to schedule an extra treatment session"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExtraTxModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSaveExtraTreatment} className="space-y-6">
              {/* 1. Interactive Calendar Date Selection */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                  {isEs ? "Seleccionar Fecha en el Calendario" : "Select Date on Calendar"}
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
                  {/* Month & Year Navigation */}
                  <div className="flex items-center justify-between px-2">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
                      aria-label="Previous Month"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <p className="text-base sm:text-lg font-bold text-slate-900">
                      {isEs ? monthNamesEs[calMonth] : monthNames[calMonth]} {calYear}
                    </p>

                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
                      aria-label="Next Month"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Day-of-Week Headers */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
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
                              ? "bg-[#2563EB] text-white shadow-sm scale-105"
                              : "bg-white hover:bg-blue-50 text-slate-800 border border-slate-200/70 hover:border-blue-300"
                            }`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Date Confirmation */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80 text-xs sm:text-sm font-semibold text-slate-700">
                    <Calendar className="h-4 w-4 text-[#2563EB]" />
                    <span>{isEs ? "Fecha Seleccionada:" : "Selected Date:"}</span>
                    <strong className="text-slate-900 font-bold">{extraTxDate}</strong>
                  </div>
                </div>
              </div>

              {/* 2. Auto-Calculated Session Number */}
              <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-purple-700">
                    {isEs ? "Número de Sesión (Automático)" : "Session Number (Auto-Assigned)"}
                  </label>
                  <p className="text-xl sm:text-2xl font-extrabold text-purple-900 tracking-tight">
                    Treatment {autoSessionNumber}
                  </p>
                  <p className="text-xs font-medium text-purple-700">
                    {isEs
                      ? `Calculado automáticamente para ${activeDetectedInterval.intervalName} (${activeDetectedInterval.intervalLabel})`
                      : `Auto-calculated for ${activeDetectedInterval.intervalName} (${activeDetectedInterval.intervalLabel})`}
                  </p>
                </div>

                <span className="rounded-xl bg-purple-200/80 border border-purple-300 px-3 py-1.5 text-xs font-bold text-purple-900 self-start sm:self-center">
                  Extra #{existingExtraCount + 1}
                </span>
              </div>

              {/* 3. Clinical Reason */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  {isEs ? "Motivo Clínico" : "Clinical Reason"}
                </label>
                <select
                  value={extraTxReason}
                  onChange={(e) => setExtraTxReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm sm:text-base font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                >
                  <option value="Fluid Overload">Fluid Overload (Extra Ultrafiltration needed)</option>
                  <option value="High Potassium">High Potassium Alert / Lab Result</option>
                  <option value="Doctor Order">Nephrologist / Doctor Direct Prescription</option>
                  <option value="Missed Session">Make-up for a Missed Regular Session</option>
                </select>
              </div>

              {/* 4. Additional Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
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
                  className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm sm:text-base font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none shadow-2xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExtraTxModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm sm:text-base font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {isEs ? "Cancelar" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2563EB] hover:bg-blue-700 px-6 py-3 text-sm sm:text-base font-bold text-white transition-colors cursor-pointer shadow-sm hover:shadow active:scale-[0.98]"
                >
                  {isEs ? "Crear Sesión Extra" : "Create Extra Treatment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW DETAILS / HISTORY                                           */}
      {/* ========================================================================= */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {isEs ? "Detalles del Tratamiento" : "Treatment Details & History"}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {selectedInterval.name}
                </h3>
                <p className="text-xs sm:text-sm font-medium text-slate-500">
                  {selectedInterval.startDate} – {selectedInterval.endDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Baseline Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {isEs ? "Peso Post-Tx Previo" : "Previous Post-Weight"}
                </span>
                <p className="text-base sm:text-lg font-bold text-slate-900">
                  {selectedInterval.previousTxPostWeight} kg
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {isEs ? "PA Post-Tx Previa" : "Previous Post-BP"}
                </span>
                <p className="text-base sm:text-lg font-bold text-slate-900">
                  {selectedInterval.previousTxPostBp}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {isEs ? "Peso Seco Objetivo" : "Target Dry Weight"}
                </span>
                <p className="text-base sm:text-lg font-bold text-[#2563EB]">
                  {selectedInterval.targetDryWeight.toFixed(1)} kg
                </p>
              </div>
            </div>

            {/* Logged Interdialytic Records for this interval */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900">
                {isEs ? "Registros Registrados en este Intervalo" : "Logged Records in this Interval"}
              </h4>

              {records.filter((r) => r.intervalId === selectedInterval.id).length > 0 ? (
                <div className="space-y-2.5">
                  {records
                    .filter((r) => r.intervalId === selectedInterval.id)
                    .map((rec) => (
                      <div
                        key={rec.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {rec.date}
                          </span>
                          {rec.isExtraTreatment && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                              Extra Tx {rec.extraTreatmentNumber}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400 block">Morning Weight</span>
                            <span className="font-bold text-slate-800">{rec.morningWeight || "--"} kg</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Fluid Gain</span>
                            <span className="font-bold text-slate-800">+{rec.fluidGainedKg || "--"} kg</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Home BP</span>
                            <span className="font-bold text-slate-800">{rec.homeBp || "--"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Fluid Intake</span>
                            <span className="font-bold text-slate-800">{rec.fluidOz || "--"} oz</span>
                          </div>
                        </div>
                        {rec.notes && (
                          <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                            {rec.notes}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs sm:text-sm text-slate-400">
                  {isEs
                    ? "Aún no hay registros para este intervalo de tratamiento."
                    : "No records logged for this treatment interval yet."}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isEs ? "Cerrar" : "Close"}
              </button>
              <Link
                href={`/dashboard/personal-log/dialysis-management/add?treatment=${selectedCard}`}
                className="rounded-xl bg-[#2563EB] hover:bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-2xs hover:shadow transition-all active:scale-[0.98] cursor-pointer"
              >
                {isEs ? "Agregar Registro" : "Add Record"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DialysisManagementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
      <DialysisManagementDashboard />
    </Suspense>
  );
}
