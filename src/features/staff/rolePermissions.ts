"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import {
  rolesFor,
  setCustomPermissionLookup,
  setCustomRolesLookup,
  type Permission,
  type StaffPortal,
  type StaffRole,
} from "./staff";

/* ==========================================================================
   Roles an organisation sets for itself
   --------------------------------------------------------------------------
   The client (2026-10-13): each organisation's main login creates its own
   roles and decides, role by role, which features are on. The built-in
   roles keep the defaults in staff.ts until changed; a new role starts
   blank or as a copy of another.

   Read synchronously as well, because the menu and every page guard ask
   "may this person…?" during render. With a server this is the server's
   answer, enforced there.
   ========================================================================== */

export type OrgRoleSettings = {
  /** role → the features turned on, for roles changed from the default
   *  and for every role the organisation created. */
  permissions: Record<string, Permission[]>;
  /** Roles the organisation created, in the order they were made. */
  custom: string[];
};

/** orgId → its role settings. */
export type RoleStore = Record<string, OrgRoleSettings>;

export const ROLE_PERMISSIONS_KEY = storageKey("role-permissions");
const queryKey = ["staff", "role-permissions"] as const;

/** Reads what was saved, including the first shape (role → features). */
export function normaliseStore(raw: unknown): RoleStore {
  if (!raw || typeof raw !== "object") return {};
  const out: RoleStore = {};
  for (const [orgId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    const entry = value as Partial<OrgRoleSettings> & Record<string, unknown>;
    if (Array.isArray(entry.custom) && entry.permissions) {
      out[orgId] = {
        permissions: entry.permissions as Record<string, Permission[]>,
        custom: entry.custom.filter((r): r is string => typeof r === "string"),
      };
    } else {
      out[orgId] = {
        permissions: entry as unknown as Record<string, Permission[]>,
        custom: [],
      };
    }
  }
  return out;
}

let cache: RoleStore | null = null;

function readSync(): RoleStore {
  if (cache) return cache;
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ROLE_PERMISSIONS_KEY);
    cache = normaliseStore(raw ? JSON.parse(raw) : {});
  } catch {
    cache = {};
  }
  return cache;
}

setCustomPermissionLookup(
  (orgId, role) => readSync()[orgId]?.permissions[role],
);
setCustomRolesLookup((orgId) => readSync()[orgId]?.custom ?? []);

if (typeof window !== "undefined") {
  /* Another tab saved new choices: read them afresh. */
  window.addEventListener("storage", (event) => {
    if (event.key === ROLE_PERMISSIONS_KEY) cache = null;
  });
}

const orgOf = (store: RoleStore, orgId: string): OrgRoleSettings =>
  store[orgId] ?? { permissions: {}, custom: [] };

/** Set one role's features, or clear them (null) to return to the default. */
export function setRolePermissions(
  store: RoleStore,
  orgId: string,
  role: string,
  permissions: Permission[] | null,
): RoleStore {
  const org = orgOf(store, orgId);
  const next = { ...org.permissions };
  if (permissions === null) delete next[role];
  else next[role] = permissions;
  return { ...store, [orgId]: { ...org, permissions: next } };
}

export type RoleNameError = "empty" | "taken";

/** Why a new role's name cannot be used, or null. */
export function roleNameError(
  store: RoleStore,
  orgId: string,
  portal: StaffPortal,
  name: string,
): RoleNameError | null {
  const clean = name.trim().toLowerCase();
  if (clean.length < 2) return "empty";
  const existing = [...rolesFor(portal), ...orgOf(store, orgId).custom];
  return existing.some((r) => r.toLowerCase() === clean) ? "taken" : null;
}

export function createRole(
  store: RoleStore,
  orgId: string,
  name: string,
  permissions: Permission[],
): RoleStore {
  const org = orgOf(store, orgId);
  const role = name.trim();
  return {
    ...store,
    [orgId]: {
      custom: [...org.custom, role],
      permissions: { ...org.permissions, [role]: permissions },
    },
  };
}

export function deleteRole(
  store: RoleStore,
  orgId: string,
  role: string,
): RoleStore {
  const org = orgOf(store, orgId);
  const permissions = { ...org.permissions };
  delete permissions[role];
  return {
    ...store,
    [orgId]: { custom: org.custom.filter((r) => r !== role), permissions },
  };
}

export function useRolePermissions() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey,
    queryFn: async () =>
      normaliseStore(await readJson<unknown>(ROLE_PERMISSIONS_KEY, {})),
  });
  const write = useMutation({
    mutationFn: async (transform: (store: RoleStore) => RoleStore) =>
      writeJson(
        ROLE_PERMISSIONS_KEY,
        transform(
          normaliseStore(await readJson<unknown>(ROLE_PERMISSIONS_KEY, {})),
        ),
      ),
    onSuccess: (store) => {
      cache = store;
      queryClient.setQueryData(queryKey, store);
    },
  });
  const { mutate } = write;
  return {
    store: query.data ?? {},
    isPending: query.isPending,
    isSaving: write.isPending,
    saveError: write.error,
    set: useCallback(
      (orgId: string, role: StaffRole, permissions: Permission[] | null) =>
        mutate((s) => setRolePermissions(s, orgId, role, permissions)),
      [mutate],
    ),
    create: useCallback(
      (orgId: string, name: string, permissions: Permission[]) =>
        mutate((s) => createRole(s, orgId, name, permissions)),
      [mutate],
    ),
    remove: useCallback(
      (orgId: string, role: string) =>
        mutate((s) => deleteRole(s, orgId, role)),
      [mutate],
    ),
  };
}
