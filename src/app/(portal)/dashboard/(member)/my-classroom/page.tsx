"use client";

import React from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  ClipboardCheck,
  Clock,
  Layers,
  LayoutList,
  NotebookPen,
  Play,
  PlayCircle,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  courseWords,
  formatMinutes,
  useClassroom,
} from "@/features/education/classroom";
import {
  bestAttempt,
  FINAL_QUIZ_KEY,
} from "@/features/education/questions.rules";
import { useJourneyProgress } from "@/features/education/useJourneyProgress";
import { useLearnerRecord } from "@/features/education/useLearnerRecord";
import { useLearnerCourse } from "@/features/education/useLearnerCourse";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  buttonStyles,
  Card,
  EmptyState,
  Progress,
  SectionTitle,
  Skeleton,
} from "@/components/ui";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { MyHospitalCourse } from "@/features/hospital/MyHospitalCourse";
import { PageTitle } from "@/components/layout/PageTitle";

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
  const record = useLearnerCourse(course);
  const words = courseWords(course, isEs);
  const access = progressHook.access;
  const lang = isEs ? "es" : "en";

  const pending =
    classroom.isPending || progressHook.isPending || learner.isPending;
  const readError = classroom.error ?? progressHook.error ?? learner.error;
  const enrollRefused = record.enroll.error;

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-stack-xl">
      <PageTitle href="/dashboard/my-classroom" />

      {/* A course the member's hospital enrolled them in (2026-10-13). */}
      <MyHospitalCourse isEs={isEs} />

      {/* Until the read lands, every figure here would be zero — and "0 of 21
          complete" to someone who finished ten days is worse than a
          skeleton. */}
      <AsyncSection
        pending={pending}
        error={readError}
        onRetry={
          canRetry(readError)
            ? () => {
                classroom.refetch();
                progressHook.refetch();
                learner.refetch();
              }
            : undefined
        }
        errorTitle={errorTitleFor(
          readError,
          isEs ? "Tu salón no cargó" : "Your classroom did not load",
          lang,
        )}
        errorMessage={errorMessageFor(readError, undefined, lang)}
        skeleton={
          <Card className="flex flex-col gap-stack-lg">
            <Skeleton variant="text" width="45%" height={28} />
            <Skeleton variant="text" width="70%" />
            <Skeleton height={12} />
            <Skeleton height={44} width={200} />
          </Card>
        }
      >
        {classroom.missing ? (
          <EmptyState
            icon={<BookOpen aria-hidden="true" />}
            title={
              isEs
                ? "El viaje aún no está disponible"
                : "The journey is not available yet"
            }
            description={
              isEs
                ? "Tu equipo de NephroReach todavía no ha publicado el curso."
                : "The NephroReach team has not published the course yet."
            }
          />
        ) : null}
        {course && access && !access.enrolled ? (
          <Card as="section" aria-labelledby="classroom-start">
            <SectionTitle
              id="classroom-start"
              title={isEs ? course.titleEs || course.titleEn : course.titleEn}
              subtitle={
                isEs
                  ? course.descriptionEs || course.descriptionEn
                  : course.descriptionEn
              }
            />
            {enrollRefused ? (
              <Alert tone="danger">
                {isEs
                  ? "No pudimos inscribirte. Inténtalo de nuevo."
                  : "We could not enroll you. Please try again."}
              </Alert>
            ) : null}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => record.enroll.mutate()}
                loading={record.enroll.isPending}
              >
                <Play aria-hidden="true" className="fill-current" />
                {isEs ? "Empezar el viaje" : "Start the journey"}
              </Button>
            </div>
          </Card>
        ) : null}
        {course && access && access.enrolled ? (
          <div className="space-y-stack-xl">
            {!access.open ? (
              <Alert tone="info" live={false}>
                {access.accessUntil
                  ? isEs
                    ? `Tu acceso terminó el ${new Date(access.accessUntil).toLocaleDateString("es-ES")}. Puedes ver tu progreso, pero no guardar cambios.`
                    : `Your access ended on ${new Date(access.accessUntil).toLocaleDateString("en-US")}. You can see your progress but not save changes.`
                  : isEs
                    ? "Tu acceso a este curso terminó. Puedes ver tu progreso, pero no guardar cambios."
                    : "Your access to this course has ended. You can see your progress but not save changes."}
              </Alert>
            ) : access.accessUntil ? (
              <Alert tone="info" live={false}>
                {isEs
                  ? `Tu acceso termina el ${new Date(access.accessUntil).toLocaleDateString("es-ES")}.`
                  : `Your access ends on ${new Date(access.accessUntil).toLocaleDateString("en-US")}.`}
              </Alert>
            ) : null}
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
                /* The server's reckoning, never the browser's. */
                const status = learner.certificateStatus;
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
