/* ==========================================================================
   Beyond the Chair — telling the clinic
   --------------------------------------------------------------------------
   A check-in describes the days a member is *not* in the chair, which is
   exactly the stretch nobody at the clinic can see. Until now the form said
   so out loud — "this log does not notify them" — and left the member to
   phone it in themselves.

   A notice is the member asking for one day of their log to be sent. It is
   kept apart from the check-in itself because the two have different
   lifetimes: a check-in can be edited for months, while a notice is sent
   once and cannot be unsent.

   One notice per check-in day, keyed by that day, so re-saving the same day
   updates the reasons rather than sending a second notice.
   ========================================================================== */

/**
 * Why the notice went out. The clinic sees a queue, not one member, so the
 * reason is what lets them work the queue in the right order — a missed run
 * ahead of a rough day.
 */
export type ClinicNoticeReason =
  "missed-treatment" | "severe-symptoms" | "rough-day" | "member-requested";

export interface ClinicNotice {
  /** The day the check-in is about. Also the identity: one notice per day. */
  checkInDate: string;

  /** `yyyy-mm-dd` the member asked to send it, in their own timezone. */
  raisedOn: string;
  /** Full timestamp, for the clinic's record of when it was raised. */
  raisedAt: string;

  /**
   * `yyyy-mm-dd` the clinic actually receives it. Never a closed day, so
   * this is later than `raisedOn` for anything raised on a Sunday.
   */
  deliverOn: string;

  reasons: ClinicNoticeReason[];
}
