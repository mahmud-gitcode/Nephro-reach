"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Download,
  Eye,
  FileText,
  MessageSquareText,
  Plus,
  Search,
  Target,
  Users,
} from "lucide-react";

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
  Progress,
  ProgressRing,
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
import { notBuiltYet } from "@/lib/utils/notBuiltYet";
import { tableIconButton } from "./tableButton";
import { shortProgram } from "./clinicIcons";
import { memberLink } from "./clinicDashboard.data";
import {
  ALL_PROGRAMS,
  ALL_SOURCES,
  ALL_STATUSES,
  CONTRACT_SLOTS,
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
import { useClinicData } from "./useClinicData";

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
  list,
  onEnroll,
}: {
  list: Patient[];
  onEnroll: () => void;
}) {
  const enrolled = list.length;
  const remaining = Math.max(0, CONTRACT_SLOTS - enrolled);
  const goalPct = Math.round((enrolled / CONTRACT_SLOTS) * 100);
  const full = remaining === 0;

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card as="article" padding="small" className="min-h-[164px]">
        <div className="mb-stack-md flex items-start justify-between gap-inline-lg">
          <p className="text-heading-5 text-fg-secondary">Patients Enrolled</p>
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-control bg-surface-brand-subtle"
          >
            <Users className="h-5 w-5 text-brand-600" />
          </span>
        </div>
        <p className="text-metric-lg text-fg">
          {enrolled}
          <span className="text-heading-4 text-fg-muted">
            {" "}
            / {CONTRACT_SLOTS}
          </span>
        </p>
        <p className="mt-stack-sm text-body-sm text-fg-muted">
          {remaining} slots remaining
        </p>
      </Card>

      <Card as="article" padding="small" className="min-h-[164px]">
        <p className="text-heading-5 text-fg-secondary">Enroll New Patient</p>
        <p className="mt-stack-xs text-body-sm text-fg-muted">
          {full
            ? "Every contract seat is filled."
            : "Add a new patient to your program."}
        </p>
        {/* A full contract disables the button and says why, rather than
            opening a form that can only fail. */}
        <Button
          size="small"
          fullWidth
          className="mt-stack-md"
          onClick={onEnroll}
          disabled={full}
          title={full ? "All contract seats are filled" : undefined}
        >
          <Plus className="h-4 w-4" />
          Enroll New Patient
        </Button>
      </Card>

      <Card as="article" padding="small" className="min-h-[164px]">
        <div className="mb-stack-md flex items-start justify-between gap-inline-lg">
          <p className="text-heading-5 text-fg-secondary">
            Total Contract Slots
          </p>
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-control bg-surface-sunken"
          >
            <FileText className="h-5 w-5 text-fg-secondary" />
          </span>
        </div>
        <p className="text-metric-lg text-fg">{CONTRACT_SLOTS}</p>
        <Link href={BILLING} className={cn(outlineLink, "mt-stack-md w-full")}>
          View Contract
        </Link>
      </Card>

      <Card as="article" padding="small" className="min-h-[164px]">
        <div className="flex items-center gap-inset-sm">
          <ProgressRing
            value={goalPct}
            label="Enrollment goal"
            size={84}
            thickness={10}
          />
          <div className="min-w-0">
            <p className="flex items-center gap-inline-xs text-heading-5 text-fg-secondary">
              <Target aria-hidden="true" className="h-4 w-4 shrink-0" />
              Enrollment Goal
            </p>
            <p className="mt-stack-xs text-body-sm text-fg-secondary">
              {enrolled} of {CONTRACT_SLOTS} enrolled
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}

/* --------------------------------------------------------------- table */

function PatientTable({
  list,
  filters,
  onFilters,
  onEnroll,
  highlightMrn,
}: {
  list: Patient[];
  filters: Filters;
  onFilters: (change: Partial<Filters>) => void;
  onEnroll: () => void;
  highlightMrn: string | null;
}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () => filterPatients(list, filters),
    [list, filters],
  );
  const view = paginate(filtered, page, perPage);

  /* A filter change — from these controls or the panels below — returns
     to page 1. Adjusted during render rather than in an effect. */
  const filterKey = `${filters.query}|${filters.program}|${filters.status}|${filters.source}|${perPage}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const pageMrns = view.rows.map((patient) => patient.mrn);
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
  const full = list.length >= CONTRACT_SLOTS;

  return (
    <Card as="section" padding="small" aria-labelledby="enrolled-heading">
      <div className="mb-stack-lg">
        <h2 id="enrolled-heading" className="text-heading-4 text-fg">
          Enrolled Patients
        </h2>
        <p className="mt-stack-xs text-body-sm text-fg-muted">
          Add, manage, and track patients enrolled in your NephroReach program.
        </p>
      </div>

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
        <div className="flex gap-inline-md lg:ml-auto">
          <Button size="small" onClick={onEnroll} disabled={full}>
            <Plus className="h-4 w-4" />
            Enroll New Patient
          </Button>
          <Button
            {...notBuiltYet("Exporting the patient list")}
            variant="neutral"
            appearance="fill-stroke"
            size="small"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
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

      <div className="overflow-hidden rounded-control border border-line">
        <Table minWidth={980}>
          <TableHead className="bg-surface-sunken">
            <TableRow>
              <TableHeaderCell className="w-10">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
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
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {view.rows.length === 0 ? (
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
              view.rows.map((patient) => (
                <TableRow
                  key={patient.mrn}
                  className={
                    patient.mrn === highlightMrn
                      ? "bg-success-surface"
                      : undefined
                  }
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(patient.mrn)}
                      onChange={() => toggleOne(patient.mrn)}
                      aria-label={`Select ${patient.name}`}
                      className="h-4 w-4 cursor-pointer accent-brand-600"
                    />
                  </TableCell>
                  <TableCell emphasis className="whitespace-nowrap">
                    {patient.name}
                    <span className="block text-caption font-normal text-fg-muted tabular-nums">
                      MRN {patient.mrn}
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
                      <span className="tabular-nums">{patient.progress}%</span>
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {patient.source}
                  </TableCell>
                  <TableCell>
                    <span className="flex justify-end gap-inline-xs">
                      <Link
                        href={memberLink({ mrn: patient.mrn })}
                        className={iconControl}
                        aria-label={`View ${patient.name} on the Member page`}
                        title="View member"
                      >
                        <Eye aria-hidden="true" />
                      </Link>
                      <Link
                        href={MESSAGES}
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
    mrn: string;
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

  function enrolled(name: string, mrn: string) {
    setEnrolling(false);
    setJustEnrolled({ name, mrn });
    /* Clear the filters so the new patient is in view, not hidden by a
       status filter they do not match. */
    updateFilters({ query: "", ...NO_FILTERS });
  }

  if (clinic.error) {
    return (
      <ErrorState
        title="Enrollments could not be loaded"
        error={clinic.error}
        onRetry={clinic.refetch}
      />
    );
  }

  if (clinic.isPending) return <PageSkeleton />;

  return (
    <>
      <UpdatedBar
        updatedAt={clinic.updatedAt}
        isFetching={clinic.isFetching}
        refetch={clinic.refetch}
      />

      {justEnrolled ? (
        <Alert
          tone="success"
          icon={<CheckCircle2 />}
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
          They are highlighted in the list below and count toward your contract
          seats.
        </Alert>
      ) : null}

      <SummaryCards list={list} onEnroll={() => setEnrolling(true)} />

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
            filters={filters}
            onFilters={updateFilters}
            onEnroll={() => setEnrolling(true)}
            highlightMrn={justEnrolled?.mrn ?? null}
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
          list={list}
          onClose={() => setEnrolling(false)}
          onEnrolled={enrolled}
        />
      ) : null}
    </>
  );
}

export default function ClinicEnrollment() {
  return (
    <div className="space-y-4">
      <PageTitle href="/dashboard/clinic/enroll-patients" />
      {/* useSearchParams needs a Suspense boundary on a prerendered page. */}
      <Suspense fallback={<PageSkeleton />}>
        <EnrollmentView />
      </Suspense>
    </div>
  );
}
