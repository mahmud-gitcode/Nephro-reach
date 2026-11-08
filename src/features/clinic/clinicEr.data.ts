/* ==========================================================================
   ER visits across an office's patients (Phase 9: from the API)
   --------------------------------------------------------------------------
   The client (2026-10-05): the weekly "Have you been to the ER this week?"
   answers feed the office's tracking dashboard, so it sees ER visits for
   all its patients, month to month.

   The numbers come from GET /organizations/{orgId}/er-visits/summary
   (spec 034): per patient who shares ER visits with the office, the weeks
   answered and the weeks answered "yes" in a window. The sample answers
   and the linked demo patient are gone. A log only, never triage.
   ========================================================================== */

import type { Page } from "@/lib/api/paging";
import type { ErSummaryRow, Window } from "./checkInNotices.repository";
import { isWholeList } from "./checkInNotices.repository";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function day(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The last `count` calendar months, oldest first, each as a day window
 *  (the current month ends today). */
export function monthWindows(
  now: number,
  count = 6,
): Array<Window & { month: string }> {
  const today = new Date(now);
  return Array.from({ length: count }, (_, i) => {
    const back = count - 1 - i;
    const first = new Date(today.getFullYear(), today.getMonth() - back, 1);
    const last =
      back === 0
        ? today
        : new Date(today.getFullYear(), today.getMonth() - back + 1, 0);
    return {
      month: `${first.getFullYear()}-${pad(first.getMonth() + 1)}`,
      from: day(first),
      to: day(last),
    };
  });
}

/** The 90 days ending today. */
export function last90Days(now: number): Window {
  const today = new Date(now);
  const from = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 89,
  );
  return { from: day(from), to: day(today) };
}

/** Weeks with a self-reported ER visit across the office, or null when
 *  the server's list was not whole (then no total is claimed). */
export function officeErWeeks(
  page: Page<ErSummaryRow> | undefined,
): number | null {
  if (!page || !isWholeList(page)) return null;
  return page.items.reduce((sum, row) => sum + row.erVisitWeeks, 0);
}

/** Patients with a self-reported ER visit in the window, most first. */
export function patientsWithVisits(rows: ErSummaryRow[]): ErSummaryRow[] {
  return rows
    .filter((row) => row.erVisitWeeks > 0)
    .sort(
      (a, b) =>
        b.erVisitWeeks - a.erVisitWeeks ||
        (b.lastErVisitWeekOf ?? "").localeCompare(a.lastErVisitWeekOf ?? ""),
    );
}
