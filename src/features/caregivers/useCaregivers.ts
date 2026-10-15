"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CAREGIVER_GRANTS_KEY,
  caregiverViewing,
  readJson,
  setCaregiverViewing,
  writeJson,
} from "@/lib/data/storage";
import { useAuth, useOptionalAuth } from "@/features/auth/AuthContext";
import { DEMO_MEMBER_EMAIL, DEMO_MEMBER_NAME } from "@/lib/data/demoIdentity";
import * as rules from "./caregivers.data";
import type { CaregiverState } from "./caregivers.data";

/* ==========================================================================
   Caregivers — storage
   --------------------------------------------------------------------------
   One shared record: the patient writes the invites, the caregiver
   accepts. Here the screens filter; with a server the grant is checked on
   every request the caregiver makes.
   ========================================================================== */

const KEY = CAREGIVER_GRANTS_KEY;
export const caregiversKey = ["caregivers", "grants"] as const;
/* 2: full access and several patients (2026-10-14). 3: Grace has a login. */
const VERSION = 4;

type Envelope = { version: number; state: CaregiverState };

const CAREGIVER = {
  caregiverEmail: "caregiver@nephroreach.com",
  caregiverName: "Sarah Taylor",
};

/** The demo: Sarah looks after her father John and her grandmother. */
function seed(now: number): CaregiverState {
  const day = 24 * 60 * 60 * 1000;
  const at = (days: number) => new Date(now - days * day).toISOString();
  return {
    grants: [
      {
        ...CAREGIVER,
        id: "cg-demo-john",
        patientEmail: DEMO_MEMBER_EMAIL,
        patientName: DEMO_MEMBER_NAME,
        relationship: "Daughter",
        status: "active",
        invitedAt: at(9),
        acceptedAt: at(8.9),
        activity: [
          { at: at(2), action: "Opened Medications" },
          { at: at(8.9), action: "Accepted" },
          { at: at(9), action: "Invited" },
        ],
      },
      {
        ...CAREGIVER,
        id: "cg-demo-grace",
        patientEmail: "grace@nephroreach.com",
        patientName: "Grace Taylor",
        relationship: "Grandchild",
        status: "active",
        invitedAt: at(20),
        acceptedAt: at(19),
        activity: [
          { at: at(19), action: "Accepted" },
          { at: at(20), action: "Invited" },
        ],
      },
    ],
  };
}

async function readState(): Promise<CaregiverState> {
  const stored = await readJson<Partial<Envelope> | null>(KEY, null);
  if (
    stored &&
    stored.version === VERSION &&
    Array.isArray(stored.state?.grants)
  ) {
    return stored.state;
  }
  const seeded = seed(Date.now());
  await writeJson(KEY, { version: VERSION, state: seeded });
  return seeded;
}

const EMPTY: CaregiverState = { grants: [] };

function useCaregiverStore() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: caregiversKey, queryFn: readState });
  const write = useMutation({
    mutationFn: async (transform: (s: CaregiverState) => CaregiverState) => {
      const next = transform(await readState());
      await writeJson(KEY, { version: VERSION, state: next });
      return next;
    },
    onSuccess: (state) => queryClient.setQueryData(caregiversKey, state),
  });
  return {
    state: query.data ?? EMPTY,
    isPending: query.isPending,
    mutate: write.mutate,
    mutateAsync: write.mutateAsync,
    isSaving: write.isPending,
    saveError: write.error,
  };
}

/** The signed-in patient's caregivers: invite and remove. */
export function useMyCaregivers() {
  const { user } = useAuth();
  const store = useCaregiverStore();
  const { mutate, mutateAsync } = store;
  const email = user?.role === "user" ? user.email : "";
  const patient = useMemo(
    () => ({ email, name: user?.name ?? "" }),
    [email, user?.name],
  );

  return {
    isPending: store.isPending,
    isSaving: store.isSaving,
    saveError: store.saveError,
    state: store.state,
    patientEmail: email,
    caregivers: useMemo(
      () => (email ? rules.grantsForPatient(store.state, email) : []),
      [store.state, email],
    ),
    invite: useCallback(
      async (draft: rules.InviteDraft) => {
        let id = "";
        await mutateAsync((s) => {
          const result = rules.invite(s, patient, draft, Date.now());
          id = result.grant.id;
          return result.state;
        });
        return id;
      },
      [mutateAsync, patient],
    ),
    remove: useCallback(
      (id: string) => mutate((s) => rules.remove(s, id, Date.now())),
      [mutate],
    ),
  };
}

/* The patient this caregiver is acting for. A query, so the switcher, the
   menu and every page read one answer, and a switch reaches all of them. */
const viewingKey = (email: string) => ["caregivers", "viewing", email] as const;

/** The signed-in caregiver: their patients, invites, and who they act for. */
export function useCaregiverView() {
  const user = useOptionalAuth()?.user;
  const queryClient = useQueryClient();
  const store = useCaregiverStore();
  const { mutate, mutateAsync } = store;
  const email = user?.role === "caregiver" ? user.email : "";

  const viewingQuery = useQuery({
    queryKey: viewingKey(email),
    queryFn: () => (email ? caregiverViewing(email) : null),
    enabled: !!email,
  });

  const grants = useMemo(
    () => (email ? rules.grantsForCaregiver(store.state, email) : []),
    [store.state, email],
  );
  const grant = rules.activeGrant(
    store.state,
    email,
    viewingQuery.data ?? null,
  );

  /** Switches patient: every screen's cached data belonged to the last one. */
  const choose = useCallback(
    async (patientEmail: string | null) => {
      if (!email) return;
      setCaregiverViewing(email, patientEmail);
      await queryClient.resetQueries();
    },
    [email, queryClient],
  );

  return {
    isCaregiver: !!email,
    isPending: !!email && (store.isPending || viewingQuery.isPending),
    isSaving: store.isSaving,
    saveError: store.saveError,
    pending: useMemo(
      () => grants.filter((g) => g.status === "pending"),
      [grants],
    ),
    patients: useMemo(
      () => grants.filter((g) => g.status === "active"),
      [grants],
    ),
    grant,
    choose,
    accept: useCallback(
      (id: string) => mutateAsync((s) => rules.accept(s, id, Date.now())),
      [mutateAsync],
    ),
    decline: useCallback(
      (id: string) =>
        mutate((s) => rules.remove(s, id, Date.now(), "Declined")),
      [mutate],
    ),
    log: useCallback(
      (id: string, action: string) =>
        mutate((s) => rules.logActivity(s, id, action, Date.now())),
      [mutate],
    ),
  };
}

/** An invite, read by its id from the link the patient sent. */
export function useCaregiverInvite(id: string) {
  const store = useCaregiverStore();
  const { mutateAsync } = store;
  return {
    isPending: store.isPending,
    grant: store.state.grants.find((g) => g.id === id),
    accept: useCallback(
      () => mutateAsync((s) => rules.accept(s, id, Date.now())),
      [mutateAsync, id],
    ),
  };
}
