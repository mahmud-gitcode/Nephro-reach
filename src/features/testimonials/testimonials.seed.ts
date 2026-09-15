import type { Testimonial } from "./testimonials.types";

/* Demo testimonials. Deletable in one commit when real accounts arrive. */
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
