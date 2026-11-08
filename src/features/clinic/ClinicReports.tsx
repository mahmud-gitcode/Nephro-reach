"use client";

import { useExternalShare } from "@/features/sharing/ExternalShareNotice";
import React, { useState } from "react";
import Link from "next/link";
import { Building2, CalendarDays, Download, FileBarChart } from "lucide-react";

import {
  ActivitySolid,
  GraduationCapSolid,
  HeartPulseSolid,
  UsersSolid,
  VideoSolid,
} from "@/components/icons/solid";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  Alert,
  AsyncSection,
  BarChart,
  Button,
  Card,
  ChartLegend,
  DonutChart,
  EmptyState,
  KeyCard,
  type KeyCardTone,
  LineChart,
  Modal,
  Progress,
  Select,
  Skeleton,
  buttonStyles,
} from "@/components/ui";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { useNow } from "@/lib/utils/useNow";
import {
  axisMax,
  byMonth,
  EXPORTS,
  monthLabel,
  PER_MEMBER_REPORTS,
  programStatusLabel,
  shares,
  type CcmReport,
  type CheckInNoticesReport,
  type MessagesReport,
  type ProgramsReport,
  type RosterReport,
  type ShareRow,
} from "./reports.data";
import { useOfficeReport, useReportExport } from "./useOfficeReports";
import { REPORT_MONTHS } from "./officeReports.repository";
import { actionErrorText } from "./officeContext";
import { useMessages } from "@/features/messaging/useMessages";
import * as messagingRules from "@/features/messaging/messaging.rules";
import type { OpenQuestion } from "@/features/messaging/messaging.rules";
import { useOptionalAuth } from "@/features/auth/AuthContext";

/* ==========================================================================
   Office Reports (Phase 14)
   --------------------------------------------------------------------------
   Every figure is the server's office report (GET /organizations/:org/
   reports/*): aggregate counts only, never computed from a page of rows and
   never a sample. A panel with no server source says "No data yet". Each
   card has its own error state (a 403 is "no access", never a zero).
   Downloads are the server's CSV of the same counts: the server audits
   every download, and it holds no names or MRNs. The per-member files the
   prototype built in the browser have no audited source (B14-4), so they
   are shown but not available. The Program and Member Type filters have no
   server filter, so they are shown but not available; the period is the
   report window in months.
   ========================================================================== */

const NOT_AVAILABLE = "Not available yet";
const PERIODS = [3, 6, 12, 24] as const;

const KPI_ICONS: Record<string, { icon: React.ReactNode; tone: KeyCardTone }> =
  {
    members: { icon: <UsersSolid />, tone: "brand" },
    completion: { icon: <GraduationCapSolid />, tone: "success" },
    attendees: { icon: <VideoSolid />, tone: "brand" },
    active: { icon: <ActivitySolid />, tone: "success" },
    questions: { icon: <HeartPulseSolid />, tone: "warning" },
  };

type Read<T> = ReturnType<typeof useOfficeReport<T>>;

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

/** One report card's loading, error (403 = no access) and loaded states. */
function ReportSection<T>({
  read,
  title,
  height = 200,
  children,
}: {
  read: Read<T>;
  title: string;
  height?: number;
  children: (data: T) => React.ReactNode;
}) {
  return (
    <AsyncSection
      pending={read.isPending}
      error={read.error}
      errorTitle={errorTitleFor(read.error, `${title} did not load`)}
      errorMessage={errorMessageFor(read.error, undefined)}
      onRetry={canRetry(read.error) ? read.refetch : undefined}
      skeleton={<Skeleton height={height} />}
    >
      {read.data ? children(read.data) : null}
    </AsyncSection>
  );
}

function NoDataYet({ title }: { title: string }) {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title={title} />
      <EmptyState
        variant="bare"
        title="No data yet"
        description="NephroReach does not report this yet."
      />
    </Card>
  );
}

function FilterBar({
  months,
  onMonths,
}: {
  months: number;
  onMonths: (months: number) => void;
}) {
  /* The view is one office, so the organization is a label, not a choice:
     an office must never be able to pick another. */
  const officeName = useOptionalAuth()?.user?.org ?? "—";
  return (
    <Card as="section" padding="small" aria-label="Report filters">
      <div className="grid gap-inline-lg sm:grid-cols-2 xl:grid-cols-4">
        <label className="block">
          <span className="flex items-center gap-inline-xs text-label-md text-fg-secondary">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            Period
          </span>
          <Select
            selectSize="small"
            className="mt-stack-xs"
            value={String(months)}
            onChange={(e) => onMonths(Number(e.target.value))}
          >
            {PERIODS.map((n) => (
              <option key={n} value={n}>
                Last {n} months
              </option>
            ))}
          </Select>
        </label>
        <div>
          <p className="text-label-md text-fg-secondary">Organization</p>
          <p className="mt-stack-xs flex h-control-small items-center gap-inline-md rounded-control-small border border-line bg-surface-sunken px-control-x-small text-body-sm text-fg">
            <Building2
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-fg-muted"
            />
            <span className="truncate">{officeName}</span>
          </p>
        </div>
        <div>
          <p
            id="report-filter-program"
            className="text-label-md text-fg-secondary"
          >
            Program
          </p>
          <Select
            selectSize="small"
            className="mt-stack-xs"
            disabled
            title={NOT_AVAILABLE}
            aria-labelledby="report-filter-program"
            aria-describedby="report-filters-na"
            value="All Programs"
            onChange={() => undefined}
          >
            <option>All Programs</option>
          </Select>
        </div>
        <div>
          <p
            id="report-filter-type"
            className="text-label-md text-fg-secondary"
          >
            Member Type
          </p>
          <Select
            selectSize="small"
            className="mt-stack-xs"
            disabled
            title={NOT_AVAILABLE}
            aria-labelledby="report-filter-type"
            aria-describedby="report-filters-na"
            value="All Members"
            onChange={() => undefined}
          >
            <option>All Members</option>
          </Select>
        </div>
      </div>
      <p
        id="report-filters-na"
        className="mt-stack-sm text-caption text-fg-muted"
      >
        Program and member-type filters: {NOT_AVAILABLE.toLowerCase()}.
      </p>
    </Card>
  );
}

function KpiCards({
  roster,
  programs,
  messages,
  questions,
  questionsError,
  onOpenQuestions,
}: {
  roster: Read<RosterReport>;
  programs: Read<ProgramsReport>;
  messages: Read<MessagesReport>;
  questions: OpenQuestion[];
  questionsError: unknown;
  onOpenQuestions: () => void;
}) {
  const value = (read: Read<unknown>, text: () => string) =>
    read.isPending ? "…" : read.error ? "—" : text();
  const kpis = [
    {
      id: "members",
      label: "Total Members",
      value: value(roster, () => String(roster.data!.activePatients)),
      note: roster.error
        ? errorTitleFor(roster.error, "Did not load")
        : roster.data
          ? `${roster.data.endedRelationships} ended`
          : undefined,
    },
    {
      id: "completion",
      label: "Program Completion Rate",
      value: value(
        programs,
        () => `${programs.data!.courseCompletionPercent}%`,
      ),
      note: programs.error
        ? errorTitleFor(programs.error, "Did not load")
        : programs.data
          ? `${programs.data.courseCompleted} of ${programs.data.withCourse} with a course`
          : undefined,
    },
    {
      id: "attendees",
      label: "Live Class Attendances",
      value: "—",
      note: "No data yet",
    },
    {
      id: "active",
      label: "Patients Writing In",
      value: value(messages, () => String(messages.data!.fromMembers)),
      note: messages.error
        ? errorTitleFor(messages.error, "Did not load")
        : "Messages from members in the period",
    },
    {
      id: "questions",
      label: "Open Questions",
      value: questionsError ? "—" : String(questions.length),
      note: questionsError ? "Did not load" : "Shown in your inbox",
    },
  ];
  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2">
      {kpis.map((kpi) => (
        <KeyCard
          key={kpi.id}
          tone={KPI_ICONS[kpi.id].tone}
          icon={KPI_ICONS[kpi.id].icon}
          value={kpi.value}
          label={kpi.label}
          note={kpi.note}
        >
          {/* Who is waiting (client, 2026-10-06: "can they open it?"). */}
          {kpi.id === "questions" && questions.length > 0 ? (
            <Button
              size="small"
              variant="neutral"
              appearance="ghost"
              onClick={onOpenQuestions}
            >
              See who
            </Button>
          ) : undefined}
        </KeyCard>
      ))}
    </section>
  );
}

function NewPatientsTrend({ roster }: { roster: Read<RosterReport> }) {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="New Patients per Month" />
      <ReportSection read={roster} title="New patients" height={260}>
        {(data) => {
          const rows = byMonth(data.newLinksPerMonth);
          return (
            <LineChart
              series={[
                {
                  id: "new-links",
                  label: "New patients",
                  tone: "cat-1",
                  points: rows.map((r) => r.count),
                },
              ]}
              xLabels={rows.map((r) => monthLabel(r.month))}
              yMin={0}
              yMax={axisMax(rows.map((r) => r.count))}
              yTicks={6}
              label="New patients linked to this office by month"
              height={260}
            />
          );
        }}
      </ReportSection>
    </Card>
  );
}

function ShareDonut({
  title,
  label,
  rows,
  total,
  centerLabel,
}: {
  title: string;
  label: string;
  rows: ShareRow[];
  total: number;
  centerLabel: string;
}) {
  if (total === 0)
    return (
      <EmptyState variant="bare" title="Nothing to show" description={title} />
    );
  return (
    <>
      <DonutChart
        segments={rows.map((row) => ({
          label: row.label,
          value: row.pct,
          tone: row.tone,
        }))}
        label={label}
        size={168}
        thickness={30}
        centerValue={total}
        centerLabel={centerLabel}
        className="mx-auto"
      />
      <ChartLegend
        className="mt-stack-lg"
        items={rows.map((row) => ({
          label: row.label,
          tone: row.tone,
          value: `${row.pct}%`,
        }))}
      />
    </>
  );
}

function EnrollmentsByStatus({ programs }: { programs: Read<ProgramsReport> }) {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Enrollments by Status" />
      <ReportSection read={programs} title="Enrollments">
        {(data) => (
          <ShareDonut
            title="No enrollments in programs yet."
            label="Program enrollments by status"
            rows={shares(
              data.byStatus.map((row) => ({
                label: programStatusLabel(row.key),
                count: row.count,
              })),
            )}
            total={data.totalEnrollments}
            centerLabel="Enrollments"
          />
        )}
      </ReportSection>
    </Card>
  );
}

function MemberStatus({ roster }: { roster: Read<RosterReport> }) {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Member Status" />
      <ReportSection read={roster} title="Member status">
        {(data) => (
          <ShareDonut
            title="No members yet."
            label="Members by status"
            rows={shares([
              { label: "Active", count: data.activePatients },
              { label: "Ended", count: data.endedRelationships },
            ])}
            total={data.activePatients + data.endedRelationships}
            centerLabel="Members"
          />
        )}
      </ReportSection>
    </Card>
  );
}

function ProgramCompletion({ programs }: { programs: Read<ProgramsReport> }) {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Module Completion Rate" />
      <ReportSection read={programs} title="Completion">
        {(data) => (
          <div className="space-y-stack-md">
            <div className="flex items-baseline justify-between gap-inline-md">
              <span className="text-body-sm text-fg-secondary">
                All programs with a course
              </span>
              <span className="text-label-md text-fg tabular-nums">
                {data.courseCompletionPercent}%
              </span>
            </div>
            <Progress
              value={data.courseCompletionPercent}
              label="Course completion across programs"
              size="medium"
            />
            <p className="text-caption text-fg-muted">
              {data.courseCompleted} of {data.withCourse} enrollments with a
              course have finished it. Per-program rates: no data yet.
            </p>
          </div>
        )}
      </ReportSection>
    </Card>
  );
}

function CheckInRate({ notices }: { notices: Read<CheckInNoticesReport> }) {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Check-In Completion Rate" />
      <ReportSection read={notices} title="Check-in notices" height={220}>
        {(data) => {
          const rows = byMonth(data.perMonth);
          return (
            <>
              <p className="mb-stack-sm text-caption text-fg-muted">
                Check-in notices seen by your office, by month (
                {data.seenRatePercent}% overall).
              </p>
              <BarChart
                bars={rows.map((r) => ({
                  label: monthLabel(r.month),
                  value: r.delivered
                    ? Math.round((r.seen / r.delivered) * 100)
                    : 0,
                }))}
                label="Check-in notices seen by month"
                unit="%"
                yMax={100}
                yTicks={6}
                height={220}
              />
            </>
          );
        }}
      </ReportSection>
    </Card>
  );
}

function CcmCard({ ccm }: { ccm: Read<CcmReport> }) {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="CCM This Month" />
      <ReportSection read={ccm} title="CCM">
        {(data) => (
          <dl className="divide-y divide-line-subtle">
            {(
              [
                ["Patients", data.patients],
                ["At the time threshold", data.patientsAtThreshold],
                ["Minutes counted", data.countedMinutes],
                ["Minutes pending", data.pendingMinutes],
                ["Activities", data.activities],
              ] as const
            ).map(([term, value]) => (
              <div
                key={term}
                className="flex items-baseline justify-between gap-inline-lg py-inset-xs first:pt-0"
              >
                <dt className="text-body-sm text-fg-muted">{term}</dt>
                <dd className="text-label-lg text-fg tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </ReportSection>
    </Card>
  );
}

/* Each download is the server's CSV of one report's counts (audited). */
function CustomReports({
  months,
  nephrology,
}: {
  months: number;
  nephrology: boolean;
}) {
  /* Leaves NephroReach: ask first (client, 2026-10-07). */
  const share = useExternalShare();
  const download = useReportExport();
  const tileClass =
    "flex w-full cursor-pointer items-center gap-inline-lg rounded-control border border-line-subtle bg-surface p-inset-sm text-left transition-colors duration-150 ease-standard hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <Card as="section" padding="small">
      <PanelHeading title="Custom Reports" />
      <p className="-mt-stack-md mb-stack-md text-caption text-fg-muted">
        Each file holds this office&rsquo;s counts for the period above (no
        names or MRNs). NephroReach records every download.
      </p>
      {download.error ? (
        <Alert tone="danger" className="mb-stack-md">
          {actionErrorText(download.error)}
        </Alert>
      ) : null}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {EXPORTS.filter((e) => !e.nephrologyOnly || nephrology).map((e) => (
          <li key={e.report}>
            <button
              type="button"
              disabled={download.isPending}
              onClick={() =>
                share.guard(
                  () => download.mutate({ report: e.report, months }),
                  "download",
                )
              }
              className={tileClass}
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface-brand-subtle text-brand-600"
              >
                <FileBarChart className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 text-label-lg text-fg">
                {e.label}
              </span>
              <Download
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-fg-muted"
              />
            </button>
          </li>
        ))}
        {/* No audited per-member export exists (B14-4): shown, disabled,
            explained; nothing is built in the browser. */}
        {PER_MEMBER_REPORTS.map((label) => (
          <li key={label}>
            <button
              type="button"
              disabled
              title={NOT_AVAILABLE}
              aria-describedby="per-member-na"
              className={tileClass}
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface-sunken text-fg-muted"
              >
                <Download className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 text-label-lg text-fg">
                {label}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p id="per-member-na" className="mt-stack-md text-caption text-fg-muted">
        Per-member files: {NOT_AVAILABLE.toLowerCase()}. They need an audited
        download from NephroReach.
      </p>
      {share.notice}
    </Card>
  );
}

/** Each unanswered question as the patient wrote it, with a way straight
 *  to the conversation to answer it. */
function OpenQuestionsList({
  questions,
  messagesHref,
}: {
  questions: OpenQuestion[];
  messagesHref: string;
}) {
  const now = useNow();
  if (questions.length === 0) {
    return (
      <p className="text-body-sm text-fg-muted">
        No unanswered patient messages. You are all caught up.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-line-subtle">
      {questions.map((q) => (
        <li
          key={q.conversationId}
          className="flex flex-col gap-stack-sm py-inset-sm first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-inline-lg"
        >
          <div className="min-w-0 flex-1">
            <p className="text-label-lg text-fg">{q.memberName}</p>
            <p className="text-caption text-fg-muted">
              {[q.program, q.mrn ? `MRN ${q.mrn}` : null]
                .filter(Boolean)
                .join(" · ")}
              {" · "}
              {messagingRules.relativeLabel(q.sentAt, now)}
            </p>
            <blockquote className="mt-stack-xs line-clamp-3 border-l-2 border-line pl-inset-xs text-body-sm text-fg-secondary">
              {q.body}
            </blockquote>
          </div>
          <Link
            href={`${messagesHref}?thread=${encodeURIComponent(q.conversationId)}`}
            className={buttonStyles({
              size: "small",
              variant: "neutral",
              appearance: "fill-stroke",
            })}
          >
            Reply
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function ClinicReports() {
  const [months, setMonths] = useState<number>(REPORT_MONTHS.DEFAULT);
  const auth = useOptionalAuth();
  const nephrology =
    auth?.choice?.kind === "office" &&
    auth.choice.membership.organizationType === "NEPHROLOGY_OFFICE";
  const officeName = auth?.user?.org ?? undefined;

  const roster = useOfficeReport<RosterReport>("roster", months);
  const programs = useOfficeReport<ProgramsReport>("programs");
  const notices = useOfficeReport<CheckInNoticesReport>(
    "check-in-notices",
    months,
  );
  const messages = useOfficeReport<MessagesReport>("messages", months);
  const ccm = useOfficeReport<CcmReport>("ccm", undefined, nephrology);
  const exportRoster = useReportExport();
  const exportShare = useExternalShare();

  /* Open Questions are this office's inbox from the server (COLLAB's
     read-only adapter): a patient's last word, still unanswered. */
  const messagesHref = nephrology
    ? "/dashboard/nephrology/messages"
    : "/dashboard/clinic/messages";
  const inbox = useMessages();
  const questions = messagingRules.openQuestions(
    inbox.conversations,
    officeName,
  );
  const [questionsOpen, setQuestionsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <PageTitle
        href="/dashboard/clinic/reports"
        action={
          <Button
            size="small"
            loading={exportRoster.isPending}
            onClick={() =>
              exportShare.guard(
                () => exportRoster.mutate({ report: "roster", months }),
                "download",
              )
            }
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        }
      />

      {exportShare.notice}
      {exportRoster.error ? (
        <Alert tone="danger">{actionErrorText(exportRoster.error)}</Alert>
      ) : null}
      <FilterBar months={months} onMonths={setMonths} />

      <KpiCards
        roster={roster}
        programs={programs}
        messages={messages}
        questions={questions}
        questionsError={inbox.error}
        onOpenQuestions={() => setQuestionsOpen(true)}
      />
      <Modal
        open={questionsOpen}
        onClose={() => setQuestionsOpen(false)}
        title="Open Questions"
        description="Patient messages to your office that are still waiting for a reply. Replying in Messages clears them."
      >
        <OpenQuestionsList questions={questions} messagesHref={messagesHref} />
      </Modal>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <NewPatientsTrend roster={roster} />
        </div>
        <EnrollmentsByStatus programs={programs} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <MemberStatus roster={roster} />
        <ProgramCompletion programs={programs} />
        <CheckInRate notices={notices} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {nephrology ? (
          <CcmCard ccm={ccm} />
        ) : (
          <NoDataYet title="Top Education Topics" />
        )}
        <NoDataYet title="Member Outcomes" />
        <NoDataYet title="Recent Activity" />
      </section>

      <CustomReports months={months} nephrology={nephrology} />
    </div>
  );
}
