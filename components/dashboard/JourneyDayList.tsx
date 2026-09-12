"use client";

import React from "react";
import Link from "next/link";
import { Check, Lock, PlayCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  JOURNEY_PHASES,
  JourneyDay,
  PHASE_ORDER,
} from "@/lib/dialysisJourneyData";
import type { JourneyDayProgress } from "@/lib/useJourneyProgress";

/**
 * The "all days" rail shown beside the player. Days are grouped by week so the
 * list stays scannable at 21 entries.
 */
export default function JourneyDayList({
  days,
  activeSlug,
  getProgress,
  onNavigate,
}: {
  days: JourneyDay[];
  activeSlug: string;
  getProgress: (slug: string) => JourneyDayProgress;
  /** Lets the mobile drawer close itself once a day is picked. */
  onNavigate?: () => void;
}) {
  const { language, dictionary } = useLanguage();
  const isEs = language === "ES";
  const j = dictionary?.educationJourney;

  return (
    <nav aria-label={j?.allDays || "All days"} className="flex flex-col gap-5">
      {PHASE_ORDER.map((phaseKey) => {
        const phase = JOURNEY_PHASES[phaseKey];
        const phaseDays = days.filter((day) => day.phase === phaseKey);
        if (phaseDays.length === 0) return null;

        const phaseComplete = phaseDays.filter(
          (day) => getProgress(day.slug).status === "completed",
        ).length;

        return (
          <section key={phaseKey}>
            <div className="flex items-baseline justify-between gap-2 px-1">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {isEs ? phase.labelEs : phase.labelEn}
              </h3>
              <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                {phaseComplete}/{phaseDays.length}
              </span>
            </div>

            <ul className="mt-2 flex flex-col gap-1">
              {phaseDays.map((day) => {
                const state = getProgress(day.slug);
                const isActive = day.slug === activeSlug;
                const isDone = state.status === "completed";

                return (
                  <li key={day.slug}>
                    <Link
                      href={`/dashboard/education-center/${day.slug}`}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={`group flex items-center gap-3 rounded-xl border px-2.5 py-2 transition-colors ${
                        isActive
                          ? "border-blue-200 bg-blue-50"
                          : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                          isDone
                            ? "bg-emerald-500 text-white"
                            : isActive
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                        }`}
                      >
                        {isDone ? <Check className="h-4 w-4" /> : day.day}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-sm font-semibold ${
                            isActive ? "text-blue-700" : "text-slate-800"
                          }`}
                        >
                          {isEs ? day.titleEs : day.titleEn}
                        </span>
                        <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                          {day.durationMinutes} {j?.minutesShort || "min"}
                          {state.status === "in-progress" && state.percent > 0
                            ? ` · ${state.percent}%`
                            : ""}
                        </span>
                      </span>

                      {isActive && (
                        <PlayCircle className="h-4 w-4 shrink-0 text-blue-600" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {days.length === 0 && (
        <p className="flex items-center gap-2 px-2 py-6 text-sm text-slate-500">
          <Lock className="h-4 w-4" />
          {j?.noResults || "No days match your search."}
        </p>
      )}
    </nav>
  );
}
