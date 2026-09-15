import type { Review } from "./reviews.types";

/* ==========================================================================
   Reviews — the rules
   --------------------------------------------------------------------------
   Pure, so the admin queue can be tested without a browser. The rating
   clamp and the email normalisation matter: a review is matched to its
   author by email, and a rating outside 1-5 would break every average and
   every row of stars that reads it.
   ========================================================================== */

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const approvedReviews = (reviews: Review[]) =>
  reviews.filter((review) => review.status === "approved");

export const reviewsByAuthor = (reviews: Review[], email: string) => {
  if (!email.trim()) return [];
  const wanted = normalizeEmail(email);
  return reviews.filter(
    (review) => normalizeEmail(review.userEmail) === wanted,
  );
};

export type ReviewDraft = {
  userName: string;
  userEmail: string;
  rating: number;
  role?: string;
  comment: string;
};

export function buildReview(
  draft: ReviewDraft,
  id: string,
  now = new Date(),
): Review {
  return {
    id,
    userName: draft.userName.trim() || "Member",
    userEmail: normalizeEmail(draft.userEmail),
    rating: Math.max(1, Math.min(5, Math.round(draft.rating || 5))),
    role: draft.role?.trim() || "Dialysis Member",
    location: "United States",
    comment: draft.comment.trim(),
    /* Every review starts pending. Nothing a member writes reaches the
       marketing site without someone approving it. */
    status: "pending",
    createdAt: now.toISOString(),
  };
}

export function applyStatus(
  reviews: Review[],
  reviewId: string,
  status: Review["status"],
  adminFeedback?: string,
  now = new Date(),
): Review[] {
  return reviews.map((review) =>
    review.id === reviewId
      ? {
          ...review,
          status,
          /* Feedback only makes sense on a decline, and must not linger
             after the same review is later approved. */
          adminFeedback:
            status === "declined" ? adminFeedback?.trim() : undefined,
          approvedAt:
            status === "approved" ? now.toISOString() : review.approvedAt,
        }
      : review,
  );
}

export const withoutReview = (reviews: Review[], reviewId: string) =>
  reviews.filter((review) => review.id !== reviewId);
