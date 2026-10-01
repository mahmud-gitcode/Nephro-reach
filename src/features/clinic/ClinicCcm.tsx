"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  ChevronDown,
  Circle,
  CircleCheck,
  CircleAlert,
  Clock,
  Download,
  ListChecks,
  Pause,
  Pencil,
  Play,
  Plus,
  ShieldCheck,
} from "lucide-react";
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
  Breakdown,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  KeyCard,
  Modal,
  menuStyles,
  Progress,
  SearchField,
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
  TableThumb,
  Tabs,
  TabPanel,
  Textarea,
  type BadgeTone,
  type ProgressTone,
  type SeriesTone,
  type SortDirection,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useNow } from "@/lib/utils/useNow";
import { useDismiss } from "@/lib/utils/useDismiss";
import * as messaging from "@/features/messaging/messaging.rules";
import {
  ACTIVITY_TYPES,
  ALERT_ACTIVITY,
  ALL,
  CARE_MANAGERS,
  CCM_PATIENTS,
  CCM_REQUIREMENTS,
  CCM_STATUSES,
  CCM_THRESHOLD_MINUTES,
  COUNTS_LABEL,
  LOCATIONS,
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
  pendingMinutesFor,
  recentMonths,
  requirementFor,
  requirementStatus,
  sortWorklist,
  usDate,
  worklist,
  withFeed,
  worklistCsv,
  ccmPatientsOf,
  type CcmPatient,
  type CcmStatus,
  type CountsToward,
  type RequirementStatus,
  type WorklistFilters,
  type WorklistRow,
  type WorklistSort,
} from "./ccm.data";
import { checkInTone, recentCheckIns, type CheckInRow } from "./checkIns.data";
import { patients as roster } from "./enrollment.data";
import { defaultClinicSettings } from "./settings.data";
import { LINKED_MEMBER } from "./memberFeed";
import { UpdatedBar } from "./UpdatedBar";
import { useCcm, type CcmStore } from "./useCcm";
import { useMemberFeed } from "./useMemberFeed";
import { useClinicData } from "./useClinicData";
import { useCan } from "@/features/staff/useStaffAccounts";
import { ConditionSelect } from "./ConditionSelect";
import { ConditionLibraryModal } from "./ConditionLibraryModal";
import { useConditionLibrary } from "./useConditionLibrary";
import {
  CONDITION_GROUPS,
  chronicCount,
  conditionSummary,
  sortedConditions,
  type CcmCondition,
} from "./ccmConditions";

/* ==========================================================================
   Chronic Care Management
   --------------------------------------------------------------------------
   The office's month at a glance: who is ready for the practice's review,
   who is short of the 30-minute threshold, and who needs attention today.
   A patient opens in a popup with their checklist, the month's logged time,
   check-ins, education, EHR documentation and follow-ups.

   Tracking only. Practice staff enter the activities; the practice decides
   what counts for billing; the clinical note stays in its EHR. NephroReach
   records time and makes no medical decisions.
   ========================================================================== */

const HREF = "/dashboard/clinic/ccm";
const PRACTICE = defaultClinicSettings().profile.name;

const statusTone: Record<CcmStatus, BadgeTone> = {
  "Action Needed": "danger",
  "Below Threshold": "warning",
  "Ready for Review": "success",
};

const statusBar: Record<CcmStatus, ProgressTone> = {
  "Action Needed": "danger",
  "Below Threshold": "warning",
  "Ready for Review": "success",
};

const statusChart: Record<CcmStatus, SeriesTone> = {
  "Ready for Review": "success",
  "Below Threshold": "warning",
  "Action Needed": "danger",
};

const requirementLabel: Record<RequirementStatus, string> = {
  complete: "Complete",
  "in-progress": "In Progress",
  missing: "Missing",
};

const REQUIRED = CCM_REQUIREMENTS.length;

function StatusBadge({ row }: { row: WorklistRow }) {
  const label =
    row.status === "Below Threshold"
      ? `${row.remaining} min remaining`
      : row.status;
  return <Badge tone={statusTone[row.status]}>{label}</Badge>;
}

/* The checklist at a glance: all done, a gap or two, or most still open. */
function ChecklistCount({ met }: { met: number }) {
  const missing = REQUIRED - met;
  const [Icon, tone] =
    missing === 0
      ? [CircleCheck, "text-success"]
      : missing <= 2
        ? [Clock, "text-warning-glyph"]
        : [CircleAlert, "text-danger"];
  return (
    <span className="inline-flex items-center gap-inline-sm tabular-nums">
      <Icon aria-hidden="true" className={cn("size-4 shrink-0", tone)} />
      {met} / {REQUIRED}
    </span>
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

/** A check-in row's patient, matched on "John D." → "John D. Smith". */
function checkInsFor(rows: CheckInRow[], name: string): CheckInRow[] {
  return rows.filter((row) => name.startsWith(row.name));
}

/* The demo patients' check-ins, fixed; the linked member's come from their
   own app (useMemberFeed) and are added in the page. */
const demoCheckIns = recentCheckIns.filter((row) =>
  CCM_PATIENTS.some((patient) => patient.name.startsWith(row.name)),
);

/* -------------------------------------------------------------- overview */

/* How the enrolled patients split by status: one slim bar under the stat
   row, so the four figures above keep a row of their own. */
function StatusSplit({ rows }: { rows: WorklistRow[] }) {
  const order: CcmStatus[] = [
    "Ready for Review",
    "Below Threshold",
    "Action Needed",
  ];
  return (
    <Card as="section" padding="small">
      <h2 className="mb-stack-lg text-heading-4 text-fg">
        CCM Status
        <span className="text-body-sm text-fg-muted">
          {" "}
          · {rows.length} enrolled patients
        </span>
      </h2>
      <Breakdown
        label="Enrolled CCM patients by status"
        items={order.map((status) => ({
          label: status,
          value: countStatus(rows, status),
          tone: statusChart[status],
        }))}
      />
    </Card>
  );
}

/* -------------------------------------------------------------- worklist */

function SortHeader({
  children,
  column,
  sort,
  onSort,
}: {
  children: React.ReactNode;
  column: WorklistSort["key"];
  sort: WorklistSort;
  onSort: (column: WorklistSort["key"]) => void;
}) {
  const direction: SortDirection = sort.key === column ? sort.direction : null;
  return (
    <TableHeaderCell onSort={() => onSort(column)} sortDirection={direction}>
      {children}
    </TableHeaderCell>
  );
}

function WorklistFiltersBar({
  filters,
  onChange,
  onExport,
  canExport,
  library,
  onManageLibrary,
}: {
  filters: WorklistFilters;
  onChange: (change: Partial<WorklistFilters>) => void;
  onExport: () => void;
  canExport: boolean;
  library: CcmCondition[];
  /** Absent unless the signed-in role manages the clinic's settings. */
  onManageLibrary?: () => void;
}) {
  return (
    <div className="flex flex-col gap-inline-md px-card pb-stack-lg lg:flex-row lg:flex-wrap lg:items-center">
      <SearchField
        label="Search patients"
        placeholder="Search by name, MRN or DOB…"
        value={filters.query}
        onChange={(e) => onChange({ query: e.target.value })}
        className="lg:w-64"
      />
      <Select
        selectSize="small"
        aria-label="Provider"
        value={filters.provider}
        onChange={(e) => onChange({ provider: e.target.value })}
      >
        <option value={ALL}>All Providers</option>
        {PROVIDERS.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </Select>
      <Select
        selectSize="small"
        aria-label="Location"
        value={filters.location}
        onChange={(e) => onChange({ location: e.target.value })}
      >
        <option value={ALL}>All Locations</option>
        {LOCATIONS.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </Select>
      <Select
        selectSize="small"
        aria-label="Care manager"
        value={filters.careManager}
        onChange={(e) => onChange({ careManager: e.target.value })}
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
        onChange={(e) => onChange({ status: e.target.value })}
      >
        <option value={ALL}>All Statuses</option>
        {CCM_STATUSES.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </Select>
      <Select
        selectSize="small"
        aria-label="Condition"
        value={filters.condition ?? ALL}
        onChange={(e) => onChange({ condition: e.target.value })}
      >
        <option value={ALL}>All Conditions</option>
        {CONDITION_GROUPS.map((group) => (
          <optgroup key={group} label={group}>
            {library
              .filter((c) => c.group === group && c.active)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
          </optgroup>
        ))}
      </Select>
      <span className="flex flex-wrap items-center gap-inline-md lg:ml-auto">
        {onManageLibrary ? (
          <Button
            size="small"
            variant="neutral"
            appearance="ghost"
            onClick={onManageLibrary}
            leadingIcon={<ListChecks aria-hidden="true" />}
          >
            Condition Library
          </Button>
        ) : null}
        <Button
          size="small"
          variant="neutral"
          appearance="fill-stroke"
          disabled={!canExport}
          onClick={onExport}
          leadingIcon={<Download aria-hidden="true" />}
        >
          Export
        </Button>
      </span>
    </div>
  );
}

/** "CKD 4 · HTN +2 ▾": the two that matter most and how many more, as a
 *  dropdown that opens the patient's whole list (client, 2026-10-01:
 *  conditions are a dropdown per patient). The list is fixed to the
 *  viewport so the table's scroll box never clips it. */
function ConditionsCell({
  values,
  library,
  patient,
}: {
  values: string[];
  library: CcmCondition[];
  patient: string;
}) {
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);
  const close = useCallback(() => setAt(null), []);
  const wrapRef = useDismiss<HTMLDivElement>(at !== null, close);
  useEffect(() => {
    if (!at) return;
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [at, close]);

  const summary = conditionSummary(values, library);
  if (!summary.text) return <span className="text-fg-muted">—</span>;
  const all = sortedConditions(values, library);
  return (
    <div ref={wrapRef} className="inline-block">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={at !== null}
        aria-label={`${patient}'s conditions: ${summary.full}`}
        onClick={(e) => {
          if (at) return close();
          const box = e.currentTarget.getBoundingClientRect();
          setAt({ top: box.bottom + 4, left: box.left });
        }}
        className={cn(
          "inline-flex min-h-10 cursor-pointer items-center gap-inline-sm rounded-control px-inset-xs text-left",
          "transition-colors duration-150 ease-standard hover:bg-surface-sunken",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        )}
      >
        <span>{summary.text}</span>
        {summary.more > 0 ? (
          <Badge tone="neutral">+{summary.more}</Badge>
        ) : null}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-fg-muted transition-transform duration-150 ease-standard",
            at && "rotate-180",
          )}
        />
      </button>
      {at ? (
        <div
          className={cn(menuStyles, "fixed mt-0 w-72 max-w-[calc(100vw-2rem)]")}
          style={{ top: at.top, left: at.left }}
        >
          <p className="px-3 pt-1 pb-2 text-label-sm text-fg-muted">
            Chronic Conditions ({all.length})
          </p>
          <ul className="max-h-72 overflow-y-auto">
            {all.map((condition) => (
              <li
                key={condition.value}
                className="flex items-center justify-between gap-inline-md rounded-control px-3 py-2 text-body-sm text-fg"
              >
                <span>
                  {condition.label}
                  {condition.other ? " (Other)" : ""}
                </span>
                {condition.other ? null : (
                  <span className="shrink-0 text-caption text-fg-muted">
                    {condition.short}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Worklist({
  rows,
  month,
  library,
  onManageLibrary,
  onOpen,
}: {
  rows: WorklistRow[];
  month: string;
  library: CcmCondition[];
  onManageLibrary?: () => void;
  onOpen: (mrn: string) => void;
}) {
  const [filters, setFilters] = useState<WorklistFilters>({
    query: "",
    provider: ALL,
    location: ALL,
    careManager: ALL,
    status: ALL,
    condition: ALL,
  });
  const [sort, setSort] = useState<WorklistSort>({
    key: "name",
    direction: "asc",
  });
  const shown = useMemo(
    () => sortWorklist(filterWorklist(rows, filters, library), sort),
    [rows, filters, sort, library],
  );
  const onSort = (key: WorklistSort["key"]) =>
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));

  return (
    <>
      <WorklistFiltersBar
        filters={filters}
        onChange={(change) =>
          setFilters((current) => ({ ...current, ...change }))
        }
        canExport={shown.length > 0}
        onExport={() =>
          downloadCsv(
            `ccm-worklist-${month}.csv`,
            worklistCsv(shown, month, library),
          )
        }
        library={library}
        onManageLibrary={onManageLibrary}
      />

      <Table minWidth={1080}>
        <TableHead>
          <TableRow>
            <SortHeader column="name" sort={sort} onSort={onSort}>
              Patient
            </SortHeader>
            <TableHeaderCell>MRN</TableHeaderCell>
            <TableHeaderCell>Conditions</TableHeaderCell>
            <TableHeaderCell>This Month&rsquo;s Minutes</TableHeaderCell>
            <TableHeaderCell>Last Activity</TableHeaderCell>
            <TableHeaderCell>CCM Checklist</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <SortHeader column="nextFollowUp" sort={sort} onSort={onSort}>
              Next Follow-Up
            </SortHeader>
            <TableHeaderCell className="text-right">
              <span className="sr-only">Actions</span>
            </TableHeaderCell>
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
                  <span className="flex items-center gap-inline-md">
                    <TableThumb name={row.name} />
                    <span>
                      {row.name}
                      <span className="block text-caption font-normal text-fg-muted">
                        {row.location}
                      </span>
                    </span>
                  </span>
                </TableCell>
                <TableCell className="tabular-nums">{row.mrn}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <ConditionsCell
                    values={row.conditions}
                    library={library}
                    patient={row.name}
                  />
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-inline-md">
                    <span className="w-14 whitespace-nowrap tabular-nums">
                      {row.minutes} min
                    </span>
                    <Progress
                      value={row.minutes}
                      max={CCM_THRESHOLD_MINUTES}
                      tone={statusBar[row.status]}
                      size="small"
                      label={`${row.name}: ${row.minutes} of ${CCM_THRESHOLD_MINUTES} minutes`}
                      className="w-20"
                    />
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {row.lastActivity ? usDate(row.lastActivity) : "—"}
                </TableCell>
                <TableCell>
                  <ChecklistCount met={row.met} />
                </TableCell>
                <TableCell>
                  <StatusBadge row={row} />
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {row.nextFollowUp ? usDate(row.nextFollowUp) : "—"}
                </TableCell>
                <TableCell>
                  <span className="flex justify-end">
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="fill-stroke"
                      onClick={() => onOpen(row.mrn)}
                      aria-label={`Open ${row.name}`}
                    >
                      Open
                    </Button>
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </>
  );
}

function PatientCell({ mrn, name }: { mrn: string; name: string }) {
  return (
    <span className="flex items-center gap-inline-md">
      <TableThumb name={name} />
      <span>
        {name}
        <span className="block text-caption font-normal text-fg-muted tabular-nums">
          MRN {mrn}
        </span>
      </span>
    </span>
  );
}

function OpenButton({ name, onOpen }: { name: string; onOpen: () => void }) {
  return (
    <span className="flex justify-end">
      <Button
        size="small"
        variant="neutral"
        appearance="fill-stroke"
        onClick={onOpen}
        aria-label={`Open ${name}`}
      >
        Open
      </Button>
    </span>
  );
}

function CheckInsTable({
  rows: ccmCheckIns,
  patients,
  onOpen,
}: {
  rows: CheckInRow[];
  patients: CcmPatient[];
  onOpen: (mrn: string) => void;
}) {
  return (
    <Table minWidth={820}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Patient</TableHeaderCell>
          <TableHeaderCell>Date</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Notes</TableHeaderCell>
          <TableHeaderCell className="text-right">
            <span className="sr-only">Actions</span>
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {ccmCheckIns.length === 0 ? (
          <TableEmptyRow colSpan={5}>No check-ins this week.</TableEmptyRow>
        ) : (
          ccmCheckIns.map((row) => {
            const patient = patients.find((p) => p.name.startsWith(row.name));
            if (!patient) return null;
            return (
              <TableRow key={`${row.name}-${row.date}`}>
                <TableCell emphasis className="whitespace-nowrap">
                  <PatientCell mrn={patient.mrn} name={patient.name} />
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {row.date}
                </TableCell>
                <TableCell>
                  <Badge tone={checkInTone[row.status]}>{row.status}</Badge>
                </TableCell>
                <TableCell>{row.notes}</TableCell>
                <TableCell>
                  <OpenButton
                    name={patient.name}
                    onOpen={() => onOpen(patient.mrn)}
                  />
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
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
    <Table minWidth={820}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Patient</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Detail</TableHeaderCell>
          <TableHeaderCell>Received</TableHeaderCell>
          <TableHeaderCell className="text-right">
            <span className="sr-only">Actions</span>
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.length === 0 ? (
          <TableEmptyRow colSpan={5}>The inbox is clear.</TableEmptyRow>
        ) : (
          items.map((item) => {
            const patient = ccmPatientsOf(store.state).find(
              (p) => p.mrn === item.mrn,
            );
            const name = patient?.name ?? `MRN ${item.mrn}`;
            return (
              <TableRow key={item.id}>
                <TableCell emphasis className="whitespace-nowrap">
                  <PatientCell mrn={item.mrn} name={name} />
                </TableCell>
                <TableCell className="whitespace-nowrap">{item.kind}</TableCell>
                <TableCell>{item.text}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {messaging.relativeLabel(item.receivedAt, now)}
                </TableCell>
                <TableCell>
                  <span className="flex justify-end gap-inline-sm">
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="fill-stroke"
                      onClick={() => onOpen(item.mrn)}
                      aria-label={`Open ${name}`}
                    >
                      Open
                    </Button>
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="fill-stroke"
                      onClick={() => store.resolveInbox(item.id)}
                      leadingIcon={<Check aria-hidden="true" />}
                    >
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
    <Table minWidth={820}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Patient</TableHeaderCell>
          <TableHeaderCell>Task</TableHeaderCell>
          <TableHeaderCell>Assigned To</TableHeaderCell>
          <TableHeaderCell>Due</TableHeaderCell>
          <TableHeaderCell className="text-right">
            <span className="sr-only">Actions</span>
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableEmptyRow colSpan={5}>
            No follow-ups due this week.
          </TableEmptyRow>
        ) : (
          rows.map(({ activity, followUp }) => {
            const patient = ccmPatientsOf(store.state).find(
              (p) => p.mrn === activity.mrn,
            );
            const name = patient?.name ?? `MRN ${activity.mrn}`;
            return (
              <TableRow key={activity.id}>
                <TableCell emphasis className="whitespace-nowrap">
                  <PatientCell mrn={activity.mrn} name={name} />
                </TableCell>
                <TableCell>{followUp.task}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {followUp.assignee || "Unassigned"}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {usDate(followUp.date)}
                  {followUp.date < today ? (
                    <Badge tone="danger" className="ml-inline-sm">
                      Overdue
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell>
                  <span className="flex justify-end gap-inline-sm">
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="fill-stroke"
                      onClick={() => onOpen(activity.mrn)}
                      aria-label={`Open ${name}`}
                    >
                      Open
                    </Button>
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="fill-stroke"
                      onClick={() => store.completeFollowUp(activity.id)}
                      leadingIcon={<Check aria-hidden="true" />}
                    >
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
  );
}

/* ---------------------------------------------------------- activity form */

type EntryMode = "minutes" | "times";
type YesNo = "yes" | "no";

const YES_NO = [
  { value: "yes" as const, label: "Yes" },
  { value: "no" as const, label: "No" },
];

/* A stopwatch for time spent on a call: start it, stop it, and the minutes
   field is filled in, rounded up. */
function useStopwatch() {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (startedAt === null) return;
    const id = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [startedAt]);

  return {
    running: startedAt !== null,
    elapsed,
    start: () => {
      setElapsed(0);
      setStartedAt(Date.now());
    },
    /** Stops and returns whole minutes, at least 1. */
    stop: () => {
      const seconds = startedAt ? (Date.now() - startedAt) / 1000 : 0;
      setStartedAt(null);
      return Math.max(1, Math.ceil(seconds / 60));
    },
  };
}

function clock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** What an alert fills in when staff log time against it. */
type ActivityPrefill = { type: string; note: string };

function ActivityForm({
  mrn,
  store,
  today,
  prefill,
  onDone,
}: {
  mrn: string;
  store: CcmStore;
  today: string;
  prefill?: ActivityPrefill;
  onDone: () => void;
}) {
  const [type, setType] = useState(prefill?.type ?? "");
  const [date, setDate] = useState(today);
  const [mode, setMode] = useState<EntryMode>("minutes");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [typedMinutes, setTypedMinutes] = useState("");
  const [counts, setCounts] = useState<CountsToward>("yes");
  const [ehr, setEhr] = useState<YesNo>("no");
  const [note, setNote] = useState(prefill?.note ?? "");
  const [outcome, setOutcome] = useState<string>(OUTCOMES[0]);
  const [staff, setStaff] = useState<string>(STAFF[0]);
  const [needsFollowUp, setNeedsFollowUp] = useState<YesNo>("no");
  const [followDate, setFollowDate] = useState("");
  const [assignee, setAssignee] = useState("");
  const [task, setTask] = useState("");
  const [tried, setTried] = useState(false);
  const timer = useStopwatch();

  const minutes =
    mode === "times" ? durationMinutes(start, end) : Number(typedMinutes) || 0;

  const errors = {
    type: type === "" ? "Choose an activity type" : null,
    date: !date || date > today ? "Pick a date on or before today" : null,
    time:
      mode === "times" && minutes <= 0
        ? "End time must be after start time"
        : null,
    minutes:
      mode === "minutes" && (minutes < 1 || minutes > 240)
        ? "Enter 1 to 240 minutes"
        : null,
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
    if (!valid || timer.running) return;
    store.addActivity({
      mrn,
      type,
      date,
      minutes,
      ...(mode === "times" ? { start, end } : {}),
      note: note.trim(),
      outcome,
      staff,
      counts,
      ehrDocumented: ehr === "yes",
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
      className="mb-stack-lg space-y-stack-md rounded-card-nested border border-line p-inset-md"
    >
      <div>
        <h3 className="text-heading-5 text-fg">Add CCM Activity</h3>
        <p className="mt-stack-xs text-caption text-fg-muted">
          Key facts only. The full clinical note stays in the practice EHR.
        </p>
      </div>

      <div className="grid gap-stack-md sm:grid-cols-2">
        <FormField label="Activity Type" required error={show(errors.type)}>
          {(field) => (
            <Select
              {...field}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="" disabled>
                Select activity type
              </option>
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
          { value: "minutes", label: "Minutes or Timer" },
          { value: "times", label: "Start / End Time" },
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
          <FormField label="Duration">
            {(field) => (
              <Input
                {...field}
                readOnly
                value={`${minutes} minutes`}
                className="tabular-nums"
              />
            )}
          </FormField>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-inline-md">
          <FormField
            label="Minutes"
            required
            error={show(errors.minutes)}
            className="w-40"
          >
            {(field) => (
              <Input
                {...field}
                type="number"
                inputMode="numeric"
                min={1}
                max={240}
                value={typedMinutes}
                disabled={timer.running}
                onChange={(e) => setTypedMinutes(e.target.value)}
              />
            )}
          </FormField>
          {timer.running ? (
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setTypedMinutes(String(timer.stop()))}
              leadingIcon={<Pause aria-hidden="true" />}
            >
              <span className="tabular-nums">
                Stop · {clock(timer.elapsed)}
              </span>
            </Button>
          ) : (
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={timer.start}
              leadingIcon={<Play aria-hidden="true" />}
            >
              Start Timer
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-stack-md sm:grid-cols-2">
        <SegmentedChoice
          label="Include in CCM time?"
          value={counts}
          onChange={(next: CountsToward) => setCounts(next)}
          options={(["yes", "no", "pending"] as const).map((value) => ({
            value,
            label: COUNTS_LABEL[value],
          }))}
        />
        <SegmentedChoice
          label="EHR documentation completed?"
          value={ehr}
          onChange={(next: YesNo) => setEhr(next)}
          options={YES_NO}
        />
      </div>

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
        <FormField label="Entered By" required>
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
        label="Follow-up needed?"
        value={needsFollowUp}
        onChange={(next: YesNo) => setNeedsFollowUp(next)}
        options={YES_NO}
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
          <FormField label="Assign To">
            {(field) => (
              <Select
                {...field}
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              >
                <option value="">Unassigned</option>
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

      <FormField
        label="Administrative Note"
        hint={`Optional and non-clinical. ${note.length}/250`}
      >
        {(field) => (
          <Textarea
            {...field}
            rows={2}
            maxLength={250}
            placeholder="Brief note (non-clinical)…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        )}
      </FormField>

      <div className="flex justify-end gap-inline-md">
        <Button
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          onClick={onDone}
        >
          Cancel
        </Button>
        <Button size="small" onClick={save} disabled={timer.running}>
          Save Activity
        </Button>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- patient modal */

type PatientTab =
  | "overview"
  | "activity"
  | "checkins"
  | "education"
  | "documents"
  | "followups";

const requirementGlyph: Record<
  RequirementStatus,
  { icon: typeof CircleCheck; className: string }
> = {
  complete: { icon: CircleCheck, className: "text-success" },
  "in-progress": { icon: Clock, className: "text-warning-glyph" },
  missing: { icon: Circle, className: "text-fg-subtle" },
};

/* One checklist item: its state at a glance (glyph, then a caption with the
   date and note), the status menu on the right. The note is text until
   someone chooses to edit it: eight open fields competed with the eight
   statuses they annotate. */
function RequirementRow({
  store,
  mrn,
  id,
  label,
  today,
  readOnly = false,
}: {
  store: CcmStore;
  mrn: string;
  id: (typeof CCM_REQUIREMENTS)[number]["id"];
  label: string;
  today: string;
  /** The signed-in role may not update the checklist. */
  readOnly?: boolean;
}) {
  const current = requirementFor(store.state, mrn, id);
  const status = requirementStatus(current);
  const [editing, setEditing] = useState(false);
  const glyph = requirementGlyph[status];
  const Glyph = glyph.icon;

  const when =
    current.met && current.date
      ? `Completed ${usDate(current.date)}`
      : status === "in-progress"
        ? "Under way"
        : "Not yet completed";

  const saveNote = (value: string) => {
    const detail = value.trim();
    if (detail !== current.detail) store.setRequirement(mrn, id, { detail });
    setEditing(false);
  };

  return (
    <li className="flex items-start gap-inline-md py-inset-sm first:pt-0 last:pb-0">
      <Glyph
        aria-hidden="true"
        className={cn("mt-0.5 size-5 shrink-0", glyph.className)}
      />
      <div className="min-w-0 flex-1">
        <p className="text-label-md text-fg">{label}</p>
        {editing ? (
          <Input
            inputSize="small"
            autoFocus
            defaultValue={current.detail}
            placeholder="Add a short note"
            aria-label={`Note: ${label}`}
            className="mt-stack-xs"
            onBlur={(e) => saveNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveNote(e.currentTarget.value);
              if (e.key === "Escape") {
                /* Cancels the edit, not the whole sheet. */
                e.stopPropagation();
                setEditing(false);
              }
            }}
          />
        ) : (
          <p className="mt-stack-xs text-caption text-fg-muted tabular-nums">
            {when}
            {current.detail ? ` · ${current.detail}` : ""}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-inline-xs">
        <Button
          size="small"
          variant="neutral"
          appearance="ghost"
          iconOnly
          aria-label={
            current.detail ? `Edit note: ${label}` : `Add note: ${label}`
          }
          onClick={() => setEditing(true)}
          disabled={readOnly}
        >
          <Pencil />
        </Button>
        {/* A fixed width, so every row's menu and pencil line up. */}
        <div className="w-36">
          <Select
            selectSize="small"
            aria-label={`Status: ${label}`}
            value={status}
            disabled={readOnly}
            className="w-full"
            onChange={(e) => {
              const next = e.target.value as RequirementStatus;
              store.setRequirement(mrn, id, {
                met: next === "complete",
                inProgress: next === "in-progress",
                date: next === "complete" ? (current.date ?? today) : undefined,
              });
            }}
          >
            {(Object.keys(requirementLabel) as RequirementStatus[]).map(
              (value) => (
                <option key={value} value={value}>
                  {requirementLabel[value]}
                </option>
              ),
            )}
          </Select>
        </div>
      </div>
    </li>
  );
}

function EhrMark({ documented }: { documented: boolean }) {
  return documented ? (
    <Badge tone="success">In EHR</Badge>
  ) : (
    <Badge tone="warning">EHR pending</Badge>
  );
}

/* The month's activities as rows that wrap, not a seven-column table that
   scrolled sideways inside the popup. */
function ActivityTable({
  activities,
  month,
  total,
  limit,
}: {
  activities: ReturnType<typeof activitiesFor>;
  month: string;
  total?: number;
  limit?: number;
}) {
  const shown = limit ? activities.slice(0, limit) : activities;
  if (shown.length === 0) {
    return (
      <EmptyState
        variant="bare"
        title={`No activity logged in ${monthLabel(month)}`}
      />
    );
  }
  return (
    <div className="rounded-card-nested border border-line">
      <ul className="divide-y divide-line-subtle">
        {shown.map((activity) => (
          <li
            key={activity.id}
            className="flex flex-col gap-stack-sm p-inset-sm sm:flex-row sm:items-start sm:gap-inline-lg"
          >
            <div className="w-24 shrink-0 text-body-sm text-fg-secondary tabular-nums">
              {usDate(activity.date)}
              {activity.start && activity.end ? (
                <span className="block text-caption text-fg-muted">
                  {formatTime(activity.start)} – {formatTime(activity.end)}
                </span>
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-label-md text-fg">{activity.type}</p>
              <p className="text-caption text-fg-muted">
                {activity.staff}
                {activity.followUp
                  ? ` · Follow-up ${usDate(activity.followUp.date)}`
                  : ""}
              </p>
              {activity.note ? (
                <p className="mt-stack-xs text-body-sm text-fg-secondary">
                  {activity.note}
                </p>
              ) : null}
              <div className="mt-stack-sm flex flex-wrap gap-inline-sm">
                {activity.counts !== "yes" ? (
                  <Badge
                    tone={activity.counts === "pending" ? "warning" : "neutral"}
                  >
                    {activity.counts === "pending"
                      ? "Pending review"
                      : "Not counted"}
                  </Badge>
                ) : null}
                <EhrMark documented={activity.ehrDocumented} />
              </div>
            </div>
            <p className="shrink-0 text-label-lg text-fg tabular-nums sm:text-right">
              {activity.minutes} min
            </p>
          </li>
        ))}
      </ul>
      {total !== undefined ? (
        <p className="flex items-center justify-between gap-inline-md border-t border-line bg-surface-sunken p-inset-sm text-label-md text-fg">
          <span>{monthLabel(month)} · counted toward CCM</span>
          <span className="tabular-nums">{total} min</span>
        </p>
      ) : null}
    </div>
  );
}

type TileTone = "brand" | "success" | "warning" | "danger" | "neutral";

/* The same tinted icon squares as KeyCard, so a tile here reads as a small
   stat card. */
const tileTone: Record<TileTone, string> = {
  brand: "bg-surface-brand-subtle text-fg-brand",
  success: "bg-success-surface text-success",
  warning: "bg-warning-surface text-warning-glyph",
  danger: "bg-danger-surface text-danger",
  neutral: "bg-surface-sunken text-fg-secondary",
};

const statusTile: Record<CcmStatus, TileTone> = {
  "Action Needed": "danger",
  "Below Threshold": "warning",
  "Ready for Review": "success",
};

function SummaryTile({
  icon: Icon,
  tone,
  label,
  value,
  note,
  children,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tone: TileTone;
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 gap-inline-md rounded-card-nested border border-line p-inset-sm">
      <span
        aria-hidden="true"
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-control",
          tileTone[tone],
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-caption text-fg-muted">{label}</dt>
        <dd className="truncate text-heading-5 text-fg tabular-nums">
          {value}
        </dd>
        {children}
        {note ? (
          <dd className="mt-stack-xs truncate text-caption text-fg-muted">
            {note}
          </dd>
        ) : null}
      </div>
    </div>
  );
}

/* The patient's month in four tiles, first thing in the sheet: the answers
   staff open a patient for. Each says why, not just what: the status tile
   names the reason a patient needs attention. */
function PatientSummary({
  row,
  pending,
  followUp,
}: {
  row: WorklistRow;
  pending: number;
  followUp?: { task: string; assignee: string };
}) {
  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? "" : "s"}`;
  const reason =
    row.status === "Action Needed"
      ? [
          row.openAlerts > 0 ? plural(row.openAlerts, "open alert") : null,
          row.overdue > 0 ? plural(row.overdue, "overdue follow-up") : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : row.status === "Ready for Review"
        ? "Practice review required"
        : `${row.remaining} min to go`;
  const missing = REQUIRED - row.met;

  return (
    <dl
      aria-label="This month"
      className="mb-stack-lg grid grid-cols-1 gap-inline-md sm:grid-cols-2 lg:grid-cols-4"
    >
      <SummaryTile
        icon={ClockSolid}
        tone={statusTile[row.status]}
        label="CCM minutes"
        value={
          <>
            {row.minutes}
            <span className="text-body-sm text-fg-muted">
              {" "}
              / {CCM_THRESHOLD_MINUTES} min
            </span>
          </>
        }
        note={pending > 0 ? `+${pending} min pending review` : undefined}
      >
        <dd className="mt-stack-xs">
          <Progress
            value={row.minutes}
            max={CCM_THRESHOLD_MINUTES}
            tone={statusBar[row.status]}
            size="small"
            label="CCM minutes this month"
          />
        </dd>
      </SummaryTile>
      <SummaryTile
        icon={
          row.status === "Ready for Review"
            ? CheckCircleSolid
            : AlertTriangleSolid
        }
        tone={statusTile[row.status]}
        label="Status"
        value={row.status}
        note={reason}
      />
      <SummaryTile
        icon={ListChecks}
        tone={missing === 0 ? "success" : "neutral"}
        label="Checklist"
        value={`${row.met} of ${REQUIRED} complete`}
        note={missing === 0 ? "All requirements met" : `${missing} still open`}
      />
      <SummaryTile
        icon={CalendarClock}
        tone={
          row.overdue > 0 ? "danger" : row.nextFollowUp ? "brand" : "neutral"
        }
        label="Next follow-up"
        value={row.nextFollowUp ? usDate(row.nextFollowUp) : "None scheduled"}
        note={
          followUp
            ? `${followUp.task}${followUp.assignee ? ` · ${followUp.assignee.split(",")[0]}` : ""}`
            : undefined
        }
      />
    </dl>
  );
}

/* Why the patient needs attention, with the action for each reason next to
   it, so it can be cleared where it is read. */
function AttentionPanel({
  alerts,
  overdue,
  store,
  onLog,
}: {
  alerts: ReturnType<typeof openInbox>;
  overdue: ReturnType<typeof openFollowUps>;
  store: CcmStore;
  /** Absent when the signed-in role may not log time. */
  onLog?: (alert: ReturnType<typeof openInbox>[number]) => void;
}) {
  if (alerts.length === 0 && overdue.length === 0) return null;
  const item =
    "flex flex-wrap items-center justify-between gap-inline-md py-inset-xs first:pt-0 last:pb-0";
  return (
    <Alert tone="danger" title="Action needed">
      <ul className="mt-stack-sm divide-y divide-danger-line">
        {alerts.map((alert) => (
          <li key={alert.id} className={item}>
            <span className="min-w-0 flex-1">
              <span className="text-label-md">{alert.kind}:</span> {alert.text}
              <span className="block text-caption text-fg-muted">
                {ALERT_ACTIVITY[alert.kind]}
              </span>
            </span>
            <span className="flex flex-wrap gap-inline-sm">
              {onLog ? (
                <Button
                  size="small"
                  variant="neutral"
                  appearance="fill-stroke"
                  onClick={() => onLog(alert)}
                  leadingIcon={<Plus aria-hidden="true" />}
                >
                  Log Time
                </Button>
              ) : null}
              <Button
                size="small"
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => store.resolveInbox(alert.id)}
                leadingIcon={<Check aria-hidden="true" />}
              >
                Resolve
              </Button>
            </span>
          </li>
        ))}
        {overdue.map(({ activity, followUp }) => (
          <li key={activity.id} className={item}>
            <span>
              <span className="text-label-md">Overdue follow-up:</span>{" "}
              {followUp.task} (due {usDate(followUp.date)})
            </span>
            <Button
              size="small"
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => store.completeFollowUp(activity.id)}
              leadingIcon={<Check aria-hidden="true" />}
            >
              Done
            </Button>
          </li>
        ))}
      </ul>
    </Alert>
  );
}

/** The patient's full condition list, editable by staff who log CCM. */
function ConditionsSection({
  values,
  library,
  canEdit,
  onSave,
}: {
  values: string[];
  library: CcmCondition[];
  canEdit: boolean;
  onSave: (next: string[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(values);
  const [tried, setTried] = useState(false);
  const tooFew = chronicCount(draft, library) < 2;
  const sorted = sortedConditions(values, library);

  return (
    <section>
      <div className="mb-stack-sm flex flex-wrap items-center justify-between gap-inline-md">
        <h3 className="text-heading-5 text-fg">
          Chronic Conditions ({sorted.length})
        </h3>
        {canEdit && !editing ? (
          <Button
            size="small"
            variant="neutral"
            appearance="fill-stroke"
            leadingIcon={<Pencil aria-hidden="true" />}
            onClick={() => {
              setDraft(values);
              setTried(false);
              setEditing(true);
            }}
          >
            Edit Conditions
          </Button>
        ) : null}
      </div>
      {editing ? (
        <div className="space-y-stack-md rounded-card-nested border border-line p-inset-md">
          <ConditionSelect
            library={library}
            value={draft}
            onChange={setDraft}
            invalid={tried && tooFew}
          />
          {tried && tooFew ? (
            <p role="alert" className="text-caption text-danger">
              CCM needs two or more chronic conditions.
            </p>
          ) : null}
          <div className="flex justify-end gap-inline-md">
            <Button
              size="small"
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <Button
              size="small"
              onClick={() => {
                setTried(true);
                if (tooFew) return;
                onSave(draft);
                setEditing(false);
              }}
            >
              Save Conditions
            </Button>
          </div>
        </div>
      ) : (
        <ul className="flex flex-wrap gap-inline-sm">
          {sorted.map((condition) => (
            <li key={condition.value}>
              <Badge tone={condition.other ? "neutral" : "info"}>
                {condition.label}
                {condition.other ? " (Other)" : ""}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PatientModal({
  row,
  store,
  month,
  today,
  checkInRows,
  canLog,
  library,
  onClose,
}: {
  row: WorklistRow;
  store: CcmStore;
  month: string;
  today: string;
  checkInRows: CheckInRow[];
  library: CcmCondition[];
  /** The signed-in role may log time and update the checklist. */
  canLog: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<PatientTab>("overview");
  const [adding, setAdding] = useState(false);
  const [prefill, setPrefill] = useState<ActivityPrefill | undefined>();
  const activities = activitiesFor(store.state, row.mrn, month);
  const followUps = openFollowUps(store.state, row.mrn);
  const alerts = openInbox(store.state, row.mrn);
  const pending = pendingMinutesFor(store.state, row.mrn, month);
  const checkIns = checkInsFor(checkInRows, row.name);
  const enrolment = roster.find((p) => p.mrn === row.mrn);
  const undocumentedCount = activities.filter((a) => !a.ehrDocumented).length;

  const count = (label: string, n: number) =>
    n > 0 ? `${label} (${n})` : label;

  return (
    <Modal
      open
      onClose={onClose}
      placement="bottom"
      title={row.name}
      description={`MRN ${row.mrn} · ${ageOn(row.dob, today)} y/o (DOB ${usDate(row.dob)}) · ${row.provider} · ${row.location}`}
    >
      <PatientSummary
        row={row}
        pending={pending}
        followUp={followUps[0]?.followUp}
      />

      {/* The tabs, with the sheet's one primary action at the end of the
          row: logging time is what staff most often open a patient to do. */}
      <div className="mb-stack-lg flex flex-wrap items-center justify-between gap-inline-md">
        <div className="no-scrollbar min-w-0 overflow-x-auto">
          <Tabs
            label="Patient CCM"
            value={tab}
            onChange={setTab}
            items={[
              { id: "overview", label: "Overview" },
              { id: "activity", label: "Activity" },
              { id: "checkins", label: "Check-Ins" },
              { id: "education", label: "Education" },
              { id: "documents", label: count("Documents", undocumentedCount) },
              {
                id: "followups",
                label: count("Follow-Ups", followUps.length),
              },
            ]}
          />
        </div>
        {canLog ? (
          <Button
            size="small"
            onClick={() => {
              setPrefill(undefined);
              setTab("activity");
              setAdding(true);
            }}
            leadingIcon={<Plus aria-hidden="true" />}
          >
            Log Activity
          </Button>
        ) : null}
      </div>

      <TabPanel id="overview" value={tab} className="space-y-stack-lg">
        {/* One column: the sheet is at most 900px, too narrow to split. What
            needs acting on comes first, then the checklist, then history. */}
        <AttentionPanel
          alerts={alerts}
          overdue={followUps.filter((f) => f.followUp.date < today)}
          store={store}
          onLog={
            canLog
              ? (alert) => {
                  setPrefill({
                    type: ALERT_ACTIVITY[alert.kind],
                    note: `${alert.kind}: ${alert.text}`,
                  });
                  setTab("activity");
                  setAdding(true);
                }
              : undefined
          }
        />

        <ConditionsSection
          values={row.conditions}
          library={library}
          canEdit={canLog}
          onSave={(next) => store.setConditions(row.mrn, next)}
        />

        <section>
          <div className="mb-stack-sm flex flex-wrap items-baseline justify-between gap-inline-md">
            <h3 className="text-heading-5 text-fg">
              CCM Checklist (Tracking Only)
            </h3>
            <span className="text-caption text-fg-muted">
              {row.met} of {REQUIRED} complete · documentation remains in the
              practice EHR
            </span>
          </div>
          <ul className="divide-y divide-line-subtle rounded-card-nested border border-line p-inset-md">
            {CCM_REQUIREMENTS.map((requirement) => (
              <RequirementRow
                key={requirement.id}
                store={store}
                mrn={row.mrn}
                id={requirement.id}
                label={requirement.label}
                today={today}
                readOnly={!canLog}
              />
            ))}
          </ul>
        </section>
        <section>
          <div className="mb-stack-sm flex flex-wrap items-center justify-between gap-inline-md">
            <h3 className="text-heading-5 text-fg">
              Recent CCM Activities ({monthLabel(month)})
            </h3>
            {activities.length > 5 ? (
              <Button
                size="small"
                variant="neutral"
                appearance="ghost"
                onClick={() => setTab("activity")}
              >
                View all {activities.length}
              </Button>
            ) : null}
          </div>
          <ActivityTable activities={activities} month={month} limit={5} />
        </section>
      </TabPanel>

      <TabPanel id="activity" value={tab}>
        {adding ? (
          <ActivityForm
            key={prefill ? `${prefill.type}|${prefill.note}` : "blank"}
            mrn={row.mrn}
            store={store}
            today={today}
            prefill={prefill}
            onDone={() => setAdding(false)}
          />
        ) : null}
        {/* One way in (client, 2026-10-01): the header's Log Activity,
            which opens this form from any tab. */}
        <ActivityTable
          activities={activities}
          month={month}
          total={row.minutes}
        />
      </TabPanel>

      <TabPanel id="checkins" value={tab}>
        {checkIns.length === 0 ? (
          <EmptyState variant="bare" title="No check-ins this week" />
        ) : (
          <ul className="divide-y divide-line-subtle">
            {checkIns.map((checkIn) => (
              <li
                key={checkIn.date}
                className="flex items-start gap-inline-lg py-inset-xs first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-label-lg text-fg">{checkIn.date}</p>
                  <p className="text-body-sm text-fg-secondary">
                    {checkIn.notes}
                  </p>
                </div>
                <Badge tone={checkInTone[checkIn.status]}>
                  {checkIn.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </TabPanel>

      <TabPanel id="education" value={tab}>
        {enrolment ? (
          <section className="rounded-card-nested border border-line p-inset-md">
            <div className="flex flex-wrap items-center justify-between gap-inline-md">
              <h3 className="text-heading-5 text-fg">{enrolment.program}</h3>
              <Badge tone="neutral">{enrolment.status}</Badge>
            </div>
            <Progress
              value={enrolment.progress}
              label="Curriculum progress"
              showValue
              className="mt-stack-md"
            />
            <p className="mt-stack-sm text-caption text-fg-muted">
              Started {enrolment.startDate}
            </p>
          </section>
        ) : (
          <EmptyState variant="bare" title="Not enrolled in a program" />
        )}
      </TabPanel>

      <TabPanel id="documents" value={tab} className="space-y-stack-md">
        <p className="text-body-sm text-fg-secondary">
          Clinical documentation lives in the practice EHR. Mark each activity
          once it has been charted there.
        </p>
        {activities.length === 0 ? (
          <EmptyState
            variant="bare"
            title={`No activity logged in ${monthLabel(month)}`}
          />
        ) : (
          <ul className="divide-y divide-line-subtle">
            {activities.map((activity) => (
              <li
                key={activity.id}
                className="flex items-center gap-inline-lg py-inset-xs first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-label-lg text-fg">{activity.type}</p>
                  <p className="text-body-sm text-fg-secondary tabular-nums">
                    {usDate(activity.date)} · {activity.staff} ·{" "}
                    {activity.minutes} min
                  </p>
                </div>
                {activity.ehrDocumented ? (
                  <Badge tone="success">In EHR</Badge>
                ) : (
                  <Button
                    size="small"
                    variant="neutral"
                    appearance="fill-stroke"
                    onClick={() => store.setEhrDocumented(activity.id, true)}
                    leadingIcon={<Check aria-hidden="true" />}
                  >
                    Mark Documented
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
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
                    {followUp.assignee || "Unassigned"} · due{" "}
                    {usDate(followUp.date)}
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
                  leadingIcon={<Check aria-hidden="true" />}
                >
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

/* ------------------------------------------------------------ add to CCM */

/** Enrols one of the clinic's patients in CCM, once they have consented:
 *  the conditions that qualify them and who looks after them. */
function AddToCcmModal({
  candidates,
  library,
  onAdd,
  onClose,
}: {
  candidates: Array<{ name: string; mrn: string }>;
  library: CcmCondition[];
  onAdd: (patient: CcmPatient) => void;
  onClose: () => void;
}) {
  const today = dayKey(useNow());
  const [mrn, setMrn] = useState(candidates[0]?.mrn ?? "");
  const [dob, setDob] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [provider, setProvider] = useState<string>(PROVIDERS[0]);
  const [careManager, setCareManager] = useState<string>(CARE_MANAGERS[0]);
  const [location, setLocation] = useState<string>(LOCATIONS[0]);
  const [tried, setTried] = useState(false);
  const errors = {
    dob: dob ? undefined : "Enter the date of birth",
    conditions:
      chronicCount(conditions, library) >= 2
        ? undefined
        : "CCM needs two or more chronic conditions",
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="big"
      title="Add to CCM"
      description="For a patient who has consented to Chronic Care Management."
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={candidates.length === 0}
            onClick={() => {
              setTried(true);
              const patient = candidates.find((c) => c.mrn === mrn);
              if (!patient || errors.dob || errors.conditions) return;
              onAdd({
                mrn,
                name: patient.name,
                dob,
                conditions,
                provider,
                careManager,
                location,
              });
              onClose();
            }}
          >
            Add to CCM
          </Button>
        </>
      }
    >
      {candidates.length === 0 ? (
        <EmptyState
          variant="bare"
          title="Every clinic patient is already in CCM"
        />
      ) : (
        <div className="space-y-stack-md">
          <FormField label="Patient" required>
            {(field) => (
              <Select
                {...field}
                value={mrn}
                onChange={(e) => setMrn(e.target.value)}
              >
                {candidates.map((c) => (
                  <option key={c.mrn} value={c.mrn}>
                    {c.name} · MRN {c.mrn}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField
            label="Date of birth"
            required
            error={tried ? errors.dob : undefined}
          >
            {(field) => (
              <Input
                {...field}
                type="date"
                max={today}
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            )}
          </FormField>
          <FormField
            label="Chronic conditions"
            required
            hint="Choose every condition that applies. Use Other for anything not listed."
            error={tried ? errors.conditions : undefined}
          >
            {(field) => (
              <ConditionSelect
                library={library}
                value={conditions}
                onChange={setConditions}
                invalid={Boolean(tried && errors.conditions)}
                describedBy={field["aria-describedby"]}
              />
            )}
          </FormField>
          <div className="grid gap-stack-md sm:grid-cols-3">
            <FormField label="Provider" required>
              {(field) => (
                <Select
                  {...field}
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                >
                  {PROVIDERS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              )}
            </FormField>
            <FormField label="Care manager" required>
              {(field) => (
                <Select
                  {...field}
                  value={careManager}
                  onChange={(e) => setCareManager(e.target.value)}
                >
                  {CARE_MANAGERS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              )}
            </FormField>
            <FormField label="Location" required>
              {(field) => (
                <Select
                  {...field}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  {LOCATIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              )}
            </FormField>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ page */

type PageTab = "worklist" | "checkins" | "inbox" | "followups";

function PageSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} height={180} className="rounded-card" />
        ))}
      </div>
      <Skeleton height={120} className="rounded-card" />
      <Skeleton height={560} className="rounded-card" />
    </div>
  );
}

export default function ClinicCcm() {
  const rawStore = useCcm();
  const canLog = useCan("ccm.log");
  const canManageLibrary = useCan("settings.manage");
  const conditionLibrary = useConditionLibrary();
  const library = conditionLibrary.library;
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  /* The clinic's whole patient list, newly enrolled ones included. */
  const clinicData = useClinicData();
  const now = useNow();
  const today = dayKey(now);
  /* What the linked member's own app has raised, folded into the inbox and
     the check-ins so every count, status and tab reads it like the rest. */
  const feed = useMemberFeed(now, today, LINKED_MEMBER.program);
  const state = useMemo(
    () => withFeed(rawStore.state, feed.inbox),
    [rawStore.state, feed.inbox],
  );
  const store: CcmStore = { ...rawStore, state };
  const checkInRows = useMemo(
    () => [...(feed.isPending ? [] : feed.checkInRows), ...demoCheckIns],
    [feed.isPending, feed.checkInRows],
  );
  const months = recentMonths(now);
  const [month, setMonth] = useState(months[0]);
  const [tab, setTab] = useState<PageTab>("worklist");
  const [openMrn, setOpenMrn] = useState<string | null>(null);

  const rows = useMemo(
    () => worklist(state, ccmPatientsOf(state), month, today),
    [state, month, today],
  );
  const inboxCount = openInbox(store.state).length;
  const dueCount = followUpsDue(store.state, today).length;
  const checkInCount = checkInRows.filter(
    (row) => row.status !== "Completed",
  ).length;
  const openRow = rows.find((row) => row.mrn === openMrn) ?? null;
  const count = (label: string, n: number) =>
    n > 0 ? `${label} (${n})` : label;

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
            label="Enrolled Patients"
            note={`Active in ${monthLabel(month)}`}
          />
          <KeyCard
            tone="danger"
            icon={<AlertTriangleSolid />}
            value={countStatus(rows, "Action Needed")}
            label="Action Needed"
            note="Open alert or overdue follow-up"
          />
          <KeyCard
            tone="warning"
            icon={<ClockSolid />}
            value={countStatus(rows, "Below Threshold")}
            label={`Below ${CCM_THRESHOLD_MINUTES} Minutes`}
            note={`0–${CCM_THRESHOLD_MINUTES - 1} minutes recorded`}
          />
          <KeyCard
            tone="success"
            icon={<CheckCircleSolid />}
            value={countStatus(rows, "Ready for Review")}
            label="Ready for Review"
            note={`${CCM_THRESHOLD_MINUTES}+ minutes · practice review required`}
          />
        </section>
        <StatusSplit rows={rows} />

        <Card as="section" padding="none" className="min-w-0 overflow-hidden">
          <div className="p-card pb-stack-lg">
            <div className="overflow-x-auto">
              <Tabs
                label="CCM views"
                value={tab}
                onChange={setTab}
                items={[
                  { id: "worklist", label: "Patient Worklist" },
                  {
                    id: "checkins",
                    label: count("Patient Check-Ins", checkInCount),
                  },
                  { id: "inbox", label: count("CCM Inbox", inboxCount) },
                  { id: "followups", label: count("Follow-Up Due", dueCount) },
                ]}
              />
            </div>
          </div>
          <TabPanel id="worklist" value={tab}>
            <Worklist
              rows={rows}
              month={month}
              library={library}
              onManageLibrary={
                canManageLibrary ? () => setLibraryOpen(true) : undefined
              }
              onOpen={setOpenMrn}
            />
          </TabPanel>
          <TabPanel id="checkins" value={tab}>
            <CheckInsTable
              rows={checkInRows}
              patients={ccmPatientsOf(state)}
              onOpen={setOpenMrn}
            />
          </TabPanel>
          <TabPanel id="inbox" value={tab}>
            <InboxTable store={store} onOpen={setOpenMrn} />
          </TabPanel>
          <TabPanel id="followups" value={tab}>
            <FollowUpTable store={store} today={today} onOpen={setOpenMrn} />
          </TabPanel>
          <p className="flex items-center gap-inline-sm border-t border-line px-(--table-edge) py-inset-sm text-caption text-fg-muted">
            <ShieldCheck aria-hidden="true" className="size-4 shrink-0" />
            Practice staff enter activities and the practice decides what counts
            for billing. NephroReach tracks time and makes no medical decisions.
          </p>
        </Card>

        {openRow ? (
          <PatientModal
            row={openRow}
            store={store}
            month={month}
            today={today}
            checkInRows={checkInRows}
            canLog={canLog}
            library={library}
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
            <span className="text-body-sm text-fg-muted">{PRACTICE}</span>
            <UpdatedBar
              updatedAt={store.updatedAt}
              isFetching={store.isFetching}
              refetch={store.refetch}
            />
            {canLog ? (
              <Button
                size="small"
                onClick={() => setAdding(true)}
                leadingIcon={<Plus aria-hidden="true" />}
              >
                Add to CCM
              </Button>
            ) : null}
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
      {adding ? (
        <AddToCcmModal
          candidates={(clinicData.data?.patients ?? []).filter(
            (p) => !ccmPatientsOf(state).some((c) => c.mrn === p.mrn),
          )}
          library={library}
          onAdd={rawStore.enroll}
          onClose={() => setAdding(false)}
        />
      ) : null}
      {libraryOpen ? (
        <ConditionLibraryModal onClose={() => setLibraryOpen(false)} />
      ) : null}
    </div>
  );
}
