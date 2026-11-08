"use client";

/* ==========================================================================
   Support hooks (Phase 11, ADR 0007)
   --------------------------------------------------------------------------
   Read from the API page by page; every change is one call for one ticket,
   followed by a refetch of what it touched, so the screen always shows the
   server's answer (its ids, its status). Nothing is kept in the browser.
   ========================================================================== */

import { useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import { nextPageParams, type Page, type PageParams } from "@/lib/api/paging";
import * as api from "./support.api";
import * as rules from "./support.data";

const PAGE: PageParams = { limit: 20 };

/** Every support read is filed under the signed-in account and side. */
function useSupportKey(side: "me" | "platform") {
  const accountId = useOptionalAuth()?.user?.id ?? "none";
  return useMemo(
    () => ["support", side, accountId] as const,
    [side, accountId],
  );
}

function usePaged<Raw, Row>(
  queryKey: readonly unknown[],
  fetch: (params: PageParams) => Promise<Page<Raw>>,
  map: (raw: Raw) => Row,
  enabled = true,
) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetch(pageParam),
    initialPageParam: PAGE,
    getNextPageParam: (last, _pages, lastParams) =>
      nextPageParams(last.pagination, lastParams),
    enabled,
  });
  const items = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.items).map(map),
    [query.data, map],
  );
  return {
    items,
    isPending: query.isPending,
    error: query.error,
    isError: query.isError,
    refetch: () => void query.refetch(),
    hasMore: query.hasNextPage,
    loadMore: () => void query.fetchNextPage(),
    isLoadingMore: query.isFetchingNextPage,
  };
}

/** How many tickets are in one status (the server's count, limit 1). */
function useCount(
  queryKey: readonly unknown[],
  fetch: () => Promise<Page<unknown>>,
  enabled = true,
) {
  const query = useQuery({ queryKey, queryFn: fetch, enabled });
  const pagination = query.data?.pagination;
  if (!pagination) return 0;
  return pagination.mode === "offset" ? pagination.total : 0;
}

/** The signed-in account's own tickets: open one, read one, reply. */
export function useMyTickets() {
  const queryClient = useQueryClient();
  const base = useSupportKey("me");
  const list = usePaged(
    [...base, "tickets"],
    (params) => api.listMyTickets(params),
    rules.fromApiTicket,
  );
  const refresh = () => queryClient.invalidateQueries({ queryKey: base });
  const open = useMutation({
    mutationFn: (body: api.NewTicketBody) => api.openTicket(body),
    onSuccess: refresh,
  });
  const reply = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      api.replyToMyTicket(id, body),
    onSuccess: refresh,
  });
  return {
    tickets: list.items,
    list,
    isPending: list.isPending,
    error: list.error,
    open,
    reply,
    isSaving: open.isPending || reply.isPending,
    saveError: open.error ?? reply.error,
    clearSaveError: () => {
      open.reset();
      reply.reset();
    },
  };
}

/** One ticket with its replies, read when it is opened. */
export function useTicket(side: "me" | "platform", id: string | null) {
  const base = useSupportKey(side);
  const query = useQuery({
    queryKey: [...base, "ticket", id ?? ""],
    queryFn: () =>
      side === "me" ? api.getMyTicket(id!) : api.getPlatformTicket(id!),
    enabled: Boolean(id),
  });
  return {
    ticket: query.data ? rules.fromApiTicket(query.data) : null,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

export type InboxFilter = "all" | rules.SupportStatus;

/** The NephroReach team's inbox: every ticket, by status. */
export function usePlatformTickets(filter: InboxFilter) {
  const queryClient = useQueryClient();
  const base = useSupportKey("platform");
  const status = filter === "all" ? undefined : filter;
  const list = usePaged(
    [...base, "tickets", { status: filter }],
    (params) => api.listPlatformTickets(params, { status }),
    rules.fromApiTicket,
  );
  const openCount = useCount([...base, "tickets", "count", "open"], () =>
    api.listPlatformTickets({ limit: 1 }, { status: "open" }),
  );
  const refresh = () => queryClient.invalidateQueries({ queryKey: base });
  const reply = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      api.replyAsSupport(id, body),
    onSuccess: refresh,
  });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: rules.SupportStatus }) =>
      api.setTicketStatus(id, status),
    onSuccess: refresh,
  });
  return {
    tickets: list.items,
    list,
    openCount,
    reply,
    setStatus,
    saveError: reply.error ?? setStatus.error,
    clearSaveError: () => {
      reply.reset();
      setStatus.reset();
    },
  };
}

/** "Request information for your organization", from secure share pages. */
export function useInfoRequests() {
  const queryClient = useQueryClient();
  const base = useSupportKey("platform");
  const list = usePaged(
    [...base, "info-requests"],
    (params) => api.listInfoRequests(params),
    rules.fromApiInfoRequest,
  );
  const newCount = useCount([...base, "info-requests", "count", "new"], () =>
    api.listInfoRequests({ limit: 1 }, { contacted: false }),
  );
  const toggle = useMutation({
    mutationFn: ({ id, contacted }: { id: string; contacted: boolean }) =>
      api.setInfoRequestContacted(id, contacted),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [...base, "info-requests"] }),
  });
  return { requests: list.items, list, newCount, toggle };
}
