import { describe, expect, it } from "vitest";
import {
  applyStatus,
  approvedReviews,
  buildReview,
  reviewsByAuthor,
  withoutReview,
} from "./reviews.rules";
import type { Review } from "./reviews.types";

/* Approving a review publishes it on the marketing site, so these rules
 * decide what the public sees. They are tested here rather than exercised
 * through two pages that happened to agree with each other. */

const NOW = new Date("2026-09-15T10:00:00.000Z");

const base: Review = {
  id: "rev-1",
  userName: "Marcus J.",
  userEmail: "Marcus.J@Example.com",
  rating: 5,
  role: "Family Caregiver",
  comment: "Helpful.",
  status: "pending",
  createdAt: NOW.toISOString(),
};

describe("review rules", () => {
  it("starts every review pending, so nothing self-publishes", () => {
    const review = buildReview(
      { userName: "A", userEmail: "a@b.c", rating: 5, comment: "Good" },
      "id",
      NOW,
    );
    expect(review.status).toBe("pending");
  });

  it("clamps a rating into 1-5, whatever arrives", () => {
    const draft = { userName: "A", userEmail: "a@b.c", comment: "x" };
    expect(buildReview({ ...draft, rating: 9 }, "id", NOW).rating).toBe(5);
    expect(buildReview({ ...draft, rating: -3 }, "id", NOW).rating).toBe(1);
    expect(buildReview({ ...draft, rating: 3.6 }, "id", NOW).rating).toBe(4);
  });

  it("falls back to a name and a role rather than storing blanks", () => {
    const review = buildReview(
      { userName: "   ", userEmail: "a@b.c", rating: 5, comment: " x " },
      "id",
      NOW,
    );
    expect(review.userName).toBe("Member");
    expect(review.role).toBe("Dialysis Member");
    expect(review.comment).toBe("x");
  });

  it("matches a review to its author however the email was typed", () => {
    expect(reviewsByAuthor([base], "  marcus.j@example.com ")).toHaveLength(1);
    expect(reviewsByAuthor([base], "someone@else.com")).toHaveLength(0);
    expect(reviewsByAuthor([base], "  ")).toHaveLength(0);
  });

  it("shows only approved reviews publicly", () => {
    const list = [base, { ...base, id: "rev-2", status: "approved" as const }];
    expect(approvedReviews(list).map((r) => r.id)).toEqual(["rev-2"]);
  });

  it("stamps the approval time", () => {
    const [review] = applyStatus([base], "rev-1", "approved", undefined, NOW);
    expect(review.approvedAt).toBe(NOW.toISOString());
  });

  it("keeps decline feedback only while the review is declined", () => {
    const declined = applyStatus([base], "rev-1", "declined", " too short ");
    expect(declined[0].adminFeedback).toBe("too short");

    const approved = applyStatus(declined, "rev-1", "approved");
    // The old feedback must not travel with a review that is now published.
    expect(approved[0].adminFeedback).toBeUndefined();
  });

  it("leaves other reviews untouched when one changes", () => {
    const other = { ...base, id: "rev-2" };
    const next = applyStatus([base, other], "rev-1", "approved");
    expect(next[1]).toBe(other);
  });

  it("removes a review by id", () => {
    expect(withoutReview([base], "rev-1")).toHaveLength(0);
    expect(withoutReview([base], "nope")).toHaveLength(1);
  });
});
