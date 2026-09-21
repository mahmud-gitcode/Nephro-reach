import type { BadgeTone } from "@/components/ui";
import { CONTRACT_SLOTS, patients } from "./enrollment.data";
import { classDate, type UpcomingClass } from "./liveClass.data";

/* ==========================================================================
   Clinic dashboard — demo data
   --------------------------------------------------------------------------
   The dashboard summarises pages that own their data, so most of what it
   shows is read from them rather than kept here: members and their recent
   activity from the Member page (members.data.ts), classes from Live Class,
   the seat count from Enroll Patients. `useClinicData` gathers them.

   What stays here is what only the dashboard shows — the status cards and
   the three charts — as the client's demo figures, copied as given. Those
   do not reconcile with the roster; see the note above `statusCards`.
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

/* Counted from the Enroll Patients roster, so the card and that page
   cannot disagree. */
export const enrollment = {
  enrolled: patients.length,
  contracted: CONTRACT_SLOTS,
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

/* ------------------------------------------------------------------ links

   The dashboard summarises; the other clinic pages hold the detail. Every
   link out is built here, once, so a changed route is one edit. */

const MEMBERS = "/dashboard/clinic/members";
const CURRICULUM = "/dashboard/clinic/curriculum-progress";

/** The Member page, filtered to a status or opened on one member. */
export function memberLink(filters: { status?: string; mrn?: string }) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.mrn) params.set("mrn", filters.mrn);
  const query = params.toString();
  return `${MEMBERS}${query ? `?${query}` : ""}`;
}

/** Curriculum Progress, filtered, scrolled to its member table. */
export function curriculumLink(filters: { status?: string; q?: string }) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  const query = params.toString();
  return `${CURRICULUM}${query ? `?${query}` : ""}#member-progress`;
}

/**
 * Where a status card goes. The Member page speaks the dashboard's status
 * names, so four of the five filter there directly. It has no "Completed"
 * — finishing is a curriculum fact — so that one opens Curriculum
 * Progress, which does.
 */
export function statusCardLink(status: MemberStatus) {
  return status === "Completed"
    ? curriculumLink({ status: "Completed" })
    : memberLink({ status });
}

export function liveClassLink(iso: string) {
  return `/dashboard/clinic/live-class?date=${iso}`;
}

/**
 * The next classes on the Live Class schedule, from the start of `today`,
 * soonest first. A class earlier today still shows — it may not have
 * started — and one from yesterday does not.
 */
export function upcomingFrom(
  classes: UpcomingClass[],
  today: Date,
  limit = 3,
): UpcomingClass[] {
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return classes
    .filter((item) => classDate(item.date) >= start)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
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
