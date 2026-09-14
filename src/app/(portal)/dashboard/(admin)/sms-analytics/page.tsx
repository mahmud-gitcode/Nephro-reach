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
    message: "How are you feeling today? Reply with a number 1-5 (1=struggling, 5=great)",
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
    message: '"[QUOTE]" - Remember, every step counts! Reply with INSPIRE for a new quote.',
    schedule: "Every Wednesday at 8:00 AM",
  },
];

const calendarRows = [
  ["", "", "1", "2", "3", "4", "5"],
  ["6", "7", "8", "9", "10", "11", "12"],
  ["13", "14", "15", "16", "17", "18", "19"],
  ["20", "21", "22", "23", "24", "25", "26"],
  ["27", "28", "29", "30", "", "", ""],
];

function TemplateBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span className={`inline-flex h-[30px] items-center rounded-control border px-[9px] text-sm font-medium ${className}`}>
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
            <h2 className="text-lg font-medium leading-7 text-fg">{template.title}</h2>
            <TemplateBadge className={template.typeClass}>{template.type}</TemplateBadge>
            <TemplateBadge className={template.statusClass}>{template.status}</TemplateBadge>
          </div>

          <p className="text-base font-medium leading-6 text-fg-muted">{template.message}</p>

          <p className="flex items-center gap-2 text-base font-medium leading-6 text-fg-muted">
            <Clock3 className="h-5 w-5 shrink-0" />
            <span>Schedule: {template.schedule}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className={buttonStyles({ variant: "neutral", appearance: "fill-stroke" }) + " w-full md:w-auto"}
        >
          <Edit3 className="h-5 w-5" />
          Edit
        </button>
      </div>
    </article>
  );
}

function CalendarPicker() {
  return (
    <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[342px] max-w-[calc(100vw-48px)] rounded-card border border-line bg-surface-raised p-inset-md shadow-raised">
      <div className="mb-4 flex h-9 items-center justify-between">
        <button type="button" className="flex items-center gap-2 text-xl font-medium text-fg">
          June 2026
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-4 text-fg">
          <button type="button" aria-label="Previous month" className="cursor-pointer rounded-control-small focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button type="button" aria-label="Next month" className="cursor-pointer rounded-control-small focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-3 text-center">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
          <span key={day} className="text-sm font-medium leading-5 text-fg-muted">
            {day}
          </span>
        ))}
        {calendarRows.flatMap((row, rowIndex) =>
          row.map((day, dayIndex) => (
            <button
              key={`${rowIndex}-${dayIndex}`}
              type="button"
              disabled={!day}
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-pill text-base font-medium ${
                day === "7"
                  ? "bg-primary-solid text-primary-on-solid"
                  : day
                    ? "text-fg hover:bg-primary-soft"
                    : "text-transparent"
              }`}
            >
              {day}
            </button>
          )),
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xl font-medium text-fg">Time</span>
        <div className="flex items-center gap-2">
          <span className="rounded-control-small bg-surface-sunken px-3 py-1 text-xl font-medium text-fg">
            09 : 41
          </span>
          <div className="flex h-9 rounded-control bg-surface-sunken p-0.5 text-sm font-medium text-fg">
            <button type="button" className="rounded-control-small border border-line bg-surface px-3 shadow-card">
              AM
            </button>
            <button type="button" className="px-3">
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
  const isEdit = mode === "edit";

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
        <form
          id="sms-template-form"
          onSubmit={(event) => event.preventDefault()}
        >
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
                {isEdit ? "Every Monday at 9:00 AM" : "e.g. dd/mm/yyyy at 00:00 AM"}
                <CalendarDays aria-hidden="true" className="h-5 w-5 text-fg-muted" />
              </button>
              {showCalendar && <CalendarPicker />}
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
            <h1 className="text-2xl font-medium leading-8 text-fg">Notification Configuration</h1>
            <p className="mt-2 text-base font-medium leading-6 text-fg-secondary">
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
          <article key={label} className="rounded-card border border-line bg-surface p-5 shadow-card">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand-100 text-fg-brand">
              <MessageCircle className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-fg-muted">{label}</p>
            <p className="mt-2 text-3xl font-semibold leading-8 text-fg">{value}</p>
          </article>
        ))}
      </section>

      {modalMode && <TemplateModal mode={modalMode} onClose={() => setModalMode(null)} />}
    </>
  );
}
