"use client";

import React from "react";
import { Award, ClipboardCheck, PlayCircle } from "lucide-react";
import { Badge, Card, Progress, SectionTitle } from "@/components/ui";
import { certificateStatus, toLessons } from "../classroom";
import type { Course } from "../courseLibrary";
import {
  attemptsFor,
  bestAttempt,
  classQuizKey,
  FINAL_QUIZ_KEY,
} from "../questions.rules";
import { useJourneyProgress } from "../useJourneyProgress";
import { useLearnerRecord } from "../useLearnerRecord";

/* ==========================================================================
   Learner progress
   --------------------------------------------------------------------------
   Lessons finished, check and exam scores, and the certificate — read from
   the learner record saved in this browser. With a server this becomes a
   table of every member; the columns stay the same.
   ========================================================================== */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function LearnerProgressCard({ course }: { course: Course }) {
  const lessons = toLessons(course);
  const { progress } = useJourneyProgress(lessons);
  const { attempts, certificateFor } = useLearnerRecord();

  const status = certificateStatus(course, lessons, progress, attempts);
  const certificate = certificateFor(course.id);

  const quizzes = [
    ...lessons
      .filter((lesson) => lesson.kind === "exam")
      .map((lesson) => ({
        key: classQuizKey(lesson.slug),
        label: lesson.titleEn,
      })),
    ...(course.finalExam.length > 0
      ? [{ key: FINAL_QUIZ_KEY, label: "Final exam" }]
      : []),
  ];

  return (
    <Card as="section" aria-labelledby="learner-progress">
      <SectionTitle
        id="learner-progress"
        title="Learner progress"
        subtitle="From the progress saved in this browser."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-card bg-surface-sunken p-inset-md">
          <p className="flex items-center gap-2 text-body-sm text-fg-muted">
            <PlayCircle aria-hidden="true" className="h-4 w-4 text-fg-brand" />
            {course.itemLabelEn}s and exams completed
          </p>
          <p className="mt-stack-xs text-heading-4 text-fg">
            {status.lessonsDone} / {status.lessonsTotal}
          </p>
          <Progress
            value={
              status.lessonsTotal
                ? (status.lessonsDone / status.lessonsTotal) * 100
                : 0
            }
            label="Lessons completed"
            size="small"
            className="mt-stack-sm"
          />
        </div>
        <div className="rounded-card bg-surface-sunken p-inset-md">
          <p className="flex items-center gap-2 text-body-sm text-fg-muted">
            <ClipboardCheck
              aria-hidden="true"
              className="h-4 w-4 text-fg-brand"
            />
            Attempts submitted
          </p>
          <p className="mt-stack-xs text-heading-4 text-fg">
            {attempts.length}
          </p>
        </div>
        <div className="rounded-card bg-surface-sunken p-inset-md">
          <p className="flex items-center gap-2 text-body-sm text-fg-muted">
            <Award aria-hidden="true" className="h-4 w-4 text-fg-brand" />
            Certificate
          </p>
          <p className="mt-stack-xs text-label-lg text-fg">
            {certificate
              ? `${certificate.name} · ${formatDate(certificate.issuedAt)}`
              : status.eligible
                ? "Unlocked, not yet claimed"
                : "Not yet earned"}
          </p>
        </div>
      </div>

      {quizzes.length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-control border border-line">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="bg-surface-sunken text-left">
                {["Check / exam", "Attempts", "Best score", "Result"].map(
                  (header) => (
                    <th
                      key={header}
                      className="h-11 px-3 font-semibold text-fg"
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => {
                const tries = attemptsFor(attempts, quiz.key);
                const best = bestAttempt(attempts, quiz.key);
                return (
                  <tr key={quiz.key} className="border-t border-line">
                    <td className="h-12 px-3 font-medium text-fg-secondary">
                      {quiz.label}
                    </td>
                    <td className="px-3 text-fg-secondary tabular-nums">
                      {tries.length}
                      {course.maxAttempts > 0 ? ` / ${course.maxAttempts}` : ""}
                    </td>
                    <td className="px-3 text-fg-secondary tabular-nums">
                      {best ? `${best.percent}%` : "—"}
                    </td>
                    <td className="px-3">
                      {!best ? (
                        <Badge tone="neutral">Not taken</Badge>
                      ) : tries.some((attempt) => attempt.passed) ? (
                        <Badge tone="success">Passed</Badge>
                      ) : (
                        <Badge tone="warning">Not passed</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </Card>
  );
}
