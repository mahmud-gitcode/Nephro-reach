import type { BadgeTone, SeriesTone } from "@/components/ui";

/* ==========================================================================
   Clinic live classes — demo data
   --------------------------------------------------------------------------
   The client's figures from their mockup, copied as given. Two do not
   reconcile, and are left alone until the client says which is right:

   - "5 upcoming live classes this month", against a schedule of three in
     September and two in October.
   - The schedule is dated as if today were before September 12: the 12th
     and 19th are still "Open" for registration. `liveClass.data.test.ts`
     pins the figures so a fix is a decision rather than a drive-by.
   ========================================================================== */

export const summary = {
  upcomingThisMonth: 5,
  totalRegistrations: 326,
  registrationsChangePct: 12,
  averageAttendancePct: 82,
  lastMonthAttendancePct: 76,
  averageRating: 4.8,
  feedback: "Informative, easy to understand and very helpful!",
};

export type RegistrationStatus = "Open" | "Not Yet Open";

export const registrationTone: Record<RegistrationStatus, BadgeTone> = {
  Open: "success",
  "Not Yet Open": "neutral",
};

export type UpcomingClass = {
  /** ISO date, so the calendar can find it. */
  date: string;
  time: string;
  topic: string;
  educator: string;
  program: string;
  registered: number;
  capacity: number;
  status: RegistrationStatus;
};

export const upcomingClasses: UpcomingClass[] = [
  {
    date: "2026-09-12",
    time: "6:00 PM",
    topic: "Renal Diet Basics",
    educator: "Renal Dietitian",
    program: "Journey to Dialysis",
    registered: 45,
    capacity: 50,
    status: "Open",
  },
  {
    date: "2026-09-19",
    time: "6:00 PM",
    topic: "Medications in Dialysis",
    educator: "The Dialysis NP",
    program: "Crash Dialysis",
    registered: 38,
    capacity: 50,
    status: "Open",
  },
  {
    date: "2026-09-26",
    time: "6:00 PM",
    topic: "Q&A Session",
    educator: "Panel Discussion",
    program: "All Programs",
    registered: 62,
    capacity: 100,
    status: "Open",
  },
  {
    date: "2026-10-03",
    time: "6:00 PM",
    topic: "Access Care & Troubleshooting",
    educator: "Access Coordinator",
    program: "Journey to Dialysis",
    registered: 45,
    capacity: 50,
    status: "Open",
  },
  {
    date: "2026-10-10",
    time: "6:00 PM",
    topic: "Life on Dialysis",
    educator: "Dialysis Patient Panel",
    program: "All Programs",
    registered: 0,
    capacity: 50,
    status: "Not Yet Open",
  },
];

/** Parsed as a local date: `new Date("2026-09-12")` is UTC midnight,
    which is the 11th anywhere west of Greenwich. */
export function classDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** "Sep 12, 2026" */
export function formatClassDate(iso: string): string {
  return classDate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function classesOn(year: number, month: number, day: number) {
  return upcomingClasses.filter((item) => {
    const date = classDate(item.date);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    );
  });
}

export type RecentClass = {
  title: string;
  date: string;
  attended: number;
  rating: number;
};

export const recentClasses: RecentClass[] = [
  {
    title: "Understanding Your Kidneys",
    date: "2026-08-29",
    attended: 120,
    rating: 4.8,
  },
  {
    title: "Fluid Management in Dialysis",
    date: "2026-08-22",
    attended: 98,
    rating: 4.7,
  },
  {
    title: "Lab Results Explained",
    date: "2026-08-15",
    attended: 112,
    rating: 4.9,
  },
  {
    title: "Treatment Options & Transplant",
    date: "2026-08-08",
    attended: 105,
    rating: 4.8,
  },
];

/* Sources are identities, so they take the categorical ramp in a fixed
   order, the same way Enroll Patients colours its sources. */
export const registrationSources: {
  label: string;
  pct: number;
  tone: SeriesTone;
}[] = [
  { label: "Patient Portal", pct: 45, tone: "cat-6" },
  { label: "Office Referral", pct: 30, tone: "cat-4" },
  { label: "Hospital Referral", pct: 15, tone: "cat-1" },
  { label: "Social Media", pct: 7, tone: "cat-7" },
  { label: "Other", pct: 3, tone: "neutral" },
];

export const attendanceTrend = [
  { label: "Apr", value: 68 },
  { label: "May", value: 72 },
  { label: "Jun", value: 75 },
  { label: "Jul", value: 80 },
  { label: "Aug", value: 76 },
  { label: "Sep", value: 82 },
];

export const settings = [
  {
    id: "zoom",
    title: "Zoom Integration",
    description: "Manage meeting settings",
  },
  {
    id: "reminders",
    title: "Email & SMS Reminders",
    description: "Automate notifications",
  },
  {
    id: "limits",
    title: "Registration Limits",
    description: "Set capacity per class",
  },
  {
    id: "resources",
    title: "Class Resources",
    description: "Upload handouts & links",
  },
  {
    id: "surveys",
    title: "Post-Class Surveys",
    description: "Collect feedback",
  },
  {
    id: "certificates",
    title: "Certificates",
    description: "Enable certificates of completion",
  },
] as const;
