"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSaved, listResources, setSaved } from "./library.repository";
import * as rules from "./library.rules";
import type { LibraryResource } from "./library.types";

export type { LibraryFilter } from "./library.rules";
export { EMPTY_FILTER } from "./library.rules";

export const libraryResourcesKey = ["library", "resources"] as const;
export const librarySavedKey = ["library", "saved"] as const;

/**
 * The Library shelf, plus whatever the member has saved off it.
 *
 * Two queries rather than one: the shelf is published content that changes
 * when an admin publishes, and the saved list changes every time a member
 * taps a bookmark. Refetching the whole shelf to record a bookmark would be
 * the wrong request to make once these are real endpoints.
 */
export function useLibrary() {
  const queryClient = useQueryClient();

  const resourcesQuery = useQuery({
    queryKey: libraryResourcesKey,
    queryFn: listResources,
  });

  const savedQuery = useQuery({
    queryKey: librarySavedKey,
    queryFn: getSaved,
  });

  /* Read-modify-write against storage, not against the cache, so the change
     applies to what is actually saved rather than to a stale copy. */
  const write = useMutation({
    mutationFn: async (slug: string) =>
      setSaved(rules.toggleSaved(await getSaved(), slug)),
    onSuccess: (slugs) => queryClient.setQueryData(librarySavedKey, slugs),
  });

  /* `?? []` inline would hand out a new array every render and re-run every
     filter that depends on it. */
  const resources = useMemo(
    () => resourcesQuery.data ?? [],
    [resourcesQuery.data],
  );
  const saved = useMemo(() => savedQuery.data ?? [], [savedQuery.data]);

  const { mutate } = write;
  const toggleSaved = useCallback((slug: string) => mutate(slug), [mutate]);

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

    /* One pending flag for both reads: a shelf without its bookmarks would
       render every card as unsaved for a frame, which reads as data loss. */
    isPending: resourcesQuery.isPending || savedQuery.isPending,
    error: resourcesQuery.error ?? savedQuery.error,
    refetch: () => {
      void resourcesQuery.refetch();
      void savedQuery.refetch();
    },
    /* A bookmark that silently failed to save is worth a message. */
    saveError: write.error,
  };
}
