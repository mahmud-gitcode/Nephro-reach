"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CAREGIVER_GRANTS_KEY,
  caregiverViewing,
  readJson,
  setCaregiverViewing,
  writeJson,
} from "@/lib/data/storage";
import { useAuth } from "@/features/auth/AuthContext";
import { DEMO_MEMBER_EMAIL, DEMO_MEMBER_NAME } from "@/lib/data/demoIdentity";
import * as rules from "./caregivers.data";
import type { CaregiverPermission, CaregiverState } from "./caregivers.data";

/* ==========================================================================
   Caregivers — storage
   --------------------------------------------------------------------------
   One shared record, as the clinic's stores are: the patient writes the
   invites and what each caregiver may see, the caregiver accepts. Here the
   screens filter; with a server the grant is checked on every request.
   ========================================================================== */

const KEY = CAREGIVER_GRANTS_KEY;
export const caregiversKey = ["caregivers", "grants"] as const;
const VERSION = 1;

type Envelope = { version: number; state: CaregiverState };

/** The demo: John Taylor's daughter already looks after him. */
function seed(now: number): CaregiverState {
  const day = 24 * 60 * 60 * 1000;
  const invitedAt = new Date(now - 9 * day).toISOString();
  const acceptedAt = new Date(now - 9 * day + 3 * 60 * 60 * 1000).toISOString();
  return {
    grants: [
      {
        id: "cg-demo-sarah",
        patientEmail: DEMO_MEMBER_EMAIL,
        patientName: DEMO_MEMBER_NAME,
        caregiverEmail: "caregiver@nephroreach.com",
        caregiverName: "Sarah Taylor",
        relationship: "Daughter",
        status: "active",
        permissions: [...rules.DEFAULT_PERMISSIONS],
        invitedAt,
        acceptedAt,
        activity: [
          {
            at: new Date(now - 2 * day).toISOString(),
            action: "Viewed Medications",
          },
          { at: acceptedAt, action: "Accepted" },
          { at: invitedAt, action: "Invited" },
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

/** The signed-in patient's caregivers: invite, share, remove. */
export function useMyCaregivers() {
  const { user } = useAuth();
  const store = useCaregiverStore();
  const { mutate, mutateAsync } = store;
  const email = user?.email ?? "";
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
      () => rules.grantsForPatient(store.state, email),
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
    setPermission: useCallback(
      (id: string, permission: CaregiverPermission, on: boolean) =>
        mutate((s) => rules.setPermission(s, id, permission, on, Date.now())),
      [mutate],
    ),
    remove: useCallback(
      (id: string) => mutate((s) => rules.remove(s, id, Date.now())),
      [mutate],
    ),
  };
}

/* The patient this caregiver is looking at. A query, so the banner, the
   menu and the page all read one answer, and a change reaches all three. */
const viewingKey = (email: string) => ["caregivers", "viewing", email] as const;

/** The signed-in caregiver: their patients, invites, and who they view. */
export function useCaregiverView() {
  const { user } = useAuth();
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
    isPending: store.isPending || viewingQuery.isPending,
    isSaving: store.isSaving,
    saveError: store.saveError,
    grants,
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
    can: useCallback(
      (permission: CaregiverPermission) => rules.can(grant, permission),
      [grant],
    ),
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

/** Records that the caregiver opened a page, at most once an hour each. */
export function useLogCaregiverView(action: string) {
  const { grant, log } = useCaregiverView();
  const done = useRef(false);
  useEffect(() => {
    if (!grant || done.current) return;
    done.current = true;
    const hour = 60 * 60 * 1000;
    const recent = grant.activity.find(
      (a) => a.action === action && Date.now() - Date.parse(a.at) < hour,
    );
    if (!recent) log(grant.id, action);
  }, [grant, action, log]);
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
