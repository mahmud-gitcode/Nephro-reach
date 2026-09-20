import type { BadgeTone } from "@/components/ui";

/* ==========================================================================
   Clinic check-ins — demo data
   --------------------------------------------------------------------------
   The client specified the shape of the two tables but not their rows, so
   the rows below are written against the same members the clinic dashboard
   already shows. One roster across both screens — a demo where John D. is
   on track in one place and missing check-ins in another teaches the client
   to distrust the numbers.
   ========================================================================== */

export type CheckInStatus = "Completed" | "Missed" | "At Risk";

export const checkInTone: Record<CheckInStatus, BadgeTone> = {
  Completed: "success",
  Missed: "danger",
  "At Risk": "warning",
};

/**
 * A week-on-week move, and whether that move is good news.
 *
 * `good` is separate from the direction on purpose. Missed check-ins
 * falling is the best number on this page, and colouring it red because the
 * arrow points down would say the opposite. Direction is the arrow's job;
 * colour only ever means good or bad.
 */
export type Delta = { change: string; direction: "up" | "down"; good: boolean };

export const overview: Array<{
  label: string;
  value: string;
  delta?: Delta;
  note?: string;
}> = [
  {
    label: "Check-Ins This Week",
    value: "286",
    delta: { change: "12%", direction: "up", good: true },
  },
  {
    label: "Completion Rate",
    value: "82%",
    delta: { change: "8%", direction: "up", good: true },
  },
  {
    label: "Missed Check-Ins",
    value: "34",
    delta: { change: "20%", direction: "down", good: true },
  },
  {
    label: "At Risk Members",
    value: "12",
    note: "Need follow-up",
  },
  {
    label: "Member Messages",
    value: "56",
    delta: { change: "18%", direction: "up", good: true },
  },
];

export const CURRENT_WEEK = "Sep 6 – Sep 12, 2026";

export const ALL_PROGRAMS = "All Programs";

export const programs = [
  ALL_PROGRAMS,
  "Journey to Dialysis",
  "Crash Dialysis (5-Day)",
];

/** Four categories, each completed by some of the 260 expected check-ins. */
export const categories = [
  { label: "Symptoms Check-In", completed: 214, expected: 260 },
  { label: "Medication Adherence", completed: 198, expected: 260 },
  { label: "Fluid Status", completed: 177, expected: 260 },
  { label: "Weight Tracking", completed: 187, expected: 260 },
];

export type CheckInRow = {
  name: string;
  program: string;
  date: string;
  status: CheckInStatus;
  notes: string;
};

export const recentCheckIns: CheckInRow[] = [
  {
    name: "John D.",
    program: "Journey to Dialysis",
    date: "Sep 12, 2026",
    status: "Completed",
    notes: "No symptoms reported. Weight steady.",
  },
  {
    name: "Mary S.",
    program: "Crash Dialysis (5-Day)",
    date: "Sep 12, 2026",
    status: "At Risk",
    notes: "Reported cramps during last two sessions.",
  },
  {
    name: "David R.",
    program: "Journey to Dialysis",
    date: "Sep 11, 2026",
    status: "Missed",
    notes: "No submission for two consecutive weeks.",
  },
  {
    name: "Patricia M.",
    program: "Crash Dialysis (5-Day)",
    date: "Sep 11, 2026",
    status: "Completed",
    notes: "Medications taken as prescribed.",
  },
  {
    name: "James K.",
    program: "Journey to Dialysis",
    date: "Sep 10, 2026",
    status: "At Risk",
    notes: "Shortness of breath on exertion.",
  },
  {
    name: "Lisa W.",
    program: "Journey to Dialysis",
    date: "Sep 10, 2026",
    status: "Completed",
    notes: "Fluid within target. No concerns.",
  },
  {
    name: "Angela T.",
    program: "Journey to Dialysis",
    date: "Sep 9, 2026",
    status: "Missed",
    notes: "Has not started the check-in series.",
  },
  {
    name: "Robert L.",
    program: "Journey to Dialysis",
    date: "Sep 9, 2026",
    status: "Completed",
    notes: "Completed program. Reports feeling prepared.",
  },
];

export type FollowUpRow = {
  name: string;
  program: string;
  issue: string;
  lastCheckIn: string;
};

export const followUps: FollowUpRow[] = [
  {
    name: "David R.",
    program: "Journey to Dialysis",
    issue: "Missed check-in",
    lastCheckIn: "Aug 29, 2026",
  },
  {
    name: "James K.",
    program: "Journey to Dialysis",
    issue: "SOB / shortness of breath",
    lastCheckIn: "Sep 10, 2026",
  },
  {
    name: "Mary S.",
    program: "Crash Dialysis (5-Day)",
    issue: "Reported cramps",
    lastCheckIn: "Sep 12, 2026",
  },
  {
    name: "Angela T.",
    program: "Journey to Dialysis",
    issue: "Missed check-in",
    lastCheckIn: "Sep 5, 2026",
  },
  {
    name: "Charles B.",
    program: "Journey to Dialysis",
    issue: "Weight increase",
    lastCheckIn: "Sep 11, 2026",
  },
  {
    name: "Denise H.",
    program: "Crash Dialysis (5-Day)",
    issue: "BP elevated",
    lastCheckIn: "Sep 11, 2026",
  },
];

/** Eight weeks of completion rate — the x labels are week-commencing. */
export const completionTrend = {
  labels: [
    "Jul 19",
    "Jul 26",
    "Aug 2",
    "Aug 9",
    "Aug 16",
    "Aug 23",
    "Aug 30",
    "Sep 6",
  ],
  points: [62, 68, 71, 75, 78, 80, 82, 82],
};

export const memberFeedback = {
  quote:
    "The check-ins help me stay on track and notice problems early. I feel more in control of my health.",
  attribution: "NephroReach Member",
};

/**
 * The program filter is shared by both tables, so it lives here rather than
 * being written out twice with a chance of drifting apart.
 */
export function byProgram<T extends { program: string }>(
  rows: T[],
  program: string,
) {
  if (program === ALL_PROGRAMS) return rows;
  return rows.filter((row) => row.program === program);
}

/** Completion as a whole percent, for the category bars. */
export function completionPct(completed: number, expected: number) {
  if (expected <= 0) return 0;
  return Math.round((completed / expected) * 100);
}

/**
 * Clips text to the first `limit` words.
 *
 * The check-in notes are free text a nurse typed, so they run to any
 * length; left whole they set the row height and push the action column off
 * the screen. Three words is enough to tell one note from another, and the
 * rest is one click away — so the table stays scannable without the full
 * note becoming unreachable.
 *
 * `truncated` is returned rather than inferred by comparing lengths,
 * because the caller needs to know whether to offer that click.
 */
export function truncateWords(text: string, limit: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= limit) return { text: text.trim(), truncated: false };
  return { text: `${words.slice(0, limit).join(" ")}…`, truncated: true };
}
