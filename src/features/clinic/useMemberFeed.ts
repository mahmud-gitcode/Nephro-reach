"use client";

import { useMemo } from "react";
import { useCustomLabResult } from "@/features/labs/useCustomLabResult";
import { useMedicationLog } from "@/features/medications/useMedicationLog";
import { useMessages } from "@/features/messaging/useMessages";
import { useCheckIns } from "@/features/personal-log/check-in/useCheckIns";
import { useClinicNotices } from "@/features/personal-log/check-in/useClinicNotices";
import { memberCheckInRows, memberInbox } from "./memberFeed";

/**
 * What the linked member's app has raised for the clinic: inbox items and
 * check-in rows (rules in memberFeed.ts).
 *
 * The one seam between the clinic and a patient's data. Today it composes
 * the member's own hooks, which read this browser's storage, so the clinic
 * sees what the member entered in the same browser. With a server this
 * becomes one request for the clinic's patients, and the pages using it do
 * not change.
 */
export function useMemberFeed(now: number, today: string, program: string) {
  const messages = useMessages();
  const lab = useCustomLabResult();
  const meds = useMedicationLog();
  const checkIns = useCheckIns();
  const notices = useClinicNotices();

  const inbox = useMemo(
    () =>
      memberInbox(
        {
          conversations: messages.conversations,
          labResult: lab.result,
          sideEffects: meds.sideEffects,
          doses: meds.doses,
          notices: notices.notices,
          checkIns: checkIns.entries,
        },
        now,
        today,
      ),
    [
      messages.conversations,
      lab.result,
      meds.sideEffects,
      meds.doses,
      notices.notices,
      checkIns.entries,
      now,
      today,
    ],
  );

  const checkInRows = useMemo(
    () =>
      memberCheckInRows(
        { checkIns: checkIns.entries, notices: notices.notices },
        program,
        today,
      ),
    [checkIns.entries, notices.notices, program, today],
  );

  return {
    inbox,
    checkInRows,
    /* Until the check-ins have loaded, "no check-in for a week" would be a
       false Missed row. */
    isPending: checkIns.isPending || notices.isPending,
  };
}
