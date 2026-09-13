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
    <article className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold leading-8 text-slate-900">
            {value}
          </p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${tone}`}
        >
          <Icon className={`h-5 w-5 ${iconTone}`} />
        </span>
      </div>
      <p className="text-sm font-medium text-slate-500">{detail}</p>
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
    <article className="flex flex-col rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00A76F] text-white">
          <GraduationCap className="h-6 w-6" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-slate-900">
              {course.titleEn}
            </h3>
            {course.seeded && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <Lock className="h-3 w-3" />
                Built-in
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
            {course.descriptionEn || "No description yet."}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Modules
          </dt>
          <dd className="mt-0.5 text-base font-bold text-slate-900">
            {course.modules.length}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Classes
          </dt>
          <dd className="mt-0.5 text-base font-bold text-slate-900">
            {classes}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Length
          </dt>
          <dd className="mt-0.5 text-base font-bold text-slate-900">
            {formatTotalDuration(minutes)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/dashboard/manage-curriculum/${course.id}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          Manage
          <ChevronRight className="h-4 w-4" />
        </Link>

        {!course.seeded && (
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${course.titleEn}`}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </article>
  );
}

export default function ManageCurriculumPage() {
  const { courses, totals, createCourse, deleteCourse } = useCourseLibrary();
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
        <h1 className="text-[32px] font-semibold leading-tight tracking-[0.3px] text-slate-900 sm:text-[40px]">
          Class Management
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Every course holds modules, and every module holds classes.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Courses"
          value={totals.courses}
          detail="Published to the Education Center"
          icon={GraduationCap}
          tone="bg-blue-100"
          iconTone="text-blue-600"
        />
        <SummaryCard
          label="Modules"
          value={totals.modules}
          detail="Across every course"
          icon={Layers}
          tone="bg-emerald-100"
          iconTone="text-emerald-600"
        />
        <SummaryCard
          label="Classes"
          value={totals.classes}
          detail="Video, audio and reading"
          icon={BookOpen}
          tone="bg-amber-100"
          iconTone="text-amber-600"
        />
        <SummaryCard
          label="Total length"
          value={formatTotalDuration(totals.minutes)}
          detail={`${totalDocuments} handouts attached`}
          icon={Clock3}
          tone="bg-purple-100"
          iconTone="text-purple-600"
        />
      </section>

      <section className="mt-6 rounded-[14px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Course Library
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Open a course to manage its modules and classes.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block w-full sm:w-[277px]">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search courses..."
                className="h-10 w-full rounded-lg border border-[#CBD5ED] bg-white pl-10 pr-3 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              New Course
            </button>
          </div>
        </div>
      </section>

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
        <p className="mt-6 rounded-[14px] border border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-500">
          No courses match that search.
        </p>
      )}

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
