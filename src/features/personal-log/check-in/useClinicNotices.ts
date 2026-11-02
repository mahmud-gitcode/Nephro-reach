"use client";

/* ==========================================================================
   Clinic notices: a view over the check-ins (Phase 5)
   --------------------------------------------------------------------------
   The server builds every notice (reasons, the hold to the clinic's next
   open day, delivery) from a check-in saved with `notifyClinic`, using the
   linked dialysis center's settings, and returns it on that check-in. So
   this keeps no store of its own: it reads the notices off the check-ins.
   Raising, withdrawing and keeping a delivered notice all happen through
   saving or deleting the check-in (useCheckIns).
   ========================================================================== */

import { useCallback, useMemo } from "react";
import type { PatientScope } from "@/lib/data/queryKeys";
import * as rules from "./clinicNotice.rules";
import { useCheckIns } from "./useCheckIns";

export function useClinicNotices(explicitScope?: PatientScope | null) {
  const { notices, isPending, error } = useCheckIns(explicitScope);
  const getByDate = useCallback(
    (checkInDate: string) => rules.findNotice(notices, checkInDate),
    [notices],
  );
  return {
    notices,
    pending: useMemo(() => rules.pendingNotices(notices), [notices]),
    getByDate,
    isPending,
    error,
  };
}
