import type {
  Answer,
  AnswerMap,
  ChoiceOption,
  Question,
  QuestionKind,
  QuizAttempt,
  VideoQuestion,
} from "./questions.types";

/* ==========================================================================
   Classroom questions — the rules
   --------------------------------------------------------------------------
   Pure functions: questions and answers in, verdicts out. Nothing here
   knows where a question is shown.
   ========================================================================== */

const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const QUESTION_KINDS: {
  kind: QuestionKind;
  labelEn: string;
  labelEs: string;
  scored: boolean;
}[] = [
  {
    kind: "multiple-choice",
    labelEn: "Multiple choice",
    labelEs: "Opción múltiple",
    scored: true,
  },
  {
    kind: "true-false",
    labelEn: "True or false",
    labelEs: "Verdadero o falso",
    scored: true,
  },
  { kind: "scenario", labelEn: "Scenario", labelEs: "Escenario", scored: true },
  {
    kind: "matching",
    labelEn: "Matching",
    labelEs: "Relacionar",
    scored: true,
  },
  {
    kind: "reflection",
    labelEn: "Reflection",
    labelEs: "Reflexión",
    scored: false,
  },
  { kind: "fill-in", labelEn: "Fill-in", labelEs: "Completar", scored: false },
];

export function kindLabel(kind: QuestionKind, isEs: boolean): string {
  const entry = QUESTION_KINDS.find((item) => item.kind === kind);
  if (!entry) return kind;
  return isEs ? entry.labelEs : entry.labelEn;
}

export const TRUE_ID = "true";
export const FALSE_ID = "false";

export function emptyOption(): ChoiceOption {
  return {
    id: newId("opt"),
    textEn: "",
    textEs: "",
    feedbackEn: "",
    feedbackEs: "",
  };
}

function trueFalseOptions(): ChoiceOption[] {
  return [
    {
      id: TRUE_ID,
      textEn: "True",
      textEs: "Verdadero",
      feedbackEn: "",
      feedbackEs: "",
    },
    {
      id: FALSE_ID,
      textEn: "False",
      textEs: "Falso",
      feedbackEn: "",
      feedbackEs: "",
    },
  ];
}

export function emptyQuestion(
  kind: QuestionKind = "multiple-choice",
): Question {
  const base: Question = {
    id: newId("q"),
    kind,
    promptEn: "",
    promptEs: "",
    scenarioEn: "",
    scenarioEs: "",
    options: [],
    correctOptionId: "",
    pairs: [],
    fields: [],
    destination: "workbook",
    placeholderEn: "",
    placeholderEs: "",
  };
  return withKind(base, kind);
}

/**
 * Switches a question to another kind, keeping the prompt and giving the
 * new kind the parts it needs.
 */
export function withKind(question: Question, kind: QuestionKind): Question {
  const next: Question = { ...question, kind };
  if (kind === "true-false") {
    const keep = question.kind === "true-false";
    next.options = keep ? question.options : trueFalseOptions();
    next.correctOptionId = keep ? question.correctOptionId : TRUE_ID;
  } else if (kind === "multiple-choice" || kind === "scenario") {
    const reusable =
      question.kind === "multiple-choice" || question.kind === "scenario";
    next.options = reusable ? question.options : [emptyOption(), emptyOption()];
    next.correctOptionId = reusable
      ? question.correctOptionId
      : (next.options[0]?.id ?? "");
  } else if (kind === "matching" && question.pairs.length === 0) {
    next.pairs = [emptyPair(), emptyPair()];
  } else if (kind === "fill-in" && question.fields.length === 0) {
    next.fields = [{ id: newId("field"), labelEn: "", labelEs: "" }];
  }
  return next;
}

export function emptyPair() {
  return {
    id: newId("pair"),
    leftEn: "",
    leftEs: "",
    rightEn: "",
    rightEs: "",
  };
}

export function emptyField() {
  return { id: newId("field"), labelEn: "", labelEs: "" };
}

export const isChoice = (question: Question) =>
  question.kind === "multiple-choice" ||
  question.kind === "true-false" ||
  question.kind === "scenario";

/** Scored kinds have a right answer; reflections and fill-ins never do. */
export const isScored = (question: Question) =>
  isChoice(question) || question.kind === "matching";

/** What an admin must fill in before a question can be saved. */
export function questionProblem(question: Question): string | null {
  if (!question.promptEn.trim()) return "Add the question text.";
  if (question.kind === "scenario" && !question.scenarioEn.trim()) {
    return "Describe the scenario.";
  }
  if (isChoice(question)) {
    if (question.options.length < 2) return "Add at least two options.";
    if (question.options.some((option) => !option.textEn.trim())) {
      return "Every option needs text.";
    }
    if (
      !question.options.some((option) => option.id === question.correctOptionId)
    ) {
      return "Pick the correct answer.";
    }
  }
  if (question.kind === "matching") {
    if (question.pairs.length < 2) return "Add at least two pairs.";
    if (
      question.pairs.some((pair) => !pair.leftEn.trim() || !pair.rightEn.trim())
    ) {
      return "Every pair needs both sides.";
    }
  }
  if (question.kind === "fill-in") {
    if (question.fields.length === 0) return "Add at least one field.";
    if (question.fields.some((field) => !field.labelEn.trim())) {
      return "Every field needs a label.";
    }
  }
  return null;
}

/** Has the member given an answer they could submit? */
export function isAnswered(
  question: Question,
  answer: Answer | undefined,
): boolean {
  if (!answer) return false;
  if (isChoice(question)) {
    return question.options.some((option) => option.id === answer.value);
  }
  if (question.kind === "matching") {
    return question.pairs.every((pair) => Boolean(answer.pairs?.[pair.id]));
  }
  if (question.kind === "reflection") return Boolean(answer.text?.trim());
  return question.fields.some((field) =>
    Boolean(answer.fields?.[field.id]?.trim()),
  );
}

/** true / false for scored kinds, null for kinds that are never marked. */
export function gradeAnswer(
  question: Question,
  answer: Answer | undefined,
): boolean | null {
  if (!isScored(question)) return null;
  if (!answer || !isAnswered(question, answer)) return false;
  if (isChoice(question)) return answer.value === question.correctOptionId;
  // Matching: every left item points at its own pair.
  return question.pairs.every((pair) => answer.pairs?.[pair.id] === pair.id);
}

/** The option the member picked, for its feedback. */
export function pickedOption(
  question: Question,
  answer: Answer | undefined,
): ChoiceOption | undefined {
  return question.options.find((option) => option.id === answer?.value);
}

export interface QuizScore {
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
}

export function scoreQuiz(
  questions: Question[],
  answers: AnswerMap,
  passMark: number,
): QuizScore {
  const scored = questions.filter(isScored);
  const correct = scored.filter(
    (question) => gradeAnswer(question, answers[question.id]) === true,
  ).length;
  const total = scored.length;
  // A check with nothing to mark cannot be failed.
  const percent = total === 0 ? 100 : Math.round((correct / total) * 100);
  return { correct, total, percent, passed: percent >= passMark };
}

/** Each exam class keeps its own attempts. */
export const classQuizKey = (classId: string) => `class:${classId}`;
export const FINAL_QUIZ_KEY = "final";

export function attemptsFor(attempts: QuizAttempt[], quizKey: string) {
  return attempts
    .filter((attempt) => attempt.quizKey === quizKey)
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}

export function bestAttempt(attempts: QuizAttempt[], quizKey: string) {
  return attemptsFor(attempts, quizKey).reduce<QuizAttempt | undefined>(
    (best, attempt) =>
      !best || attempt.percent > best.percent ? attempt : best,
    undefined,
  );
}

export function hasPassed(attempts: QuizAttempt[], quizKey: string) {
  return attemptsFor(attempts, quizKey).some((attempt) => attempt.passed);
}

/** 0 means unlimited. */
export function attemptsLeft(
  attempts: QuizAttempt[],
  quizKey: string,
  maxAttempts: number,
): number | null {
  if (maxAttempts <= 0) return null;
  return Math.max(0, maxAttempts - attemptsFor(attempts, quizKey).length);
}

export function buildAttempt(
  quizKey: string,
  questions: Question[],
  answers: AnswerMap,
  passMark: number,
  now = new Date(),
): QuizAttempt {
  const score = scoreQuiz(questions, answers, passMark);
  return {
    id: newId("attempt"),
    quizKey,
    answers,
    ...score,
    submittedAt: now.toISOString(),
  };
}

/**
 * A lesson's activities are done once every one of them — including the
 * ones that pop up in the video — has an answer. Right or wrong does not
 * matter here: lessons teach, they do not test.
 */
export function activitiesDone(
  activities: Question[],
  videoQuestions: VideoQuestion[],
  answers: AnswerMap,
): boolean {
  return [
    ...activities,
    ...videoQuestions.map((entry) => entry.question),
  ].every((question) => isAnswered(question, answers[question.id]));
}

export function activitiesProgress(
  activities: Question[],
  videoQuestions: VideoQuestion[],
  answers: AnswerMap,
) {
  const all = [...activities, ...videoQuestions.map((entry) => entry.question)];
  return {
    done: all.filter((question) => isAnswered(question, answers[question.id]))
      .length,
    total: all.length,
  };
}

/**
 * The first video question whose time has come and that has not been
 * answered yet. Anything the member skipped past by seeking still counts,
 * so dragging the scrubber does not dodge a question.
 */
export function dueVideoQuestion(
  videoQuestions: VideoQuestion[],
  seconds: number,
  answers: AnswerMap,
  dismissed: ReadonlySet<string> = new Set(),
): VideoQuestion | undefined {
  return [...videoQuestions]
    .sort((a, b) => a.at - b.at)
    .find(
      (entry) =>
        entry.at <= seconds &&
        !dismissed.has(entry.id) &&
        !isAnswered(entry.question, answers[entry.question.id]),
    );
}

/** "1:05" -> 65. Plain seconds are accepted too. */
export function parseClock(value: string): number | null {
  const cleaned = value.trim();
  if (!cleaned) return null;
  if (/^\d+$/.test(cleaned)) return Number(cleaned);
  const match = /^(\d+):([0-5]\d)$/.exec(cleaned);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatClockShort(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

/** A stable, readable id: NR-2026-7K3F9Q. */
export function certificateId(now = new Date()): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `NR-${now.getFullYear()}-${code}`;
}

/** Deterministic shuffle, so the order holds across renders of one question. */
export function shuffledBySeed<T extends { id: string }>(
  items: T[],
  seed: string,
): T[] {
  const hash = (text: string) => {
    let value = 0;
    for (let index = 0; index < text.length; index += 1) {
      value = (value * 31 + text.charCodeAt(index)) | 0;
    }
    return value;
  };
  const shuffled = [...items].sort(
    (a, b) => hash(`${seed}${a.id}`) - hash(`${seed}${b.id}`),
  );
  // Never hand back the answer key in order.
  const same = shuffled.every((item, index) => item.id === items[index].id);
  return same && shuffled.length > 1
    ? [...shuffled.slice(1), shuffled[0]]
    : shuffled;
}
