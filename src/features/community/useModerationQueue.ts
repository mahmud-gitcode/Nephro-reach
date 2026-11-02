"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  approvePost,
  fromApiModerationPost,
  listModerationPosts,
  rejectPost,
  type ModerationTab,
} from "./community.api";
import { usePagedContent } from "./usePagedContent";

/* The moderation queue is the server's (platform content, Manage). The
   server orders the pending page (level 1 first, then oldest) and records
   who decided. A 403 reaches the page as the error. */

export const MODERATION_QUEUE_KEY = [
  "platform",
  "content",
  "community",
] as const;

/* The queue is small; one page of 150 pending posts makes the level 1
   count true for everything waiting (the server's maximum page). */
const PAGE = { limit: 150 } as const;

export function useModerationQueue(tab: ModerationTab) {
  const queryClient = useQueryClient();
  const list = usePagedContent({
    queryKey: [...MODERATION_QUEUE_KEY, { status: tab }],
    params: PAGE,
    fetch: (params) => listModerationPosts(tab, params),
    map: fromApiModerationPost,
  });

  const settle = useCallback(
    () => queryClient.invalidateQueries({ queryKey: MODERATION_QUEUE_KEY }),
    [queryClient],
  );
  const approve = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      approvePost(id, note),
    onSettled: settle,
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectPost(id, reason),
    onSettled: settle,
  });

  return {
    items: list.items,
    total: list.total,
    isPending: list.isPending,
    error: list.error,
    refetch: list.refetch,
    hasMore: list.hasMore,
    loadMore: list.loadMore,
    isLoadingMore: list.isLoadingMore,

    approve: (id: string, note?: string) => approve.mutateAsync({ id, note }),
    reject: (id: string, reason: string) => reject.mutateAsync({ id, reason }),
    isSaving: approve.isPending || reject.isPending,
    saveError: approve.error ?? reject.error,
    dismissSaveError: () => {
      approve.reset();
      reject.reset();
    },
  };
}
