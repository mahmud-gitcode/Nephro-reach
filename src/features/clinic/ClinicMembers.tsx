"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  CalendarCheck,
  Clock3,
  Eye,
  GraduationCap,
  MessageCircleQuestion,
  MessageSquareText,
  Plus,
  Search,
  Users,
  Video,
} from "lucide-react";

import { UserPlusSolid, UsersSolid } from "@/components/icons/solid";
import { statusIconSolid, statusKeyTone, statusText } from "./StatusIconsSolid";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  Alert,
  Badge,
  Button,
  buttonStyles,
  Card,
  KeyCard,
  DonutChart,
  EmptyState,
  ErrorState,
  Input,
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
  toneVar,
  type ProgressTone,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";
import { tableIconButton } from "./tableButton";
import {
  activityIcon,
  initials,
  shortProgram,
  statusIcon,
} from "./clinicIcons";
import { paginate, ROWS_PER_PAGE_OPTIONS } from "./enrollment.data";
import {
  ALL_PROGRAMS,
  ALL_STATUSES,
  allowed,
  countStatus,
  filterRoster,
  MEMBER_STATUSES,
  programBreakdownOf,
  programOptions,
  shareOf,
  statusOptions,
  statusTone,
  type RosterMember,
  type RosterStatus,
} from "./members.data";
import { EnrollPatientModal } from "./EnrollPatientModal";
import { UpdatedBar } from "./UpdatedBar";
import { useClinicData, type ClinicData } from "./useClinicData";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

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

type Filters = { query: string; program: string; status: string };

function PanelHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-stack-lg flex items-start justify-between gap-inline-lg">
      <div className="min-w-0">
        <h2 className="text-heading-4 text-fg">{title}</h2>
        {description ? (
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ---------------------------------------------------------- summary cards

   Each card is a filter for the table below it: press "Need Follow-Up" and
   the list shows those three. Built from spans, not a Card, because a
   button may only hold phrasing content. aria-pressed says which filter is
   on, since the highlight alone would be colour only. */

/**
 * The summary row.
 *
 * These were filter buttons: pressing one narrowed the table. The client
 * asked for key cards not to filter (2026-09-26), and the Status select and
 * the search box directly below still do it, so nothing became unreachable
 * — there were two controls for one job and this was the quieter one.
 */
function SummaryCards({ list }: { list: RosterMember[] }) {
  const cards = MEMBER_STATUSES.filter((s) => s !== "Not Started");

  return (
    <section
      aria-label="Member summary"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      <KeyCard
        tone="brand"
        icon={<UsersSolid />}
        value={
          <>
            {list.length}
            <span className="text-heading-4 text-fg-muted"> / {allowed}</span>
          </>
        }
        label="Total Members"
      />

      {cards.map((card) => {
        const Icon = statusIconSolid[card];
        const count = countStatus(list, card);
        return (
          <KeyCard
            key={card}
            tone={statusKeyTone[card]}
            icon={<Icon />}
            value={count}
            label={card}
            note={`${shareOf(count, list.length)}% of members`}
          />
        );
      })}

      <KeyCard
        tone="neutral"
        icon={<UserPlusSolid />}
        value={Math.max(0, allowed - list.length)}
        label="Available Slots"
      />
    </section>
  );
}

/* --------------------------------------------------------------- table */

function MemberTable({
  list,
  filters,
  onFilters,
  selectedMrn,
  onSelect,
  onAdd,
}: {
  list: RosterMember[];
  filters: Filters;
  onFilters: (next: Partial<Filters>) => void;
  selectedMrn: string | null;
  onSelect: (mrn: string) => void;
  onAdd: () => void;
}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => filterRoster(list, filters), [list, filters]);
  const view = paginate(filtered, page, perPage);

  /* A filter change — from the controls here, a summary card, or the
     charts below — returns to page 1. Adjusted during render rather than
     in an effect, the same pattern as Enroll Patients. */
  const filterKey = `${filters.query}|${filters.program}|${filters.status}|${perPage}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const pageMrns = view.rows.map((member) => member.mrn);
  const allOnPage =
    pageMrns.length > 0 && pageMrns.every((mrn) => checked.has(mrn));

  function toggleAll() {
    setChecked((current) => {
      const next = new Set(current);
      if (allOnPage) pageMrns.forEach((mrn) => next.delete(mrn));
      else pageMrns.forEach((mrn) => next.add(mrn));
      return next;
    });
  }

  function toggleOne(mrn: string) {
    setChecked((current) => {
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
    <Card as="section" padding="small" className="h-full min-w-0">
      <PanelHeading title="Member List" />

      <div className="mb-stack-lg flex flex-col gap-inline-md lg:flex-row lg:items-center">
        <Input
          type="search"
          inputSize="small"
          value={filters.query}
          onChange={(event) => onFilters({ query: event.target.value })}
          placeholder="Search by name or MRN..."
          aria-label="Search members"
          leadingIcon={<Search aria-hidden="true" />}
          className="lg:max-w-60 lg:flex-1"
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
        {/* Adding a member is enrolling a patient: the same form as Enroll
            Patients, opened here so the list stays in view. */}
        <Button
          size="small"
          className="lg:ml-auto"
          onClick={onAdd}
          disabled={list.length >= allowed}
          title={
            list.length >= allowed ? "All contract seats are filled" : undefined
          }
        >
          <Plus className="h-4 w-4" />
          Add Member
        </Button>
      </div>

      {/* Bulk actions appear once something is ticked, so the checkboxes
          lead somewhere. */}
      {checked.size > 0 ? (
        <div
          role="region"
          aria-label="Selected members"
          className="mb-stack-md flex flex-wrap items-center gap-inline-md rounded-control border border-line bg-surface-sunken px-inset-sm py-inset-xs"
        >
          <p className="text-label-md text-fg">{checked.size} selected</p>
          <Link href={MESSAGES} className={outlineLink}>
            <MessageSquareText className="h-4 w-4" />
            Message selected
          </Link>
          <Button
            variant="neutral"
            appearance="stroke"
            size="small"
            onClick={() => setChecked(new Set())}
          >
            Clear
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-control border border-line">
        <Table minWidth={640}>
          <TableHead className="bg-surface-sunken">
            <TableRow>
              <TableHeaderCell className="w-10">
                <input
                  type="checkbox"
                  checked={allOnPage}
                  onChange={toggleAll}
                  aria-label="Select all members on this page"
                  className="h-4 w-4 cursor-pointer accent-brand-600"
                />
              </TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Program</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Progress</TableHeaderCell>
              <TableHeaderCell>Last Activity</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {view.rows.length === 0 ? (
              <TableEmptyRow colSpan={7}>
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
              view.rows.map((member) => {
                const Icon = statusIcon[member.status];
                const isSelected = member.mrn === selectedMrn;
                return (
                  <TableRow
                    key={member.mrn}
                    className={isSelected ? "bg-surface-brand-subtle" : ""}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={checked.has(member.mrn)}
                        onChange={() => toggleOne(member.mrn)}
                        aria-label={`Select ${member.name}`}
                        className="h-4 w-4 cursor-pointer accent-brand-600"
                      />
                    </TableCell>
                    <TableCell emphasis className="whitespace-nowrap">
                      {/* The name opens the details panel; aria-pressed
                          tells a screen reader which member is open. */}
                      <button
                        type="button"
                        onClick={() => onSelect(member.mrn)}
                        aria-pressed={isSelected}
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
                    <TableCell>{shortProgram(member.program)}</TableCell>
                    <TableCell>
                      <Badge
                        tone={statusTone[member.status]}
                        icon={<Icon aria-hidden="true" />}
                      >
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-inline-md">
                        <Progress
                          value={member.progress}
                          label={`${member.name} progress`}
                          size="small"
                          className="w-14"
                        />
                        <span className="tabular-nums">{member.progress}%</span>
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {member.lastActivity}
                    </TableCell>
                    <TableCell>
                      <span className="flex justify-end gap-inline-xs">
                        <button
                          type="button"
                          onClick={() => onSelect(member.mrn)}
                          className={iconControl}
                          aria-label={`View ${member.name}`}
                          title="View details"
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
                );
              })
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

/* ------------------------------------------------------------- details */

/**
 * One fact in the details popup: an icon, what it is, and the value. Laid
 * out as tiles in two columns, so a long value like the current module
 * wraps inside its own tile instead of squeezing the one beside it.
 */
function DetailTile({
  icon: TileIcon,
  label,
  children,
}: {
  icon: IconType;
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
 * The member's details, in a popup over the list. A side panel beside a
 * seven-column table left each of them too narrow to read; a dialog gives
 * the details room without taking any from the table. Modal owns the rest:
 * focus moves in and back out to the name that opened it, Tab stays inside,
 * Esc and the backdrop close it.
 */
function MemberDetailsModal({
  member,
  onClose,
}: {
  member: RosterMember;
  onClose: () => void;
}) {
  const Icon = statusIcon[member.status];
  const [attended, classesOf] = member.liveClasses;
  const [checkedIn, checkInsOf] = member.checkIns;
  const questions =
    member.questions.total === 0
      ? "None"
      : `${member.questions.total} (${
          member.questions.open === 0
            ? "Resolved"
            : `${member.questions.open} open`
        })`;

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={member.name}
      description={`MRN ${member.mrn} · Enrolled ${member.enrolledOn}`}
      footer={
        <>
          <Link href={MESSAGES} className={outlineLink}>
            <MessageSquareText className="h-4 w-4" />
            Send Message
          </Link>
          <Button {...notBuiltYet("The full member profile")} size="small">
            View Full Profile
          </Button>
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
        <Badge
          tone={statusTone[member.status]}
          icon={<Icon aria-hidden="true" />}
        >
          {member.status}
        </Badge>
      </div>

      <div className="mt-stack-lg">
        <div className="flex items-baseline justify-between gap-inline-md">
          <span className="text-body-sm text-fg-secondary">
            Program progress
          </span>
          <span className="text-heading-5 text-fg tabular-nums">
            {member.progress}%
          </span>
        </div>
        <Progress
          value={member.progress}
          label={`${member.name} progress`}
          size="medium"
          className="mt-stack-xs"
        />
      </div>

      <dl className="mt-stack-lg grid gap-inline-md sm:grid-cols-2">
        <DetailTile icon={BookOpen} label="Current Module">
          {member.currentModule}
        </DetailTile>
        <DetailTile icon={Clock3} label="Last Activity">
          {member.lastSeen}
        </DetailTile>
        <DetailTile icon={Video} label="Live Classes Attended">
          {attended} of {classesOf}
        </DetailTile>
        <DetailTile icon={CalendarCheck} label="Weekly Check-Ins">
          {checkedIn} of {checkInsOf}
        </DetailTile>
        <DetailTile icon={MessageCircleQuestion} label="Questions Submitted">
          {questions}
        </DetailTile>
        <DetailTile icon={GraduationCap} label="Program">
          {member.program}
        </DetailTile>
      </dl>
    </Modal>
  );
}

/* -------------------------------------------------------------- charts

   The lower panels filter too: press a program or a status and the table
   narrows to it. They read the whole roster, not the filtered view, so
   pressing one never makes the others vanish. */

function MembersByProgram({
  list,
  program,
  onProgram,
}: {
  list: RosterMember[];
  program: string;
  onProgram: (program: string) => void;
}) {
  const slices = programBreakdownOf(list);

  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Members by Program" />
      <div className="grid items-center gap-inset-md sm:grid-cols-[150px_minmax(0,1fr)]">
        <DonutChart
          segments={slices.filter((slice) => slice.value > 0)}
          label="Members by program"
          size={150}
          thickness={28}
          centerValue={list.length}
          centerLabel="Members"
          className="mx-auto"
        />
        <ul className="space-y-stack-xs">
          {slices.map((slice) => {
            /* "Other" has no program to filter to. */
            const filterable = programOptions.includes(slice.label);
            const on = program === slice.label;
            const content = (
              <>
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-pill"
                  style={{ background: toneVar[slice.tone] }}
                />
                <span className="min-w-0 flex-1 text-body-sm text-fg">
                  {shortProgram(slice.label)}
                </span>
                <span className="text-label-md text-fg tabular-nums">
                  {slice.value}
                </span>
              </>
            );
            return (
              <li key={slice.label}>
                {filterable ? (
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => onProgram(on ? ALL_PROGRAMS : slice.label)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-inline-md rounded-control-small px-inset-xs py-1 text-left hover:bg-surface-sunken",
                      on && "bg-surface-brand-subtle",
                      focusRing,
                    )}
                  >
                    {content}
                  </button>
                ) : (
                  <span className="flex items-center gap-inline-md px-inset-xs py-1">
                    {content}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}

/* Status fills, matching the badges in the table. */
const statusBar: Record<RosterStatus, ProgressTone | undefined> = {
  "On Track": "success",
  "Need Follow-Up": "warning",
  "Attention Needed": "danger",
  "Not Started": undefined,
};

/**
 * How the roster splits by status.
 *
 * Read-only: it was five buttons that filtered the table, and the client
 * asked for that to go — the Status select above the table does the same
 * job. It is also much quieter than it was. Every row used to carry a
 * coloured Badge pill AND a coloured bar, so the same fact was colour-coded
 * twice, five times over, with the pills leaving a ragged left edge. Now it
 * is one glyph, the name, the numbers, and the bar.
 */
function StatusBreakdown({ list }: { list: RosterMember[] }) {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Status Breakdown" />
      <ul className="space-y-stack-md">
        {MEMBER_STATUSES.map((row) => {
          const count = countStatus(list, row);
          const Icon = statusIconSolid[row];

          return (
            <li key={row}>
              <p className="flex items-baseline gap-inline-md">
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "h-4 w-4 shrink-0 translate-y-0.5",
                    statusText[row],
                  )}
                />
                <span className="min-w-0 flex-1 truncate text-label-md text-fg-secondary">
                  {row}
                </span>
                <span className="shrink-0 text-label-md text-fg tabular-nums">
                  {count}
                </span>
                <span className="w-10 shrink-0 text-right text-body-sm text-fg-muted tabular-nums">
                  {shareOf(count, list.length)}%
                </span>
              </p>
              <Progress
                value={count}
                max={Math.max(1, list.length)}
                label={`${row} members`}
                tone={statusBar[row]}
                size="small"
                className="mt-stack-xs"
              />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function RecentMemberActivity({
  list,
  activity,
  onSelect,
}: {
  list: RosterMember[];
  activity: ClinicData["activity"];
  onSelect: (mrn: string) => void;
}) {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading
        title="Recent Member Activity"
        action={
          <Button
            {...notBuiltYet("The full activity log")}
            variant="neutral"
            appearance="fill-stroke"
            size="small"
          >
            View All
          </Button>
        }
      />
      {activity.length === 0 ? (
        <p className="text-body-sm text-fg-muted">No activity yet.</p>
      ) : (
        <ul className="divide-y divide-line-subtle">
          {activity.map((entry) => {
            const { icon: Icon, tile } = activityIcon[entry.kind];
            const member = list.find((m) => m.name === entry.name);
            return (
              <li
                key={`${entry.name}-${entry.text}`}
                className="flex items-center gap-inline-lg py-inset-xs first:pt-0 last:pb-0"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-pill ${tile}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className="min-w-0 flex-1 text-body-sm text-fg">
                  {member ? (
                    <button
                      type="button"
                      onClick={() => onSelect(member.mrn)}
                      className={cn(
                        "cursor-pointer rounded-control-small text-label-md hover:text-fg-brand hover:underline",
                        focusRing,
                      )}
                    >
                      {entry.name}
                    </button>
                  ) : (
                    <span className="text-label-md">{entry.name}</span>
                  )}{" "}
                  {entry.text}
                </p>
                <span className="shrink-0 text-caption text-fg-muted">
                  {entry.when}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* ---------------------------------------------------------------- page */

function PageSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} height={156} className="rounded-card" />
        ))}
      </div>
      <Skeleton height={640} className="rounded-card" />
    </div>
  );
}

/**
 * The filters and the open member live in the URL as well as in state:
 * ?status=Need Follow-Up&mrn=567890. The dashboard links here that way, and
 * it means Back, a refresh or a shared link all land on the same view.
 * Values that are not on the menus or not on the roster are ignored, so a
 * stale link falls back to the default view instead of an empty one.
 */
function MembersView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const clinic = useClinicData();
  const list = useMemo(() => clinic.data?.roster ?? [], [clinic.data]);

  const [initial] = useState(() => {
    const status = params.get("status") ?? "";
    const program = params.get("program") ?? "";
    return {
      status: statusOptions.includes(status) ? status : ALL_STATUSES,
      program: programOptions.includes(program) ? program : ALL_PROGRAMS,
      mrn: params.get("mrn"),
    };
  });

  const [filters, setFilters] = useState<Filters>({
    query: "",
    program: initial.program,
    status: initial.status,
  });

  /* The popup opens only when asked for — a name pressed here, or a link
     from the dashboard carrying ?mrn= — never by itself on page load. */
  const [selectedMrn, setSelectedMrn] = useState<string | null>(initial.mrn);
  const selected = list.find((member) => member.mrn === selectedMrn) ?? null;
  const [enrolling, setEnrolling] = useState(false);
  const [justEnrolled, setJustEnrolled] = useState<{
    name: string;
    mrn: string;
  } | null>(null);

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

    /* A filter that hides the open member drops them, so the URL never
       names someone the list does not show. */
    const stillListed =
      selectedMrn !== null &&
      filterRoster(list, next).some((member) => member.mrn === selectedMrn);
    const mrn = stillListed ? selectedMrn : null;
    if (!stillListed) setSelectedMrn(null);

    /* The search box is not written to the URL: it would rewrite history
       on every keystroke. */
    if ("status" in change || "program" in change) writeUrl(next, mrn);
  }

  function select(mrn: string) {
    setSelectedMrn(mrn);
    writeUrl(filters, mrn);
  }

  function close() {
    setSelectedMrn(null);
    writeUrl(filters, null);
  }

  if (clinic.error) {
    return (
      <ErrorState
        title="Members could not be loaded"
        error={clinic.error}
        onRetry={clinic.refetch}
      />
    );
  }

  if (clinic.isPending) return <PageSkeleton />;

  const enrollModal = enrolling ? (
    <EnrollPatientModal
      list={clinic.data?.patients ?? []}
      onClose={() => setEnrolling(false)}
      onEnrolled={(name, mrn) => {
        setEnrolling(false);
        setJustEnrolled({ name, mrn });
        /* Clear the filters so the new member is in the list, not hidden
           by a status they do not have yet. */
        updateFilters({
          query: "",
          program: ALL_PROGRAMS,
          status: ALL_STATUSES,
        });
      }}
    />
  ) : null;

  if (list.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Users />}
          title="No members yet"
          description="Patients you enroll will appear here, with their progress and status."
          action={
            <Button size="small" onClick={() => setEnrolling(true)}>
              <Plus className="h-4 w-4" />
              Enroll a patient
            </Button>
          }
        />
        {enrollModal}
      </>
    );
  }

  return (
    <>
      {justEnrolled ? (
        <Alert
          tone="success"
          title={`${justEnrolled.name} is now a member.`}
          onDismiss={() => setJustEnrolled(null)}
          action={
            <Button
              variant="neutral"
              appearance="fill-stroke"
              size="small"
              onClick={() => {
                select(justEnrolled.mrn);
                setJustEnrolled(null);
              }}
            >
              View details
            </Button>
          }
        >
          They start as Not Started and count toward your contract seats.
        </Alert>
      ) : null}

      <SummaryCards list={list} />

      <MemberTable
        list={list}
        filters={filters}
        onFilters={updateFilters}
        selectedMrn={selectedMrn}
        onSelect={select}
        onAdd={() => setEnrolling(true)}
      />

      {enrollModal}

      {selected ? (
        <MemberDetailsModal member={selected} onClose={close} />
      ) : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <MembersByProgram
          list={list}
          program={filters.program}
          onProgram={(program) => updateFilters({ program })}
        />
        <StatusBreakdown list={list} />
        <RecentMemberActivity
          list={list}
          activity={clinic.data?.activity ?? []}
          onSelect={select}
        />
      </section>
    </>
  );
}

export default function ClinicMembers() {
  /* Read here as well as in the view below so the refresh control can sit
     on the title row. Both calls share one query key, so react-query serves
     them from the same fetch. */
  const clinic = useClinicData();

  return (
    <div className="space-y-4">
      <PageTitle
        href="/dashboard/clinic/members"
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
        <MembersView />
      </Suspense>
    </div>
  );
}
