"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as rules from "./healthcareTeam";

export const healthcareTeamKey = ["care-team", "healthcare-team"] as const;

/** The member's healthcare team: invited and accepted people. */
export function useHealthcareTeam() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: healthcareTeamKey,
    queryFn: rules.readTeam,
  });
  const write = useMutation({
    mutationFn: async (
      transform: (current: rules.TeamMember[]) => rules.TeamMember[],
    ) => rules.writeTeam(transform(await rules.readTeam())),
    onSuccess: (list) => queryClient.setQueryData(healthcareTeamKey, list),
  });
  const { mutate } = write;
  const team = useMemo(() => query.data ?? [], [query.data]);

  return {
    team,
    recipients: useMemo(() => rules.recipients(team), [team]),
    isPending: query.isPending,
    isSaving: write.isPending,
    invite: useCallback(
      (draft: rules.TeamDraft) =>
        mutate((current) => rules.invite(current, draft, Date.now())),
      [mutate],
    ),
    accept: useCallback(
      (id: string) => mutate((current) => rules.accept(current, id)),
      [mutate],
    ),
    remove: useCallback(
      (id: string) => mutate((current) => rules.removeMember(current, id)),
      [mutate],
    ),
  };
}
