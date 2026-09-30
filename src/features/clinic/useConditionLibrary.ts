"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import * as rules from "./ccmConditions";

/* The clinic's condition library: its own additions and the defaults it
   turned off (ccmConditions.ts). One record per clinic. */
const KEY = storageKey("ccm-condition-library");
export const conditionLibraryKey = ["clinic", "ccm-condition-library"] as const;

async function readLibrary(): Promise<rules.ConditionLibraryState> {
  const stored = await readJson<Partial<rules.ConditionLibraryState> | null>(
    KEY,
    null,
  );
  return {
    custom: Array.isArray(stored?.custom) ? stored.custom : [],
    inactive: Array.isArray(stored?.inactive) ? stored.inactive : [],
  };
}

export function useConditionLibrary() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: conditionLibraryKey,
    queryFn: readLibrary,
  });
  const write = useMutation({
    mutationFn: async (
      transform: (
        current: rules.ConditionLibraryState,
      ) => rules.ConditionLibraryState,
    ) => writeJson(KEY, transform(await readLibrary())),
    onSuccess: (state) => queryClient.setQueryData(conditionLibraryKey, state),
  });
  const { mutate } = write;
  const state = query.data ?? rules.EMPTY_LIBRARY;
  const library = useMemo(() => rules.libraryOf(state), [state]);

  return {
    /** Every condition, defaults first, each with whether it is offered. */
    library,
    isPending: query.isPending,
    saveError: write.error,
    add: useCallback(
      (draft: rules.ConditionDraft) =>
        mutate((current) => rules.addLibraryCondition(current, draft)),
      [mutate],
    ),
    setActive: useCallback(
      (id: string, active: boolean) =>
        mutate((current) => rules.setConditionActive(current, id, active)),
      [mutate],
    ),
    remove: useCallback(
      (id: string) =>
        mutate((current) => rules.removeLibraryCondition(current, id)),
      [mutate],
    ),
  };
}
