/* ==========================================================================
   Testimonials <-> the API (Phase 12)
   --------------------------------------------------------------------------
   - published stories: GET /public/testimonials
   - the member's own: GET /me/testimonials; a new one: the video through
     /files (PRIVATE), then POST /testimonials { videoFileId, … }
   - an uploaded video plays from a short-lived link:
     GET /testimonials/:id/video (approved, or the caller's own)
   - moderators (platform content, Manage): GET /platform/content/
     testimonials, …/:id/video, POST …/:id/approve, …/:id/decline { reason }

   No name or email is sent: the author is the signed-in account. No seed.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import { displayableImage } from "@/features/library/mediaDisplay";
import type { Testimonial } from "./testimonials.types";

/* A thumbnail the page can show (a site path); a remote one is not loaded
   (D18: no third-party request from the dashboard; library/mediaDisplay). */
const thumb = (url: string | null) =>
  url
    ? displayableImage(url, "/images/user-dashboard/testimonial.jpg")
    : undefined;

export const TESTIMONIAL_ROLES = [
  "Dialysis Member",
  "Family Caregiver",
  "CKD Learner",
  "Transplant Warrior",
  "Other",
] as const;
export type TestimonialRole = (typeof TESTIMONIAL_ROLES)[number];

export type ApiPublicTestimonial = {
  id: string;
  authorName: string;
  role: string;
  title: string;
  summary: string;
  thumbnailUrl: string | null;
  duration: string | null;
  videoUrl: string | null;
  hasUploadedVideo: boolean;
};

export type ApiMyTestimonial = {
  id: string;
  title: string;
  role: string;
  hasVideo: boolean;
  duration: string | null;
  summary: string;
  status: string;
  adminFeedback: string | null;
  createdAt: string;
  approvedAt: string | null;
};

export type ApiModerationTestimonial = {
  id: string;
  authorId: string;
  authorName: string | null;
  title: string;
  role: string;
  hasVideo: boolean;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  summary: string;
  personalInfoDetected: boolean;
  status: string;
  adminFeedback: string | null;
  decidedById: string | null;
  createdAt: string;
  approvedAt: string | null;
};

export type SubmitTestimonialBody = {
  title?: string;
  role: TestimonialRole;
  otherRole?: string;
  videoFileId: string;
  durationSeconds?: number;
  summary: string;
};

export type ApiFileLink = { url: string; expiresIn: number };

type Status = Testimonial["status"];
function toStatus(value: string): Status {
  return value === "approved" || value === "declined" ? value : "pending";
}

export function toSubmitBody(draft: {
  title: string;
  role: string;
  otherRole?: string;
  videoFileId: string;
  durationSeconds?: number;
  summary: string;
}): SubmitTestimonialBody {
  const role = (TESTIMONIAL_ROLES as readonly string[]).includes(draft.role)
    ? (draft.role as TestimonialRole)
    : "Dialysis Member";
  const otherRole = draft.otherRole?.trim();
  const title = draft.title.trim();
  return {
    ...(title ? { title } : {}),
    role,
    ...(role === "Other" && otherRole ? { otherRole } : {}),
    videoFileId: draft.videoFileId,
    ...(draft.durationSeconds !== undefined
      ? { durationSeconds: draft.durationSeconds }
      : {}),
    summary: draft.summary.trim(),
  };
}

export function fromApiPublicTestimonial(
  row: ApiPublicTestimonial,
): Testimonial {
  return {
    id: row.id,
    memberName: row.authorName,
    title: row.title,
    role: row.role,
    videoUrl: row.videoUrl ?? "",
    hasUploadedVideo: row.hasUploadedVideo,
    thumbnailUrl: thumb(row.thumbnailUrl),
    duration: row.duration ?? undefined,
    summary: row.summary,
    status: "approved",
    createdAt: "",
  };
}

export function fromApiMyTestimonial(row: ApiMyTestimonial): Testimonial {
  return {
    id: row.id,
    memberName: "",
    title: row.title,
    role: row.role,
    videoUrl: "",
    hasUploadedVideo: row.hasVideo,
    duration: row.duration ?? undefined,
    summary: row.summary,
    status: toStatus(row.status),
    adminFeedback: row.adminFeedback ?? undefined,
    createdAt: row.createdAt,
    approvedAt: row.approvedAt ?? undefined,
  };
}

export function fromApiModerationTestimonial(
  row: ApiModerationTestimonial,
): Testimonial {
  return {
    id: row.id,
    memberName: row.authorName ?? "Member",
    title: row.title,
    role: row.role,
    videoUrl: row.videoUrl ?? "",
    hasUploadedVideo: row.hasVideo,
    thumbnailUrl: thumb(row.thumbnailUrl),
    duration: row.duration ?? undefined,
    summary: row.summary,
    status: toStatus(row.status),
    adminFeedback: row.adminFeedback ?? undefined,
    personalInfoDetected: row.personalInfoDetected,
    createdAt: row.createdAt,
    approvedAt: row.approvedAt ?? undefined,
  };
}

const enc = encodeURIComponent;

export const listPublicTestimonials = (params: PageParams) =>
  fetchPage<ApiPublicTestimonial>("/public/testimonials", params);

export const listMyTestimonials = (params: PageParams) =>
  fetchPage<ApiMyTestimonial>("/me/testimonials", params);

export const submitTestimonial = (body: SubmitTestimonialBody) =>
  api<ApiMyTestimonial>("/testimonials", { method: "POST", body });

export const testimonialVideo = (id: string) =>
  api<ApiFileLink>(`/testimonials/${enc(id)}/video`);

export type ModerationFilter = Status | "all";

export const listModerationTestimonials = (
  status: ModerationFilter,
  params: PageParams,
) =>
  fetchPage<ApiModerationTestimonial>(
    "/platform/content/testimonials",
    params,
    { query: { status } },
  );

export const moderationVideo = (id: string) =>
  api<ApiFileLink>(`/platform/content/testimonials/${enc(id)}/video`);

export const approveTestimonial = (id: string) =>
  api<ApiModerationTestimonial>(
    `/platform/content/testimonials/${enc(id)}/approve`,
    { method: "POST" },
  );

export const declineTestimonial = (id: string, reason: string) =>
  api<ApiModerationTestimonial>(
    `/platform/content/testimonials/${enc(id)}/decline`,
    { method: "POST", body: { reason: reason.trim() } },
  );
