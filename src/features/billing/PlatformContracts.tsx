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
import { canRetry } from "@/lib/data/asyncState";
import { useCanLevel } from "@/features/staff/useStaffAccounts";
import {
  ActionError,
  ContractStatusBadge,
  InvoiceStatusBadge,
  NOT_AVAILABLE_NOTE,
  SkeletonTable,
  actionErrorText,
  readErrorCopy,
} from "./consoleUi";
import {
  centsToInput,
  formatCents,
  formatDay,
  formatInstant,
  parseDollars,
} from "./money";
import { AUDIENCE_LABEL, type AdminOrgPlan } from "./platformPlans.mappers";
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

/** Today as YYYY-MM-DD on this computer's calendar. */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function PlatformContracts({ orgPlans }: { orgPlans: AdminOrgPlan[] }) {
  const orgs = useOrganizationNames();
  const label = (id: string) => orgs.nameOf(id) ?? `Office ${id.slice(0, 8)}`;
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
  const copy = readErrorCopy(contracts.error, "The contracts did not load");

  return (
    <Card padding="none">
      <div className="flex flex-col gap-inline-lg p-card sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-heading-5 text-fg">Organizations</h3>
          <p className="mt-stack-xs text-caption text-fg-muted">
            Each office&apos;s plan is its contract: the plan, the patients
            allowed, the fee and the term.
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
            New Contract
          </Button>
        ) : null}
      </div>
      <div className="px-card">
        <ActionError
          error={contracts.actionError}
          title="The contract did not change"
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
              <TableHeaderCell>Organization</TableHeaderCell>
              <TableHeaderCell>Plan</TableHeaderCell>
              <TableHeaderCell>Monthly fee</TableHeaderCell>
              <TableHeaderCell>Term</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contracts.contracts.length === 0 ? (
              <TableEmptyRow colSpan={6}>
                <p className="text-body-sm text-fg-muted">No contracts yet.</p>
              </TableEmptyRow>
            ) : null}
            {contracts.contracts.map((c) => (
              <TableRow key={c.id}>
                <TableCell emphasis>
                  {label(c.organizationId)}
                  <span className="block text-caption text-fg-muted">
                    {c.contractNumber ?? "No contract number"} ·{" "}
                    {c.patientsAllowed} patients
                  </span>
                </TableCell>
                <TableCell>{c.plan.name}</TableCell>
                <TableCell numeric>{formatCents(c.monthlyFeeCents)}</TableCell>
                <TableCell>
                  {formatDay(c.startsOn)} – {formatDay(c.endsOn)}
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
                        aria-label={`Activate the contract for ${label(c.organizationId)}`}
                      >
                        Activate
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
                          aria-label={`Renew the contract for ${label(c.organizationId)}`}
                        >
                          Renew
                        </Button>
                        <Button
                          size="small"
                          variant="danger"
                          appearance="stroke"
                          loading={contracts.actionPendingId === c.id}
                          onClick={() => contracts.setStatus(c.id, "end")}
                          aria-label={`End the contract for ${label(c.organizationId)}`}
                        >
                          End
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
                      title={NOT_AVAILABLE_NOTE}
                      aria-label={`Pause the contract for ${label(c.organizationId)} (not available yet)`}
                    >
                      Pause
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
                : `${contracts.total} contract${contracts.total === 1 ? "" : "s"}`
            }
          />
          <p className="mt-stack-xs text-caption text-fg-muted">
            Pause and trial: {NOT_AVAILABLE_NOTE.toLowerCase()}
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

  const officeError = office ? undefined : "Choose an office.";
  const planError = chosenPlan
    ? undefined
    : "There is no published plan for this type of office.";
  const startError = DAY.test(startsOn) ? undefined : "Choose a start date.";
  const endError =
    !endsOn || (DAY.test(endsOn) && endsOn >= startsOn)
      ? undefined
      : "The end date must be on or after the start date.";

  return (
    <Modal
      open
      onClose={onClose}
      title="New Contract"
      description="The plan's fee and patient limit apply; the server records who made it."
      footer={
        <>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
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
            Create Contract
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {error ? (
          <Alert tone="danger" title="The contract was not created">
            {actionErrorText(error)}
          </Alert>
        ) : null}
        <FormField
          label="Office"
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
                  {o.name} · {AUDIENCE_LABEL[o.type] ?? o.type}
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
              ? `${formatCents(chosenPlan.monthlyFeeCents)} a month · ${chosenPlan.patientsIncluded} patients`
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
            label="Starts on"
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
          <FormField label="Ends on" error={tried ? endError : undefined}>
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
        <FormField label="Contract number">
          {(field) => (
            <Input
              {...field}
              maxLength={40}
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              placeholder="e.g. NR-2027-0001"
            />
          )}
        </FormField>
        <SwitchRow
          checked={activate}
          onChange={setActivate}
          title="Active from the start date"
          description="Off: the contract waits as Pending until someone activates it."
        />
        <SwitchRow
          checked={autoRenew}
          onChange={setAutoRenew}
          title="Renews automatically"
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
  const startError = DAY.test(startsOn) ? undefined : "Choose a start date.";
  const endError =
    !endsOn || (DAY.test(endsOn) && endsOn >= startsOn)
      ? undefined
      : "The end date must be on or after the start date.";
  const feeError =
    cents !== null ? undefined : "Enter the fee in dollars and cents.";
  const patientsError =
    /^\d+$/.test(patients.trim()) && Number(patients) >= 1
      ? undefined
      : "Enter a whole number of patients.";

  return (
    <Modal
      open
      onClose={onClose}
      title={`Renew: ${name}`}
      description="The renewal starts a new term; the current one keeps its history."
      footer={
        <>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
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
            Renew Contract
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {error ? (
          <Alert tone="danger" title="The contract was not renewed">
            {actionErrorText(error)}
          </Alert>
        ) : null}
        <div className="grid grid-cols-1 gap-inline-lg sm:grid-cols-2">
          <FormField
            label="New term starts"
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
          <FormField label="New term ends" error={tried ? endError : undefined}>
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
            label="Monthly fee (USD)"
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
            label="Patients allowed"
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
  const copy = readErrorCopy(invoices.error, "The invoices did not load");

  return (
    <Card padding="none">
      <div className="flex flex-col gap-inline-lg p-card sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-heading-5 text-fg">Invoices</h3>
          <p className="mt-stack-xs text-caption text-fg-muted">
            Issued against a contract. Offices see their own invoices on their
            billing page.
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
            Issue Invoice
          </Button>
        ) : null}
      </div>
      <div className="px-card">
        <ActionError
          error={invoices.markPaidError}
          title="The invoice was not marked paid"
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
              <TableHeaderCell>Invoice</TableHeaderCell>
              <TableHeaderCell>Organization</TableHeaderCell>
              <TableHeaderCell>Amount</TableHeaderCell>
              <TableHeaderCell>Due</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.invoices.length === 0 ? (
              <TableEmptyRow colSpan={6}>
                <p className="text-body-sm text-fg-muted">No invoices yet.</p>
              </TableEmptyRow>
            ) : null}
            {invoices.invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell emphasis>
                  {inv.number}
                  <span className="block text-caption text-fg-muted">
                    {inv.periodLabel} · issued {formatDay(inv.issuedOn)}
                  </span>
                </TableCell>
                <TableCell>{label(inv.organizationId)}</TableCell>
                <TableCell numeric>
                  {formatCents(inv.amountCents, inv.currency || "USD")}
                </TableCell>
                <TableCell>{formatDay(inv.dueOn)}</TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={inv.status} />
                  {inv.paidAt ? (
                    <span className="block text-caption text-fg-muted">
                      {formatInstant(inv.paidAt)}
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
                      aria-label={`Mark ${inv.number} paid`}
                    >
                      Mark Paid
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

  const errors = {
    contract: contract ? undefined : "Choose a contract.",
    number: number.trim() ? undefined : "Enter the invoice number.",
    period: periodLabel.trim() ? undefined : "Enter the billing period.",
    issued: DAY.test(issuedOn) ? undefined : "Choose the issue date.",
    due:
      DAY.test(dueOn) && dueOn >= issuedOn
        ? undefined
        : "The due date must be on or after the issue date.",
    amount:
      cents !== null ? undefined : "Enter the amount in dollars and cents.",
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Issue Invoice"
      footer={
        <>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
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
            Issue Invoice
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {error ? (
          <Alert tone="danger" title="The invoice was not issued">
            {actionErrorText(error)}
          </Alert>
        ) : null}
        <FormField
          label="Contract"
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
            label="Invoice number"
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
            label="Billing period"
            required
            error={tried ? errors.period : undefined}
          >
            {(field) => (
              <Input
                {...field}
                maxLength={40}
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                placeholder="e.g. Nov 2026"
              />
            )}
          </FormField>
        </div>
        <div className="grid grid-cols-1 gap-inline-lg sm:grid-cols-3">
          <FormField
            label="Issued on"
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
            label="Due on"
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
            label="Amount (USD)"
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
          Attaching the invoice PDF: {NOT_AVAILABLE_NOTE.toLowerCase()}
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
  const copy = readErrorCopy(
    requests.error,
    "The change requests did not load",
  );

  return (
    <Card padding="none">
      <div className="flex flex-col gap-inline-lg p-card sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-heading-5 text-fg">Change Requests</h3>
          <p className="mt-stack-xs text-caption text-fg-muted">
            What offices asked to change on their contract.
          </p>
        </div>
        <Tabs
          label="Change request status"
          items={[
            { id: "cr-open", label: "Open" },
            { id: "cr-resolved", label: "Resolved" },
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
          title="The request was not resolved"
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
                <TableHeaderCell>Organization</TableHeaderCell>
                <TableHeaderCell>Topic</TableHeaderCell>
                <TableHeaderCell>Request</TableHeaderCell>
                <TableHeaderCell>Requested</TableHeaderCell>
                <TableHeaderCell className="text-right">
                  Actions
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.requests.length === 0 ? (
                <TableEmptyRow colSpan={5}>
                  <p className="text-body-sm text-fg-muted">
                    {tab === "cr-open"
                      ? "No open change requests."
                      : "No resolved change requests."}
                  </p>
                </TableEmptyRow>
              ) : null}
              {requests.requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell emphasis>{label(r.organizationId)}</TableCell>
                  <TableCell>{TOPIC_LABEL[r.topic] ?? r.topic}</TableCell>
                  <TableCell>
                    <span className="block max-w-[360px] text-body-sm break-words whitespace-pre-line">
                      {r.detail}
                    </span>
                  </TableCell>
                  <TableCell>
                    {formatInstant(r.requestedAt)}
                    {r.resolvedAt ? (
                      <span className="block text-caption text-fg-muted">
                        Resolved {formatInstant(r.resolvedAt)}
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
                        aria-label={`Resolve the ${TOPIC_LABEL[r.topic] ?? r.topic} request from ${label(r.organizationId)}`}
                      >
                        Resolve
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
