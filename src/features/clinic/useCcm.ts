"use client";

import { useCallback, useMemo } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { orgKey, patientKey } from "@/lib/data/queryKeys";
import * as repo from "./ccm.repository";
import { requireOffice, useOfficeOrg } from "./officeContext";

/* ==========================================================================
   CCM on the API (Phase 9; ADR 0007)
   --------------------------------------------------------------------------
   Replaces the browser store `nr:clinic-ccm` (retired and purged) and the
   member feed folded into it. Reads are the server's, per office, paged;
   every write is one server operation and then invalidates the office's
   CCM reads and that patient's, so the server's answer is what shows
   (minutes, status, alerts, checklist). Nothing is computed here.
   ========================================================================== */

export const ccmKeys = {
  all: (orgId: string) => orgKey(orgId, "ccm"),
  worklist: (orgId: string, q: repo.WorklistQuery) =>
    orgKey(orgId, "ccm", "enrollments", q),
  summary: (orgId: string, month: string) =>
    orgKey(orgId, "ccm", "summary", month),
  inbox: (orgId: string, q: Record<string, unknown>) =>
    orgKey(orgId, "ccm", "inbox", q),
  conditions: (orgId: string) => orgKey(orgId, "ccm", "conditions"),
  patient: (orgId: string, patientId: string, ...rest: string[]) =>
    patientKey({ patientId, organizationId: orgId }, "ccm", ...rest),
};

type ReadOf<T> = {
  data: T | undefined;
  isPending: boolean;
  isFetching: boolean;
  error: unknown;
  updatedAt: number;
  refetch: () => void;
};

function read<T>(
  orgId: string | null,
  enabled: boolean,
  query: {
    data: T | undefined;
    isPending: boolean;
    isFetching: boolean;
    error: unknown;
    dataUpdatedAt: number;
    refetch: () => unknown;
  },
): ReadOf<T> {
  return {
    data: query.data,
    isPending: enabled && (orgId === null || query.isPending),
    isFetching: query.isFetching,
    error: enabled && orgId !== null ? query.error : null,
    updatedAt: query.dataUpdatedAt,
    refetch: () => void query.refetch(),
  };
}

/* Until the office context is known there is nothing true to show: that
   is "loading", never an empty list. */
const NONE = ["org", "none", "ccm"];

/** A page of the worklist: the server filters, sorts and pages it. */
export function useCcmWorklist(q: repo.WorklistQuery, enabled = true) {
  const { orgId } = useOfficeOrg();
  const on = orgId !== null && enabled;
  const query = useQuery({
    queryKey: orgId ? ccmKeys.worklist(orgId, q) : [...NONE, "worklist"],
    queryFn: () => repo.listWorklist(requireOffice(orgId), q),
    enabled: on,
  });
  return read(orgId, enabled, query);
}

/** The month's counts (never a counted page). */
export function useCcmSummary(month: string) {
  const { orgId } = useOfficeOrg();
  const query = useQuery({
    queryKey: orgId ? ccmKeys.summary(orgId, month) : [...NONE, "summary"],
    queryFn: () => repo.getSummary(requireOffice(orgId), month),
    enabled: orgId !== null,
  });
  return read(orgId, true, query);
}

/** One enrolled patient for a month (404 when the link ended). */
export function useCcmPatient(patientId: string | null, month: string) {
  const { orgId } = useOfficeOrg();
  const on = orgId !== null && patientId !== null;
  const query = useQuery({
    queryKey:
      orgId && patientId
        ? ccmKeys.patient(orgId, patientId, "enrollment", month)
        : [...NONE, "patient"],
    queryFn: () => repo.getEnrollment(requireOffice(orgId), patientId!, month),
    enabled: on,
  });
  return read(orgId, patientId !== null, query);
}

/** A patient's activities for each month asked (the sheet reads the
 *  selected month and, for open follow-ups, the months before it). */
export function useCcmActivities(patientId: string | null, months: string[]) {
  const { orgId } = useOfficeOrg();
  const on = orgId !== null && patientId !== null;
  const results = useQueries({
    queries: months.map((month) => ({
      queryKey:
        orgId && patientId
          ? ccmKeys.patient(orgId, patientId, "activities", month)
          : [...NONE, "activities", month],
      queryFn: () =>
        repo.listActivities(requireOffice(orgId), patientId!, month),
      enabled: on,
    })),
  });
  return {
    byMonth: months.map((month, i) => ({
      month,
      rows: results[i]?.data ?? [],
    })),
    isPending:
      patientId !== null &&
      (orgId === null || results.some((r) => r.isPending)),
    error: on ? (results.find((r) => r.error)?.error ?? null) : null,
    refetch: () => {
      for (const r of results) void r.refetch();
    },
  };
}

/** The CCM inbox (open by default), paged; or one patient's items. */
export function useCcmInbox(
  q: { patientId?: string; page?: number; limit?: number } = {},
  enabled = true,
) {
  const { orgId } = useOfficeOrg();
  const on = orgId !== null && enabled;
  const query = useQuery({
    queryKey: orgId
      ? ccmKeys.inbox(orgId, { status: "open", ...q })
      : [...NONE, "inbox"],
    queryFn: () =>
      repo.listInbox(requireOffice(orgId), { status: "open", ...q }),
    enabled: on,
  });
  return read(orgId, enabled, query);
}

export type CcmActions = ReturnType<typeof useCcm>;

/**
 * The CCM writes, one per server operation, with the old action names so
 * the page changes call sites, not structure. Each takes the patient id.
 */
export function useCcm() {
  const { orgId } = useOfficeOrg();
  const queryClient = useQueryClient();
  const write = useMutation({
    mutationFn: async ({
      run,
    }: {
      run: (orgId: string) => Promise<unknown>;
      patientId?: string;
    }) => run(requireOffice(orgId)),
    onSettled: async (_data, _error, { patientId }) => {
      if (!orgId) return;
      await queryClient.invalidateQueries({ queryKey: ccmKeys.all(orgId) });
      if (patientId)
        await queryClient.invalidateQueries({
          queryKey: ccmKeys.patient(orgId, patientId),
        });
    },
  });
  const { mutateAsync } = write;
  const run = useCallback(
    (patientId: string | undefined, fn: (orgId: string) => Promise<unknown>) =>
      mutateAsync({ run: fn, patientId }),
    [mutateAsync],
  );

  return useMemo(
    () => ({
      isSaving: write.isPending,
      writeError: write.error,
      clearWriteError: write.reset,
      enroll: (body: repo.EnrollBody) =>
        run(body.patientId, (org) => repo.enroll(org, body)),
      /** A person not on the roster yet: the roster link first (it takes a
       *  contract seat on the server, NEW-3), then the CCM enrolment. */
      enrollNew: (
        patient: repo.NewRosterPatient,
        body: Omit<repo.EnrollBody, "patientId">,
      ) =>
        run(undefined, async (org) => {
          const added = await repo.addRosterPatient(org, patient);
          const patientId = repo.enrolledPatientId(added);
          if (!patientId) throw new Error("The new patient has no id.");
          return repo.enroll(org, { ...body, patientId });
        }),
      setConditions: (patientId: string, conditions: string[]) =>
        run(patientId, (org) =>
          repo.updateEnrollment(org, patientId, { conditions }),
        ),
      setCompliance: (
        patientId: string,
        flags: { isOnDialysis: boolean; isOnHomeHealthOrHospice: boolean },
      ) =>
        run(patientId, (org) => repo.updateEnrollment(org, patientId, flags)),
      setRequirement: (
        patientId: string,
        requirementId: string,
        body: repo.RequirementBody,
      ) =>
        run(patientId, (org) =>
          repo.setRequirement(org, patientId, requirementId, body),
        ),
      setKidneyCare: (patientId: string, body: repo.KidneyCareBody) =>
        run(patientId, (org) => repo.updateKidneyCare(org, patientId, body)),
      addActivity: (patientId: string, body: repo.ActivityBody) =>
        run(patientId, (org) => repo.addActivity(org, patientId, body)),
      setEhrDocumented: (
        patientId: string,
        activityId: string,
        documented: boolean,
      ) =>
        run(patientId, (org) =>
          repo.updateActivity(org, patientId, activityId, {
            ehrDocumented: documented,
          }),
        ),
      completeFollowUp: (patientId: string, activityId: string) =>
        run(patientId, (org) =>
          repo.updateActivity(org, patientId, activityId, {
            followUpDone: true,
          }),
        ),
      resolveInbox: (patientId: string, itemId: string) =>
        run(patientId, (org) => repo.resolveInboxItem(org, itemId)),
    }),
    [run, write.isPending, write.error, write.reset],
  );
}
