import { parseIso, todayIso } from "./checkIn.rules";
import type { BetweenTreatmentCheckIn } from "./checkIn.types";
import type { ClinicNotice, ClinicNoticeReason } from "./clinicNotice.types";

/* ==========================================================================
   Clinic notices — pure rules
   --------------------------------------------------------------------------
   Two things decide everything here: whether a day is worth sending, and
   what day it can land on.

   Dialysis centres here close on Sundays. A notice raised on a Sunday has
   nobody to read it, and a queue that delivers anyway teaches the member
   that sending did something when it did not. So a Sunday notice is held
   and lands Monday, and the form says that in words before they send it.

   Held, not dropped: the symptoms of a bad Sunday are the ones the clinic
   most needs on Monday morning.
   ========================================================================== */

/** Days of the week the clinic is shut, as `Date#getDay` numbers. */
const CLOSED_WEEKDAYS = new Set([0]); // Sunday

export function isClinicOpenOn(iso: string): boolean {
  return !CLOSED_WEEKDAYS.has(parseIso(iso).getDay());
}

/**
 * The given day if the clinic is open on it, otherwise the next day it is.
 *
 * Bounded by a week so a configuration that closed every day could never
 * spin here — it returns the input instead, and the caller still has a
 * valid date to show.
 */
export function nextClinicOpenDay(iso: string): string {
  const cursor = parseIso(iso);
  for (let step = 0; step < 7; step += 1) {
    const day = todayIso(cursor);
    if (isClinicOpenOn(day)) return day;
    cursor.setDate(cursor.getDate() + 1);
  }
  return iso;
}

/* ==========================================================================
   Whether a day is worth sending
   ========================================================================== */

/**
 * The reasons a check-in earns a notice on its own, strongest first.
 *
 * These only pre-arm the toggle. The member always decides — a log that
 * sent itself would be a log people stop writing honestly.
 */
export function suggestedReasons(
  entry: BetweenTreatmentCheckIn,
): ClinicNoticeReason[] {
  const reasons: ClinicNoticeReason[] = [];

  if (entry.missedTreatment) reasons.push("missed-treatment");
  if (entry.severity === "severe" && entry.symptoms.length > 0) {
    reasons.push("severe-symptoms");
  }
  if (entry.feeling === "rough") reasons.push("rough-day");

  return reasons;
}

/** A day the clinic would want to hear about without being asked. */
export function shouldSuggestNotice(entry: BetweenTreatmentCheckIn): boolean {
  return suggestedReasons(entry).length > 0;
}

/**
 * What gets sent for this day. Falls back to `member-requested` so a notice
 * the member raised for a reason of their own still carries one.
 */
export function noticeReasons(
  entry: BetweenTreatmentCheckIn,
): ClinicNoticeReason[] {
  const suggested = suggestedReasons(entry);
  return suggested.length > 0 ? suggested : ["member-requested"];
}

export function buildNotice(
  entry: BetweenTreatmentCheckIn,
  now = new Date(),
): ClinicNotice {
  const raisedOn = todayIso(now);
  return {
    checkInDate: entry.date,
    raisedOn,
    raisedAt: now.toISOString(),
    deliverOn: nextClinicOpenDay(raisedOn),
    reasons: noticeReasons(entry),
  };
}

/* ==========================================================================
   Reading a notice back
   ========================================================================== */

/** Waiting on a closed day rather than on its way today. */
export function isHeldForClosure(notice: ClinicNotice): boolean {
  return notice.deliverOn !== notice.raisedOn;
}

/** Past the point where it can be taken back. */
export function isDelivered(notice: ClinicNotice, now = new Date()): boolean {
  return notice.deliverOn <= todayIso(now);
}

export type ClinicNoticeStatus = "held" | "sending" | "delivered";

export function noticeStatus(
  notice: ClinicNotice,
  now = new Date(),
): ClinicNoticeStatus {
  if (isDelivered(notice, now)) return "delivered";
  return isHeldForClosure(notice) ? "held" : "sending";
}

/* ==========================================================================
   The collection
   ========================================================================== */

export function findNotice(
  notices: ClinicNotice[],
  checkInDate: string,
): ClinicNotice | undefined {
  return notices.find((notice) => notice.checkInDate === checkInDate);
}

/**
 * One notice per check-in day.
 *
 * A notice that has already reached the clinic is left exactly as it was:
 * re-saving the day must not rewrite the record of what was sent, or when.
 */
export function upsertNotice(
  notices: ClinicNotice[],
  notice: ClinicNotice,
  now = new Date(),
): ClinicNotice[] {
  const index = notices.findIndex(
    (current) => current.checkInDate === notice.checkInDate,
  );
  if (index === -1) return [notice, ...notices];
  if (isDelivered(notices[index], now)) return notices;

  const next = [...notices];
  next[index] = { ...notice, raisedAt: notices[index].raisedAt };
  return next;
}

/**
 * Withdraw a notice the clinic has not seen yet.
 *
 * A delivered one stays: the member can stop a send, but the app cannot
 * pretend something already read was never sent.
 */
export function withdrawNotice(
  notices: ClinicNotice[],
  checkInDate: string,
  now = new Date(),
): ClinicNotice[] {
  return notices.filter(
    (notice) => notice.checkInDate !== checkInDate || isDelivered(notice, now),
  );
}

/** Dropped when the day itself is deleted, delivered ones included. */
export function removeNotice(
  notices: ClinicNotice[],
  checkInDate: string,
): ClinicNotice[] {
  return notices.filter((notice) => notice.checkInDate !== checkInDate);
}

/** Raised and not yet at the clinic, soonest delivery first. */
export function pendingNotices(
  notices: ClinicNotice[],
  now = new Date(),
): ClinicNotice[] {
  return notices
    .filter((notice) => !isDelivered(notice, now))
    .sort((a, b) => a.deliverOn.localeCompare(b.deliverOn));
}
