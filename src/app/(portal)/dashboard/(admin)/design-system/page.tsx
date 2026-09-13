"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  Circle,
  Copy,
  Droplet,
  Info,
  Pencil,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Local presentation helpers — only used by this page               */
/* ------------------------------------------------------------------ */

type Status = "consistent" | "diverged" | "missing";

const statusMeta: Record<Status, { label: string; className: string }> = {
  consistent: {
    label: "Consistent",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  diverged: {
    label: "Diverged",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  missing: {
    label: "Not built",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Spec({
  name,
  uses,
  variants,
  status,
  note,
  children,
}: {
  name: string;
  uses?: string;
  variants?: string;
  status: Status;
  note?: string;
  children: React.ReactNode;
}) {
  const meta = statusMeta[status];
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900">{name}</h3>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}
          >
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
          {uses ? <span>{uses}</span> : null}
          {variants ? (
            <span className="text-amber-700">{variants}</span>
          ) : null}
        </div>
      </div>

      <div className="px-4 py-5">
        <div className="flex flex-wrap items-center gap-3">{children}</div>
      </div>

      {note ? (
        <p className="border-t border-slate-100 px-4 py-2.5 text-xs leading-5 text-slate-500">
          {note}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

const sections = [
  { id: "buttons", label: "Buttons" },
  { id: "forms", label: "Form controls" },
  { id: "display", label: "Display" },
  { id: "feedback", label: "Feedback" },
  { id: "overlay", label: "Overlay" },
  { id: "navigation", label: "Navigation" },
  { id: "missing", label: "Not yet built" },
];

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toggleOn, setToggleOn] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [checked, setChecked] = useState(true);

  return (
    <div className="space-y-8 pb-16">
      {/* ---------------- Page header ---------------- */}
      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-[28px]">
              Design System
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
              Every UI pattern currently in the NephroReach frontend, rendered
              live. This page is the reference for what exists, what has
              drifted, and what still needs building.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            <Circle className="h-3 w-3 fill-blue-600 text-blue-600" />
            Admin only
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-4">
          {[
            { n: "0", l: "Component library used" },
            { n: "368", l: "Buttons, hand-written" },
            { n: "26", l: "Separate modal builds" },
            { n: "150", l: "Unique hex colors" },
          ].map((s) => (
            <div key={s.l} className="bg-white px-4 py-3">
              <span className="block text-xl font-bold tracking-tight text-slate-900">
                {s.n}
              </span>
              <span className="mt-0.5 block text-xs leading-4 text-slate-500">
                {s.l}
              </span>
            </div>
          ))}
        </div>
      </header>

      {/* ---------------- Section nav ---------------- */}
      <nav className="sticky top-0 z-10 -mx-1 flex gap-2 overflow-x-auto bg-slate-50/95 px-1 py-2 backdrop-blur-sm no-scrollbar">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-500 hover:text-blue-600"
          >
            {s.label}
          </a>
        ))}
      </nav>

      {/* ---------------- Buttons ---------------- */}
      <Section
        id="buttons"
        title="Buttons"
        description="The most-used element in the app, and the most inconsistent."
      >
        <Spec
          name="Primary button"
          uses="368 button elements total"
          variants="12 divergent class strings"
          status="diverged"
          note="The same primary button is written 12 different ways — padding varies (py-2 / py-2.5 / py-3), text size varies (text-xs / text-sm / text-base), and most mix two color systems in one string: bg-[#2563EB] paired with hover:bg-blue-700."
        >
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 text-sm font-bold text-white shadow-2xs transition-colors hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Log Treatment
          </button>
          <button className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white shadow-2xs transition-all hover:bg-blue-700 active:scale-[0.98]">
            Variant found in code
          </button>
          <button className="rounded-xl bg-[#2563EB] px-4 py-3 text-center text-base font-bold text-white shadow-md">
            Another found in code
          </button>
        </Spec>

        <Spec
          name="Secondary / ghost / danger"
          uses="Used across forms and modals"
          status="diverged"
          note="Secondary buttons appear with border-slate-200 and border-slate-300 interchangeably."
        >
          <button className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50">
            Cancel
          </button>
          <button className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-[#2563EB] transition-colors hover:bg-blue-50">
            View history
          </button>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white transition-colors hover:bg-rose-700">
            <Trash2 className="h-4 w-4" />
            Delete entry
          </button>
          <button
            disabled
            className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-5 text-sm font-semibold text-slate-400"
          >
            Saving…
          </button>
        </Spec>

        <Spec name="Icon button" uses="Common in tables and cards" status="diverged">
          <button
            aria-label="Edit"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            aria-label="Copy"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            aria-label="Delete"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600 transition-colors hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </Spec>
      </Section>

      {/* ---------------- Forms ---------------- */}
      <Section
        id="forms"
        title="Form controls"
        description="85 inputs, 31 textareas, 26 selects and 107 labels — none of them share a wrapper."
      >
        <Spec
          name="Text input"
          uses="85 uses"
          variants="4 divergent class strings"
          status="diverged"
          note="Focus rings differ between call sites: focus:ring-1 focus:ring-blue-500 in some places, focus:ring-2 focus:ring-blue-100 in others."
        >
          <div className="w-full max-w-sm">
            <label
              htmlFor="ds-weight"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Pre-treatment weight
            </label>
            <input
              id="ds-weight"
              type="text"
              defaultValue="72.4"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-2 text-xs text-slate-500">Recorded in kilograms.</p>
          </div>
        </Spec>

        <Spec name="Select, date and search" uses="26 selects · 7 date inputs" status="diverged">
          <div className="relative w-full max-w-[220px]">
            <select
              aria-label="Category"
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option>All Categories</option>
              <option>Blood Counts</option>
              <option>Chemistry</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative w-full max-w-[200px]">
            <input
              type="date"
              aria-label="Apply date"
              defaultValue="2024-04-30"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="relative w-full max-w-[240px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              aria-label="Search"
              placeholder="Search members…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </Spec>

        <Spec name="Textarea" uses="31 uses" status="diverged">
          <div className="w-full max-w-md">
            <label
              htmlFor="ds-notes"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Session notes
            </label>
            <textarea
              id="ds-notes"
              rows={3}
              defaultValue="Mild cramping in the last hour. Resolved after the rate was lowered."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </Spec>

        <Spec
          name="Checkbox and toggle"
          uses="2 checkboxes · 0 radios"
          status="diverged"
          note="Only 2 checkboxes and no radio inputs exist in the whole app. The toggle below is rebuilt from scratch wherever it appears."
        >
          <label className="inline-flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-800">
              Send appointment reminders
            </span>
          </label>

          <button
            type="button"
            role="switch"
            aria-checked={toggleOn}
            aria-label="Notifications"
            onClick={() => setToggleOn((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              toggleOn ? "bg-[#2563EB]" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                toggleOn ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </Spec>
      </Section>

      {/* ---------------- Display ---------------- */}
      <Section
        id="display"
        title="Display"
        description="Containers, labels and data presentation."
      >
        <Spec
          name="Card"
          uses="rounded-xl used 371 times"
          variants="4 near-identical border greys"
          status="diverged"
          note="Card borders appear as #E2E8F0, #E3E6F0, #E9EEF4 and #E8EEF6 across the app — visually identical, four separate values."
        >
          <div className="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
                <Droplet className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Avg. Fluid Intake
                </p>
                <p className="text-xs text-slate-500">Last 7 days</p>
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-[28px]">
              1,240 <span className="text-sm font-bold text-slate-400">mL</span>
            </p>
          </div>
        </Spec>

        <Spec
          name="Badge / status pill"
          uses="103 uses"
          variants="Multiple palettes"
          status="diverged"
          note="Status pills use rose / emerald / amber / purple / slate palettes inconsistently — the same meaning gets a different color depending on the page."
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <Check className="h-3 w-3" />
            At Target EDW
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            <TriangleAlert className="h-3 w-3" />
            Above Goal
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
            <AlertTriangle className="h-3 w-3" />
            Below EDW
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            Automatic
          </span>
        </Spec>

        <Spec name="Avatar" uses="12 uses" status="diverged">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            CX
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
            JW
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
            +4
          </span>
        </Spec>

        <Spec
          name="Table"
          uses="23 tables"
          variants="No shared header or empty state"
          status="diverged"
          note="23 tables exist, and none of them share a header style, sort control, pagination or loading state."
        >
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-left">
              <thead>
                <tr>
                  {["Test", "Result", "Range", "Status"].map((h) => (
                    <th
                      key={h}
                      className="border-b border-slate-200 pb-2 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Creatinine", "8.2 mg/dL", "0.7 – 1.3", "High"],
                  ["Albumin", "3.9 g/dL", "3.5 – 5.0", "Normal"],
                  ["Calcium", "9.1 mg/dL", "8.5 – 10.2", "Normal"],
                ].map((row) => (
                  <tr key={row[0]}>
                    <td className="border-b border-slate-100 py-2.5 pr-4 text-sm font-semibold text-slate-900">
                      {row[0]}
                    </td>
                    <td className="border-b border-slate-100 py-2.5 pr-4 text-sm text-slate-700 tabular-nums">
                      {row[1]}
                    </td>
                    <td className="border-b border-slate-100 py-2.5 pr-4 text-sm text-slate-500 tabular-nums">
                      {row[2]}
                    </td>
                    <td className="border-b border-slate-100 py-2.5 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          row[3] === "High"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {row[3]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Spec>

        <Spec name="Progress bar" uses="86 references" status="diverged">
          <div className="w-full max-w-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Journey progress</span>
              <span className="tabular-nums">12 of 30 days</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-[#2563EB]" style={{ width: "40%" }} />
            </div>
          </div>
        </Spec>
      </Section>

      {/* ---------------- Feedback ---------------- */}
      <Section
        id="feedback"
        title="Feedback"
        description="Telling the member what happened. This is the thinnest layer in the app."
      >
        <Spec
          name="Alert / inline message"
          uses="Appears as one-off markup"
          status="diverged"
          note="Alerts are rebuilt inline wherever needed. There is no shared component, so icon, padding and color vary."
        >
          <div className="flex w-full max-w-md items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <p className="text-sm text-blue-900">
              Your nephrologist reviews these entries before each monthly visit.
            </p>
          </div>
          <div className="flex w-full max-w-md items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <p className="text-sm text-rose-900">
              Weight gain is above your 4% target. Contact your care team.
            </p>
          </div>
        </Spec>

        <Spec
          name="Empty state"
          uses="11 references"
          status="diverged"
          note="Written inline each time — no shared illustration, heading or action pattern."
        >
          <div className="flex w-full max-w-sm flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 shadow-2xs">
              <Calendar className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-bold text-slate-900">
              No appointments yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Add your next clinic visit to see it here.
            </p>
            <button className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 text-xs font-bold text-white hover:bg-blue-700">
              <Plus className="h-3.5 w-3.5" />
              Add appointment
            </button>
          </div>
        </Spec>
      </Section>

      {/* ---------------- Overlay ---------------- */}
      <Section
        id="overlay"
        title="Overlay"
        description="The highest-risk area in the app."
      >
        <Spec
          name="Modal"
          uses="26 separate implementations"
          variants="16 missing dialog role"
          status="diverged"
          note="26 files build their own fixed inset-0 overlay. Only 10 set role=dialog or aria-modal, only 9 handle the Escape key, and none trap focus — which means a keyboard user can tab out of an open dialog and get stuck behind it."
        >
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2563EB] px-5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
          >
            Open example modal
          </button>
        </Spec>
      </Section>

      {/* ---------------- Navigation ---------------- */}
      <Section
        id="navigation"
        title="Navigation"
        description="Moving between views and filtering what's shown."
      >
        <Spec name="Tabs" uses="284 references" status="diverged">
          <div className="flex w-full gap-1 border-b border-slate-200">
            {[
              { id: "overview", label: "Overview" },
              { id: "history", label: "History" },
              { id: "trends", label: "Trends" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "border-[#2563EB] text-[#2563EB]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Spec>

        <Spec name="Filter chips" uses="140 filter references" status="diverged">
          {["All", "Blood Counts", "Chemistry", "Fluid"].map((f, i) => (
            <button
              key={f}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                i === 0
                  ? "border-[#2563EB] bg-[#2563EB] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f}
            </button>
          ))}
        </Spec>

        <Spec name="Breadcrumb" uses="9 references" status="consistent">
          <nav aria-label="Breadcrumb" className="text-sm">
            <ol className="flex items-center gap-2 text-slate-500">
              <li>Dashboard</li>
              <li aria-hidden="true">/</li>
              <li>Personal Log</li>
              <li aria-hidden="true">/</li>
              <li className="font-semibold text-slate-900">Lab Tracking</li>
            </ol>
          </nav>
        </Spec>
      </Section>

      {/* ---------------- Missing ---------------- */}
      <Section
        id="missing"
        title="Not yet built"
        description="Patterns the app needs but has no implementation of anywhere."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { n: "Toast", d: "27 forms, no success or failure feedback" },
            { n: "Skeleton", d: "0 loading placeholders in the app" },
            { n: "Spinner", d: "No pending state on any async action" },
            { n: "Pagination", d: "23 tables, none paginated" },
            { n: "Tooltip", d: "Only 3 references, no component" },
            { n: "Dropdown menu", d: "Rebuilt inline in 22 places" },
            { n: "Accordion", d: "2 references, no shared build" },
            { n: "Drawer", d: "11 references, no shared build" },
            { n: "Chart", d: "Hand-drawn SVG across 6 data pages" },
          ].map((c) => (
            <div
              key={c.n}
              className="rounded-xl border border-rose-200 bg-rose-50/50 p-4"
            >
              <div className="flex items-center gap-2">
                <X className="h-3.5 w-3.5 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">{c.n}</h3>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-slate-600">{c.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------- Example modal ---------------- */}
      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => setModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ds-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-5 rounded-xl border border-slate-200 bg-white p-6 text-left shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3
                id="ds-modal-title"
                className="text-lg font-bold text-slate-900"
              >
                Example modal
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Close"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              This one sets <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">role=&quot;dialog&quot;</code> and{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">aria-modal</code>. Most modals in
              the app do not — and none of them trap focus.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="inline-flex h-11 items-center rounded-xl bg-[#2563EB] px-5 text-sm font-bold text-white hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
