"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { usePagedList } from "@/features/profile/usePagedList";
import {
  createQuestion,
  fromApiQuestion,
  listQuestions,
  QUESTIONS_PAGE,
  removeQuestion,
  toQuestionBody,
  updateQuestion,
} from "./questions.repository";
import { nextStatus } from "./questions.rules";
import type { CareTeamQuestion } from "./questions.types";

export type {
  CareTeamQuestion,
  CareTeamRole,
  QuestionStatus,
} from "./questions.types";
export { statusForNew } from "./questions.rules";

/** The member's questions for their care team, from the API (Phase 5).
 *  `add` keeps its signature for the lesson activities (EDU-BIZ); the id
 *  it is given is ignored: the server assigns one. */
export function useCareTeamQuestions(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const queryKey = scopedKey(scope, "care-team-questions");
  const read = usePagedList({
    scope,
    queryKey,
    params: QUESTIONS_PAGE,
    fetch: listQuestions,
    map: fromApiQuestion,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey });

  const create = useMutation({
    mutationFn: (question: CareTeamQuestion) => {
      const { id: _ignored, ...fields } = question;
      void _ignored;
      return createQuestion(requireScope(scope), toQuestionBody(fields));
    },
    onSuccess: refresh,
  });
  const change = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<CareTeamQuestion>;
    }) => {
      const { id: _ignored, ...fields } = patch;
      void _ignored;
      return updateQuestion(requireScope(scope), id, toQuestionBody(fields));
    },
    onSuccess: refresh,
  });
  const drop = useMutation({
    mutationFn: (id: string) => removeQuestion(requireScope(scope), id),
    onSuccess: refresh,
  });

  return {
    questions: read.items,
    isPending: read.isPending,
    error: read.error,
    refetch: read.refetch,
    read,

    add: (question: CareTeamQuestion) => create.mutateAsync(question),
    update: (id: string, patch: Partial<CareTeamQuestion>) =>
      change.mutateAsync({ id, patch }),
    remove: (id: string) => drop.mutateAsync(id),
    cycleStatus: (id: string) => {
      const current = read.items.find((q) => q.id === id);
      if (!current) return Promise.resolve(undefined);
      return change.mutateAsync({
        id,
        patch: { status: nextStatus(current.status) },
      });
    },

    isSaving: create.isPending || change.isPending || drop.isPending,
    saveError: create.error ?? change.error ?? drop.error,
    dismissSaveError: () => {
      create.reset();
      change.reset();
      drop.reset();
    },
  };
}
