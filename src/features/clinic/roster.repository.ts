/* ==========================================================================
   Office roster and enrollment: one function per server operation
   (Phase 8; ADR 0007 §1)
   --------------------------------------------------------------------------
   Every path carries the office's organization id; patients are addressed
   by `patientId` only (never an MRN or a name). No whole-list writes and no
   browser storage: the retired `nr:clinic-enrollments` key is purged.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type Page } from "@/lib/api/paging";
import { officePath } from "./office.scope";
import type {
  ApiContractSeats,
  ApiEnrolledPatient,
  ApiProgramEnrollment,
  ApiRosterPatient,
  ProgramCourse,
} from "./enrollment.mapping";

export type RosterQuery = {
  search?: string;
  status?: "ACTIVE" | "ENDED";
  /** A program slug (BE-2, spec 046): only patients this office enrolled. */
  program?: string;
  page?: number;
  limit?: number;
};

export type EnrollmentQuery = {
  program?: string;
  status?: string;
  patientId?: string;
  page?: number;
  limit?: number;
};

const text = (value: string | undefined) =>
  value && value.trim() ? value.trim() : undefined;

export function listRoster(
  organizationId: string,
  q: RosterQuery = {},
): Promise<Page<ApiRosterPatient>> {
  return fetchPage<ApiRosterPatient>(
    officePath(organizationId, "/patients"),
    { page: q.page, limit: q.limit },
    {
      query: {
        search: text(q.search),
        status: q.status,
        program: text(q.program),
      },
    },
  );
}

export function getRosterPatient(organizationId: string, patientId: string) {
  return api<
    ApiRosterPatient & {
      notes: string | null;
      programEnrollments: ApiProgramEnrollment[];
    }
  >(officePath(organizationId, `/patients/${encodeURIComponent(patientId)}`));
}

export function listProgramEnrollments(
  organizationId: string,
  q: EnrollmentQuery = {},
): Promise<Page<ApiProgramEnrollment>> {
  return fetchPage<ApiProgramEnrollment>(
    officePath(organizationId, "/program-enrollments"),
    { page: q.page, limit: q.limit },
    {
      query: {
        program: text(q.program),
        status: text(q.status),
        patientId: text(q.patientId),
      },
    },
  );
}

/** ① Puts the patient on the office roster. No email or phone is sent
 *  (D11 enroll-by-email is open). */
export function enrollOnRoster(
  organizationId: string,
  body: {
    firstName: string;
    lastName: string;
    mrn?: string;
    dateOfBirth?: string;
  },
) {
  return api<ApiEnrolledPatient>(officePath(organizationId, "/patients"), {
    method: "POST",
    body,
  });
}

/** ② Enrolls a roster patient in a program. */
export function enrollInProgram(
  organizationId: string,
  body: {
    patientId: string;
    program: string;
    courseId?: string;
    source?: string;
    startDate?: string;
  },
) {
  return api<ApiProgramEnrollment>(
    officePath(organizationId, "/program-enrollments"),
    { method: "POST", body },
  );
}

/** The contract's seats (read-only here; billing is its own page). */
export async function getSeats(
  organizationId: string,
): Promise<ApiContractSeats | null> {
  const data = await api<{ seats?: ApiContractSeats | null } | null>(
    officePath(organizationId, "/billing/contract"),
  );
  return data?.seats ?? null;
}

/** Published courses an office can enroll into beyond the built-in programs. */
export async function listProgramCourses(): Promise<ProgramCourse[]> {
  const page = await fetchPage<ProgramCourse>("/courses", { limit: 150 });
  return page.items.map(({ id, slug, titleEn }) => ({ id, slug, titleEn }));
}
