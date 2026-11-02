"use client";

/* ==========================================================================
   New results from the care team, for the bell and the dashboard (Phase 6)
   --------------------------------------------------------------------------
   One small read: the care team's results the member has not marked seen
   (`GET …/labs?unseen=true`, newest first, one row is enough to say "new
   result from your clinic"). The prototype looked the member up in the
   office's own lab store by a demo MRN; that is gone. Marking them seen is
   the patient's own act (`POST …/labs/seen`), never a caregiver's.
   ========================================================================== */

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { newestFirst } from "./labs.view";
import { listLabResults, markLabsSeen } from "./labs.repository";
import { LABS_FEATURE, useIsPatientSelf } from "./useMemberLabs";

export function useMemberClinicLabs(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const isPatient = useIsPatientSelf();

  const query = useQuery({
    queryKey: scopedKey(scope, LABS_FEATURE, "unseen"),
    queryFn: async () =>
      (
        await listLabResults(
          requireScope(scope),
          { limit: 10 },
          { unseen: true },
        )
      ).items,
  });
  const seen = useMutation({
    mutationFn: () => markLabsSeen(requireScope(scope)),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: scopedKey(scope, LABS_FEATURE),
      }),
  });
  const { mutate } = seen;

  const rows = query.data ?? [];
  const newestRow = newestFirst(rows)[0] ?? null;

  return {
    /** The newest unseen result's draw day, or null. */
    newest: newestRow ? { date: newestRow.collectedOn.slice(0, 10) } : null,
    unseen: rows.length > 0,
    isPending: query.isPending,
    error: query.error,
    isError: query.isError,
    refetch: () => void query.refetch(),
    canMarkSeen: isPatient,
    markSeen: useCallback(() => {
      if (isPatient) mutate();
    }, [isPatient, mutate]),
  };
}
