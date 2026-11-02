/* ==========================================================================
   Questions for the care team <-> the API (Phase 5):
   `/patients/:id/care-team-questions`. The screen keeps its labels
   ("Social Worker", "Answered"); the API takes kebab and lower case.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import { patientPath } from "@/features/profile/patientScope";
import type {
  CareTeamQuestion,
  CareTeamRole,
  QuestionStatus,
} from "./questions.types";

type ApiRole = "provider" | "dietitian" | "social-worker" | "nurse";
type ApiStatus = "submitted" | "discussed" | "answered";

export type ApiQuestion = {
  id: string;
  patientId: string;
  role: ApiRole;
  question: string;
  status: ApiStatus;
  answer: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QuestionBody = {
  role?: ApiRole;
  question?: string;
  status?: ApiStatus;
  answer?: string | null;
};

const ROLES: Record<CareTeamRole, ApiRole> = {
  Provider: "provider",
  Dietitian: "dietitian",
  "Social Worker": "social-worker",
  Nurse: "nurse",
};
const STATUSES: Record<QuestionStatus, ApiStatus> = {
  Submitted: "submitted",
  Discussed: "discussed",
  Answered: "answered",
};
const ROLE_LABEL = Object.fromEntries(
  Object.entries(ROLES).map(([k, v]) => [v, k]),
) as Record<ApiRole, CareTeamRole>;
const STATUS_LABEL = Object.fromEntries(
  Object.entries(STATUSES).map(([k, v]) => [v, k]),
) as Record<ApiStatus, QuestionStatus>;

export function fromApiQuestion(row: ApiQuestion): CareTeamQuestion {
  return {
    id: row.id,
    role: ROLE_LABEL[row.role] ?? "Provider",
    question: row.question,
    status: STATUS_LABEL[row.status] ?? "Submitted",
    ...(row.answer ? { answer: row.answer } : {}),
  };
}

/** The fields of a question as the API takes them (only those given). */
export function toQuestionBody(
  question: Partial<Omit<CareTeamQuestion, "id">>,
): QuestionBody {
  const body: QuestionBody = {};
  if (question.role) body.role = ROLES[question.role];
  if (question.question !== undefined) body.question = question.question.trim();
  if (question.status) body.status = STATUSES[question.status];
  if (question.answer !== undefined)
    body.answer = question.answer.trim() ? question.answer.trim() : null;
  return body;
}

const base = (scope: PatientScope) =>
  patientPath(scope, "/care-team-questions");

export const QUESTIONS_PAGE: PageParams = { limit: 150 };

export const listQuestions = (
  scope: PatientScope,
  page: PageParams = QUESTIONS_PAGE,
) => fetchPage<ApiQuestion>(base(scope), page);

export const createQuestion = (scope: PatientScope, body: QuestionBody) =>
  api<ApiQuestion>(base(scope), { method: "POST", body });

export const updateQuestion = (
  scope: PatientScope,
  id: string,
  body: QuestionBody,
) =>
  api<ApiQuestion>(`${base(scope)}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });

export const removeQuestion = (scope: PatientScope, id: string) =>
  api<unknown>(`${base(scope)}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
