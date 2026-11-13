"use client";

/* Small pieces the platform consoles share (Phase 14). */

import React from "react";
import {
  Alert,
  Badge,
  Table,
  TableSkeleton,
  type BadgeTone,
} from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { isApiError } from "@/lib/api/client";
import { errorMessageFor, errorTitleFor } from "@/lib/data/asyncState";

/** The note on a control that has no server route yet (D52). */
export const NOT_AVAILABLE_NOTE =
  "Not available yet: NephroReach has no server action for this.";
export const NOT_AVAILABLE_NOTE_ES =
  "Aún no está disponible: NephroReach no tiene una acción del servidor para esto.";

/** The not-available note in the reader's language. */
export function notAvailableNote(isEs: boolean): string {
  return isEs ? NOT_AVAILABLE_NOTE_ES : NOT_AVAILABLE_NOTE;
}

/** What a failed action says. A 403 is "your role does not allow this",
 *  never a generic failure; otherwise the server's own message. */
export function actionErrorText(error: unknown, isEs = false): string {
  if (isApiError(error, { status: 403 }))
    return isEs
      ? "Su función no permite esta acción. No se cambió nada."
      : "Your role does not allow this action. Nothing was changed.";
  if (error instanceof Error && error.message) return error.message;
  return isEs
    ? "No se cambió nada. Inténtelo de nuevo."
    : "Nothing was changed. Please try again.";
}

export function ActionError({
  error,
  title,
  onDismiss,
  className,
}: {
  error: unknown;
  title?: string;
  onDismiss?: () => void;
  className?: string;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  if (!error) return null;
  return (
    <Alert
      tone="danger"
      title={title ?? (isEs ? "Eso no funcionó" : "That did not work")}
      onDismiss={onDismiss}
      className={className}
    >
      {actionErrorText(error, isEs)}
    </Alert>
  );
}

/** AsyncSection's error copy for a console read: a 403 says "no access". */
export function readErrorCopy(error: unknown, title: string, isEs = false) {
  const lang = isEs ? "es" : "en";
  return {
    errorTitle: errorTitleFor(error, title, lang),
    errorMessage: errorMessageFor(
      error,
      isEs
        ? "Aquí no se muestra nada hasta que cargue. Inténtelo de nuevo."
        : "Nothing is shown here until it loads. Please try again.",
      lang,
    ),
  };
}

export function PublishedBadge({ active }: { active: boolean }) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  return (
    <Badge tone={active ? "success" : "neutral"}>
      {active
        ? isEs
          ? "Publicado"
          : "Published"
        : isEs
          ? "No publicado"
          : "Not published"}
    </Badge>
  );
}

const CONTRACT_TONE: Record<string, BadgeTone> = {
  ACTIVE: "success",
  PENDING: "info",
  EXPIRING_SOON: "warning",
  ENDED: "neutral",
};
const CONTRACT_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  PENDING: "Pending",
  EXPIRING_SOON: "Expiring Soon",
  ENDED: "Ended",
};
const CONTRACT_LABEL_ES: Record<string, string> = {
  ACTIVE: "Activo",
  PENDING: "Pendiente",
  EXPIRING_SOON: "Vence pronto",
  ENDED: "Finalizado",
};

export function ContractStatusBadge({ status }: { status: string }) {
  const { language } = useLanguage();
  const labels = language === "ES" ? CONTRACT_LABEL_ES : CONTRACT_LABEL;
  return (
    <Badge tone={CONTRACT_TONE[status] ?? "neutral"}>
      {labels[status] ?? status}
    </Badge>
  );
}

const INVOICE_TONE: Record<string, BadgeTone> = {
  PAID: "success",
  DUE: "info",
  OVERDUE: "danger",
};
const INVOICE_LABEL: Record<string, string> = {
  PAID: "Paid",
  DUE: "Due",
  OVERDUE: "Overdue",
};
const INVOICE_LABEL_ES: Record<string, string> = {
  PAID: "Pagada",
  DUE: "Por pagar",
  OVERDUE: "Vencida",
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  const { language } = useLanguage();
  const labels = language === "ES" ? INVOICE_LABEL_ES : INVOICE_LABEL;
  return (
    <Badge tone={INVOICE_TONE[status] ?? "neutral"}>
      {labels[status] ?? status}
    </Badge>
  );
}

const SUBSCRIPTION_TONE: Record<string, BadgeTone> = {
  ACTIVE: "success",
  TRIALING: "info",
  PAST_DUE: "warning",
  CANCELLED: "danger",
};
export const SUBSCRIPTION_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  TRIALING: "Trial",
  PAST_DUE: "Past due",
  CANCELLED: "Cancelled",
};
export const SUBSCRIPTION_LABEL_ES: Record<string, string> = {
  ACTIVE: "Activa",
  TRIALING: "Prueba",
  PAST_DUE: "Pago vencido",
  CANCELLED: "Cancelada",
};

/** A subscription status in the reader's language (the code if unknown). */
export function subscriptionLabel(status: string, isEs: boolean): string {
  return (isEs ? SUBSCRIPTION_LABEL_ES : SUBSCRIPTION_LABEL)[status] ?? status;
}

export function SubscriptionStatusBadge({ status }: { status: string }) {
  const { language } = useLanguage();
  return (
    <Badge tone={SUBSCRIPTION_TONE[status] ?? "neutral"}>
      {subscriptionLabel(status, language === "ES")}
    </Badge>
  );
}

/** A plain message under a disabled control. */
export function NotAvailableNote({
  id,
  children,
}: {
  id?: string;
  children?: React.ReactNode;
}) {
  const { language } = useLanguage();
  return (
    <p id={id} className="text-caption text-fg-muted">
      {children ?? notAvailableNote(language === "ES")}
    </p>
  );
}

/** A table-shaped skeleton (TableSkeleton is a body; it needs its table). */
export function SkeletonTable({
  rows = 4,
  columns = 5,
  minWidth = 720,
}: {
  rows?: number;
  columns?: number;
  minWidth?: number;
}) {
  return (
    <Table minWidth={minWidth}>
      <TableSkeleton rows={rows} columns={columns} />
    </Table>
  );
}
