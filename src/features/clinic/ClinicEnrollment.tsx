"use client";

import React, { useMemo, useState } from "react";
import {
  Download,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Target,
  Users,
} from "lucide-react";

import { PageTitle } from "@/components/layout/PageTitle";
import {
  Badge,
  Button,
  Card,
  ChartLegend,
  DonutChart,
  Input,
  Progress,
  ProgressRing,
  Select,
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TablePagination,
  TableRow,
  type DonutSegment,
} from "@/components/ui";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";
import { tableIconButton } from "./tableButton";
import {
  ALL_PROGRAMS,
  ALL_STATUSES,
  CONTRACT_SLOTS,
  countBy,
  enrolledCount,
  enrollmentGoalPct,
  filterPatients,
  paginate,
  patients,
  PROGRAM_ORDER,
  programOptions,
  ROWS_PER_PAGE_OPTIONS,
  SOURCE_ORDER,
  STATUS_ORDER,
  slotsRemaining,
  statusOptions,
  statusTone,
  type EnrollmentStatus,
} from "./enrollment.data";

/* Sources are four identities, so they take the categorical ramp in a
   fixed order — a filter that drops one must never repaint the rest. */
const SOURCE_TONES = ["cat-1", "cat-4", "cat-6", "cat-7"] as const;

function SummaryCards() {
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
          {enrolledCount}
          <span className="text-heading-4 text-fg-muted">
            {" "}
            / {CONTRACT_SLOTS}
          </span>
        </p>
        <p className="mt-stack-sm text-body-sm text-fg-muted">
          {slotsRemaining} slots remaining
        </p>
      </Card>

      <Card as="article" padding="small" className="min-h-[164px]">
        <p className="text-heading-5 text-fg-secondary">Enroll New Patient</p>
        <p className="mt-stack-xs text-body-sm text-fg-muted">
          Add a new patient to your program.
        </p>
        <Button
          {...notBuiltYet("Enrolling a patient")}
          size="small"
          fullWidth
          className="mt-stack-md"
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
        <Button
          {...notBuiltYet("Viewing the contract")}
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          fullWidth
          className="mt-stack-md"
        >
          View Contract
        </Button>
      </Card>

      <Card as="article" padding="small" className="min-h-[164px]">
        <div className="flex items-center gap-inset-sm">
          <ProgressRing
            value={enrollmentGoalPct}
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
              {enrolledCount} of {CONTRACT_SLOTS} enrolled
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}

function PatientTable() {
  const [query, setQuery] = useState("");
  const [program, setProgram] = useState(ALL_PROGRAMS);
  const [status, setStatus] = useState(ALL_STATUSES);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () => filterPatients(patients, { query, program, status }),
    [query, program, status],
  );

  const view = useMemo(
    () => paginate(filtered, page, perPage),
    [filtered, page, perPage],
  );

  /* A filter that leaves the reader stranded on page 4 of a 1-page result
     shows an empty table and no reason for it, so changing any filter goes
     back to page 1.
     
     This adjusts state during render rather than in an effect. An effect
     would render the stale page first and the corrected one after, which
     is the cascading render the lint rule is about; React re-runs this
     component immediately instead, before anything reaches the screen. */
  const filterKey = `${query}|${program}|${status}|${perPage}`;
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

  return (
    <Card as="section" padding="small">
      <div className="mb-stack-lg">
        <h2 className="text-heading-4 text-fg">Enrolled Patients</h2>
        <p className="mt-stack-xs text-body-sm text-fg-muted">
          Add, manage, and track patients enrolled in your NephroReach program.
        </p>
      </div>

      {/* Filters in one row above the table they filter. */}
      <div className="mb-stack-lg flex flex-col gap-inline-md lg:flex-row lg:items-center">
        <Input
          type="search"
          inputSize="small"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, MRN, or status..."
          aria-label="Search patients"
          leadingIcon={<Search aria-hidden="true" />}
          className="lg:max-w-xs lg:flex-1"
        />
        <Select
          selectSize="small"
          aria-label="Program"
          value={program}
          onChange={(event) => setProgram(event.target.value)}
        >
          {programOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
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
        <div className="flex gap-inline-md lg:ml-auto">
          <Button {...notBuiltYet("Enrolling a patient")} size="small">
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
        <p className="mb-stack-sm text-body-sm text-fg-secondary">
          {selected.size} selected.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-control border border-line">
        <Table minWidth={1040}>
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
              <TableHeaderCell>MRN</TableHeaderCell>
              <TableHeaderCell>Program Assigned</TableHeaderCell>
              <TableHeaderCell>Enrollment Date</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Start Date</TableHeaderCell>
              <TableHeaderCell>Progress</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {view.rows.length === 0 ? (
              <TableEmptyRow colSpan={9}>
                No patients match these filters.
              </TableEmptyRow>
            ) : (
              view.rows.map((patient) => (
                <TableRow key={patient.mrn}>
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
                  </TableCell>
                  <TableCell className="tabular-nums">{patient.mrn}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {patient.program}
                  </TableCell>
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
                  <TableCell className="text-right">
                    <Button
                      {...notBuiltYet("Patient actions")}
                      variant="neutral"
                      appearance="fill-stroke"
                      size="small"
                      iconOnly
                      className={tableIconButton}
                      aria-label={`Actions for ${patient.name}`}
                    >
                      <MoreHorizontal aria-hidden="true" />
                    </Button>
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

function EnrollmentSources() {
  const counts = countBy(patients, (p) => p.source, SOURCE_ORDER);
  const segments: DonutSegment[] = counts.map((entry, index) => ({
    label: entry.label,
    value: entry.value,
    tone: SOURCE_TONES[index],
  }));

  return (
    <Card as="section" padding="small">
      <h2 className="mb-stack-lg text-heading-4 text-fg">Enrollment Sources</h2>
      <div className="grid items-center gap-inset-md sm:grid-cols-[160px_minmax(0,1fr)]">
        <DonutChart
          segments={segments}
          label="Enrollment sources"
          size={160}
          thickness={30}
          centerValue={enrolledCount}
          centerLabel="Enrolled"
          className="mx-auto"
        />
        <ChartLegend
          items={segments.map((segment) => ({
            label: segment.label,
            tone: segment.tone ?? "cat-1",
            value: segment.value,
          }))}
        />
      </div>
    </Card>
  );
}

function ProgramEnrollment() {
  const counts = countBy(patients, (p) => p.program, PROGRAM_ORDER);
  const other = enrolledCount - counts.reduce((sum, c) => sum + c.value, 0);
  const rows = [...counts, { label: "Other Programs", value: other }];
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <Card as="section" padding="small">
      <h2 className="mb-stack-lg text-heading-4 text-fg">Program Enrollment</h2>
      {/* One measure — headcount — across three programs, so one hue. The
          row label carries identity; colour would only repeat it. */}
      <ul className="space-y-stack-md">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="flex items-baseline justify-between gap-inline-md">
              <span className="text-body-sm text-fg-secondary">
                {row.label}
              </span>
              <span className="text-label-md text-fg tabular-nums">
                {row.value}
              </span>
            </div>
            <Progress
              value={row.value}
              max={max}
              label={`${row.label} enrollment`}
              size="small"
              className="mt-stack-xs"
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function EnrollmentStatusPanel() {
  const counts = countBy(patients, (p) => p.status, STATUS_ORDER);

  return (
    <Card as="section" padding="small">
      <h2 className="mb-stack-lg text-heading-4 text-fg">Enrollment Status</h2>
      {/* These are states, not series, so they wear the reserved status
          tones — and the badge carries the word, never colour alone. */}
      <ul className="space-y-stack-md">
        {counts.map((row) => {
          const pct = Math.round((row.value / enrolledCount) * 100);
          return (
            <li
              key={row.label}
              className="flex items-center justify-between gap-inline-md"
            >
              <Badge tone={statusTone[row.label as EnrollmentStatus]}>
                {row.label}
              </Badge>
              <span className="text-body-sm text-fg-secondary tabular-nums">
                {row.value}
                <span className="text-fg-muted"> · {pct}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default function ClinicEnrollment() {
  return (
    <div className="space-y-4">
      <PageTitle href="/dashboard/clinic/enroll-patients" />

      <SummaryCards />

      <PatientTable />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <EnrollmentSources />
        <ProgramEnrollment />
        <EnrollmentStatusPanel />
      </section>
    </div>
  );
}
