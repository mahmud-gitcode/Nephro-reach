"use client";

import React from "react";
import Link from "next/link";
import {
  CalendarClock,
  CreditCard,
  Download,
  FileText,
  MessageSquareText,
  RefreshCw,
  Users,
} from "lucide-react";

import {
  CheckCircleSolid,
  ContractSolid,
  MoneySolid,
  UsersSolid,
} from "@/components/icons/solid";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  Badge,
  Button,
  buttonStyles,
  Card,
  KeyCard,
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
import { useClinicData } from "./useClinicData";
import { useClinicSettings } from "./useClinicSettings";
import { useBillingActions } from "./useBillingActions";
import {
  applyPayments,
  changeTopicLabel,
  renewalLabel,
} from "./billing.actions";
import {
  ContractDocumentModal,
  PayInvoiceModal,
  RenewalOptionsModal,
  RequestChangeModal,
  downloadInvoice,
} from "./BillingModals";

function PanelHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  /** Pinned to the right of the title, for a panel-level action. */
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-stack-lg flex flex-wrap items-start justify-between gap-inline-md">
      <div className="min-w-0">
        <h2 className="text-heading-4 text-fg">{title}</h2>
        {description ? (
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function SummaryCards({
  invoices,
  today,
  patientsCovered,
}: {
  invoices: Invoice[];
  today: Date;
  patientsCovered: number;
}) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KeyCard
        tone="brand"
        icon={<ContractSolid />}
        value={
          <Badge tone={contractTone[contract.status]} className="text-label-lg">
            {contract.status}
          </Badge>
        }
        label="Contract Status"
        note={`${formatDate(localDate(contract.start))} – ${formatDate(localDate(contract.end))}`}
      />
      <KeyCard
        tone="success"
        icon={<MoneySolid />}
        value={formatMoney(contract.monthlyFee)}
        label="Monthly Fee"
        note={`Billed ${contract.billingCycle.toLowerCase()}`}
      />
      <KeyCard
        tone="brand"
        icon={<UsersSolid />}
        value={
          <>
            {patientsCovered}
            <span className="text-heading-4 text-fg-muted">
              {" "}
              / {contract.patientsAllowed}
            </span>
          </>
        }
        label="Patients Covered"
        note={`${contract.patientsAllowed - patientsCovered} slots remaining`}
      />
      <KeyCard
        tone="success"
        icon={<CheckCircleSolid />}
        value={`${paidThisMonthPct(invoices, today)}%`}
        label="Invoices Paid"
        note="This month"
      />
    </section>
  );
}

function ContractDetails({
  onViewContract,
  onRequestChange,
  lastRequest,
}: {
  onViewContract: () => void;
  onRequestChange: () => void;
  /** The most recent change request, so the clinic can see it landed. */
  lastRequest?: { topic: string; requestedAt: string };
}) {
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
        <Button size="small" className="sm:col-span-2" onClick={onViewContract}>
          <FileText className="h-4 w-4" />
          View Contract Document
        </Button>
        {/* A clinic cannot rewrite its own contract, so the mockup's "Edit
            Contract" becomes a request to NephroReach. */}
        <Button
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          onClick={onRequestChange}
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

      {/* A request that vanishes on send is indistinguishable from one that
          failed, so the latest one stays on the card. */}
      {lastRequest ? (
        <p className="mt-inset-md text-body-sm text-fg-muted">
          Change requested: {lastRequest.topic} ·{" "}
          {formatDate(new Date(lastRequest.requestedAt))}
        </p>
      ) : null}
    </Card>
  );
}

function InvoiceTable({
  invoices,
  onPay,
  onDownload,
}: {
  invoices: Invoice[];
  onPay: (invoices: Invoice[]) => void;
  onDownload: (invoice: Invoice) => void;
}) {
  const owed = outstanding(invoices);
  const unpaid = invoices.filter((invoice) => invoice.status !== "Paid");

  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading
        title="Invoices"
        action={
          /* Stripe is not wired up yet, so this carries the same
             not-built marker as the download above rather than pretending
             to take a payment. Disabled when there is nothing owed: a live
             Pay button over a zero balance invites a double payment. */
          <Button
            size="small"
            disabled={owed <= 0}
            onClick={() => onPay(unpaid)}
          >
            <CreditCard aria-hidden="true" />
            <span>{owed > 0 ? `Pay ${formatMoney(owed)}` : "Nothing due"}</span>
          </Button>
        }
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
                  <span className="inline-flex items-center justify-end gap-inline-xs">
                    {/* Only where money is actually owed. A Pay button on a
                        settled invoice is how somebody pays twice. */}
                    {invoice.status !== "Paid" ? (
                      <Button
                        size="small"
                        iconOnly
                        className={tableIconButton}
                        aria-label={`Pay ${invoice.number}`}
                        onClick={() => onPay([invoice])}
                      >
                        <CreditCard aria-hidden="true" />
                      </Button>
                    ) : null}
                    <Button
                      variant="neutral"
                      appearance="fill-stroke"
                      size="small"
                      iconOnly
                      className={tableIconButton}
                      aria-label={`Download ${invoice.number}`}
                      onClick={() => onDownload(invoice)}
                    >
                      <Download aria-hidden="true" />
                    </Button>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function SeatUsage({ patientsCovered }: { patientsCovered: number }) {
  const remaining = contract.patientsAllowed - patientsCovered;
  return (
    <Card as="section" padding="small" className="flex flex-col">
      <PanelHeading title="Patient Seats" />
      <div className="flex items-center gap-inset-sm">
        <ProgressRing
          value={(patientsCovered / contract.patientsAllowed) * 100}
          label="Contract seats in use"
          size={96}
          thickness={14}
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

function Renewal({
  today,
  renewal,
  onReview,
}: {
  today: Date;
  renewal: string;
  onReview: () => void;
}) {
  const days = daysUntilEnd(today);
  const elapsed = termElapsedPct(today);
  return (
    <Card as="section" padding="small" className="flex flex-col">
      <PanelHeading title="Renewal" />
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
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          fullWidth
          onClick={onReview}
        >
          Review Renewal Options
        </Button>
        <p className="mt-inset-xs text-center text-body-sm text-fg-muted">
          {renewal}
        </p>
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
      <PanelHeading title="Billing Summary" />
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
  /* Seats in use come from the live roster, so a patient enrolled on Enroll
     Patients counts here at once; the demo count stands in until it loads. */
  const clinic = useClinicData();
  const covered = clinic.data?.patients.length ?? patientsCovered;
  const today = mounted ? new Date() : null;

  /* What this clinic has done here — payments made, changes asked for, the
     renewal choice. The invoices themselves stay derived from the contract;
     payments are folded in on read so there is still one source of truth
     for what was billed. */
  const billing = useBillingActions();
  const { settings } = useClinicSettings();
  const invoices = today
    ? applyPayments(invoicesUpTo(today), billing.paidInvoices)
    : [];

  const [contractOpen, setContractOpen] = React.useState(false);
  const [changeOpen, setChangeOpen] = React.useState(false);
  const [renewalOpen, setRenewalOpen] = React.useState(false);
  const [paying, setPaying] = React.useState<Invoice[] | null>(null);

  const lastRequest = billing.changeRequests[0];

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
          <SummaryCards
            invoices={invoices}
            today={today}
            patientsCovered={covered}
          />

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ContractDetails
              onViewContract={() => setContractOpen(true)}
              onRequestChange={() => setChangeOpen(true)}
              lastRequest={
                lastRequest
                  ? {
                      topic: changeTopicLabel(lastRequest.topic),
                      requestedAt: lastRequest.requestedAt,
                    }
                  : undefined
              }
            />
            <div className="xl:col-span-2">
              <InvoiceTable
                invoices={invoices}
                onPay={(unpaid) => setPaying(unpaid)}
                onDownload={(invoice) =>
                  downloadInvoice(invoice, settings.profile.name)
                }
              />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <SeatUsage patientsCovered={covered} />
            <Renewal
              today={today}
              renewal={renewalLabel(billing.renewal)}
              onReview={() => setRenewalOpen(true)}
            />
            <BillingSummary invoices={invoices} today={today} />
          </section>

          {/* The dialogs behind the four actions above. Each is keyed on
              open so a reopened form starts clean, with no effect syncing
              a draft back to props. */}
          <ContractDocumentModal
            open={contractOpen}
            onClose={() => setContractOpen(false)}
            clinicName={settings.profile.name}
          />

          <RequestChangeModal
            key={`change-${changeOpen}`}
            open={changeOpen}
            onClose={() => setChangeOpen(false)}
            onSubmit={billing.requestChange}
          />

          <PayInvoiceModal
            open={paying !== null}
            onClose={() => setPaying(null)}
            invoices={paying ?? []}
            onPaid={billing.pay}
          />

          <RenewalOptionsModal
            key={`renewal-${renewalOpen}`}
            open={renewalOpen}
            onClose={() => setRenewalOpen(false)}
            current={billing.renewal}
            onChoose={billing.setRenewal}
          />
        </>
      )}
    </div>
  );
}
