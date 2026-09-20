"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  GraduationCap,
  MoreHorizontal,
  Plus,
  Search,
  Users,
} from "lucide-react";

import {
  Badge,
  BarChart,
  Button,
  Card,
  Input,
  Progress,
  ProgressRing,
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
  enrollment,
  filterMembers,
  members,
  performance,
  programProgress,
  statusCards,
  statusTone,
  toolUsage,
  upcomingClasses,
  type MemberStatus,
} from "./clinicDashboard.data";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

/* The status icon rides alongside the colour everywhere status appears, so
   the reading never rests on hue alone. */
const statusIcon: Record<MemberStatus, IconType> = {
  "On Track": CheckCircle2,
  "Need Follow-Up": Clock3,
  "Attention Needed": AlertTriangle,
  "Not Started": CircleDashed,
  Completed: GraduationCap,
};

/* The surface and ink pairs the summary tile uses — the same reserved
   status steps Badge draws with, so a status looks identical in the tile
   and in the table row it summarises. */
const statusTileStyle: Record<MemberStatus, string> = {
  "On Track": "bg-success-surface text-success",
  "Need Follow-Up": "bg-warning-surface text-warning",
  "Attention Needed": "bg-danger-surface text-danger",
  "Not Started": "bg-surface-sunken text-fg-secondary",
  Completed: "bg-info-surface text-info",
};

function EnrollmentCard() {
  const pct = Math.round((enrollment.enrolled / enrollment.contracted) * 100);

  return (
    <Card as="article" padding="small" className="min-h-[156px]">
      <div className="mb-stack-md flex items-start justify-between gap-inline-lg">
        <p className="text-heading-5 text-fg-secondary">Members Enrolled</p>
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-control bg-surface-brand-subtle"
        >
          <Users className="h-5 w-5 text-brand-600" />
        </span>
      </div>
      <p className="text-metric-lg text-fg">
        {enrollment.enrolled}
        <span className="text-heading-4 text-fg-muted">
          {" "}
          / {enrollment.contracted}
        </span>
      </p>
      <Progress
        value={pct}
        label="Contracted seats filled"
        size="small"
        className="mt-stack-sm"
      />
      <p className="mt-stack-sm text-body-sm text-fg-muted">
        {enrollment.remaining} slots remaining
      </p>
    </Card>
  );
}

function StatusCard({ card }: { card: (typeof statusCards)[number] }) {
  const Icon = statusIcon[card.status];

  return (
    <Card as="article" padding="small" className="min-h-[156px]">
      <div className="mb-stack-md flex items-start justify-between gap-inline-lg">
        <p className="text-heading-5 text-fg-secondary">{card.status}</p>
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 items-center justify-center rounded-control ${statusTileStyle[card.status]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="flex items-end justify-between gap-inline-lg">
        <p className="text-metric-lg text-fg">{card.count}</p>
        {card.share ? (
          <p className="text-body-sm text-fg-muted">{card.share}</p>
        ) : null}
      </div>
    </Card>
  );
}

function PerformanceOverview() {
  return (
    <Card as="section" padding="small">
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

function UpcomingClasses() {
  return (
    <Card as="section" padding="small">
      <div className="mb-stack-lg flex items-center justify-between gap-inset-md">
        <h2 className="text-heading-4 text-fg">Upcoming Classes</h2>
        <Button
          {...notBuiltYet("The full class schedule")}
          variant="neutral"
          appearance="fill-stroke"
          size="small"
        >
          View All
        </Button>
      </div>
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
            {upcomingClasses.map((item) => (
              <TableRow key={item.title}>
                <TableCell className="whitespace-nowrap">{item.date}</TableCell>
                <TableCell emphasis>{item.title}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {item.time}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function MembersPanel() {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => filterMembers(members, query), [query]);

  return (
    <Card as="section" padding="small">
      <div className="mb-stack-lg flex flex-col gap-inset-sm sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-heading-4 text-fg">Members</h2>
        <div className="flex flex-col gap-inline-md sm:flex-row sm:items-center">
          <Input
            type="search"
            inputSize="small"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search members..."
            aria-label="Search members"
            leadingIcon={<Search aria-hidden="true" />}
            className="sm:w-56"
          />
          <Button {...notBuiltYet("Enrolling a member")} size="small">
            <Plus className="h-4 w-4" />
            Enroll Member
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-control border border-line">
        <Table minWidth={880}>
          <TableHead className="bg-surface-sunken">
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Program</TableHeaderCell>
              <TableHeaderCell>Enrollment Date</TableHeaderCell>
              <TableHeaderCell>Progress</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Last Activity</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.length === 0 ? (
              <TableEmptyRow colSpan={7}>
                No members match that search.
              </TableEmptyRow>
            ) : (
              visible.map((member) => {
                const Icon = statusIcon[member.status];
                return (
                  <TableRow key={member.name}>
                    <TableCell emphasis>{member.name}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {member.program}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {member.enrolledOn}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-inline-md">
                        <Progress
                          value={member.progress}
                          label={`${member.name} curriculum progress`}
                          size="small"
                          className="w-16"
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="mt-stack-sm text-caption text-fg-muted">
        Showing {visible.length} of {members.length} members.
      </p>
    </Card>
  );
}

function ProgramProgressPanel() {
  return (
    <Card as="section" padding="small">
      <h2 className="mb-6 text-heading-4 text-fg">
        Program Progress (All Members)
      </h2>
      {/* Ordered day bands: a distribution across one measure, so one hue.
          Colouring each bar separately would imply six identities. */}
      <BarChart
        bars={programProgress}
        label="Members by program stage"
        unit="members"
        tone="brand"
        height={200}
      />
    </Card>
  );
}

function ToolUsagePanel() {
  return (
    <Card as="section" padding="small">
      <h2 className="mb-6 text-heading-4 text-fg">
        Tool Usage (Member Engagement)
      </h2>
      {/* Horizontal, because six tool names do not fit under vertical bars.
          One measure again, so one hue — the row label carries identity. */}
      <ul className="space-y-stack-md">
        {toolUsage.map((tool) => (
          <li key={tool.label} className="flex items-center gap-inline-lg">
            <span className="w-40 shrink-0 text-body-sm text-fg-secondary">
              {tool.label}
            </span>
            <Progress
              value={tool.value}
              label={`${tool.label} usage`}
              size="small"
              className="min-w-0 flex-1"
            />
            <span className="w-10 shrink-0 text-right text-body-sm text-fg tabular-nums">
              {tool.value}%
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function ClinicDashboard() {
  return (
    <>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <EnrollmentCard />
        {statusCards.map((card) => (
          <StatusCard key={card.status} card={card} />
        ))}
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <PerformanceOverview />
        <UpcomingClasses />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,1fr)]">
        <MembersPanel />
        <div className="space-y-4">
          <ProgramProgressPanel />
          <ToolUsagePanel />
        </div>
      </section>
    </>
  );
}
