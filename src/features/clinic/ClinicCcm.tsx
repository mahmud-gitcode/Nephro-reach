"use client";

import React, { useMemo, useState } from "react";
import { Check, Download, Eye, Plus, Search } from "lucide-react";
import {
  AlertTriangleSolid,
  CheckCircleSolid,
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
  Progress,
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
  Textarea,
  type BadgeTone,
  type ProgressTone,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useNow } from "@/lib/utils/useNow";
import * as messaging from "@/features/messaging/messaging.rules";
import {
  ACTIVITY_TYPES,
  ALL,
  CARE_MANAGERS,
  CCM_PATIENTS,
  CCM_REQUIREMENTS,
  CCM_STATUSES,
  CCM_THRESHOLD_MINUTES,
  OUTCOMES,
  PROVIDERS,
  STAFF,
  activitiesFor,
  ageOn,
  countStatus,
  dayKey,
  durationMinutes,
  filterWorklist,
  followUpsDue,
  formatTime,
  monthLabel,
  openFollowUps,
  openInbox,
  recentMonths,
  requirementFor,
  usDate,
  worklist,
  worklistCsv,
  type CcmStatus,
  type WorklistFilters,
  type WorklistRow,
} from "./ccm.data";
import { tableIconButton } from "./tableButton";
import { UpdatedBar } from "./UpdatedBar";
import { useCcm, type CcmStore } from "./useCcm";

/* ==========================================================================
   Chronic Care Management
   --------------------------------------------------------------------------
   The office's month at a glance: who has reached the 30-minute threshold,
   who is short, and who needs attention today. A patient opens in a popup
   with their requirements, the month's logged time, and follow-ups.
   ========================================================================== */

const HREF = "/dashboard/clinic/ccm";

const statusTone: Record<CcmStatus, BadgeTone> = {
  "Needs Attention": "danger",
  "Below Threshold": "warning",
  "Threshold Reached": "success",
};

const statusBar: Record<CcmStatus, ProgressTone> = {
  "Needs Attention": "danger",
  "Below Threshold": "warning",
  "Threshold Reached": "success",
};

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

function StatusBadge({ row }: { row: WorklistRow }) {
  const label =
    row.status === "Below Threshold"
      ? `${row.remaining} min remaining`
      : row.status;
  return <Badge tone={statusTone[row.status]}>{label}</Badge>;
}

function NameButton({
  row,
  onOpen,
}: {
  row: { name: string; mrn: string };
  onOpen: (mrn: string) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => onOpen(row.mrn)}
        className={cn(
          "cursor-pointer rounded-control-small text-left hover:text-fg-brand hover:underline",
          focusRing,
        )}
      >
        {row.name}
      </button>
      <span className="block text-caption font-normal text-fg-muted tabular-nums">
        MRN {row.mrn}
      </span>
    </>
  );
}

function downloadCsv(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/* -------------------------------------------------------------- worklist */

function Worklist({
  rows,
  month,
  onOpen,
}: {
  rows: WorklistRow[];
  month: string;
  onOpen: (mrn: string) => void;
}) {
  const [filters, setFilters] = useState<WorklistFilters>({
    query: "",
    provider: ALL,
    careManager: ALL,
    status: ALL,
  });
  const shown = useMemo(() => filterWorklist(rows, filters), [rows, filters]);
  const set = (change: Partial<WorklistFilters>) =>
    setFilters((current) => ({ ...current, ...change }));

  return (
    <>
      <div className="mb-stack-lg flex flex-col gap-inline-md lg:flex-row lg:items-center">
        <Input
          type="search"
          inputSize="small"
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
          placeholder="Search by name, MRN or DOB..."
          aria-label="Search patients"
          leadingIcon={<Search aria-hidden="true" />}
          className="lg:max-w-64 lg:flex-1"
        />
        <Select
          selectSize="small"
          aria-label="Provider"
          value={filters.provider}
          onChange={(e) => set({ provider: e.target.value })}
          className="lg:w-44"
        >
          <option value={ALL}>All Providers</option>
          {PROVIDERS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
        <Select
          selectSize="small"
          aria-label="Care manager"
          value={filters.careManager}
          onChange={(e) => set({ careManager: e.target.value })}
          className="lg:w-48"
        >
          <option value={ALL}>All Care Managers</option>
          {CARE_MANAGERS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
        <Select
          selectSize="small"
          aria-label="CCM status"
          value={filters.status}
          onChange={(e) => set({ status: e.target.value })}
          className="lg:w-48"
        >
          <option value={ALL}>All Statuses</option>
          {CCM_STATUSES.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
        <Button
          size="small"
          variant="neutral"
          appearance="fill-stroke"
          className="lg:ml-auto"
          disabled={shown.length === 0}
          onClick={() =>
            downloadCsv(`ccm-worklist-${month}.csv`, worklistCsv(shown, month))
          }
        >
          <Download aria-hidden="true" />
          Export
        </Button>
      </div>

      <div className="overflow-hidden rounded-control border border-line">
        <Table minWidth={960}>
          <TableHead className="bg-surface-sunken">
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>DOB</TableHeaderCell>
              <TableHeaderCell>Conditions</TableHeaderCell>
              <TableHeaderCell>Minutes</TableHeaderCell>
              <TableHeaderCell>Requirements</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Last Activity</TableHeaderCell>
              <TableHeaderCell>Next Follow-Up</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.length === 0 ? (
              <TableEmptyRow colSpan={9}>
                No patients match these filters.
              </TableEmptyRow>
            ) : (
              shown.map((row) => (
                <TableRow key={row.mrn}>
                  <TableCell emphasis className="whitespace-nowrap">
                    <NameButton row={row} onOpen={onOpen} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {usDate(row.dob)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {row.conditions.join(", ")}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-inline-md">
                      <Progress
                        value={row.minutes}
                        max={CCM_THRESHOLD_MINUTES}
                        tone={statusBar[row.status]}
                        size="small"
                        label={`${row.name} minutes`}
                        className="w-16"
                      />
                      <span className="whitespace-nowrap tabular-nums">
                        {row.minutes} / {CCM_THRESHOLD_MINUTES}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {row.met} / {CCM_REQUIREMENTS.length}
                  </TableCell>
                  <TableCell>
                    <StatusBadge row={row} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {row.lastActivity ? usDate(row.lastActivity) : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {row.nextFollowUp ? usDate(row.nextFollowUp) : "—"}
                  </TableCell>
                  <TableCell>
                    <span className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => onOpen(row.mrn)}
                        className={iconControl}
                        aria-label={`Open ${row.name}`}
                        title="Open"
                      >
                        <Eye aria-hidden="true" />
                      </button>
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function InboxTable({
  store,
  onOpen,
}: {
  store: CcmStore;
  onOpen: (mrn: string) => void;
}) {
  const now = useNow();
  const items = openInbox(store.state);
  return (
    <div className="overflow-hidden rounded-control border border-line">
      <Table minWidth={720}>
        <TableHead className="bg-surface-sunken">
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Detail</TableHeaderCell>
            <TableHeaderCell>Received</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 ? (
            <TableEmptyRow colSpan={5}>The inbox is clear.</TableEmptyRow>
          ) : (
            items.map((item) => {
              const patient = CCM_PATIENTS.find((p) => p.mrn === item.mrn);
              return (
                <TableRow key={item.id}>
                  <TableCell emphasis className="whitespace-nowrap">
                    <NameButton
                      row={{
                        name: patient?.name ?? `MRN ${item.mrn}`,
                        mrn: item.mrn,
                      }}
                      onOpen={onOpen}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {item.kind}
                  </TableCell>
                  <TableCell>{item.text}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {messaging.relativeLabel(item.receivedAt, now)}
                  </TableCell>
                  <TableCell>
                    <span className="flex justify-end">
                      <Button
                        size="small"
                        variant="neutral"
                        appearance="fill-stroke"
                        onClick={() => store.resolveInbox(item.id)}
                      >
                        <Check aria-hidden="true" />
                        Resolve
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
  );
}

function FollowUpTable({
  store,
  today,
  onOpen,
}: {
  store: CcmStore;
  today: string;
  onOpen: (mrn: string) => void;
}) {
  const rows = followUpsDue(store.state, today);
  return (
    <div className="overflow-hidden rounded-control border border-line">
      <Table minWidth={720}>
        <TableHead className="bg-surface-sunken">
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Task</TableHeaderCell>
            <TableHeaderCell>Assigned To</TableHeaderCell>
            <TableHeaderCell>Due</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmptyRow colSpan={5}>
              No follow-ups due this week.
            </TableEmptyRow>
          ) : (
            rows.map(({ activity, followUp }) => {
              const patient = CCM_PATIENTS.find((p) => p.mrn === activity.mrn);
              const overdue = followUp.date < today;
              return (
                <TableRow key={activity.id}>
                  <TableCell emphasis className="whitespace-nowrap">
                    <NameButton
                      row={{
                        name: patient?.name ?? `MRN ${activity.mrn}`,
                        mrn: activity.mrn,
                      }}
                      onOpen={onOpen}
                    />
                  </TableCell>
                  <TableCell>{followUp.task}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {followUp.assignee}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {usDate(followUp.date)}
                    {overdue ? (
                      <Badge tone="danger" className="ml-inline-sm">
                        Overdue
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <span className="flex justify-end">
                      <Button
                        size="small"
                        variant="neutral"
                        appearance="fill-stroke"
                        onClick={() => store.completeFollowUp(activity.id)}
                      >
                        <Check aria-hidden="true" />
                        Done
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
  );
}

/* ---------------------------------------------------------- activity form */

type EntryMode = "times" | "minutes";

function ActivityForm({
  mrn,
  store,
  today,
  onDone,
}: {
  mrn: string;
  store: CcmStore;
  today: string;
  onDone: () => void;
}) {
  const [type, setType] = useState<string>(ACTIVITY_TYPES[0]);
  const [date, setDate] = useState(today);
  const [mode, setMode] = useState<EntryMode>("times");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [typedMinutes, setTypedMinutes] = useState("");
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState<string>(OUTCOMES[0]);
  const [staff, setStaff] = useState<string>(STAFF[0]);
  const [needsFollowUp, setNeedsFollowUp] = useState<"yes" | "no">("no");
  const [followDate, setFollowDate] = useState("");
  const [assignee, setAssignee] = useState<string>(STAFF[1]);
  const [task, setTask] = useState("");
  const [tried, setTried] = useState(false);

  const minutes =
    mode === "times" ? durationMinutes(start, end) : Number(typedMinutes) || 0;

  const errors = {
    date: !date || date > today ? "Pick a date on or before today" : null,
    time:
      mode === "times" && minutes <= 0
        ? "End time must be after start time"
        : null,
    minutes:
      mode === "minutes" && (minutes < 1 || minutes > 240)
        ? "Enter 1 to 240 minutes"
        : null,
    note: note.trim() === "" ? "Describe what was done" : null,
    followDate:
      needsFollowUp === "yes" && (!followDate || followDate < date)
        ? "Pick a follow-up date"
        : null,
    task: needsFollowUp === "yes" && task.trim() === "" ? "Add the task" : null,
  };
  const valid = Object.values(errors).every((error) => error === null);
  const show = (error: string | null) =>
    tried ? (error ?? undefined) : undefined;

  function save() {
    setTried(true);
    if (!valid) return;
    store.addActivity({
      mrn,
      type,
      date,
      minutes,
      ...(mode === "times" ? { start, end } : {}),
      note: note.trim(),
      outcome,
      staff,
      ...(needsFollowUp === "yes"
        ? {
            followUp: {
              date: followDate,
              assignee,
              task: task.trim(),
              done: false,
            },
          }
        : {}),
    });
    onDone();
  }

  return (
    <section
      aria-label="Add CCM activity"
      className="mb-stack-lg space-y-stack-md rounded-control border border-line bg-surface-sunken p-inset-md"
    >
      <h3 className="text-heading-5 text-fg">Add CCM Activity</h3>
      <div className="grid gap-stack-md sm:grid-cols-2">
        <FormField label="Activity Type" required>
          {(field) => (
            <Select
              {...field}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {ACTIVITY_TYPES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField label="Date" required error={show(errors.date)}>
          {(field) => (
            <Input
              {...field}
              type="date"
              max={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          )}
        </FormField>
      </div>

      <SegmentedChoice
        label="Time"
        value={mode}
        onChange={(next: EntryMode) => setMode(next)}
        options={[
          { value: "times", label: "Start / End Time" },
          { value: "minutes", label: "Enter Minutes" },
        ]}
      />

      {mode === "times" ? (
        <div className="grid gap-stack-md sm:grid-cols-3">
          <FormField label="Start Time" required error={show(errors.time)}>
            {(field) => (
              <Input
                {...field}
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            )}
          </FormField>
          <FormField label="End Time" required>
            {(field) => (
              <Input
                {...field}
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            )}
          </FormField>
          <div className="space-y-1.5">
            <span className="block text-label-md text-fg-secondary">
              Duration
            </span>
            <p className="flex h-11 items-center rounded-control border border-line bg-surface px-inset-sm text-body-md text-fg tabular-nums">
              {minutes} minutes
            </p>
          </div>
        </div>
      ) : (
        <FormField
          label="Minutes"
          required
          error={show(errors.minutes)}
          className="sm:max-w-48"
        >
          {(field) => (
            <Input
              {...field}
              type="number"
              inputMode="numeric"
              min={1}
              max={240}
              value={typedMinutes}
              onChange={(e) => setTypedMinutes(e.target.value)}
            />
          )}
        </FormField>
      )}

      <FormField label="What was done?" required error={show(errors.note)}>
        {(field) => (
          <Textarea
            {...field}
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        )}
      </FormField>

      <div className="grid gap-stack-md sm:grid-cols-2">
        <FormField label="Outcome" required>
          {(field) => (
            <Select
              {...field}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            >
              {OUTCOMES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField label="Staff" required>
          {(field) => (
            <Select
              {...field}
              value={staff}
              onChange={(e) => setStaff(e.target.value)}
            >
              {STAFF.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
          )}
        </FormField>
      </div>

      <SegmentedChoice
        label="Follow-up required?"
        value={needsFollowUp}
        onChange={(next: "yes" | "no") => setNeedsFollowUp(next)}
        options={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ]}
      />

      {needsFollowUp === "yes" ? (
        <div className="grid gap-stack-md sm:grid-cols-3">
          <FormField
            label="Follow-up Date"
            required
            error={show(errors.followDate)}
          >
            {(field) => (
              <Input
                {...field}
                type="date"
                min={date}
                value={followDate}
                onChange={(e) => setFollowDate(e.target.value)}
              />
            )}
          </FormField>
          <FormField label="Assign To" required>
            {(field) => (
              <Select
                {...field}
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              >
                {STAFF.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField label="Task" required error={show(errors.task)}>
            {(field) => (
              <Input
                {...field}
                value={task}
                onChange={(e) => setTask(e.target.value)}
              />
            )}
          </FormField>
        </div>
      ) : null}

      <div className="flex justify-end gap-inline-md">
        <Button
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          onClick={onDone}
        >
          Cancel
        </Button>
        <Button size="small" onClick={save}>
          Save Activity
        </Button>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- patient modal */

type PatientTab = "overview" | "activity" | "followups";

function RequirementRow({
  store,
  mrn,
  id,
  label,
}: {
  store: CcmStore;
  mrn: string;
  id: (typeof CCM_REQUIREMENTS)[number]["id"];
  label: string;
}) {
  const current = requirementFor(store.state, mrn, id);
  return (
    <TableRow>
      <TableCell className="w-10">
        <input
          type="checkbox"
          checked={current.met}
          onChange={(e) =>
            store.setRequirement(mrn, id, { met: e.target.checked })
          }
          aria-label={label}
          className="h-4 w-4 cursor-pointer accent-brand-600"
        />
      </TableCell>
      <TableCell>{label}</TableCell>
      <TableCell>
        <Badge tone={current.met ? "success" : "neutral"}>
          {current.met ? "Complete" : "Missing"}
        </Badge>
      </TableCell>
      <TableCell className="min-w-48">
        <Input
          key={current.detail}
          inputSize="small"
          defaultValue={current.detail}
          aria-label={`Details: ${label}`}
          onBlur={(e) => {
            const detail = e.target.value.trim();
            if (detail !== current.detail)
              store.setRequirement(mrn, id, { detail });
          }}
        />
      </TableCell>
    </TableRow>
  );
}

function PatientModal({
  row,
  store,
  month,
  today,
  onClose,
}: {
  row: WorklistRow;
  store: CcmStore;
  month: string;
  today: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<PatientTab>("overview");
  const [adding, setAdding] = useState(false);
  const activities = activitiesFor(store.state, row.mrn, month);
  const followUps = openFollowUps(store.state, row.mrn);
  const alerts = openInbox(store.state, row.mrn);

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={row.name}
      description={`MRN ${row.mrn} · DOB ${usDate(row.dob)} (${ageOn(row.dob, today)} y/o) · ${row.conditions.join(", ")}`}
    >
      <Tabs
        label="Patient CCM"
        value={tab}
        onChange={setTab}
        className="mb-stack-lg"
        items={[
          { id: "overview", label: "Overview" },
          { id: "activity", label: "Activity & Time" },
          {
            id: "followups",
            label:
              followUps.length > 0
                ? `Follow-Up / Tasks (${followUps.length})`
                : "Follow-Up / Tasks",
          },
        ]}
      />

      <TabPanel id="overview" value={tab} className="space-y-stack-lg">
        <section className="rounded-control border border-line p-inset-md">
          <div className="flex flex-wrap items-center justify-between gap-inline-md">
            <h3 className="text-heading-5 text-fg">{monthLabel(month)}</h3>
            <StatusBadge row={row} />
          </div>
          <p className="mt-stack-sm text-metric-md text-fg tabular-nums">
            {row.minutes}
            <span className="text-heading-5 text-fg-muted">
              {" "}
              / {CCM_THRESHOLD_MINUTES} minutes
            </span>
          </p>
          <Progress
            value={row.minutes}
            max={CCM_THRESHOLD_MINUTES}
            tone={statusBar[row.status]}
            size="medium"
            label="Monthly CCM minutes"
            className="mt-stack-sm"
          />
          {row.minutes >= CCM_THRESHOLD_MINUTES ? (
            <p className="mt-stack-sm text-body-sm text-fg-secondary">
              Threshold reached — documentation review required.
            </p>
          ) : null}
        </section>

        {alerts.length > 0 ? (
          <Alert tone="danger" title="Needs attention">
            {alerts.map((item) => `${item.kind}: ${item.text}`).join(" · ")}
          </Alert>
        ) : null}

        <section>
          <div className="mb-stack-sm flex flex-wrap items-baseline justify-between gap-inline-md">
            <h3 className="text-heading-5 text-fg">CCM Requirements</h3>
            <span className="text-caption text-fg-muted">
              Tracking only — documentation stays in the practice EHR
            </span>
          </div>
          <div className="overflow-hidden rounded-control border border-line">
            <Table minWidth={640}>
              <TableHead className="bg-surface-sunken">
                <TableRow>
                  <TableHeaderCell className="w-10">
                    <span className="sr-only">Complete</span>
                  </TableHeaderCell>
                  <TableHeaderCell>Requirement</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Details</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {CCM_REQUIREMENTS.map((requirement) => (
                  <RequirementRow
                    key={requirement.id}
                    store={store}
                    mrn={row.mrn}
                    id={requirement.id}
                    label={requirement.label}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </TabPanel>

      <TabPanel id="activity" value={tab}>
        {adding ? (
          <ActivityForm
            mrn={row.mrn}
            store={store}
            today={today}
            onDone={() => setAdding(false)}
          />
        ) : (
          <div className="mb-stack-md flex justify-end">
            <Button size="small" onClick={() => setAdding(true)}>
              <Plus aria-hidden="true" />
              Add Activity
            </Button>
          </div>
        )}

        <div className="overflow-hidden rounded-control border border-line">
          <Table minWidth={720}>
            <TableHead className="bg-surface-sunken">
              <TableRow>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Activity</TableHeaderCell>
                <TableHeaderCell>Staff</TableHeaderCell>
                <TableHeaderCell className="text-right">
                  Minutes
                </TableHeaderCell>
                <TableHeaderCell>Outcome</TableHeaderCell>
                <TableHeaderCell>Follow-Up</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities.length === 0 ? (
                <TableEmptyRow colSpan={6}>
                  No activity logged in {monthLabel(month)}.
                </TableEmptyRow>
              ) : (
                <>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        {usDate(activity.date)}
                        {activity.start && activity.end ? (
                          <span className="block text-caption text-fg-muted">
                            {formatTime(activity.start)} –{" "}
                            {formatTime(activity.end)}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell emphasis>
                        {activity.type}
                        <span className="block text-caption font-normal text-fg-muted">
                          {activity.note}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {activity.staff}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {activity.minutes}
                      </TableCell>
                      <TableCell>{activity.outcome}</TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        {activity.followUp
                          ? usDate(activity.followUp.date)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-surface-sunken">
                    <TableCell emphasis colSpan={3}>
                      {monthLabel(month)} Total
                    </TableCell>
                    <TableCell emphasis className="text-right tabular-nums">
                      {row.minutes}
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </TabPanel>

      <TabPanel id="followups" value={tab}>
        {followUps.length === 0 ? (
          <EmptyState variant="bare" title="No open follow-ups" />
        ) : (
          <ul className="divide-y divide-line-subtle">
            {followUps.map(({ activity, followUp }) => (
              <li
                key={activity.id}
                className="flex items-center gap-inline-lg py-inset-xs first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-label-lg text-fg">{followUp.task}</p>
                  <p className="text-body-sm text-fg-secondary">
                    {followUp.assignee} · due {usDate(followUp.date)}
                    {followUp.date < today ? (
                      <Badge tone="danger" className="ml-inline-sm">
                        Overdue
                      </Badge>
                    ) : null}
                  </p>
                </div>
                <Button
                  size="small"
                  variant="neutral"
                  appearance="fill-stroke"
                  onClick={() => store.completeFollowUp(activity.id)}
                >
                  <Check aria-hidden="true" />
                  Done
                </Button>
              </li>
            ))}
          </ul>
        )}
      </TabPanel>
    </Modal>
  );
}

/* ------------------------------------------------------------------ page */

type PageTab = "worklist" | "inbox" | "followups";

function PageSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} height={132} className="rounded-card" />
        ))}
      </div>
      <Skeleton height={560} className="rounded-card" />
    </div>
  );
}

export default function ClinicCcm() {
  const store = useCcm();
  const now = useNow();
  const today = dayKey(now);
  const months = recentMonths(now);
  const [month, setMonth] = useState(months[0]);
  const [tab, setTab] = useState<PageTab>("worklist");
  const [openMrn, setOpenMrn] = useState<string | null>(null);

  const rows = useMemo(
    () => worklist(store.state, CCM_PATIENTS, month, today),
    [store.state, month, today],
  );
  const inboxCount = openInbox(store.state).length;
  const dueCount = followUpsDue(store.state, today).length;
  const openRow = rows.find((row) => row.mrn === openMrn) ?? null;

  let body: React.ReactNode;
  if (store.error) {
    body = (
      <ErrorState
        title="CCM data could not be loaded"
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
          aria-label="CCM summary"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <KeyCard
            tone="brand"
            icon={<UsersSolid />}
            value={rows.length}
            label="Active CCM Patients"
          />
          <KeyCard
            tone="danger"
            icon={<AlertTriangleSolid />}
            value={countStatus(rows, "Needs Attention")}
            label="Needs Attention"
          />
          <KeyCard
            tone="warning"
            icon={<ClockSolid />}
            value={countStatus(rows, "Below Threshold")}
            label={`Below ${CCM_THRESHOLD_MINUTES} Minutes`}
          />
          <KeyCard
            tone="success"
            icon={<CheckCircleSolid />}
            value={countStatus(rows, "Threshold Reached")}
            label="Threshold Reached"
          />
        </section>

        <Card as="section" padding="small" className="min-w-0">
          <Tabs
            label="CCM views"
            value={tab}
            onChange={setTab}
            className="mb-stack-lg"
            items={[
              { id: "worklist", label: "Patient Worklist" },
              {
                id: "inbox",
                label:
                  inboxCount > 0 ? `CCM Inbox (${inboxCount})` : "CCM Inbox",
              },
              {
                id: "followups",
                label:
                  dueCount > 0
                    ? `Follow-Up Due (${dueCount})`
                    : "Follow-Up Due",
              },
            ]}
          />
          <TabPanel id="worklist" value={tab}>
            <Worklist rows={rows} month={month} onOpen={setOpenMrn} />
          </TabPanel>
          <TabPanel id="inbox" value={tab}>
            <InboxTable store={store} onOpen={setOpenMrn} />
          </TabPanel>
          <TabPanel id="followups" value={tab}>
            <FollowUpTable store={store} today={today} onOpen={setOpenMrn} />
          </TabPanel>
        </Card>

        {openRow ? (
          <PatientModal
            row={openRow}
            store={store}
            month={month}
            today={today}
            onClose={() => setOpenMrn(null)}
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
            <Select
              selectSize="small"
              aria-label="Month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-48"
            >
              {months.map((option) => (
                <option key={option} value={option}>
                  {monthLabel(option)}
                </option>
              ))}
            </Select>
          </div>
        }
      />
      {body}
    </div>
  );
}
