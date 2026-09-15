"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Headphones,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  PlayCircle,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  JOURNEY_PHASES,
  JourneyDay,
  JourneyMediaKind,
  JourneyPhaseKey,
  PHASE_ORDER,
} from "@/features/education/dialysisJourneyData";
import type { JourneyDayProgress } from "@/features/education/useJourneyProgress";
import { Progress } from "@/components/ui";

const KIND_ICON: Record<JourneyMediaKind, React.ElementType> = {
  video: PlayCircle,
  audio: Headphones,
  reading: BookOpen,
};

function kindLabel(
  kind: JourneyMediaKind,
  j: Record<string, string> | undefined,
): string {
  if (kind === "audio") return j?.typeAudio || "Audio";
  if (kind === "reading") return j?.typeReading || "Reading";
  return j?.typeVideo || "Video";
}

/** Narrow strip shown in place of the rail once it is minimised. */
function CollapsedRail({
  days,
  activeSlug,
  getProgress,
  completedCount,
  totalDays,
  onExpand,
}: {
  days: JourneyDay[];
  activeSlug: string;
  getProgress: (slug: string) => JourneyDayProgress;
  completedCount: number;
  totalDays: number;
  onExpand: () => void;
}) {
  const { language, dictionary } = useLanguage();
  const isEs = language === "ES";
  const j = dictionary?.educationJourney;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col items-center gap-1.5 border-b border-line px-2 py-3">
        <button
          type="button"
          onClick={onExpand}
          title={j?.expandSidebar || "Expand day list"}
          aria-label={j?.expandSidebar || "Expand day list"}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg-secondary"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
        <span className="text-[11px] font-bold text-fg-muted tabular-nums">
          {completedCount}/{totalDays}
        </span>
      </div>

      <ol className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {days.map((day) => {
          const state = getProgress(day.slug);
          const isActive = day.slug === activeSlug;
          const isDone = state.status === "completed";
          const title = `${j?.dayLabel || "Day"} ${day.day} · ${
            isEs ? day.titleEs : day.titleEn
          }`;

          return (
            <li key={day.slug}>
              <Link
                href={`/dashboard/my-classroom/${day.slug}`}
                title={title}
                aria-label={title}
                aria-current={isActive ? "page" : undefined}
                className={`flex h-9 w-full items-center justify-center rounded-control text-xs font-bold transition-colors ${
                  isDone
                    ? "bg-success-600 text-white"
                    : isActive
                      ? "bg-primary-solid text-primary-on-solid"
                      : "bg-surface-sunken text-fg-muted hover:bg-line"
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : day.day}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * The "all days" rail shown beside the player.
 *
 * The progress summary and each week heading stay put while only the day rows
 * scroll; weeks collapse individually, and the whole rail can be minimised to
 * a strip of day numbers.
 */
export default function JourneyDayList({
  days,
  activeSlug,
  getProgress,
  completedCount,
  totalDays,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: {
  days: JourneyDay[];
  activeSlug: string;
  getProgress: (slug: string) => JourneyDayProgress;
  completedCount: number;
  totalDays: number;
  /** Renders the narrow strip instead of the full rail. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Lets the mobile drawer close itself once a day is picked. */
  onNavigate?: () => void;
}) {
  const { language, dictionary } = useLanguage();
  const isEs = language === "ES";
  const j = dictionary?.educationJourney;

  const [closedWeeks, setClosedWeeks] = useState<JourneyPhaseKey[]>([]);

  const toggleWeek = (phaseKey: JourneyPhaseKey) => {
    setClosedWeeks((current) =>
      current.includes(phaseKey)
        ? current.filter((key) => key !== phaseKey)
        : [...current, phaseKey],
    );
  };

  const overallPercent = Math.round((completedCount / totalDays) * 100);

  if (collapsed && onToggleCollapse) {
    return (
      <CollapsedRail
        days={days}
        activeSlug={activeSlug}
        getProgress={getProgress}
        completedCount={completedCount}
        totalDays={totalDays}
        onExpand={onToggleCollapse}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-line px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate text-xs font-bold tracking-wide text-fg-muted uppercase">
            {j?.yourProgress || "Your progress"}
          </h2>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={j?.collapseSidebar || "Minimise day list"}
              aria-label={j?.collapseSidebar || "Minimise day list"}
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-control text-fg-subtle transition-colors hover:bg-surface-sunken hover:text-fg-secondary"
            >
              <PanelLeftClose className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        <p className="mt-1 text-sm font-bold text-fg">
          {completedCount}/{totalDays} {j?.daysLabel || "days"}
        </p>
        <Progress
          value={overallPercent}
          label={`${completedCount} of ${totalDays} days complete`}
          tone="success"
          className="mt-stack-sm"
        />
      </header>

      <nav
        aria-label={j?.allDays || "All days"}
        className="min-h-0 flex-1 overflow-y-auto pb-3"
      >
        {PHASE_ORDER.map((phaseKey) => {
          const phase = JOURNEY_PHASES[phaseKey];
          const phaseDays = days.filter((day) => day.phase === phaseKey);
          if (phaseDays.length === 0) return null;

          const phaseComplete = phaseDays.filter(
            (day) => getProgress(day.slug).status === "completed",
          ).length;
          const isOpen = !closedWeeks.includes(phaseKey);
          const panelId = `journey-week-${phaseKey}`;

          return (
            <section key={phaseKey}>
              {/* Stays pinned to the top of the scroll area while days pass under it. */}
              <h3 className="sticky top-0 z-10 bg-surface">
                <button
                  type="button"
                  onClick={() => toggleWeek(phaseKey)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full cursor-pointer items-center gap-2 border-b border-line-subtle px-4 py-2.5 text-left transition-colors hover:bg-surface-sunken"
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-fg-subtle" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-fg-subtle" />
                  )}

                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold tracking-wider text-fg-brand uppercase">
                      {isEs ? phase.moduleEs : phase.moduleEn}
                    </span>
                    <span className="block truncate text-base leading-6 font-semibold text-fg">
                      {isEs ? phase.titleEs : phase.titleEn}
                    </span>
                  </span>

                  <span className="shrink-0 rounded-pill bg-surface-sunken px-2 py-0.5 text-[11px] font-bold text-fg-muted">
                    {phaseComplete}/{phaseDays.length}
                  </span>
                </button>
              </h3>

              {isOpen && (
                <ul id={panelId} className="flex flex-col gap-1 px-3 py-2">
                  {phaseDays.map((day) => {
                    const state = getProgress(day.slug);
                    const isActive = day.slug === activeSlug;
                    const isDone = state.status === "completed";
                    const KindIcon = KIND_ICON[day.kind];

                    return (
                      <li key={day.slug}>
                        <Link
                          href={`/dashboard/my-classroom/${day.slug}`}
                          onClick={onNavigate}
                          aria-current={isActive ? "page" : undefined}
                          className={`group flex items-start gap-3 rounded-control border px-3 py-2.5 transition-colors ${
                            isActive
                              ? "border-primary-soft-line bg-primary-soft"
                              : "border-transparent hover:border-line hover:bg-surface-sunken"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-xs font-bold transition-colors ${
                              isDone
                                ? "bg-success-600 text-white"
                                : isActive
                                  ? "bg-primary-solid text-primary-on-solid"
                                  : "bg-surface-sunken text-fg-muted group-hover:bg-line"
                            }`}
                          >
                            {isDone ? <Check className="h-4 w-4" /> : day.day}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-sm leading-5 font-semibold ${
                                isActive ? "text-fg-brand" : "text-fg-secondary"
                              }`}
                            >
                              {isEs ? day.titleEs : day.titleEn}
                            </span>

                            <span className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-fg-muted">
                              <KindIcon className="h-3.5 w-3.5 shrink-0" />
                              <span>{kindLabel(day.kind, j)}</span>
                              <span aria-hidden="true">·</span>
                              <span>
                                {day.durationMinutes} {j?.minutesShort || "min"}
                              </span>
                              {state.status === "in-progress" &&
                                state.percent > 0 && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-bold text-fg-brand">
                                      {state.percent}%
                                    </span>
                                  </>
                                )}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}

        {days.length === 0 && (
          <p className="flex items-center gap-2 px-4 py-6 text-sm text-fg-muted">
            <Lock className="h-4 w-4" />
            {j?.noResults || "No days match your search."}
          </p>
        )}
      </nav>
    </div>
  );
}
