"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Play, Search, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  JOURNEY_DAYS,
  JOURNEY_PHASES,
  JourneyDay,
  PHASE_ORDER,
  TOTAL_JOURNEY_DAYS,
} from "@/lib/dialysisJourneyData";
import {
  JourneyDayProgress,
  useJourneyProgress,
} from "@/lib/useJourneyProgress";

type StatusFilter = "all" | "in-progress" | "completed" | "not-started";

function ProgressRing({ percent }: { percent: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="relative h-[84px] w-[84px] shrink-0">
      <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90">
        <circle
          cx="42"
          cy="42"
          r={radius}
          fill="none"
          strokeWidth="8"
          className="stroke-white/25"
        />
        <circle
          cx="42"
          cy="42"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className="stroke-white transition-[stroke-dasharray] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
        {percent}%
      </span>
    </div>
  );
}

function JourneyHero({
  completedCount,
  overallPercent,
  nextDay,
  hasStarted,
}: {
  completedCount: number;
  overallPercent: number;
  nextDay: JourneyDay;
  hasStarted: boolean;
}) {
  const { dictionary } = useLanguage();
  const j = dictionary?.educationJourney;

  const progressTemplate =
    j?.progressLabel || "{done} of {total} days complete";
  const progressLabel = progressTemplate
    .replace("{done}", String(completedCount))
    .replace("{total}", String(TOTAL_JOURNEY_DAYS));

  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] p-5 shadow-[0_0_60px_rgba(0,0,0,0.06)] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            <Sparkles className="h-3.5 w-3.5" />
            {j?.badge || "Guided program"}
          </span>
          <h1 className="mt-3 text-[26px] font-semibold leading-tight text-white sm:text-[32px]">
            {j?.title || "21-Day Dialysis Journey"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-100">
            {j?.subtitle ||
              "One short lesson a day for three weeks, with a transcript and handouts you can bring to your next appointment."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <ProgressRing percent={overallPercent} />
          <div>
            <p className="text-sm font-semibold text-white">{progressLabel}</p>
            <Link
              href={`/dashboard/education-center/${nextDay.slug}`}
              className="mt-2.5 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-blue-700 shadow-sm transition-colors hover:bg-blue-50"
            >
              <Play className="h-4 w-4" />
              {hasStarted
                ? `${j?.continueCta || "Continue"} · ${j?.dayLabel || "Day"} ${nextDay.day}`
                : j?.startCta || "Start Day 1"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function DayCard({
  day,
  state,
}: {
  day: JourneyDay;
  state: JourneyDayProgress;
}) {
  const { language, dictionary } = useLanguage();
  const isEs = language === "ES";
  const j = dictionary?.educationJourney;

  const isComplete = state.status === "completed";
  const percent = isComplete ? 100 : state.percent;

  const statusLabel = isComplete
    ? j?.completed || "Completed"
    : state.status === "in-progress"
      ? j?.inProgress || "In progress"
      : j?.notStarted || "Not started";

  return (
    <Link
      href={`/dashboard/education-center/${day.slug}`}
      className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_0_60px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_0_60px_rgba(0,0,0,0.12)]"
    >
      <div className="relative aspect-[324/182] overflow-hidden rounded-2xl bg-slate-100">
        <Image
          src={day.poster}
          alt=""
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(min-width: 1280px) 324px, (min-width: 768px) 33vw, 100vw"
        />
        <span className="absolute left-2 top-2 inline-flex h-7 items-center rounded-lg bg-slate-900/75 px-2.5 text-xs font-bold text-white backdrop-blur-sm">
          {j?.dayLabel || "Day"} {day.day}
        </span>

        {isComplete && (
          <span className="absolute right-2 top-2 inline-flex h-7 items-center gap-1 rounded-lg bg-[#00A63E] px-2 text-xs font-semibold text-white">
            <Check className="h-3.5 w-3.5" />
            {j?.completed || "Completed"}
          </span>
        )}

        <span className="absolute left-1/2 top-1/2 flex h-[50px] w-[50px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-blue-600 shadow-sm transition-transform group-hover:scale-105">
          <Play className="ml-0.5 h-6 w-6" />
        </span>
      </div>

      <h3 className="mt-4 text-lg font-medium leading-7 tracking-[0.09px] text-slate-950">
        {isEs ? day.titleEs : day.titleEn}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
        {isEs ? day.summaryEs : day.summaryEn}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2 text-xs font-semibold">
        <span
          className={
            isComplete
              ? "text-emerald-600"
              : state.status === "in-progress"
                ? "text-blue-600"
                : "text-slate-500"
          }
        >
          {statusLabel}
        </span>
        <span className="text-slate-500">
          {day.durationMinutes} {j?.minutesShort || "min"}
        </span>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            isComplete ? "bg-emerald-500" : "bg-blue-600"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </Link>
  );
}

export default function EducationCenterPage() {
  const { language, dictionary } = useLanguage();
  const isEs = language === "ES";
  const j = dictionary?.educationJourney;

  const {
    getProgress,
    completedCount,
    overallPercent,
    nextDay,
    hasStarted,
    progress,
  } = useJourneyProgress();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filters: Array<{ key: StatusFilter; label: string }> = [
    { key: "all", label: j?.filterAll || "All days" },
    { key: "in-progress", label: j?.inProgress || "In progress" },
    { key: "completed", label: j?.completed || "Completed" },
    { key: "not-started", label: j?.notStarted || "Not started" },
  ];

  const visibleDays = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return JOURNEY_DAYS.filter((day) => {
      const status = progress[day.slug]?.status ?? "not-started";
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!needle) return true;

      const haystack = [
        isEs ? day.titleEs : day.titleEn,
        isEs ? day.summaryEs : day.summaryEn,
        `day ${day.day}`,
        `día ${day.day}`,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [query, statusFilter, progress, isEs]);

  return (
    <div className="space-y-6">
      <JourneyHero
        completedCount={completedCount}
        overallPercent={overallPercent}
        nextDay={nextDay}
        hasStarted={hasStarted}
      />

      <section className="rounded-[14px] bg-white/40 p-4">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={j?.searchPlaceholder || "Search the 21 days..."}
            className="h-10 w-full rounded-lg border border-[#CBD5ED] bg-white pl-10 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setStatusFilter(filter.key)}
              className={`h-[38px] shrink-0 rounded-[10px] border px-4 text-sm font-medium transition-colors cursor-pointer ${
                filter.key === statusFilter
                  ? "border-blue-600 bg-blue-600 font-bold text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {PHASE_ORDER.map((phaseKey) => {
        const phase = JOURNEY_PHASES[phaseKey];
        const phaseDays = visibleDays.filter((day) => day.phase === phaseKey);
        if (phaseDays.length === 0) return null;

        return (
          <section key={phaseKey}>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`h-2.5 w-2.5 rounded-full ${phase.dotClass}`} />
              <h2 className="text-xl font-medium leading-7 text-slate-950">
                {isEs ? phase.labelEs : phase.labelEn}
              </h2>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${phase.chipClass}`}
              >
                {isEs ? phase.rangeEs : phase.rangeEn}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {phaseDays.map((day) => (
                <DayCard
                  key={day.slug}
                  day={day}
                  state={getProgress(day.slug)}
                />
              ))}
            </div>
          </section>
        );
      })}

      {visibleDays.length === 0 && (
        <p className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-500">
          {j?.noResults || "No days match your search."}
        </p>
      )}
    </div>
  );
}
