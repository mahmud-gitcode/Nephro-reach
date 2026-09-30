import type { BadgeTone, SeriesTone } from "@/components/ui";
import type { RosterMember } from "./members.data";

/* ==========================================================================
   Clinic reports
   --------------------------------------------------------------------------
   For the signed-in clinic only: the Organization filter is a fixed label,
   the same tenant rule Contract & Billing follows.

   Member counts, splits, completion, attendance and open questions come
   from the clinic's roster (bottom of this file), so the report agrees
   with Members, Enroll Patients and Curriculum Progress. The engagement
   trend, module and check-in rates, topics, outcomes and activity feed are
   the client's sample figures (labelled as samples on the page) until
   reporting data exists; the outcome changes are computed from this month
   and last, not typed.
   ========================================================================== */

export type Kpi = {
  id: string;
  label: string;
  value: string;
  /** Percent change against last month; the sign is the direction. */
  change: number;
  /** Whether a fall is the good outcome, as with ER visits. */
  lowerIsBetter?: boolean;
};

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

/* --------------------------------------------------------------------------
   From the clinic's own roster (2026-09-30)
   --------------------------------------------------------------------------
   The member counts, program and status splits, completion, attendance and
   open questions are read from the same roster Members, Enroll Patients and
   Curriculum Progress show, and follow the Program and Member Type filters.
   The client's mockup counted 248 members against a 23-patient roster; the
   report now agrees with the rest of the portal. The engagement trend,
   topics, outcomes and activity feed have no source in the app yet and are
   labelled as samples on the page.
   -------------------------------------------------------------------------- */

export const ALL_PROGRAMS_LABEL = "All Programs";
export const ALL_MEMBERS_LABEL = "All Members";

export type ReportFilters = { program: string; status: string };

const PROGRAM_TONES: SeriesTone[] = ["cat-6", "cat-4", "cat-7", "cat-2"];
const STATUS_TONES: Record<string, SeriesTone> = {
  "On Track": "success",
  "Need Follow-Up": "warning",
  "Attention Needed": "danger",
  "Not Started": "neutral",
};

/** Whole-percent shares of `count` that add to 100 (largest remainder). */
function shares(counts: number[]): number[] {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return counts.map(() => 0);
  const raw = counts.map((c) => (c / total) * 100);
  const floors = raw.map(Math.floor);
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, rest: r - Math.floor(r) }))
    .sort((a, b) => b.rest - a.rest);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i] += 1;
    left -= 1;
  }
  return floors;
}

export function reportRows(
  roster: RosterMember[],
  filters: ReportFilters,
): RosterMember[] {
  return roster.filter(
    (m) =>
      (filters.program === ALL_PROGRAMS_LABEL ||
        m.program === filters.program) &&
      (filters.status === ALL_MEMBERS_LABEL || m.status === filters.status),
  );
}

export function rosterReport(rows: RosterMember[]) {
  const programs = [...new Set(rows.map((m) => m.program))].sort();
  const programCounts = programs.map(
    (p) => rows.filter((m) => m.program === p).length,
  );
  const programPct = shares(programCounts);
  const statuses = Object.keys(STATUS_TONES).filter((s) =>
    rows.some((m) => m.status === s),
  );
  const statusCounts = statuses.map(
    (s) => rows.filter((m) => m.status === s).length,
  );
  const statusPct = shares(statusCounts);
  const completed = rows.filter((m) => m.progress >= 100).length;
  const started = rows.filter((m) => m.status !== "Not Started").length;
  const attended = rows.reduce((sum, m) => sum + m.liveClasses[0], 0);
  const openQuestions = rows.reduce((sum, m) => sum + m.questions.open, 0);
  const pct = (n: number) =>
    rows.length === 0 ? "0%" : `${Math.round((n / rows.length) * 100)}%`;

  const reportKpis: Array<Omit<Kpi, "change"> & { note: string }> = [
    {
      id: "members",
      label: "Total Members",
      value: String(rows.length),
      note: "On the clinic's roster",
    },
    {
      id: "completion",
      label: "Program Completion Rate",
      value: pct(completed),
      note: `${completed} finished their program`,
    },
    {
      id: "attendees",
      label: "Live Class Attendances",
      value: String(attended),
      note: "Classes attended, all members",
    },
    {
      id: "active",
      label: "Active Members",
      value: pct(started),
      note: `${started} have started`,
    },
    {
      id: "questions",
      label: "Open Questions",
      value: String(openQuestions),
      note: "Waiting on the care team",
    },
  ];

  return {
    total: rows.length,
    kpis: reportKpis,
    byProgram: programs.map((label, i) => ({
      label,
      pct: programPct[i],
      tone: PROGRAM_TONES[i % PROGRAM_TONES.length],
    })),
    byStatus: statuses.map((label, i) => ({
      label,
      pct: statusPct[i],
      tone: STATUS_TONES[label],
    })),
  };
}

/** One CSV row per member, with every column the reports draw on. */
export function memberActivityCsv(
  rows: RosterMember[],
): Array<Array<string | number>> {
  return [
    [
      "Name",
      "MRN",
      "Program",
      "Enrolled",
      "Status",
      "Progress %",
      "Current module",
      "Last activity",
      "Live classes attended",
      "Live classes offered",
      "Check-ins done",
      "Check-ins expected",
      "Questions",
      "Open questions",
    ],
    ...rows.map((m) => [
      m.name,
      m.mrn,
      m.program,
      m.enrolledOn,
      m.status,
      m.progress,
      m.currentModule,
      m.lastActivity,
      m.liveClasses[0],
      m.liveClasses[1],
      m.checkIns[0],
      m.checkIns[1],
      m.questions.total,
      m.questions.open,
    ]),
  ];
}
