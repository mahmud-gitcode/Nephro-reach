import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  ScanLine,
  Trash2,
} from "lucide-react";

const latestResults = [
  { label: "CREATININE", value: "0.9", unit: "umol/L", normal: "Normal: 60-110" },
  { label: "HEMOGLOBIN", value: "13.5", unit: "g/L", normal: "Normal: 115-165" },
  { label: "ALBUMIN", value: "4.5", unit: "g/L", normal: "Normal: 35-50" },
  { label: "UREA", value: "29.0", unit: "mmol/L", normal: "Normal: 2.5-7.8" },
];

const labGoals = [
  { lab: "Potassium", goal: "3.5-5.5", current: "3.5-5.5", status: "success" },
  { lab: "Phosphorus", goal: "<5.5", current: "<4.5", status: "danger" },
  { lab: "Albumin", goal: ">4.0", current: ">4.0", status: "success" },
  { lab: "Hemoglobin", goal: "10-12", current: "13.5", status: "warning" },
  { lab: "Calcium", goal: "8.5-10.5", current: "9.6", status: "success" },
  { lab: "PTH", goal: "150-600", current: "410", status: "success" },
];

const history = [
  { date: "05/06/2026", label: "Abcd 123 Week12" },
  { date: "04/06/2026", label: "Abcd 123 Week12" },
  { date: "03/06/2026", label: "Abcd 123 Week12" },
  { date: "02/06/2026", label: "Abcd 123 Week12" },
  { date: "01/06/2026", label: "Abcd 123 Week12" },
];

function ResultCard({ result }: { result: (typeof latestResults)[number] }) {
  return (
    <article className="rounded-xl border border-[#E3E6F0] bg-white p-4">
      <p className="text-xs font-semibold uppercase leading-4 tracking-[0.06px] text-slate-500">
        {result.label}
      </p>
      <div className="mt-1 flex items-baseline gap-1">
        <p className="text-xl font-semibold leading-7 tracking-[0.1px] text-slate-950">
          {result.value}
        </p>
        <p className="text-sm font-medium leading-5 text-slate-500">{result.unit}</p>
      </div>
      <p className="mt-1 text-xs font-medium leading-4 text-slate-500">{result.normal}</p>
    </article>
  );
}

function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[480px] w-full text-left text-sm">
          <thead className="bg-[#F1F5FA] text-sm font-medium leading-5 text-slate-950">
            <tr>
              {headers.map((header) => (
                <th key={header} className="border-b border-slate-200 px-3 py-4">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-slate-200">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function LabGoalsCard() {
  return (
    <section className="rounded-[14px] border border-[#E3E6F0] bg-white p-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">
              My Lab Goal
            </h2>
            <p className="text-xs font-medium leading-4 text-slate-500">June 1, 2026</p>
          </div>
          <p className="mt-2 text-sm font-medium leading-5 tracking-[0.07px] text-slate-950">
            Allow members to enter provider recommended goals:
          </p>
        </div>
        <button
          type="button"
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded border border-slate-200 bg-[#F9F9F9] px-4 text-sm font-bold text-slate-950 transition-colors hover:bg-white"
        >
          <Edit3 className="h-4 w-4" />
          Edit
        </button>
      </div>

      <div className="mt-3">
        <DataTable headers={["Lab", "My Goal", "Current"]}>
          {labGoals.map((goal) => (
            <tr key={goal.lab}>
              <td className="px-3 py-2.5 font-medium text-slate-800">{goal.lab}</td>
              <td className="px-3 py-2.5 font-medium text-slate-800">{goal.goal}</td>
              <td
                className={`px-3 py-2.5 font-medium ${
                  goal.status === "danger"
                    ? "text-red-500"
                    : goal.status === "warning"
                      ? "text-amber-600"
                      : "text-green-600"
                }`}
              >
                {goal.current}
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    </section>
  );
}

function TestHistoryCard() {
  return (
    <section className="rounded-[14px] border border-[#E3E6F0] bg-white p-3.5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">
          Test History
        </h2>
      </div>

      <div className="mt-3">
        <DataTable headers={["Date", "Label", "Action"]}>
          {history.map((item) => (
            <tr key={item.date}>
              <td className="px-3 py-2.5 font-medium text-slate-800">{item.date}</td>
              <td className="px-3 py-2.5 font-medium text-slate-800">{item.label}</td>
              <td className="px-3 py-2.5">
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    className="rounded-full p-1 text-slate-700 transition-colors hover:bg-slate-100"
                    aria-label={`Edit result from ${item.date}`}
                  >
                    <Edit3 className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="rounded-full p-1 text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete result from ${item.date}`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-end gap-4 bg-white px-3 py-2 text-sm text-slate-800">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <span className="inline-flex items-center gap-1">
            10
            <ChevronDown className="h-4 w-4" />
          </span>
        </div>
        <span>1-10 of 20</span>
        <div className="flex items-center gap-1">
          <ChevronLeft className="h-5 w-5 text-slate-400" />
          <ChevronRight className="h-5 w-5" />
        </div>
      </div>
    </section>
  );
}

function Disclaimer() {
  return (
    <aside className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-3.5">
      <div className="flex gap-2">
        <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
        <div>
          <h2 className="text-lg font-medium leading-7 text-slate-950">Important Disclaimer</h2>
          <p className="mt-2 max-w-[840px] text-sm leading-5 text-slate-700">
            This is not medical advice. If this is a medical emergency, contact your care team or
            emergency services. Always discuss lab results and treatment decisions with your
            nephrology provider.
          </p>
        </div>
      </div>
    </aside>
  );
}

export default function BloodResultsPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          className="flex h-12 w-fit items-center justify-center gap-2 rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold tracking-[0.08px] text-slate-950 transition-colors hover:bg-white"
        >
          <ScanLine className="h-5 w-5" />
          Scan Results
        </button>
        <Link
          href="/dashboard/personal-log/blood-results/add"
          className="flex h-12 w-fit items-center justify-center gap-2 rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold tracking-[0.08px] text-slate-950 transition-colors hover:bg-white"
        >
          <Plus className="h-5 w-5" />
          Add Results
        </Link>
      </header>

      <section className="rounded-[10px] border border-slate-200 bg-[#F1F5FA] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">
            Latest Results
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-medium leading-4 text-slate-500">June 1, 2026</p>
            <button
              type="button"
              className="h-11 rounded border border-slate-200 bg-[#F9F9F9] px-4 text-sm font-bold text-slate-950"
            >
              View
            </button>
            <button
              type="button"
              className="h-11 rounded border border-slate-200 bg-[#F9F9F9] px-4 text-sm font-bold text-slate-950"
            >
              Download PDF
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {latestResults.map((result) => (
            <ResultCard key={result.label} result={result} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <LabGoalsCard />
        <TestHistoryCard />
      </section>

      <button
        type="button"
        className="flex h-12 w-full items-center justify-center rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold tracking-[0.08px] text-blue-600 transition-colors hover:bg-white"
      >
        View All Results
      </button>

      <Disclaimer />
    </div>
  );
}
