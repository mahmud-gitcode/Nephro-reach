"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, NotebookPen, Printer } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  AsyncSection,
  Button,
  buttonStyles,
  Card,
  EmptyState,
  SectionTitle,
  Skeleton,
} from "@/components/ui";
import { useClassroom } from "@/features/education/classroom";
import { isAnswered } from "@/features/education/questions.rules";
import type { Question } from "@/features/education/questions.types";
import { useLearnerRecord } from "@/features/education/useLearnerRecord";

/* ==========================================================================
   My Workbook
   --------------------------------------------------------------------------
   Every reflection and fill-in the member has written, in course order, on
   one page they can print and bring to an appointment.
   ========================================================================== */

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #nr-workbook, #nr-workbook * { visibility: visible !important; }
  #nr-workbook { position: absolute; inset: 0; }
  #nr-workbook a { text-decoration: none; }
}`;

const isWritten = (question: Question) =>
  question.kind === "reflection" || question.kind === "fill-in";

export default function WorkbookPage() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const t = (en: string, es: string) => (isEs ? es || en : en);
  const classroom = useClassroom();
  const learner = useLearnerRecord();

  const sections = classroom.groups
    .map((group) => ({
      group,
      lessons: classroom.lessons
        .filter((lesson) => lesson.groupId === group.id)
        .map((lesson) => ({
          lesson,
          questions: [
            ...lesson.activities,
            ...lesson.videoQuestions.map((entry) => entry.question),
          ].filter(isWritten),
        }))
        .filter((entry) => entry.questions.length > 0),
    }))
    .filter((section) => section.lessons.length > 0);

  const answeredCount = sections
    .flatMap((section) => section.lessons)
    .flatMap((entry) => entry.questions)
    .filter((question) =>
      isAnswered(question, learner.answers[question.id]),
    ).length;

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-stack-lg">
      <style>{PRINT_CSS}</style>

      <div className="flex flex-wrap items-center justify-between gap-inline-md">
        <Link
          href="/dashboard/my-classroom"
          className={buttonStyles({
            variant: "neutral",
            appearance: "fill-stroke",
            size: "small",
          })}
        >
          <ArrowLeft aria-hidden="true" />
          {isEs ? "Volver a Mi Salón" : "Back to My Classroom"}
        </Link>
        <Button onClick={() => window.print()} disabled={answeredCount === 0}>
          <Printer aria-hidden="true" />
          {isEs ? "Imprimir" : "Print"}
        </Button>
      </div>

      <AsyncSection
        pending={classroom.isPending || learner.isPending}
        error={classroom.error ?? learner.error}
        onRetry={classroom.refetch}
        isEmpty={sections.length === 0}
        skeleton={<Skeleton height={320} />}
        empty={
          <EmptyState
            icon={<NotebookPen aria-hidden="true" />}
            title={isEs ? "Tu cuaderno está vacío" : "Your workbook is empty"}
            description={
              isEs
                ? "Las reflexiones y respuestas que escribas en las lecciones aparecerán aquí."
                : "Reflections and answers you write in the lessons will appear here."
            }
          />
        }
      >
        <div id="nr-workbook" className="space-y-stack-lg">
          <Card as="section" aria-labelledby="workbook-title">
            <SectionTitle
              id="workbook-title"
              as="h2"
              title={isEs ? "Mi cuaderno" : "My Workbook"}
              subtitle={
                isEs
                  ? `${answeredCount} respuestas escritas. Llévalo a tu próxima cita.`
                  : `${answeredCount} written answers. Bring it to your next appointment.`
              }
            />

            <div className="space-y-6">
              {sections.map(({ group, lessons }) => (
                <section key={group.id} className="space-y-4">
                  <h3 className="text-label-lg text-fg-brand">
                    {isEs ? group.labelEs : group.labelEn} ·{" "}
                    {isEs ? group.titleEs : group.titleEn}
                  </h3>

                  {lessons.map(({ lesson, questions }) => (
                    <div
                      key={lesson.slug}
                      className="space-y-4 rounded-card bg-surface-sunken p-inset-md"
                    >
                      <Link
                        href={`/dashboard/my-classroom/${lesson.slug}`}
                        className="text-label-md text-fg hover:text-fg-brand"
                      >
                        {t(lesson.titleEn, lesson.titleEs)}
                      </Link>

                      {questions.map((question) => {
                        const answer = learner.answers[question.id];
                        const done = isAnswered(question, answer);
                        return (
                          <div
                            key={question.id}
                            className="rounded-card bg-surface p-inset-md"
                          >
                            <p className="text-body-sm text-fg-muted">
                              {t(question.promptEn, question.promptEs)}
                            </p>
                            {!done ? (
                              <p className="mt-stack-xs text-body-md text-fg-subtle italic">
                                {isEs
                                  ? "Sin responder todavía"
                                  : "Not answered yet"}
                              </p>
                            ) : question.kind === "reflection" ? (
                              <p className="mt-stack-xs text-body-md whitespace-pre-line text-fg">
                                {answer?.text}
                              </p>
                            ) : (
                              <dl className="mt-stack-xs space-y-1">
                                {question.fields.map((field) => (
                                  <div key={field.id}>
                                    <dt className="text-label-sm text-fg-secondary">
                                      {t(field.labelEn, field.labelEs)}
                                    </dt>
                                    <dd className="text-body-md text-fg">
                                      {answer?.fields?.[field.id] || "—"}
                                    </dd>
                                  </div>
                                ))}
                              </dl>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </section>
              ))}
            </div>
          </Card>
        </div>
      </AsyncSection>
    </div>
  );
}
