import type { Testimonial } from "./testimonials.types";

/* Pure rules, shared by the member's submission form and the admin queue.
   The same shape as reviews.rules.ts on purpose: these are two instances of
   one workflow — a member submits, an admin publishes — and they should not
   drift apart. */

/* ==========================================================================
   How long a testimonial may run
   --------------------------------------------------------------------------
   Three minutes.

   These are personal stories on a shelf people browse, and a ten-minute
   upload costs three people something: the member who records it and is
   asked to do it again, the admin who has to watch all of it to approve it,
   and the next member, who scrolls past anything that looks like homework.

   The size cap that was already here does not do this job. A three-minute
   clip from an older phone and a twenty-minute one from a newer phone can
   land on the same number of megabytes.
   ========================================================================== */

export const MAX_TESTIMONIAL_SECONDS = 3 * 60;

/** Big enough to be a real recording, small enough to be a phone clip. */
export const MAX_TESTIMONIAL_MB = 200;

/** "3:00" — the way a limit is said to somebody about to record. */
export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * Whether a file's length is acceptable.
 *
 * A length that cannot be read is allowed through rather than blocked: some
 * MOV files report no duration until they are fully decoded, and refusing a
 * member's only recording because the browser could not measure it would be
 * worse than letting the admin see it and decide.
 */
export function videoLengthError(seconds: number | null): string | null {
  if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  if (seconds > MAX_TESTIMONIAL_SECONDS) {
    return `That video is ${formatClock(seconds)}. Testimonials can be up to ${formatClock(
      MAX_TESTIMONIAL_SECONDS,
    )} — try trimming it before you upload.`;
  }
  return null;
}

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
