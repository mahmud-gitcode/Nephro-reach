import { describe, expect, it } from "vitest";
import {
  clampRating,
  fromApiModerationReview,
  fromApiMyReview,
  fromApiPublicReview,
  toStatus,
  toSubmitBody,
} from "./reviews.api";

/* Reviews against the API (Phase 12). The author is the signed-in account,
   so nothing here may carry a name or an email to the server. */

describe("what a review sends", () => {
  it("sends the role chip and the typed role apart, as the API takes them", () => {
    // The page used to send the typed text as the role itself.
    expect(
      toSubmitBody({
        rating: 4,
        role: "Other",
        otherRole: "  Kidney donor ",
        comment: " Helpful ",
      }),
    ).toEqual({
      rating: 4,
      role: "Other",
      otherRole: "Kidney donor",
      comment: "Helpful",
    });
  });

  it("sends no name, email or location", () => {
    const body = toSubmitBody({
      rating: 5,
      role: "Family Caregiver",
      comment: "Thanks",
    });
    expect(Object.keys(body).sort()).toEqual(["comment", "rating", "role"]);
  });

  it("keeps an unknown role from reaching the API as is", () => {
    expect(toSubmitBody({ rating: 5, role: "Admin", comment: "x" }).role).toBe(
      "Dialysis Member",
    );
  });

  it("clamps the rating into 1-5", () => {
    expect(clampRating(9)).toBe(5);
    expect(clampRating(-2)).toBe(1);
    expect(clampRating(3.4)).toBe(3);
  });
});

describe("what a review shows", () => {
  const mine = {
    id: "r1",
    rating: 5,
    role: "Dialysis Member",
    comment: "c",
    status: "declined",
    adminFeedback: "Please remove the phone number",
    createdAt: "2026-11-01T10:00:00.000Z",
    approvedAt: null,
  };

  it("round-trips the three statuses and treats anything else as pending", () => {
    expect(toStatus("pending")).toBe("pending");
    expect(toStatus("approved")).toBe("approved");
    expect(toStatus("declined")).toBe("declined");
    expect(toStatus("published")).toBe("pending");
  });

  it("maps the member's own review with the moderator's feedback", () => {
    expect(fromApiMyReview(mine)).toMatchObject({
      status: "declined",
      adminFeedback: "Please remove the phone number",
      userEmail: "",
    });
  });

  it("gives moderators the author's name and the personal-details flag, never an email", () => {
    const review = fromApiModerationReview({
      ...mine,
      authorId: "u1",
      authorName: null,
      location: null,
      personalInfoDetected: true,
      decidedById: null,
    });
    expect(review.userName).toBe("Member");
    expect(review.personalInfoDetected).toBe(true);
    expect(review.userEmail).toBe("");
  });

  it("maps the public shape as approved, with no email or location", () => {
    expect(
      fromApiPublicReview({
        id: "p",
        authorName: "Test M.",
        role: "Family Caregiver",
        rating: 4,
        comment: "c",
      }),
    ).toEqual({
      id: "p",
      userName: "Test M.",
      userEmail: "",
      rating: 4,
      role: "Family Caregiver",
      comment: "c",
      status: "approved",
      createdAt: "",
    });
  });
});
