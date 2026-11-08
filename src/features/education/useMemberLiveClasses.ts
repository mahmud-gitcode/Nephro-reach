"use client";

/* ==========================================================================
   Live classes for the patient (Phase 13)
   --------------------------------------------------------------------------
   The published schedule (no meeting links) and the patient's own
   registrations. One call each to register, cancel a registration, join
   and rate. Joining is attendance: the server records it and, from 30
   minutes before the start until the class ends, answers with the meeting
   link, which the caller opens as a link (noopener), never embedded (D18).
   ========================================================================== */

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import type { PatientScope } from "@/lib/data/queryKeys";
import { fromApiLiveClass } from "@/features/clinic/liveClass.mappers";
import { LIVE_SCHEDULE_KEY } from "@/features/clinic/useLiveClasses";
import {
  attendClass,
  cancelRegistration,
  listLiveSchedule,
  listMyRegistrations,
  rateClass,
  registerForClass,
} from "./liveClasses.repository";

export function myLiveClassesKey(scope: PatientScope | null) {
  return scopedKey(scope, "education", "live-classes");
}

export function useMemberLiveClasses(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();

  const upcomingQuery = useQuery({
    queryKey: [...LIVE_SCHEDULE_KEY, "upcoming"],
    queryFn: () => listLiveSchedule("upcoming", { limit: 50 }),
  });
  const pastQuery = useQuery({
    queryKey: [...LIVE_SCHEDULE_KEY, "past"],
    queryFn: () => listLiveSchedule("past", { limit: 50 }),
  });
  const mineQuery = useQuery({
    queryKey: myLiveClassesKey(scope),
    queryFn: () => listMyRegistrations(requireScope(scope), { limit: 50 }),
    enabled: scope !== null,
  });

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: myLiveClassesKey(scope) }),
      queryClient.invalidateQueries({ queryKey: LIVE_SCHEDULE_KEY }),
    ]);

  const register = useMutation({
    mutationFn: (id: string) => registerForClass(requireScope(scope), id),
    onSuccess: refresh,
  });
  const unregister = useMutation({
    mutationFn: (id: string) => cancelRegistration(requireScope(scope), id),
    onSuccess: refresh,
  });
  const attend = useMutation({
    mutationFn: async (id: string) =>
      (await attendClass(requireScope(scope), id)).joinUrl,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: myLiveClassesKey(scope) }),
  });
  const rate = useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) =>
      rateClass(requireScope(scope), id, rating),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: myLiveClassesKey(scope) }),
  });

  const upcoming = useMemo(
    () =>
      (upcomingQuery.data?.items ?? [])
        .map(fromApiLiveClass)
        .filter((item) => item.status !== "Cancelled"),
    [upcomingQuery.data],
  );
  const past = useMemo(
    () => (pastQuery.data?.items ?? []).map(fromApiLiveClass),
    [pastQuery.data],
  );
  const registrations = useMemo(
    () => mineQuery.data?.items ?? [],
    [mineQuery.data],
  );

  return {
    upcoming,
    past,
    next: upcoming[0],
    recordingCount: past.filter((item) => Boolean(item.recordingUrl)).length,
    /** Whether the registrations could be read (a caregiver without the
     *  education grant cannot: no register or join is offered then). */
    canRegister: mineQuery.isSuccess,
    registrationFor: (liveClassId: string) =>
      registrations.find((entry) => entry.liveClassId === liveClassId),
    register,
    unregister,
    attend,
    rate,
    isPending: upcomingQuery.isPending,
    error: upcomingQuery.error,
    registrationsError: mineQuery.error,
    refetch: () => {
      void upcomingQuery.refetch();
      void mineQuery.refetch();
    },
  };
}
