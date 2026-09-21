"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  CircleDashed,
  Clock,
  Download,
  Eye,
  GraduationCap,
  MessageSquareText,
  PlayCircle,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";

import { PageTitle } from "@/components/layout/PageTitle";
import {
  Badge,
  Button,
  buttonStyles,
  Card,
  ChartLegend,
  DonutChart,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Progress,
  ProgressRing,
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
  toneVar,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";
import { tableIconButton } from "./tableButton";
import { initials } from "./clinicIcons";
import { memberLink } from "./clinicDashboard.data";
import { paginate, ROWS_PER_PAGE_OPTIONS } from "./enrollment.data";
import {
  ALL_PROGRAMS,
  ALL_STATUSES,
  CRASH,
  filterMembers,
  JOURNEY,
  journeyDetails,
  LIBRARY,
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
  type MemberProgress,
} from "./curriculumProgress.data";
import { UpdatedBar } from "./UpdatedBar";
import { useClinicData } from "./useClinicData";

const MESSAGES = "/dashboard/clinic/messages";

const outlineLink = buttonStyles({
  variant: "neutral",
  appearance: "fill-stroke",
  size: "small",
});

const iconControl = cn(
  buttonStyles({
    variant: "neutral",
    appearance: "fill-stroke",
    size: "small",
    iconOnly: true,
  }),
  tableIconButton,
);

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/* A row or tile that filters the table when pressed. aria-pressed carries
   the state; the tint only echoes it. */
const filterRow = (on: boolean) =>
  cn(
    "w-full cursor-pointer rounded-control-small p-inset-xs text-left hover:bg-surface-sunken",
    on && "bg-surface-brand-subtle",
    focusRing,
  );

type Filters = { query: string; program: string; status: string };

/** "Journey to Dialysis (21-Day)" and "Journey to Dialysis" are one
    program; the table filters on the curriculum's name. */
function programOf(label: string) {
  if (label.startsWith(CRASH)) return CRASH;
  if (label.startsWith(LIBRARY)) return LIBRARY;
  return JOURNEY;
}

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

/* ------------------------------------------------------- summary cards

   The status cards filter the table below. Their figures are the
   client's, as given; the table counts the roster, so pressing one shows
   the real list behind it — see the header of curriculumProgress.data.ts
   for why the two differ. */

const keyCardClass =
  "flex min-h-[144px] w-full flex-col rounded-card border bg-surface p-inset-lg text-left transition-all duration-150 ease-standard hover:-translate-y-0.5 hover:border-line-strong";

function KeyCardBody({
  label,
  value,
  note,
  icon,
  tint,
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
  icon: React.ReactNode;
  tint: string;
}) {
  return (
    <>
      <span className="mb-stack-md flex items-start justify-between gap-inline-lg">
        <span className="text-heading-5 text-fg-secondary">{label}</span>
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control [&_svg]:h-5 [&_svg]:w-5 ${tint}`}
        >
          {icon}
        </span>
      </span>
      <span className="text-metric-lg text-fg">{value}</span>
      {note ? (
        <span className="mt-stack-xs text-body-sm text-fg-muted">{note}</span>
      ) : null}
    </>
  );
}

function SummaryCards({
  status,
  onStatus,
}: {
  status: string;
  onStatus: (status: string) => void;
}) {
  const cards = [
    {
      status: "Completed",
      label: "Members Completed Program",
      value: summary.completed,
      icon: <CheckCircle2 className="text-success" />,
      tint: "bg-success-surface",
    },
    {
      status: "In Progress",
      label: "In Progress",
      value: summary.inProgress,
      icon: <PlayCircle className="text-brand-600" />,
      tint: "bg-surface-brand-subtle",
    },
    {
      status: "Not Started",
      label: "Not Started",
      value: summary.notStarted,
      icon: <CircleDashed className="text-fg-secondary" />,
      tint: "bg-surface-sunken",
    },
  ];
  const allOn = status === ALL_STATUSES;

  return (
    <section
      aria-label="Curriculum summary"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      <button
        type="button"
        aria-pressed={allOn}
        onClick={() => onStatus(ALL_STATUSES)}
        className={cn(
          keyCardClass,
          focusRing,
          allOn ? "border-action ring-1 ring-action" : "border-line",
        )}
      >
        <KeyCardBody
          label="Active Learners"
          value={summary.activeLearners}
          note={`${summary.enrolled} enrolled`}
          icon={<Users className="text-brand-600" />}
          tint="bg-surface-brand-subtle"
        />
      </button>

      {/* A figure, not a filter — there is no list of "average". */}
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

      {cards.map((card) => {
        const on = status === card.status;
        return (
          <button
            key={card.status}
            type="button"
            aria-pressed={on}
            onClick={() => onStatus(on ? ALL_STATUSES : card.status)}
            className={cn(
              keyCardClass,
              focusRing,
              on ? "border-action ring-1 ring-action" : "border-line",
            )}
          >
            <KeyCardBody
              label={card.label}
              value={card.value}
              icon={card.icon}
              tint={card.tint}
            />
          </button>
        );
      })}
    </section>
  );
}

function ProgramProgressOverview({
  program,
  onProgram,
}: {
  program: string;
  onProgram: (program: string) => void;
}) {
  return (
    <Card as="section" padding="small">
      <PanelHeading
        title="Program Progress Overview"
        description="See how your members are progressing through each program. Select one to list its members."
      />
      <ul className="grid gap-4 md:grid-cols-3">
        {programOverview.map((overview) => {
          const target = programOf(overview.name);
          const on = program === target;
          return (
            <li key={overview.name}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onProgram(on ? ALL_PROGRAMS : target)}
                className={cn(
                  "h-full w-full cursor-pointer rounded-control border bg-surface-sunken p-inset-md text-left transition-colors hover:border-line-strong",
                  on
                    ? "border-action ring-1 ring-action"
                    : "border-line-subtle",
                  focusRing,
                )}
              >
                <span className="block text-heading-5 text-fg">
                  {overview.name}
                </span>
                <span className="mt-stack-md flex items-baseline justify-between gap-inline-md">
                  <span className="text-body-sm text-fg-secondary">
                    Progress
                  </span>
                  <span className="text-label-lg text-fg tabular-nums">
                    {overview.progress}%
                  </span>
                </span>
                <Progress
                  value={overview.progress}
                  label={`${overview.name} progress`}
                  size="medium"
                  className="mt-stack-xs"
                />
                <span className="mt-stack-md block space-y-stack-xs">
                  {overview.stats.map((stat) => (
                    <span
                      key={stat}
                      className="block text-body-sm text-fg-secondary tabular-nums"
                    >
                      {stat}
                    </span>
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* --------------------------------------------------------------- table */

function MemberTable({
  list,
  filters,
  onFilters,
  onView,
}: {
  list: MemberProgress[];
  filters: Filters;
  onFilters: (change: Partial<Filters>) => void;
  onView: (mrn: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => filterMembers(list, filters), [list, filters]);
  const view = paginate(filtered, page, perPage);

  /* A filter change — from these controls, the cards or the panels —
     returns to page 1. Adjusted during render rather than in an effect. */
  const filterKey = `${filters.query}|${filters.program}|${filters.status}|${perPage}`;
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

  const filtersOn =
    filters.query !== "" ||
    filters.program !== ALL_PROGRAMS ||
    filters.status !== ALL_STATUSES;

  return (
    <Card
      as="section"
      padding="small"
      id="member-progress"
      className="scroll-mt-4"
    >
      <PanelHeading
        title="Member Curriculum Progress"
        description="Track each member's module completion, progress, and status."
      />

      <div className="mb-stack-lg flex flex-col gap-inline-md lg:flex-row lg:items-center">
        <Input
          type="search"
          inputSize="small"
          value={filters.query}
          onChange={(event) => onFilters({ query: event.target.value })}
          placeholder="Search by name or MRN..."
          aria-label="Search members"
          leadingIcon={<Search aria-hidden="true" />}
          className="lg:max-w-xs lg:flex-1"
        />
        <Select
          selectSize="small"
          aria-label="Program"
          value={filters.program}
          onChange={(event) => onFilters({ program: event.target.value })}
        >
          {programOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
        <Select
          selectSize="small"
          aria-label="Status"
          value={filters.status}
          onChange={(event) => onFilters({ status: event.target.value })}
          className="lg:w-48"
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
        <div
          role="region"
          aria-label="Selected members"
          className="mb-stack-md flex flex-wrap items-center gap-inline-md rounded-control border border-line bg-surface-sunken px-inset-sm py-inset-xs"
        >
          <p className="text-label-md text-fg">{selected.size} selected</p>
          <Link href={MESSAGES} className={outlineLink}>
            <MessageSquareText className="h-4 w-4" />
            Message selected
          </Link>
          <Button
            variant="neutral"
            appearance="stroke"
            size="small"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </Button>
        </div>
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
                <span className="flex flex-wrap items-center gap-inline-md text-body-sm text-fg-secondary">
                  No members match these filters.
                  {filtersOn ? (
                    <Button
                      variant="neutral"
                      appearance="fill-stroke"
                      size="small"
                      onClick={() =>
                        onFilters({
                          query: "",
                          program: ALL_PROGRAMS,
                          status: ALL_STATUSES,
                        })
                      }
                    >
                      Clear filters
                    </Button>
                  ) : null}
                </span>
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
                    <button
                      type="button"
                      onClick={() => onView(member.mrn)}
                      className={cn(
                        "cursor-pointer rounded-control-small text-left hover:text-fg-brand hover:underline",
                        focusRing,
                      )}
                    >
                      {member.name}
                    </button>
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
                  <TableCell>
                    <span className="flex justify-end gap-inline-xs">
                      <button
                        type="button"
                        onClick={() => onView(member.mrn)}
                        className={iconControl}
                        aria-label={`View ${member.name}`}
                        title="View progress"
                      >
                        <Eye aria-hidden="true" />
                      </button>
                      <Link
                        href={MESSAGES}
                        className={iconControl}
                        aria-label={`Message ${member.name}`}
                        title="Send message"
                      >
                        <MessageSquareText aria-hidden="true" />
                      </Link>
                    </span>
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

/* --------------------------------------------------------- details popup */

function DetailTile({
  icon: TileIcon,
  label,
  children,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-inline-md rounded-control border border-line-subtle bg-surface-sunken p-inset-sm">
      <TileIcon
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted"
      />
      <div className="min-w-0">
        <dt className="text-caption text-fg-muted">{label}</dt>
        <dd className="mt-stack-xs text-label-lg text-fg">{children}</dd>
      </div>
    </div>
  );
}

/**
 * One member's place in their curriculum, in a popup like the Member
 * page's. This view is about the program — where they are and how far —
 * and links to the Member page for the rest of their record.
 */
function ProgressModal({
  member,
  onClose,
}: {
  member: MemberProgress;
  onClose: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={member.name}
      description={`MRN ${member.mrn} · ${member.program}`}
      footer={
        <>
          <Link href={MESSAGES} className={outlineLink}>
            <MessageSquareText className="h-4 w-4" />
            Send Message
          </Link>
          <Link
            href={memberLink({ mrn: member.mrn })}
            className={buttonStyles({ size: "small" })}
          >
            Open Member Page
          </Link>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-inline-lg">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-surface-brand-subtle text-heading-5 text-brand-600"
        >
          {initials(member.name)}
        </span>
        <Badge tone={statusTone[member.status]}>{member.status}</Badge>
      </div>

      <div className="mt-stack-lg">
        <div className="flex items-baseline justify-between gap-inline-md">
          <span className="text-body-sm text-fg-secondary">
            Curriculum progress
          </span>
          <span className="text-heading-5 text-fg tabular-nums">
            {member.progress}%
          </span>
        </div>
        <Progress
          value={member.progress}
          label={`${member.name} curriculum progress`}
          size="medium"
          className="mt-stack-xs"
        />
      </div>

      <dl className="mt-stack-lg grid gap-inline-md sm:grid-cols-2">
        <DetailTile icon={BookOpen} label="Current Module">
          {member.module}
        </DetailTile>
        <DetailTile icon={TrendingUp} label="Day/Module">
          {stepLabel(member)}
        </DetailTile>
        <DetailTile icon={GraduationCap} label="Program">
          {member.program}
        </DetailTile>
        <DetailTile icon={Clock} label="Last Activity">
          {member.lastActivity}
        </DetailTile>
      </dl>
    </Modal>
  );
}

/* -------------------------------------------------------------- panels

   The lower panels filter too, and show the client's figures as given. */

function ProgramDetails() {
  return (
    <Card as="section" padding="small" className="flex h-full flex-col">
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
    <Card as="section" padding="small" className="flex h-full flex-col">
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

function RecentModuleActivity({
  list,
  onView,
}: {
  list: MemberProgress[];
  onView: (mrn: string) => void;
}) {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Recent Module Activity" />
      <ul className="divide-y divide-line-subtle">
        {recentActivity.map((entry) => {
          const member = list.find((m) => m.name === entry.name);
          return (
            <li
              key={`${entry.name}-${entry.subject}`}
              className="flex items-start gap-inline-lg py-inset-xs first:pt-0 last:pb-0"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-surface-brand-subtle text-label-md text-brand-600"
              >
                {initials(entry.name)}
              </span>
              <div className="min-w-0 flex-1">
                {member ? (
                  <button
                    type="button"
                    onClick={() => onView(member.mrn)}
                    className={cn(
                      "cursor-pointer rounded-control-small text-left text-label-lg text-fg hover:text-fg-brand hover:underline",
                      focusRing,
                    )}
                  >
                    {entry.name}
                  </button>
                ) : (
                  <p className="text-label-lg text-fg">{entry.name}</p>
                )}
                <p className="text-body-sm text-fg-secondary">
                  {entry.action}: {entry.subject}
                </p>
              </div>
              <span className="shrink-0 text-caption text-fg-muted">
                {entry.when}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function ProgramCompletionRate({
  program,
  onProgram,
}: {
  program: string;
  onProgram: (program: string) => void;
}) {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Program Completion Rate" />
      {/* One measure across three programs, so one hue — the label carries
          which program, colour would only repeat it. */}
      <ul className="space-y-stack-sm">
        {programOverview.map((overview) => {
          const target = programOf(overview.name);
          const on = program === target;
          return (
            <li key={overview.name}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onProgram(on ? ALL_PROGRAMS : target)}
                className={filterRow(on)}
              >
                <span className="flex items-baseline justify-between gap-inline-md">
                  <span className="text-body-sm text-fg-secondary">
                    {target}
                  </span>
                  <span className="text-label-md text-fg tabular-nums">
                    {overview.progress}%
                  </span>
                </span>
                <Progress
                  value={overview.progress}
                  label={`${overview.name} completion rate`}
                  size="small"
                  className="mt-stack-xs"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function MembersByStatus({
  status,
  onStatus,
}: {
  status: string;
  onStatus: (status: string) => void;
}) {
  return (
    <Card as="section" padding="small" className="h-full">
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
        <ul className="space-y-stack-xs">
          {membersByStatus.map((row) => {
            const on = status === row.label;
            return (
              <li key={row.label}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onStatus(on ? ALL_STATUSES : row.label)}
                  className={cn(
                    filterRow(on),
                    "flex items-center gap-inline-md",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-pill"
                    style={{ background: toneVar[row.tone] }}
                  />
                  <span className="min-w-0 flex-1 text-body-sm text-fg">
                    {row.label}
                  </span>
                  <span className="text-label-md text-fg tabular-nums">
                    {row.value}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}

function TimeToCompletion({
  program,
  onProgram,
}: {
  program: string;
  onProgram: (program: string) => void;
}) {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Time to Completion (Average)" />
      <ul className="space-y-stack-xs">
        {timeToCompletion.map((row) => {
          const on = program === row.program;
          return (
            <li key={row.program}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onProgram(on ? ALL_PROGRAMS : row.program)}
                className={cn(filterRow(on), "flex items-center gap-inline-lg")}
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
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ---------------------------------------------------------------- page */

function PageSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} height={144} className="rounded-card" />
        ))}
      </div>
      <Skeleton height={720} className="rounded-card" />
    </div>
  );
}

/**
 * Filters and the open member live in the URL as well as in state
 * (?status=, ?program=, ?mrn=; ?q= is read from older links), so a link,
 * Back or a refresh land on the same view. Values that are not on the
 * menus or the roster are ignored rather than trusted.
 */
function CurriculumView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const clinic = useClinicData();
  const list = useMemo(() => clinic.data?.curriculum ?? [], [clinic.data]);

  const [filters, setFilters] = useState<Filters>(() => {
    const status = params.get("status") ?? "";
    const program = params.get("program") ?? "";
    return {
      query: params.get("q") ?? "",
      status: statusOptions.includes(status) ? status : ALL_STATUSES,
      program: programOptions.includes(program) ? program : ALL_PROGRAMS,
    };
  });
  const [openMrn, setOpenMrn] = useState<string | null>(params.get("mrn"));
  const open = list.find((member) => member.mrn === openMrn) ?? null;

  function writeUrl(next: Filters, mrn: string | null) {
    const query = new URLSearchParams();
    if (next.status !== ALL_STATUSES) query.set("status", next.status);
    if (next.program !== ALL_PROGRAMS) query.set("program", next.program);
    if (mrn) query.set("mrn", mrn);
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function updateFilters(change: Partial<Filters>) {
    const next = { ...filters, ...change };
    setFilters(next);
    /* Search stays out of the URL: it would rewrite history per keystroke. */
    if ("status" in change || "program" in change) writeUrl(next, openMrn);
  }

  function view(mrn: string) {
    setOpenMrn(mrn);
    writeUrl(filters, mrn);
  }

  function close() {
    setOpenMrn(null);
    writeUrl(filters, null);
  }

  if (clinic.error) {
    return (
      <ErrorState
        title="Curriculum progress could not be loaded"
        error={clinic.error}
        onRetry={clinic.refetch}
      />
    );
  }

  if (clinic.isPending) return <PageSkeleton />;

  if (list.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="No members in a program yet"
        description="Enrolled patients appear here as they start their curriculum."
        action={
          <Link
            href="/dashboard/clinic/enroll-patients"
            className={buttonStyles({ size: "small" })}
          >
            Enroll a patient
          </Link>
        }
      />
    );
  }

  return (
    <>
      <UpdatedBar
        updatedAt={clinic.updatedAt}
        isFetching={clinic.isFetching}
        refetch={clinic.refetch}
      />

      <SummaryCards
        status={filters.status}
        onStatus={(status) => updateFilters({ status })}
      />

      <ProgramProgressOverview
        program={filters.program}
        onProgram={(program) => updateFilters({ program })}
      />

      <MemberTable
        list={list}
        filters={filters}
        onFilters={updateFilters}
        onView={view}
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ProgramDetails />
        <ModuleCompletionBreakdown />
        <RecentModuleActivity list={list} onView={view} />
        <ProgramCompletionRate
          program={filters.program}
          onProgram={(program) => updateFilters({ program })}
        />
        <MembersByStatus
          status={filters.status}
          onStatus={(status) => updateFilters({ status })}
        />
        <TimeToCompletion
          program={filters.program}
          onProgram={(program) => updateFilters({ program })}
        />
      </section>

      {open ? <ProgressModal member={open} onClose={close} /> : null}
    </>
  );
}

export default function ClinicCurriculumProgress() {
  return (
    <div className="space-y-4">
      <PageTitle href="/dashboard/clinic/curriculum-progress" />
      {/* useSearchParams needs a Suspense boundary on a prerendered page. */}
      <Suspense fallback={<PageSkeleton />}>
        <CurriculumView />
      </Suspense>
    </div>
  );
}
