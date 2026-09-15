/* A video testimonial, recorded by a member and published only once an
   admin approves it. */
export interface Testimonial {
  id: string;
  memberName: string;
  memberEmail: string;
  title: string;
  role: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: string;
  summary: string;
  status: "pending" | "approved" | "declined";
  adminFeedback?: string;
  createdAt: string;
  approvedAt?: string;
}
