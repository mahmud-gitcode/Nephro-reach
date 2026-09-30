"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import * as rules from "./staff";
import { listStaff, saveStaff } from "./staff.repository";

export const staffKey = ["staff", "accounts"] as const;

/** The staff accounts, for the admin's Staff Accounts page. */
export function useStaffAccounts() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: staffKey, queryFn: listStaff });

  const write = useMutation({
    mutationFn: async (
      transform: (current: rules.StaffAccount[]) => rules.StaffAccount[],
    ) => saveStaff(transform(await listStaff())),
    onSuccess: (accounts) => queryClient.setQueryData(staffKey, accounts),
  });

  const { mutate } = write;
  const accounts = useMemo(() => query.data ?? [], [query.data]);

  return {
    accounts,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    writeError: write.error,
    clearWriteError: write.reset,
    isSaving: write.isPending,
    add: useCallback(
      (draft: rules.StaffDraft) =>
        mutate((current) => rules.addStaff(current, draft, Date.now())),
      [mutate],
    ),
    update: useCallback(
      (id: string, change: Parameters<typeof rules.updateStaff>[2]) =>
        mutate((current) => rules.updateStaff(current, id, change)),
      [mutate],
    ),
  };
}

/** Whether the signed-in user's role allows something. Outside a session
 *  provider (a screen rendered on its own in a test) nothing is withheld:
 *  the app itself always has one. */
export function useCan(permission: rules.Permission): boolean {
  const auth = useOptionalAuth();
  if (!auth) return true;
  return rules.userCan(auth.user, permission);
}
