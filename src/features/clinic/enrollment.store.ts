import { CRASH, JOURNEY, type EnrollmentSource } from "./enrollment.data";
import { splitName, type ProgramCourse } from "./enrollment.mapping";

/* ==========================================================================
   The enrollment form: choices and client hints (Phase 8)
   --------------------------------------------------------------------------
   Enrolling is two server operations (useEnrollPatient in useClinicData):
   the roster, then the program. Nothing is kept in this browser any more:
   the `nr:clinic-enrollments` key is retired and purged. The checks below
   are hints shown before a submit; the server decides the rest (a taken
   MRN, a full contract, an existing enrollment) and its answer is shown on
   the matching field.
   ========================================================================== */

export const ENROLL_PROGRAMS = [JOURNEY, CRASH] as const;

/**
 * What a patient can be enrolled in: the two contracted programs, then
 * every published course from the catalog (client, 2026-10-18: "whenever
 * I add a new program, it will have to come right here").
 */
export function enrollablePrograms(
  courses: Pick<ProgramCourse, "titleEn">[],
): string[] {
  const added = courses.map((course) => course.titleEn.trim()).filter(Boolean);
  return [...new Set<string>([...ENROLL_PROGRAMS, ...added])];
}

export const ENROLL_SOURCES: EnrollmentSource[] = [
  "Office Referral",
  "Provider Referral",
  "Hospital Discharge",
  "Self-Pay",
];

export type EnrollmentDraft = {
  name: string;
  mrn: string;
  program: string;
  source: string;
  /** yyyy-mm-dd from a date input, or "" when not yet scheduled. */
  startDate: string;
};

export const emptyDraft = (): EnrollmentDraft => ({
  name: "",
  mrn: "",
  program: JOURNEY,
  source: ENROLL_SOURCES[0],
  startDate: "",
});

export type EnrollmentErrors = Partial<Record<keyof EnrollmentDraft, string>>;

/**
 * The form's own hints before anything is sent: a first and last name, the
 * clinic's six-digit MRN format, a program and a source from the lists.
 * Seats and MRN uniqueness are the server's to decide (409 seats_full,
 * mrn_taken), so they are not checked here.
 */
export function validateEnrollment(
  draft: EnrollmentDraft,
  programs: readonly string[] = ENROLL_PROGRAMS,
): EnrollmentErrors {
  const errors: EnrollmentErrors = {};
  if (!draft.name.trim()) errors.name = "Enter the patient's full name.";
  else if (!splitName(draft.name)) errors.name = "Enter first and last name.";
  const mrn = draft.mrn.trim();
  if (!/^\d{6}$/.test(mrn)) errors.mrn = "An MRN is 6 digits.";
  if (!programs.includes(draft.program)) errors.program = "Choose a program.";
  if (!ENROLL_SOURCES.includes(draft.source as EnrollmentSource))
    errors.source = "Choose how they were referred.";
  return errors;
}

/** "09/21/2026" — the format every enrollment date on the page uses. */
export function formatUsDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`;
}

/** The copy for a server refusal, by its code (spec 019 §4). */
export function enrollErrorText(code: string | null, fallback: string): string {
  switch (code) {
    case "patients.mrn_taken":
      return "A patient with this MRN is already enrolled.";
    case "patients.seats_full":
      return "All contract seats are filled.";
    case "patients.patient_already_enrolled":
    case "education.enrollment_exists":
      return "This patient is already enrolled.";
    case "patients.concurrent_change":
      return "Someone else changed this at the same time. Try again.";
    default:
      return fallback;
  }
}
