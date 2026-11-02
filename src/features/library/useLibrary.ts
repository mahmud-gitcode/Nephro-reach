"use client";

import { useCallback, useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { isApiError } from "@/lib/api/client";
import { useAuth } from "@/features/auth/AuthContext";
import { usePagedContent } from "@/features/community/usePagedContent";
import {
  fromApiLibraryItem,
  getLibraryResource,
  listLibrary,
  setSaved,
  type LibraryQuery,
} from "./library.api";
import * as rules from "./library.rules";
import type { LibraryResource } from "./library.types";

export type { LibraryFilter } from "./library.rules";
export { EMPTY_FILTER } from "./library.rules";

/** Everything the library caches for this account (`saved` is per member). */
export const libraryKey = (userId: string | undefined): QueryKey => [
  "me",
  userId ?? "anonymous",
  "library",
];

const PAGE = { limit: 20 } as const;

function toQuery(filter?: Partial<rules.LibraryFilter>): LibraryQuery {
  return {
    kind: filter?.kind && filter.kind !== "all" ? filter.kind : undefined,
    category:
      filter?.category && filter.category !== "all"
        ? filter.category
        : undefined,
    search: filter?.search?.trim() || undefined,
    savedOnly: filter?.savedOnly || undefined,
  };
}

/**
 * The Library shelf from the API (Phase 12): published resources only, the
 * server filtering by kind, topic, search and "saved", paged. Each item
 * carries whether this member saved it.
 */
export function useLibrary(filter?: Partial<rules.LibraryFilter>) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const query = toQuery(filter);

  const list = usePagedContent({
    queryKey: [...libraryKey(user?.id), "list", query],
    params: PAGE,
    fetch: (params) => listLibrary(query, params),
    map: fromApiLibraryItem,
    enabled: Boolean(user?.id),
    keepPrevious: true,
  });

  /* An explicit save or unsave (never a toggle), by resource id. */
  const write = useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      setSaved(id, saved),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: libraryKey(user?.id) }),
  });

  const resources = list.items;
  const saved = useMemo(
    () => resources.filter((r) => r.saved).map((r) => r.slug),
    [resources],
  );

  const { mutate } = write;
  const toggleSaved = useCallback(
    (slug: string, resource?: LibraryResource) => {
      const target = resource ?? rules.findBySlug(resources, slug);
      if (target) mutate({ id: target.id, saved: !target.saved });
    },
    [mutate, resources],
  );
  const isSaved = useCallback((slug: string) => saved.includes(slug), [saved]);
  const getBySlug = useCallback(
    (slug: string): LibraryResource | undefined =>
      rules.findBySlug(resources, slug),
    [resources],
  );
  const getRelated = useCallback(
    (resource: LibraryResource) => rules.relatedTo(resources, resource),
    [resources],
  );

  return {
    resources,
    saved,
    isSaved,
    toggleSaved,
    getBySlug,
    getRelated,
    hasMore: list.hasMore,
    loadMore: list.loadMore,
    isLoadingMore: list.isLoadingMore,

    isPending: list.isPending,
    error: list.error,
    refetch: list.refetch,
    /* A bookmark that silently failed to save is worth a message. */
    saveError: write.error,
    isSaving: write.isPending,
  };
}

/** One resource by slug (GET /library/:slug). A draft or a missing slug is
 *  a 404 from the server, shown as "not found" rather than an error. */
export function useLibraryResource(slug: string) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: [...libraryKey(user?.id), "item", slug],
    queryFn: async () => {
      try {
        return fromApiLibraryItem(await getLibraryResource(slug));
      } catch (error) {
        if (isApiError(error, { status: 404 })) return null;
        throw error;
      }
    },
    enabled: Boolean(user?.id) && Boolean(slug),
  });
  return {
    resource: query.data ?? undefined,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}
