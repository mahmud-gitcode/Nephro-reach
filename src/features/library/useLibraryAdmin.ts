"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listResources, saveResources } from "./library.repository";
import * as rules from "./library.rules";
import { libraryResourcesKey } from "./useLibrary";
import type { LibraryResource } from "./library.types";

/**
 * The admin's view of the Library shelf — every resource, drafts included.
 *
 * It shares a query key with `useLibrary`, which is the point: publishing a
 * resource here updates the member shelf in the same tab without a reload,
 * and on the day this is an API the invalidation is already in the right
 * place.
 */
export function useLibraryAdmin() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: libraryResourcesKey,
    queryFn: listResources,
  });

  /* Read-modify-write against storage rather than the cache, so a change
     applies to what is actually saved. With a real API each transform
     becomes the request body. */
  const write = useMutation({
    mutationFn: async (
      transform: (current: LibraryResource[]) => LibraryResource[],
    ) => saveResources(transform(await listResources())),
    onSuccess: (resources) =>
      queryClient.setQueryData(libraryResourcesKey, resources),
  });

  const { mutate, reset } = write;
  const resources = useMemo(() => query.data ?? [], [query.data]);

  const saveResource = useCallback(
    (resource: LibraryResource) =>
      mutate((current) => rules.upsertResource(current, resource)),
    [mutate],
  );

  const deleteResource = useCallback(
    (id: string) => mutate((current) => rules.removeResource(current, id)),
    [mutate],
  );

  const setPublished = useCallback(
    (id: string, published: boolean) =>
      mutate((current) => rules.setPublished(current, id, published)),
    [mutate],
  );

  return {
    resources: useMemo(() => rules.sortByNewest(resources), [resources]),
    totals: useMemo(() => rules.libraryTotals(resources), [resources]),

    saveResource,
    deleteResource,
    setPublished,

    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    /* An upload that did not save is worth an alert the admin has to
       dismiss — they would otherwise close the tab believing it landed. */
    saveError: write.error,
    dismissSaveError: reset,
    isSaving: write.isPending,
  };
}
