"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  Clock3,
  GraduationCap,
  Layers,
  Lock,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { formatTotalDuration } from "@/features/education/dialysisJourneyData";
import {
  Course,
  courseClassCount,
  courseMinutes,
} from "@/features/education/courseLibrary";
import { usePlatformCourses } from "@/features/education/usePlatformCourses";
import { CourseModal } from "@/features/education/admin/CourseAdmin";
import { Alert, AsyncSection, Badge, Skeleton } from "@/components/ui";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { useLanguage } from "@/context/LanguageContext";

/* Phase 13: the library is the server's (GET /platform/courses, every
   status; platform `content` permission, which the server checks). */
const STATUS_TONE = {
  published: "success",
  draft: "neutral",
  archived: "warning",
} as const;

const STATUS_ES: Record<string, string> = {
  published: "publicado",
  draft: "borrador",
  archived: "archivado",
};

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  iconTone,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: IconType;
  tone: string;
  iconTone: string;
}) {
  return (
    <article className="rounded-card-nested border border-line bg-surface p-5 shadow-card">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-body-sm font-semibold text-fg-muted">{label}</p>
          <p className="mt-3 text-heading-2 leading-8 font-semibold text-fg">
            {value}
          </p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-card-nested ${tone}`}
        >
          <Icon className={`h-5 w-5 ${iconTone}`} />
        </span>
      </div>
      <p className="text-body-sm font-medium text-fg-muted">{detail}</p>
    </article>
  );
}

function CourseCard({
  course,
  onDelete,
}: {
  course: Course;
  onDelete: () => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const classes = courseClassCount(course);
  const minutes = courseMinutes(course);

  return (
    <article className="flex flex-col rounded-card-nested border border-line bg-surface p-5 shadow-card transition-shadow hover:shadow-raised">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-cat-4-soft text-fg">
          <GraduationCap className="h-6 w-6" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-body-lg font-semibold text-fg">
              {course.titleEn}
            </h3>
            <Badge
              tone={
                STATUS_TONE[course.status as keyof typeof STATUS_TONE] ??
                "neutral"
              }
            >
              {isEs
                ? (STATUS_ES[course.status] ?? course.status)
                : course.status}
            </Badge>
            {course.seeded && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-surface-sunken px-2 py-0.5 text-caption font-bold text-fg-muted">
                <Lock className="h-3 w-3" />
                {isEs ? "Integrado" : "Built-in"}
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-body-sm leading-relaxed text-fg-muted">
            {course.descriptionEn ||
              (isEs ? "Todavía no hay descripción." : "No description yet.")}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line-subtle pt-4 text-center">
        <div>
          <dt className="text-caption font-semibold text-fg-muted">
            {isEs ? "Módulos" : "Modules"}
          </dt>
          <dd className="mt-0.5 text-body-md font-bold text-fg">
            {course.counts?.modules ?? course.modules.length}
          </dd>
        </div>
        <div>
          <dt className="text-caption font-semibold text-fg-muted">
            {isEs ? "Clases" : "Classes"}
          </dt>
          <dd className="mt-0.5 text-body-md font-bold text-fg">{classes}</dd>
        </div>
        <div>
          <dt className="text-caption font-semibold text-fg-muted">
            {isEs ? "Duración" : "Length"}
          </dt>
          <dd className="mt-0.5 text-body-md font-bold text-fg">
            {formatTotalDuration(minutes)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/dashboard/manage-curriculum/${course.id}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-control bg-primary-solid px-4 py-2.5 text-body-sm font-bold text-primary-on-solid shadow-card transition-colors hover:bg-primary-solid-hover"
        >
          {isEs ? "Administrar" : "Manage"}
          <ChevronRight className="h-4 w-4" />
        </Link>

        {!course.seeded && (
          <button
            type="button"
            onClick={onDelete}
            aria-label={
              isEs ? `Eliminar ${course.titleEn}` : `Delete ${course.titleEn}`
            }
            className="flex h-[42px] w-[42px] shrink-0 cursor-pointer items-center justify-center rounded-control border border-line text-fg-muted transition-colors hover:border-danger-line hover:bg-danger-surface hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </article>
  );
}

export default function ManageCurriculumPage() {
  const {
    courses,
    totals,
    createCourse,
    deleteCourse,
    isPending,
    error,
    refetch,
    saveError,
    dismissSaveError,
  } = usePlatformCourses();
  const { language } = useLanguage();
  const isEs = language === "ES";
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const visibleCourses = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return courses;
    return courses.filter((course) =>
      `${course.titleEn} ${course.titleEs} ${course.descriptionEn}`
        .toLowerCase()
        .includes(needle),
    );
  }, [courses, query]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-heading-1 leading-tight font-semibold tracking-[0.3px] text-fg sm:text-heading-1">
          {isEs ? "Gestión de Clases" : "Class Management"}
        </h1>
        <p className="mt-2 text-body-sm font-medium text-fg-muted">
          {isEs
            ? "Cada curso contiene módulos, y cada módulo contiene clases."
            : "Every course holds modules, and every module holds classes."}
        </p>
      </div>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label={isEs ? "Cursos" : "Courses"}
          value={totals.courses}
          detail={
            isEs
              ? "Todos los estados, borradores incluidos"
              : "Every status, drafts included"
          }
          icon={GraduationCap}
          tone="bg-brand-100"
          iconTone="text-fg-brand"
        />
        <SummaryCard
          label={isEs ? "Módulos" : "Modules"}
          value={totals.modules}
          detail={isEs ? "En todos los cursos" : "Across every course"}
          icon={Layers}
          tone="bg-success-100"
          iconTone="text-success"
        />
        <SummaryCard
          label={isEs ? "Clases" : "Classes"}
          value={totals.classes}
          detail={isEs ? "Video, audio y lectura" : "Video, audio and reading"}
          icon={BookOpen}
          tone="bg-warning-100"
          iconTone="text-warning"
        />
        <SummaryCard
          label={isEs ? "Duración total" : "Total length"}
          value={formatTotalDuration(totals.minutes)}
          detail={isEs ? "En todos los cursos" : "Across every course"}
          icon={Clock3}
          tone="bg-accent-100"
          iconTone="text-accent-fg"
        />
      </section>

      <section className="mt-6 rounded-card-nested border border-line bg-surface p-4 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-heading-4 text-fg">
              {isEs ? "Biblioteca de cursos" : "Course Library"}
            </h2>
            <p className="mt-0.5 text-body-md text-fg-muted">
              {isEs
                ? "Abra un curso para administrar sus módulos y clases."
                : "Open a course to manage its modules and classes."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block w-full sm:w-[277px]">
              <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-fg-muted" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={isEs ? "Buscar cursos..." : "Search courses..."}
                className="h-10 w-full rounded-control border border-field bg-surface pr-3 pl-10 text-body-sm font-medium text-fg-secondary outline-none placeholder:text-fg-muted focus:border-primary-edge focus:ring-2 focus:ring-ring"
              />
            </label>

            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control bg-primary-solid px-4 text-body-sm font-bold text-primary-on-solid shadow-card transition-colors hover:bg-primary-solid-hover"
            >
              <Plus className="h-4 w-4" />
              {isEs ? "Nuevo curso" : "New Course"}
            </button>
          </div>
        </div>
      </section>

      {saveError ? (
        <Alert
          tone="danger"
          title={isEs ? "Ese cambio no se guardó" : "That change was not saved"}
          className="mt-6"
          onDismiss={dismissSaveError}
        >
          {saveError instanceof Error
            ? saveError.message
            : isEs
              ? "No se cambió nada. Inténtelo de nuevo."
              : "Nothing was changed. Please try again."}
        </Alert>
      ) : null}

      <AsyncSection
        pending={isPending}
        error={error}
        onRetry={canRetry(error) ? refetch : undefined}
        errorTitle={errorTitleFor(
          error,
          isEs
            ? "El catálogo de cursos no se cargó"
            : "The course catalogue did not load",
          isEs ? "es" : "en",
        )}
        errorMessage={errorMessageFor(error, undefined, isEs ? "es" : "en")}
        skeleton={
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <Skeleton height={240} />
            <Skeleton height={240} />
            <Skeleton height={240} />
          </div>
        }
      >
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {visibleCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onDelete={() => deleteCourse(course.id)}
            />
          ))}
        </div>

        {visibleCourses.length === 0 && (
          <p className="mt-6 rounded-card-nested border border-line bg-surface p-8 text-center text-body-sm font-medium text-fg-muted">
            {isEs
              ? "Ningún curso coincide con esa búsqueda."
              : "No courses match that search."}
          </p>
        )}
      </AsyncSection>

      {creating && (
        <CourseModal
          open
          onClose={() => setCreating(false)}
          onSave={(values) => {
            createCourse(values);
            setCreating(false);
          }}
        />
      )}
    </>
  );
}
