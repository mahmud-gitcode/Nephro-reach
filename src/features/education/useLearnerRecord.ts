"use client";

import { useCallback } from "react";
import { useClassroom } from "./classroom";
import type { Answer, QuizSubmitResult } from "./questions.types";
import { useLearnerCourse } from "./useLearnerCourse";

/* ==========================================================================
   The learner record — answers, exam attempts, the certificate (Phase 13)
   --------------------------------------------------------------------------
   From the server's learner record of the journey course. Lesson answers
   are saved one at a time; exam attempts are sent whole and scored by the
   server, which also decides the review (D19) and the certificate. This
   side never grades an exam and never makes a certificate.
   ========================================================================== */

export function useLearnerRecord() {
  const classroom = useClassroom();
  const learner = useLearnerCourse(classroom.course);
  const { mutateAsync: answerAsync } = learner.answer;
  const { mutateAsync: attemptAsync } = learner.attempt;
  const { mutateAsync: certificateAsync } = learner.issue;

  /** Saves a lesson answer (PUT, the latest answer only). */
  const saveAnswer = useCallback(
    (answer: Omit<Answer, "answeredAt">) => answerAsync({ draft: answer }),
    [answerAsync],
  );

  const clearAnswer = useCallback(
    (questionId: string) => answerAsync({ draft: { questionId }, clear: true }),
    [answerAsync],
  );

  /** Sends one exam attempt. The server scores it; the result (with the
   *  attempts left and the review, when D19 allows) goes to the caller. */
  const submitAttempt = useCallback(
    (
      quizKey: string,
      answers: Record<string, Omit<Answer, "answeredAt">>,
    ): Promise<QuizSubmitResult> => attemptAsync({ quizKey, answers }),
    [attemptAsync],
  );

  /** Asks the server for the certificate (no body: it checks eligibility
   *  and prints the name on the patient's record). */
  const issueCertificate = useCallback(
    () => certificateAsync(),
    [certificateAsync],
  );

  return {
    answers: learner.answers,
    attempts: learner.attempts,
    certificate: learner.certificate,
    certificateStatus: learner.certificateStatus,
    access: learner.access,
    canWrite: learner.canWrite,
    saveAnswer,
    clearAnswer,
    submitAttempt,
    issueCertificate,

    isPending: classroom.isPending || learner.isPending,
    error: classroom.error ?? learner.error,
    refetch: () => {
      classroom.refetch();
      learner.refetch();
    },
    answerError: learner.answer.error,
    attemptError: learner.attempt.error,
    certificateError: learner.issue.error,
    saveError:
      learner.answer.error ?? learner.attempt.error ?? learner.issue.error,
    dismissSaveError: () => {
      learner.answer.reset();
      learner.attempt.reset();
      learner.issue.reset();
    },
    isSaving:
      learner.answer.isPending ||
      learner.attempt.isPending ||
      learner.issue.isPending,
  };
}
