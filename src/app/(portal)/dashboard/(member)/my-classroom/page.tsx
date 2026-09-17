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
} from "@/features/education/dialysisJourneyData";
import {
  JourneyDayProgress,
  useJourneyProgress,
} from "@/features/education/useJourneyProgress";
import {
  AsyncSection,
  Badge,
  buttonStyles,
  Card,
  Skeleton,
} from "@/components/ui";
import { Progress } from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";

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
    <Card as="section" padding="none" className="overflow-hidden p-inset-lg">
      <h2 className="text-heading-4 text-fg">
        {j?.title || "21-Day Dialysis Journey"}
      </h2>

      <p className="mt-0.5 text-body-md text-fg-muted">
        {j?.subtitle ||
          "One short lesson a day for three weeks, with a transcript and handouts you can bring to your next appointment."}
      </p>

      <ul className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4">
        {stats.map((stat) => (
          <li
            key={stat.label}
            className="flex items-center gap-inline-md rounded-control border border-line bg-surface-sunken px-inset-sm py-inset-xs text-body-sm text-fg-muted"
          >
            <stat.icon
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-fg-brand"
            />
            <span className="text-label-md text-fg">{stat.value}</span>
            <span>{stat.label}</span>
          </li>
        ))}
      </ul>

      {/* Full-width progress bar */}
      <div className="mt-6 w-full">
        <div className="flex items-baseline justify-between gap-inline-lg">
          <p className="text-label-md text-fg-secondary">{progressLabel}</p>
          <span className="shrink-0 text-label-md text-fg-brand">
            {overallPercent}%
          </span>
        </div>
        <Progress
          value={overallPercent}
          label={progressLabel}
          size="large"
          className="mt-stack-sm"
        />
      </div>

      {/* Buttons: Continue / Start Day 1 & View Details side-by-side */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={`/dashboard/my-classroom/${nextDay.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonStyles()}
        >
          <Play aria-hidden="true" className="fill-current" />
          {hasStarted
            ? `${j?.continueCta || "Continue"} · ${j?.dayLabel || "Day"} ${nextDay.day}`
            : j?.startCta || "Start Day 1"}
        </Link>

        <Link
          href="/dashboard/my-classroom/details"
          className={buttonStyles({
            variant: "neutral",
            appearance: "fill-stroke",
          })}
        >
          <LayoutList aria-hidden="true" />
          {j?.viewDetails || "View Details"}
        </Link>
      </div>
    </Card>
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
      href={`/dashboard/my-classroom/${day.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-card border border-line bg-surface p-inset-md shadow-card transition-shadow duration-150 ease-standard hover:shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="relative aspect-[324/182] max-w-full overflow-hidden rounded-card bg-surface-sunken">
        <Image
          src={day.poster}
          alt=""
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
        <span className="absolute top-2 left-2 inline-flex h-7 items-center rounded-control-small bg-surface-inverse px-inset-xs text-label-sm text-fg-inverse">
          {j?.dayLabel || "Day"} {day.day}
        </span>

        {isComplete && (
          <Badge
            tone="success"
            variant="solid"
            className="absolute top-2 right-2"
            icon={<Check aria-hidden="true" />}
          >
            {j?.completed || "Completed"}
          </Badge>
        )}

        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 flex h-[50px] w-[50px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill bg-surface/90 text-fg-brand shadow-card transition-transform duration-150 ease-standard group-hover:scale-105"
        >
          <Play className="ml-0.5 h-6 w-6" />
        </span>
      </div>

      <h3 className="mt-stack-lg text-heading-5 text-fg">
        {isEs ? day.titleEs : day.titleEn}
      </h3>
      <p className="mt-stack-xs line-clamp-2 text-body-sm text-fg-muted">
        {isEs ? day.summaryEs : day.summaryEn}
      </p>

      <div className="mt-stack-lg flex flex-wrap items-center justify-between gap-inline-md text-label-sm">
        <span
          className={
            isComplete
              ? "text-success"
              : state.status === "in-progress"
                ? "text-fg-brand"
                : "text-fg-muted"
          }
        >
          {statusLabel}
        </span>
        <span className="flex items-center gap-inline-sm text-fg-muted">
          <KindIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          <span>{kindLabel(day.kind, j)}</span>
          <span aria-hidden="true">·</span>
          <span>
            {day.durationMinutes} {j?.minutesShort || "min"}
          </span>
        </span>
      </div>

      <Progress
        value={percent}
        label={statusLabel}
        tone={isComplete ? "success" : "primary"}
        size="small"
        className="mt-stack-sm"
      />
    </Link>
  );
}

export default function MyClassroomPage() {
  const {
    completedCount,
    overallPercent,
    nextDay,
    hasStarted,
    isPending,
    error,
    refetch,
  } = useJourneyProgress();

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-stack-xl">
      <PageTitle href="/dashboard/my-classroom" />

      {/* Until the read lands, every figure here would be zero — and "0 of 21
          complete" to someone who finished ten days is worse than a
          skeleton. */}
      <AsyncSection
        pending={isPending}
        error={error}
        onRetry={refetch}
        errorTitle="Your journey progress did not load"
        skeleton={
          <Card className="flex flex-col gap-stack-lg">
            <Skeleton variant="text" width="45%" height={28} />
            <Skeleton variant="text" width="70%" />
            <Skeleton height={12} />
            <Skeleton height={44} width={200} />
          </Card>
        }
      >
        <JourneyHero
          completedCount={completedCount}
          overallPercent={overallPercent}
          nextDay={nextDay}
          hasStarted={hasStarted}
        />
      </AsyncSection>
    </div>
  );
}
