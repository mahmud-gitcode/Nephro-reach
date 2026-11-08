import type { BadgeTone } from "@/components/ui";

/* ==========================================================================
   Contract & Billing: API shapes and what the page shows (Phase 14)
   --------------------------------------------------------------------------
   One office's own contract, and nothing else ("Facility A must never
   reach Facility B"; Joni, 2026-09-21). Everything is the server's:
   - GET /organizations/:org/billing/contract: the current contract, any
     pending one, and the seats in use (the server counts them);
   - GET …/billing/invoices: the invoices NephroReach issued (paged);
   - GET …/billing/invoices/:id/download-link: a short-lived link to the
     issued PDF, only when the invoice has one;
   - GET/POST …/billing/change-requests.
   Money arrives in cents and is shown with the cents. Contract days are
   YYYY-MM-DD and parsed on the local calendar (`localDate`), never with
   `new Date(day)` (a UTC shift). Nothing here invents an invoice, a
   payment or a contract term.
   ========================================================================== */

/* ---------------------------------------------------------------- the API */

export type ApiContractStatus =
  "PENDING" | "ACTIVE" | "EXPIRING_SOON" | "ENDED";

export type ApiOfficeContract = {
  id: string;
  contractNumber: string | null;
  plan: { name: string };
  status: ApiContractStatus | string;
  startsOn: string;
  endsOn: string | null;
  patientsAllowed: number;
  monthlyFeeCents: number;
  billingCycle: string;
  autoRenew: boolean;
  renewalChoice: string | null;
  primaryContact: { id: string; name: string | null } | null;
};

export type ApiSeats = {
  used: number;
  /** null: no seat limit. */
  allowed: number | null;
  available: number | null;
};

export type ApiBillingContract = {
  contract: ApiOfficeContract | null;
  pendingContract: ApiOfficeContract | null;
  seats: ApiSeats | null;
};

export type ApiInvoiceStatus = "DUE" | "PAID" | "OVERDUE";

export type ApiInvoice = {
  id: string;
  number: string;
  periodLabel: string;
  issuedOn: string;
  dueOn: string;
  amountCents: number;
  currency: string;
  status: ApiInvoiceStatus | string;
  paidAt: string | null;
  hasPdf: boolean;
};

export type ApiChangeRequest = {
  id: string;
  topic: string;
  detail: string;
  requestedById: string;
  requestedAt: string;
  resolvedAt: string | null;
};

/* ------------------------------------------------------------- the screen */

export type ContractStatus = "Active" | "Pending" | "Expiring Soon" | "Ended";

export const contractTone: Record<ContractStatus, BadgeTone> = {
  Active: "success",
  Pending: "warning",
  "Expiring Soon": "info",
  Ended: "neutral",
};

const CONTRACT_STATUS: Record<string, ContractStatus> = {
  ACTIVE: "Active",
  PENDING: "Pending",
  EXPIRING_SOON: "Expiring Soon",
  ENDED: "Ended",
};

/** An unknown status shows as "Ended" (never as active). */
export function contractStatusLabel(status: string): ContractStatus {
  return CONTRACT_STATUS[status] ?? "Ended";
}

export type InvoiceStatus = "Paid" | "Due" | "Overdue";

export const invoiceTone: Record<InvoiceStatus, BadgeTone> = {
  Paid: "success",
  Due: "warning",
  Overdue: "danger",
};

const INVOICE_STATUS: Record<string, InvoiceStatus> = {
  PAID: "Paid",
  DUE: "Due",
  OVERDUE: "Overdue",
};

/** An unknown status shows as "Due" (never as paid). */
export function invoiceStatusLabel(status: string): InvoiceStatus {
  return INVOICE_STATUS[status] ?? "Due";
}

export type Invoice = {
  id: string;
  number: string;
  period: string;
  issued: Date;
  due: Date;
  amountCents: number;
  currency: string;
  status: InvoiceStatus;
  hasPdf: boolean;
};

export function toInvoice(row: ApiInvoice): Invoice {
  return {
    id: row.id,
    number: row.number,
    period: row.periodLabel,
    issued: localDate(row.issuedOn),
    due: localDate(row.dueOn),
    amountCents: row.amountCents,
    currency: row.currency || "USD",
    status: invoiceStatusLabel(row.status),
    hasPdf: row.hasPdf,
  };
}

export type Contract = {
  number: string;
  type: string;
  status: ContractStatus;
  start: string;
  end: string | null;
  patientsAllowed: number;
  monthlyFeeCents: number;
  billingCycle: string;
  autoRenew: boolean;
  renewalChoice: string | null;
  primaryContact: string;
};

export function toContract(row: ApiOfficeContract): Contract {
  return {
    number: row.contractNumber ?? "—",
    type: row.plan?.name ?? "—",
    status: contractStatusLabel(row.status),
    start: row.startsOn,
    end: row.endsOn,
    patientsAllowed: row.patientsAllowed,
    monthlyFeeCents: row.monthlyFeeCents,
    billingCycle: cycleLabel(row.billingCycle),
    autoRenew: row.autoRenew,
    renewalChoice: row.renewalChoice,
    primaryContact: row.primaryContact?.name ?? "—",
  };
}

function cycleLabel(cycle: string): string {
  return cycle ? cycle.charAt(0).toUpperCase() + cycle.slice(1) : "—";
}

/* -------------------------------------------------------------- formatting */

/** `new Date("2026-01-01")` is UTC midnight — Dec 31 in the Americas. */
export function localDate(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "2026-01-01" -> "Jan 1, 2026"; "—" for none. */
export function formatDay(day: string | null | undefined): string {
  return day ? formatDate(localDate(day)) : "—";
}

/** Cents in, money out with the cents: 199500 -> "$1,995.00". */
export function formatCents(cents: number, currency = "USD"): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ------------------------------------------------- figures from the page */

/** Share of the shown invoices issued this month that are paid; null when
 *  none of the shown invoices is from this month. */
export function paidThisMonthPct(
  invoices: Invoice[],
  today: Date,
): number | null {
  const current = invoices.filter(
    (invoice) =>
      invoice.issued.getFullYear() === today.getFullYear() &&
      invoice.issued.getMonth() === today.getMonth(),
  );
  if (current.length === 0) return null;
  const paid = current.filter((invoice) => invoice.status === "Paid").length;
  return Math.round((paid / current.length) * 100);
}

/** Paid this calendar year, among the shown invoices (cents). */
export function totalPaidThisYear(invoices: Invoice[], today: Date): number {
  return invoices
    .filter(
      (invoice) =>
        invoice.status === "Paid" &&
        invoice.issued.getFullYear() === today.getFullYear(),
    )
    .reduce((sum, invoice) => sum + invoice.amountCents, 0);
}

/** Not yet paid, among the shown invoices (cents). */
export function outstanding(invoices: Invoice[]): number {
  return invoices
    .filter((invoice) => invoice.status !== "Paid")
    .reduce((sum, invoice) => sum + invoice.amountCents, 0);
}

const DAY = 24 * 60 * 60 * 1000;

/** Whole days from `today` to the end day; 0 once it has passed. */
export function daysUntilEnd(end: string, today: Date): number {
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(
    0,
    Math.round((localDate(end).getTime() - from.getTime()) / DAY),
  );
}

/** How far through the term `today` is, 0–100. */
export function termElapsedPct(
  start: string,
  end: string,
  today: Date,
): number {
  const from = localDate(start).getTime();
  const to = localDate(end).getTime();
  if (to <= from) return 100;
  const pct = ((today.getTime() - from) / (to - from)) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}
