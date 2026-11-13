"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  CalendarCheck,
  Clock3,
  Eye,
  GraduationCap,
  MessageCircleQuestion,
  MessageSquareText,
  Plus,
  Search,
  Users,
  Video,
} from "lucide-react";

import { UserPlusSolid, UsersSolid } from "@/components/icons/solid";
import { statusIconSolid, statusKeyTone, statusText } from "./StatusIconsSolid";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  Badge,
  Button,
  buttonStyles,
  Card,
  KeyCard,
  DonutChart,
  EmptyState,
  ErrorState,
  Input,
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
  toneVar,
  type ProgressTone,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { tableIconButton } from "./tableButton";
import {
  activityIcon,
  initials,
  shortProgram,
  statusIcon,
} from "./clinicIcons";
import { paginate, ROWS_PER_PAGE_OPTIONS } from "./enrollment.data";
import { programFor } from "./enrollment.mapping";
import { useRosterPage, useRosterPatient } from "./useRosterPage";
import { WindowNote } from "./WindowNote";
import {
  ALL_PROGRAMS,
  ALL_STATUSES,
  countStatus,
  filterRoster,
  MEMBER_STATUSES,
  programBreakdownOf,
  programOptions,
  shareOf,
  statusOptions,
  statusLabel,
  currentModuleLabel,
  rosterMemberFor,
  statusTone,
  type RosterMember,
  type RosterStatus,
} from "./members.data";
import { UpdatedBar } from "./UpdatedBar";
import { useClinicData, type ClinicData } from "./useClinicData";
import {
  curriculumLink,
  messageLink,
  UNSOURCED_STATUSES,
} from "./clinicDashboard.data";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { useLanguage } from "@/context/LanguageContext";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const MESSAGES = "/dashboard/clinic/messages";
const ENROLL = "/dashboard/clinic/enroll-patients";

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

type Filters = { query: string; program: string; status: string };

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

/* ---------------------------------------------------------- summary cards

   Each card is a filter for the table below it: press "Need Follow-Up" and
   the list shows those three. Built from spans, not a Card, because a
   button may only hold phrasing content. aria-pressed says which filter is
   on, since the highlight alone would be colour only. */

/**
 * The summary row.
 *
 * These were filter buttons: pressing one narrowed the table. The client
 * asked for key cards not to filter (2026-09-26), and the Status select and
 * the search box directly below still do it, so nothing became unreachable
 * — there were two controls for one job and this was the quieter one.
 */
function SummaryCards({
  list,
  total,
  seats,
}: {
  list: RosterMember[];
  /** The server's roster count (the window may hold fewer). */
  total: number;
  seats: ClinicData["seats"];
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const cards = MEMBER_STATUSES.filter((s) => s !== "Not Started");
  /* Seats are the contract's (null: unknown to this role, or no limit). */
  const allowed = seats?.allowed ?? null;

  return (
    <section
      aria-label={isEs ? "Resumen de miembros" : "Member summary"}
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2"
    >
      <KeyCard
        tone="brand"
        icon={<UsersSolid />}
        value={
          <>
            {total}
            {allowed !== null ? (
              <span className="text-heading-4 text-fg-muted"> / {allowed}</span>
            ) : null}
          </>
        }
        label={isEs ? "Total de miembros" : "Total Members"}
      />

      {cards.map((card) => {
        const Icon = statusIconSolid[card];
        /* No source yet for this status (NEW-2): "—", never a made-up 0. */
        const unsourced = UNSOURCED_STATUSES.includes(card);
        const count = countStatus(list, card);
        return (
          <KeyCard
            key={card}
            tone={statusKeyTone[card]}
            icon={<Icon />}
            value={unsourced ? "—" : count}
            label={statusLabel(card, isEs)}
            note={
              unsourced
                ? isEs
                  ? "Aún sin seguimiento"
                  : "Not tracked yet"
                : isEs
                  ? `${shareOf(count, list.length)}% de los miembros`
                  : `${shareOf(count, list.length)}% of members`
            }
          />
        );
      })}

      <KeyCard
        tone="neutral"
        icon={<UserPlusSolid />}
        value={
          seats && seats.allowed !== null
            ? Math.max(0, seats.available ?? seats.allowed - seats.used)
            : "—"
        }
        label={isEs ? "Cupos disponibles" : "Available Slots"}
      />
    </section>
  );
}

/* --------------------------------------------------------------- table */

/** One page of the table, from the server or from the window. */
type TableView = {
  rows: RosterMember[] | undefined;
  page: number;
  pageCount: number;
  firstShown: number;
  lastShown: number;
  total: number;
  isFetching: boolean;
  error: unknown;
  refetch: () => void;
};

function MemberTable({
  view,
  perPage,
  onPage,
  onPerPage,
  note,
  filters,
  onFilters,
  selectedId,
  onSelect,
}: {
  view: TableView;
  perPage: number;
  onPage: (page: number) => void;
  onPerPage: (perPage: number) => void;
  /** Why the rows may not be the whole roster (a client-only filter). */
  note: React.ReactNode;
  filters: Filters;
  onFilters: (next: Partial<Filters>) => void;
  selectedId: string | null;
  onSelect: (patientId: string) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const rows = view.rows ?? [];

  const pageMrns = rows.map((member) => member.id);
  const allOnPage =
    pageMrns.length > 0 && pageMrns.every((mrn) => checked.has(mrn));

  function toggleAll() {
    setChecked((current) => {
      const next = new Set(current);
      if (allOnPage) pageMrns.forEach((mrn) => next.delete(mrn));
      else pageMrns.forEach((mrn) => next.add(mrn));
      return next;
    });
  }

  function toggleOne(mrn: string) {
    setChecked((current) => {
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
    <Card as="section" padding="small" className="h-full min-w-0">
      <PanelHeading title={isEs ? "Lista de miembros" : "Member List"} />

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
          className="lg:max-w-60 lg:flex-1"
        />
        <Select
          selectSize="small"
          aria-label={isEs ? "Programa" : "Program"}
          value={filters.program}
          onChange={(event) => onFilters({ program: event.target.value })}
        >
          {programOptions.map((option) => (
            <option key={option} value={option}>
              {statusLabel(option, isEs)}
            </option>
          ))}
        </Select>
        <Select
          selectSize="small"
          aria-label={isEs ? "Estado" : "Status"}
          value={filters.status}
          onChange={(event) => onFilters({ status: event.target.value })}
          className="lg:w-48"
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {statusLabel(option, isEs)}
            </option>
          ))}
        </Select>
        {/* Patients are added in one place, Enroll Patients; this page
            tracks them once they are in (client, 2026-10-18: "Add Member"
            here and "Enroll New Patient" there were the same thing). */}
        <Link
          href={ENROLL}
          className={cn(buttonStyles({ size: "small" }), "lg:ml-auto")}
        >
          <Plus className="h-4 w-4" />
          {isEs ? "Inscribir paciente" : "Enroll Patient"}
        </Link>
      </div>

      {/* Bulk actions appear once something is ticked, so the checkboxes
          lead somewhere. */}
      {checked.size > 0 ? (
        <div
          role="region"
          aria-label={isEs ? "Miembros seleccionados" : "Selected members"}
          className="mb-stack-md flex flex-wrap items-center gap-inline-md rounded-control border border-line bg-surface-sunken px-inset-sm py-inset-xs"
        >
          <p className="text-label-md text-fg">
            {isEs
              ? `${checked.size} seleccionados`
              : `${checked.size} selected`}
          </p>
          <Link href={MESSAGES} className={outlineLink}>
            <MessageSquareText className="h-4 w-4" />
            {isEs ? "Enviar mensaje a seleccionados" : "Message selected"}
          </Link>
          <Button
            variant="neutral"
            appearance="stroke"
            size="small"
            onClick={() => setChecked(new Set())}
          >
            {isEs ? "Borrar" : "Clear"}
          </Button>
        </div>
      ) : null}

      {note}

      {view.error ? (
        <ErrorState
          title={errorTitleFor(
            view.error,
            isEs
              ? "No se pudieron cargar los miembros"
              : "Members could not be loaded",
            isEs ? "es" : "en",
          )}
          message={errorMessageFor(view.error, undefined, isEs ? "es" : "en")}
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
          <Table minWidth={640}>
            <TableHead className="bg-surface-sunken">
              <TableRow>
                <TableHeaderCell className="w-10">
                  <input
                    type="checkbox"
                    checked={allOnPage}
                    disabled={pageMrns.length === 0}
                    onChange={toggleAll}
                    aria-label={
                      isEs
                        ? "Seleccionar todos los miembros de esta página"
                        : "Select all members on this page"
                    }
                    className="h-4 w-4 cursor-pointer accent-brand-600"
                  />
                </TableHeaderCell>
                <TableHeaderCell>{isEs ? "Nombre" : "Name"}</TableHeaderCell>
                <TableHeaderCell>
                  {isEs ? "Programa" : "Program"}
                </TableHeaderCell>
                <TableHeaderCell>{isEs ? "Estado" : "Status"}</TableHeaderCell>
                <TableHeaderCell>
                  {isEs ? "Progreso" : "Progress"}
                </TableHeaderCell>
                <TableHeaderCell>
                  {isEs ? "Última actividad" : "Last Activity"}
                </TableHeaderCell>
                <TableHeaderCell className="text-right">
                  {isEs ? "Acciones" : "Actions"}
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableEmptyRow colSpan={7}>
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
                rows.map((member) => {
                  const Icon = member.status ? statusIcon[member.status] : null;
                  const isSelected = member.id === selectedId;
                  return (
                    <TableRow
                      key={member.id}
                      className={isSelected ? "bg-surface-brand-subtle" : ""}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={checked.has(member.id)}
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
                        {/* The name opens the details panel; aria-pressed
                          tells a screen reader which member is open. */}
                        <button
                          type="button"
                          onClick={() => onSelect(member.id)}
                          aria-pressed={isSelected}
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
                      <TableCell>{shortProgram(member.program)}</TableCell>
                      <TableCell>
                        {member.status && Icon ? (
                          <Badge
                            tone={statusTone[member.status]}
                            icon={<Icon aria-hidden="true" />}
                          >
                            {statusLabel(member.status, isEs)}
                          </Badge>
                        ) : (
                          <span className="text-fg-muted">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-inline-md">
                          <Progress
                            value={member.progress}
                            label={
                              isEs
                                ? `Progreso de ${member.name}`
                                : `${member.name} progress`
                            }
                            size="small"
                            className="w-14"
                          />
                          <span className="tabular-nums">
                            {member.progress}%
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {member.lastActivity}
                      </TableCell>
                      <TableCell>
                        <span className="flex justify-end gap-inline-xs">
                          <button
                            type="button"
                            onClick={() => onSelect(member.id)}
                            className={iconControl}
                            aria-label={
                              isEs
                                ? `Ver a ${member.name}`
                                : `View ${member.name}`
                            }
                            title={isEs ? "Ver detalles" : "View details"}
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-stack-md flex flex-col gap-inline-md sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-inline-md text-body-sm text-fg-secondary">
          {isEs ? "Filas por página" : "Rows per page"}
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

/* ------------------------------------------------------------- details */

/**
 * One fact in the details popup: an icon, what it is, and the value. Laid
 * out as tiles in two columns, so a long value like the current module
 * wraps inside its own tile instead of squeezing the one beside it.
 */
function DetailTile({
  icon: TileIcon,
  label,
  children,
}: {
  icon: IconType;
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
 * The member's details, in a popup over the list. A side panel beside a
 * seven-column table left each of them too narrow to read; a dialog gives
 * the details room without taking any from the table. Modal owns the rest:
 * focus moves in and back out to the name that opened it, Tab stays inside,
 * Esc and the backdrop close it.
 */
function MemberDetailsModal({
  member,
  onClose,
}: {
  member: RosterMember;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const Icon = member.status ? statusIcon[member.status] : null;
  const of = isEs ? "de" : "of";
  /* No source yet for these (NEW-2): "—", never a made-up figure. */
  const classes = member.liveClasses
    ? `${member.liveClasses[0]} ${of} ${member.liveClasses[1]}`
    : "—";
  const checkIns = member.checkIns
    ? `${member.checkIns[0]} ${of} ${member.checkIns[1]}`
    : "—";
  const questions = !member.questions
    ? "—"
    : member.questions.total === 0
      ? isEs
        ? "Ninguna"
        : "None"
      : `${member.questions.total} (${
          member.questions.open === 0
            ? isEs
              ? "Resueltas"
              : "Resolved"
            : isEs
              ? `${member.questions.open} abiertas`
              : `${member.questions.open} open`
        })`;

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={member.name}
      description={
        isEs
          ? `MRN ${member.mrn || "—"} · Inscrito ${member.enrolledOn}`
          : `MRN ${member.mrn || "—"} · Enrolled ${member.enrolledOn}`
      }
      footer={
        <>
          <Link href={messageLink(member.id)} className={outlineLink}>
            <MessageSquareText className="h-4 w-4" />
            {isEs ? "Enviar mensaje" : "Send Message"}
          </Link>
          {/* The popup is the profile; the detail behind it is the patient's
              progress, which Curriculum Progress opens by patientId. */}
          <Link
            href={curriculumLink({ patientId: member.id })}
            className={buttonStyles({ size: "small" })}
          >
            {isEs ? "Ver progreso" : "View Progress"}
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
        {member.status && Icon ? (
          <Badge
            tone={statusTone[member.status]}
            icon={<Icon aria-hidden="true" />}
          >
            {statusLabel(member.status, isEs)}
          </Badge>
        ) : null}
      </div>

      <div className="mt-stack-lg">
        <div className="flex items-baseline justify-between gap-inline-md">
          <span className="text-body-sm text-fg-secondary">
            {isEs ? "Progreso del programa" : "Program progress"}
          </span>
          <span className="text-heading-5 text-fg tabular-nums">
            {member.progress}%
          </span>
        </div>
        <Progress
          value={member.progress}
          label={
            isEs ? `Progreso de ${member.name}` : `${member.name} progress`
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
          {currentModuleLabel(member.currentModule, isEs)}
        </DetailTile>
        <DetailTile
          icon={Clock3}
          label={isEs ? "Última actividad" : "Last Activity"}
        >
          {member.lastSeen}
        </DetailTile>
        <DetailTile
          icon={Video}
          label={isEs ? "Clases en vivo asistidas" : "Live Classes Attended"}
        >
          {classes}
        </DetailTile>
        <DetailTile
          icon={CalendarCheck}
          label={isEs ? "Registros semanales" : "Weekly Check-Ins"}
        >
          {checkIns}
        </DetailTile>
        <DetailTile
          icon={MessageCircleQuestion}
          label={isEs ? "Preguntas enviadas" : "Questions Submitted"}
        >
          {questions}
        </DetailTile>
        <DetailTile icon={GraduationCap} label={isEs ? "Programa" : "Program"}>
          {member.program}
        </DetailTile>
      </dl>
    </Modal>
  );
}

/* -------------------------------------------------------------- charts

   The lower panels filter too: press a program or a status and the table
   narrows to it. They read the whole roster, not the filtered view, so
   pressing one never makes the others vanish. */

function MembersByProgram({
  list,
  program,
  onProgram,
}: {
  list: RosterMember[];
  program: string;
  onProgram: (program: string) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const slices = programBreakdownOf(list);

  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading
        title={isEs ? "Miembros por programa" : "Members by Program"}
      />
      <div className="grid items-center gap-inset-md sm:grid-cols-[150px_minmax(0,1fr)]">
        <DonutChart
          segments={slices.filter((slice) => slice.value > 0)}
          label={isEs ? "Miembros por programa" : "Members by program"}
          size={150}
          thickness={28}
          centerValue={list.length}
          centerLabel={isEs ? "Miembros" : "Members"}
          className="mx-auto"
        />
        <ul className="space-y-stack-xs">
          {slices.map((slice) => {
            /* "Other" has no program to filter to. */
            const filterable = programOptions.includes(slice.label);
            const on = program === slice.label;
            const content = (
              <>
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-pill"
                  style={{ background: toneVar[slice.tone] }}
                />
                <span className="min-w-0 flex-1 text-body-sm text-fg">
                  {slice.label === "Other"
                    ? statusLabel(slice.label, isEs)
                    : shortProgram(slice.label)}
                </span>
                <span className="text-label-md text-fg tabular-nums">
                  {slice.value}
                </span>
              </>
            );
            return (
              <li key={slice.label}>
                {filterable ? (
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => onProgram(on ? ALL_PROGRAMS : slice.label)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-inline-md rounded-control-small px-inset-xs py-1 text-left hover:bg-surface-sunken",
                      on && "bg-surface-brand-subtle",
                      focusRing,
                    )}
                  >
                    {content}
                  </button>
                ) : (
                  <span className="flex items-center gap-inline-md px-inset-xs py-1">
                    {content}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}

/* Status fills, matching the badges in the table. */
const statusBar: Record<RosterStatus, ProgressTone | undefined> = {
  "On Track": "success",
  "Need Follow-Up": "warning",
  "Attention Needed": "danger",
  "Not Started": undefined,
};

/**
 * How the roster splits by status.
 *
 * Read-only: it was five buttons that filtered the table, and the client
 * asked for that to go — the Status select above the table does the same
 * job. It is also much quieter than it was. Every row used to carry a
 * coloured Badge pill AND a coloured bar, so the same fact was colour-coded
 * twice, five times over, with the pills leaving a ragged left edge. Now it
 * is one glyph, the name, the numbers, and the bar.
 */
function StatusBreakdown({ list }: { list: RosterMember[] }) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  return (
    <Card as="section" padding="small" className="h-full">
      <PanelHeading title={isEs ? "Desglose por estado" : "Status Breakdown"} />
      <ul className="space-y-stack-md">
        {MEMBER_STATUSES.map((row) => {
          const count = countStatus(list, row);
          const Icon = statusIconSolid[row];

          return (
            <li key={row}>
              <p className="flex items-baseline gap-inline-md">
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "h-4 w-4 shrink-0 translate-y-0.5",
                    statusText[row],
                  )}
                />
                <span className="min-w-0 flex-1 truncate text-label-md text-fg-secondary">
                  {statusLabel(row, isEs)}
                </span>
                <span className="shrink-0 text-label-md text-fg tabular-nums">
                  {count}
                </span>
                <span className="w-10 shrink-0 text-right text-body-sm text-fg-muted tabular-nums">
                  {shareOf(count, list.length)}%
                </span>
              </p>
              <Progress
                value={count}
                max={Math.max(1, list.length)}
                label={
                  isEs
                    ? `Miembros: ${statusLabel(row, true)}`
                    : `${row} members`
                }
                tone={statusBar[row]}
                size="small"
                className="mt-stack-xs"
              />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function RecentMemberActivity({
  list,
  activity,
  onSelect,
}: {
  list: RosterMember[];
  activity: ClinicData["activity"];
  onSelect: (patientId: string) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  return (
    <Card as="section" padding="small" className="h-full">
      {/* Every entry is already listed, so there is no "View All". */}
      <PanelHeading
        title={
          isEs ? "Actividad reciente de miembros" : "Recent Member Activity"
        }
      />
      {activity.length === 0 ? (
        <p className="text-body-sm text-fg-muted">
          {isEs ? "Aún no hay actividad." : "No activity yet."}
        </p>
      ) : (
        <ul className="divide-y divide-line-subtle">
          {activity.map((entry) => {
            const { icon: Icon, tile } = activityIcon[entry.kind];
            const member = list.find((m) => m.id === entry.patientId);
            return (
              <li
                key={`${entry.patientId}-${entry.text}`}
                className="flex items-center gap-inline-lg py-inset-xs first:pt-0 last:pb-0"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-pill ${tile}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className="min-w-0 flex-1 text-body-sm text-fg">
                  {member ? (
                    <button
                      type="button"
                      onClick={() => onSelect(member.id)}
                      className={cn(
                        "cursor-pointer rounded-control-small text-label-md hover:text-fg-brand hover:underline",
                        focusRing,
                      )}
                    >
                      {entry.name}
                    </button>
                  ) : (
                    <span className="text-label-md">{entry.name}</span>
                  )}{" "}
                  {entry.text}
                </p>
                <span className="shrink-0 text-caption text-fg-muted">
                  {entry.when}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* ---------------------------------------------------------------- page */

function PageSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} height={156} className="rounded-card" />
        ))}
      </div>
      <Skeleton height={640} className="rounded-card" />
    </div>
  );
}

/**
 * The filters and the open member live in the URL as well as in state:
 * ?status=Need Follow-Up&patient=<patientId>. The dashboard links here that
 * way (a patient is named by id, never an MRN: an old ?mrn= link opens the
 * list), and
 * it means Back, a refresh or a shared link all land on the same view.
 * Values that are not on the menus or not on the roster are ignored, so a
 * stale link falls back to the default view instead of an empty one.
 */
function MembersView() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const clinic = useClinicData();
  const list = useMemo(() => clinic.data?.roster ?? [], [clinic.data]);

  const [initial] = useState(() => {
    const status = params.get("status") ?? "";
    const program = params.get("program") ?? "";
    return {
      status: statusOptions.includes(status) ? status : ALL_STATUSES,
      program: programOptions.includes(program) ? program : ALL_PROGRAMS,
      patientId: params.get("patient"),
    };
  });

  const [filters, setFilters] = useState<Filters>({
    query: "",
    program: initial.program,
    status: initial.status,
  });

  /* The popup opens only when asked for — a name pressed here, or a link
     from the dashboard carrying ?patient= — never by itself on page load. */
  const [selectedId, setSelectedId] = useState<string | null>(
    initial.patientId,
  );

  /* The table pages on the server (page, limit, search, BE-2 program), so
     every patient on the roster can be listed and found. The member status
     is the client's own reading (NEW-2) with no server filter: while it is
     on, the table filters the shared window instead, and says so when the
     window is not the whole roster. */
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(ROWS_PER_PAGE_OPTIONS[0]);
  const filterKey = `${filters.query}|${filters.program}|${filters.status}|${perPage}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    /* A filter change returns to page 1 (adjusted during render). */
    setLastFilterKey(filterKey);
    setPage(1);
  }
  const serverMode = filters.status === ALL_STATUSES;
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
    const now = new Date();
    if (serverMode) {
      return {
        ...serverPage,
        rows: serverPage.rows?.map((p) => rosterMemberFor(p, now)),
      };
    }
    const local = paginate(filterRoster(list, filters), page, perPage);
    return {
      ...local,
      isFetching: false,
      error: null,
      refetch: clinic.refetch,
    };
  }, [serverMode, serverPage, list, filters, page, perPage, clinic.refetch]);

  /* The open member: from the window, this page, or (a ?patient= link to
     someone in neither) read by id. */
  const known =
    list.find((member) => member.id === selectedId) ??
    view.rows?.find((member) => member.id === selectedId) ??
    null;
  const byId = useRosterPatient(known ? null : selectedId);
  const selected = known ?? (byId ? rosterMemberFor(byId) : null);

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

    /* A filter that hides the open member drops them, so the URL never
       names someone the list does not show. */
    const stillListed =
      selectedId !== null &&
      filterRoster(list, next).some((member) => member.id === selectedId);
    const patientId = stillListed ? selectedId : null;
    if (!stillListed) setSelectedId(null);

    /* The search box is not written to the URL: it would rewrite history
       on every keystroke. */
    if ("status" in change || "program" in change) writeUrl(next, patientId);
  }

  function select(patientId: string) {
    setSelectedId(patientId);
    writeUrl(filters, patientId);
  }

  function close() {
    setSelectedId(null);
    writeUrl(filters, null);
  }

  if (clinic.error) {
    return (
      <ErrorState
        title={errorTitleFor(
          clinic.error,
          isEs
            ? "No se pudieron cargar los miembros"
            : "Members could not be loaded",
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
      <>
        <EmptyState
          icon={<Users />}
          title={isEs ? "Aún no hay miembros" : "No members yet"}
          description={
            isEs
              ? "Los pacientes que inscriba aparecerán aquí, con su progreso y estado."
              : "Patients you enroll will appear here, with their progress and status."
          }
          action={
            <Link href={ENROLL} className={buttonStyles({ size: "small" })}>
              <Plus className="h-4 w-4" />
              {isEs ? "Inscribir a un paciente" : "Enroll a patient"}
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <SummaryCards
        list={list}
        total={clinic.data?.rosterTotal ?? list.length}
        seats={clinic.data?.seats ?? null}
      />
      <WindowNote
        window={clinic.data?.window}
        what={
          isEs
            ? "Los conteos de estado y los gráficos cubren"
            : "Status counts and charts cover"
        }
        noun={isEs ? "miembros" : "members"}
      />

      <MemberTable
        view={view}
        perPage={perPage}
        onPage={setPage}
        onPerPage={setPerPage}
        note={
          serverMode ? null : (
            <WindowNote
              window={clinic.data?.window}
              what={
                isEs ? "El filtro de estado cubre" : "The status filter covers"
              }
              noun={isEs ? "miembros" : "members"}
              className="mb-stack-md"
            />
          )
        }
        filters={filters}
        onFilters={updateFilters}
        selectedId={selectedId}
        onSelect={select}
      />

      {selected ? (
        <MemberDetailsModal member={selected} onClose={close} />
      ) : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <MembersByProgram
          list={list}
          program={filters.program}
          onProgram={(program) => updateFilters({ program })}
        />
        <StatusBreakdown list={list} />
        <RecentMemberActivity
          list={list}
          activity={clinic.data?.activity ?? []}
          onSelect={select}
        />
      </section>
    </>
  );
}

export default function ClinicMembers() {
  /* Read here as well as in the view below so the refresh control can sit
     on the title row. Both calls share one query key, so react-query serves
     them from the same fetch. */
  const clinic = useClinicData();

  return (
    <div className="space-y-4">
      <PageTitle
        href="/dashboard/clinic/members"
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
        <MembersView />
      </Suspense>
    </div>
  );
}
