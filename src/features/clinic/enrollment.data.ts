import type { BadgeTone } from "@/components/ui";

/* ==========================================================================
   Patient enrollment — demo data
   --------------------------------------------------------------------------
   The client named eight patients and gave totals for twenty-three. Every
   panel on the page — sources, programs, statuses, the seat count, the
   pagination — is a count of those twenty-three, so the eight named rows
   alone would leave the table disagreeing with every chart beside it.

   So the roster below is the full twenty-three: the eight as specified,
   then fifteen written to land exactly on the client's totals (16 / 7 / 0
   by program, 18 / 3 / 2 / 0 by status, 12 / 6 / 3 / 2 by source). Those
   fifteen are filler and say so; replace them, not the eight, when real
   data arrives. `enrollment.data.test.ts` asserts the totals still hold, so
   an edit that breaks the agreement fails rather than ships.
   ========================================================================== */

export const CONTRACT_SLOTS = 30;

export type EnrollmentStatus =
  "Enrolled" | "Pending Start" | "Not Started" | "Withdrawn";

export const statusTone: Record<EnrollmentStatus, BadgeTone> = {
  Enrolled: "success",
  "Pending Start": "warning",
  "Not Started": "neutral",
  Withdrawn: "danger",
};

export const JOURNEY = "Journey to Dialysis (21-Day)";
export const CRASH = "Crash Dialysis (5-Day)";

export type EnrollmentSource =
  "Office Referral" | "Provider Referral" | "Hospital Discharge" | "Self-Pay";

export type Patient = {
  name: string;
  mrn: string;
  program: string;
  enrolledOn: string;
  status: EnrollmentStatus;
  /** An em dash when the patient has no start date yet. */
  startDate: string;
  progress: number;
  source: EnrollmentSource;
};

export const ALL_PROGRAMS = "All Programs";
export const ALL_STATUSES = "All Statuses";

export const programOptions = [ALL_PROGRAMS, JOURNEY, CRASH];

export const statusOptions: string[] = [
  ALL_STATUSES,
  "Enrolled",
  "Pending Start",
  "Not Started",
  "Withdrawn",
];

/** The eight the client named, in the order they gave them. */
const namedPatients: Patient[] = [
  {
    name: "John D. Smith",
    mrn: "123456",
    program: JOURNEY,
    enrolledOn: "08/15/2026",
    status: "Enrolled",
    startDate: "08/16/2026",
    progress: 75,
    source: "Office Referral",
  },
  {
    name: "Mary S. Johnson",
    mrn: "789012",
    program: CRASH,
    enrolledOn: "08/20/2026",
    status: "Enrolled",
    startDate: "08/21/2026",
    progress: 60,
    source: "Hospital Discharge",
  },
  {
    name: "Robert L. Davis",
    mrn: "345678",
    program: JOURNEY,
    enrolledOn: "08/10/2026",
    status: "Pending Start",
    startDate: "08/15/2026",
    progress: 0,
    source: "Provider Referral",
  },
  {
    name: "Angela T. Brown",
    mrn: "901234",
    program: JOURNEY,
    enrolledOn: "08/25/2026",
    status: "Enrolled",
    startDate: "08/26/2026",
    progress: 40,
    source: "Office Referral",
  },
  {
    name: "James K. Wilson",
    mrn: "567890",
    program: CRASH,
    enrolledOn: "08/12/2026",
    status: "Enrolled",
    startDate: "08/13/2026",
    progress: 100,
    source: "Provider Referral",
  },
  {
    name: "Patricia M. Allen",
    mrn: "234567",
    program: JOURNEY,
    enrolledOn: "08/18/2026",
    status: "Enrolled",
    startDate: "08/19/2026",
    progress: 55,
    source: "Office Referral",
  },
  {
    name: "David R. Carter",
    mrn: "890123",
    program: JOURNEY,
    enrolledOn: "08/14/2026",
    status: "Not Started",
    startDate: "—",
    progress: 0,
    source: "Self-Pay",
  },
  {
    name: "Lisa W. Thomas",
    mrn: "456789",
    program: CRASH,
    enrolledOn: "08/22/2026",
    status: "Enrolled",
    startDate: "08/23/2026",
    progress: 30,
    source: "Office Referral",
  },
];

/** Filler. Written to hit the client's totals — see the file header. */
const fillerPatients: Patient[] = [
  {
    name: "Denise H. Parker",
    mrn: "112233",
    program: JOURNEY,
    enrolledOn: "08/11/2026",
    status: "Enrolled",
    startDate: "08/12/2026",
    progress: 82,
    source: "Office Referral",
  },
  {
    name: "Charles B. Reed",
    mrn: "223344",
    program: JOURNEY,
    enrolledOn: "08/13/2026",
    status: "Enrolled",
    startDate: "08/14/2026",
    progress: 68,
    source: "Office Referral",
  },
  {
    name: "Gloria N. Hayes",
    mrn: "334455",
    program: CRASH,
    enrolledOn: "08/16/2026",
    status: "Enrolled",
    startDate: "08/17/2026",
    progress: 45,
    source: "Hospital Discharge",
  },
  {
    name: "Marcus E. Bell",
    mrn: "445566",
    program: JOURNEY,
    enrolledOn: "08/17/2026",
    status: "Enrolled",
    startDate: "08/18/2026",
    progress: 51,
    source: "Provider Referral",
  },
  {
    name: "Yolanda P. Cruz",
    mrn: "556677",
    program: JOURNEY,
    enrolledOn: "08/19/2026",
    status: "Enrolled",
    startDate: "08/20/2026",
    progress: 33,
    source: "Office Referral",
  },
  {
    name: "Henry O. Freeman",
    mrn: "667788",
    program: CRASH,
    enrolledOn: "08/21/2026",
    status: "Enrolled",
    startDate: "08/22/2026",
    progress: 90,
    source: "Hospital Discharge",
  },
  {
    name: "Sandra L. Boyd",
    mrn: "778899",
    program: JOURNEY,
    enrolledOn: "08/23/2026",
    status: "Enrolled",
    startDate: "08/24/2026",
    progress: 27,
    source: "Office Referral",
  },
  {
    name: "Victor A. Nunez",
    mrn: "889900",
    program: JOURNEY,
    enrolledOn: "08/24/2026",
    status: "Enrolled",
    startDate: "08/25/2026",
    progress: 62,
    source: "Provider Referral",
  },
  {
    name: "Ruth M. Coleman",
    mrn: "990011",
    program: CRASH,
    enrolledOn: "08/26/2026",
    status: "Enrolled",
    startDate: "08/27/2026",
    progress: 74,
    source: "Office Referral",
  },
  {
    name: "Alvin T. Barnes",
    mrn: "101112",
    program: JOURNEY,
    enrolledOn: "08/27/2026",
    status: "Enrolled",
    startDate: "08/28/2026",
    progress: 19,
    source: "Office Referral",
  },
  {
    name: "Teresa J. Fields",
    mrn: "121314",
    program: JOURNEY,
    enrolledOn: "08/28/2026",
    status: "Enrolled",
    startDate: "08/29/2026",
    progress: 58,
    source: "Provider Referral",
  },
  {
    name: "Nathan R. Webb",
    mrn: "131415",
    program: JOURNEY,
    enrolledOn: "08/29/2026",
    status: "Enrolled",
    startDate: "08/30/2026",
    progress: 41,
    source: "Office Referral",
  },
  {
    name: "Camille D. Ortiz",
    mrn: "141516",
    program: JOURNEY,
    enrolledOn: "08/30/2026",
    status: "Pending Start",
    startDate: "09/02/2026",
    progress: 0,
    source: "Office Referral",
  },
  {
    name: "Gerald F. Moss",
    mrn: "151617",
    program: CRASH,
    enrolledOn: "08/31/2026",
    status: "Pending Start",
    startDate: "09/03/2026",
    progress: 0,
    source: "Provider Referral",
  },
  {
    name: "Brenda K. Vaughn",
    mrn: "161718",
    program: JOURNEY,
    enrolledOn: "09/01/2026",
    status: "Not Started",
    startDate: "—",
    progress: 0,
    source: "Self-Pay",
  },
];

export const patients: Patient[] = [...namedPatients, ...fillerPatients];

export const enrolledCount = patients.length;

export const slotsRemaining = CONTRACT_SLOTS - enrolledCount;

/** 23 of 30 — the goal card's figure, derived rather than typed. */
export const enrollmentGoalPct = Math.round(
  (enrolledCount / CONTRACT_SLOTS) * 100,
);

/**
 * Search, program and status in one pass.
 *
 * The client asked search to cover "name, MRN, or status", so it does —
 * a clinic hunting an MRN off a fax should not have to know which box it
 * goes in.
 */
export function filterPatients(
  rows: Patient[],
  filters: { query?: string; program?: string; status?: string },
) {
  const q = (filters.query ?? "").trim().toLowerCase();
  const program = filters.program ?? ALL_PROGRAMS;
  const status = filters.status ?? ALL_STATUSES;

  return rows.filter((patient) => {
    if (program !== ALL_PROGRAMS && patient.program !== program) return false;
    if (status !== ALL_STATUSES && patient.status !== status) return false;
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
