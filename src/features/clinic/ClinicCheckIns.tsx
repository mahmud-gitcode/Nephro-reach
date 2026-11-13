"use client";

import { useExternalShare } from "@/features/sharing/ExternalShareNotice";
import React, { useEffect, useState } from "react";
import { BellRing, Download, Eye, Quote, UserRoundSearch } from "lucide-react";

import {
  AlertTriangleSolid,
  CheckCircleSolid,
  ClipboardCheckSolid,
  UsersSolid,
  XCircleSolid,
} from "@/components/icons/solid";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  AsyncSection,
  Badge,
  Button,
  Card,
  EmptyState,
  KeyCard,
  type KeyCardTone,
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
  TableRow,
} from "@/components/ui";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { downloadText, toCsv } from "@/lib/utils/download";
import { useLanguage } from "@/context/LanguageContext";
import { NewMessageModal } from "@/features/messaging/NewMessageModal";
import {
  useOfficeMessaging,
  useOfficeRecipients,
} from "@/features/messaging/useConversations";
import { saveErrorText } from "@/features/profile/saveError";
import { useOfficeOrg } from "./officeContext";
import { useNow } from "@/lib/utils/useNow";
import { dayKey, usDate } from "./ccm.data";
import {
  nameOf,
  noticeReasonText,
  type CheckInNotice,
} from "./checkInNotices.repository";
import {
  officeCheckInTotals,
  truncateWords,
  weekLabel,
  weekWindow,
} from "./checkIns.data";
import { tableIconButton } from "./tableButton";
import {
  useCheckInNotices,
  useCheckInSummary,
  useMarkNoticeSeen,
  useNoticeCheckIn,
} from "./useOfficeCheckIns";

/* ==========================================================================
   Check-ins (office; Phase 9 on the API)
   --------------------------------------------------------------------------
   What the server knows, and nothing else (D33 closed, D28 open):
   - the check-in notices members sent this office (open one to read the
     check-in behind it; that marks it seen on the server);
   - each sharing patient's days with a check-in this week (spec 034).
   The demo figures, rows, trend and quote are gone. Cards and panels with
   no server source say so instead of showing numbers: "At Risk" and
   "Missed" labels wait for D28, follow-up rules for D12.
   ========================================================================== */

const NAME_WORDS = 3;
const NOTICES_PAGE = 10;

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export const NOT_AVAILABLE = "Not available yet";
const NOT_AVAILABLE_ES = "Aún no disponible";

function useIsEs() {
  return useLanguage().language === "ES";
}

/** The error copy language for asyncState's helpers. */
const lang = (isEs: boolean) => (isEs ? "es" : "en");

function OverviewCard({
  label,
  value,
  note,
  icon,
  tone,
}: {
  label: string;
  value: string;
  note?: string;
  icon: React.ReactNode;
  tone: KeyCardTone;
}) {
  return (
    <KeyCard tone={tone} icon={icon} value={value} label={label} note={note} />
  );
}

function WeeklySummary({ today }: { today: string }) {
  const isEs = useIsEs();
  const summary = useCheckInSummary(weekWindow(today));
  const rows = summary.data?.items ?? [];
  return (
    <Card as="section" padding="small">
      <div className="mb-stack-lg flex flex-col gap-inset-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-heading-4 text-fg">
            {isEs ? "Resumen semanal de registros" : "Weekly Check-In Summary"}
          </h2>
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            {isEs
              ? "Días con un registro esta semana, de los pacientes que comparten sus registros con su consultorio."
              : "Days with a check-in this week, for patients who share check-ins with your office."}
          </p>
        </div>
        <div className="flex flex-col gap-inline-md sm:flex-row">
          <p className="flex h-control-small items-center rounded-pill border border-line bg-surface-sunken px-control-x-small text-body-sm whitespace-nowrap text-fg">
            {isEs
              ? `Esta semana (${weekLabel(today, isEs)})`
              : `This Week (${weekLabel(today)})`}
          </p>
          {/* The server's summary has no program filter yet: the control
              stays, disabled, rather than filtering nothing. Its wrapper
              does not shrink, so the words never break inside the control
              (P16c). */}
          <div className="shrink-0">
            <Select
              selectSize="small"
              aria-label={isEs ? "Programa" : "Program"}
              value="All Programs"
              disabled
              title={isEs ? NOT_AVAILABLE_ES : NOT_AVAILABLE}
              onChange={() => undefined}
            >
              <option value="All Programs">
                {isEs ? "Todos los programas" : "All Programs"}
              </option>
            </Select>
          </div>
        </div>
      </div>

      <AsyncSection
        pending={summary.isPending}
        error={summary.error}
        errorTitle={errorTitleFor(
          summary.error,
          isEs
            ? "No se pudieron cargar los registros"
            : "Check-ins could not be loaded",
          lang(isEs),
        )}
        errorMessage={errorMessageFor(summary.error, undefined, lang(isEs))}
        onRetry={canRetry(summary.error) ? summary.refetch : undefined}
        isEmpty={rows.length === 0}
        empty={
          <EmptyState
            variant="bare"
            title={
              isEs
                ? "Aún ningún paciente comparte sus registros con su consultorio"
                : "No patient shares check-ins with your office yet"
            }
          />
        }
        skeleton={<Skeleton height={160} />}
      >
        <div className="grid gap-inset-md sm:grid-cols-2">
          {rows.map((row) => {
            const name = nameOf(row);
            return (
              <div
                key={row.patientId}
                className="rounded-control border border-line p-inset-sm"
              >
                <div className="flex items-baseline justify-between gap-inline-md">
                  <p className="text-body-sm text-fg-secondary">{name}</p>
                  <p className="text-label-md text-fg tabular-nums">
                    {row.completionPercent}%
                  </p>
                </div>
                <Progress
                  value={row.completionPercent}
                  label={
                    isEs
                      ? `${name}: registros completados esta semana`
                      : `${name}: check-in completion this week`
                  }
                  size="small"
                  className="mt-stack-sm"
                />
                <p className="mt-stack-sm text-caption text-fg-muted tabular-nums">
                  {row.checkInDays} / {row.daysInWindow}{" "}
                  {isEs ? "días" : "days"}
                  {row.lastCheckInDate
                    ? isEs
                      ? ` · último ${usDate(row.lastCheckInDate)}`
                      : ` · last ${usDate(row.lastCheckInDate)}`
                    : ""}
                </p>
              </div>
            );
          })}
        </div>
      </AsyncSection>
    </Card>
  );
}

function QuickActions({
  rows,
  onRemind,
}: {
  /** The notices on screen, for the export. */
  rows: CheckInNotice[];
  onRemind: () => void;
}) {
  /* Leaves NephroReach: ask first (client, 2026-10-07). */
  const share = useExternalShare();
  const isEs = useIsEs();
  const actions: Array<{
    label: string;
    fullLabel: string;
    icon: IconType;
    onClick: () => void;
    disabled?: boolean;
  }> = [
    {
      label: isEs ? "Enviar recordatorio" : "Send Reminder",
      fullLabel: isEs
        ? "Enviar un recordatorio de registro"
        : "Send a check-in reminder",
      icon: BellRing,
      onClick: onRemind,
    },
    {
      label: isEs ? "Seguimientos" : "Follow-Ups",
      fullLabel: isEs
        ? "Ver miembros que necesitan seguimiento"
        : "View Members Needing Follow-Up",
      icon: UserRoundSearch,
      onClick: () =>
        document
          .getElementById("follow-ups")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
    {
      label: isEs ? "Exportar informe" : "Export Report",
      fullLabel: isEs
        ? "Exportar informe de registros"
        : "Export Check-In Report",
      icon: Download,
      disabled: rows.length === 0,
      onClick: () =>
        share.guard(
          () =>
            downloadText(
              "check-in-notices.csv",
              toCsv([
                isEs
                  ? [
                      "Miembro",
                      "MRN",
                      "Llegó al consultorio",
                      "Motivos",
                      "Visto",
                    ]
                  : ["Member", "MRN", "Reached the office", "Reasons", "Seen"],
                ...rows.map((r) => [
                  nameOf(r),
                  r.mrn ?? "",
                  r.deliverOn,
                  r.reasons
                    .map((reason) => noticeReasonText(reason, isEs))
                    .join("; "),
                  r.seen ? (isEs ? "Sí" : "Yes") : "No",
                ]),
              ]),
            ),
          "download",
        ),
    },
  ];

  return (
    <Card as="section" padding="small">
      {share.notice}
      <h2 className="mb-stack-lg text-heading-4 text-fg">
        {isEs ? "Acciones rápidas" : "Quick Actions"}
      </h2>
      <div className="grid grid-cols-1 gap-inline-md sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
        {actions.map((action) => (
          <Button
            key={action.fullLabel}
            variant="neutral"
            appearance="fill-stroke"
            fullWidth
            disabled={action.disabled}
            onClick={action.onClick}
            aria-label={action.fullLabel}
          >
            <action.icon className="h-4 w-4 shrink-0" />
            {action.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}

/** The check-in behind a notice. Reading it marks the notice seen. */
export function NoticeModal({
  notice,
  onClose,
}: {
  notice: CheckInNotice;
  onClose: () => void;
}) {
  const isEs = useIsEs();
  const yesNo = (value: boolean) => (value ? (isEs ? "Sí" : "Yes") : "No");
  const checkIn = useNoticeCheckIn(notice.id);
  const { mutate } = useMarkNoticeSeen();
  const loaded = checkIn.data !== undefined;
  useEffect(() => {
    if (loaded && !notice.seen) mutate(notice.id);
  }, [loaded, notice.id, notice.seen, mutate]);
  const c = checkIn.data;
  const facts: Array<[string, string | null]> = c
    ? [
        [isEs ? "Día del registro" : "Check-in day", usDate(c.checkInDate)],
        [isEs ? "Cómo se siente" : "Feeling", c.feeling],
        [isEs ? "Día de tratamiento" : "Treatment day", yesNo(c.treatmentDay)],
        [
          isEs ? "Tratamiento omitido" : "Missed treatment",
          yesNo(c.missedTreatment),
        ],
        [isEs ? "Gravedad" : "Severity", c.severity],
        [
          isEs ? "Síntomas" : "Symptoms",
          c.symptoms.length ? c.symptoms.join(", ") : null,
        ],
        [
          isEs ? "Energía (1–5)" : "Energy (1–5)",
          c.energyLevel === null ? null : String(c.energyLevel),
        ],
        [isEs ? "Apetito" : "Appetite", c.appetite],
        [isEs ? "Recuperación" : "Recovery", c.recoveryWindow],
        [isEs ? "Presión arterial" : "Blood pressure", c.bloodPressure],
        [isEs ? "Peso" : "Weight", c.weight],
        [isEs ? "Diuresis (ml)" : "Urine output (ml)", c.urineOutputMl],
      ]
    : [];
  return (
    <Modal
      open
      onClose={onClose}
      title={nameOf(notice)}
      description={`${notice.reasons.map((reason) => noticeReasonText(reason, isEs)).join(" · ")} · ${usDate(notice.deliverOn)}`}
      size="small"
    >
      <AsyncSection
        pending={checkIn.isPending}
        error={checkIn.error}
        errorTitle={errorTitleFor(
          checkIn.error,
          isEs
            ? "No se pudo cargar el registro"
            : "The check-in could not be loaded",
          lang(isEs),
        )}
        errorMessage={errorMessageFor(checkIn.error, undefined, lang(isEs))}
        onRetry={canRetry(checkIn.error) ? checkIn.refetch : undefined}
        skeleton={<Skeleton height={160} />}
      >
        <dl className="grid grid-cols-2 gap-x-inline-lg gap-y-stack-xs text-body-sm">
          {facts
            .filter(([, value]) => value !== null && value !== "")
            .map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-caption text-fg-muted">{label}</dt>
                <dd className="text-fg">{value}</dd>
              </div>
            ))}
        </dl>
        {c?.notes ? (
          <p className="mt-stack-md text-body-md text-fg-secondary">
            {c.notes}
          </p>
        ) : null}
      </AsyncSection>
    </Modal>
  );
}

function RecentNotices({
  page,
  onPage,
}: {
  page: number;
  onPage: (next: number) => void;
}) {
  const notices = useCheckInNotices({ page, limit: NOTICES_PAGE });
  const rows = notices.data?.items ?? [];
  const pagination = notices.data?.pagination;
  const lastPage =
    pagination && pagination.mode === "offset" ? pagination.totalPages : 1;
  const [open, setOpen] = useState<CheckInNotice | null>(null);
  const isEs = useIsEs();

  return (
    <Card as="section" padding="small">
      <h2 className="text-heading-4 text-fg">
        {isEs ? "Avisos de registros" : "Check-In Notices"}
      </h2>
      <p className="mt-stack-xs mb-stack-lg text-body-sm text-fg-muted">
        {isEs
          ? "Registros que sus miembros pidieron enviar a su consultorio, del más reciente al más antiguo."
          : "Check-ins your members asked to reach your office, newest first."}
      </p>

      <AsyncSection
        pending={notices.isPending}
        error={notices.error}
        errorTitle={errorTitleFor(
          notices.error,
          isEs
            ? "No se pudieron cargar los avisos de registros"
            : "Check-in notices could not be loaded",
          lang(isEs),
        )}
        errorMessage={errorMessageFor(notices.error, undefined, lang(isEs))}
        onRetry={canRetry(notices.error) ? notices.refetch : undefined}
        skeleton={<Skeleton height={240} />}
      >
        <div className="overflow-hidden rounded-control border border-line">
          <Table minWidth={760}>
            <TableHead className="bg-surface-sunken">
              <TableRow>
                <TableHeaderCell>{isEs ? "Miembro" : "Member"}</TableHeaderCell>
                <TableHeaderCell>MRN</TableHeaderCell>
                <TableHeaderCell>
                  {isEs ? "Llegó al consultorio" : "Reached the Office"}
                </TableHeaderCell>
                <TableHeaderCell>
                  {isEs ? "Motivos" : "Reasons"}
                </TableHeaderCell>
                <TableHeaderCell className="text-right">
                  {isEs ? "Acción" : "Action"}
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableEmptyRow colSpan={5}>
                  {isEs
                    ? "Aún no hay avisos de registros."
                    : "No check-in notices yet."}
                </TableEmptyRow>
              ) : (
                rows.map((row) => {
                  const full = nameOf(row);
                  const name = truncateWords(full, NAME_WORDS);
                  return (
                    <TableRow key={row.id}>
                      <TableCell
                        emphasis
                        className="whitespace-nowrap"
                        title={name.truncated ? full : undefined}
                      >
                        {name.text}
                        {row.seen ? null : (
                          <Badge tone="info" className="ml-inline-sm">
                            {isEs ? "Nuevo" : "New"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        {row.mrn ?? "—"}
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
                      <TableCell className="text-right">
                        <Button
                          variant="neutral"
                          appearance="fill-stroke"
                          size="small"
                          iconOnly
                          className={tableIconButton}
                          aria-label={isEs ? `Ver — ${full}` : `View — ${full}`}
                          title={isEs ? "Ver registro" : "View check-in"}
                          onClick={() => setOpen(row)}
                        >
                          <Eye aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        {lastPage > 1 ? (
          <div className="mt-stack-md flex items-center justify-end gap-inline-md">
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
              {isEs
                ? `Página ${page} de ${lastPage}`
                : `Page ${page} of ${lastPage}`}
            </span>
            <Button
              size="small"
              variant="neutral"
              appearance="fill-stroke"
              disabled={page >= lastPage}
              onClick={() => onPage(page + 1)}
            >
              {isEs ? "Siguiente" : "Next"}
            </Button>
          </div>
        ) : null}
      </AsyncSection>
      {open ? (
        <NoticeModal notice={open} onClose={() => setOpen(null)} />
      ) : null}
    </Card>
  );
}

/** A panel whose data has no server source yet: it says so (never demo). */
function NotAvailablePanel({
  title,
  description,
  reason,
  id,
}: {
  title: string;
  description: string;
  reason: string;
  id?: string;
}) {
  const isEs = useIsEs();
  return (
    <Card as="section" padding="small" id={id} className="scroll-mt-24">
      <h2 className="text-heading-4 text-fg">{title}</h2>
      <p className="mt-stack-xs mb-stack-lg text-body-sm text-fg-muted">
        {description}
      </p>
      <EmptyState
        variant="bare"
        title={isEs ? NOT_AVAILABLE_ES : NOT_AVAILABLE}
        description={reason}
      />
    </Card>
  );
}

function MemberFeedback() {
  const isEs = useIsEs();
  return (
    <Card as="section" padding="small">
      <h2 className="mb-stack-lg text-heading-4 text-fg">
        {isEs ? "Comentarios de los miembros" : "Member Feedback"}
      </h2>
      <figure className="rounded-control bg-surface-sunken p-inset-md">
        <Quote
          aria-hidden="true"
          className="mb-stack-sm h-6 w-6 text-fg-subtle"
        />
        <p className="text-body-md text-fg-secondary">
          {isEs
            ? "NephroReach aún no recopila comentarios de los miembros."
            : "Member feedback is not collected in NephroReach yet."}
        </p>
      </figure>
    </Card>
  );
}

export default function ClinicCheckIns() {
  const isEs = useIsEs();
  const notAvailable = isEs ? NOT_AVAILABLE_ES : NOT_AVAILABLE;
  const couldNotLoad = isEs ? "No se pudo cargar" : "Could not be loaded";
  const now = useNow();
  const today = dayKey(now);
  const [noticesPage, setNoticesPage] = useState(1);
  const summary = useCheckInSummary(weekWindow(today));
  const totals = officeCheckInTotals(summary.data);
  const unseen = useCheckInNotices({ seen: false, page: 1, limit: 1 });
  const unseenTotal =
    unseen.data?.pagination?.mode === "offset"
      ? unseen.data.pagination.total
      : null;
  const shown = useCheckInNotices({ page: noticesPage, limit: NOTICES_PAGE });
  /* "Send Reminder": a message from this office to a patient on its
     roster, through the office messaging API (the thread the office
     already has with that patient, or a new one). */
  const [reminding, setReminding] = useState(false);
  const { orgId } = useOfficeOrg();
  const messaging = useOfficeMessaging(orgId);
  const recipients = useOfficeRecipients(reminding ? orgId : null);
  const shownValue = (
    value: number | null,
    read: { isPending: boolean; error: unknown },
  ) => (read.error || read.isPending || value === null ? "—" : String(value));

  return (
    <div className="space-y-4">
      <PageTitle href="/dashboard/clinic/checkins" />

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2">
        <OverviewCard
          label={isEs ? "Registros esta semana" : "Check-Ins This Week"}
          value={shownValue(totals?.checkIns ?? null, summary)}
          note={
            summary.error
              ? couldNotLoad
              : isEs
                ? "Pacientes que comparten registros"
                : "Patients sharing check-ins"
          }
          icon={<ClipboardCheckSolid />}
          tone="brand"
        />
        <OverviewCard
          label={isEs ? "Tasa de finalización" : "Completion Rate"}
          value={totals && !summary.error ? `${totals.percent}%` : "—"}
          note={
            totals
              ? isEs
                ? `${totals.checkIns} de ${totals.expected} días`
                : `${totals.checkIns} of ${totals.expected} days`
              : undefined
          }
          icon={<CheckCircleSolid />}
          tone="success"
        />
        <OverviewCard
          label={isEs ? "Registros omitidos" : "Missed Check-Ins"}
          value="—"
          note={notAvailable}
          icon={<XCircleSolid />}
          tone="warning"
        />
        <OverviewCard
          label={isEs ? "Miembros en riesgo" : "At Risk Members"}
          value="—"
          note={notAvailable}
          icon={<AlertTriangleSolid />}
          tone="danger"
        />
        <OverviewCard
          label={isEs ? "Avisos de registros nuevos" : "New Check-In Notices"}
          value={shownValue(unseenTotal, unseen)}
          note={
            unseen.error
              ? couldNotLoad
              : isEs
                ? "Aún sin abrir"
                : "Not yet opened"
          }
          icon={<UsersSolid />}
          tone="accent"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
        <div className="space-y-4">
          <WeeklySummary today={today} />
          <RecentNotices page={noticesPage} onPage={setNoticesPage} />
          <MemberFeedback />
        </div>

        <div className="space-y-4">
          <QuickActions
            rows={shown.data?.items ?? []}
            onRemind={() => setReminding(true)}
          />
          <NotAvailablePanel
            title={
              isEs
                ? "Tendencia de finalización de registros"
                : "Check-In Completion Trend"
            }
            description={
              isEs
                ? "Tasa de finalización semanal de las últimas 8 semanas."
                : "Weekly completion rate over the last 8 weeks."
            }
            reason={
              isEs
                ? "El servidor aún no proporciona una tendencia semanal."
                : "A weekly trend is not provided by the server yet."
            }
          />
          <NotAvailablePanel
            id="follow-ups"
            title={
              isEs
                ? "Miembros que necesitan seguimiento"
                : "Members Needing Follow-Up"
            }
            description={
              isEs
                ? "Miembros que omitieron un registro o informaron síntomas preocupantes."
                : "Members who missed a check-in or reported concerning symptoms."
            }
            reason={
              isEs
                ? "Las reglas de seguimiento están pendientes de una decisión. Abra los avisos de registros para ver qué seguimiento le pidieron los miembros."
                : "Follow-up rules are waiting on a decision. Open the check-in notices to see what members asked you to follow up."
            }
          />
        </div>
      </section>
      {reminding ? (
        <NewMessageModal
          title={
            isEs
              ? "Enviar un recordatorio de registro"
              : "Send a Check-In Reminder"
          }
          recipientLabel={isEs ? "Paciente" : "Patient"}
          recipients={recipients.patients.map((patient) => ({
            value: patient.patientId,
            label: patient.mrn
              ? `${patient.name} · MRN ${patient.mrn}`
              : patient.name,
          }))}
          recipientsPending={recipients.isPending}
          recipientsError={
            recipients.error
              ? saveErrorText(recipients.error, lang(isEs))
              : recipients.isPending || recipients.patients.length > 0
                ? undefined
                : isEs
                  ? "Aún no hay pacientes en la lista de este consultorio."
                  : "No patients are on this office's roster yet."
          }
          initialBody={
            isEs
              ? "Hola, le escribe su equipo de atención. No hemos visto su registro de esta semana. Tómese un minuto para completarlo en NephroReach, o responda aquí si algo no está bien."
              : "Hi, this is your care team. We haven't seen your check-in this week. Please take a minute to complete it in NephroReach, or reply here if anything is wrong."
          }
          sending={messaging.start.isPending}
          sendError={
            messaging.start.error
              ? saveErrorText(messaging.start.error, lang(isEs))
              : undefined
          }
          onSend={(patientId, body) =>
            messaging.start.mutateAsync({ patientId, body })
          }
          onClose={() => {
            messaging.start.reset();
            setReminding(false);
          }}
        />
      ) : null}
    </div>
  );
}
