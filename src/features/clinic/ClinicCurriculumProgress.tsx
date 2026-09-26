"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  GraduationCap,
  MessageSquareText,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  CheckCircleSolid,
  ClockSolid,
  NotStartedSolid,
  TargetSolid,
  UsersSolid,
} from "@/components/icons/solid";
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
  KeyCard,
  Modal,
  Progress,
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
  Tabs,
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
  COURSES,
  filterMembers,
  journeyDetails,
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
  summaryFor,
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

/**
 * One tab per course, plus All Programs.
 *
 * Built from the catalogue, so a fourth course appears here the moment it
 * is declared — this page must not assume there are three of them, any
 * more than it assumes a course is twenty-one days long.
 *
 * It replaces the program dropdown that used to sit in the table's filter
 * row: which course you are looking at steers the whole page, not just the
 * table, so it belongs at the top rather than buried among the filters.
 */
function CourseTabs({
  program,
  onProgram,
}: {
  program: string;
  onProgram: (program: string) => void;
}) {
  const items = [
    { id: ALL_PROGRAMS, label: ALL_PROGRAMS, short: "All" },
    ...COURSES.map((course) => ({
      id: course.id,
      label: course.id,
      short: course.shortName,
    })),
  ].map((item) => ({
    id: item.id,
    label: (
      /* Both variants are in the DOM and CSS picks one, so both would be
         announced — "Crash Dialysis Crash". The visible pair is hidden
         from assistive tech and the full name given once instead. */
      <>
        <span aria-hidden="true" className="hidden sm:inline">
          {item.label}
        </span>
        <span aria-hidden="true" className="sm:hidden">
          {item.short}
        </span>
        <span className="sr-only">{item.label}</span>
      </>
    ),
  }));

  return (
    <Tabs
      items={items}
      value={program}
      onChange={onProgram}
      label="Course"
      /* Scrolls rather than wraps: with enough courses the strip has to
         stay one row, or the page header grows a second line per course. */
      className="overflow-x-auto"
    />
  );
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

/**
 * The summary row.
 *
 * These were filter buttons: pressing one narrowed the table. The client
 * asked for key cards not to filter (2026-09-26), and the Status select in
 * the table's own toolbar still does it, so nothing became unreachable.
 */
function SummaryCards({
  list,
  program,
}: {
  list: MemberProgress[];
  program: string;
}) {
  /* Follows the course tabs like everything else on the page: the client's
     own figures across all programs, the roster's own count within one. */
  const summary = summaryFor(list, program);

  return (
    <section
      aria-label="Curriculum summary"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      <KeyCard
        tone="brand"
        icon={<UsersSolid />}
        value={summary.activeLearners}
        label="Active Learners"
        note={`${summary.enrolled} enrolled`}
      />
      <KeyCard
        tone="accent"
        icon={<TargetSolid />}
        value={`${summary.averageCompletion}%`}
        label="Average Curriculum Completion"
      />
      <KeyCard
        tone="success"
        icon={<CheckCircleSolid />}
        value={summary.completed}
        label="Members Completed Program"
      />
      <KeyCard
        tone="warning"
        icon={<ClockSolid />}
        value={summary.inProgress}
        label="In Progress"
      />
      <KeyCard
        tone="neutral"
        icon={<NotStartedSolid />}
        value={summary.notStarted}
        label="Not Started"
      />
    </section>
  );
}

function ProgramProgressOverview({ program }: { program: string }) {
  const shown =
    program === ALL_PROGRAMS
      ? programOverview
      : programOverview.filter((overview) => overview.id === program);

  return (
    /* No visible heading: the tab strip directly above already says which
       course these cards are for, and each card carries its own name. The
       region keeps a label so it is still announced and reachable. */
    <Card as="section" padding="small" aria-label="Program progress">
      {/* auto-fit rather than a fixed three columns: a fourth course must
          wrap into the grid, not squeeze the other three, and a single
          selected course fills the row rather than stranding two gaps. */}
      <ul className="grid [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))] gap-4">
        {shown.map((overview) => (
          <li
            key={overview.name}
            className="h-full rounded-control border border-line-subtle bg-surface-sunken p-inset-md"
          >
            <p className="text-heading-5 text-fg">{overview.name}</p>
            <p className="mt-stack-md flex items-baseline justify-between gap-inline-md">
              <span className="text-body-sm text-fg-secondary">Progress</span>
              <span className="text-label-lg text-fg tabular-nums">
                {overview.progress}%
              </span>
            </p>
            <Progress
              value={overview.progress}
              label={`${overview.name} progress`}
              size="medium"
              className="mt-stack-xs"
            />
            {/* One row, separated rather than stacked: three short counts
                read as a single line about the course, and stacking them
                made every card three lines taller than it needed to be. */}
            <ul className="mt-stack-md flex flex-wrap items-center gap-x-inline-md gap-y-stack-xs">
              {overview.stats.map((stat, index) => (
                <li
                  key={stat}
                  className="flex items-center gap-x-inline-md text-body-sm text-fg-secondary tabular-nums"
                >
                  {index > 0 ? (
                    <span
                      aria-hidden="true"
                      className="h-3 w-px shrink-0 bg-line"
                    />
                  ) : null}
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
      <PanelHeading title="Member Curriculum Progress" />

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
      {/* One measure across every course, so one hue — the label carries
          which course, colour would only repeat it. */}
      <ul className="space-y-stack-sm">
        {programOverview.map((overview) => {
          const target = overview.id;
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
      <CourseTabs
        program={filters.program}
        onProgram={(program) => updateFilters({ program })}
      />

      <SummaryCards list={list} program={filters.program} />

      <ProgramProgressOverview program={filters.program} />

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
  /* Read here as well as in the view below so the refresh control can sit
     on the title row. Both calls share one query key, so react-query serves
     them from the same fetch. */
  const clinic = useClinicData();

  return (
    <div className="space-y-4">
      <PageTitle
        href="/dashboard/clinic/curriculum-progress"
        action={
          <UpdatedBar
            updatedAt={clinic.updatedAt}
            isFetching={clinic.isFetching}
            refetch={clinic.refetch}
          />
        }
      />
      {/* useSearchParams needs a Suspense boundary on a prerendered page. */}
      <Suspense fallback={<PageSkeleton />}>
        <CurriculumView />
      </Suspense>
    </div>
  );
}
