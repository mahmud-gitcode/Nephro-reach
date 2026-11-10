"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import {
  canLevel,
  type PermissionContext,
} from "@/features/permissions/permissionMap";
import { orgKey, orgScopeKey } from "@/lib/data/queryKeys";
import { signOut } from "@/lib/data/session";
import * as rules from "./staff";
import * as api from "./staff.api";

/* ==========================================================================
   Staff administration hooks on the API (Phase 3; D3, D4; ADR 0007)
   --------------------------------------------------------------------------
   The organisation is the active office (or platform) context, never a URL
   or a demo organisation. Reads are paged; every write is one server
   operation and invalidates the office's staff, invitation and role reads,
   so the server's answer is what shows. Nothing is kept in browser storage
   (`nr:staff-accounts` and `nr:role-permissions` are retired and purged).
   ========================================================================== */

/** The office or platform context the signed-in user administers. */
export function useAdminContext(): {
  orgId: string | null;
  permissions: PermissionContext | null;
  isOwner: boolean;
  membershipUserId: string | null;
} {
  const user = useOptionalAuth()?.user ?? null;
  return useMemo(() => {
    const permissions = rules.permissionContextOf(user);
    return {
      orgId: permissions ? (user?.organizationId ?? null) : null,
      permissions,
      isOwner: permissions?.isOwner ?? false,
      membershipUserId: user?.id ?? null,
    };
  }, [user]);
}

/** Whether the active context holds `level` on `resource` (per-button). */
export function useCanLevel(resource: string, level: number): boolean {
  const { permissions } = useAdminContext();
  return canLevel(permissions, resource, level);
}

export const staffKeys = {
  staff: (orgId: string, q: api.StaffQuery) => orgKey(orgId, "staff", q),
  invitations: (orgId: string, q: Record<string, unknown>) =>
    orgKey(orgId, "invitations", q),
  roles: (orgId: string) => orgKey(orgId, "roles"),
};

/** `enabled: false` reads nothing: a caller whose user holds no staff read
 *  must not ask for a list the server would refuse (P16d: a care
 *  coordinator opening the CCM activity form got a 403). */
export function useStaffList(
  q: api.StaffQuery,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const { orgId } = useAdminContext();
  const on = orgId !== null && enabled;
  const query = useQuery({
    queryKey: orgId ? staffKeys.staff(orgId, q) : ["org", "none", "staff"],
    queryFn: () => api.listStaff(orgId!, q),
    enabled: on,
  });
  return {
    rows: on ? (query.data?.items ?? []) : [],
    pagination: on ? (query.data?.pagination ?? null) : null,
    isPending: on && query.isPending,
    error: on ? query.error : null,
    refetch: () => void query.refetch(),
  };
}

export function useStaffInvitations(q: {
  status?: api.InvitationStatus;
  page?: number;
}) {
  const { orgId } = useAdminContext();
  const query = useQuery({
    queryKey: orgId
      ? staffKeys.invitations(orgId, q)
      : ["org", "none", "invitations"],
    queryFn: () => api.listInvitations(orgId!, q),
    enabled: orgId !== null,
  });
  return {
    rows: query.data?.items ?? [],
    pagination: query.data?.pagination ?? null,
    isPending: orgId !== null && query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

/** The organisation's roles (needs roles View; a 403 is shown, not hidden). */
export function useRoles(enabled = true) {
  const { orgId } = useAdminContext();
  const query = useQuery({
    queryKey: orgId ? staffKeys.roles(orgId) : ["org", "none", "roles"],
    queryFn: () => api.listRoles(orgId!),
    enabled: enabled && orgId !== null,
  });
  return {
    roles: query.data ?? [],
    isPending: enabled && orgId !== null && query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

/** One mutation runner for every staff, invitation and role write. After a
 *  write the office's reads are invalidated. `endsOwnSession` is for the
 *  writes the server answers by ending the caller's own session (ownership
 *  transfer, spec 025 §3): then nothing is re-read; the user signs in again. */
export function useStaffAdmin() {
  const { orgId } = useAdminContext();
  const queryClient = useQueryClient();
  const write = useMutation({
    mutationFn: async ({
      action,
    }: {
      action: (orgId: string) => Promise<unknown>;
      endsOwnSession?: boolean;
    }) => {
      if (!orgId) throw new Error("No office is open.");
      return action(orgId);
    },
    onSuccess: (_data, { endsOwnSession }) => {
      if (endsOwnSession)
        void signOut({ destination: "/login?reason=access-changed" });
    },
    onSettled: (_data, _error, { endsOwnSession }) => {
      if (orgId && !endsOwnSession)
        void queryClient.invalidateQueries({ queryKey: orgScopeKey(orgId) });
    },
  });
  const { mutateAsync } = write;
  return {
    isSaving: write.isPending,
    run: useCallback(
      (action: (orgId: string) => Promise<unknown>, endsOwnSession = false) =>
        mutateAsync({ action, endsOwnSession }),
      [mutateAsync],
    ),
  };
}

/* ------------------------------------------------------------------------
   For screens of other lanes that still list the office's colleagues
   (clinic settings export, team messages): the API's first page, in the
   prototype's shape. `orgId` is the demo organisation those screens still
   compare against (staff.ts organizationFor); they move to their own API
   reads in their phases. No password, no local copy.
   ------------------------------------------------------------------------ */

export type StaffAccount = {
  id: string;
  name: string;
  email: string;
  orgId: string;
  role: string;
  status: "Active" | "Deactivated";
  createdAt: string;
};

export function useStaffAccounts() {
  const user = useOptionalAuth()?.user ?? null;
  const { orgId, permissions } = useAdminContext();
  const allowed = canLevel(permissions, "staff", 1);
  const query = useQuery({
    queryKey: orgId
      ? staffKeys.staff(orgId, { page: 1, limit: 150 })
      : ["org", "none", "staff"],
    queryFn: () => api.listStaff(orgId!, { page: 1, limit: 150 }),
    enabled: orgId !== null && allowed,
  });
  const demoOrg = rules.organizationFor(user)?.id ?? orgId ?? "";
  const accounts = useMemo<StaffAccount[]>(
    () =>
      (query.data?.items ?? []).map((m) => ({
        id: m.id,
        name: m.name ?? m.email ?? "",
        email: m.email ?? "",
        orgId: demoOrg,
        role: m.role,
        status: m.status === "ACTIVE" ? "Active" : "Deactivated",
        createdAt: m.createdAt,
      })),
    [query.data, demoOrg],
  );
  return {
    accounts,
    isPending: allowed && query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

/** Whether the signed-in user's context allows a page permission. Outside
 *  a session provider (a screen rendered on its own in a test) nothing is
 *  withheld: the app itself always has one, and the server decides. */
export function useCan(permission: rules.Permission): boolean {
  const auth = useOptionalAuth();
  if (!auth) return true;
  return rules.userCan(auth.user, permission);
}
