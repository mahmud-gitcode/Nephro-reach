"use client";

import React from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Calendar,
  CheckCircle2,
  Droplets,
  FileText,
  Minus,
  Plus,
  Scale,
  Wind,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

function GoalBadge({
  status,
  isGoalMet,
}: {
  status: string;
  isGoalMet: boolean;
}) {
  const className = isGoalMet
    ? "bg-emerald-50 text-emerald-700"
    : "bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${className}`}
    >
      {status}
    </span>
  );
}

function TrendIcon({ type }: { type: "up" | "down" | "level" }) {
  if (type === "up") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
        <ArrowUp className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (type === "down") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white">
        <ArrowDown className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
      <Minus className="h-3.5 w-3.5" />
    </span>
  );
}

function MetricCards() {
  const { language, dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  const dateStr = language === "ES" ? "31 May, 7:30 AM" : "May 31, 7:30 AM";

  const metricCards = [
    {
      label: w?.metrics?.currentWeight?.label || "Current Weight",
      value: "80",
      unit: w?.metrics?.currentWeight?.unit || "lbs",
      date: dateStr,
      note: w?.metrics?.currentWeight?.note || "↓ 1.2 lbs vs yesterday",
      noteClass: "text-emerald-600",
      icon: Scale,
      iconBg: "bg-blue-100",
      iconClass: "text-blue-600",
    },
    {
      label: w?.metrics?.avgFluidIntake?.label || "Avg. Fluid Intake",
      value: "18",
      unit: w?.metrics?.avgFluidIntake?.unit || "OZ",
      date: dateStr,
      note: w?.metrics?.avgFluidIntake?.note || "↓ 1.2 lbs vs yesterday",
      noteClass: "text-emerald-600",
      icon: Droplets,
      iconBg: "bg-sky-100",
      iconClass: "text-sky-600",
    },
    {
      label: w?.metrics?.daysGoalMet?.label || "Days Goal Met",
      value: "21 / 30",
      date: dateStr,
      note: w?.metrics?.daysGoalMet?.note || "This Month",
      extra: "60%",
      icon: CheckCircle2,
      iconBg: "bg-emerald-100",
      iconClass: "text-emerald-600",
    },
    {
      label: w?.metrics?.swellingReports?.label || "Swelling Reports",
      value: "5",
      date: dateStr,
      note: w?.metrics?.swellingReports?.note || "↓ 2 vs last month",
      noteClass: "text-emerald-600",
      icon: FileText,
      iconBg: "bg-amber-100",
      iconClass: "text-amber-600",
    },
    {
      label: w?.metrics?.sobReports?.label || "SOB Reports",
      value: "3",
      date: dateStr,
      note: w?.metrics?.sobReports?.note || "↓ 1 vs last month",
      noteClass: "text-emerald-600",
      icon: Wind,
      iconBg: "bg-red-100",
      iconClass: "text-red-500",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {metricCards.map((card) => (
        <article
          key={card.label}
          className="rounded-[14px] border border-slate-200 bg-white p-[15px]"
        >
          <div className="flex items-start gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}
            >
              <card.icon className={`h-6 w-6 ${card.iconClass}`} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{card.label}</p>
              <p className="mt-0.5 text-[22px] font-medium leading-7 text-slate-950">
                {card.value}
                {card.unit && (
                  <span className="ml-1 text-xs font-medium text-slate-500">
                    {card.unit}
                  </span>
                )}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">{card.date}</p>
          <div className="mt-1 flex items-center justify-between gap-2 text-xs">
            <span className={card.noteClass ?? "text-slate-500"}>
              {card.note}
            </span>
            {card.extra && (
              <span className="font-medium text-slate-700">{card.extra}</span>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

function WeightTrendChart() {
  const { language, dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  const weightTrend = [
    { day: "May 1", value: 1.0 },
    { day: "May 2", value: 1.4 },
    { day: "May 3", value: 4.8 },
    { day: "May 4", value: 1.0 },
    { day: "May 5", value: 1.4 },
    { day: "May 6", value: 2.2 },
    { day: "May 7", value: 1.3 },
    { day: "May 8", value: 1.3 },
  ];

  const width = 500;
  const height = 200;
  const left = 24;
  const right = 8;
  const top = 8;
  const bottom = 8;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const xFor = (index: number) =>
    left + (index / (weightTrend.length - 1)) * plotWidth;
  const yFor = (value: number) => top + ((8 - value) / 8) * plotHeight;
  const points = weightTrend
    .map((point, index) => `${xFor(index)},${yFor(point.value)}`)
    .join(" ");

  const labels =
    language === "ES"
      ? ["1 May", "2 May", "3 May", "4 May", "5 May", "6 May"]
      : ["May 1", "May 2", "May 3", "May 4", "May 5", "May 6"];

  return (
    <section className="h-full rounded-xl border border-[#DFE3E8] bg-[#FCFDFD] p-3.5">
      <div className="flex items-center gap-1.5">
        <h2 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
          {w?.weightTrend?.title || "Weight Trend"}
        </h2>
        <span className="text-xs text-slate-600">
          {w?.weightTrend?.subtitle || "(30 Day)"}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height + 22}`}
        className="mt-3 h-[236px] w-full"
      >
        {[8, 6, 4, 2, 0].map((tick, index) => {
          const y = top + (index / 4) * plotHeight;
          return (
            <g key={tick}>
              <text
                x={16}
                y={y + 4}
                textAnchor="end"
                className="fill-black/70 text-[12px]"
              >
                {tick}
              </text>
              <line
                x1={left}
                x2={width - right}
                y1={y}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="4 4"
              />
            </g>
          );
        })}
        <polyline
          fill="none"
          stroke="#8979FF"
          strokeWidth="2.5"
          points={points}
        />
        {weightTrend.map((point, index) => (
          <circle
            key={point.day}
            cx={xFor(index)}
            cy={yFor(point.value)}
            r="4"
            fill="white"
            stroke="#8979FF"
            strokeWidth="2"
          />
        ))}
        {labels.map((label, index) => (
          <text
            key={label}
            x={left + (index / (labels.length - 1)) * plotWidth}
            y={height + 18}
            textAnchor="middle"
            className="fill-black/70 text-[12px]"
          >
            {label}
          </text>
        ))}
      </svg>
    </section>
  );
}

function GoalProgress() {
  const { dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  const goalSlices = [
    {
      label: w?.goalProgress?.goalMet || "Goal Met",
      count: 29,
      percent: 50,
      color: "#3B82F6",
    },
    {
      label: w?.goalProgress?.aboveGoal || "Above Goal",
      count: 16,
      percent: 28,
      color: "#F59E0B",
    },
    {
      label: w?.goalProgress?.belowGoal || "Below Goal",
      count: 13,
      percent: 22,
      color: "#FF5630",
    },
  ];

  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <section className="flex h-full flex-col rounded-xl border border-[#E3E6F0] bg-white p-4">
      <h2 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
        {w?.goalProgress?.title || "Goal & Progress"}
      </h2>
      <div className="mt-4 flex flex-1 flex-col items-center gap-4 sm:flex-row">
        <div className="relative size-[226px] shrink-0">
          <svg viewBox="0 0 226 226" className="size-full -rotate-90">
            <circle
              cx="113"
              cy="113"
              r={radius}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="28"
            />
            {goalSlices.map((slice) => {
              const dash = (slice.percent / 100) * circumference;
              const circle = (
                <circle
                  key={slice.label}
                  cx="113"
                  cy="113"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="28"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return circle;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[22px] font-medium text-slate-950">86%</p>
            <p className="text-sm text-[#454F5B]">
              {w?.goalProgress?.overall || "Overall"}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-5">
          {goalSlices.map((slice) => (
            <div
              key={slice.label}
              className="flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2 text-lg font-medium text-[#454F5B]">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                {slice.label}
              </span>
              <span className="text-lg font-medium text-[#454F5B]">
                {slice.count} ({slice.percent}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FluidIntakeTrend() {
  const { language, dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  const fluidIntakeBars = [
    72, 67, 31, 73, 59, 31, 91, 31, 57, 81, 52, 56, 71, 57, 33,
  ];

  const labels =
    language === "ES"
      ? ["1 May", "2 May", "3 May", "4 May", "5 May", "6 May"]
      : ["May 1", "May 2", "May 3", "May 4", "May 5", "May 6"];

  return (
    <section className="h-full rounded-xl border border-[#DFE3E8] bg-[#FCFDFD] p-3.5">
      <div className="flex items-center gap-1.5">
        <h2 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
          {w?.fluidIntakeTrend?.title || "Fluid Intake Trend"}
        </h2>
        <span className="text-xs text-slate-600">
          {w?.fluidIntakeTrend?.subtitle || "(30 Day)"}
        </span>
      </div>
      <div className="mt-3 flex min-h-[250px] gap-2">
        <div className="flex flex-col justify-between pb-6 text-right text-xs text-black/70">
          {["100", "80", "60", "40", "20", "0"].map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-x-0 bottom-6 top-0 flex flex-col justify-between">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="border-t border-dashed border-slate-200"
              />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-6 top-1 flex items-end justify-between gap-0.5">
            {fluidIntakeBars.map((value, index) => (
              <div
                key={index}
                className="relative flex h-full min-w-0 flex-1 items-end justify-center"
              >
                <div className="absolute inset-y-0 w-[18px] bg-[rgba(214,219,237,0.4)]" />
                <div
                  className="relative w-[18px] bg-[#8979FF]/80"
                  style={{ height: `${value}%` }}
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex justify-between pl-2 text-[12px] text-black/70">
            {labels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function UrinaryOutput() {
  const { language, dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  const urineTrends = [
    {
      date: language === "ES" ? "10 May, 2024" : "May 10, 2024",
      trendKey: "increasing",
      defaultTrend: "Increasing",
      icon: "up" as const,
    },
    {
      date: language === "ES" ? "31 May, 2024" : "May 31, 2024",
      trendKey: "decreasing",
      defaultTrend: "Decreasing",
      icon: "down" as const,
    },
    {
      date: language === "ES" ? "7 Jun, 2024" : "Jun 7, 2024",
      trendKey: "increasing",
      defaultTrend: "Increasing",
      icon: "up" as const,
    },
    {
      date: language === "ES" ? "5 Jul, 2024" : "Jul 5, 2024",
      trendKey: "noChange",
      defaultTrend: "No Change",
      icon: "level" as const,
    },
  ];

  const getTrendText = (trendKey: string, defaultTrend: string) => {
    if (trendKey === "increasing")
      return w?.urinaryOutput?.trends?.increasing || defaultTrend;
    if (trendKey === "decreasing")
      return w?.urinaryOutput?.trends?.decreasing || defaultTrend;
    if (trendKey === "noChange")
      return w?.urinaryOutput?.trends?.noChange || defaultTrend;
    return defaultTrend;
  };

  return (
    <section className="flex h-full flex-col rounded-xl border border-[#E3E6F0] bg-white p-[17px]">
      <h2 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
        {w?.urinaryOutput?.title || "Urinary Output"}{" "}
        <span className="text-sm font-medium text-slate-600">
          {w?.urinaryOutput?.subtitle || "(24 Hours)"}
        </span>
      </h2>
      <div className="mt-3.5 overflow-hidden rounded-lg border border-[#C4CDD5]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F4F6F8]">
            <tr>
              <th className="border-b border-[#C4CDD5] px-3 py-3 font-medium text-slate-950">
                {w?.urinaryOutput?.date || "Date"}
              </th>
              <th className="border-b border-[#C4CDD5] px-3 py-3 font-medium text-slate-950">
                {w?.urinaryOutput?.trend || "Trend"}
              </th>
            </tr>
          </thead>
          <tbody>
            {urineTrends.map((row) => (
              <tr
                key={row.date}
                className="border-b border-dashed border-[#C4CDD5] last:border-b-0"
              >
                <td className="px-3 py-3 text-[#1C252E]">{row.date}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <TrendIcon type={row.icon} />
                    <span className="font-medium text-[#1C252E]">
                      {getTrendText(row.trendKey, row.defaultTrend)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AlertsInsights() {
  const { dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  const toneClass = {
    warning: "border-amber-200 bg-amber-50",
    error: "border-red-200 bg-red-50",
    success: "border-emerald-200 bg-emerald-50",
    info: "border-blue-200 bg-blue-50",
  };

  const alerts = [
    {
      title:
        w?.alerts?.items?.weightGain?.title || "Weight Gain Notice",
      body:
        w?.alerts?.items?.weightGain?.body ||
        "+2.6 lbs this month. Possible fluid retention — contact your nurse if swelling increases.",
      tone: "warning",
    },
    {
      title: w?.alerts?.items?.missedLogging?.title || "Missed Logging",
      body:
        w?.alerts?.items?.missedLogging?.body ||
        "3 days without logging detected. Consistent tracking helps your care team.",
      tone: "error",
    },
    {
      title: w?.alerts?.items?.fluidGoal?.title || "Fluid Goal On Track",
      body:
        w?.alerts?.items?.fluidGoal?.body ||
        "Average 42 oz/day, within your 48 oz limit. Keep it up.",
      tone: "success",
    },
    {
      title: w?.alerts?.items?.education?.title || "Education Tip",
      body:
        w?.alerts?.items?.education?.body ||
        'Watch "Understanding Fluid Retention" module to learn practical daily tips.',
      tone: "info",
    },
  ];

  return (
    <section className="h-full rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-medium text-slate-950">
        {w?.alerts?.title || "Alerts & Insights"}
      </h2>
      <div className="mt-3 space-y-2">
        {alerts.map((alert) => (
          <article
            key={alert.title}
            className={`rounded-lg border p-2.5 ${
              toneClass[alert.tone as keyof typeof toneClass]
            }`}
          >
            <div className="flex gap-2">
              {alert.tone === "info" ? (
                <BookOpen className="mt-0.5 h-3 w-3 shrink-0 text-blue-600" />
              ) : (
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
              )}
              <div>
                <p className="text-xs font-medium text-slate-950">
                  {alert.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-[13px] text-slate-600">
                  {alert.body}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RecentEntries() {
  const { language, dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  const rawEntries = [
    {
      dateEn: "May 10, 2024",
      dateEs: "10 May, 2024",
      morning: "100",
      evening: "182",
      uo: "High",
      intake: "50",
      goal: "Above Goal",
      swelling: "None",
      sob: "NO",
      weakness: "NO",
      notes: "--",
      noteKey: null,
    },
    {
      dateEn: "May 31, 2024",
      dateEs: "31 May, 2024",
      morning: "123",
      evening: "136",
      uo: "High",
      intake: "40",
      goal: "Goal Met",
      swelling: "Mild",
      sob: "NO",
      weakness: "NO",
      notes: "Felt good today",
      noteKey: "feltGood",
    },
    {
      dateEn: "June 7, 2024",
      dateEs: "7 Jun, 2024",
      morning: "95",
      evening: "150",
      uo: "High",
      intake: "45",
      goal: "Above Goal",
      swelling: "None",
      sob: "NO",
      weakness: "NO",
      notes: "Need to push harder",
      noteKey: "needToPush",
    },
    {
      dateEn: "June 14, 2024",
      dateEs: "14 Jun, 2024",
      morning: "110",
      evening: "170",
      uo: "High",
      intake: "55",
      goal: "Goal Met",
      swelling: "None",
      sob: "NO",
      weakness: "NO",
      notes: "Strong finish",
      noteKey: "strongFinish",
    },
    {
      dateEn: "June 21, 2024",
      dateEs: "21 Jun, 2024",
      morning: "118",
      evening: "190",
      uo: "High",
      intake: "60",
      goal: "Above Goal",
      swelling: "None",
      sob: "NO",
      weakness: "NO",
      notes: "Best performance yet",
      noteKey: "bestPerformance",
    },
    {
      dateEn: "June 28, 2024",
      dateEs: "28 Jun, 2024",
      morning: "102",
      evening: "140",
      uo: "High",
      intake: "35",
      goal: "Goal Met",
      swelling: "None",
      sob: "NO",
      weakness: "NO",
      notes: "Felt tired",
      noteKey: "feltTired",
    },
    {
      dateEn: "July 5, 2024",
      dateEs: "5 Jul, 2024",
      morning: "115",
      evening: "165",
      uo: "High",
      intake: "50",
      goal: "Above Goal",
      swelling: "None",
      sob: "NO",
      weakness: "NO",
      notes: "--",
      noteKey: null,
    },
  ];

  const translateGoal = (goal: string) => {
    if (goal === "Goal Met") return w?.recentEntries?.values?.goalMet || "Goal Met";
    if (goal === "Above Goal") return w?.recentEntries?.values?.aboveGoal || "Above Goal";
    return goal;
  };

  const translateSwelling = (swelling: string) => {
    if (swelling === "None") return w?.recentEntries?.values?.none || "None";
    if (swelling === "Mild") return w?.recentEntries?.values?.mild || "Mild";
    return swelling;
  };

  const translateYesNo = (val: string) => {
    if (val === "NO") return w?.recentEntries?.values?.no || "NO";
    if (val === "YES") return w?.recentEntries?.values?.yes || "YES";
    return val;
  };

  const translateNote = (noteKey: string | null, fallback: string) => {
    if (!noteKey) return fallback;
    const notesMap = w?.recentEntries?.notes;
    if (notesMap && typeof notesMap === "object" && noteKey in notesMap) {
      return (notesMap as Record<string, string>)[noteKey] || fallback;
    }
    return fallback;
  };

  const headers = [
    w?.recentEntries?.headers?.date || "Date",
    w?.recentEntries?.headers?.morning || "Morning",
    w?.recentEntries?.headers?.evening || "Evening",
    w?.recentEntries?.headers?.uo || "24h UO",
    w?.recentEntries?.headers?.fluidIntake || "Fluid Intake",
    w?.recentEntries?.headers?.goalStatus || "Goal Status",
    w?.recentEntries?.headers?.swelling || "Swelling",
    w?.recentEntries?.headers?.sob || "SOB",
    w?.recentEntries?.headers?.weakness || "Weakness",
    w?.recentEntries?.headers?.notes || "Notes",
  ];

  return (
    <section className="rounded-[14px] border border-slate-200 bg-white p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">
          {w?.recentEntries?.title || "Recent Entries"}
        </h2>
        <button
          type="button"
          className="flex h-12 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold tracking-[0.08px] text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          {w?.recentEntries?.addNewEntry || "Add New Entry"}
        </button>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-[#C4CDD5]">
        <div className="max-h-[430px] overflow-auto">
          <table className="min-w-[1080px] w-full text-left text-sm">
            <thead className="sticky top-0 bg-[#F4F6F8]">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="border-b border-[#C4CDD5] px-3 py-4 font-medium text-slate-950"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rawEntries.map((entry) => {
                const dateLabel = language === "ES" ? entry.dateEs : entry.dateEn;
                const isGoalMet = entry.goal === "Goal Met";
                const goalLabel = translateGoal(entry.goal);
                const uoLabel = w?.recentEntries?.values?.high || entry.uo;
                const swellingLabel = translateSwelling(entry.swelling);
                const sobLabel = translateYesNo(entry.sob);
                const weaknessLabel = translateYesNo(entry.weakness);
                const notesLabel = translateNote(entry.noteKey, entry.notes);

                return (
                  <tr
                    key={entry.dateEn}
                    className="border-b border-dashed border-[#C4CDD5] last:border-b-0"
                  >
                    <td className="px-3 py-3 text-[#1C252E]">{dateLabel}</td>
                    <td className="px-3 py-3 text-[#1C252E]">{entry.morning}</td>
                    <td className="px-3 py-3 text-[#1C252E]">{entry.evening}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <TrendIcon type="up" />
                        <span>{uoLabel}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[#1C252E]">{entry.intake}</td>
                    <td className="px-3 py-3">
                      <GoalBadge status={goalLabel} isGoalMet={isGoalMet} />
                    </td>
                    <td className="px-3 py-3 text-[#1C252E]">{swellingLabel}</td>
                    <td className="px-3 py-3 text-[#1C252E]">{sobLabel}</td>
                    <td className="px-3 py-3 text-[#1C252E]">{weaknessLabel}</td>
                    <td className="px-3 py-3 text-[#1C252E]">{notesLabel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default function FluidTrackerPage() {
  const { dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[28px] font-medium leading-none text-slate-950 sm:text-[32px]">
          {w?.title || "Weight & Fluid Management Center"}
        </h1>
        <button
          type="button"
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold tracking-[0.08px] text-slate-950 transition-colors hover:bg-white"
        >
          <Calendar className="h-6 w-6" />
          Jun
        </button>
      </div>

      <MetricCards />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <WeightTrendChart />
        <GoalProgress />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,540px)_minmax(240px,262px)_minmax(240px,1fr)]">
        <FluidIntakeTrend />
        <UrinaryOutput />
        <AlertsInsights />
      </section>

      <RecentEntries />
    </div>
  );
}
