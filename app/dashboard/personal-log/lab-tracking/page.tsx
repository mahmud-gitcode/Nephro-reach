"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronDown,
  Download,
  Info,
  Plus,
} from "lucide-react";

import { GiKidneys } from "react-icons/gi";
import {
  FaFlask,
  FaBone,
  FaDroplet,
  FaAppleWhole,
  FaHeartPulse,
  FaLayerGroup,
  FaCalendarDays,
  FaCircleCheck,
  FaTriangleExclamation,
  FaArrowTrendUp,
  FaArrowTrendDown,
} from "react-icons/fa6";
import { useLanguage } from "@/context/LanguageContext";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type TestResult = {
  id: string;
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
    icon: GiKidneys,
    tests: [
      {
        id: "bun",
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
        id: "creatinine",
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
        id: "egfr",
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
    icon: FaFlask,
    tests: [
      {
        id: "sodium",
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
        id: "potassium",
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
        id: "chloride",
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
        id: "co2",
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
    icon: FaBone,
    tests: [
      {
        id: "calcium",
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
        id: "phosphorus",
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
        id: "pth",
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
        id: "vitamind",
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
    icon: FaDroplet,
    tests: [
      {
        id: "hemoglobin",
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
        id: "hematocrit",
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
        id: "ferritin",
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
        id: "tsat",
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
    icon: FaAppleWhole,
    tests: [
      {
        id: "albumin",
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
        id: "bicarbonate",
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
    icon: FaHeartPulse,
    tests: [
      {
        id: "ktv",
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

function Sparkline({
  data,
  status,
}: {
  data: number[];
  status: "In Range" | "High" | "Low";
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const strokeColor =
    status === "In Range"
      ? "#16A34A"
      : status === "High"
      ? "#DC2626"
      : "#EA580C";

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

function StatusBadge({
  status,
  label,
}: {
  status: "In Range" | "High" | "Low";
  label?: string;
}) {
  if (status === "In Range") {
    return (
      <span className="inline-flex items-center rounded-md bg-[#DCFCE7] px-2.5 py-1 text-xs font-semibold text-[#15803D]">
        {label || "In Range"}
      </span>
    );
  }
  if (status === "High") {
    return (
      <span className="inline-flex items-center rounded-md bg-[#FEE2E2] px-2.5 py-1 text-xs font-semibold text-[#DC2626]">
        {label || "High"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md bg-[#FFEDD5] px-2.5 py-1 text-xs font-semibold text-[#C2410C]">
      {label || "Low"}
    </span>
  );
}

function TrendLineCard({
  testName,
  unit,
  data,
  dates,
  colorTheme = "purple",
  refRangeLabel,
  latestLabel,
}: {
  testName: string;
  unit: string;
  data: number[];
  dates: string[];
  colorTheme?: "purple" | "green" | "orange" | "blue" | "rose" | "teal";
  refRangeLabel?: string;
  latestLabel?: string;
}) {
  const themeMap = {
    purple: { stroke: "#8B5CF6" },
    green: { stroke: "#10B981" },
    orange: { stroke: "#F59E0B" },
    blue: { stroke: "#3B82F6" },
    rose: { stroke: "#F43F5E" },
    teal: { stroke: "#14B8A6" },
  };

  const theme = themeMap[colorTheme] || themeMap.purple;

  const width = 300;
  const height = 150;
  const paddingLeft = 24;
  const paddingRight = 12;
  const paddingTop = 14;
  const paddingBottom = 22;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const maxValRaw = Math.max(...data);
  let yMax = 8;
  if (maxValRaw > 300) yMax = 500;
  else if (maxValRaw > 100) yMax = 160;
  else if (maxValRaw > 50) yMax = 60;
  else if (maxValRaw > 20) yMax = 35;
  else if (maxValRaw > 8) yMax = 15;
  else if (maxValRaw <= 2) yMax = 2;

  const yMin = 0;
  const yRange = yMax - yMin || 1;

  const getX = (idx: number) =>
    paddingLeft + (idx / (data.length - 1)) * chartW;
  const getY = (val: number) =>
    paddingTop + chartH - ((val - yMin) / yRange) * chartH;

  const pointsStr = data
    .map((val, idx) => `${getX(idx)},${getY(val)}`)
    .join(" ");

  const latestVal = data[data.length - 1];
  const lastX = getX(data.length - 1);
  const lastY = getY(latestVal);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-slate-900">{testName}</h4>
          <p className="text-xs text-slate-500">
            {refRangeLabel || "Ref Range"}:{" "}
            {unit ? `(${unit})` : ""}
          </p>
        </div>
        <div className="text-right">
          <span className="text-base font-bold text-slate-900">
            {latestVal} {unit}
          </span>
          <span className="block text-[11px] font-medium text-slate-400">
            {latestLabel || "Latest"}
          </span>
        </div>
      </div>

      <div className="w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-28 overflow-visible"
        >
          {[0, 0.5, 1].map((ratio, i) => {
            const y = paddingTop + chartH * ratio;
            return (
              <line
                key={i}
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#F1F5F9"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            );
          })}

          <polyline
            fill="none"
            stroke={theme.stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsStr}
          />

          {data.map((val, idx) => (
            <circle
              key={idx}
              cx={getX(idx)}
              cy={getY(val)}
              r="3"
              fill="white"
              stroke={theme.stroke}
              strokeWidth="2"
            />
          ))}

          <circle cx={lastX} cy={lastY} r="4.5" fill={theme.stroke} />

          <text
            x={paddingLeft}
            y={height - 3}
            textAnchor="start"
            className="fill-slate-400 text-xs font-medium"
          >
            {dates[0]}
          </text>
          <text
            x={width - paddingRight}
            y={height - 3}
            textAnchor="end"
            className="fill-slate-400 text-xs font-medium"
          >
            {dates[dates.length - 1]}
          </text>
        </svg>
      </div>
    </div>
  );
}

export default function MyLabsPage() {
  const { language, dictionary } = useLanguage();
  const l = dictionary?.labTracking;

  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "history">(
    "overview"
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [compareDateId, setCompareDateId] = useState<string>("2024-04-30");
  const [customData, setCustomData] = useState<{
    date?: string;
    values?: { [key: string]: string };
    notes?: string;
  } | null>(null);
  const [expandedHistoryIdx, setExpandedHistoryIdx] = useState<number | null>(
    0
  );

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

  const pastDrawDates = [
    {
      id: "2024-04-30",
      label: language === "ES" ? "30 Abr, 2024" : "Apr 30, 2024",
      type: "draw",
    },
    {
      id: "2024-03-15",
      label: language === "ES" ? "15 Mar, 2024" : "Mar 15, 2024",
      type: "draw",
    },
    {
      id: "2024-02-01",
      label: language === "ES" ? "01 Feb, 2024" : "Feb 01, 2024",
      type: "draw",
    },
    {
      id: "2024-01-10",
      label: language === "ES" ? "10 Ene, 2024" : "Jan 10, 2024",
      type: "draw",
    },
    {
      id: "last-7-days",
      label: l?.overview?.compare?.last7Days || "Last 7 Days (1 Week)",
      type: "preset",
    },
    {
      id: "last-30-days",
      label: l?.overview?.compare?.last30Days || "Last 30 Days (1 Month)",
      type: "preset",
    },
    {
      id: "last-90-days",
      label: l?.overview?.compare?.last90Days || "Last 90 Days (3 Months)",
      type: "preset",
    },
    {
      id: "last-6-months",
      label: l?.overview?.compare?.last6Months || "Last 6 Months",
      type: "preset",
    },
    {
      id: "last-1-year",
      label: l?.overview?.compare?.last1Year || "Last 1 Year",
      type: "preset",
    },
  ];

  const latestDrawDate = customData?.date
    ? new Date(customData.date).toLocaleDateString(
        language === "ES" ? "es-ES" : "en-US",
        { month: "short", day: "numeric", year: "numeric" }
      )
    : language === "ES"
    ? "31 May, 2024"
    : "May 31, 2024";

  const getCategoryName = (catId: string, fallback: string) => {
    if (catId === "kidney-function")
      return l?.categories?.kidneyFunction || fallback;
    if (catId === "electrolytes")
      return l?.categories?.electrolytes || fallback;
    if (catId === "mineral-bone")
      return l?.categories?.mineralBone || fallback;
    if (catId === "blood-counts")
      return l?.categories?.bloodCounts || fallback;
    if (catId === "nutrition")
      return l?.categories?.nutrition || fallback;
    if (catId === "dialysis-adequacy")
      return l?.categories?.dialysisAdequacy || fallback;
    return fallback;
  };

  const getTestDisplayName = (testId: string, fallback: string) => {
    const testsDict = l?.tests;
    if (!testsDict) return fallback;
    if (testId === "bun") return testsDict.bun || fallback;
    if (testId === "creatinine") return testsDict.creatinine || fallback;
    if (testId === "egfr") return testsDict.egfr || fallback;
    if (testId === "sodium") return testsDict.sodium || fallback;
    if (testId === "potassium") return testsDict.potassium || fallback;
    if (testId === "chloride") return testsDict.chloride || fallback;
    if (testId === "co2") return testsDict.co2 || fallback;
    if (testId === "calcium") return testsDict.calcium || fallback;
    if (testId === "phosphorus") return testsDict.phosphorus || fallback;
    if (testId === "pth") return testsDict.pth || fallback;
    if (testId === "vitamind") return testsDict.vitaminD || fallback;
    if (testId === "hemoglobin") return testsDict.hemoglobin || fallback;
    if (testId === "hematocrit") return testsDict.hematocrit || fallback;
    if (testId === "ferritin") return testsDict.ferritin || fallback;
    if (testId === "tsat") return testsDict.tsat || fallback;
    if (testId === "albumin") return testsDict.albumin || fallback;
    if (testId === "bicarbonate") return testsDict.bicarbonate || fallback;
    if (testId === "ktv") return testsDict.ktv || fallback;
    return fallback;
  };

  const getStatusLabel = (status: "In Range" | "High" | "Low") => {
    if (status === "In Range")
      return l?.overview?.statuses?.inRange || "In Range";
    if (status === "High") return l?.overview?.statuses?.high || "High";
    return l?.overview?.statuses?.low || "Low";
  };

  const mergedCategories = categoriesData.map((cat) => ({
    ...cat,
    displayName: getCategoryName(cat.id, cat.name),
    tests: cat.tests.map((test) => {
      const displayName = getTestDisplayName(test.id, test.name);
      if (customData?.values && customData.values[test.name]) {
        const rawVal = customData.values[test.name];
        const unitParts = test.latestResult.split(" ");
        const unit = unitParts.length > 1 ? unitParts.slice(1).join(" ") : "";
        const formatted =
          rawVal.includes(" ") || !unit ? rawVal : `${rawVal} ${unit}`;
        return {
          ...test,
          displayName,
          latestResult: formatted,
        };
      }
      return {
        ...test,
        displayName,
      };
    }),
  }));

  const filteredCategories =
    selectedCategory === "all"
      ? mergedCategories
      : mergedCategories.filter((cat) => cat.id === selectedCategory);

  const datesOverview =
    language === "ES"
      ? ["4 Feb", "1 Mar", "10 Abr", "15 May", "12 Jun"]
      : ["Feb 4", "Mar 1", "Apr 10", "May 15", "Jun 12"];

  return (
    <div className="w-full space-y-6">
      {/* 1. Top KPI Summary Cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Card 1: Latest Lab Date */}
        <article className="flex items-center gap-3.5 rounded-xl border border-[#E2E8F0] bg-white p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <FaCalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-600">
              {l?.kpis?.latestDate || "Latest Lab Date"}
            </p>
            <p className="text-xl font-bold text-slate-900 truncate">
              {latestDrawDate}
            </p>
          </div>
        </article>

        {/* Card 2: Values In Range */}
        <article className="flex items-center gap-3.5 rounded-xl border border-[#E2E8F0] bg-white p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <FaCircleCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-slate-600">
                {l?.kpis?.inRange || "In Range"}
              </p>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                64%
              </span>
            </div>
            <p className="text-xl font-bold text-slate-900">16 / 25</p>
          </div>
        </article>

        {/* Card 3: Values Out of Range */}
        <article className="flex items-center gap-3.5 rounded-xl border border-[#E2E8F0] bg-white p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <FaTriangleExclamation className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-slate-600">
                {l?.kpis?.outOfRange || "Out of Range"}
              </p>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                24%
              </span>
            </div>
            <p className="text-xl font-bold text-slate-900">6 / 25</p>
          </div>
        </article>

        {/* Card 4: Trending Up */}
        <article className="flex items-center gap-3.5 rounded-xl border border-[#E2E8F0] bg-white p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <FaArrowTrendUp className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-600">
              {l?.kpis?.trendingUp || "Trending Up"}
            </p>
            <p className="text-xl font-bold text-slate-900">7</p>
          </div>
        </article>

        {/* Card 5: Trending Down */}
        <article className="flex items-center gap-3.5 rounded-xl border border-[#E2E8F0] bg-white p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <FaArrowTrendDown className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-600">
              {l?.kpis?.trendingDown || "Trending Down"}
            </p>
            <p className="text-xl font-bold text-slate-900">5</p>
          </div>
        </article>
      </section>

      {/* 3. Main Grid Layout (Left Content + Right Sidebar) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        {/* Left Column (Table Area) */}
        <div className="xl:col-span-3 space-y-4">
          {/* Unified Top Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3">
            {/* Left Controls Group: Tab Switcher + Category Filter */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Segmented Pill Tab Switcher */}
              <div className="inline-flex items-center rounded-xl bg-[#F1F5F9] p-1 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "overview"
                      ? "bg-white text-blue-600 border border-slate-200/80"
                      : "text-slate-700 hover:text-slate-900"
                  }`}
                >
                  {l?.tabs?.overview || "Lab Overview"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("trends")}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "trends"
                      ? "bg-white text-blue-600 border border-slate-200/80"
                      : "text-slate-700 hover:text-slate-900"
                  }`}
                >
                  {l?.tabs?.trends || "Trends"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "history"
                      ? "bg-white text-blue-600 border border-slate-200/80"
                      : "text-slate-700 hover:text-slate-900"
                  }`}
                >
                  {l?.tabs?.history || "History"}
                </button>
              </div>

              {/* Category Filter Dropdown */}
              {activeTab !== "history" && (
                <select
                  id="cat-filter"
                  aria-label="Filter by category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">
                    {l?.categories?.all || "All Categories"}
                  </option>
                  <option value="kidney-function">
                    {l?.categories?.kidneyFunction || "Kidney Function"}
                  </option>
                  <option value="electrolytes">
                    {l?.categories?.electrolytes || "Electrolytes"}
                  </option>
                  <option value="mineral-bone">
                    {l?.categories?.mineralBone || "Mineral & Bone"}
                  </option>
                  <option value="blood-counts">
                    {l?.categories?.bloodCounts || "Blood Counts"}
                  </option>
                  <option value="nutrition">
                    {l?.categories?.nutrition || "Nutrition"}
                  </option>
                  <option value="dialysis-adequacy">
                    {l?.categories?.dialysisAdequacy || "Dialysis Adequacy"}
                  </option>
                </select>
              )}
            </div>

            {/* Right Group: Action Buttons */}
            <div className="flex items-center gap-3 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                {l?.actions?.exportPdf || "Export PDF"}
              </button>

              <Link
                href="/dashboard/personal-log/lab-tracking/add"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                {l?.actions?.addLabResult || "Add Lab Result"}
              </Link>
            </div>
          </div>

          {/* TAB 1: OVERVIEW & COMPARE VIEW */}
          {activeTab === "overview" && (
            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F8FAFC] text-sm font-semibold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 min-w-[200px]">
                        {l?.overview?.headers?.test || "Test"}
                      </th>
                      <th className="px-4 py-3 min-w-[140px] font-bold text-slate-900">
                        {l?.overview?.headers?.latestResult || "Latest Result"}{" "}
                        <span className="block text-sm font-semibold text-slate-600">
                          {latestDrawDate}
                        </span>
                      </th>
                      <th className="px-4 py-3 min-w-[150px] font-bold text-slate-900">
                        {l?.overview?.headers?.previousResult || "Previous Result"}
                        <div className="relative flex items-center justify-between mt-0.5">
                          <select
                            aria-label="Select comparison lab draw date"
                            value={compareDateId}
                            onChange={(e) => setCompareDateId(e.target.value)}
                            className="w-full appearance-none bg-transparent pr-4 text-xs font-semibold text-blue-600 outline-none cursor-pointer hover:underline"
                          >
                            <optgroup
                              label={
                                l?.overview?.compare?.pastDrawDatesGroup ||
                                "Past Lab Draw Dates"
                              }
                              className="font-bold text-slate-900 bg-white"
                            >
                              {pastDrawDates
                                .filter((d) => d.type === "draw")
                                .map((date) => (
                                  <option
                                    key={date.id}
                                    value={date.id}
                                    className="text-slate-900 bg-white font-medium"
                                  >
                                    {date.label}
                                  </option>
                                ))}
                            </optgroup>
                            <optgroup
                              label={
                                l?.overview?.compare?.presetsGroup ||
                                "Timeframe Presets"
                              }
                              className="font-bold text-slate-900 bg-white"
                            >
                              {pastDrawDates
                                .filter((d) => d.type === "preset")
                                .map((date) => (
                                  <option
                                    key={date.id}
                                    value={date.id}
                                    className="text-slate-900 bg-white font-medium"
                                  >
                                    {date.label}
                                  </option>
                                ))}
                            </optgroup>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-0 h-3.5 w-3.5 text-blue-600" />
                        </div>
                      </th>
                      <th className="px-4 py-3 min-w-[100px]">
                        {l?.overview?.headers?.change || "Change"}
                      </th>
                      <th className="px-4 py-3 min-w-[150px]">
                        {l?.overview?.headers?.refRange || "Reference Range"}
                      </th>
                      <th className="px-4 py-3 min-w-[100px]">
                        {l?.overview?.headers?.status || "Status"}
                      </th>
                      <th className="px-4 py-3 min-w-[120px]">
                        {l?.overview?.headers?.trend || "Trend"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCategories.map((category) => (
                      <React.Fragment key={category.id}>
                        {/* Category Header Row */}
                        <tr className="bg-[#F1F5FA]">
                          <td colSpan={7} className="px-4 py-2.5">
                            <div className="flex items-center gap-2 font-bold text-xs text-[#06265B] tracking-wider uppercase">
                              <category.icon className="h-4.5 w-4.5 fill-current text-blue-600 shrink-0" />
                              {category.displayName}
                            </div>
                          </td>
                        </tr>

                        {/* Category Test Rows */}
                        {category.tests.map((test) => (
                          <tr
                            key={test.id}
                            className="hover:bg-slate-50/80 transition-colors group"
                          >
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {test.displayName}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {test.latestResult}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-800">
                              {test.previousResult}
                            </td>
                            <td className="px-4 py-3 font-semibold text-xs">
                              <span
                                className={`inline-flex items-center gap-0.5 ${
                                  test.changeColor === "red"
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
                            <td className="px-4 py-3 text-xs font-medium text-slate-600">
                              {test.refRange}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge
                                status={test.status}
                                label={getStatusLabel(test.status)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Sparkline
                                data={test.sparkline}
                                status={test.status}
                              />
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-500">
                {l?.overview?.footnote ||
                  "* Reference ranges may vary slightly by lab. Always follow your healthcare team's guidance."}
              </div>
            </div>
          )}

          {/* TAB 2: TRENDS VIEW */}
          {activeTab === "trends" && (
            <div className="space-y-6">
              <div className="space-y-6">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                      <category.icon className="h-4.5 w-4.5 fill-current text-blue-600 shrink-0" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#06265B]">
                        {category.displayName} ({category.tests.length}{" "}
                        {l?.trends?.testsCount || "TESTS"})
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.tests.map((test) => {
                        let theme:
                          | "purple"
                          | "green"
                          | "orange"
                          | "blue"
                          | "rose"
                          | "teal" = "purple";
                        if (test.name.includes("Potassium")) theme = "purple";
                        else if (test.name.includes("Phosphorus"))
                          theme = "green";
                        else if (test.name.includes("Calcium")) theme = "orange";
                        else if (test.name.includes("Creatinine")) theme = "rose";
                        else if (test.name.includes("eGFR")) theme = "blue";
                        else if (test.name.includes("Sodium")) theme = "teal";
                        else if (test.name.includes("Hemoglobin")) theme = "rose";
                        else if (test.name.includes("Kt/V")) theme = "green";
                        else if (test.name.includes("Albumin")) theme = "orange";
                        else if (test.name.includes("BUN")) theme = "purple";
                        else theme = "blue";

                        const unitParts = test.latestResult.split(" ");
                        const unit = unitParts.slice(1).join(" ") || "";

                        return (
                          <TrendLineCard
                            key={test.id}
                            testName={test.displayName}
                            unit={unit}
                            data={test.sparkline}
                            dates={datesOverview}
                            colorTheme={theme}
                            refRangeLabel={l?.trends?.refRange || "Ref Range"}
                            latestLabel={l?.trends?.latest || "Latest"}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DEDICATED HISTORY VIEW */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="space-y-4">
                {[
                  {
                    date: latestDrawDate,
                    tag: l?.history?.latestDraw || "Latest Draw",
                    tagColor: "bg-emerald-500 text-white",
                    notes:
                      customData?.notes ||
                      l?.history?.sampleNotes?.draw1 ||
                      "Routine monthly blood draw. Discussed phosphorus binder dosage with care team.",
                    detailedTests:
                      customData?.values &&
                      Object.keys(customData.values).length > 0
                        ? categoriesData
                            .map((cat) => {
                              const recordedForCat = cat.tests.filter(
                                (t) => customData.values?.[t.name]
                              );
                              if (recordedForCat.length === 0) return null;
                              return {
                                category: getCategoryName(cat.id, cat.name),
                                tests: recordedForCat.map((t) => {
                                  const userVal =
                                    customData.values?.[t.name] || "";
                                  const unitParts = t.latestResult.split(" ");
                                  const unit = unitParts.slice(1).join(" ");
                                  const formattedVal =
                                    userVal.includes(" ") || !unit
                                      ? userVal
                                      : `${userVal} ${unit}`;
                                  return {
                                    name: getTestDisplayName(t.id, t.name),
                                    val: formattedVal,
                                    ref: t.refRange,
                                    status: t.status,
                                  };
                                }),
                              };
                            })
                            .filter(
                              (
                                g
                              ): g is {
                                category: string;
                                tests: any[];
                              } => g !== null
                            )
                        : [
                            {
                              category:
                                l?.categories?.kidneyFunction ||
                                "KIDNEY FUNCTION",
                              tests: [
                                {
                                  name: getTestDisplayName("bun", "BUN"),
                                  val: "48 mg/dL",
                                  ref: "7 – 20 mg/dL",
                                  status: "High" as const,
                                },
                                {
                                  name: getTestDisplayName(
                                    "creatinine",
                                    "Creatinine"
                                  ),
                                  val: "6.48 mg/dL",
                                  ref: "0.6 – 1.3 mg/dL",
                                  status: "High" as const,
                                },
                                {
                                  name: getTestDisplayName(
                                    "egfr",
                                    "eGFR (CKD-EPI)"
                                  ),
                                  val: "9 mL/min",
                                  ref: "> 90 mL/min",
                                  status: "Low" as const,
                                },
                              ],
                            },
                            {
                              category:
                                l?.categories?.electrolytes || "ELECTROLYTES",
                              tests: [
                                {
                                  name: getTestDisplayName(
                                    "potassium",
                                    "Potassium"
                                  ),
                                  val: "5.2 mEq/L",
                                  ref: "3.5 – 5.0 mEq/L",
                                  status: "High" as const,
                                },
                                {
                                  name: getTestDisplayName("sodium", "Sodium"),
                                  val: "138 mEq/L",
                                  ref: "135 – 145 mEq/L",
                                  status: "In Range" as const,
                                },
                              ],
                            },
                          ],
                  },
                  {
                    date: language === "ES" ? "30 Abr, 2024" : "Apr 30, 2024",
                    tag: l?.history?.previousDraw || "Previous Draw",
                    tagColor: "bg-blue-600 text-white",
                    notes:
                      l?.history?.sampleNotes?.draw2 ||
                      "Pre-dialysis lab check. Fasting draw at 8:00 AM.",
                    detailedTests: [
                      {
                        category:
                          l?.categories?.kidneyFunction || "KIDNEY FUNCTION",
                        tests: [
                          {
                            name: getTestDisplayName("bun", "BUN"),
                            val: "46 mg/dL",
                            ref: "7 – 20 mg/dL",
                            status: "High" as const,
                          },
                          {
                            name: getTestDisplayName(
                              "creatinine",
                              "Creatinine"
                            ),
                            val: "6.12 mg/dL",
                            ref: "0.6 – 1.3 mg/dL",
                            status: "High" as const,
                          },
                          {
                            name: getTestDisplayName(
                              "egfr",
                              "eGFR (CKD-EPI)"
                            ),
                            val: "10 mL/min",
                            ref: "> 90 mL/min",
                            status: "Low" as const,
                          },
                        ],
                      },
                      {
                        category:
                          l?.categories?.electrolytes || "ELECTROLYTES",
                        tests: [
                          {
                            name: getTestDisplayName("sodium", "Sodium"),
                            val: "139 mEq/L",
                            ref: "135 – 145 mEq/L",
                            status: "In Range" as const,
                          },
                          {
                            name: getTestDisplayName(
                              "potassium",
                              "Potassium"
                            ),
                            val: "5.0 mEq/L",
                            ref: "3.5 – 5.0 mEq/L",
                            status: "In Range" as const,
                          },
                        ],
                      },
                    ],
                  },
                  {
                    date: language === "ES" ? "15 Mar, 2024" : "Mar 15, 2024",
                    tag: l?.history?.twoMonthsAgo || "2 Months Ago",
                    tagColor:
                      "bg-slate-100 text-slate-700 border border-slate-200",
                    notes:
                      l?.history?.sampleNotes?.draw3 ||
                      "Monthly nephrology review panel.",
                    detailedTests: [
                      {
                        category:
                          l?.categories?.kidneyFunction || "KIDNEY FUNCTION",
                        tests: [
                          {
                            name: getTestDisplayName("bun", "BUN"),
                            val: "42 mg/dL",
                            ref: "7 – 20 mg/dL",
                            status: "High" as const,
                          },
                          {
                            name: getTestDisplayName(
                              "creatinine",
                              "Creatinine"
                            ),
                            val: "5.80 mg/dL",
                            ref: "0.6 – 1.3 mg/dL",
                            status: "High" as const,
                          },
                          {
                            name: getTestDisplayName(
                              "egfr",
                              "eGFR (CKD-EPI)"
                            ),
                            val: "11 mL/min",
                            ref: "> 90 mL/min",
                            status: "Low" as const,
                          },
                        ],
                      },
                    ],
                  },
                  {
                    date: language === "ES" ? "01 Feb, 2024" : "Feb 01, 2024",
                    tag: l?.history?.threeMonthsAgo || "3 Months Ago",
                    tagColor:
                      "bg-slate-100 text-slate-700 border border-slate-200",
                    notes:
                      l?.history?.sampleNotes?.draw4 ||
                      "Routine electrolyte & iron panel.",
                    detailedTests: [
                      {
                        category:
                          l?.categories?.kidneyFunction || "KIDNEY FUNCTION",
                        tests: [
                          {
                            name: getTestDisplayName("bun", "BUN"),
                            val: "38 mg/dL",
                            ref: "7 – 20 mg/dL",
                            status: "High" as const,
                          },
                          {
                            name: getTestDisplayName(
                              "creatinine",
                              "Creatinine"
                            ),
                            val: "5.50 mg/dL",
                            ref: "0.6 – 1.3 mg/dL",
                            status: "High" as const,
                          },
                        ],
                      },
                    ],
                  },
                  {
                    date: language === "ES" ? "10 Ene, 2024" : "Jan 10, 2024",
                    tag: l?.history?.fourMonthsAgo || "4 Months Ago",
                    tagColor:
                      "bg-slate-100 text-slate-700 border border-slate-200",
                    notes:
                      l?.history?.sampleNotes?.draw5 ||
                      "Initial Stage 5 CKD baseline laboratory evaluation.",
                    detailedTests: [
                      {
                        category:
                          l?.categories?.kidneyFunction || "KIDNEY FUNCTION",
                        tests: [
                          {
                            name: getTestDisplayName("bun", "BUN"),
                            val: "35 mg/dL",
                            ref: "7 – 20 mg/dL",
                            status: "High" as const,
                          },
                          {
                            name: getTestDisplayName(
                              "creatinine",
                              "Creatinine"
                            ),
                            val: "5.20 mg/dL",
                            ref: "0.6 – 1.3 mg/dL",
                            status: "High" as const,
                          },
                        ],
                      },
                    ],
                  },
                ].map((draw, idx) => {
                  const isExpanded = expandedHistoryIdx === idx;
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border bg-white transition-all overflow-hidden ${
                        isExpanded
                          ? "border-blue-400 ring-1 ring-blue-400"
                          : "border-slate-200 hover:border-blue-200"
                      }`}
                    >
                      {/* Card Header Bar */}
                      <div
                        onClick={() =>
                          setExpandedHistoryIdx(isExpanded ? null : idx)
                        }
                        className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100 cursor-pointer bg-white hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-sm font-bold text-slate-900">
                            {draw.date}
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${draw.tagColor}`}
                          >
                            {draw.tag}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                              isExpanded
                                ? "border-blue-300 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {isExpanded
                              ? l?.history?.hideValues || "Hide Values ▲"
                              : l?.history?.viewValues || "View Values ▾"}
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Key Readings Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 bg-slate-50/80 p-3 text-xs border-b border-slate-100">
                        {draw.detailedTests
                          .flatMap((g) => g.tests)
                          .map((t, tIdx) => (
                            <div key={tIdx}>
                              <span className="block text-sm font-semibold text-slate-600 truncate">
                                {t.name}
                              </span>
                              <span className="font-bold text-slate-900">
                                {t.val}
                              </span>
                            </div>
                          ))}
                      </div>

                      {/* Notes Section */}
                      {draw.notes && (
                        <div className="bg-slate-50/90 border-b border-slate-100 px-4 py-2 flex items-start gap-2 text-xs text-slate-700">
                          <span className="font-bold text-slate-900 shrink-0">
                            {l?.history?.noteLabel || "Note:"}
                          </span>
                          <p className="font-medium text-slate-600 leading-normal">
                            {draw.notes}
                          </p>
                        </div>
                      )}

                      {/* EXPANDED DETAILED LAB VALUE TABLE BREAKDOWN */}
                      {isExpanded && (
                        <div className="p-4 bg-white space-y-4">
                          <div className="space-y-4">
                            {draw.detailedTests.map((group, gIdx) => (
                              <div
                                key={gIdx}
                                className="rounded-lg border border-slate-200 overflow-hidden"
                              >
                                <div className="bg-[#F1F5FA] px-3.5 py-2 text-xs font-bold text-[#06265B] tracking-wider uppercase border-b border-slate-200">
                                  {group.category}
                                </div>
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                    <tr>
                                      <th className="px-3.5 py-2">
                                        {l?.history?.tableHeaders?.test || "Test"}
                                      </th>
                                      <th className="px-3.5 py-2">
                                        {l?.history?.tableHeaders
                                          ?.recordedValue || "Recorded Value"}
                                      </th>
                                      <th className="px-3.5 py-2">
                                        {l?.history?.tableHeaders?.refRange ||
                                          "Reference Range"}
                                      </th>
                                      <th className="px-3.5 py-2">
                                        {l?.history?.tableHeaders?.status ||
                                          "Status"}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {group.tests.map((t, tIdx) => (
                                      <tr
                                        key={tIdx}
                                        className="hover:bg-slate-50"
                                      >
                                        <td className="px-3.5 py-2 font-semibold text-slate-900">
                                          {t.name}
                                        </td>
                                        <td className="px-3.5 py-2 font-bold text-slate-900">
                                          {t.val}
                                        </td>
                                        <td className="px-3.5 py-2 text-slate-500">
                                          {t.ref}
                                        </td>
                                        <td className="px-3.5 py-2">
                                          <StatusBadge
                                            status={
                                              t.status as
                                                | "High"
                                                | "In Range"
                                                | "Low"
                                            }
                                            label={getStatusLabel(
                                              t.status as
                                                | "High"
                                                | "In Range"
                                                | "Low"
                                            )}
                                          />
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
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                {l?.sidebar?.latestSummary?.title || "LATEST LAB SUMMARY"}
              </h2>
              <Info className="h-4 w-4 text-slate-400" />
            </div>

            {/* 3 Pill Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-emerald-50 p-2.5 text-center">
                <p className="text-xl font-bold text-emerald-600">16</p>
                <p className="text-xs font-medium text-emerald-700">
                  {l?.sidebar?.latestSummary?.inRange || "In Range"}
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2.5 text-center">
                <p className="text-xl font-bold text-amber-600">6</p>
                <p className="text-xs font-medium text-amber-700">
                  {l?.sidebar?.latestSummary?.high || "High"}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-2.5 text-center">
                <p className="text-xl font-bold text-red-600">3</p>
                <p className="text-xs font-medium text-red-700">
                  {l?.sidebar?.latestSummary?.low || "Low"}
                </p>
              </div>
            </div>

            {/* Encouragement Box */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 space-y-2">
              <p className="text-xs font-bold text-slate-900">
                {l?.sidebar?.latestSummary?.keepUpTitle ||
                  "Keep up the good work!"}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                {l?.sidebar?.latestSummary?.keepUpDesc ||
                  "Continue following your care plan and attend your dialysis treatments."}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("trends")}
                className="w-full mt-2 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {l?.sidebar?.latestSummary?.viewTrends || "View Trends"}
              </button>
            </div>
          </div>

          {/* Card 2: Lab Categories */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
              {l?.sidebar?.categories?.title || "LAB CATEGORIES"}
            </h2>
            <div className="space-y-1">
              {[
                {
                  name: l?.categories?.all || "All Categories",
                  count: language === "ES" ? "25 Pruebas" : "25 Tests",
                  icon: FaLayerGroup,
                  key: "all",
                },
                {
                  name: l?.categories?.kidneyFunction || "Kidney Function",
                  count: language === "ES" ? "3 Pruebas" : "3 Tests",
                  icon: GiKidneys,
                  key: "kidney-function",
                },
                {
                  name: l?.categories?.electrolytes || "Electrolytes",
                  count: language === "ES" ? "4 Pruebas" : "4 Tests",
                  icon: FaFlask,
                  key: "electrolytes",
                },
                {
                  name: l?.categories?.mineralBone || "Mineral & Bone",
                  count: language === "ES" ? "4 Pruebas" : "4 Tests",
                  icon: FaBone,
                  key: "mineral-bone",
                },
                {
                  name: l?.categories?.bloodCounts || "Blood Counts",
                  count: language === "ES" ? "4 Pruebas" : "4 Tests",
                  icon: FaDroplet,
                  key: "blood-counts",
                },
                {
                  name: l?.categories?.nutrition || "Nutrition",
                  count: language === "ES" ? "2 Pruebas" : "2 Tests",
                  icon: FaAppleWhole,
                  key: "nutrition",
                },
                {
                  name:
                    l?.categories?.dialysisAdequacy || "Dialysis Adequacy",
                  count: language === "ES" ? "1 Prueba" : "1 Test",
                  icon: FaHeartPulse,
                  key: "dialysis-adequacy",
                },
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat.key
                      ? "bg-blue-50 text-blue-700 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <cat.icon className="h-4 w-4 fill-current text-slate-500 shrink-0" />
                    {cat.name}
                  </span>
                  <span className="text-xs text-slate-400">{cat.count}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className="w-full mt-2 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {l?.sidebar?.categories?.viewAllTrends || "View All Trends"}
            </button>
          </div>

          {/* Card 3: Understanding Your Labs */}
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-indigo-50/70 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <BookOpen className="h-4 w-4" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                {l?.sidebar?.understanding?.title || "UNDERSTANDING YOUR LABS"}
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {l?.sidebar?.understanding?.desc ||
                "Learn what your lab numbers mean and how they affect your health."}
            </p>
            <Link
              href="/dashboard/education-center"
              className="block w-full text-center rounded-lg border border-blue-200 bg-white py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              {l?.sidebar?.understanding?.visitCenter ||
                "Visit Education Center"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
