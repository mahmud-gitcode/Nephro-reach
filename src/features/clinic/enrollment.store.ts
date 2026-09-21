import {
  readJson,
  storageKey,
  StorageError,
  writeJson,
} from "@/lib/data/storage";
import {
  CONTRACT_SLOTS,
  CRASH,
  JOURNEY,
  patients,
  type EnrollmentSource,
  type Patient,
} from "./enrollment.data";

/* ==========================================================================
   Enrolling a patient
   --------------------------------------------------------------------------
   The demo roster is fixed; patients the clinic enrolls in the browser are
   kept beside it under one key and joined on read, so every clinic page —
   this one, the Member page, the dashboard — sees the same list. When the
   backend lands, `readEnrolled` and `enrollPatient` become API calls and
   nothing that renders them changes.
   ========================================================================== */

const KEY = storageKey("clinic-enrollments");

export const ENROLL_PROGRAMS = [JOURNEY, CRASH] as const;

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
 * What has to be true before a patient takes a seat. A full contract is
 * reported on the name field, the first one read, because it is the one
 * error no other field can fix.
 */
export function validateEnrollment(
  draft: EnrollmentDraft,
  roster: Pick<Patient, "mrn">[],
): EnrollmentErrors {
  const errors: EnrollmentErrors = {};
  if (roster.length >= CONTRACT_SLOTS) {
    errors.name = `All ${CONTRACT_SLOTS} contract seats are filled.`;
    return errors;
  }
  if (!draft.name.trim()) errors.name = "Enter the patient's full name.";
  const mrn = draft.mrn.trim();
  if (!/^\d{6}$/.test(mrn)) errors.mrn = "An MRN is 6 digits.";
  else if (roster.some((patient) => patient.mrn === mrn))
    errors.mrn = "A patient with this MRN is already enrolled.";
  if (!(ENROLL_PROGRAMS as readonly string[]).includes(draft.program))
    errors.program = "Choose a program.";
  if (!ENROLL_SOURCES.includes(draft.source as EnrollmentSource))
    errors.source = "Choose how they were referred.";
  return errors;
}

/** "09/21/2026" — the format every enrollment date on the page uses. */
export function formatUsDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`;
}

/**
 * The roster row for a new enrollment. With a start date they are Pending
 * Start; without one, Not Started. Progress is 0 either way — nobody has
 * done a module on the day they are enrolled.
 */
export function toPatient(draft: EnrollmentDraft, today: Date): Patient {
  let startDate = "—";
  if (draft.startDate) {
    const [y, m, d] = draft.startDate.split("-").map(Number);
    startDate = formatUsDate(new Date(y, m - 1, d));
  }
  return {
    name: draft.name.trim().replace(/\s+/g, " "),
    mrn: draft.mrn.trim(),
    program: draft.program,
    enrolledOn: formatUsDate(today),
    status: draft.startDate ? "Pending Start" : "Not Started",
    startDate,
    progress: 0,
    source: draft.source as EnrollmentSource,
  };
}

/** Patients enrolled in this browser, oldest first. */
export async function readEnrolled(): Promise<Patient[]> {
  const stored = await readJson<Patient[] | null>(KEY, null);
  return Array.isArray(stored) ? stored : [];
}

/** The demo roster and everyone enrolled since, as one list. */
export async function readAllPatients(): Promise<Patient[]> {
  return [...patients, ...(await readEnrolled())];
}

/**
 * Checks again against what is stored, not what the form last saw, so two
 * tabs cannot both take the last seat or reuse one MRN.
 */
export async function enrollPatient(
  draft: EnrollmentDraft,
  today = new Date(),
): Promise<Patient> {
  const added = await readEnrolled();
  const errors = validateEnrollment(draft, [...patients, ...added]);
  const first = Object.values(errors)[0];
  if (first) throw new StorageError(first);
  const patient = toPatient(draft, today);
  await writeJson(KEY, [...added, patient]);
  return patient;
}
