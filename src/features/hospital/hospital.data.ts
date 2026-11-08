/* ==========================================================================
   Hospital: kidney education and the move home (Phase 14, ADR 0007)
   --------------------------------------------------------------------------
   The client (2026-10-13): the hospital enrolls the patient, NephroReach
   delivers the education, hospital staff follow participation, and the
   patient keeps learning after discharge.

   Everything here is the API's: enrollments are
   GET /organizations/:org/program-enrollments (this hospital's own, server
   scoped), the figures are GET /organizations/:org/reports/education, and
   the programs are the published courses with an access rule after
   discharge (GET /courses, accessDaysAfterDischarge set). The server sets
   the enrollment status, the discharge instant, accessUntil and hasAccess;
   nothing here computes them. This file only maps API shapes to what the
   screens show, and validates the enroll form.

   Patients are identified by `patientId` only. The MRN is display text: it
   is never a key, a lookup or part of a URL (INT-13).
   ========================================================================== */

import type { ApiProgramEnrollment } from "@/features/clinic/enrollment.mapping";
import type {
  ApiCourse,
  ApiCourseSummary,
} from "@/features/education/education.mappers";

export type LessonKind = string;

export type ProgramDay = {
  day: number;
  titleEn: string;
  titleEs: string;
  items: Array<{ kind: LessonKind; titleEn: string; titleEs: string }>;
};

/** A hospital program: a published course with an access rule after
 *  discharge. `id` is the course id; `slug` is what an enrollment's
 *  `program` holds. */
export type EducationProgram = {
  id: string;
  slug: string;
  nameEn: string;
  nameEs: string;
  summaryEn: string;
  summaryEs: string;
  /** The course's modules, one per day. Empty until the outline loads. */
  days: ProgramDay[];
  /** How long the patient keeps access after discharge (course rule). */
  accessDaysAfterDischarge: number;
};

export type Diagnosis = "new" | "on-dialysis";
export type EnrollmentStatus = "admitted" | "discharged" | "withdrawn";
export type EducationStatus = "not-started" | "in-progress" | "completed";

export const DIAGNOSES: readonly Diagnosis[] = ["new", "on-dialysis"];
export const HOSPITAL_STATUSES: readonly EnrollmentStatus[] = [
  "admitted",
  "discharged",
  "withdrawn",
];

/* ---------------------------------------------------------------- the API */

/** One row of GET /organizations/:org/program-enrollments at a hospital. */
export type ApiHospitalEnrollment = ApiProgramEnrollment & {
  diagnosis: string | null;
  /** ISO instant, or null. */
  dischargedAt: string | null;
  /** YYYY-MM-DD (the hospital's calendar), or null while admitted. */
  accessUntil: string | null;
  hasAccess: boolean;
};

export type ApiEducationReport = {
  enrolled: number;
  started: number;
  completed: number;
  notStarted: number;
  completionPercent: number;
  byDiagnosis: { key: string; count: number }[];
  perMonth: {
    month: string;
    enrolled: number;
    started: number;
    completed: number;
    completionPercent: number;
  }[];
};

/* ------------------------------------------------------------- the screen */

export type EnrollmentProgress = {
  classesCompleted: number;
  classesTotal: number;
  percent: number;
  status: EducationStatus;
  lastActivityAt: string | null;
};

export type HospitalEnrollment = {
  id: string;
  patientId: string;
  patientName: string;
  /** Display only; may be blank. */
  mrn: string;
  diagnosis: Diagnosis | null;
  /** The program slug (the course slug). */
  program: string;
  courseId: string | null;
  programName: string;
  status: EnrollmentStatus;
  /** ISO instant. */
  enrolledAt: string;
  /** ISO instant, or null. */
  dischargedAt: string | null;
  /** YYYY-MM-DD, or null while admitted. */
  accessUntil: string | null;
  hasAccess: boolean;
  progress: EnrollmentProgress;
};

const EDUCATION_STATUSES: readonly EducationStatus[] = [
  "not-started",
  "in-progress",
  "completed",
];

function educationStatusOf(value: string | undefined): EducationStatus {
  return EDUCATION_STATUSES.includes(value as EducationStatus)
    ? (value as EducationStatus)
    : "not-started";
}

/** An unknown status from the server is shown as withdrawn (no access),
 *  never as admitted. */
export function enrollmentStatusOf(value: string): EnrollmentStatus {
  return HOSPITAL_STATUSES.includes(value as EnrollmentStatus)
    ? (value as EnrollmentStatus)
    : "withdrawn";
}

export function diagnosisOf(value: string | null): Diagnosis | null {
  return DIAGNOSES.includes(value as Diagnosis) ? (value as Diagnosis) : null;
}

export function toHospitalEnrollment(
  row: ApiHospitalEnrollment,
): HospitalEnrollment {
  return {
    id: row.id,
    patientId: row.patientId,
    patientName: `${row.firstName} ${row.lastName}`.trim(),
    mrn: row.mrn ?? "",
    diagnosis: diagnosisOf(row.diagnosis),
    program: row.program,
    courseId: row.courseId,
    programName: row.courseTitleEn?.trim() || row.program,
    status: enrollmentStatusOf(row.status),
    enrolledAt: row.enrolledAt,
    dischargedAt: row.dischargedAt,
    accessUntil: row.accessUntil,
    hasAccess: row.hasAccess,
    progress: {
      classesCompleted: row.progress?.classesCompleted ?? 0,
      classesTotal: row.progress?.classesTotal ?? 0,
      percent: row.progress?.percent ?? 0,
      status: educationStatusOf(row.progress?.status),
      lastActivityAt: row.progress?.lastActivityAt ?? null,
    },
  };
}

export function educationStatus(e: HospitalEnrollment): EducationStatus {
  return e.progress.status;
}

export function percentDone(e: HospitalEnrollment): number {
  return e.progress.percent;
}

/* ---------------------------------------------------------- the programs */

/** Hospital programs are the published courses with an access rule after
 *  discharge. */
export function isHospitalCourse(course: ApiCourseSummary): boolean {
  return (
    course.accessDaysAfterDischarge !== null &&
    course.accessDaysAfterDischarge !== undefined
  );
}

export function toProgram(
  course: ApiCourseSummary,
  detail?: ApiCourse | null,
): EducationProgram {
  return {
    id: course.id,
    slug: course.slug,
    nameEn: course.titleEn,
    nameEs: course.titleEs || course.titleEn,
    summaryEn: course.descriptionEn,
    summaryEs: course.descriptionEs || course.descriptionEn,
    accessDaysAfterDischarge: course.accessDaysAfterDischarge ?? 0,
    days: (detail?.modules ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((module, index) => ({
        day: index + 1,
        titleEn: module.titleEn,
        titleEs: module.titleEs || module.titleEn,
        items: module.classes
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((c) => ({
            kind: c.kind,
            titleEn: c.titleEn,
            titleEs: c.titleEs || c.titleEn,
          })),
      })),
  };
}

/* ------------------------------------------------------------ the figures */

export type HospitalSummary = {
  enrolled: number;
  started: number;
  inProgress: number;
  completed: number;
  notStarted: number;
  /** Enrolled and not finished. */
  incomplete: number;
  completionPct: number;
  newlyDiagnosed: number;
  onDialysis: number;
};

/** The server's education report as the screens' figures. `started`
 *  includes the patients who completed (any class progress). */
export function summaryFrom(report: ApiEducationReport): HospitalSummary {
  const count = (key: string) =>
    report.byDiagnosis.find((row) => row.key === key)?.count ?? 0;
  return {
    enrolled: report.enrolled,
    started: report.started,
    inProgress: Math.max(0, report.started - report.completed),
    completed: report.completed,
    notStarted: report.notStarted,
    incomplete: Math.max(0, report.enrolled - report.completed),
    completionPct: report.completionPercent,
    newlyDiagnosed: count("new"),
    onDialysis: count("on-dialysis"),
  };
}

export type MonthRow = {
  /** yyyy-mm */
  month: string;
  enrolled: number;
  started: number;
  completed: number;
  /** 0-100, from the server. */
  completionPct: number;
};

/** Monthly participation, newest month first. */
export function monthsFrom(report: ApiEducationReport): MonthRow[] {
  return report.perMonth
    .map((row) => ({
      month: row.month,
      enrolled: row.enrolled,
      started: row.started,
      completed: row.completed,
      completionPct: row.completionPercent,
    }))
    .sort((a, b) => b.month.localeCompare(a.month));
}

export type ActivityEvent = {
  id: string;
  /** ISO instant; sorts newest first. */
  at: string;
  patientName: string;
  kind: "enrolled" | "active" | "course-completed" | "discharged";
};

/** Enrollment and education activity from one loaded page of enrollments,
 *  newest first (the server has no activity feed). */
export function recentActivity(
  list: readonly HospitalEnrollment[],
  limit = 10,
): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  for (const e of list) {
    events.push({
      id: `${e.id}-enrolled`,
      at: e.enrolledAt,
      patientName: e.patientName,
      kind: "enrolled",
    });
    if (e.progress.lastActivityAt) {
      events.push({
        id: `${e.id}-activity`,
        at: e.progress.lastActivityAt,
        patientName: e.patientName,
        kind: e.progress.status === "completed" ? "course-completed" : "active",
      });
    }
    if (e.dischargedAt) {
      events.push({
        id: `${e.id}-discharged`,
        at: e.dischargedAt,
        patientName: e.patientName,
        kind: "discharged",
      });
    }
  }
  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

/* ------------------------------------------------------------- the forms */

/** Enroll-by-email (D11) is open: the email field is shown but never sent
 *  until the decision is made. */
export const ENROLL_BY_EMAIL = false;

export type EnrollmentDraft = {
  firstName: string;
  lastName: string;
  /** Collected but not sent while ENROLL_BY_EMAIL is false (D11). */
  patientEmail: string;
  mrn: string;
  diagnosis: Diagnosis;
  /** The course id of the chosen program. */
  programId: string;
};

export type EnrollmentError =
  "firstName" | "lastName" | "email" | "mrn" | "program";

export const MRN_MAX = 40;

export function enrollmentError(
  draft: EnrollmentDraft,
): EnrollmentError | null {
  if (!draft.firstName.trim()) return "firstName";
  if (!draft.lastName.trim()) return "lastName";
  const email = draft.patientEmail.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "email";
  const mrn = draft.mrn.trim();
  if (!mrn || mrn.length > MRN_MAX) return "mrn";
  if (!draft.programId) return "program";
  return null;
}

/* ------------------------------------------------------------- the dates */

/** YYYY-MM-DD of an instant on a time zone's calendar. */
export function dayIn(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Minutes the zone is ahead of UTC at that instant. */
function offsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const n = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    n("year"),
    n("month") - 1,
    n("day"),
    n("hour"),
    n("minute"),
    n("second"),
  );
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/** Noon of `day` in `timeZone`, as an instant (DST-safe). */
export function noonIn(day: string, timeZone: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, 12));
  const first = offsetMinutes(guess, timeZone);
  const shifted = new Date(guess.getTime() - first * 60000);
  const second = offsetMinutes(shifted, timeZone);
  return second === first
    ? shifted
    : new Date(guess.getTime() - second * 60000);
}

/**
 * The discharge instant to send for a picked day: "today" (on the
 * hospital's calendar) is now; another day is noon of that day in the
 * hospital's zone. The server refuses a future instant and one before the
 * enrollment, so on the enrollment day the instant is moved just after the
 * enrollment when noon came before it.
 */
export function dischargeInstant(
  day: string,
  timeZone: string,
  now: Date,
  enrolledAt: string,
): string {
  if (day === dayIn(now, timeZone)) return now.toISOString();
  let at = noonIn(day, timeZone);
  const enrolled = new Date(enrolledAt);
  if (at < enrolled && dayIn(enrolled, timeZone) === day)
    at = new Date(Math.min(enrolled.getTime() + 60000, now.getTime()));
  return at.toISOString();
}

/** Today on the viewer's calendar, YYYY-MM-DD. */
export function localToday(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** The viewer's calendar day of an ISO instant (or a YYYY-MM-DD as is). */
export function dayOf(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : localToday(date);
}
