"use client";

import React, { useState } from "react";
import { Printer } from "lucide-react";
import { Alert, Button, Modal, Select } from "@/components/ui";
import { pdfBytes } from "@/lib/utils/pdf";
import {
  CHANGE_TOPICS,
  RENEWAL_CHOICES,
  changeRequestError,
  invoiceDocument,
  invoiceFilename,
  renewalLabel,
  type ChangeTopic,
  type RenewalChoice,
} from "./billing.actions";
import {
  contract,
  formatDate,
  formatMoney,
  localDate,
  type Invoice,
} from "./billing.data";

/* ==========================================================================
   The dialogs behind Contract & Billing's actions
   --------------------------------------------------------------------------
   Kept out of ClinicBilling.tsx, which is already a long page of panels.
   Each one is a plain controlled dialog: the page owns what is open and
   what was chosen, these own only their own draft.
   ========================================================================== */

const field =
  "w-full rounded-control border border-line bg-surface px-inset-sm py-inset-xs " +
  "text-body-sm text-fg outline-none placeholder:text-fg-subtle " +
  "focus:border-primary-soft-line focus:ring-2 focus:ring-ring/60";

/* --------------------------------------------------------------------------
   1 · The contract itself
   -------------------------------------------------------------------------- */

export function ContractDocumentModal({
  open,
  onClose,
  clinicName,
}: {
  open: boolean;
  onClose: () => void;
  clinicName: string;
}) {
  const terms: [string, string][] = [
    ["Contract number", contract.number],
    ["Type", contract.type],
    ["Status", contract.status],
    ["Clinic", clinicName],
    ["Primary contact", contract.primaryContact],
    ["Term start", formatDate(localDate(contract.start))],
    ["Term end", formatDate(localDate(contract.end))],
    ["Patient slots", String(contract.patientsAllowed)],
    ["Billing cycle", contract.billingCycle],
    ["Monthly fee", formatMoney(contract.monthlyFee)],
    ["Auto-renew", contract.autoRenew ? "Yes" : "No"],
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title="Contract Document"
      description={`${contract.number} — ${contract.type}`}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Close
          </Button>
          {/* Printing is the browser's own, so this one genuinely works
              with no service behind it. */}
          <Button onClick={() => window.print()}>
            <Printer aria-hidden="true" />
            <span>Print</span>
          </Button>
        </>
      }
    >
      <dl className="divide-y divide-line-subtle">
        {terms.map(([term, value]) => (
          <div
            key={term}
            className="flex items-baseline justify-between gap-inline-lg py-inset-xs first:pt-0"
          >
            <dt className="text-body-sm text-fg-muted">{term}</dt>
            <dd className="text-right text-label-md text-fg">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-stack-lg text-body-sm text-fg-muted">
        This is the summary of record held by NephroReach. The signed agreement
        is held by your partner success manager.
      </p>
    </Modal>
  );
}

/* --------------------------------------------------------------------------
   2 · Asking for a change
   -------------------------------------------------------------------------- */

export function RequestChangeModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (topic: ChangeTopic, detail: string) => void;
}) {
  const [topic, setTopic] = useState<ChangeTopic>("seats");
  const [detail, setDetail] = useState("");

  const error = changeRequestError(detail);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (error) return;

    onSubmit(topic, detail);
    setDetail("");
    setTopic("seats");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request a Change"
      description="A clinic cannot edit its own contract. This goes to NephroReach."
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="change-request-form" disabled={!!error}>
            Send Request
          </Button>
        </>
      }
    >
      <form
        id="change-request-form"
        onSubmit={handleSubmit}
        className="space-y-stack-md"
      >
        <div className="space-y-1.5">
          <label
            htmlFor="change-topic"
            className="block text-label-md text-fg-secondary"
          >
            What should change
          </label>
          <Select
            id="change-topic"
            selectSize="small"
            value={topic}
            onChange={(event) => setTopic(event.target.value as ChangeTopic)}
          >
            {CHANGE_TOPICS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="change-detail"
            className="block text-label-md text-fg-secondary"
          >
            Details
          </label>
          <textarea
            id="change-detail"
            rows={4}
            maxLength={1000}
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            placeholder="We need 20 more patient slots from November."
            className={`${field} resize-none`}
          />
        </div>

        {detail.length > 0 && error ? (
          <Alert tone="warning">{error}</Alert>
        ) : null}
      </form>
    </Modal>
  );
}

/* --------------------------------------------------------------------------
   3 · Paying
   -------------------------------------------------------------------------- */

export function PayInvoiceModal({
  open,
  onClose,
  invoices,
  onPaid,
}: {
  open: boolean;
  onClose: () => void;
  /** The unpaid invoices this payment covers. */
  invoices: Invoice[];
  onPaid: (invoiceNumbers: string[]) => void;
}) {
  const total = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onPaid(invoices.map((invoice) => invoice.number));
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        invoices.length === 1 ? `Pay ${invoices[0].number}` : "Pay Invoices"
      }
      description={`${formatMoney(total)} across ${invoices.length} invoice${
        invoices.length === 1 ? "" : "s"
      }.`}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="pay-invoice-form"
            disabled={invoices.length === 0}
          >
            Pay {formatMoney(total)}
          </Button>
        </>
      }
    >
      <form id="pay-invoice-form" onSubmit={handleSubmit}>
        <ul className="divide-y divide-line-subtle">
          {invoices.map((invoice) => (
            <li
              key={invoice.number}
              className="flex items-baseline justify-between gap-inline-lg py-inset-xs first:pt-0"
            >
              <span className="min-w-0">
                <span className="block text-label-md text-fg">
                  {invoice.number}
                </span>
                <span className="block text-body-sm text-fg-muted">
                  {invoice.period} · due {formatDate(invoice.due)}
                </span>
              </span>
              <span className="text-label-lg text-fg tabular-nums">
                {formatMoney(invoice.amount)}
              </span>
            </li>
          ))}
        </ul>

        {/* No card fields, deliberately. See the note in billing.actions.ts:
            a card number must never reach this app's storage, and a
            realistic-looking form is an invitation to put one there. */}
        <Alert tone="info" className="mt-stack-lg">
          Payment is taken by Stripe on the live site. Confirming here records
          the invoice as paid so this page stays accurate.
        </Alert>
      </form>
    </Modal>
  );
}

/* --------------------------------------------------------------------------
   4 · Renewal
   -------------------------------------------------------------------------- */

export function RenewalOptionsModal({
  open,
  onClose,
  current,
  onChoose,
}: {
  open: boolean;
  onClose: () => void;
  current: RenewalChoice;
  onChoose: (choice: RenewalChoice) => void;
}) {
  const [choice, setChoice] = useState<RenewalChoice>(current);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onChoose(choice);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Renewal Options"
      description={`Contract ends ${formatDate(localDate(contract.end))}.`}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="renewal-form">
            Save Choice
          </Button>
        </>
      }
    >
      <form
        id="renewal-form"
        onSubmit={handleSubmit}
        className="space-y-inline-sm"
      >
        {RENEWAL_CHOICES.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-start gap-inline-md rounded-control border p-inset-sm transition-colors ${
              choice === option.value
                ? "border-primary-edge bg-primary-soft"
                : "border-line bg-surface hover:border-line-strong"
            }`}
          >
            <input
              type="radio"
              name="renewal"
              value={option.value}
              checked={choice === option.value}
              onChange={() => setChoice(option.value)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-brand-600)]"
            />
            <span className="min-w-0">
              <span className="block text-label-md text-fg">
                {option.label}
              </span>
              <span className="block text-body-sm text-fg-muted">
                {option.note}
              </span>
            </span>
          </label>
        ))}

        <p className="pt-inset-xs text-body-sm text-fg-muted">
          Currently set to {renewalLabel(current)}.
        </p>
      </form>
    </Modal>
  );
}

/* --------------------------------------------------------------------------
   Downloading an invoice
   -------------------------------------------------------------------------- */

/**
 * Write one invoice to a PDF the clinic actually receives.
 *
 * Built and handed over entirely in the browser, so this is the one action
 * on the page that is complete rather than stood in for.
 */
export function downloadInvoice(invoice: Invoice, clinicName: string): void {
  const blob = new Blob([pdfBytes(invoiceDocument(invoice, clinicName))], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = invoiceFilename(invoice);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Freed on the next tick: revoking synchronously can beat the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
