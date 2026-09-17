"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ClipboardCheck,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  Button,
  buttonStyles,
  Card,
  EmptyState,
  Progress,
  SectionTitle,
} from "@/components/ui";
import type { Course } from "../courseLibrary";
import {
  attemptsFor,
  attemptsLeft,
  bestAttempt,
  hasPassed,
  isAnswered,
  isScored,
} from "../questions.rules";
import type { AnswerMap, Question, QuizAttempt } from "../questions.types";
import { useLearnerRecord } from "../useLearnerRecord";
import { DraftAnswer, emptyDraft, QuestionView } from "./QuestionView";

/* ==========================================================================
   QuizRunner
   --------------------------------------------------------------------------
   A module check or the final exam: an intro with the rules, the questions
   in one list, then a results screen with the mark. Supportive wording
   throughout — these are patients, not students sitting a test.
   ========================================================================== */

type Stage = "intro" | "taking" | "result";

function formatDate(iso: string, isEs: boolean) {
  return new Date(iso).toLocaleDateString(isEs ? "es-ES" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function QuizRunner({
  course,
  quizKey,
  title,
  questions,
  backHref,
  backLabel,
  hideBack = false,
  onResult,
}: {
  course: Course;
  quizKey: string;
  title: string;
  questions: Question[];
  backHref: string;
  backLabel: string;
  /** Inside a lesson page, which has its own navigation. */
  hideBack?: boolean;
  /** Called with each submitted attempt, e.g. to finish the lesson on a pass. */
  onResult?: (attempt: QuizAttempt) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const { attempts, submitAttempt, isSaving, saveError } = useLearnerRecord();

  const [stage, setStage] = useState<Stage>("intro");
  const [drafts, setDrafts] = useState<Record<string, DraftAnswer>>({});
  const [result, setResult] = useState<QuizAttempt | null>(null);

  const past = attemptsFor(attempts, quizKey);
  const best = bestAttempt(attempts, quizKey);
  const passed = hasPassed(attempts, quizKey);
  const left = attemptsLeft(attempts, quizKey, course.maxAttempts);
  const outOfAttempts = left === 0;
  const scoredCount = questions.filter(isScored).length;

  const answeredCount = questions.filter((question) =>
    isAnswered(
      question,
      drafts[question.id]
        ? { ...drafts[question.id], answeredAt: "" }
        : undefined,
    ),
  ).length;
  const allAnswered = answeredCount === questions.length;

  const start = () => {
    setDrafts({});
    setResult(null);
    setStage("taking");
  };

  const submit = async () => {
    const now = new Date().toISOString();
    const answers: AnswerMap = Object.fromEntries(
      Object.values(drafts).map((draft) => [
        draft.questionId,
        { ...draft, answeredAt: now },
      ]),
    );
    const attempt = await submitAttempt(
      quizKey,
      questions,
      answers,
      course.passMark,
    );
    setResult(attempt);
    setStage("result");
    onResult?.(attempt);
  };

  const back = (
    <Link
      href={backHref}
      className={buttonStyles({
        variant: "neutral",
        appearance: "fill-stroke",
        size: "small",
      })}
    >
      <ArrowLeft aria-hidden="true" />
      {backLabel}
    </Link>
  );

  if (questions.length === 0) {
    return (
      <div className="space-y-stack-lg">
        {hideBack ? null : back}
        <EmptyState
          icon={<ClipboardCheck aria-hidden="true" />}
          title={isEs ? "Aún no hay preguntas" : "No questions yet"}
          description={
            isEs
              ? "Tu equipo todavía no ha añadido preguntas aquí."
              : "Your team has not added questions here yet."
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-stack-lg">
      {hideBack ? null : back}

      {saveError ? (
        <Alert tone="danger">
          {isEs
            ? "No pudimos guardar tu intento. Inténtalo de nuevo."
            : "Your attempt did not save. Please try again."}
        </Alert>
      ) : null}

      {stage === "intro" ? (
        <Card as="section" aria-labelledby="quiz-intro">
          <SectionTitle
            id="quiz-intro"
            title={title}
            subtitle={
              isEs
                ? "Tómate tu tiempo. Puedes repasar la lección antes de empezar."
                : "Take your time. You can review the lessons before you start."
            }
          />

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <li className="rounded-card bg-surface-sunken p-inset-md">
              <p className="text-body-sm text-fg-muted">
                {isEs ? "Preguntas" : "Questions"}
              </p>
              <p className="mt-stack-xs text-heading-4 text-fg">
                {questions.length}
              </p>
            </li>
            <li className="rounded-card bg-surface-sunken p-inset-md">
              <p className="text-body-sm text-fg-muted">
                {isEs ? "Para aprobar" : "To pass"}
              </p>
              <p className="mt-stack-xs text-heading-4 text-fg">
                {course.passMark}%
              </p>
            </li>
            <li className="rounded-card bg-surface-sunken p-inset-md">
              <p className="text-body-sm text-fg-muted">
                {isEs ? "Intentos" : "Attempts"}
              </p>
              <p className="mt-stack-xs text-heading-4 text-fg">
                {course.maxAttempts === 0
                  ? isEs
                    ? "Ilimitados"
                    : "Unlimited"
                  : `${past.length} / ${course.maxAttempts}`}
              </p>
            </li>
          </ul>

          {scoredCount < questions.length ? (
            <p className="mt-6 text-body-sm text-fg-muted">
              {isEs
                ? "Las preguntas de reflexión y de completar no se califican."
                : "Reflection and fill-in questions are not marked."}
            </p>
          ) : null}

          {best ? (
            <Alert
              tone={passed ? "success" : "info"}
              className="mt-6"
              live={false}
              title={
                passed
                  ? isEs
                    ? "Ya aprobaste"
                    : "You have passed"
                  : isEs
                    ? "Tu mejor resultado"
                    : "Your best result"
              }
            >
              {best.percent}% · {formatDate(best.submittedAt, isEs)}
            </Alert>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-inline-md">
            <Button onClick={start} disabled={outOfAttempts}>
              <ClipboardCheck aria-hidden="true" />
              {past.length === 0
                ? isEs
                  ? "Empezar"
                  : "Start"
                : isEs
                  ? "Intentar de nuevo"
                  : "Try again"}
            </Button>
            {outOfAttempts ? (
              <span className="text-body-sm text-fg-muted">
                {isEs
                  ? "Usaste todos tus intentos. Habla con tu equipo si necesitas otro."
                  : "You have used all your attempts. Ask your team if you need another."}
              </span>
            ) : null}
          </div>
        </Card>
      ) : null}

      {stage === "taking" ? (
        <Card as="section" aria-labelledby="quiz-taking">
          <SectionTitle
            id="quiz-taking"
            title={title}
            subtitle={
              isEs
                ? `${answeredCount} de ${questions.length} respondidas`
                : `${answeredCount} of ${questions.length} answered`
            }
          />
          <Progress
            value={(answeredCount / questions.length) * 100}
            label={isEs ? "Preguntas respondidas" : "Questions answered"}
            size="small"
          />

          <ol className="mt-6 space-y-6 divide-y divide-line">
            {questions.map((question, index) => (
              <li key={question.id} className="pt-6 first:pt-0">
                <QuestionView
                  question={question}
                  number={index + 1}
                  draft={drafts[question.id] ?? emptyDraft(question)}
                  onChange={(next) =>
                    setDrafts((current) => ({
                      ...current,
                      [question.id]: next,
                    }))
                  }
                />
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-inline-md border-t border-line pt-6">
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setStage("intro")}
            >
              {isEs ? "Cancelar" : "Cancel"}
            </Button>
            <Button onClick={submit} disabled={!allAnswered} loading={isSaving}>
              {isEs ? "Enviar respuestas" : "Submit answers"}
            </Button>
          </div>
        </Card>
      ) : null}

      {stage === "result" && result ? (
        <>
          <Card as="section" aria-labelledby="quiz-result">
            <SectionTitle
              id="quiz-result"
              title={isEs ? "Tu resultado" : "Your result"}
              subtitle={title}
            />

            <div className="flex flex-col items-start gap-inline-lg sm:flex-row sm:items-center">
              <span
                className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-pill text-heading-3 ${
                  result.passed
                    ? "bg-success-surface text-success"
                    : "bg-warning-surface text-warning"
                }`}
              >
                {result.percent}%
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-inline-sm text-label-lg text-fg">
                  {result.passed ? (
                    <CheckCircle2
                      aria-hidden="true"
                      className="h-5 w-5 text-success"
                    />
                  ) : (
                    <XCircle
                      aria-hidden="true"
                      className="h-5 w-5 text-warning"
                    />
                  )}
                  {result.passed
                    ? isEs
                      ? "¡Aprobaste! Buen trabajo."
                      : "You passed — well done."
                    : isEs
                      ? "Aún no. Repasa y vuelve a intentarlo."
                      : "Not yet. Review the lessons and try again."}
                </p>
                <p className="mt-stack-xs text-body-md text-fg-muted">
                  {isEs
                    ? `${result.correct} de ${result.total} correctas · se necesita ${course.passMark}%`
                    : `${result.correct} of ${result.total} correct · ${course.passMark}% needed`}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-inline-md">
              {!result.passed && !outOfAttempts ? (
                <Button onClick={start}>
                  <RotateCcw aria-hidden="true" />
                  {isEs ? "Intentar de nuevo" : "Try again"}
                </Button>
              ) : null}
              {result.passed &&
              quizKey === "final" &&
              course.certificateEnabled ? (
                <Link
                  href="/dashboard/my-classroom/certificate"
                  className={buttonStyles()}
                >
                  <Award aria-hidden="true" />
                  {isEs ? "Ver mi certificado" : "View my certificate"}
                </Link>
              ) : null}
              <Link
                href={backHref}
                className={buttonStyles({
                  variant: "neutral",
                  appearance: "fill-stroke",
                })}
              >
                {backLabel}
              </Link>
            </div>
          </Card>

          {course.showAnswers ? (
            <Card as="section" aria-labelledby="quiz-review">
              <SectionTitle
                id="quiz-review"
                title={isEs ? "Repaso de respuestas" : "Review your answers"}
              />
              <ol className="space-y-6 divide-y divide-line">
                {questions.map((question, index) => (
                  <li key={question.id} className="pt-6 first:pt-0">
                    <QuestionView
                      question={question}
                      number={index + 1}
                      draft={
                        result.answers[question.id] ?? emptyDraft(question)
                      }
                      onChange={() => undefined}
                      reveal
                      showCorrect
                      disabled
                    />
                  </li>
                ))}
              </ol>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
