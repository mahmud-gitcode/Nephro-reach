"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Award,
  BellRing,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  PlayCircle,
  Plus,
  Quote,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  Video,
} from "lucide-react";

import { PageTitle } from "@/components/layout/PageTitle";
import {
  Badge,
  BarChart,
  Button,
  Card,
  ChartLegend,
  DonutChart,
  MonthCalendar,
  Progress,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { tableIconButton } from "./tableButton";
import {
  attendanceTrend,
  classDate,
  formatClassDate,
  recentClasses,
  registrationSources,
  settings,
  summary,
  upcomingClasses,
} from "./liveClass.data";
import type { RecentClass } from "./liveClass.data";
import { useLiveClasses } from "./useLiveClasses";
import {
  classesOnDay,
  pastClasses,
  settingSummary,
  type ManagedClass,
  type SettingId,
  type SettingValues,
} from "./liveClass.actions";
import {
  AllClassesModal,
  ClassActionsModal,
  RecordingModal,
  RecordingsLibraryModal,
  ScheduleClassModal,
  SettingModal,
  classTone,
} from "./LiveClassModals";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SETTING_ICONS: Record<(typeof settings)[number]["id"], React.ReactNode> =
  {
    zoom: <Video />,
    reminders: <BellRing />,
    limits: <Users />,
    resources: <FolderOpen />,
    surveys: <ClipboardList />,
    certificates: <Award />,
  };

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

/** Five stars filled to the rating, and the number beside them — the
    figure is what a screen reader hears, the stars are decoration. */
function Rating({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-inline-xs">
      <span aria-hidden="true" className="flex">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={`${size} ${
              index < Math.round(value)
                ? "fill-chart-warning text-chart-warning"
                : "text-line-strong"
            }`}
          />
        ))}
      </span>
      <span className="sr-only">Rated {value} out of 5</span>
    </span>
  );
}

function KeyCard({
  label,
  value,
  icon,
  tint,
  children,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tint: string;
  children?: React.ReactNode;
}) {
  return (
    <Card as="article" padding="small" className="min-h-[164px]">
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
      {children ? <div className="mt-stack-sm">{children}</div> : null}
    </Card>
  );
}

function SummaryCards() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <KeyCard
        label="Upcoming Live Classes"
        value={summary.upcomingThisMonth}
        icon={<Video className="text-brand-600" />}
        tint="bg-surface-brand-subtle"
      >
        <p className="text-body-sm text-fg-muted">This month</p>
      </KeyCard>

      <KeyCard
        label="Total Registrations"
        value={summary.totalRegistrations}
        icon={<Users className="text-success" />}
        tint="bg-success-surface"
      >
        <p className="flex items-center gap-inline-xs text-body-sm text-success">
          <TrendingUp aria-hidden="true" className="h-4 w-4" />+
          {summary.registrationsChangePct}% from last month
        </p>
      </KeyCard>

      <KeyCard
        label="Average Attendance"
        value={`${summary.averageAttendancePct}%`}
        icon={<UserCheck className="text-brand-600" />}
        tint="bg-surface-brand-subtle"
      >
        <p className="flex items-center gap-inline-xs text-body-sm text-success">
          <TrendingUp aria-hidden="true" className="h-4 w-4" />
          vs. {summary.lastMonthAttendancePct}% last month
        </p>
      </KeyCard>

      <KeyCard
        label="Average Rating"
        value={
          <>
            {summary.averageRating}
            <span className="text-heading-4 text-fg-muted">/5</span>
          </>
        }
        icon={<Star className="text-warning" />}
        tint="bg-warning-surface"
      >
        <Rating value={summary.averageRating} />
      </KeyCard>

      <Card
        as="article"
        padding="small"
        className="flex min-h-[164px] flex-col"
      >
        <p className="text-heading-5 text-fg-secondary">Member Feedback</p>
        <figure className="mt-stack-md flex flex-1 flex-col">
          <Quote aria-hidden="true" className="h-5 w-5 text-fg-brand" />
          <blockquote className="mt-stack-xs text-body-md text-fg italic">
            {summary.feedback}
          </blockquote>
          <figcaption className="mt-auto pt-stack-sm text-caption text-fg-muted">
            — Member Feedback
          </figcaption>
        </figure>
      </Card>
    </section>
  );
}

function UpcomingClassesTable({
  classes,
  onViewAll,
  onEdit,
  onActions,
}: {
  classes: ManagedClass[];
  onViewAll: () => void;
  onEdit: (item: ManagedClass) => void;
  onActions: (item: ManagedClass) => void;
}) {
  return (
    <Card as="section" padding="small">
      <PanelHeading
        title="Upcoming Live Classes"
        description="View, manage, and track all upcoming live classes."
        action={
          <Button
            variant="neutral"
            appearance="fill-stroke"
            size="small"
            onClick={onViewAll}
          >
            View All
          </Button>
        }
      />
      <div className="overflow-hidden rounded-control border border-line">
        <Table minWidth={860}>
          <TableHead className="bg-surface-sunken">
            <TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Time (EST)</TableHeaderCell>
              <TableHeaderCell>Topic</TableHeaderCell>
              <TableHeaderCell>Educator</TableHeaderCell>
              <TableHeaderCell>Program</TableHeaderCell>
              <TableHeaderCell>Registered</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classes.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatClassDate(item.date)}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {item.time}
                </TableCell>
                <TableCell emphasis>{item.topic}</TableCell>
                <TableCell>{item.educator}</TableCell>
                <TableCell>{item.program}</TableCell>
                <TableCell>
                  <span className="block whitespace-nowrap tabular-nums">
                    {item.registered} / {item.capacity}
                  </span>
                  <Progress
                    value={item.registered}
                    max={item.capacity}
                    label={`${item.topic} registrations`}
                    size="small"
                    className="mt-stack-xs w-16"
                  />
                </TableCell>
                <TableCell>
                  <Badge tone={classTone[item.status]}>{item.status}</Badge>
                </TableCell>
                <TableCell>
                  <span className="flex justify-end gap-inline-xs">
                    <Button
                      onClick={() => onEdit(item)}
                      variant="neutral"
                      appearance="fill-stroke"
                      size="small"
                      iconOnly
                      className={tableIconButton}
                      aria-label={`Edit ${item.topic}`}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                    <Button
                      onClick={() => onActions(item)}
                      variant="neutral"
                      appearance="fill-stroke"
                      size="small"
                      iconOnly
                      className={tableIconButton}
                      aria-label={`Actions for ${item.topic}`}
                    >
                      <MoreHorizontal aria-hidden="true" />
                    </Button>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function LiveClassCalendar({ classes }: { classes: ManagedClass[] }) {
  /* ?date=2026-09-19 (the dashboard links here with one) opens on that day,
     selected. Without it, or with anything that is not a date, it opens on
     the first scheduled class, so the panel under the grid shows something
     the moment the page loads. */
  const params = useSearchParams();
  const requested = params.get("date");
  const first =
    requested && /^\d{4}-\d{2}-\d{2}$/.test(requested)
      ? classDate(requested)
      : classDate(classes[0]?.date ?? upcomingClasses[0].date);
  const [year, setYear] = useState(first.getFullYear());
  const [month, setMonth] = useState(first.getMonth());
  const [day, setDay] = useState<number | null>(first.getDate());

  const selected = day === null ? [] : classesOnDay(classes, year, month, day);
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Live Class Calendar" />
      <MonthCalendar
        year={year}
        month={month}
        selectedDay={day}
        onSelectDay={setDay}
        onMonthChange={(nextYear, nextMonth) => {
          setYear(nextYear);
          setMonth(nextMonth);
          setDay(null);
        }}
        monthLabel={monthLabel}
        weekdayLabels={WEEKDAYS}
        formatDayLabel={(date) =>
          date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        }
        isMarked={(date) =>
          classesOnDay(
            classes,
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
          ).length > 0
        }
      />
      <p className="mt-stack-sm flex items-center gap-inline-xs text-caption text-fg-muted">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-pill bg-action"
        />
        Live class scheduled
      </p>

      <div
        aria-live="polite"
        className="mt-stack-md border-t border-line-subtle pt-inset-sm"
      >
        {day === null ? (
          <p className="text-body-sm text-fg-muted">
            Pick a day to see its class.
          </p>
        ) : selected.length === 0 ? (
          <p className="text-body-sm text-fg-muted">
            No live class on {monthLabel.split(" ")[0]} {day}.
          </p>
        ) : (
          selected.map((item) => (
            <div key={item.id} className="flex items-start gap-inline-lg">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface-brand-subtle text-brand-600"
              >
                <CalendarDays className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-label-lg text-fg">{item.topic}</p>
                <p className="text-body-sm text-fg-secondary">
                  {formatClassDate(item.date)} · {item.time} EST
                </p>
                <p className="text-body-sm text-fg-muted">
                  {item.educator} · {item.registered}/{item.capacity} registered
                </p>
              </div>
              <Badge tone={classTone[item.status]}>{item.status}</Badge>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function RecentLiveClasses({
  recordings,
  onView,
  onViewAll,
}: {
  recordings: Record<string, string>;
  onView: (item: RecentClass) => void;
  onViewAll: () => void;
}) {
  return (
    <Card as="section" padding="small">
      <PanelHeading
        title="Recent Live Classes"
        description="View past class recordings, attendance, and feedback."
      />
      <ul className="divide-y divide-line-subtle">
        {recentClasses.map((item) => (
          <li
            key={item.title}
            className="flex items-center gap-inline-lg py-inset-sm first:pt-0 last:pb-0"
          >
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface-brand-subtle text-brand-600"
            >
              <PlayCircle className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-label-lg text-fg">{item.title}</p>
              <p className="text-caption text-fg-muted">
                {formatClassDate(item.date)} · {item.attended} attended
              </p>
              <p className="mt-stack-xs flex items-center gap-inline-xs text-caption text-fg-secondary">
                <Rating value={item.rating} size="h-3.5 w-3.5" />
                <span aria-hidden="true">{item.rating}</span>
              </p>
            </div>
            <Button
              onClick={() => onView(item)}
              variant="neutral"
              appearance="fill-stroke"
              size="small"
              aria-label={`View ${item.title} recording`}
            >
              {recordings[item.title] ? "Open" : "View"}
            </Button>
          </li>
        ))}
      </ul>
      <Button
        onClick={onViewAll}
        variant="neutral"
        appearance="stroke"
        size="small"
        fullWidth
        className="mt-stack-lg"
      >
        View All Recordings
      </Button>
    </Card>
  );
}

function RegistrationSources() {
  return (
    <Card as="section" padding="small">
      <PanelHeading title="Registration Sources" />
      <DonutChart
        segments={registrationSources.map((source) => ({
          label: source.label,
          value: source.pct,
          tone: source.tone,
        }))}
        label="Registration sources"
        size={168}
        thickness={30}
        centerValue={summary.totalRegistrations}
        centerLabel="Registrations"
        className="mx-auto"
      />
      <ChartLegend
        className="mt-stack-lg"
        items={registrationSources.map((source) => ({
          label: source.label,
          tone: source.tone,
          value: `${source.pct}%`,
        }))}
      />
    </Card>
  );
}

function AttendanceTrend() {
  return (
    <Card as="section" padding="small">
      <PanelHeading
        title="Attendance Trend"
        description="Live class attendance over the last 6 months."
      />
      <BarChart
        bars={attendanceTrend}
        label="Live class attendance by month"
        unit="%"
        yMax={100}
        yTicks={6}
        height={240}
      />
    </Card>
  );
}

function LiveClassSettings({
  values,
  onManage,
}: {
  values: Record<SettingId, SettingValues>;
  onManage: (id: SettingId, title: string) => void;
}) {
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading
        title="Live Class Settings"
        description="How classes are run, reminded, and followed up."
      />
      <ul className="grid gap-4 sm:grid-cols-2">
        {settings.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-inline-lg rounded-control border border-line-subtle p-inset-sm"
          >
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface-sunken text-fg-secondary [&_svg]:h-5 [&_svg]:w-5"
            >
              {SETTING_ICONS[item.id]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-label-lg text-fg">{item.title}</p>
              {/* What is actually switched on, when anything is — more use
                  than repeating the card's own description back. */}
              <p className="text-body-sm text-fg-muted">
                {settingSummary(item.id, values[item.id]) ?? item.description}
              </p>
            </div>
            <Button
              onClick={() => onManage(item.id, item.title)}
              variant="neutral"
              appearance="fill-stroke"
              size="small"
              aria-label={`Manage ${item.title}`}
            >
              Manage
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function ClinicLiveClass() {
  const live = useLiveClasses();
  const past = useMemo(() => pastClasses(), []);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedClass | null>(null);
  const [acting, setActing] = useState<ManagedClass | null>(null);
  const [allOpen, setAllOpen] = useState(false);
  const [recording, setRecording] = useState<RecentClass | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [setting, setSetting] = useState<{
    id: SettingId;
    title: string;
  } | null>(null);

  const openSchedule = (item: ManagedClass | null) => {
    setEditing(item);
    setScheduleOpen(true);
  };

  return (
    <div className="space-y-4">
      <PageTitle
        href="/dashboard/clinic/live-class"
        action={
          <Button size="small" onClick={() => openSchedule(null)}>
            <Plus className="h-4 w-4" />
            Schedule New Class
          </Button>
        }
      />

      <SummaryCards />

      <UpcomingClassesTable
        classes={live.upcoming}
        onViewAll={() => setAllOpen(true)}
        onEdit={openSchedule}
        onActions={setActing}
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Suspense fallback={<Skeleton height={560} className="rounded-card" />}>
          <LiveClassCalendar classes={live.classes} />
        </Suspense>
        <RecentLiveClasses
          recordings={live.recordings}
          onView={setRecording}
          onViewAll={() => setLibraryOpen(true)}
        />
        <RegistrationSources />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <AttendanceTrend />
        <div className="xl:col-span-2">
          <LiveClassSettings
            values={live.settings}
            onManage={(id, title) => setSetting({ id, title })}
          />
        </div>
      </section>

      {/* The dialogs behind the actions above. Keyed where they hold a
          draft, so a reopened form starts from what it was given. */}
      {scheduleOpen ? (
        <ScheduleClassModal
          key={`schedule-${editing?.id ?? "new"}`}
          open
          onClose={() => setScheduleOpen(false)}
          classes={live.classes}
          editing={editing}
          today={live.today}
          onSave={(draft, id) =>
            id ? live.updateClass(id, draft) : live.addClass(draft)
          }
        />
      ) : null}

      <ClassActionsModal
        item={acting}
        onClose={() => setActing(null)}
        onEdit={() => openSchedule(acting)}
        onStatus={(status) => acting && live.setStatus(acting.id, status)}
        onDuplicate={() => acting && live.duplicate(acting.id)}
        onRemove={() => acting && live.remove(acting.id)}
      />

      <AllClassesModal
        open={allOpen}
        onClose={() => setAllOpen(false)}
        classes={live.classes}
        today={live.today}
        onSelect={(item) => {
          setAllOpen(false);
          setActing(item);
        }}
      />

      <RecordingModal
        key={`recording-${recording?.title ?? "none"}`}
        item={recording}
        onClose={() => setRecording(null)}
        link={recording ? (live.recordings[recording.title] ?? "") : ""}
        onSave={live.setRecording}
      />

      <RecordingsLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        classes={past}
        recordings={live.recordings}
        onSelect={(item) => {
          setLibraryOpen(false);
          setRecording(item);
        }}
      />

      <SettingModal
        key={`setting-${setting?.id ?? "none"}`}
        id={setting?.id ?? null}
        title={setting?.title ?? ""}
        onClose={() => setSetting(null)}
        values={setting ? live.settings[setting.id] : {}}
        onSave={live.setSetting}
      />
    </div>
  );
}
