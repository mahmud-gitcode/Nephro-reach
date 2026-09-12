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
import { formatTotalDuration } from "@/lib/dialysisJourneyData";
import {
  CourseClass,
  CourseClassKind,
  CourseModule,
  courseClassCount,
  courseMinutes,
  emptyClass,
  moduleMinutes,
  useCourseLibrary,
} from "@/lib/courseLibrary";
import {
  ClassEditorPanel,
  CourseModal,
  ModuleModal,
} from "@/components/dashboard/CourseAdmin";

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
  video: "bg-blue-50 text-blue-600",
  audio: "bg-violet-50 text-violet-600",
  reading: "bg-amber-50 text-amber-700",
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
    <section className="rounded-[14px] border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            Module {index + 1}
          </p>
          <h2 className="truncate text-lg font-semibold text-slate-900">
            {courseModule.titleEn}
          </h2>
        </div>

        <span className="flex items-center gap-3 text-xs font-semibold text-slate-500">
          <span>{courseModule.classes.length} classes</span>
          <span aria-hidden="true">·</span>
          <span>{formatTotalDuration(minutes)}</span>
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onEditModule}
            aria-label={`Rename ${courseModule.titleEn}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDeleteModule}
            aria-label={`Delete ${courseModule.titleEn}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onAddClass}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-slate-100 px-3 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-200 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Class
          </button>
        </div>
      </header>

      <div className="p-3">
        {visibleClasses.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-medium text-slate-500">
            {courseModule.classes.length === 0
              ? "No classes in this module yet."
              : "No classes of that type in this module."}
          </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#C4CDD5]">
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F4F6F8] text-left">
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
                        className={`h-[55px] border-b border-[#C4CDD5] px-3 font-semibold tracking-[0.07px] text-slate-900 ${
                          header === "Actions" ? "text-center" : ""
                        }`}
                      >
                        <span className="block border-l border-[#C4CDD5] pl-3 leading-5 first:border-l-0">
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
                        className="border-b border-dashed border-[#C4CDD5] last:border-0"
                      >
                        <td className="h-[62px] px-3 py-2">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00A76F] text-xs font-bold text-white">
                              {classIndex + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold leading-5 text-slate-800">
                                {courseClass.titleEn}
                              </p>
                              <p className="truncate text-xs leading-[18px] text-slate-600">
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

                        <td className="h-[62px] px-3 py-2 font-medium text-slate-800">
                          <span className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-slate-500" />
                            {courseClass.durationMinutes} min
                          </span>
                        </td>

                        <td className="h-[62px] px-3 py-2 font-medium text-slate-800">
                          <span className="flex items-center gap-2">
                            <Captions className="h-4 w-4 text-slate-500" />
                            {courseClass.transcript.length} lines
                          </span>
                        </td>

                        <td className="h-[62px] px-3 py-2 font-medium text-slate-800">
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-500" />
                            {courseClass.documents.length}
                          </span>
                        </td>

                        <td className="h-[62px] px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditClass(courseClass)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-slate-900 transition-colors hover:bg-slate-100 cursor-pointer"
                            >
                              <Edit3 className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteClass(courseClass.id)}
                              aria-label={`Delete ${courseClass.titleEn}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
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
  const [typeFilter, setTypeFilter] = useState<"all" | CourseClassKind>(
    "all",
  );

  if (!course) {
    return (
      <div className="rounded-[14px] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Course not found
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          It may have been deleted from this browser.
        </p>
        <Link
          href="/dashboard/manage-curriculum"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
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
        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
      >
        <ArrowLeft className="h-4 w-4" />
        All courses
      </Link>

      <section className="mt-4 rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              {course.titleEn}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              {course.descriptionEn || "No description yet."}
            </p>

            <ul className="mt-4 flex flex-wrap items-center gap-3">
              <li className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-600">
                <Layers className="h-4 w-4 text-blue-600" />
                <span className="font-bold text-slate-900">
                  {course.modules.length}
                </span>
                modules
              </li>
              <li className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-600">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span className="font-bold text-slate-900">
                  {courseClassCount(course)}
                </span>
                classes
              </li>
              <li className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-600">
                <Clock3 className="h-4 w-4 text-blue-600" />
                <span className="font-bold text-slate-900">
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
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50 cursor-pointer"
            >
              <Edit3 className="h-4 w-4 text-slate-600" />
              Edit course
            </button>
            <button
              type="button"
              onClick={() => setAddingModule(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 cursor-pointer"
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
              className={`flex h-[38px] shrink-0 items-center gap-2 rounded-[10px] border px-4 text-sm font-medium transition-colors cursor-pointer ${
                courseModule.id === selectedModule?.id
                  ? "border-blue-600 bg-blue-600 font-bold text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>Module {index + 1}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                  courseModule.id === selectedModule?.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {courseModule.classes.length}
              </span>
            </button>
          ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Filter className="h-4 w-4 shrink-0 text-slate-500" />
            <label className="sr-only" htmlFor="class-type-filter">
              Filter by class type
            </label>
            <select
              id="class-type-filter"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as "all" | CourseClassKind)
              }
              className="h-[38px] rounded-[10px] border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-colors hover:bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
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
          <p className="rounded-[14px] border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-medium text-slate-500">
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
