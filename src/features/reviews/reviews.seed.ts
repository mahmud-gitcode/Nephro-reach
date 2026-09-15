import type { Review } from "./reviews.types";

/* Demo reviews. Deletable in one commit when real accounts arrive — but
   note these are also what the marketing site falls back to. */
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
