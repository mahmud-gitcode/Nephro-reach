"use client";

import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Clock3,
  Edit3,
  MessageCircleQuestion,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge, Button, Modal } from "@/components/ui";
import {
  emptyField,
  emptyOption,
  emptyPair,
  emptyQuestion,
  formatClockShort,
  isChoice,
  parseClock,
  QUESTION_KINDS,
  questionProblem,
  withKind,
} from "@/features/education/questions.rules";
import type {
  Question,
  QuestionKind,
  VideoQuestion,
} from "@/features/education/questions.types";
import { Field, FIELD_CLASS } from "./ClassWizardSteps";

/* ==========================================================================
   Question builder
   --------------------------------------------------------------------------
   One editor for every kind of question, and two list editors around it:
   plain lists (lesson activities, module checks, the final exam) and timed
   lists (pop-ups during a video).
   ========================================================================== */

const ICON_BUTTON =
  "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-control text-fg-subtle transition-colors hover:bg-surface-sunken hover:text-fg-secondary disabled:cursor-not-allowed disabled:opacity-40";

function BilingualInput({
  label,
  en,
  es,
  onEn,
  onEs,
  multiline = false,
  placeholder,
}: {
  label: string;
  en: string;
  es: string;
  onEn: (value: string) => void;
  onEs: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const Control = multiline ? "textarea" : "input";
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label={`${label} (English)`}>
        <Control
          className={`${FIELD_CLASS} ${multiline ? "resize-y" : ""}`}
          rows={multiline ? 3 : undefined}
          value={en}
          placeholder={placeholder}
          onChange={(event) => onEn(event.target.value)}
        />
      </Field>
      <Field label={`${label} (Spanish)`} hint="Falls back to English if empty">
        <Control
          className={`${FIELD_CLASS} ${multiline ? "resize-y" : ""}`}
          rows={multiline ? 3 : undefined}
          value={es}
          onChange={(event) => onEs(event.target.value)}
        />
      </Field>
    </div>
  );
}

/** The editor for one question. `withTime` adds the pop-up time field. */
export function QuestionEditorModal({
  initial,
  initialAt,
  withTime = false,
  scoredOnly = false,
  onClose,
  onSave,
}: {
  initial?: Question;
  initialAt?: number;
  withTime?: boolean;
  /** Exams and checks only take kinds with a right answer. */
  scoredOnly?: boolean;
  onClose: () => void;
  onSave: (question: Question, at: number) => void;
}) {
  const [draft, setDraft] = useState<Question>(
    initial ?? emptyQuestion("multiple-choice"),
  );
  const [time, setTime] = useState(
    initialAt !== undefined ? formatClockShort(initialAt) : "0:30",
  );

  const set = (patch: Partial<Question>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const seconds = parseClock(time);
  const problem =
    questionProblem(draft) ??
    (withTime && seconds === null ? "Enter the time as m:ss." : null);

  const kinds = QUESTION_KINDS.filter((entry) => !scoredOnly || entry.scored);

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={initial ? "Edit question" : "New question"}
      description={
        withTime
          ? "The video pauses at this time and shows the question."
          : undefined
      }
      footer={
        <>
          {problem ? (
            <span className="mr-auto text-body-sm text-fg-muted">
              {problem}
            </span>
          ) : null}
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(draft, seconds ?? 0)}
            disabled={Boolean(problem)}
          >
            Save question
          </Button>
        </>
      }
    >
      <div className="space-y-stack-lg">
        <div
          className={`grid grid-cols-1 gap-4 ${withTime ? "sm:grid-cols-[minmax(0,1fr)_160px]" : ""}`}
        >
          <Field label="Question type">
            <select
              className={`${FIELD_CLASS} cursor-pointer`}
              value={draft.kind}
              onChange={(event) =>
                setDraft((current) =>
                  withKind(current, event.target.value as QuestionKind),
                )
              }
            >
              {kinds.map((entry) => (
                <option key={entry.kind} value={entry.kind}>
                  {entry.labelEn}
                  {entry.scored ? "" : " (not marked)"}
                </option>
              ))}
            </select>
          </Field>
          {withTime ? (
            <Field label="Show at (m:ss)">
              <input
                className={FIELD_CLASS}
                value={time}
                onChange={(event) => setTime(event.target.value)}
                placeholder="1:20"
              />
            </Field>
          ) : null}
        </div>

        {draft.kind === "scenario" ? (
          <BilingualInput
            label="Scenario"
            multiline
            en={draft.scenarioEn}
            es={draft.scenarioEs}
            onEn={(scenarioEn) => set({ scenarioEn })}
            onEs={(scenarioEs) => set({ scenarioEs })}
            placeholder="Describe the situation the member reads first."
          />
        ) : null}

        <BilingualInput
          label="Question"
          multiline
          en={draft.promptEn}
          es={draft.promptEs}
          onEn={(promptEn) => set({ promptEn })}
          onEs={(promptEs) => set({ promptEs })}
          placeholder={
            draft.kind === "scenario"
              ? "e.g. What would you do?"
              : "e.g. What does dialysis do for your body?"
          }
        />

        {isChoice(draft) ? (
          <OptionsEditor draft={draft} onChange={set} />
        ) : null}
        {draft.kind === "matching" ? (
          <PairsEditor draft={draft} onChange={set} />
        ) : null}
        {draft.kind === "fill-in" ? (
          <FieldsEditor draft={draft} onChange={set} />
        ) : null}
        {draft.kind === "reflection" || draft.kind === "fill-in" ? (
          <BilingualInput
            label="Hint in the empty box"
            en={draft.placeholderEn}
            es={draft.placeholderEs}
            onEn={(placeholderEn) => set({ placeholderEn })}
            onEs={(placeholderEs) => set({ placeholderEs })}
          />
        ) : null}
      </div>
    </Modal>
  );
}

function OptionsEditor({
  draft,
  onChange,
}: {
  draft: Question;
  onChange: (patch: Partial<Question>) => void;
}) {
  const fixed = draft.kind === "true-false";
  const update = (id: string, patch: Partial<Question["options"][number]>) =>
    onChange({
      options: draft.options.map((option) =>
        option.id === id ? { ...option, ...patch } : option,
      ),
    });

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-fg-muted">
        Answers — pick the correct one, and write feedback for each
      </p>
      {draft.options.map((option, index) => {
        const correct = draft.correctOptionId === option.id;
        return (
          <div
            key={option.id}
            className={`space-y-3 rounded-card border p-inset-md ${
              correct
                ? "border-success-line bg-success-surface"
                : "border-line bg-surface-sunken"
            }`}
          >
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-fg">
                <input
                  type="radio"
                  name={`${draft.id}-correct`}
                  checked={correct}
                  onChange={() => onChange({ correctOptionId: option.id })}
                  className="h-4 w-4 accent-[var(--color-brand-600)]"
                />
                {correct ? "Correct answer" : `Answer ${index + 1}`}
              </label>
              {!fixed ? (
                <button
                  type="button"
                  className={`${ICON_BUTTON} ml-auto hover:bg-danger-surface hover:text-danger`}
                  disabled={draft.options.length <= 2}
                  onClick={() =>
                    onChange({
                      options: draft.options.filter(
                        (entry) => entry.id !== option.id,
                      ),
                      correctOptionId:
                        draft.correctOptionId === option.id
                          ? (draft.options.find(
                              (entry) => entry.id !== option.id,
                            )?.id ?? "")
                          : draft.correctOptionId,
                    })
                  }
                  aria-label={`Remove answer ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            {!fixed ? (
              <BilingualInput
                label="Answer"
                en={option.textEn}
                es={option.textEs}
                onEn={(textEn) => update(option.id, { textEn })}
                onEs={(textEs) => update(option.id, { textEs })}
              />
            ) : (
              <p className="text-sm font-bold text-fg">{option.textEn}</p>
            )}
            <BilingualInput
              label="Feedback"
              en={option.feedbackEn}
              es={option.feedbackEs}
              onEn={(feedbackEn) => update(option.id, { feedbackEn })}
              onEs={(feedbackEs) => update(option.id, { feedbackEs })}
              placeholder="Why this answer is, or is not, the best one."
            />
          </div>
        );
      })}
      {!fixed ? (
        <Button
          size="small"
          variant="neutral"
          appearance="fill-stroke"
          onClick={() =>
            onChange({ options: [...draft.options, emptyOption()] })
          }
        >
          <Plus aria-hidden="true" />
          Add answer
        </Button>
      ) : null}
    </div>
  );
}

function PairsEditor({
  draft,
  onChange,
}: {
  draft: Question;
  onChange: (patch: Partial<Question>) => void;
}) {
  const update = (id: string, patch: Partial<Question["pairs"][number]>) =>
    onChange({
      pairs: draft.pairs.map((pair) =>
        pair.id === id ? { ...pair, ...patch } : pair,
      ),
    });

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-fg-muted">
        Pairs — the member matches each left item to its right item
      </p>
      {draft.pairs.map((pair, index) => (
        <div
          key={pair.id}
          className="space-y-3 rounded-card border border-line bg-surface-sunken p-inset-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-fg">
              Pair {index + 1}
            </span>
            <button
              type="button"
              className={`${ICON_BUTTON} hover:bg-danger-surface hover:text-danger`}
              disabled={draft.pairs.length <= 2}
              onClick={() =>
                onChange({
                  pairs: draft.pairs.filter((entry) => entry.id !== pair.id),
                })
              }
              aria-label={`Remove pair ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <BilingualInput
            label="Left"
            en={pair.leftEn}
            es={pair.leftEs}
            onEn={(leftEn) => update(pair.id, { leftEn })}
            onEs={(leftEs) => update(pair.id, { leftEs })}
          />
          <BilingualInput
            label="Right (its match)"
            en={pair.rightEn}
            es={pair.rightEs}
            onEn={(rightEn) => update(pair.id, { rightEn })}
            onEs={(rightEs) => update(pair.id, { rightEs })}
          />
        </div>
      ))}
      <Button
        size="small"
        variant="neutral"
        appearance="fill-stroke"
        onClick={() => onChange({ pairs: [...draft.pairs, emptyPair()] })}
      >
        <Plus aria-hidden="true" />
        Add pair
      </Button>
    </div>
  );
}

function FieldsEditor({
  draft,
  onChange,
}: {
  draft: Question;
  onChange: (patch: Partial<Question>) => void;
}) {
  const update = (id: string, patch: Partial<Question["fields"][number]>) =>
    onChange({
      fields: draft.fields.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    });

  return (
    <div className="space-y-4">
      <Field
        label="Where the answer goes"
        hint="Every answer is kept in the member's workbook."
      >
        <select
          className={`${FIELD_CLASS} cursor-pointer`}
          value={draft.destination}
          onChange={(event) =>
            onChange({
              destination: event.target.value as Question["destination"],
            })
          }
        >
          <option value="workbook">Workbook only</option>
          <option value="care-team">Workbook and Care Team Questions</option>
        </select>
      </Field>

      <p className="text-xs font-bold text-fg-muted">Fields</p>
      {draft.fields.map((field, index) => (
        <div
          key={field.id}
          className="flex items-end gap-3 rounded-card border border-line bg-surface-sunken p-inset-md"
        >
          <div className="min-w-0 flex-1">
            <BilingualInput
              label={`Field ${index + 1} label`}
              en={field.labelEn}
              es={field.labelEs}
              onEn={(labelEn) => update(field.id, { labelEn })}
              onEs={(labelEs) => update(field.id, { labelEs })}
            />
          </div>
          <button
            type="button"
            className={`${ICON_BUTTON} mb-1 hover:bg-danger-surface hover:text-danger`}
            disabled={draft.fields.length <= 1}
            onClick={() =>
              onChange({
                fields: draft.fields.filter((entry) => entry.id !== field.id),
              })
            }
            aria-label={`Remove field ${index + 1}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button
        size="small"
        variant="neutral"
        appearance="fill-stroke"
        onClick={() => onChange({ fields: [...draft.fields, emptyField()] })}
      >
        <Plus aria-hidden="true" />
        Add field
      </Button>
    </div>
  );
}

/* ---- lists ----------------------------------------------------------- */

function kindText(kind: QuestionKind) {
  return QUESTION_KINDS.find((entry) => entry.kind === kind)?.labelEn ?? kind;
}

function move<T>(items: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function QuestionRow({
  index,
  question,
  time,
  canUp,
  canDown,
  onUp,
  onDown,
  onEdit,
  onDelete,
}: {
  index: number;
  question: Question;
  time?: number;
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary-soft text-label-sm text-fg-brand">
        {time !== undefined ? <Clock3 className="h-4 w-4" /> : index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-fg">
          {question.promptEn || "Untitled question"}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
          <Badge tone="neutral">{kindText(question.kind)}</Badge>
          {time !== undefined ? <span>at {formatClockShort(time)}</span> : null}
        </p>
      </div>
      {time === undefined ? (
        <>
          <button
            type="button"
            className={ICON_BUTTON}
            onClick={onUp}
            disabled={!canUp}
            aria-label="Move up"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={ICON_BUTTON}
            onClick={onDown}
            disabled={!canDown}
            aria-label="Move down"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </>
      ) : null}
      <button
        type="button"
        className={ICON_BUTTON}
        onClick={onEdit}
        aria-label="Edit question"
      >
        <Edit3 className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={`${ICON_BUTTON} hover:bg-danger-surface hover:text-danger`}
        onClick={onDelete}
        aria-label="Delete question"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

/** A plain, ordered list of questions. */
export function QuestionListEditor({
  questions,
  onChange,
  emptyText,
  scoredOnly = false,
}: {
  questions: Question[];
  onChange: (next: Question[]) => void;
  emptyText: string;
  scoredOnly?: boolean;
}) {
  const [editing, setEditing] = useState<{ question?: Question } | null>(null);

  return (
    <div className="space-y-3">
      {questions.length === 0 ? (
        <p className="flex flex-col items-center gap-2 rounded-control border border-dashed border-line p-6 text-center text-sm text-fg-muted">
          <MessageCircleQuestion className="h-6 w-6 text-fg-subtle" />
          {emptyText}
        </p>
      ) : (
        <ol className="space-y-2">
          {questions.map((question, index) => (
            <QuestionRow
              key={question.id}
              index={index}
              question={question}
              canUp={index > 0}
              canDown={index < questions.length - 1}
              onUp={() => onChange(move(questions, index, -1))}
              onDown={() => onChange(move(questions, index, 1))}
              onEdit={() => setEditing({ question })}
              onDelete={() =>
                onChange(questions.filter((entry) => entry.id !== question.id))
              }
            />
          ))}
        </ol>
      )}

      <Button size="small" onClick={() => setEditing({})}>
        <Plus aria-hidden="true" />
        Add question
      </Button>

      {editing ? (
        <QuestionEditorModal
          initial={editing.question}
          scoredOnly={scoredOnly}
          onClose={() => setEditing(null)}
          onSave={(question) => {
            onChange(
              editing.question
                ? questions.map((entry) =>
                    entry.id === question.id ? question : entry,
                  )
                : [...questions, question],
            );
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}

/** Questions that pop up during the video, kept in time order. */
export function VideoQuestionListEditor({
  items,
  onChange,
}: {
  items: VideoQuestion[];
  onChange: (next: VideoQuestion[]) => void;
}) {
  const [editing, setEditing] = useState<{ item?: VideoQuestion } | null>(null);
  const sorted = [...items].sort((a, b) => a.at - b.at);

  return (
    <div className="space-y-3">
      {sorted.length === 0 ? (
        <p className="flex flex-col items-center gap-2 rounded-control border border-dashed border-line p-6 text-center text-sm text-fg-muted">
          <Clock3 className="h-6 w-6 text-fg-subtle" />
          No pop-up questions yet. Add one to pause the video at a set time.
        </p>
      ) : (
        <ol className="space-y-2">
          {sorted.map((item, index) => (
            <QuestionRow
              key={item.id}
              index={index}
              question={item.question}
              time={item.at}
              canUp={false}
              canDown={false}
              onUp={() => undefined}
              onDown={() => undefined}
              onEdit={() => setEditing({ item })}
              onDelete={() =>
                onChange(items.filter((entry) => entry.id !== item.id))
              }
            />
          ))}
        </ol>
      )}

      <Button size="small" onClick={() => setEditing({})}>
        <Plus aria-hidden="true" />
        Add pop-up question
      </Button>

      {editing ? (
        <QuestionEditorModal
          withTime
          initial={editing.item?.question}
          initialAt={editing.item?.at}
          onClose={() => setEditing(null)}
          onSave={(question, at) => {
            const item: VideoQuestion = {
              id: editing.item?.id ?? `vq-${question.id}`,
              at,
              question,
            };
            onChange(
              editing.item
                ? items.map((entry) => (entry.id === item.id ? item : entry))
                : [...items, item],
            );
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}
