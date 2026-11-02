"use client";

/* ==========================================================================
   Blood pressure check times, from the API (Phase 5)
   --------------------------------------------------------------------------
   One BLOOD_PRESSURE reminder per patient (`/patients/:id/reminders`; the
   server refuses a second). Saving times patches it, or creates it when
   there is none; saving no times deletes it. Times are HH:mm, 24-hour, in
   the patient's time zone.
   ========================================================================== */

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { fetchPage } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  patientPath,
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { cleanTimes, type BpReminderTimes } from "./bpReminders";

type ApiReminder = {
  id: string;
  kind: string;
  times: string[];
  enabled: boolean;
};

const base = (scope: PatientScope) => patientPath(scope, "/reminders");

export async function getBpReminder(
  scope: PatientScope,
): Promise<ApiReminder | null> {
  const page = await fetchPage<ApiReminder>(
    base(scope),
    { limit: 10 },
    {
      query: { kind: "BLOOD_PRESSURE" },
    },
  );
  return page.items.find((r) => r.kind === "BLOOD_PRESSURE") ?? null;
}

/** What saving these times does to the one reminder. */
export function reminderWrite(
  current: ApiReminder | null,
  times: BpReminderTimes,
):
  | { kind: "create"; body: Record<string, unknown> }
  | { kind: "update"; id: string; body: { times: string[] } }
  | { kind: "delete"; id: string }
  | { kind: "none" } {
  const clean = cleanTimes(times);
  if (clean.length === 0)
    return current ? { kind: "delete", id: current.id } : { kind: "none" };
  if (current)
    return { kind: "update", id: current.id, body: { times: clean } };
  return {
    kind: "create",
    body: {
      kind: "BLOOD_PRESSURE",
      times: clean,
      channels: ["in_app"],
      enabled: true,
    },
  };
}

export function useBpReminders(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const queryKey = scopedKey(scope, "reminders", "BLOOD_PRESSURE");
  const query = useQuery({
    queryKey,
    queryFn: () => getBpReminder(requireScope(scope)),
  });
  const write = useMutation({
    mutationFn: async (times: BpReminderTimes) => {
      const target = requireScope(scope);
      const next = reminderWrite(query.data ?? null, times);
      const one = (id: string) => `${base(target)}/${encodeURIComponent(id)}`;
      if (next.kind === "create")
        await api(base(target), { method: "POST", body: next.body });
      else if (next.kind === "update")
        await api(one(next.id), { method: "PATCH", body: next.body });
      else if (next.kind === "delete")
        await api(one(next.id), { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  const { mutate } = write;
  return {
    times: query.data ? cleanTimes(query.data.times) : [],
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    save: useCallback(
      (times: BpReminderTimes, onSaved?: () => void) =>
        mutate(times, { onSuccess: () => onSaved?.() }),
      [mutate],
    ),
    isSaving: write.isPending,
    saveError: write.error,
  };
}
