"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleDashed,
  Clock,
  Download,
  MoreHorizontal,
  PlayCircle,
  Search,
  Users,
} from "lucide-react";

import { PageTitle } from "@/components/layout/PageTitle";
import {
  Badge,
  Button,
  Card,
  ChartLegend,
  DonutChart,
  Input,
  Progress,
  ProgressRing,
  Select,
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TablePagination,
  TableRow,
} from "@/components/ui";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";
import { tableIconButton } from "./tableButton";
import { paginate, ROWS_PER_PAGE_OPTIONS } from "./enrollment.data";
import {
  ALL_PROGRAMS,
  ALL_STATUSES,
  filterMembers,
  journeyDetails,
  members,
  membersByStatus,
  membersByStatusHeading,
  moduleBreakdown,
  overallCompletion,
  programOptions,
  programOverview,
  recentActivity,
  statusOptions,
  statusTone,
  stepLabel,
  summary,
  timeToCompletion,
} from "./curriculumProgress.data";

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

function CountCard({
  label,
  value,
  icon,
  tint,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tint: string;
}) {
  return (
    <Card as="article" padding="small" className="min-h-[144px]">
      <div className="mb-stack-md flex items-start justify-between gap-inline-lg">
        <p className="text-heading-5 text-fg-secondary">{label}</p>
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control [&_svg]:h-5 [&_svg]:w-5 ${tint}`}
        >
          {icon}
        </span>
      </div>
      <p className="text-metric-lg text-fg">{value}</p>
    </Card>
  );
}

function SummaryCards() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <Card as="article" padding="small" className="min-h-[144px]">
        <div className="mb-stack-md flex items-start justify-between gap-inline-lg">
          <p className="text-heading-5 text-fg-secondary">Active Learners</p>
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface-brand-subtle"
          >
            <Users className="h-5 w-5 text-brand-600" />
          </span>
        </div>
        <p className="text-metric-lg text-fg">{summary.activeLearners}</p>
        <p className="mt-stack-xs text-body-sm text-fg-muted">
          {summary.enrolled} enrolled
        </p>
      </Card>

      <Card as="article" padding="small" className="min-h-[144px]">
        <p className="text-heading-5 text-fg-secondary">
          Average Curriculum Completion
        </p>
        <ProgressRing
          value={summary.averageCompletion}
          label="Average curriculum completion"
          size={72}
          thickness={9}
          className="mt-stack-sm"
        />
      </Card>

      <CountCard
        label="Members Completed Program"
        value={summary.completed}
        icon={<CheckCircle2 className="text-success" />}
        tint="bg-success-surface"
      />
      <CountCard
        label="In Progress"
        value={summary.inProgress}
        icon={<PlayCircle className="text-brand-600" />}
        tint="bg-surface-brand-subtle"
      />
      <CountCard
        label="Not Started"
        value={summary.notStarted}
        icon={<CircleDashed className="text-fg-secondary" />}
        tint="bg-surface-sunken"
      />
    </section>
  );
}

function ProgramProgressOverview() {
  return (
    <Card as="section" padding="small">
      <PanelHeading
        title="Program Progress Overview"
        description="See how your members are progressing through each program."
      />
      <ul className="grid gap-4 md:grid-cols-3">
        {programOverview.map((program) => (
          <li
            key={program.name}
            className="rounded-control border border-line-subtle bg-surface-sunken p-inset-md"
          >
            <p className="text-heading-5 text-fg">{program.name}</p>
            <div className="mt-stack-md flex items-baseline justify-between gap-inline-md">
              <span className="text-body-sm text-fg-secondary">Progress</span>
              <span className="text-label-lg text-fg tabular-nums">
                {program.progress}%
              </span>
            </div>
            <Progress
              value={program.progress}
              label={`${program.name} progress`}
              size="medium"
              className="mt-stack-xs"
            />
            <ul className="mt-stack-md space-y-stack-xs">
              {program.stats.map((stat) => (
                <li
                  key={stat}
                  className="text-body-sm text-fg-secondary tabular-nums"
                >
                  {stat}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function MemberTable() {
  const [query, setQuery] = useState("");
  const [program, setProgram] = useState(ALL_PROGRAMS);
  const [status, setStatus] = useState(ALL_STATUSES);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () => filterMembers(members, { query, program, status }),
    [query, program, status],
  );
  const view = useMemo(
    () => paginate(filtered, page, perPage),
    [filtered, page, perPage],
  );

  /* Any filter change returns to page 1, adjusted during render rather
     than in an effect — see the same block in ClinicEnrollment. */
  const filterKey = `${query}|${program}|${status}|${perPage}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const pageMrns = view.rows.map((member) => member.mrn);
  const allOnPageSelected =
    pageMrns.length > 0 && pageMrns.every((mrn) => selected.has(mrn));

  function toggleAllOnPage() {
    setSelected((current) => {
      const next = new Set(current);
      if (allOnPageSelected) pageMrns.forEach((mrn) => next.delete(mrn));
      else pageMrns.forEach((mrn) => next.add(mrn));
      return next;
    });
  }

  function toggleOne(mrn: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(mrn)) next.delete(mrn);
      else next.add(mrn);
      return next;
    });
  }

  return (
    <Card as="section" padding="small">
      <PanelHeading
        title="Member Curriculum Progress"
        description="Track each member's module completion, progress, and status."
      />

      <div className="mb-stack-lg flex flex-col gap-inline-md lg:flex-row lg:items-center">
        <Input
          type="search"
          inputSize="small"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or MRN..."
          aria-label="Search members"
          leadingIcon={<Search aria-hidden="true" />}
          className="lg:max-w-xs lg:flex-1"
        />
        <Select
          selectSize="small"
          aria-label="Program"
          value={program}
          onChange={(event) => setProgram(event.target.value)}
        >
          {programOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
        <Select
          selectSize="small"
          aria-label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          {statusOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
        <Button
          {...notBuiltYet("Exporting member progress")}
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          className="lg:ml-auto"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {selected.size > 0 ? (
        <p className="mb-stack-sm text-body-sm text-fg-secondary">
          {selected.size} selected.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-control border border-line">
        <Table minWidth={880}>
          <TableHead className="bg-surface-sunken">
            <TableRow>
              <TableHeaderCell className="w-10">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleAllOnPage}
                  aria-label="Select all members on this page"
                  className="h-4 w-4 cursor-pointer accent-brand-600"
                />
              </TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Program</TableHeaderCell>
              <TableHeaderCell>Current Module</TableHeaderCell>
              <TableHeaderCell>Day/Module</TableHeaderCell>
              <TableHeaderCell>Progress</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Last Activity</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {view.rows.length === 0 ? (
              <TableEmptyRow colSpan={9}>
                No members match these filters.
              </TableEmptyRow>
            ) : (
              view.rows.map((member) => (
                <TableRow key={member.mrn}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(member.mrn)}
                      onChange={() => toggleOne(member.mrn)}
                      aria-label={`Select ${member.name}`}
                      className="h-4 w-4 cursor-pointer accent-brand-600"
                    />
                  </TableCell>
                  <TableCell emphasis className="whitespace-nowrap">
                    {member.name}
                    <span className="block text-caption font-normal text-fg-muted tabular-nums">
                      MRN {member.mrn}
                    </span>
                  </TableCell>
                  <TableCell>{member.program}</TableCell>
                  <TableCell>{member.module}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {stepLabel(member)}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-inline-md">
                      <Progress
                        value={member.progress}
                        label={`${member.name} curriculum progress`}
                        size="small"
                        className="w-14"
                      />
                      <span className="tabular-nums">{member.progress}%</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge tone={statusTone[member.status]}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {member.lastActivity}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      {...notBuiltYet("Member actions")}
                      variant="neutral"
                      appearance="fill-stroke"
                      size="small"
                      iconOnly
                      className={tableIconButton}
                      aria-label={`Actions for ${member.name}`}
                    >
                      <MoreHorizontal aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-stack-md flex flex-col gap-inline-md sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-inline-md text-body-sm text-fg-secondary">
          Rows per page
          <Select
            selectSize="small"
            value={String(perPage)}
            onChange={(event) => setPerPage(Number(event.target.value))}
            className="w-20"
          >
            {ROWS_PER_PAGE_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </Select>
        </label>
        <TablePagination
          page={view.page}
          pageCount={view.pageCount}
          onPageChange={setPage}
          summary={`Showing ${view.firstShown}–${view.lastShown} of ${view.total} members`}
        />
      </div>
    </Card>
  );
}

function ProgramDetails() {
  return (
    <Card as="section" padding="small" className="flex flex-col">
      <PanelHeading title="Program Details" />
      <p className="text-heading-5 text-fg">{journeyDetails.name}</p>
      <p className="mt-stack-xs text-body-sm text-fg-muted">
        {journeyDetails.description}
      </p>
      <p className="mt-stack-md text-label-md text-fg-secondary">Includes:</p>
      <ul className="mt-stack-xs space-y-stack-xs">
        {journeyDetails.includes.map((item) => (
          <li
            key={item}
            className="flex items-center gap-inline-md text-body-sm text-fg"
          >
            <CheckCircle2
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-success"
            />
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-inset-md">
        <Button
          {...notBuiltYet("Viewing the curriculum")}
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          fullWidth
        >
          View Curriculum
        </Button>
      </div>
    </Card>
  );
}

function ModuleCompletionBreakdown() {
  return (
    <Card as="section" padding="small" className="flex flex-col">
      <PanelHeading title="Module Completion Breakdown" />
      <ChartLegend
        items={moduleBreakdown.map((row) => ({
          label: row.label,
          tone: row.tone,
          value: row.value,
        }))}
      />
      <div className="mt-auto border-t border-line-subtle pt-inset-sm">
        <div className="flex items-baseline justify-between gap-inline-md">
          <span className="text-label-md text-fg-secondary">
            Overall Completion
          </span>
          <span className="text-heading-5 text-fg tabular-nums">
            {overallCompletion}%
          </span>
        </div>
        <Progress
          value={overallCompletion}
          label="Overall module completion"
          tone="success"
          size="medium"
          className="mt-stack-xs"
        />
      </div>
    </Card>
  );
}

function RecentModuleActivity() {
  return (
    <Card as="section" padding="small">
      <PanelHeading title="Recent Module Activity" />
      <ul className="divide-y divide-line-subtle">
        {recentActivity.map((entry) => (
          <li
            key={`${entry.name}-${entry.subject}`}
            className="flex items-start gap-inline-lg py-inset-xs first:pt-0 last:pb-0"
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-surface-brand-subtle text-label-md text-brand-600"
            >
              {entry.name
                .split(" ")
                .filter((part) => !part.endsWith("."))
                .map((part) => part[0])
                .join("")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-label-lg text-fg">{entry.name}</p>
              <p className="text-body-sm text-fg-secondary">
                {entry.action}: {entry.subject}
              </p>
            </div>
            <span className="shrink-0 text-caption text-fg-muted">
              {entry.when}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ProgramCompletionRate() {
  return (
    <Card as="section" padding="small">
      <PanelHeading title="Program Completion Rate" />
      {/* One measure across three programs, so one hue — the label carries
          which program, colour would only repeat it. */}
      <ul className="space-y-stack-md">
        {programOverview.map((program) => (
          <li key={program.name}>
            <div className="flex items-baseline justify-between gap-inline-md">
              <span className="text-body-sm text-fg-secondary">
                {program.name.replace(/ \(.*\)$/, "")}
              </span>
              <span className="text-label-md text-fg tabular-nums">
                {program.progress}%
              </span>
            </div>
            <Progress
              value={program.progress}
              label={`${program.name} completion rate`}
              size="small"
              className="mt-stack-xs"
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function MembersByStatus() {
  return (
    <Card as="section" padding="small">
      <PanelHeading title="Members by Status" />
      <div className="grid items-center gap-inset-md sm:grid-cols-[140px_minmax(0,1fr)]">
        <DonutChart
          segments={membersByStatus}
          label="Members by status"
          size={140}
          thickness={26}
          centerValue={membersByStatusHeading}
          centerLabel="Members"
          className="mx-auto"
        />
        <ChartLegend
          items={membersByStatus.map((row) => ({
            label: row.label,
            tone: row.tone,
            value: row.value,
          }))}
        />
      </div>
    </Card>
  );
}

function TimeToCompletion() {
  return (
    <Card as="section" padding="small">
      <PanelHeading title="Time to Completion (Average)" />
      <ul className="divide-y divide-line-subtle">
        {timeToCompletion.map((row) => (
          <li
            key={row.program}
            className="flex items-center gap-inline-lg py-inset-sm first:pt-0 last:pb-0"
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface-sunken text-fg-secondary"
            >
              <Clock className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 text-body-sm text-fg-secondary">
              {row.program}
            </span>
            <span className="text-label-lg text-fg tabular-nums">
              {row.average}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function ClinicCurriculumProgress() {
  return (
    <div className="space-y-4">
      <PageTitle href="/dashboard/clinic/curriculum-progress" />

      <SummaryCards />

      <ProgramProgressOverview />

      <MemberTable />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ProgramDetails />
        <ModuleCompletionBreakdown />
        <RecentModuleActivity />
        <ProgramCompletionRate />
        <MembersByStatus />
        <TimeToCompletion />
      </section>
    </div>
  );
}
