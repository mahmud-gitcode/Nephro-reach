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

const STORAGE_KEY = "nr-community-reviews";
export const REVIEWS_EVENT = "nr-reviews-changed";

export const INITIAL_REVIEWS: Review[] = [
  {
    id: "rev-1",
    userName: "Marcus J.",
    userEmail: "marcus.j@example.com",
    rating: 5,
    role: "Family Caregiver",
    location: "United States",
    comment:
      "As a caregiver, having simple explanations and reminders made a real difference. It gave our family a calmer way to talk about kidney health.",
    status: "approved",
    createdAt: "2026-05-10T10:00:00Z",
    approvedAt: "2026-05-10T12:00:00Z",
  },
  {
    id: "rev-2",
    userName: "Angela R.",
    userEmail: "angela.r@example.com",
    rating: 5,
    role: "Dialysis Member",
    location: "United States",
    comment:
      "The lessons helped me understand what questions to bring to my dialysis team. I felt more organized and less overwhelmed after the first week.",
    status: "approved",
    createdAt: "2026-05-14T14:30:00Z",
    approvedAt: "2026-05-14T15:00:00Z",
  },
  {
    id: "rev-3",
    userName: "Cynthia L.",
    userEmail: "cynthia.l@example.com",
    rating: 5,
    role: "CKD Learner",
    location: "United States",
    comment:
      "The tracking tools helped me notice patterns before my appointments. I could share clearer notes and make better use of my visit time.",
    status: "approved",
    createdAt: "2026-05-20T09:15:00Z",
    approvedAt: "2026-05-20T11:00:00Z",
  },
];

function notifyChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(REVIEWS_EVENT));
  }
}

export function getReviews(): Review[] {
  if (typeof window === "undefined") {
    return INITIAL_REVIEWS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REVIEWS));
      return INITIAL_REVIEWS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_REVIEWS;
  } catch (err) {
    console.error("Error loading reviews:", err);
    return INITIAL_REVIEWS;
  }
}

export function getApprovedReviews(): Review[] {
  const all = getReviews();
  return all.filter((r) => r.status === "approved");
}

export function getUserReviews(email: string): Review[] {
  if (!email) return [];
  const normalized = email.trim().toLowerCase();
  const all = getReviews();
  return all.filter((r) => r.userEmail.trim().toLowerCase() === normalized);
}

export function submitReview(input: {
  userName: string;
  userEmail: string;
  rating: number;
  role?: string;
  comment: string;
}): Review {
  const all = getReviews();
  const newReview: Review = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userName: input.userName.trim() || "Member",
    userEmail: input.userEmail.trim().toLowerCase(),
    rating: Math.max(1, Math.min(5, Math.round(input.rating || 5))),
    role: input.role?.trim() || "Dialysis Member",
    location: "United States",
    comment: input.comment.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const updated = [newReview, ...all];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyChange();
  }
  return newReview;
}

export function updateReviewStatus(
  reviewId: string,
  status: "approved" | "declined" | "pending",
  adminFeedback?: string
): void {
  const all = getReviews();
  const updated = all.map((r) => {
    if (r.id === reviewId) {
      return {
        ...r,
        status,
        adminFeedback: status === "declined" ? adminFeedback?.trim() : undefined,
        approvedAt: status === "approved" ? new Date().toISOString() : r.approvedAt,
      };
    }
    return r;
  });

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyChange();
  }
}

export function deleteReview(reviewId: string): void {
  const all = getReviews();
  const updated = all.filter((r) => r.id !== reviewId);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyChange();
  }
}
