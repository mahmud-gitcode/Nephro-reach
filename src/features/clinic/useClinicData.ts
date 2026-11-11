"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, isApiError } from "@/lib/api/client";
import { combineReads } from "@/lib/data/asyncState";
import { curriculumRowFor } from "./curriculumProgress.data";
import { upcomingClasses } from "./liveClass.data";
import { recentActivity, rosterMemberFor } from "./members.data";
import {
  programFor,
  sourceSlug,
  splitName,
  toPatientRow,
  type ApiProgramEnrollment,
} from "./enrollment.mapping";
import {
  enrollInProgram,
  enrollOnRoster,
  getSeats,
  listProgramCourses,
  listProgramEnrollments,
  listRoster,
  type RosterQuery,
} from "./roster.repository";
import { officeKey, requireOffice, useOfficeScope } from "./office.scope";
import type { Page } from "@/lib/api/paging";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import { userCan } from "@/features/staff/staff";

/* ==========================================================================
   The office's shared reads (Phase 8; ADR 0007)
   --------------------------------------------------------------------------
   The roster is GET /organizations/:id/patients joined with the office's
   program enrollments on patientId, for the office picked in the portal
   (never a demo roster, never browser storage: `nr:clinic-enrollments` is
   retired). The Dashboard, the Member page, Enroll Patients and
   Curriculum Progress share this cache, so a refresh on one is fresh on
   all of them, and every key carries the organization id.

   Two kinds of read (QA round 1, H1):
   - the tables on Members and Enroll Patients page on the server
     (`useRosterPage`: page, limit, search and the BE-2 `program` filter),
     so every patient on the roster can be listed and found;
   - this hook's bounded window (ROSTER_WINDOW, the API's maximum page) is
     what the summary cards, charts, "needs attention" lists and the
     client-only filters count (the member status of NEW-2 and the referral
     source have no server equivalent). `window` says whether it holds the
     whole roster; when it does not, the pages say so ("the N most recent
     of T") instead of passing a part off as the whole.

   Seats come from the contract (read-only; a role without billing read
   simply sees no seat figure). Courses for the program picker come from
   the published catalog. Neither failing blocks the roster.

   A read the active membership's levels do not allow (D4: programs read
   for the enrollments, billing read for the contract) is not sent: the
   server would refuse it with a 403 on every page load (P16d, a care
   coordinator). The enrollments then fail on the client with the same
   403-shaped error, so the page shows the same no-access state; the seat
   figure is simply unknown. The server still enforces both.
   ========================================================================== */

/** The client-side code for a read this membership's levels do not allow. */
export const NO_PERMISSION_CODE = "client.no_permission";

/** Which of the shared office reads the active membership may make. */
export function useOfficeReadAccess(): { programs: boolean; billing: boolean } {
  const user = useOptionalAuth()?.user ?? null;
  return {
    programs: userCan(user, "programs.view"),
    billing: userCan(user, "billing.view"),
  };
}

export const ROSTER_WINDOW = 150;

/** Did a page read hold the whole list? */
export function isWholeList(page: Page<unknown>): boolean {
  const p = page.pagination;
  if (!p) return true;
  return p.mode === "offset" ? p.total <= page.items.length : !p.hasNext;
}

/** The server's count for a page read (the rows read when it sent none). */
export function totalOf(page: Page<unknown>): number {
  const p = page.pagination;
  return p?.mode === "offset" ? p.total : page.items.length;
}

/** What the shared window holds (see WindowNote). */
export type RosterWindow = {
  loaded: number;
  total: number;
  enrollmentsLoaded: number;
  enrollmentsTotal: number;
  rosterWhole: boolean;
  complete: boolean;
};

export const clinicKeys = {
  roster: (orgId: string | null, q: RosterQuery = {}) =>
    officeKey(orgId, "roster", q),
  enrollments: (orgId: string | null) =>
    officeKey(orgId, "program-enrollments"),
  seats: (orgId: string | null) => officeKey(orgId, "billing", "contract"),
};

/** The office's newest program enrollments (enrolledAt desc), one bounded
 *  page. Shared by the window below and by `useRosterPage`'s join. */
export function enrollmentWindowQuery(
  organizationId: string | null,
  allowed = true,
) {
  return {
    /* A refusal has its own key, so it is never served once the level
       allows the read. */
    queryKey: allowed
      ? clinicKeys.enrollments(organizationId)
      : [...clinicKeys.enrollments(organizationId), "refused"],
    queryFn: (): Promise<Page<ApiProgramEnrollment>> =>
      allowed
        ? listProgramEnrollments(requireOffice(organizationId), {
            limit: ROSTER_WINDOW,
          })
        : Promise.reject(
            new ApiError(
              403,
              "Not available for your role.",
              NO_PERMISSION_CODE,
            ),
          ),
  };
}

export function useClinicData(filters: Pick<RosterQuery, "program"> = {}) {
  const { organizationId } = useOfficeScope();
  const access = useOfficeReadAccess();
  const rosterQuery: RosterQuery = {
    status: "ACTIVE",
    limit: ROSTER_WINDOW,
    ...(filters.program ? { program: filters.program } : {}),
  };

  const roster = useQuery({
    queryKey: clinicKeys.roster(organizationId, rosterQuery),
    queryFn: () => listRoster(requireOffice(organizationId), rosterQuery),
  });
  const enrollments = useQuery(
    enrollmentWindowQuery(organizationId, access.programs),
  );
  const seats = useQuery({
    queryKey: clinicKeys.seats(organizationId),
    queryFn: () => getSeats(requireOffice(organizationId)),
    enabled: organizationId !== null && access.billing,
  });

  const reads = combineReads(roster, enrollments);

  const data = useMemo(() => {
    if (!roster.data || !enrollments.data) return undefined;
    const now = new Date();
    const patients = roster.data.items.map((p) =>
      toPatientRow(p, enrollments.data.items),
    );
    return {
      /** Enrollment records — what Enroll Patients lists. */
      patients,
      /** The same people as member rows — what the Member page lists. */
      roster: patients.map((p) => rosterMemberFor(p, now)),
      /** The same people as curriculum rows — what Curriculum Progress lists. */
      curriculum: patients
        .filter((p) => p.programSlug !== null)
        .map((p) => curriculumRowFor(p, now)),
      /** No source yet (NEW-2): always empty, never the demo feed. */
      activity: recentActivity,
      classes: upcomingClasses,
      /** The server's roster count (may exceed the window). */
      rosterTotal: totalOf(roster.data),
      /** What the window holds. `complete`: every roster patient and every
       *  enrollment was read, so counts over it are the office's counts. */
      window: {
        loaded: patients.length,
        total: totalOf(roster.data),
        enrollmentsLoaded: enrollments.data.items.length,
        enrollmentsTotal: totalOf(enrollments.data),
        rosterWhole: isWholeList(roster.data),
        complete: isWholeList(roster.data) && isWholeList(enrollments.data),
      } satisfies RosterWindow,
      /** null: unknown (not allowed, or not loaded); allowed null: no limit. */
      seats: seats.data ?? null,
    };
  }, [roster.data, enrollments.data, seats.data]);

  return {
    data: reads.isError ? undefined : data,
    isPending: reads.pending,
    isFetching: roster.isFetching || enrollments.isFetching,
    error: reads.error,
    /** When the data on screen was read; 0 until the first read lands. */
    updatedAt: Math.min(roster.dataUpdatedAt, enrollments.dataUpdatedAt),
    refetch: () => {
      reads.onRetry();
      /* refetch() ignores `enabled`: a refused contract is never asked. */
      if (organizationId !== null && access.billing) void seats.refetch();
    },
  };
}

export type ClinicData = NonNullable<ReturnType<typeof useClinicData>["data"]>;

/** Published courses the enroll form offers beyond the built-in programs.
 *  A failed read offers the built-in ones only. */
export function useProgramCourses() {
  const query = useQuery({
    queryKey: ["catalog", "courses", "enrollable"],
    queryFn: listProgramCourses,
  });
  return useMemo(() => query.data ?? [], [query.data]);
}

/* ----------------------------------------------------------- enrollment */

export type EnrollmentDraftInput = {
  name: string;
  mrn: string;
  program: string;
  source: string;
  /** yyyy-mm-dd from a date input, or "" when not yet scheduled. */
  startDate: string;
};

/** Why an enrollment failed, as the form shows it. */
export type EnrollFailure = {
  field: "name" | "mrn" | "program" | "form";
  /** The server's code when it sent one. */
  code: string | null;
  /** ① succeeded and ② failed: the patient is on the roster with no
   *  program; only ② may be retried (never ① again). */
  partial: boolean;
  error: unknown;
};

export class EnrollError extends Error {
  readonly failure: EnrollFailure;
  constructor(failure: EnrollFailure) {
    super(
      failure.error instanceof Error ? failure.error.message : "Enroll failed",
    );
    this.name = "EnrollError";
    this.failure = failure;
  }
}

/** The form field a server refusal belongs on (spec 019 §4 codes). */
export function enrollFieldFor(
  error: unknown,
  partial: boolean,
): EnrollFailure["field"] {
  if (partial) return "form";
  if (isApiError(error, { code: "patients.mrn_taken" })) return "mrn";
  if (isApiError(error, { code: "patients.seats_full" })) return "name";
  return "form";
}

/**
 * Enrolls a patient in two server operations (not atomic):
 * ① POST /organizations/:id/patients puts them on the roster;
 * ② POST /organizations/:id/program-enrollments enrolls them in a program.
 * A failure after ① keeps the patientId, so "retry" runs ② only.
 * Every outcome invalidates the roster, the enrollments and the seats, so
 * the server's answer is what shows.
 */
export function useEnrollPatient() {
  const queryClient = useQueryClient();
  const { organizationId } = useOfficeScope();
  /* The patient ① created when ② failed: retry runs ② for them only. */
  const [pendingPatientId, setPendingPatientId] = useState<string | null>(null);

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: officeKey(organizationId, "roster"),
      }),
      queryClient.invalidateQueries({
        queryKey: clinicKeys.enrollments(organizationId),
      }),
      queryClient.invalidateQueries({
        queryKey: clinicKeys.seats(organizationId),
      }),
    ]);

  const mutation = useMutation({
    mutationFn: async (draft: EnrollmentDraftInput) => {
      const orgId = requireOffice(organizationId);
      const name = splitName(draft.name);
      if (!name)
        throw new EnrollError({
          field: "name",
          code: "client.first_and_last_name",
          partial: false,
          error: new ApiError(400, "Enter first and last name."),
        });
      let program = programFor(draft.program);
      if (!program) {
        const courses = await listProgramCourses().catch(() => []);
        program = programFor(draft.program, courses);
      }
      if (!program)
        throw new EnrollError({
          field: "program",
          code: "client.program_unknown",
          partial: false,
          error: new ApiError(400, "Choose a program."),
        });

      let patientId = pendingPatientId;
      if (!patientId) {
        try {
          const mrn = draft.mrn.trim();
          const created = await enrollOnRoster(orgId, {
            firstName: name.firstName,
            lastName: name.lastName,
            ...(mrn ? { mrn } : {}),
          });
          patientId = created.patientId;
        } catch (error) {
          throw new EnrollError({
            field: enrollFieldFor(error, false),
            code: isApiError(error) ? error.code : null,
            partial: false,
            error,
          });
        }
      }
      try {
        const source = sourceSlug(draft.source);
        const enrolled = await enrollInProgram(orgId, {
          patientId,
          program: program.program,
          ...(program.courseId ? { courseId: program.courseId } : {}),
          ...(source ? { source } : {}),
          ...(draft.startDate ? { startDate: draft.startDate } : {}),
        });
        setPendingPatientId(null);
        return enrolled;
      } catch (error) {
        setPendingPatientId(patientId);
        throw new EnrollError({
          field: "form",
          code: isApiError(error) ? error.code : null,
          partial: true,
          error,
        });
      }
    },
    onSettled: invalidate,
  });

  return {
    ...mutation,
    /** ① succeeded, ② did not: the next mutate retries ② only. */
    partialPatientId: pendingPatientId,
    /** Drop a half-done enrollment (closing the form). */
    forgetPartial: () => setPendingPatientId(null),
  };
}
