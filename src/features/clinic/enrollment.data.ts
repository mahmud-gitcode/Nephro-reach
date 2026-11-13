import type { BadgeTone } from "@/components/ui";

/* ==========================================================================
   Patient enrollment — labels, filters and the row type
   --------------------------------------------------------------------------
   The roster is the office's patients from the API (Phase 8:
   GET /organizations/:id/patients joined with its program enrollments, see
   enrollment.mapping.ts). The demo roster that used to live here (twenty-
   three typed patients with MRNs) is deleted: an empty office shows an
   empty roster, never sample people.
   ========================================================================== */

/** Contract seats before the API answers, or when the contract read is not
 *  allowed for this role: unknown, so nothing is promised. */
export const CONTRACT_SLOTS = 30;

export type EnrollmentStatus =
  | "Enrolled"
  | "Pending Start"
  | "Not Started"
  | "Withdrawn"
  | "Completed"
  | "Admitted"
  | "Discharged"
  /** On the roster, in no program yet. */
  | "No Program";

export const statusTone: Record<EnrollmentStatus, BadgeTone> = {
  Enrolled: "success",
  "Pending Start": "warning",
  "Not Started": "neutral",
  Withdrawn: "danger",
  Completed: "neutral",
  Admitted: "neutral",
  Discharged: "neutral",
  "No Program": "neutral",
};

export const JOURNEY = "Journey to Dialysis (21-Day)";
export const CRASH = "Crash Dialysis (5-Day)";

export type EnrollmentSource =
  "Office Referral" | "Provider Referral" | "Hospital Discharge" | "Self-Pay";

export type Patient = {
  /** The server's patientId: the only identity a row has. */
  id: string;
  enrollmentId: string | null;
  name: string;
  /** This office's MRN, display text only; "" when there is none. */
  mrn: string;
  program: string;
  programSlug: string | null;
  enrolledOn: string;
  status: EnrollmentStatus;
  /** An em dash when the patient has no start date yet. */
  startDate: string;
  progress: number;
  source: EnrollmentSource | "";
  hasAccount: boolean;
  relationshipStatus: string;
  progressStatus: string | null;
  classesCompleted: number | null;
  classesTotal: number | null;
  lastActivityAt: string | null;
};

export const ALL_PROGRAMS = "All Programs";
export const ALL_STATUSES = "All Statuses";
export const ALL_SOURCES = "All Sources";

export const programOptions = [ALL_PROGRAMS, JOURNEY, CRASH];

/* Spanish labels for the enrollment statuses, referral sources and filter
   choices. The English values stay the identities (filters, URL params,
   CSV); only what is drawn is translated. Program names are product names
   and are not translated. */
const ENROLLMENT_LABELS_ES: Record<string, string> = {
  Enrolled: "Inscrito",
  "Pending Start": "Inicio pendiente",
  "Not Started": "Sin comenzar",
  Withdrawn: "Retirado",
  Completed: "Completado",
  Admitted: "Hospitalizado",
  Discharged: "Dado de alta",
  "No Program": "Sin programa",
  "Office Referral": "Derivación del consultorio",
  "Provider Referral": "Derivación del proveedor",
  "Hospital Discharge": "Alta hospitalaria",
  "Self-Pay": "Pago por cuenta propia",
  [ALL_PROGRAMS]: "Todos los programas",
  [ALL_STATUSES]: "Todos los estados",
  [ALL_SOURCES]: "Todas las fuentes",
};

/** The label to draw for an enrollment status, source or filter choice. */
export function enrollmentLabel(value: string, isEs = false): string {
  return isEs ? (ENROLLMENT_LABELS_ES[value] ?? value) : value;
}

export const statusOptions: string[] = [
  ALL_STATUSES,
  "Enrolled",
  "Pending Start",
  "Not Started",
  "Withdrawn",
];

/**
 * Search, program, status and referral source in one pass.
 *
 * The client asked search to cover "name, MRN, or status", so it does —
 * a clinic hunting an MRN off a fax should not have to know which box it
 * goes in.
 */
export function filterPatients(
  rows: Patient[],
  filters: {
    query?: string;
    program?: string;
    status?: string;
    source?: string;
  },
) {
  const q = (filters.query ?? "").trim().toLowerCase();
  const program = filters.program ?? ALL_PROGRAMS;
  const status = filters.status ?? ALL_STATUSES;
  const source = filters.source ?? ALL_SOURCES;

  return rows.filter((patient) => {
    if (program !== ALL_PROGRAMS && patient.program !== program) return false;
    if (status !== ALL_STATUSES && patient.status !== status) return false;
    if (source !== ALL_SOURCES && patient.source !== source) return false;
    if (!q) return true;
    return [patient.name, patient.mrn, patient.status].some((field) =>
      field.toLowerCase().includes(q),
    );
  });
}

/** One page of rows, plus the numbers the footer needs to describe it. */
export function paginate<T>(rows: T[], page: number, perPage: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / perPage));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const from = (safePage - 1) * perPage;
  const slice = rows.slice(from, from + perPage);
  return {
    rows: slice,
    page: safePage,
    pageCount,
    /* 1-based and inclusive, to read as "Showing 1–10 of 23". Zero rows
       gives 0–0, not 1–0. */
    firstShown: slice.length === 0 ? 0 : from + 1,
    lastShown: from + slice.length,
    total: rows.length,
  };
}

/** Counts one field across the roster, in the order the keys are given. */
export function countBy<K extends string>(
  rows: Patient[],
  field: (patient: Patient) => string,
  keys: readonly K[],
) {
  return keys.map((key) => ({
    label: key,
    value: rows.filter((row) => field(row) === key).length,
  }));
}

export const SOURCE_ORDER = [
  "Office Referral",
  "Provider Referral",
  "Hospital Discharge",
  "Self-Pay",
] as const;

export const PROGRAM_ORDER = [JOURNEY, CRASH] as const;

export const STATUS_ORDER = [
  "Enrolled",
  "Pending Start",
  "Not Started",
  "Withdrawn",
] as const;

export const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];
