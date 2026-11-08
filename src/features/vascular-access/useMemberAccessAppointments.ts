"use client";

/* ==========================================================================
   The member's access visits for the Appointments page (Phase 10)
   --------------------------------------------------------------------------
   The access centers book these on the API. The Appointments page used to
   copy them into the member's own browser list; now they are read from the
   API (every profile, upcoming only) and only shown beside that list, in
   memory. Nothing from the API is written to browser storage.
   ========================================================================== */

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import type { Appointment } from "@/features/personal-log/appointments/appointments";
import {
  listAppointments,
  type ApiAccessAppointment,
} from "./access.repository";
import { toAppointment } from "./access.mapper";
import { accessKey, useAccessProfiles, useMemberTarget } from "./useAccess";
import { TEAM_LABEL } from "./vascularAccess.data";

export function useMemberAccessAppointments(): {
  appointments: Appointment[];
  isPending: boolean;
  error: unknown;
} {
  const target = useMemberTarget();
  const profiles = useAccessProfiles(target);
  const visits = useQueries({
    queries: profiles.profiles.map((profile) => ({
      queryKey: accessKey(target, profile.id, "appointments", "upcoming"),
      queryFn: () =>
        listAppointments(target!, profile.id, { state: "upcoming", limit: 50 }),
      enabled: !!target,
    })),
    combine: combineVisits,
  });
  const appointments = useMemo(
    () =>
      visits.items
        .map(toAppointment)
        .filter((a) => !a.completed)
        .map((a): Appointment => ({
          id: `va-${a.id}`,
          date: a.date,
          start: a.time,
          end: "",
          title: a.title,
          doctor: TEAM_LABEL[a.team],
          location: a.place,
          address: "",
          notes: "",
          source: "vascular-access",
        })),
    [visits.items],
  );
  return {
    appointments,
    isPending: profiles.isPending || visits.isPending,
    /* No member scope is not an error here: the page has its own list. */
    error: target ? (profiles.error ?? visits.error) : null,
  };
}

type VisitPage = { items: ApiAccessAppointment[] } | undefined;

function combineVisits(
  results: { data: VisitPage; isPending: boolean; error: unknown }[],
) {
  return {
    items: results.flatMap((r) => r.data?.items ?? []),
    isPending: results.some((r) => r.isPending),
    error: results.find((r) => r.error)?.error ?? null,
  };
}
