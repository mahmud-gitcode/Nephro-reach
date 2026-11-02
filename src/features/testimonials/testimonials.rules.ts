import { MAX_UPLOAD_BYTES } from "@/lib/api/upload";

/* Pure rules for the member's submission form. Submitting, the status and
   the moderators' decisions are the server's (Phase 12). */

/* ==========================================================================
   How long a testimonial may run
   --------------------------------------------------------------------------
   Three minutes.

   These are personal stories on a shelf people browse, and a ten-minute
   upload costs three people something: the member who records it and is
   asked to do it again, the admin who has to watch all of it to approve it,
   and the next member, who scrolls past anything that looks like homework.

   The server caps the measured length at 180 seconds too; the length is
   the one the browser measured (INT-19), because the API cannot read video
   files.
   ========================================================================== */

export const MAX_TESTIMONIAL_SECONDS = 3 * 60;

/** The upload cap: the API's (10 MB) until a per-purpose limit for video is
 *  decided (INT-16 / D18). It used to say 200 MB, which the server refused. */
export const MAX_TESTIMONIAL_MB = Math.round(MAX_UPLOAD_BYTES / 1024 / 1024);

/** The video types the API takes for a story (video/mp4, webm, quicktime). */
export const TESTIMONIAL_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

/** "3:00" — the way a limit is said to somebody about to record. */
export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** The measured length as the API takes it: whole seconds 1–180, or
 *  undefined when the browser could not read it. */
export function toDurationSeconds(
  seconds: number | null | undefined,
): number | undefined {
  if (seconds === null || seconds === undefined) return undefined;
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  const whole = Math.max(1, Math.round(seconds));
  return whole > MAX_TESTIMONIAL_SECONDS ? undefined : whole;
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

/** Why a chosen file cannot be a story, or null. Size first in MB words. */
export function videoFileError(file: {
  type: string;
  size: number;
}): string | null {
  if (
    !(TESTIMONIAL_VIDEO_TYPES as readonly string[]).includes(
      file.type.trim().toLowerCase(),
    )
  ) {
    return "That is not a video file we can take. Choose an MP4, WebM or MOV.";
  }
  if (file.size <= 0) return "That file is empty.";
  if (file.size > MAX_UPLOAD_BYTES) {
    return `That file is ${Math.round(file.size / 1024 / 1024)} MB. The limit is ${MAX_TESTIMONIAL_MB} MB.`;
  }
  return null;
}
