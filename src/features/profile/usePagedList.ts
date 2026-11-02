"use client";

/* ==========================================================================
   A paged or windowed list read (ADR 0007 §3)
   --------------------------------------------------------------------------
   The API pages every list (default 10, maximum 150). This reads the first
   page with the caller's params (a limit, and for a dated log its day
   window) and offers "load more" while the server says there is more, so
   no screen assumes one page is everything.
   ========================================================================== */

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { nextPageParams, type Page, type PageParams } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import { requireScope } from "./patientScope";

export function usePagedList<Raw, Row>(options: {
  scope: PatientScope | null;
  queryKey: readonly unknown[];
  params: PageParams;
  fetch: (scope: PatientScope, params: PageParams) => Promise<Page<Raw>>;
  map: (raw: Raw) => Row;
  enabled?: boolean;
}) {
  const { scope, fetch, map, params } = options;
  const query = useInfiniteQuery({
    queryKey: options.queryKey,
    queryFn: ({ pageParam }) => fetch(requireScope(scope), pageParam),
    initialPageParam: params,
    getNextPageParam: (last, _pages, lastParams) =>
      nextPageParams(last.pagination, lastParams),
    enabled: options.enabled ?? true,
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
