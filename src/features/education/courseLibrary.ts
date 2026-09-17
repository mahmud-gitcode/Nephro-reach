"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import {
  JOURNEY_DAYS,
  JOURNEY_PHASES,
  JourneyDocumentKind,
  JourneyMediaKind,
  PHASE_ORDER,
} from "@/features/education/dialysisJourneyData";
import {
  SEED_ACTIVITIES,
  SEED_EXAMS,
  SEED_FINAL_EXAM,
  SEED_VIDEO_QUESTIONS,
} from "@/features/education/classroom.seed";
import type {
  Question,
  VideoQuestion,
} from "@/features/education/questions.types";

/**
 * The course catalogue: course -> modules -> classes. Admins build it, and
 * the member classroom reads the same catalogue.
 *
 * The 21-Day Dialysis Journey is imported from `dialysisJourneyData` the first
 * time the library is opened, so the admin starts from the real course rather
 * than an empty screen.
 */

/**
 * How a class is delivered. An "exam" class is a scored set of questions the
 * admin can place anywhere in a module; its questions live in `activities`.
 */
export type CourseClassKind = JourneyMediaKind | "exam";
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
  /** Cover image for the class card and the video poster. */
  poster: string;
  /**
   * Questions under the lesson, answered but not marked. For an exam class,
   * the scored exam questions.
   */
  activities: Question[];
  /** Questions that pause the video at a set time. */
  videoQuestions: VideoQuestion[];
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

  /* ---- settings ---- */
  /** What a module is called in this course: "Module", "Day", "Week"... */
  groupLabelEn: string;
  groupLabelEs: string;
  /** What a class is called: "Class", "Lesson", "Day"... */
  itemLabelEn: string;
  itemLabelEs: string;
  /** Percent needed to pass a module check or the final exam. */
  passMark: number;
  /** Tries allowed per check or exam. 0 is unlimited. */
  maxAttempts: number;
  /** Show the right answers on the results screen. */
  showAnswers: boolean;
  /** Issue a certificate when the course is finished. */
  certificateEnabled: boolean;
  /** The final exam must be passed before the certificate. */
  requireExamPass: boolean;
  finalExam: Question[];
  /** Bumped when the seeded course gains new sample content. */
  seedVersion?: number;
}

export type CourseSettings = Pick<
  Course,
  | "groupLabelEn"
  | "groupLabelEs"
  | "itemLabelEn"
  | "itemLabelEs"
  | "passMark"
  | "maxAttempts"
  | "showAnswers"
  | "certificateEnabled"
  | "requireExamPass"
>;

export const DEFAULT_COURSE_SETTINGS: CourseSettings = {
  groupLabelEn: "Module",
  groupLabelEs: "Módulo",
  itemLabelEn: "Class",
  itemLabelEs: "Clase",
  passMark: 70,
  maxAttempts: 3,
  showAnswers: true,
  certificateEnabled: true,
  requireExamPass: true,
};

/** The course the member classroom shows. */
export const CLASSROOM_COURSE_ID = "course-dialysis-journey";

const STORAGE_KEY = storageKey("course-library");

/** Used for classes that have no cover image of their own. */
export const DEFAULT_POSTER = JOURNEY_DAYS[0]?.poster ?? "";

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

const SEED_VERSION = 2;

/** An exam class for the seeded course, when one closes this module. */
function seedExamClass(moduleId: string): CourseClass[] {
  const exam = SEED_EXAMS[moduleId];
  if (!exam) return [];
  return [
    {
      ...emptyClass(),
      id: exam.id,
      kind: "exam",
      titleEn: exam.titleEn,
      titleEs: exam.titleEs,
      summaryEn: "A short scored check on what this module covered.",
      summaryEs: "Una breve evaluación de lo que cubrió este módulo.",
      durationMinutes: 5,
      activities: exam.questions,
    },
  ];
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
    ...DEFAULT_COURSE_SETTINGS,
    itemLabelEn: "Day",
    itemLabelEs: "Día",
    finalExam: SEED_FINAL_EXAM,
    seedVersion: SEED_VERSION,
    modules: PHASE_ORDER.map((phaseKey) => {
      const phase = JOURNEY_PHASES[phaseKey];
      return {
        id: `module-${phaseKey}`,
        titleEn: phase.titleEn,
        titleEs: phase.titleEs,
        classes: JOURNEY_DAYS.filter((day) => day.phase === phaseKey)
          .map((day): CourseClass => ({
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
            poster: day.poster,
            activities: SEED_ACTIVITIES[day.slug] ?? [],
            videoQuestions: SEED_VIDEO_QUESTIONS[day.slug] ?? [],
          }))
          .concat(seedExamClass(`module-${phaseKey}`)),
      };
    }),
  };
}

/**
 * Fills in fields added after a catalogue was first saved, so an older
 * catalogue in someone's browser opens without errors. The seeded course
 * also picks up its sample questions and posters the first time.
 */
function normalizeCourse(course: Partial<Course> & { id: string }): Course {
  const seed = course.seeded ? buildSeedCourse() : null;
  const seedClass = (classId: string) =>
    seed?.modules
      .flatMap((entry) => entry.classes)
      .find((entry) => entry.id === classId);

  return {
    ...DEFAULT_COURSE_SETTINGS,
    ...(seed
      ? { itemLabelEn: seed.itemLabelEn, itemLabelEs: seed.itemLabelEs }
      : {}),
    titleEn: "",
    titleEs: "",
    descriptionEn: "",
    descriptionEs: "",
    seeded: false,
    ...course,
    finalExam: course.finalExam ?? seed?.finalExam ?? [],
    seedVersion: seed ? SEED_VERSION : course.seedVersion,
    modules: (course.modules ?? []).map((courseModule) => ({
      id: courseModule.id,
      titleEn: courseModule.titleEn,
      titleEs: courseModule.titleEs,
      classes: [
        ...(courseModule.classes ?? []),
        // Sample exams added after this catalogue was saved, once only.
        ...(seed && (course.seedVersion ?? 1) < SEED_VERSION
          ? seedExamClass(courseModule.id).filter(
              (exam) =>
                !(courseModule.classes ?? []).some(
                  (entry) => entry.id === exam.id,
                ),
            )
          : []),
      ].map((courseClass) => {
        const fromSeed = seedClass(courseClass.id);
        return {
          ...courseClass,
          poster: courseClass.poster ?? fromSeed?.poster ?? DEFAULT_POSTER,
          activities: courseClass.activities ?? fromSeed?.activities ?? [],
          videoQuestions:
            courseClass.videoQuestions ?? fromSeed?.videoQuestions ?? [],
        };
      }),
    })),
  };
}

/* STORAGE — the whole of it. */

async function listCourses(): Promise<Course[]> {
  const stored = await readJson<Course[] | null>(STORAGE_KEY, null);
  /* An empty catalogue is not a state anyone meant to create — the seeded
     course cannot be deleted — so an empty array falls back to the seed. */
  return Array.isArray(stored) && stored.length > 0
    ? stored.map(normalizeCourse)
    : [buildSeedCourse()];
}

async function saveCourses(courses: Course[]): Promise<Course[]> {
  return writeJson(STORAGE_KEY, courses);
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
    poster: DEFAULT_POSTER,
    activities: [],
    videoQuestions: [],
  };
}

export const courseLibraryKey = ["education", "course-library"] as const;

export function useCourseLibrary() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: courseLibraryKey,
    queryFn: listCourses,
  });

  const write = useMutation({
    mutationFn: (courses: Course[]) => saveCourses(courses),
    onSuccess: (courses) => queryClient.setQueryData(courseLibraryKey, courses),
  });

  /* `?? []` on its own would be a new array every render, and every
     useCallback below depends on this. */
  const courses = useMemo(() => query.data ?? [], [query.data]);

  const { mutate } = write;
  /* Each editor call still returns synchronously — the admin screens build
     a new catalogue and hand it over. The write is what is asynchronous,
     and its failure surfaces through saveError rather than a catch {}. */
  const commit = useCallback((next: Course[]) => mutate(next), [mutate]);

  const getCourse = useCallback(
    (courseId: string) => courses.find((course) => course.id === courseId),
    [courses],
  );

  const createCourse = useCallback(
    (
      input: Pick<
        Course,
        "titleEn" | "titleEs" | "descriptionEn" | "descriptionEs"
      > &
        Partial<CourseSettings>,
    ) => {
      const course: Course = {
        ...DEFAULT_COURSE_SETTINGS,
        finalExam: [],
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
        {
          id: createId("module"),
          titleEn,
          titleEs,
          classes: [],
        },
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
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
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
