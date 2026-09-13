"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock3,
  Edit3,
  FileText,
  MessageCircle,
  Plus,
  X,
} from "lucide-react";

const templates = [
  {
    title: "Weekly Wellness Check",
    type: "Check-in",
    typeClass: "border-[#CBD5ED] bg-white text-blue-600",
    status: "Active",
    statusClass: "border-emerald-600 bg-emerald-600 text-white",
    message: "How are you feeling today? Reply with a number 1-5 (1=struggling, 5=great)",
    schedule: "Every Monday at 9:00 AM",
  },
  {
    title: "Class 24hr Reminder",
    type: "Reminder",
    typeClass: "border-[#CBD5ED] bg-white text-amber-500",
    status: "Active",
    statusClass: "border-emerald-600 bg-emerald-600 text-white",
    message:
      'Reminder: Your live class "[CLASS_NAME]" is tomorrow at [TIME]. Reply YES to confirm attendance.',
    schedule: "Every Monday at 9:00 AM",
  },
  {
    title: "Motivational Quote",
    type: "Reminder",
    typeClass: "border-[#CBD5ED] bg-white text-amber-500",
    status: "Inactive",
    statusClass: "border-slate-200 bg-slate-200 text-slate-500",
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
    <span className={`inline-flex h-[30px] items-center rounded-lg border px-[9px] text-sm font-medium ${className}`}>
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
    <article className="rounded-[10px] border border-black/10 bg-white px-[17px] py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-medium leading-7 text-slate-900">{template.title}</h2>
            <TemplateBadge className={template.typeClass}>{template.type}</TemplateBadge>
            <TemplateBadge className={template.statusClass}>{template.status}</TemplateBadge>
          </div>

          <p className="text-base font-medium leading-6 text-slate-600">{template.message}</p>

          <p className="flex items-center gap-2 text-base font-medium leading-6 text-slate-500">
            <Clock3 className="h-5 w-5 shrink-0" />
            <span>Schedule: {template.schedule}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="flex h-12 w-full items-center justify-center gap-2 rounded border border-slate-200 bg-slate-100 px-4 text-base font-bold text-slate-900 transition-colors hover:bg-slate-200 md:w-auto"
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
    <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[342px] max-w-[calc(100vw-48px)] rounded-[13px] bg-[#F8FAFC] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
      <div className="mb-4 flex h-9 items-center justify-between">
        <button type="button" className="flex items-center gap-2 text-xl font-medium text-slate-900">
          June 2026
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-4 text-slate-900">
          <button type="button" aria-label="Previous month">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button type="button" aria-label="Next month">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-3 text-center">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
          <span key={day} className="text-sm font-medium leading-5 text-slate-500">
            {day}
          </span>
        ))}
        {calendarRows.flatMap((row, rowIndex) =>
          row.map((day, dayIndex) => (
            <button
              key={`${rowIndex}-${dayIndex}`}
              type="button"
              disabled={!day}
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-base font-medium ${
                day === "7"
                  ? "bg-blue-600 text-white"
                  : day
                    ? "text-slate-900 hover:bg-blue-50"
                    : "text-transparent"
              }`}
            >
              {day}
            </button>
          )),
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xl font-medium text-slate-900">Time</span>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-100 px-3 py-1 text-xl font-medium text-slate-900">
            09 : 41
          </span>
          <div className="flex h-9 rounded-lg bg-slate-100 p-0.5 text-sm font-medium text-slate-900">
            <button type="button" className="rounded-md border border-slate-200 bg-white px-3 shadow-sm">
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
  return <label className="text-base font-medium leading-6 text-slate-900">{children}</label>;
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4 py-8">
      <section className="w-full max-w-[494px] rounded-[14px] border border-[#E3E6F0] bg-[#F1F5FA] px-3 py-4 shadow-xl">
        <div className="mb-[18px]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-normal leading-[18px] text-slate-900">
              {isEdit ? "Edit Message Template" : "Create Message Template"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-900 hover:bg-white"
              aria-label="Close template modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-sm leading-5 text-slate-700">
            {isEdit ? "Update this notification template automation" : "Add a new notification template for automation"}
          </p>
        </div>

        <form className="rounded-lg bg-white p-3" onSubmit={(event) => event.preventDefault()}>
          <div className="space-y-4">
            <div className="space-y-2">
              <FieldLabel>Template Name</FieldLabel>
              <input
                defaultValue={isEdit ? "Weekly Wellness Check" : ""}
                placeholder="e.g. Weekly Wellness Check"
                className="h-12 w-full rounded border border-[#CBD5ED] bg-white px-4 text-base text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Message Type</FieldLabel>
              <button
                type="button"
                className="flex h-12 w-full items-center justify-between rounded border border-[#CBD5ED] bg-white px-4 text-left text-base text-slate-900"
              >
                Check-in
                <ChevronDown className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="relative space-y-2">
              <FieldLabel>Schedule</FieldLabel>
              <button
                type="button"
                onClick={() => setShowCalendar((current) => !current)}
                className="flex h-12 w-full items-center justify-between rounded border border-[#CBD5ED] bg-white px-4 text-left text-base text-slate-500"
              >
                {isEdit ? "Every Monday at 9:00 AM" : "e.g. dd/mm/yyyy at 00:00 AM"}
                <CalendarDays className="h-5 w-5 text-slate-600" />
              </button>
              {showCalendar && <CalendarPicker />}
            </div>

            <div className="space-y-2">
              <FieldLabel>Message Content</FieldLabel>
              <div className="flex min-h-[100px] flex-col justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                <textarea
                  defaultValue={
                    isEdit
                      ? "How are you feeling today? Reply with a number 1-5 (1=struggling, 5=great)"
                      : ""
                  }
                  placeholder="Enter your message..."
                  maxLength={200}
                  className="min-h-12 w-full resize-none bg-transparent text-sm font-medium leading-5 text-slate-900 outline-none placeholder:text-slate-500"
                />
                <div className="flex items-center justify-end gap-1 text-xs font-medium leading-4 text-slate-500">
                  <FileText className="h-4 w-4" />
                  0/200
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex h-12 items-center justify-center rounded border border-slate-200 bg-slate-100 text-base font-bold text-slate-900 transition-colors hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex h-12 items-center justify-center rounded bg-blue-600 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
            >
              {isEdit ? "Save Changes" : "Create Template"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function SmsAnalyticsPage() {
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);

  return (
    <>
      <section className="rounded-[14px] border border-[#E3E6F0] bg-white px-3 py-4 shadow-sm">
        <div className="mb-[14px] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-medium leading-8 text-slate-900">Notification Configuration</h1>
            <p className="mt-2 text-base font-medium leading-6 text-slate-700">
              Configure automated messages and check-ins
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalMode("create")}
            className="flex h-12 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            New Template
          </button>
        </div>

        <div className="space-y-3 rounded-lg border border-[#C4CDD5] p-3">
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
          <article key={label} className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-blue-100 text-blue-600">
              <MessageCircle className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold leading-8 text-slate-900">{value}</p>
          </article>
        ))}
      </section>

      {modalMode && <TemplateModal mode={modalMode} onClose={() => setModalMode(null)} />}
    </>
  );
}
