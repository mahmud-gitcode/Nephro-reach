"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as repo from "./ccm.repository";
import * as rules from "./ccmConditions";
import { requireOffice, useOfficeOrg } from "./officeContext";
import { ccmKeys } from "./useCcm";

/* The office's condition library on the API (Phase 9): the defaults with
   whether this office offers them, and its own additions. Replaces the
   browser store `nr:ccm-condition-library` (retired and purged). A custom
   entry keeps only its name on the server (BE-7 open). */
export function useConditionLibrary() {
  const { orgId } = useOfficeOrg();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: orgId ? ccmKeys.conditions(orgId) : ["org", "none", "ccm"],
    queryFn: () => repo.listConditions(requireOffice(orgId)),
    enabled: orgId !== null,
  });
  const write = useMutation({
    mutationFn: (fn: (orgId: string) => Promise<unknown>) =>
      fn(requireOffice(orgId)),
    onSettled: () =>
      orgId
        ? queryClient.invalidateQueries({ queryKey: ccmKeys.conditions(orgId) })
        : undefined,
  });
  const { mutate } = write;
  const library = useMemo(
    () => rules.libraryFromServer(query.data ?? []),
    [query.data],
  );

  return {
    /** Every condition, defaults first, each with whether it is offered. */
    library,
    isPending: orgId === null || query.isPending,
    error: orgId === null ? null : query.error,
    refetch: () => void query.refetch(),
    saveError: write.error,
    isSaving: write.isPending,
    /** Sends the name only: the server stores no short name or group. */
    add: (draft: rules.ConditionDraft) =>
      mutate((org) => repo.addCondition(org, draft.label)),
    setActive: (condition: rules.CcmCondition, active: boolean) =>
      mutate((org) =>
        condition.custom && condition.entryId
          ? repo.setCustomConditionActive(org, condition.entryId, active)
          : repo.setDefaultConditionActive(org, condition.id, active),
      ),
    remove: (condition: rules.CcmCondition) =>
      condition.entryId
        ? mutate((org) => repo.removeCustomCondition(org, condition.entryId!))
        : undefined,
  };
}
