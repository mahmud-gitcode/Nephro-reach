"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listTravelReflections,
  listTravelTreatments,
  saveTravelReflections,
  saveTravelTreatments,
} from "./travelTreatment.repository";
import * as rules from "./travelTreatment.rules";
import type {
  TravelReflection,
  TravelTreatment,
} from "./travelTreatment.types";

export const travelTreatmentsKey = ["travel", "treatments"] as const;
export const travelReflectionsKey = ["travel", "reflections"] as const;

/**
 * The treatments a member logged while away, and how the trip felt.
 *
 * Same read-modify-write shape as the rest of the app: a save applies to
 * what is actually stored, so a second tab cannot drop a row.
 */
export function useTravelTreatments() {
  const queryClient = useQueryClient();

  const treatmentsQuery = useQuery({
    queryKey: travelTreatmentsKey,
    queryFn: listTravelTreatments,
  });

  const reflectionsQuery = useQuery({
    queryKey: travelReflectionsKey,
    queryFn: listTravelReflections,
  });

  const writeTreatments = useMutation({
    mutationFn: async (
      transform: (current: TravelTreatment[]) => TravelTreatment[],
    ) => saveTravelTreatments(transform(await listTravelTreatments())),
    onSuccess: (rows) => queryClient.setQueryData(travelTreatmentsKey, rows),
  });

  const writeReflections = useMutation({
    mutationFn: async (
      transform: (current: TravelReflection[]) => TravelReflection[],
    ) => saveTravelReflections(transform(await listTravelReflections())),
    onSuccess: (rows) => queryClient.setQueryData(travelReflectionsKey, rows),
  });

  const { mutate: mutateTreatments } = writeTreatments;
  const { mutate: mutateReflections } = writeReflections;

  const treatments = useMemo(
    () => treatmentsQuery.data ?? [],
    [treatmentsQuery.data],
  );
  const reflections = useMemo(
    () => reflectionsQuery.data ?? [],
    [reflectionsQuery.data],
  );

  const forTrip = useCallback(
    (tripId: string) => rules.treatmentsForTrip(treatments, tripId),
    [treatments],
  );

  const saveTreatment = useCallback(
    (treatment: TravelTreatment) =>
      mutateTreatments((current) => rules.upsertTreatment(current, treatment)),
    [mutateTreatments],
  );

  const deleteTreatment = useCallback(
    (id: string) =>
      mutateTreatments((current) => rules.removeTreatment(current, id)),
    [mutateTreatments],
  );

  /** Called when a trip itself goes, so its log does not outlive it. */
  const dropTrip = useCallback(
    (tripId: string) => {
      mutateTreatments((current) =>
        rules.removeTreatmentsForTrip(current, tripId),
      );
      mutateReflections((current) =>
        current.filter((entry) => entry.tripId !== tripId),
      );
    },
    [mutateTreatments, mutateReflections],
  );

  const reflectionFor = useCallback(
    (tripId: string) =>
      reflections.find((entry) => entry.tripId === tripId)?.body ?? "",
    [reflections],
  );

  const saveReflection = useCallback(
    (tripId: string, body: string) =>
      mutateReflections((current) => {
        const next: TravelReflection = {
          tripId,
          body: rules.clipReflection(body),
          updatedAt: new Date().toISOString(),
        };
        const index = current.findIndex((entry) => entry.tripId === tripId);
        if (index === -1) return [next, ...current];

        const copy = [...current];
        copy[index] = next;
        return copy;
      }),
    [mutateReflections],
  );

  return {
    treatments,
    forTrip,
    saveTreatment,
    deleteTreatment,
    dropTrip,

    reflectionFor,
    saveReflection,

    isPending: treatmentsQuery.isPending || reflectionsQuery.isPending,
    error: treatmentsQuery.error ?? reflectionsQuery.error,
    refetch: () => {
      void treatmentsQuery.refetch();
      void reflectionsQuery.refetch();
    },
    /* Worth surfacing: the member has just written down numbers they read
       off a machine they will not be standing in front of again. */
    saveError: writeTreatments.error ?? writeReflections.error,
    dismissSaveError: () => {
      writeTreatments.reset();
      writeReflections.reset();
    },
    isSaving: writeTreatments.isPending || writeReflections.isPending,
  };
}
