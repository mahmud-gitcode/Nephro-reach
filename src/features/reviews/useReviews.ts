"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listReviews, saveReviews } from "./reviews.repository";
import {
  applyStatus,
  buildReview,
  withoutReview,
  type ReviewDraft,
} from "./reviews.rules";
import { REVIEWS_EVENT } from "./reviews";
import type { Review } from "./reviews.types";

export type { Review } from "./reviews.types";
export type { ReviewDraft } from "./reviews.rules";

export const reviewsKey = ["reviews", "all"] as const;

/* The marketing site renders approved reviews and listens for this event to
   pick up a change made in the portal. It reads synchronously through
   reviews.ts, so every write from here has to ring that bell. */
function announce() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(REVIEWS_EVENT));
  }
}

export function useReviews() {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: reviewsKey, queryFn: listReviews });

  const write = useMutation({
    mutationFn: async (transform: (current: Review[]) => Review[]) =>
      saveReviews(transform(await listReviews())),
    onSuccess: (reviews) => {
      queryClient.setQueryData(reviewsKey, reviews);
      announce();
    },
  });

  return {
    reviews: query.data ?? [],
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),

    submit: (draft: ReviewDraft) =>
      write.mutateAsync((current) => [
        buildReview(draft, crypto.randomUUID()),
        ...current,
      ]),
    setStatus: (id: string, status: Review["status"], adminFeedback?: string) =>
      write.mutateAsync((current) =>
        applyStatus(current, id, status, adminFeedback),
      ),
    remove: (id: string) =>
      write.mutateAsync((current) => withoutReview(current, id)),

    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
  };
}
