"use client";

import { useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Pagination } from "@/lib/api/client";
import { nextPageParams } from "@/lib/api/paging";
import { orgKey } from "@/lib/data/queryKeys";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import { officeKey, requireOffice, useOfficeScope } from "./office.scope";
import * as repo from "./officeBilling.repository";
import { toContract, toInvoice } from "./billing.data";
import type { ChangeTopic } from "./billing.actions";

/* ==========================================================================
   Contract & Billing: the API hooks (Phase 14; ADR 0007)
   --------------------------------------------------------------------------
   Replaces the browser record of payments, change requests and renewal
   (the retired `nr:clinic-billing-actions` key). Reads are keyed by the
   office (orgKey), so a portal switch never shows another office's
   contract; a failed read is an error (a 403 is "no access"), never the
   demo contract.
   ========================================================================== */

const total = (p: Pagination | null | undefined) =>
  p?.mode === "offset" ? p.total : null;

export function useOfficeBilling() {
  const { organizationId: orgId } = useOfficeScope();
  const userId = useOptionalAuth()?.user?.id ?? null;
  const queryClient = useQueryClient();

  const contract = useQuery({
    queryKey: officeKey(orgId, "billing", "contract"),
    queryFn: () => repo.getContract(requireOffice(orgId)),
  });
  const invoices = useInfiniteQuery({
    queryKey: officeKey(orgId, "billing", "invoices"),
    queryFn: ({ pageParam }) =>
      repo.listInvoices(requireOffice(orgId), pageParam),
    initialPageParam: { page: 1 } as { page?: number; cursor?: string | null },
    getNextPageParam: (last) => nextPageParams(last.pagination),
  });
  const requests = useQuery({
    queryKey: officeKey(orgId, "billing", "change-requests"),
    queryFn: () => repo.listChangeRequests(requireOffice(orgId), { page: 1 }),
  });
  /* Email and phone on the contract card are the office profile (settings
     read); without that permission they show "—". */
  const profile = useQuery({
    queryKey: officeKey(orgId, "profile"),
    queryFn: () => repo.getOfficeProfile(requireOffice(orgId)),
  });

  const send = useMutation({
    mutationFn: (input: { topic: ChangeTopic; detail: string }) =>
      repo.requestChange(requireOffice(orgId), input),
    onSuccess: () => {
      if (orgId)
        void queryClient.invalidateQueries({
          queryKey: orgKey(orgId, "billing", "change-requests"),
        });
    },
  });

  const invoiceRows = useMemo(
    () =>
      (invoices.data?.pages ?? []).flatMap((page) => page.items.map(toInvoice)),
    [invoices.data],
  );

  return {
    orgId,
    contract: contract.data?.contract
      ? toContract(contract.data.contract)
      : null,
    pendingContract: contract.data?.pendingContract
      ? toContract(contract.data.pendingContract)
      : null,
    seats: contract.data?.seats ?? null,
    isPending: contract.isPending,
    error: contract.error,
    refetch: () => void contract.refetch(),

    invoices: invoiceRows,
    invoicesTotal: total(invoices.data?.pages[0]?.pagination),
    invoicesPending: invoices.isPending,
    invoicesError: invoices.error,
    refetchInvoices: () => void invoices.refetch(),
    hasMoreInvoices: invoices.hasNextPage,
    loadMoreInvoices: () => void invoices.fetchNextPage(),

    changeRequests: requests.data?.items ?? [],
    changeRequestsError: requests.error,
    /** "you" when the request is the signed-in user's; no name is sent. */
    requesterLabel: (requestedById: string) =>
      requestedById === userId ? "you" : "a colleague",

    profile: profile.data ?? null,

    requestChange: send.mutate,
    isSending: send.isPending,
    sendError: send.error,
    resetSend: () => send.reset(),
  };
}

export type OfficeBilling = ReturnType<typeof useOfficeBilling>;
