"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Filter,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { courseWords, useClassroom } from "@/features/education/classroom";
import type {
  ClassroomGroup,
  ClassroomLesson,
} from "@/features/education/classroom";
import type { Course } from "@/features/education/courseLibrary";
import type { QuizAttempt } from "@/features/education/questions.types";
import {
  bestAttempt,
  classQuizKey,
  FINAL_QUIZ_KEY,
  hasPassed,
} from "@/features/education/questions.rules";
import { useJourneyProgress } from "@/features/education/useJourneyProgress";
import { useLearnerRecord } from "@/features/education/useLearnerRecord";
import { NoticeRailLayout } from "@/components/layout/NoticeRailLayout";
import { DayCard } from "../page";
import {
  Button,
  Badge,
  Card,
  EmptyState,
  Select,
  Tabs,
  TabPanel,
} from "@/components/ui";
import type { TabItem } from "@/components/ui";

/** Every exam in the course, in the order a member meets them. */
function CourseExamsRail({
  course,
  lessons,
  groups,
  attempts,
  isEs,
}: {
  course: Course | null | undefined;
  lessons: ClassroomLesson[];
  groups: ClassroomGroup[];
  attempts: QuizAttempt[];
  isEs: boolean;
}) {
  const exams = [
    ...lessons
      .filter((lesson) => lesson.kind === "exam")
      .map((lesson) => {
        const group = groups.find((entry) => entry.id === lesson.groupId);
        return {
          key: classQuizKey(lesson.slug),
          href: `/dashboard/my-classroom/${lesson.slug}`,
          title: isEs ? lesson.titleEs || lesson.titleEn : lesson.titleEn,
          meta: group ? (isEs ? group.labelEs : group.labelEn) : "",
          count: lesson.activities.length,
        };
      }),
    ...(course && course.finalExam.length > 0
      ? [
          {
            key: FINAL_QUIZ_KEY,
            href: "/dashboard/my-classroom/exam",
            title: isEs ? "Examen final" : "Final exam",
            meta: isEs ? "Fin del curso" : "End of course",
            count: course.finalExam.length,
          },
        ]
      : []),
  ];

  return (
    <Card as="section" aria-labelledby="course-exams-title">
      <h2 id="course-exams-title" className="text-heading-4 text-fg">
        {isEs ? "Exámenes del curso" : "Course exams"}
      </h2>
      {course && (
        <p className="mt-0.5 text-body-md text-fg-muted">
          {isEs
            ? `${course.passMark}% para aprobar`
            : `${course.passMark}% to pass`}
        </p>
      )}

      {exams.length === 0 ? (
        <p className="mt-6 text-body-md text-fg-muted">
          {isEs
            ? "Este curso aún no tiene exámenes."
            : "No exams in this course yet."}
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {exams.map((exam) => {
            const passed = hasPassed(attempts, exam.key);
            const best = bestAttempt(attempts, exam.key);
            return (
              <li key={exam.key}>
                <Link
                  href={exam.href}
                  className="flex items-center gap-3 rounded-control bg-surface-sunken p-3 transition-colors hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-control ${
                      passed
                        ? "bg-success-surface text-success"
                        : "bg-surface text-fg-brand"
                    }`}
                  >
                    {passed ? (
                      <CheckCircle2
                        aria-hidden="true"
                        className="h-4.5 w-4.5"
                      />
                    ) : (
                      <ClipboardCheck
                        aria-hidden="true"
                        className="h-4.5 w-4.5"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-label-md text-fg">
                      {exam.title}
                    </span>
                    <span className="block text-xs text-fg-muted">
                      {[
                        exam.meta,
                        isEs
                          ? `${exam.count} preguntas`
                          : `${exam.count} questions`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  {best ? (
                    <Badge tone={passed ? "success" : "warning"}>
                      {best.percent}%
                    </Badge>
                  ) : null}
                  <ChevronRight
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-fg-subtle"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

type StatusFilter = "all" | "in-progress" | "completed" | "not-started";
type ModuleTab = string;

function MyClassroomDetailsContent() {
  const { language, dictionary } = useLanguage();
  const isEs = language === "ES";
  const j = dictionary?.educationJourney;

  const searchParams = useSearchParams();
  const initialModule = searchParams.get("module") || "all";

  const { course, lessons, groups } = useClassroom();
  const words = courseWords(course, isEs);
  const { getProgress, progress } = useJourneyProgress(lessons);
  const { attempts } = useLearnerRecord();

  const [moduleTab, setModuleTab] = useState<ModuleTab>(initialModule);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  /* An unknown module in the URL falls back to every class. */
  const activeTab = groups.some((group) => group.id === moduleTab)
    ? moduleTab
    : "all";

  const tabs: Array<{ key: ModuleTab; label: string }> = [
    {
      key: "all",
      label: j?.allClassesTab || (isEs ? "Todas las clases" : "All Classes"),
    },
    ...groups.map((group) => ({
      key: group.id,
      label: isEs ? group.labelEs : group.labelEn,
    })),
  ];

  const visibleDays = useMemo(
    () =>
      lessons.filter((day) => {
        if (activeTab !== "all" && day.groupId !== activeTab) return false;
        const status = progress[day.slug]?.status ?? "not-started";
        return statusFilter === "all" || status === statusFilter;
      }),
    [lessons, activeTab, statusFilter, progress],
  );

  const tabItems: ReadonlyArray<TabItem<ModuleTab>> = tabs.map((tab) => ({
    id: tab.key,
    label: tab.label,
  }));

  return (
    <NoticeRailLayout
      fullWidth
      notices={
        <CourseExamsRail
          course={course}
          lessons={lessons}
          groups={groups}
          attempts={attempts}
          isEs={isEs}
        />
      }
    >
      <div className="w-full space-y-stack-xl">
        {/* Top Header & Back Navigation */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard/my-classroom"
              className="inline-flex items-center gap-inline-md rounded-control-small text-label-md text-fg-muted transition-colors duration-150 ease-standard hover:text-fg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              <span>
                {j?.backToClassroom ||
                  (isEs
                    ? "Volver a Mi Salón de Clases"
                    : "Back to My Classroom")}
              </span>
            </Link>
            <h1 className="mt-stack-sm text-heading-2 text-fg">
              {j?.allClassesTab ||
                (isEs ? "Todas las Clases y Módulos" : "All Classes & Modules")}
            </h1>
          </div>
        </div>

        {/* Tabs and Filter Bar */}
        <Card
          as="section"
          padding="small"
          className="flex flex-col gap-inline-md lg:flex-row lg:items-center lg:justify-between"
        >
          {/* The module buttons carried role="tab" but no panel and no arrow
            keys. <Tabs> supplies both; the grid below is the panel. */}
          <div className="overflow-x-auto">
            <Tabs
              items={tabItems}
              value={activeTab}
              onChange={setModuleTab}
              variant="pill"
              label={j?.modulesLabel || "Modules"}
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex shrink-0 items-center gap-inline-md">
            <Filter
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-fg-muted"
            />
            <label htmlFor="journey-status-filter" className="sr-only">
              {j?.filterLabel || "Filter classes"}
            </label>
            <Select
              id="journey-status-filter"
              selectSize="small"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              <option value="all">
                {j?.filterAll || (isEs ? "Todos los días" : "All days")}
              </option>
              <option value="completed">
                {j?.completed || (isEs ? "Completado" : "Completed")}
              </option>
              <option value="in-progress">
                {j?.inProgress || (isEs ? "En progreso" : "In progress")}
              </option>
              <option value="not-started">
                {j?.notStarted || (isEs ? "Sin comenzar" : "Not started")}
              </option>
            </Select>
          </div>
        </Card>

        {/* Class Cards Grid (max 4 cards per row) */}
        <TabPanel
          id={activeTab}
          value={activeTab}
          className="grid grid-cols-1 gap-inset-md sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        >
          {visibleDays.map((day) => (
            <DayCard
              key={day.slug}
              day={day}
              state={getProgress(day.slug)}
              itemWord={words.item}
            />
          ))}
        </TabPanel>

        {visibleDays.length === 0 && (
          <EmptyState
            icon={<Filter />}
            title={
              j?.noResults ||
              (isEs
                ? "Ninguna clase coincide con este filtro."
                : "No classes match this filter.")
            }
            action={
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => {
                  setModuleTab("all");
                  setStatusFilter("all");
                }}
              >
                {isEs ? "Restablecer filtros" : "Reset filters"}
              </Button>
            }
          />
        )}
      </div>
    </NoticeRailLayout>
  );
}

export default function MyClassroomDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-inset-xl text-center text-body-md text-fg-muted">
          Loading classes...
        </div>
      }
    >
      <MyClassroomDetailsContent />
    </Suspense>
  );
}
