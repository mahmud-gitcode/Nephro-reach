/* A video testimonial ("From Fear to Hope"), recorded by a member and
   published only once an admin approves it (Phase 12: the server's). */
export interface Testimonial {
  id: string;
  /** The author's name as the server shows it: first name and initial on
   *  the dashboard, the full name for moderators, empty on "mine". */
  memberName: string;
  title: string;
  role: string;
  /** An external link (YouTube, Vimeo or an https file), or "" when the
   *  video is an upload, which is fetched as a short-lived link on play. */
  videoUrl: string;
  /** True when the video was uploaded through /files. */
  hasUploadedVideo: boolean;
  thumbnailUrl?: string;
  duration?: string;
  summary: string;
  status: "pending" | "approved" | "declined";
  adminFeedback?: string;
  /** Moderators only: the server found a phone number, email or the like. */
  personalInfoDetected?: boolean;
  createdAt: string;
  approvedAt?: string;
}
