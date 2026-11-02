"use client";

/* ==========================================================================
   The learner record of one course, from the API (Phase 13)
   --------------------------------------------------------------------------
   GET /patients/:pid/education/courses/:cid holds everything the
   classroom shows about the patient: progress per class (with the note),
   lesson answers, exam attempts, the certificate, the server's certificate
   status and the access state. Keyed by patient AND context (ADR 0007 §2):
   a caregiver reads the patient of the grant they picked; an office reads
   only when it enrolled the patient (and then gets no notes or answers).

   Writes are one call per record and invalidate this one key:
   - open / watched / complete / reopen a class;
   - the class note (debounced by the caller);
   - one lesson answer (PUT / DELETE);
   - an exam attempt: the server scores it; the response (with
     `attemptsLeft` and the D19 `review`) is returned to the caller and is
     NEVER written into the cache;
   - the certificate: POST with no body; the server decides eligibility and
     prints the name.
   Nothing is computed for the record on this side: percent, next class and
   certificate eligibility are the server's.
   ========================================================================== */

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isApiError } from "@/lib/api/client";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import type { Course } from "./courseLibrary";
import {
  classIdForQuestion,
  fromApiAttempt,
  fromApiCertificate,
  fromApiSubmit,
  toAnswerBody,
  toAnswerMap,
  toAttemptBody,
  toNotesMap,
  toProgressMap,
  type ApiLearnerCourse,
} from "./education.mappers";
import {
  clearLessonAnswer,
  completeClass,
  getLearnerCourse,
  issueCertificate,
  openClass,
  recordWatched,
  reopenClass,
  saveClassNote,
  saveLessonAnswer,
  selfEnroll,
  submitQuizAttempt,
} from "./education.repository";
import type { Answer, CertificateStatus } from "./questions.types";

export const EDUCATION_FEATURE = "education";

/** Every education read of one patient in one context. */
export function educationKey(scope: PatientScope | null) {
  return scopedKey(scope, EDUCATION_FEATURE);
}

export function learnerCourseKey(
  scope: PatientScope | null,
  courseId: string | undefined,
) {
  return scopedKey(scope, EDUCATION_FEATURE, "course", courseId ?? "none");
}

/** The server's refusal codes the classroom turns into a state. */
export const EDU_CODES = {
  notEnrolled: "education.course_not_enrolled",
  accessEnded: "education.course_access_ended",
  attemptsUsedUp: "education.attempts_used_up",
  answerDoesNotFit: "education.answer_does_not_fit",
  notEligible: "education.certificate_not_eligible",
  activitiesUnanswered: "education.class_activities_unanswered",
  examNotPassed: "education.exam_not_passed",
} as const;

export function hasCode(error: unknown, code: string): boolean {
  return isApiError(error, { code });
}

const EMPTY_STATUS: CertificateStatus = {
  lessonsDone: 0,
  lessonsTotal: 0,
  allLessons: false,
  examNeeded: false,
  examPassed: false,
  eligible: false,
};

export function useLearnerCourse(
  course: Course | undefined,
  explicitScope?: PatientScope | null,
) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const courseId = course?.id;
  const key = learnerCourseKey(scope, courseId);

  const query = useQuery({
    queryKey: key,
    queryFn: () => getLearnerCourse(requireScope(scope), courseId as string),
    enabled: Boolean(courseId),
  });

  const data: ApiLearnerCourse | undefined = query.data;
  const refresh = () => queryClient.invalidateQueries({ queryKey: key });
  const target = () => requireScope(scope);
  const need = (value: string | undefined, what: string) => {
    if (!value) throw new Error(`No ${what} for this call.`);
    return value;
  };

  const classCall = useMutation({
    mutationFn: async ({
      action,
      classId,
      percent,
    }: {
      action: "open" | "watched" | "complete" | "reopen";
      classId: string;
      percent?: number;
    }) => {
      const s = target();
      if (action === "open") return openClass(s, classId);
      if (action === "watched")
        return recordWatched(s, classId, Math.round(percent ?? 0));
      if (action === "complete") return completeClass(s, classId);
      return reopenClass(s, classId);
    },
    onSuccess: refresh,
  });

  const note = useMutation({
    mutationFn: ({ classId, text }: { classId: string; text: string }) =>
      saveClassNote(target(), classId, text),
    onSuccess: refresh,
  });

  const answer = useMutation({
    mutationFn: async ({
      draft,
      clear,
    }: {
      draft: Omit<Answer, "answeredAt">;
      clear?: boolean;
    }) => {
      const classId = need(
        classIdForQuestion(course, draft.questionId),
        "lesson",
      );
      return clear
        ? clearLessonAnswer(target(), classId, draft.questionId)
        : saveLessonAnswer(
            target(),
            classId,
            draft.questionId,
            toAnswerBody(draft),
          );
    },
    onSuccess: refresh,
  });

  const attempt = useMutation({
    mutationFn: async ({
      quizKey,
      answers,
    }: {
      quizKey: string;
      answers: Record<string, Omit<Answer, "answeredAt">>;
    }) =>
      fromApiSubmit(
        await submitQuizAttempt(
          target(),
          need(courseId, "course"),
          toAttemptBody(quizKey, answers),
        ),
      ),
    /* Only the attempt list is re-read; the review stays with the caller. */
    onSettled: refresh,
  });

  const issue = useMutation({
    mutationFn: async () =>
      fromApiCertificate(
        await issueCertificate(target(), need(courseId, "course")),
      ),
    onSuccess: refresh,
  });

  const enroll = useMutation({
    mutationFn: () => selfEnroll(target(), need(courseId, "course")),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: educationKey(scope) }),
  });

  const view = useMemo(() => {
    const rows = data?.progress ?? [];
    return {
      progress: toProgressMap(rows, course),
      notes: toNotesMap(rows, course),
      answers: toAnswerMap(data?.answers ?? []),
      attempts: (data?.attempts ?? []).map(fromApiAttempt),
      certificate: data?.certificate
        ? fromApiCertificate(data.certificate)
        : undefined,
      certificateStatus: data?.certificateStatus ?? EMPTY_STATUS,
    };
  }, [data, course]);

  return {
    scope,
    courseId,
    ...view,
    /** Course percent and the next class, from the server. */
    percent: data?.percent ?? 0,
    nextClassId: data?.nextClassId ?? null,
    access: data?.access ?? null,
    /** Read-only: the patient may look but not save (not enrolled, or
     *  access ended). */
    canWrite: Boolean(data?.access.open),

    classCall,
    note,
    answer,
    attempt,
    issue,
    enroll,

    isPending: Boolean(courseId) ? query.isPending : false,
    error: query.error,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
