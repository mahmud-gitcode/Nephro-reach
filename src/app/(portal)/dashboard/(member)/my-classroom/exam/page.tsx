"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { AsyncSection, Skeleton } from "@/components/ui";
import { useClassroom } from "@/features/education/classroom";
import { FINAL_QUIZ_KEY } from "@/features/education/questions.rules";
import { QuizRunner } from "@/features/education/member/QuizRunner";

/* The course's final exam. Passing it can unlock the certificate. */
export default function FinalExamPage() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const { course, isPending, error, refetch } = useClassroom();

  return (
    <div className="mx-auto w-full max-w-[900px]">
      <AsyncSection
        pending={isPending}
        error={error}
        onRetry={refetch}
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
            backHref="/dashboard/my-classroom"
            backLabel={isEs ? "Volver a Mi Salón" : "Back to My Classroom"}
          />
        ) : null}
      </AsyncSection>
    </div>
  );
}
