/* ==========================================================================
   Hospital: one function per server operation (Phase 14; ADR 0007 §1)
   --------------------------------------------------------------------------
   - Enrollments: /organizations/:org/program-enrollments (programs 1 read,
     2 write). The server lists only this hospital's own patients on its
     roster; there is no client-side filter by hospital.
   - Enrolling is two calls: ① the patient on the roster (OFFICE Phase 8's
     `enrollOnRoster`, reused), ② the enrollment with the diagnosis. If ②
     fails after ①, the caller retries ② only and never re-posts ①.
   - The education report and its audited CSV export:
     /organizations/:org/reports/education[/export] (hospitals only).
   - The programs: the published courses with an access rule after
     discharge (GET /courses, GET /courses/:id for the day outline).
   Every office call names the hospital in the path and in the
   X-Organization-Id header. Nothing here reads or writes browser storage.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type Page, type PageParams } from "@/lib/api/paging";
import { enrollOnRoster } from "@/features/clinic/roster.repository";
import { officePath } from "@/features/clinic/office.scope";
import {
  exportReport,
  getReport,
  type ReportFile,
} from "@/features/clinic/officeReports.repository";
import {
  getPublishedCourse,
  listPublishedCourses,
} from "@/features/education/education.repository";
import type { ApiCourseSummary } from "@/features/education/education.mappers";
import {
  isHospitalCourse,
  type ApiEducationReport,
  type ApiHospitalEnrollment,
  type Diagnosis,
  type EnrollmentStatus,
} from "./hospital.data";

export const ENROLLMENT_PAGE = 25;

export type EnrollmentFilter = {
  status?: EnrollmentStatus;
  courseId?: string;
};

export function listEnrollments(
  organizationId: string,
  filter: EnrollmentFilter,
  params: PageParams,
): Promise<Page<ApiHospitalEnrollment>> {
  return fetchPage<ApiHospitalEnrollment>(
    officePath(organizationId, "/program-enrollments"),
    { limit: ENROLLMENT_PAGE, ...params },
    {
      organizationId,
      query: { status: filter.status, courseId: filter.courseId },
    },
  );
}

/** ① The patient on the hospital's roster. While D11 is open the email and
 *  phone are never sent (ENROLL_BY_EMAIL is false). */
export function addPatient(
  organizationId: string,
  patient: { firstName: string; lastName: string; mrn: string },
) {
  return enrollOnRoster(organizationId, {
    firstName: patient.firstName.trim(),
    lastName: patient.lastName.trim(),
    mrn: patient.mrn.trim(),
  });
}

export type CreateEnrollmentBody = {
  patientId: string;
  /** The course slug. */
  program: string;
  courseId: string;
  diagnosis: Diagnosis;
};

/** ② The enrollment (admitted; the server sets the status and the date). */
export function createEnrollment(
  organizationId: string,
  body: CreateEnrollmentBody,
) {
  return api<ApiHospitalEnrollment>(
    officePath(organizationId, "/program-enrollments"),
    {
      method: "POST",
      organizationId,
      body: { ...body, source: "hospital-discharge" },
    },
  );
}

export type EnrollmentPatch = {
  status?: EnrollmentStatus;
  diagnosis?: Diagnosis;
  /** ISO instant; only with status discharged. */
  dischargedAt?: string;
};

export function updateEnrollment(
  organizationId: string,
  enrollmentId: string,
  patch: EnrollmentPatch,
) {
  return api<ApiHospitalEnrollment>(
    officePath(
      organizationId,
      `/program-enrollments/${encodeURIComponent(enrollmentId)}`,
    ),
    { method: "PATCH", organizationId, body: patch },
  );
}

export function getEducationReport(organizationId: string) {
  return getReport<ApiEducationReport>(organizationId, "education");
}

/** The server's audited CSV of the education report. */
export function exportEducationReport(
  organizationId: string,
): Promise<ReportFile> {
  return exportReport(organizationId, "education");
}

/** The published hospital programs (an access rule after discharge). */
export async function listHospitalCourses(): Promise<ApiCourseSummary[]> {
  const page = await listPublishedCourses({ limit: 150 });
  return page.items.filter(isHospitalCourse);
}

export const getCourseOutline = getPublishedCourse;

/** The hospital's time zone (the discharge day is on its calendar). The
 *  office directory names it for every active office. */
export async function getHospitalTimeZone(
  organizationId: string,
  name: string,
): Promise<string | null> {
  const page = await fetchPage<{ id: string; timeZone: string }>(
    "/directory/organizations",
    { limit: 50 },
    { query: { type: "HOSPITAL", search: name.trim() || undefined } },
  );
  return page.items.find((o) => o.id === organizationId)?.timeZone ?? null;
}
