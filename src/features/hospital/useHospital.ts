"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { useAuth } from "@/features/auth/AuthContext";
import { organizationFor } from "@/features/staff/staff";
import * as rules from "./hospital.data";
import type { HospitalState } from "./hospital.data";

/* ==========================================================================
   Hospital — storage
   --------------------------------------------------------------------------
   One shared record, as the clinic's stores are: the hospital writes
   enrollments, the member's classroom writes their progress. With a server
   the hospital reads only its own patients and the member only their own;
   here the screens filter, and the backend has to enforce it.
   ========================================================================== */

const KEY = storageKey("hospital-enrollments");
export const hospitalKey = ["hospital", "enrollments"] as const;
const VERSION = 1;

type Envelope = { version: number; state: HospitalState };

async function readState(): Promise<HospitalState> {
  const stored = await readJson<Partial<Envelope> | null>(KEY, null);
  if (
    stored &&
    stored.version === VERSION &&
    Array.isArray(stored.state?.enrollments)
  ) {
    return stored.state;
  }
  const seeded = rules.seedHospital(Date.now());
  await writeJson(KEY, { version: VERSION, state: seeded });
  return seeded;
}

const EMPTY: HospitalState = { enrollments: [] };

/** The shared store. */
export function useHospitalStore() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: hospitalKey, queryFn: readState });
  const write = useMutation({
    mutationFn: async (transform: (s: HospitalState) => HospitalState) => {
      const next = transform(await readState());
      await writeJson(KEY, { version: VERSION, state: next });
      return next;
    },
    onSuccess: (state) => queryClient.setQueryData(hospitalKey, state),
  });
  return {
    state: query.data ?? EMPTY,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    mutate: write.mutate,
    isSaving: write.isPending,
    saveError: write.error,
  };
}

/** The signed-in hospital's own patients, and what its staff can do. */
export function useHospital() {
  const { user } = useAuth();
  const org = organizationFor(user);
  const hospitalId = org?.portal === "hospital" ? org.id : "";
  const store = useHospitalStore();
  const { mutate } = store;
  const enrollments = useMemo(
    () =>
      rules
        .forHospital(store.state, hospitalId)
        .sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt)),
    [store.state, hospitalId],
  );
  const by = user?.name ?? "Hospital staff";

  return {
    ...store,
    hospitalName: org?.name ?? "",
    enrollments,
    summary: useMemo(() => rules.summarise(enrollments), [enrollments]),
    enroll: useCallback(
      (draft: rules.EnrollmentDraft) =>
        mutate((s) => rules.enroll(s, hospitalId, draft, by, Date.now())),
      [mutate, hospitalId, by],
    ),
    update: useCallback(
      (id: string, change: Parameters<typeof rules.updateEnrollment>[2]) =>
        mutate((s) => rules.updateEnrollment(s, id, change)),
      [mutate],
    ),
  };
}

/** The signed-in member's hospital courses (their own classroom). */
export function useMyHospitalCourses() {
  const { user } = useAuth();
  const store = useHospitalStore();
  const { mutate } = store;
  const email = user?.email ?? "";
  return {
    isPending: store.isPending,
    enrollments: useMemo(
      () => rules.enrollmentsForMember(store.state, email),
      [store.state, email],
    ),
    completeDay: useCallback(
      (
        id: string,
        day: number,
        knowledgeCheck?: rules.DayProgress["knowledgeCheck"],
      ) =>
        mutate((s) =>
          rules.completeDay(s, id, day, Date.now(), knowledgeCheck),
        ),
      [mutate],
    ),
  };
}
