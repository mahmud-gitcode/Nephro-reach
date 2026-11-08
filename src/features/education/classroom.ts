"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CATALOG_PAGE_LIMIT,
  Course,
  CourseClassKind,
  CourseDocument,
  CourseModule,
  courseCatalogKey,
  DEFAULT_POSTER,
} from "./courseLibrary";
import type { TranscriptCue } from "./dialysisJourneyData";
import {
  fromApiCourse,
  isFirstPartyMediaUrl,
  JOURNEY_COURSE_SLUG,
} from "./education.mappers";
import {
  getPublishedCourse,
  listPublishedCourses,
} from "./education.repository";
import type { Question, VideoQuestion } from "./questions.types";

/* ==========================================================================
   The member classroom, read from the course catalogue (Phase 13)
   --------------------------------------------------------------------------
   The content team builds courses on the server; the classroom shows the
   published 21-day journey, found by its slug (never a fixed id). A failed
   read is an error, never a fallback course.
   This file flattens a course into what the member screens need — lessons
   in order, grouped under their module — so the screens never reach into
   the admin shape directly.
   ========================================================================== */

export interface ClassroomGroup {
  id: string;
  /** 1-based position, for "Module 2" / "Day 2". */
  number: number;
  /** "Module 2", in the course's own word for a group. */
  labelEn: string;
  labelEs: string;
  titleEn: string;
  titleEs: string;
}

export interface ClassroomLesson {
  /**
   * 1-based lesson number. Exams do not take a number of their own; they
   * carry the number of the lesson before them.
   */
  day: number;
  /** The class slug. Used in the lesson URL. */
  slug: string;
  /** The class server id. Used in API calls and the exam quiz key. */
  classId: string;
  groupId: string;
  kind: CourseClassKind;
  titleEn: string;
  titleEs: string;
  summaryEn: string;
  summaryEs: string;
  durationMinutes: number;
  poster: string;
  videoSrc: string;
  bodyEn: string;
  bodyEs: string;
  keyPointsEn: string[];
  keyPointsEs: string[];
  transcript: TranscriptCue[];
  documents: CourseDocument[];
  activities: Question[];
  videoQuestions: VideoQuestion[];
}

export interface CourseWords {
  /** "Module" */
  group: string;
  /** "Day" */
  item: string;
}

export function courseWords(
  course: Course | undefined,
  isEs: boolean,
): CourseWords {
  if (!course)
    return isEs
      ? { group: "Módulo", item: "Día" }
      : { group: "Module", item: "Day" };
  return isEs
    ? {
        group: course.groupLabelEs || course.groupLabelEn,
        item: course.itemLabelEs || course.itemLabelEn,
      }
    : { group: course.groupLabelEn, item: course.itemLabelEn };
}

export function toGroups(course: Course): ClassroomGroup[] {
  return course.modules.map((courseModule: CourseModule, index) => ({
    id: courseModule.id,
    number: index + 1,
    labelEn: `${course.groupLabelEn} ${index + 1}`,
    labelEs: `${course.groupLabelEs || course.groupLabelEn} ${index + 1}`,
    titleEn: courseModule.titleEn,
    titleEs: courseModule.titleEs || courseModule.titleEn,
  }));
}

export function toLessons(course: Course): ClassroomLesson[] {
  let position = 0;
  return course.modules.flatMap((courseModule) =>
    courseModule.classes.map((courseClass) => {
      if (courseClass.kind !== "exam") position += 1;
      return {
        day: Math.max(position, 1),
        slug: courseClass.slug,
        classId: courseClass.id,
        groupId: courseModule.id,
        kind: courseClass.kind,
        titleEn: courseClass.titleEn,
        titleEs: courseClass.titleEs || courseClass.titleEn,
        summaryEn: courseClass.summaryEn,
        summaryEs: courseClass.summaryEs || courseClass.summaryEn,
        durationMinutes: courseClass.durationMinutes,
        /* D18: only first-party media play; anything else shows as
           unavailable rather than loading a third-party host. */
        poster:
          courseClass.poster && isFirstPartyMediaUrl(courseClass.poster)
            ? courseClass.poster
            : DEFAULT_POSTER,
        videoSrc: isFirstPartyMediaUrl(courseClass.mediaSrc)
          ? courseClass.mediaSrc
          : "",
        bodyEn: courseClass.bodyEn,
        bodyEs: courseClass.bodyEs || courseClass.bodyEn,
        keyPointsEn: courseClass.keyPointsEn,
        keyPointsEs:
          courseClass.keyPointsEs.length > 0
            ? courseClass.keyPointsEs
            : courseClass.keyPointsEn,
        transcript: courseClass.transcript.map((cue) => ({
          at: cue.at,
          textEn: cue.textEn,
          textEs: cue.textEs || cue.textEn,
        })),
        documents: courseClass.documents,
        activities: courseClass.activities,
        videoQuestions: courseClass.videoQuestions,
      };
    }),
  );
}

/** "3h 25m" / "45m" */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return `${hours}h ${String(rest).padStart(2, "0")}m`;
}

/** The journey course, published and blinded for members. Shared content,
 *  not patient data: the key holds no patient. */
export function useJourneyCourse(slug: string = JOURNEY_COURSE_SLUG) {
  const catalog = useQuery({
    queryKey: courseCatalogKey,
    queryFn: () => listPublishedCourses({ limit: CATALOG_PAGE_LIMIT }),
  });
  const courseId = catalog.data?.items.find((row) => row.slug === slug)?.id;
  const detail = useQuery({
    queryKey: ["education", "course", courseId ?? "none"],
    queryFn: () => getPublishedCourse(courseId as string),
    enabled: Boolean(courseId),
  });
  const course = useMemo(
    () => (detail.data ? fromApiCourse(detail.data) : undefined),
    [detail.data],
  );
  return {
    course,
    courseId,
    /** The catalogue loaded and has no such course: not published yet. */
    missing: catalog.isSuccess && !courseId,
    isPending: catalog.isPending || (Boolean(courseId) && detail.isPending),
    error: catalog.error ?? detail.error,
    refetch: () => {
      void catalog.refetch();
      if (courseId) void detail.refetch();
    },
  };
}

/** The course the classroom shows, flattened for the member screens. */
export function useClassroom() {
  const journey = useJourneyCourse();
  const course = journey.course;

  const lessons = useMemo(() => (course ? toLessons(course) : []), [course]);
  const groups = useMemo(() => (course ? toGroups(course) : []), [course]);

  const totalMinutes = useMemo(
    () => lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0),
    [lessons],
  );

  return {
    course,
    lessons,
    groups,
    totalMinutes,
    missing: journey.missing,
    getLesson: (slug: string) => lessons.find((lesson) => lesson.slug === slug),
    getGroup: (groupId: string) => groups.find((group) => group.id === groupId),
    isPending: journey.isPending,
    error: journey.error,
    refetch: journey.refetch,
  };
}
