/* A community review, written by a member and shown once an admin approves
   it. Reviews appear on the marketing site, so "approved" is a publishing
   decision, not a cosmetic status. */
export interface Review {
  id: string;
  /** The author's name as the server shows it (moderators: full name;
   *  the website: first name and initial). Empty on the member's own list. */
  userName: string;
  /** Never sent by the API (Phase 12). Kept empty for the landing type. */
  userEmail: string;
  rating: number; // 1 to 5
  role: string; // e.g. "Dialysis Member", "Family Caregiver"
  location?: string;
  comment: string;
  status: "pending" | "approved" | "declined";
  adminFeedback?: string;
  /** Moderators only: the server found a phone number, email or the like. */
  personalInfoDetected?: boolean;
  createdAt: string;
  approvedAt?: string;
}
