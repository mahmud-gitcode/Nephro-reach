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
  courseDocumentCount,
  courseMinutes,
  useCourseLibrary,
} from "@/features/education/courseLibrary";
import { CourseModal } from "@/features/education/admin/CourseAdmin";
import { Alert, AsyncSection, Skeleton } from "@/components/ui";

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
    <article className="rounded-[14px] border border-line bg-surface p-5 shadow-card">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-fg-muted">{label}</p>
          <p className="mt-3 text-3xl leading-8 font-semibold text-fg">
            {value}
          </p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${tone}`}
        >
          <Icon className={`h-5 w-5 ${iconTone}`} />
        </span>
      </div>
      <p className="text-sm font-medium text-fg-muted">{detail}</p>
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
  const classes = courseClassCount(course);
  const minutes = courseMinutes(course);

  return (
    <article className="flex flex-col rounded-[14px] border border-line bg-surface p-5 shadow-card transition-shadow hover:shadow-raised">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-cat-4-soft text-fg">
          <GraduationCap className="h-6 w-6" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-fg">
              {course.titleEn}
            </h3>
            {course.seeded && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-surface-sunken px-2 py-0.5 text-[10px] font-bold tracking-wide text-fg-muted uppercase">
                <Lock className="h-3 w-3" />
                Built-in
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-fg-muted">
            {course.descriptionEn || "No description yet."}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line-subtle pt-4 text-center">
        <div>
          <dt className="text-[11px] font-semibold tracking-wide text-fg-muted uppercase">
            Modules
          </dt>
          <dd className="mt-0.5 text-base font-bold text-fg">
            {course.modules.length}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold tracking-wide text-fg-muted uppercase">
            Classes
          </dt>
          <dd className="mt-0.5 text-base font-bold text-fg">{classes}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold tracking-wide text-fg-muted uppercase">
            Length
          </dt>
          <dd className="mt-0.5 text-base font-bold text-fg">
            {formatTotalDuration(minutes)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/dashboard/manage-curriculum/${course.id}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-control bg-primary-solid px-4 py-2.5 text-sm font-bold text-primary-on-solid shadow-card transition-colors hover:bg-primary-solid-hover"
        >
          Manage
          <ChevronRight className="h-4 w-4" />
        </Link>

        {!course.seeded && (
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${course.titleEn}`}
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
  } = useCourseLibrary();
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

  const totalDocuments = courses.reduce(
    (total, course) => total + courseDocumentCount(course),
    0,
  );

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[32px] leading-tight font-semibold tracking-[0.3px] text-fg sm:text-[40px]">
          Class Management
        </h1>
        <p className="mt-2 text-sm font-medium text-fg-muted">
          Every course holds modules, and every module holds classes.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Courses"
          value={totals.courses}
          detail="Published to My Classroom"
          icon={GraduationCap}
          tone="bg-brand-100"
          iconTone="text-fg-brand"
        />
        <SummaryCard
          label="Modules"
          value={totals.modules}
          detail="Across every course"
          icon={Layers}
          tone="bg-success-100"
          iconTone="text-success"
        />
        <SummaryCard
          label="Classes"
          value={totals.classes}
          detail="Video, audio and reading"
          icon={BookOpen}
          tone="bg-warning-100"
          iconTone="text-warning"
        />
        <SummaryCard
          label="Total length"
          value={formatTotalDuration(totals.minutes)}
          detail={`${totalDocuments} handouts attached`}
          icon={Clock3}
          tone="bg-accent-100"
          iconTone="text-accent-fg"
        />
      </section>

      <section className="mt-6 rounded-[14px] border border-line bg-surface p-4 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-fg">Course Library</h2>
            <p className="mt-1 text-sm font-medium text-fg-muted">
              Open a course to manage its modules and classes.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block w-full sm:w-[277px]">
              <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-fg-muted" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search courses..."
                className="h-10 w-full rounded-control border border-field bg-surface pr-3 pl-10 text-sm font-medium text-fg-secondary outline-none placeholder:text-fg-muted focus:border-primary-edge focus:ring-2 focus:ring-ring"
              />
            </label>

            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control bg-primary-solid px-4 text-sm font-bold text-primary-on-solid shadow-card transition-colors hover:bg-primary-solid-hover"
            >
              <Plus className="h-4 w-4" />
              New Course
            </button>
          </div>
        </div>
      </section>

      {saveError ? (
        <Alert
          tone="danger"
          title="That change was not saved"
          className="mt-6"
          onDismiss={dismissSaveError}
        >
          {saveError instanceof Error
            ? saveError.message
            : "The catalogue on this device is unchanged. Please try again."}
        </Alert>
      ) : null}

      <AsyncSection
        pending={isPending}
        error={error}
        onRetry={refetch}
        errorTitle="The course catalogue did not load"
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
          <p className="mt-6 rounded-[14px] border border-line bg-surface p-8 text-center text-sm font-medium text-fg-muted">
            No courses match that search.
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
