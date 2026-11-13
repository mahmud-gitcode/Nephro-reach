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

export const CHANGE_TOPICS: {
  value: ChangeTopic;
  label: string;
  labelEs: string;
}[] = [
  { value: "seats", label: "Patient slots", labelEs: "Cupos de pacientes" },
  { value: "fee", label: "Monthly fee", labelEs: "Tarifa mensual" },
  { value: "dates", label: "Contract dates", labelEs: "Fechas del contrato" },
  { value: "contact", label: "Primary contact", labelEs: "Contacto principal" },
  { value: "other", label: "Something else", labelEs: "Otro asunto" },
];

export function changeTopicLabel(value: string, isEs = false): string {
  const entry = CHANGE_TOPICS.find((item) => item.value === value);
  if (!entry) return value;
  return isEs ? entry.labelEs : entry.label;
}

/** The server's limits on a request's detail. */
export const CHANGE_DETAIL = { min: 10, max: 1000 } as const;

/** Why a change request cannot be sent, or null when it can. */
export function changeRequestError(
  detail: string,
  isEs = false,
): string | null {
  if (detail.trim().length < CHANGE_DETAIL.min) {
    return isEs
      ? "Explique un poco más qué debe cambiar."
      : "Say a little more about what should change.";
  }
  if (detail.trim().length > CHANGE_DETAIL.max) {
    return isEs
      ? `Use menos de ${CHANGE_DETAIL.max} caracteres.`
      : `Keep it under ${CHANGE_DETAIL.max} characters.`;
  }
  return null;
}

export type RenewalChoice = "auto" | "review" | "end";

export const RENEWAL_CHOICES: {
  value: RenewalChoice;
  label: string;
  labelEs: string;
  note: string;
  noteEs: string;
}[] = [
  {
    value: "auto",
    label: "Renew automatically",
    labelEs: "Renovar automáticamente",
    note: "Rolls over on the end date at the current fee.",
    noteEs: "Se renueva en la fecha de finalización con la tarifa actual.",
  },
  {
    value: "review",
    label: "Contact me before renewal",
    labelEs: "Contactarme antes de la renovación",
    note: "NephroReach reaches out 30 days before the end date.",
    noteEs:
      "NephroReach se comunica 30 días antes de la fecha de finalización.",
  },
  {
    value: "end",
    label: "Do not renew",
    labelEs: "No renovar",
    note: "The contract ends on its end date.",
    noteEs: "El contrato termina en su fecha de finalización.",
  },
];

/** The renewal choice NephroReach holds for the contract (read-only). */
export function renewalLabel(value: string | null, isEs = false): string {
  if (!value) return isEs ? "Sin definir" : "Not set";
  const entry = RENEWAL_CHOICES.find((item) => item.value === value);
  if (!entry) return value;
  return isEs ? entry.labelEs : entry.label;
}
