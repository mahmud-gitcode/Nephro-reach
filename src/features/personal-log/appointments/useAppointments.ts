"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, sampleOr, storageKey, writeJson } from "@/lib/data/storage";
import * as rules from "./appointments";

/* The member's own appointments (member-owned, see lib/data/storage). */
const KEY = storageKey("member-appointments");

async function listAppointments(): Promise<rules.Appointment[]> {
  const stored = await readJson<rules.Appointment[] | null>(KEY, null);
  if (Array.isArray(stored)) return stored;
  const seeded = sampleOr(KEY, rules.seedAppointments(Date.now()), []);
  /* Saved once, so the sample dates do not move on every read. */
  await writeJson(KEY, seeded);
  return seeded;
}

export const appointmentsKey = ["personal-log", "appointments"] as const;

export function useAppointments() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: appointmentsKey,
    queryFn: listAppointments,
  });
  const write = useMutation({
    mutationFn: async (
      transform: (current: rules.Appointment[]) => rules.Appointment[],
    ) => writeJson(KEY, transform(await listAppointments())),
    onSuccess: (list) => queryClient.setQueryData(appointmentsKey, list),
  });
  const { mutate } = write;
  const appointments = useMemo(() => query.data ?? [], [query.data]);

  return {
    appointments,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    saveError: write.error,
    add: useCallback(
      (draft: rules.AppointmentDraft) =>
        mutate((current) => rules.addAppointment(current, draft, Date.now())),
      [mutate],
    ),
    setAttendance: useCallback(
      (id: string, attendance: rules.Attendance) =>
        mutate((current) => rules.setAttendance(current, id, attendance)),
      [mutate],
    ),
    remove: useCallback(
      (id: string) => mutate((current) => rules.removeAppointment(current, id)),
      [mutate],
    ),
  };
}
