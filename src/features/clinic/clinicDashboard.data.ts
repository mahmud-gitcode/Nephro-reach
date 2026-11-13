import type { BadgeTone } from "@/components/ui";
import { classDate, type UpcomingClass } from "./liveClass.data";

/* ==========================================================================
   Clinic dashboard — demo data
   --------------------------------------------------------------------------
   The dashboard summarises pages that own their data, so most of what it
   shows is read from them rather than kept here: members and their recent
   activity from the Member page (members.data.ts), classes from Live Class,
   the seat count from the contract. `useClinicData` gathers them.

   What stays here is what only the dashboard shows: the status cards
   (counted from the live roster) and the three charts, which are still
   the client's demo figures with no patient in them (their reports move
   to the API with Phase 14).
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

/** The five status cards, in this order. */
export const STATUS_CARD_ORDER: readonly MemberStatus[] = [
  "On Track",
  "Need Follow-Up",
  "Attention Needed",
  "Not Started",
  "Completed",
];

/** Statuses with no source yet (NEW-2): their card shows "—", not 0. */
/* Spanish labels for the member statuses. The English names stay the
   values (filters, links); only what is drawn is translated. */
const MEMBER_STATUS_ES: Record<string, string> = {
  "On Track": "Al día",
  "Need Follow-Up": "Requiere seguimiento",
  "Attention Needed": "Requiere atención",
  "Not Started": "Sin comenzar",
  Completed: "Completado",
  "All Statuses": "Todos los estados",
};

/** The label to draw for a member status (or the "All Statuses" choice). */
export function memberStatusLabel(status: string, isEs = false): string {
  return isEs ? (MEMBER_STATUS_ES[status] ?? status) : status;
}

export const UNSOURCED_STATUSES: readonly MemberStatus[] = ["Attention Needed"];

export type StatusCardData = {
  status: MemberStatus;
  /** null: no source for this status yet. */
  count: number | null;
  share?: string;
};

/**
 * The five status cards, counted from the live roster rather than typed
 * (the client's demo figures, which did not reconcile with any roster,
 * are gone). Each share is out of the whole roster.
 */
export function statusCardsFor(
  list: readonly { status: MemberStatus | null }[],
): StatusCardData[] {
  return STATUS_CARD_ORDER.map((status) => {
    if (UNSOURCED_STATUSES.includes(status)) return { status, count: null };
    const count = list.filter((member) => member.status === status).length;
    return {
      status,
      count,
      share:
        status === "Not Started" || list.length === 0
          ? undefined
          : `${Math.round((count / list.length) * 100)}%`,
    };
  });
}

export const performance = [
  { label: "Average Curriculum Completion", value: 78 },
  { label: "Weekly Engagement", value: 84 },
  { label: "Live Class Attendance", value: 76 },
];

/* Spanish labels for `performance` and the sample chart rows below. */
const CHART_LABELS_ES: Record<string, string> = {
  "Average Curriculum Completion": "Finalización promedio del currículo",
  "Weekly Engagement": "Participación semanal",
  "Live Class Attendance": "Asistencia a clases en vivo",
  "Not Started": "Sin comenzar",
  "Day 1–5": "Día 1–5",
  "Day 6–10": "Día 6–10",
  "Day 11–15": "Día 11–15",
  "Day 16–21": "Día 16–21",
  Completed: "Completado",
  "BP Log": "Registro de presión arterial",
  "Weight / Fluid / EDW": "Peso / Líquidos / Peso seco (EDW)",
  "Medication Tracker": "Control de medicamentos",
  "Lab Results": "Resultados de laboratorio",
  "Appointment Reminders": "Recordatorios de citas",
  "Symptom Log": "Registro de síntomas",
};

/** A chart row's label, in Spanish when asked. */
export function chartLabel(label: string, isEs = false): string {
  return isEs ? (CHART_LABELS_ES[label] ?? label) : label;
}

/* ------------------------------------------------------------------ links

   The dashboard summarises; the other clinic pages hold the detail. Every
   link out is built here, once, so a changed route is one edit. */

const MEMBERS = "/dashboard/clinic/members";
const CURRICULUM = "/dashboard/clinic/curriculum-progress";

/** The Member page, filtered to a status or opened on one member. A member
 *  is named by their patientId, never an MRN (INT-13). */
export function memberLink(filters: { status?: string; patientId?: string }) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.patientId) params.set("patient", filters.patientId);
  const query = params.toString();
  return `${MEMBERS}${query ? `?${query}` : ""}`;
}

/** Messages for one patient, by patientId. Until messaging moves to the
 *  API (Phase 11) the inbox opens without a preselected thread. */
export function messageLink(patientId: string) {
  return `/dashboard/clinic/messages?patient=${encodeURIComponent(patientId)}`;
}

/** Curriculum Progress, filtered, scrolled to its member table. */
export function curriculumLink(filters: {
  status?: string;
  q?: string;
  patientId?: string;
}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.patientId) params.set("patient", filters.patientId);
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
