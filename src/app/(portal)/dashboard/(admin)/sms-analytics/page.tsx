"use client";

import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  FileText,
  MessageCircle,
  Plus,
} from "lucide-react";
import {
  Alert,
  AsyncSection,
  Button,
  buttonStyles,
  Chip,
  ChipGroup,
  EmptyState,
  FormField,
  Input,
  Modal,
  Select,
  Skeleton,
  TablePagination,
} from "@/components/ui";
import { canRetry, isNotShared } from "@/lib/data/asyncState";
import { useLanguage } from "@/context/LanguageContext";
import { useCanLevel } from "@/features/staff/useStaffAccounts";
import {
  ActionError,
  actionErrorText,
  readErrorCopy,
} from "@/features/billing/consoleUi";
import {
  CAMPAIGN_KINDS,
  CHANNEL_LABEL,
  CHANNEL_LABEL_ES,
  KIND_LABEL,
  KIND_LABEL_ES,
  MESSAGE_MAX,
  QUESTION_LABEL,
  QUESTION_LABEL_ES,
  TITLE_MAX,
  WEEKDAYS,
  WEEKDAY_LABEL,
  WEEKDAY_LABEL_ES,
  draftError,
  fromApiTiming,
  hourLabel,
  rateLabel,
  timingLabel,
  type ApiCampaign,
  type CampaignAnalytics,
  type CampaignChannel,
  type CampaignDraft,
  type CampaignKind,
  type CampaignQuestion,
  type Weekday,
} from "@/features/admin/campaigns.mappers";
import {
  useCampaignAnalytics,
  useCampaigns,
} from "@/features/admin/useCampaigns";
import {
  channelCount,
  useNotificationAnalytics,
} from "@/features/admin/usePlatformOverview";

/* ==========================================================================
   Notification configuration and analytics (Phase 14.7, on the API)
   --------------------------------------------------------------------------
   Templates are the platform's notification campaigns (`/platform/campaigns`,
   campaigns READ; create, edit, activate and deactivate need WRITE). The
   static sample templates and the made-up totals are gone.
   - Types are the backend's two: Check-in and Reminder (Q-EDU-4).
   - A template repeats weekly or daily at an hour in Eastern Time (the
     server's rule for every member), or goes out once at a chosen time.
   - Channels: in-app, email and push. SMS is shown but not offered until
     the SMS provider is approved and listed for disclosure (D18; recorded
     for the Lead): this page never starts a real text message.
   - The totals: "Messages Sent" counts the last 30 days of deliveries on
     every channel (the server's analytics window); the reply rate is the
     average of the active templates on this page, each one the server's
     responseRate; "Active Automations" is the server's count.
   ========================================================================== */

/* SMS needs the provider approved and disclosed first (D18). */
const SMS_NOT_AVAILABLE =
  "SMS: not available yet. The text-message provider must be approved and listed for disclosure first.";
const SMS_NOT_AVAILABLE_ES =
  "SMS: todavía no disponible. Primero se debe aprobar y declarar el proveedor de mensajes de texto.";

const OFFERED_CHANNELS: CampaignChannel[] = ["in_app", "email", "push"];

function TemplateBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={`inline-flex h-[30px] items-center rounded-control border px-[9px] text-body-sm font-medium ${className}`}
    >
      {children}
    </span>
  );
}

const TYPE_CLASS: Record<CampaignKind, string> = {
  "check-in": "border-field bg-surface text-fg-brand",
  reminder: "border-field bg-surface text-warning",
};
const ACTIVE_CLASS = "border-success-600 bg-success-600 text-white";
const INACTIVE_CLASS = "border-line bg-line text-fg-muted";

function SmsTemplateCard({
  template,
  analytics,
  canWrite,
  statusPending,
  onEdit,
  onToggle,
}: {
  template: ApiCampaign;
  analytics?: { data?: CampaignAnalytics; error: unknown; isPending: boolean };
  canWrite: boolean;
  statusPending: boolean;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const kindLabel = isEs ? KIND_LABEL_ES : KIND_LABEL;
  const channelLabel = isEs ? CHANNEL_LABEL_ES : CHANNEL_LABEL;
  const questionLabel = isEs ? QUESTION_LABEL_ES : QUESTION_LABEL;
  const active = template.status === "active";
  const reply = analytics?.data
    ? analytics.data.inAppDelivered > 0
      ? rateLabel(analytics.data.responseRate)
      : isEs
        ? "aún sin entregas"
        : "no deliveries yet"
    : analytics?.error
      ? isEs
        ? "no se cargó"
        : "not loaded"
      : "…";

  return (
    <article className="rounded-card-nested border border-black/10 bg-surface px-[17px] py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-heading-4 text-fg">{template.title}</h2>
            <TemplateBadge className={TYPE_CLASS[template.kind]}>
              {kindLabel[template.kind] ?? template.kind}
            </TemplateBadge>
            <TemplateBadge className={active ? ACTIVE_CLASS : INACTIVE_CLASS}>
              {active
                ? isEs
                  ? "Activa"
                  : "Active"
                : isEs
                  ? "Inactiva"
                  : "Inactive"}
            </TemplateBadge>
          </div>

          <p className="text-body-md leading-6 font-medium break-words text-fg-muted">
            {template.message}
          </p>

          <p className="flex items-center gap-2 text-body-md leading-6 font-medium text-fg-muted">
            <Clock3 className="h-5 w-5 shrink-0" />
            <span>
              {isEs ? "Horario" : "Schedule"}:{" "}
              {timingLabel(fromApiTiming(template), isEs)}
            </span>
          </p>
          <p className="text-body-sm text-fg-muted">
            {isEs ? "Canales" : "Channels"}:{" "}
            {template.channels.map((c) => channelLabel[c] ?? c).join(", ")}
            {template.question
              ? ` · ${isEs ? "Pregunta" : "Question"}: ${questionLabel[template.question]}`
              : ""}
            {" · "}
            {isEs ? "Tasa de respuesta" : "Reply rate"}: {reply}
          </p>
        </div>

        {canWrite ? (
          <div className="flex w-full flex-col gap-inline-sm md:w-auto">
            <button
              type="button"
              onClick={onEdit}
              aria-label={
                isEs ? `Editar ${template.title}` : `Edit ${template.title}`
              }
              className={
                buttonStyles({
                  variant: "neutral",
                  appearance: "fill-stroke",
                }) + " w-full md:w-auto"
              }
            >
              <Edit3 className="h-5 w-5" />
              {isEs ? "Editar" : "Edit"}
            </button>
            <Button
              variant="neutral"
              appearance="stroke"
              loading={statusPending}
              onClick={onToggle}
              aria-label={
                isEs
                  ? `${active ? "Desactivar" : "Activar"} ${template.title}`
                  : `${active ? "Deactivate" : "Activate"} ${template.title}`
              }
            >
              {isEs
                ? active
                  ? "Desactivar"
                  : "Activar"
                : active
                  ? "Deactivate"
                  : "Activate"}
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTH_NAMES_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Weeks of a month, padded with nulls so the first falls on its weekday. */
function monthGrid(year: number, month: number): Array<number | null> {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = Array(first).fill(null);
  for (let d = 1; d <= days; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/* This picker was drawn but not wired: the month never changed, the day
   cells did nothing, and AM/PM was two buttons with no state between them.
   It runs on a real date now — nothing here needs a backend. */
function CalendarPicker({
  value,
  onChange,
}: {
  value: Date;
  onChange: (next: Date) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const [view, setView] = useState(
    () => new Date(value.getFullYear(), value.getMonth(), 1),
  );

  const cells = monthGrid(view.getFullYear(), view.getMonth());
  const isSelected = (day: number) =>
    value.getFullYear() === view.getFullYear() &&
    value.getMonth() === view.getMonth() &&
    value.getDate() === day;

  const shiftMonth = (delta: number) =>
    setView(new Date(view.getFullYear(), view.getMonth() + delta, 1));

  const setHours = (hours: number) => {
    const next = new Date(value);
    next.setHours(hours);
    onChange(next);
  };

  const hours = value.getHours();
  const isAm = hours < 12;
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinute = String(value.getMinutes()).padStart(2, "0");

  return (
    <div className="absolute top-[calc(100%+8px)] right-0 z-20 w-[342px] max-w-[calc(100vw-48px)] rounded-card border border-line bg-surface-raised p-inset-md">
      <div className="mb-stack-lg flex h-9 items-center justify-between">
        <p className="text-heading-4 text-fg" aria-live="polite">
          {(isEs ? MONTH_NAMES_ES : MONTH_NAMES)[view.getMonth()]}{" "}
          {view.getFullYear()}
        </p>
        <div className="flex items-center gap-inset-md text-fg">
          <button
            type="button"
            aria-label={isEs ? "Mes anterior" : "Previous month"}
            onClick={() => shiftMonth(-1)}
            className="cursor-pointer rounded-control-small focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label={isEs ? "Mes siguiente" : "Next month"}
            onClick={() => shiftMonth(1)}
            className="cursor-pointer rounded-control-small focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-3 text-center">
        {(isEs
          ? ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"]
          : ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
        ).map((day) => (
          <span key={day} className="text-label-md text-fg-muted">
            {day}
          </span>
        ))}
        {cells.map((day, index) => (
          <button
            key={index}
            type="button"
            disabled={day === null}
            aria-pressed={day !== null && isSelected(day)}
            onClick={() =>
              day !== null &&
              onChange(
                new Date(
                  view.getFullYear(),
                  view.getMonth(),
                  day,
                  value.getHours(),
                  value.getMinutes(),
                ),
              )
            }
            className={`mx-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-pill text-body-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              day !== null && isSelected(day)
                ? "bg-primary-solid text-primary-on-solid"
                : day !== null
                  ? "text-fg hover:bg-primary-soft"
                  : "cursor-default text-transparent"
            }`}
          >
            {day ?? ""}
          </button>
        ))}
      </div>

      <div className="mt-stack-lg flex items-center justify-between">
        <span className="text-heading-4 text-fg">{isEs ? "Hora" : "Time"}</span>
        <div className="flex items-center gap-inline-md">
          <span className="rounded-control-small bg-surface-sunken px-inset-sm py-1 text-heading-4 text-fg">
            {String(displayHour).padStart(2, "0")} : {displayMinute}
          </span>
          <div
            role="group"
            aria-label={
              isEs ? "Antes o después del mediodía" : "Before or after noon"
            }
            className="flex h-9 rounded-control bg-surface-sunken p-0.5 text-label-md text-fg"
          >
            <button
              type="button"
              aria-pressed={isAm}
              onClick={() => setHours(hours % 12)}
              className={`cursor-pointer rounded-control-small px-inset-sm ${
                isAm ? "border border-line bg-surface shadow-card" : ""
              }`}
            >
              AM
            </button>
            <button
              type="button"
              aria-pressed={!isAm}
              onClick={() => setHours((hours % 12) + 12)}
              className={`cursor-pointer rounded-control-small px-inset-sm ${
                isAm ? "" : "border border-line bg-surface shadow-card"
              }`}
            >
              PM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="block text-body-md text-fg">{children}</span>;
}

type Repeat = "weekly" | "daily" | "once";

/** Tomorrow at 9:00 on this computer: a send time that is ahead. */
function defaultSendAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

function TemplateModal({
  template,
  saving,
  error,
  onSave,
  onClose,
}: {
  template: ApiCampaign | null;
  saving: boolean;
  error: unknown;
  onSave: (draft: CampaignDraft) => void;
  onClose: () => void;
}) {
  const isEdit = template !== null;
  const initial = template ? fromApiTiming(template) : null;
  const [title, setTitle] = useState(template?.title ?? "");
  const [kind, setKind] = useState<CampaignKind>(template?.kind ?? "check-in");
  const [message, setMessage] = useState(template?.message ?? "");
  const [question, setQuestion] = useState<CampaignQuestion | "">(
    template?.question ?? "",
  );
  const [channels, setChannels] = useState<CampaignChannel[]>(
    template?.channels ?? ["in_app"],
  );
  const [repeat, setRepeat] = useState<Repeat>(
    initial && initial.mode !== "none" ? initial.mode : "weekly",
  );
  const [weekday, setWeekday] = useState<Weekday>(
    initial?.mode === "weekly" ? initial.weekday : "MO",
  );
  const [hour, setHour] = useState<number>(
    initial?.mode === "weekly" || initial?.mode === "daily" ? initial.hour : 9,
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date>(() =>
    initial?.mode === "once" ? new Date(initial.sendAt) : defaultSendAt(),
  );
  const [problem, setProblem] = useState<string | null>(null);
  const { language } = useLanguage();
  const isEs = language === "ES";
  const kindLabel = isEs ? KIND_LABEL_ES : KIND_LABEL;
  const channelLabel = isEs ? CHANNEL_LABEL_ES : CHANNEL_LABEL;
  const questionLabel = isEs ? QUESTION_LABEL_ES : QUESTION_LABEL;
  const weekdayLabel = isEs ? WEEKDAY_LABEL_ES : WEEKDAY_LABEL;

  const scheduleLabel = scheduledAt.toLocaleString(isEs ? "es-US" : undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const draft = (): CampaignDraft => ({
    title,
    kind,
    message,
    question: question || null,
    channels,
    timing:
      repeat === "weekly"
        ? { mode: "weekly", weekday, hour }
        : repeat === "daily"
          ? { mode: "daily", hour }
          : { mode: "once", sendAt: scheduledAt.toISOString() },
  });

  const toggleChannel = (channel: CampaignChannel) =>
    setChannels((current) =>
      current.includes(channel)
        ? current.filter((c) => c !== channel)
        : [...current, channel],
    );

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={
        isEs
          ? isEdit
            ? "Editar plantilla de mensaje"
            : "Crear plantilla de mensaje"
          : isEdit
            ? "Edit Message Template"
            : "Create Message Template"
      }
      description={
        isEs
          ? isEdit
            ? "Actualice la automatización de esta plantilla de notificación"
            : "Agregue una nueva plantilla de notificación para automatizar"
          : isEdit
            ? "Update this notification template automation"
            : "Add a new notification template for automation"
      }
      footer={
        <>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={onClose}
            disabled={saving}
          >
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button type="submit" form="sms-template-form" loading={saving}>
            {isEs
              ? isEdit
                ? "Guardar cambios"
                : "Crear plantilla"
              : isEdit
                ? "Save Changes"
                : "Create Template"}
          </Button>
        </>
      }
    >
      <form
        id="sms-template-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const next = draft();
          const reason = draftError(next, new Date(), isEs);
          setProblem(reason);
          if (!reason) onSave(next);
        }}
      >
        <div className="space-y-stack-lg">
          {problem ? (
            <Alert
              tone="warning"
              title={isEs ? "Revise la plantilla" : "Check the template"}
            >
              {problem}
            </Alert>
          ) : null}
          {error ? (
            <Alert
              tone="danger"
              title={
                isEs
                  ? "La plantilla no se guardó"
                  : "The template was not saved"
              }
            >
              {actionErrorText(error, isEs)}
            </Alert>
          ) : null}

          <FormField label={isEs ? "Nombre de la plantilla" : "Template Name"}>
            {(props) => (
              <Input
                {...props}
                value={title}
                maxLength={TITLE_MAX}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  isEs
                    ? "p. ej., Control semanal de bienestar"
                    : "e.g. Weekly Wellness Check"
                }
              />
            )}
          </FormField>

          <FormField label={isEs ? "Tipo de mensaje" : "Message Type"}>
            {(props) => (
              <Select
                {...props}
                value={kind}
                onChange={(e) => setKind(e.target.value as CampaignKind)}
              >
                {CAMPAIGN_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {kindLabel[k]}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <FormField label={isEs ? "Se repite" : "Repeats"}>
            {(props) => (
              <Select
                {...props}
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as Repeat)}
              >
                <option value="weekly">
                  {isEs ? "Cada semana" : "Every week"}
                </option>
                <option value="daily">
                  {isEs ? "Todos los días" : "Every day"}
                </option>
                <option value="once">
                  {isEs ? "Una vez, a una hora fija" : "Once, at a set time"}
                </option>
              </Select>
            )}
          </FormField>

          {repeat === "once" ? (
            <div className="relative space-y-stack-sm">
              <FieldLabel>{isEs ? "Horario" : "Schedule"}</FieldLabel>
              <button
                type="button"
                onClick={() => setShowCalendar((current) => !current)}
                aria-expanded={showCalendar}
                className="flex h-control-big w-full cursor-pointer items-center justify-between rounded-control border border-field bg-surface px-inset-md text-left text-body-md text-fg-muted transition-colors duration-150 ease-standard hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {scheduleLabel}
                <CalendarDays
                  aria-hidden="true"
                  className="h-5 w-5 text-fg-muted"
                />
              </button>
              {showCalendar && (
                <CalendarPicker value={scheduledAt} onChange={setScheduledAt} />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-inline-lg sm:grid-cols-2">
              {repeat === "weekly" ? (
                <FormField label={isEs ? "Día" : "Day"}>
                  {(props) => (
                    <Select
                      {...props}
                      value={weekday}
                      onChange={(e) => setWeekday(e.target.value as Weekday)}
                    >
                      {WEEKDAYS.map((d) => (
                        <option key={d} value={d}>
                          {weekdayLabel[d]}
                        </option>
                      ))}
                    </Select>
                  )}
                </FormField>
              ) : null}
              <FormField
                label={isEs ? "Hora (hora del Este)" : "Time (Eastern Time)"}
                hint={
                  isEs
                    ? "Todos los miembros lo reciben a esta hora, hora del Este."
                    : "Every member gets it at this hour, Eastern Time."
                }
              >
                {(props) => (
                  <Select
                    {...props}
                    value={String(hour)}
                    onChange={(e) => setHour(Number(e.target.value))}
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>
                        {hourLabel(h)}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>
            </div>
          )}

          <div className="space-y-stack-sm">
            <FieldLabel>{isEs ? "Canales" : "Channels"}</FieldLabel>
            <ChipGroup
              label={isEs ? "Canales" : "Channels"}
              selection="multiple"
            >
              {OFFERED_CHANNELS.map((channel) => (
                <Chip
                  key={channel}
                  selected={channels.includes(channel)}
                  onClick={() => toggleChannel(channel)}
                >
                  {channelLabel[channel]}
                </Chip>
              ))}
              <Chip
                selected={channels.includes("sms")}
                disabled={!channels.includes("sms")}
                onClick={() => toggleChannel("sms")}
                aria-describedby="sms-not-available"
              >
                {channelLabel.sms}
              </Chip>
            </ChipGroup>
            <p id="sms-not-available" className="text-caption text-fg-muted">
              {isEs ? SMS_NOT_AVAILABLE_ES : SMS_NOT_AVAILABLE}
            </p>
          </div>

          <FormField
            label={isEs ? "Pregunta (opcional)" : "Question (optional)"}
            hint={
              isEs
                ? "Los miembros responden en la aplicación, así que una pregunta necesita el canal en la aplicación."
                : "Members answer in the app, so a question needs the in-app channel."
            }
          >
            {(props) => (
              <Select
                {...props}
                value={question}
                onChange={(e) =>
                  setQuestion(e.target.value as CampaignQuestion | "")
                }
              >
                <option value="">
                  {isEs ? "Sin pregunta" : "No question"}
                </option>
                <option value="wellbeing">{questionLabel.wellbeing}</option>
                <option value="er-visit">{questionLabel["er-visit"]}</option>
              </Select>
            )}
          </FormField>

          <div className="space-y-stack-sm">
            <label
              htmlFor="sms-message-content"
              className="block text-body-md text-fg"
            >
              {isEs ? "Contenido del mensaje" : "Message Content"}
            </label>
            <div className="flex min-h-[100px] flex-col justify-between rounded-control border border-field bg-surface px-inset-md py-inset-sm transition-colors duration-150 ease-standard focus-within:border-primary-edge focus-within:ring-2 focus-within:ring-ring">
              <textarea
                id="sms-message-content"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  isEs ? "Escriba su mensaje..." : "Enter your message..."
                }
                maxLength={MESSAGE_MAX}
                aria-describedby="sms-message-count sms-message-rule"
                className="min-h-12 w-full resize-none bg-transparent text-body-sm text-fg outline-none placeholder:text-fg-muted"
              />
              <p
                id="sms-message-count"
                className="flex items-center justify-end gap-inline-xs text-caption text-fg-muted"
              >
                <FileText aria-hidden="true" className="h-4 w-4" />
                {message.length}/{MESSAGE_MAX}
              </p>
            </div>
            <p id="sms-message-rule" className="text-caption text-fg-muted">
              {isEs
                ? "El mismo texto llega a todos los miembros por correo electrónico y push: nunca incluya información de salud ni nombres."
                : "The same text goes to every member by email and push: never put health information or names in it."}
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function StatTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <article className="rounded-card border border-line bg-surface p-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-card-nested bg-brand-100 text-fg-brand">
        <MessageCircle className="h-5 w-5" />
      </div>
      <p className="text-body-sm font-semibold text-fg-muted">{label}</p>
      <div className="mt-2 text-heading-2 leading-8 font-semibold text-fg">
        {value}
      </div>
    </article>
  );
}

function tileValue(
  pending: boolean,
  error: unknown,
  value: () => React.ReactNode,
  isEs = false,
) {
  if (error)
    return (
      <span className="text-body-sm text-fg-muted">
        {isNotShared(error)
          ? isEs
            ? "Sin acceso"
            : "No access"
          : isEs
            ? "No se cargó"
            : "Not loaded"}
      </span>
    );
  if (pending) return <Skeleton height={28} width={72} />;
  return value();
}

export default function SmsAnalyticsPage() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const [page, setPage] = useState(1);
  const campaigns = useCampaigns(page);
  const analytics = useNotificationAnalytics();
  const canWrite = useCanLevel("campaigns", 2);
  const [editing, setEditing] = useState<ApiCampaign | "new" | null>(null);
  const ids = useMemo(
    () => campaigns.campaigns.map((c) => c.id),
    [campaigns.campaigns],
  );
  const perCampaign = useCampaignAnalytics(ids);
  const copy = readErrorCopy(
    campaigns.error,
    isEs ? "Las plantillas no se cargaron" : "The templates did not load",
    isEs,
  );

  /* The reply rate: the average of the active templates on this page that
     have had in-app deliveries (each the server's responseRate). */
  const replyRates = campaigns.campaigns
    .filter((c) => c.status === "active")
    .map((c) => perCampaign.get(c.id)?.data)
    .filter((a): a is CampaignAnalytics => Boolean(a && a.inAppDelivered > 0))
    .map((a) => a.responseRate);
  const averageReply =
    replyRates.length > 0
      ? replyRates.reduce((sum, r) => sum + r, 0) / replyRates.length
      : null;

  return (
    <>
      <section className="rounded-card border border-line bg-surface px-3 py-4">
        <div className="mb-[14px] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-heading-3 leading-8 font-medium text-fg">
              {isEs
                ? "Configuración de notificaciones"
                : "Notification Configuration"}
            </h1>
            <p className="mt-2 text-body-md leading-6 font-medium text-fg-secondary">
              {isEs
                ? "Configure mensajes automáticos y seguimientos"
                : "Configure automated messages and check-ins"}
            </p>
          </div>
          {canWrite ? (
            <Button
              onClick={() => {
                campaigns.resetSave();
                setEditing("new");
              }}
            >
              <Plus aria-hidden="true" />
              {isEs ? "Nueva plantilla" : "New Template"}
            </Button>
          ) : null}
        </div>

        <ActionError
          error={campaigns.statusError}
          title={
            isEs ? "La plantilla no cambió" : "The template did not change"
          }
          onDismiss={campaigns.dismissStatusError}
          className="mb-stack-md"
        />

        <AsyncSection
          pending={campaigns.isPending}
          error={campaigns.error}
          onRetry={canRetry(campaigns.error) ? campaigns.refetch : undefined}
          {...copy}
          isEmpty={campaigns.campaigns.length === 0}
          empty={
            <EmptyState
              title={
                isEs
                  ? "Aún no hay plantillas de mensaje"
                  : "No message templates yet"
              }
              description={
                isEs
                  ? "Cree un seguimiento o un recordatorio; solo se envía cuando se activa."
                  : "Create a check-in or a reminder; it goes out only once it is activated."
              }
            />
          }
          skeleton={
            <div className="space-y-3 rounded-control border border-line p-3">
              <Skeleton height={140} />
              <Skeleton height={140} />
            </div>
          }
        >
          <div className="space-y-3 rounded-control border border-line p-3">
            {campaigns.campaigns.map((template) => (
              <SmsTemplateCard
                key={template.id}
                template={template}
                analytics={perCampaign.get(template.id)}
                canWrite={canWrite}
                statusPending={campaigns.statusPendingId === template.id}
                onEdit={() => {
                  campaigns.resetSave();
                  setEditing(template);
                }}
                onToggle={() =>
                  campaigns.setStatus(
                    template.id,
                    template.status === "active" ? "deactivate" : "activate",
                  )
                }
              />
            ))}
          </div>
          <TablePagination
            page={page}
            pageCount={campaigns.pageCount}
            onPageChange={setPage}
          />
        </AsyncSection>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatTile
          label={
            isEs
              ? "Mensajes enviados (últimos 30 días)"
              : "Messages Sent (last 30 days)"
          }
          value={tileValue(
            analytics.isPending,
            analytics.error,
            () => (
              <>
                {analytics.data!.total.toLocaleString(
                  isEs ? "es-US" : undefined,
                )}
                <span className="block text-caption font-normal text-fg-muted">
                  SMS:{" "}
                  {channelCount(analytics.data!, "SMS").toLocaleString(
                    isEs ? "es-US" : undefined,
                  )}
                </span>
              </>
            ),
            isEs,
          )}
        />
        <StatTile
          label={
            isEs
              ? "Tasa de respuesta (plantillas activas en esta página)"
              : "Reply Rate (active templates on this page)"
          }
          value={tileValue(
            campaigns.isPending,
            campaigns.error,
            () => rateLabel(averageReply),
            isEs,
          )}
        />
        <StatTile
          label={isEs ? "Automatizaciones activas" : "Active Automations"}
          value={tileValue(
            campaigns.activePending,
            campaigns.activeError,
            () => String(campaigns.activeTotal ?? 0).padStart(2, "0"),
            isEs,
          )}
        />
      </section>

      {editing && (
        <TemplateModal
          template={editing === "new" ? null : editing}
          saving={campaigns.isSaving}
          error={campaigns.saveError}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            void campaigns
              .save(editing === "new" ? null : editing.id, draft)
              .then(() => setEditing(null))
              .catch(() => {});
          }}
        />
      )}
    </>
  );
}
