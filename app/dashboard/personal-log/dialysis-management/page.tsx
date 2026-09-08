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
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

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

const DEFAULT_INTERVALS: TreatmentInterval[] = [
  {
    id: "int-tx-2",
    name: "Between Treatment 2",
    label: "Treatment 2 ➔ Treatment 3",
    startDate: "Monday, Jun 22, 2026",
    endDate: "Wednesday, Jun 24, 2026",
    previousTxPostWeight: 72.4,
    previousTxPostBp: "118/76 mmHg",
    targetDryWeight: 72.0,
  },
  {
    id: "int-tx-1",
    name: "Between Treatment 1",
    label: "Treatment 1 ➔ Treatment 2",
    startDate: "Friday, Jun 19, 2026",
    endDate: "Monday, Jun 22, 2026",
    previousTxPostWeight: 72.7,
    previousTxPostBp: "106/68 mmHg",
    targetDryWeight: 72.0,
  },
  {
    id: "int-tx-3",
    name: "Between Treatment 3 (Weekend Gap)",
    label: "Treatment 3 ➔ Next Week Treatment 1",
    startDate: "Wednesday, Jun 24, 2026",
    endDate: "Saturday, Jun 27, 2026",
    previousTxPostWeight: 72.2,
    previousTxPostBp: "124/80 mmHg",
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
  const [selectedIntervalId, setSelectedIntervalId] = useState("int-tx-2");
  const selectedInterval =
    intervals.find((i) => i.id === selectedIntervalId) || intervals[0];

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
  const [selectedCard, setSelectedCard] = useState<string>("tx-1");

  // Temp state for editing week
  const [tempFrequency, setTempFrequency] = useState(3);
  const [tempDays, setTempDays] = useState<string[]>([
    "Saturday",
    "Tuesday",
    "Thursday",
  ]);

  // Take Extra Treatment Modal State
  const [isExtraTxModalOpen, setIsExtraTxModalOpen] = useState(false);
  const [extraTxDate, setExtraTxDate] = useState("Tuesday, Jun 23, 2026");
  const [extraTxReason, setExtraTxReason] = useState("Fluid Overload");
  const [extraTxNotes, setExtraTxNotes] = useState("");

  // Interactive Calendar State (Month & Year)
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(5); // June (0-indexed)
  const [selectedDay, setSelectedDay] = useState(23);

  // Dynamic interval detection based on clicked calendar date:
  // If date falls in Treatment 1 interval (June 19-21) -> Between Treatment 1 (base 1)
  // If date falls in Treatment 2 interval (June 22-24) -> Between Treatment 2 (base 2)
  // If date falls in Treatment 3 interval (June 25+) -> Between Treatment 3 (base 3)
  const detectIntervalForDate = (year: number, month: number, day: number) => {
    if (year === 2026 && month === 5) {
      if (day <= 21) {
        return {
          intervalId: "int-tx-1",
          baseNumber: "1",
          intervalName: "Between Treatment 1",
          intervalLabel: "Treatment 1 ➔ Treatment 2",
        };
      } else if (day >= 22 && day <= 24) {
        return {
          intervalId: "int-tx-2",
          baseNumber: "2",
          intervalName: "Between Treatment 2",
          intervalLabel: "Treatment 2 ➔ Treatment 3",
        };
      } else {
        return {
          intervalId: "int-tx-3",
          baseNumber: "3",
          intervalName: "Between Treatment 3",
          intervalLabel: "Treatment 3 ➔ Next Week Treatment 1",
        };
      }
    }

    if (day <= 21) {
      return {
        intervalId: "int-tx-1",
        baseNumber: "1",
        intervalName: "Between Treatment 1",
        intervalLabel: "Treatment 1 ➔ Treatment 2",
      };
    } else if (day <= 24) {
      return {
        intervalId: "int-tx-2",
        baseNumber: "2",
        intervalName: "Between Treatment 2",
        intervalLabel: "Treatment 2 ➔ Treatment 3",
      };
    } else {
      return {
        intervalId: "int-tx-3",
        baseNumber: "3",
        intervalName: "Between Treatment 3",
        intervalLabel: "Treatment 3 ➔ Next Week Treatment 1",
      };
    }
  };

  // Detected interval for the currently clicked date:
  const activeDetectedInterval = detectIntervalForDate(calYear, calMonth, selectedDay);

  // Count existing extra treatments in this detected interval
  const existingExtraCount = records.filter(
    (r) => r.intervalId === activeDetectedInterval.intervalId && r.isExtraTreatment
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
    setSelectedIntervalId(activeDetectedInterval.intervalId);
    setIsExtraTxModalOpen(false);
    setExtraTxNotes("");
  };


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
      {/* SECTION 1: CURRENT RUNNING TREATMENT, DATES & ACTION BUTTONS              */}
      {/* ========================================================================= */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
        {/* Currently Running Treatment Display */}
        <div>
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {isEs ? "Tratamiento actual" : "Current Treatment"}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {selectedInterval.name}
          </h2>
        </div>

        {/* Start Date & End Date: small, label on top, date below, no icon */}
        <div className="flex items-center gap-6 sm:gap-12 flex-wrap pt-2 border-t border-slate-100">
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isEs ? "Fecha de inicio" : "Start date"}
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-800">
              {selectedInterval.startDate}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isEs ? "Fecha de fin" : "End date"}
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-800">
              {selectedInterval.endDate}
            </span>
          </div>
        </div>

        {/* 2 Buttons placed below (niche thakbe) */}
        <div className="flex items-center gap-3 flex-wrap pt-1">
          {/* Button 1: Add New Record */}
          <Link
            href="/dashboard/personal-log/dialysis-management/add"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-2xs hover:shadow transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>{isEs ? "Agregar Nuevo Registro" : "Add New Record"}</span>
          </Link>

          {/* Button 2: Take Extra Treatment */}
          <button
            type="button"
            onClick={() => setIsExtraTxModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100/80 px-5 py-3 text-sm font-bold text-purple-800 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Clock className="h-4 w-4 text-purple-700 stroke-[2.5]" />
            <span>{isEs ? "Tomar Tratamiento Extra" : "Take Extra Treatment"}</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: WEEK SETTING                                                  */}
      {/* ========================================================================= */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-500" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {isEs ? "Configuración Semanal" : "Week Setting"}
              </h2>
            </div>

            {/* Exactly as requested: Weekly 3 treatment = saturday, tusday , trusday */}
            <p className="text-base font-semibold text-slate-800">
              {isEs ? "Semanal" : "Weekly"} {treatmentFrequency}{" "}
              {isEs ? "tratamientos" : "treatment"} ={" "}
              <span className="text-[#2563EB] font-bold">
                {selectedDays.join(", ")}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenEditWeek}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Settings className="h-4 w-4 text-slate-500" />
            <span>{isEs ? "Editar Semana" : "Edit Week"}</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: TREATMENT CARDS (SQUARE SHAPE, NO ICON, DATES INCLUDED)        */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Square Card: Treatment 1 */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              setSelectedCard("tx-1");
              setSelectedIntervalId("int-tx-1");
            }}
            className={`aspect-square w-56 sm:w-60 md:w-64 rounded-3xl border p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none group shadow-xs hover:shadow-md active:scale-[0.98] ${
              selectedCard === "tx-1"
                ? "border-[#2563EB] bg-blue-50/20 ring-2 ring-[#2563EB]/20"
                : "border-slate-200/90 bg-white hover:border-blue-300"
            }`}
          >
            {/* Content: Text 1 & Text 2 (No icon) */}
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors tracking-tight">
                Treatment 1
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 leading-snug">
                Between treatment 1 and 3
              </p>
            </div>

            {/* Date in Card: Start Date & End Date (small, label on top, date below, no icon) */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {isEs ? "Fecha de inicio" : "Start date"}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  {intervals.find((i) => i.id === "int-tx-1")?.startDate || "Friday, Jun 19, 2026"}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {isEs ? "Fecha de fin" : "End date"}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  {intervals.find((i) => i.id === "int-tx-1")?.endDate || "Monday, Jun 22, 2026"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

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
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                          isSelected
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
                          className={`h-9 sm:h-11 rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center justify-center select-none ${
                            isSelected
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
