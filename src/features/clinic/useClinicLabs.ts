"use client";

import { useCallback } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { lastDays, nextPageParams } from "@/lib/api/paging";
import { orgKey, patientKey } from "@/lib/data/queryKeys";
import * as imports from "./labImports.repository";
import * as chart from "./labsChart.repository";
import { listRosterPicks } from "./ccm.repository";
import { requireOffice, useOfficeOrg } from "./officeContext";

/* ==========================================================================
   Office labs on the API (Phase 9; ADR 0007)
   --------------------------------------------------------------------------
   Replaces the browser store `nr:clinic-labs` (retired, purged). Nothing is
   kept here but TanStack's in-memory cache, keyed by office (and patient).
   ========================================================================== */

/* Until the office context is known there is nothing true to show: that
   is "loading", never an empty list. */
export const LAB_CHART_DAYS = 365;
const CHART_PAGE = 50;

export const clinicLabKeys = {
  roster: (orgId: string) => orgKey(orgId, "roster-picks"),
  imports: (orgId: string) => orgKey(orgId, "lab-imports"),
  batch: (orgId: string, batchId: string) =>
    orgKey(orgId, "lab-imports", batchId),
  rows: (
    orgId: string,
    batchId: string,
    q: { status?: string; page: number },
  ) => orgKey(orgId, "lab-imports", batchId, "rows", q),
  chart: (orgId: string, patientId: string) =>
    patientKey({ patientId, organizationId: orgId }, "labs", "office-chart"),
};

/** The office's active roster, for the patient pickers (first 150). */
export function useRosterPicks() {
  const { orgId } = useOfficeOrg();
  const query = useQuery({
    queryKey: orgId
      ? clinicLabKeys.roster(orgId)
      : ["org", "none", "roster-picks"],
    queryFn: () => listRosterPicks(requireOffice(orgId)),
    enabled: orgId !== null,
  });
  return {
    patients: query.data?.items ?? [],
    pagination: query.data?.pagination ?? null,
    isPending: orgId === null || query.isPending,
    error: orgId === null ? null : query.error,
    refetch: () => void query.refetch(),
  };
}

/** One patient's chart as this office, a year at a time, newest first.
 *  A 403 (labs not shared with this office) is the error, never empty. */
export function usePatientLabChart(patientId: string | null) {
  const { orgId } = useOfficeOrg();
  const query = useInfiniteQuery({
    queryKey:
      orgId && patientId
        ? clinicLabKeys.chart(orgId, patientId)
        : ["patient", "none", "labs", "office-chart"],
    queryFn: ({ pageParam }) =>
      chart.listPatientLabs(requireOffice(orgId), patientId!, {
        ...lastDays(LAB_CHART_DAYS),
        limit: CHART_PAGE,
        page: pageParam.page,
      }),
    initialPageParam: { page: 1 } as { page?: number },
    getNextPageParam: (last) => nextPageParams(last.pagination),
    enabled: orgId !== null && patientId !== null,
  });
  return {
    results: query.data?.pages.flatMap((p) => p.items) ?? [],
    isPending: patientId !== null && (orgId === null || query.isPending),
    isFetching: query.isFetching,
    error: query.error,
    updatedAt: query.dataUpdatedAt,
    hasMore: query.hasNextPage,
    loadMore: () => void query.fetchNextPage(),
    /* refetch() ignores `enabled`: with no patient it would ask for
       /patients/null/labs (P16c crawl), so it waits for one. */
    refetch: () => {
      if (orgId !== null && patientId !== null) void query.refetch();
    },
  };
}

/** The staged batch: its counts (server) and a page of its rows. */
export function useLabImportBatch(
  batchId: string | null,
  rowsQuery: { status?: imports.LabImportRowStatus; page: number },
) {
  const { orgId } = useOfficeOrg();
  const batch = useQuery({
    queryKey:
      orgId && batchId
        ? clinicLabKeys.batch(orgId, batchId)
        : ["org", "none", "lab-imports", "none"],
    queryFn: () => imports.getImport(requireOffice(orgId), batchId!),
    enabled: orgId !== null && batchId !== null,
  });
  const rows = useQuery({
    queryKey:
      orgId && batchId
        ? clinicLabKeys.rows(orgId, batchId, rowsQuery)
        : ["org", "none", "lab-imports", "none", "rows"],
    queryFn: () =>
      imports.listImportRows(requireOffice(orgId), batchId!, {
        status: rowsQuery.status,
        page: rowsQuery.page,
        limit: 50,
      }),
    enabled: orgId !== null && batchId !== null,
  });
  return { batch, rows };
}

/** Upload, confirm and cancel: one server operation each. After confirm
 *  every office lab chart is re-read (the server's rows are what show). */
export function useLabImportActions() {
  const { orgId } = useOfficeOrg();
  const queryClient = useQueryClient();
  const invalidate = useCallback(async () => {
    if (!orgId) return;
    await queryClient.invalidateQueries({
      queryKey: clinicLabKeys.imports(orgId),
    });
    await queryClient.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === "patient" &&
        q.queryKey[3] === orgId &&
        q.queryKey[4] === "labs",
    });
  }, [orgId, queryClient]);

  const upload = useMutation({
    mutationFn: (draft: imports.UploadDraft) =>
      imports.uploadImport(requireOffice(orgId), draft),
  });
  const confirm = useMutation({
    mutationFn: (batchId: string) =>
      imports.confirmImport(requireOffice(orgId), batchId),
    onSettled: invalidate,
  });
  const cancel = useMutation({
    mutationFn: (batchId: string) =>
      imports.cancelImport(requireOffice(orgId), batchId),
    onSettled: invalidate,
  });
  return { upload, confirm, cancel };
}
