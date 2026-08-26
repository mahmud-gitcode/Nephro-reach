import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Building2,
  CalendarDays,
  Download,
  Info,
  Plus,
  Stethoscope,
} from "lucide-react";

const summaryCards = [
  { label: "Dialysis Center", value: "ABCD", icon: Building2 },
  { label: "Consultants", value: "Dr. Sarah Smith", icon: Stethoscope },
  { label: "Schedule", value: "08/12/2026", icon: CalendarDays },
];

const labResults = [
  {
    test: "Potassium (K)",
    unit: "mEq/L",
    goal: "3.5 - 5.0",
    previous: "3.5",
    result: "3.5",
    trend: "up",
    status: "In Range",
  },
  {
    test: "Phosphorus (P)",
    unit: "mg/dL",
    goal: "2.5 - 4.5",
    previous: "2.4",
    result: "2.4",
    trend: "up",
    status: "In Range",
  },
  {
    test: "Calcium (Ca)",
    unit: "mg/dL",
    goal: "8.5 - 10.5",
    previous: "8.5",
    result: "8.5",
    trend: "up",
    status: "In Range",
  },
  {
    test: "Hemoglobin (Hgb)",
    unit: "g/dL",
    goal: "13.5 - 17.5",
    previous: "13.5",
    result: "13.5",
    trend: "up",
    status: "In Range",
  },
  {
    test: "Albumin (Alb)",
    unit: "g/dL",
    goal: "3.5 - 5.0",
    previous: "3.5",
    result: "3.5",
    trend: "up",
    status: "Slightly High",
  },
  {
    test: "A1C (HbA1c)",
    unit: "%",
    goal: "Below 5.7%",
    previous: "5%",
    result: "5%",
    trend: "down",
    status: "In Range",
  },
  {
    test: "PTH (Intact)",
    unit: "pg/mL",
    goal: "10 - 65",
    previous: "11",
    result: "11",
    trend: "up",
    status: "In Range",
  },
  {
    test: "Creatinine (Cr)",
    unit: "mg/dL",
    goal: "0.74 - 1.35",
    previous: "1.5",
    result: "1.5",
    trend: "up",
    status: "In Range",
  },
  {
    test: "Fluid gains (IDWG)",
    unit: "kg",
    goal: "3 kg",
    previous: "3 kg",
    result: "3 kg",
    trend: "down",
    status: "In Range",
  },
  {
    test: "Weight trends (Wt)",
    unit: "kg",
    goal: "70 kg",
    previous: "70 kg",
    result: "70 kg",
    trend: "up",
    status: "In Range",
  },
];

const trendCards = [
  {
    title: "Potassium",
    unit: "mEq/L",
    value: "3.5",
    labels: ["Feb 4", "Jun 12"],
    values: [2.1, 2.4, 5.2, 2.0, 2.5, 3.2, 2.4, 2.3],
  },
  {
    title: "Phosphorus",
    unit: "mg/dL",
    value: "2.4",
    labels: ["Feb 4", "Jun 12"],
    values: [2.0, 2.3, 5.0, 1.9, 2.4, 3.1, 2.2, 2.2],
  },
  {
    title: "Albumin",
    unit: "g/dL",
    value: "3.5",
    labels: ["Feb 4", "Jun 12"],
    values: [2.1, 2.5, 5.1, 2.0, 2.4, 3.0, 2.3, 2.2],
  },
];

function SummaryCards() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {summaryCards.map((card) => (
        <article key={card.label} className="flex h-16 items-center gap-3 rounded-xl bg-[#F1F5FA] px-3 py-2">
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
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "Slightly High"
      ? "bg-amber-100 text-amber-600"
      : "bg-emerald-100 text-emerald-600";

  return (
    <span className={`inline-flex h-6 items-center rounded px-2 text-sm font-semibold tracking-[0.2px] ${className}`}>
      {status}
    </span>
  );
}

function TrendIcon({ direction }: { direction: string }) {
  const isDown = direction === "down";

  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
        isDown ? "bg-red-200 text-red-500" : "bg-emerald-200 text-emerald-600"
      }`}
    >
      {isDown ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
    </span>
  );
}

function LatestLabResults() {
  return (
    <section className="rounded-[14px] border border-[#E3E6F0] bg-white p-3">
      <SummaryCards />

      <div className="my-6 border-t border-slate-200" />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">
            Latest Lab Results
          </h1>
          <Info className="h-5 w-5 text-slate-500" />
          <p className="text-xs leading-4 tracking-[0.06px] text-slate-500">Ma 4,2026</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold text-slate-950"
          >
            <ArrowLeft className="h-5 w-5" />
            May 20
            <ArrowRight className="h-5 w-5" />
          </button>
          <Link
            href="/dashboard/personal-log/lab-tracking/add"
            className="flex h-12 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Add Result
          </Link>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-[#F1F5FA] text-sm font-medium leading-5 text-slate-950">
              <tr>
                {["Test", "Goal Range", "Previous (Apr 20)", "Result", "Trend", "Status"].map((header) => (
                  <th key={header} className="border-b border-slate-200 px-3 py-4">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-slate-200">
              {labResults.map((result) => (
                <tr key={result.test}>
                  <td className="px-3 py-2.5">
                    <p className="font-medium leading-5 tracking-[0.07px] text-slate-800">{result.test}</p>
                    <p className="text-xs leading-4 tracking-[0.06px] text-slate-600">{result.unit}</p>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{result.goal}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{result.previous}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{result.result}</td>
                  <td className="px-3 py-2.5">
                    <TrendIcon direction={result.trend} />
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={result.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function MiniTrendCard({ trend }: { trend: (typeof trendCards)[number] }) {
  const chartWidth = 305;
  const chartHeight = 176;
  const xFor = (index: number) => 20 + index * 38;
  const yFor = (value: number) => 8 + ((8 - value) / 8) * 160;
  const line = trend.values.map((value, index) => `${xFor(index)},${yFor(value)}`).join(" ");

  return (
    <article className="rounded-[14px] border border-[#E3E6F0] bg-white p-3.5">
      <div className="flex items-center gap-1.5">
        <h3 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">{trend.title}</h3>
        <p className="text-xs leading-4 tracking-[0.06px] text-slate-500">{trend.unit}</p>
      </div>
      <div className="mt-3 grid h-[212px] grid-cols-[20px_minmax(0,1fr)] gap-2">
        <div className="flex flex-col justify-between text-right text-xs leading-4 text-slate-600">
          {[8, 6, 4, 2, 0].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="relative overflow-hidden rounded">
          <div className="absolute inset-0 flex flex-col justify-between py-1.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <span key={index} className="border-t border-dashed border-slate-200" />
            ))}
          </div>
          <div className="absolute inset-y-0 left-px right-px flex justify-between">
            {Array.from({ length: 3 }).map((_, index) => (
              <span key={index} className="border-l border-dashed border-slate-200" />
            ))}
          </div>
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polyline
              points={line}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            {trend.values.map((value, index) => (
              <circle key={`${trend.title}-${index}`} cx={xFor(index)} cy={yFor(value)} r="3" fill="#2563EB" />
            ))}
          </svg>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-[20px_minmax(0,1fr)] gap-2">
        <span />
        <div className="flex justify-between text-xs leading-4 text-slate-700">
          {trend.labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

function TrendsOverTime() {
  return (
    <section className="rounded-[14px] border border-[#E3E6F0] bg-white p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">
          Trends Over Time
        </h2>
        <button
          type="button"
          className="flex h-12 w-fit items-center justify-center gap-2 rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold text-slate-950 transition-colors hover:bg-white"
        >
          <Download className="h-5 w-5" />
          Export
        </button>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {trendCards.map((trend) => (
          <MiniTrendCard key={trend.title} trend={trend} />
        ))}
      </div>
      <button
        type="button"
        className="mt-4 flex h-12 w-full items-center justify-center rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold text-blue-600 transition-colors hover:bg-white"
      >
        View All Trends
      </button>
    </section>
  );
}

function Notes() {
  return (
    <section className="rounded-[14px] border border-[#E3E6F0] bg-[#F1F5FA] p-4">
      <h2 className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">Notes</h2>
      <div className="mt-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-base font-medium leading-6 tracking-[0.08px] text-slate-600">
        <ul className="list-disc space-y-1 pl-5">
          <li>Is my phosphorus level improving?</li>
          <li>Should I adjust my fluid goal?</li>
        </ul>
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
            emergency services. Always review lab results and treatment decisions with your
            nephrology provider.
          </p>
        </div>
      </div>
    </aside>
  );
}

export default function LabTrackingPage() {
  return (
    <div className="space-y-6">
      <LatestLabResults />
      <TrendsOverTime />
      <Notes />
      <Disclaimer />
    </div>
  );
}
