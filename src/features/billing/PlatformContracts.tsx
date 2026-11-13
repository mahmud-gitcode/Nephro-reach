"use client";

/* ==========================================================================
   Contracts, invoices and change requests: the platform side (Phase 14.6)
   --------------------------------------------------------------------------
   - Contracts (`/platform/contracts`): which plan each office is on, its
     term and status. New, activate, renew and end need contracts WRITE.
   - Invoices (`/platform/invoices`): issued against a contract (WRITE);
     "Mark paid" needs contracts MANAGE. Amounts are cents.
   - Change requests (`/platform/contract-change-requests`): what offices
     asked for; "Resolve" needs contracts MANAGE.
   The UI hides what the role cannot do; the server refuses it anyway.
   Every list is one server page. Office names come from
   `/platform/organizations`; an office not on that page shows its id.
   ========================================================================== */

import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  Alert,
  AsyncSection,
  Button,
  Card,
  FormField,
  Input,
  Modal,
  Select,
  SwitchRow,
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TablePagination,
  TableRow,
  TabPanel,
  Tabs,
} from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { canRetry } from "@/lib/data/asyncState";
import { useCanLevel } from "@/features/staff/useStaffAccounts";
import {
  ActionError,
  ContractStatusBadge,
  InvoiceStatusBadge,
  SkeletonTable,
  actionErrorText,
  notAvailableNote,
  readErrorCopy,
} from "./consoleUi";
import {
  centsToInput,
  formatCents,
  formatDay,
  formatInstant,
  parseDollars,
} from "./money";
import { audienceLabelFor, type AdminOrgPlan } from "./platformPlans.mappers";
import type {
  ApiContract,
  ApiPlatformOrganization,
} from "./platformContracts.repository";
import {
  useChangeRequests,
  useContracts,
  useInvoices,
  useOrganizationNames,
} from "./usePlatformBilling";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

const TOPIC_LABEL: Record<string, string> = {
  seats: "Seats",
  fee: "Fee",
  dates: "Dates",
  contact: "Contact",
  other: "Other",
};
const TOPIC_LABEL_ES: Record<string, string> = {
  seats: "Plazas",
  fee: "Tarifa",
  dates: "Fechas",
  contact: "Contacto",
  other: "Otro",
};

function topicLabel(topic: string, isEs: boolean): string {
  return (isEs ? TOPIC_LABEL_ES : TOPIC_LABEL)[topic] ?? topic;
}

/** Today as YYYY-MM-DD on this computer's calendar. */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function PlatformContracts({ orgPlans }: { orgPlans: AdminOrgPlan[] }) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const orgs = useOrganizationNames();
  const label = (id: string) =>
    orgs.nameOf(id) ?? `${isEs ? "Oficina" : "Office"} ${id.slice(0, 8)}`;
  return (
    <>
      <ContractsCard
        orgPlans={orgPlans}
        organizations={orgs.organizations}
        label={label}
      />
      <InvoicesCard label={label} />
      <ChangeRequestsCard label={label} />
    </>
  );
}

/* ------------------------------------------------------------ contracts */

function ContractsCard({
  orgPlans,
  organizations,
  label,
}: {
  orgPlans: AdminOrgPlan[];
  organizations: ApiPlatformOrganization[];
  label: (id: string) => string;
}) {
  const [page, setPage] = useState(1);
  const contracts = useContracts(page);
  const canWrite = useCanLevel("contracts", 2);
  const [creating, setCreating] = useState(false);
  const [renewing, setRenewing] = useState<ApiContract | null>(null);
  const { language } = useLanguage();
  const isEs = language === "ES";
  const copy = readErrorCopy(
    contracts.error,
    isEs ? "Los contratos no se cargaron" : "The contracts did not load",
    isEs,
  );
  const notAvailable = notAvailableNote(isEs);

  return (
    <Card padding="none">
      <div className="flex flex-col gap-inline-lg p-card sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-heading-5 text-fg">
            {isEs ? "Organizaciones" : "Organizations"}
          </h3>
          <p className="mt-stack-xs text-caption text-fg-muted">
            {isEs
              ? "El plan de cada oficina es su contrato: el plan, los pacientes permitidos, la tarifa y el plazo."
              : "Each office's plan is its contract: the plan, the patients allowed, the fee and the term."}
          </p>
        </div>
        {canWrite ? (
          <Button
            size="small"
            variant="neutral"
            appearance="fill-stroke"
            leadingIcon={<Plus aria-hidden="true" />}
            onClick={() => {
              contracts.resetCreate();
              setCreating(true);
            }}
          >
            {isEs ? "Nuevo contrato" : "New Contract"}
          </Button>
        ) : null}
      </div>
      <div className="px-card">
        <ActionError
          error={contracts.actionError}
          title={isEs ? "El contrato no cambió" : "The contract did not change"}
          onDismiss={contracts.dismissActionError}
          className="mb-stack-md"
        />
      </div>
      <AsyncSection
        pending={contracts.isPending}
        error={contracts.error}
        onRetry={canRetry(contracts.error) ? contracts.refetch : undefined}
        {...copy}
        skeleton={<SkeletonTable rows={4} columns={6} minWidth={900} />}
      >
        <Table minWidth={900}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>
                {isEs ? "Organización" : "Organization"}
              </TableHeaderCell>
              <TableHeaderCell>Plan</TableHeaderCell>
              <TableHeaderCell>
                {isEs ? "Tarifa mensual" : "Monthly fee"}
              </TableHeaderCell>
              <TableHeaderCell>{isEs ? "Plazo" : "Term"}</TableHeaderCell>
              <TableHeaderCell>{isEs ? "Estado" : "Status"}</TableHeaderCell>
              <TableHeaderCell className="text-right">
                {isEs ? "Acciones" : "Actions"}
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contracts.contracts.length === 0 ? (
              <TableEmptyRow colSpan={6}>
                <p className="text-body-sm text-fg-muted">
                  {isEs ? "Aún no hay contratos." : "No contracts yet."}
                </p>
              </TableEmptyRow>
            ) : null}
            {contracts.contracts.map((c) => (
              <TableRow key={c.id}>
                <TableCell emphasis>
                  {label(c.organizationId)}
                  <span className="block text-caption text-fg-muted">
                    {c.contractNumber ??
                      (isEs
                        ? "Sin número de contrato"
                        : "No contract number")}{" "}
                    · {c.patientsAllowed} {isEs ? "pacientes" : "patients"}
                  </span>
                </TableCell>
                <TableCell>{c.plan.name}</TableCell>
                <TableCell numeric>
                  {formatCents(c.monthlyFeeCents, "USD", isEs)}
                </TableCell>
                <TableCell>
                  {formatDay(c.startsOn, isEs)} – {formatDay(c.endsOn, isEs)}
                </TableCell>
                <TableCell>
                  <ContractStatusBadge status={c.status} />
                </TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex flex-wrap justify-end gap-inline-sm">
                    {canWrite && c.status === "PENDING" ? (
                      <Button
                        size="small"
                        variant="neutral"
                        appearance="stroke"
                        loading={contracts.actionPendingId === c.id}
                        onClick={() => contracts.setStatus(c.id, "activate")}
                        aria-label={
                          isEs
                            ? `Activar el contrato de ${label(c.organizationId)}`
                            : `Activate the contract for ${label(c.organizationId)}`
                        }
                      >
                        {isEs ? "Activar" : "Activate"}
                      </Button>
                    ) : null}
                    {canWrite && c.status !== "ENDED" ? (
                      <>
                        <Button
                          size="small"
                          variant="neutral"
                          appearance="stroke"
                          onClick={() => {
                            contracts.resetRenew();
                            setRenewing(c);
                          }}
                          aria-label={
                            isEs
                              ? `Renovar el contrato de ${label(c.organizationId)}`
                              : `Renew the contract for ${label(c.organizationId)}`
                          }
                        >
                          {isEs ? "Renovar" : "Renew"}
                        </Button>
                        <Button
                          size="small"
                          variant="danger"
                          appearance="stroke"
                          loading={contracts.actionPendingId === c.id}
                          onClick={() => contracts.setStatus(c.id, "end")}
                          aria-label={
                            isEs
                              ? `Finalizar el contrato de ${label(c.organizationId)}`
                              : `End the contract for ${label(c.organizationId)}`
                          }
                        >
                          {isEs ? "Finalizar" : "End"}
                        </Button>
                      </>
                    ) : null}
                    {/* The prototype's Trial / Paused statuses have no server
                        equivalent (contract statuses are Pending, Active,
                        Expiring Soon, Ended). */}
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="ghost"
                      disabled
                      title={notAvailable}
                      aria-label={
                        isEs
                          ? `Pausar el contrato de ${label(c.organizationId)} (aún no está disponible)`
                          : `Pause the contract for ${label(c.organizationId)} (not available yet)`
                      }
                    >
                      {isEs ? "Pausar" : "Pause"}
                    </Button>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="px-card pb-card">
          <TablePagination
            page={page}
            pageCount={contracts.pageCount}
            onPageChange={setPage}
            summary={
              contracts.total === null
                ? undefined
                : isEs
                  ? `${contracts.total} contrato${contracts.total === 1 ? "" : "s"}`
                  : `${contracts.total} contract${contracts.total === 1 ? "" : "s"}`
            }
          />
          <p className="mt-stack-xs text-caption text-fg-muted">
            {isEs ? "Pausa y prueba" : "Pause and trial"}:{" "}
            {notAvailable.toLowerCase()}
          </p>
        </div>
      </AsyncSection>

      {creating ? (
        <NewContractModal
          orgPlans={orgPlans}
          organizations={organizations}
          saving={contracts.isCreating}
          error={contracts.createError}
          onClose={() => setCreating(false)}
          onSave={(body) => {
            void contracts
              .create(body)
              .then(() => setCreating(false))
              .catch(() => {});
          }}
        />
      ) : null}
      {renewing ? (
        <RenewContractModal
          contract={renewing}
          name={label(renewing.organizationId)}
          saving={contracts.isRenewing}
          error={contracts.renewError}
          onClose={() => setRenewing(null)}
          onSave={(body) => {
            void contracts
              .renew(renewing.id, body)
              .then(() => setRenewing(null))
              .catch(() => {});
          }}
        />
      ) : null}
    </Card>
  );
}

function NewContractModal({
  orgPlans,
  organizations,
  saving,
  error,
  onSave,
  onClose,
}: {
  orgPlans: AdminOrgPlan[];
  organizations: ApiPlatformOrganization[];
  saving: boolean;
  error: unknown;
  onSave: (body: {
    organizationId: string;
    planId: string;
    status: "PENDING" | "ACTIVE";
    startsOn: string;
    endsOn: string | null;
    contractNumber: string | null;
    autoRenew: boolean;
  }) => void;
  onClose: () => void;
}) {
  const offices = organizations.filter(
    (o) => o.type !== "PLATFORM" && o.status === "ACTIVE",
  );
  const [organizationId, setOrganizationId] = useState(offices[0]?.id ?? "");
  const office = offices.find((o) => o.id === organizationId);
  const plansFor = useMemo(
    () => orgPlans.filter((p) => p.active && p.audience === office?.type),
    [orgPlans, office?.type],
  );
  const [planId, setPlanId] = useState("");
  const chosenPlan = plansFor.find((p) => p.id === planId) ?? plansFor[0];
  const [startsOn, setStartsOn] = useState(today());
  const [endsOn, setEndsOn] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [activate, setActivate] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);
  const [tried, setTried] = useState(false);
  const { language } = useLanguage();
  const isEs = language === "ES";

  const officeError = office
    ? undefined
    : isEs
      ? "Elija una oficina."
      : "Choose an office.";
  const planError = chosenPlan
    ? undefined
    : isEs
      ? "No hay un plan publicado para este tipo de oficina."
      : "There is no published plan for this type of office.";
  const startError = DAY.test(startsOn)
    ? undefined
    : isEs
      ? "Elija una fecha de inicio."
      : "Choose a start date.";
  const endError =
    !endsOn || (DAY.test(endsOn) && endsOn >= startsOn)
      ? undefined
      : isEs
        ? "La fecha de finalización debe ser igual o posterior a la fecha de inicio."
        : "The end date must be on or after the start date.";

  return (
    <Modal
      open
      onClose={onClose}
      title={isEs ? "Nuevo contrato" : "New Contract"}
      description={
        isEs
          ? "Se aplican la tarifa y el límite de pacientes del plan; el servidor registra quién lo creó."
          : "The plan's fee and patient limit apply; the server records who made it."
      }
      footer={
        <>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={onClose}
            disabled={saving}
          >
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            loading={saving}
            onClick={() => {
              setTried(true);
              if (officeError || planError || startError || endError) return;
              onSave({
                organizationId,
                planId: chosenPlan!.id,
                status: activate ? "ACTIVE" : "PENDING",
                startsOn,
                endsOn: endsOn || null,
                contractNumber: contractNumber.trim() || null,
                autoRenew,
              });
            }}
          >
            {isEs ? "Crear contrato" : "Create Contract"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {error ? (
          <Alert
            tone="danger"
            title={
              isEs ? "El contrato no se creó" : "The contract was not created"
            }
          >
            {actionErrorText(error, isEs)}
          </Alert>
        ) : null}
        <FormField
          label={isEs ? "Oficina" : "Office"}
          required
          error={tried ? officeError : undefined}
        >
          {(field) => (
            <Select
              {...field}
              value={organizationId}
              onChange={(e) => {
                setOrganizationId(e.target.value);
                setPlanId("");
              }}
            >
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} · {audienceLabelFor(o.type, isEs)}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField
          label="Plan"
          required
          error={tried ? planError : undefined}
          hint={
            chosenPlan
              ? isEs
                ? `${formatCents(chosenPlan.monthlyFeeCents, "USD", true)} al mes · ${chosenPlan.patientsIncluded} pacientes`
                : `${formatCents(chosenPlan.monthlyFeeCents)} a month · ${chosenPlan.patientsIncluded} patients`
              : undefined
          }
        >
          {(field) => (
            <Select
              {...field}
              value={chosenPlan?.id ?? ""}
              onChange={(e) => setPlanId(e.target.value)}
            >
              {plansFor.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <div className="grid grid-cols-1 gap-inline-lg sm:grid-cols-2">
          <FormField
            label={isEs ? "Comienza el" : "Starts on"}
            required
            error={tried ? startError : undefined}
          >
            {(field) => (
              <Input
                {...field}
                type="date"
                value={startsOn}
                onChange={(e) => setStartsOn(e.target.value)}
              />
            )}
          </FormField>
          <FormField
            label={isEs ? "Termina el" : "Ends on"}
            error={tried ? endError : undefined}
          >
            {(field) => (
              <Input
                {...field}
                type="date"
                value={endsOn}
                onChange={(e) => setEndsOn(e.target.value)}
              />
            )}
          </FormField>
        </div>
        <FormField label={isEs ? "Número de contrato" : "Contract number"}>
          {(field) => (
            <Input
              {...field}
              maxLength={40}
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              placeholder={isEs ? "p. ej., NR-2027-0001" : "e.g. NR-2027-0001"}
            />
          )}
        </FormField>
        <SwitchRow
          checked={activate}
          onChange={setActivate}
          title={
            isEs
              ? "Activo desde la fecha de inicio"
              : "Active from the start date"
          }
          description={
            isEs
              ? "Desactivado: el contrato queda como Pendiente hasta que alguien lo active."
              : "Off: the contract waits as Pending until someone activates it."
          }
        />
        <SwitchRow
          checked={autoRenew}
          onChange={setAutoRenew}
          title={isEs ? "Se renueva automáticamente" : "Renews automatically"}
        />
      </div>
    </Modal>
  );
}

function RenewContractModal({
  contract,
  name,
  saving,
  error,
  onSave,
  onClose,
}: {
  contract: ApiContract;
  name: string;
  saving: boolean;
  error: unknown;
  onSave: (body: {
    startsOn: string;
    endsOn: string | null;
    monthlyFeeCents: number;
    patientsAllowed: number;
  }) => void;
  onClose: () => void;
}) {
  const [startsOn, setStartsOn] = useState(
    contract.endsOn && DAY.test(contract.endsOn)
      ? nextDay(contract.endsOn)
      : today(),
  );
  const [endsOn, setEndsOn] = useState("");
  const [fee, setFee] = useState(centsToInput(contract.monthlyFeeCents));
  const [patients, setPatients] = useState(String(contract.patientsAllowed));
  const [tried, setTried] = useState(false);
  const cents = parseDollars(fee);
  const { language } = useLanguage();
  const isEs = language === "ES";
  const startError = DAY.test(startsOn)
    ? undefined
    : isEs
      ? "Elija una fecha de inicio."
      : "Choose a start date.";
  const endError =
    !endsOn || (DAY.test(endsOn) && endsOn >= startsOn)
      ? undefined
      : isEs
        ? "La fecha de finalización debe ser igual o posterior a la fecha de inicio."
        : "The end date must be on or after the start date.";
  const feeError =
    cents !== null
      ? undefined
      : isEs
        ? "Ingrese la tarifa en dólares y centavos."
        : "Enter the fee in dollars and cents.";
  const patientsError =
    /^\d+$/.test(patients.trim()) && Number(patients) >= 1
      ? undefined
      : isEs
        ? "Ingrese un número entero de pacientes."
        : "Enter a whole number of patients.";

  return (
    <Modal
      open
      onClose={onClose}
      title={isEs ? `Renovar: ${name}` : `Renew: ${name}`}
      description={
        isEs
          ? "La renovación inicia un nuevo plazo; el actual conserva su historial."
          : "The renewal starts a new term; the current one keeps its history."
      }
      footer={
        <>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={onClose}
            disabled={saving}
          >
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            loading={saving}
            onClick={() => {
              setTried(true);
              if (startError || endError || feeError || patientsError) return;
              onSave({
                startsOn,
                endsOn: endsOn || null,
                monthlyFeeCents: cents!,
                patientsAllowed: Number(patients),
              });
            }}
          >
            {isEs ? "Renovar contrato" : "Renew Contract"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {error ? (
          <Alert
            tone="danger"
            title={
              isEs ? "El contrato no se renovó" : "The contract was not renewed"
            }
          >
            {actionErrorText(error, isEs)}
          </Alert>
        ) : null}
        <div className="grid grid-cols-1 gap-inline-lg sm:grid-cols-2">
          <FormField
            label={isEs ? "El nuevo plazo comienza" : "New term starts"}
            required
            error={tried ? startError : undefined}
          >
            {(field) => (
              <Input
                {...field}
                type="date"
                value={startsOn}
                onChange={(e) => setStartsOn(e.target.value)}
              />
            )}
          </FormField>
          <FormField
            label={isEs ? "El nuevo plazo termina" : "New term ends"}
            error={tried ? endError : undefined}
          >
            {(field) => (
              <Input
                {...field}
                type="date"
                value={endsOn}
                onChange={(e) => setEndsOn(e.target.value)}
              />
            )}
          </FormField>
        </div>
        <div className="grid grid-cols-1 gap-inline-lg sm:grid-cols-2">
          <FormField
            label={isEs ? "Tarifa mensual (USD)" : "Monthly fee (USD)"}
            required
            error={tried ? feeError : undefined}
          >
            {(field) => (
              <Input
                {...field}
                inputMode="decimal"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            )}
          </FormField>
          <FormField
            label={isEs ? "Pacientes permitidos" : "Patients allowed"}
            required
            error={tried ? patientsError : undefined}
          >
            {(field) => (
              <Input
                {...field}
                type="number"
                min={1}
                value={patients}
                onChange={(e) => setPatients(e.target.value)}
              />
            )}
          </FormField>
        </div>
      </div>
    </Modal>
  );
}

function nextDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/* ------------------------------------------------------------- invoices */

function InvoicesCard({ label }: { label: (id: string) => string }) {
  const [page, setPage] = useState(1);
  const invoices = useInvoices(page);
  const contracts = useContracts(1);
  const canWrite = useCanLevel("contracts", 2);
  const canManage = useCanLevel("contracts", 3);
  const [issuing, setIssuing] = useState(false);
  const { language } = useLanguage();
  const isEs = language === "ES";
  const copy = readErrorCopy(
    invoices.error,
    isEs ? "Las facturas no se cargaron" : "The invoices did not load",
    isEs,
  );

  return (
    <Card padding="none">
      <div className="flex flex-col gap-inline-lg p-card sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-heading-5 text-fg">
            {isEs ? "Facturas" : "Invoices"}
          </h3>
          <p className="mt-stack-xs text-caption text-fg-muted">
            {isEs
              ? "Emitidas contra un contrato. Las oficinas ven sus propias facturas en su página de facturación."
              : "Issued against a contract. Offices see their own invoices on their billing page."}
          </p>
        </div>
        {canWrite ? (
          <Button
            size="small"
            variant="neutral"
            appearance="fill-stroke"
            leadingIcon={<Plus aria-hidden="true" />}
            onClick={() => {
              invoices.resetCreate();
              setIssuing(true);
            }}
          >
            {isEs ? "Emitir factura" : "Issue Invoice"}
          </Button>
        ) : null}
      </div>
      <div className="px-card">
        <ActionError
          error={invoices.markPaidError}
          title={
            isEs
              ? "La factura no se marcó como pagada"
              : "The invoice was not marked paid"
          }
          onDismiss={invoices.dismissMarkPaidError}
          className="mb-stack-md"
        />
      </div>
      <AsyncSection
        pending={invoices.isPending}
        error={invoices.error}
        onRetry={canRetry(invoices.error) ? invoices.refetch : undefined}
        {...copy}
        skeleton={<SkeletonTable rows={3} columns={6} minWidth={860} />}
      >
        <Table minWidth={860}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{isEs ? "Factura" : "Invoice"}</TableHeaderCell>
              <TableHeaderCell>
                {isEs ? "Organización" : "Organization"}
              </TableHeaderCell>
              <TableHeaderCell>{isEs ? "Monto" : "Amount"}</TableHeaderCell>
              <TableHeaderCell>{isEs ? "Vence" : "Due"}</TableHeaderCell>
              <TableHeaderCell>{isEs ? "Estado" : "Status"}</TableHeaderCell>
              <TableHeaderCell className="text-right">
                {isEs ? "Acciones" : "Actions"}
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.invoices.length === 0 ? (
              <TableEmptyRow colSpan={6}>
                <p className="text-body-sm text-fg-muted">
                  {isEs ? "Aún no hay facturas." : "No invoices yet."}
                </p>
              </TableEmptyRow>
            ) : null}
            {invoices.invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell emphasis>
                  {inv.number}
                  <span className="block text-caption text-fg-muted">
                    {inv.periodLabel} · {isEs ? "emitida el" : "issued"}{" "}
                    {formatDay(inv.issuedOn, isEs)}
                  </span>
                </TableCell>
                <TableCell>{label(inv.organizationId)}</TableCell>
                <TableCell numeric>
                  {formatCents(inv.amountCents, inv.currency || "USD", isEs)}
                </TableCell>
                <TableCell>{formatDay(inv.dueOn, isEs)}</TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={inv.status} />
                  {inv.paidAt ? (
                    <span className="block text-caption text-fg-muted">
                      {formatInstant(inv.paidAt, isEs)}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-right">
                  {canManage && inv.status !== "PAID" ? (
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="stroke"
                      loading={invoices.markPaidPendingId === inv.id}
                      onClick={() => invoices.markPaid(inv.id)}
                      aria-label={
                        isEs
                          ? `Marcar ${inv.number} como pagada`
                          : `Mark ${inv.number} paid`
                      }
                    >
                      {isEs ? "Marcar como pagada" : "Mark Paid"}
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="px-card pb-card">
          <TablePagination
            page={page}
            pageCount={invoices.pageCount}
            onPageChange={setPage}
          />
        </div>
      </AsyncSection>

      {issuing ? (
        <IssueInvoiceModal
          contracts={contracts.contracts.filter((c) => c.status !== "ENDED")}
          label={label}
          saving={invoices.isCreating}
          error={invoices.createError}
          onClose={() => setIssuing(false)}
          onSave={(body) => {
            void invoices
              .create(body)
              .then(() => setIssuing(false))
              .catch(() => {});
          }}
        />
      ) : null}
    </Card>
  );
}

function IssueInvoiceModal({
  contracts,
  label,
  saving,
  error,
  onSave,
  onClose,
}: {
  contracts: ApiContract[];
  label: (id: string) => string;
  saving: boolean;
  error: unknown;
  onSave: (body: {
    subscriptionId: string;
    number: string;
    periodLabel: string;
    issuedOn: string;
    dueOn: string;
    amountCents: number;
  }) => void;
  onClose: () => void;
}) {
  const [contractId, setContractId] = useState(contracts[0]?.id ?? "");
  const contract = contracts.find((c) => c.id === contractId);
  const [number, setNumber] = useState("");
  const [periodLabel, setPeriodLabel] = useState("");
  const [issuedOn, setIssuedOn] = useState(today());
  const [dueOn, setDueOn] = useState("");
  const [amount, setAmount] = useState(
    contracts[0] ? centsToInput(contracts[0].monthlyFeeCents) : "",
  );
  const [tried, setTried] = useState(false);
  const cents = parseDollars(amount);
  const { language } = useLanguage();
  const isEs = language === "ES";

  const errors = {
    contract: contract
      ? undefined
      : isEs
        ? "Elija un contrato."
        : "Choose a contract.",
    number: number.trim()
      ? undefined
      : isEs
        ? "Ingrese el número de factura."
        : "Enter the invoice number.",
    period: periodLabel.trim()
      ? undefined
      : isEs
        ? "Ingrese el período de facturación."
        : "Enter the billing period.",
    issued: DAY.test(issuedOn)
      ? undefined
      : isEs
        ? "Elija la fecha de emisión."
        : "Choose the issue date.",
    due:
      DAY.test(dueOn) && dueOn >= issuedOn
        ? undefined
        : isEs
          ? "La fecha de vencimiento debe ser igual o posterior a la fecha de emisión."
          : "The due date must be on or after the issue date.",
    amount:
      cents !== null
        ? undefined
        : isEs
          ? "Ingrese el monto en dólares y centavos."
          : "Enter the amount in dollars and cents.",
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEs ? "Emitir factura" : "Issue Invoice"}
      footer={
        <>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={onClose}
            disabled={saving}
          >
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            loading={saving}
            onClick={() => {
              setTried(true);
              if (Object.values(errors).some(Boolean)) return;
              onSave({
                subscriptionId: contract!.id,
                number: number.trim(),
                periodLabel: periodLabel.trim(),
                issuedOn,
                dueOn,
                amountCents: cents!,
              });
            }}
          >
            {isEs ? "Emitir factura" : "Issue Invoice"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {error ? (
          <Alert
            tone="danger"
            title={
              isEs ? "La factura no se emitió" : "The invoice was not issued"
            }
          >
            {actionErrorText(error, isEs)}
          </Alert>
        ) : null}
        <FormField
          label={isEs ? "Contrato" : "Contract"}
          required
          error={tried ? errors.contract : undefined}
        >
          {(field) => (
            <Select
              {...field}
              value={contractId}
              onChange={(e) => {
                setContractId(e.target.value);
                const next = contracts.find((c) => c.id === e.target.value);
                if (next) setAmount(centsToInput(next.monthlyFeeCents));
              }}
            >
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {label(c.organizationId)} · {c.plan.name}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <div className="grid grid-cols-1 gap-inline-lg sm:grid-cols-2">
          <FormField
            label={isEs ? "Número de factura" : "Invoice number"}
            required
            error={tried ? errors.number : undefined}
          >
            {(field) => (
              <Input
                {...field}
                maxLength={40}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            )}
          </FormField>
          <FormField
            label={isEs ? "Período de facturación" : "Billing period"}
            required
            error={tried ? errors.period : undefined}
          >
            {(field) => (
              <Input
                {...field}
                maxLength={40}
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                placeholder={isEs ? "p. ej., nov. 2026" : "e.g. Nov 2026"}
              />
            )}
          </FormField>
        </div>
        <div className="grid grid-cols-1 gap-inline-lg sm:grid-cols-3">
          <FormField
            label={isEs ? "Emitida el" : "Issued on"}
            required
            error={tried ? errors.issued : undefined}
          >
            {(field) => (
              <Input
                {...field}
                type="date"
                value={issuedOn}
                onChange={(e) => setIssuedOn(e.target.value)}
              />
            )}
          </FormField>
          <FormField
            label={isEs ? "Vence el" : "Due on"}
            required
            error={tried ? errors.due : undefined}
          >
            {(field) => (
              <Input
                {...field}
                type="date"
                value={dueOn}
                onChange={(e) => setDueOn(e.target.value)}
              />
            )}
          </FormField>
          <FormField
            label={isEs ? "Monto (USD)" : "Amount (USD)"}
            required
            error={tried ? errors.amount : undefined}
          >
            {(field) => (
              <Input
                {...field}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            )}
          </FormField>
        </div>
        <p className="text-caption text-fg-muted">
          {isEs ? "Adjuntar el PDF de la factura" : "Attaching the invoice PDF"}
          : {notAvailableNote(isEs).toLowerCase()}
        </p>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------ change requests */

function ChangeRequestsCard({ label }: { label: (id: string) => string }) {
  const [tab, setTab] = useState<"cr-open" | "cr-resolved">("cr-open");
  const [page, setPage] = useState(1);
  const requests = useChangeRequests(
    page,
    tab === "cr-open" ? "open" : "resolved",
  );
  const canManage = useCanLevel("contracts", 3);
  const { language } = useLanguage();
  const isEs = language === "ES";
  const copy = readErrorCopy(
    requests.error,
    isEs
      ? "Las solicitudes de cambio no se cargaron"
      : "The change requests did not load",
    isEs,
  );

  return (
    <Card padding="none">
      <div className="flex flex-col gap-inline-lg p-card sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-heading-5 text-fg">
            {isEs ? "Solicitudes de cambio" : "Change Requests"}
          </h3>
          <p className="mt-stack-xs text-caption text-fg-muted">
            {isEs
              ? "Lo que las oficinas pidieron cambiar en su contrato."
              : "What offices asked to change on their contract."}
          </p>
        </div>
        <Tabs
          label={
            isEs ? "Estado de la solicitud de cambio" : "Change request status"
          }
          items={[
            { id: "cr-open", label: isEs ? "Abiertas" : "Open" },
            { id: "cr-resolved", label: isEs ? "Resueltas" : "Resolved" },
          ]}
          value={tab}
          onChange={(next) => {
            setTab(next);
            setPage(1);
          }}
        />
      </div>
      <div className="px-card">
        <ActionError
          error={requests.resolveError}
          title={
            isEs
              ? "La solicitud no se resolvió"
              : "The request was not resolved"
          }
          onDismiss={requests.dismissResolveError}
          className="mb-stack-md"
        />
      </div>
      <TabPanel id={tab} value={tab}>
        <AsyncSection
          pending={requests.isPending}
          error={requests.error}
          onRetry={canRetry(requests.error) ? requests.refetch : undefined}
          {...copy}
          skeleton={<SkeletonTable rows={3} columns={5} minWidth={760} />}
        >
          <Table minWidth={760}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>
                  {isEs ? "Organización" : "Organization"}
                </TableHeaderCell>
                <TableHeaderCell>{isEs ? "Tema" : "Topic"}</TableHeaderCell>
                <TableHeaderCell>
                  {isEs ? "Solicitud" : "Request"}
                </TableHeaderCell>
                <TableHeaderCell>
                  {isEs ? "Solicitada" : "Requested"}
                </TableHeaderCell>
                <TableHeaderCell className="text-right">
                  {isEs ? "Acciones" : "Actions"}
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.requests.length === 0 ? (
                <TableEmptyRow colSpan={5}>
                  <p className="text-body-sm text-fg-muted">
                    {tab === "cr-open"
                      ? isEs
                        ? "No hay solicitudes de cambio abiertas."
                        : "No open change requests."
                      : isEs
                        ? "No hay solicitudes de cambio resueltas."
                        : "No resolved change requests."}
                  </p>
                </TableEmptyRow>
              ) : null}
              {requests.requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell emphasis>{label(r.organizationId)}</TableCell>
                  <TableCell>{topicLabel(r.topic, isEs)}</TableCell>
                  <TableCell>
                    <span className="block max-w-[360px] text-body-sm break-words whitespace-pre-line">
                      {r.detail}
                    </span>
                  </TableCell>
                  <TableCell>
                    {formatInstant(r.requestedAt, isEs)}
                    {r.resolvedAt ? (
                      <span className="block text-caption text-fg-muted">
                        {isEs ? "Resuelta el" : "Resolved"}{" "}
                        {formatInstant(r.resolvedAt, isEs)}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage && !r.resolvedAt ? (
                      <Button
                        size="small"
                        variant="neutral"
                        appearance="stroke"
                        loading={requests.resolvePendingId === r.id}
                        onClick={() => requests.resolve(r.id)}
                        aria-label={
                          isEs
                            ? `Resolver la solicitud de ${topicLabel(r.topic, true)} de ${label(r.organizationId)}`
                            : `Resolve the ${topicLabel(r.topic, false)} request from ${label(r.organizationId)}`
                        }
                      >
                        {isEs ? "Resolver" : "Resolve"}
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-card pb-card">
            <TablePagination
              page={page}
              pageCount={requests.pageCount}
              onPageChange={setPage}
            />
          </div>
        </AsyncSection>
      </TabPanel>
    </Card>
  );
}
