"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Apple,
  ArrowDown,
  ArrowUp,
  Bone,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  Droplets,
  Heart,
  Info,
  Layers,
  Plus,
  Sparkles,
  TestTubes,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type TestResult = {
  name: string;
  latestResult: string;
  previousResult: string;
  change: string;
  changeDirection: "up" | "down";
  changeColor: "red" | "green" | "orange";
  refRange: string;
  status: "In Range" | "High" | "Low";
  sparkline: number[];
};

type CategoryGroup = {
  id: string;
  name: string;
  icon: IconType;
  tests: TestResult[];
};

const categoriesData: CategoryGroup[] = [
  {
    id: "kidney-function",
    name: "KIDNEY FUNCTION",
    icon: Activity,
    tests: [
      {
        name: "BUN",
        latestResult: "48 mg/dL",
        previousResult: "46 mg/dL",
        change: "2",
        changeDirection: "up",
        changeColor: "red",
        refRange: "7 – 20 mg/dL",
        status: "High",
        sparkline: [35, 38, 42, 46, 48],
      },
      {
        name: "Creatinine",
        latestResult: "6.48 mg/dL",
        previousResult: "6.12 mg/dL",
        change: "0.36",
        changeDirection: "up",
        changeColor: "red",
        refRange: "0.6 – 1.3 mg/dL",
        status: "High",
        sparkline: [5.2, 5.5, 5.8, 6.12, 6.48],
      },
      {
        name: "eGFR (CKD-EPI)",
        latestResult: "9 mL/min/1.73m²",
        previousResult: "10 mL/min/1.73m²",
        change: "1",
        changeDirection: "down",
        changeColor: "red",
        refRange: "> 90 mL/min/1.73m²",
        status: "Low",
        sparkline: [12, 11, 11, 10, 9],
      },
    ],
  },
  {
    id: "electrolytes",
    name: "ELECTROLYTES",
    icon: Droplets,
    tests: [
      {
        name: "Sodium",
        latestResult: "138 mEq/L",
        previousResult: "137 mEq/L",
        change: "1",
        changeDirection: "up",
        changeColor: "green",
        refRange: "135 – 145 mEq/L",
        status: "In Range",
        sparkline: [136, 136, 137, 137, 138],
      },
      {
        name: "Potassium",
        latestResult: "5.2 mEq/L",
        previousResult: "5.0 mEq/L",
        change: "0.2",
        changeDirection: "up",
        changeColor: "orange",
        refRange: "3.5 – 5.0 mEq/L",
        status: "High",
        sparkline: [4.6, 4.8, 4.9, 5.0, 5.2],
      },
      {
        name: "Chloride",
        latestResult: "99 mEq/L",
        previousResult: "101 mEq/L",
        change: "2",
        changeDirection: "down",
        changeColor: "green",
        refRange: "98 – 107 mEq/L",
        status: "In Range",
        sparkline: [102, 101, 100, 101, 99],
      },
      {
        name: "CO2 (Bicarbonate)",
        latestResult: "22 mEq/L",
        previousResult: "23 mEq/L",
        change: "1",
        changeDirection: "down",
        changeColor: "green",
        refRange: "22 – 29 mEq/L",
        status: "In Range",
        sparkline: [24, 23, 23, 23, 22],
      },
    ],
  },
  {
    id: "mineral-bone",
    name: "MINERAL & BONE",
    icon: Bone,
    tests: [
      {
        name: "Calcium",
        latestResult: "9.1 mg/dL",
        previousResult: "9.3 mg/dL",
        change: "0.2",
        changeDirection: "down",
        changeColor: "green",
        refRange: "8.5 – 10.5 mg/dL",
        status: "In Range",
        sparkline: [9.4, 9.3, 9.2, 9.3, 9.1],
      },
      {
        name: "Phosphorus",
        latestResult: "5.6 mg/dL",
        previousResult: "5.3 mg/dL",
        change: "0.3",
        changeDirection: "up",
        changeColor: "red",
        refRange: "2.5 – 4.5 mg/dL",
        status: "High",
        sparkline: [4.8, 5.0, 5.1, 5.3, 5.6],
      },
      {
        name: "PTH (Intact)",
        latestResult: "412 pg/mL",
        previousResult: "386 pg/mL",
        change: "26",
        changeDirection: "up",
        changeColor: "red",
        refRange: "15 – 65 pg/mL",
        status: "High",
        sparkline: [340, 360, 375, 386, 412],
      },
      {
        name: "Vitamin D 25-OH",
        latestResult: "28 ng/mL",
        previousResult: "27 ng/mL",
        change: "1",
        changeDirection: "up",
        changeColor: "orange",
        refRange: "30 – 100 ng/mL",
        status: "Low",
        sparkline: [24, 25, 26, 27, 28],
      },
    ],
  },
  {
    id: "blood-counts",
    name: "BLOOD COUNTS",
    icon: Droplets,
    tests: [
      {
        name: "Hemoglobin",
        latestResult: "10.2 g/dL",
        previousResult: "10.0 g/dL",
        change: "0.2",
        changeDirection: "up",
        changeColor: "orange",
        refRange: "11.0 – 16.0 g/dL",
        status: "Low",
        sparkline: [9.5, 9.7, 9.8, 10.0, 10.2],
      },
      {
        name: "Hematocrit",
        latestResult: "31 %",
        previousResult: "30 %",
        change: "1",
        changeDirection: "up",
        changeColor: "orange",
        refRange: "33 – 47 %",
        status: "Low",
        sparkline: [28, 29, 29, 30, 31],
      },
      {
        name: "Ferritin",
        latestResult: "456 ng/mL",
        previousResult: "438 ng/mL",
        change: "18",
        changeDirection: "up",
        changeColor: "red",
        refRange: "30 – 400 ng/mL",
        status: "High",
        sparkline: [410, 420, 430, 438, 456],
      },
      {
        name: "Iron Saturation (TSAT)",
        latestResult: "28 %",
        previousResult: "26 %",
        change: "2",
        changeDirection: "up",
        changeColor: "green",
        refRange: "20 – 50 %",
        status: "In Range",
        sparkline: [23, 24, 25, 26, 28],
      },
    ],
  },
  {
    id: "nutrition",
    name: "NUTRITION",
    icon: Apple,
    tests: [
      {
        name: "Albumin",
        latestResult: "3.8 g/dL",
        previousResult: "3.7 g/dL",
        change: "0.1",
        changeDirection: "up",
        changeColor: "green",
        refRange: "3.5 – 5.0 g/dL",
        status: "In Range",
        sparkline: [3.5, 3.6, 3.6, 3.7, 3.8],
      },
      {
        name: "Bicarbonate",
        latestResult: "22 mEq/L",
        previousResult: "23 mEq/L",
        change: "1",
        changeDirection: "down",
        changeColor: "green",
        refRange: "22 – 29 mEq/L",
        status: "In Range",
        sparkline: [24, 23, 23, 23, 22],
      },
    ],
  },
  {
    id: "dialysis-adequacy",
    name: "DIALYSIS ADEQUACY",
    icon: Heart,
    tests: [
      {
        name: "Kt/V",
        latestResult: "1.35",
        previousResult: "1.30",
        change: "0.05",
        changeDirection: "up",
        changeColor: "green",
        refRange: "≥ 1.20",
        status: "In Range",
        sparkline: [1.22, 1.25, 1.28, 1.30, 1.35],
      },
    ],
  },
];

function Sparkline({ data, status }: { data: number[]; status: "In Range" | "High" | "Low" }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const strokeColor =
    status === "In Range" ? "#16A34A" : status === "High" ? "#DC2626" : "#EA580C";

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * 64 + 4;
      const y = 20 - ((val - min) / range) * 14;
      return `${x},${y}`;
    })
    .join(" ");

  const lastIndex = data.length - 1;
  const lastX = 68;
  const lastY = 20 - ((data[lastIndex] - min) / range) * 14;

  return (
    <svg className="h-6 w-20 overflow-visible shrink-0">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle cx={lastX} cy={lastY} r="3" fill={strokeColor} />
    </svg>
  );
}

function StatusBadge({ status }: { status: "In Range" | "High" | "Low" }) {
  if (status === "In Range") {
    return (
      <span className="inline-flex items-center rounded-md bg-[#DCFCE7] px-2.5 py-1 text-xs font-semibold text-[#15803D]">
        In Range
      </span>
    );
  }
  if (status === "High") {
    return (
      <span className="inline-flex items-center rounded-md bg-[#FEE2E2] px-2.5 py-1 text-xs font-semibold text-[#DC2626]">
        High
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md bg-[#FFEDD5] px-2.5 py-1 text-xs font-semibold text-[#C2410C]">
      Low
    </span>
  );
}

const pastDrawDates = [
  { id: "2024-04-30", label: "Apr 30, 2024 (Prev Draw)" },
  { id: "2024-03-15", label: "Mar 15, 2024 (2 Mo Ago)" },
  { id: "2024-02-01", label: "Feb 01, 2024 (3 Mo Ago)" },
  { id: "2024-01-10", label: "Jan 10, 2024 (4 Mo Ago)" },
];

export default function MyLabsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "history">("overview");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [compareDateId, setCompareDateId] = useState<string>("2024-04-30");
  const [customData, setCustomData] = useState<{ date?: string; values?: { [key: string]: string } } | null>(null);
  const [expandedHistoryIdx, setExpandedHistoryIdx] = useState<number | null>(0);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("nr_custom_lab_results");
      if (saved) {
        setCustomData(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const selectedPastDateLabel =
    pastDrawDates.find((d) => d.id === compareDateId)?.label.split(" (")[0] || "Apr 30, 2024";

  const latestDrawDate = customData?.date
    ? new Date(customData.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "May 31, 2024";

  const mergedCategories = categoriesData.map((cat) => ({
    ...cat,
    tests: cat.tests.map((test) => {
      if (customData?.values && customData.values[test.name]) {
        const rawVal = customData.values[test.name];
        const unitParts = test.latestResult.split(" ");
        const unit = unitParts.length > 1 ? unitParts.slice(1).join(" ") : "";
        const formatted = rawVal.includes(" ") || !unit ? rawVal : `${rawVal} ${unit}`;
        return {
          ...test,
          latestResult: formatted,
        };
      }
      return test;
    }),
  }));

  const filteredCategories =
    selectedCategory === "all"
      ? mergedCategories
      : mergedCategories.filter((cat) => cat.id === selectedCategory);

  return (
    <div className="w-full space-y-6">
      {/* 1. Top KPI Summary Cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Card 1: Latest Lab Date */}
        <article className="flex items-center gap-3.5 rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">Latest Lab Date</p>
            <p className="text-sm font-bold text-slate-900 truncate">{latestDrawDate}</p>
          </div>
        </article>

        {/* Card 2: Lab Tests Tracked */}
        <article className="flex items-center gap-3.5 rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <TestTubes className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">Tests Tracked</p>
            <p className="text-xl font-bold text-slate-900">25</p>
          </div>
        </article>

        {/* Card 3: Values In Range */}
        <article className="flex items-center gap-3.5 rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-slate-500">In Range</p>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">64%</span>
            </div>
            <p className="text-xl font-bold text-slate-900">16 / 25</p>
          </div>
        </article>

        {/* Card 4: Values Out of Range */}
        <article className="flex items-center gap-3.5 rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-slate-500">Out of Range</p>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">24%</span>
            </div>
            <p className="text-xl font-bold text-slate-900">6 / 25</p>
          </div>
        </article>

        {/* Card 5: Trending Up */}
        <article className="flex items-center gap-3.5 rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">Trending Up</p>
            <p className="text-xl font-bold text-slate-900">7</p>
          </div>
        </article>

        {/* Card 6: Trending Down */}
        <article className="flex items-center gap-3.5 rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">Trending Down</p>
            <p className="text-xl font-bold text-slate-900">5</p>
          </div>
        </article>
      </section>

      {/* 2. Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`pb-3 text-base font-semibold transition-colors border-b-2 ${activeTab === "overview"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            Lab Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("trends")}
            className={`pb-3 text-base font-semibold transition-colors border-b-2 ${activeTab === "trends"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            Trends
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`pb-3 text-base font-semibold transition-colors border-b-2 ${activeTab === "history"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            History
          </button>
        </nav>
      </div>

      {/* 3. Main Grid Layout (Left Content + Right Sidebar) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        {/* Left Column (Table Area) */}
        <div className="xl:col-span-3 space-y-4">
          {/* TAB 1: OVERVIEW & COMPARE VIEW */}
          {activeTab === "overview" && (
            <>
              {/* Same Row: Category Filter & Compare Date (Left) + Action Buttons (Right) */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Left Controls Group */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Category Filter Dropdown */}
                  <select
                    id="cat-filter"
                    aria-label="Filter by category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none shadow-sm focus:border-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="kidney-function">Kidney Function</option>
                    <option value="electrolytes">Electrolytes</option>
                    <option value="mineral-bone">Mineral & Bone</option>
                    <option value="blood-counts">Blood Counts</option>
                    <option value="nutrition">Nutrition</option>
                    <option value="dialysis-adequacy">Dialysis Adequacy</option>
                  </select>

                  {/* Compare With Date Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-500">Compare With:</span>
                    <select
                      id="compare-date-select"
                      aria-label="Select comparison lab date"
                      value={compareDateId}
                      onChange={(e) => setCompareDateId(e.target.value)}
                      className="h-9 rounded-lg border border-blue-200 bg-blue-50/50 px-3 text-xs font-semibold text-blue-700 outline-none shadow-sm focus:border-blue-500"
                    >
                      {pastDrawDates.map((date) => (
                        <option key={date.id} value={date.id}>
                          {date.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export PDF
                  </button>

                  <Link
                    href="/dashboard/personal-log/lab-tracking/add"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Lab Result
                  </Link>
                </div>
              </div>

              {/* Grouped Table */}
              <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#F8FAFC] text-xs font-semibold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 min-w-[200px]">Test</th>
                        <th className="px-4 py-3 min-w-[140px] bg-[#EFF6FF] border-l border-r border-blue-100 font-bold text-slate-900">
                          Latest Result <span className="block text-[12px] font-normal text-slate-500">{latestDrawDate}</span>
                        </th>
                        <th className="px-4 py-3 min-w-[140px] bg-[#EFF6FF] border-r border-blue-100 font-bold text-slate-900">
                          Previous Result <span className="block text-[12px] font-semibold text-blue-600">{selectedPastDateLabel}</span>
                        </th>
                        <th className="px-4 py-3 min-w-[100px]">Change</th>
                        <th className="px-4 py-3 min-w-[150px]">Reference Range</th>
                        <th className="px-4 py-3 min-w-[100px]">Status</th>
                        <th className="px-4 py-3 min-w-[120px]">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCategories.map((category) => (
                        <React.Fragment key={category.id}>
                          {/* Category Header Row */}
                          <tr className="bg-[#F1F5FA]">
                            <td colSpan={7} className="px-4 py-2.5">
                              <div className="flex items-center gap-2 font-bold text-xs text-[#06265B] tracking-wider">
                                <category.icon className="h-4 w-4 text-blue-600" />
                                {category.name}
                              </div>
                            </td>
                          </tr>

                          {/* Category Test Rows */}
                          {category.tests.map((test) => (
                            <tr key={test.name} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-4 py-3 font-semibold text-slate-900">{test.name}</td>
                              <td className="px-4 py-3 font-semibold text-slate-900 bg-[#F0F9FF]/80 border-l border-r border-blue-100/60">{test.latestResult}</td>
                              <td className="px-4 py-3 font-medium text-slate-800 bg-[#F0F9FF]/80 border-r border-blue-100/60">{test.previousResult}</td>
                              <td className="px-4 py-3 font-semibold text-xs">
                                <span
                                  className={`inline-flex items-center gap-0.5 ${test.changeColor === "red"
                                    ? "text-red-600"
                                    : test.changeColor === "orange"
                                      ? "text-amber-600"
                                      : "text-emerald-600"
                                    }`}
                                >
                                  {test.changeDirection === "up" ? (
                                    <ArrowUp className="h-3.5 w-3.5" />
                                  ) : (
                                    <ArrowDown className="h-3.5 w-3.5" />
                                  )}
                                  {test.change}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs font-medium text-slate-600">{test.refRange}</td>
                              <td className="px-4 py-3">
                                <StatusBadge status={test.status} />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Sparkline data={test.sparkline} status={test.status} />
                                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-[11px] font-medium text-slate-500">
                  * Reference ranges may vary slightly by lab. Always follow your healthcare team&apos;s guidance.
                </div>
              </div>
            </>
          )}

          {/* TAB 2: TRENDS VIEW */}
          {activeTab === "trends" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    Lab Longitudinal Trends & Analysis
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track long-term trajectory of your critical kidney & electrolyte markers over time.
                  </p>
                </div>
                <Link
                  href="/dashboard/personal-log/lab-tracking/add"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Lab Result
                </Link>
              </div>

              {/* Trend Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trend Card 1: Kidney Function */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-blue-600" />
                      eGFR Trajectory (CKD Stage)
                    </span>
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">Low / Stage 5</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">9 <span className="text-xs font-semibold text-slate-500">mL/min/1.73m²</span></p>
                  <div className="h-16 flex items-end gap-2 bg-slate-50 p-2 rounded-lg">
                    {[12, 11, 11, 10, 9].map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-blue-500 rounded-t" style={{ height: `${val * 4}px` }} />
                        <span className="text-[9px] font-bold text-slate-500">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trend Card 2: Creatinine */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-blue-600" />
                      Serum Creatinine Trend
                    </span>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">High (6.48)</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">6.48 <span className="text-xs font-semibold text-slate-500">mg/dL</span></p>
                  <div className="h-16 flex items-end gap-2 bg-slate-50 p-2 rounded-lg">
                    {[5.2, 5.5, 5.8, 6.12, 6.48].map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-amber-500 rounded-t" style={{ height: `${val * 8}px` }} />
                        <span className="text-[9px] font-bold text-slate-500">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEDICATED HISTORY VIEW */}
          {activeTab === "history" && (
            <div className="space-y-6">
              {/* History Header & Search */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    Past Lab Draw History Logs
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    View complete historical lab panel reports and chronological records.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export Full History
                  </button>
                  <Link
                    href="/dashboard/personal-log/lab-tracking/add"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Lab Result
                  </Link>
                </div>
              </div>

              {/* Historical Panels Timeline List */}
              <div className="space-y-4">
                {[
                  {
                    date: latestDrawDate,
                    tag: "Latest Draw",
                    tagColor: "bg-emerald-500 text-white",
                    inRange: 16,
                    outRange: 6,
                    egfr: "9",
                    cr: "6.48",
                    bun: "48",
                    k: "5.2",
                    phos: "5.6",
                    hgb: "10.2",
                    detailedTests: [
                      { category: "KIDNEY FUNCTION", tests: [{ name: "BUN", val: "48 mg/dL", ref: "7 – 20 mg/dL", status: "High" }, { name: "Creatinine", val: "6.48 mg/dL", ref: "0.6 – 1.3 mg/dL", status: "High" }, { name: "eGFR (CKD-EPI)", val: "9 mL/min", ref: "> 90 mL/min", status: "Low" }] },
                      { category: "ELECTROLYTES", tests: [{ name: "Sodium", val: "138 mEq/L", ref: "135 – 145 mEq/L", status: "In Range" }, { name: "Potassium", val: "5.2 mEq/L", ref: "3.5 – 5.0 mEq/L", status: "High" }, { name: "Chloride", val: "99 mEq/L", ref: "98 – 107 mEq/L", status: "In Range" }, { name: "CO2 (Bicarbonate)", val: "22 mEq/L", ref: "22 – 29 mEq/L", status: "In Range" }] },
                      { category: "MINERAL & BONE", tests: [{ name: "Calcium", val: "9.1 mg/dL", ref: "8.5 – 10.5 mg/dL", status: "In Range" }, { name: "Phosphorus", val: "5.6 mg/dL", ref: "2.5 – 4.5 mg/dL", status: "High" }, { name: "PTH (Intact)", val: "412 pg/mL", ref: "15 – 65 pg/mL", status: "High" }, { name: "Vitamin D 25-OH", val: "28 ng/mL", ref: "30 – 100 ng/mL", status: "Low" }] },
                      { category: "BLOOD COUNTS", tests: [{ name: "Hemoglobin", val: "10.2 g/dL", ref: "11.0 – 16.0 g/dL", status: "Low" }, { name: "Hematocrit", val: "31 %", ref: "33 – 47 %", status: "Low" }, { name: "Ferritin", val: "456 ng/mL", ref: "30 – 400 ng/mL", status: "High" }, { name: "TSAT", val: "28 %", ref: "20 – 50 %", status: "In Range" }] },
                    ],
                  },
                  {
                    date: "Apr 30, 2024",
                    tag: "Previous Draw",
                    tagColor: "bg-blue-600 text-white",
                    inRange: 17,
                    outRange: 5,
                    egfr: "10",
                    cr: "6.12",
                    bun: "46",
                    k: "5.0",
                    phos: "5.3",
                    hgb: "10.0",
                    detailedTests: [
                      { category: "KIDNEY FUNCTION", tests: [{ name: "BUN", val: "46 mg/dL", ref: "7 – 20 mg/dL", status: "High" }, { name: "Creatinine", val: "6.12 mg/dL", ref: "0.6 – 1.3 mg/dL", status: "High" }, { name: "eGFR (CKD-EPI)", val: "10 mL/min", ref: "> 90 mL/min", status: "Low" }] },
                      { category: "ELECTROLYTES", tests: [{ name: "Sodium", val: "139 mEq/L", ref: "135 – 145 mEq/L", status: "In Range" }, { name: "Potassium", val: "5.0 mEq/L", ref: "3.5 – 5.0 mEq/L", status: "In Range" }, { name: "Chloride", val: "100 mEq/L", ref: "98 – 107 mEq/L", status: "In Range" }, { name: "CO2 (Bicarbonate)", val: "23 mEq/L", ref: "22 – 29 mEq/L", status: "In Range" }] },
                      { category: "MINERAL & BONE", tests: [{ name: "Calcium", val: "9.2 mg/dL", ref: "8.5 – 10.5 mg/dL", status: "In Range" }, { name: "Phosphorus", val: "5.3 mg/dL", ref: "2.5 – 4.5 mg/dL", status: "High" }, { name: "PTH (Intact)", val: "395 pg/mL", ref: "15 – 65 pg/mL", status: "High" }] },
                      { category: "BLOOD COUNTS", tests: [{ name: "Hemoglobin", val: "10.0 g/dL", ref: "11.0 – 16.0 g/dL", status: "Low" }, { name: "Hematocrit", val: "30 %", ref: "33 – 47 %", status: "Low" }] },
                    ],
                  },
                  {
                    date: "Mar 15, 2024",
                    tag: "2 Months Ago",
                    tagColor: "bg-slate-100 text-slate-700 border border-slate-200",
                    inRange: 18,
                    outRange: 4,
                    egfr: "11",
                    cr: "5.80",
                    bun: "42",
                    k: "4.9",
                    phos: "5.1",
                    hgb: "9.8",
                    detailedTests: [
                      { category: "KIDNEY FUNCTION", tests: [{ name: "BUN", val: "42 mg/dL", ref: "7 – 20 mg/dL", status: "High" }, { name: "Creatinine", val: "5.80 mg/dL", ref: "0.6 – 1.3 mg/dL", status: "High" }, { name: "eGFR (CKD-EPI)", val: "11 mL/min", ref: "> 90 mL/min", status: "Low" }] },
                      { category: "ELECTROLYTES", tests: [{ name: "Sodium", val: "140 mEq/L", ref: "135 – 145 mEq/L", status: "In Range" }, { name: "Potassium", val: "4.9 mEq/L", ref: "3.5 – 5.0 mEq/L", status: "In Range" }] },
                      { category: "MINERAL & BONE", tests: [{ name: "Calcium", val: "9.3 mg/dL", ref: "8.5 – 10.5 mg/dL", status: "In Range" }, { name: "Phosphorus", val: "5.1 mg/dL", ref: "2.5 – 4.5 mg/dL", status: "High" }] },
                    ],
                  },
                  {
                    date: "Feb 01, 2024",
                    tag: "3 Months Ago",
                    tagColor: "bg-slate-100 text-slate-700 border border-slate-200",
                    inRange: 19,
                    outRange: 3,
                    egfr: "11",
                    cr: "5.50",
                    bun: "38",
                    k: "4.8",
                    phos: "5.0",
                    hgb: "9.7",
                    detailedTests: [
                      { category: "KIDNEY FUNCTION", tests: [{ name: "BUN", val: "38 mg/dL", ref: "7 – 20 mg/dL", status: "High" }, { name: "Creatinine", val: "5.50 mg/dL", ref: "0.6 – 1.3 mg/dL", status: "High" }, { name: "eGFR (CKD-EPI)", val: "11 mL/min", ref: "> 90 mL/min", status: "Low" }] },
                      { category: "ELECTROLYTES", tests: [{ name: "Sodium", val: "141 mEq/L", ref: "135 – 145 mEq/L", status: "In Range" }, { name: "Potassium", val: "4.8 mEq/L", ref: "3.5 – 5.0 mEq/L", status: "In Range" }] },
                    ],
                  },
                  {
                    date: "Jan 10, 2024",
                    tag: "4 Months Ago",
                    tagColor: "bg-slate-100 text-slate-700 border border-slate-200",
                    inRange: 20,
                    outRange: 2,
                    egfr: "12",
                    cr: "5.20",
                    bun: "35",
                    k: "4.6",
                    phos: "4.8",
                    hgb: "9.5",
                    detailedTests: [
                      { category: "KIDNEY FUNCTION", tests: [{ name: "BUN", val: "35 mg/dL", ref: "7 – 20 mg/dL", status: "High" }, { name: "Creatinine", val: "5.20 mg/dL", ref: "0.6 – 1.3 mg/dL", status: "High" }, { name: "eGFR (CKD-EPI)", val: "12 mL/min", ref: "> 90 mL/min", status: "Low" }] },
                    ],
                  },
                ].map((draw, idx) => {
                  const isExpanded = expandedHistoryIdx === idx;
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border bg-white shadow-sm transition-all overflow-hidden ${isExpanded ? "border-blue-400 ring-1 ring-blue-400" : "border-slate-200 hover:border-blue-200"
                        }`}
                    >
                      {/* Card Header Bar */}
                      <div
                        onClick={() => setExpandedHistoryIdx(isExpanded ? null : idx)}
                        className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100 cursor-pointer bg-white hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-sm font-bold text-slate-900">{draw.date}</h3>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${draw.tagColor}`}>
                            {draw.tag}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${isExpanded
                              ? "border-blue-300 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                              }`}
                          >
                            {isExpanded ? "Hide Values ▲" : "View Values ▾"}
                          </button>
                        </div>
                      </div>

                      {/* Summary Key Readings Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 bg-slate-50/80 p-3 text-xs border-b border-slate-100">
                        <div>
                          <span className="block text-[12px] font-semibold text-slate-500">eGFR</span>
                          <span className="font-bold text-slate-900">{draw.egfr} <span className="text-[9px] text-slate-500 font-normal">mL/min</span></span>
                        </div>
                        <div>
                          <span className="block text-[12px] font-semibold text-slate-500">Creatinine</span>
                          <span className="font-bold text-slate-900">{draw.cr} <span className="text-[9px] text-slate-500 font-normal">mg/dL</span></span>
                        </div>
                        <div>
                          <span className="block text-[12px] font-semibold text-slate-500">BUN</span>
                          <span className="font-bold text-slate-900">{draw.bun} <span className="text-[9px] text-slate-500 font-normal">mg/dL</span></span>
                        </div>
                        <div>
                          <span className="block text-[12px] font-semibold text-slate-500">Potassium</span>
                          <span className="font-bold text-slate-900">{draw.k} <span className="text-[9px] text-slate-500 font-normal">mEq/L</span></span>
                        </div>
                        <div>
                          <span className="block text-[12px] font-semibold text-slate-500">Phosphorus</span>
                          <span className="font-bold text-slate-900">{draw.phos} <span className="text-[9px] text-slate-500 font-normal">mg/dL</span></span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-semibold text-slate-500">Hemoglobin</span>
                          <span className="font-bold text-slate-900">{draw.hgb} <span className="text-[9px] text-slate-500 font-normal">g/dL</span></span>
                        </div>
                      </div>

                      {/* EXPANDED DETAILED LAB VALUE TABLE BREAKDOWN */}
                      {isExpanded && (
                        <div className="p-4 bg-white space-y-4">
                          <div className="space-y-4">
                            {draw.detailedTests.map((group, gIdx) => (
                              <div key={gIdx} className="rounded-lg border border-slate-200 overflow-hidden">
                                <div className="bg-[#F1F5FA] px-3.5 py-2 text-xs font-bold text-[#06265B] tracking-wider border-b border-slate-200">
                                  {group.category}
                                </div>
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                    <tr>
                                      <th className="px-3.5 py-2">Test</th>
                                      <th className="px-3.5 py-2">Recorded Value</th>
                                      <th className="px-3.5 py-2">Reference Range</th>
                                      <th className="px-3.5 py-2">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {group.tests.map((t, tIdx) => (
                                      <tr key={tIdx} className="hover:bg-slate-50">
                                        <td className="px-3.5 py-2 font-semibold text-slate-900">{t.name}</td>
                                        <td className="px-3.5 py-2 font-bold text-slate-900">{t.val}</td>
                                        <td className="px-3.5 py-2 text-slate-500">{t.ref}</td>
                                        <td className="px-3.5 py-2">
                                          <StatusBadge status={t.status as "High" | "In Range" | "Low"} />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {/* Card 1: Latest Lab Summary */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                LATEST LAB SUMMARY
              </h2>
              <Info className="h-4 w-4 text-slate-400" />
            </div>

            {/* 3 Pill Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-emerald-50 p-2.5 text-center">
                <p className="text-xl font-bold text-emerald-600">16</p>
                <p className="text-[11px] font-medium text-emerald-700">In Range</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2.5 text-center">
                <p className="text-xl font-bold text-amber-600">6</p>
                <p className="text-[11px] font-medium text-amber-700">High</p>
              </div>
              <div className="rounded-lg bg-red-50 p-2.5 text-center">
                <p className="text-xl font-bold text-red-600">3</p>
                <p className="text-[11px] font-medium text-red-700">Low</p>
              </div>
            </div>

            {/* Encouragement Box */}
            <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-3.5 space-y-2">
              <p className="text-xs font-bold text-blue-950">Keep up the good work!</p>
              <p className="text-xs text-blue-800 leading-relaxed">
                Continue following your care plan and attend your dialysis treatments.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("trends")}
                className="w-full mt-2 rounded-lg border border-blue-200 bg-white py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
              >
                View Trends
              </button>
            </div>
          </div>

          {/* Card 2: Lab Categories */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
              LAB CATEGORIES
            </h2>
            <div className="space-y-1">
              {[
                { name: "Kidney Function", count: "3 Tests", icon: Activity, key: "kidney-function" },
                { name: "Electrolytes", count: "4 Tests", icon: Droplets, key: "electrolytes" },
                { name: "Mineral & Bone", count: "4 Tests", icon: Bone, key: "mineral-bone" },
                { name: "Blood Counts", count: "4 Tests", icon: Droplets, key: "blood-counts" },
                { name: "Nutrition", count: "2 Tests", icon: Apple, key: "nutrition" },
                { name: "Dialysis Adequacy", count: "1 Test", icon: Heart, key: "dialysis-adequacy" },
                { name: "Other", count: "7 Tests", icon: Layers, key: "all" },
              ].map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${selectedCategory === cat.key
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <cat.icon className="h-3.5 w-3.5 text-slate-500" />
                    {cat.name}
                  </span>
                  <span className="text-[11px] text-slate-400">{cat.count}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className="w-full mt-2 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              View All Trends
            </button>
          </div>

          {/* Card 3: Understanding Your Labs */}
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-indigo-50/70 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <BookOpen className="h-4 w-4" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                UNDERSTANDING YOUR LABS
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Learn what your lab numbers mean and how they affect your health.
            </p>
            <Link
              href="/dashboard/education-center"
              className="block w-full text-center rounded-lg border border-blue-200 bg-white py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
            >
              Visit Education Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
