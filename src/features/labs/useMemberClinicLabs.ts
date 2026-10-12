"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { useAuth } from "@/features/auth/AuthContext";
import { useClinicLabs } from "@/features/clinic/useClinicLabs";
import { DEMO_MEMBER_EMAIL, DEMO_MEMBER_MRN } from "@/lib/data/demoIdentity";
import { hasUnseen, latestByPanel, newestUpload } from "./clinicLabs.member";

/* When the member last looked at their labs, so a new clinic upload can be
   announced once and not forever. */
const SEEN_KEY = storageKey("clinic-labs-seen");
const seenKey = ["labs", "clinic-seen"] as const;

/** The clinic's labs on the signed-in member's chart. With a server, the
 *  member's record carries their MRN; in the demo only the demo patient
 *  has one. */
export function useMemberClinicLabs() {
  const { user } = useAuth();
  const store = useClinicLabs();
  const queryClient = useQueryClient();
  const mrn = user?.email === DEMO_MEMBER_EMAIL ? DEMO_MEMBER_MRN : null;

  const seen = useQuery({
    queryKey: seenKey,
    queryFn: () => readJson<string | null>(SEEN_KEY, null),
  });
  const markSeenMutation = useMutation({
    mutationFn: (at: string) => writeJson(SEEN_KEY, at),
    onSuccess: (at) => queryClient.setQueryData(seenKey, at),
  });

  const latest = useMemo(
    () => latestByPanel(store.state, mrn),
    [store.state, mrn],
  );
  const newest = useMemo(
    () => newestUpload(store.state, mrn),
    [store.state, mrn],
  );
  const unseen = !seen.isPending && hasUnseen(newest, seen.data ?? null);
  const { mutate } = markSeenMutation;

  return {
    latest,
    newest,
    unseen,
    isPending: store.isPending,
    markSeen: useCallback(() => {
      if (newest) mutate(newest.uploadedAt);
    }, [mutate, newest]),
  };
}
