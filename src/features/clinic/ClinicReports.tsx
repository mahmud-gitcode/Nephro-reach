"use client";

import { useExternalShare } from "@/features/sharing/ExternalShareNotice";
import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  FileBarChart,
} from "lucide-react";

import {
  ActivitySolid,
  GraduationCapSolid,
  HeartPulseSolid,
  UsersSolid,
  VideoSolid,
} from "@/components/icons/solid";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  Badge,
  BarChart,
  Button,
  Card,
  KeyCard,
  type KeyCardTone,
  ChartLegend,
  DonutChart,
  LineChart,
  Modal,
  Progress,
  Select,
  type SeriesTone,
  buttonStyles,
} from "@/components/ui";
import { downloadText, toCsv } from "@/lib/utils/download";
import { useNow } from "@/lib/utils/useNow";
import {
  activityTone,
  checkInCompletion,
  engagementMonths,
  engagementSeries,
  ALL_MEMBERS_LABEL,
  ALL_PROGRAMS_LABEL,
  isImprovement,
  memberActivityCsv,
  moduleCompletion,
  reportRows,
  rosterReport,
  type ReportFilters,
  outcomes,
  percentChange,
  recentActivity,
  topTopics,
} from "./reports.data";
import { useClinicSettings } from "./useClinicSettings";
import { useClinicData } from "./useClinicData";
import { useMessages } from "@/features/messaging/useMessages";
import * as messagingRules from "@/features/messaging/messaging.rules";
import type { OpenQuestion } from "@/features/messaging/messaging.rules";
import {
  FACILITY,
  NEPHROLOGY_OFFICE,
} from "@/features/messaging/messaging.seed";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import { organizationFor } from "@/features/staff/staff";
import { MEMBER_STATUSES, type RosterMember } from "./members.data";

type Report = ReturnType<typeof rosterReport>;

const KPI_ICONS: Record<string, { icon: React.ReactNode; tone: KeyCardTone }> =
  {
    members: { icon: <UsersSolid />, tone: "brand" },
    completion: { icon: <GraduationCapSolid />, tone: "success" },
    attendees: { icon: <VideoSolid />, tone: "brand" },
    active: { icon: <ActivitySolid />, tone: "success" },
    questions: { icon: <HeartPulseSolid />, tone: "warning" },
  };

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

/** "↑ 12%" in green when it is good news, red when it is not — so a fall
    in ER visits reads as the win it is. The arrow and sign carry the
    direction; colour only says whether that direction is good. */
function Change({
  value,
  lowerIsBetter,
  suffix,
}: {
  value: number;
  lowerIsBetter?: boolean;
  suffix?: string;
}) {
  const good = isImprovement(value, lowerIsBetter);
  const Arrow = value < 0 ? ArrowDownRight : ArrowUpRight;
  return (
    <span
      className={`inline-flex items-center gap-inline-xs text-body-sm ${
        good ? "text-success" : "text-danger"
      }`}
    >
      <Arrow aria-hidden="true" className="h-4 w-4" />
      <span className="tabular-nums">
        {value > 0 ? "+" : ""}
        {value}%
      </span>
      {suffix ? <span className="text-fg-muted">{suffix}</span> : null}
    </span>
  );
}

function FilterBar({
  filters: value,
  programs,
  onChange,
}: {
  filters: ReportFilters;
  programs: string[];
  onChange: (next: ReportFilters) => void;
}) {
  /* The client's view is one clinic, so the organization is a label, not a
     choice — a clinic must never be able to pick another. */
  const { settings } = useClinicSettings();
  const now = useNow();
  const month = new Date(now).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Card as="section" padding="small" aria-label="Report filters">
      <div className="grid gap-inline-lg sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-label-md text-fg-secondary">Period</p>
          <p className="mt-stack-xs flex h-control-small items-center gap-inline-md rounded-control-small border border-line bg-surface-sunken px-control-x-small text-body-sm text-fg">
            <CalendarDays
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-fg-muted"
            />
            {month}
          </p>
        </div>
        <div>
          <p className="text-label-md text-fg-secondary">Organization</p>
          <p className="mt-stack-xs flex h-control-small items-center gap-inline-md rounded-control-small border border-line bg-surface-sunken px-control-x-small text-body-sm text-fg">
            <Building2
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-fg-muted"
            />
            <span className="truncate">{settings.profile.name}</span>
          </p>
        </div>
        <label className="block">
          <span className="text-label-md text-fg-secondary">Program</span>
          <Select
            selectSize="small"
            className="mt-stack-xs"
            value={value.program}
            onChange={(e) => onChange({ ...value, program: e.target.value })}
          >
            {[ALL_PROGRAMS_LABEL, ...programs].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </Select>
        </label>
        <label className="block">
          <span className="text-label-md text-fg-secondary">Member Type</span>
          <Select
            selectSize="small"
            className="mt-stack-xs"
            value={value.status}
            onChange={(e) => onChange({ ...value, status: e.target.value })}
          >
            {[ALL_MEMBERS_LABEL, ...MEMBER_STATUSES].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </Select>
        </label>
      </div>
    </Card>
  );
}

function KpiCards({
  kpis,
  onOpenQuestions,
}: {
  kpis: Report["kpis"];
  onOpenQuestions: () => void;
}) {
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
          {kpi.id === "questions" && kpi.value !== "0" ? (
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

/** A panel whose figures have no source in the app yet. */
function SampleNote() {
  return (
    <p className="mt-stack-xs text-caption text-fg-muted">
      Sample figures until reporting data is connected.
    </p>
  );
}

function EngagementTrend() {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Member Engagement Trend" />
      <SampleNote />
      <LineChart
        series={engagementSeries}
        xLabels={engagementMonths}
        yMin={0}
        yMax={300}
        yTicks={7}
        label="Member engagement by month"
        height={260}
      />
    </Card>
  );
}

function ShareDonut({
  title,
  label,
  rows,
  total,
}: {
  total: number;
  title: string;
  label: string;
  rows: {
    label: string;
    pct: number;
    tone: SeriesTone;
  }[];
}) {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title={title} />
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
        centerLabel="Members"
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
    </Card>
  );
}

function RateBars({
  title,
  label,
  bars,
}: {
  title: string;
  label: string;
  bars: { label: string; value: number }[];
}) {
  /* One measure across the bars, so one hue — the axis label says which
     program or week each is. */
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title={title} />
      <SampleNote />
      <BarChart
        bars={bars}
        label={label}
        unit="%"
        yMax={100}
        yTicks={6}
        height={220}
      />
    </Card>
  );
}

function ModuleCompletion() {
  /* Horizontal, so each program keeps its full name — a column chart had
     room for "Journey…" and nothing more. One measure, one hue. */
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Module Completion Rate" />
      <SampleNote />
      <ul className="space-y-stack-md">
        {moduleCompletion.map((row) => (
          <li key={row.label}>
            <div className="flex items-baseline justify-between gap-inline-md">
              <span className="text-body-sm text-fg-secondary">
                {row.label}
              </span>
              <span className="text-label-md text-fg tabular-nums">
                {row.value}%
              </span>
            </div>
            <Progress
              value={row.value}
              label={`${row.label} module completion`}
              size="medium"
              className="mt-stack-xs"
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TopTopics() {
  const max = Math.max(...topTopics.map((topic) => topic.views));
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Top Education Topics" />
      <SampleNote />
      <ul className="space-y-stack-md">
        {topTopics.map((topic) => (
          <li key={topic.label}>
            <div className="flex items-baseline justify-between gap-inline-md">
              <span className="text-body-sm text-fg-secondary">
                {topic.label}
              </span>
              <span className="text-label-md text-fg tabular-nums">
                {topic.views}
              </span>
            </div>
            <Progress
              value={topic.views}
              max={max}
              label={`${topic.label} views`}
              size="small"
              className="mt-stack-xs"
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function MemberOutcomes() {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Member Outcomes" />
      <SampleNote />
      <ul className="divide-y divide-line-subtle">
        {outcomes.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-inline-lg py-inset-sm first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-label-lg text-fg">{row.label}</p>
              <p className="text-body-sm text-fg-muted tabular-nums">
                <span className="text-heading-5 text-fg">{row.thisMonth}</span>{" "}
                this month · {row.lastMonth} last month
              </p>
            </div>
            <Change
              value={percentChange(row.thisMonth, row.lastMonth)}
              lowerIsBetter={row.lowerIsBetter}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function RecentActivity() {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Recent Activity" />
      <SampleNote />
      <ul className="divide-y divide-line-subtle">
        {recentActivity.map((entry) => (
          <li
            key={`${entry.member}-${entry.activity}`}
            className="flex items-center gap-inline-lg py-inset-xs first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <p className="text-label-lg text-fg">{entry.member}</p>
              <p className="text-body-sm text-fg-secondary">
                {entry.activity}
                <span className="text-fg-muted"> · {entry.date}</span>
              </p>
            </div>
            <Badge
              tone={activityTone[entry.status]}
              icon={
                entry.status === "Done" ? (
                  <CheckCircle2 aria-hidden="true" />
                ) : (
                  <AlertTriangle aria-hidden="true" />
                )
              }
            >
              {entry.status}
            </Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* Each report is a CSV of the rows on screen, built in the browser. */
function CustomReports({
  rows,
  questions,
}: {
  rows: RosterMember[];
  questions: OpenQuestion[];
}) {
  /* Leaves NephroReach: ask first (client, 2026-10-07). */
  const share = useExternalShare();
  const reports: Array<{
    id: string;
    label: string;
    table: () => Array<Array<string | number>>;
  }> = [
    {
      id: "engagement",
      label: "Member Engagement Report",
      table: () => [
        [
          "Name",
          "Program",
          "Status",
          "Last activity",
          "Live classes",
          "Check-ins",
        ],
        ...rows.map((m) => [
          m.name,
          m.program,
          m.status,
          m.lastActivity,
          `${m.liveClasses[0]}/${m.liveClasses[1]}`,
          `${m.checkIns[0]}/${m.checkIns[1]}`,
        ]),
      ],
    },
    {
      id: "completion",
      label: "Program Completion Report",
      table: () => [
        ["Name", "Program", "Progress %", "Current module", "Status"],
        ...rows.map((m) => [
          m.name,
          m.program,
          m.progress,
          m.currentModule,
          m.status,
        ]),
      ],
    },
    {
      id: "checkins",
      label: "Check-In Compliance Report",
      table: () => [
        ["Name", "Program", "Check-ins done", "Expected", "Compliance %"],
        ...rows.map((m) => [
          m.name,
          m.program,
          m.checkIns[0],
          m.checkIns[1],
          m.checkIns[1] ? Math.round((m.checkIns[0] / m.checkIns[1]) * 100) : 0,
        ]),
      ],
    },
    {
      id: "questions",
      label: "Open Questions Report",
      table: () => [
        ["Patient", "MRN", "Program", "Sent", "Question"],
        ...questions.map((q) => [
          q.memberName,
          q.mrn ?? "",
          q.program ?? "",
          new Date(q.sentAt).toLocaleString("en-US"),
          q.body,
        ]),
      ],
    },
    {
      id: "attendance",
      label: "Live Class Attendance Report",
      table: () => [
        ["Name", "Program", "Attended", "Offered"],
        ...rows.map((m) => [
          m.name,
          m.program,
          m.liveClasses[0],
          m.liveClasses[1],
        ]),
      ],
    },
    {
      id: "export",
      label: "Member Activity Export (CSV)",
      table: () => memberActivityCsv(rows),
    },
  ];

  return (
    <Card as="section" padding="small">
      <PanelHeading title="Custom Reports" />
      <p className="-mt-stack-md mb-stack-md text-caption text-fg-muted">
        Downloads the members shown by the filters above, as a CSV file.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <li key={report.id}>
            <button
              type="button"
              disabled={rows.length === 0}
              onClick={() =>
                share.guard(() =>
                  downloadText(
                    `${report.id}-report.csv`,
                    toCsv(report.table()),
                  ),
                )
              }
              className="flex w-full cursor-pointer items-center gap-inline-lg rounded-control border border-line-subtle bg-surface p-inset-sm text-left transition-colors duration-150 ease-standard hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface-brand-subtle text-brand-600"
              >
                {report.id === "export" ? (
                  <Download className="h-5 w-5" />
                ) : (
                  <FileBarChart className="h-5 w-5" />
                )}
              </span>
              <span className="min-w-0 flex-1 text-label-lg text-fg">
                {report.label}
              </span>
              <Download
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-fg-muted"
              />
            </button>
          </li>
        ))}
      </ul>
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
  const clinic = useClinicData();
  const roster = clinic.data?.roster ?? [];
  const [filters, setFilters] = useState<ReportFilters>({
    program: ALL_PROGRAMS_LABEL,
    status: ALL_MEMBERS_LABEL,
  });
  const rows = reportRows(roster, filters);
  const base = rosterReport(rows);

  /* Open Questions are real messages: a patient's last word to this
     office, still unanswered (client, 2026-10-09: the count has to lead to
     the question). Each office reads its own inbox. */
  const org = organizationFor(useOptionalAuth()?.user);
  const isNephrology = org?.portal === "nephrology";
  const office = isNephrology ? NEPHROLOGY_OFFICE : FACILITY;
  const messagesHref = isNephrology
    ? "/dashboard/nephrology/messages"
    : "/dashboard/clinic/messages";
  const { conversations } = useMessages();
  const filtered =
    filters.program !== ALL_PROGRAMS_LABEL ||
    filters.status !== ALL_MEMBERS_LABEL;
  const shownMrns = new Set(rows.map((m) => m.mrn));
  const questions = messagingRules
    .openQuestions(conversations, office.name)
    .filter((q) => !filtered || (q.mrn ? shownMrns.has(q.mrn) : false));
  const report = {
    ...base,
    kpis: base.kpis.map((k) =>
      k.id === "questions" ? { ...k, value: String(questions.length) } : k,
    ),
  };
  const programs = [...new Set(roster.map((m) => m.program))].sort();
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const exportShare = useExternalShare();

  function exportReport() {
    downloadText(
      "clinic-report.csv",
      toCsv([
        ["Measure", "Value"],
        ...report.kpis.map((k) => [k.label, k.value]),
        [],
        ["Program", "Share %"],
        ...report.byProgram.map((p) => [p.label, p.pct]),
        [],
        ["Status", "Share %"],
        ...report.byStatus.map((p) => [p.label, p.pct]),
        [],
        ...memberActivityCsv(rows),
      ]),
    );
  }

  return (
    <div className="space-y-4">
      <PageTitle
        href="/dashboard/clinic/reports"
        action={
          <Button
            size="small"
            onClick={() => exportShare.guard(exportReport)}
            disabled={rows.length === 0}
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        }
      />

      {exportShare.notice}
      <FilterBar filters={filters} programs={programs} onChange={setFilters} />

      <KpiCards
        kpis={report.kpis}
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
          <EngagementTrend />
        </div>
        <ShareDonut
          title="Members by Program"
          label="Members by program"
          rows={report.byProgram}
          total={report.total}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ShareDonut
          title="Member Status"
          label="Members by status"
          rows={report.byStatus}
          total={report.total}
        />
        <ModuleCompletion />
        <RateBars
          title="Check-In Completion Rate"
          label="Check-in completion rate by week"
          bars={checkInCompletion}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <TopTopics />
        <MemberOutcomes />
        <RecentActivity />
      </section>

      <CustomReports rows={rows} questions={questions} />
    </div>
  );
}
