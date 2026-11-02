"use client";

/* ==========================================================================
   Medication reminders, from the API (Phase 6)
   --------------------------------------------------------------------------
   `GET …/reminders?kind=MEDICATION`, one per medication id. Setting times
   for a medication moves its one reminder (PATCH) or creates it (POST);
   no times, or "delete", removes it. Times go out as HH:mm. Whether a
   reminder rings (and the member's mute, D21) is the server's job.
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { usePagedList } from "@/features/profile/usePagedList";
import {
  fromApiReminder,
  toCreateReminderBody,
  toTimes,
  type ApiReminder,
} from "./reminders.mapper";
import {
  createReminder,
  listMedicationReminders,
  removeReminder,
  updateReminder,
} from "./reminders.repository";
import { reminderFor } from "./reminders.rules";
import type { MedicationReminder } from "./reminders.types";
import { MEDICATIONS_FEATURE, medicationsKey } from "./useMedications";

export type { MedicationReminder, ReminderChannel } from "./reminders.types";
export { reminderFor } from "./reminders.rules";

const identity = (raw: ApiReminder) => raw;

/** A member's medication reminders: when to take what. `nameOf` labels
 *  each one with its medication's name (from useMedications). */
export function useReminders(
  explicitScope?: PatientScope | null,
  nameOf?: (medicationId: string) => string,
) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();

  const list = usePagedList({
    scope,
    queryKey: scopedKey(scope, MEDICATIONS_FEATURE, "reminders"),
    params: { limit: 150 },
    fetch: listMedicationReminders,
    map: identity,
  });
  const reminders: MedicationReminder[] = useMemo(
    () => list.items.map((raw) => fromApiReminder(raw, nameOf)),
    [list.items, nameOf],
  );

  const write = useMutation({
    mutationFn: async ({
      medicationId,
      clocks,
    }: {
      medicationId: string;
      /** "08:00 AM" or "20:00"; empty removes the reminder. */
      clocks: string[];
    }) => {
      const target = requireScope(scope);
      const times = toTimes(clocks);
      const existing = reminderFor(reminders, medicationId);
      if (times.length === 0) {
        if (existing) await removeReminder(target, existing.id);
        return null;
      }
      if (existing)
        return updateReminder(target, existing.id, { times, enabled: true });
      return createReminder(target, toCreateReminderBody(medicationId, times));
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: medicationsKey(scope) }),
  });
  const { mutateAsync } = write;

  return {
    reminders,
    isPending: list.isPending,
    error: list.error,
    isError: list.isError,
    refetch: list.refetch,

    setTimes: useCallback(
      (medicationId: string, clocks: string[]) =>
        mutateAsync({ medicationId, clocks }),
      [mutateAsync],
    ),
    setTime: useCallback(
      (medicationId: string, clock: string) =>
        mutateAsync({ medicationId, clocks: [clock] }),
      [mutateAsync],
    ),
    remove: useCallback(
      (medicationId: string) => mutateAsync({ medicationId, clocks: [] }),
      [mutateAsync],
    ),
    isSaving: write.isPending,
    saveError: write.error,
    resetSaveError: () => write.reset(),
  };
}
