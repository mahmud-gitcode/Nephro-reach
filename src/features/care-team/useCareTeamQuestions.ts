"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listQuestions, saveQuestions } from "./questions.repository";
import { cycleStatusIn } from "./questions.rules";
import type { CareTeamQuestion } from "./questions.types";

export type {
  CareTeamQuestion,
  CareTeamRole,
  QuestionStatus,
} from "./questions.types";
export { statusForNew } from "./questions.rules";

export const careTeamQuestionsKey = ["care-team", "questions"] as const;

export function useCareTeamQuestions() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: careTeamQuestionsKey,
    queryFn: listQuestions,
  });

  const write = useMutation({
    mutationFn: async (
      transform: (current: CareTeamQuestion[]) => CareTeamQuestion[],
    ) => saveQuestions(transform(await listQuestions())),
    onSuccess: (questions) =>
      queryClient.setQueryData(careTeamQuestionsKey, questions),
  });

  return {
    questions: query.data ?? [],
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),

    add: (question: CareTeamQuestion) =>
      write.mutateAsync((current) => [question, ...current]),
    update: (id: string, patch: Partial<CareTeamQuestion>) =>
      write.mutateAsync((current) =>
        current.map((question) =>
          question.id === id ? { ...question, ...patch } : question,
        ),
      ),
    remove: (id: string) =>
      write.mutateAsync((current) =>
        current.filter((question) => question.id !== id),
      ),
    cycleStatus: (id: string) =>
      write.mutateAsync((current) => cycleStatusIn(current, id)),

    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
  };
}
