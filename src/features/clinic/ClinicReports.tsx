"use client";

import React from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
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
  Progress,
  Select,
  type SeriesTone,
} from "@/components/ui";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";
import {
  activityTone,
  checkInCompletion,
  customReports,
  engagementMonths,
  engagementSeries,
  filters,
  isImprovement,
  kpis,
  memberStatus,
  membersByProgram,
  membersTotal,
  moduleCompletion,
  outcomes,
  percentChange,
  recentActivity,
  topTopics,
} from "./reports.data";
import { useClinicSettings } from "./useClinicSettings";

const KPI_ICONS: Record<string, { icon: React.ReactNode; tone: KeyCardTone }> =
  {
    members: { icon: <UsersSolid />, tone: "brand" },
    completion: { icon: <GraduationCapSolid />, tone: "success" },
    attendees: { icon: <VideoSolid />, tone: "brand" },
    active: { icon: <ActivitySolid />, tone: "success" },
    er: { icon: <HeartPulseSolid />, tone: "danger" },
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

function FilterBar() {
  /* The client's view is one clinic, so the organization is a label, not a
     choice — a clinic must never be able to pick another. The other
     filters are drawn but not wired: the demo figures are not broken down
     by program or member type, so they could only pretend to filter. */
  const { settings } = useClinicSettings();

  return (
    <Card as="section" padding="small" aria-label="Report filters">
      <div className="grid gap-inline-lg sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-label-md text-fg-secondary">Date Range</p>
          <p className="mt-stack-xs flex h-control-small items-center gap-inline-md rounded-control-small border border-line bg-surface-sunken px-control-x-small text-body-sm text-fg">
            <CalendarDays
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-fg-muted"
            />
            {filters.dateRange}
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
            {...notBuiltYet("Filtering reports by program")}
            selectSize="small"
            className="mt-stack-xs"
            defaultValue={filters.programs[0]}
          >
            {filters.programs.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </Select>
        </label>
        <label className="block">
          <span className="text-label-md text-fg-secondary">Member Type</span>
          <Select
            {...notBuiltYet("Filtering reports by member type")}
            selectSize="small"
            className="mt-stack-xs"
            defaultValue={filters.memberTypes[0]}
          >
            {filters.memberTypes.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </Select>
        </label>
      </div>
    </Card>
  );
}

function KpiCards() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi) => (
        <KeyCard
          key={kpi.id}
          tone={KPI_ICONS[kpi.id].tone}
          icon={KPI_ICONS[kpi.id].icon}
          value={kpi.value}
          label={kpi.label}
          note={
            <Change
              value={kpi.change}
              lowerIsBetter={kpi.lowerIsBetter}
              suffix="vs. last month"
            />
          }
        />
      ))}
    </section>
  );
}

function EngagementTrend() {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Member Engagement Trend" />
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
}: {
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
        centerValue={membersTotal}
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

function CustomReports() {
  return (
    <Card as="section" padding="small">
      <PanelHeading title="Custom Reports" />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {customReports.map((report) => (
          <li key={report.id}>
            {/* The whole tile is the control, so it is one button — the
                chevron only says it goes somewhere. */}
            <button
              type="button"
              {...notBuiltYet(report.label)}
              className="flex w-full items-center gap-inline-lg rounded-control border border-line-subtle bg-surface p-inset-sm text-left disabled:cursor-not-allowed disabled:opacity-60"
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
              <ChevronRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-fg-muted"
              />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function ClinicReports() {
  return (
    <div className="space-y-4">
      <PageTitle
        href="/dashboard/clinic/reports"
        action={
          <Button {...notBuiltYet("Exporting the report")} size="small">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        }
      />

      <FilterBar />

      <KpiCards />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <EngagementTrend />
        </div>
        <ShareDonut
          title="Members by Program"
          label="Members by program"
          rows={membersByProgram}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ShareDonut
          title="Member Status"
          label="Members by status"
          rows={memberStatus}
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

      <CustomReports />
    </div>
  );
}
