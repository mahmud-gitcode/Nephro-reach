/* ==========================================================================
   Synthetic office roster rows (test-only)
   --------------------------------------------------------------------------
   The roster comes from the API (Phase 8). The page and rules tests need
   rows to render, so they build them here from the API's own shapes,
   through the same mapping the app uses. Invented people with invented ids
   and MRNs; nothing here is imported by the app.
   ========================================================================== */

import {
  CRASH_SLUG,
  JOURNEY_SLUG,
  toPatientRow,
  type ApiProgramEnrollment,
  type ApiRosterPatient,
} from "./enrollment.mapping";
import type { Patient } from "./enrollment.data";
import type { MeContext } from "@/features/auth/auth.types";

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

type Spec = {
  first: string;
  last: string;
  mrn: string | null;
  program?: string | null;
  status?: string;
  source?: string;
  startDate?: string | null;
  percent?: number;
  progressStatus?: string;
  lastActivityAt?: string | null;
  enrolledAt?: string;
};

export const SPECS: Spec[] = [
  {
    first: "Avery",
    last: "Testpatient",
    mrn: "900001",
    program: JOURNEY_SLUG,
    status: "enrolled",
    percent: 40,
    progressStatus: "in-progress",
    lastActivityAt: "2026-11-02T15:00:00Z",
  },
  {
    first: "Blake",
    last: "Sample",
    mrn: "900002",
    program: CRASH_SLUG,
    status: "enrolled",
    source: "hospital-discharge",
    percent: 60,
    progressStatus: "in-progress",
    lastActivityAt: "2026-10-25T15:00:00Z",
  },
  {
    first: "Casey",
    last: "Synthetic",
    mrn: "900003",
    program: JOURNEY_SLUG,
    status: "pending-start",
    source: "provider-referral",
    startDate: "2026-11-20",
    percent: 0,
    progressStatus: "not-started",
    lastActivityAt: null,
  },
  { first: "Devon", last: "Example", mrn: null, program: null },
  {
    first: "Emery",
    last: "Fixture",
    mrn: "900005",
    program: JOURNEY_SLUG,
    status: "withdrawn",
    source: "self-pay",
    percent: 100,
    progressStatus: "completed",
    lastActivityAt: "2026-10-01T15:00:00Z",
  },
];

export function apiRoster(specs: Spec[] = SPECS): {
  patients: ApiRosterPatient[];
  enrollments: ApiProgramEnrollment[];
} {
  const patients = specs.map((s, i) => ({
    patientId: uuid(i + 1),
    firstName: s.first,
    lastName: s.last,
    dateOfBirth: null,
    mrn: s.mrn,
    status: "ACTIVE",
    startedOn: "2026-09-01",
    endedOn: null,
    hasAccount: i % 2 === 0,
    sharedAreas: [],
  }));
  const enrollments = specs.flatMap((s, i) =>
    s.program
      ? [
          {
            id: uuid(100 + i),
            patientId: uuid(i + 1),
            firstName: s.first,
            lastName: s.last,
            mrn: s.mrn,
            program: s.program,
            courseId: null,
            courseTitleEn: null,
            courseTitleEs: null,
            source: s.source ?? "office-referral",
            status: s.status ?? "enrolled",
            startDate: s.startDate ?? null,
            enrolledAt:
              s.enrolledAt ??
              `2026-09-${String(10 + i).padStart(2, "0")}T12:00:00Z`,
            updatedAt: "2026-10-01T12:00:00Z",
            progress:
              s.percent === undefined
                ? null
                : {
                    classesCompleted: Math.round((s.percent / 100) * 21),
                    classesTotal: 21,
                    percent: s.percent,
                    status: s.progressStatus ?? "in-progress",
                    lastActivityAt: s.lastActivityAt ?? null,
                    certificateIssuedAt: null,
                  },
          },
        ]
      : [],
  );
  return { patients, enrollments };
}

/** The rows as the pages read them (Enroll Patients' records). */
export function rosterRows(specs: Spec[] = SPECS): Patient[] {
  const { patients, enrollments } = apiRoster(specs);
  return patients.map((p) => toPatientRow(p, enrollments));
}

export const testPatientId = uuid;

/** A synthetic office owner's `/me/context` (one dialysis membership). */
export function officeContext(
  permissions: Record<string, number> = {
    patients: 3,
    programs: 3,
    billing: 1,
    travel: 3,
  },
  organizationId = "0f0f0f0f-0000-4000-8000-00000000000a",
): MeContext {
  return {
    user: {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      name: "Office Test",
      email: "office.test@example.test",
      phone: null,
      avatarUrl: null,
      language: "EN",
      timeZone: "America/New_York",
      isAccountVerified: true,
      mfaEnabled: true,
      mfaSetupRequired: false,
    },
    patient: null,
    caregiving: [],
    memberships: [
      {
        organizationId,
        organizationName: "Test Dialysis Office",
        organizationType: "DIALYSIS_CENTER",
        organizationStatus: "ACTIVE",
        role: "Owner",
        title: null,
        isOwner: true,
        permissions,
      },
    ],
    platform: null,
  };
}
