"use client";

import React, { useState } from "react";
import { Printer } from "lucide-react";
import { Alert, Button, Modal, Select } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import {
  CHANGE_DETAIL,
  CHANGE_TOPICS,
  changeRequestError,
  renewalLabel,
  type ChangeTopic,
} from "./billing.actions";
import {
  billingCycleText,
  contractStatusText,
  formatCents,
  formatDay,
  type Contract,
} from "./billing.data";
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
  const { language } = useLanguage();
  const isEs = language === "ES";
  const terms: [string, string][] = [
    [isEs ? "Número de contrato" : "Contract number", contract.number],
    ["Plan", contract.type],
    [isEs ? "Estado" : "Status", contractStatusText(contract.status, isEs)],
    [isEs ? "Consultorio" : "Office", clinicName || "—"],
    [isEs ? "Contacto principal" : "Primary contact", contract.primaryContact],
    [isEs ? "Inicio del plazo" : "Term start", formatDay(contract.start, isEs)],
    [isEs ? "Fin del plazo" : "Term end", formatDay(contract.end, isEs)],
    [
      isEs ? "Cupos de pacientes" : "Patient slots",
      String(contract.patientsAllowed),
    ],
    [
      isEs ? "Ciclo de facturación" : "Billing cycle",
      billingCycleText(contract.billingCycle, isEs),
    ],
    [
      isEs ? "Tarifa mensual" : "Monthly fee",
      formatCents(contract.monthlyFeeCents),
    ],
    [
      isEs ? "Renovación automática" : "Auto-renew",
      contract.autoRenew ? (isEs ? "Sí" : "Yes") : "No",
    ],
    [
      isEs ? "Opción de renovación" : "Renewal choice",
      renewalLabel(contract.renewalChoice, isEs),
    ],
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title={isEs ? "Documento del contrato" : "Contract Document"}
      description={`${contract.number} — ${contract.type}`}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cerrar" : "Close"}
          </Button>
          {/* Printing is the browser's own. */}
          <Button onClick={() => window.print()}>
            <Printer aria-hidden="true" />
            <span>{isEs ? "Imprimir" : "Print"}</span>
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
        {isEs
          ? "Este es el resumen oficial que conserva NephroReach. El acuerdo firmado lo conserva su gerente de éxito de socios."
          : "This is the summary of record held by NephroReach. The signed agreement is held by your partner success manager."}
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
  const { language } = useLanguage();
  const isEs = language === "ES";
  const [topic, setTopic] = useState<ChangeTopic>("seats");
  const [detail, setDetail] = useState("");

  const invalid = changeRequestError(detail, isEs);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (invalid || saving) return;
    onSubmit(topic, detail);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEs ? "Solicitar un cambio" : "Request a Change"}
      description={
        isEs
          ? "Un consultorio no puede editar su propio contrato. Esta solicitud se envía a NephroReach."
          : "An office cannot edit its own contract. This goes to NephroReach."
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            type="submit"
            form="change-request-form"
            disabled={!!invalid || saving}
          >
            {isEs ? "Enviar solicitud" : "Send Request"}
          </Button>
        </>
      }
    >
      <form
        id="change-request-form"
        onSubmit={handleSubmit}
        className="space-y-stack-md"
      >
        {error ? (
          <Alert tone="danger">{actionErrorText(error, isEs)}</Alert>
        ) : null}
        <div className="space-y-1.5">
          <label
            htmlFor="change-topic"
            className="block text-label-md text-fg-secondary"
          >
            {isEs ? "Qué debe cambiar" : "What should change"}
          </label>
          <Select
            id="change-topic"
            selectSize="small"
            value={topic}
            onChange={(event) => setTopic(event.target.value as ChangeTopic)}
          >
            {CHANGE_TOPICS.map((option) => (
              <option key={option.value} value={option.value}>
                {isEs ? option.labelEs : option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="change-detail"
            className="block text-label-md text-fg-secondary"
          >
            {isEs ? "Detalles" : "Details"}
          </label>
          <textarea
            id="change-detail"
            rows={4}
            maxLength={CHANGE_DETAIL.max}
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            placeholder={
              isEs
                ? "Necesitamos 20 cupos de pacientes más a partir de noviembre."
                : "We need 20 more patient slots from November."
            }
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
