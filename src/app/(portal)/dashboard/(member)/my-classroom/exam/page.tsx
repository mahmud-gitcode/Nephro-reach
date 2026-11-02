"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { AsyncSection, Skeleton } from "@/components/ui";
import { useClassroom } from "@/features/education/classroom";
import { FINAL_QUIZ_KEY } from "@/features/education/questions.rules";
import { QuizRunner } from "@/features/education/member/QuizRunner";
import { useLearnerRecord } from "@/features/education/useLearnerRecord";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";

/* The course's final exam. Passing it can unlock the certificate. */
export default function FinalExamPage() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const { course, isPending, error, refetch } = useClassroom();
  /* The attempts are the patient's: a caregiver without the education
     grant gets the not-shared state here, before any question shows. */
  const learner = useLearnerRecord();
  const readError = error ?? learner.error;
  const lang = isEs ? "es" : "en";

  return (
    <div className="mx-auto w-full max-w-[900px]">
      <AsyncSection
        pending={isPending || learner.isPending}
        error={readError}
        errorTitle={errorTitleFor(
          readError,
          isEs ? "El examen no cargó" : "The exam did not load",
          lang,
        )}
        errorMessage={errorMessageFor(readError, undefined, lang)}
        onRetry={
          canRetry(readError)
            ? () => {
                refetch();
                learner.refetch();
              }
            : undefined
        }
        skeleton={<Skeleton height={320} />}
      >
        {course ? (
          <QuizRunner
            course={course}
            quizKey={FINAL_QUIZ_KEY}
            title={`${isEs ? "Examen final" : "Final exam"} · ${
              isEs ? course.titleEs || course.titleEn : course.titleEn
            }`}
            questions={course.finalExam}
            titleAs="h1"
            backHref="/dashboard/my-classroom"
            backLabel={isEs ? "Volver a Mi Salón" : "Back to My Classroom"}
          />
        ) : null}
      </AsyncSection>
    </div>
  );
}
