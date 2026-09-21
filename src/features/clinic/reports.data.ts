import type { BadgeTone, SeriesTone } from "@/components/ui";

/* ==========================================================================
   Clinic reports — demo data
   --------------------------------------------------------------------------
   The client's figures from their mockup, copied as given, for the signed-in
   clinic only: the mockup's Organization dropdown is a fixed label here, the
   same tenant rule Contract & Billing follows.

   Two things do not reconcile and are left for the client:

   - 248 members, against the 23 enrolled of 30 contracted seats that Enroll
     Patients, Curriculum Progress and Contract & Billing all show for the
     same clinic.
   - The date range is August, but the recent activity is dated September.

   The outcome changes are computed from this month and last, not typed —
   they land on the client's percentages, which `reports.data.test.ts`
   checks. The engagement lines were read off the mockup's chart, which
   gave no numbers, so they are approximate.
   ========================================================================== */

export const filters = {
  dateRange: "Aug 1, 2026 – Aug 31, 2026",
  programs: [
    "All Programs",
    "Journey to Dialysis",
    "Crash Dialysis",
    "CKD Education",
    "Transplant Prep",
  ],
  memberTypes: ["All Members", "Active", "At Risk", "Inactive"],
};

export type Kpi = {
  id: string;
  label: string;
  value: string;
  /** Percent change against last month; the sign is the direction. */
  change: number;
  /** Whether a fall is the good outcome, as with ER visits. */
  lowerIsBetter?: boolean;
};

export const kpis: Kpi[] = [
  { id: "members", label: "Total Members", value: "248", change: 12 },
  {
    id: "completion",
    label: "Program Completion Rate",
    value: "84%",
    change: 8,
  },
  { id: "attendees", label: "Live Class Attendees", value: "326", change: 26 },
  { id: "active", label: "Active This Month", value: "92%", change: 10 },
  {
    id: "er",
    label: "Members with ER Visits",
    value: "3",
    change: -40,
    lowerIsBetter: true,
  },
];

export const engagementMonths = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];

export const engagementSeries: {
  id: string;
  label: string;
  tone: SeriesTone;
  points: number[];
}[] = [
  {
    id: "logins",
    label: "Logins",
    tone: "cat-6",
    points: [150, 200, 212, 220, 228, 262],
  },
  {
    id: "checkins",
    label: "Check-Ins",
    tone: "cat-4",
    points: [110, 150, 160, 165, 175, 200],
  },
  {
    id: "attendance",
    label: "Class Attendance",
    tone: "cat-7",
    points: [45, 62, 68, 70, 74, 85],
  },
  {
    id: "modules",
    label: "Module Completion",
    tone: "cat-2",
    points: [60, 88, 100, 108, 118, 145],
  },
];

export const membersTotal = 248;

/* Programs are identities: the categorical ramp, in a fixed order. */
export const membersByProgram: {
  label: string;
  pct: number;
  tone: SeriesTone;
}[] = [
  { label: "Journey to Dialysis", pct: 38, tone: "cat-6" },
  { label: "Crash Dialysis", pct: 24, tone: "cat-4" },
  { label: "CKD Education", pct: 20, tone: "cat-7" },
  { label: "Transplant Prep", pct: 10, tone: "cat-2" },
  { label: "Other", pct: 8, tone: "neutral" },
];

/* States, not series: the status tones. */
export const memberStatus: {
  label: string;
  pct: number;
  tone: SeriesTone;
}[] = [
  { label: "Active", pct: 92, tone: "success" },
  { label: "At Risk", pct: 5, tone: "warning" },
  { label: "Inactive", pct: 3, tone: "danger" },
];

export const moduleCompletion = [
  { label: "Journey to Dialysis", value: 86 },
  { label: "Crash Dialysis", value: 78 },
  { label: "CKD Education", value: 72 },
  { label: "Transplant Prep", value: 65 },
];

export const checkInCompletion = [
  { label: "Week 1", value: 72 },
  { label: "Week 2", value: 78 },
  { label: "Week 3", value: 84 },
  { label: "Week 4", value: 82 },
];

export const topTopics = [
  { label: "Diet and Fluid Management", views: 198 },
  { label: "Understanding Your Kidneys", views: 176 },
  { label: "Medications in Dialysis", views: 154 },
  { label: "Access Care", views: 132 },
  { label: "Treatment Options", views: 120 },
];

export type Outcome = {
  label: string;
  thisMonth: number;
  lastMonth: number;
  /** A fall is the good direction for hospital and ER visits. */
  lowerIsBetter: boolean;
};

export const outcomes: Outcome[] = [
  {
    label: "Hospitalizations",
    thisMonth: 5,
    lastMonth: 8,
    lowerIsBetter: true,
  },
  { label: "ER Visits", thisMonth: 3, lastMonth: 5, lowerIsBetter: true },
  {
    label: "Completed Program",
    thisMonth: 62,
    lastMonth: 48,
    lowerIsBetter: false,
  },
  {
    label: "Active Members",
    thisMonth: 228,
    lastMonth: 206,
    lowerIsBetter: false,
  },
];

/**
 * Whole-percent change from last month to this; the sign is the direction.
 *
 * Halves round away from zero, as a person would: 8 → 5 is −37.5%, which
 * the client wrote as 38%. `Math.round` alone rounds halves up, giving −37.
 */
export function percentChange(thisMonth: number, lastMonth: number): number {
  if (lastMonth === 0) return 0;
  const pct = ((thisMonth - lastMonth) / lastMonth) * 100;
  return Math.sign(pct) * Math.round(Math.abs(pct));
}

/** Good news is green whichever way the number moved. */
export function isImprovement(change: number, lowerIsBetter = false): boolean {
  return lowerIsBetter ? change < 0 : change > 0;
}

export type ActivityStatus = "Done" | "Missed";

export const activityTone: Record<ActivityStatus, BadgeTone> = {
  Done: "success",
  Missed: "warning",
};

export const recentActivity: {
  date: string;
  member: string;
  activity: string;
  status: ActivityStatus;
}[] = [
  {
    date: "Sep 9, 2026",
    member: "Mary S. Johnson",
    activity: "Completed Day 12",
    status: "Done",
  },
  {
    date: "Sep 9, 2026",
    member: "Robert L. Davis",
    activity: "Attended Live Class",
    status: "Done",
  },
  {
    date: "Sep 8, 2026",
    member: "Angela T. Brown",
    activity: "Submitted Check-In",
    status: "Done",
  },
  {
    date: "Sep 8, 2026",
    member: "James K. Wilson",
    activity: "Viewed Module",
    status: "Done",
  },
  {
    date: "Sep 7, 2026",
    member: "Patricia M. Allen",
    activity: "Missed Check-In",
    status: "Missed",
  },
];

export const customReports = [
  { id: "engagement", label: "Member Engagement Report" },
  { id: "completion", label: "Program Completion Report" },
  { id: "checkins", label: "Check-In Compliance Report" },
  { id: "er", label: "ER & Hospitalization Report" },
  { id: "attendance", label: "Live Class Attendance Report" },
  { id: "export", label: "Member Activity Export (CSV)" },
] as const;
