"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Calendar, CheckCircle2, ChevronDown, Plus, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import { MetricCards } from "@/features/personal-log/fluid/MetricCards";
import { RecentEntries } from "@/features/personal-log/fluid/RecentEntries";
import { AddWeightLogModal } from "@/features/personal-log/fluid/AddWeightLogModal";
import { EditEdwModal } from "@/features/personal-log/fluid/EditEdwModal";
import { WeightTrendChart } from "@/features/personal-log/fluid/panels/WeightTrendChart";
import { GoalProgress } from "@/features/personal-log/fluid/panels/GoalProgress";
import { FluidIntakeTrend } from "@/features/personal-log/fluid/panels/FluidIntakeTrend";
import { UrinaryOutput } from "@/features/personal-log/fluid/panels/UrinaryOutput";
import { AlertsInsights } from "@/features/personal-log/fluid/panels/AlertsInsights";
import { SEED_ENTRIES } from "@/features/personal-log/fluid/fluid.seed";
import type { WeightFluidEntry } from "@/features/personal-log/fluid/fluid.types";

/* ==========================================================================
   Weight & Fluid Tracker
   --------------------------------------------------------------------------
   This file is the page: state, layout, and which piece goes where. The
   pieces themselves live in features/personal-log/fluid — it was 2,384 lines
   with a 717-line modal in the middle of it.

   Two things about this screen are worth knowing before changing it, because
   neither is visible from here:

     1. Nothing is persisted. `entries` is component state, so a member who
        logs a weight and refreshes has lost it. Every other log in the app
        goes through the data layer; this one never did, because it never
        touched localStorage for step 5 to find.

     2. The five panels below — weight trend, goal progress, fluid intake,
        urinary output, alerts — take no props and render fixed numbers.
        They do not reflect anything the member has logged, and they are
        hand-drawn divs rather than the chart components, so a screen reader
        gets nothing from them at all.

   Both are noted rather than fixed here: the first needs a decision about
   what a real entry looks like, the second needs the first.
   ========================================================================== */

export default function FluidTrackerPage() {
  const { language, dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  const [entries, setEntries] = useState<WeightFluidEntry[]>(SEED_ENTRIES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdwModalOpen, setIsEdwModalOpen] = useState(false);

  // Unit toggle state: "kg" or "lbs", defaulting to "kg" as in screenshot
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");

  // EDW and Today's weight values stored in kg
  const [edwKg, setEdwKg] = useState<number>(72.5);
  const [todayWeightKg, setTodayWeightKg] = useState<number>(72.9);
  const [edwNote, setEdwNote] = useState<string>("Set by care team.");
  const [todayDateStr, setTodayDateStr] = useState<string>("May 31, 7:30 AM");

  const handleSaveEntry = (newEntry: WeightFluidEntry) => {
    setEntries([newEntry, ...entries]);
    setIsModalOpen(false);
    // If a morning weight is logged, sync it as Today's weight
    const weightVal = parseFloat(newEntry.morning);
    if (!isNaN(weightVal) && weightVal > 0) {
      if (unit === "kg") {
        setTodayWeightKg(parseFloat(weightVal.toFixed(1)));
      } else {
        setTodayWeightKg(parseFloat((weightVal / 2.20462).toFixed(1)));
      }
      setTodayDateStr(
        language === "ES"
          ? "Hoy, " +
              new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
          : "Today, " +
              new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
      );
    }
  };

  const handleSaveEdwSettings = (data: {
    edwKg: number;
    todayWeightKg: number;
    edwNote: string;
    todayDateStr: string;
  }) => {
    setEdwKg(data.edwKg);
    setTodayWeightKg(data.todayWeightKg);
    setEdwNote(data.edwNote);
    setTodayDateStr(data.todayDateStr);
  };

  // Date Picker filter state: "today" or "custom"
  const [selectedDateFilter, setSelectedDateFilter] = useState<
    "today" | "custom"
  >("today");
  const [selectedCustomDate, setSelectedCustomDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setIsDatePickerOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDatePickerOpen(false);
      }
    }
    if (isDatePickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDatePickerOpen]);

  const displayDateText = useMemo(() => {
    if (selectedDateFilter === "today") {
      return language === "ES" ? "Hoy" : "Today";
    }
    if (selectedDateFilter === "custom" && selectedCustomDate) {
      const parts = selectedCustomDate.split("-");
      if (parts.length === 3) {
        const d = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2]),
        );
        return d.toLocaleDateString(language === "ES" ? "es-ES" : "en-US", {
          month: "short",
          day: "numeric",
        });
      }
    }
    return language === "ES" ? "Hoy" : "Today";
  }, [selectedDateFilter, selectedCustomDate, language]);

  return (
    <div className="space-y-4">
      <PersonalLogDisclaimer />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] leading-none font-medium text-fg sm:text-[32px]">
            {w?.title || "Weight & Fluid Management Center"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
          {/* Unit Switcher: kg / lbs */}
          <div className="flex h-10 items-center rounded-xl border border-line bg-[var(--color-gray-100)] p-1 shadow-control sm:h-12">
            <button
              type="button"
              onClick={() => setUnit("kg")}
              className={`h-full cursor-pointer rounded-lg px-2.5 text-xs font-bold transition-all sm:px-3 sm:text-sm ${
                unit === "kg"
                  ? "bg-surface text-fg-brand shadow-control"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              kg
            </button>
            <button
              type="button"
              onClick={() => setUnit("lbs")}
              className={`h-full cursor-pointer rounded-lg px-2.5 text-xs font-bold transition-all sm:px-3 sm:text-sm ${
                unit === "lbs"
                  ? "bg-surface text-fg-brand shadow-control"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              lbs
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary-solid px-3 text-xs font-bold tracking-[0.08px] whitespace-nowrap text-white shadow-control transition-colors hover:bg-primary-solid-hover active:scale-[0.98] sm:h-12 sm:gap-2 sm:px-4 sm:text-base"
          >
            <Plus className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            <span>{w?.recentEntries?.addNewEntry || "New Entry"}</span>
          </button>

          {/* Date Picker Selector with Today & Custom Date Options */}
          <div className="relative" ref={datePickerRef}>
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className={`flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold tracking-[0.08px] whitespace-nowrap transition-all sm:h-12 sm:gap-2 sm:px-4 sm:text-base ${
                isDatePickerOpen
                  ? "border-primary-edge bg-primary-soft/50 text-fg-brand shadow-control"
                  : "border-line bg-[var(--color-gray-50)] text-fg hover:bg-surface"
              }`}
            >
              <Calendar className="h-4 w-4 shrink-0 text-fg-secondary sm:h-5 sm:w-5" />
              <span>{displayDateText}</span>
              <ChevronDown
                className={`h-3 w-3 text-fg-muted transition-transform duration-200 sm:h-3.5 sm:w-3.5 ${
                  isDatePickerOpen ? "rotate-180 text-fg-brand" : ""
                }`}
              />
            </button>

            {/* Floating Date Picker Dropdown Popover */}
            {isDatePickerOpen && (
              <div className="animate-in fade-in zoom-in-95 absolute top-full right-0 z-50 mt-2 w-72 rounded-card border border-line bg-surface p-3.5 shadow-xl duration-150 sm:w-80 sm:p-4">
                {/* Header with Title and Close */}
                <div className="mb-2.5 flex items-center justify-between border-b border-line-subtle pb-2.5">
                  <span className="text-[11px] font-bold tracking-wider text-fg-muted uppercase sm:text-xs">
                    {language === "ES" ? "Seleccionar Fecha" : "Select Date"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(false)}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg text-fg-subtle transition-colors hover:bg-surface-sunken hover:text-fg-muted"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Quick Selection: Today Option */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDateFilter("today");
                      setIsDatePickerOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl p-2.5 text-left transition-all sm:p-3 ${
                      selectedDateFilter === "today"
                        ? "border border-primary-soft-line bg-primary-soft text-primary-fg"
                        : "border border-transparent text-fg-secondary hover:bg-surface-sunken"
                    }`}
                  >
                    <div className="flex items-center gap-inline-md">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          selectedDateFilter === "today"
                            ? "bg-primary-solid text-white shadow-control"
                            : "bg-surface-sunken text-fg-muted"
                        }`}
                      >
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs leading-tight font-bold sm:text-sm">
                          {language === "ES"
                            ? "Hoy (Fecha actual)"
                            : "Today (Current Date)"}
                        </div>
                        <div className="text-[11px] font-medium text-fg-muted">
                          {new Date().toLocaleDateString(
                            language === "ES" ? "es-ES" : "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedDateFilter === "today" && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-fg-brand" />
                    )}
                  </button>
                </div>

                {/* Divider: Custom Date Picker */}
                <div className="mt-3 border-t border-line-subtle pt-3">
                  <label className="mb-1.5 block text-xs font-bold text-fg-secondary">
                    {language === "ES"
                      ? "Elegir Fecha (Date Picker):"
                      : "Pick Date (Date Picker):"}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={selectedCustomDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedCustomDate(e.target.value);
                          setSelectedDateFilter("custom");
                        }
                      }}
                      onClick={(e) => {
                        try {
                          (e.target as HTMLInputElement).showPicker?.();
                        } catch {}
                      }}
                      className="w-full cursor-pointer rounded-xl border border-line bg-surface-sunken px-3 py-2 text-xs font-semibold text-fg-secondary transition-colors outline-none hover:bg-surface focus:border-primary-edge focus:bg-surface focus:ring-1 focus:ring-ring sm:text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDateFilter("custom");
                      setIsDatePickerOpen(false);
                    }}
                    className="mt-2.5 flex w-full cursor-pointer items-center justify-center rounded-xl bg-primary-solid py-2 text-xs font-bold text-white shadow-control transition-colors hover:bg-primary-solid-hover active:scale-[0.98]"
                  >
                    {language === "ES" ? "Aplicar Fecha" : "Apply Date"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <MetricCards
        unit={unit}
        edwKg={edwKg}
        todayWeightKg={todayWeightKg}
        edwNote={edwNote}
        todayDateStr={todayDateStr}
        onOpenEdwModal={() => setIsEdwModalOpen(true)}
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <WeightTrendChart />
        <GoalProgress />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,540px)_minmax(240px,262px)_minmax(240px,1fr)]">
        <FluidIntakeTrend />
        <UrinaryOutput />
        <AlertsInsights />
      </section>

      <RecentEntries
        entries={entries}
        onOpenAddModal={() => setIsModalOpen(true)}
      />

      {/* Entry New Weight Log Modal */}
      <AddWeightLogModal
        key={isModalOpen ? "weight-open" : "weight-closed"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEntry}
        edwKg={edwKg}
        unit={unit}
      />

      {/* Quick Edit EDW & Weight Settings Modal */}
      <EditEdwModal
        key={isEdwModalOpen ? "edw-open" : "edw-closed"}
        isOpen={isEdwModalOpen}
        onClose={() => setIsEdwModalOpen(false)}
        edwKg={edwKg}
        todayWeightKg={todayWeightKg}
        edwNote={edwNote}
        unit={unit}
        onSave={handleSaveEdwSettings}
      />
    </div>
  );
}
