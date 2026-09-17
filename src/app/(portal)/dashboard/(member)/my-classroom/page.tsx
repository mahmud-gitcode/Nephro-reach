"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Check,
  ClipboardCheck,
  Clock,
  Headphones,
  Layers,
  LayoutList,
  NotebookPen,
  Play,
  PlayCircle,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  certificateStatus,
  ClassroomLesson,
  courseWords,
  formatMinutes,
  useClassroom,
} from "@/features/education/classroom";
import type { CourseClassKind } from "@/features/education/courseLibrary";
import {
  bestAttempt,
  FINAL_QUIZ_KEY,
} from "@/features/education/questions.rules";
import {
  JourneyDayProgress,
  useJourneyProgress,
} from "@/features/education/useJourneyProgress";
import { useLearnerRecord } from "@/features/education/useLearnerRecord";
import {
  AsyncSection,
  Badge,
  buttonStyles,
  Card,
  Progress,
  SectionTitle,
  Skeleton,
} from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";

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

/** A tile in the "finish the course" row. */
function FinishTile({
  href,
  icon: Icon,
  title,
  detail,
  badge,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  detail: string;
  badge?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-stack-sm rounded-card bg-surface-sunken p-inset-lg transition-colors duration-150 ease-standard hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="flex items-center justify-between gap-inline-md">
        <Icon aria-hidden="true" className="h-6 w-6 text-fg-brand" />
        {badge}
      </span>
      <span className="text-label-lg text-fg">{title}</span>
      <span className="text-body-sm text-fg-muted">{detail}</span>
    </Link>
  );
}

export default function MyClassroomPage() {
  const { language, dictionary } = useLanguage();
  const isEs = language === "ES";
  const j = dictionary?.educationJourney;

  const classroom = useClassroom();
  const { course, lessons, groups, totalMinutes } = classroom;
  const progressHook = useJourneyProgress(lessons);
  const { progress, completedCount, overallPercent, nextDay, hasStarted } =
    progressHook;
  const learner = useLearnerRecord();
  const words = courseWords(course, isEs);

  const pending =
    classroom.isPending || progressHook.isPending || learner.isPending;

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-stack-xl">
      <PageTitle href="/dashboard/my-classroom" />

      {/* Until the read lands, every figure here would be zero — and "0 of 21
          complete" to someone who finished ten days is worse than a
          skeleton. */}
      <AsyncSection
        pending={pending}
        error={classroom.error ?? progressHook.error ?? learner.error}
        onRetry={() => {
          classroom.refetch();
          progressHook.refetch();
          learner.refetch();
        }}
        errorTitle="Your classroom did not load"
        skeleton={
          <Card className="flex flex-col gap-stack-lg">
            <Skeleton variant="text" width="45%" height={28} />
            <Skeleton variant="text" width="70%" />
            <Skeleton height={12} />
            <Skeleton height={44} width={200} />
          </Card>
        }
      >
        {course ? (
          <div className="space-y-stack-xl">
            {/* ---- the course ---- */}
            <Card as="section" aria-labelledby="classroom-course">
              <SectionTitle
                id="classroom-course"
                title={isEs ? course.titleEs || course.titleEn : course.titleEn}
                subtitle={
                  isEs
                    ? course.descriptionEs || course.descriptionEn
                    : course.descriptionEn
                }
              />

              <ul className="flex flex-wrap items-center gap-4">
                {[
                  {
                    icon: Layers,
                    value: groups.length,
                    label: `${words.group.toLowerCase()}${groups.length === 1 ? "" : "s"}`,
                  },
                  {
                    icon: PlayCircle,
                    value: lessons.length,
                    label: `${words.item.toLowerCase()}${lessons.length === 1 ? "" : "s"}`,
                  },
                  {
                    icon: Clock,
                    value: formatMinutes(totalMinutes),
                    label: j?.totalLengthLabel || "total",
                  },
                ].map((stat) => (
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

              <div className="mt-6 w-full">
                <div className="flex items-baseline justify-between gap-inline-lg">
                  <p className="text-label-md text-fg-secondary">
                    {isEs
                      ? `${completedCount} de ${lessons.length} completados`
                      : `${completedCount} of ${lessons.length} complete`}
                  </p>
                  <span className="shrink-0 text-label-md text-fg-brand">
                    {overallPercent}%
                  </span>
                </div>
                <Progress
                  value={overallPercent}
                  label={isEs ? "Progreso del curso" : "Course progress"}
                  size="large"
                  className="mt-stack-sm"
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {nextDay ? (
                  <Link
                    href={`/dashboard/my-classroom/${nextDay.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonStyles()}
                  >
                    <Play aria-hidden="true" className="fill-current" />
                    {hasStarted
                      ? `${j?.continueCta || "Continue"} · ${words.item} ${nextDay.day}`
                      : `${isEs ? "Empezar" : "Start"} ${words.item} 1`}
                  </Link>
                ) : null}
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

            {/* ---- modules and their checks ---- */}
            {groups.length > 0 ? (
              <Card as="section" aria-labelledby="classroom-groups">
                <SectionTitle
                  id="classroom-groups"
                  title={
                    isEs
                      ? `Tus ${words.group.toLowerCase()}s`
                      : `Your ${words.group.toLowerCase()}s`
                  }
                />
                <ul className="space-y-4">
                  {groups.map((group) => {
                    const groupLessons = lessons.filter(
                      (lesson) => lesson.groupId === group.id,
                    );
                    const done = groupLessons.filter(
                      (lesson) => progress[lesson.slug]?.status === "completed",
                    ).length;
                    return (
                      <li
                        key={group.id}
                        className="flex flex-col gap-inline-md rounded-card bg-surface-sunken p-inset-md sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-label-sm text-fg-brand">
                            {isEs ? group.labelEs : group.labelEn}
                          </p>
                          <p className="text-label-lg text-fg">
                            {isEs ? group.titleEs : group.titleEn}
                          </p>
                          <div className="mt-stack-sm flex items-center gap-inline-md">
                            <Progress
                              value={
                                groupLessons.length
                                  ? (done / groupLessons.length) * 100
                                  : 0
                              }
                              label={isEs ? group.labelEs : group.labelEn}
                              tone={
                                done === groupLessons.length && done > 0
                                  ? "success"
                                  : "primary"
                              }
                              size="small"
                              className="max-w-[240px] flex-1"
                            />
                            <span className="text-body-sm text-fg-muted tabular-nums">
                              {done}/{groupLessons.length}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ) : null}

            {/* ---- finish the course ---- */}
            <Card as="section" aria-labelledby="classroom-finish">
              <SectionTitle
                id="classroom-finish"
                title={isEs ? "Termina el curso" : "Finish the course"}
              />
              {(() => {
                const status = certificateStatus(
                  course,
                  lessons,
                  progress,
                  learner.attempts,
                );
                const finalBest = bestAttempt(learner.attempts, FINAL_QUIZ_KEY);
                return (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {course.finalExam.length > 0 ? (
                      <FinishTile
                        href="/dashboard/my-classroom/exam"
                        icon={ClipboardCheck}
                        title={isEs ? "Examen final" : "Final exam"}
                        detail={
                          isEs
                            ? `${course.finalExam.length} preguntas · ${course.passMark}% para aprobar`
                            : `${course.finalExam.length} questions · ${course.passMark}% to pass`
                        }
                        badge={
                          status.examPassed ? (
                            <Badge tone="success">
                              {isEs ? "Aprobado" : "Passed"}
                            </Badge>
                          ) : finalBest ? (
                            <Badge tone="warning">{finalBest.percent}%</Badge>
                          ) : null
                        }
                      />
                    ) : null}
                    {course.certificateEnabled ? (
                      <FinishTile
                        href="/dashboard/my-classroom/certificate"
                        icon={Award}
                        title={isEs ? "Certificado" : "Certificate"}
                        detail={
                          status.eligible
                            ? isEs
                              ? "Listo para ver e imprimir"
                              : "Ready to view and print"
                            : isEs
                              ? `${status.lessonsDone} de ${status.lessonsTotal} lecciones hechas`
                              : `${status.lessonsDone} of ${status.lessonsTotal} lessons done`
                        }
                        badge={
                          status.eligible ? (
                            <Badge tone="success">
                              {isEs ? "Desbloqueado" : "Unlocked"}
                            </Badge>
                          ) : (
                            <Badge tone="neutral">
                              {isEs ? "Bloqueado" : "Locked"}
                            </Badge>
                          )
                        }
                      />
                    ) : null}
                    <FinishTile
                      href="/dashboard/my-classroom/workbook"
                      icon={NotebookPen}
                      title={isEs ? "Mi cuaderno" : "My Workbook"}
                      detail={
                        isEs
                          ? "Tus reflexiones y respuestas, listas para imprimir"
                          : "Your reflections and answers, ready to print"
                      }
                    />
                  </div>
                );
              })()}
            </Card>
          </div>
        ) : null}
      </AsyncSection>
    </div>
  );
}
