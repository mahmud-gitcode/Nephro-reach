"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import { combineReads } from "@/lib/data/asyncState";
import { toPatientRow, type ApiProgramEnrollment } from "./enrollment.mapping";
import type { Patient } from "./enrollment.data";
import {
  getRosterPatient,
  listProgramEnrollments,
  listRoster,
  type RosterQuery,
} from "./roster.repository";
import { officeKey, requireOffice, useOfficeScope } from "./office.scope";
import {
  clinicKeys,
  enrollmentWindowQuery,
  isWholeList,
  totalOf,
} from "./useClinicData";

/* ==========================================================================
   One server page of the office roster (Phase 8, QA round 1 H1)
   --------------------------------------------------------------------------
   GET /organizations/:id/patients?status=ACTIVE&page=&limit=&search=
   &program= — the server pages, searches (name or MRN) and filters by
   program (BE-2, spec 046), so a patient beyond any client window is still
   listed and found, and the pager's total is the server's.

   Each row is joined with that patient's program enrollments in this
   office. The office's newest enrollments (one bounded read, shared with
   useClinicData) cover every patient when that read holds them all; when
   it does not, the patients on this page are read one by one
   (`program-enrollments?patientId=`), so a row never shows "No Program"
   only because its enrollment was older than the window. That is at most
   one read per row on the page, and only for an office with more
   enrollments than the window.
   ========================================================================== */

/** How long the search box rests before the server is asked. */
export const SEARCH_SETTLE_MS = 300;

export type RosterPageInput = {
  search: string;
  /** A program slug for BE-2, or null for every program. */
  program: string | null;
  page: number;
  limit: number;
};

/** The search text once typing has paused, so a keystroke is not a read. */
export function useSettled(value: string, ms = SEARCH_SETTLE_MS): string {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    if (value === settled) return;
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, settled, ms]);
  /* Clearing the box is shown at once. */
  return value.trim() === "" ? value : settled;
}

/* One stable answer for every per-patient read: all their rows once each
   has landed (null until then), the first error, and a refetch. Module
   level, so TanStack Query keeps the result between renders. */
function combineOwn(
  results: {
    data?: { items: ApiProgramEnrollment[] };
    isPending: boolean;
    isFetching: boolean;
    error: unknown;
    refetch: () => unknown;
  }[],
) {
  return {
    items: results.every((r) => r.data)
      ? results.flatMap((r) => r.data?.items ?? [])
      : null,
    isPending: results.some((r) => r.isPending),
    isFetching: results.some((r) => r.isFetching),
    error: results.find((r) => r.error)?.error ?? null,
    refetch: () => results.forEach((r) => void r.refetch()),
  };
}

export function useRosterPage(input: RosterPageInput, enabled = true) {
  const { organizationId } = useOfficeScope();
  const search = useSettled(input.search);
  const query: RosterQuery = {
    status: "ACTIVE",
    page: input.page,
    limit: input.limit,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(input.program ? { program: input.program } : {}),
  };

  const roster = useQuery({
    queryKey: clinicKeys.roster(organizationId, query),
    queryFn: () => listRoster(requireOffice(organizationId), query),
    placeholderData: keepPreviousData,
    enabled,
  });
  const newest = useQuery({
    ...enrollmentWindowQuery(organizationId),
    enabled,
  });
  const newestWhole = newest.data ? isWholeList(newest.data) : false;

  /* The patients on this page whose enrollments the window may not hold. */
  const toRead =
    roster.data && newest.data && !newestWhole
      ? roster.data.items.map((p) => p.patientId)
      : [];
  const own = useQueries({
    queries: toRead.map((patientId) => ({
      queryKey: officeKey(organizationId, "program-enrollments", {
        patientId,
      }),
      queryFn: () =>
        listProgramEnrollments(requireOffice(organizationId), {
          patientId,
          limit: 150,
        }),
      enabled,
    })),
    combine: combineOwn,
  });

  const reads = combineReads(roster, newest, own);
  const rows = useMemo((): Patient[] | undefined => {
    if (!roster.data || !newest.data) return undefined;
    let enrollments: ApiProgramEnrollment[] = newest.data.items;
    if (!newestWhole) {
      if (!own.items) return undefined;
      enrollments = own.items;
    }
    return roster.data.items.map((p) => toPatientRow(p, enrollments));
  }, [roster.data, newest.data, newestWhole, own.items]);

  const total = roster.data ? totalOf(roster.data) : 0;
  const pageCount = Math.max(1, Math.ceil(total / input.limit));
  const page = Math.min(Math.max(1, input.page), pageCount);
  const firstShown = rows && rows.length > 0 ? (page - 1) * input.limit + 1 : 0;

  return {
    rows,
    total,
    page,
    pageCount,
    firstShown,
    lastShown: rows ? firstShown + Math.max(0, rows.length - 1) : 0,
    /* No rows to show yet (the first read of this view). */
    isPending: rows === undefined && !reads.isError,
    /* A newer page, search or filter is on its way; the old rows stay. */
    isFetching: roster.isFetching || own.isFetching,
    error: reads.error,
    refetch: reads.onRetry,
  };
}

export type RosterPage = ReturnType<typeof useRosterPage>;

/**
 * One roster patient by id, for a ?patient= link to someone not in the
 * window or on the page (GET /organizations/:id/patients/:patientId plus
 * their enrollments here). A patient not on this office's roster is a 404:
 * the link then opens the list only.
 */
export function useRosterPatient(patientId: string | null) {
  const { organizationId } = useOfficeScope();
  const patient = useQuery({
    queryKey: officeKey(organizationId, "roster", "patient", patientId ?? ""),
    queryFn: () =>
      getRosterPatient(requireOffice(organizationId), patientId ?? ""),
    enabled: patientId !== null,
    retry: false,
  });
  const enrollments = useQuery({
    queryKey: officeKey(organizationId, "program-enrollments", {
      patientId: patientId ?? "",
    }),
    queryFn: () =>
      listProgramEnrollments(requireOffice(organizationId), {
        patientId: patientId ?? "",
        limit: 150,
      }),
    enabled: patientId !== null && patient.isSuccess,
  });
  return useMemo(
    () =>
      /* Only someone on the roster now: an ended relationship opens nothing. */
      patient.data && enrollments.data && patient.data.status === "ACTIVE"
        ? toPatientRow(patient.data, enrollments.data.items)
        : null,
    [patient.data, enrollments.data],
  );
}
