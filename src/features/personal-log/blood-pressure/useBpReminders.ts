"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { cleanTimes, type BpReminderTimes } from "./bpReminders";

/* The member's blood pressure check times (member-owned). */
const KEY = storageKey("bp-reminders");

async function readTimes(): Promise<BpReminderTimes> {
  const stored = await readJson<unknown>(KEY, null);
  return Array.isArray(stored)
    ? cleanTimes(stored.filter((t): t is string => typeof t === "string"))
    : [];
}

export const bpRemindersKey = ["personal-log", "bp-reminders"] as const;

export function useBpReminders() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: bpRemindersKey, queryFn: readTimes });
  const write = useMutation({
    mutationFn: (times: BpReminderTimes) => writeJson(KEY, cleanTimes(times)),
    onSuccess: (times) => queryClient.setQueryData(bpRemindersKey, times),
  });
  const { mutate } = write;
  return {
    times: query.data ?? [],
    isPending: query.isPending,
    save: useCallback((times: BpReminderTimes) => mutate(times), [mutate]),
    isSaving: write.isPending,
    saveError: write.error,
  };
}
