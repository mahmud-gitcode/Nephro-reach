/* ==========================================================================
   Office check-ins: pure helpers over the server's data (Phase 9)
   --------------------------------------------------------------------------
   The demo rows, cards, categories, trend and quote that used to live here
   are gone. The page reads:
   - GET /organizations/{orgId}/check-in-notices (what members asked to reach
     the office);
   - GET /organizations/{orgId}/check-ins/summary (spec 034: days with a
     check-in per patient who shares check-ins).
   The "At Risk" and "Missed" labels are not client rules and are not
   computed anywhere (D28 open): the page shows the server's data only.
   ========================================================================== */

import type { Page } from "@/lib/api/paging";
import type { CheckInSummaryRow, Window } from "./checkInNotices.repository";
import { isWholeList } from "./checkInNotices.repository";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dayOf(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Sunday at midnight of the week holding `today` (yyyy-mm-dd). */
export function weekStartOf(today: string): Date {
  const [y, m, d] = today.split("-").map(Number);
  return new Date(y, m - 1, d - new Date(y, m - 1, d).getDay());
}

/** "Sep 27 – Oct 3, 2026": the Sunday-to-Saturday week holding `today`. */
export function weekLabel(today: string): string {
  const start = weekStartOf(today);
  const end = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 6,
  );
  const fmt = (date: Date, year: boolean) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      ...(year ? { year: "numeric" } : {}),
    });
  return `${fmt(start, false)} – ${fmt(end, true)}`;
}

/** This week so far: Sunday to today, as the summary route's window. */
export function weekWindow(today: string): Window {
  return { from: dayOf(weekStartOf(today)), to: today };
}

/** Completion as a whole percent. */
export function completionPct(completed: number, expected: number) {
  if (expected <= 0) return 0;
  return Math.round((completed / expected) * 100);
}

/**
 * The office's check-in days and completion for the window, summed over
 * the server's per-patient rows. Only when the server returned the whole
 * list (otherwise a sum would be a counted page): null then.
 */
export function officeCheckInTotals(
  page: Page<CheckInSummaryRow> | undefined,
): { checkIns: number; expected: number; percent: number } | null {
  if (!page || !isWholeList(page)) return null;
  const checkIns = page.items.reduce((sum, row) => sum + row.checkInDays, 0);
  const expected = page.items.reduce((sum, row) => sum + row.daysInWindow, 0);
  return { checkIns, expected, percent: completionPct(checkIns, expected) };
}

/**
 * Clips text to the first `limit` words, and says whether it did, so the
 * caller knows whether to offer "See more".
 */
export function truncateWords(text: string, limit: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= limit) return { text: text.trim(), truncated: false };
  return { text: `${words.slice(0, limit).join(" ")}…`, truncated: true };
}
