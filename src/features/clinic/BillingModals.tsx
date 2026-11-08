"use client";

import React, { useState } from "react";
import { Printer } from "lucide-react";
import { Alert, Button, Modal, Select } from "@/components/ui";
import {
  CHANGE_DETAIL,
  CHANGE_TOPICS,
  changeRequestError,
  renewalLabel,
  type ChangeTopic,
} from "./billing.actions";
import { formatCents, formatDay, type Contract } from "./billing.data";
import { actionErrorText } from "./officeContext";

/* ==========================================================================
   The dialogs behind Contract & Billing's actions
   --------------------------------------------------------------------------
   Kept out of ClinicBilling.tsx, which is already a long page of panels.
   Each one is a plain controlled dialog: the page owns what is open, these
   own only their own draft. Paying and renewal choices are NephroReach's
   (no office route), so they have no dialog here.
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
  contract,
}: {
  open: boolean;
  onClose: () => void;
  clinicName: string;
  contract: Contract;
}) {
  const terms: [string, string][] = [
    ["Contract number", contract.number],
    ["Plan", contract.type],
    ["Status", contract.status],
    ["Office", clinicName || "—"],
    ["Primary contact", contract.primaryContact],
    ["Term start", formatDay(contract.start)],
    ["Term end", formatDay(contract.end)],
    ["Patient slots", String(contract.patientsAllowed)],
    ["Billing cycle", contract.billingCycle],
    ["Monthly fee", formatCents(contract.monthlyFeeCents)],
    ["Auto-renew", contract.autoRenew ? "Yes" : "No"],
    ["Renewal choice", renewalLabel(contract.renewalChoice)],
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
          {/* Printing is the browser's own. */}
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
  saving = false,
  error = null,
}: {
  open: boolean;
  onClose: () => void;
  /** Sends the request; the dialog closes when the server accepts it. */
  onSubmit: (topic: ChangeTopic, detail: string) => void;
  saving?: boolean;
  error?: unknown;
}) {
  const [topic, setTopic] = useState<ChangeTopic>("seats");
  const [detail, setDetail] = useState("");

  const invalid = changeRequestError(detail);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (invalid || saving) return;
    onSubmit(topic, detail);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request a Change"
      description="An office cannot edit its own contract. This goes to NephroReach."
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="change-request-form"
            disabled={!!invalid || saving}
          >
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
        {error ? <Alert tone="danger">{actionErrorText(error)}</Alert> : null}
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
            maxLength={CHANGE_DETAIL.max}
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            placeholder="We need 20 more patient slots from November."
            className={`${field} resize-none`}
          />
        </div>

        {detail.length > 0 && invalid ? (
          <Alert tone="warning">{invalid}</Alert>
        ) : null}
      </form>
    </Modal>
  );
}
