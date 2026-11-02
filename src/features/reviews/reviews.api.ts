/* ==========================================================================
   Reviews <-> the API (Phase 12)
   --------------------------------------------------------------------------
   One call per server operation (ADR 0007 §1). The author is the signed-in
   account: no name or email is ever sent, and a member's list is
   `GET /me/reviews`, not a filter over everyone's reviews by email.

   - member: POST /reviews, GET /me/reviews
   - moderators (platform content, Manage): GET /platform/content/reviews,
     POST …/:id/approve, POST …/:id/decline { reason }
   - the marketing site: GET /public/reviews (reviews.ts, no credentials)

   No seed: a sample review must never show as a real member's words.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import type { Review } from "./reviews.types";

/** The role chips. "Other" carries the typed role in `otherRole`. */
export const REVIEW_ROLES = [
  "Dialysis Member",
  "Family Caregiver",
  "CKD Learner",
  "Transplant Warrior",
  "Other",
] as const;
export type ReviewRole = (typeof REVIEW_ROLES)[number];

export type ReviewStatus = Review["status"];

/** GET /me/reviews */
export type ApiMyReview = {
  id: string;
  rating: number;
  role: string;
  comment: string;
  status: string;
  adminFeedback: string | null;
  createdAt: string;
  approvedAt: string | null;
};

/** GET /platform/content/reviews */
export type ApiModerationReview = ApiMyReview & {
  authorId: string;
  authorName: string | null;
  location: string | null;
  personalInfoDetected: boolean;
  decidedById: string | null;
};

/** GET /public/reviews: the whole public shape, nothing more. */
export type ApiPublicReview = {
  id: string;
  authorName: string;
  role: string;
  rating: number;
  comment: string;
};

export type SubmitReviewBody = {
  rating: number;
  role: ReviewRole;
  otherRole?: string;
  comment: string;
};

const STATUSES: readonly ReviewStatus[] = ["pending", "approved", "declined"];

/** An unknown status is shown as pending, never as approved. */
export function toStatus(value: string): ReviewStatus {
  return (STATUSES as readonly string[]).includes(value)
    ? (value as ReviewStatus)
    : "pending";
}

export function clampRating(rating: number): number {
  return Math.max(1, Math.min(5, Math.round(rating || 5)));
}

/** The form's chips and typed role, as the API takes them. */
export function toSubmitBody(draft: {
  rating: number;
  role: string;
  otherRole?: string;
  comment: string;
}): SubmitReviewBody {
  const role = (REVIEW_ROLES as readonly string[]).includes(draft.role)
    ? (draft.role as ReviewRole)
    : "Dialysis Member";
  const otherRole = draft.otherRole?.trim();
  return {
    rating: clampRating(draft.rating),
    role,
    ...(role === "Other" && otherRole ? { otherRole } : {}),
    comment: draft.comment.trim(),
  };
}

export function fromApiMyReview(row: ApiMyReview): Review {
  return {
    id: row.id,
    userName: "",
    userEmail: "",
    rating: row.rating,
    role: row.role,
    comment: row.comment,
    status: toStatus(row.status),
    adminFeedback: row.adminFeedback ?? undefined,
    createdAt: row.createdAt,
    approvedAt: row.approvedAt ?? undefined,
  };
}

export function fromApiModerationReview(row: ApiModerationReview): Review {
  return {
    ...fromApiMyReview(row),
    /* The server sends the full profile name to the team, or null. */
    userName: row.authorName ?? "Member",
    location: row.location ?? undefined,
    personalInfoDetected: row.personalInfoDetected,
  };
}

/** The landing banner's shape. No email, no status from the client. */
export function fromApiPublicReview(row: ApiPublicReview): Review {
  return {
    id: row.id,
    userName: row.authorName,
    userEmail: "",
    rating: row.rating,
    role: row.role,
    comment: row.comment,
    status: "approved",
    createdAt: "",
  };
}

export const submitReview = (body: SubmitReviewBody) =>
  api<ApiMyReview>("/reviews", { method: "POST", body });

export const listMyReviews = (params: PageParams) =>
  fetchPage<ApiMyReview>("/me/reviews", params);

/** "all" lists every status (spec 050). */
export type ModerationFilter = ReviewStatus | "all";

export const listModerationReviews = (
  status: ModerationFilter,
  params: PageParams,
) =>
  fetchPage<ApiModerationReview>("/platform/content/reviews", params, {
    query: { status },
  });

export const approveReview = (id: string) =>
  api<ApiModerationReview>(
    `/platform/content/reviews/${encodeURIComponent(id)}/approve`,
    { method: "POST" },
  );

export const declineReview = (id: string, reason: string) =>
  api<ApiModerationReview>(
    `/platform/content/reviews/${encodeURIComponent(id)}/decline`,
    { method: "POST", body: { reason } },
  );
