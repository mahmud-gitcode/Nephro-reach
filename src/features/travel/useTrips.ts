"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listTrips, saveTrips } from "./trip.repository";
import * as rules from "./trip.rules";
import type {
  TimeChangeRequest,
  TravelDocumentFile,
  TravelDocumentKey,
  TravelPrepKey,
  TripPlacement,
  TripRequest,
} from "./trip.types";

export const tripsKey = ["travel", "trips"] as const;

/**
 * The member's travel dialysis requests.
 *
 * Only `submit` and `cancel` are the member's to call. Moving a request
 * along the status ladder belongs to the facility, so that lives behind
 * `setStatus` and is not wired to anything on the member's screen.
 */
export function useTrips() {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: tripsKey, queryFn: listTrips });

  const write = useMutation({
    mutationFn: async (transform: (current: TripRequest[]) => TripRequest[]) =>
      saveTrips(transform(await listTrips())),
    onSuccess: (trips) => queryClient.setQueryData(tripsKey, trips),
  });

  const { mutate, reset } = write;
  const trips = useMemo(() => query.data ?? [], [query.data]);

  const submit = useCallback(
    (trip: TripRequest) => mutate((current) => rules.addTrip(current, trip)),
    [mutate],
  );

  const cancel = useCallback(
    (id: string) => mutate((current) => rules.removeTrip(current, id)),
    [mutate],
  );

  const setStatus = useCallback(
    (id: string, status: TripRequest["status"]) =>
      mutate((current) => rules.updateTripStatus(current, id, status)),
    [mutate],
  );

  /* Ticking off paperwork is the member's, and the only part of a submitted
     request they can still change. */
  /* Editing a request the facility has not confirmed yet. Keeps the id, the
     submitted date and anything the facility has already written. */
  const update = useCallback(
    (trip: TripRequest) =>
      mutate((current) =>
        current.map((entry) =>
          entry.id === trip.id
            ? {
                ...entry,
                destination: trip.destination,
                departDate: trip.departDate,
                returnDate: trip.returnDate,
                treatmentsNeeded: trip.treatmentsNeeded,
                preferredDays: trip.preferredDays,
                preferredTime: trip.preferredTime,
                contactPhone: trip.contactPhone,
                emergencyContact: trip.emergencyContact,
                insurance: trip.insurance,
                notes: trip.notes,
                updatedAt: new Date().toISOString(),
              }
            : entry,
        ),
      ),
    [mutate],
  );

  const requestTimeChange = useCallback(
    (id: string, request: TimeChangeRequest) =>
      mutate((current) => rules.requestTimeChange(current, id, request)),
    [mutate],
  );

  const withdrawTimeChange = useCallback(
    (id: string) => mutate((current) => rules.withdrawTimeChange(current, id)),
    [mutate],
  );

  const resolveTimeChange = useCallback(
    (id: string, reply: string) =>
      mutate((current) => rules.resolveTimeChange(current, id, reply)),
    [mutate],
  );

  const attachFile = useCallback(
    (id: string, file: TravelDocumentFile) =>
      mutate((current) => rules.attachDocumentFile(current, id, file)),
    [mutate],
  );

  const removeFile = useCallback(
    (id: string, fileId: string) =>
      mutate((current) => rules.removeDocumentFile(current, id, fileId)),
    [mutate],
  );

  const setPrep = useCallback(
    (id: string, prepDone: TravelPrepKey[]) =>
      mutate((current) =>
        current.map((trip) => (trip.id === id ? { ...trip, prepDone } : trip)),
      ),
    [mutate],
  );

  const setDocuments = useCallback(
    (id: string, documentsReady: TravelDocumentKey[]) =>
      mutate((current) =>
        current.map((trip) =>
          trip.id === id ? { ...trip, documentsReady } : trip,
        ),
      ),
    [mutate],
  );

  /* ---- facility side. None of this is reachable from a member screen. --- */

  const setPlacement = useCallback(
    (id: string, placement: TripPlacement) =>
      mutate((current) => rules.setPlacement(current, id, placement)),
    [mutate],
  );

  const setFacilityNote = useCallback(
    (id: string, note: string) =>
      mutate((current) => rules.setFacilityNote(current, id, note)),
    [mutate],
  );

  const sorted = useMemo(() => rules.sortTrips(trips), [trips]);

  return {
    trips: sorted,
    openTrips: useMemo(() => sorted.filter(rules.isOpen), [sorted]),

    upcoming: useMemo(() => rules.upcomingTrips(trips), [trips]),
    past: useMemo(() => rules.pastTrips(trips), [trips]),

    submit,
    update,
    cancel,
    setDocuments,
    setPrep,
    attachFile,
    removeFile,

    requestTimeChange,
    withdrawTimeChange,
    resolveTimeChange,

    setStatus,
    setPlacement,
    setFacilityNote,

    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    /* A request that failed to send is worth an alert the member must
       dismiss: they are about to travel believing it is handled. */
    saveError: write.error,
    dismissSaveError: reset,
    isSaving: write.isPending,
  };
}

/** What the facility screen takes. */
export type TripsApi = ReturnType<typeof useTrips>;
