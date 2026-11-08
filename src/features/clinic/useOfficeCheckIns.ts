"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgKey } from "@/lib/data/queryKeys";
import * as repo from "./checkInNotices.repository";
import { requireOffice, useOfficeOrg } from "./officeContext";

/* ==========================================================================
   Office check-ins, notices and ER summaries (Phase 9; ADR 0007; D33)
   --------------------------------------------------------------------------
   Replaces the interim "member feed" (useMemberFeed / memberFeed.ts, both
   deleted), which composed the member's own hooks without a patient and so
   showed nothing. Every read here is an office read of the server's data,
   per patient on the server side, scoped by the active office. Error is
   never empty; a 403 is "no access".
   ========================================================================== */

export const checkInKeys = {
  notices: (
    orgId: string,
    q: { seen?: boolean; patientId?: string; page?: number; limit?: number },
  ) => orgKey(orgId, "check-in-notices", q),
  noticeCheckIn: (orgId: string, noticeId: string) =>
    orgKey(orgId, "check-in-notices", noticeId, "check-in"),
  summary: (orgId: string, window: repo.Window) =>
    orgKey(orgId, "check-ins", "summary", window),
  er: (orgId: string, window: repo.Window) =>
    orgKey(orgId, "er-visits", "summary", window),
};

type Read<T> = {
  data: T | undefined;
  isPending: boolean;
  error: unknown;
  refetch: () => void;
  isFetching: boolean;
  updatedAt: number;
};

function readOf<T>(
  orgId: string | null,
  query: {
    data: T | undefined;
    isPending: boolean;
    error: unknown;
    isFetching: boolean;
    dataUpdatedAt: number;
    refetch: () => unknown;
  },
  enabled = true,
): Read<T> {
  const on = orgId !== null && enabled;
  return {
    data: query.data,
    isPending: enabled && (orgId === null || query.isPending),
    error: on ? query.error : null,
    refetch: () => void query.refetch(),
    isFetching: query.isFetching,
    updatedAt: query.dataUpdatedAt,
  };
}

export function useCheckInNotices(
  q: { seen?: boolean; patientId?: string; page?: number; limit?: number } = {},
  enabled = true,
) {
  const { orgId } = useOfficeOrg();
  const query = useQuery({
    queryKey: orgId
      ? checkInKeys.notices(orgId, q)
      : ["org", "none", "check-in-notices"],
    queryFn: () => repo.listNotices(requireOffice(orgId), q),
    enabled: orgId !== null && enabled,
  });
  return readOf(orgId, query, enabled);
}

/** The check-in behind a notice; opening it marks the notice seen. */
export function useNoticeCheckIn(noticeId: string | null) {
  const { orgId } = useOfficeOrg();
  const query = useQuery({
    queryKey:
      orgId && noticeId
        ? checkInKeys.noticeCheckIn(orgId, noticeId)
        : ["org", "none", "check-in-notices", "none"],
    queryFn: () => repo.noticeCheckIn(requireOffice(orgId), noticeId!),
    enabled: orgId !== null && noticeId !== null,
  });
  return readOf(orgId, query, noticeId !== null);
}

export function useMarkNoticeSeen() {
  const { orgId } = useOfficeOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noticeId: string) =>
      repo.markNoticeSeen(requireOffice(orgId), noticeId),
    onSettled: () =>
      orgId
        ? queryClient.invalidateQueries({
            queryKey: orgKey(orgId, "check-in-notices"),
          })
        : undefined,
  });
}

/** Check-in counts per patient who shares check-ins, for one window. */
export function useCheckInSummary(window: repo.Window) {
  const { orgId } = useOfficeOrg();
  const query = useQuery({
    queryKey: orgId
      ? checkInKeys.summary(orgId, window)
      : ["org", "none", "check-ins", "summary"],
    queryFn: () => repo.checkInSummary(requireOffice(orgId), window),
    enabled: orgId !== null,
  });
  return readOf(orgId, query);
}

/** Self-reported ER weeks per patient who shares ER visits, for a window. */
export function useErSummary(window: repo.Window) {
  const { orgId } = useOfficeOrg();
  const query = useQuery({
    queryKey: orgId
      ? checkInKeys.er(orgId, window)
      : ["org", "none", "er-visits", "summary"],
    queryFn: () => repo.erVisitSummary(requireOffice(orgId), window),
    enabled: orgId !== null,
  });
  return readOf(orgId, query);
}
