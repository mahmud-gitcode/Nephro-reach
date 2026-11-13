"use client";

import { useExternalShare } from "@/features/sharing/ExternalShareNotice";
import { useLanguage } from "@/context/LanguageContext";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  ChevronDown,
  Circle,
  CircleCheck,
  CircleMinus,
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
  AsyncSection,
  Badge,
  Breakdown,
  Button,
  Card,
  EmptyState,
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
  SwitchRow,
  Tabs,
  TabPanel,
  Textarea,
  type BadgeTone,
  type ProgressTone,
  type SeriesTone,
  type SortDirection,
} from "@/components/ui";
import { isApiError } from "@/lib/api/client";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { cn } from "@/lib/utils/cn";
import { useNow } from "@/lib/utils/useNow";
import { useDismiss } from "@/lib/utils/useDismiss";
import * as messaging from "@/features/messaging/messaging.rules";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import { useCan, useStaffList } from "@/features/staff/useStaffAccounts";
import {
  ACTIVITY_TYPES,
  ALL,
  CCM_REQUIREMENTS,
  CCM_STATUSES,
  CCM_THRESHOLD_MINUTES,
  COUNTS_LABEL,
  OUTCOMES,
  activityTypeFor,
  addDays,
  ccmText,
  ageOn,
  dayKey,
  durationMinutes,
  formatTime,
  monthLabel,
  patientName,
  recentMonths,
  requirementBody,
  usDate,
  CCM_CHECKLIST_DISCLAIMER,
  REQUIREMENT_STATUS_MEANING,
  CCM_BILLING_DEACTIVATED,
  worklistCsv,
  type CcmStatus,
  type CountsToward,
  type RequirementStatus,
} from "./ccm.data";
import {
  listWorklist,
  type CcmActivityRow,
  type CcmEnrollment,
  type CcmInboxItem,
  type CcmRequirement,
  type RosterPick,
  type WorklistQuery,
} from "./ccm.repository";
import {
  nameOf as noticeName,
  noticeReasonText,
  type CheckInNotice,
} from "./checkInNotices.repository";
import { NoticeModal } from "./ClinicCheckIns";
import { actionErrorText, useOfficeOrg } from "./officeContext";
import { UpdatedBar } from "./UpdatedBar";
import {
  useCcm,
  useCcmActivities,
  useCcmInbox,
  useCcmPatient,
  useCcmSummary,
  useCcmWorklist,
  type CcmActions,
} from "./useCcm";
import { useRosterPicks } from "./useClinicLabs";
import { useCheckInNotices } from "./useOfficeCheckIns";
import { ConditionSelect } from "./ConditionSelect";
import { KidneyCareSection } from "./KidneyCareSection";
import { ConditionLibraryModal } from "./ConditionLibraryModal";
import { useConditionLibrary } from "./useConditionLibrary";
import {
  CONDITION_GROUPS,
  chronicCount,
  conditionSummary,
  conditionText,
  sortedConditions,
  type CcmCondition,
} from "./ccmConditions";

/* ==========================================================================
   Chronic Care Management
   --------------------------------------------------------------------------
   The office's month at a glance: who is ready for the practice's review,
   who is short of the 30-minute threshold, and who needs attention today.
   A patient opens in a popup with their checklist, the month's logged time,
   check-ins, EHR documentation and follow-ups.

   Tracking only. Practice staff enter the activities; the practice decides
   what counts for billing; the clinical note stays in its EHR. NephroReach
   records time and makes no medical decisions.

   Phase 9: every figure, status and row is the server's (/organizations/
   {orgId}/ccm). Patients are identified by patientId only; the MRN is
   display text. The CCM inbox is raised by the server (hourly, from what
   enrolled patients share); the browser computes no alert (D12).
   ========================================================================== */

/* The nephrology office's home (client, 2026-10-03). */
const HREF = "/dashboard/nephrology";
const WORKLIST_PAGE = 50;
const INBOX_PAGE = 25;
/* An export reads the filtered worklist a bounded number of pages. */
const EXPORT_MAX_PAGES = 20;

/** Whether the reader chose Spanish. */
function useIsEs() {
  const { language } = useLanguage();
  return language === "ES";
}

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
  "not-applicable": "Not Applicable",
};

const requirementLabelEs: Record<RequirementStatus, string> = {
  complete: "Completo",
  "in-progress": "En curso",
  missing: "Faltante",
  "not-applicable": "No aplica",
};

const REQUIRED = CCM_REQUIREMENTS.length;

function StatusBadge({ row }: { row: CcmEnrollment }) {
  const isEs = useIsEs();
  const label =
    row.status === "Below Threshold"
      ? isEs
        ? `Faltan ${row.remainingMinutes} min`
        : `${row.remainingMinutes} min remaining`
      : ccmText(row.status, isEs);
  return <Badge tone={statusTone[row.status]}>{label}</Badge>;
}

/* The checklist at a glance: all done, a gap or two, or most still open. */
function ChecklistCount({ met, total }: { met: number; total: number }) {
  const missing = total - met;
  const [Icon, tone] =
    missing === 0
      ? [CircleCheck, "text-success"]
      : missing <= 2
        ? [Clock, "text-warning-glyph"]
        : [CircleAlert, "text-danger"];
  return (
    <span className="inline-flex items-center gap-inline-sm tabular-nums">
      <Icon aria-hidden="true" className={cn("size-4 shrink-0", tone)} />
      {met} / {total}
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

/** The month before `month` ("2026-09" → "2026-08"). */
function monthBefore(month: string, back: number): string {
  const [y, m] = month.split("-").map(Number);
  const at = new Date(y, m - 1 - back, 1);
  return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}`;
}

/** Previous / next buttons for an offset-paged list. */
function Pager({
  page,
  pagination,
  onPage,
}: {
  page: number;
  pagination: { mode: string; totalPages?: number } | null | undefined;
  onPage: (next: number) => void;
}) {
  const isEs = useIsEs();
  const last =
    pagination && pagination.mode === "offset"
      ? (pagination.totalPages ?? 1)
      : 1;
  if (last <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-inline-md px-card py-inset-sm">
      <Button
        size="small"
        variant="neutral"
        appearance="fill-stroke"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        {isEs ? "Anterior" : "Previous"}
      </Button>
      <span className="text-caption text-fg-muted tabular-nums">
        {isEs ? `Página ${page} de ${last}` : `Page ${page} of ${last}`}
      </span>
      <Button
        size="small"
        variant="neutral"
        appearance="fill-stroke"
        disabled={page >= last}
        onClick={() => onPage(page + 1)}
      >
        {isEs ? "Siguiente" : "Next"}
      </Button>
    </div>
  );
}

function readError(
  error: unknown,
  title: string,
  retry: () => void,
  isEs = false,
): {
  error: unknown;
  errorTitle: React.ReactNode;
  errorMessage: React.ReactNode;
  onRetry?: () => void;
} {
  return {
    error,
    errorTitle: errorTitleFor(error, title, isEs ? "es" : "en"),
    errorMessage: errorMessageFor(error, undefined, isEs ? "es" : "en"),
    onRetry: canRetry(error) ? retry : undefined,
  };
}

/* -------------------------------------------------------------- overview */

/* How the enrolled patients split by status: one slim bar under the stat
   row. The counts are the server's summary, never a counted page. */
function StatusSplit({
  summary,
}: {
  summary: {
    billingQueue: number;
    actionNeeded: number;
    belowThreshold: number;
    readyForReview: number;
  };
}) {
  const isEs = useIsEs();
  const value: Record<CcmStatus, number> = {
    "Ready for Review": summary.readyForReview,
    "Below Threshold": summary.belowThreshold,
    "Action Needed": summary.actionNeeded,
  };
  const order: CcmStatus[] = [
    "Ready for Review",
    "Below Threshold",
    "Action Needed",
  ];
  return (
    <Card as="section" padding="small">
      <h2 className="mb-stack-lg text-heading-4 text-fg">
        {isEs ? "Estado de CCM" : "CCM Status"}
        <span className="text-body-sm text-fg-muted">
          {" "}
          · {summary.billingQueue}{" "}
          {isEs ? "pacientes inscritos" : "enrolled patients"}
        </span>
      </h2>
      <Breakdown
        label={
          isEs
            ? "Pacientes inscritos en CCM por estado"
            : "Enrolled CCM patients by status"
        }
        items={order.map((status) => ({
          label: ccmText(status, isEs),
          value: value[status],
          tone: statusChart[status],
        }))}
      />
    </Card>
  );
}

/* -------------------------------------------------------------- worklist */

type Filters = {
  query: string;
  provider: string;
  location: string;
  careManager: string;
  status: string;
  condition: string;
};

type Sort = { key: "name" | "nextFollowUp"; direction: "asc" | "desc" };

function SortHeader({
  children,
  column,
  sort,
  onSort,
}: {
  children: React.ReactNode;
  column: Sort["key"];
  sort: Sort;
  onSort: (column: Sort["key"]) => void;
}) {
  const direction: SortDirection = sort.key === column ? sort.direction : null;
  return (
    <TableHeaderCell onSort={() => onSort(column)} sortDirection={direction}>
      {children}
    </TableHeaderCell>
  );
}

/** The options a free-text filter offers: what the loaded rows carry, and
 *  the current choice (the server filters; nothing is invented). */
function optionsOf(
  rows: CcmEnrollment[],
  pick: (row: CcmEnrollment) => string,
  current: string,
) {
  const values = new Set(rows.map(pick).filter(Boolean));
  if (current !== ALL) values.add(current);
  return [...values].sort((a, b) => a.localeCompare(b));
}

function WorklistFiltersBar({
  filters,
  rows,
  onChange,
  onExport,
  canExport,
  exporting,
  library,
  onManageLibrary,
}: {
  filters: Filters;
  rows: CcmEnrollment[];
  onChange: (change: Partial<Filters>) => void;
  onExport: () => void;
  canExport: boolean;
  exporting: boolean;
  library: CcmCondition[];
  /** Absent unless the signed-in role manages the clinic's settings. */
  onManageLibrary?: () => void;
}) {
  const isEs = useIsEs();
  return (
    <div className="flex flex-col gap-inline-md px-card pb-stack-lg lg:flex-row lg:flex-wrap lg:items-center">
      <SearchField
        label={isEs ? "Buscar pacientes" : "Search patients"}
        placeholder={
          isEs ? "Buscar por nombre o MRN…" : "Search by name or MRN…"
        }
        value={filters.query}
        onChange={(e) => onChange({ query: e.target.value })}
        className="lg:w-64"
      />
      <Select
        selectSize="small"
        aria-label={isEs ? "Proveedor" : "Provider"}
        value={filters.provider}
        onChange={(e) => onChange({ provider: e.target.value })}
      >
        <option value={ALL}>
          {isEs ? "Todos los proveedores" : "All Providers"}
        </option>
        {optionsOf(rows, (r) => r.providerName, filters.provider).map(
          (option) => (
            <option key={option}>{option}</option>
          ),
        )}
      </Select>
      <Select
        selectSize="small"
        aria-label={isEs ? "Ubicación" : "Location"}
        value={filters.location}
        onChange={(e) => onChange({ location: e.target.value })}
      >
        <option value={ALL}>
          {isEs ? "Todas las ubicaciones" : "All Locations"}
        </option>
        {optionsOf(rows, (r) => r.location, filters.location).map((option) => (
          <option key={option}>{option}</option>
        ))}
      </Select>
      <Select
        selectSize="small"
        aria-label={isEs ? "Gestor de atención" : "Care manager"}
        value={filters.careManager}
        onChange={(e) => onChange({ careManager: e.target.value })}
      >
        <option value={ALL}>
          {isEs ? "Todos los gestores de atención" : "All Care Managers"}
        </option>
        {optionsOf(rows, (r) => r.careManagerName, filters.careManager).map(
          (option) => (
            <option key={option}>{option}</option>
          ),
        )}
      </Select>
      <Select
        selectSize="small"
        aria-label={isEs ? "Estado de CCM" : "CCM status"}
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value })}
      >
        <option value={ALL}>
          {isEs ? "Todos los estados" : "All Statuses"}
        </option>
        {CCM_STATUSES.map((option) => (
          <option key={option} value={option}>
            {ccmText(option, isEs)}
          </option>
        ))}
      </Select>
      <Select
        selectSize="small"
        aria-label={isEs ? "Afección" : "Condition"}
        value={filters.condition}
        onChange={(e) => onChange({ condition: e.target.value })}
      >
        <option value={ALL}>
          {isEs ? "Todas las afecciones" : "All Conditions"}
        </option>
        {CONDITION_GROUPS.map((group) => (
          <optgroup key={group} label={conditionText(group, isEs)}>
            {library
              .filter((c) => c.group === group && c.active)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {conditionText(c.label, isEs)}
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
            {isEs ? "Biblioteca de afecciones" : "Condition Library"}
          </Button>
        ) : null}
        <Button
          size="small"
          variant="neutral"
          appearance="fill-stroke"
          disabled={!canExport || exporting}
          onClick={onExport}
          leadingIcon={<Download aria-hidden="true" />}
        >
          {isEs ? "Exportar" : "Export"}
        </Button>
      </span>
    </div>
  );
}

/** "CKD 4 · HTN +2 ▾": the two that matter most and how many more, as a
 *  dropdown that opens the patient's whole list (client, 2026-10-01). The
 *  list is fixed to the viewport so the table's scroll box never clips it. */
function ConditionsCell({
  values,
  library,
  patient,
}: {
  values: string[];
  library: CcmCondition[];
  patient: string;
}) {
  const isEs = useIsEs();
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

  const summary = conditionSummary(values, library, 2, isEs);
  if (!summary.text) return <span className="text-fg-muted">—</span>;
  const all = sortedConditions(values, library, isEs);
  return (
    <div ref={wrapRef} className="inline-block">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={at !== null}
        aria-label={
          isEs
            ? `Afecciones de ${patient}: ${summary.full}`
            : `${patient}'s conditions: ${summary.full}`
        }
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
            {isEs ? "Afecciones crónicas" : "Chronic Conditions"} ({all.length})
          </p>
          <ul className="max-h-72 overflow-y-auto">
            {all.map((condition) => (
              <li
                key={condition.value}
                className="flex items-center justify-between gap-inline-md rounded-control px-3 py-2 text-body-sm text-fg"
              >
                <span>
                  {condition.label}
                  {condition.other ? (isEs ? " (Otra)" : " (Other)") : ""}
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
  month,
  library,
  onManageLibrary,
  onOpen,
}: {
  month: string;
  library: CcmCondition[];
  onManageLibrary?: () => void;
  onOpen: (patientId: string) => void;
}) {
  /* Leaves NephroReach: ask first (client, 2026-10-07). */
  const isEs = useIsEs();
  const share = useExternalShare();
  const { orgId } = useOfficeOrg();
  const [filters, setFilters] = useState<Filters>({
    query: "",
    provider: ALL,
    location: ALL,
    careManager: ALL,
    status: ALL,
    condition: ALL,
  });
  const [sort, setSort] = useState<Sort>({ key: "name", direction: "asc" });
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<unknown>(null);
  const pick = (value: string) => (value === ALL ? undefined : value);
  /* The server filters, sorts and pages the billing queue. */
  const query: WorklistQuery = {
    month,
    billing: "queue",
    search: filters.query.trim() || undefined,
    provider: pick(filters.provider),
    location: pick(filters.location),
    careManager: pick(filters.careManager),
    status: pick(filters.status) as CcmStatus | undefined,
    condition: pick(filters.condition),
    sort: sort.key,
    direction: sort.direction,
    page,
    limit: WORKLIST_PAGE,
  };
  const worklist = useCcmWorklist(query);
  const rows = worklist.data?.items ?? [];
  const onSort = (key: Sort["key"]) => {
    setPage(1);
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  async function exportAll() {
    if (!orgId) return;
    setExporting(true);
    setExportError(null);
    try {
      const all: CcmEnrollment[] = [];
      for (let p = 1; p <= EXPORT_MAX_PAGES; p++) {
        const next = await listWorklist(orgId, {
          ...query,
          page: p,
          limit: 150,
        });
        all.push(...next.items);
        if (!next.pagination || !next.pagination.hasNext) break;
      }
      downloadCsv(
        `ccm-worklist-${month}.csv`,
        worklistCsv(all, month, library),
      );
    } catch (error) {
      setExportError(error);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <WorklistFiltersBar
        filters={filters}
        rows={rows}
        onChange={(change) => {
          setPage(1);
          setFilters((current) => ({ ...current, ...change }));
        }}
        canExport={rows.length > 0}
        exporting={exporting}
        onExport={() => share.guard(() => void exportAll(), "download")}
        library={library}
        onManageLibrary={onManageLibrary}
      />

      {share.notice}
      {exportError ? (
        <div className="px-card pb-stack-md">
          <Alert tone="danger" onDismiss={() => setExportError(null)}>
            {isEs ? "La exportación no terminó." : "The export did not finish."}{" "}
            {actionErrorText(exportError, isEs)}
          </Alert>
        </div>
      ) : null}
      <AsyncSection
        pending={worklist.isPending}
        {...readError(
          worklist.error,
          isEs
            ? "No se pudo cargar la lista de trabajo"
            : "The worklist could not be loaded",
          worklist.refetch,
          isEs,
        )}
        skeleton={<Skeleton height={320} className="mx-card" />}
      >
        <Table minWidth={1080}>
          <TableHead>
            <TableRow>
              <SortHeader column="name" sort={sort} onSort={onSort}>
                {isEs ? "Paciente" : "Patient"}
              </SortHeader>
              <TableHeaderCell>MRN</TableHeaderCell>
              <TableHeaderCell>
                {isEs ? "Afecciones" : "Conditions"}
              </TableHeaderCell>
              <TableHeaderCell>
                {isEs ? "Minutos de este mes" : <>This Month&rsquo;s Minutes</>}
              </TableHeaderCell>
              <TableHeaderCell>
                {isEs ? "Última actividad" : "Last Activity"}
              </TableHeaderCell>
              <TableHeaderCell>
                {isEs ? "Lista de verificación de CCM" : "CCM Checklist"}
              </TableHeaderCell>
              <TableHeaderCell>{isEs ? "Estado" : "Status"}</TableHeaderCell>
              <SortHeader column="nextFollowUp" sort={sort} onSort={onSort}>
                {isEs ? "Próximo seguimiento" : "Next Follow-Up"}
              </SortHeader>
              <TableHeaderCell className="text-right">
                <span className="sr-only">{isEs ? "Acciones" : "Actions"}</span>
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableEmptyRow colSpan={9}>
                {isEs
                  ? "Ningún paciente coincide con estos filtros."
                  : "No patients match these filters."}
              </TableEmptyRow>
            ) : (
              rows.map((row) => {
                const name = patientName(row);
                return (
                  <TableRow key={row.patientId}>
                    <TableCell emphasis className="whitespace-nowrap">
                      <span className="flex items-center gap-inline-md">
                        <TableThumb name={name} />
                        <span>
                          {name}
                          <span className="block text-caption font-normal text-fg-muted">
                            {row.location}
                          </span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.mrn ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <ConditionsCell
                        values={row.conditions}
                        library={library}
                        patient={name}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-inline-md">
                        <span className="w-14 whitespace-nowrap tabular-nums">
                          {row.minutes} min
                        </span>
                        <Progress
                          value={Math.min(row.minutes, CCM_THRESHOLD_MINUTES)}
                          max={CCM_THRESHOLD_MINUTES}
                          tone={statusBar[row.status]}
                          size="small"
                          label={
                            isEs
                              ? `${name}: ${row.minutes} de ${CCM_THRESHOLD_MINUTES} minutos`
                              : `${name}: ${row.minutes} of ${CCM_THRESHOLD_MINUTES} minutes`
                          }
                          className="w-20"
                        />
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {row.lastActivityOn ? usDate(row.lastActivityOn) : "—"}
                    </TableCell>
                    <TableCell>
                      <ChecklistCount
                        met={row.requirementsMet}
                        total={row.requirementsTotal || REQUIRED}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge row={row} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {row.nextFollowUpOn ? usDate(row.nextFollowUpOn) : "—"}
                    </TableCell>
                    <TableCell>
                      <OpenButton
                        name={name}
                        onOpen={() => onOpen(row.patientId)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <Pager
          page={page}
          pagination={worklist.data?.pagination}
          onPage={setPage}
        />
      </AsyncSection>
    </>
  );
}

function PatientCell({ mrn, name }: { mrn: string | null; name: string }) {
  return (
    <span className="flex items-center gap-inline-md">
      <TableThumb name={name} />
      <span>
        {name}
        {mrn ? (
          <span className="block text-caption font-normal text-fg-muted tabular-nums">
            MRN {mrn}
          </span>
        ) : null}
      </span>
    </span>
  );
}

function OpenButton({ name, onOpen }: { name: string; onOpen: () => void }) {
  const isEs = useIsEs();
  return (
    <span className="flex justify-end">
      <Button
        size="small"
        variant="neutral"
        appearance="fill-stroke"
        onClick={onOpen}
        aria-label={isEs ? `Abrir ${name}` : `Open ${name}`}
      >
        {isEs ? "Abrir" : "Open"}
      </Button>
    </span>
  );
}

/** Check-in notices members sent this office (server rows). Opening one
 *  reads the check-in behind it and marks it seen. */
function CheckInsTable({ onOpen }: { onOpen: (patientId: string) => void }) {
  const isEs = useIsEs();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<CheckInNotice | null>(null);
  const notices = useCheckInNotices({ page, limit: INBOX_PAGE });
  const rows = notices.data?.items ?? [];
  return (
    <AsyncSection
      pending={notices.isPending}
      {...readError(
        notices.error,
        isEs
          ? "No se pudieron cargar los avisos de registro"
          : "Check-in notices could not be loaded",
        notices.refetch,
        isEs,
      )}
      skeleton={<Skeleton height={240} className="mx-card" />}
    >
      <Table minWidth={820}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{isEs ? "Paciente" : "Patient"}</TableHeaderCell>
            <TableHeaderCell>{isEs ? "Fecha" : "Date"}</TableHeaderCell>
            <TableHeaderCell>{isEs ? "Motivos" : "Reasons"}</TableHeaderCell>
            <TableHeaderCell>{isEs ? "Estado" : "Status"}</TableHeaderCell>
            <TableHeaderCell className="text-right">
              <span className="sr-only">{isEs ? "Acciones" : "Actions"}</span>
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmptyRow colSpan={5}>
              {isEs
                ? "Aún no hay avisos de registro."
                : "No check-in notices yet."}
            </TableEmptyRow>
          ) : (
            rows.map((row) => {
              const name = noticeName(row);
              return (
                <TableRow key={row.id}>
                  <TableCell emphasis className="whitespace-nowrap">
                    <PatientCell mrn={row.mrn} name={name} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {usDate(row.deliverOn)}
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-wrap gap-inline-xs">
                      {row.reasons.map((reason) => (
                        <Badge key={reason} tone="warning">
                          {noticeReasonText(reason, isEs)}
                        </Badge>
                      ))}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge tone={row.seen ? "neutral" : "info"}>
                      {row.seen
                        ? isEs
                          ? "Visto"
                          : "Seen"
                        : isEs
                          ? "Nuevo"
                          : "New"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="flex justify-end gap-inline-sm">
                      <Button
                        size="small"
                        variant="neutral"
                        appearance="fill-stroke"
                        onClick={() => setOpen(row)}
                        aria-label={
                          isEs
                            ? `Ver el registro de ${name}`
                            : `View check-in of ${name}`
                        }
                      >
                        {isEs ? "Ver" : "View"}
                      </Button>
                      <Button
                        size="small"
                        variant="neutral"
                        appearance="fill-stroke"
                        onClick={() => onOpen(row.patientId)}
                        aria-label={isEs ? `Abrir ${name}` : `Open ${name}`}
                      >
                        {isEs ? "Abrir" : "Open"}
                      </Button>
                    </span>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      <Pager
        page={page}
        pagination={notices.data?.pagination}
        onPage={setPage}
      />
      {open ? (
        <NoticeModal notice={open} onClose={() => setOpen(null)} />
      ) : null}
    </AsyncSection>
  );
}

function InboxTable({
  actions,
  canResolve,
  onOpen,
}: {
  actions: CcmActions;
  canResolve: boolean;
  onOpen: (patientId: string) => void;
}) {
  const isEs = useIsEs();
  const now = useNow();
  const [page, setPage] = useState(1);
  const inbox = useCcmInbox({ page, limit: INBOX_PAGE });
  const items = inbox.data?.items ?? [];
  return (
    <AsyncSection
      pending={inbox.isPending}
      {...readError(
        inbox.error,
        isEs
          ? "No se pudo cargar la bandeja de entrada de CCM"
          : "The CCM inbox could not be loaded",
        inbox.refetch,
        isEs,
      )}
      skeleton={<Skeleton height={240} className="mx-card" />}
    >
      <Table minWidth={820}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{isEs ? "Paciente" : "Patient"}</TableHeaderCell>
            <TableHeaderCell>{isEs ? "Tipo" : "Type"}</TableHeaderCell>
            <TableHeaderCell>{isEs ? "Detalle" : "Detail"}</TableHeaderCell>
            <TableHeaderCell>{isEs ? "Recibido" : "Received"}</TableHeaderCell>
            <TableHeaderCell className="text-right">
              <span className="sr-only">{isEs ? "Acciones" : "Actions"}</span>
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 ? (
            <TableEmptyRow colSpan={5}>
              {isEs
                ? "La bandeja de entrada está vacía."
                : "The inbox is clear."}
            </TableEmptyRow>
          ) : (
            items.map((item) => {
              const name = patientName(item);
              return (
                <TableRow key={item.id}>
                  <TableCell emphasis className="whitespace-nowrap">
                    <PatientCell mrn={item.mrn} name={name} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {ccmText(item.kind, isEs)}
                  </TableCell>
                  <TableCell>{item.text}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {messaging.relativeLabel(item.receivedAt, now, isEs)}
                  </TableCell>
                  <TableCell>
                    <span className="flex justify-end gap-inline-sm">
                      <Button
                        size="small"
                        variant="neutral"
                        appearance="fill-stroke"
                        onClick={() => onOpen(item.patientId)}
                        aria-label={isEs ? `Abrir ${name}` : `Open ${name}`}
                      >
                        {isEs ? "Abrir" : "Open"}
                      </Button>
                      {canResolve ? (
                        <Button
                          size="small"
                          variant="neutral"
                          appearance="fill-stroke"
                          disabled={actions.isSaving}
                          onClick={() =>
                            void actions
                              .resolveInbox(item.patientId, item.id)
                              .catch(() => undefined)
                          }
                          leadingIcon={<Check aria-hidden="true" />}
                        >
                          {isEs ? "Resolver" : "Resolve"}
                        </Button>
                      ) : null}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      <Pager page={page} pagination={inbox.data?.pagination} onPage={setPage} />
    </AsyncSection>
  );
}

/** Follow-ups due within a week or overdue, from the server's worklist
 *  fields. The task itself opens with the patient (no office-wide
 *  follow-up list on the server yet). */
function FollowUpTable({
  rows,
  read,
  today,
  onOpen,
}: {
  rows: CcmEnrollment[];
  read: { isPending: boolean; error: unknown; refetch: () => void };
  today: string;
  onOpen: (patientId: string) => void;
}) {
  const isEs = useIsEs();
  return (
    <AsyncSection
      pending={read.isPending}
      {...readError(
        read.error,
        isEs
          ? "No se pudieron cargar los seguimientos"
          : "Follow-ups could not be loaded",
        read.refetch,
        isEs,
      )}
      skeleton={<Skeleton height={240} className="mx-card" />}
    >
      <Table minWidth={820}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{isEs ? "Paciente" : "Patient"}</TableHeaderCell>
            <TableHeaderCell>
              {isEs ? "Gestor de atención" : "Care Manager"}
            </TableHeaderCell>
            <TableHeaderCell>{isEs ? "Vencidos" : "Overdue"}</TableHeaderCell>
            <TableHeaderCell>{isEs ? "Fecha límite" : "Due"}</TableHeaderCell>
            <TableHeaderCell className="text-right">
              <span className="sr-only">{isEs ? "Acciones" : "Actions"}</span>
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmptyRow colSpan={5}>
              {isEs
                ? "No hay seguimientos pendientes esta semana."
                : "No follow-ups due this week."}
            </TableEmptyRow>
          ) : (
            rows.map((row) => {
              const name = patientName(row);
              return (
                <TableRow key={row.patientId}>
                  <TableCell emphasis className="whitespace-nowrap">
                    <PatientCell mrn={row.mrn} name={name} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {row.careManagerName ||
                      (isEs ? "Sin asignar" : "Unassigned")}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {row.overdueFollowUps > 0 ? (
                      <Badge tone="danger">
                        {row.overdueFollowUps} {isEs ? "vencidos" : "overdue"}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {row.nextFollowUpOn ? usDate(row.nextFollowUpOn) : "—"}
                    {row.nextFollowUpOn && row.nextFollowUpOn < today ? (
                      <Badge tone="danger" className="ml-inline-sm">
                        {isEs ? "Vencido" : "Overdue"}
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <OpenButton
                      name={name}
                      onOpen={() => onOpen(row.patientId)}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </AsyncSection>
  );
}

/* ---------------------------------------------------------- activity form */

type EntryMode = "minutes" | "times";
type YesNo = "yes" | "no";

const YES_NO = [
  { value: "yes" as const, label: "Yes" },
  { value: "no" as const, label: "No" },
];

const YES_NO_ES = [
  { value: "yes" as const, label: "Sí" },
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

/** The office's active staff, for "Assign To" (user ids; needs staff View:
 *  without it only "Unassigned" is offered and the server still checks). */
function useAssignees(enabled: boolean, isEs = false) {
  /* Not read without staff read: the server would refuse it (P16d). */
  const staff = useStaffList(
    { page: 1, limit: 150, status: "ACTIVE" },
    { enabled },
  );
  return enabled && !staff.error
    ? staff.rows.map((m) => ({
        id: m.userId,
        label: [m.name ?? m.email ?? (isEs ? "Personal" : "Staff"), m.title]
          .filter(Boolean)
          .join(", "),
      }))
    : [];
}

function ActivityForm({
  patientId,
  actions,
  today,
  prefill,
  onDone,
  locked = false,
}: {
  patientId: string;
  actions: CcmActions;
  today: string;
  prefill?: ActivityPrefill;
  onDone: () => void;
  /** CCM billing is deactivated for this patient: nothing can be saved. */
  locked?: boolean;
}) {
  const isEs = useIsEs();
  const office = useOfficeOrg();
  const me = useOptionalAuth()?.user?.name ?? (isEs ? "Usted" : "You");
  const assignees = useAssignees(office.can("staff", 1), isEs);
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
  const [needsFollowUp, setNeedsFollowUp] = useState<YesNo>("no");
  const [followDate, setFollowDate] = useState("");
  const [assignee, setAssignee] = useState("");
  const [task, setTask] = useState("");
  const [tried, setTried] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const timer = useStopwatch();

  const minutes =
    mode === "times" ? durationMinutes(start, end) : Number(typedMinutes) || 0;

  const errors = {
    type:
      type === ""
        ? isEs
          ? "Elija un tipo de actividad"
          : "Choose an activity type"
        : null,
    date:
      !date || date > today
        ? isEs
          ? "Elija una fecha igual o anterior a hoy"
          : "Pick a date on or before today"
        : null,
    time:
      mode === "times" && minutes <= 0
        ? isEs
          ? "La hora de fin debe ser posterior a la hora de inicio"
          : "End time must be after start time"
        : null,
    minutes:
      mode === "minutes" && (minutes < 1 || minutes > 240)
        ? isEs
          ? "Ingrese de 1 a 240 minutos"
          : "Enter 1 to 240 minutes"
        : null,
    followDate:
      needsFollowUp === "yes" && (!followDate || followDate < date)
        ? isEs
          ? "Elija una fecha de seguimiento"
          : "Pick a follow-up date"
        : null,
    task:
      needsFollowUp === "yes" && task.trim() === ""
        ? isEs
          ? "Agregue la tarea"
          : "Add the task"
        : null,
  };
  const valid = Object.values(errors).every((error) => error === null);
  const show = (error: string | null) =>
    tried ? (error ?? undefined) : undefined;

  async function save() {
    setTried(true);
    if (locked || !valid || timer.running) return;
    setFailure(null);
    try {
      await actions.addActivity(patientId, {
        type,
        activityDate: date,
        ...(mode === "times"
          ? { startTime: start, endTime: end }
          : { minutes }),
        ...(note.trim() ? { note: note.trim() } : {}),
        outcome,
        countsToward: counts,
        ehrDocumented: ehr === "yes",
        ...(needsFollowUp === "yes"
          ? {
              followUp: {
                date: followDate,
                task: task.trim(),
                assigneeId: assignee || null,
              },
            }
          : {}),
      });
      onDone();
    } catch (error) {
      setFailure(error);
    }
  }

  return (
    <section
      aria-label={isEs ? "Agregar actividad de CCM" : "Add CCM activity"}
      className="mb-stack-lg space-y-stack-md rounded-card-nested border border-line p-inset-md"
    >
      {locked ? <ComplianceBadge /> : null}
      <div>
        <h3 className="text-heading-5 text-fg">
          {isEs ? "Agregar actividad de CCM" : "Add CCM Activity"}
        </h3>
        <p className="mt-stack-xs text-caption text-fg-muted">
          {isEs
            ? "Solo los datos clave. La nota clínica completa permanece en el EHR del consultorio."
            : "Key facts only. The full clinical note stays in the practice EHR."}
        </p>
      </div>
      {failure ? (
        <Alert tone="danger" onDismiss={() => setFailure(null)}>
          {actionErrorText(failure, isEs)}
        </Alert>
      ) : null}

      <div className="grid gap-stack-md sm:grid-cols-2">
        <FormField
          label={isEs ? "Tipo de actividad" : "Activity Type"}
          required
          error={show(errors.type)}
        >
          {(field) => (
            <Select
              {...field}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="" disabled>
                {isEs
                  ? "Seleccione el tipo de actividad"
                  : "Select activity type"}
              </option>
              {ACTIVITY_TYPES.map((option) => (
                <option key={option} value={option}>
                  {ccmText(option, isEs)}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField
          label={isEs ? "Fecha" : "Date"}
          required
          error={show(errors.date)}
        >
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
        label={isEs ? "Tiempo" : "Time"}
        value={mode}
        onChange={(next: EntryMode) => setMode(next)}
        options={[
          {
            value: "minutes",
            label: isEs ? "Minutos o temporizador" : "Minutes or Timer",
          },
          {
            value: "times",
            label: isEs ? "Hora de inicio / fin" : "Start / End Time",
          },
        ]}
      />

      {mode === "times" ? (
        <div className="grid gap-stack-md sm:grid-cols-3">
          <FormField
            label={isEs ? "Hora de inicio" : "Start Time"}
            required
            error={show(errors.time)}
          >
            {(field) => (
              <Input
                {...field}
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            )}
          </FormField>
          <FormField label={isEs ? "Hora de fin" : "End Time"} required>
            {(field) => (
              <Input
                {...field}
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            )}
          </FormField>
          <FormField label={isEs ? "Duración" : "Duration"}>
            {(field) => (
              <Input
                {...field}
                readOnly
                value={isEs ? `${minutes} minutos` : `${minutes} minutes`}
                className="tabular-nums"
              />
            )}
          </FormField>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-inline-md">
          <FormField
            label={isEs ? "Minutos" : "Minutes"}
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
                {isEs ? "Detener" : "Stop"} · {clock(timer.elapsed)}
              </span>
            </Button>
          ) : (
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={timer.start}
              disabled={locked}
              leadingIcon={<Play aria-hidden="true" />}
            >
              {isEs ? "Iniciar temporizador" : "Start Timer"}
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-stack-md sm:grid-cols-2">
        <SegmentedChoice
          label={
            isEs ? "¿Incluir en el tiempo de CCM?" : "Include in CCM time?"
          }
          value={counts}
          onChange={(next: CountsToward) => setCounts(next)}
          options={(["yes", "no", "pending"] as const).map((value) => ({
            value,
            label: ccmText(COUNTS_LABEL[value], isEs),
          }))}
        />
        <SegmentedChoice
          label={
            isEs
              ? "¿Documentación en el EHR completada?"
              : "EHR documentation completed?"
          }
          value={ehr}
          onChange={(next: YesNo) => setEhr(next)}
          options={isEs ? YES_NO_ES : YES_NO}
        />
      </div>

      <div className="grid gap-stack-md sm:grid-cols-2">
        <FormField label={isEs ? "Resultado" : "Outcome"} required>
          {(field) => (
            <Select
              {...field}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            >
              {OUTCOMES.map((option) => (
                <option key={option} value={option}>
                  {ccmText(option, isEs)}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        {/* The server records the signed-in staff member; not a choice. */}
        <FormField
          label={isEs ? "Registrado por" : "Entered By"}
          hint={isEs ? "Se registra a su nombre" : "Recorded as you"}
        >
          {(field) => <Input {...field} readOnly value={me} />}
        </FormField>
      </div>

      <SegmentedChoice
        label={isEs ? "¿Se necesita seguimiento?" : "Follow-up needed?"}
        value={needsFollowUp}
        onChange={(next: YesNo) => setNeedsFollowUp(next)}
        options={isEs ? YES_NO_ES : YES_NO}
      />

      {needsFollowUp === "yes" ? (
        <div className="grid gap-stack-md sm:grid-cols-3">
          <FormField
            label={isEs ? "Fecha de seguimiento" : "Follow-up Date"}
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
          <FormField label={isEs ? "Asignar a" : "Assign To"}>
            {(field) => (
              <Select
                {...field}
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              >
                <option value="">{isEs ? "Sin asignar" : "Unassigned"}</option>
                {assignees.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField
            label={isEs ? "Tarea" : "Task"}
            required
            error={show(errors.task)}
          >
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
        label={isEs ? "Nota administrativa" : "Administrative Note"}
        hint={
          isEs
            ? `Opcional y no clínica. ${note.length}/250`
            : `Optional and non-clinical. ${note.length}/250`
        }
      >
        {(field) => (
          <Textarea
            {...field}
            rows={2}
            maxLength={250}
            placeholder={
              isEs ? "Nota breve (no clínica)…" : "Brief note (non-clinical)…"
            }
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
          {isEs ? "Cancelar" : "Cancel"}
        </Button>
        <Button
          size="small"
          onClick={() => void save()}
          disabled={locked || timer.running || actions.isSaving}
        >
          {isEs ? "Guardar actividad" : "Save Activity"}
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------- compliance filter */

/** The client's soft compliance badge (2026-10-07). */
function ComplianceBadge() {
  const isEs = useIsEs();
  return (
    <Alert tone="warning" live={false}>
      {ccmText(CCM_BILLING_DEACTIVATED, isEs)}
    </Alert>
  );
}

/** Whether the patient is on dialysis, or under home health or hospice:
 *  either takes them out of the CCM billing queue (the server decides). */
function ComplianceSection({
  row,
  canEdit,
  onChange,
}: {
  row: CcmEnrollment;
  canEdit: boolean;
  onChange: (flags: {
    isOnDialysis: boolean;
    isOnHomeHealthOrHospice: boolean;
  }) => void;
}) {
  const isEs = useIsEs();
  const flags = {
    isOnDialysis: row.isOnDialysis,
    isOnHomeHealthOrHospice: row.isOnHomeHealthOrHospice,
  };
  return (
    <section className="space-y-stack-sm">
      <h3 className="text-heading-5 text-fg">
        {isEs
          ? "Elegibilidad para facturación de CCM"
          : "CCM Billing Eligibility"}
      </h3>
      {row.billingBlocked ? <ComplianceBadge /> : null}
      <div className="space-y-stack-xs">
        <SwitchRow
          checked={flags.isOnDialysis}
          disabled={!canEdit}
          onChange={(on) => onChange({ ...flags, isOnDialysis: on })}
          title={isEs ? "En diálisis (ESRD)" : "On dialysis (ESRD)"}
          description={
            isEs
              ? "Recibe diálisis de mantenimiento."
              : "Receiving maintenance dialysis."
          }
        />
        <SwitchRow
          checked={flags.isOnHomeHealthOrHospice}
          disabled={!canEdit}
          onChange={(on) => onChange({ ...flags, isOnHomeHealthOrHospice: on })}
          title={
            isEs
              ? "Atención médica domiciliaria o cuidados paliativos (hospicio)"
              : "Home health or hospice"
          }
          description={
            isEs
              ? "Bajo un plan de atención médica domiciliaria o de cuidados paliativos (hospicio)."
              : "Under a home health or hospice plan of care."
          }
        />
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
  "not-applicable": { icon: CircleMinus, className: "text-fg-muted" },
};

const EMPTY_REQUIREMENT: CcmRequirement = {
  id: "",
  status: "missing",
  met: false,
  inProgress: false,
  notApplicable: false,
  date: null,
  detail: "",
};

/* One checklist item: its state at a glance (glyph, then a caption with the
   date and note), the status menu on the right. Every change sends the
   item's full state (PUT …/requirements/{id}, `met` always present). */
function RequirementRow({
  current,
  label,
  today,
  readOnly = false,
  onSave,
}: {
  current: CcmRequirement;
  label: string;
  today: string;
  /** The signed-in role may not update the checklist. */
  readOnly?: boolean;
  onSave: (body: ReturnType<typeof requirementBody>) => void;
}) {
  const isEs = useIsEs();
  const status = current.status;
  const [editing, setEditing] = useState(false);
  const glyph = requirementGlyph[status] ?? requirementGlyph.missing;
  const Glyph = glyph.icon;

  const when =
    current.met && current.date
      ? isEs
        ? `Completado el ${usDate(current.date.slice(0, 10))}`
        : `Completed ${usDate(current.date.slice(0, 10))}`
      : status === "in-progress"
        ? isEs
          ? "En curso"
          : "Under way"
        : status === "not-applicable"
          ? isEs
            ? "No aplica"
            : "Does not apply"
          : isEs
            ? "Aún no completado"
            : "Not yet completed";

  const saveNote = (value: string) => {
    const detail = value.trim();
    if (detail !== current.detail)
      onSave(requirementBody(current, { detail }, today));
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
            placeholder={isEs ? "Agregue una nota breve" : "Add a short note"}
            aria-label={isEs ? `Nota: ${label}` : `Note: ${label}`}
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
            current.detail
              ? isEs
                ? `Editar nota: ${label}`
                : `Edit note: ${label}`
              : isEs
                ? `Agregar nota: ${label}`
                : `Add note: ${label}`
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
            aria-label={isEs ? `Estado: ${label}` : `Status: ${label}`}
            value={status}
            disabled={readOnly}
            className="w-full"
            onChange={(e) =>
              onSave(
                requirementBody(
                  current,
                  { status: e.target.value as RequirementStatus },
                  today,
                ),
              )
            }
          >
            {(Object.keys(requirementLabel) as RequirementStatus[]).map(
              (value) => (
                <option key={value} value={value}>
                  {(isEs ? requirementLabelEs : requirementLabel)[value]}
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
  const isEs = useIsEs();
  return documented ? (
    <Badge tone="success">{isEs ? "En el EHR" : "In EHR"}</Badge>
  ) : (
    <Badge tone="warning">{isEs ? "EHR pendiente" : "EHR pending"}</Badge>
  );
}

function staffLabel(
  ref: { name: string | null; title: string | null } | null,
  isEs = false,
) {
  if (!ref) return isEs ? "Sin asignar" : "Unassigned";
  return [ref.name ?? (isEs ? "Personal" : "Staff"), ref.title]
    .filter(Boolean)
    .join(", ");
}

/* The month's activities as rows that wrap, not a seven-column table that
   scrolled sideways inside the popup. */
function ActivityTable({
  activities,
  month,
  total,
  limit,
}: {
  activities: CcmActivityRow[];
  month: string;
  total?: number;
  limit?: number;
}) {
  const isEs = useIsEs();
  const shown = limit ? activities.slice(0, limit) : activities;
  if (shown.length === 0) {
    return (
      <EmptyState
        variant="bare"
        title={
          isEs
            ? `No hay actividad registrada en ${monthLabel(month, true)}`
            : `No activity logged in ${monthLabel(month)}`
        }
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
              {usDate(activity.activityDate.slice(0, 10))}
              {activity.startTime && activity.endTime ? (
                <span className="block text-caption text-fg-muted">
                  {formatTime(activity.startTime)} –{" "}
                  {formatTime(activity.endTime)}
                </span>
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-label-md text-fg">
                {ccmText(activity.type, isEs)}
              </p>
              <p className="text-caption text-fg-muted">
                {staffLabel(activity.staff, isEs)}
                {activity.followUp
                  ? ` · ${isEs ? "Seguimiento" : "Follow-up"} ${usDate(activity.followUp.date.slice(0, 10))}`
                  : ""}
              </p>
              {activity.note ? (
                <p className="mt-stack-xs text-body-sm text-fg-secondary">
                  {activity.note}
                </p>
              ) : null}
              <div className="mt-stack-sm flex flex-wrap gap-inline-sm">
                {activity.countsToward !== "yes" ? (
                  <Badge
                    tone={
                      activity.countsToward === "pending"
                        ? "warning"
                        : "neutral"
                    }
                  >
                    {activity.countsToward === "pending"
                      ? isEs
                        ? "Pendiente de revisión"
                        : "Pending review"
                      : isEs
                        ? "No contabilizado"
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
          <span>
            {monthLabel(month, isEs)} ·{" "}
            {isEs ? "contabilizado para CCM" : "counted toward CCM"}
          </span>
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
   staff open a patient for. The figures are the server's. */
function PatientSummary({
  row,
  followUp,
}: {
  row: CcmEnrollment;
  followUp?: { task: string; assignee: string };
}) {
  const isEs = useIsEs();
  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? "" : "s"}`;
  const reason =
    row.status === "Action Needed"
      ? [
          row.openAlerts > 0
            ? isEs
              ? `${row.openAlerts} ${row.openAlerts === 1 ? "alerta abierta" : "alertas abiertas"}`
              : plural(row.openAlerts, "open alert")
            : null,
          row.overdueFollowUps > 0
            ? isEs
              ? `${row.overdueFollowUps} ${row.overdueFollowUps === 1 ? "seguimiento vencido" : "seguimientos vencidos"}`
              : plural(row.overdueFollowUps, "overdue follow-up")
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : row.status === "Ready for Review"
        ? isEs
          ? "Se requiere revisión del consultorio"
          : "Practice review required"
        : isEs
          ? `Faltan ${row.remainingMinutes} min`
          : `${row.remainingMinutes} min to go`;
  const total = row.requirementsTotal || REQUIRED;
  const missing = total - row.requirementsMet;

  return (
    <dl
      aria-label={isEs ? "Este mes" : "This month"}
      className="mb-stack-lg grid grid-cols-1 gap-inline-md sm:grid-cols-2 lg:grid-cols-4"
    >
      <SummaryTile
        icon={ClockSolid}
        tone={statusTile[row.status]}
        label={isEs ? "Minutos de CCM" : "CCM minutes"}
        value={
          <>
            {row.minutes}
            <span className="text-body-sm text-fg-muted">
              {" "}
              / {CCM_THRESHOLD_MINUTES} min
            </span>
          </>
        }
        note={
          row.pendingMinutes > 0
            ? isEs
              ? `+${row.pendingMinutes} min pendientes de revisión`
              : `+${row.pendingMinutes} min pending review`
            : undefined
        }
      >
        <dd className="mt-stack-xs">
          <Progress
            value={Math.min(row.minutes, CCM_THRESHOLD_MINUTES)}
            max={CCM_THRESHOLD_MINUTES}
            tone={statusBar[row.status]}
            size="small"
            label={isEs ? "Minutos de CCM este mes" : "CCM minutes this month"}
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
        label={isEs ? "Estado" : "Status"}
        value={ccmText(row.status, isEs)}
        note={reason}
      />
      <SummaryTile
        icon={ListChecks}
        tone={missing === 0 ? "success" : "neutral"}
        label={isEs ? "Lista de verificación" : "Checklist"}
        value={
          isEs
            ? `${row.requirementsMet} de ${total} completos`
            : `${row.requirementsMet} of ${total} complete`
        }
        note={
          missing === 0
            ? isEs
              ? "Todos los requisitos cumplidos"
              : "All requirements met"
            : isEs
              ? `${missing} aún pendientes`
              : `${missing} still open`
        }
      />
      <SummaryTile
        icon={CalendarClock}
        tone={
          row.overdueFollowUps > 0
            ? "danger"
            : row.nextFollowUpOn
              ? "brand"
              : "neutral"
        }
        label={isEs ? "Próximo seguimiento" : "Next follow-up"}
        value={
          row.nextFollowUpOn
            ? usDate(row.nextFollowUpOn)
            : isEs
              ? "Ninguno programado"
              : "None scheduled"
        }
        note={
          followUp
            ? `${followUp.task}${followUp.assignee ? ` · ${followUp.assignee.split(",")[0]}` : ""}`
            : undefined
        }
      />
    </dl>
  );
}

type OpenFollowUp = {
  activity: CcmActivityRow;
  followUp: NonNullable<CcmActivityRow["followUp"]>;
};

/* Why the patient needs attention, with the action for each reason next to
   it, so it can be cleared where it is read. */
function AttentionPanel({
  alerts,
  overdue,
  canAct,
  busy,
  onResolve,
  onDone,
  onLog,
}: {
  alerts: CcmInboxItem[];
  overdue: OpenFollowUp[];
  canAct: boolean;
  busy: boolean;
  onResolve: (item: CcmInboxItem) => void;
  onDone: (activity: CcmActivityRow) => void;
  /** Absent when the signed-in role may not log time. */
  onLog?: (alert: CcmInboxItem) => void;
}) {
  const isEs = useIsEs();
  if (alerts.length === 0 && overdue.length === 0) return null;
  const item =
    "flex flex-wrap items-center justify-between gap-inline-md py-inset-xs first:pt-0 last:pb-0";
  return (
    <Alert tone="danger" title={isEs ? "Requiere acción" : "Action needed"}>
      <ul className="mt-stack-sm divide-y divide-danger-line">
        {alerts.map((alert) => (
          <li key={alert.id} className={item}>
            <span className="min-w-0 flex-1">
              <span className="text-label-md">
                {ccmText(alert.kind, isEs)}:
              </span>{" "}
              {alert.text}
              <span className="block text-caption text-fg-muted">
                {ccmText(activityTypeFor(alert), isEs)}
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
                  {isEs ? "Registrar tiempo" : "Log Time"}
                </Button>
              ) : null}
              {canAct ? (
                <Button
                  size="small"
                  variant="neutral"
                  appearance="fill-stroke"
                  disabled={busy}
                  onClick={() => onResolve(alert)}
                  leadingIcon={<Check aria-hidden="true" />}
                >
                  {isEs ? "Resolver" : "Resolve"}
                </Button>
              ) : null}
            </span>
          </li>
        ))}
        {overdue.map(({ activity, followUp }) => (
          <li key={activity.id} className={item}>
            <span>
              <span className="text-label-md">
                {isEs ? "Seguimiento vencido:" : "Overdue follow-up:"}
              </span>{" "}
              {followUp.task} ({isEs ? "vence el" : "due"}{" "}
              {usDate(followUp.date.slice(0, 10))})
            </span>
            {canAct ? (
              <Button
                size="small"
                variant="neutral"
                appearance="fill-stroke"
                disabled={busy}
                onClick={() => onDone(activity)}
                leadingIcon={<Check aria-hidden="true" />}
              >
                {isEs ? "Listo" : "Done"}
              </Button>
            ) : null}
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
  const isEs = useIsEs();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(values);
  const [tried, setTried] = useState(false);
  const tooFew = chronicCount(draft, library) < 2;
  const sorted = sortedConditions(values, library, isEs);

  return (
    <section>
      <div className="mb-stack-sm flex flex-wrap items-center justify-between gap-inline-md">
        <h3 className="text-heading-5 text-fg">
          {isEs ? "Afecciones crónicas" : "Chronic Conditions"} ({sorted.length}
          )
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
            {isEs ? "Editar afecciones" : "Edit Conditions"}
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
              {isEs
                ? "CCM requiere dos o más afecciones crónicas."
                : "CCM needs two or more chronic conditions."}
            </p>
          ) : null}
          <div className="flex justify-end gap-inline-md">
            <Button
              size="small"
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setEditing(false)}
            >
              {isEs ? "Cancelar" : "Cancel"}
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
              {isEs ? "Guardar afecciones" : "Save Conditions"}
            </Button>
          </div>
        </div>
      ) : (
        <ul className="flex flex-wrap gap-inline-sm">
          {sorted.map((condition) => (
            <li key={condition.value}>
              <Badge tone={condition.other ? "neutral" : "info"}>
                {condition.label}
                {condition.other ? (isEs ? " (Otra)" : " (Other)") : ""}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The CCM sheet's patient check-ins: the notices they sent this office. */
function PatientCheckIns({ patientId }: { patientId: string }) {
  const isEs = useIsEs();
  const notices = useCheckInNotices({ patientId, page: 1, limit: 25 });
  const [open, setOpen] = useState<CheckInNotice | null>(null);
  const rows = notices.data?.items ?? [];
  return (
    <AsyncSection
      pending={notices.isPending}
      {...readError(
        notices.error,
        isEs
          ? "No se pudieron cargar los registros"
          : "Check-ins could not be loaded",
        notices.refetch,
        isEs,
      )}
      isEmpty={rows.length === 0}
      empty={
        <EmptyState
          variant="bare"
          title={isEs ? "No hay avisos de registro" : "No check-in notices"}
        />
      }
      skeleton={<Skeleton height={120} />}
    >
      <ul className="divide-y divide-line-subtle">
        {rows.map((notice) => (
          <li
            key={notice.id}
            className="flex items-start gap-inline-lg py-inset-xs first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <p className="text-label-lg text-fg">
                {usDate(notice.deliverOn)}
              </p>
              <p className="text-body-sm text-fg-secondary">
                {notice.reasons
                  .map((reason) => noticeReasonText(reason, isEs))
                  .join(" · ")}
              </p>
            </div>
            <Button
              size="small"
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setOpen(notice)}
            >
              {isEs ? "Ver" : "View"}
            </Button>
          </li>
        ))}
      </ul>
      {open ? (
        <NoticeModal notice={open} onClose={() => setOpen(null)} />
      ) : null}
    </AsyncSection>
  );
}

function PatientModal({
  patientId,
  actions,
  month,
  today,
  canLog,
  library,
  onClose,
}: {
  patientId: string;
  actions: CcmActions;
  month: string;
  today: string;
  library: CcmCondition[];
  /** The signed-in role may log time and update the checklist. */
  canLog: boolean;
  onClose: () => void;
}) {
  const isEs = useIsEs();
  const [tab, setTab] = useState<PatientTab>("overview");
  const [adding, setAdding] = useState(false);
  const [prefill, setPrefill] = useState<ActivityPrefill | undefined>();
  const patient = useCcmPatient(patientId, month);
  /* Open follow-ups can sit in earlier months: read this one and two back. */
  const months = useMemo(
    () => [month, monthBefore(month, 1), monthBefore(month, 2)],
    [month],
  );
  const activityRead = useCcmActivities(patientId, months);
  const alertsRead = useCcmInbox({ patientId, page: 1, limit: 50 });
  const row = patient.data;
  const activities = useMemo(
    () =>
      [...(activityRead.byMonth[0]?.rows ?? [])].sort((a, b) =>
        b.activityDate.localeCompare(a.activityDate),
      ),
    [activityRead.byMonth],
  );
  const followUps: OpenFollowUp[] = useMemo(
    () =>
      activityRead.byMonth
        .flatMap((m) => m.rows)
        .filter((a) => a.followUp && !a.followUp.done)
        .map((a) => ({ activity: a, followUp: a.followUp! }))
        .sort((a, b) => a.followUp.date.localeCompare(b.followUp.date)),
    [activityRead.byMonth],
  );
  const alerts = alertsRead.data?.items ?? [];
  const undocumentedCount = activities.filter((a) => !a.ehrDocumented).length;
  const run = (promise: Promise<unknown>) =>
    void promise.catch(() => undefined);

  const count = (label: string, n: number) =>
    n > 0 ? `${label} (${n})` : label;
  const name = row ? patientName(row) : isEs ? "Paciente" : "Patient";
  const notFound = isApiError(patient.error, { status: 404 });

  return (
    <Modal
      open
      onClose={onClose}
      placement="bottom"
      title={name}
      description={
        row
          ? [
              row.mrn ? `MRN ${row.mrn}` : null,
              row.dateOfBirth
                ? isEs
                  ? `${ageOn(row.dateOfBirth.slice(0, 10), today)} años (fecha de nacimiento ${usDate(row.dateOfBirth.slice(0, 10))})`
                  : `${ageOn(row.dateOfBirth.slice(0, 10), today)} y/o (DOB ${usDate(row.dateOfBirth.slice(0, 10))})`
                : null,
              row.providerName,
              row.location,
            ]
              .filter(Boolean)
              .join(" · ")
          : undefined
      }
    >
      <AsyncSection
        pending={patient.isPending}
        error={patient.error}
        errorTitle={
          notFound
            ? isEs
              ? "Este paciente ya no está en el CCM de este consultorio"
              : "This patient is no longer in this office's CCM"
            : errorTitleFor(
                patient.error,
                isEs
                  ? "No se pudo cargar el paciente"
                  : "The patient could not be loaded",
                isEs ? "es" : "en",
              )
        }
        errorMessage={
          notFound
            ? isEs
              ? "La relación de atención terminó o se eliminó la inscripción. Cierre esta ventana y actualice la lista de trabajo."
              : "The care relationship ended or the enrollment was removed. Close this and refresh the worklist."
            : errorMessageFor(patient.error, undefined, isEs ? "es" : "en")
        }
        onRetry={
          !notFound && canRetry(patient.error) ? patient.refetch : undefined
        }
        skeleton={<Skeleton height={320} />}
      >
        {row ? (
          <>
            <PatientSummary
              row={row}
              followUp={
                followUps[0]
                  ? {
                      task: followUps[0].followUp.task,
                      assignee: staffLabel(
                        followUps[0].followUp.assignee,
                        isEs,
                      ),
                    }
                  : undefined
              }
            />

            {/* The tabs, with the sheet's one primary action at the end of
                the row: logging time is what staff most often open a
                patient to do. */}
            <div className="mb-stack-lg flex flex-wrap items-center justify-between gap-inline-md">
              <div className="no-scrollbar min-w-0 overflow-x-auto">
                <Tabs
                  label={isEs ? "CCM del paciente" : "Patient CCM"}
                  value={tab}
                  onChange={setTab}
                  items={[
                    { id: "overview", label: isEs ? "Resumen" : "Overview" },
                    { id: "activity", label: isEs ? "Actividad" : "Activity" },
                    { id: "checkins", label: isEs ? "Registros" : "Check-Ins" },
                    {
                      id: "education",
                      label: isEs ? "Educación" : "Education",
                    },
                    {
                      id: "documents",
                      label: count(
                        isEs ? "Documentos" : "Documents",
                        undocumentedCount,
                      ),
                    },
                    {
                      id: "followups",
                      label: count(
                        isEs ? "Seguimientos" : "Follow-Ups",
                        followUps.length,
                      ),
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
                  {isEs ? "Registrar actividad" : "Log Activity"}
                </Button>
              ) : null}
            </div>

            <TabPanel id="overview" value={tab} className="space-y-stack-lg">
              {alertsRead.error || activityRead.error ? (
                <Alert
                  tone="danger"
                  title={
                    isEs
                      ? "No se pudieron cargar algunos datos de este paciente"
                      : "Some of this patient's data could not be loaded"
                  }
                >
                  {actionErrorText(
                    alertsRead.error ?? activityRead.error,
                    isEs,
                  )}
                </Alert>
              ) : null}
              <AttentionPanel
                alerts={alerts}
                overdue={followUps.filter(
                  (f) => f.followUp.date.slice(0, 10) < today,
                )}
                canAct={canLog}
                busy={actions.isSaving}
                onResolve={(item) =>
                  run(actions.resolveInbox(patientId, item.id))
                }
                onDone={(activity) =>
                  run(actions.completeFollowUp(patientId, activity.id))
                }
                onLog={
                  canLog
                    ? (alert) => {
                        setPrefill({
                          type: activityTypeFor(alert),
                          note: `${ccmText(alert.kind, isEs)}: ${alert.text}`.slice(
                            0,
                            250,
                          ),
                        });
                        setTab("activity");
                        setAdding(true);
                      }
                    : undefined
                }
              />

              <ComplianceSection
                row={row}
                canEdit={canLog}
                onChange={(flags) =>
                  run(actions.setCompliance(patientId, flags))
                }
              />

              <ConditionsSection
                values={row.conditions}
                library={library}
                canEdit={canLog}
                onSave={(next) => run(actions.setConditions(patientId, next))}
              />

              <section>
                <div className="mb-stack-sm flex flex-wrap items-baseline justify-between gap-inline-md">
                  <h3 className="text-heading-5 text-fg">
                    {isEs
                      ? "Lista de verificación de CCM (solo seguimiento)"
                      : "CCM Checklist (Tracking Only)"}
                  </h3>
                  <span className="text-caption text-fg-muted">
                    {row.requirementsMet} {isEs ? "de" : "of"}{" "}
                    {row.requirementsTotal || REQUIRED}{" "}
                    {isEs
                      ? "completos o no aplicables"
                      : "complete or not applicable"}
                  </span>
                </div>
                {/* The client's disclaimer and status meanings (2026-10-07). */}
                <p className="mb-stack-sm text-caption text-fg-muted">
                  {ccmText(CCM_CHECKLIST_DISCLAIMER, isEs)}
                </p>
                <dl className="mb-stack-sm grid gap-x-inline-lg gap-y-stack-xs text-caption sm:grid-cols-2">
                  {(Object.keys(requirementLabel) as RequirementStatus[]).map(
                    (value) => (
                      <div key={value} className="min-w-0">
                        <dt className="inline text-label-sm text-fg">
                          {
                            (isEs ? requirementLabelEs : requirementLabel)[
                              value
                            ]
                          }
                          :{" "}
                        </dt>
                        <dd className="inline text-fg-muted">
                          {ccmText(REQUIREMENT_STATUS_MEANING[value], isEs)}
                        </dd>
                      </div>
                    ),
                  )}
                </dl>
                <ul className="divide-y divide-line-subtle rounded-card-nested border border-line p-inset-md">
                  {CCM_REQUIREMENTS.map((requirement) => (
                    <RequirementRow
                      key={requirement.id}
                      current={
                        row.requirements.find(
                          (r) => r.id === requirement.id,
                        ) ?? { ...EMPTY_REQUIREMENT, id: requirement.id }
                      }
                      label={ccmText(requirement.label, isEs)}
                      today={today}
                      readOnly={!canLog}
                      onSave={(body) =>
                        run(
                          actions.setRequirement(
                            patientId,
                            requirement.id,
                            body,
                          ),
                        )
                      }
                    />
                  ))}
                </ul>
              </section>

              <KidneyCareSection
                patient={{ name, mrn: row.mrn ?? "", patientId }}
                serverPlan={row.kidneyCarePlan}
                canEdit={canLog}
                onSave={(body) => run(actions.setKidneyCare(patientId, body))}
              />
              <section>
                <div className="mb-stack-sm flex flex-wrap items-center justify-between gap-inline-md">
                  <h3 className="text-heading-5 text-fg">
                    {isEs
                      ? "Actividades recientes de CCM"
                      : "Recent CCM Activities"}{" "}
                    ({monthLabel(month, isEs)})
                  </h3>
                  {activities.length > 5 ? (
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="ghost"
                      onClick={() => setTab("activity")}
                    >
                      {isEs
                        ? `Ver las ${activities.length}`
                        : `View all ${activities.length}`}
                    </Button>
                  ) : null}
                </div>
                {activityRead.isPending ? (
                  <Skeleton height={120} />
                ) : (
                  <ActivityTable
                    activities={activities}
                    month={month}
                    limit={5}
                  />
                )}
              </section>
            </TabPanel>

            <TabPanel id="activity" value={tab}>
              {adding ? (
                <ActivityForm
                  key={prefill ? `${prefill.type}|${prefill.note}` : "blank"}
                  patientId={patientId}
                  actions={actions}
                  today={today}
                  prefill={prefill}
                  locked={row.billingBlocked}
                  onDone={() => setAdding(false)}
                />
              ) : null}
              {/* One way in (client, 2026-10-01): the header's Log
                  Activity, which opens this form from any tab. */}
              <AsyncSection
                pending={activityRead.isPending}
                {...readError(
                  activityRead.error,
                  isEs
                    ? "No se pudieron cargar las actividades"
                    : "Activities could not be loaded",
                  activityRead.refetch,
                  isEs,
                )}
                skeleton={<Skeleton height={160} />}
              >
                <ActivityTable
                  activities={activities}
                  month={month}
                  total={row.minutes}
                />
              </AsyncSection>
            </TabPanel>

            <TabPanel id="checkins" value={tab}>
              {tab === "checkins" ? (
                <PatientCheckIns patientId={patientId} />
              ) : null}
            </TabPanel>

            <TabPanel id="education" value={tab}>
              <EmptyState
                variant="bare"
                title={
                  isEs
                    ? "Aún no está disponible aquí"
                    : "Not available here yet"
                }
                description={
                  isEs
                    ? "El progreso del programa se muestra en la página de Miembros."
                    : "Program progress is shown on the Members page."
                }
              />
            </TabPanel>

            <TabPanel id="documents" value={tab} className="space-y-stack-md">
              <p className="text-body-sm text-fg-secondary">
                {isEs
                  ? "La documentación clínica está en el EHR del consultorio. Marque cada actividad una vez que se haya registrado allí."
                  : "Clinical documentation lives in the practice EHR. Mark each activity once it has been charted there."}
              </p>
              {activities.length === 0 ? (
                <EmptyState
                  variant="bare"
                  title={
                    isEs
                      ? `No hay actividad registrada en ${monthLabel(month, true)}`
                      : `No activity logged in ${monthLabel(month)}`
                  }
                />
              ) : (
                <ul className="divide-y divide-line-subtle">
                  {activities.map((activity) => (
                    <li
                      key={activity.id}
                      className="flex items-center gap-inline-lg py-inset-xs first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-label-lg text-fg">
                          {ccmText(activity.type, isEs)}
                        </p>
                        <p className="text-body-sm text-fg-secondary tabular-nums">
                          {usDate(activity.activityDate.slice(0, 10))} ·{" "}
                          {staffLabel(activity.staff, isEs)} ·{" "}
                          {activity.minutes} min
                        </p>
                      </div>
                      {activity.ehrDocumented ? (
                        <Badge tone="success">
                          {isEs ? "En el EHR" : "In EHR"}
                        </Badge>
                      ) : canLog ? (
                        <Button
                          size="small"
                          variant="neutral"
                          appearance="fill-stroke"
                          disabled={actions.isSaving}
                          onClick={() =>
                            run(
                              actions.setEhrDocumented(
                                patientId,
                                activity.id,
                                true,
                              ),
                            )
                          }
                          leadingIcon={<Check aria-hidden="true" />}
                        >
                          {isEs ? "Marcar como documentado" : "Mark Documented"}
                        </Button>
                      ) : (
                        <EhrMark documented={false} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </TabPanel>

            <TabPanel id="followups" value={tab}>
              {followUps.length === 0 ? (
                <EmptyState
                  variant="bare"
                  title={
                    isEs ? "No hay seguimientos abiertos" : "No open follow-ups"
                  }
                />
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
                          {staffLabel(followUp.assignee, isEs)} ·{" "}
                          {isEs ? "vence el" : "due"}{" "}
                          {usDate(followUp.date.slice(0, 10))}
                          {followUp.date.slice(0, 10) < today ? (
                            <Badge tone="danger" className="ml-inline-sm">
                              {isEs ? "Vencido" : "Overdue"}
                            </Badge>
                          ) : null}
                        </p>
                      </div>
                      {canLog ? (
                        <Button
                          size="small"
                          variant="neutral"
                          appearance="fill-stroke"
                          disabled={actions.isSaving}
                          onClick={() =>
                            run(
                              actions.completeFollowUp(patientId, activity.id),
                            )
                          }
                          leadingIcon={<Check aria-hidden="true" />}
                        >
                          {isEs ? "Listo" : "Done"}
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </TabPanel>
          </>
        ) : null}
      </AsyncSection>
    </Modal>
  );
}

/* ------------------------------------------------------------ add to CCM */

const NAME_MAX = 120;

/** Enrols one of the office's roster patients in CCM, once they have
 *  consented: the conditions that qualify them and who looks after them.
 *  The server checks the care relationship and the two chronic
 *  conditions; a patient already enrolled is refused there. */
function AddToCcmModal({
  library,
  actions,
  onClose,
}: {
  library: CcmCondition[];
  actions: CcmActions;
  onClose: () => void;
}) {
  const isEs = useIsEs();
  const roster = useRosterPicks();
  const candidates: RosterPick[] = roster.patients;
  const [chosen, setChosen] = useState("");
  const patientId = chosen || candidates[0]?.patientId || "";
  const picked = candidates.find((c) => c.patientId === patientId);
  const [conditions, setConditions] = useState<string[]>([]);
  const [provider, setProvider] = useState("");
  const [careManager, setCareManager] = useState("");
  const [location, setLocation] = useState("");
  const [tried, setTried] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const errors = {
    conditions:
      chronicCount(conditions, library) >= 2
        ? undefined
        : isEs
          ? "CCM requiere dos o más afecciones crónicas"
          : "CCM needs two or more chronic conditions",
    provider: provider.trim()
      ? undefined
      : isEs
        ? "Ingrese el proveedor"
        : "Enter the provider",
    careManager: careManager.trim()
      ? undefined
      : isEs
        ? "Ingrese el gestor de atención"
        : "Enter the care manager",
  };

  async function add() {
    setTried(true);
    if (
      !patientId ||
      errors.conditions ||
      errors.provider ||
      errors.careManager
    )
      return;
    setFailure(null);
    try {
      await actions.enroll({
        patientId,
        conditions,
        providerName: provider.trim(),
        careManagerName: careManager.trim(),
        ...(location.trim() ? { location: location.trim() } : {}),
      });
      onClose();
    } catch (error) {
      setFailure(error);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="big"
      title={isEs ? "Agregar a CCM" : "Add to CCM"}
      description={
        isEs
          ? "Para un paciente que dio su consentimiento para la Gestión de Atención Crónica (CCM)."
          : "For a patient who has consented to Chronic Care Management."
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            disabled={candidates.length === 0 || actions.isSaving}
            onClick={() => void add()}
          >
            {isEs ? "Agregar a CCM" : "Add to CCM"}
          </Button>
        </>
      }
    >
      <AsyncSection
        pending={roster.isPending}
        {...readError(
          roster.error,
          isEs
            ? "No se pudieron cargar sus pacientes"
            : "Your patients could not be loaded",
          roster.refetch,
          isEs,
        )}
        isEmpty={candidates.length === 0}
        empty={
          <EmptyState
            variant="bare"
            title={
              isEs
                ? "Aún no hay pacientes en su lista de pacientes"
                : "No patients on your roster yet"
            }
          />
        }
        skeleton={<Skeleton height={240} />}
      >
        <div className="space-y-stack-md">
          {failure ? (
            <Alert tone="danger" onDismiss={() => setFailure(null)}>
              {actionErrorText(failure, isEs)}
            </Alert>
          ) : null}
          <FormField label={isEs ? "Paciente" : "Patient"} required>
            {(field) => (
              <Select
                {...field}
                value={patientId}
                onChange={(e) => setChosen(e.target.value)}
              >
                {candidates.map((c) => (
                  <option key={c.patientId} value={c.patientId}>
                    {patientName(c)}
                    {c.mrn ? ` · MRN ${c.mrn}` : ""}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <p className="text-body-sm text-fg-secondary">
            {isEs ? "Fecha de nacimiento:" : "Date of birth:"}{" "}
            {picked?.dateOfBirth
              ? usDate(picked.dateOfBirth.slice(0, 10))
              : isEs
                ? "no registrada"
                : "not on file"}
          </p>
          <FormField
            label={isEs ? "Afecciones crónicas" : "Chronic conditions"}
            required
            hint={
              isEs
                ? "Elija todas las afecciones que correspondan. Use Otra para cualquiera que no esté en la lista."
                : "Choose every condition that applies. Use Other for anything not listed."
            }
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
            <FormField
              label={isEs ? "Proveedor" : "Provider"}
              required
              error={tried ? errors.provider : undefined}
            >
              {(field) => (
                <Input
                  {...field}
                  value={provider}
                  maxLength={NAME_MAX}
                  onChange={(e) => setProvider(e.target.value)}
                />
              )}
            </FormField>
            <FormField
              label={isEs ? "Gestor de atención" : "Care manager"}
              required
              error={tried ? errors.careManager : undefined}
            >
              {(field) => (
                <Input
                  {...field}
                  value={careManager}
                  maxLength={NAME_MAX}
                  onChange={(e) => setCareManager(e.target.value)}
                />
              )}
            </FormField>
            <FormField label={isEs ? "Ubicación" : "Location"}>
              {(field) => (
                <Input
                  {...field}
                  value={location}
                  maxLength={NAME_MAX}
                  onChange={(e) => setLocation(e.target.value)}
                />
              )}
            </FormField>
          </div>
        </div>
      </AsyncSection>
    </Modal>
  );
}

/* ------------------------------------------------------------------ page */

type PageTab = "worklist" | "checkins" | "inbox" | "followups";

function PageSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2">
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
  const isEs = useIsEs();
  const actions = useCcm();
  const office = useOfficeOrg();
  const canLog = useCan("ccm.log");
  const canManageLibrary = useCan("settings.manage");
  const conditionLibrary = useConditionLibrary();
  const library = conditionLibrary.library;
  const practice = useOptionalAuth()?.user?.org ?? "";
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const now = useNow();
  const today = dayKey(now);
  const months = recentMonths(now);
  const [month, setMonth] = useState(months[0]);
  const [tab, setTab] = useState<PageTab>("worklist");
  const [openId, setOpenId] = useState<string | null>(null);

  const summary = useCcmSummary(month);
  const inboxCount = useCcmInbox({ page: 1, limit: 1 });
  const unseenNotices = useCheckInNotices(
    { seen: false, page: 1, limit: 1 },
    office.can("check_ins", 1),
  );
  /* Dialysis, home health or hospice charts leave the billing queue
     (client, 2026-10-07); they are listed apart, still openable. */
  const deactivated = useCcmWorklist({
    month,
    billing: "deactivated",
    sort: "name",
    page: 1,
    limit: WORKLIST_PAGE,
  });
  /* Follow-ups due this week or overdue, soonest first (server fields). */
  const dueRead = useCcmWorklist({
    month: months[0],
    sort: "nextFollowUp",
    direction: "asc",
    page: 1,
    limit: 150,
  });
  const horizon = addDays(today, 7);
  const due = (dueRead.data?.items ?? []).filter(
    (row) =>
      row.overdueFollowUps > 0 ||
      (row.nextFollowUpOn !== null && row.nextFollowUpOn <= horizon),
  );
  const totalOf = (page: { pagination: unknown } | undefined) => {
    const p = page?.pagination as { mode?: string; total?: number } | null;
    return p && p.mode === "offset" ? (p.total ?? 0) : 0;
  };
  const count = (label: string, n: number) =>
    n > 0 ? `${label} (${n})` : label;
  const deactivatedRows = deactivated.data?.items ?? [];
  const s = summary.data;

  return (
    <div className="space-y-4">
      <PageTitle
        href={HREF}
        action={
          <div className="flex flex-wrap items-center gap-inline-md">
            {practice ? (
              <span className="text-body-sm text-fg-muted">{practice}</span>
            ) : null}
            <UpdatedBar
              updatedAt={summary.updatedAt}
              isFetching={summary.isFetching}
              refetch={summary.refetch}
            />
            {canLog ? (
              <Button
                size="small"
                onClick={() => setAdding(true)}
                leadingIcon={<Plus aria-hidden="true" />}
              >
                {isEs ? "Agregar a CCM" : "Add to CCM"}
              </Button>
            ) : null}
            <Select
              selectSize="small"
              aria-label={isEs ? "Mes" : "Month"}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-48"
            >
              {months.map((option) => (
                <option key={option} value={option}>
                  {monthLabel(option, isEs)}
                </option>
              ))}
            </Select>
          </div>
        }
      />
      <AsyncSection
        pending={summary.isPending}
        {...readError(
          summary.error,
          isEs
            ? "No se pudieron cargar los datos de CCM"
            : "CCM data could not be loaded",
          summary.refetch,
          isEs,
        )}
        skeleton={<PageSkeleton />}
      >
        {actions.writeError ? (
          <Alert tone="danger" onDismiss={actions.clearWriteError}>
            {isEs ? "No se guardó ese cambio." : "That change did not save."}{" "}
            {actionErrorText(actions.writeError, isEs)}
          </Alert>
        ) : null}

        <section
          aria-label={isEs ? "Resumen de CCM" : "CCM summary"}
          className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2"
        >
          <KeyCard
            tone="brand"
            icon={<UsersSolid />}
            value={s?.billingQueue ?? 0}
            label={isEs ? "Pacientes inscritos" : "Enrolled Patients"}
            note={
              isEs
                ? `Activos en ${monthLabel(month, true)}`
                : `Active in ${monthLabel(month)}`
            }
          />
          <KeyCard
            tone="danger"
            icon={<AlertTriangleSolid />}
            value={s?.actionNeeded ?? 0}
            label={ccmText("Action Needed", isEs)}
            note={
              isEs
                ? "Alerta abierta o seguimiento vencido"
                : "Open alert or overdue follow-up"
            }
          />
          <KeyCard
            tone="warning"
            icon={<ClockSolid />}
            value={s?.belowThreshold ?? 0}
            label={
              isEs
                ? `Menos de ${CCM_THRESHOLD_MINUTES} minutos`
                : `Below ${CCM_THRESHOLD_MINUTES} Minutes`
            }
            note={
              isEs
                ? `0–${CCM_THRESHOLD_MINUTES - 1} minutos registrados`
                : `0–${CCM_THRESHOLD_MINUTES - 1} minutes recorded`
            }
          />
          <KeyCard
            tone="success"
            icon={<CheckCircleSolid />}
            value={s?.readyForReview ?? 0}
            label={ccmText("Ready for Review", isEs)}
            note={
              isEs
                ? `${CCM_THRESHOLD_MINUTES}+ minutos · se requiere revisión del consultorio`
                : `${CCM_THRESHOLD_MINUTES}+ minutes · practice review required`
            }
          />
        </section>
        {s ? <StatusSplit summary={s} /> : null}

        <Card as="section" padding="none" className="min-w-0 overflow-hidden">
          <div className="p-card pb-stack-lg">
            <div className="overflow-x-auto">
              <Tabs
                label={isEs ? "Vistas de CCM" : "CCM views"}
                value={tab}
                onChange={setTab}
                items={[
                  {
                    id: "worklist",
                    label: isEs
                      ? "Lista de trabajo de pacientes"
                      : "Patient Worklist",
                  },
                  {
                    id: "checkins",
                    label: count(
                      isEs ? "Registros de pacientes" : "Patient Check-Ins",
                      totalOf(unseenNotices.data),
                    ),
                  },
                  {
                    id: "inbox",
                    label: count(
                      isEs ? "Bandeja de entrada de CCM" : "CCM Inbox",
                      totalOf(inboxCount.data),
                    ),
                  },
                  {
                    id: "followups",
                    label: count(
                      isEs ? "Seguimientos pendientes" : "Follow-Up Due",
                      due.length,
                    ),
                  },
                ]}
              />
            </div>
          </div>
          <TabPanel id="worklist" value={tab}>
            <Worklist
              month={month}
              library={library}
              onManageLibrary={
                canManageLibrary ? () => setLibraryOpen(true) : undefined
              }
              onOpen={setOpenId}
            />
          </TabPanel>
          <TabPanel id="checkins" value={tab}>
            {tab === "checkins" ? <CheckInsTable onOpen={setOpenId} /> : null}
          </TabPanel>
          <TabPanel id="inbox" value={tab}>
            {tab === "inbox" ? (
              <InboxTable
                actions={actions}
                canResolve={canLog}
                onOpen={setOpenId}
              />
            ) : null}
          </TabPanel>
          <TabPanel id="followups" value={tab}>
            <FollowUpTable
              rows={due}
              read={dueRead}
              today={today}
              onOpen={setOpenId}
            />
          </TabPanel>
          <p className="flex items-center gap-inline-sm border-t border-line px-(--table-edge) py-inset-sm text-caption text-fg-muted">
            <ShieldCheck aria-hidden="true" className="size-4 shrink-0" />
            {isEs
              ? "El personal del consultorio ingresa las actividades y el consultorio decide qué cuenta para la facturación. NephroReach registra el tiempo y no toma decisiones médicas."
              : "Practice staff enter activities and the practice decides what counts for billing. NephroReach tracks time and makes no medical decisions."}
          </p>
        </Card>

        {deactivated.error ? (
          <Alert tone="danger">
            {isEs
              ? "No se pudieron cargar los pacientes con facturación desactivada."
              : "Billing-deactivated patients could not be loaded."}{" "}
            {actionErrorText(deactivated.error, isEs)}
          </Alert>
        ) : deactivatedRows.length > 0 ? (
          <Card as="section" padding="small">
            <h2 className="text-heading-4 text-fg">
              {isEs
                ? "Facturación de CCM desactivada"
                : "CCM Billing Deactivated"}{" "}
              ({totalOf(deactivated.data)})
            </h2>
            <p className="mt-stack-xs text-body-sm text-fg-muted">
              {isEs
                ? "En diálisis, atención médica domiciliaria o cuidados paliativos (hospicio). No están en la cola de facturación y no se puede guardar tiempo de CCM."
                : "On dialysis, home health or hospice. Not in the billing queue and no CCM time can be saved."}
            </p>
            <ul className="mt-stack-md divide-y divide-line-subtle">
              {deactivatedRows.map((row) => {
                const name = patientName(row);
                return (
                  <li
                    key={row.patientId}
                    className="flex items-center justify-between gap-inline-lg py-inset-sm first:pt-0 last:pb-0"
                  >
                    <span className="min-w-0">
                      <span className="block text-label-lg text-fg">
                        {name}
                      </span>
                      <span className="block text-caption text-fg-muted">
                        {row.mrn ? `MRN ${row.mrn} · ` : ""}
                        {[
                          row.isOnDialysis
                            ? isEs
                              ? "En diálisis (ESRD)"
                              : "On dialysis (ESRD)"
                            : null,
                          row.isOnHomeHealthOrHospice
                            ? isEs
                              ? "Atención médica domiciliaria o cuidados paliativos (hospicio)"
                              : "Home health or hospice"
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-inline-md">
                      <Badge tone="warning">
                        {isEs
                          ? "Facturación desactivada"
                          : "Billing deactivated"}
                      </Badge>
                      <OpenButton
                        name={name}
                        onOpen={() => setOpenId(row.patientId)}
                      />
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : null}

        {openId ? (
          <PatientModal
            key={`${openId}:${month}`}
            patientId={openId}
            actions={actions}
            month={month}
            today={today}
            canLog={canLog}
            library={library}
            onClose={() => setOpenId(null)}
          />
        ) : null}
      </AsyncSection>
      {adding ? (
        <AddToCcmModal
          library={library}
          actions={actions}
          onClose={() => setAdding(false)}
        />
      ) : null}
      {libraryOpen ? (
        <ConditionLibraryModal onClose={() => setLibraryOpen(false)} />
      ) : null}
    </div>
  );
}
