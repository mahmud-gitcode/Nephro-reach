"use client";

/* ==========================================================================
   The curriculum editor's data: courses on the platform routes (Phase 13)
   --------------------------------------------------------------------------
   The NephroReach content team (platform `content` permission; the server
   refuses everyone else, the UI only follows) reads every course in every
   status and changes one record per call:
     course create / edit (changed fields only; the final exam is one field,
     sent whole) / delete / publish / unpublish / archive;
     module add / rename / delete; class add / edit / delete.
   The full course (with answer keys) is filed under platformKey, never
   under the member copy's key. Nothing is kept in this browser.
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { platformKey } from "@/lib/data/queryKeys";
import type { Course, CourseClass, CourseSettings } from "./courseLibrary";
import {
  fromApiCourse,
  fromApiCourseSummary,
  toApiQuestion,
} from "./education.mappers";
import {
  createPlatformClass,
  createPlatformCourse,
  createPlatformModule,
  deletePlatformClass,
  deletePlatformCourse,
  deletePlatformModule,
  getPlatformCourse,
  listPlatformCourses,
  setPlatformCourseStatus,
  updatePlatformClass,
  updatePlatformCourse,
  updatePlatformModule,
  type CourseStatusAction,
  type PlatformClassBody,
  type PlatformCourseBody,
} from "./education.repository";
import { toFileSlug } from "./vtt";

export { isFirstPartyMediaUrl } from "./education.mappers";

/** A class as the API takes it (renames; the slug from the title when
 *  none is set). The id is never sent: the server owns it. */
export function toClassBody(courseClass: CourseClass): PlatformClassBody {
  return {
    slug: courseClass.slug || toFileSlug(courseClass.titleEn),
    titleEn: courseClass.titleEn.trim(),
    titleEs: courseClass.titleEs,
    summaryEn: courseClass.summaryEn,
    summaryEs: courseClass.summaryEs,
    kind: courseClass.kind,
    durationMinutes: courseClass.durationMinutes,
    mediaUrl: courseClass.mediaSrc.trim(),
    posterUrl: courseClass.poster.trim(),
    bodyEn: courseClass.bodyEn,
    bodyEs: courseClass.bodyEs,
    keyPointsEn: courseClass.keyPointsEn,
    keyPointsEs: courseClass.keyPointsEs,
    transcript: courseClass.transcript,
    documents: courseClass.documents,
    activities: courseClass.activities.map(toApiQuestion),
    videoQuestions: courseClass.videoQuestions.map((entry) => ({
      id: entry.id,
      at: entry.at,
      question: toApiQuestion(entry.question),
    })),
  };
}

type CourseInput = Pick<
  Course,
  "titleEn" | "titleEs" | "descriptionEn" | "descriptionEs"
> &
  Partial<CourseSettings> & { slug?: string };

export const platformCoursesKey = platformKey("courses");

/** Every course, every status: the editor's library. */
export function usePlatformCourses() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: platformCoursesKey,
    queryFn: () => listPlatformCourses({ limit: 150 }),
  });
  const courses = useMemo(
    () => (query.data?.items ?? []).map(fromApiCourseSummary),
    [query.data],
  );
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: platformCoursesKey });

  const create = useMutation({
    mutationFn: (input: CourseInput) =>
      createPlatformCourse({
        ...input,
        slug: input.slug || toFileSlug(input.titleEn),
        titleEn: input.titleEn.trim(),
      } as PlatformCourseBody),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (courseId: string) => deletePlatformCourse(courseId),
    onSuccess: refresh,
  });

  const totals = useMemo(
    () => ({
      courses: courses.length,
      modules: courses.reduce((sum, c) => sum + (c.counts?.modules ?? 0), 0),
      classes: courses.reduce((sum, c) => sum + (c.counts?.classes ?? 0), 0),
      minutes: courses.reduce((sum, c) => sum + (c.counts?.minutes ?? 0), 0),
    }),
    [courses],
  );

  const { mutate: createMutate } = create;
  const { mutate: removeMutate } = remove;

  return {
    courses,
    totals,
    hasMore: Boolean(query.data?.pagination?.hasNext),
    createCourse: useCallback(
      (input: CourseInput) => createMutate(input),
      [createMutate],
    ),
    deleteCourse: useCallback(
      (courseId: string) => removeMutate(courseId),
      [removeMutate],
    ),
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    isSaving: create.isPending || remove.isPending,
    saveError: create.error ?? remove.error,
    dismissSaveError: () => {
      create.reset();
      remove.reset();
    },
  };
}

type Op =
  | { kind: "course"; patch: PlatformCourseBody }
  | { kind: "status"; action: CourseStatusAction }
  | { kind: "module-add"; titleEn: string; titleEs: string }
  | {
      kind: "module-edit";
      moduleId: string;
      titleEn?: string;
      titleEs?: string;
    }
  | { kind: "module-delete"; moduleId: string }
  | { kind: "class-add"; moduleId: string; courseClass: CourseClass }
  | { kind: "class-edit"; courseClass: CourseClass }
  | { kind: "class-delete"; classId: string };

/** One course in the editor, with every per-record write. */
export function usePlatformCourse(courseId: string) {
  const queryClient = useQueryClient();
  const key = platformKey("course", courseId || "none");
  const query = useQuery({
    queryKey: key,
    queryFn: () => getPlatformCourse(courseId),
    enabled: Boolean(courseId),
  });
  const course = useMemo(
    () => (query.data ? fromApiCourse(query.data) : undefined),
    [query.data],
  );

  const write = useMutation({
    mutationFn: async (op: Op) => {
      switch (op.kind) {
        case "course":
          return updatePlatformCourse(courseId, op.patch);
        case "status":
          return setPlatformCourseStatus(courseId, op.action);
        case "module-add":
          return createPlatformModule(courseId, {
            titleEn: op.titleEn,
            titleEs: op.titleEs,
          });
        case "module-edit":
          return updatePlatformModule(courseId, op.moduleId, {
            titleEn: op.titleEn,
            titleEs: op.titleEs,
          });
        case "module-delete":
          return deletePlatformModule(courseId, op.moduleId);
        case "class-add":
          return createPlatformClass(
            courseId,
            op.moduleId,
            toClassBody(op.courseClass),
          );
        case "class-edit":
          return updatePlatformClass(
            courseId,
            op.courseClass.id,
            toClassBody(op.courseClass),
          );
        case "class-delete":
          return deletePlatformClass(courseId, op.classId);
      }
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: key }),
        queryClient.invalidateQueries({ queryKey: platformCoursesKey }),
        /* Members read published content: drop their copy too. */
        queryClient.invalidateQueries({ queryKey: ["education"] }),
      ]),
  });
  const { mutate } = write;

  /* The editor screens pass the course id first (their old signatures). */
  return {
    course,
    getCourse: useCallback(
      (id: string) => (id === courseId ? course : undefined),
      [course, courseId],
    ),
    updateCourse: useCallback(
      (_id: string, patch: Partial<Omit<Course, "id" | "modules">>) => {
        const body: PlatformCourseBody = {};
        const keys = [
          "titleEn",
          "titleEs",
          "descriptionEn",
          "descriptionEs",
          "groupLabelEn",
          "groupLabelEs",
          "itemLabelEn",
          "itemLabelEs",
          "passMark",
          "maxAttempts",
          "showAnswers",
          "certificateEnabled",
          "requireExamPass",
        ] as const;
        for (const name of keys)
          if (patch[name] !== undefined && patch[name] !== course?.[name])
            (body as Record<string, unknown>)[name] = patch[name];
        if (patch.finalExam !== undefined)
          body.finalExam = patch.finalExam.map(toApiQuestion);
        if (Object.keys(body).length > 0)
          mutate({ kind: "course", patch: body });
      },
      [mutate, course],
    ),
    setStatus: useCallback(
      (action: CourseStatusAction) => mutate({ kind: "status", action }),
      [mutate],
    ),
    createModule: useCallback(
      (_id: string, titleEn: string, titleEs: string) =>
        mutate({ kind: "module-add", titleEn, titleEs }),
      [mutate],
    ),
    updateModule: useCallback(
      (
        _id: string,
        moduleId: string,
        patch: { titleEn?: string; titleEs?: string },
      ) =>
        mutate({
          kind: "module-edit",
          moduleId,
          titleEn: patch.titleEn,
          titleEs: patch.titleEs,
        }),
      [mutate],
    ),
    deleteModule: useCallback(
      (_id: string, moduleId: string) =>
        mutate({ kind: "module-delete", moduleId }),
      [mutate],
    ),
    createClass: useCallback(
      (_id: string, moduleId: string, courseClass: CourseClass) =>
        mutate({ kind: "class-add", moduleId, courseClass }),
      [mutate],
    ),
    updateClass: useCallback(
      (_id: string, _moduleId: string, courseClass: CourseClass) =>
        mutate({ kind: "class-edit", courseClass }),
      [mutate],
    ),
    deleteClass: useCallback(
      (_id: string, _moduleId: string, classId: string) =>
        mutate({ kind: "class-delete", classId }),
      [mutate],
    ),
    isPending: Boolean(courseId) ? query.isPending : false,
    error: query.error,
    refetch: () => void query.refetch(),
    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
  };
}
