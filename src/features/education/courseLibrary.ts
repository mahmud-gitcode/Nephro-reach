"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  JourneyDocumentKind,
  JourneyMediaKind,
} from "@/features/education/dialysisJourneyData";
import type {
  Question,
  VideoQuestion,
} from "@/features/education/questions.types";
import { listPublishedCourses } from "./education.repository";
import { fromApiCourseSummary } from "./education.mappers";

/* ==========================================================================
   The course catalogue: course -> modules -> classes (Phase 13)
   --------------------------------------------------------------------------
   Courses live on the server. Members and offices read the published ones
   (GET /courses, paged); the content team edits every status through the
   platform routes (usePlatformCourses). Nothing is kept in this browser and
   no sample course is built here: the 21-day journey and the 3-day crash
   course are loaded once by the content importer (Q-EDU-6).
   ========================================================================== */

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
  /** The file itself, once supplied (e.g. /docs/welcome.pdf). Until then
   *  the member sees the row but cannot open it. */
  href?: string;
}

export interface CourseClass {
  /** The server id (a UUID). API calls use it. */
  id: string;
  /** The URL name (`/my-classroom/day-01`). Unique within the course. */
  slug: string;
  titleEn: string;
  titleEs: string;
  summaryEn: string;
  summaryEs: string;
  kind: CourseClassKind;
  durationMinutes: number;
  /** The server `mediaUrl`: a same-origin path or the storage origin (D18). */
  mediaSrc: string;
  /** Written lesson body, used by reading classes. */
  bodyEn: string;
  bodyEs: string;
  keyPointsEn: string[];
  keyPointsEs: string[];
  transcript: CourseTranscriptCue[];
  documents: CourseDocument[];
  /** Cover image (the server `posterUrl`); "" shows the default picture. */
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
  /** The course URL name; the classroom finds the journey by it. */
  slug: string;
  /** draft | published | archived. Members only ever see published ones. */
  status: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  /** One of the two contracted programs (the 21-day journey, the 3-day
   *  crash course), as opposed to a course the team added since. Read by
   *  the office enrollment list (OFFICE). */
  seeded: boolean;
  modules: CourseModule[];
  /** Hospital programs: days of access after discharge (null = none). */
  accessDaysAfterDischarge: number | null;
  /** Sizes the server counted (list rows have no modules to count). */
  counts?: { modules: number; classes: number; minutes: number };

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

/** Shown for classes that have no cover image of their own (display only). */
export const DEFAULT_POSTER = "/images/Class.jpg";

/** A content id the server accepts (`^[A-Za-z0-9_-]+$`, at most 80). */
export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function courseClassCount(course: Course): number {
  if (course.modules.length === 0 && course.counts)
    return course.counts.classes;
  return course.modules.reduce(
    (total, courseModule) => total + courseModule.classes.length,
    0,
  );
}

export function courseMinutes(course: Course): number {
  if (course.modules.length === 0 && course.counts)
    return course.counts.minutes;
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

/** A new class in the editor. Its id is a placeholder until the server
 *  creates it; the slug is derived from the title when saved. */
export function emptyClass(): CourseClass {
  return {
    id: createId("class"),
    slug: "",
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
    poster: "",
    activities: [],
    videoQuestions: [],
  };
}

/** The published catalogue holds a handful of courses: one page of 50. */
export const CATALOG_PAGE_LIMIT = 50;

/**
 * Published courses (no modules), for the office enrollment list
 * (OFFICE lane, clinic/enrollment.store.ts, until it moves to the API).
 * That list only ADDS courses to the two contracted programs, so a failed
 * read leaves those two rather than blocking the office: it is a program
 * picker, not patient data. Screens that show courses use the hooks below,
 * where an error is an error.
 */
export async function listCourses(): Promise<Course[]> {
  try {
    const page = await listPublishedCourses({ limit: CATALOG_PAGE_LIMIT });
    return page.items.map(fromApiCourseSummary);
  } catch {
    return [];
  }
}

/** Shared course content, not patient data: no patient in the key. */
export const courseCatalogKey = ["education", "catalog"] as const;

/**
 * The published catalogue, read-only. Members and offices use it; the
 * curriculum editor uses usePlatformCourses (every status, with writes).
 */
export function useCourseLibrary() {
  const query = useQuery({
    queryKey: courseCatalogKey,
    queryFn: () => listPublishedCourses({ limit: CATALOG_PAGE_LIMIT }),
  });
  const courses = useMemo(
    () => (query.data?.items ?? []).map(fromApiCourseSummary),
    [query.data],
  );
  const getCourse = useCallback(
    (courseId: string) => courses.find((course) => course.id === courseId),
    [courses],
  );
  return {
    courses,
    hasMore: Boolean(query.data?.pagination?.hasNext),
    getCourse,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}
