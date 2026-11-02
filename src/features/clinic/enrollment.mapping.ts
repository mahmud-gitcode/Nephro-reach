/* ==========================================================================
   Roster and enrollment: API <-> screen (Phase 8; ADR 0007)
   --------------------------------------------------------------------------
   The office roster is `GET /organizations/:id/patients` (one row per care
   relationship) joined with `GET /organizations/:id/program-enrollments`
   (0..n programs per patient) on `patientId`. Patients are identified by
   `patientId` only: an MRN is display text (it may be blank), never a key,
   a lookup or part of a URL, and a name never identifies anyone.

   The server decides every enrollment status; nothing here computes one.
   What the Member page adds per member is derived only where the client
   specified a rule (FOLLOW_UP_AFTER_DAYS) or the server sends the fact
   (progress, last activity). Everything else shows "—" (NEW-2).
   ========================================================================== */

import type {
  EnrollmentSource,
  EnrollmentStatus,
  Patient,
} from "./enrollment.data";

/* ---------------------------------------------------------------- the API */

export type ApiRosterPatient = {
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  mrn: string | null;
  status: "ACTIVE" | "ENDED" | string;
  startedOn: string;
  endedOn: string | null;
  hasAccount: boolean;
  sharedAreas: string[];
};

export type ApiEnrollmentProgress = {
  classesCompleted: number;
  classesTotal: number;
  percent: number;
  status: "not-started" | "in-progress" | "completed" | string;
  lastActivityAt: string | null;
  certificateIssuedAt: string | null;
};

export type ApiProgramEnrollment = {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  mrn: string | null;
  program: string;
  courseId: string | null;
  courseTitleEn: string | null;
  courseTitleEs: string | null;
  source: string;
  status: string;
  startDate: string | null;
  enrolledAt: string;
  updatedAt: string;
  progress: ApiEnrollmentProgress | null;
};

export type ApiEnrolledPatient = {
  patientId: string;
  mrn: string | null;
  status: string;
  startedOn: string;
};

export type ApiContractSeats = {
  used: number;
  /** null: no seat limit. */
  allowed: number | null;
  available: number | null;
};

/* ------------------------------------------------------------- programs */

export const JOURNEY_SLUG = "journey-21-day";
export const CRASH_SLUG = "crash-5-day";
export const CRASH_3_SLUG = "crash-3-day";

const PROGRAM_LABELS: Record<string, string> = {
  [JOURNEY_SLUG]: "Journey to Dialysis (21-Day)",
  [CRASH_SLUG]: "Crash Dialysis (5-Day)",
  [CRASH_3_SLUG]: "Crash Dialysis (3-Day)",
};

/** A published course an office may enroll into (GET /courses). */
export type ProgramCourse = { id: string; slug: string; titleEn: string };

/** The label the screens show for a program slug. A course-backed program
 *  shows the course's title; an unknown slug shows itself. */
export function programLabel(
  slug: string,
  courseTitle?: string | null,
): string {
  return PROGRAM_LABELS[slug] ?? (courseTitle?.trim() || slug);
}

/** The slug (and course) to send for a label picked in the form. */
export function programFor(
  label: string,
  courses: readonly ProgramCourse[] = [],
): { program: string; courseId?: string } | null {
  const builtIn = Object.entries(PROGRAM_LABELS).find(([, l]) => l === label);
  if (builtIn) return { program: builtIn[0] };
  const course = courses.find((c) => c.titleEn.trim() === label.trim());
  return course ? { program: course.slug, courseId: course.id } : null;
}

/* ------------------------------------------------------- statuses, sources */

const STATUS_LABELS: Record<string, EnrollmentStatus> = {
  enrolled: "Enrolled",
  "pending-start": "Pending Start",
  "not-started": "Not Started",
  withdrawn: "Withdrawn",
  completed: "Completed",
  admitted: "Admitted",
  discharged: "Discharged",
};

export function enrollmentStatusLabel(status: string): EnrollmentStatus {
  return STATUS_LABELS[status] ?? "Not Started";
}

export function enrollmentStatusSlug(label: string): string | undefined {
  return Object.entries(STATUS_LABELS).find(([, l]) => l === label)?.[0];
}

const SOURCE_LABELS: Record<string, EnrollmentSource> = {
  "office-referral": "Office Referral",
  "provider-referral": "Provider Referral",
  "hospital-discharge": "Hospital Discharge",
  "self-pay": "Self-Pay",
};

export function sourceLabel(source: string): EnrollmentSource | "" {
  return SOURCE_LABELS[source] ?? "";
}

export function sourceSlug(label: string): string | undefined {
  return Object.entries(SOURCE_LABELS).find(([, l]) => l === label)?.[0];
}

/* ----------------------------------------------------------------- names */

/** "Ana María López" -> first "Ana María", last "López" (split on the last
 *  space). A single word is refused: the API needs both. */
export function splitName(
  full: string,
): { firstName: string; lastName: string } | null {
  const name = full.trim().replace(/\s+/g, " ");
  const at = name.lastIndexOf(" ");
  if (at <= 0) return null;
  return { firstName: name.slice(0, at), lastName: name.slice(at + 1) };
}

export const fullName = (p: { firstName: string; lastName: string }) =>
  `${p.firstName} ${p.lastName}`.trim();

/* ----------------------------------------------------------------- dates */

/** "2026-09-21" (or an ISO timestamp) -> "09/21/2026"; "—" for none. */
export function usDay(day: string | null | undefined): string {
  if (!day) return "—";
  const [y, m, d] = day.slice(0, 10).split("-");
  return y && m && d ? `${m}/${d}/${y}` : "—";
}

/** Whole days between an ISO time and now, by the viewer's calendar. */
export function daysSince(iso: string, now = new Date()): number {
  const then = new Date(iso);
  const a = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}

/** "Today", "1 day ago", "6 days ago", "2 weeks ago", "No activity yet". */
export function relativeActivity(
  iso: string | null | undefined,
  now = new Date(),
): string {
  if (!iso) return "No activity yet";
  const days = daysSince(iso, now);
  if (days === 0) return "Today";
  if (days < 14) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} weeks ago`;
}

/** "Sep 19 at 6:10 PM" for the details panel. */
export function preciseActivity(iso: string | null | undefined): string {
  if (!iso) return "No activity yet";
  const date = new Date(iso);
  const day = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} at ${time}`;
}

/* -------------------------------------------------------------- the join */

/** The enrollment a roster row shows: the newest that is not withdrawn,
 *  else the newest. */
export function primaryEnrollment(
  enrollments: readonly ApiProgramEnrollment[],
): ApiProgramEnrollment | null {
  const newest = [...enrollments].sort((a, b) =>
    b.enrolledAt.localeCompare(a.enrolledAt),
  );
  return newest.find((e) => e.status !== "withdrawn") ?? newest[0] ?? null;
}

/** One Enroll Patients row: the roster patient and the program they are in.
 *  A patient with no program shows "—" for it and the "No program" state. */
export function toPatientRow(
  patient: ApiRosterPatient,
  enrollments: readonly ApiProgramEnrollment[],
): Patient {
  const own = enrollments.filter((e) => e.patientId === patient.patientId);
  const primary = primaryEnrollment(own);
  return {
    id: patient.patientId,
    enrollmentId: primary?.id ?? null,
    name: fullName(patient),
    mrn: patient.mrn ?? "",
    program: primary
      ? programLabel(primary.program, primary.courseTitleEn)
      : "—",
    programSlug: primary?.program ?? null,
    enrolledOn: usDay(primary?.enrolledAt ?? patient.startedOn),
    status: primary ? enrollmentStatusLabel(primary.status) : "No Program",
    startDate: usDay(primary?.startDate),
    progress: primary?.progress?.percent ?? 0,
    source: primary ? sourceLabel(primary.source) : "",
    hasAccount: patient.hasAccount,
    relationshipStatus: patient.status,
    progressStatus: primary?.progress?.status ?? null,
    classesCompleted: primary?.progress?.classesCompleted ?? null,
    classesTotal: primary?.progress?.classesTotal ?? null,
    lastActivityAt: primary?.progress?.lastActivityAt ?? null,
  };
}
