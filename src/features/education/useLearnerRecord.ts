"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import * as rules from "./questions.rules";
import type {
  Answer,
  Certificate,
  LearnerRecord,
  Question,
} from "./questions.types";

/* ==========================================================================
   The learner record — answers, exam attempts, certificates
   --------------------------------------------------------------------------
   Kept apart from lesson progress, which the video player writes several
   times a minute. Stored in this browser for now, through the same async
   adapter as everything else, so a server can take over without the
   screens changing.

   No seed: answers the member never gave would be a lie about their record.
   ========================================================================== */

const KEY = storageKey("classroom-learner");

const EMPTY: LearnerRecord = { answers: {}, attempts: [], certificates: [] };

async function readRecord(): Promise<LearnerRecord> {
  const stored = await readJson<Partial<LearnerRecord> | null>(KEY, null);
  if (!stored || typeof stored !== "object") return EMPTY;
  return {
    answers:
      stored.answers && typeof stored.answers === "object"
        ? stored.answers
        : {},
    attempts: Array.isArray(stored.attempts) ? stored.attempts : [],
    certificates: Array.isArray(stored.certificates) ? stored.certificates : [],
  };
}

export const learnerRecordKey = ["education", "learner-record"] as const;

export function useLearnerRecord() {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: learnerRecordKey, queryFn: readRecord });

  const write = useMutation({
    mutationFn: async (transform: (current: LearnerRecord) => LearnerRecord) =>
      writeJson(KEY, transform(await readRecord())),
    onSuccess: (record) => queryClient.setQueryData(learnerRecordKey, record),
  });

  const { mutate, mutateAsync, reset } = write;
  const record = useMemo(() => query.data ?? EMPTY, [query.data]);

  /** Saves a lesson answer. Lessons keep the latest answer only. */
  const saveAnswer = useCallback(
    (answer: Omit<Answer, "answeredAt">) =>
      mutate((current) => ({
        ...current,
        answers: {
          ...current.answers,
          [answer.questionId]: {
            ...answer,
            answeredAt: new Date().toISOString(),
          },
        },
      })),
    [mutate],
  );

  const clearAnswer = useCallback(
    (questionId: string) =>
      mutate((current) => {
        const answers = { ...current.answers };
        delete answers[questionId];
        return { ...current, answers };
      }),
    [mutate],
  );

  /** Scores and stores one exam or module-check attempt. */
  const submitAttempt = useCallback(
    async (
      quizKey: string,
      questions: Question[],
      answers: Record<string, Answer>,
      passMark: number,
    ) => {
      const attempt = rules.buildAttempt(quizKey, questions, answers, passMark);
      await mutateAsync((current) => ({
        ...current,
        attempts: [...current.attempts, attempt],
      }));
      return attempt;
    },
    [mutateAsync],
  );

  const issueCertificate = useCallback(
    async (courseId: string, name: string) => {
      const certificate: Certificate = {
        id: rules.certificateId(),
        courseId,
        name: name.trim(),
        issuedAt: new Date().toISOString(),
      };
      await mutateAsync((current) => ({
        ...current,
        certificates: [
          ...current.certificates.filter(
            (entry) => entry.courseId !== courseId,
          ),
          certificate,
        ],
      }));
      return certificate;
    },
    [mutateAsync],
  );

  const certificateFor = useCallback(
    (courseId: string) =>
      record.certificates.find((entry) => entry.courseId === courseId),
    [record.certificates],
  );

  return {
    record,
    answers: record.answers,
    attempts: record.attempts,
    saveAnswer,
    clearAnswer,
    submitAttempt,
    issueCertificate,
    certificateFor,

    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    saveError: write.error,
    dismissSaveError: reset,
    isSaving: write.isPending,
  };
}
