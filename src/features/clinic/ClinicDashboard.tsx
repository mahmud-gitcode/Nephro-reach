"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarPlus,
  ChevronRight,
  Eye,
  Inbox,
  MessageSquareText,
  PartyPopper,
  Plus,
  Search,
  UserPlus,
  Users,
} from "lucide-react";

import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  buttonStyles,
  Card,
  EmptyState,
  ErrorState,
  Input,
  KeyCard,
  Progress,
  ProgressRing,
  Select,
  Skeleton,
  SkeletonText,
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TablePagination,
  TableRow,
  TableSkeleton,
} from "@/components/ui";
import { useIsMounted } from "@/lib/utils/useIsMounted";
import { cn } from "@/lib/utils/cn";
import { tableIconButton } from "./tableButton";
import { statusIconSolid, statusKeyTone } from "./StatusIconsSolid";
import { UsersSolid } from "@/components/icons/solid";
import { EnrollPatientModal } from "./EnrollPatientModal";
import { PageTitle } from "@/components/layout/PageTitle";
import { UpdatedBar } from "./UpdatedBar";
import {
  activityIcon,
  shortProgram,
  statusIcon,
  statusTile,
} from "./clinicIcons";
import {
  enrollment,
  liveClassLink,
  memberLink,
  performance,
  programProgress,
  statusCards,
  statusTone,
  toolUsage,
  upcomingFrom,
} from "./clinicDashboard.data";
import { formatClassDate } from "./liveClass.data";
import {
  ALL_STATUSES,
  filterRoster,
  needsAttention,
  statusOptions,
  type RosterMember,
} from "./members.data";
import { paginate } from "./enrollment.data";
import { useClinicData, type ClinicData } from "./useClinicData";

const MESSAGES = "/dashboard/clinic/messages";
const MEMBERS_PER_PAGE = 8;

const outlineLink = buttonStyles({
  variant: "neutral",
  appearance: "fill-stroke",
  size: "small",
});

const iconLink = cn(
  buttonStyles({
    variant: "neutral",
    appearance: "fill-stroke",
    size: "small",
    iconOnly: true,
  }),
  tableIconButton,
);

const textLink =
  "rounded-control-small hover:text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type Dashboard = ReturnType<typeof useClinicData>;

function PanelHeading({
  title,
  description,
  action,
}: {
  title: React.ReactNode;
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

/* ---------------------------------------------------- summary cards

   Laid out to the client's reference (2026-09-26): a filled colour panel
   running the full height of the card's left edge, the figure and its label
   stacked beside it. Horizontal rather than the stacked label-above-number
   these used to be, which is what lets the card be a third shorter while
   carrying a much larger icon.

   The figure comes first and the label second. The number is what somebody
   scans the row for; the label only explains it once found.

   They are not links. They were, and the client asked for them not to be —
   the row reads as a summary, and six clickable tiles above a table that
   has its own filters was two ways to do one thing. */

/* Counts the live roster, so a patient enrolled a minute ago is in it. */
function EnrollmentCard({ enrolled }: { enrolled: number }) {
  const contracted = enrollment.contracted;
  const remaining = Math.max(0, contracted - enrolled);
  const pct = Math.round((enrolled / contracted) * 100);

  return (
    <KeyCard
      tone="brand"
      icon={<UsersSolid />}
      value={
        <>
          {enrolled}
          <span className="text-heading-4 text-fg-muted"> / {contracted}</span>
        </>
      }
      label="Members Enrolled"
      note={`${pct}% taken · ${remaining} left`}
    />
  );
}

function StatusCard({ card }: { card: (typeof statusCards)[number] }) {
  const Icon = statusIconSolid[card.status];

  return (
    <KeyCard
      tone={statusKeyTone[card.status]}
      icon={<Icon />}
      value={card.count}
      label={card.status}
      note={card.share ? `${card.share} of members` : undefined}
    />
  );
}

/* ------------------------------------------------ what needs doing now */

function NeedsAttention({ dashboard }: { dashboard: Dashboard }) {
  const items = dashboard.data
    ? needsAttention(dashboard.data.roster, dashboard.data.activity)
    : [];

  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading
        title={
          <span className="flex items-center gap-inline-md">
            Needs Attention Today
            {items.length > 0 ? (
              <Badge tone="danger">
                {items.length}
                <span className="sr-only"> members</span>
              </Badge>
            ) : null}
          </span>
        }
      />
      <AsyncSection
        pending={dashboard.isPending}
        error={dashboard.error}
        onRetry={dashboard.refetch}
        isEmpty={items.length === 0}
        skeleton={<SkeletonText lines={5} />}
        empty={
          <EmptyState
            variant="bare"
            icon={<PartyPopper />}
            title="Nobody needs attention today"
            description="Every member is on track, checked in and started."
          />
        }
      >
        <ul className="divide-y divide-line-subtle">
          {items.map(({ member, reasons }) => {
            const Icon = statusIcon[member.status];
            return (
              <li
                key={member.mrn}
                className="flex flex-col gap-inline-md py-inset-xs first:pt-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-start gap-inline-lg">
                  <span
                    aria-hidden="true"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-pill ${statusTile[member.status]}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={memberLink({ mrn: member.mrn })}
                      className={cn("text-label-lg text-fg", textLink)}
                    >
                      {member.name}
                    </Link>
                    <p className="text-body-sm text-fg-secondary">
                      {reasons[0]}
                    </p>
                    {reasons.slice(1).map((reason) => (
                      <p key={reason} className="text-caption text-fg-muted">
                        {reason}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 gap-inline-md pl-12 sm:pl-0">
                  <Link href={MESSAGES} className={outlineLink}>
                    <MessageSquareText className="h-4 w-4" />
                    Message
                  </Link>
                  <Link
                    href={memberLink({ mrn: member.mrn })}
                    className={iconLink}
                    aria-label={`View ${member.name}`}
                  >
                    <Eye aria-hidden="true" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </AsyncSection>
    </Card>
  );
}

const QUICK_ACTIONS = [
  {
    label: "Enroll Patient",
    hint: "Add a patient to a program",
    href: "/dashboard/clinic/enroll-patients",
    icon: UserPlus,
    /* Opens the enroll form here instead of leaving the dashboard. */
    opensEnroll: true,
  },
  {
    label: "Send Message",
    hint: "Reach a member or your team",
    href: MESSAGES,
    icon: MessageSquareText,
  },
  {
    label: "Schedule Class",
    hint: "Plan the next live class",
    href: "/dashboard/clinic/live-class",
    icon: CalendarPlus,
  },
  {
    label: "View Reports",
    hint: "Engagement and outcomes",
    href: "/dashboard/clinic/reports",
    icon: BarChart3,
  },
];

const quickActionClass =
  "flex w-full cursor-pointer items-center gap-inline-lg rounded-control border border-line-subtle bg-surface p-inset-sm text-left transition-colors duration-150 ease-standard hover:border-line-strong hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function QuickActions({ onEnroll }: { onEnroll: () => void }) {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Quick Actions" />
      <ul className="grid gap-inline-md sm:grid-cols-2 xl:grid-cols-1">
        {QUICK_ACTIONS.map((action) => (
          <li key={action.label}>
            <QuickActionTarget
              href={action.href}
              onClick={"opensEnroll" in action ? onEnroll : undefined}
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface-brand-subtle text-brand-600"
              >
                <action.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-label-lg text-fg">
                  {action.label}
                </span>
                <span className="block text-caption text-fg-muted">
                  {action.hint}
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-fg-muted"
              />
            </QuickActionTarget>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** A quick action is a link to another page, or — for one that is a form
    — a button that opens it in place. */
function QuickActionTarget({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return onClick ? (
    <button type="button" onClick={onClick} className={quickActionClass}>
      {children}
    </button>
  ) : (
    <Link href={href} className={quickActionClass}>
      {children}
    </Link>
  );
}

function RecentActivity({ dashboard }: { dashboard: Dashboard }) {
  const events = dashboard.data?.activity ?? [];

  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading
        title="Recent Activity"
        action={
          <Link href={memberLink({})} className={outlineLink}>
            View All
          </Link>
        }
      />
      <AsyncSection
        pending={dashboard.isPending}
        error={dashboard.error}
        onRetry={dashboard.refetch}
        isEmpty={events.length === 0}
        skeleton={<SkeletonText lines={5} />}
        empty={
          <EmptyState
            variant="bare"
            icon={<Inbox />}
            title="No activity yet"
            description="Module completions and check-ins will show here."
          />
        }
      >
        <ul className="divide-y divide-line-subtle">
          {events.slice(0, 5).map((event) => {
            const { icon: Icon, tile } = activityIcon[event.kind];
            return (
              <li
                key={`${event.name}-${event.text}`}
                className="flex items-center gap-inline-lg py-inset-xs first:pt-0 last:pb-0"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-pill ${tile}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className="min-w-0 flex-1 text-body-sm text-fg">
                  <span className="text-label-md">{event.name}</span>{" "}
                  {event.text}
                </p>
                <span className="shrink-0 text-caption text-fg-muted">
                  {event.when}
                </span>
              </li>
            );
          })}
        </ul>
      </AsyncSection>
    </Card>
  );
}

/* ----------------------------------------------------- existing panels */

function PerformanceOverview() {
  return (
    <Card as="section" padding="small" className="h-full">
      <h2 className="mb-6 text-heading-4 text-fg">Performance Overview</h2>
      <div className="grid gap-inset-lg sm:grid-cols-3">
        {performance.map((metric) => (
          <div key={metric.label} className="flex flex-col items-center">
            <ProgressRing value={metric.value} label={metric.label} />
            <p className="mt-stack-md text-center text-body-sm text-fg-secondary">
              {metric.label}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function UpcomingClasses({ dashboard }: { dashboard: Dashboard }) {
  /* "Upcoming" depends on today, and this page is prerendered at build
     time — reading the clock then would bake in the build date. So the
     list waits for the browser, and shows its skeleton until then. */
  const mounted = useIsMounted();
  const items =
    mounted && dashboard.data
      ? upcomingFrom(dashboard.data.classes, new Date())
      : [];

  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading
        title="Upcoming Classes"
        action={
          <Link href="/dashboard/clinic/live-class" className={outlineLink}>
            View All
          </Link>
        }
      />
      <AsyncSection
        pending={dashboard.isPending || !mounted}
        error={dashboard.error}
        onRetry={dashboard.refetch}
        isEmpty={items.length === 0}
        skeleton={<Skeleton height={176} className="rounded-control" />}
        empty={
          <EmptyState
            variant="bare"
            icon={<CalendarPlus />}
            title="No upcoming classes"
            description="Nothing is scheduled yet."
            action={
              <Link href="/dashboard/clinic/live-class" className={outlineLink}>
                Go to Live Class
              </Link>
            }
          />
        }
      >
        <div className="overflow-hidden rounded-control border border-line">
          <Table minWidth={360}>
            <TableHead className="bg-surface-sunken">
              <TableRow>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Class</TableHeaderCell>
                <TableHeaderCell className="text-right">Time</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.date}>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {formatClassDate(item.date).replace(/, \d{4}$/, "")}
                  </TableCell>
                  <TableCell emphasis>
                    <Link
                      href={liveClassLink(item.date)}
                      className={cn(
                        "inline-flex items-center gap-inline-xs",
                        textLink,
                      )}
                    >
                      {item.topic}
                      <ChevronRight
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                      />
                    </Link>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {item.time} EST
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AsyncSection>
    </Card>
  );
}

/* ------------------------------------------------------------ members */

function MemberRow({ member }: { member: RosterMember }) {
  const Icon = statusIcon[member.status];
  return (
    <TableRow>
      <TableCell emphasis className="whitespace-nowrap">
        <Link href={memberLink({ mrn: member.mrn })} className={textLink}>
          {member.name}
        </Link>
        <span className="block text-caption font-normal text-fg-muted tabular-nums">
          MRN {member.mrn}
        </span>
      </TableCell>
      <TableCell>{shortProgram(member.program)}</TableCell>
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
      <TableCell>
        <Badge
          tone={statusTone[member.status]}
          icon={<Icon aria-hidden="true" />}
        >
          {member.status}
        </Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap">{member.lastActivity}</TableCell>
      <TableCell>
        {/* Two verbs, so two labelled icon links rather than a menu that
            hides them behind a third click. */}
        <span className="flex justify-end gap-inline-xs">
          <Link
            href={memberLink({ mrn: member.mrn })}
            className={iconLink}
            aria-label={`View ${member.name}`}
            title="View member"
          >
            <Eye aria-hidden="true" />
          </Link>
          <Link
            href={MESSAGES}
            className={iconLink}
            aria-label={`Message ${member.name}`}
            title="Send message"
          >
            <MessageSquareText aria-hidden="true" />
          </Link>
        </span>
      </TableCell>
    </TableRow>
  );
}

function MembersPanel({
  dashboard,
  onEnroll,
}: {
  dashboard: Dashboard;
  onEnroll: () => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(ALL_STATUSES);
  const [page, setPage] = useState(1);

  const roster: ClinicData["roster"] = useMemo(
    () => dashboard.data?.roster ?? [],
    [dashboard.data],
  );
  const filtered = useMemo(
    () => filterRoster(roster, { query, status }),
    [roster, query, status],
  );
  const view = paginate(filtered, page, MEMBERS_PER_PAGE);

  /* A filter change returns to page 1, adjusted during render rather than
     in an effect — the same pattern as the Member page. */
  const filterKey = `${query}|${status}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  return (
    <Card as="section" padding="small">
      <div className="mb-stack-lg flex flex-col gap-inset-sm lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-heading-4 text-fg">Members</h2>
        <div className="flex flex-col gap-inline-md sm:flex-row sm:items-center">
          <Input
            type="search"
            inputSize="small"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or MRN..."
            aria-label="Search members"
            leadingIcon={<Search aria-hidden="true" />}
            className="sm:w-56"
          />
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
          <Button size="small" onClick={onEnroll}>
            <Plus className="h-4 w-4" />
            Enroll Member
          </Button>
        </div>
      </div>

      {dashboard.error ? (
        <ErrorState error={dashboard.error} onRetry={dashboard.refetch} />
      ) : (
        <>
          <div className="overflow-hidden rounded-control border border-line">
            <Table minWidth={720}>
              <TableHead className="bg-surface-sunken">
                <TableRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Program</TableHeaderCell>
                  <TableHeaderCell>Progress</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Last Activity</TableHeaderCell>
                  <TableHeaderCell className="text-right">
                    Actions
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              {dashboard.isPending ? (
                <TableSkeleton rows={MEMBERS_PER_PAGE} columns={6} />
              ) : (
                <TableBody>
                  {roster.length === 0 ? (
                    <TableEmptyRow colSpan={6}>
                      <EmptyState
                        variant="bare"
                        icon={<Users />}
                        title="No patients enrolled yet"
                        description="Enrolled patients will appear here."
                        action={
                          <Link
                            href="/dashboard/clinic/enroll-patients"
                            className={buttonStyles({ size: "small" })}
                          >
                            Enroll a patient
                          </Link>
                        }
                      />
                    </TableEmptyRow>
                  ) : view.rows.length === 0 ? (
                    <TableEmptyRow colSpan={6}>
                      No members match these filters.
                    </TableEmptyRow>
                  ) : (
                    view.rows.map((member) => (
                      <MemberRow key={member.mrn} member={member} />
                    ))
                  )}
                </TableBody>
              )}
            </Table>
          </div>

          <div className="mt-stack-md flex flex-col gap-inline-md sm:flex-row sm:items-center sm:justify-between">
            <Link href={memberLink({})} className={outlineLink}>
              View all members
            </Link>
            {dashboard.isPending ? null : (
              <TablePagination
                page={view.page}
                pageCount={view.pageCount}
                onPageChange={setPage}
                summary={`Showing ${view.firstShown}–${view.lastShown} of ${view.total} members`}
              />
            )}
          </div>
        </>
      )}
    </Card>
  );
}

function ProgramProgressPanel() {
  const max = Math.max(...programProgress.map((band) => band.value), 1);
  return (
    <Card as="section" padding="small" className="h-full">
      <h2 className="mb-6 text-heading-4 text-fg">
        Program Progress (All Members)
      </h2>
      {/* Ordered day bands: a distribution across one measure, so one hue.
          Horizontal, so each band keeps its full label in a third-width
          column — as columns they read "Not…" and "Day…". */}
      <ul className="space-y-stack-md">
        {programProgress.map((band) => (
          <li key={band.label}>
            <div className="flex items-baseline justify-between gap-inline-md">
              <span className="text-body-sm text-fg-secondary">
                {band.label}
              </span>
              <span className="text-label-md text-fg tabular-nums">
                {band.value} members
              </span>
            </div>
            <Progress
              value={band.value}
              max={max}
              label={`${band.label}: ${band.value} members`}
              size="small"
              className="mt-stack-xs"
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ToolUsagePanel() {
  return (
    <Card as="section" padding="small" className="h-full">
      <h2 className="mb-6 text-heading-4 text-fg">
        Tool Usage (Member Engagement)
      </h2>
      {/* One measure across six tools, so one hue — the row label carries
          identity. Label above the bar, so long names never squeeze it. */}
      <ul className="space-y-stack-md">
        {toolUsage.map((tool) => (
          <li key={tool.label}>
            <div className="flex items-baseline justify-between gap-inline-md">
              <span className="text-body-sm text-fg-secondary">
                {tool.label}
              </span>
              <span className="text-label-md text-fg tabular-nums">
                {tool.value}%
              </span>
            </div>
            <Progress
              value={tool.value}
              label={`${tool.label} usage`}
              size="small"
              className="mt-stack-xs"
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function ClinicDashboard() {
  const dashboard = useClinicData();
  const [enrolling, setEnrolling] = useState(false);
  const [justEnrolled, setJustEnrolled] = useState<{
    name: string;
    mrn: string;
  } | null>(null);

  return (
    <div className="space-y-4">
      {/* The only clinic page that had no title of its own. */}
      <PageTitle
        href="/dashboard/clinic"
        action={
          <UpdatedBar
            updatedAt={dashboard.updatedAt}
            isFetching={dashboard.isFetching}
            refetch={dashboard.refetch}
          />
        }
      />

      {justEnrolled ? (
        <Alert
          tone="success"
          title={`${justEnrolled.name} is enrolled.`}
          onDismiss={() => setJustEnrolled(null)}
          action={
            <Link
              href={memberLink({ mrn: justEnrolled.mrn })}
              className={outlineLink}
            >
              View on the Member page
            </Link>
          }
        >
          They start as Not Started and count toward your contract seats.
        </Alert>
      ) : null}

      {enrolling ? (
        <EnrollPatientModal
          list={dashboard.data?.patients ?? []}
          onClose={() => setEnrolling(false)}
          onEnrolled={(name, mrn) => {
            setEnrolling(false);
            setJustEnrolled({ name, mrn });
          }}
        />
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <EnrollmentCard
          enrolled={dashboard.data?.roster.length ?? enrollment.enrolled}
        />
        {statusCards.map((card) => (
          <StatusCard key={card.status} card={card} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <NeedsAttention dashboard={dashboard} />
        </div>
        <QuickActions onEnroll={() => setEnrolling(true)} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <PerformanceOverview />
        <UpcomingClasses dashboard={dashboard} />
      </section>

      <MembersPanel dashboard={dashboard} onEnroll={() => setEnrolling(true)} />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ProgramProgressPanel />
        <ToolUsagePanel />
        <RecentActivity dashboard={dashboard} />
      </section>
    </div>
  );
}
