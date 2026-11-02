"use client";

/* ==========================================================================
   A paged content list (ADR 0007 §3)
   --------------------------------------------------------------------------
   Community posts, library items, Table Talk episodes, reviews and stories
   belong to a user or to the content team, not to a patient, so they do not
   go through `usePagedList` (which needs a patient scope). The rest is the
   same: the first page with the caller's params, then "load more" while the
   server says there is more. Nothing here reads "everything".
   ========================================================================== */

import { useMemo } from "react";
import {
  keepPreviousData,
  useInfiniteQuery,
  type QueryKey,
} from "@tanstack/react-query";
import { nextPageParams, type Page, type PageParams } from "@/lib/api/paging";

export function usePagedContent<Raw, Row>(options: {
  queryKey: QueryKey;
  params: PageParams;
  fetch: (params: PageParams) => Promise<Page<Raw>>;
  map: (raw: Raw) => Row;
  enabled?: boolean;
  /** Keep the last answer on screen while a new filter loads (search). */
  keepPrevious?: boolean;
}) {
  const { fetch, map, params } = options;
  const query = useInfiniteQuery({
    queryKey: options.queryKey,
    queryFn: ({ pageParam }) => fetch(pageParam),
    initialPageParam: params,
    getNextPageParam: (last, _pages, lastParams) =>
      nextPageParams(last.pagination, lastParams),
    enabled: options.enabled ?? true,
    placeholderData: options.keepPrevious ? keepPreviousData : undefined,
  });
  const items = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.items).map(map),
    [query.data, map],
  );
  const first = query.data?.pages[0]?.pagination;
  return {
    items,
    /** The server's count for an offset list, null for a cursor list. */
    total: first && first.mode === "offset" ? first.total : null,
    isPending: query.isPending,
    error: query.error,
    isError: query.isError,
    refetch: () => void query.refetch(),
    hasMore: query.hasNextPage,
    loadMore: () => void query.fetchNextPage(),
    isLoadingMore: query.isFetchingNextPage,
  };
}
