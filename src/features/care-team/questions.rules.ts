import type { CareTeamQuestion, QuestionStatus } from "./questions.types";

/** Submitted -> Discussed -> Answered -> Submitted. */
const NEXT_STATUS: Record<QuestionStatus, QuestionStatus> = {
  Submitted: "Discussed",
  Discussed: "Answered",
  Answered: "Submitted",
};

/** The status after this one in the cycle. */
export const nextStatus = (status: QuestionStatus): QuestionStatus =>
  NEXT_STATUS[status] ?? "Answered";

export const cycleStatusIn = (
  questions: CareTeamQuestion[],
  id: string,
): CareTeamQuestion[] =>
  questions.map((question) =>
    question.id === id
      ? { ...question, status: NEXT_STATUS[question.status] ?? "Answered" }
      : question,
  );

/** A question written down with the answer already in it is answered. */
export const statusForNew = (
  status: QuestionStatus,
  answer: string,
): QuestionStatus =>
  answer.trim() && status === "Submitted" ? "Answered" : status;
