import type { BadgeTone } from "@/components/ui";

/* ==========================================================================
   Clinic dashboard — demo data
   --------------------------------------------------------------------------
   Every figure the clinic dashboard shows, in one file, so the screen stays
   a layout and nothing has to be hunted for when the numbers become real.

   These are the client's demo figures, copied as given. Two sets of them do
   not reconcile, and that is deliberate — see the note above `statusCards`.
   ========================================================================== */

export type MemberStatus =
  | "On Track"
  | "Need Follow-Up"
  | "Attention Needed"
  | "Not Started"
  | "Completed";

/**
 * Status drives colour everywhere it appears — the summary cards, the table
 * badges — so the mapping lives here once. These are the reserved status
 * tones, never the categorical ramp: a member needing attention is a state,
 * not a series.
 */
export const statusTone: Record<MemberStatus, BadgeTone> = {
  "On Track": "success",
  "Need Follow-Up": "warning",
  "Attention Needed": "danger",
  "Not Started": "neutral",
  Completed: "info",
};

export const enrollment = {
  enrolled: 23,
  contracted: 30,
  get remaining() {
    return this.contracted - this.enrolled;
  },
};

/**
 * The five status cards.
 *
 * A caution for whoever wires this to real data: as supplied, these counts
 * total 30 against 23 enrolled members, and the percentages total 122%. The
 * percentages are each out of 23, so they read as five overlapping views of
 * the roster rather than five slices of it. Left exactly as specified —
 * confirm with the client which reading is meant before the figures are
 * computed rather than typed.
 */
export const statusCards: Array<{
  status: MemberStatus;
  count: number;
  share?: string;
}> = [
  { status: "On Track", count: 18, share: "78%" },
  { status: "Need Follow-Up", count: 3, share: "13%" },
  { status: "Attention Needed", count: 2, share: "9%" },
  { status: "Not Started", count: 2 },
  { status: "Completed", count: 5, share: "22%" },
];

export const performance = [
  { label: "Average Curriculum Completion", value: 78 },
  { label: "Weekly Engagement", value: 84 },
  { label: "Live Class Attendance", value: 76 },
];

export const upcomingClasses = [
  { date: "Sep 12", title: "Renal Diet Basics", time: "6:00 PM EST" },
  { date: "Sep 19", title: "Medications in Dialysis", time: "6:00 PM EST" },
  { date: "Sep 26", title: "Q&A with The Dialysis NP", time: "6:00 PM EST" },
];

export type ClinicMember = {
  name: string;
  program: string;
  enrolledOn: string;
  progress: number;
  status: MemberStatus;
  lastActivity: string;
};

/** Eight of the 23 enrolled members — what the clinic sees before paging. */
export const members: ClinicMember[] = [
  {
    name: "John D.",
    program: "Journey to Dialysis",
    enrolledOn: "08/15/2026",
    progress: 71,
    status: "On Track",
    lastActivity: "Today",
  },
  {
    name: "Mary S.",
    program: "Crash Dialysis (5-Day)",
    enrolledOn: "08/20/2026",
    progress: 40,
    status: "Need Follow-Up",
    lastActivity: "2 days ago",
  },
  {
    name: "Robert L.",
    program: "Journey to Dialysis",
    enrolledOn: "08/10/2026",
    progress: 100,
    status: "Completed",
    lastActivity: "Today",
  },
  {
    name: "Angela T.",
    program: "Journey to Dialysis",
    enrolledOn: "08/25/2026",
    progress: 18,
    status: "Not Started",
    lastActivity: "7 days ago",
  },
  {
    name: "James K.",
    program: "Journey to Dialysis",
    enrolledOn: "08/12/2026",
    progress: 55,
    status: "Need Follow-Up",
    lastActivity: "3 days ago",
  },
  {
    name: "Patricia M.",
    program: "Crash Dialysis (5-Day)",
    enrolledOn: "08/18/2026",
    progress: 80,
    status: "On Track",
    lastActivity: "Today",
  },
  {
    name: "David R.",
    program: "Journey to Dialysis",
    enrolledOn: "08/14/2026",
    progress: 35,
    status: "Attention Needed",
    lastActivity: "5 days ago",
  },
  {
    name: "Lisa W.",
    program: "Journey to Dialysis",
    enrolledOn: "08/22/2026",
    progress: 62,
    status: "On Track",
    lastActivity: "Today",
  },
];

/**
 * Search covers name, program and status, because all three are on screen
 * and a clinic that types "follow" means the status, not a name.
 */
export function filterMembers(list: ClinicMember[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((member) =>
    [member.name, member.program, member.status].some((field) =>
      field.toLowerCase().includes(q),
    ),
  );
}

/** Ordered bands, so this is a distribution: one hue, not one per bar. */
export const programProgress = [
  { label: "Not Started", value: 2 },
  { label: "Day 1–5", value: 6 },
  { label: "Day 6–10", value: 9 },
  { label: "Day 11–15", value: 8 },
  { label: "Day 16–21", value: 5 },
  { label: "Completed", value: 5 },
];

/** Share of members using each tool. One measure, so one hue. */
export const toolUsage = [
  { label: "BP Log", value: 65 },
  { label: "Weight / Fluid / EDW", value: 58 },
  { label: "Medication Tracker", value: 62 },
  { label: "Lab Results", value: 49 },
  { label: "Appointment Reminders", value: 70 },
  { label: "Symptom Log", value: 55 },
];
