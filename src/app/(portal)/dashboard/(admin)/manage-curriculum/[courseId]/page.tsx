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
  ClipboardCheck,
  Headphones,
  Layers,
  MessageCircleQuestion,
  PlayCircle,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { formatTotalDuration } from "@/features/education/dialysisJourneyData";
import {
  Course,
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
  CourseSettingsModal,
  ModuleModal,
} from "@/features/education/admin/CourseAdmin";
import { QuestionListEditor } from "@/features/education/admin/QuestionEditor";
import { LearnerProgressCard } from "@/features/education/admin/LearnerProgressCard";
import {
  Alert,
  Badge,
  Button,
  Card,
  ErrorState,
  SectionTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  type BadgeTone,
} from "@/components/ui";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const KIND_ICON: Record<CourseClassKind, IconType> = {
  video: PlayCircle,
  audio: Headphones,
  reading: BookOpen,
  exam: ClipboardCheck,
};

const KIND_LABEL: Record<CourseClassKind, string> = {
  video: "Video",
  audio: "Audio",
  reading: "Reading",
  exam: "Exam",
};

/* Categorical, not good-or-bad: each kind keeps its own tag colour. */
const KIND_TONE: Record<CourseClassKind, BadgeTone> = {
  video: "info",
  audio: "accent",
  reading: "warning",
  exam: "success",
};

/** Which class the editor is open on, and where it belongs. */
type EditorTarget = {
  moduleId: string;
  moduleName: string;
  courseClass: CourseClass;
  isNew: boolean;
};

function ModuleSection({
  course,
  courseModule,
  visibleClasses,
  index,
  onAddExam,
  onAddClass,
  onEditClass,
  onDeleteClass,
  onEditModule,
  onDeleteModule,
}: {
  course: Course;
  courseModule: CourseModule;
  /** Rows to show after the type filter is applied. */
  visibleClasses: CourseClass[];
  index: number;
  onAddExam: () => void;
  onAddClass: () => void;
  onEditClass: (courseClass: CourseClass) => void;
  onDeleteClass: (classId: string) => void;
  onEditModule: () => void;
  onDeleteModule: () => void;
}) {
  const minutes = moduleMinutes(courseModule);

  const examCount = courseModule.classes.filter(
    (entry) => entry.kind === "exam",
  ).length;
  const lessonCount = courseModule.classes.length - examCount;

  return (
    /* The shared Card, with its table flush — the showcase's layout. */
    <Card as="section" padding="none" className="overflow-hidden">
      <header className="flex flex-wrap items-center gap-inline-md border-b border-line p-card py-inset-md">
        <div className="min-w-0 flex-1">
          <p className="text-overline text-fg-brand">
            {course.groupLabelEn} {index + 1}
          </p>
          <h2 className="truncate text-heading-4 text-fg">
            {courseModule.titleEn}
          </h2>
        </div>

        <span className="flex items-center gap-inline-md text-body-sm text-fg-muted">
          <span>
            {lessonCount} {course.itemLabelEn.toLowerCase()}
            {lessonCount === 1 ? "" : "s"}
            {examCount > 0
              ? ` · ${examCount} exam${examCount === 1 ? "" : "s"}`
              : ""}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatTotalDuration(minutes)}</span>
        </span>

        <div className="flex shrink-0 items-center gap-inline-sm">
          <Button
            variant="neutral"
            appearance="ghost"
            size="small"
            iconOnly
            onClick={onEditModule}
            aria-label={`Rename ${courseModule.titleEn}`}
          >
            <Edit3 />
          </Button>
          <Button
            variant="danger"
            appearance="ghost"
            size="small"
            iconOnly
            onClick={onDeleteModule}
            aria-label={`Delete ${courseModule.titleEn}`}
          >
            <Trash2 />
          </Button>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            size="small"
            onClick={onAddExam}
          >
            <ClipboardCheck />
            Add Exam
          </Button>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            size="small"
            onClick={onAddClass}
          >
            <Plus />
            Add {course.itemLabelEn}
          </Button>
        </div>
      </header>

      {visibleClasses.length === 0 ? (
        <p className="m-card rounded-card-nested border border-dashed border-line p-inset-xl text-center text-body-sm text-fg-muted">
          {courseModule.classes.length === 0
            ? `No ${course.itemLabelEn.toLowerCase()}s in this ${course.groupLabelEn.toLowerCase()} yet.`
            : `Nothing of that type in this ${course.groupLabelEn.toLowerCase()}.`}
        </p>
      ) : (
        <Table minWidth={860}>
          <TableHead>
            <TableRow>
              {[
                course.itemLabelEn,
                "Type",
                "Duration",
                "Transcript",
                "Questions",
                "Documents",
                "Actions",
              ].map((header) => (
                <TableHeaderCell
                  key={header}
                  className={header === "Actions" ? "text-right" : undefined}
                >
                  {header}
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleClasses.map((courseClass, classIndex) => {
              const KindIcon = KIND_ICON[courseClass.kind];
              return (
                <TableRow key={courseClass.id}>
                  <TableCell>
                    <span className="flex items-center gap-inline-md">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-cat-4-soft text-label-sm text-fg">
                        {classIndex + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-label-md text-fg">
                          {courseClass.titleEn}
                        </span>
                        <span className="block truncate text-caption text-fg-muted">
                          {courseClass.kind === "exam"
                            ? `${courseClass.activities.length} scored questions · ${course.passMark}% to pass`
                            : courseClass.mediaSrc || "No media path set"}
                        </span>
                      </span>
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge
                      tone={KIND_TONE[courseClass.kind]}
                      icon={<KindIcon aria-hidden="true" />}
                    >
                      {KIND_LABEL[courseClass.kind]}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <span className="flex items-center gap-inline-sm whitespace-nowrap">
                      <Clock3
                        aria-hidden="true"
                        className="h-4 w-4 text-fg-muted"
                      />
                      {courseClass.durationMinutes} min
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="flex items-center gap-inline-sm whitespace-nowrap">
                      <Captions
                        aria-hidden="true"
                        className="h-4 w-4 text-fg-muted"
                      />
                      {courseClass.transcript.length} lines
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="flex items-center gap-inline-sm">
                      <MessageCircleQuestion
                        aria-hidden="true"
                        className="h-4 w-4 text-fg-muted"
                      />
                      {courseClass.activities.length +
                        courseClass.videoQuestions.length}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="flex items-center gap-inline-sm">
                      <FileText
                        aria-hidden="true"
                        className="h-4 w-4 text-fg-muted"
                      />
                      {courseClass.documents.length}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="flex items-center justify-end gap-inline-xs">
                      <Button
                        variant="neutral"
                        appearance="ghost"
                        size="small"
                        onClick={() => onEditClass(courseClass)}
                      >
                        <Edit3 />
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        appearance="ghost"
                        size="small"
                        iconOnly
                        onClick={() => onDeleteClass(courseClass.id)}
                        aria-label={`Delete ${courseClass.titleEn}`}
                      >
                        <Trash2 />
                      </Button>
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
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
    isPending,
    error,
    refetch,
    saveError,
    dismissSaveError,
  } = useCourseLibrary();

  const course = getCourse(courseId);

  const [editingCourse, setEditingCourse] = useState(false);
  const [editingSettings, setEditingSettings] = useState(false);
  const [addingModule, setAddingModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | CourseClassKind>("all");

  /* Before this guard: while the catalogue was still being read, `courses`
     was empty and every valid course id rendered "Course not found". Both
     of the states below have to be ruled out before that sentence is
     true. */
  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton height={140} />
        <Skeleton height={320} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="The course catalogue did not load"
        error={error}
        onRetry={refetch}
      />
    );
  }

  if (!course) {
    return (
      <div className="rounded-card-nested border border-line bg-surface p-8 text-center shadow-card">
        <h1 className="text-heading-4 font-semibold text-fg">
          Course not found
        </h1>
        <p className="mt-2 text-body-sm text-fg-muted">
          It may have been deleted from this browser.
        </p>
        <Link
          href="/dashboard/manage-curriculum"
          className="mt-5 inline-flex items-center gap-2 rounded-control bg-primary-solid px-4 py-2.5 text-body-sm font-bold text-primary-on-solid transition-colors hover:bg-primary-solid-hover"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to courses
        </Link>
      </div>
    );
  }

  const saveFailure = saveError ? (
    <Alert
      tone="danger"
      title="That change was not saved"
      onDismiss={dismissSaveError}
    >
      {saveError instanceof Error
        ? saveError.message
        : "The catalogue on this device is unchanged. Please try again."}
    </Alert>
  ) : null;

  const editingModule = course.modules.find(
    (entry) => entry.id === editingModuleId,
  );

  // Falls back to the first module, and again if the open one is deleted.
  const selectedIndex = Math.max(
    0,
    course.modules.findIndex((entry) => entry.id === activeModuleId),
  );
  const selectedModule = course.modules[selectedIndex] ?? null;
  const examTotal = course.modules.reduce(
    (sum, entry) =>
      sum + entry.classes.filter((item) => item.kind === "exam").length,
    0,
  );

  return (
    <>
      <Link
        href="/dashboard/manage-curriculum"
        className="inline-flex min-h-11 items-center gap-2 text-body-sm font-semibold text-fg-brand transition-colors hover:text-fg-brand"
      >
        <ArrowLeft className="h-4 w-4" />
        All courses
      </Link>

      {saveFailure ? <div className="mt-4">{saveFailure}</div> : null}

      <section className="mt-4 rounded-card-nested border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-heading-3 font-semibold text-fg sm:text-heading-2">
              {course.titleEn}
            </h1>
            <p className="mt-2 max-w-3xl text-body-sm leading-relaxed text-fg-muted">
              {course.descriptionEn || "No description yet."}
            </p>

            <ul className="mt-4 flex flex-wrap items-center gap-3">
              <li className="flex items-center gap-2 rounded-control border border-line bg-surface-sunken px-3.5 py-1.5 text-caption font-medium text-fg-muted">
                <Layers className="h-4 w-4 text-fg-brand" />
                <span className="font-bold text-fg">
                  {course.modules.length}
                </span>
                {course.groupLabelEn.toLowerCase()}s
              </li>
              <li className="flex items-center gap-2 rounded-control border border-line bg-surface-sunken px-3.5 py-1.5 text-caption font-medium text-fg-muted">
                <BookOpen className="h-4 w-4 text-fg-brand" />
                <span className="font-bold text-fg">
                  {courseClassCount(course) - examTotal}
                </span>
                {course.itemLabelEn.toLowerCase()}s
              </li>
              <li className="flex items-center gap-2 rounded-control border border-line bg-surface-sunken px-3.5 py-1.5 text-caption font-medium text-fg-muted">
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
              className="flex cursor-pointer items-center gap-2 rounded-control border border-line bg-surface px-4 py-2.5 text-body-sm font-bold text-fg-secondary transition-colors hover:bg-surface-sunken"
            >
              <Edit3 className="h-4 w-4 text-fg-muted" />
              Edit course
            </button>
            <button
              type="button"
              onClick={() => setEditingSettings(true)}
              className="flex cursor-pointer items-center gap-2 rounded-control border border-line bg-surface px-4 py-2.5 text-body-sm font-bold text-fg-secondary transition-colors hover:bg-surface-sunken"
            >
              <Settings className="h-4 w-4 text-fg-muted" />
              Settings
            </button>
            <button
              type="button"
              onClick={() => setAddingModule(true)}
              className="flex cursor-pointer items-center gap-2 rounded-control bg-primary-solid px-4 py-2.5 text-body-sm font-bold text-primary-on-solid shadow-card transition-colors hover:bg-primary-solid-hover"
            >
              <Plus className="h-4 w-4" />
              Add {course.groupLabelEn}
            </button>
          </div>
        </div>
      </section>

      {course.modules.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label={`${course.groupLabelEn}s`}
            className="flex gap-2.5 overflow-x-auto pb-1"
          >
            {course.modules.map((courseModule, index) => (
              <button
                key={courseModule.id}
                type="button"
                role="tab"
                aria-selected={courseModule.id === selectedModule?.id}
                onClick={() => setActiveModuleId(courseModule.id)}
                className={`flex h-[38px] shrink-0 cursor-pointer items-center gap-2 rounded-card-nested border px-4 text-body-sm font-medium transition-colors ${
                  courseModule.id === selectedModule?.id
                    ? "border-primary-edge bg-primary-solid font-bold text-primary-on-solid shadow-card"
                    : "border-line bg-surface text-fg-secondary hover:bg-surface-sunken"
                }`}
              >
                <span>
                  {course.groupLabelEn} {index + 1}
                </span>
                <span
                  className={`rounded-pill px-1.5 py-0.5 text-caption font-bold ${
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
              className="h-[38px] cursor-pointer rounded-card-nested border border-line bg-surface px-3 text-body-sm font-medium text-fg-secondary transition-colors outline-none hover:bg-surface-sunken focus:border-primary-edge focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Types</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="reading">Reading</option>
              <option value="exam">Exam</option>
            </select>
          </div>
        </div>
      )}

      <div className="mt-4">
        {selectedModule ? (
          <ModuleSection
            key={selectedModule.id}
            course={course}
            onAddExam={() =>
              setEditorTarget({
                moduleId: selectedModule.id,
                moduleName: selectedModule.titleEn,
                courseClass: {
                  ...emptyClass(),
                  kind: "exam",
                  titleEn: `${selectedModule.titleEn} exam`,
                  titleEs: "",
                  durationMinutes: 5,
                },
                isNew: true,
              })
            }
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
          <p className="rounded-card-nested border border-dashed border-line-strong bg-surface p-10 text-center text-body-sm font-medium text-fg-muted">
            This course has no {course.groupLabelEn.toLowerCase()}s yet. Add one
            to start building {course.itemLabelEn.toLowerCase()}s.
          </p>
        )}
      </div>

      <Card as="section" aria-labelledby="final-exam" className="mt-6">
        <SectionTitle
          id="final-exam"
          title="Final exam"
          subtitle={`Scored · ${course.passMark}% to pass · ${
            course.maxAttempts === 0 ? "unlimited" : course.maxAttempts
          } attempts${
            course.certificateEnabled && course.requireExamPass
              ? " · needed for the certificate"
              : ""
          }`}
          action={
            <Badge tone={course.finalExam.length > 0 ? "info" : "neutral"}>
              {course.finalExam.length} questions
            </Badge>
          }
        />
        <QuestionListEditor
          questions={course.finalExam}
          scoredOnly
          onChange={(finalExam) => updateCourse(course.id, { finalExam })}
          emptyText="No final exam yet. Add questions to give members a scored exam."
        />
      </Card>

      <div className="mt-6">
        <LearnerProgressCard course={course} />
      </div>

      {editingSettings && (
        <CourseSettingsModal
          initial={{
            groupLabelEn: course.groupLabelEn,
            groupLabelEs: course.groupLabelEs,
            itemLabelEn: course.itemLabelEn,
            itemLabelEs: course.itemLabelEs,
            passMark: course.passMark,
            maxAttempts: course.maxAttempts,
            showAnswers: course.showAnswers,
            certificateEnabled: course.certificateEnabled,
            requireExamPass: course.requireExamPass,
          }}
          onClose={() => setEditingSettings(false)}
          onSave={(values) => {
            updateCourse(course.id, values);
            setEditingSettings(false);
          }}
        />
      )}

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
