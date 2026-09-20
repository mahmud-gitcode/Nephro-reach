"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BellRing,
  CalendarPlus,
  CheckCircle2,
  Download,
  Eye,
  MessageSquare,
  PhoneCall,
  Quote,
  UserRoundSearch,
  XCircle,
} from "lucide-react";

import { PageTitle } from "@/components/layout/PageTitle";
import {
  Badge,
  Button,
  Card,
  LineChart,
  Modal,
  Progress,
  Select,
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";
import { tableIconButton } from "./tableButton";
import {
  ALL_PROGRAMS,
  byProgram,
  categories,
  checkInTone,
  completionPct,
  completionTrend,
  CURRENT_WEEK,
  followUps,
  memberFeedback,
  overview,
  programs,
  recentCheckIns,
  truncateWords,
  type CheckInRow,
  type CheckInStatus,
} from "./checkIns.data";

/* A member name is one line in a narrow column, and a note is a preview of
   a sentence. Both are clipped by words rather than characters so a name
   never breaks mid-word. */
const NAME_WORDS = 3;
const NOTE_WORDS = 3;

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

/* Status reads by icon and word as well as colour, so it survives a
   colour-blind reader, a greyscale print and a forced-colours theme. */
const statusIcon: Record<CheckInStatus, IconType> = {
  Completed: CheckCircle2,
  Missed: XCircle,
  "At Risk": AlertTriangle,
};

function OverviewCard({ card }: { card: (typeof overview)[number] }) {
  const Arrow = card.delta?.direction === "up" ? ArrowUpRight : ArrowDownRight;

  return (
    <Card as="article" padding="small" className="min-h-[154px]">
      <p className="text-heading-5 text-fg-secondary">{card.label}</p>
      <p className="mt-stack-sm text-metric-lg text-fg">{card.value}</p>
      {card.delta ? (
        <p
          className={`mt-stack-sm flex items-center gap-inline-xs text-body-sm ${
            card.delta.good ? "text-success" : "text-danger"
          }`}
        >
          <Arrow aria-hidden="true" className="h-4 w-4 shrink-0" />
          {card.delta.change} from last week
        </p>
      ) : null}
      {card.note ? (
        <p className="mt-stack-sm text-body-sm text-fg-muted">{card.note}</p>
      ) : null}
    </Card>
  );
}

function WeeklySummary({
  program,
  onProgramChange,
}: {
  program: string;
  onProgramChange: (next: string) => void;
}) {
  return (
    <Card as="section" padding="small">
      <div className="mb-stack-lg flex flex-col gap-inset-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-heading-4 text-fg">Weekly Check-In Summary</h2>
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            Track member engagement and identify members who need follow-up.
          </p>
        </div>
        {/* Filters sit in one row above what they filter, so it is obvious
            which numbers they change. */}
        <div className="flex flex-col gap-inline-md sm:flex-row">
          <Select
            selectSize="small"
            aria-label="Week"
            {...notBuiltYet("Choosing a different week")}
          >
            <option>This Week ({CURRENT_WEEK})</option>
          </Select>
          <Select
            selectSize="small"
            aria-label="Program"
            value={program}
            onChange={(event) => onProgramChange(event.target.value)}
          >
            {programs.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-inset-md sm:grid-cols-2">
        {categories.map((category) => {
          const pct = completionPct(category.completed, category.expected);
          return (
            <div
              key={category.label}
              className="rounded-control border border-line p-inset-sm"
            >
              <div className="flex items-baseline justify-between gap-inline-md">
                <p className="text-body-sm text-fg-secondary">
                  {category.label}
                </p>
                <p className="text-label-md text-fg tabular-nums">{pct}%</p>
              </div>
              <Progress
                value={pct}
                label={`${category.label} completion`}
                size="small"
                className="mt-stack-sm"
              />
              <p className="mt-stack-sm text-caption text-fg-muted tabular-nums">
                {category.completed} / {category.expected}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function QuickActions() {
  /* Two columns in a ~340px card leaves each button about 150px, and a
     Button is `whitespace-nowrap` — it cannot wrap its way out of a label
     that does not fit. So the visible label is the short form and the full
     phrase stays as the accessible name. */
  const actions: Array<{
    label: string;
    fullLabel: string;
    icon: IconType;
    feature: string;
  }> = [
    {
      label: "Send Reminder",
      fullLabel: "Send Reminder",
      icon: BellRing,
      feature: "Sending a reminder",
    },
    {
      label: "Follow-Ups",
      fullLabel: "View Members Needing Follow-Up",
      icon: UserRoundSearch,
      feature: "The follow-up list",
    },
    {
      label: "Export Report",
      fullLabel: "Export Check-In Report",
      icon: Download,
      feature: "Exporting the check-in report",
    },
    {
      label: "Schedule Tasks",
      fullLabel: "Schedule Follow-Up Tasks",
      icon: CalendarPlus,
      feature: "Scheduling follow-up tasks",
    },
  ];

  return (
    <Card as="section" padding="small">
      <h2 className="mb-stack-lg text-heading-4 text-fg">Quick Actions</h2>
      <div className="grid grid-cols-1 gap-inline-md sm:grid-cols-2">
        {actions.map((action) => (
          <Button
            key={action.fullLabel}
            {...notBuiltYet(action.feature)}
            variant="neutral"
            appearance="fill-stroke"
            fullWidth
            aria-label={action.fullLabel}
          >
            <action.icon className="h-4 w-4 shrink-0" />
            {action.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}

function RecentCheckIns({ program }: { program: string }) {
  const rows = useMemo(() => byProgram(recentCheckIns, program), [program]);
  /* The row whose full note is open, or null. Holding the row rather than
     an index keeps the dialog correct when the program filter changes the
     list underneath it. */
  const [openNote, setOpenNote] = useState<CheckInRow | null>(null);

  return (
    <Card as="section" padding="small">
      <h2 className="text-heading-4 text-fg">Recent Check-Ins</h2>
      <p className="mt-stack-xs mb-stack-lg text-body-sm text-fg-muted">
        The latest member check-in submissions.
      </p>

      <div className="overflow-hidden rounded-control border border-line">
        <Table minWidth={860}>
          <TableHead className="bg-surface-sunken">
            <TableRow>
              <TableHeaderCell>Member</TableHeaderCell>
              <TableHeaderCell>Program</TableHeaderCell>
              <TableHeaderCell>Check-In Date</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Key Notes</TableHeaderCell>
              <TableHeaderCell className="text-right">Action</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableEmptyRow colSpan={6}>
                No check-ins for this program yet.
              </TableEmptyRow>
            ) : (
              rows.map((row) => {
                const Icon = statusIcon[row.status];
                /* One action per row, chosen by what the row needs — a
                   completed check-in is read, a missed one is chased. */
                const action =
                  row.status === "Completed"
                    ? {
                        label: "View",
                        icon: Eye,
                        feature: "Viewing a check-in",
                      }
                    : row.status === "Missed"
                      ? {
                          label: "Remind",
                          icon: BellRing,
                          feature: "Sending a reminder",
                        }
                      : {
                          label: "Follow Up",
                          icon: PhoneCall,
                          feature: "Starting a follow-up",
                        };
                const name = truncateWords(row.name, NAME_WORDS);
                const note = truncateWords(row.notes, NOTE_WORDS);

                return (
                  <TableRow key={`${row.name}-${row.date}`}>
                    <TableCell
                      emphasis
                      className="whitespace-nowrap"
                      /* The clipped name still reads in full on hover and
                         to a screen reader. */
                      title={name.truncated ? row.name : undefined}
                    >
                      {name.text}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.program}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.date}
                    </TableCell>
                    <TableCell>
                      <Badge
                        tone={checkInTone[row.status]}
                        icon={<Icon aria-hidden="true" />}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-baseline gap-inline-xs whitespace-nowrap">
                        {note.text}
                        {note.truncated ? (
                          <button
                            type="button"
                            onClick={() => setOpenNote(row)}
                            className="cursor-pointer rounded-control-small text-label-sm text-primary-edge underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          >
                            See more
                            <span className="sr-only"> of {row.name}</span>
                          </button>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        {...notBuiltYet(action.feature)}
                        variant="neutral"
                        appearance="fill-stroke"
                        size="small"
                        iconOnly
                        className={tableIconButton}
                        aria-label={`${action.label} — ${row.name}`}
                      >
                        <action.icon aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Just the note, under the member's name. Nothing else belongs here
          — it exists because three words is not the whole sentence. */}
      <Modal
        open={openNote !== null}
        onClose={() => setOpenNote(null)}
        title={openNote?.name ?? ""}
        description={
          openNote ? `${openNote.status} · ${openNote.date}` : undefined
        }
        size="small"
      >
        <p className="text-body-md text-fg-secondary">{openNote?.notes}</p>
      </Modal>
    </Card>
  );
}

function CompletionTrend() {
  return (
    <Card as="section" padding="small">
      <h2 className="text-heading-4 text-fg">Check-In Completion Trend</h2>
      <p className="mt-stack-xs mb-stack-lg text-body-sm text-fg-muted">
        Weekly completion rate over the last 8 weeks.
      </p>
      {/* One series, so no legend — the heading already names it. The scale
          starts at 50 rather than 0 because the whole story lives between
          60 and 85; it is labelled, so the floor is not a trick. */}
      <LineChart
        series={[
          {
            id: "completion",
            label: "Completion rate",
            tone: "brand",
            points: completionTrend.points,
          },
        ]}
        xLabels={completionTrend.labels}
        yMin={50}
        yMax={100}
        yTicks={6}
        unit="%"
        label="Check-in completion rate by week"
        showLegend={false}
        height={220}
      />
    </Card>
  );
}

function FollowUpPanel({ program }: { program: string }) {
  const rows = useMemo(() => byProgram(followUps, program), [program]);

  return (
    <Card as="section" padding="small">
      <h2 className="text-heading-4 text-fg">Members Needing Follow-Up</h2>
      <p className="mt-stack-xs mb-stack-lg text-body-sm text-fg-muted">
        Members who missed a check-in or reported concerning symptoms.
      </p>

      <div className="overflow-hidden rounded-control border border-line">
        <Table minWidth={620}>
          <TableHead className="bg-surface-sunken">
            <TableRow>
              <TableHeaderCell>Member</TableHeaderCell>
              <TableHeaderCell>Issue</TableHeaderCell>
              <TableHeaderCell>Last Check-In</TableHeaderCell>
              <TableHeaderCell className="text-right">Action</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableEmptyRow colSpan={4}>
                Nobody in this program needs following up.
              </TableEmptyRow>
            ) : (
              rows.map((row) => {
                /* A missed check-in is chased with a reminder; a symptom is
                   a clinical matter and gets a person, not a nudge. */
                const action =
                  row.issue === "Missed check-in"
                    ? {
                        label: "Send Reminder",
                        icon: BellRing,
                        feature: "Sending a reminder",
                      }
                    : {
                        label: "Follow Up",
                        icon: PhoneCall,
                        feature: "Starting a follow-up",
                      };

                const name = truncateWords(row.name, NAME_WORDS);

                return (
                  <TableRow key={`${row.name}-${row.issue}`}>
                    <TableCell
                      emphasis
                      className="whitespace-nowrap"
                      title={name.truncated ? row.name : undefined}
                    >
                      {name.text}
                    </TableCell>
                    <TableCell>{row.issue}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.lastCheckIn}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="flex justify-end gap-inline-md">
                        <Button
                          {...notBuiltYet("Messaging a member")}
                          variant="neutral"
                          appearance="fill-stroke"
                          size="small"
                          iconOnly
                          className={tableIconButton}
                          aria-label={`Send a message to ${row.name}`}
                        >
                          <MessageSquare aria-hidden="true" />
                        </Button>
                        <Button
                          {...notBuiltYet(action.feature)}
                          size="small"
                          iconOnly
                          className={tableIconButton}
                          aria-label={`${action.label} — ${row.name}`}
                        >
                          <action.icon aria-hidden="true" />
                        </Button>
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function MemberFeedback() {
  return (
    <Card as="section" padding="small">
      <h2 className="mb-stack-lg text-heading-4 text-fg">Member Feedback</h2>
      <figure className="rounded-control bg-surface-sunken p-inset-md">
        <Quote
          aria-hidden="true"
          className="mb-stack-sm h-6 w-6 text-fg-subtle"
        />
        <blockquote className="text-body-md text-fg-secondary">
          {memberFeedback.quote}
        </blockquote>
        <figcaption className="mt-stack-md text-caption text-fg-muted">
          — {memberFeedback.attribution}
        </figcaption>
      </figure>
    </Card>
  );
}

export default function ClinicCheckIns() {
  /* One program filter for the page: the summary, both tables and the
     empty states all answer to it, so the screen never shows one program's
     numbers above another program's rows. */
  const [program, setProgram] = useState(ALL_PROGRAMS);

  return (
    <div className="space-y-4">
      <PageTitle href="/dashboard/clinic/checkins" />

      {/* The key figures run full width across the top, above the split. */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {overview.map((card) => (
          <OverviewCard key={card.label} card={card} />
        ))}
      </section>

      {/* Left is the record — what members submitted and said. Right is
          what the clinic does about it: the actions, the trend it moves,
          and the people waiting on a call. Below xl the two columns fall
          into one and the left column's panels come first. */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
        <div className="space-y-4">
          <WeeklySummary program={program} onProgramChange={setProgram} />
          <RecentCheckIns program={program} />
          <MemberFeedback />
        </div>

        <div className="space-y-4">
          <QuickActions />
          <CompletionTrend />
          <FollowUpPanel program={program} />
        </div>
      </section>
    </div>
  );
}
