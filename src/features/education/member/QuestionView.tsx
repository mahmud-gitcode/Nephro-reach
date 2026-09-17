"use client";

import React, { useMemo } from "react";
import { Check, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Badge, FormField, Input, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import {
  gradeAnswer,
  isChoice,
  isScored,
  kindLabel,
  pickedOption,
  shuffledBySeed,
} from "../questions.rules";
import type { Answer, Question } from "../questions.types";

/* ==========================================================================
   QuestionView
   --------------------------------------------------------------------------
   Draws one question of any kind and reports what the member picks or
   types. It does not save anything: the lesson, the video pop-up and the
   exam each decide when an answer counts.

   `reveal` turns on the verdict and the feedback for the chosen answer.
   `showCorrect` also marks the right answer, for an exam review.
   ========================================================================== */

export type DraftAnswer = Omit<Answer, "answeredAt">;

export function emptyDraft(question: Question): DraftAnswer {
  return { questionId: question.id };
}

export function QuestionView({
  question,
  draft,
  onChange,
  number,
  reveal = false,
  showCorrect = false,
  disabled = false,
}: {
  question: Question;
  draft: DraftAnswer;
  onChange: (next: DraftAnswer) => void;
  /** "Question 2" label. Omit to hide it. */
  number?: number;
  reveal?: boolean;
  showCorrect?: boolean;
  disabled?: boolean;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const t = (en: string, es: string) => (isEs ? es || en : en);

  const verdict = reveal
    ? gradeAnswer(question, { ...draft, answeredAt: "" })
    : null;

  return (
    <fieldset className="min-w-0 space-y-stack-md" disabled={disabled}>
      <legend className="w-full">
        <span className="flex flex-wrap items-center gap-inline-sm">
          {number !== undefined ? (
            <span className="text-label-sm text-fg-muted">
              {isEs ? `Pregunta ${number}` : `Question ${number}`}
            </span>
          ) : null}
          <Badge tone={isScored(question) ? "info" : "neutral"}>
            {kindLabel(question.kind, isEs)}
          </Badge>
          {verdict !== null ? (
            <Badge
              tone={verdict ? "success" : "danger"}
              icon={
                verdict ? (
                  <Check aria-hidden="true" />
                ) : (
                  <X aria-hidden="true" />
                )
              }
            >
              {verdict
                ? isEs
                  ? "Correcto"
                  : "Correct"
                : isEs
                  ? "Incorrecto"
                  : "Not quite"}
            </Badge>
          ) : null}
        </span>
        <span className="mt-stack-sm block text-label-lg text-fg">
          {t(question.promptEn, question.promptEs)}
        </span>
      </legend>

      {question.kind === "scenario" && question.scenarioEn ? (
        <p className="rounded-card bg-surface-sunken p-inset-md text-body-md text-fg-secondary">
          {t(question.scenarioEn, question.scenarioEs)}
        </p>
      ) : null}

      {isChoice(question) ? (
        <ChoiceList
          question={question}
          draft={draft}
          onChange={onChange}
          reveal={reveal}
          showCorrect={showCorrect}
        />
      ) : null}

      {question.kind === "matching" ? (
        <MatchingList
          question={question}
          draft={draft}
          onChange={onChange}
          reveal={reveal}
          showCorrect={showCorrect}
        />
      ) : null}

      {question.kind === "reflection" ? (
        <FormField label={isEs ? "Tu respuesta" : "Your answer"}>
          {(props) => (
            <Textarea
              {...props}
              rows={4}
              value={draft.text ?? ""}
              placeholder={t(question.placeholderEn, question.placeholderEs)}
              onChange={(event) =>
                onChange({ ...draft, text: event.target.value })
              }
            />
          )}
        </FormField>
      ) : null}

      {question.kind === "fill-in" ? (
        <div className="space-y-stack-md">
          {question.fields.map((field, index) => (
            <FormField key={field.id} label={t(field.labelEn, field.labelEs)}>
              {(props) => (
                <Input
                  {...props}
                  value={draft.fields?.[field.id] ?? ""}
                  placeholder={
                    index === 0
                      ? t(question.placeholderEn, question.placeholderEs)
                      : undefined
                  }
                  onChange={(event) =>
                    onChange({
                      ...draft,
                      fields: {
                        ...(draft.fields ?? {}),
                        [field.id]: event.target.value,
                      },
                    })
                  }
                />
              )}
            </FormField>
          ))}
        </div>
      ) : null}
    </fieldset>
  );
}

function ChoiceList({
  question,
  draft,
  onChange,
  reveal,
  showCorrect,
}: {
  question: Question;
  draft: DraftAnswer;
  onChange: (next: DraftAnswer) => void;
  reveal: boolean;
  showCorrect: boolean;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const picked = pickedOption(question, { ...draft, answeredAt: "" });

  return (
    <div className="space-y-stack-sm">
      <div role="radiogroup" className="grid grid-cols-1 gap-4">
        {question.options.map((option) => {
          const selected = draft.value === option.id;
          const isRight = option.id === question.correctOptionId;
          const markRight = reveal && (showCorrect || selected) && isRight;
          const markWrong = reveal && selected && !isRight;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange({ ...draft, value: option.id })}
              className={cn(
                "flex min-h-14 cursor-pointer items-center gap-inline-lg rounded-card p-inset-md text-left transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default",
                markRight
                  ? "bg-success-surface"
                  : markWrong
                    ? "bg-danger-surface"
                    : "bg-surface-sunken hover:bg-primary-soft",
                selected && !reveal ? "ring-2 ring-ring" : "",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-pill border-2",
                  selected
                    ? "border-primary-solid bg-primary-solid"
                    : "border-[var(--color-gray-400)] bg-surface",
                )}
              >
                {selected ? (
                  <span className="h-2 w-2 rounded-pill bg-primary-on-solid" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1 text-body-md text-fg">
                {isEs ? option.textEs || option.textEn : option.textEn}
              </span>
              {markRight ? (
                <Check
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-success"
                />
              ) : markWrong ? (
                <X
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-danger"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {reveal && picked && (picked.feedbackEn || picked.feedbackEs) ? (
        <p
          role="status"
          className={cn(
            "rounded-card p-inset-md text-body-sm",
            picked.id === question.correctOptionId
              ? "bg-success-surface text-success"
              : "bg-warning-surface text-warning",
          )}
        >
          {isEs ? picked.feedbackEs || picked.feedbackEn : picked.feedbackEn}
        </p>
      ) : null}
    </div>
  );
}

function MatchingList({
  question,
  draft,
  onChange,
  reveal,
  showCorrect,
}: {
  question: Question;
  draft: DraftAnswer;
  onChange: (next: DraftAnswer) => void;
  reveal: boolean;
  showCorrect: boolean;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const rightSide = useMemo(
    () => shuffledBySeed(question.pairs, question.id),
    [question.pairs, question.id],
  );

  return (
    <ul className="grid grid-cols-1 gap-4">
      {question.pairs.map((pair) => {
        const chosen = draft.pairs?.[pair.id] ?? "";
        const right = chosen === pair.id;
        const label = isEs ? pair.leftEs || pair.leftEn : pair.leftEn;
        return (
          <li
            key={pair.id}
            className={cn(
              "grid grid-cols-1 items-center gap-inline-md rounded-card p-inset-md sm:grid-cols-2",
              reveal
                ? right
                  ? "bg-success-surface"
                  : "bg-danger-surface"
                : "bg-surface-sunken",
            )}
          >
            <span className="text-label-md text-fg">{label}</span>
            <div>
              <label className="sr-only" htmlFor={`${pair.id}-match`}>
                {isEs ? `Pareja para ${label}` : `Match for ${label}`}
              </label>
              <Select
                id={`${pair.id}-match`}
                value={chosen}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    pairs: {
                      ...(draft.pairs ?? {}),
                      [pair.id]: event.target.value,
                    },
                  })
                }
              >
                <option value="">{isEs ? "Elige…" : "Choose…"}</option>
                {rightSide.map((option) => (
                  <option key={option.id} value={option.id}>
                    {isEs ? option.rightEs || option.rightEn : option.rightEn}
                  </option>
                ))}
              </Select>
              {reveal && showCorrect && !right ? (
                <p className="mt-stack-xs text-body-sm text-fg-secondary">
                  {isEs ? "Respuesta: " : "Answer: "}
                  {isEs ? pair.rightEs || pair.rightEn : pair.rightEn}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
