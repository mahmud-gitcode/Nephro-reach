import {
  PAGE_HEIGHT,
  PAGE_WIDTH,
  buildPdf,
  textWidth,
  type PdfLine,
  type PdfPage,
  type PdfText,
} from "@/lib/utils/pdf";
import {
  contract,
  formatDate,
  formatMoney,
  localDate,
  type Invoice,
} from "./billing.data";

/* ==========================================================================
   Contract & Billing — what the buttons actually do
   --------------------------------------------------------------------------
   Six controls on this page rendered and did nothing. They are wired here,
   in the front end only: no payment processor, no document service, no
   ticket queue.

   Everything a clinic does here is recorded locally, the same way every
   other feature persists while there is no backend. The one thing that is
   genuinely complete without a server is the invoice download: the PDF is
   built byte by byte in the browser, so it is a real invoice a clinic can
   file or forward, not a stand-in.

   The payment sheet is deliberately NOT a card form. Taking a card number
   into localStorage would be the worst thing this codebase could do, and a
   realistic-looking one invites exactly that even as a demo. Stripe will
   own the card; this records that a payment was started and settles the
   invoice locally so the page tells the truth afterwards.
   ========================================================================== */

export type ChangeTopic = "seats" | "fee" | "dates" | "contact" | "other";

export const CHANGE_TOPICS: { value: ChangeTopic; label: string }[] = [
  { value: "seats", label: "Patient slots" },
  { value: "fee", label: "Monthly fee" },
  { value: "dates", label: "Contract dates" },
  { value: "contact", label: "Primary contact" },
  { value: "other", label: "Something else" },
];

export function changeTopicLabel(value: ChangeTopic): string {
  return CHANGE_TOPICS.find((entry) => entry.value === value)?.label ?? value;
}

export interface ChangeRequest {
  id: string;
  topic: ChangeTopic;
  detail: string;
  /** ISO 8601. */
  requestedAt: string;
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

export function renewalLabel(value: RenewalChoice): string {
  return RENEWAL_CHOICES.find((entry) => entry.value === value)?.label ?? value;
}

/** Everything this page records locally. One record, one key. */
export interface BillingActions {
  /** Invoice numbers settled through the payment sheet. */
  paidInvoices: string[];
  changeRequests: ChangeRequest[];
  renewal: RenewalChoice;
  updatedAt: string;
}

export const EMPTY_ACTIONS: BillingActions = {
  paidInvoices: [],
  changeRequests: [],
  renewal: contract.autoRenew ? "auto" : "review",
  updatedAt: "",
};

/**
 * Apply what the clinic has done locally to the derived invoice list.
 *
 * The invoices themselves are computed from the contract, so a payment
 * cannot be written onto them; it is held separately and folded in on read.
 * That keeps one source of truth for what was billed and another for what
 * has been settled since.
 */
export function applyPayments(
  invoices: Invoice[],
  paidInvoices: string[],
): Invoice[] {
  if (paidInvoices.length === 0) return invoices;

  const paid = new Set(paidInvoices);
  return invoices.map((invoice) =>
    paid.has(invoice.number) && invoice.status !== "Paid"
      ? { ...invoice, status: "Paid" as const }
      : invoice,
  );
}

export function markPaid(
  actions: BillingActions,
  invoiceNumbers: string[],
): BillingActions {
  return {
    ...actions,
    paidInvoices: [...new Set([...actions.paidInvoices, ...invoiceNumbers])],
    updatedAt: new Date().toISOString(),
  };
}

/** Why a change request cannot be sent, or null when it can. */
export function changeRequestError(detail: string): string | null {
  if (detail.trim().length < 10) {
    return "Say a little more about what should change.";
  }
  return null;
}

export function addChangeRequest(
  actions: BillingActions,
  topic: ChangeTopic,
  detail: string,
): BillingActions {
  const request: ChangeRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    topic,
    detail: detail.trim(),
    requestedAt: new Date().toISOString(),
  };

  return {
    ...actions,
    /* Newest first: the one just sent is the one being looked for. */
    changeRequests: [request, ...actions.changeRequests],
    updatedAt: request.requestedAt,
  };
}

/* --------------------------------------------------------------------------
   The invoice document
   -------------------------------------------------------------------------- */

/**
 * One invoice laid out as a page, ready for the PDF writer.
 *
 * The layout lives here, next to the contract terms it reads, rather than
 * in the component that triggers the download — it is a document, not a
 * view, and this way it can be tested without a browser.
 *
 * Money is right-aligned against the right margin. Courier is fixed-width,
 * so `textWidth` is exact and the column lines up rather than nearly.
 */
export function invoicePage(invoice: Invoice, clinicName: string): PdfPage {
  const left = 56;
  const right = PAGE_WIDTH - 56;
  const texts: PdfText[] = [];
  const lines: PdfLine[] = [];

  /* Walked down the page as rows are added. PDF's y axis runs upwards, so
     laying out means subtracting. */
  let y = PAGE_HEIGHT - 72;

  const heading = (text: string, size: number) => {
    texts.push({ text, x: left, y, size, bold: true });
    y -= size + 8;
  };

  const row = (label: string, value: string) => {
    texts.push({ text: label, x: left, y, size: 10 });
    texts.push({ text: value, x: left + 120, y, size: 10 });
    y -= 16;
  };

  /** A label on the left, an amount hard against the right margin. */
  const amountRow = (label: string, amount: string, bold = false) => {
    texts.push({ text: label, x: left, y, size: 10, bold });
    texts.push({
      text: amount,
      x: right - textWidth(amount, 10),
      y,
      size: 10,
      bold,
    });
    y -= 16;
  };

  const rule = () => {
    y += 6;
    lines.push({ x1: left, y1: y, x2: right, y2: y });
    y -= 18;
  };

  heading("NEPHROREACH", 18);
  heading(`Invoice ${invoice.number}`, 13);
  rule();

  row("Billed to", clinicName);
  row("Contract", `${contract.number} (${contract.type})`);
  row("Billing period", invoice.period);
  row("Issued", formatDate(invoice.issued));
  row("Due", formatDate(invoice.due));
  rule();

  amountRow(
    `${contract.billingCycle} platform fee`,
    formatMoney(invoice.amount),
  );
  row("Patient slots", String(contract.patientsAllowed));
  rule();

  amountRow("TOTAL", formatMoney(invoice.amount), true);
  row("Status", invoice.status);
  rule();

  row(
    "Contract term",
    `${formatDate(localDate(contract.start))} to ${formatDate(
      localDate(contract.end),
    )}`,
  );

  y -= 16;
  texts.push({
    text: "Questions about this invoice: your NephroReach partner success manager.",
    x: left,
    y,
    size: 9,
  });

  return { texts, lines };
}

/** One invoice as a complete PDF file, as a binary string. */
export function invoiceDocument(invoice: Invoice, clinicName: string): string {
  return buildPdf(
    invoicePage(invoice, clinicName),
    `Invoice ${invoice.number}`,
  );
}

/** The filename a downloaded invoice lands under. */
export function invoiceFilename(invoice: Invoice): string {
  return `${invoice.number}.pdf`;
}

/** Read a stored record back, repairing anything unusable. */
export function normaliseActions(stored: unknown): BillingActions {
  if (!stored || typeof stored !== "object") return EMPTY_ACTIONS;
  const raw = stored as Partial<BillingActions>;

  const paidInvoices = Array.isArray(raw.paidInvoices)
    ? [...new Set(raw.paidInvoices.filter((n) => typeof n === "string"))]
    : [];

  const changeRequests = Array.isArray(raw.changeRequests)
    ? raw.changeRequests.flatMap((value) => {
        if (!value || typeof value !== "object") return [];
        const request = value as Partial<ChangeRequest>;
        if (
          typeof request.id !== "string" ||
          typeof request.detail !== "string"
        )
          return [];

        return [
          {
            id: request.id,
            topic: CHANGE_TOPICS.some((entry) => entry.value === request.topic)
              ? (request.topic as ChangeTopic)
              : "other",
            detail: request.detail,
            requestedAt:
              typeof request.requestedAt === "string"
                ? request.requestedAt
                : new Date(0).toISOString(),
          },
        ];
      })
    : [];

  return {
    paidInvoices,
    changeRequests,
    renewal: RENEWAL_CHOICES.some((entry) => entry.value === raw.renewal)
      ? (raw.renewal as RenewalChoice)
      : EMPTY_ACTIONS.renewal,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "",
  };
}
