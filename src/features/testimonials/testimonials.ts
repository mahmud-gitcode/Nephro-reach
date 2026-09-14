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

const STORAGE_KEY = "nr-video-testimonials";
export const TESTIMONIALS_EVENT = "nr-testimonials-changed";

export const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    id: "test-1",
    memberName: "James Thompson",
    memberEmail: "james.t@example.com",
    title: "From Fear to Hope: My Dialysis Journey",
    role: "Dialysis Member (3 Years)",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Sample video
    thumbnailUrl: "/images/user-dashboard/testimonial.jpg",
    duration: "4:12",
    summary:
      "When I was first diagnosed, fear dominated everything. Connecting with others and understanding my dialysis routine changed my life from fear to daily hope.",
    status: "approved",
    createdAt: "2026-04-12T10:00:00Z",
    approvedAt: "2026-04-12T14:00:00Z",
  },
  {
    id: "test-2",
    memberName: "Elena Rostova",
    memberEmail: "elena.r@example.com",
    title: "From Fear to Hope: Finding Routine & Community",
    role: "Peritoneal Dialysis Patient",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "/images/user-dashboard/testimonial.jpg",
    duration: "3:48",
    summary:
      "Learning home dialysis felt overwhelming at first. Taking control of my schedule and tracking my daily habits gave me back my independence.",
    status: "approved",
    createdAt: "2026-04-20T11:30:00Z",
    approvedAt: "2026-04-20T15:00:00Z",
  },
  {
    id: "test-3",
    memberName: "David Martinez",
    memberEmail: "david.m@example.com",
    title: "From Fear to Hope: A Caregiver's Perspective",
    role: "Family Caregiver",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "/images/user-dashboard/testimonial.jpg",
    duration: "5:20",
    summary:
      "Supporting my father through treatments was scary. With clear educational materials and peer support, we transitioned into a calm, confident daily rhythm.",
    status: "approved",
    createdAt: "2026-05-02T09:15:00Z",
    approvedAt: "2026-05-02T12:00:00Z",
  },
];

function notifyChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TESTIMONIALS_EVENT));
  }
}

export function getTestimonials(): Testimonial[] {
  if (typeof window === "undefined") {
    return INITIAL_TESTIMONIALS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TESTIMONIALS));
      return INITIAL_TESTIMONIALS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_TESTIMONIALS;
  } catch (err) {
    console.error("Error loading testimonials:", err);
    return INITIAL_TESTIMONIALS;
  }
}

export function getApprovedTestimonials(): Testimonial[] {
  const all = getTestimonials();
  return all.filter((t) => t.status === "approved");
}

export function getUserTestimonials(email: string): Testimonial[] {
  if (!email) return [];
  const normalized = email.trim().toLowerCase();
  const all = getTestimonials();
  return all.filter((t) => t.memberEmail.trim().toLowerCase() === normalized);
}

export function submitTestimonial(input: {
  memberName: string;
  memberEmail: string;
  title: string;
  role?: string;
  videoUrl: string;
  summary: string;
  duration?: string;
}): Testimonial {
  const all = getTestimonials();
  const newTestimonial: Testimonial = {
    id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    memberName: input.memberName.trim() || "Member",
    memberEmail: input.memberEmail.trim().toLowerCase(),
    title: input.title.trim() || "From Fear to Hope: My Dialysis Journey",
    role: input.role?.trim() || "Dialysis Member",
    videoUrl: input.videoUrl.trim(),
    thumbnailUrl: "/images/user-dashboard/testimonial.jpg",
    duration: input.duration || "3:30",
    summary: input.summary.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const updated = [newTestimonial, ...all];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyChange();
  }
  return newTestimonial;
}

export function updateTestimonialStatus(
  testimonialId: string,
  status: "approved" | "declined" | "pending",
  adminFeedback?: string,
): void {
  const all = getTestimonials();
  const updated = all.map((t) => {
    if (t.id === testimonialId) {
      return {
        ...t,
        status,
        adminFeedback:
          status === "declined" ? adminFeedback?.trim() : undefined,
        approvedAt:
          status === "approved" ? new Date().toISOString() : t.approvedAt,
      };
    }
    return t;
  });

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyChange();
  }
}

export function deleteTestimonial(testimonialId: string): void {
  const all = getTestimonials();
  const updated = all.filter((t) => t.id !== testimonialId);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyChange();
  }
}
