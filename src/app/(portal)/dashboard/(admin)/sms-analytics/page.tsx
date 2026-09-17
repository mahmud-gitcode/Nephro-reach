"use client";

import React, { useState } from "react";
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
  Button,
  buttonStyles,
  FormField,
  Input,
  Modal,
  Select,
} from "@/components/ui";

const templates = [
  {
    title: "Weekly Wellness Check",
    type: "Check-in",
    typeClass: "border-field bg-surface text-fg-brand",
    status: "Active",
    statusClass: "border-success-600 bg-success-600 text-white",
    message:
      "How are you feeling today? Reply with a number 1-5 (1=struggling, 5=great)",
    schedule: "Every Monday at 9:00 AM",
  },
  {
    title: "Class 24hr Reminder",
    type: "Reminder",
    typeClass: "border-field bg-surface text-warning",
    status: "Active",
    statusClass: "border-success-600 bg-success-600 text-white",
    message:
      'Reminder: Your live class "[CLASS_NAME]" is tomorrow at [TIME]. Reply YES to confirm attendance.',
    schedule: "Every Monday at 9:00 AM",
  },
  {
    title: "Motivational Quote",
    type: "Reminder",
    typeClass: "border-field bg-surface text-warning",
    status: "Inactive",
    statusClass: "border-line bg-line text-fg-muted",
    message:
      '"[QUOTE]" - Remember, every step counts! Reply with INSPIRE for a new quote.',
    schedule: "Every Wednesday at 8:00 AM",
  },
];

function TemplateBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={`inline-flex h-[30px] items-center rounded-control border px-[9px] text-sm font-medium ${className}`}
    >
      {children}
    </span>
  );
}

function SmsTemplateCard({
  template,
  onEdit,
}: {
  template: (typeof templates)[number];
  onEdit: () => void;
}) {
  return (
    <article className="rounded-[10px] border border-black/10 bg-surface px-[17px] py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-heading-4 text-fg">{template.title}</h2>
            <TemplateBadge className={template.typeClass}>
              {template.type}
            </TemplateBadge>
            <TemplateBadge className={template.statusClass}>
              {template.status}
            </TemplateBadge>
          </div>

          <p className="text-base leading-6 font-medium text-fg-muted">
            {template.message}
          </p>

          <p className="flex items-center gap-2 text-base leading-6 font-medium text-fg-muted">
            <Clock3 className="h-5 w-5 shrink-0" />
            <span>Schedule: {template.schedule}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className={
            buttonStyles({ variant: "neutral", appearance: "fill-stroke" }) +
            " w-full md:w-auto"
          }
        >
          <Edit3 className="h-5 w-5" />
          Edit
        </button>
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
    <div className="absolute top-[calc(100%+8px)] right-0 z-20 w-[342px] max-w-[calc(100vw-48px)] rounded-card border border-line bg-surface-raised p-inset-md shadow-raised">
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

function TemplateModal({
  mode,
  onClose,
}: {
  mode: "create" | "edit";
  onClose: () => void;
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(
    () => new Date(2026, 5, 7, 9, 41),
  );
  const isEdit = mode === "edit";

  const scheduleLabel = scheduledAt.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

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
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="sms-template-form">
            {isEdit ? "Save Changes" : "Create Template"}
          </Button>
        </>
      }
    >
      <form id="sms-template-form" onSubmit={(event) => event.preventDefault()}>
        <div className="space-y-stack-lg">
          <FormField label="Template Name">
            {(props) => (
              <Input
                {...props}
                defaultValue={isEdit ? "Weekly Wellness Check" : ""}
                placeholder="e.g. Weekly Wellness Check"
              />
            )}
          </FormField>

          {/* Was a <button> shaped like a select that opened nothing. A
                select is what it always meant to be. */}
          <FormField label="Message Type">
            {(props) => (
              <Select {...props} defaultValue="check-in">
                <option value="check-in">Check-in</option>
                <option value="reminder">Reminder</option>
                <option value="education">Education</option>
              </Select>
            )}
          </FormField>

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
                defaultValue={
                  isEdit
                    ? "How are you feeling today? Reply with a number 1-5 (1=struggling, 5=great)"
                    : ""
                }
                placeholder="Enter your message..."
                maxLength={200}
                aria-describedby="sms-message-count"
                className="min-h-12 w-full resize-none bg-transparent text-body-sm text-fg outline-none placeholder:text-fg-muted"
              />
              <p
                id="sms-message-count"
                className="flex items-center justify-end gap-inline-xs text-caption text-fg-muted"
              >
                <FileText aria-hidden="true" className="h-4 w-4" />
                0/200
              </p>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function SmsAnalyticsPage() {
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);

  return (
    <>
      <section className="rounded-card border border-line bg-surface px-3 py-4 shadow-card">
        <div className="mb-[14px] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl leading-8 font-medium text-fg">
              Notification Configuration
            </h1>
            <p className="mt-2 text-base leading-6 font-medium text-fg-secondary">
              Configure automated messages and check-ins
            </p>
          </div>
          <Button onClick={() => setModalMode("create")}>
            <Plus aria-hidden="true" />
            New Template
          </Button>
        </div>

        <div className="space-y-3 rounded-control border border-line p-3">
          {templates.map((template) => (
            <SmsTemplateCard
              key={template.title}
              template={template}
              onEdit={() => setModalMode("edit")}
            />
          ))}
        </div>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          ["Messages Sent", "1,284"],
          ["Reply Rate", "68%"],
          ["Active Automations", "02"],
        ].map(([label, value]) => (
          <article
            key={label}
            className="rounded-card border border-line bg-surface p-5 shadow-card"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand-100 text-fg-brand">
              <MessageCircle className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-fg-muted">{label}</p>
            <p className="mt-2 text-3xl leading-8 font-semibold text-fg">
              {value}
            </p>
          </article>
        ))}
      </section>

      {modalMode && (
        <TemplateModal mode={modalMode} onClose={() => setModalMode(null)} />
      )}
    </>
  );
}
