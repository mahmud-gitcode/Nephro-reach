"use client";

import { useCallback, useMemo, useState } from "react";
import {
  JOURNEY_DAYS,
  JOURNEY_PHASES,
  JourneyDocumentKind,
  JourneyMediaKind,
  PHASE_ORDER,
} from "@/features/education/dialysisJourneyData";

/**
 * Admin-side model of the course catalogue: course -> modules -> classes.
 *
 * The 21-Day Dialysis Journey is imported from `dialysisJourneyData` the first
 * time the library is opened, so the admin starts from the real course rather
 * than an empty screen. Everything after that is stored in localStorage.
 */

export type CourseClassKind = JourneyMediaKind;
export type CourseDocumentKind = JourneyDocumentKind;

export interface CourseTranscriptCue {
  id: string;
  /** Seconds into the recording. */
  at: number;
  /** Seconds the cue stops. Kept from the imported caption file when present. */
  end?: number;
  textEn: string;
  textEs: string;
}

export interface CourseDocument {
  id: string;
  titleEn: string;
  titleEs: string;
  kind: CourseDocumentKind;
  metaEn: string;
  metaEs: string;
}

export interface CourseClass {
  id: string;
  titleEn: string;
  titleEs: string;
  summaryEn: string;
  summaryEs: string;
  kind: CourseClassKind;
  durationMinutes: number;
  mediaSrc: string;
  /** Written lesson body, used by reading classes. */
  bodyEn: string;
  bodyEs: string;
  keyPointsEn: string[];
  keyPointsEs: string[];
  transcript: CourseTranscriptCue[];
  documents: CourseDocument[];
}

export interface CourseModule {
  id: string;
  titleEn: string;
  titleEs: string;
  classes: CourseClass[];
}

export interface Course {
  id: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  /** Seeded courses cannot be deleted, so the demo always has content. */
  seeded: boolean;
  modules: CourseModule[];
}

const STORAGE_KEY = "nephroreach_course_library";

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/** Turns the static 21-day journey into the editable catalogue shape. */
function buildSeedCourse(): Course {
  return {
    id: "course-dialysis-journey",
    titleEn: "21-Day Dialysis Journey",
    titleEs: "Viaje de Diálisis de 21 Días",
    descriptionEn:
      "One short class a day for three weeks, with a transcript and handouts members can bring to their next appointment.",
    descriptionEs:
      "Una clase corta al día durante tres semanas, con transcripción y documentos que los miembros pueden llevar a su próxima cita.",
    seeded: true,
    modules: PHASE_ORDER.map((phaseKey) => {
      const phase = JOURNEY_PHASES[phaseKey];
      return {
        id: `module-${phaseKey}`,
        titleEn: phase.titleEn,
        titleEs: phase.titleEs,
        classes: JOURNEY_DAYS.filter((day) => day.phase === phaseKey).map(
          (day) => ({
            id: day.slug,
            titleEn: day.titleEn,
            titleEs: day.titleEs,
            summaryEn: day.summaryEn,
            summaryEs: day.summaryEs,
            kind: day.kind,
            durationMinutes: day.durationMinutes,
            mediaSrc: day.videoSrc,
            bodyEn: "",
            bodyEs: "",
            keyPointsEn: [...day.keyPointsEn],
            keyPointsEs: [...day.keyPointsEs],
            transcript: day.transcript.map((cue, index) => ({
              id: `${day.slug}-cue-${index}`,
              at: cue.at,
              textEn: cue.textEn,
              textEs: cue.textEs,
            })),
            documents: day.documents.map((doc) => ({ ...doc })),
          }),
        ),
      };
    }),
  };
}

function readStoredCourses(): Course[] {
  if (typeof window === "undefined") return [buildSeedCourse()];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [buildSeedCourse()];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [buildSeedCourse()];
    }
    return parsed as Course[];
  } catch {
    return [buildSeedCourse()];
  }
}

function persistCourses(courses: Course[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  } catch {
    // Storage can be unavailable (private window, blocked site data). Edits
    // still apply for this session rather than breaking the page.
  }
}

export function courseClassCount(course: Course): number {
  return course.modules.reduce(
    (total, courseModule) => total + courseModule.classes.length,
    0,
  );
}

export function courseMinutes(course: Course): number {
  return course.modules.reduce(
    (total, courseModule) =>
      total +
      courseModule.classes.reduce(
        (sum, courseClass) => sum + courseClass.durationMinutes,
        0,
      ),
    0,
  );
}

export function moduleMinutes(courseModule: CourseModule): number {
  return courseModule.classes.reduce(
    (total, courseClass) => total + courseClass.durationMinutes,
    0,
  );
}

export function courseDocumentCount(course: Course): number {
  return course.modules.reduce(
    (total, courseModule) =>
      total +
      courseModule.classes.reduce(
        (sum, courseClass) => sum + courseClass.documents.length,
        0,
      ),
    0,
  );
}

export function emptyClass(): CourseClass {
  return {
    id: createId("class"),
    titleEn: "",
    titleEs: "",
    summaryEn: "",
    summaryEs: "",
    kind: "video",
    durationMinutes: 5,
    mediaSrc: "",
    bodyEn: "",
    bodyEs: "",
    keyPointsEn: [],
    keyPointsEs: [],
    transcript: [],
    documents: [],
  };
}

export function useCourseLibrary() {
  const [courses, setCourses] = useState<Course[]>(readStoredCourses);

  const commit = useCallback((next: Course[]) => {
    persistCourses(next);
    setCourses(next);
  }, []);

  const getCourse = useCallback(
    (courseId: string) => courses.find((course) => course.id === courseId),
    [courses],
  );

  const createCourse = useCallback(
    (input: Omit<Course, "id" | "modules" | "seeded">) => {
      const course: Course = {
        ...input,
        id: createId("course"),
        seeded: false,
        modules: [],
      };
      commit([...courses, course]);
      return course;
    },
    [courses, commit],
  );

  const updateCourse = useCallback(
    (courseId: string, patch: Partial<Omit<Course, "id" | "modules">>) => {
      commit(
        courses.map((course) =>
          course.id === courseId ? { ...course, ...patch } : course,
        ),
      );
    },
    [courses, commit],
  );

  const deleteCourse = useCallback(
    (courseId: string) => {
      commit(
        courses.filter((course) => course.id !== courseId || course.seeded),
      );
    },
    [courses, commit],
  );

  /** Applies a change to one course's module list and writes it back. */
  const mapModules = useCallback(
    (courseId: string, fn: (modules: CourseModule[]) => CourseModule[]) => {
      commit(
        courses.map((course) =>
          course.id === courseId
            ? { ...course, modules: fn(course.modules) }
            : course,
        ),
      );
    },
    [courses, commit],
  );

  const createModule = useCallback(
    (courseId: string, titleEn: string, titleEs: string) => {
      mapModules(courseId, (modules) => [
        ...modules,
        { id: createId("module"), titleEn, titleEs, classes: [] },
      ]);
    },
    [mapModules],
  );

  const updateModule = useCallback(
    (
      courseId: string,
      moduleId: string,
      patch: Partial<Omit<CourseModule, "id" | "classes">>,
    ) => {
      mapModules(courseId, (modules) =>
        modules.map((entry) =>
          entry.id === moduleId ? { ...entry, ...patch } : entry,
        ),
      );
    },
    [mapModules],
  );

  const deleteModule = useCallback(
    (courseId: string, moduleId: string) => {
      mapModules(courseId, (modules) =>
        modules.filter((entry) => entry.id !== moduleId),
      );
    },
    [mapModules],
  );

  const createClass = useCallback(
    (courseId: string, moduleId: string, courseClass: CourseClass) => {
      mapModules(courseId, (modules) =>
        modules.map((entry) =>
          entry.id === moduleId
            ? { ...entry, classes: [...entry.classes, courseClass] }
            : entry,
        ),
      );
    },
    [mapModules],
  );

  const updateClass = useCallback(
    (courseId: string, moduleId: string, courseClass: CourseClass) => {
      mapModules(courseId, (modules) =>
        modules.map((entry) =>
          entry.id === moduleId
            ? {
                ...entry,
                classes: entry.classes.map((existing) =>
                  existing.id === courseClass.id ? courseClass : existing,
                ),
              }
            : entry,
        ),
      );
    },
    [mapModules],
  );

  const deleteClass = useCallback(
    (courseId: string, moduleId: string, classId: string) => {
      mapModules(courseId, (modules) =>
        modules.map((entry) =>
          entry.id === moduleId
            ? {
                ...entry,
                classes: entry.classes.filter(
                  (existing) => existing.id !== classId,
                ),
              }
            : entry,
        ),
      );
    },
    [mapModules],
  );

  const totals = useMemo(
    () => ({
      courses: courses.length,
      modules: courses.reduce(
        (total, course) => total + course.modules.length,
        0,
      ),
      classes: courses.reduce(
        (total, course) => total + courseClassCount(course),
        0,
      ),
      minutes: courses.reduce(
        (total, course) => total + courseMinutes(course),
        0,
      ),
    }),
    [courses],
  );

  return {
    courses,
    totals,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    createModule,
    updateModule,
    deleteModule,
    createClass,
    updateClass,
    deleteClass,
  };
}
