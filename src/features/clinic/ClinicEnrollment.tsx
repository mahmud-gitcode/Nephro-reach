"use client";

import { useExternalShare } from "@/features/sharing/ExternalShareNotice";
import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Download,
  Eye,
  MessageSquareText,
  Plus,
  Search,
  Users,
} from "lucide-react";

import {
  FileTextSolid,
  TargetSolid,
  UsersSolid,
} from "@/components/icons/solid";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  Alert,
  Badge,
  Button,
  buttonStyles,
  Card,
  DonutChart,
  EmptyState,
  ErrorState,
  Input,
  KeyCard,
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
  type SeriesTone,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { tableIconButton } from "./tableButton";
import { shortProgram } from "./clinicIcons";
import { memberLink, messageLink } from "./clinicDashboard.data";
import {
  ALL_PROGRAMS,
  ALL_SOURCES,
  ALL_STATUSES,
  countBy,
  filterPatients,
  paginate,
  PROGRAM_ORDER,
  programOptions,
  ROWS_PER_PAGE_OPTIONS,
  SOURCE_ORDER,
  STATUS_ORDER,
  statusOptions,
  statusTone,
  type EnrollmentStatus,
  type Patient,
} from "./enrollment.data";
import { EnrollPatientModal } from "./EnrollPatientModal";
import { UpdatedBar } from "./UpdatedBar";
import { useClinicData, type ClinicData } from "./useClinicData";
import { programFor } from "./enrollment.mapping";
import { useRosterPage } from "./useRosterPage";
import { WindowNote } from "./WindowNote";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { downloadText, toCsv } from "@/lib/utils/download";

const MESSAGES = "/dashboard/clinic/messages";
const BILLING = "/dashboard/clinic/billing";

/* Sources are four identities, so they take the categorical ramp in a
   fixed order — a filter that drops one must never repaint the rest. */
const SOURCE_TONES: SeriesTone[] = ["cat-1", "cat-4", "cat-6", "cat-7"];

const sourceOptions = [ALL_SOURCES, ...SOURCE_ORDER];

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

/* A row in a breakdown panel that filters the table when pressed. */
const filterRow = (on: boolean) =>
  cn(
    "w-full cursor-pointer rounded-control-small p-inset-xs text-left hover:bg-surface-sunken",
    on && "bg-surface-brand-subtle",
    focusRing,
  );

type Filters = {
  query: string;
  program: string;
  status: string;
  source: string;
};

const NO_FILTERS: Omit<Filters, "query"> = {
  program: ALL_PROGRAMS,
  status: ALL_STATUSES,
  source: ALL_SOURCES,
};

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

/* ------------------------------------------------------- summary cards */

function SummaryCards({
  total,
  seats,
  onEnroll,
}: {
  /** The server's roster count. */
  total: number;
  /** The contract's seats (null: unknown to this role). */
  seats: ClinicData["seats"];
  onEnroll: () => void;
}) {
  const enrolled = total;
  /* The contract decides (allowed null: no seat limit). Unknown shows "—";
     the server refuses a full contract either way (409 seats_full). */
  const slots = seats?.allowed ?? null;
  const used = seats?.used ?? enrolled;
  const remaining =
    slots === null ? null : Math.max(0, seats?.available ?? slots - used);
  const goalPct = slots ? Math.round((used / slots) * 100) : null;
  const full = remaining === 0;

  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2">
      <KeyCard
        tone="brand"
        icon={<UsersSolid />}
        value={
          <>
            {enrolled}
            {slots !== null ? (
              <span className="text-heading-4 text-fg-muted"> / {slots}</span>
            ) : null}
          </>
        }
        label="Patients Enrolled"
        note={remaining === null ? undefined : `${remaining} slots remaining`}
      />

      <KeyCard
        tone="neutral"
        icon={<FileTextSolid />}
        value={slots ?? "—"}
        label="Total Contract Slots"
      >
        <Link href={BILLING} className={cn(outlineLink, "w-full")}>
          View Contract
        </Link>
      </KeyCard>

      <KeyCard
        tone="success"
        icon={<TargetSolid />}
        value={goalPct === null ? "—" : `${goalPct}%`}
        label="Enrollment Goal"
        note={slots === null ? undefined : `${used} of ${slots} enrolled`}
      />

      {/* Not a figure, so not a KeyCard: this one is the action, and the
          only card on the row with something to press. */}
      <Card as="article" padding="small" className="flex flex-col">
        <p className="text-heading-5 text-fg-secondary">Enroll New Patient</p>
        <p className="mt-stack-xs text-body-sm text-fg-muted">
          {full
            ? "Every contract seat is filled."
            : "Add a new patient to your program."}
        </p>
        {/* The spacing goes on a wrapper, not on the button. `pt-stack-md`
            was on the Button itself, which added padding INSIDE a control
            that already has a fixed height — so its icon and label sat
            below centre. A full contract disables it and says why, rather
            than opening a form that can only fail. */}
        <div className="mt-auto pt-stack-md">
          <Button
            size="small"
            fullWidth
            onClick={onEnroll}
            disabled={full}
            title={full ? "All contract seats are filled" : undefined}
          >
            <Plus />
            Enroll New Patient
          </Button>
        </div>
      </Card>
    </section>
  );
}

/* --------------------------------------------------------------- table */

/** Search here also matches a status word ("pending"), which the server's
 *  roster search (name or MRN) does not: such a search reads the window. */
function searchesStatus(query: string): boolean {
  const q = query.trim().toLowerCase();
  return (
    q.length >= 3 &&
    statusOptions
      .slice(1)
      .concat("No Program")
      .some((label) => label.toLowerCase().includes(q))
  );
}

/** One page of the table, from the server or from the window. */
type TableView = {
  rows: Patient[] | undefined;
  page: number;
  pageCount: number;
  firstShown: number;
  lastShown: number;
  total: number;
  isFetching: boolean;
  error: unknown;
  refetch: () => void;
};

function PatientTable({
  list,
  view,
  perPage,
  onPage,
  onPerPage,
  note,
  filters,
  onFilters,
  highlightId,
}: {
  /** The shared window: what Export writes. */
  list: Patient[];
  view: TableView;
  perPage: number;
  onPage: (page: number) => void;
  onPerPage: (perPage: number) => void;
  /** Why the rows may not be the whole roster. */
  note: React.ReactNode;
  filters: Filters;
  onFilters: (change: Partial<Filters>) => void;
  highlightId: string | null;
}) {
  /* Leaves NephroReach: ask first (client, 2026-10-07). */
  const share = useExternalShare();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const rows = view.rows ?? [];

  const filtered = useMemo(
    () => filterPatients(list, filters),
    [list, filters],
  );

  const pageMrns = rows.map((patient) => patient.id);
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
    filters.status !== ALL_STATUSES ||
    filters.source !== ALL_SOURCES;

  return (
    <Card as="section" padding="small" aria-labelledby="enrolled-heading">
      <h2 id="enrolled-heading" className="mb-stack-lg text-heading-4 text-fg">
        Enrolled Patients
      </h2>

      <div className="mb-stack-lg flex flex-col gap-inline-md lg:flex-row lg:flex-wrap lg:items-center">
        <Input
          type="search"
          inputSize="small"
          value={filters.query}
          onChange={(event) => onFilters({ query: event.target.value })}
          placeholder="Search by name, MRN, or status..."
          aria-label="Search patients"
          leadingIcon={<Search aria-hidden="true" />}
          className="lg:w-64"
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
        >
          {statusOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
        <Select
          selectSize="small"
          aria-label="Referral source"
          value={filters.source}
          onChange={(event) => onFilters({ source: event.target.value })}
        >
          {sourceOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
        {/* No Enroll button here: the summary card directly above this
            table already carries it, and the two sat on screen together. */}
        <div className="flex gap-inline-md lg:ml-auto">
          <Button
            variant="neutral"
            appearance="fill-stroke"
            size="small"
            disabled={filtered.length === 0}
            onClick={() =>
              share.guard(
                () =>
                  downloadText(
                    "enrolled-patients.csv",
                    toCsv([
                      [
                        "Name",
                        "MRN",
                        "Program",
                        "Enrolled",
                        "Status",
                        "Start",
                        "Progress %",
                        "Source",
                      ],
                      ...filtered.map((p) => [
                        p.name,
                        p.mrn,
                        p.program,
                        p.enrolledOn,
                        p.status,
                        p.startDate,
                        p.progress,
                        p.source,
                      ]),
                    ]),
                  ),
                "download",
              )
            }
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          {share.notice}
        </div>
      </div>

      {selected.size > 0 ? (
        <div
          role="region"
          aria-label="Selected patients"
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

      {note}

      {view.error ? (
        <ErrorState
          title={errorTitleFor(view.error, "Enrollments could not be loaded")}
          message={errorMessageFor(view.error, undefined)}
          error={view.error}
          onRetry={canRetry(view.error) ? view.refetch : undefined}
        />
      ) : view.rows === undefined ? (
        <Skeleton height={420} className="rounded-control" />
      ) : (
        <div
          aria-busy={view.isFetching}
          className="overflow-hidden rounded-control border border-line"
        >
          <Table minWidth={980}>
            <TableHead className="bg-surface-sunken">
              <TableRow>
                <TableHeaderCell className="w-10">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    disabled={pageMrns.length === 0}
                    onChange={toggleAllOnPage}
                    aria-label="Select all patients on this page"
                    className="h-4 w-4 cursor-pointer accent-brand-600"
                  />
                </TableHeaderCell>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Program Assigned</TableHeaderCell>
                <TableHeaderCell>Enrollment Date</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Start Date</TableHeaderCell>
                <TableHeaderCell>Progress</TableHeaderCell>
                <TableHeaderCell>Source</TableHeaderCell>
                <TableHeaderCell className="text-right">
                  Actions
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableEmptyRow colSpan={9}>
                  <span className="flex flex-wrap items-center gap-inline-md text-body-sm text-fg-secondary">
                    No patients match these filters.
                    {filtersOn ? (
                      <Button
                        variant="neutral"
                        appearance="fill-stroke"
                        size="small"
                        onClick={() => onFilters({ query: "", ...NO_FILTERS })}
                      >
                        Clear filters
                      </Button>
                    ) : null}
                  </span>
                </TableEmptyRow>
              ) : (
                rows.map((patient) => (
                  <TableRow
                    key={patient.id}
                    className={
                      patient.id === highlightId
                        ? "bg-success-surface"
                        : undefined
                    }
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(patient.id)}
                        onChange={() => toggleOne(patient.id)}
                        aria-label={`Select ${patient.name}`}
                        className="h-4 w-4 cursor-pointer accent-brand-600"
                      />
                    </TableCell>
                    <TableCell emphasis className="whitespace-nowrap">
                      {patient.name}
                      <span className="block text-caption font-normal text-fg-muted tabular-nums">
                        MRN {patient.mrn || "—"}
                      </span>
                    </TableCell>
                    <TableCell>{shortProgram(patient.program)}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {patient.enrolledOn}
                    </TableCell>
                    <TableCell>
                      <Badge tone={statusTone[patient.status]}>
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {patient.startDate}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-inline-md">
                        <Progress
                          value={patient.progress}
                          label={`${patient.name} program progress`}
                          size="small"
                          className="w-14"
                        />
                        <span className="tabular-nums">
                          {patient.progress}%
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {patient.source}
                    </TableCell>
                    <TableCell>
                      <span className="flex justify-end gap-inline-xs">
                        <Link
                          href={memberLink({ patientId: patient.id })}
                          className={iconControl}
                          aria-label={`View ${patient.name} on the Member page`}
                          title="View member"
                        >
                          <Eye aria-hidden="true" />
                        </Link>
                        <Link
                          href={messageLink(patient.id)}
                          className={iconControl}
                          aria-label={`Message ${patient.name}`}
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
      )}

      <div className="mt-stack-md flex flex-col gap-inline-md sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-inline-md text-body-sm text-fg-secondary">
          Rows per page
          <Select
            selectSize="small"
            value={String(perPage)}
            onChange={(event) => onPerPage(Number(event.target.value))}
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
          onPageChange={onPage}
          summary={`Showing ${view.firstShown}–${view.lastShown} of ${view.total} patients`}
        />
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------- panels

   Each breakdown filters the table: press a source, a program or a status
   and the list above narrows to it. They count the whole roster, not the
   filtered view, so pressing one never empties the others. */

function EnrollmentSources({
  list,
  source,
  onSource,
}: {
  list: Patient[];
  source: string;
  onSource: (source: string) => void;
}) {
  const counts = countBy(list, (p) => p.source, SOURCE_ORDER);
  const segments = counts.map((entry, index) => ({
    label: entry.label,
    value: entry.value,
    tone: SOURCE_TONES[index],
  }));

  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Enrollment Sources" />
      <div className="grid items-center gap-inset-md sm:grid-cols-[150px_minmax(0,1fr)]">
        <DonutChart
          segments={segments.filter((segment) => segment.value > 0)}
          label="Enrollment sources"
          size={150}
          thickness={28}
          centerValue={list.length}
          centerLabel="Enrolled"
          className="mx-auto"
        />
        <ul className="space-y-stack-xs">
          {segments.map((segment) => {
            const on = source === segment.label;
            return (
              <li key={segment.label}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onSource(on ? ALL_SOURCES : segment.label)}
                  className={cn(
                    filterRow(on),
                    "flex items-center gap-inline-md",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-pill"
                    style={{ background: toneVar[segment.tone] }}
                  />
                  <span className="min-w-0 flex-1 text-body-sm text-fg">
                    {segment.label}
                  </span>
                  <span className="text-label-md text-fg tabular-nums">
                    {segment.value}
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

function ProgramEnrollment({
  list,
  program,
  onProgram,
}: {
  list: Patient[];
  program: string;
  onProgram: (program: string) => void;
}) {
  const counts = countBy(list, (p) => p.program, PROGRAM_ORDER);
  const max = Math.max(...counts.map((row) => row.value), 1);

  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Program Enrollment" />
      {/* One measure — headcount — across programs, so one hue. The row
          label carries identity; colour would only repeat it. */}
      <ul className="space-y-stack-sm">
        {counts.map((row) => {
          const on = program === row.label;
          return (
            <li key={row.label}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onProgram(on ? ALL_PROGRAMS : row.label)}
                className={filterRow(on)}
              >
                <span className="flex items-baseline justify-between gap-inline-md">
                  <span className="text-body-sm text-fg-secondary">
                    {row.label}
                  </span>
                  <span className="text-label-md text-fg tabular-nums">
                    {row.value}
                  </span>
                </span>
                <Progress
                  value={row.value}
                  max={max}
                  label={`${row.label} enrollment`}
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

function EnrollmentStatusPanel({
  list,
  status,
  onStatus,
}: {
  list: Patient[];
  status: string;
  onStatus: (status: string) => void;
}) {
  const counts = countBy(list, (p) => p.status, STATUS_ORDER);

  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title="Enrollment Status" />
      {/* States, not series, so they wear the reserved status tones — and
          the badge carries the word, never colour alone. */}
      <ul className="space-y-stack-xs">
        {counts.map((row) => {
          const pct = list.length
            ? Math.round((row.value / list.length) * 100)
            : 0;
          const on = status === row.label;
          return (
            <li key={row.label}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onStatus(on ? ALL_STATUSES : row.label)}
                className={cn(
                  filterRow(on),
                  "flex items-center justify-between gap-inline-md",
                )}
              >
                <Badge tone={statusTone[row.label as EnrollmentStatus]}>
                  {row.label}
                </Badge>
                <span className="text-body-sm text-fg-secondary tabular-nums">
                  {row.value}
                  <span className="text-fg-muted"> · {pct}%</span>
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} height={164} className="rounded-card" />
        ))}
      </div>
      <Skeleton height={640} className="rounded-card" />
    </div>
  );
}

/**
 * The filters live in the URL as well as in state (?status=, ?program=,
 * ?source=), so a link, Back or a refresh land on the same view. Values
 * that are not on the menus are ignored rather than trusted.
 */
function EnrollmentView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const clinic = useClinicData();
  const list = useMemo(() => clinic.data?.patients ?? [], [clinic.data]);

  const [filters, setFilters] = useState<Filters>(() => {
    const pick = (
      key: string,
      options: readonly string[],
      fallback: string,
    ) => {
      const value = params.get(key) ?? "";
      return options.includes(value) ? value : fallback;
    };
    return {
      query: "",
      program: pick("program", programOptions, ALL_PROGRAMS),
      status: pick("status", statusOptions, ALL_STATUSES),
      source: pick("source", sourceOptions, ALL_SOURCES),
    };
  });

  const [enrolling, setEnrolling] = useState(false);
  const [justEnrolled, setJustEnrolled] = useState<{
    name: string;
    patientId: string | null;
    ccm?: boolean;
  } | null>(null);

  function updateFilters(change: Partial<Filters>) {
    const next = { ...filters, ...change };
    setFilters(next);
    /* Search stays out of the URL: it would rewrite history per keystroke. */
    if ("query" in change && Object.keys(change).length === 1) return;
    const query = new URLSearchParams();
    if (next.status !== ALL_STATUSES) query.set("status", next.status);
    if (next.program !== ALL_PROGRAMS) query.set("program", next.program);
    if (next.source !== ALL_SOURCES) query.set("source", next.source);
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  /* The table pages on the server (page, limit, search by name or MRN,
     BE-2 program). Status and referral source have no roster filter on
     the server, and search also matches a status word: while one of those
     is in use, the table filters the shared window instead and says so
     when the window is not the whole roster. */
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(ROWS_PER_PAGE_OPTIONS[0]);
  const filterKey = `${filters.query}|${filters.program}|${filters.status}|${filters.source}|${perPage}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    /* A filter change returns to page 1 (adjusted during render). */
    setLastFilterKey(filterKey);
    setPage(1);
  }
  const serverMode =
    filters.status === ALL_STATUSES &&
    filters.source === ALL_SOURCES &&
    !searchesStatus(filters.query);
  const serverPage = useRosterPage(
    {
      search: filters.query,
      program:
        filters.program === ALL_PROGRAMS
          ? null
          : (programFor(filters.program)?.program ?? null),
      page,
      limit: perPage,
    },
    serverMode,
  );
  const view = useMemo((): TableView => {
    if (serverMode) return serverPage;
    return {
      ...paginate(filterPatients(list, filters), page, perPage),
      isFetching: false,
      error: null,
      refetch: clinic.refetch,
    };
  }, [serverMode, serverPage, list, filters, page, perPage, clinic.refetch]);

  function enrolled(name: string, patientId: string | null, ccm?: boolean) {
    setEnrolling(false);
    setJustEnrolled({ name, patientId, ccm });
    /* Clear the filters so the new patient is in view, not hidden by a
       status filter they do not match. */
    updateFilters({ query: "", ...NO_FILTERS });
  }

  if (clinic.error) {
    return (
      <ErrorState
        title={errorTitleFor(clinic.error, "Enrollments could not be loaded")}
        message={errorMessageFor(clinic.error, undefined)}
        error={clinic.error}
        onRetry={canRetry(clinic.error) ? clinic.refetch : undefined}
      />
    );
  }

  if (clinic.isPending) return <PageSkeleton />;

  return (
    <>
      {justEnrolled ? (
        <Alert
          tone="success"
          icon={<CheckCircle2 />}
          title={
            justEnrolled.ccm
              ? `${justEnrolled.name} is enrolled in CCM.`
              : `${justEnrolled.name} is enrolled.`
          }
          onDismiss={() => setJustEnrolled(null)}
          action={
            <Link
              href={
                justEnrolled.ccm || !justEnrolled.patientId
                  ? "/dashboard/nephrology"
                  : memberLink({ patientId: justEnrolled.patientId })
              }
              className={outlineLink}
            >
              {justEnrolled.ccm
                ? "View on the CCM dashboard"
                : "View on the Member page"}
            </Link>
          }
        >
          {justEnrolled.ccm
            ? "They are on your CCM dashboard now."
            : "They are highlighted in the list below and count toward your contract seats."}
        </Alert>
      ) : null}

      <SummaryCards
        total={clinic.data?.rosterTotal ?? list.length}
        seats={clinic.data?.seats ?? null}
        onEnroll={() => setEnrolling(true)}
      />

      {list.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No patients enrolled yet"
          description="Enroll your first patient to start their program."
          action={
            <Button size="small" onClick={() => setEnrolling(true)}>
              <Plus className="h-4 w-4" />
              Enroll New Patient
            </Button>
          }
        />
      ) : (
        <>
          <PatientTable
            list={list}
            view={view}
            perPage={perPage}
            onPage={setPage}
            onPerPage={setPerPage}
            note={
              serverMode ? null : (
                <WindowNote
                  window={clinic.data?.window}
                  what="These filters cover"
                  noun="patients"
                  className="mb-stack-md"
                />
              )
            }
            filters={filters}
            onFilters={updateFilters}
            highlightId={justEnrolled?.patientId ?? null}
          />

          <WindowNote
            window={clinic.data?.window}
            what="Export and the breakdowns cover"
            noun="patients"
          />
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <EnrollmentSources
              list={list}
              source={filters.source}
              onSource={(source) => updateFilters({ source })}
            />
            <ProgramEnrollment
              list={list}
              program={filters.program}
              onProgram={(program) => updateFilters({ program })}
            />
            <EnrollmentStatusPanel
              list={list}
              status={filters.status}
              onStatus={(status) => updateFilters({ status })}
            />
          </section>
        </>
      )}

      {enrolling ? (
        <EnrollPatientModal
          onClose={() => setEnrolling(false)}
          onEnrolled={enrolled}
        />
      ) : null}
    </>
  );
}

export default function ClinicEnrollment() {
  /* Read here as well as in the view below so the refresh control can sit
     on the title row. Both calls share one query key, so react-query serves
     them from the same fetch. */
  const clinic = useClinicData();

  return (
    <div className="space-y-4">
      <PageTitle
        href="/dashboard/clinic/enroll-patients"
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
        <EnrollmentView />
      </Suspense>
    </div>
  );
}
