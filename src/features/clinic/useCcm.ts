"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import * as rules from "./ccm.data";
import type { CcmState } from "./ccm.data";

/* ==========================================================================
   CCM — storage
   ========================================================================== */

const KEY = storageKey("clinic-ccm");

/**
 * Bump when CcmState changes shape, so old data re-seeds.
 * Version 2: the placeholder activity types gave way to the client's list.
 * Version 3: activities say whether they count and whether the EHR has
 * them; patients have a location; requirements carry a date.
 */
const VERSION = 3;

type StoredEnvelope = { version: number; state: unknown };

function isState(value: unknown): value is CcmState {
  if (!value || typeof value !== "object") return false;
  const s = value as Partial<CcmState>;
  return (
    Array.isArray(s.activities) &&
    Array.isArray(s.inbox) &&
    !!s.requirements &&
    typeof s.requirements === "object"
  );
}

async function readState(): Promise<CcmState> {
  const stored = await readJson<Partial<StoredEnvelope> | null>(KEY, null);
  if (stored && stored.version === VERSION && isState(stored.state)) {
    return stored.state;
  }
  const seeded = rules.seedCcmState(Date.now());
  await writeJson(KEY, { version: VERSION, state: seeded });
  return seeded;
}

export const ccmKey = ["clinic", "ccm"] as const;

const EMPTY: CcmState = { activities: [], requirements: {}, inbox: [] };

export function useCcm() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ccmKey, queryFn: readState });

  const write = useMutation({
    mutationFn: async (transform: (current: CcmState) => CcmState) => {
      const next = transform(await readState());
      await writeJson(KEY, { version: VERSION, state: next });
      return next;
    },
    onSuccess: (state) => queryClient.setQueryData(ccmKey, state),
  });

  const { mutate } = write;
  const state = useMemo(() => query.data ?? EMPTY, [query.data]);

  const addActivity = useCallback(
    (activity: Omit<rules.CcmActivity, "id">) =>
      mutate((s) => rules.addActivity(s, activity, Date.now())),
    [mutate],
  );
  const setRequirement = useCallback(
    (
      mrn: string,
      id: rules.RequirementId,
      change: Partial<rules.RequirementState>,
    ) => mutate((s) => rules.setRequirement(s, mrn, id, change)),
    [mutate],
  );
  const setEhrDocumented = useCallback(
    (activityId: string, documented: boolean) =>
      mutate((s) => rules.setEhrDocumented(s, activityId, documented)),
    [mutate],
  );
  const completeFollowUp = useCallback(
    (activityId: string) =>
      mutate((s) => rules.completeFollowUp(s, activityId)),
    [mutate],
  );
  const resolveInbox = useCallback(
    (itemId: string) => mutate((s) => rules.resolveInbox(s, itemId)),
    [mutate],
  );

  return {
    state,
    isPending: query.isPending,
    isFetching: query.isFetching,
    error: query.error,
    updatedAt: query.dataUpdatedAt,
    refetch: () => void query.refetch(),
    writeError: write.error,
    isSaving: write.isPending,
    clearWriteError: write.reset,
    addActivity,
    setRequirement,
    setEhrDocumented,
    completeFollowUp,
    resolveInbox,
  };
}

export type CcmStore = ReturnType<typeof useCcm>;
