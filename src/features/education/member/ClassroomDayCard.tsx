"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Check,
  ClipboardCheck,
  Headphones,
  Play,
  PlayCircle,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { ClassroomLesson } from "@/features/education/classroom";
import type { CourseClassKind } from "@/features/education/courseLibrary";
import type { JourneyDayProgress } from "@/features/education/useJourneyProgress";
import { Badge, Progress } from "@/components/ui";

/* The classroom's lesson card, shared by My Classroom and its details page.
   It lives here, not in the page module: a Next.js page file may only export
   the names Next.js allows. */

export const KIND_ICON: Record<CourseClassKind, React.ElementType> = {
  video: PlayCircle,
  audio: Headphones,
  reading: BookOpen,
  exam: ClipboardCheck,
};

export function kindLabel(
  kind: CourseClassKind,
  j: Record<string, string> | undefined,
): string {
  if (kind === "audio") return j?.typeAudio || "Audio";
  if (kind === "reading") return j?.typeReading || "Reading";
  if (kind === "exam") return j?.typeExam || "Exam";
  return j?.typeVideo || "Video";
}

export function DayCard({
  day,
  state,
  itemWord,
}: {
  day: ClassroomLesson;
  state: JourneyDayProgress;
  /** The course's word for a lesson: "Day", "Lesson"… */
  itemWord: string;
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
      className="group flex flex-col rounded-card border border-line bg-surface p-6 transition-colors duration-150 ease-standard hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="relative aspect-[324/182] max-w-full overflow-hidden rounded-card bg-surface-sunken">
        {day.poster ? (
          <Image
            src={day.poster}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : null}
        <span className="absolute top-2 left-2 inline-flex h-7 items-center rounded-control-small bg-surface-inverse px-inset-xs text-label-sm text-fg-inverse">
          {day.kind === "exam"
            ? isEs
              ? "Examen"
              : "Exam"
            : `${itemWord} ${day.day}`}
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
          className="absolute top-1/2 left-1/2 flex h-[50px] w-[50px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill bg-surface/90 text-fg-brand transition-transform duration-150 ease-standard group-hover:scale-105"
        >
          <Play className="ml-0.5 h-6 w-6" />
        </span>
      </div>

      <h3 className="mt-6 text-heading-4 text-fg">
        {isEs ? day.titleEs : day.titleEn}
      </h3>
      <p className="mt-0.5 line-clamp-2 text-body-md text-fg-muted">
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
