"use client";

import { useExternalShare } from "@/features/sharing/ExternalShareNotice";
import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  GraduationCap,
  MessageSquareText,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  CheckCircleSolid,
  ClockSolid,
  NotStartedSolid,
  TargetSolid,
  UsersSolid,
} from "@/components/icons/solid";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  Badge,
  Button,
  buttonStyles,
  Card,
  ChartLegend,
  DonutChart,
  EmptyState,
  ErrorState,
  Input,
  KeyCard,
  Modal,
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
  Tabs,
  toneVar,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { JOURNEY_DAYS } from "@/features/education/dialysisJourneyData";
import { tableIconButton } from "./tableButton";
import { initials } from "./clinicIcons";
import { memberLink, messageLink } from "./clinicDashboard.data";
import { paginate, ROWS_PER_PAGE_OPTIONS } from "./enrollment.data";
import {
  ALL_PROGRAMS,
  ALL_STATUSES,
  COURSES,
  curriculumText,
  filterMembers,
  journeyDetails,
  membersByStatus,
  membersByStatusHeading,
  moduleBreakdown,
  overallCompletion,
  programOptions,
  programOverview,
  recentActivity,
  statusOptions,
  statusTone,
  stepLabel,
  summaryFor,
  timeToCompletion,
  type MemberProgress,
} from "./curriculumProgress.data";
import { UpdatedBar } from "./UpdatedBar";
import { useClinicData } from "./useClinicData";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { downloadText, toCsv } from "@/lib/utils/download";
import { useLanguage } from "@/context/LanguageContext";

const MESSAGES = "/dashboard/clinic/messages";

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

/* A row or tile that filters the table when pressed. aria-pressed carries
   the state; the tint only echoes it. */
const filterRow = (on: boolean) =>
  cn(
    "w-full cursor-pointer rounded-control-small p-inset-xs text-left hover:bg-surface-sunken",
    on && "bg-surface-brand-subtle",
    focusRing,
  );

type Filters = { query: string; program: string; status: string };

/**
 * One tab per course, plus All Programs.
 *
 * Built from the catalogue, so a fourth course appears here the moment it
 * is declared — this page must not assume there are three of them, any
 * more than it assumes a course is twenty-one days long.
 *
 * It replaces the program dropdown that used to sit in the table's filter
 * row: which course you are looking at steers the whole page, not just the
 * table, so it belongs at the top rather than buried among the filters.
 */
function CourseTabs({
  program,
  onProgram,
}: {
  program: string;
  onProgram: (program: string) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const items = [
    {
      id: ALL_PROGRAMS,
      label: curriculumText(ALL_PROGRAMS, isEs),
      short: isEs ? "Todos" : "All",
    },
    ...COURSES.map((course) => ({
      id: course.id,
      label: course.id,
      short: course.shortName,
    })),
  ].map((item) => ({
    id: item.id,
    label: (
      /* Both variants are in the DOM and CSS picks one, so both would be
         announced — "Crash Dialysis Crash". The visible pair is hidden
         from assistive tech and the full name given once instead. */
      <>
        <span aria-hidden="true" className="hidden sm:inline">
          {item.label}
        </span>
        <span aria-hidden="true" className="sm:hidden">
          {item.short}
        </span>
        <span className="sr-only">{item.label}</span>
      </>
    ),
  }));

  return (
    <Tabs
      items={items}
      value={program}
      onChange={onProgram}
      label={isEs ? "Curso" : "Course"}
      /* Scrolls rather than wraps: with enough courses the strip has to
         stay one row, or the page header grows a second line per course. */
      className="overflow-x-auto"
    />
  );
}

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

/* ------------------------------------------------------- summary cards

   The status cards filter the table below. Their figures are the
   client's, as given; the table counts the roster, so pressing one shows
   the real list behind it — see the header of curriculumProgress.data.ts
   for why the two differ. */

/**
 * The summary row.
 *
 * These were filter buttons: pressing one narrowed the table. The client
 * asked for key cards not to filter (2026-09-26), and the Status select in
 * the table's own toolbar still does it, so nothing became unreachable.
 */
function SummaryCards({
  list,
  program,
}: {
  list: MemberProgress[];
  program: string;
}) {
  /* Follows the course tabs like everything else on the page: the client's
     own figures across all programs, the roster's own count within one. */
  const { language } = useLanguage();
  const isEs = language === "ES";
  const summary = summaryFor(list, program);

  return (
    <section
      aria-label={isEs ? "Resumen del currículo" : "Curriculum summary"}
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2"
    >
      <KeyCard
        tone="brand"
        icon={<UsersSolid />}
        value={summary.activeLearners}
        label={isEs ? "Estudiantes activos" : "Active Learners"}
        note={
          isEs
            ? `${summary.enrolled} inscritos`
            : `${summary.enrolled} enrolled`
        }
      />
      <KeyCard
        tone="accent"
        icon={<TargetSolid />}
        value={`${summary.averageCompletion}%`}
        label={
          isEs
            ? "Finalización promedio del currículo"
            : "Average Curriculum Completion"
        }
      />
      <KeyCard
        tone="success"
        icon={<CheckCircleSolid />}
        value={summary.completed}
        label={
          isEs
            ? "Miembros que completaron el programa"
            : "Members Completed Program"
        }
      />
      <KeyCard
        tone="warning"
        icon={<ClockSolid />}
        value={summary.inProgress}
        label={isEs ? "En curso" : "In Progress"}
      />
      <KeyCard
        tone="neutral"
        icon={<NotStartedSolid />}
        value={summary.notStarted}
        label={isEs ? "Sin iniciar" : "Not Started"}
      />
    </section>
  );
}

function ProgramProgressOverview({ program }: { program: string }) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const shown =
    program === ALL_PROGRAMS
      ? programOverview
      : programOverview.filter((overview) => overview.id === program);

  return (
    /* No visible heading: the tab strip directly above already says which
       course these cards are for, and each card carries its own name. The
       region keeps a label so it is still announced and reachable. */
    <Card
      as="section"
      padding="small"
      aria-label={isEs ? "Progreso del programa" : "Program progress"}
    >
      {/* auto-fit rather than a fixed three columns: a fourth course must
          wrap into the grid, not squeeze the other three, and a single
          selected course fills the row rather than stranding two gaps. */}
      <ul className="grid [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))] gap-4">
        {shown.map((overview) => (
          <li
            key={overview.name}
            className="h-full rounded-control border border-line-subtle bg-surface-sunken p-inset-md"
          >
            <p className="text-heading-5 text-fg">{overview.name}</p>
            <p className="mt-stack-md flex items-baseline justify-between gap-inline-md">
              <span className="text-body-sm text-fg-secondary">
                {isEs ? "Progreso" : "Progress"}
              </span>
              <span className="text-label-lg text-fg tabular-nums">
                {overview.progress}%
              </span>
            </p>
            <Progress
              value={overview.progress}
              label={
                isEs
                  ? `Progreso de ${overview.name}`
                  : `${overview.name} progress`
              }
              size="medium"
              className="mt-stack-xs"
            />
            {/* One row, separated rather than stacked: three short counts
                read as a single line about the course, and stacking them
                made every card three lines taller than it needed to be. */}
            <ul className="mt-stack-md flex flex-wrap items-center gap-x-inline-md gap-y-stack-xs">
              {overview.stats.map((stat, index) => (
                <li
                  key={stat}
                  className="flex items-center gap-x-inline-md text-body-sm text-fg-secondary tabular-nums"
                >
                  {index > 0 ? (
                    <span
                      aria-hidden="true"
                      className="h-3 w-px shrink-0 bg-line"
                    />
                  ) : null}
                  {curriculumText(stat, isEs)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* --------------------------------------------------------------- table */

function MemberTable({
  list,
  filters,
  onFilters,
  onView,
}: {
  list: MemberProgress[];
  filters: Filters;
  onFilters: (change: Partial<Filters>) => void;
  onView: (patientId: string) => void;
}) {
  /* Leaves NephroReach: ask first (client, 2026-10-07). */
  const { language } = useLanguage();
  const isEs = language === "ES";
  const share = useExternalShare();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => filterMembers(list, filters), [list, filters]);
  const view = paginate(filtered, page, perPage);

  /* A filter change — from these controls, the cards or the panels —
     returns to page 1. Adjusted during render rather than in an effect. */
  const filterKey = `${filters.query}|${filters.program}|${filters.status}|${perPage}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const pageMrns = view.rows.map((member) => member.id);
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
    filters.status !== ALL_STATUSES;

  return (
    <Card
      as="section"
      padding="small"
      id="member-progress"
      className="scroll-mt-4"
    >
      <PanelHeading
        title={
          isEs
            ? "Progreso del currículo por miembro"
            : "Member Curriculum Progress"
        }
      />

      <div className="mb-stack-lg flex flex-col gap-inline-md lg:flex-row lg:items-center">
        <Input
          type="search"
          inputSize="small"
          value={filters.query}
          onChange={(event) => onFilters({ query: event.target.value })}
          placeholder={
            isEs ? "Buscar por nombre o MRN..." : "Search by name or MRN..."
          }
          aria-label={isEs ? "Buscar miembros" : "Search members"}
          leadingIcon={<Search aria-hidden="true" />}
          className="lg:max-w-xs lg:flex-1"
        />
        <Select
          selectSize="small"
          aria-label={isEs ? "Estado" : "Status"}
          value={filters.status}
          onChange={(event) => onFilters({ status: event.target.value })}
          className="lg:w-48"
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {curriculumText(option, isEs)}
            </option>
          ))}
        </Select>
        <Button
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          className="lg:ml-auto"
          disabled={filtered.length === 0}
          onClick={() =>
            share.guard(
              () =>
                downloadText(
                  "member-progress.csv",
                  toCsv([
                    [
                      "Name",
                      "MRN",
                      "Program",
                      "Module",
                      "Step",
                      "Of",
                      "Progress %",
                      "Status",
                    ],
                    ...filtered.map((m) => [
                      m.name,
                      m.mrn,
                      m.program,
                      m.module,
                      m.step,
                      m.length,
                      m.progress,
                      m.status,
                    ]),
                  ]),
                ),
              "download",
            )
          }
        >
          <Download className="h-4 w-4" />
          {isEs ? "Exportar" : "Export"}
        </Button>
        {share.notice}
      </div>

      {selected.size > 0 ? (
        <div
          role="region"
          aria-label={isEs ? "Miembros seleccionados" : "Selected members"}
          className="mb-stack-md flex flex-wrap items-center gap-inline-md rounded-control border border-line bg-surface-sunken px-inset-sm py-inset-xs"
        >
          <p className="text-label-md text-fg">
            {isEs
              ? `${selected.size} seleccionados`
              : `${selected.size} selected`}
          </p>
          <Link href={MESSAGES} className={outlineLink}>
            <MessageSquareText className="h-4 w-4" />
            {isEs ? "Enviar mensaje a seleccionados" : "Message selected"}
          </Link>
          <Button
            variant="neutral"
            appearance="stroke"
            size="small"
            onClick={() => setSelected(new Set())}
          >
            {isEs ? "Borrar" : "Clear"}
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-control border border-line">
        <Table minWidth={880}>
          <TableHead className="bg-surface-sunken">
            <TableRow>
              <TableHeaderCell className="w-10">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  disabled={pageMrns.length === 0}
                  onChange={toggleAllOnPage}
                  aria-label={
                    isEs
                      ? "Seleccionar todos los miembros de esta página"
                      : "Select all members on this page"
                  }
                  className="h-4 w-4 cursor-pointer accent-brand-600"
                />
              </TableHeaderCell>
              <TableHeaderCell>{isEs ? "Nombre" : "Name"}</TableHeaderCell>
              <TableHeaderCell>{isEs ? "Programa" : "Program"}</TableHeaderCell>
              <TableHeaderCell>
                {isEs ? "Módulo actual" : "Current Module"}
              </TableHeaderCell>
              <TableHeaderCell>
                {isEs ? "Día/Módulo" : "Day/Module"}
              </TableHeaderCell>
              <TableHeaderCell>
                {isEs ? "Progreso" : "Progress"}
              </TableHeaderCell>
              <TableHeaderCell>{isEs ? "Estado" : "Status"}</TableHeaderCell>
              <TableHeaderCell>
                {isEs ? "Última actividad" : "Last Activity"}
              </TableHeaderCell>
              <TableHeaderCell className="text-right">
                {isEs ? "Acciones" : "Actions"}
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {view.rows.length === 0 ? (
              <TableEmptyRow colSpan={9}>
                <span className="flex flex-wrap items-center gap-inline-md text-body-sm text-fg-secondary">
                  {isEs
                    ? "Ningún miembro coincide con estos filtros."
                    : "No members match these filters."}
                  {filtersOn ? (
                    <Button
                      variant="neutral"
                      appearance="fill-stroke"
                      size="small"
                      onClick={() =>
                        onFilters({
                          query: "",
                          program: ALL_PROGRAMS,
                          status: ALL_STATUSES,
                        })
                      }
                    >
                      {isEs ? "Borrar filtros" : "Clear filters"}
                    </Button>
                  ) : null}
                </span>
              </TableEmptyRow>
            ) : (
              view.rows.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(member.id)}
                      onChange={() => toggleOne(member.id)}
                      aria-label={
                        isEs
                          ? `Seleccionar a ${member.name}`
                          : `Select ${member.name}`
                      }
                      className="h-4 w-4 cursor-pointer accent-brand-600"
                    />
                  </TableCell>
                  <TableCell emphasis className="whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onView(member.id)}
                      className={cn(
                        "cursor-pointer rounded-control-small text-left hover:text-fg-brand hover:underline",
                        focusRing,
                      )}
                    >
                      {member.name}
                    </button>
                    <span className="block text-caption font-normal text-fg-muted tabular-nums">
                      MRN {member.mrn || "—"}
                    </span>
                  </TableCell>
                  <TableCell>{member.program}</TableCell>
                  <TableCell>{curriculumText(member.module, isEs)}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {stepLabel(member, isEs)}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-inline-md">
                      <Progress
                        value={member.progress}
                        label={
                          isEs
                            ? `Progreso del currículo de ${member.name}`
                            : `${member.name} curriculum progress`
                        }
                        size="small"
                        className="w-14"
                      />
                      <span className="tabular-nums">{member.progress}%</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge tone={statusTone[member.status]}>
                      {curriculumText(member.status, isEs)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {member.lastActivity}
                  </TableCell>
                  <TableCell>
                    <span className="flex justify-end gap-inline-xs">
                      <button
                        type="button"
                        onClick={() => onView(member.id)}
                        className={iconControl}
                        aria-label={
                          isEs ? `Ver a ${member.name}` : `View ${member.name}`
                        }
                        title={isEs ? "Ver progreso" : "View progress"}
                      >
                        <Eye aria-hidden="true" />
                      </button>
                      <Link
                        href={messageLink(member.id)}
                        className={iconControl}
                        aria-label={
                          isEs
                            ? `Enviar mensaje a ${member.name}`
                            : `Message ${member.name}`
                        }
                        title={isEs ? "Enviar mensaje" : "Send message"}
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
          {isEs ? "Filas por página" : "Rows per page"}
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
          summary={
            isEs
              ? `Mostrando ${view.firstShown}–${view.lastShown} de ${view.total} miembros`
              : `Showing ${view.firstShown}–${view.lastShown} of ${view.total} members`
          }
        />
      </div>
    </Card>
  );
}

/* --------------------------------------------------------- details popup */

function DetailTile({
  icon: TileIcon,
  label,
  children,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-inline-md rounded-control border border-line-subtle bg-surface-sunken p-inset-sm">
      <TileIcon
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted"
      />
      <div className="min-w-0">
        <dt className="text-caption text-fg-muted">{label}</dt>
        <dd className="mt-stack-xs text-label-lg text-fg">{children}</dd>
      </div>
    </div>
  );
}

/**
 * One member's place in their curriculum, in a popup like the Member
 * page's. This view is about the program — where they are and how far —
 * and links to the Member page for the rest of their record.
 */
function ProgressModal({
  member,
  onClose,
}: {
  member: MemberProgress;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={member.name}
      description={`MRN ${member.mrn || "—"} · ${member.program}`}
      footer={
        <>
          <Link href={messageLink(member.id)} className={outlineLink}>
            <MessageSquareText className="h-4 w-4" />
            {isEs ? "Enviar mensaje" : "Send Message"}
          </Link>
          <Link
            href={memberLink({ patientId: member.id })}
            className={buttonStyles({ size: "small" })}
          >
            {isEs ? "Abrir página del miembro" : "Open Member Page"}
          </Link>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-inline-lg">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-surface-brand-subtle text-heading-5 text-brand-600"
        >
          {initials(member.name)}
        </span>
        <Badge tone={statusTone[member.status]}>
          {curriculumText(member.status, isEs)}
        </Badge>
      </div>

      <div className="mt-stack-lg">
        <div className="flex items-baseline justify-between gap-inline-md">
          <span className="text-body-sm text-fg-secondary">
            {isEs ? "Progreso del currículo" : "Curriculum progress"}
          </span>
          <span className="text-heading-5 text-fg tabular-nums">
            {member.progress}%
          </span>
        </div>
        <Progress
          value={member.progress}
          label={
            isEs
              ? `Progreso del currículo de ${member.name}`
              : `${member.name} curriculum progress`
          }
          size="medium"
          className="mt-stack-xs"
        />
      </div>

      <dl className="mt-stack-lg grid gap-inline-md sm:grid-cols-2">
        <DetailTile
          icon={BookOpen}
          label={isEs ? "Módulo actual" : "Current Module"}
        >
          {curriculumText(member.module, isEs)}
        </DetailTile>
        <DetailTile
          icon={TrendingUp}
          label={isEs ? "Día/Módulo" : "Day/Module"}
        >
          {stepLabel(member, isEs)}
        </DetailTile>
        <DetailTile icon={GraduationCap} label={isEs ? "Programa" : "Program"}>
          {member.program}
        </DetailTile>
        <DetailTile
          icon={Clock}
          label={isEs ? "Última actividad" : "Last Activity"}
        >
          {member.lastActivity}
        </DetailTile>
      </dl>
    </Modal>
  );
}

/* -------------------------------------------------------------- panels

   The lower panels filter too, and show the client's figures as given. */

/** The curriculum as members see it: every day's lesson, in order. */
function CurriculumModal({ onClose }: { onClose: () => void }) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={journeyDetails.name}
      description={
        isEs
          ? `${JOURNEY_DAYS.length} días · las lecciones que completan los miembros`
          : `${JOURNEY_DAYS.length} days · the lessons members work through`
      }
    >
      <ol className="divide-y divide-line-subtle">
        {JOURNEY_DAYS.map((day) => (
          <li key={day.slug} className="flex gap-inline-lg py-inset-xs">
            <span className="w-14 shrink-0 text-label-md text-fg-muted tabular-nums">
              {isEs ? "Día" : "Day"} {day.day}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-label-md text-fg">
                {isEs ? day.titleEs : day.titleEn}
              </span>
              <span className="block text-caption text-fg-muted">
                {day.kind === "video" ? "Video" : isEs ? "Lectura" : "Reading"}{" "}
                · {day.durationMinutes} min
              </span>
              <span className="mt-stack-xs block text-body-sm text-fg-secondary">
                {isEs ? day.summaryEs : day.summaryEn}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </Modal>
  );
}

function ProgramDetails() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const [open, setOpen] = useState(false);
  return (
    <Card as="section" padding="small" className="flex h-full flex-col">
      <PanelHeading
        title={isEs ? "Detalles del programa" : "Program Details"}
      />
      <p className="text-heading-5 text-fg">{journeyDetails.name}</p>
      <p className="mt-stack-xs text-body-sm text-fg-muted">
        {curriculumText(journeyDetails.description, isEs)}
      </p>
      <p className="mt-stack-md text-label-md text-fg-secondary">
        {isEs ? "Incluye:" : "Includes:"}
      </p>
      <ul className="mt-stack-xs space-y-stack-xs">
        {journeyDetails.includes.map((item) => (
          <li
            key={item}
            className="flex items-center gap-inline-md text-body-sm text-fg"
          >
            <CheckCircle2
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-success"
            />
            {curriculumText(item, isEs)}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-inset-md">
        <Button
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          fullWidth
          onClick={() => setOpen(true)}
        >
          {isEs ? "Ver currículo" : "View Curriculum"}
        </Button>
      </div>
      {open ? <CurriculumModal onClose={() => setOpen(false)} /> : null}
    </Card>
  );
}

function ModuleCompletionBreakdown() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  return (
    <Card as="section" padding="small" className="flex h-full flex-col">
      <PanelHeading
        title={
          isEs
            ? "Desglose de finalización de módulos"
            : "Module Completion Breakdown"
        }
      />
      <ChartLegend
        items={moduleBreakdown.map((row) => ({
          label: curriculumText(row.label, isEs),
          tone: row.tone,
          value: row.value,
        }))}
      />
      <div className="mt-auto border-t border-line-subtle pt-inset-sm">
        <div className="flex items-baseline justify-between gap-inline-md">
          <span className="text-label-md text-fg-secondary">
            {isEs ? "Finalización general" : "Overall Completion"}
          </span>
          <span className="text-heading-5 text-fg tabular-nums">
            {overallCompletion}%
          </span>
        </div>
        <Progress
          value={overallCompletion}
          label={
            isEs
              ? "Finalización general de módulos"
              : "Overall module completion"
          }
          tone="success"
          size="medium"
          className="mt-stack-xs"
        />
      </div>
    </Card>
  );
}

function RecentModuleActivity({
  list,
  onView,
}: {
  list: MemberProgress[];
  onView: (patientId: string) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading
        title={
          isEs ? "Actividad reciente de módulos" : "Recent Module Activity"
        }
      />
      {recentActivity.length === 0 ? (
        <p className="text-body-sm text-fg-muted">
          {isEs ? "Aún no hay actividad." : "No activity yet."}
        </p>
      ) : null}
      <ul className="divide-y divide-line-subtle">
        {recentActivity.map((entry) => {
          const member = list.find((m) => m.id === entry.patientId);
          return (
            <li
              key={`${entry.name}-${entry.subject}`}
              className="flex items-start gap-inline-lg py-inset-xs first:pt-0 last:pb-0"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-surface-brand-subtle text-label-md text-brand-600"
              >
                {initials(entry.name)}
              </span>
              <div className="min-w-0 flex-1">
                {member ? (
                  <button
                    type="button"
                    onClick={() => onView(member.id)}
                    className={cn(
                      "cursor-pointer rounded-control-small text-left text-label-lg text-fg hover:text-fg-brand hover:underline",
                      focusRing,
                    )}
                  >
                    {entry.name}
                  </button>
                ) : (
                  <p className="text-label-lg text-fg">{entry.name}</p>
                )}
                <p className="text-body-sm text-fg-secondary">
                  {entry.action}: {entry.subject}
                </p>
              </div>
              <span className="shrink-0 text-caption text-fg-muted">
                {entry.when}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function ProgramCompletionRate({
  program,
  onProgram,
}: {
  program: string;
  onProgram: (program: string) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading
        title={
          isEs ? "Tasa de finalización del programa" : "Program Completion Rate"
        }
      />
      {/* One measure across every course, so one hue — the label carries
          which course, colour would only repeat it. */}
      <ul className="space-y-stack-sm">
        {programOverview.map((overview) => {
          const target = overview.id;
          const on = program === target;
          return (
            <li key={overview.name}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onProgram(on ? ALL_PROGRAMS : target)}
                className={filterRow(on)}
              >
                <span className="flex items-baseline justify-between gap-inline-md">
                  <span className="text-body-sm text-fg-secondary">
                    {target}
                  </span>
                  <span className="text-label-md text-fg tabular-nums">
                    {overview.progress}%
                  </span>
                </span>
                <Progress
                  value={overview.progress}
                  label={
                    isEs
                      ? `Tasa de finalización de ${overview.name}`
                      : `${overview.name} completion rate`
                  }
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

function MembersByStatus({
  status,
  onStatus,
}: {
  status: string;
  onStatus: (status: string) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading
        title={isEs ? "Miembros por estado" : "Members by Status"}
      />
      <div className="grid items-center gap-inset-md sm:grid-cols-[140px_minmax(0,1fr)]">
        <DonutChart
          segments={membersByStatus}
          label={isEs ? "Miembros por estado" : "Members by status"}
          size={140}
          thickness={26}
          centerValue={membersByStatusHeading}
          centerLabel={isEs ? "Miembros" : "Members"}
          className="mx-auto"
        />
        <ul className="space-y-stack-xs">
          {membersByStatus.map((row) => {
            const on = status === row.label;
            return (
              <li key={row.label}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onStatus(on ? ALL_STATUSES : row.label)}
                  className={cn(
                    filterRow(on),
                    "flex items-center gap-inline-md",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-pill"
                    style={{ background: toneVar[row.tone] }}
                  />
                  <span className="min-w-0 flex-1 text-body-sm text-fg">
                    {curriculumText(row.label, isEs)}
                  </span>
                  <span className="text-label-md text-fg tabular-nums">
                    {row.value}
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

function TimeToCompletion({
  program,
  onProgram,
}: {
  program: string;
  onProgram: (program: string) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading
        title={
          isEs
            ? "Tiempo hasta la finalización (promedio)"
            : "Time to Completion (Average)"
        }
      />
      <ul className="space-y-stack-xs">
        {timeToCompletion.map((row) => {
          const on = program === row.program;
          return (
            <li key={row.program}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onProgram(on ? ALL_PROGRAMS : row.program)}
                className={cn(filterRow(on), "flex items-center gap-inline-lg")}
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface-sunken text-fg-secondary"
                >
                  <Clock className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 text-body-sm text-fg-secondary">
                  {row.program}
                </span>
                <span className="text-label-lg text-fg tabular-nums">
                  {curriculumText(row.average, isEs)}
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} height={144} className="rounded-card" />
        ))}
      </div>
      <Skeleton height={720} className="rounded-card" />
    </div>
  );
}

/**
 * Filters and the open member live in the URL as well as in state
 * (?status=, ?program=, ?patient=<patientId>; ?q= is read from older
 * links; an old ?mrn= link opens the list, never a member), so a link,
 * Back or a refresh land on the same view. Values that are not on the
 * menus or the roster are ignored rather than trusted.
 */
function CurriculumView() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const clinic = useClinicData();
  const list = useMemo(() => clinic.data?.curriculum ?? [], [clinic.data]);

  const [filters, setFilters] = useState<Filters>(() => {
    const status = params.get("status") ?? "";
    const program = params.get("program") ?? "";
    return {
      query: params.get("q") ?? "",
      status: statusOptions.includes(status) ? status : ALL_STATUSES,
      program: programOptions.includes(program) ? program : ALL_PROGRAMS,
    };
  });
  const [openId, setOpenId] = useState<string | null>(params.get("patient"));
  const open = list.find((member) => member.id === openId) ?? null;

  function writeUrl(next: Filters, patientId: string | null) {
    const query = new URLSearchParams();
    if (next.status !== ALL_STATUSES) query.set("status", next.status);
    if (next.program !== ALL_PROGRAMS) query.set("program", next.program);
    if (patientId) query.set("patient", patientId);
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function updateFilters(change: Partial<Filters>) {
    const next = { ...filters, ...change };
    setFilters(next);
    /* Search stays out of the URL: it would rewrite history per keystroke. */
    if ("status" in change || "program" in change) writeUrl(next, openId);
  }

  function view(patientId: string) {
    setOpenId(patientId);
    writeUrl(filters, patientId);
  }

  function close() {
    setOpenId(null);
    writeUrl(filters, null);
  }

  if (clinic.error) {
    return (
      <ErrorState
        title={errorTitleFor(
          clinic.error,
          isEs
            ? "No se pudo cargar el progreso del currículo"
            : "Curriculum progress could not be loaded",
          isEs ? "es" : "en",
        )}
        message={errorMessageFor(clinic.error, undefined, isEs ? "es" : "en")}
        error={clinic.error}
        onRetry={canRetry(clinic.error) ? clinic.refetch : undefined}
      />
    );
  }

  if (clinic.isPending) return <PageSkeleton />;

  if (list.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title={
          isEs
            ? "Aún no hay miembros en un programa"
            : "No members in a program yet"
        }
        description={
          isEs
            ? "Los pacientes inscritos aparecen aquí cuando comienzan su currículo."
            : "Enrolled patients appear here as they start their curriculum."
        }
        action={
          <Link
            href="/dashboard/clinic/enroll-patients"
            className={buttonStyles({ size: "small" })}
          >
            {isEs ? "Inscribir a un paciente" : "Enroll a patient"}
          </Link>
        }
      />
    );
  }

  return (
    <>
      <CourseTabs
        program={filters.program}
        onProgram={(program) => updateFilters({ program })}
      />

      <SummaryCards list={list} program={filters.program} />

      <ProgramProgressOverview program={filters.program} />

      <MemberTable
        list={list}
        filters={filters}
        onFilters={updateFilters}
        onView={view}
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ProgramDetails />
        <ModuleCompletionBreakdown />
        <RecentModuleActivity list={list} onView={view} />
        <ProgramCompletionRate
          program={filters.program}
          onProgram={(program) => updateFilters({ program })}
        />
        <MembersByStatus
          status={filters.status}
          onStatus={(status) => updateFilters({ status })}
        />
        <TimeToCompletion
          program={filters.program}
          onProgram={(program) => updateFilters({ program })}
        />
      </section>

      {open ? <ProgressModal member={open} onClose={close} /> : null}
    </>
  );
}

export default function ClinicCurriculumProgress() {
  /* Read here as well as in the view below so the refresh control can sit
     on the title row. Both calls share one query key, so react-query serves
     them from the same fetch. */
  const clinic = useClinicData();

  return (
    <div className="space-y-4">
      <PageTitle
        href="/dashboard/clinic/curriculum-progress"
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
        <CurriculumView />
      </Suspense>
    </div>
  );
}
