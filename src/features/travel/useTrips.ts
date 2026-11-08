"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isApiError } from "@/lib/api/client";
import { combineReads } from "@/lib/data/asyncState";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import {
  officeKey,
  requireOffice,
  useOfficeScope,
} from "@/features/clinic/office.scope";
import * as repo from "./trip.repository";
import { countOf, partial, sumCounts } from "./listWindow";
import * as rules from "./trip.rules";
import {
  toCreateTripBody,
  toOfficeRow,
  toPlacementBody,
  toTrip,
  toTripBody,
  type OfficeTripRow,
} from "./trip.mapping";
import type {
  TimeChangeRequest,
  TravelDocumentKey,
  TravelPrepKey,
  TripPlacement,
  TripRequest,
  TripStatus,
} from "./trip.types";

/* ==========================================================================
   Travel dialysis hooks on the API (Phase 8; ADR 0007)
   --------------------------------------------------------------------------
   Two hooks, two sides, never one list for both:
   - useMemberTrips / useMemberTrip: the member's (or the caregiver's
     patient's) own trips, keyed by patientId with organizationId "self";
     no office header is ever sent.
   - useOfficeTrips / useOfficeTrip: the office inbox, keyed by the office
     picked in the portal.
   Every action is one server operation; after it the hook invalidates the
   list and the detail, so the server's answer is what shows. A failed
   write sets `saveError` (the pages' alert), and the read is refetched so
   a 409 (the facility started on it, a closed trip) shows the truth.

   There is no member delete (D20): only a cancellation request.
   ========================================================================== */

/* ------------------------------------------------------------ member side */

function useMemberTripActions() {
  const scope = usePatientScope();
  const queryClient = useQueryClient();
  const tripsKey = scopedKey(scope, "trips");

  const run = useMutation({
    mutationFn: (op: () => Promise<unknown>) => op(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: tripsKey }),
  });
  const { mutate, mutateAsync, reset } = run;
  const go = useCallback(
    (op: (s: ReturnType<typeof requireScope>) => Promise<unknown>) =>
      mutate(() => op(requireScope(scope))),
    [mutate, scope],
  );

  return {
    scope,
    tripsKey,
    /** Sends a new request. Resolves with the server's message
     *  (`trip_created` or `trip_created_outside`). */
    submit: useCallback(
      (trip: TripRequest) =>
        mutateAsync(() =>
          repo.createTrip(requireScope(scope), toCreateTripBody(trip)),
        ) as Promise<{ message: string | string[] }>,
      [mutateAsync, scope],
    ),
    /** Edits a request the facility has not started on (409 otherwise). */
    update: useCallback(
      (trip: TripRequest) =>
        go((s) => repo.updateTrip(s, trip.id, toTripBody(trip))),
      [go],
    ),
    /* Cancelling sends the dialysis center a request and keeps the trip,
       so the member can show they asked (client, 2026-10-12; D20). */
    requestCancel: useCallback(
      (tripId: string) => go((s) => repo.requestCancellation(s, tripId)),
      [go],
    ),
    setDocuments: useCallback(
      (tripId: string, documentsReady: TravelDocumentKey[]) =>
        go((s) => repo.setChecklist(s, tripId, { documentsReady })),
      [go],
    ),
    setPrep: useCallback(
      (tripId: string, prepDone: TravelPrepKey[]) =>
        go((s) => repo.setChecklist(s, tripId, { prepDone })),
      [go],
    ),
    requestTimeChange: useCallback(
      (tripId: string, request: TimeChangeRequest) =>
        go((s) =>
          repo.requestTimeChange(s, tripId, {
            preferredTime: request.preferredTime,
            preferredDays: request.preferredDays,
            note: request.note.trim(),
          }),
        ),
      [go],
    ),
    /** Withdraws the open request (its id; the answered ones stay). */
    withdrawTimeChange: useCallback(
      (trip: Pick<TripRequest, "id" | "timeChanges">) => {
        const open = trip.timeChanges.find((r) => !r.resolvedAt && r.id);
        if (!open?.id) return;
        const requestId = open.id;
        go((s) => repo.withdrawTimeChange(s, trip.id, requestId));
      },
      [go],
    ),
    /** Uploads through /files and attaches by file id. */
    attachFile: useCallback(
      (tripId: string, key: TravelDocumentKey, file: File) =>
        go((s) => repo.addDocument(s, tripId, key, file)),
      [go],
    ),
    removeFile: useCallback(
      (tripId: string, documentId: string) =>
        go((s) => repo.removeDocument(s, tripId, documentId)),
      [go],
    ),
    /** A short-lived link for one file, fetched on demand, never cached. */
    documentLink: useCallback(
      (tripId: string, documentId: string) =>
        repo.documentLink(requireScope(scope), tripId, documentId),
      [scope],
    ),
    isSaving: run.isPending,
    /* A request that failed to send is worth an alert the member must
       dismiss: they are about to travel believing it is handled. */
    saveError: run.error,
    dismissSaveError: reset,
  };
}

/** The member's trips (one bounded page), plus every member action. */
export function useMemberTrips() {
  const actions = useMemberTripActions();
  const { scope } = actions;
  const query = useQuery({
    queryKey: scopedKey(scope, "trips", "list"),
    queryFn: async () => {
      const page = await repo.listTrips(requireScope(scope));
      return { trips: page.items.map(toTrip), count: countOf(page) };
    },
  });

  const trips = useMemo(() => query.data?.trips ?? [], [query.data]);
  const sorted = useMemo(() => rules.sortTrips(trips), [trips]);

  return {
    ...actions,
    trips: sorted,
    upcoming: useMemo(() => rules.upcomingTrips(trips), [trips]),
    past: useMemo(() => rules.pastTrips(trips), [trips]),
    /** The newest trips only, when the member has more than one read
     *  holds (null: every trip is here). */
    partial: partial(query.data?.count),
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

/** One of the member's trips, read by id (the detail page). */
export function useMemberTrip(tripId: string) {
  const actions = useMemberTripActions();
  const { scope } = actions;
  const query = useQuery({
    queryKey: scopedKey(scope, "trips", "detail", tripId),
    queryFn: async () =>
      toTrip(await repo.getTrip(requireScope(scope), tripId)),
    enabled: tripId !== "",
  });
  return {
    ...actions,
    trip: query.data,
    isPending: tripId !== "" && query.isPending,
    /* A trip that is not this patient's (or no longer exists) is "not
       found", not "broken": the page shows its missing-trip state. */
    notFound: isApiError(query.error, { status: 404 }),
    error: isApiError(query.error, { status: 404 }) ? null : query.error,
    refetch: () => void query.refetch(),
  };
}

/* ------------------------------------------------------------ office side */

/** The office inbox bound: the API's maximum page. */
export const OFFICE_TRIP_WINDOW = 150;

export type OfficeTripFilters = {
  search?: string;
  status?: TripStatus;
};

/**
 * The office's travel inbox, split the way the page shows it:
 * - open: still going on today or later (`from=today`), not closed;
 * - past: ended before today (`before=today`, BE-5) plus closed trips that
 *   are still in their dates.
 * Search and status are server filters (BE-1). Each read is one bounded
 * page of OFFICE_TRIP_WINDOW rows.
 */
export function useOfficeTrips(filters: OfficeTripFilters = {}) {
  const { organizationId } = useOfficeScope();
  const today = rules.todayIso();
  const base = {
    search: filters.search?.trim() || undefined,
    status: filters.status,
    limit: OFFICE_TRIP_WINDOW,
  };
  const read = (q: repo.OfficeTripQuery) => ({
    queryKey: officeKey(organizationId, "trips", "list", q),
    queryFn: async () => {
      const page = await repo.listOrgTrips(requireOffice(organizationId), q);
      return { rows: page.items.map(toOfficeRow), count: countOf(page) };
    },
  });

  const current = useQuery(read({ ...base, from: today }));
  const ended = useQuery(read({ ...base, before: today }));
  /* Closed trips still in their dates belong under Past as well. */
  const closedQuery = { ...base, status: "closed" as const, from: today };
  const closedNow = useQuery({
    ...read(closedQuery),
    enabled: !filters.status || filters.status === "closed",
  });

  const reads = combineReads(current, ended);
  const upcoming = useMemo(
    () => (current.data?.rows ?? []).filter((row) => row.status !== "closed"),
    [current.data],
  );
  const past = useMemo(() => {
    const seen = new Set<string>();
    return [
      ...(closedNow.data?.rows ?? []),
      ...(ended.data?.rows ?? []),
    ].filter((row) => (seen.has(row.id) ? false : (seen.add(row.id), true)));
  }, [closedNow.data, ended.data]);

  return {
    upcoming,
    past,
    /** When a tab holds only the newest requests (null: all of them).
     *  The open read also holds closed trips still in their dates, so its
     *  count is of requests read, not of open ones. */
    openPartial: partial(current.data?.count),
    pastPartial: partial(
      closedNow.data
        ? sumCounts(ended.data?.count, closedNow.data.count)
        : ended.data?.count,
    ),
    isPending: reads.pending,
    error: reads.error,
    refetch: reads.onRetry,
  };
}

export type ArrangementChanges = {
  status?: TripStatus;
  placement?: TripPlacement;
  note?: string;
};

/** Which part of an arrangement did not save (the rest may have). */
export class ArrangementError extends Error {
  readonly part: "placement" | "note" | "status";
  readonly cause: unknown;
  constructor(part: ArrangementError["part"], cause: unknown) {
    super(cause instanceof Error ? cause.message : `The ${part} did not save`);
    this.name = "ArrangementError";
    this.part = part;
    this.cause = cause;
  }
}

/** One trip in the office inbox (the Manage popup), plus its actions. */
export function useOfficeTrip(tripId: string | null) {
  const { organizationId } = useOfficeScope();
  const queryClient = useQueryClient();
  const tripsKey = officeKey(organizationId, "trips");

  const query = useQuery({
    queryKey: officeKey(organizationId, "trips", "detail", tripId ?? ""),
    queryFn: async () =>
      toTrip(await repo.getOrgTrip(requireOffice(organizationId), tripId!)),
    enabled: tripId !== null,
  });

  const run = useMutation({
    mutationFn: (op: () => Promise<unknown>) => op(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: tripsKey }),
  });
  const { mutate, reset } = run;

  /**
   * Saves what changed, in the order the server needs: the placement (a
   * confirmation needs one), the message, then the status. A closed status
   * on a trip the member asked to cancel closes the cancellation instead.
   * An unchanged status is never sent (409 status_unchanged).
   */
  const saveArrangement = useCallback(
    (trip: TripRequest, changes: ArrangementChanges) =>
      mutate(async () => {
        const orgId = requireOffice(organizationId);
        if (changes.placement !== undefined) {
          try {
            await repo.setPlacement(
              orgId,
              trip.id,
              toPlacementBody(changes.placement),
            );
          } catch (error) {
            throw new ArrangementError("placement", error);
          }
        }
        if (changes.note !== undefined) {
          try {
            await repo.setFacilityNote(orgId, trip.id, changes.note);
          } catch (error) {
            throw new ArrangementError("note", error);
          }
        }
        if (changes.status !== undefined && changes.status !== trip.status) {
          try {
            if (changes.status === "closed" && trip.cancelRequestedAt)
              await repo.closeCancellation(orgId, trip.id);
            else await repo.setStatus(orgId, trip.id, changes.status);
          } catch (error) {
            throw new ArrangementError("status", error);
          }
        }
      }),
    [mutate, organizationId],
  );

  /** Answers the open time-change request (needs its id). */
  const resolveTimeChange = useCallback(
    (trip: Pick<TripRequest, "id" | "timeChanges">, reply: string) => {
      const open = trip.timeChanges.find((r) => !r.resolvedAt && r.id);
      if (!open?.id) return;
      const requestId = open.id;
      mutate(() =>
        repo.answerTimeChange(
          requireOffice(organizationId),
          trip.id,
          requestId,
          reply,
        ),
      );
    },
    [mutate, organizationId],
  );

  return {
    trip: query.data ?? null,
    isPending: tripId !== null && query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    saveArrangement,
    resolveTimeChange,
    /** A short-lived link for one of the member's files, never cached. */
    documentLink: (documentId: string) =>
      repo.orgDocumentLink(requireOffice(organizationId), tripId!, documentId),
    isSaving: run.isPending,
    saveError: run.error,
    dismissSaveError: reset,
  };
}

export type { OfficeTripRow };

/** The member-side "not editable any more" answer (the facility started). */
export const isTripNotEditable = (error: unknown) =>
  isApiError(error, { code: "travel.trip_not_editable" });
