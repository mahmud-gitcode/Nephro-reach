import { describe, expect, it } from "vitest";
import {
  approvedTestimonials,
  applyTestimonialStatus,
  buildTestimonial,
  isRevisable,
  reviseTestimonial,
  testimonialsByAuthor,
  withoutTestimonial,
} from "./testimonials.rules";
import type { Testimonial } from "./testimonials.types";
import {
  MAX_TESTIMONIAL_SECONDS,
  formatClock,
  videoLengthError,
} from "./testimonials.rules";

/* A testimonial is a member's face and story on a public page. The rules that
 * matter are the ones deciding when it becomes visible and who may change it
 * after that. */

const NOW = new Date(2026, 8, 15, 10, 0, 0);

function story(patch: Partial<Testimonial> = {}): Testimonial {
  return {
    ...buildTestimonial(
      {
        memberName: "Ray Mitchell",
        memberEmail: "ray@example.com",
        title: "From Fear to Hope",
        role: "Dialysis Member",
        videoUrl: "https://example.com/ray.mp4",
        summary: "The first month was the hardest.",
      },
      "story-1",
      NOW,
    ),
    ...patch,
  };
}

describe("what the public sees", () => {
  it("shows only approved stories", () => {
    const all = [
      story({ id: "a", status: "approved" }),
      story({ id: "b", status: "pending" }),
      story({ id: "c", status: "declined" }),
    ];
    expect(approvedTestimonials(all).map((entry) => entry.id)).toEqual(["a"]);
  });

  it("starts a new submission pending, never published", () => {
    expect(story().status).toBe("pending");
  });
});

describe("a member's own stories", () => {
  it("finds them by email, whatever the casing", () => {
    const all = [
      story({ id: "a", memberEmail: "Ray@Example.com" }),
      story({ id: "b", memberEmail: "someone@else.com" }),
    ];
    expect(
      testimonialsByAuthor(all, "ray@example.com").map((entry) => entry.id),
    ).toEqual(["a"]);
  });
});

describe("revising a submission", () => {
  it("is allowed while it waits on review", () => {
    expect(isRevisable(story({ status: "pending" }))).toBe(true);
  });

  it("is not allowed once an admin has ruled on it", () => {
    // Editing a published story would put new words on a public page that
    // nobody reviewed.
    expect(isRevisable(story({ status: "approved" }))).toBe(false);
    expect(isRevisable(story({ status: "declined" }))).toBe(false);
  });

  it("changes the words and the video, and nothing else", () => {
    const before = story({ status: "pending" });
    const [after] = reviseTestimonial([before], "story-1", {
      title: "A Better Title",
      role: "Family Caregiver",
      videoUrl: "https://example.com/new.mp4",
      summary: "Rewritten.",
    });

    expect(after.title).toBe("A Better Title");
    expect(after.summary).toBe("Rewritten.");
    expect(after.videoUrl).toBe("https://example.com/new.mp4");

    /* An edit is not a resubmission: the identity, the author and the
       submitted date stay put. */
    expect(after.id).toBe(before.id);
    expect(after.memberEmail).toBe(before.memberEmail);
    expect(after.createdAt).toBe(before.createdAt);
  });

  it("leaves the status alone, so an edit cannot hide a rejection", () => {
    const declined = story({ status: "declined", adminFeedback: "Too long." });
    const [after] = reviseTestimonial([declined], "story-1", {
      title: "Trying again",
      role: "Dialysis Member",
      videoUrl: "https://example.com/new.mp4",
      summary: "Shorter now.",
    });
    expect(after.status).toBe("declined");
    expect(after.adminFeedback).toBe("Too long.");
  });

  it("keeps the old value when a field is left blank", () => {
    const before = story({ status: "pending" });
    const [after] = reviseTestimonial([before], "story-1", {
      title: "   ",
      role: "",
      videoUrl: "",
      summary: "",
    });
    expect(after.title).toBe(before.title);
    expect(after.videoUrl).toBe(before.videoUrl);
  });

  it("touches only the story asked for", () => {
    const all = [story({ id: "a" }), story({ id: "b", title: "Untouched" })];
    const after = reviseTestimonial(all, "a", {
      title: "Changed",
      role: "Dialysis Member",
      videoUrl: "https://example.com/a.mp4",
      summary: "Changed.",
    });
    expect(after[1].title).toBe("Untouched");
  });
});

describe("the admin decision", () => {
  it("records feedback with a rejection", () => {
    const [after] = applyTestimonialStatus(
      [story()],
      "story-1",
      "declined",
      "Please shorten it.",
      NOW,
    );
    expect(after.status).toBe("declined");
    expect(after.adminFeedback).toBe("Please shorten it.");
  });

  it("removes a story outright", () => {
    expect(withoutTestimonial([story({ id: "a" })], "a")).toHaveLength(0);
  });
});

describe("how long a testimonial may run", () => {
  it("accepts a clip inside the limit", () => {
    expect(videoLengthError(60)).toBeNull();
    expect(videoLengthError(MAX_TESTIMONIAL_SECONDS)).toBeNull();
  });

  it("rejects one past it, and says both numbers", () => {
    const message = videoLengthError(MAX_TESTIMONIAL_SECONDS + 1);
    expect(message).toContain("3:01");
    expect(message).toContain("3:00");
  });

  it("lets a length it cannot read through rather than blocking", () => {
    // Some MOV files report no duration until fully decoded. Refusing a
    // member's only recording because the browser could not measure it is
    // worse than letting the admin see it and decide.
    expect(videoLengthError(null)).toBeNull();
    expect(videoLengthError(NaN)).toBeNull();
    expect(videoLengthError(Infinity)).toBeNull();
    expect(videoLengthError(0)).toBeNull();
    expect(videoLengthError(-5)).toBeNull();
  });

  it("says a time the way somebody about to record would read it", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(9)).toBe("0:09");
    expect(formatClock(75)).toBe("1:15");
    expect(formatClock(180)).toBe("3:00");
    expect(formatClock(605)).toBe("10:05");
  });
});
