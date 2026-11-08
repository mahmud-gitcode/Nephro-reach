"use client";

/* ==========================================================================
   Access referrals hooks (Phase 10; ADR 0007)
   --------------------------------------------------------------------------
   Keys: orgKey(orgId, "access-referrals", …). The thread list is one
   bounded page per filter; counts come from the server's
   `pagination.total`. A thread's replies are read when it is opened. Each
   write is one server operation and invalidates the office's referral
   reads (and its access records: a referral flags the record).
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgKey } from "@/lib/data/queryKeys";
import { ACCESS_FEATURE } from "@/features/vascular-access/useAccess";
import {
  REFERRAL_KINDS,
  sortReferrals,
  type AccessReferral,
  type ReferralKind,
  type ReferralStatus,
} from "@/features/vascular-access/vascularAccess.data";
import * as repo from "./referrals.repository";

export const REFERRALS_FEATURE = "access-referrals";
export const OFFICE_PATIENTS_FEATURE = "access-referral-patients";

const STATUSES: readonly ReferralStatus[] = [
  "New",
  "Acknowledged",
  "Scheduled",
  "Closed",
];

const name = (p: { firstName: string; lastName: string }) =>
  `${p.firstName} ${p.lastName}`.trim();

export function toReferral(row: repo.ApiReferral): AccessReferral {
  return {
    id: row.id,
    sentAt: row.sentAt,
    from: row.fromOrganization,
    to: row.toOrganization,
    startedByAccess: row.startedByAccess,
    sentBy: row.sentByName,
    patient: row.patient
      ? { id: row.patient.id, name: name(row.patient) }
      : null,
    mrn: row.mrn,
    kind: ((REFERRAL_KINDS as readonly string[]).includes(row.kind)
      ? row.kind
      : "General Message") as ReferralKind,
    findings: row.findings,
    detail: row.detail,
    urgent: row.urgent,
    status: ((STATUSES as readonly string[]).includes(row.status)
      ? row.status
      : "New") as ReferralStatus,
    ...(row.handledByName ? { handledBy: row.handledByName } : {}),
    ...(row.handledAt ? { handledAt: row.handledAt } : {}),
    ...(row.assignedToId
      ? { assignedTo: { id: row.assignedToId, name: row.assignedToName } }
      : {}),
    replyCount: row.replyCount,
    waitingOnYou: row.waitingOnYou,
  };
}

export function toReferralDetail(row: repo.ApiReferralDetail): AccessReferral {
  return {
    ...toReferral(row),
    replies: row.replies.map((reply) => ({
      id: reply.id,
      authorName: reply.authorName,
      authorOrgId: reply.authorOrgId,
      body: reply.body,
      sentAt: reply.sentAt,
    })),
  };
}

/** The office's threads (inbox and sent), one bounded page. */
export function useReferrals(
  orgId: string | null,
  params: repo.ReferralListParams = {},
  options: { enabled?: boolean } = {},
) {
  const enabled = !!orgId && (options.enabled ?? true);
  const query = useQuery({
    queryKey: orgId
      ? orgKey(orgId, REFERRALS_FEATURE, "list", { ...params })
      : ["org", "none", REFERRALS_FEATURE],
    queryFn: () => repo.listReferrals(orgId!, { limit: 100, ...params }),
    enabled,
  });
  const referrals = useMemo(
    () => sortReferrals((query.data?.items ?? []).map(toReferral)),
    [query.data],
  );
  const pagination = query.data?.pagination;
  return {
    referrals,
    total:
      pagination && pagination.mode === "offset"
        ? pagination.total
        : referrals.length,
    isPending: enabled && query.isPending,
    error: enabled ? query.error : null,
    isFetching: query.isFetching,
    updatedAt: query.dataUpdatedAt,
    refetch: () => void query.refetch(),
  };
}

/** One thread with its replies. */
export function useReferral(orgId: string | null, referralId: string | null) {
  const query = useQuery({
    queryKey: orgId
      ? orgKey(orgId, REFERRALS_FEATURE, "thread", referralId ?? "")
      : ["org", "none", REFERRALS_FEATURE, "thread"],
    queryFn: () => repo.getReferral(orgId!, referralId!),
    enabled: !!orgId && !!referralId,
  });
  return {
    referral: query.data ? toReferralDetail(query.data) : null,
    isPending: !!referralId && query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

/** This office's patients for a picker (ACTIVE relationships only). */
export function useOfficePatients(
  orgId: string | null,
  options: { enabled?: boolean } = {},
) {
  const enabled = !!orgId && (options.enabled ?? true);
  const query = useQuery({
    queryKey: orgId
      ? orgKey(orgId, OFFICE_PATIENTS_FEATURE)
      : ["org", "none", OFFICE_PATIENTS_FEATURE],
    queryFn: () => repo.listOfficePatients(orgId!),
    enabled,
  });
  const patients = useMemo(
    () =>
      (query.data?.items ?? [])
        .filter((p) => p.status === "ACTIVE")
        .map((p) => ({ patientId: p.patientId, name: name(p), mrn: p.mrn })),
    [query.data],
  );
  return {
    patients,
    isPending: enabled && query.isPending,
    error: enabled ? query.error : null,
  };
}

export type ReferralDraft = {
  toOrganizationId: string;
  kind: ReferralKind;
  /** Required unless a general message. */
  patientId?: string | null;
  findings: string[];
  detail: string;
  urgent: boolean;
};

/** Writes on the office's referrals; each resolves true when the server
 *  took it, false when it refused (`error` says why). */
export function useReferralActions(orgId: string | null) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (op: () => Promise<unknown>) => op(),
    onSettled: async () => {
      if (!orgId) return;
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: orgKey(orgId, REFERRALS_FEATURE),
        }),
        queryClient.invalidateQueries({
          queryKey: orgKey(orgId, ACCESS_FEATURE),
        }),
      ]);
    },
  });
  const { mutateAsync } = mutation;
  const run = useCallback(
    (op: () => Promise<unknown>): Promise<boolean> =>
      mutateAsync(op).then(
        () => true,
        () => false,
      ),
    [mutateAsync],
  );
  const org = () => {
    if (!orgId) throw new Error("No office is active.");
    return orgId;
  };
  return {
    error: mutation.error,
    isSaving: mutation.isPending,
    clearError: mutation.reset,
    send: (draft: ReferralDraft) =>
      run(() =>
        repo.sendReferral(org(), {
          toOrganizationId: draft.toOrganizationId,
          kind: draft.kind,
          ...(draft.patientId ? { patientId: draft.patientId } : {}),
          ...(draft.kind === "Access Concern" && draft.findings.length > 0
            ? { findings: draft.findings }
            : {}),
          detail: draft.detail.trim(),
          ...(draft.urgent ? { urgent: true } : {}),
        }),
      ),
    reply: (referralId: string, body: string) =>
      run(() => repo.replyToReferral(org(), referralId, body.trim())),
    setStatus: (referralId: string, status: Exclude<ReferralStatus, "New">) =>
      run(() => repo.setReferralStatus(org(), referralId, status)),
    assign: (referralId: string, assignedToId: string | null) =>
      run(() => repo.assignReferral(org(), referralId, assignedToId)),
  };
}

export type ReferralActions = ReturnType<typeof useReferralActions>;
