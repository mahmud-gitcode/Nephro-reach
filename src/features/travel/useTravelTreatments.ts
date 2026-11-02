"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import {
  addTravelTreatment,
  getTravelReflection,
  listTravelTreatments,
  removeTravelTreatment,
  saveTravelReflection,
  updateTravelTreatment,
} from "./travelTreatment.repository";
import * as rules from "./travelTreatment.rules";
import type { TravelTreatment } from "./travelTreatment.types";

/**
 * The treatments a member logged while away on one trip, and how the trip
 * felt (Phase 8: `/patients/:id/trips/:tripId/treatments` and
 * `…/reflection`). Every save is one server operation, then the reads are
 * invalidated so the server's answer (its ids, its updatedAt) is what shows.
 */
export function useTravelTreatments(tripId: string) {
  const scope = usePatientScope();
  const queryClient = useQueryClient();
  const treatmentsKey = scopedKey(scope, "trips", tripId, "treatments");
  const reflectionKey = scopedKey(scope, "trips", tripId, "reflection");

  const treatmentsQuery = useQuery({
    queryKey: treatmentsKey,
    queryFn: () => listTravelTreatments(requireScope(scope), tripId),
    enabled: tripId !== "",
  });
  const reflectionQuery = useQuery({
    queryKey: reflectionKey,
    queryFn: () => getTravelReflection(requireScope(scope), tripId),
    enabled: tripId !== "",
  });

  const writeTreatment = useMutation({
    mutationFn: (op: () => Promise<unknown>) => op(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: treatmentsKey }),
  });
  const writeReflection = useMutation({
    mutationFn: (body: string) =>
      saveTravelReflection(
        requireScope(scope),
        tripId,
        rules.clipReflection(body),
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey: reflectionKey }),
  });

  const treatments = useMemo(
    () => rules.sortTreatments(treatmentsQuery.data ?? []),
    [treatmentsQuery.data],
  );
  const known = useMemo(
    () => new Set((treatmentsQuery.data ?? []).map((row) => row.id)),
    [treatmentsQuery.data],
  );

  const { mutate: mutateTreatment } = writeTreatment;
  const { mutate: mutateReflection } = writeReflection;

  /** A row the server knows is replaced; a new one is added. */
  const saveTreatment = useCallback(
    (treatment: TravelTreatment) =>
      mutateTreatment(() =>
        known.has(treatment.id)
          ? updateTravelTreatment(requireScope(scope), tripId, treatment)
          : addTravelTreatment(requireScope(scope), tripId, treatment),
      ),
    [mutateTreatment, known, scope, tripId],
  );

  const deleteTreatment = useCallback(
    (id: string) =>
      mutateTreatment(() =>
        removeTravelTreatment(requireScope(scope), tripId, id),
      ),
    [mutateTreatment, scope, tripId],
  );

  return {
    treatments,
    /** This trip's rows (the hook is per trip). */
    forTrip: useCallback(
      (id: string) => (id === tripId ? treatments : []),
      [tripId, treatments],
    ),
    saveTreatment,
    deleteTreatment,

    reflectionFor: useCallback(
      (id: string) => (id === tripId ? (reflectionQuery.data?.body ?? "") : ""),
      [tripId, reflectionQuery.data],
    ),
    saveReflection: useCallback(
      (_tripId: string, body: string) => mutateReflection(body),
      [mutateReflection],
    ),

    isPending: treatmentsQuery.isPending || reflectionQuery.isPending,
    error: treatmentsQuery.error ?? reflectionQuery.error,
    treatmentsError: treatmentsQuery.error,
    reflectionError: reflectionQuery.error,
    refetch: () => {
      void treatmentsQuery.refetch();
      void reflectionQuery.refetch();
    },
    /* Worth surfacing: the member has just written down numbers they read
       off a machine they will not be standing in front of again. */
    saveError: writeTreatment.error ?? writeReflection.error,
    dismissSaveError: () => {
      writeTreatment.reset();
      writeReflection.reset();
    },
    isSaving: writeTreatment.isPending || writeReflection.isPending,
  };
}
