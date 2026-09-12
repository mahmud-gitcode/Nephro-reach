"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Check,
  Clock,
  Headphones,
  Layers,
  LayoutList,
  Play,
  PlayCircle,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  formatTotalDuration,
  JourneyDay,
  JourneyMediaKind,
  TOTAL_JOURNEY_DAYS,
  TOTAL_JOURNEY_MINUTES,
  TOTAL_JOURNEY_MODULES,
} from "@/lib/dialysisJourneyData";
import {
  JourneyDayProgress,
  useJourneyProgress,
} from "@/lib/useJourneyProgress";

export const KIND_ICON: Record<JourneyMediaKind, React.ElementType> = {
  video: PlayCircle,
  audio: Headphones,
  reading: BookOpen,
};

export function kindLabel(
  kind: JourneyMediaKind,
  j: Record<string, string> | undefined,
): string {
  if (kind === "audio") return j?.typeAudio || "Audio";
  if (kind === "reading") return j?.typeReading || "Reading";
  return j?.typeVideo || "Video";
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

  const stats = [
    {
      icon: Layers,
      value: TOTAL_JOURNEY_MODULES,
      label: j?.modulesLabel || "modules",
    },
    {
      icon: PlayCircle,
      value: TOTAL_JOURNEY_DAYS,
      label: j?.classesLabel || "classes",
    },
    {
      icon: Clock,
      value: formatTotalDuration(TOTAL_JOURNEY_MINUTES),
      label: j?.totalLengthLabel || "total",
    },
  ];

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
        {j?.title || "21-Day Dialysis Journey"}
      </h1>

      <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base max-w-3xl">
        {j?.subtitle ||
          "One short lesson a day for three weeks, with a transcript and handouts you can bring to your next appointment."}
      </p>

      <ul className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4">
        {stats.map((stat) => (
          <li
            key={stat.label}
            className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-1.5 text-xs sm:text-sm text-slate-600"
          >
            <stat.icon className="h-4 w-4 shrink-0 text-blue-600" />
            <span className="font-bold text-slate-900">{stat.value}</span>
            <span>{stat.label}</span>
          </li>
        ))}
      </ul>

      {/* Full-width progress bar */}
      <div className="mt-6 w-full">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-slate-700">{progressLabel}</p>
          <span className="shrink-0 text-sm font-bold text-blue-600">
            {overallPercent}%
          </span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-[width] duration-500"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
      </div>

      {/* Buttons: Continue / Start Day 1 & View Details side-by-side */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={`/dashboard/education-center/${nextDay.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 sm:py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 cursor-pointer"
        >
          <Play className="h-4 w-4 fill-current" />
          {hasStarted
            ? `${j?.continueCta || "Continue"} · ${j?.dayLabel || "Day"} ${nextDay.day}`
            : j?.startCta || "Start Day 1"}
        </Link>

        <Link
          href="/dashboard/education-center/details"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 sm:py-3 text-sm font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 active:scale-95 cursor-pointer"
        >
          <LayoutList className="h-4 w-4 text-slate-500" />
          {j?.viewDetails || "View Details"}
        </Link>
      </div>
    </section>
  );
}

export function DayCard({
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
  const KindIcon = KIND_ICON[day.kind];

  const statusLabel = isComplete
    ? j?.completed || "Completed"
    : state.status === "in-progress"
      ? j?.inProgress || "In progress"
      : j?.notStarted || "Not started";

  return (
    <Link
      href={`/dashboard/education-center/${day.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_0_60px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_0_60px_rgba(0,0,0,0.12)]"
    >
      <div className="relative aspect-[324/182] overflow-hidden rounded-2xl bg-slate-100">
        <Image
          src={day.poster}
          alt=""
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
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
        <span className="flex items-center gap-1.5 text-slate-500">
          <KindIcon className="h-3.5 w-3.5 shrink-0" />
          <span>{kindLabel(day.kind, j)}</span>
          <span aria-hidden="true">·</span>
          <span>
            {day.durationMinutes} {j?.minutesShort || "min"}
          </span>
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
  const {
    completedCount,
    overallPercent,
    nextDay,
    hasStarted,
  } = useJourneyProgress();

  return (
    <div className="space-y-6">
      <JourneyHero
        completedCount={completedCount}
        overallPercent={overallPercent}
        nextDay={nextDay}
        hasStarted={hasStarted}
      />
    </div>
  );
}
