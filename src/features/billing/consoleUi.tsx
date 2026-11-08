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
import { isApiError } from "@/lib/api/client";
import { errorMessageFor, errorTitleFor } from "@/lib/data/asyncState";

/** The note on a control that has no server route yet (D52). */
export const NOT_AVAILABLE_NOTE =
  "Not available yet: NephroReach has no server action for this.";

/** What a failed action says. A 403 is "your role does not allow this",
 *  never a generic failure; otherwise the server's own message. */
export function actionErrorText(error: unknown): string {
  if (isApiError(error, { status: 403 }))
    return "Your role does not allow this action. Nothing was changed.";
  if (error instanceof Error && error.message) return error.message;
  return "Nothing was changed. Please try again.";
}

export function ActionError({
  error,
  title = "That did not work",
  onDismiss,
  className,
}: {
  error: unknown;
  title?: string;
  onDismiss?: () => void;
  className?: string;
}) {
  if (!error) return null;
  return (
    <Alert
      tone="danger"
      title={title}
      onDismiss={onDismiss}
      className={className}
    >
      {actionErrorText(error)}
    </Alert>
  );
}

/** AsyncSection's error copy for a console read: a 403 says "no access". */
export function readErrorCopy(error: unknown, title: string) {
  return {
    errorTitle: errorTitleFor(error, title),
    errorMessage: errorMessageFor(
      error,
      "Nothing is shown here until it loads. Please try again.",
    ),
  };
}

export function PublishedBadge({ active }: { active: boolean }) {
  return (
    <Badge tone={active ? "success" : "neutral"}>
      {active ? "Published" : "Not published"}
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

export function ContractStatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={CONTRACT_TONE[status] ?? "neutral"}>
      {CONTRACT_LABEL[status] ?? status}
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

export function InvoiceStatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={INVOICE_TONE[status] ?? "neutral"}>
      {INVOICE_LABEL[status] ?? status}
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

export function SubscriptionStatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={SUBSCRIPTION_TONE[status] ?? "neutral"}>
      {SUBSCRIPTION_LABEL[status] ?? status}
    </Badge>
  );
}

/** A plain message under a disabled control. */
export function NotAvailableNote({
  id,
  children = NOT_AVAILABLE_NOTE,
}: {
  id?: string;
  children?: React.ReactNode;
}) {
  return (
    <p id={id} className="text-caption text-fg-muted">
      {children}
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
