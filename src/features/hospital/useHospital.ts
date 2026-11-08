"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { isApiError, type Pagination } from "@/lib/api/client";
import { nextPageParams } from "@/lib/api/paging";
import { orgKey } from "@/lib/data/queryKeys";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import {
  officeKey,
  requireOffice,
  useOfficeScope,
} from "@/features/clinic/office.scope";
import { requireScope, usePatientScope } from "@/features/profile/patientScope";
import {
  completeClass,
  getLearnerCourse,
  getPublishedCourse,
  listMyEnrollments,
} from "@/features/education/education.repository";
import {
  educationKey,
  learnerCourseKey,
} from "@/features/education/useLearnerCourse";
import * as repo from "./hospital.repository";
import {
  dayIn,
  dischargeInstant,
  enrollmentStatusOf,
  monthsFrom,
  summaryFrom,
  toHospitalEnrollment,
  toProgram,
  type Diagnosis,
  type EducationProgram,
  type EnrollmentDraft,
  type EnrollmentStatus,
  type HospitalEnrollment,
} from "./hospital.data";

/* ==========================================================================
   Hospital: the API hooks (Phase 14; ADR 0007)
   --------------------------------------------------------------------------
   The hospital is the office picked in the portal picker (/me/context),
   never a demo organisation. Every read is keyed by that organization id
   (orgKey), so a portal switch never shows another office's patients, and
   a failed read is an error state (a 403 is "no access"), never empty.
   The retired `nr:hospital-enrollments` store is purged and never read or
   written here.
   ========================================================================== */

export const HOSPITAL_ENROLLMENTS = "program-enrollments";
const REPORT = ["reports", "education"] as const;

/** The hospital in use: its id (null outside office mode) and its name. */
export function useHospitalOffice() {
  const { organizationId } = useOfficeScope();
  const user = useOptionalAuth()?.user ?? null;
  return {
    orgId: organizationId,
    hospitalName: organizationId ? (user?.org ?? "") : "",
  };
}

function totalOf(pagination: Pagination | null | undefined): number | null {
  return pagination?.mode === "offset" ? pagination.total : null;
}

/** This hospital's enrollments, newest first, a page at a time. */
export function useHospitalEnrollments(filter: repo.EnrollmentFilter = {}) {
  const { orgId } = useHospitalOffice();
  const query = useInfiniteQuery({
    queryKey: officeKey(orgId, HOSPITAL_ENROLLMENTS, "hospital", {
      status: filter.status ?? null,
      courseId: filter.courseId ?? null,
    }),
    queryFn: ({ pageParam }) =>
      repo.listEnrollments(requireOffice(orgId), filter, pageParam),
    initialPageParam: { page: 1 } as { page?: number; cursor?: string | null },
    getNextPageParam: (last) => nextPageParams(last.pagination),
  });
  const enrollments = useMemo(
    () =>
      (query.data?.pages ?? [])
        .flatMap((page) => page.items)
        .map(toHospitalEnrollment),
    [query.data],
  );
  return {
    enrollments,
    total: totalOf(query.data?.pages[0]?.pagination),
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
  };
}

/** The server's education report (hospitals only). */
export function useEducationReport() {
  const { orgId } = useHospitalOffice();
  const query = useQuery({
    queryKey: officeKey(orgId, ...REPORT),
    queryFn: () => repo.getEducationReport(requireOffice(orgId)),
  });
  return {
    summary: query.data ? summaryFrom(query.data) : null,
    months: query.data ? monthsFrom(query.data) : [],
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

/** The published hospital programs with their day outline. */
export function useHospitalPrograms() {
  const list = useQuery({
    queryKey: ["courses", "hospital-programs"],
    queryFn: repo.listHospitalCourses,
    staleTime: 5 * 60_000,
  });
  const courses = list.data;
  const programs: EducationProgram[] = useQueries({
    queries: (courses ?? []).map((course) => ({
      queryKey: ["courses", "outline", course.id],
      queryFn: () => repo.getCourseOutline(course.id),
      staleTime: 5 * 60_000,
    })),
    combine: (outlines) =>
      (courses ?? []).map((course, i) =>
        toProgram(course, outlines[i]?.data ?? null),
      ),
  });
  return {
    programs,
    isPending: list.isPending,
    error: list.error,
    refetch: () => void list.refetch(),
  };
}

/** The hospital's time zone (directory), for the discharge day. */
export function useHospitalTimeZone() {
  const { orgId, hospitalName } = useHospitalOffice();
  const query = useQuery({
    queryKey: officeKey(orgId, "time-zone"),
    queryFn: () => repo.getHospitalTimeZone(requireOffice(orgId), hospitalName),
    staleTime: 60 * 60_000,
  });
  return query.data ?? null;
}

function useInvalidateHospital(orgId: string | null) {
  const queryClient = useQueryClient();
  return useCallback(() => {
    if (!orgId) return;
    void queryClient.invalidateQueries({
      queryKey: orgKey(orgId, HOSPITAL_ENROLLMENTS),
    });
    void queryClient.invalidateQueries({ queryKey: orgKey(orgId, ...REPORT) });
    /* The office roster (Phase 8) lists the patient added in ①. */
    void queryClient.invalidateQueries({ queryKey: orgKey(orgId, "roster") });
  }, [queryClient, orgId]);
}

/** Why an enrollment did not complete. `partial`: the patient is on the
 *  roster (①) but the enrollment (②) failed; the next try sends ② only. */
export class HospitalEnrollError extends Error {
  constructor(
    readonly partial: boolean,
    readonly cause: unknown,
  ) {
    super(
      partial
        ? "Patient added; the enrollment failed. Try again."
        : "The patient was not enrolled.",
    );
  }
}

/** Enroll: ① the roster, ② the enrollment (two audited server calls). */
export function useEnrollPatient(programs: readonly EducationProgram[]) {
  const { orgId } = useHospitalOffice();
  const invalidate = useInvalidateHospital(orgId);
  const [pendingPatientId, setPendingPatientId] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: async (draft: EnrollmentDraft) => {
      const org = requireOffice(orgId);
      const program = programs.find((p) => p.id === draft.programId);
      if (!program) throw new HospitalEnrollError(false, null);
      let patientId = pendingPatientId;
      if (!patientId) {
        try {
          patientId = (await repo.addPatient(org, draft)).patientId;
        } catch (error) {
          throw new HospitalEnrollError(false, error);
        }
      }
      try {
        const created = await repo.createEnrollment(org, {
          patientId,
          program: program.slug,
          courseId: program.id,
          diagnosis: draft.diagnosis,
        });
        setPendingPatientId(null);
        return created;
      } catch (error) {
        setPendingPatientId(patientId);
        throw new HospitalEnrollError(true, error);
      }
    },
    onSettled: invalidate,
  });
  return {
    ...mutation,
    partialPatientId: pendingPatientId,
    forgetPartial: () => setPendingPatientId(null),
  };
}

export type EnrollmentChange = {
  status: EnrollmentStatus;
  /** YYYY-MM-DD picked for a discharge. */
  dischargeDay?: string;
  /** The course id of the program. */
  programId: string;
  diagnosis: Diagnosis;
};

/** The calls one saved edit makes, in order. Pure, for tests. */
export function planChange(
  e: HospitalEnrollment,
  change: EnrollmentChange,
  programs: readonly EducationProgram[],
  timeZone: string,
  now: Date,
):
  | { kind: "none" }
  | { kind: "patch"; patch: repo.EnrollmentPatch }
  | {
      kind: "switch";
      withdraw: boolean;
      enroll: repo.CreateEnrollmentBody;
    } {
  if (e.courseId && change.programId && change.programId !== e.courseId) {
    /* Q-EDU-5: the server cannot change an enrollment's program. Withdraw
       from the old one, then enroll in the new one. */
    const program = programs.find((p) => p.id === change.programId);
    if (!program) return { kind: "none" };
    return {
      kind: "switch",
      withdraw: e.status !== "withdrawn",
      enroll: {
        patientId: e.patientId,
        program: program.slug,
        courseId: program.id,
        diagnosis: change.diagnosis,
      },
    };
  }
  const patch: repo.EnrollmentPatch = {};
  if (change.status !== e.status) patch.status = change.status;
  if (change.status === "discharged" && change.dischargeDay) {
    const sameDay =
      e.status === "discharged" &&
      e.dischargedAt !== null &&
      change.dischargeDay === dayIn(new Date(e.dischargedAt), timeZone);
    if (!sameDay) {
      patch.status = "discharged";
      patch.dischargedAt = dischargeInstant(
        change.dischargeDay,
        timeZone,
        now,
        e.enrolledAt,
      );
    }
  }
  if (change.diagnosis !== e.diagnosis) patch.diagnosis = change.diagnosis;
  return Object.keys(patch).length
    ? { kind: "patch", patch }
    : { kind: "none" };
}

/** Save an edit: status, discharge day, diagnosis, or a program switch. */
export function useUpdateEnrollment(programs: readonly EducationProgram[]) {
  const { orgId } = useHospitalOffice();
  const timeZone = useHospitalTimeZone();
  const invalidate = useInvalidateHospital(orgId);
  return useMutation({
    mutationFn: async ({
      enrollment,
      change,
    }: {
      enrollment: HospitalEnrollment;
      change: EnrollmentChange;
    }) => {
      const org = requireOffice(orgId);
      const zone = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
      const plan = planChange(enrollment, change, programs, zone, new Date());
      if (plan.kind === "patch")
        return repo.updateEnrollment(org, enrollment.id, plan.patch);
      if (plan.kind === "switch") {
        if (plan.withdraw)
          await repo.updateEnrollment(org, enrollment.id, {
            status: "withdrawn",
          });
        return repo.createEnrollment(org, plan.enroll);
      }
      return null;
    },
    onSettled: invalidate,
  });
}

/** The signed-in hospital's patients, report and programs (page hook). */
export function useHospital(filter: repo.EnrollmentFilter = {}) {
  const office = useHospitalOffice();
  const list = useHospitalEnrollments(filter);
  const report = useEducationReport();
  return { ...office, ...list, report };
}

/* -------------------------------------------------- the member's own side */

const HOSPITAL_STATUSES = new Set(["admitted", "discharged"]);

/** The signed-in member's hospital courses: enrollments a hospital made
 *  (not withdrawn), each with its outline and the learner record. */
export function useMyHospitalCourses() {
  const scope = usePatientScope();
  const queryClient = useQueryClient();
  const list = useQuery({
    queryKey: [...educationKey(scope), "hospital-enrollments"],
    queryFn: () => listMyEnrollments(requireScope(scope), { limit: 50 }),
    enabled: scope !== null,
  });
  const enrollments = useMemo(
    () =>
      (list.data?.items ?? []).filter(
        (e) => HOSPITAL_STATUSES.has(e.status) && e.courseId,
      ),
    [list.data],
  );
  const outlines = useQueries({
    queries: enrollments.map((e) => ({
      queryKey: ["courses", "outline", e.courseId],
      queryFn: () => getPublishedCourse(e.courseId!),
      staleTime: 5 * 60_000,
    })),
  });
  const records = useQueries({
    queries: enrollments.map((e) => ({
      queryKey: learnerCourseKey(scope, e.courseId!),
      queryFn: () => getLearnerCourse(requireScope(scope), e.courseId!),
      enabled: scope !== null,
    })),
  });
  const complete = useMutation({
    mutationFn: async (classIds: string[]) => {
      for (const id of classIds) await completeClass(requireScope(scope), id);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: educationKey(scope) }),
  });
  return {
    isPending: scope !== null && list.isPending,
    error: list.error,
    courses: enrollments.map((e, i) => ({
      enrollment: e,
      status: enrollmentStatusOf(e.status),
      outline: outlines[i]?.data ?? null,
      record: records[i]?.data ?? null,
    })),
    completeClasses: complete.mutate,
    isSaving: complete.isPending,
    saveError: complete.error,
    notAvailable: isApiError(list.error, { status: 403 }),
  };
}
