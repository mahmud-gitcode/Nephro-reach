"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listHeldItems, saveHeldItems } from "./moderationQueue.repository";
import {
  applyDecision,
  buildHeldItem,
  withoutHeldItem,
  type HeldDraft,
} from "./moderationQueue.rules";
import type { HeldItem } from "./community.types";

/* One queue, read by the board (to show a member their own held reply) and
   by the admin screen (to decide on it). Both go through here so a decision
   made in one place is visible in the other without a reload. */

export const moderationQueueKey = ["community", "moderation-queue"] as const;

const NO_ITEMS: HeldItem[] = [];

export function useModerationQueue() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: moderationQueueKey,
    queryFn: listHeldItems,
  });

  const write = useMutation({
    mutationFn: async (transform: (current: HeldItem[]) => HeldItem[]) =>
      saveHeldItems(transform(await listHeldItems())),
    onSuccess: (items) => queryClient.setQueryData(moderationQueueKey, items),
  });

  const { mutate, mutateAsync, reset } = write;

  return {
    items: query.data ?? NO_ITEMS,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),

    /**
     * Park a draft for review. Returns the item so the caller can tell the
     * member what happened, or null when the text did not need holding —
     * the caller should publish it normally in that case.
     */
    hold: (draft: HeldDraft) => {
      const item = buildHeldItem(
        draft,
        `held-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      );
      if (!item) return null;
      mutate((current) => [...current, item]);
      return item;
    },

    approve: (id: string) =>
      mutateAsync((current) => applyDecision(current, id, "approved")),
    reject: (id: string) =>
      mutateAsync((current) => applyDecision(current, id, "rejected")),
    remove: (id: string) =>
      mutateAsync((current) => withoutHeldItem(current, id)),

    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => reset(),
  };
}
