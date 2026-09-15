"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRide,
  deleteRide,
  listRides,
  updateRide,
} from "./rides.repository";
import type { RideContact, RideDraft } from "./rides.types";

/* ==========================================================================
   useRides
   --------------------------------------------------------------------------
   The seam between the screen and the data. The page asks for rides and
   gets back a list plus four booleans; it never learns where they came
   from, which is the whole point — on the day the repository calls an API
   instead of localStorage, this file and the page are unchanged.

   Every mutation writes the whole list and hands the result back, so the
   cache is set from the server's answer rather than guessed at. That is
   slower than an optimistic update and correct without any rollback code;
   with a real endpoint and real latency, optimistic updates are a decision
   to make then, per mutation, with the invariant in the repository as the
   thing to reconcile against.
   ========================================================================== */

export const ridesKey = ["travel", "rides"] as const;

export function useRides() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ridesKey,
    queryFn: listRides,
  });

  /* Every write returns the new list, so each of these lands the same way. */
  const land = (rides: RideContact[]) => {
    queryClient.setQueryData(ridesKey, rides);
  };

  const create = useMutation({
    mutationFn: (draft: RideDraft) => createRide(draft),
    onSuccess: land,
  });

  const update = useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: RideDraft }) =>
      updateRide(id, draft),
    onSuccess: land,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRide(id),
    onSuccess: land,
  });

  return {
    rides: query.data ?? [],
    /* isPending, not isFetching: true only when there is nothing to show. A
       background refetch must not blank a list the member is reading. */
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),

    create,
    update,
    remove,
    /* One flag for the form, so a second submit cannot start while the
       first is in flight. */
    isSaving: create.isPending || update.isPending,
    saveError: create.error ?? update.error,
    deleteError: remove.error,
  };
}
