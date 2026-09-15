"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listReminders, saveReminders } from "./reminders.repository";
import { removeReminderFor, setReminderTime } from "./reminders.rules";
import type { MedicationReminder } from "./reminders.types";

export type { MedicationReminder, ReminderChannel } from "./reminders.types";
export { reminderFor } from "./reminders.rules";

export const remindersKey = ["medications", "reminders"] as const;

/** A member's medication reminders: when to take what. */
export function useReminders() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: remindersKey,
    queryFn: listReminders,
  });

  const write = useMutation({
    mutationFn: async (
      transform: (current: MedicationReminder[]) => MedicationReminder[],
    ) => saveReminders(transform(await listReminders())),
    onSuccess: (reminders) => queryClient.setQueryData(remindersKey, reminders),
  });

  return {
    reminders: query.data ?? [],
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),

    setTime: (medicationName: string, time: string) =>
      write.mutateAsync((current) =>
        setReminderTime(current, medicationName, time),
      ),
    remove: (medicationName: string) =>
      write.mutateAsync((current) =>
        removeReminderFor(current, medicationName),
      ),
    isSaving: write.isPending,
    saveError: write.error,
    resetSaveError: () => write.reset(),
  };
}
