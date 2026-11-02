"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  patientPath,
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { usePagedList } from "@/features/profile/usePagedList";
import * as rules from "./healthcareTeam";

const PAGE: PageParams = { limit: 150 };

export const listTeam = (scope: PatientScope, page: PageParams = PAGE) =>
  fetchPage<rules.ApiTeamMember>(
    patientPath(scope, "/care-team-contacts"),
    page,
  );

export const inviteTeamMember = (
  scope: PatientScope,
  body: ReturnType<typeof rules.toInviteBody>,
) =>
  api<rules.ApiTeamMember>(patientPath(scope, "/care-team-contacts"), {
    method: "POST",
    body,
  });

export const removeTeamMember = (scope: PatientScope, id: string) =>
  api<unknown>(
    patientPath(scope, `/care-team-contacts/${encodeURIComponent(id)}`),
    { method: "DELETE" },
  );

/** The member's healthcare team, from the API (Phase 4): invite and remove
 *  only. There is no accept (INT-14): a person accepts for themselves once
 *  invitations exist, so `recipients` stays empty until then. */
export function useHealthcareTeam(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const queryKey = scopedKey(scope, "care-team-contacts");
  const read = usePagedList({
    scope,
    queryKey,
    params: PAGE,
    fetch: listTeam,
    map: rules.fromApiTeamMember,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const add = useMutation({
    mutationFn: (draft: rules.TeamDraft) =>
      inviteTeamMember(requireScope(scope), rules.toInviteBody(draft)),
    onSuccess: refresh,
  });
  const drop = useMutation({
    mutationFn: (id: string) => removeTeamMember(requireScope(scope), id),
    onSuccess: refresh,
  });
  const team = read.items;
  const { mutate: invite } = add;
  const { mutate: remove } = drop;

  return {
    team,
    recipients: useMemo(() => rules.recipients(team), [team]),
    isPending: read.isPending,
    error: read.error,
    isError: read.isError,
    refetch: read.refetch,
    read,
    isSaving: add.isPending || drop.isPending,
    saveError: add.error ?? drop.error,
    invite: useCallback(
      (draft: rules.TeamDraft, onDone?: () => void) =>
        invite(draft, { onSuccess: () => onDone?.() }),
      [invite],
    ),
    remove: useCallback((id: string) => remove(id), [remove]),
    resetSaveError: () => {
      add.reset();
      drop.reset();
    },
  };
}
