"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Captions,
  Clock3,
  Edit3,
  FileText,
  Filter,
  Headphones,
  Layers,
  PlayCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { formatTotalDuration } from "@/features/education/dialysisJourneyData";
import {
  CourseClass,
  CourseClassKind,
  CourseModule,
  courseClassCount,
  courseMinutes,
  emptyClass,
  moduleMinutes,
  useCourseLibrary,
} from "@/features/education/courseLibrary";
import {
  ClassEditorPanel,
  CourseModal,
  ModuleModal,
} from "@/features/education/admin/CourseAdmin";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const KIND_ICON: Record<CourseClassKind, IconType> = {
  video: PlayCircle,
  audio: Headphones,
  reading: BookOpen,
};

const KIND_LABEL: Record<CourseClassKind, string> = {
  video: "Video",
  audio: "Audio",
  reading: "Reading",
};

const KIND_PILL: Record<CourseClassKind, string> = {
  video: "bg-primary-soft text-fg-brand",
  audio: "bg-accent-soft text-accent-fg",
  reading: "bg-warning-surface text-warning",
};

/** Which class the editor is open on, and where it belongs. */
type EditorTarget = {
  moduleId: string;
  moduleName: string;
  courseClass: CourseClass;
  isNew: boolean;
};

function ModuleSection({
  courseModule,
  visibleClasses,
  index,
  onAddClass,
  onEditClass,
  onDeleteClass,
  onEditModule,
  onDeleteModule,
}: {
  courseModule: CourseModule;
  /** Rows to show after the type filter is applied. */
  visibleClasses: CourseClass[];
  index: number;
  onAddClass: () => void;
  onEditClass: (courseClass: CourseClass) => void;
  onDeleteClass: (classId: string) => void;
  onEditModule: () => void;
  onDeleteModule: () => void;
}) {
  const minutes = moduleMinutes(courseModule);

  return (
    <section className="rounded-[14px] border border-line bg-surface shadow-card">
      <header className="flex flex-wrap items-center gap-3 border-b border-line p-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-wider text-fg-brand uppercase">
            Module {index + 1}
          </p>
          <h2 className="truncate text-lg font-semibold text-fg">
            {courseModule.titleEn}
          </h2>
        </div>

        <span className="flex items-center gap-3 text-xs font-semibold text-fg-muted">
          <span>{courseModule.classes.length} classes</span>
          <span aria-hidden="true">·</span>
          <span>{formatTotalDuration(minutes)}</span>
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onEditModule}
            aria-label={`Rename ${courseModule.titleEn}`}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg-secondary"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDeleteModule}
            aria-label={`Delete ${courseModule.titleEn}`}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-control text-fg-subtle transition-colors hover:bg-danger-surface hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onAddClass}
            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-control bg-surface-sunken px-3 text-xs font-bold text-fg-secondary transition-colors hover:bg-line"
          >
            <Plus className="h-4 w-4" />
            Add Class
          </button>
        </div>
      </header>

      <div className="p-3">
        {visibleClasses.length === 0 ? (
          <p className="rounded-control border border-dashed border-line p-8 text-center text-sm font-medium text-fg-muted">
            {courseModule.classes.length === 0
              ? "No classes in this module yet."
              : "No classes of that type in this module."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-control border border-line">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="bg-surface-sunken text-left">
                  {[
                    "Class",
                    "Type",
                    "Duration",
                    "Transcript",
                    "Documents",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className={`h-[55px] border-b border-line px-3 font-semibold tracking-[0.07px] text-fg ${
                        header === "Actions" ? "text-center" : ""
                      }`}
                    >
                      <span className="block border-l border-line pl-3 leading-5 first:border-l-0">
                        {header}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleClasses.map((courseClass, classIndex) => {
                  const KindIcon = KIND_ICON[courseClass.kind];
                  return (
                    <tr
                      key={courseClass.id}
                      className="border-b border-dashed border-line last:border-0"
                    >
                      <td className="h-[62px] px-3 py-2">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-cat-4-soft text-label-sm text-fg">
                            {classIndex + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate leading-5 font-semibold text-fg-secondary">
                              {courseClass.titleEn}
                            </p>
                            <p className="truncate text-xs leading-[18px] text-fg-muted">
                              {courseClass.mediaSrc || "No media path set"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="h-[62px] px-3 py-2">
                        <span
                          className={`inline-flex h-6 items-center gap-1.5 rounded px-2 text-xs font-semibold ${KIND_PILL[courseClass.kind]}`}
                        >
                          <KindIcon className="h-3.5 w-3.5" />
                          {KIND_LABEL[courseClass.kind]}
                        </span>
                      </td>

                      <td className="h-[62px] px-3 py-2 font-medium text-fg-secondary">
                        <span className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-fg-muted" />
                          {courseClass.durationMinutes} min
                        </span>
                      </td>

                      <td className="h-[62px] px-3 py-2 font-medium text-fg-secondary">
                        <span className="flex items-center gap-2">
                          <Captions className="h-4 w-4 text-fg-muted" />
                          {courseClass.transcript.length} lines
                        </span>
                      </td>

                      <td className="h-[62px] px-3 py-2 font-medium text-fg-secondary">
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-fg-muted" />
                          {courseClass.documents.length}
                        </span>
                      </td>

                      <td className="h-[62px] px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditClass(courseClass)}
                            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-control px-2.5 text-xs font-bold text-fg transition-colors hover:bg-surface-sunken"
                          >
                            <Edit3 className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteClass(courseClass.id)}
                            aria-label={`Delete ${courseClass.titleEn}`}
                            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-control text-fg-subtle transition-colors hover:bg-danger-surface hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default function ManageCoursePage() {
  const params = useParams();
  const courseId = (params?.courseId as string) || "";

  const {
    getCourse,
    updateCourse,
    createModule,
    updateModule,
    deleteModule,
    createClass,
    updateClass,
    deleteClass,
  } = useCourseLibrary();

  const course = getCourse(courseId);

  const [editingCourse, setEditingCourse] = useState(false);
  const [addingModule, setAddingModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | CourseClassKind>("all");

  if (!course) {
    return (
      <div className="rounded-[14px] border border-line bg-surface p-8 text-center shadow-card">
        <h1 className="text-xl font-semibold text-fg">Course not found</h1>
        <p className="mt-2 text-sm text-fg-muted">
          It may have been deleted from this browser.
        </p>
        <Link
          href="/dashboard/manage-curriculum"
          className="mt-5 inline-flex items-center gap-2 rounded-control bg-primary-solid px-4 py-2.5 text-sm font-bold text-primary-on-solid transition-colors hover:bg-primary-solid-hover"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to courses
        </Link>
      </div>
    );
  }

  const editingModule = course.modules.find(
    (entry) => entry.id === editingModuleId,
  );

  // Falls back to the first module, and again if the open one is deleted.
  const selectedIndex = Math.max(
    0,
    course.modules.findIndex((entry) => entry.id === activeModuleId),
  );
  const selectedModule = course.modules[selectedIndex] ?? null;

  return (
    <>
      <Link
        href="/dashboard/manage-curriculum"
        className="inline-flex items-center gap-2 text-sm font-semibold text-fg-brand transition-colors hover:text-fg-brand"
      >
        <ArrowLeft className="h-4 w-4" />
        All courses
      </Link>

      <section className="mt-4 rounded-[14px] border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-fg sm:text-3xl">
              {course.titleEn}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-fg-muted">
              {course.descriptionEn || "No description yet."}
            </p>

            <ul className="mt-4 flex flex-wrap items-center gap-3">
              <li className="flex items-center gap-2 rounded-control border border-line bg-surface-sunken px-3.5 py-1.5 text-xs font-medium text-fg-muted">
                <Layers className="h-4 w-4 text-fg-brand" />
                <span className="font-bold text-fg">
                  {course.modules.length}
                </span>
                modules
              </li>
              <li className="flex items-center gap-2 rounded-control border border-line bg-surface-sunken px-3.5 py-1.5 text-xs font-medium text-fg-muted">
                <BookOpen className="h-4 w-4 text-fg-brand" />
                <span className="font-bold text-fg">
                  {courseClassCount(course)}
                </span>
                classes
              </li>
              <li className="flex items-center gap-2 rounded-control border border-line bg-surface-sunken px-3.5 py-1.5 text-xs font-medium text-fg-muted">
                <Clock3 className="h-4 w-4 text-fg-brand" />
                <span className="font-bold text-fg">
                  {formatTotalDuration(courseMinutes(course))}
                </span>
                total
              </li>
            </ul>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setEditingCourse(true)}
              className="flex cursor-pointer items-center gap-2 rounded-control border border-line bg-surface px-4 py-2.5 text-sm font-bold text-fg-secondary transition-colors hover:bg-surface-sunken"
            >
              <Edit3 className="h-4 w-4 text-fg-muted" />
              Edit course
            </button>
            <button
              type="button"
              onClick={() => setAddingModule(true)}
              className="flex cursor-pointer items-center gap-2 rounded-control bg-primary-solid px-4 py-2.5 text-sm font-bold text-primary-on-solid shadow-card transition-colors hover:bg-primary-solid-hover"
            >
              <Plus className="h-4 w-4" />
              Add Module
            </button>
          </div>
        </div>
      </section>

      {course.modules.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label="Modules"
            className="flex gap-2.5 overflow-x-auto pb-1"
          >
            {course.modules.map((courseModule, index) => (
              <button
                key={courseModule.id}
                type="button"
                role="tab"
                aria-selected={courseModule.id === selectedModule?.id}
                onClick={() => setActiveModuleId(courseModule.id)}
                className={`flex h-[38px] shrink-0 cursor-pointer items-center gap-2 rounded-[10px] border px-4 text-sm font-medium transition-colors ${
                  courseModule.id === selectedModule?.id
                    ? "border-primary-edge bg-primary-solid font-bold text-primary-on-solid shadow-card"
                    : "border-line bg-surface text-fg-secondary hover:bg-surface-sunken"
                }`}
              >
                <span>Module {index + 1}</span>
                <span
                  className={`rounded-pill px-1.5 py-0.5 text-[11px] font-bold ${
                    courseModule.id === selectedModule?.id
                      ? "bg-surface/20 text-fg-inverse"
                      : "bg-surface-sunken text-fg-muted"
                  }`}
                >
                  {courseModule.classes.length}
                </span>
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Filter className="h-4 w-4 shrink-0 text-fg-muted" />
            <label className="sr-only" htmlFor="class-type-filter">
              Filter by class type
            </label>
            <select
              id="class-type-filter"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as "all" | CourseClassKind)
              }
              className="h-[38px] cursor-pointer rounded-[10px] border border-line bg-surface px-3 text-sm font-medium text-fg-secondary transition-colors outline-none hover:bg-surface-sunken focus:border-primary-edge focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Types</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="reading">Reading</option>
            </select>
          </div>
        </div>
      )}

      <div className="mt-4">
        {selectedModule ? (
          <ModuleSection
            key={selectedModule.id}
            courseModule={selectedModule}
            visibleClasses={selectedModule.classes.filter(
              (entry) => typeFilter === "all" || entry.kind === typeFilter,
            )}
            index={selectedIndex}
            onAddClass={() =>
              setEditorTarget({
                moduleId: selectedModule.id,
                moduleName: selectedModule.titleEn,
                courseClass: emptyClass(),
                isNew: true,
              })
            }
            onEditClass={(courseClass) =>
              setEditorTarget({
                moduleId: selectedModule.id,
                moduleName: selectedModule.titleEn,
                courseClass,
                isNew: false,
              })
            }
            onDeleteClass={(classId) =>
              deleteClass(course.id, selectedModule.id, classId)
            }
            onEditModule={() => setEditingModuleId(selectedModule.id)}
            onDeleteModule={() => deleteModule(course.id, selectedModule.id)}
          />
        ) : (
          <p className="rounded-[14px] border border-dashed border-line-strong bg-surface p-10 text-center text-sm font-medium text-fg-muted">
            This course has no modules yet. Add one to start building classes.
          </p>
        )}
      </div>

      {editingCourse && (
        <CourseModal
          open
          initial={{
            titleEn: course.titleEn,
            titleEs: course.titleEs,
            descriptionEn: course.descriptionEn,
            descriptionEs: course.descriptionEs,
          }}
          onClose={() => setEditingCourse(false)}
          onSave={(values) => {
            updateCourse(course.id, values);
            setEditingCourse(false);
          }}
        />
      )}

      {addingModule && (
        <ModuleModal
          open
          onClose={() => setAddingModule(false)}
          onSave={(values) => {
            createModule(course.id, values.titleEn, values.titleEs);
            setAddingModule(false);
          }}
        />
      )}

      {editingModule && (
        <ModuleModal
          open
          initial={{
            titleEn: editingModule.titleEn,
            titleEs: editingModule.titleEs,
          }}
          onClose={() => setEditingModuleId(null)}
          onSave={(values) => {
            updateModule(course.id, editingModule.id, values);
            setEditingModuleId(null);
          }}
        />
      )}

      {editorTarget && (
        <ClassEditorPanel
          open
          initial={editorTarget.courseClass}
          moduleName={editorTarget.moduleName}
          onClose={() => setEditorTarget(null)}
          onSave={(courseClass) => {
            if (editorTarget.isNew) {
              createClass(course.id, editorTarget.moduleId, courseClass);
            } else {
              updateClass(course.id, editorTarget.moduleId, courseClass);
            }
            setEditorTarget(null);
          }}
        />
      )}
    </>
  );
}
