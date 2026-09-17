"use client";

import { useMemo } from "react";
import {
  CLASSROOM_COURSE_ID,
  Course,
  CourseClassKind,
  CourseDocument,
  CourseModule,
  useCourseLibrary,
} from "./courseLibrary";
import type { TranscriptCue } from "./dialysisJourneyData";
import { FINAL_QUIZ_KEY, hasPassed } from "./questions.rules";
import type { Question, QuizAttempt, VideoQuestion } from "./questions.types";

/* ==========================================================================
   The member classroom, read from the course catalogue
   --------------------------------------------------------------------------
   Admins build courses in the catalogue; the classroom shows one of them.
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
  /** The class id. Used in the lesson URL. */
  slug: string;
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
        slug: courseClass.id,
        groupId: courseModule.id,
        kind: courseClass.kind,
        titleEn: courseClass.titleEn,
        titleEs: courseClass.titleEs || courseClass.titleEn,
        summaryEn: courseClass.summaryEn,
        summaryEs: courseClass.summaryEs || courseClass.summaryEn,
        durationMinutes: courseClass.durationMinutes,
        poster: courseClass.poster,
        videoSrc: courseClass.mediaSrc,
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

/** The course the classroom shows, flattened for the member screens. */
export function useClassroom(courseId: string = CLASSROOM_COURSE_ID) {
  const library = useCourseLibrary();
  const course =
    library.getCourse(courseId) ??
    library.courses.find((entry) => entry.seeded) ??
    library.courses[0];

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
    getLesson: (slug: string) => lessons.find((lesson) => lesson.slug === slug),
    getGroup: (groupId: string) => groups.find((group) => group.id === groupId),
    isPending: library.isPending,
    error: library.error,
    refetch: library.refetch,
  };
}

/**
 * Where the member stands on the certificate: every lesson finished, and the
 * final exam passed when the course asks for it.
 */
export function certificateStatus(
  course: Course,
  lessons: ClassroomLesson[],
  progress: Record<string, { status: string } | undefined>,
  attempts: QuizAttempt[],
) {
  const lessonsDone = lessons.filter(
    (lesson) => progress[lesson.slug]?.status === "completed",
  ).length;
  const allLessons = lessons.length > 0 && lessonsDone === lessons.length;
  const examNeeded = course.requireExamPass && course.finalExam.length > 0;
  const examPassed = hasPassed(attempts, FINAL_QUIZ_KEY);
  return {
    lessonsDone,
    lessonsTotal: lessons.length,
    allLessons,
    examNeeded,
    examPassed,
    eligible:
      course.certificateEnabled && allLessons && (!examNeeded || examPassed),
  };
}
