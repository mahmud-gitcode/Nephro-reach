"use client";

import React from "react";
import Link from "next/link";
import {
  CalendarClock,
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
  Alert,
  AsyncSection,
  Badge,
  Button,
  buttonStyles,
  Card,
  EmptyState,
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
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { useIsMounted } from "@/lib/utils/useIsMounted";
import { useLanguage } from "@/context/LanguageContext";
import { isStorageDownloadUrl } from "@/lib/utils/safeUrl";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import { tableIconButton } from "./tableButton";
import {
  billingCycleText,
  contractStatusText,
  contractTone,
  daysUntilEnd,
  formatCents,
  formatDate,
  formatDay,
  invoiceStatusText,
  invoiceTone,
  outstanding,
  paidThisMonthPct,
  termElapsedPct,
  totalPaidThisYear,
  type Contract,
  type Invoice,
} from "./billing.data";
import { changeTopicLabel, renewalLabel } from "./billing.actions";
import { useOfficeBilling, type OfficeBilling } from "./useBillingActions";
import { invoiceDownloadLink } from "./officeBilling.repository";
import { actionErrorText, useOfficeOrg } from "./officeContext";
import { ContractDocumentModal, RequestChangeModal } from "./BillingModals";

/* ==========================================================================
   Contract & Billing (Phase 14)
   --------------------------------------------------------------------------
   The office's own contract, invoices, seats and change requests, all from
   the API (useOfficeBilling). An office cannot pay an invoice or choose its
   renewal here: NephroReach marks invoices paid and holds the renewal
   choice, so those controls are hidden and the choice is shown read-only.
   An invoice PDF opens only when NephroReach issued one.
   ========================================================================== */

function useIsEs() {
  return useLanguage().language === "ES";
}

/** The error copy language for asyncState's helpers. */
const lang = (isEs: boolean) => (isEs ? "es" : "en");

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
  contract,
  invoices,
  today,
  seats,
}: {
  contract: Contract;
  invoices: Invoice[];
  today: Date;
  seats: OfficeBilling["seats"];
}) {
  const isEs = useIsEs();
  const paidPct = paidThisMonthPct(invoices, today);
  const used = seats?.used ?? 0;
  const allowed = seats?.allowed ?? null;
  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2">
      <KeyCard
        tone="brand"
        icon={<ContractSolid />}
        value={
          <Badge tone={contractTone[contract.status]} className="text-label-lg">
            {contractStatusText(contract.status, isEs)}
          </Badge>
        }
        label={isEs ? "Estado del contrato" : "Contract Status"}
        note={`${formatDay(contract.start, isEs)} – ${formatDay(contract.end, isEs)}`}
      />
      <KeyCard
        tone="success"
        icon={<MoneySolid />}
        value={formatCents(contract.monthlyFeeCents)}
        label={isEs ? "Tarifa mensual" : "Monthly Fee"}
        note={
          isEs
            ? `Facturación: ${billingCycleText(contract.billingCycle, isEs).toLowerCase()}`
            : `Billed ${contract.billingCycle.toLowerCase()}`
        }
      />
      <KeyCard
        tone="brand"
        icon={<UsersSolid />}
        value={
          <>
            {used}
            <span className="text-heading-4 text-fg-muted">
              {" "}
              / {allowed ?? (isEs ? "sin límite" : "no limit")}
            </span>
          </>
        }
        label={isEs ? "Pacientes cubiertos" : "Patients Covered"}
        note={
          seats?.available !== null && seats?.available !== undefined
            ? isEs
              ? `${seats.available} cupos disponibles`
              : `${seats.available} slots remaining`
            : isEs
              ? "Sin límite de cupos"
              : "No seat limit"
        }
      />
      <KeyCard
        tone="success"
        icon={<CheckCircleSolid />}
        value={paidPct === null ? "—" : `${paidPct}%`}
        label={isEs ? "Facturas pagadas" : "Invoices Paid"}
        note={
          isEs ? "Este mes (facturas mostradas)" : "This month (invoices shown)"
        }
      />
    </section>
  );
}

function ContractDetails({
  contract,
  billing,
  messagesHref,
  canRequest,
  onViewContract,
  onRequestChange,
}: {
  contract: Contract;
  billing: OfficeBilling;
  messagesHref: string;
  canRequest: boolean;
  onViewContract: () => void;
  onRequestChange: () => void;
}) {
  const isEs = useIsEs();
  const signedInOffice = useOptionalAuth()?.user?.org ?? null;
  const profile = billing.profile;
  const lastRequest = billing.changeRequests[0];
  const officeName =
    profile?.name ??
    signedInOffice ??
    (isEs ? "Su consultorio" : "Your office");

  const rows: [string, React.ReactNode][] = [
    [isEs ? "Contrato n.º" : "Contract #", contract.number],
    [isEs ? "Fecha de inicio" : "Start Date", formatDay(contract.start, isEs)],
    [isEs ? "Fecha de fin" : "End Date", formatDay(contract.end, isEs)],
    [
      isEs ? "Pacientes permitidos" : "Patients Allowed",
      contract.patientsAllowed,
    ],
    [
      isEs ? "Tarifa mensual" : "Monthly Fee",
      formatCents(contract.monthlyFeeCents),
    ],
    [
      isEs ? "Ciclo de facturación" : "Billing Cycle",
      billingCycleText(contract.billingCycle, isEs),
    ],
    [
      isEs ? "Renovación automática" : "Auto-Renew",
      contract.autoRenew ? (isEs ? "Sí" : "Yes") : "No",
    ],
    [isEs ? "Contacto principal" : "Primary Contact", contract.primaryContact],
    [isEs ? "Correo electrónico" : "Email", profile?.email ?? "—"],
    [isEs ? "Teléfono" : "Phone", profile?.phone ?? "—"],
  ];

  return (
    <Card as="section" padding="small" className="flex h-full flex-col">
      <PanelHeading
        title={isEs ? "Detalles del contrato" : "Contract Details"}
      />

      <div className="flex items-start gap-inline-lg">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface-brand-subtle text-brand-600"
        >
          <FileText className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-heading-5 text-fg">{officeName}</p>
          <p className="text-body-sm text-fg-muted">{contract.type}</p>
          <Badge tone={contractTone[contract.status]} className="mt-stack-xs">
            {contractStatusText(contract.status, isEs)}
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
          {isEs ? "Ver documento del contrato" : "View Contract Document"}
        </Button>
        {/* An office cannot rewrite its own contract, so the mockup's "Edit
            Contract" is a request to NephroReach (billing Edit). */}
        <Button
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          disabled={!canRequest}
          title={
            canRequest
              ? undefined
              : isEs
                ? "Su rol no puede enviar solicitudes de facturación en este consultorio."
                : "Your role cannot send billing requests in this office."
          }
          onClick={onRequestChange}
        >
          {isEs ? "Solicitar un cambio" : "Request a Change"}
        </Button>
        <Link
          href={messagesHref}
          className={buttonStyles({
            variant: "neutral",
            appearance: "fill-stroke",
            size: "small",
          })}
        >
          <MessageSquareText className="h-4 w-4" />
          {isEs ? "Enviar mensaje" : "Send Message"}
        </Link>
      </div>

      {/* The latest request stays on the card, so a sent one is visible. */}
      {lastRequest ? (
        <p className="mt-inset-md text-body-sm text-fg-muted">
          {isEs ? "Cambio solicitado por" : "Change requested by"}{" "}
          {billing.requesterLabel(lastRequest.requestedById)}:{" "}
          {changeTopicLabel(lastRequest.topic, isEs)} ·{" "}
          {formatDate(new Date(lastRequest.requestedAt), isEs)}
          {lastRequest.resolvedAt
            ? isEs
              ? ` · resuelto el ${formatDate(new Date(lastRequest.resolvedAt), isEs)}`
              : ` · resolved ${formatDate(new Date(lastRequest.resolvedAt))}`
            : isEs
              ? " · abierto"
              : " · open"}
        </p>
      ) : null}
    </Card>
  );
}

function InvoiceTable({ billing }: { billing: OfficeBilling }) {
  const isEs = useIsEs();
  const [opening, setOpening] = React.useState<string | null>(null);
  const [linkError, setLinkError] = React.useState<unknown>(null);

  const open = async (invoice: Invoice) => {
    if (!billing.orgId) return;
    setOpening(invoice.id);
    setLinkError(null);
    try {
      const link = await invoiceDownloadLink(billing.orgId, invoice.id);
      /* Defence in depth: only a presigned link on the app's file storage
         (https, or the storage stand-in on this machine; never javascript:,
         data: or blob:), whatever the server returned. */
      if (!isStorageDownloadUrl(link.url))
        throw new RangeError(
          isEs
            ? "El enlace de la factura no era válido. No se abrió nada."
            : "The invoice link was not valid. Nothing was opened.",
        );
      window.open(link.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setLinkError(error);
    } finally {
      setOpening(null);
    }
  };

  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title={isEs ? "Facturas" : "Invoices"} />
      {linkError ? (
        <Alert tone="danger" className="mb-stack-md">
          {actionErrorText(linkError, isEs)}
        </Alert>
      ) : null}
      <AsyncSection
        pending={billing.invoicesPending}
        error={billing.invoicesError}
        errorTitle={errorTitleFor(
          billing.invoicesError,
          isEs ? "Las facturas no se cargaron" : "Invoices did not load",
          lang(isEs),
        )}
        errorMessage={errorMessageFor(
          billing.invoicesError,
          undefined,
          lang(isEs),
        )}
        onRetry={
          canRetry(billing.invoicesError) ? billing.refetchInvoices : undefined
        }
        isEmpty={billing.invoices.length === 0}
        skeleton={<Skeleton height={240} />}
        empty={
          <EmptyState
            variant="bare"
            title={isEs ? "Aún no hay facturas" : "No invoices yet"}
            description={
              isEs
                ? "Las facturas aparecen aquí cuando NephroReach las emite."
                : "Invoices appear here once NephroReach issues them."
            }
          />
        }
      >
        <div className="overflow-hidden rounded-control border border-line">
          <Table minWidth={560}>
            <TableHead className="bg-surface-sunken">
              <TableRow>
                <TableHeaderCell>
                  {isEs ? "Factura n.º" : "Invoice #"}
                </TableHeaderCell>
                <TableHeaderCell>
                  {isEs ? "Período de facturación" : "Billing Period"}
                </TableHeaderCell>
                <TableHeaderCell>{isEs ? "Emitida" : "Issued"}</TableHeaderCell>
                <TableHeaderCell>{isEs ? "Vence" : "Due"}</TableHeaderCell>
                <TableHeaderCell numeric>
                  {isEs ? "Monto" : "Amount"}
                </TableHeaderCell>
                <TableHeaderCell>{isEs ? "Estado" : "Status"}</TableHeaderCell>
                <TableHeaderCell className="text-right">
                  {isEs ? "Acciones" : "Actions"}
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {billing.invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell
                    emphasis
                    className="whitespace-nowrap tabular-nums"
                  >
                    {invoice.number}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {invoice.period}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {formatDate(invoice.issued, isEs)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {formatDate(invoice.due, isEs)}
                  </TableCell>
                  <TableCell numeric>
                    {formatCents(invoice.amountCents, invoice.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge tone={invoiceTone[invoice.status]}>
                      {invoiceStatusText(invoice.status, isEs)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="neutral"
                      appearance="fill-stroke"
                      size="small"
                      iconOnly
                      className={tableIconButton}
                      disabled={!invoice.hasPdf || opening === invoice.id}
                      title={
                        invoice.hasPdf
                          ? undefined
                          : isEs
                            ? "No se ha emitido un PDF para esta factura."
                            : "No PDF has been issued for this invoice."
                      }
                      aria-label={
                        isEs
                          ? `Descargar ${invoice.number}`
                          : `Download ${invoice.number}`
                      }
                      onClick={() => void open(invoice)}
                    >
                      <Download aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {billing.hasMoreInvoices ? (
          <div className="flex justify-center pt-inset-md">
            <Button
              size="small"
              variant="neutral"
              appearance="fill-stroke"
              onClick={billing.loadMoreInvoices}
            >
              {isEs ? "Mostrar facturas anteriores" : "Show older invoices"}
            </Button>
          </div>
        ) : null}
      </AsyncSection>
    </Card>
  );
}

function SeatUsage({
  seats,
  enrollHref,
}: {
  seats: OfficeBilling["seats"];
  enrollHref: string;
}) {
  const isEs = useIsEs();
  const used = seats?.used ?? 0;
  const allowed = seats?.allowed ?? null;
  return (
    <Card as="section" padding="small" className="flex flex-col">
      <PanelHeading title={isEs ? "Cupos de pacientes" : "Patient Seats"} />
      <div className="flex items-center gap-inset-sm">
        <ProgressRing
          value={allowed ? Math.min(100, (used / allowed) * 100) : 0}
          label={isEs ? "Cupos del contrato en uso" : "Contract seats in use"}
          size={96}
        />
        <dl className="space-y-stack-xs">
          <div className="flex gap-inline-md">
            <dt className="text-body-sm text-fg-muted">
              {isEs ? "Inscritos" : "Enrolled"}
            </dt>
            <dd className="text-label-lg text-fg tabular-nums">{used}</dd>
          </div>
          <div className="flex gap-inline-md">
            <dt className="text-body-sm text-fg-muted">
              {isEs ? "Disponibles" : "Remaining"}
            </dt>
            <dd className="text-label-lg text-fg tabular-nums">
              {seats?.available ?? "—"}
            </dd>
          </div>
          <div className="flex gap-inline-md">
            <dt className="text-body-sm text-fg-muted">
              {isEs ? "Permitidos" : "Allowed"}
            </dt>
            <dd className="text-label-lg text-fg tabular-nums">
              {allowed ?? (isEs ? "Sin límite" : "No limit")}
            </dd>
          </div>
        </dl>
      </div>
      <div className="mt-auto pt-inset-md">
        <Link
          href={enrollHref}
          className={buttonStyles({
            variant: "neutral",
            appearance: "fill-stroke",
            size: "small",
            fullWidth: true,
          })}
        >
          <Users className="h-4 w-4" />
          {isEs ? "Administrar inscripciones" : "Manage Enrollment"}
        </Link>
      </div>
    </Card>
  );
}

function Renewal({ contract, today }: { contract: Contract; today: Date }) {
  const isEs = useIsEs();
  const end = contract.end;
  const days = end ? daysUntilEnd(end, today) : null;
  const elapsed = end ? termElapsedPct(contract.start, end, today) : 0;
  return (
    <Card as="section" padding="small" className="flex flex-col">
      <PanelHeading title={isEs ? "Renovación" : "Renewal"} />
      <div className="flex items-baseline justify-between gap-inline-md">
        <span className="text-body-sm text-fg-secondary">
          {isEs ? "Plazo transcurrido" : "Term elapsed"}
        </span>
        <span className="text-label-lg text-fg tabular-nums">
          {end ? `${elapsed}%` : "—"}
        </span>
      </div>
      <Progress
        value={elapsed}
        label={
          isEs ? "Plazo del contrato transcurrido" : "Contract term elapsed"
        }
        size="medium"
        className="mt-stack-xs"
      />
      <ul className="mt-stack-lg space-y-stack-sm">
        <li className="flex items-center gap-inline-md text-body-sm text-fg">
          <CalendarClock
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-fg-muted"
          />
          {end
            ? isEs
              ? `Termina el ${formatDay(end, isEs)} · quedan ${days} días`
              : `Ends ${formatDay(end)} · ${days} days left`
            : isEs
              ? "Sin fecha de finalización"
              : "No end date set"}
        </li>
        <li className="flex items-center gap-inline-md text-body-sm text-fg">
          <RefreshCw
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-fg-muted"
          />
          {contract.autoRenew
            ? isEs
              ? "Se renueva automáticamente"
              : "Renews automatically"
            : isEs
              ? "No se renueva automáticamente"
              : "Does not renew automatically"}
        </li>
      </ul>
      {/* NephroReach holds the renewal choice; an office reads it here and
          asks for a change with "Request a Change". */}
      <p className="mt-auto pt-inset-md text-body-sm text-fg-muted">
        {isEs ? "Opción de renovación" : "Renewal choice"}:{" "}
        {renewalLabel(contract.renewalChoice, isEs)}
      </p>
    </Card>
  );
}

function BillingSummary({
  contract,
  billing,
  today,
}: {
  contract: Contract;
  billing: OfficeBilling;
  today: Date;
}) {
  const isEs = useIsEs();
  const rows: [string, string][] = [
    [
      isEs
        ? `Pagado en ${today.getFullYear()}`
        : `Paid in ${today.getFullYear()}`,
      formatCents(totalPaidThisYear(billing.invoices, today)),
    ],
    [
      isEs ? "Saldo pendiente" : "Outstanding",
      formatCents(outstanding(billing.invoices)),
    ],
    [
      isEs ? "Ciclo de facturación" : "Billing cycle",
      billingCycleText(contract.billingCycle, isEs),
    ],
    [
      isEs ? "Facturas emitidas" : "Invoices issued",
      billing.invoicesTotal === null ? "—" : String(billing.invoicesTotal),
    ],
  ];

  return (
    <Card as="section" padding="small">
      <PanelHeading
        title={isEs ? "Resumen de facturación" : "Billing Summary"}
        description={
          billing.hasMoreInvoices
            ? isEs
              ? "Según las facturas mostradas."
              : "From the invoices shown."
            : undefined
        }
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

export default function ClinicBilling({
  href = "/dashboard/clinic/billing",
}: {
  /** The page in the signed-in office's own menu. */
  href?: string;
} = {}) {
  /* "This month" and the renewal countdown hang off today's date. This page
     is prerendered at build time, so the clock is read once the page is in
     the browser. */
  const isEs = useIsEs();
  const mounted = useIsMounted();
  const today = mounted ? new Date() : null;
  const billing = useOfficeBilling();
  const office = useOfficeOrg();
  const canRequest = office.can("billing", 2);
  const hospital = href.startsWith("/dashboard/hospital");

  const [contractOpen, setContractOpen] = React.useState(false);
  const [changeOpen, setChangeOpen] = React.useState(false);

  const contract = billing.contract;
  const closeChange = () => {
    billing.resetSend();
    setChangeOpen(false);
  };

  return (
    <div className="space-y-4">
      <PageTitle href={href} />

      <AsyncSection
        pending={billing.isPending || today === null}
        error={billing.error}
        errorTitle={errorTitleFor(
          billing.error,
          isEs ? "La facturación no se cargó" : "Billing did not load",
          lang(isEs),
        )}
        errorMessage={errorMessageFor(billing.error, undefined, lang(isEs))}
        onRetry={canRetry(billing.error) ? billing.refetch : undefined}
        isEmpty={contract === null}
        skeleton={
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} height={164} className="rounded-card" />
              ))}
            </div>
            <Skeleton height={480} className="rounded-card" />
          </div>
        }
        empty={
          <EmptyState
            title={isEs ? "Sin contrato" : "No contract"}
            description={
              billing.pendingContract
                ? isEs
                  ? `Un contrato comienza el ${formatDay(billing.pendingContract.start, isEs)}.`
                  : `A contract starts ${formatDay(billing.pendingContract.start)}.`
                : isEs
                  ? "Este consultorio aún no tiene un contrato con NephroReach."
                  : "This office has no NephroReach contract yet."
            }
          />
        }
      >
        {contract && today ? (
          <>
            {billing.pendingContract ? (
              <Alert tone="info">
                {isEs
                  ? `Un nuevo contrato (${billing.pendingContract.number}) comienza el ${formatDay(billing.pendingContract.start, isEs)}.`
                  : `A new contract (${billing.pendingContract.number}) starts ${formatDay(billing.pendingContract.start)}.`}
              </Alert>
            ) : null}

            <SummaryCards
              contract={contract}
              invoices={billing.invoices}
              today={today}
              seats={billing.seats}
            />

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <ContractDetails
                contract={contract}
                billing={billing}
                canRequest={canRequest}
                messagesHref={
                  hospital
                    ? "/dashboard/hospital/messages"
                    : "/dashboard/clinic/messages"
                }
                onViewContract={() => setContractOpen(true)}
                onRequestChange={() => setChangeOpen(true)}
              />
              <div className="xl:col-span-2">
                <InvoiceTable billing={billing} />
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <SeatUsage
                seats={billing.seats}
                enrollHref={
                  hospital
                    ? "/dashboard/hospital/patients"
                    : "/dashboard/clinic/enroll-patients"
                }
              />
              <Renewal contract={contract} today={today} />
              <BillingSummary
                contract={contract}
                billing={billing}
                today={today}
              />
            </section>

            <ContractDocumentModal
              open={contractOpen}
              onClose={() => setContractOpen(false)}
              clinicName={billing.profile?.name ?? ""}
              contract={contract}
            />

            <RequestChangeModal
              key={`change-${changeOpen}`}
              open={changeOpen}
              onClose={closeChange}
              saving={billing.isSending}
              error={billing.sendError}
              onSubmit={(topic, detail) =>
                billing.requestChange(
                  { topic, detail },
                  { onSuccess: closeChange },
                )
              }
            />
          </>
        ) : null}
      </AsyncSection>
    </div>
  );
}
