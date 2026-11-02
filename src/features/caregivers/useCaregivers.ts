"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useOptionalAuth } from "@/features/auth/AuthContext";
import { patientKey, type PatientScope } from "@/lib/data/queryKeys";
import * as api from "./caregivers.api";
import {
  customMapFor,
  fromContext,
  journalMap,
  type CaregivingPatient,
} from "./caregivers.mapping";

/* ==========================================================================
   Caregivers: hooks on the API (Phase 3, D1; ADR 0007)
   --------------------------------------------------------------------------
   - The patient (their own portal) reads and changes their caregivers and
     waiting invitations, one server operation per action; every write
     invalidates the lists so the server's answer is what shows.
   - The caregiver's patients come from `GET /me/context` (`caregiving[]`):
     the patient they act for is the portal context, chosen through
     AuthContext.enterContext, which clears every cached query, so a switch
     never shows the previous patient's data.
   Nothing is kept in browser storage (the old `nr:caregiver-grants` and
   `nr:caregiver-viewing:*` keys are retired and purged).
   ========================================================================== */

/** The signed-in patient's own scope, or null in any other context. */
function useOwnPatientScope(): PatientScope | null {
  const user = useOptionalAuth()?.user;
  return user?.role === "user" && user.patientId
    ? { patientId: user.patientId, organizationId: null }
    : null;
}

export const caregiverKeys = {
  grants: (scope: PatientScope) =>
    patientKey(scope, "caregivers", { status: "ACTIVE" }),
  invitations: (scope: PatientScope) =>
    patientKey(scope, "caregiver-invitations", { status: "PENDING" }),
  activity: (scope: PatientScope, grantId: string, page: number) =>
    patientKey(scope, "caregivers", grantId, "activity", { page }),
  all: (scope: PatientScope) => patientKey(scope, "caregivers"),
  allInvitations: (scope: PatientScope) =>
    patientKey(scope, "caregiver-invitations"),
};

/** The signed-in patient's caregivers: invite, change, revoke. */
export function useMyCaregivers() {
  const scope = useOwnPatientScope();
  const queryClient = useQueryClient();
  const enabled = scope !== null;

  const grants = useQuery({
    queryKey: scope ? caregiverKeys.grants(scope) : ["caregivers", "none"],
    queryFn: () => api.listCaregivers(scope!.patientId, { status: "ACTIVE" }),
    enabled,
  });
  const invitations = useQuery({
    queryKey: scope
      ? caregiverKeys.invitations(scope)
      : ["caregiver-invitations", "none"],
    queryFn: () =>
      api.listCaregiverInvitations(scope!.patientId, { status: "PENDING" }),
    enabled,
  });

  const refresh = useCallback(async () => {
    if (!scope) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: caregiverKeys.all(scope) }),
      queryClient.invalidateQueries({
        queryKey: caregiverKeys.allInvitations(scope),
      }),
    ]);
  }, [queryClient, scope]);

  const write = useMutation({
    mutationFn: async (action: (patientId: string) => Promise<unknown>) => {
      if (!scope) throw new Error("No patient record in this context.");
      return action(scope.patientId);
    },
    onSettled: refresh,
  });
  const { mutateAsync } = write;

  return {
    scope,
    grants: useMemo(() => grants.data?.items ?? [], [grants.data]),
    invitations: useMemo(
      () => invitations.data?.items ?? [],
      [invitations.data],
    ),
    isPending: enabled && (grants.isPending || invitations.isPending),
    error: grants.error ?? invitations.error,
    refetch: () => {
      void grants.refetch();
      void invitations.refetch();
    },
    isSaving: write.isPending,
    saveError: write.error,
    clearSaveError: write.reset,
    invite: useCallback(
      (body: api.InviteCaregiverBody) =>
        mutateAsync((pid) => api.inviteCaregiver(pid, body)),
      [mutateAsync],
    ),
    revokeGrant: useCallback(
      (grantId: string) =>
        mutateAsync((pid) => api.revokeCaregiver(pid, grantId)),
      [mutateAsync],
    ),
    revokeInvitation: useCallback(
      (id: string) =>
        mutateAsync((pid) => api.revokeCaregiverInvitation(pid, id)),
      [mutateAsync],
    ),
    resendInvitation: useCallback(
      (id: string) =>
        mutateAsync((pid) => api.resendCaregiverInvitation(pid, id)),
      [mutateAsync],
    ),
    /** A named preset, or a custom map (other keys kept as they are). */
    changeAccess: useCallback(
      (
        grant: api.CaregiverGrant,
        preset: api.CaregiverPreset,
        edited?: api.CaregiverPermissions,
      ) =>
        mutateAsync((pid) =>
          api.updateCaregiver(
            pid,
            grant.id,
            preset,
            preset === "custom"
              ? customMapFor(grant.permissions, edited ?? {})
              : undefined,
          ),
        ),
      [mutateAsync],
    ),
    /** The separate journal permission (D1): always a custom map. */
    setJournal: useCallback(
      (grant: api.CaregiverGrant, open: boolean) =>
        mutateAsync((pid) =>
          api.updateCaregiver(
            pid,
            grant.id,
            "custom",
            journalMap(grant.permissions, open),
          ),
        ),
      [mutateAsync],
    ),
  };
}

/** One page of what a caregiver did in the patient's records (server audit,
 *  recorded under the caregiver's own identity). */
export function useCaregiverActivity(grantId: string, page = 1) {
  const scope = useOwnPatientScope();
  const query = useQuery({
    queryKey: scope
      ? caregiverKeys.activity(scope, grantId, page)
      : ["caregiver-activity", "none"],
    queryFn: () =>
      api.caregiverActivity(scope!.patientId, grantId, { page, limit: 5 }),
    enabled: scope !== null,
  });
  return {
    rows: query.data?.items ?? [],
    hasMore: query.data?.pagination?.hasNext ?? false,
    isPending: scope !== null && query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

/**
 * The signed-in caregiver: the patients they look after (from
 * `/me/context`), the one they are acting for (the portal context), and the
 * switch. Outside a caregiver context everything is empty.
 */
export function useCaregiverView() {
  const auth = useOptionalAuth();
  const context = auth?.context ?? null;
  const choice = auth?.choice ?? null;
  const enterContext = auth?.enterContext;
  const isCaregiver = auth?.user?.role === "caregiver";

  const patients = useMemo<CaregivingPatient[]>(
    () => (isCaregiver && context ? context.caregiving.map(fromContext) : []),
    [isCaregiver, context],
  );
  const grant = useMemo(() => {
    if (!isCaregiver || choice?.kind !== "caregiver" || !choice.grantId)
      return null;
    return patients.find((p) => p.grantId === choice.grantId) ?? null;
  }, [isCaregiver, choice, patients]);

  /** Act for this patient: a new portal context, with the caches cleared. */
  const choose = useCallback(
    (grantId: string | null): boolean =>
      enterContext ? enterContext({ kind: "caregiver", grantId }) : false,
    [enterContext],
  );

  /** Re-read `/me/context` (after accepting an invitation). */
  const refreshContext = auth?.refreshContext;
  const refresh = useCallback(
    async () => (refreshContext ? refreshContext() : null),
    [refreshContext],
  );

  return { isCaregiver, isPending: false, patients, grant, choose, refresh };
}

/** The caregiver leaves a patient's care (their own choice). */
export function useLeaveCaregiving() {
  const { refreshContext } = useAuth();
  return useMutation({
    mutationFn: (grantId: string) => api.leaveCaregiving(grantId),
    onSuccess: async () => {
      await refreshContext();
    },
  });
}

/** Invitations addressed to the signed-in account's verified email. */
export function useMyInvitations() {
  const auth = useOptionalAuth();
  const queryClient = useQueryClient();
  const signedIn = auth?.status === "signed-in";
  const query = useQuery({
    queryKey: ["me", "invitations"],
    queryFn: api.myInvitations,
    enabled: signedIn,
  });
  const respond = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      accept ? api.acceptMyInvitation(id) : api.declineMyInvitation(id),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["me", "invitations"] }),
  });
  return {
    invitations: (query.data ?? []).filter((i) => i.status === "PENDING"),
    isPending: signedIn && query.isPending,
    error: query.error,
    respond,
  };
}
