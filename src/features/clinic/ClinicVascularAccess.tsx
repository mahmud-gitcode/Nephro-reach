"use client";

import React, { useMemo, useState } from "react";
import {
  CalendarPlus,
  Check,
  Eye,
  MessageSquareText,
  Search,
} from "lucide-react";
import {
  AlertTriangleSolid,
  ClockSolid,
  UsersSolid,
} from "@/components/icons/solid";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  Alert,
  Badge,
  Button,
  buttonStyles,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  KeyCard,
  Modal,
  SegmentedChoice,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tabs,
  TabPanel,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useNow } from "@/lib/utils/useNow";
import * as messaging from "@/features/messaging/messaging.rules";
import {
  ACCESS_STATUSES,
  APPOINTMENT_TYPES,
  CONCERN_KINDS,
  TEAM_LABEL,
  addDays,
  dayKey,
  formatDay,
  formatTime,
  nextAppointment,
  openConcerns,
  pendingTransport,
  sortedHistory,
  sortedUpdates,
  unreadForTeam,
  upcomingAppointments,
  type AccessRecord,
  type AccessStatus,
  type AccessTeam,
} from "@/features/vascular-access/vascularAccess.data";
import {
  AccessStatusBadge,
  AppointmentRow,
  HistoryTable,
  ThreadView,
  UpdatesTimeline,
} from "@/features/vascular-access/AccessUi";
import {
  useVascularAccess,
  type VascularAccessStore,
} from "@/features/vascular-access/useVascularAccess";
import { tableIconButton } from "./tableButton";
import { UpdatedBar } from "./UpdatedBar";

/* ==========================================================================
   Vascular Access — the clinic's tab
   --------------------------------------------------------------------------
   The access team's side of the member's Vascular Access tab: book visits
   that land on the patient's screen, review reported concerns and photos,
   arrange rides, and answer access messages. Same records, same store.
   ========================================================================== */

const HREF = "/dashboard/clinic/vascular-access";

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

function PanelHeading({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-stack-lg flex items-center justify-between gap-inline-lg">
      <h2 className="text-heading-4 text-fg">{title}</h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function concernLabel(ids: string[]) {
  return ids
    .map((id) => CONCERN_KINDS.find((kind) => kind.id === id)?.en ?? id)
    .join(", ");
}

/* -------------------------------------------------------- schedule form */

function ScheduleModal({
  records,
  store,
  initialMrn,
  onClose,
}: {
  records: AccessRecord[];
  store: VascularAccessStore;
  initialMrn: string;
  onClose: () => void;
}) {
  const now = useNow();
  const today = dayKey(now);
  const [mrn, setMrn] = useState(initialMrn);
  const [title, setTitle] = useState<string>(APPOINTMENT_TYPES[0]);
  const [date, setDate] = useState(addDays(today, 7));
  const [time, setTime] = useState("10:00");
  const [place, setPlace] = useState("Vascular Access Center");
  const [team, setTeam] = useState<AccessTeam>("vascular");
  const valid =
    mrn !== "" && date >= today && time !== "" && place.trim() !== "";

  return (
    <Modal
      open
      onClose={onClose}
      title="Schedule Appointment"
      footer={
        <>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            size="small"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="small"
            disabled={!valid}
            onClick={() => {
              store.scheduleAppointment(mrn, {
                title,
                date,
                time,
                place: place.trim(),
                team,
              });
              onClose();
            }}
          >
            Schedule
          </Button>
        </>
      }
    >
      <div className="grid gap-stack-md sm:grid-cols-2">
        <FormField label="Patient" required className="sm:col-span-2">
          {(field) => (
            <Select
              {...field}
              value={mrn}
              onChange={(e) => setMrn(e.target.value)}
            >
              {records.map((record) => (
                <option key={record.mrn} value={record.mrn}>
                  {record.memberName} · MRN {record.mrn}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField label="Appointment" required>
          {(field) => (
            <Select
              {...field}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            >
              {APPOINTMENT_TYPES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField label="Location" required>
          {(field) => (
            <Input
              {...field}
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          )}
        </FormField>
        <FormField
          label="Date"
          required
          error={date < today ? "Pick a future date" : undefined}
        >
          {(field) => (
            <Input
              {...field}
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          )}
        </FormField>
        <FormField label="Time" required>
          {(field) => (
            <Input
              {...field}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          )}
        </FormField>
        <SegmentedChoice
          className="sm:col-span-2"
          label="With"
          value={team}
          onChange={(next: AccessTeam) => setTeam(next)}
          options={[
            { value: "vascular", label: TEAM_LABEL.vascular },
            { value: "dialysis", label: TEAM_LABEL.dialysis },
          ]}
        />
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------- patient modal */

type PatientTab = "overview" | "appointments" | "messages" | "history";

function CompleteForm({
  onSave,
  onCancel,
}: {
  onSave: (result: string, performedBy: string) => void;
  onCancel: () => void;
}) {
  const [result, setResult] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const valid = result.trim() !== "" && performedBy.trim() !== "";
  return (
    <div className="mt-stack-sm grid gap-inline-md rounded-control border border-line bg-surface-sunken p-inset-sm sm:grid-cols-[1fr_1fr_auto]">
      <Input
        inputSize="small"
        aria-label="Result"
        placeholder="Result, e.g. Normal flow"
        value={result}
        onChange={(e) => setResult(e.target.value)}
      />
      <Input
        inputSize="small"
        aria-label="Performed by"
        placeholder="Performed by"
        value={performedBy}
        onChange={(e) => setPerformedBy(e.target.value)}
      />
      <span className="flex gap-inline-sm">
        <Button
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="small"
          disabled={!valid}
          onClick={() => onSave(result.trim(), performedBy.trim())}
        >
          Save
        </Button>
      </span>
    </div>
  );
}

function PatientModal({
  record,
  store,
  initialTab,
  onSchedule,
  onClose,
}: {
  record: AccessRecord;
  store: VascularAccessStore;
  initialTab: PatientTab;
  onSchedule: () => void;
  onClose: () => void;
}) {
  const now = useNow();
  const today = dayKey(now);
  const [tab, setTab] = useState<PatientTab>(initialTab);
  const [team, setTeam] = useState<AccessTeam>(
    record.threads.find((thread) => thread.unreadByTeam > 0)?.team ??
      "vascular",
  );
  const [completing, setCompleting] = useState<string | null>(null);
  const upcoming = upcomingAppointments(record, today);
  const concerns = openConcerns(record);
  const thread = record.threads.find((entry) => entry.team === team);
  const unread = unreadForTeam(record);

  function showTab(next: PatientTab) {
    setTab(next);
    if (next === "messages") store.markThreadRead(record.mrn, team, "team");
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={record.memberName}
      description={`MRN ${record.mrn} · ${record.overview.type}, ${record.overview.location}`}
    >
      <Tabs
        label="Patient access"
        value={tab}
        onChange={showTab}
        className="mb-stack-lg"
        items={[
          { id: "overview", label: "Overview" },
          { id: "appointments", label: `Appointments (${upcoming.length})` },
          {
            id: "messages",
            label: unread > 0 ? `Messages (${unread})` : "Messages",
          },
          { id: "history", label: "History" },
        ]}
      />

      <TabPanel id="overview" value={tab} className="space-y-stack-lg">
        <div className="flex flex-wrap items-end gap-inline-lg">
          <FormField label="Access status">
            {(field) => (
              <Select
                {...field}
                selectSize="small"
                className="w-52"
                value={record.overview.status}
                onChange={(e) =>
                  store.editOverview(record.mrn, {
                    status: e.target.value as AccessStatus,
                  })
                }
              >
                {ACCESS_STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </Select>
            )}
          </FormField>
          <dl className="flex flex-wrap gap-inline-lg text-body-sm">
            <div>
              <dt className="text-caption text-fg-muted">Created</dt>
              <dd className="text-label-lg text-fg">
                {formatDay(record.overview.createdOn)}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-fg-muted">Last Assessment</dt>
              <dd className="text-label-lg text-fg">
                {record.overview.lastAssessment
                  ? formatDay(record.overview.lastAssessment)
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>

        <section>
          <h3 className="mb-stack-sm text-heading-5 text-fg">Open Concerns</h3>
          {concerns.length === 0 ? (
            <p className="text-body-sm text-fg-muted">No open concerns.</p>
          ) : (
            <ul className="space-y-stack-sm">
              {concerns.map((concern) => (
                <li
                  key={concern.id}
                  className="flex flex-wrap items-start gap-inline-lg rounded-control border border-line p-inset-sm"
                >
                  {concern.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a data URL, nothing to optimise
                    <img
                      src={concern.imageUrl}
                      alt={`Photo from ${record.memberName}`}
                      className="h-20 w-20 shrink-0 rounded-control object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-label-lg text-fg">
                      {concernLabel(concern.kinds)}
                    </p>
                    <p className="text-body-sm text-fg-secondary">
                      {concern.detail}
                    </p>
                    <p className="mt-stack-xs text-caption text-fg-muted">
                      {messaging.relativeLabel(concern.reportedAt, now)}
                    </p>
                  </div>
                  <Button
                    size="small"
                    variant="neutral"
                    appearance="fill-stroke"
                    onClick={() => store.reviewConcern(record.mrn, concern.id)}
                  >
                    <Check aria-hidden="true" />
                    Mark reviewed
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-stack-sm text-heading-5 text-fg">Recent Updates</h3>
          <UpdatesTimeline
            updates={sortedUpdates(record).slice(0, 4)}
            emptyLabel="No updates yet."
          />
        </section>
      </TabPanel>

      <TabPanel id="appointments" value={tab}>
        <div className="mb-stack-md flex justify-end">
          <Button size="small" onClick={onSchedule}>
            <CalendarPlus aria-hidden="true" />
            Schedule Appointment
          </Button>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState variant="bare" title="No upcoming appointments" />
        ) : (
          <ul className="divide-y divide-line-subtle">
            {upcoming.map((appointment) => (
              <li
                key={appointment.id}
                className="py-inset-xs first:pt-0 last:pb-0"
              >
                <AppointmentRow
                  appointment={appointment}
                  action={
                    completing === appointment.id ? null : (
                      <Button
                        size="small"
                        variant="neutral"
                        appearance="fill-stroke"
                        onClick={() => setCompleting(appointment.id)}
                      >
                        Complete
                      </Button>
                    )
                  }
                />
                {completing === appointment.id ? (
                  <CompleteForm
                    onCancel={() => setCompleting(null)}
                    onSave={(result, performedBy) => {
                      store.completeAppointment(
                        record.mrn,
                        appointment.id,
                        result,
                        performedBy,
                      );
                      setCompleting(null);
                    }}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </TabPanel>

      <TabPanel id="messages" value={tab} className="space-y-stack-md">
        <SegmentedChoice
          label="Thread"
          value={team}
          onChange={(next: AccessTeam) => {
            setTeam(next);
            store.markThreadRead(record.mrn, next, "team");
          }}
          options={record.threads.map((entry) => ({
            value: entry.team,
            label:
              entry.unreadByTeam > 0
                ? `${TEAM_LABEL[entry.team]} (${entry.unreadByTeam})`
                : TEAM_LABEL[entry.team],
          }))}
        />
        {thread ? (
          <ThreadView
            key={team}
            thread={thread}
            me="team"
            sending={store.isSaving}
            onSend={(body) => store.sendMessage(record.mrn, team, "team", body)}
          />
        ) : null}
      </TabPanel>

      <TabPanel id="history" value={tab}>
        <HistoryTable history={sortedHistory(record)} />
      </TabPanel>
    </Modal>
  );
}

/* ------------------------------------------------------------------ page */

function PageSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} height={132} className="rounded-card" />
        ))}
      </div>
      <Skeleton height={480} className="rounded-card" />
    </div>
  );
}

export default function ClinicVascularAccess() {
  const now = useNow();
  const store = useVascularAccess();
  const records = store.records;
  const today = dayKey(now);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All Statuses");
  const [open, setOpen] = useState<{ mrn: string; tab: PatientTab } | null>(
    null,
  );
  const [scheduling, setScheduling] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter(
      (record) =>
        (status === "All Statuses" || record.overview.status === status) &&
        (q === "" ||
          record.memberName.toLowerCase().includes(q) ||
          record.mrn.includes(q)),
    );
  }, [records, query, status]);

  const concerns = records.flatMap((record) =>
    openConcerns(record).map((concern) => ({ record, concern })),
  );
  const rides = records.flatMap((record) =>
    pendingTransport(record).map((request) => ({
      record,
      request,
      appointment: record.appointments.find(
        (a) => a.id === request.appointmentId,
      ),
    })),
  );
  const nextMonth = addDays(today, 30);
  const upcomingCount = records.reduce(
    (sum, record) =>
      sum +
      upcomingAppointments(record, today).filter((a) => a.date <= nextMonth)
        .length,
    0,
  );
  const selected = open
    ? records.find((record) => record.mrn === open.mrn)
    : null;

  let body: React.ReactNode;
  if (store.error) {
    body = (
      <ErrorState
        title="Access records could not be loaded"
        error={store.error}
        onRetry={store.refetch}
      />
    );
  } else if (store.isPending) {
    body = <PageSkeleton />;
  } else {
    body = (
      <>
        {store.writeError ? (
          <Alert tone="danger" onDismiss={store.clearWriteError}>
            That change did not save. Try again.
          </Alert>
        ) : null}

        <section
          aria-label="Access summary"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <KeyCard
            tone="brand"
            icon={<UsersSolid />}
            value={records.length}
            label="Access Patients"
          />
          <KeyCard
            tone="danger"
            icon={<AlertTriangleSolid />}
            value={concerns.length}
            label="Open Concerns"
          />
          <KeyCard
            tone="accent"
            icon={<ClockSolid />}
            value={upcomingCount}
            label="Appointments, Next 30 Days"
          />
          <KeyCard
            tone="warning"
            icon={<ClockSolid />}
            value={rides.length}
            label="Ride Requests"
          />
        </section>

        <Card as="section" padding="small" className="min-w-0">
          <PanelHeading title="Access Patients" />
          <div className="mb-stack-lg flex flex-col gap-inline-md lg:flex-row lg:items-center">
            <Input
              type="search"
              inputSize="small"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or MRN..."
              aria-label="Search patients"
              leadingIcon={<Search aria-hidden="true" />}
              className="lg:max-w-60 lg:flex-1"
            />
            <Select
              selectSize="small"
              aria-label="Access status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="lg:w-48"
            >
              {["All Statuses", ...ACCESS_STATUSES].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
          </div>

          <div className="overflow-hidden rounded-control border border-line">
            <Table minWidth={760}>
              <TableHead className="bg-surface-sunken">
                <TableRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Access</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Next Appointment</TableHeaderCell>
                  <TableHeaderCell>Concerns</TableHeaderCell>
                  <TableHeaderCell className="text-right">
                    Actions
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableEmptyRow colSpan={6}>
                    No patients match these filters.
                  </TableEmptyRow>
                ) : (
                  rows.map((record) => {
                    const next = nextAppointment(record, today);
                    const openCount = openConcerns(record).length;
                    const unread = unreadForTeam(record);
                    return (
                      <TableRow key={record.mrn}>
                        <TableCell emphasis className="whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              setOpen({ mrn: record.mrn, tab: "overview" })
                            }
                            className={cn(
                              "cursor-pointer rounded-control-small text-left hover:text-fg-brand hover:underline",
                              focusRing,
                            )}
                          >
                            {record.memberName}
                          </button>
                          <span className="block text-caption font-normal text-fg-muted tabular-nums">
                            MRN {record.mrn}
                          </span>
                        </TableCell>
                        <TableCell>
                          {record.overview.type}
                          <span className="block text-caption text-fg-muted">
                            {record.overview.location}
                          </span>
                        </TableCell>
                        <TableCell>
                          <AccessStatusBadge status={record.overview.status} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {next ? (
                            <>
                              {formatDay(next.date)}
                              <span className="block text-caption text-fg-muted">
                                {next.title} · {formatTime(next.time)}
                              </span>
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {openCount > 0 ? (
                            <Badge tone="danger">{openCount} open</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="flex justify-end gap-inline-xs">
                            <button
                              type="button"
                              onClick={() =>
                                setOpen({ mrn: record.mrn, tab: "overview" })
                              }
                              className={iconControl}
                              aria-label={`View ${record.memberName}`}
                              title="View access"
                            >
                              <Eye aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpen({ mrn: record.mrn, tab: "messages" });
                                const team =
                                  record.threads.find((t) => t.unreadByTeam > 0)
                                    ?.team ?? "vascular";
                                store.markThreadRead(record.mrn, team, "team");
                              }}
                              className={cn(iconControl, "relative")}
                              aria-label={
                                unread > 0
                                  ? `Messages for ${record.memberName}, ${unread} unread`
                                  : `Messages for ${record.memberName}`
                              }
                              title="Messages"
                            >
                              <MessageSquareText aria-hidden="true" />
                              {unread > 0 ? (
                                <span
                                  aria-hidden="true"
                                  className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-pill bg-danger-solid"
                                />
                              ) : null}
                            </button>
                            <button
                              type="button"
                              onClick={() => setScheduling(record.mrn)}
                              className={iconControl}
                              aria-label={`Schedule for ${record.memberName}`}
                              title="Schedule appointment"
                            >
                              <CalendarPlus aria-hidden="true" />
                            </button>
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

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card as="section" padding="small" className="h-full">
            <PanelHeading title="Open Concerns" />
            {concerns.length === 0 ? (
              <p className="text-body-sm text-fg-muted">No open concerns.</p>
            ) : (
              <ul className="divide-y divide-line-subtle">
                {concerns.map(({ record, concern }) => (
                  <li
                    key={concern.id}
                    className="flex items-start gap-inline-lg py-inset-xs first:pt-0 last:pb-0"
                  >
                    {concern.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- a data URL, nothing to optimise
                      <img
                        src={concern.imageUrl}
                        alt={`Photo from ${record.memberName}`}
                        className="h-12 w-12 shrink-0 rounded-control object-cover"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() =>
                          setOpen({ mrn: record.mrn, tab: "overview" })
                        }
                        className={cn(
                          "cursor-pointer rounded-control-small text-label-lg text-fg hover:text-fg-brand hover:underline",
                          focusRing,
                        )}
                      >
                        {record.memberName}
                      </button>
                      <p className="text-body-sm text-fg-secondary">
                        {concernLabel(concern.kinds)} — {concern.detail}
                      </p>
                    </div>
                    <span className="shrink-0 text-caption text-fg-muted">
                      {messaging.relativeLabel(concern.reportedAt, now)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card as="section" padding="small" className="h-full">
            <PanelHeading title="Ride Requests" />
            {rides.length === 0 ? (
              <p className="text-body-sm text-fg-muted">No ride requests.</p>
            ) : (
              <ul className="divide-y divide-line-subtle">
                {rides.map(({ record, request, appointment }) => (
                  <li
                    key={request.id}
                    className="flex items-center gap-inline-lg py-inset-xs first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-label-lg text-fg">
                        {record.memberName}
                      </p>
                      <p className="text-body-sm text-fg-secondary">
                        {appointment
                          ? `${appointment.title} · ${formatDay(appointment.date)}, ${formatTime(appointment.time)}`
                          : "Appointment removed"}
                      </p>
                    </div>
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="fill-stroke"
                      onClick={() =>
                        store.arrangeTransport(record.mrn, request.id)
                      }
                    >
                      <Check aria-hidden="true" />
                      Mark arranged
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        {selected && open ? (
          <PatientModal
            key={`${selected.mrn}-${open.tab}`}
            record={selected}
            store={store}
            initialTab={open.tab}
            onSchedule={() => {
              setScheduling(selected.mrn);
              setOpen(null);
            }}
            onClose={() => setOpen(null)}
          />
        ) : null}

        {scheduling !== null ? (
          <ScheduleModal
            records={records}
            store={store}
            initialMrn={scheduling || records[0]?.mrn || ""}
            onClose={() => setScheduling(null)}
          />
        ) : null}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <PageTitle
        href={HREF}
        action={
          <div className="flex flex-wrap items-center gap-inline-md">
            <UpdatedBar
              updatedAt={store.updatedAt}
              isFetching={store.isFetching}
              refetch={store.refetch}
            />
            <Button
              size="small"
              onClick={() => setScheduling("")}
              disabled={records.length === 0}
            >
              <CalendarPlus aria-hidden="true" />
              Schedule Appointment
            </Button>
          </div>
        }
      />
      {body}
    </div>
  );
}
