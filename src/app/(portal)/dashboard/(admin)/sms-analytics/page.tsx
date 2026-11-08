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
import { useCanLevel } from "@/features/staff/useStaffAccounts";
import {
  ActionError,
  actionErrorText,
  readErrorCopy,
} from "@/features/billing/consoleUi";
import {
  CAMPAIGN_KINDS,
  CHANNEL_LABEL,
  KIND_LABEL,
  MESSAGE_MAX,
  QUESTION_LABEL,
  TITLE_MAX,
  WEEKDAYS,
  WEEKDAY_LABEL,
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
  const active = template.status === "active";
  const reply = analytics?.data
    ? analytics.data.inAppDelivered > 0
      ? rateLabel(analytics.data.responseRate)
      : "no deliveries yet"
    : analytics?.error
      ? "not loaded"
      : "…";

  return (
    <article className="rounded-card-nested border border-black/10 bg-surface px-[17px] py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-heading-4 text-fg">{template.title}</h2>
            <TemplateBadge className={TYPE_CLASS[template.kind]}>
              {KIND_LABEL[template.kind] ?? template.kind}
            </TemplateBadge>
            <TemplateBadge className={active ? ACTIVE_CLASS : INACTIVE_CLASS}>
              {active ? "Active" : "Inactive"}
            </TemplateBadge>
          </div>

          <p className="text-body-md leading-6 font-medium break-words text-fg-muted">
            {template.message}
          </p>

          <p className="flex items-center gap-2 text-body-md leading-6 font-medium text-fg-muted">
            <Clock3 className="h-5 w-5 shrink-0" />
            <span>Schedule: {timingLabel(fromApiTiming(template))}</span>
          </p>
          <p className="text-body-sm text-fg-muted">
            Channels:{" "}
            {template.channels.map((c) => CHANNEL_LABEL[c] ?? c).join(", ")}
            {template.question
              ? ` · Question: ${QUESTION_LABEL[template.question]}`
              : ""}
            {" · "}Reply rate: {reply}
          </p>
        </div>

        {canWrite ? (
          <div className="flex w-full flex-col gap-inline-sm md:w-auto">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${template.title}`}
              className={
                buttonStyles({
                  variant: "neutral",
                  appearance: "fill-stroke",
                }) + " w-full md:w-auto"
              }
            >
              <Edit3 className="h-5 w-5" />
              Edit
            </button>
            <Button
              variant="neutral"
              appearance="stroke"
              loading={statusPending}
              onClick={onToggle}
              aria-label={`${active ? "Deactivate" : "Activate"} ${template.title}`}
            >
              {active ? "Deactivate" : "Activate"}
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
          {MONTH_NAMES[view.getMonth()]} {view.getFullYear()}
        </p>
        <div className="flex items-center gap-inset-md text-fg">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
            className="cursor-pointer rounded-control-small focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
            className="cursor-pointer rounded-control-small focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-3 text-center">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
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
        <span className="text-heading-4 text-fg">Time</span>
        <div className="flex items-center gap-inline-md">
          <span className="rounded-control-small bg-surface-sunken px-inset-sm py-1 text-heading-4 text-fg">
            {String(displayHour).padStart(2, "0")} : {displayMinute}
          </span>
          <div
            role="group"
            aria-label="Before or after noon"
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

  const scheduleLabel = scheduledAt.toLocaleString(undefined, {
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
      title={isEdit ? "Edit Message Template" : "Create Message Template"}
      description={
        isEdit
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
            Cancel
          </Button>
          <Button type="submit" form="sms-template-form" loading={saving}>
            {isEdit ? "Save Changes" : "Create Template"}
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
          const reason = draftError(next);
          setProblem(reason);
          if (!reason) onSave(next);
        }}
      >
        <div className="space-y-stack-lg">
          {problem ? (
            <Alert tone="warning" title="Check the template">
              {problem}
            </Alert>
          ) : null}
          {error ? (
            <Alert tone="danger" title="The template was not saved">
              {actionErrorText(error)}
            </Alert>
          ) : null}

          <FormField label="Template Name">
            {(props) => (
              <Input
                {...props}
                value={title}
                maxLength={TITLE_MAX}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekly Wellness Check"
              />
            )}
          </FormField>

          <FormField label="Message Type">
            {(props) => (
              <Select
                {...props}
                value={kind}
                onChange={(e) => setKind(e.target.value as CampaignKind)}
              >
                {CAMPAIGN_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <FormField label="Repeats">
            {(props) => (
              <Select
                {...props}
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as Repeat)}
              >
                <option value="weekly">Every week</option>
                <option value="daily">Every day</option>
                <option value="once">Once, at a set time</option>
              </Select>
            )}
          </FormField>

          {repeat === "once" ? (
            <div className="relative space-y-stack-sm">
              <FieldLabel>Schedule</FieldLabel>
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
                <FormField label="Day">
                  {(props) => (
                    <Select
                      {...props}
                      value={weekday}
                      onChange={(e) => setWeekday(e.target.value as Weekday)}
                    >
                      {WEEKDAYS.map((d) => (
                        <option key={d} value={d}>
                          {WEEKDAY_LABEL[d]}
                        </option>
                      ))}
                    </Select>
                  )}
                </FormField>
              ) : null}
              <FormField
                label="Time (Eastern Time)"
                hint="Every member gets it at this hour, Eastern Time."
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
            <FieldLabel>Channels</FieldLabel>
            <ChipGroup label="Channels" selection="multiple">
              {OFFERED_CHANNELS.map((channel) => (
                <Chip
                  key={channel}
                  selected={channels.includes(channel)}
                  onClick={() => toggleChannel(channel)}
                >
                  {CHANNEL_LABEL[channel]}
                </Chip>
              ))}
              <Chip
                selected={channels.includes("sms")}
                disabled={!channels.includes("sms")}
                onClick={() => toggleChannel("sms")}
                aria-describedby="sms-not-available"
              >
                {CHANNEL_LABEL.sms}
              </Chip>
            </ChipGroup>
            <p id="sms-not-available" className="text-caption text-fg-muted">
              {SMS_NOT_AVAILABLE}
            </p>
          </div>

          <FormField
            label="Question (optional)"
            hint="Members answer in the app, so a question needs the in-app channel."
          >
            {(props) => (
              <Select
                {...props}
                value={question}
                onChange={(e) =>
                  setQuestion(e.target.value as CampaignQuestion | "")
                }
              >
                <option value="">No question</option>
                <option value="wellbeing">{QUESTION_LABEL.wellbeing}</option>
                <option value="er-visit">{QUESTION_LABEL["er-visit"]}</option>
              </Select>
            )}
          </FormField>

          <div className="space-y-stack-sm">
            <label
              htmlFor="sms-message-content"
              className="block text-body-md text-fg"
            >
              Message Content
            </label>
            <div className="flex min-h-[100px] flex-col justify-between rounded-control border border-field bg-surface px-inset-md py-inset-sm transition-colors duration-150 ease-standard focus-within:border-primary-edge focus-within:ring-2 focus-within:ring-ring">
              <textarea
                id="sms-message-content"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message..."
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
              The same text goes to every member by email and push: never put
              health information or names in it.
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
) {
  if (error)
    return (
      <span className="text-body-sm text-fg-muted">
        {isNotShared(error) ? "No access" : "Not loaded"}
      </span>
    );
  if (pending) return <Skeleton height={28} width={72} />;
  return value();
}

export default function SmsAnalyticsPage() {
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
  const copy = readErrorCopy(campaigns.error, "The templates did not load");

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
              Notification Configuration
            </h1>
            <p className="mt-2 text-body-md leading-6 font-medium text-fg-secondary">
              Configure automated messages and check-ins
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
              New Template
            </Button>
          ) : null}
        </div>

        <ActionError
          error={campaigns.statusError}
          title="The template did not change"
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
              title="No message templates yet"
              description="Create a check-in or a reminder; it goes out only once it is activated."
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
          label="Messages Sent (last 30 days)"
          value={tileValue(analytics.isPending, analytics.error, () => (
            <>
              {analytics.data!.total.toLocaleString()}
              <span className="block text-caption font-normal text-fg-muted">
                SMS: {channelCount(analytics.data!, "SMS").toLocaleString()}
              </span>
            </>
          ))}
        />
        <StatTile
          label="Reply Rate (active templates on this page)"
          value={tileValue(campaigns.isPending, campaigns.error, () =>
            rateLabel(averageReply),
          )}
        />
        <StatTile
          label="Active Automations"
          value={tileValue(campaigns.activePending, campaigns.activeError, () =>
            String(campaigns.activeTotal ?? 0).padStart(2, "0"),
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
