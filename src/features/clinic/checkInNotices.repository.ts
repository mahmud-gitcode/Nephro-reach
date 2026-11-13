/* ==========================================================================
   Office check-in notices and summaries on the API (Phase 9; ADR 0007)
   --------------------------------------------------------------------------
   - Notices: what members asked to reach this office from a check-in
     (/organizations/{orgId}/check-in-notices). Opening one reads the
     check-in behind it (needs the check-ins share: 403 otherwise) and marks
     the notice seen on the server.
   - Check-in summary (/check-ins/summary, spec 034): counts and dates per
     patient who shares check-ins, nothing clinical. The "at risk" and
     "missed" labels are NOT computed here or on the server (D28 open).
   - ER-visit summary (/er-visits/summary, spec 034): weeks answered and
     weeks with a self-reported ER visit per patient. A log, never triage.
   Every list is paged; counts come from the server or from a list the
   server returned whole, never from guessing.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type Page } from "@/lib/api/paging";
import { asOffice, officePath } from "./officeContext";

export const NOTICE_REASONS = [
  "missed-treatment",
  "severe-symptoms",
  "rough-day",
  "member-requested",
] as const;
export type NoticeReason = (typeof NOTICE_REASONS)[number];

export const NOTICE_REASON_LABEL: Record<NoticeReason, string> = {
  "missed-treatment": "Missed treatment",
  "severe-symptoms": "Severe symptoms",
  "rough-day": "Rough day",
  "member-requested": "Member asked for a call",
};

const NOTICE_REASON_LABEL_ES: Record<NoticeReason, string> = {
  "missed-treatment": "Tratamiento omitido",
  "severe-symptoms": "Síntomas graves",
  "rough-day": "Día difícil",
  "member-requested": "El miembro pidió una llamada",
};

/** A reason the server sent; an unknown one is shown as sent. */
export function noticeReasonLabel(reason: string): string {
  return NOTICE_REASON_LABEL[reason as NoticeReason] ?? reason;
}

/** noticeReasonLabel in the page's language (Spanish when `isEs`). */
export function noticeReasonText(reason: string, isEs: boolean): string {
  return isEs
    ? (NOTICE_REASON_LABEL_ES[reason as NoticeReason] ?? reason)
    : noticeReasonLabel(reason);
}

/** CheckInNoticeResponseDto. */
export type CheckInNotice = {
  id: string;
  patientId: string;
  checkInId: string | null;
  firstName: string;
  lastName: string;
  mrn: string | null;
  reasons: string[];
  raisedAt: string;
  /** YYYY-MM-DD: the day it reached the office. */
  deliverOn: string;
  seen: boolean;
  seenAt: string | null;
  seenById: string | null;
};

/** The check-in behind a notice (CheckInResponseDto). Values as typed. */
export type NoticeCheckIn = {
  id: string;
  patientId: string;
  checkInDate: string;
  treatmentDay: boolean;
  feeling: string;
  recoveryWindow: string | null;
  backToNormalAt: string | null;
  energyLevel: number | null;
  resumedActivities: string | null;
  symptoms: string[];
  severity: string;
  bloodPressure: string | null;
  weight: string | null;
  urineOutputMl: string | null;
  appetite: string | null;
  missedTreatment: boolean;
  notes: string;
};

/** OfficeCheckInSummaryResponseDto. */
export type CheckInSummaryRow = {
  patientId: string;
  firstName: string;
  lastName: string;
  mrn: string | null;
  from: string;
  to: string;
  daysInWindow: number;
  checkInDays: number;
  completionPercent: number;
  lastCheckInDate: string | null;
};

/** OfficeErVisitSummaryResponseDto. */
export type ErSummaryRow = {
  patientId: string;
  firstName: string;
  lastName: string;
  mrn: string | null;
  from: string;
  to: string;
  weeksInWindow: number;
  weeksAnswered: number;
  erVisitWeeks: number;
  lastErVisitWeekOf: string | null;
  lastAnsweredAt: string | null;
};

export type Window = { from: string; to: string };

const notices = (orgId: string, rest = "") =>
  officePath(orgId, `/check-in-notices${rest}`);

export function listNotices(
  orgId: string,
  params: {
    seen?: boolean;
    patientId?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<Page<CheckInNotice>> {
  return fetchPage<CheckInNotice>(
    notices(orgId),
    { page: params.page ?? 1, limit: params.limit ?? 25 },
    {
      query: { seen: params.seen, patientId: params.patientId },
      ...asOffice(orgId),
    },
  );
}

export function noticeCheckIn(
  orgId: string,
  noticeId: string,
): Promise<NoticeCheckIn> {
  return api<NoticeCheckIn>(
    notices(orgId, `/${encodeURIComponent(noticeId)}/check-in`),
    asOffice(orgId),
  );
}

export function markNoticeSeen(
  orgId: string,
  noticeId: string,
): Promise<CheckInNotice> {
  return api<CheckInNotice>(
    notices(orgId, `/${encodeURIComponent(noticeId)}/seen`),
    { method: "POST", ...asOffice(orgId) },
  );
}

export function checkInSummary(
  orgId: string,
  window: Window,
  page = 1,
  limit = 150,
): Promise<Page<CheckInSummaryRow>> {
  return fetchPage<CheckInSummaryRow>(
    officePath(orgId, "/check-ins/summary"),
    { page, limit, from: window.from, to: window.to },
    asOffice(orgId),
  );
}

export function erVisitSummary(
  orgId: string,
  window: Window,
  page = 1,
  limit = 150,
): Promise<Page<ErSummaryRow>> {
  return fetchPage<ErSummaryRow>(
    officePath(orgId, "/er-visits/summary"),
    { page, limit, from: window.from, to: window.to },
    asOffice(orgId),
  );
}

/** Whether a page holds every row the server has (so a sum over it is a
 *  true total, not a counted page). */
export function isWholeList(page: Page<unknown> | undefined): boolean {
  if (!page?.pagination) return false;
  const p = page.pagination;
  return p.mode === "offset" && p.total <= page.items.length;
}

/** Sum of a field over a whole list, or null when the list is partial. */
export function wholeSum<T>(
  page: Page<T> | undefined,
  field: (row: T) => number,
): number | null {
  if (!page || !isWholeList(page)) return null;
  return page.items.reduce((sum, row) => sum + field(row), 0);
}

/** The full name a row carries. */
export function nameOf(row: { firstName: string; lastName: string }): string {
  return `${row.firstName} ${row.lastName}`.trim();
}
