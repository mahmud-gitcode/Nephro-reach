"use client";

/* ==========================================================================
   Campaigns on the platform API (Phase 14.7)
   --------------------------------------------------------------------------
   `/platform/campaigns`: campaigns READ to list and read analytics, WRITE
   to create, edit, activate and deactivate. One page at a time. Nothing is
   kept in this browser.
   ========================================================================== */

import { useMemo } from "react";
import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { fetchPage, type Page } from "@/lib/api/paging";
import { platformKey } from "@/lib/data/queryKeys";
import {
  toCampaignBody,
  type ApiCampaign,
  type CampaignAnalytics,
  type CampaignDraft,
} from "./campaigns.mappers";

const NO_OFFICE = { organizationId: null } as const;
export const CAMPAIGN_PAGE_SIZE = 10;

export function listCampaigns(params: {
  page: number;
  limit: number;
  status?: "active" | "inactive";
}): Promise<Page<ApiCampaign>> {
  const { status, ...page } = params;
  return fetchPage<ApiCampaign>("/platform/campaigns", page, {
    ...NO_OFFICE,
    query: { status },
  });
}

export function getCampaignAnalytics(id: string): Promise<CampaignAnalytics> {
  return api<CampaignAnalytics>(
    `/platform/campaigns/${encodeURIComponent(id)}/analytics`,
    NO_OFFICE,
  );
}

export function createCampaign(draft: CampaignDraft): Promise<ApiCampaign> {
  return api<ApiCampaign>("/platform/campaigns", {
    ...NO_OFFICE,
    method: "POST",
    body: toCampaignBody(draft),
  });
}

export function updateCampaign(
  id: string,
  draft: CampaignDraft,
): Promise<ApiCampaign> {
  return api<ApiCampaign>(`/platform/campaigns/${encodeURIComponent(id)}`, {
    ...NO_OFFICE,
    method: "PATCH",
    body: toCampaignBody(draft),
  });
}

export function setCampaignStatus(
  id: string,
  action: "activate" | "deactivate",
): Promise<ApiCampaign> {
  return api<ApiCampaign>(
    `/platform/campaigns/${encodeURIComponent(id)}/${action}`,
    { ...NO_OFFICE, method: "POST" },
  );
}

export function useCampaigns(page: number) {
  const queryClient = useQueryClient();
  const params = { page, limit: CAMPAIGN_PAGE_SIZE };
  const query = useQuery({
    queryKey: platformKey("campaigns", params),
    queryFn: () => listCampaigns(params),
    placeholderData: keepPreviousData,
  });
  /* The active total is the server's pagination count, not the page's. */
  const active = useQuery({
    queryKey: platformKey("campaigns", { status: "active", page: 1, limit: 1 }),
    queryFn: () => listCampaigns({ page: 1, limit: 1, status: "active" }),
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: platformKey("campaigns") });

  const save = useMutation({
    mutationFn: ({ id, draft }: { id: string | null; draft: CampaignDraft }) =>
      id ? updateCampaign(id, draft) : createCampaign(draft),
    onSettled: refresh,
  });
  const status = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "activate" | "deactivate";
    }) => setCampaignStatus(id, action),
    onSettled: refresh,
  });

  const pagination = query.data?.pagination;
  const activePagination = active.data?.pagination;
  return {
    campaigns: query.data?.items ?? [],
    pageCount:
      pagination && pagination.mode === "offset"
        ? Math.max(1, pagination.totalPages)
        : 1,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    activeTotal:
      activePagination && activePagination.mode === "offset"
        ? activePagination.total
        : null,
    activeError: active.error,
    activePending: active.isPending,
    save: (id: string | null, draft: CampaignDraft) =>
      save.mutateAsync({ id, draft }),
    isSaving: save.isPending,
    saveError: save.error,
    resetSave: () => save.reset(),
    setStatus: (id: string, action: "activate" | "deactivate") =>
      status.mutate({ id, action }),
    statusPendingId: status.isPending ? status.variables?.id : undefined,
    statusError: status.error,
    dismissStatusError: () => status.reset(),
  };
}

/** Each listed campaign's analytics (one call per card on the page). */
export function useCampaignAnalytics(ids: string[]) {
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: platformKey("campaign-analytics", id),
      queryFn: () => getCampaignAnalytics(id),
    })),
  });
  return useMemo(() => {
    const byId = new Map<
      string,
      { data?: CampaignAnalytics; error: unknown; isPending: boolean }
    >();
    ids.forEach((id, i) =>
      byId.set(id, {
        data: results[i]?.data,
        error: results[i]?.error ?? null,
        isPending: results[i]?.isPending ?? true,
      }),
    );
    return byId;
  }, [ids, results]);
}
