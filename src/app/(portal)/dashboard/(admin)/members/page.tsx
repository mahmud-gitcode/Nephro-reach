"use client";

import React, { useMemo, useState } from "react";
import { Bell, Eye, Radar, Search, Users } from "lucide-react";
import {
  Alert,
  AsyncSection,
  Button,
  Card,
  FormField,
  Input,
  Modal,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TablePagination,
  TableRow,
} from "@/components/ui";
import { canRetry, isNotShared } from "@/lib/data/asyncState";
import { useCanLevel } from "@/features/staff/useStaffAccounts";
import {
  SUBSCRIPTION_LABEL,
  SkeletonTable,
  SubscriptionStatusBadge,
  actionErrorText,
  readErrorCopy,
} from "@/features/billing/consoleUi";
import { formatCents, formatInstant } from "@/features/billing/money";
import type {
  ApiMemberSubscription,
  MemberSubscriptionStatus,
} from "@/features/billing/platformContracts.repository";
import { usePlans } from "@/features/billing/usePlans";
import { useMemberSubscriptions } from "@/features/billing/usePlatformBilling";
import { usePlatformOverview } from "@/features/admin/usePlatformOverview";

/* ==========================================================================
   Members (Phase 14.5, on the API)
   --------------------------------------------------------------------------
   The member subscriptions, one server page at a time
   (`/platform/member-subscriptions`, members READ; a change is a PUT,
   members WRITE). The summary cards are the server's counts
   (`/platform/reports/overview`), never a count of the loaded page.
   Email, phone and the made-up "MM-" member number are not returned by the
   API and are not shown (minimum necessary). There is no name search on
   the server: the search box filters the loaded page only, and says so.
   ========================================================================== */

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const STATUSES: MemberSubscriptionStatus[] = [
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "CANCELLED",
];

function SummaryCard({
  title,
  value,
  icon: Icon,
  tone,
  iconTone,
}: {
  title: string;
  value: React.ReactNode;
  icon: IconType;
  tone: string;
  iconTone: string;
}) {
  return (
    <Card as="article" padding="none" className="min-h-[114px] p-inset-lg">
      <div className="mb-stack-xl flex items-start justify-between gap-inline-lg">
        <p className="text-body-md text-fg-muted">{title}</p>
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 items-center justify-center rounded-control ${tone}`}
        >
          <Icon className={`h-5 w-5 ${iconTone}`} />
        </span>
      </div>
      <p className="text-metric-sm text-fg">{value}</p>
    </Card>
  );
}

function SummaryCards() {
  const overview = usePlatformOverview();
  const count = (key: string) =>
    overview.data?.memberSubscriptionsByStatus.find((row) => row.key === key)
      ?.count ?? 0;
  const value = (n: () => number) =>
    overview.isPending ? (
      <Skeleton height={28} width={64} />
    ) : overview.error ? (
      <span className="text-body-sm text-fg-muted">
        {isNotShared(overview.error) ? "No access" : "Not loaded"}
      </span>
    ) : (
      n().toLocaleString()
    );

  return (
    <section
      aria-label="Member totals"
      className="grid grid-cols-1 gap-inset-lg sm:grid-cols-2 xl:grid-cols-4"
    >
      <SummaryCard
        title="Total Members"
        value={value(() => overview.data!.members)}
        icon={Users}
        tone="bg-cat-6-soft"
        iconTone="text-cat-6"
      />
      <SummaryCard
        title="Active"
        value={value(() => count("ACTIVE"))}
        icon={Radar}
        tone="bg-cat-4-soft"
        iconTone="text-cat-4"
      />
      <SummaryCard
        title="Trial"
        value={value(() => count("TRIALING"))}
        icon={Bell}
        tone="bg-cat-3-soft"
        iconTone="text-cat-3"
      />
      <SummaryCard
        title="Past Due or Cancelled"
        value={value(() => count("PAST_DUE") + count("CANCELLED"))}
        icon={Radar}
        tone="bg-cat-1-soft"
        iconTone="text-cat-1"
      />
    </section>
  );
}

const nameOf = (row: ApiMemberSubscription) =>
  `${row.patient.firstName} ${row.patient.lastName}`.trim();
const initialsOf = (row: ApiMemberSubscription) =>
  `${row.patient.firstName.charAt(0)}${row.patient.lastName.charAt(0)}`.toUpperCase();

function MembersTable() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<ApiMemberSubscription | null>(null);
  const subs = useMemberSubscriptions(page);
  const plans = usePlans();
  const planName = (id: string, code: string) =>
    plans.plans.find((p) => p.id === id)?.name ?? code;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subs.rows;
    return subs.rows.filter((row) =>
      [nameOf(row), row.plan.code].some((field) =>
        field.toLowerCase().includes(q),
      ),
    );
  }, [query, subs.rows]);
  const copy = readErrorCopy(subs.error, "The members did not load");

  return (
    <Card as="section" padding="small">
      <div className="mb-stack-md flex flex-col gap-inline-lg sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-heading-4 text-fg">Members</h1>
        <div className="relative w-full sm:w-[277px]">
          <label htmlFor="member-search" className="sr-only">
            Search members on this page
          </label>
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-fg-muted"
          />
          <Input
            id="member-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search this page..."
            className="pl-10"
          />
        </div>
      </div>

      <AsyncSection
        pending={subs.isPending}
        error={subs.error}
        onRetry={canRetry(subs.error) ? subs.refetch : undefined}
        {...copy}
        skeleton={<SkeletonTable rows={5} columns={5} minWidth={900} />}
      >
        <div className="overflow-hidden rounded-control border border-line">
          <Table minWidth={900}>
            <TableHead className="bg-surface-sunken">
              <TableRow>
                {["Member", "Subscriptions", "Status", "Joined"].map(
                  (header) => (
                    <TableHeaderCell key={header}>{header}</TableHeaderCell>
                  ),
                )}
                <TableHeaderCell className="text-center">
                  Actions
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableEmptyRow colSpan={5}>
                  <p className="text-body-sm text-fg-muted">
                    {subs.rows.length === 0
                      ? "No member subscriptions yet."
                      : "No member on this page matches this search."}
                  </p>
                </TableEmptyRow>
              ) : null}
              {filtered.map((row) => (
                <TableRow key={row.patientId}>
                  <TableCell>
                    <span className="flex items-center gap-inline-lg">
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-cat-4-soft text-label-sm text-fg"
                      >
                        {initialsOf(row)}
                      </span>
                      <span className="block truncate text-label-md text-fg">
                        {nameOf(row)}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    {planName(row.plan.id, row.plan.code)}
                    <span className="block text-caption text-fg-muted">
                      {formatCents(row.plan.priceCents)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <SubscriptionStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>{formatInstant(row.startedAt)}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      onClick={() => setViewing(row)}
                      variant="neutral"
                      appearance="stroke"
                      size="small"
                      className="px-inset-xs"
                      aria-label={`View ${nameOf(row)}`}
                    >
                      <Eye aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          page={page}
          pageCount={subs.pageCount}
          onPageChange={(next) => {
            setPage(next);
            setQuery("");
          }}
          summary={
            subs.total === null
              ? undefined
              : `Page ${page} · ${subs.total} member subscription${subs.total === 1 ? "" : "s"}${query.trim() ? " · search covers this page only" : ""}`
          }
        />
      </AsyncSection>

      {viewing ? (
        <MemberModal
          row={viewing}
          planName={planName(viewing.plan.id, viewing.plan.code)}
          plans={plans.plans.filter(
            (p) => p.active || p.id === viewing.plan.id,
          )}
          saving={subs.isSaving}
          error={subs.saveError}
          onClose={() => {
            subs.resetSave();
            setViewing(null);
          }}
          onSave={(planId, status) => {
            void subs
              .setSubscription(viewing.patientId, planId, status)
              .then((updated) => setViewing(updated))
              .catch(() => {});
          }}
        />
      ) : null}
    </Card>
  );
}

function MemberModal({
  row,
  planName,
  plans,
  saving,
  error,
  onSave,
  onClose,
}: {
  row: ApiMemberSubscription;
  planName: string;
  plans: { id: string; name: string }[];
  saving: boolean;
  error: unknown;
  onSave: (planId: string, status: MemberSubscriptionStatus) => void;
  onClose: () => void;
}) {
  const canWrite = useCanLevel("members", 2);
  const [planId, setPlanId] = useState(row.plan.id);
  const [status, setStatus] = useState<MemberSubscriptionStatus>(row.status);
  const changed = planId !== row.plan.id || status !== row.status;

  return (
    <Modal
      open
      onClose={onClose}
      title={nameOf(row)}
      description="Member subscription"
      footer={
        canWrite ? (
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={onClose}
              disabled={saving}
            >
              Close
            </Button>
            <Button
              loading={saving}
              disabled={!changed}
              onClick={() => onSave(planId, status)}
            >
              Save Subscription
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="space-y-stack-lg">
        {error ? (
          <Alert tone="danger" title="The subscription was not changed">
            {actionErrorText(error)}
          </Alert>
        ) : null}
        <dl className="grid grid-cols-1 gap-stack-md sm:grid-cols-2">
          {[
            ["Subscription", planName],
            ["Price", formatCents(row.plan.priceCents)],
            ["Joined", formatInstant(row.startedAt)],
            ["Trial ends", formatInstant(row.trialEndsAt)],
            ["Current period ends", formatInstant(row.currentPeriodEnd)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-caption text-fg-muted">{label}</dt>
              <dd className="text-body-sm text-fg">{value}</dd>
            </div>
          ))}
          <div>
            <dt className="text-caption text-fg-muted">Status</dt>
            <dd>
              <SubscriptionStatusBadge status={row.status} />
            </dd>
          </div>
        </dl>
        {canWrite ? (
          <div className="grid grid-cols-1 gap-inline-lg sm:grid-cols-2">
            <FormField label="Plan">
              {(field) => (
                <Select
                  {...field}
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  {plans.some((p) => p.id === row.plan.id) ? null : (
                    <option value={row.plan.id}>{planName}</option>
                  )}
                </Select>
              )}
            </FormField>
            <FormField label="Status">
              {(field) => (
                <Select
                  {...field}
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as MemberSubscriptionStatus)
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {SUBSCRIPTION_LABEL[s]}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

export default function MembersPage() {
  return (
    <>
      <SummaryCards />

      <div className="mt-stack-lg">
        <MembersTable />
      </div>
    </>
  );
}
