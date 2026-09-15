import type { Testimonial } from "./testimonials.types";

/* Pure rules, shared by the member's submission form and the admin queue.
   The same shape as reviews.rules.ts on purpose: these are two instances of
   one workflow — a member submits, an admin publishes — and they should not
   drift apart. */

const normalize = (email: string) => email.trim().toLowerCase();

export const approvedTestimonials = (testimonials: Testimonial[]) =>
  testimonials.filter((testimonial) => testimonial.status === "approved");

export const testimonialsByAuthor = (
  testimonials: Testimonial[],
  email: string,
) => {
  if (!email.trim()) return [];
  const wanted = normalize(email);
  return testimonials.filter(
    (testimonial) => normalize(testimonial.memberEmail) === wanted,
  );
};

export type TestimonialDraft = {
  memberName: string;
  memberEmail: string;
  title: string;
  role?: string;
  videoUrl: string;
  summary: string;
  duration?: string;
};

export function buildTestimonial(
  draft: TestimonialDraft,
  id: string,
  now = new Date(),
): Testimonial {
  return {
    id,
    memberName: draft.memberName.trim() || "Member",
    memberEmail: normalize(draft.memberEmail),
    title: draft.title.trim() || "From Fear to Hope: My Dialysis Journey",
    role: draft.role?.trim() || "Dialysis Member",
    videoUrl: draft.videoUrl.trim(),
    thumbnailUrl: "/images/user-dashboard/testimonial.jpg",
    duration: draft.duration || "3:30",
    summary: draft.summary.trim(),
    status: "pending",
    createdAt: now.toISOString(),
  };
}

export function applyTestimonialStatus(
  testimonials: Testimonial[],
  id: string,
  status: Testimonial["status"],
  adminFeedback?: string,
  now = new Date(),
): Testimonial[] {
  return testimonials.map((testimonial) =>
    testimonial.id === id
      ? {
          ...testimonial,
          status,
          adminFeedback:
            status === "declined" ? adminFeedback?.trim() : undefined,
          approvedAt:
            status === "approved" ? now.toISOString() : testimonial.approvedAt,
        }
      : testimonial,
  );
}

export const withoutTestimonial = (testimonials: Testimonial[], id: string) =>
  testimonials.filter((testimonial) => testimonial.id !== id);

/**
 * A member revising their own submission while it waits on review.
 *
 * Only the words and the video change: the id, the author and the submitted
 * date stay, and so does the status. An edit is not a resubmission, and
 * silently resetting an admin's decision would hide a rejection.
 */
export function reviseTestimonial(
  testimonials: Testimonial[],
  id: string,
  draft: Pick<TestimonialDraft, "title" | "role" | "videoUrl" | "summary">,
): Testimonial[] {
  return testimonials.map((testimonial) =>
    testimonial.id === id
      ? {
          ...testimonial,
          title: draft.title.trim() || testimonial.title,
          role: draft.role || testimonial.role,
          videoUrl: draft.videoUrl.trim() || testimonial.videoUrl,
          summary: draft.summary.trim() || testimonial.summary,
        }
      : testimonial,
  );
}

/** A member may change their own story until an admin has ruled on it. */
export function isRevisable(testimonial: Testimonial): boolean {
  return testimonial.status === "pending";
}
