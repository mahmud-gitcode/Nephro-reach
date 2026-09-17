"use client";

import React, { useState } from "react";
import { MessageCircleQuestion, PlayCircle, RotateCcw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  Button,
  Card,
  Modal,
  Progress,
  SectionTitle,
} from "@/components/ui";
import { useCareTeamQuestions } from "@/features/care-team/useCareTeamQuestions";
import {
  activitiesProgress,
  formatClockShort,
  isAnswered,
  isChoice,
} from "../questions.rules";
import type { Answer, Question, VideoQuestion } from "../questions.types";
import { useLearnerRecord } from "../useLearnerRecord";
import { DraftAnswer, emptyDraft, QuestionView } from "./QuestionView";

/* ==========================================================================
   Lesson activities
   --------------------------------------------------------------------------
   The questions under a lesson, and the same questions when they pop up in
   the video. Answers are saved as soon as the member checks or saves them;
   nothing here is marked for a grade — the feedback is the point.
   ========================================================================== */

function sameDraft(draft: DraftAnswer, saved: Answer | undefined): boolean {
  if (!saved) return false;
  return (
    (draft.value ?? "") === (saved.value ?? "") &&
    (draft.text ?? "") === (saved.text ?? "") &&
    JSON.stringify(draft.pairs ?? {}) === JSON.stringify(saved.pairs ?? {}) &&
    JSON.stringify(draft.fields ?? {}) === JSON.stringify(saved.fields ?? {})
  );
}

/** One question with its own check / save button. */
export function LessonQuestion({
  question,
  number,
  onAnswered,
}: {
  question: Question;
  number?: number;
  /** Called after an answer is saved — the video pop-up closes on it. */
  onAnswered?: () => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const { answers, saveAnswer, clearAnswer } = useLearnerRecord();
  const careTeam = useCareTeamQuestions();

  const saved = answers[question.id];
  const [draft, setDraft] = useState<DraftAnswer>(() =>
    saved ? { ...saved } : emptyDraft(question),
  );
  const [sentToTeam, setSentToTeam] = useState(false);

  const answerable = isAnswered(question, { ...draft, answeredAt: "" });
  const isSaved = sameDraft(draft, saved) && isAnswered(question, saved);
  const scoredKind = isChoice(question) || question.kind === "matching";

  const save = async () => {
    saveAnswer(draft);
    if (question.kind === "fill-in" && question.destination === "care-team") {
      const text = question.fields
        .map((field) => draft.fields?.[field.id]?.trim())
        .filter(Boolean)
        .join(" — ");
      if (text) {
        await careTeam.add({
          id: `cq-${Date.now().toString(36)}`,
          role: "Provider",
          question: text,
          status: "Submitted",
        });
        setSentToTeam(true);
      }
    }
    onAnswered?.();
  };

  const retry = () => {
    clearAnswer(question.id);
    setDraft(emptyDraft(question));
    setSentToTeam(false);
  };

  return (
    <div className="space-y-stack-md">
      <QuestionView
        question={question}
        draft={draft}
        onChange={setDraft}
        number={number}
        reveal={scoredKind && isSaved}
        showCorrect={false}
        disabled={scoredKind && isSaved}
      />

      {sentToTeam ? (
        <Alert tone="success">
          {isEs
            ? "Añadido a tus Preguntas al Equipo."
            : "Added to your Care Team Questions."}
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-inline-md">
        {scoredKind ? (
          isSaved ? (
            <Button
              size="small"
              variant="neutral"
              appearance="fill-stroke"
              onClick={retry}
            >
              <RotateCcw aria-hidden="true" />
              {isEs ? "Intentar de nuevo" : "Try again"}
            </Button>
          ) : (
            <Button size="small" onClick={save} disabled={!answerable}>
              {isEs ? "Comprobar respuesta" : "Check answer"}
            </Button>
          )
        ) : (
          <>
            <Button
              size="small"
              onClick={save}
              disabled={!answerable || isSaved}
            >
              {isEs ? "Guardar" : "Save"}
            </Button>
            {isSaved ? (
              <span className="text-body-sm text-success">
                {isEs ? "Guardado en tu cuaderno" : "Saved to your workbook"}
              </span>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

/** The activities card under a lesson. */
export function LessonActivities({
  activities,
  videoQuestions,
}: {
  activities: Question[];
  videoQuestions: VideoQuestion[];
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const { answers } = useLearnerRecord();

  if (activities.length === 0 && videoQuestions.length === 0) return null;

  const progress = activitiesProgress(activities, videoQuestions, answers);
  const sortedVideo = [...videoQuestions].sort((a, b) => a.at - b.at);

  return (
    <Card as="section" aria-labelledby="lesson-activities">
      <SectionTitle
        id="lesson-activities"
        title={
          isEs ? "Comprueba lo que aprendiste" : "Check your understanding"
        }
        subtitle={
          isEs
            ? `${progress.done} de ${progress.total} respondidas. Respóndelas todas para terminar la lección.`
            : `${progress.done} of ${progress.total} answered. Answer them all to finish the lesson.`
        }
      />
      <Progress
        value={
          progress.total === 0 ? 0 : (progress.done / progress.total) * 100
        }
        label={isEs ? "Actividades respondidas" : "Activities answered"}
        tone={progress.done === progress.total ? "success" : "primary"}
        size="small"
      />

      <ol className="mt-6 space-y-6 divide-y divide-line">
        {activities.map((question, index) => (
          <li key={question.id} className="pt-6 first:pt-0">
            <LessonQuestion question={question} number={index + 1} />
          </li>
        ))}
        {sortedVideo.map((entry, index) => (
          <li key={entry.id} className="pt-6 first:pt-0">
            <p className="mb-stack-sm flex items-center gap-inline-sm text-label-sm text-fg-brand">
              <PlayCircle aria-hidden="true" className="h-4 w-4" />
              {isEs ? "Del video" : "From the video"} ·{" "}
              {formatClockShort(entry.at)}
            </p>
            <LessonQuestion
              question={entry.question}
              number={activities.length + index + 1}
            />
          </li>
        ))}
      </ol>
    </Card>
  );
}

/** The pop-up that pauses the video. */
export function VideoQuestionDialog({
  entry,
  onContinue,
  onSkip,
}: {
  entry: VideoQuestion;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const { answers } = useLearnerRecord();
  const answered = isAnswered(entry.question, answers[entry.question.id]);

  return (
    <Modal
      open
      onClose={onSkip}
      closeOnBackdrop={false}
      size="big"
      title={
        <span className="flex items-center gap-inline-sm">
          <MessageCircleQuestion
            aria-hidden="true"
            className="h-5 w-5 text-fg-brand"
          />
          {isEs ? "Pregunta rápida" : "Quick question"}
        </span>
      }
      description={
        isEs
          ? `El video está en pausa en ${formatClockShort(entry.at)}.`
          : `The video is paused at ${formatClockShort(entry.at)}.`
      }
      footer={
        <>
          <Button variant="neutral" appearance="stroke" onClick={onSkip}>
            {isEs ? "Responder después" : "Answer later"}
          </Button>
          <Button onClick={onContinue} disabled={!answered}>
            <PlayCircle aria-hidden="true" />
            {isEs ? "Seguir viendo" : "Continue video"}
          </Button>
        </>
      }
    >
      <LessonQuestion question={entry.question} />
    </Modal>
  );
}
