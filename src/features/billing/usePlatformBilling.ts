"use client";

/* ==========================================================================
   Hooks for the platform billing consoles (Phase 14.5–14.6)
   --------------------------------------------------------------------------
   Each list is one page (platformKey + its filters + the page), so a page
   never claims to be "everything". Writes refetch the lists they change.
   ========================================================================== */

import { useMemo } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { platformKey } from "@/lib/data/queryKeys";
import {
  createContract,
  createInvoice,
  listChangeRequests,
  listContracts,
  listInvoices,
  listMemberSubscriptions,
  listPlatformOrganizations,
  markInvoicePaid,
  renewContract,
  resolveChangeRequest,
  setContractStatus,
  setMemberSubscription,
  type ContractAction,
  type CreateContractBody,
  type CreateInvoiceBody,
  type MemberSubscriptionStatus,
  type RenewContractBody,
} from "./platformContracts.repository";

export const PAGE_SIZE = 10;

function pageCountOf(
  pagination:
    | { mode: "offset"; totalPages: number }
    | { mode: "cursor" }
    | null
    | undefined,
): number {
  return pagination && pagination.mode === "offset"
    ? Math.max(1, pagination.totalPages)
    : 1;
}

/** Organization names by id, from the first 150 organizations (the API's
 *  page maximum). A contract whose office is not on that page shows its
 *  id, never a guessed name. */
export function useOrganizationNames() {
  const query = useQuery({
    queryKey: platformKey("organizations", { page: 1, limit: 150 }),
    queryFn: () => listPlatformOrganizations({ page: 1, limit: 150 }),
  });
  const organizations = useMemo(() => query.data?.items ?? [], [query.data]);
  const names = useMemo(
    () => new Map(organizations.map((o) => [o.id, o.name])),
    [organizations],
  );
  return {
    organizations,
    nameOf: (id: string) => names.get(id) ?? null,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

export function useContracts(page: number) {
  const queryClient = useQueryClient();
  const params = { page, limit: PAGE_SIZE };
  const query = useQuery({
    queryKey: platformKey("contracts", params),
    queryFn: () => listContracts(params),
    placeholderData: keepPreviousData,
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: platformKey("contracts") });

  const create = useMutation({
    mutationFn: (body: CreateContractBody) => createContract(body),
    onSettled: refresh,
  });
  const status = useMutation({
    mutationFn: ({ id, action }: { id: string; action: ContractAction }) =>
      setContractStatus(id, action),
    onSettled: refresh,
  });
  const renew = useMutation({
    mutationFn: ({ id, body }: { id: string; body: RenewContractBody }) =>
      renewContract(id, body),
    onSettled: refresh,
  });

  return {
    contracts: query.data?.items ?? [],
    pageCount: pageCountOf(query.data?.pagination),
    total:
      query.data?.pagination?.mode === "offset"
        ? query.data.pagination.total
        : null,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    create: (body: CreateContractBody) => create.mutateAsync(body),
    isCreating: create.isPending,
    createError: create.error,
    resetCreate: () => create.reset(),
    setStatus: (id: string, action: ContractAction) =>
      status.mutate({ id, action }),
    renew: (id: string, body: RenewContractBody) =>
      renew.mutateAsync({ id, body }),
    isRenewing: renew.isPending,
    renewError: renew.error,
    resetRenew: () => renew.reset(),
    actionPendingId: status.isPending ? status.variables?.id : undefined,
    actionError: status.error,
    dismissActionError: () => status.reset(),
  };
}

export function useInvoices(page: number) {
  const queryClient = useQueryClient();
  const params = { page, limit: PAGE_SIZE };
  const query = useQuery({
    queryKey: platformKey("invoices", params),
    queryFn: () => listInvoices(params),
    placeholderData: keepPreviousData,
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: platformKey("invoices") });

  const create = useMutation({
    mutationFn: (body: CreateInvoiceBody) => createInvoice(body),
    onSettled: refresh,
  });
  const paid = useMutation({
    mutationFn: (id: string) => markInvoicePaid(id),
    onSettled: refresh,
  });

  return {
    invoices: query.data?.items ?? [],
    pageCount: pageCountOf(query.data?.pagination),
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    create: (body: CreateInvoiceBody) => create.mutateAsync(body),
    isCreating: create.isPending,
    createError: create.error,
    resetCreate: () => create.reset(),
    markPaid: (id: string) => paid.mutate(id),
    markPaidPendingId: paid.isPending ? paid.variables : undefined,
    markPaidError: paid.error,
    dismissMarkPaidError: () => paid.reset(),
  };
}

export function useChangeRequests(page: number, status: "open" | "resolved") {
  const queryClient = useQueryClient();
  const params = { page, limit: PAGE_SIZE, status };
  const query = useQuery({
    queryKey: platformKey("change-requests", params),
    queryFn: () => listChangeRequests(params),
    placeholderData: keepPreviousData,
  });
  const resolve = useMutation({
    mutationFn: (id: string) => resolveChangeRequest(id),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: platformKey("change-requests"),
      }),
  });
  return {
    requests: query.data?.items ?? [],
    pageCount: pageCountOf(query.data?.pagination),
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    resolve: (id: string) => resolve.mutate(id),
    resolvePendingId: resolve.isPending ? resolve.variables : undefined,
    resolveError: resolve.error,
    dismissResolveError: () => resolve.reset(),
  };
}

export function useMemberSubscriptions(page: number) {
  const queryClient = useQueryClient();
  const params = { page, limit: PAGE_SIZE };
  const query = useQuery({
    queryKey: platformKey("member-subscriptions", params),
    queryFn: () => listMemberSubscriptions(params),
    placeholderData: keepPreviousData,
  });
  const set = useMutation({
    mutationFn: ({
      patientId,
      planId,
      status,
    }: {
      patientId: string;
      planId: string;
      status: MemberSubscriptionStatus;
    }) => setMemberSubscription(patientId, { planId, status }),
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: platformKey("member-subscriptions"),
      });
      void queryClient.invalidateQueries({
        queryKey: platformKey("overview"),
      });
    },
  });
  return {
    rows: query.data?.items ?? [],
    pageCount: pageCountOf(query.data?.pagination),
    total:
      query.data?.pagination?.mode === "offset"
        ? query.data.pagination.total
        : null,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    setSubscription: (
      patientId: string,
      planId: string,
      status: MemberSubscriptionStatus,
    ) => set.mutateAsync({ patientId, planId, status }),
    isSaving: set.isPending,
    saveError: set.error,
    resetSave: () => set.reset(),
  };
}
