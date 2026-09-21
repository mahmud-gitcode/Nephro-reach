"use client";

import React from "react";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  DollarSign,
  Download,
  FileSignature,
  FileText,
  MessageSquareText,
  RefreshCw,
  Users,
} from "lucide-react";

import { PageTitle } from "@/components/layout/PageTitle";
import {
  Badge,
  Button,
  buttonStyles,
  Card,
  Progress,
  ProgressRing,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";
import { useIsMounted } from "@/lib/utils/useIsMounted";
import { tableIconButton } from "./tableButton";
import {
  contract,
  contractTone,
  daysUntilEnd,
  formatDate,
  formatMoney,
  invoicesUpTo,
  invoiceTone,
  localDate,
  nextInvoiceDate,
  outstanding,
  paidThisMonthPct,
  patientsCovered,
  termElapsedPct,
  totalPaid,
  type Invoice,
} from "./billing.data";
import { useClinicSettings } from "./useClinicSettings";

function PanelHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-stack-lg">
      <h2 className="text-heading-4 text-fg">{title}</h2>
      {description ? (
        <p className="mt-stack-xs text-body-sm text-fg-muted">{description}</p>
      ) : null}
    </div>
  );
}

function KeyCard({
  label,
  value,
  note,
  icon,
  tint,
}: {
  label: string;
  value: React.ReactNode;
  note: React.ReactNode;
  icon: React.ReactNode;
  tint: string;
}) {
  return (
    <Card as="article" padding="small" className="min-h-[164px]">
      <div className="mb-stack-md flex items-start justify-between gap-inline-lg">
        <p className="text-heading-5 text-fg-secondary">{label}</p>
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control [&_svg]:h-5 [&_svg]:w-5 ${tint}`}
        >
          {icon}
        </span>
      </div>
      <div className="text-metric-lg text-fg">{value}</div>
      <p className="mt-stack-sm text-body-sm text-fg-muted">{note}</p>
    </Card>
  );
}

function SummaryCards({
  invoices,
  today,
}: {
  invoices: Invoice[];
  today: Date;
}) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KeyCard
        label="Contract Status"
        value={
          <Badge tone={contractTone[contract.status]} className="text-label-lg">
            {contract.status}
          </Badge>
        }
        note={`${formatDate(localDate(contract.start))} – ${formatDate(localDate(contract.end))}`}
        icon={<FileSignature className="text-brand-600" />}
        tint="bg-surface-brand-subtle"
      />
      <KeyCard
        label="Monthly Fee"
        value={formatMoney(contract.monthlyFee)}
        note={`Billed ${contract.billingCycle.toLowerCase()}`}
        icon={<DollarSign className="text-success" />}
        tint="bg-success-surface"
      />
      <KeyCard
        label="Patients Covered"
        value={
          <>
            {patientsCovered}
            <span className="text-heading-4 text-fg-muted">
              {" "}
              / {contract.patientsAllowed}
            </span>
          </>
        }
        note={`${contract.patientsAllowed - patientsCovered} slots remaining`}
        icon={<Users className="text-brand-600" />}
        tint="bg-surface-brand-subtle"
      />
      <KeyCard
        label="Invoices Paid"
        value={`${paidThisMonthPct(invoices, today)}%`}
        note="This month"
        icon={<CheckCircle2 className="text-success" />}
        tint="bg-success-surface"
      />
    </section>
  );
}

function ContractDetails() {
  /* Name, email and phone are the organization profile from Settings, so
     an edit there shows here rather than leaving two copies to disagree. */
  const { settings } = useClinicSettings();
  const { profile } = settings;

  const rows: [string, React.ReactNode][] = [
    ["Contract #", contract.number],
    ["Start Date", formatDate(localDate(contract.start))],
    ["End Date", formatDate(localDate(contract.end))],
    ["Patients Allowed", contract.patientsAllowed],
    ["Monthly Fee", formatMoney(contract.monthlyFee)],
    ["Billing Cycle", contract.billingCycle],
    ["Auto-Renew", contract.autoRenew ? "Yes" : "No"],
    ["Primary Contact", contract.primaryContact],
    ["Email", profile.email],
    ["Phone", profile.phone],
  ];

  return (
    <Card as="section" padding="small" className="flex h-full flex-col">
      <PanelHeading title="Contract Details" />

      <div className="flex items-start gap-inline-lg">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface-brand-subtle text-brand-600"
        >
          <FileText className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-heading-5 text-fg">{profile.name}</p>
          <p className="text-body-sm text-fg-muted">{contract.type}</p>
          <Badge tone={contractTone[contract.status]} className="mt-stack-xs">
            {contract.status}
          </Badge>
        </div>
      </div>

      <dl className="mt-stack-lg divide-y divide-line-subtle">
        {rows.map(([term, value]) => (
          <div
            key={term}
            className="flex items-baseline justify-between gap-inline-lg py-inset-xs"
          >
            <dt className="text-body-sm text-fg-muted">{term}</dt>
            <dd className="text-right text-label-md break-all text-fg tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-auto grid gap-inline-md pt-inset-md sm:grid-cols-2">
        <Button
          {...notBuiltYet("Viewing the contract document")}
          size="small"
          className="sm:col-span-2"
        >
          <FileText className="h-4 w-4" />
          View Contract Document
        </Button>
        {/* A clinic cannot rewrite its own contract, so the mockup's "Edit
            Contract" becomes a request to NephroReach. */}
        <Button
          {...notBuiltYet("Requesting a contract change")}
          variant="neutral"
          appearance="fill-stroke"
          size="small"
        >
          Request a Change
        </Button>
        <Link
          href="/dashboard/clinic/messages"
          className={buttonStyles({
            variant: "neutral",
            appearance: "fill-stroke",
            size: "small",
          })}
        >
          <MessageSquareText className="h-4 w-4" />
          Send Message
        </Link>
      </div>
    </Card>
  );
}

function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading
        title="Invoices"
        description="Every invoice on this contract, newest first."
      />
      <div className="overflow-hidden rounded-control border border-line">
        <Table minWidth={560}>
          <TableHead className="bg-surface-sunken">
            <TableRow>
              <TableHeaderCell>Invoice #</TableHeaderCell>
              <TableHeaderCell>Billing Period</TableHeaderCell>
              <TableHeaderCell>Issued</TableHeaderCell>
              <TableHeaderCell>Due</TableHeaderCell>
              <TableHeaderCell numeric>Amount</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.number}>
                <TableCell emphasis className="whitespace-nowrap tabular-nums">
                  {invoice.number}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {invoice.period}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatDate(invoice.issued)}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatDate(invoice.due)}
                </TableCell>
                <TableCell numeric>{formatMoney(invoice.amount)}</TableCell>
                <TableCell>
                  <Badge tone={invoiceTone[invoice.status]}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    {...notBuiltYet("Downloading invoices")}
                    variant="neutral"
                    appearance="fill-stroke"
                    size="small"
                    iconOnly
                    className={tableIconButton}
                    aria-label={`Download ${invoice.number}`}
                  >
                    <Download aria-hidden="true" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function SeatUsage() {
  const remaining = contract.patientsAllowed - patientsCovered;
  return (
    <Card as="section" padding="small" className="flex flex-col">
      <PanelHeading
        title="Patient Seats"
        description="Enrolled patients against the seats in your contract."
      />
      <div className="flex items-center gap-inset-sm">
        <ProgressRing
          value={(patientsCovered / contract.patientsAllowed) * 100}
          label="Contract seats in use"
          size={96}
          thickness={11}
        />
        <dl className="space-y-stack-xs">
          <div className="flex gap-inline-md">
            <dt className="text-body-sm text-fg-muted">Enrolled</dt>
            <dd className="text-label-lg text-fg tabular-nums">
              {patientsCovered}
            </dd>
          </div>
          <div className="flex gap-inline-md">
            <dt className="text-body-sm text-fg-muted">Remaining</dt>
            <dd className="text-label-lg text-fg tabular-nums">{remaining}</dd>
          </div>
          <div className="flex gap-inline-md">
            <dt className="text-body-sm text-fg-muted">Allowed</dt>
            <dd className="text-label-lg text-fg tabular-nums">
              {contract.patientsAllowed}
            </dd>
          </div>
        </dl>
      </div>
      <div className="mt-auto pt-inset-md">
        <Link
          href="/dashboard/clinic/enroll-patients"
          className={buttonStyles({
            variant: "neutral",
            appearance: "fill-stroke",
            size: "small",
            fullWidth: true,
          })}
        >
          <Users className="h-4 w-4" />
          Manage Enrollment
        </Link>
      </div>
    </Card>
  );
}

function Renewal({ today }: { today: Date }) {
  const days = daysUntilEnd(today);
  const elapsed = termElapsedPct(today);
  return (
    <Card as="section" padding="small" className="flex flex-col">
      <PanelHeading
        title="Renewal"
        description="Where you are in the current contract term."
      />
      <div className="flex items-baseline justify-between gap-inline-md">
        <span className="text-body-sm text-fg-secondary">Term elapsed</span>
        <span className="text-label-lg text-fg tabular-nums">{elapsed}%</span>
      </div>
      <Progress
        value={elapsed}
        label="Contract term elapsed"
        size="medium"
        className="mt-stack-xs"
      />
      <ul className="mt-stack-lg space-y-stack-sm">
        <li className="flex items-center gap-inline-md text-body-sm text-fg">
          <CalendarClock
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-fg-muted"
          />
          Ends {formatDate(localDate(contract.end))} · {days} days left
        </li>
        <li className="flex items-center gap-inline-md text-body-sm text-fg">
          <RefreshCw
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-fg-muted"
          />
          {contract.autoRenew
            ? "Renews automatically"
            : "Does not renew automatically"}
        </li>
      </ul>
      <div className="mt-auto pt-inset-md">
        <Button
          {...notBuiltYet("Renewal options")}
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          fullWidth
        >
          Review Renewal Options
        </Button>
      </div>
    </Card>
  );
}

function BillingSummary({
  invoices,
  today,
}: {
  invoices: Invoice[];
  today: Date;
}) {
  const next = nextInvoiceDate(today);
  const rows: [string, string][] = [
    [`Paid in ${today.getFullYear()}`, formatMoney(totalPaid(invoices))],
    ["Outstanding", formatMoney(outstanding(invoices))],
    [
      "Next invoice",
      next
        ? `${formatDate(next)} · ${formatMoney(contract.monthlyFee)}`
        : "None — contract ends",
    ],
    ["Invoices issued", String(invoices.length)],
  ];

  return (
    <Card as="section" padding="small">
      <PanelHeading
        title="Billing Summary"
        description="What has been billed and paid on this contract."
      />
      <dl className="divide-y divide-line-subtle">
        {rows.map(([term, value]) => (
          <div
            key={term}
            className="flex items-baseline justify-between gap-inline-lg py-inset-xs first:pt-0"
          >
            <dt className="text-body-sm text-fg-muted">{term}</dt>
            <dd className="text-right text-label-lg text-fg tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export default function ClinicBilling() {
  /* Invoices, the renewal countdown and "this month" all hang off today's
     date. This page is prerendered at build time, so reading the clock
     during that render would bake in the build date and then disagree with
     the browser on hydration. Read it once the page is in the browser. */
  const mounted = useIsMounted();
  const today = mounted ? new Date() : null;
  const invoices = today ? invoicesUpTo(today) : [];

  return (
    <div className="space-y-4">
      <PageTitle href="/dashboard/clinic/billing" />

      {today === null ? (
        <div className="space-y-4" aria-busy="true">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} height={164} className="rounded-card" />
            ))}
          </div>
          <Skeleton height={480} className="rounded-card" />
        </div>
      ) : (
        <>
          <SummaryCards invoices={invoices} today={today} />

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ContractDetails />
            <div className="xl:col-span-2">
              <InvoiceTable invoices={invoices} />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <SeatUsage />
            <Renewal today={today} />
            <BillingSummary invoices={invoices} today={today} />
          </section>
        </>
      )}
    </div>
  );
}
