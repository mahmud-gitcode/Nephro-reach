"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import {
  addUser,
  defaultSettingsActions,
  normaliseSettingsActions,
  removeUser,
  resendInvite,
  setUserStatus,
  type OfficeRole,
  type SettingsActions,
  type SharingId,
  type TwoFactorMethod,
} from "./settings.actions";

/* ==========================================================================
   Clinic Settings — local state for the page's actions
   --------------------------------------------------------------------------
   One key for the roster, the security record and the sharing choices. They
   are all the same record — how this office is set up — and splitting them
   would mean three reads to render one page.

   Deliberately separate from `useClinicSettings`, which holds the profile,
   notifications and preferences the existing form already saves. Merging
   them would make every user added rewrite the office's address.
   ========================================================================== */

const ACTIONS_KEY = storageKey("clinic-settings-actions");
const QUERY_KEY = ["clinic-settings-actions"];

async function readActions(): Promise<SettingsActions> {
  return normaliseSettingsActions(await readJson<unknown>(ACTIONS_KEY, null));
}

export function useSettingsActions() {
  const queryClient = useQueryClient();

  const actionsQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: readActions,
  });

  const write = useMutation({
    mutationFn: async (
      transform: (current: SettingsActions) => SettingsActions,
    ) => {
      const next = transform(await readActions());
      return writeJson(ACTIONS_KEY, {
        ...next,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: (actions) => queryClient.setQueryData(QUERY_KEY, actions),
  });

  const actions = actionsQuery.data ?? defaultSettingsActions();
  const { mutate } = write;

  return {
    actions,
    users: actions.users,
    security: actions.security,
    sharing: actions.sharing,

    addUser: useCallback(
      (draft: { name: string; email: string; role: OfficeRole }) =>
        mutate((current) => ({
          ...current,
          users: addUser(current.users, draft),
        })),
      [mutate],
    ),
    setUserStatus: useCallback(
      (email: string, status: "Active" | "Pending") =>
        mutate((current) => ({
          ...current,
          users: setUserStatus(current.users, email, status),
        })),
      [mutate],
    ),
    resendInvite: useCallback(
      (email: string) =>
        mutate((current) => ({
          ...current,
          users: resendInvite(current.users, email),
        })),
      [mutate],
    ),
    removeUser: useCallback(
      (email: string) =>
        mutate((current) => ({
          ...current,
          users: removeUser(current.users, email),
        })),
      [mutate],
    ),

    changePassword: useCallback(
      () =>
        mutate((current) => ({
          ...current,
          security: {
            ...current.security,
            passwordChangedAt: new Date().toISOString(),
          },
        })),
      [mutate],
    ),
    setTwoFactor: useCallback(
      (method: TwoFactorMethod | null) =>
        mutate((current) => ({
          ...current,
          security: { ...current.security, twoFactor: method },
        })),
      [mutate],
    ),
    signOutSession: useCallback(
      (id: string) =>
        mutate((current) => ({
          ...current,
          security: {
            ...current.security,
            signedOutSessions: [
              ...new Set([...current.security.signedOutSessions, id]),
            ],
          },
        })),
      [mutate],
    ),

    setSharing: useCallback(
      (id: SharingId, on: boolean) =>
        mutate((current) => ({
          ...current,
          sharing: { ...current.sharing, [id]: on },
        })),
      [mutate],
    ),

    isPending: actionsQuery.isPending,
    error: actionsQuery.error,
    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
  };
}

export type SettingsActionsLog = ReturnType<typeof useSettingsActions>;
