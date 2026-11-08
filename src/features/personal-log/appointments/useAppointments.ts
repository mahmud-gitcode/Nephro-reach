"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toDay } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import {
  createAppointment,
  fromApiAppointment,
  listAppointmentsAhead,
  listAppointmentsBetween,
  markAppointmentRescheduled,
  PAST_WINDOW_DAYS,
  removeAppointment,
  setAppointmentAttendance,
  toAppointmentBody,
  updateAppointment,
} from "./appointments.repository";
import type * as rules from "./appointments";

/* ==========================================================================
   The member's appointments, from the API (P15c, INT-P15-1)
   --------------------------------------------------------------------------
   The patient is the portal context's scope: the member's own record, or
   the patient a caregiver acts for under a grant that covers personal logs
   (the server checks it; a 403 is the shared "not shared with you" state,
   never an empty list). No scope reads nothing. Every change is one call
   and the list is read again afterwards, so what shows is the server's.
   Nothing is kept in browser storage (`nr:member-appointments` is retired
   and purged, lib/data/legacyPurge).
   ========================================================================== */

const NO_APPOINTMENTS: rules.Appointment[] = [];

function daysBefore(day: string, days: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return toDay(new Date(y, m - 1, d - days));
}

/** What is ahead and the past year, as one list (ids are unique). */
async function readAppointments(
  scope: PatientScope,
  today: string,
): Promise<rules.Appointment[]> {
  const [ahead, before] = await Promise.all([
    listAppointmentsAhead(scope, today),
    listAppointmentsBetween(
      scope,
      daysBefore(today, PAST_WINDOW_DAYS),
      daysBefore(today, 1),
    ),
  ]);
  return [...ahead.items, ...before.items].map(fromApiAppointment);
}

type Change =
  | { kind: "add"; draft: rules.AppointmentDraft }
  | { kind: "update"; id: string; draft: rules.AppointmentDraft }
  | { kind: "attendance"; id: string; attendance: rules.Attendance }
  | { kind: "rescheduled"; id: string }
  | { kind: "remove"; id: string };

function runChange(scope: PatientScope, change: Change): Promise<unknown> {
  switch (change.kind) {
    case "add":
      return createAppointment(scope, toAppointmentBody(change.draft));
    case "update":
      return updateAppointment(
        scope,
        change.id,
        toAppointmentBody(change.draft),
      );
    case "attendance":
      return setAppointmentAttendance(scope, change.id, change.attendance);
    case "rescheduled":
      return markAppointmentRescheduled(scope, change.id);
    case "remove":
      return removeAppointment(scope, change.id);
  }
}

export function useAppointments(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const today = toDay(new Date());
  const featureKey = scopedKey(scope, "appointments");

  const query = useQuery({
    queryKey: scopedKey(scope, "appointments", "window", today),
    queryFn: () => readAppointments(requireScope(scope), today),
  });

  const write = useMutation({
    mutationFn: (change: Change) => runChange(requireScope(scope), change),
    onSettled: () => queryClient.invalidateQueries({ queryKey: featureKey }),
  });

  const { mutate, reset } = write;

  return {
    appointments: query.data ?? NO_APPOINTMENTS,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    saveError: write.error,
    dismissSaveError: reset,
    isSaving: write.isPending,
    add: useCallback(
      (draft: rules.AppointmentDraft) => mutate({ kind: "add", draft }),
      [mutate],
    ),
    setAttendance: useCallback(
      (id: string, attendance: rules.Attendance) =>
        mutate({ kind: "attendance", id, attendance }),
      [mutate],
    ),
    markRescheduled: useCallback(
      (id: string) => mutate({ kind: "rescheduled", id }),
      [mutate],
    ),
    update: useCallback(
      (id: string, draft: rules.AppointmentDraft) =>
        mutate({ kind: "update", id, draft }),
      [mutate],
    ),
    remove: useCallback(
      (id: string) => mutate({ kind: "remove", id }),
      [mutate],
    ),
  };
}
