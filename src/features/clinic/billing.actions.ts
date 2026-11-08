/* ==========================================================================
   Contract & Billing: what an office may do here (Phase 14)
   --------------------------------------------------------------------------
   An office can ask NephroReach to change its contract
   (POST /organizations/:org/billing/change-requests) and open an issued
   invoice PDF. It cannot settle an invoice or choose its renewal: only the
   NephroReach team marks an invoice paid (POST /platform/invoices/:id/
   mark-paid) and sets the renewal choice, so those controls are hidden for
   offices and the renewal choice is shown read-only. No invoice document is
   built in the browser: an invoice is the issued one, or none.
   ========================================================================== */

export type ChangeTopic = "seats" | "fee" | "dates" | "contact" | "other";

export const CHANGE_TOPICS: { value: ChangeTopic; label: string }[] = [
  { value: "seats", label: "Patient slots" },
  { value: "fee", label: "Monthly fee" },
  { value: "dates", label: "Contract dates" },
  { value: "contact", label: "Primary contact" },
  { value: "other", label: "Something else" },
];

export function changeTopicLabel(value: string): string {
  return CHANGE_TOPICS.find((entry) => entry.value === value)?.label ?? value;
}

/** The server's limits on a request's detail. */
export const CHANGE_DETAIL = { min: 10, max: 1000 } as const;

/** Why a change request cannot be sent, or null when it can. */
export function changeRequestError(detail: string): string | null {
  if (detail.trim().length < CHANGE_DETAIL.min) {
    return "Say a little more about what should change.";
  }
  if (detail.trim().length > CHANGE_DETAIL.max) {
    return `Keep it under ${CHANGE_DETAIL.max} characters.`;
  }
  return null;
}

export type RenewalChoice = "auto" | "review" | "end";

export const RENEWAL_CHOICES: {
  value: RenewalChoice;
  label: string;
  note: string;
}[] = [
  {
    value: "auto",
    label: "Renew automatically",
    note: "Rolls over on the end date at the current fee.",
  },
  {
    value: "review",
    label: "Contact me before renewal",
    note: "NephroReach reaches out 30 days before the end date.",
  },
  {
    value: "end",
    label: "Do not renew",
    note: "The contract ends on its end date.",
  },
];

/** The renewal choice NephroReach holds for the contract (read-only). */
export function renewalLabel(value: string | null): string {
  if (!value) return "Not set";
  return RENEWAL_CHOICES.find((entry) => entry.value === value)?.label ?? value;
}
