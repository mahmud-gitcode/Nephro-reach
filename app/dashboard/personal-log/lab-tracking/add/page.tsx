import React from "react";
import Link from "next/link";
import { Building2, CalendarDays, Plus, Stethoscope, X } from "lucide-react";

const summaryCards = [
  { label: "Dialysis Center", value: "ABCD", icon: Building2 },
  { label: "Consultants", value: "Dr. Sarah Smith", icon: Stethoscope },
  { label: "Schedule", value: "08/12/2026", icon: CalendarDays },
];

const labFields = [
  { test: "Potassium (K)", unit: "mEq/L", goal: "3.5 - 5.0", result: "3.5" },
  { test: "Phosphorus (P)", unit: "mg/dL", goal: "2.5 - 4.5", result: "2.5" },
  { test: "Calcium (Ca)", unit: "mg/dL", goal: "8.5 - 10.5", result: "8.5 - 10.5" },
  { test: "Haemoglobin (Hgb)", unit: "g/dL", goal: "Male: 13.5 - 17.5, Female: 12.0 - 15.5", result: "Male: 13.5 - 17.5, Female: 12.0 - 15.5" },
  { test: "Albumin (Alb)", unit: "g/dL", goal: "3.5 - 5.0", result: "3.5 - 5.0" },
  { test: "A1C (HbA1c)", unit: "%", goal: "Below 5.7%", result: "Below 5.7%" },
  { test: "PTH (Intact)", unit: "pg/mL", goal: "10 - 65", result: "10 - 65" },
  { test: "Creatinine (Cr)", unit: "mg/dL", goal: "Male: 0.74 - 1.35, Female: 0.59 - 1.04", result: "Male: 0.74 - 1.35, Female: 0.59 - 1.04" },
  { test: "Fluid gains (IDWG)", unit: "kg", goal: "00", result: "00" },
  { test: "Weight trends (Wt)", unit: "kg", goal: "00", result: "00" },
];

function SummaryCard({ card }: { card: (typeof summaryCards)[number] }) {
  return (
    <article className="flex h-16 items-center gap-3 rounded-xl bg-[#F1F5FA] px-3 py-2">
      <card.icon className="h-7 w-7 shrink-0 text-slate-800" />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium leading-4 tracking-[0.06px] text-slate-600">
          {card.label}
        </p>
        <p className="truncate text-lg font-semibold leading-7 tracking-[0.09px] text-slate-950">
          {card.value}
        </p>
      </div>
    </article>
  );
}

function LabRow({ field, showLabels }: { field: (typeof labFields)[number]; showLabels: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:items-end">
      <div className="flex h-12 items-center gap-3 rounded-lg border border-slate-200 bg-[#F8FAFC] px-3">
        <p className="min-w-0 flex-1 truncate text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">
          {field.test}
        </p>
        <span className="shrink-0 text-sm leading-5 tracking-[0.07px] text-slate-600">{field.unit}</span>
      </div>
      <label className="block">
        {showLabels && (
          <span className="mb-2 block text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
            Goal Range
          </span>
        )}
        <span className="flex h-12 items-center rounded border border-[#CBD5ED] bg-white px-4 text-base text-slate-500">
          {field.goal}
        </span>
      </label>
      <label className="block">
        {showLabels && (
          <span className="mb-2 block text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
            Result
          </span>
        )}
        <span className="flex h-12 items-center rounded border border-[#CBD5ED] bg-white px-4 text-base text-slate-700">
          {field.result}
        </span>
      </label>
    </div>
  );
}

export default function AddLabTrackingPage() {
  return (
    <div className="mx-auto max-w-[980px]">
      <section className="rounded-[14px] border border-[#E3E6F0] bg-[#F1F5FA] p-3.5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-medium leading-7 tracking-[0.09px] text-slate-950">
              Entry New LAb Results
            </h1>
            <button
              type="button"
              className="flex h-11 items-center gap-2 rounded-[10px] border border-slate-200 bg-white px-4 text-base font-medium text-slate-950"
            >
              May 26, 2026
              <CalendarDays className="h-5 w-5 text-slate-700" />
            </button>
          </div>
          <Link
            href="/dashboard/personal-log/lab-tracking"
            className="w-fit rounded-full p-1 text-slate-950 transition-colors hover:bg-white"
            aria-label="Close add lab result"
          >
            <X className="h-6 w-6" />
          </Link>
        </header>

        <div className="mt-4 rounded-lg bg-white p-3">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {summaryCards.map((card) => (
              <SummaryCard key={card.label} card={card} />
            ))}
          </div>

          <section className="mt-5 rounded-[14px] border border-slate-200 bg-white py-3">
            <h2 className="px-4 text-lg font-medium leading-7 tracking-[0.09px] text-slate-950">
              Latest Lab Results
            </h2>
            <div className="mt-3 border-t border-slate-200" />
            <div className="mt-4 space-y-2 px-4">
              {labFields.map((field, index) => (
                <LabRow key={field.test} field={field} showLabels={index === 0} />
              ))}
            </div>
          </section>

          <section className="mt-3 rounded-[14px] border border-slate-200 bg-[#F1F5FA] p-4">
            <h2 className="text-lg font-medium leading-7 tracking-[0.09px] text-slate-950">Notes</h2>
            <div className="mt-3 min-h-[96px] rounded-lg border border-slate-200 bg-white px-4 py-3 text-base font-medium leading-6 tracking-[0.08px] text-slate-600">
              <ul className="list-disc space-y-1 pl-5">
                <li>Is my phosphorus level improving?</li>
                <li>Should I adjust my fluid goal?</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Link
            href="/dashboard/personal-log/lab-tracking"
            className="flex h-[52px] items-center justify-center rounded border border-slate-200 bg-[#F1F5FA] px-4 text-base font-bold text-slate-950 transition-colors hover:bg-white"
          >
            Cancel
          </Link>
          <button
            type="button"
            className="flex h-[52px] items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Save Entry
          </button>
        </div>
      </section>
    </div>
  );
}
