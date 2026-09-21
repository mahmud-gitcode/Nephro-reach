import type { BadgeTone } from "@/components/ui";
import { CONTRACT_SLOTS, enrolledCount } from "./enrollment.data";

/* ==========================================================================
   Contract & Billing — demo data
   --------------------------------------------------------------------------
   One clinic's own contract, and nothing else. The client's mockup was a
   NephroReach-wide view listing twelve organizations' contracts, fees and
   contacts; in the clinic portal that would show every facility the others'
   business, which the requirements rule out ("Facility A must never reach
   Facility B"). Joni chose to scope it to the signed-in clinic
   (2026-09-21). The all-organizations view belongs to a NephroReach admin
   page, when there is one.

   Sunshine's row and details panel are taken from the mockup as given. The
   seat count is not retyped: it is the Enroll Patients roster, so the two
   pages cannot disagree. Invoices are derived from the contract — one per
   month since the start date, at the monthly fee.
   ========================================================================== */

export type ContractStatus = "Active" | "Pending" | "Expiring Soon";

export const contractTone: Record<ContractStatus, BadgeTone> = {
  Active: "success",
  Pending: "warning",
  "Expiring Soon": "info",
};

export const contract = {
  number: "NR-2026-0125",
  type: "Nephrology Office",
  status: "Active" as ContractStatus,
  /** ISO dates, parsed locally by `localDate`. */
  start: "2026-01-01",
  end: "2026-12-31",
  patientsAllowed: CONTRACT_SLOTS,
  monthlyFee: 1995,
  billingCycle: "Monthly",
  autoRenew: true,
  primaryContact: "Dr. Melissa Carter",
};

export const patientsCovered = enrolledCount;

/** `new Date("2026-01-01")` is UTC midnight — Dec 31 in the Americas. */
export function localDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMoney(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export type InvoiceStatus = "Paid" | "Due" | "Overdue";

export const invoiceTone: Record<InvoiceStatus, BadgeTone> = {
  Paid: "success",
  Due: "warning",
  Overdue: "danger",
};

export type Invoice = {
  number: string;
  period: string;
  issued: Date;
  due: Date;
  amount: number;
  status: InvoiceStatus;
};

/**
 * One invoice per month from the contract start up to and including the
 * month of `today`, newest first. Issued on the 1st, due on the 15th.
 *
 * Every one is Paid: the client's figure is "100% invoices paid", and a
 * past invoice that was not paid would contradict it.
 */
export function invoicesUpTo(today: Date): Invoice[] {
  const start = localDate(contract.start);
  const end = localDate(contract.end);
  const out: Invoice[] = [];
  for (
    let month = new Date(start.getFullYear(), start.getMonth(), 1);
    month <= today && month <= end;
    month = new Date(month.getFullYear(), month.getMonth() + 1, 1)
  ) {
    const n = month.getMonth() + 1;
    out.push({
      number: `INV-${month.getFullYear()}-${String(n).padStart(2, "0")}`,
      period: month.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      issued: month,
      due: new Date(month.getFullYear(), month.getMonth(), 15),
      amount: contract.monthlyFee,
      status: "Paid",
    });
  }
  return out.reverse();
}

/** Share of this month's invoices that are paid, as a whole percent. */
export function paidThisMonthPct(invoices: Invoice[], today: Date): number {
  const current = invoices.filter(
    (invoice) =>
      invoice.issued.getFullYear() === today.getFullYear() &&
      invoice.issued.getMonth() === today.getMonth(),
  );
  if (current.length === 0) return 100;
  const paid = current.filter((invoice) => invoice.status === "Paid").length;
  return Math.round((paid / current.length) * 100);
}

export function totalPaid(invoices: Invoice[]): number {
  return invoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
}

export function outstanding(invoices: Invoice[]): number {
  return invoices
    .filter((invoice) => invoice.status !== "Paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
}

/** The 1st of next month, while the contract still runs; else null. */
export function nextInvoiceDate(today: Date): Date | null {
  const next = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return next <= localDate(contract.end) ? next : null;
}

const DAY = 24 * 60 * 60 * 1000;

/** Whole days from `today` to the contract end; 0 once it has passed. */
export function daysUntilEnd(today: Date): number {
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(
    0,
    Math.round((localDate(contract.end).getTime() - from.getTime()) / DAY),
  );
}

/** How far through the term `today` is, 0–100. */
export function termElapsedPct(today: Date): number {
  const start = localDate(contract.start).getTime();
  const end = localDate(contract.end).getTime();
  const pct = ((today.getTime() - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}
