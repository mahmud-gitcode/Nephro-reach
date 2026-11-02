"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import {
  createRide,
  deleteRide,
  listRides,
  updateRide,
} from "./rides.repository";
import type { RideDraft } from "./rides.types";

/* ==========================================================================
   useRides (Phase 8; ADR 0007)
   --------------------------------------------------------------------------
   The member's saved drivers, from `/patients/:patientId/ride-contacts`,
   keyed by the patient (a caregiver reads the patient's, under their own
   session). Each write is one server call; afterwards the list is re-read,
   so the server's single-primary rule is what shows.
   ========================================================================== */

export function useRides() {
  const scope = usePatientScope();
  const queryClient = useQueryClient();
  const ridesKey = scopedKey(scope, "ride-contacts");

  const query = useQuery({
    queryKey: ridesKey,
    queryFn: () => listRides(requireScope(scope)),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ridesKey });

  const create = useMutation({
    mutationFn: (draft: RideDraft) => createRide(requireScope(scope), draft),
    onSettled: refresh,
  });

  const update = useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: RideDraft }) =>
      updateRide(requireScope(scope), id, draft),
    onSettled: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRide(requireScope(scope), id),
    onSettled: refresh,
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
