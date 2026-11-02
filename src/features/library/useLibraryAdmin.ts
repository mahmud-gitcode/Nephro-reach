"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePagedContent } from "@/features/community/usePagedContent";
import {
  createLibraryResource,
  deleteLibraryResource,
  fromApiPlatformResource,
  listPlatformLibrary,
  publishLibraryResource,
  toLibraryBody,
  toLibraryPatch,
  updateLibraryResource,
} from "./library.api";
import * as rules from "./library.rules";
import type { LibraryResource } from "./library.types";

export const PLATFORM_LIBRARY_KEY = ["platform", "content", "library"] as const;

/* The content team's shelf is small; one page of the server's maximum keeps
   the totals true, with "load more" past it. */
const PAGE = { limit: 150 } as const;

/**
 * The admin's view of the Library shelf — every resource, drafts included
 * (GET /platform/content/library, platform content). One call per server
 * operation; after each, the admin list and every member shelf in this tab
 * are read again.
 */
export function useLibraryAdmin() {
  const queryClient = useQueryClient();

  const list = usePagedContent({
    queryKey: [...PLATFORM_LIBRARY_KEY, "list"],
    params: PAGE,
    fetch: listPlatformLibrary,
    map: fromApiPlatformResource,
  });
  const resources = list.items;

  const settle = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: PLATFORM_LIBRARY_KEY });
    /* Member shelves in this tab (any account key) read again too. */
    await queryClient.invalidateQueries({
      predicate: (q) => q.queryKey[0] === "me" && q.queryKey[2] === "library",
    });
  }, [queryClient]);

  /* A new post is created (a draft on the server) and published, as the
     composer promises; an edit sends only what changed. */
  const write = useMutation({
    mutationFn: async (resource: LibraryResource) => {
      const before = resources.find((entry) => entry.id === resource.id);
      if (!before) {
        const created = await createLibraryResource(toLibraryBody(resource));
        if (resource.published) await publishLibraryResource(created.id, true);
        return;
      }
      const patch = toLibraryPatch(before, resource);
      if (Object.keys(patch).length > 0)
        await updateLibraryResource(before.id, patch);
      if (resource.published !== before.published)
        await publishLibraryResource(before.id, resource.published);
    },
    onSettled: settle,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteLibraryResource(id),
    onSettled: settle,
  });
  const publish = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      publishLibraryResource(id, published),
    onSettled: settle,
  });

  const { mutate } = write;
  const { mutate: mutateRemove } = remove;
  const { mutate: mutatePublish } = publish;

  return {
    resources: useMemo(() => rules.sortByNewest(resources), [resources]),
    totals: useMemo(() => rules.libraryTotals(resources), [resources]),
    hasMore: list.hasMore,
    loadMore: list.loadMore,

    saveResource: useCallback(
      (resource: LibraryResource) => mutate(resource),
      [mutate],
    ),
    deleteResource: useCallback(
      (id: string) => mutateRemove(id),
      [mutateRemove],
    ),
    setPublished: useCallback(
      (id: string, published: boolean) => mutatePublish({ id, published }),
      [mutatePublish],
    ),

    isPending: list.isPending,
    error: list.error,
    refetch: list.refetch,
    /* An upload that did not save is worth an alert the admin has to
       dismiss — they would otherwise close the tab believing it landed. */
    saveError: write.error ?? remove.error ?? publish.error,
    dismissSaveError: () => {
      write.reset();
      remove.reset();
      publish.reset();
    },
    isSaving: write.isPending || remove.isPending || publish.isPending,
  };
}
