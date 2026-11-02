"use client";

import { useCallback } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import type { PageParams } from "@/lib/api/paging";
import { useAuth } from "@/features/auth/AuthContext";
import { usePagedContent } from "@/features/community/usePagedContent";
import {
  approveReview,
  declineReview,
  fromApiModerationReview,
  fromApiMyReview,
  listModerationReviews,
  listMyReviews,
  submitReview,
  toSubmitBody,
  type ModerationFilter,
} from "./reviews.api";
import { invalidatePublicReviews } from "./reviews";

export type { Review } from "./reviews.types";

export type ReviewDraft = {
  rating: number;
  role: string;
  otherRole?: string;
  comment: string;
};

const PAGE = { limit: 20 } as const;

/** The signed-in member's own reviews (GET /me/reviews), paged. */
export function useMyReviews() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key: QueryKey = ["me", user?.id ?? "anonymous", "reviews"];

  const list = usePagedContent({
    queryKey: key,
    params: PAGE,
    fetch: listMyReviews,
    map: fromApiMyReview,
    enabled: Boolean(user?.id),
  });

  /* The thank-you appears only after the server has the review. */
  const write = useMutation({
    mutationFn: (draft: ReviewDraft) => submitReview(toSubmitBody(draft)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return {
    reviews: list.items,
    isPending: list.isPending,
    error: list.error,
    refetch: list.refetch,
    hasMore: list.hasMore,
    loadMore: list.loadMore,
    isLoadingMore: list.isLoadingMore,

    submit: write.mutateAsync,
    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
  };
}

export const REVIEW_MODERATION_KEY = [
  "platform",
  "content",
  "reviews",
] as const;

const COUNT_FILTERS: readonly ModerationFilter[] = [
  "all",
  "pending",
  "approved",
  "declined",
];

/**
 * The review queue for moderators (platform content, Manage). The server
 * decides who may read it; a 403 reaches the page as the error.
 *
 * The tab counts are the server's totals (one `limit=1` read per status),
 * not a count over the loaded page.
 */
export function useReviewModeration(tab: ModerationFilter) {
  const queryClient = useQueryClient();

  const list = usePagedContent({
    queryKey: [...REVIEW_MODERATION_KEY, { status: tab }],
    params: PAGE,
    fetch: (params: PageParams) => listModerationReviews(tab, params),
    map: fromApiModerationReview,
  });

  const counts = useQuery({
    queryKey: [...REVIEW_MODERATION_KEY, "counts"],
    queryFn: async () => {
      const pages = await Promise.all(
        COUNT_FILTERS.map((status) =>
          listModerationReviews(status, { limit: 1 }),
        ),
      );
      return Object.fromEntries(
        COUNT_FILTERS.map((status, i) => {
          const p = pages[i].pagination;
          return [status, p && p.mode === "offset" ? p.total : 0];
        }),
      ) as Record<ModerationFilter, number>;
    },
  });

  const settle = useCallback(() => {
    invalidatePublicReviews();
    return queryClient.invalidateQueries({ queryKey: REVIEW_MODERATION_KEY });
  }, [queryClient]);

  const approve = useMutation({
    mutationFn: (id: string) => approveReview(id),
    onSettled: settle,
  });
  const decline = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      declineReview(id, reason.trim()),
    onSettled: settle,
  });

  return {
    reviews: list.items,
    counts: counts.data ?? null,
    isPending: list.isPending,
    error: list.error ?? counts.error,
    refetch: () => {
      list.refetch();
      void counts.refetch();
    },
    hasMore: list.hasMore,
    loadMore: list.loadMore,
    isLoadingMore: list.isLoadingMore,

    approve: approve.mutateAsync,
    decline: (id: string, reason: string) =>
      decline.mutateAsync({ id, reason }),
    isSaving: approve.isPending || decline.isPending,
    saveError: approve.error ?? decline.error,
    dismissSaveError: () => {
      approve.reset();
      decline.reset();
    },
  };
}
