/* A community review, written by a member and shown once an admin approves
   it. Reviews appear on the marketing site, so "approved" is a publishing
   decision, not a cosmetic status. */
export interface Review {
  id: string;
  userName: string;
  userEmail: string;
  rating: number; // 1 to 5
  role: string; // e.g. "Dialysis Member", "Family Caregiver"
  location?: string;
  comment: string;
  status: "pending" | "approved" | "declined";
  adminFeedback?: string;
  createdAt: string;
  approvedAt?: string;
}
