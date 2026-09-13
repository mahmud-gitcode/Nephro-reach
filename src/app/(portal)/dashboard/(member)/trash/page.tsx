"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Info,
  Plus,
  ScanLine,
  Stethoscope,
  Trash2,
} from "lucide-react";

// ==================== LAB TRACKING CONTENT ====================

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
  const { dictionary } = useLanguage();
  const t = dictionary?.trash;

  const getLabel = (label: string) => {
    switch (label) {
      case "Dialysis Center":
        return t?.dialysisCenter || label;
      case "Consultants":
        return t?.consultants || label;
      case "Schedule":
        return t?.schedule || label;
      default:
        return label;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {summaryCards.map((card) => (
        <article key={card.label} className="flex h-16 items-center gap-3 rounded-xl bg-[#F1F5FA] px-3 py-2">
          <card.icon className="h-7 w-7 shrink-0 text-slate-800" />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium leading-4 tracking-[0.06px] text-slate-600">
              {getLabel(card.label)}
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
  const { dictionary } = useLanguage();
  const t = dictionary?.trash;
  const isHigh = status === "Slightly High";
  const label = isHigh ? (t?.slightlyHigh || status) : (t?.inRange || status);

  const className =
    isHigh
      ? "bg-amber-100 text-amber-600"
      : "bg-emerald-100 text-emerald-600";

  return (
    <span className={`inline-flex h-6 items-center rounded px-2 text-sm font-semibold tracking-[0.2px] ${className}`}>
      {label}
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

function LabTrackingTab() {
  const { dictionary } = useLanguage();
  const t = dictionary?.trash;
  const chartWidth = 305;
  const chartHeight = 176;

  const tableHeaders = [
    t?.headers?.test || "Test",
    t?.headers?.goalRange || "Goal Range",
    t?.headers?.previous || "Previous (Apr 20)",
    t?.headers?.result || "Result",
    t?.headers?.trend || "Trend",
    t?.headers?.status || "Status",
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[14px] border border-[#E3E6F0] bg-white p-4">
        <SummaryCards />
        <div className="my-6 border-t border-slate-200" />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="text-xl font-medium text-slate-950">
              {t?.latestLabResults || "Latest Lab Results"}
            </h2>
            <Info className="h-5 w-5 text-slate-500" />
            <p className="text-xs text-slate-500">May 4, 2026</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="flex h-11 items-center gap-2 rounded border border-slate-200 bg-[#F9F9F9] px-4 text-sm font-bold text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" /> May 20 <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-11 items-center gap-2 rounded bg-blue-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> {t?.addResult || "Add Result"}
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F1F5FA] text-slate-950">
                <tr>
                  {tableHeaders.map((header) => (
                    <th key={header} className="border-b border-slate-200 px-3 py-3 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-slate-200">
                {labResults.map((result) => (
                  <tr key={result.test}>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-slate-800">{result.test}</p>
                      <p className="text-xs text-slate-500">{result.unit}</p>
                    </td>
                    <td className="px-3 py-2.5 text-slate-800">{result.goal}</td>
                    <td className="px-3 py-2.5 text-slate-800">{result.previous}</td>
                    <td className="px-3 py-2.5 text-slate-800">{result.result}</td>
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

      {/* Trends Over Time */}
      <section className="rounded-[14px] border border-[#E3E6F0] bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium text-slate-950">Trends Over Time</h2>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded border border-slate-200 bg-[#F9F9F9] px-3.5 text-sm font-bold text-slate-950"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          {trendCards.map((trend) => {
            const xFor = (idx: number) => 20 + idx * 38;
            const yFor = (val: number) => 8 + ((8 - val) / 8) * 160;
            const line = trend.values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ");

            return (
              <article key={trend.title} className="rounded-xl border border-[#E3E6F0] bg-white p-3.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-medium text-slate-950">{trend.title}</h3>
                  <p className="text-xs text-slate-500">{trend.unit}</p>
                </div>
                <div className="mt-3 grid h-[180px] grid-cols-[20px_minmax(0,1fr)] gap-2">
                  <div className="flex flex-col justify-between text-right text-xs text-slate-600">
                    {[8, 6, 4, 2, 0].map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </div>
                  <div className="relative overflow-hidden rounded">
                    <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                      <polyline points={line} fill="none" stroke="#2563EB" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ==================== BLOOD RESULTS CONTENT ====================

const latestBloodResults = [
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
];

const bloodHistory = [
  { date: "05/06/2026", label: "Abcd 123 Week12" },
  { date: "04/06/2026", label: "Abcd 123 Week12" },
  { date: "03/06/2026", label: "Abcd 123 Week12" },
];

function BloodResultsTab() {
  const { dictionary } = useLanguage();
  const t = dictionary?.trash;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          className="flex h-11 w-fit items-center gap-2 rounded border border-slate-200 bg-[#F9F9F9] px-4 text-sm font-bold text-slate-950"
        >
          <ScanLine className="h-4 w-4" /> Scan Results
        </button>
        <button
          type="button"
          className="flex h-11 w-fit items-center gap-2 rounded bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> {t?.addResult || "Add Results"}
        </button>
      </header>

      <section className="rounded-[10px] border border-slate-200 bg-[#F1F5FA] p-4">
        <h2 className="text-xl font-medium text-slate-950 mb-3">
          {t?.latestLabResults || "Latest Blood Results"}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {latestBloodResults.map((item) => (
            <article key={item.label} className="rounded-xl border border-[#E3E6F0] bg-white p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">{item.label}</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">{item.value} <span className="text-sm font-normal text-slate-500">{item.unit}</span></p>
              <p className="mt-1 text-xs text-slate-500">{item.normal}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[14px] border border-[#E3E6F0] bg-white p-4">
          <h3 className="text-lg font-medium text-slate-950 mb-3">Lab Goals</h3>
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F1F5FA] text-slate-950">
              <tr>
                <th className="px-3 py-2">Lab</th>
                <th className="px-3 py-2">My Goal</th>
                <th className="px-3 py-2">Current</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {labGoals.map((g) => (
                <tr key={g.lab}>
                  <td className="px-3 py-2">{g.lab}</td>
                  <td className="px-3 py-2">{g.goal}</td>
                  <td className={`px-3 py-2 font-medium ${g.status === "danger" ? "text-red-500" : g.status === "warning" ? "text-amber-600" : "text-emerald-600"}`}>
                    {g.current}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-[14px] border border-[#E3E6F0] bg-white p-4">
          <h3 className="text-lg font-medium text-slate-950 mb-3">
            {t?.testHistory || "Test History"}
          </h3>
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F1F5FA] text-slate-950">
              <tr>
                <th className="px-3 py-2">{t?.headers?.date || "Date"}</th>
                <th className="px-3 py-2">{t?.headers?.label || "Label"}</th>
                <th className="px-3 py-2">{t?.headers?.action || "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {bloodHistory.map((h) => (
                <tr key={h.date}>
                  <td className="px-3 py-2">{h.date}</td>
                  <td className="px-3 py-2">{h.label}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <button type="button" className="p-1 text-slate-600 hover:bg-slate-100 rounded"><Edit3 className="h-4 w-4" /></button>
                    <button type="button" className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ==================== TRASH PAGE CONTAINER ====================

export default function TrashPage() {
  const { dictionary } = useLanguage();
  const t = dictionary?.trash;
  const [activeTab, setActiveTab] = useState<"lab" | "blood">("lab");

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#0F172A] flex items-center gap-2">
            <Trash2 className="h-7 w-7 text-red-500" /> {t?.pageTitle || "Trash (Backup Archives)"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t?.pageDescription || "Archived logs stored here for safety and easy reference."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("lab")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === "lab"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t?.tabs?.labTracking || "Lab Tracking Log"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("blood")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === "blood"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t?.tabs?.bloodResults || "Blood Results"}
          </button>
        </div>
      </header>

      {/* Tab Content */}
      <main className="w-full">
        {activeTab === "lab" ? <LabTrackingTab /> : <BloodResultsTab />}
      </main>
    </div>
  );
}
