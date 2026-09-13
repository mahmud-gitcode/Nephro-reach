"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Filter } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  JOURNEY_DAYS,
  JourneyPhaseKey,
} from "@/lib/dialysisJourneyData";
import { useJourneyProgress } from "@/lib/useJourneyProgress";
import { DayCard } from "../page";

type StatusFilter = "all" | "in-progress" | "completed" | "not-started";
type ModuleTab = "all" | JourneyPhaseKey;

function EducationCenterDetailsContent() {
  const { language, dictionary } = useLanguage();
  const isEs = language === "ES";
  const j = dictionary?.educationJourney;

  const searchParams = useSearchParams();
  const initialModule = (searchParams.get("module") as JourneyPhaseKey) || "all";

  const { getProgress, progress } = useJourneyProgress();

  const [moduleTab, setModuleTab] = useState<ModuleTab>(
    ["foundation", "routine", "nutrition", "living"].includes(initialModule)
      ? (initialModule as ModuleTab)
      : "all",
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const tabs: Array<{ key: ModuleTab; label: string }> = [
    {
      key: "all",
      label: j?.allClassesTab || (isEs ? "Todas las clases" : "All Classes"),
    },
    {
      key: "foundation",
      label: isEs ? "Módulo 1" : "Module 1",
    },
    {
      key: "routine",
      label: isEs ? "Módulo 2" : "Module 2",
    },
    {
      key: "nutrition",
      label: isEs ? "Módulo 3" : "Module 3",
    },
    {
      key: "living",
      label: isEs ? "Módulo 4" : "Module 4",
    },
  ];

  const visibleDays = useMemo(
    () =>
      JOURNEY_DAYS.filter((day) => {
        if (moduleTab !== "all" && day.phase !== moduleTab) return false;
        const status = progress[day.slug]?.status ?? "not-started";
        return statusFilter === "all" || status === statusFilter;
      }),
    [moduleTab, statusFilter, progress],
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Back Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/education-center"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>
              {j?.backToEducationCenter ||
                (isEs ? "Volver al Centro Educativo" : "Back to Education Center")}
            </span>
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {j?.allClassesTab || (isEs ? "Todas las Clases y Módulos" : "All Classes & Modules")}
          </h1>
        </div>
      </div>

      {/* Tabs and Filter Bar */}
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between shadow-xs">
        {/* Simple Tabs without count numbers */}
        <div
          role="tablist"
          aria-label={j?.modulesLabel || "modules"}
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={tab.key === moduleTab}
              onClick={() => setModuleTab(tab.key)}
              className={`flex h-[38px] shrink-0 items-center rounded-xl border px-4 text-sm font-medium transition-colors cursor-pointer ${
                tab.key === moduleTab
                  ? "border-blue-600 bg-blue-600 font-bold text-white shadow-xs"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex shrink-0 items-center gap-2">
          <Filter className="h-4 w-4 shrink-0 text-slate-500" />
          <label htmlFor="journey-status-filter" className="sr-only">
            {j?.filterLabel || "Filter classes"}
          </label>
          <select
            id="journey-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            className="h-[38px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-colors hover:bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
          >
            <option value="all">{j?.filterAll || (isEs ? "Todos los días" : "All days")}</option>
            <option value="completed">{j?.completed || (isEs ? "Completado" : "Completed")}</option>
            <option value="in-progress">
              {j?.inProgress || (isEs ? "En progreso" : "In progress")}
            </option>
            <option value="not-started">
              {j?.notStarted || (isEs ? "Sin comenzar" : "Not started")}
            </option>
          </select>
        </div>
      </section>

      {/* Class Cards Grid (max 4 cards per row) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleDays.map((day) => (
          <DayCard
            key={day.slug}
            day={day}
            state={getProgress(day.slug)}
          />
        ))}
      </div>

      {visibleDays.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <p className="text-base font-semibold text-slate-700">
            {j?.noResults ||
              (isEs
                ? "Ninguna clase coincide con este filtro."
                : "No classes match this filter.")}
          </p>
          <button
            type="button"
            onClick={() => {
              setModuleTab("all");
              setStatusFilter("all");
            }}
            className="mt-3 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
          >
            {isEs ? "Restablecer filtros" : "Reset filters"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function EducationCenterDetailsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading classes...</div>}>
      <EducationCenterDetailsContent />
    </Suspense>
  );
}
