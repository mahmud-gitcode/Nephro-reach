"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Droplets,
  FileText,
  Minus,
  Pencil,
  Plus,
  Scale,
  Wind,
  X,
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

function BathroomScaleIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Scale Base */}
      <rect
        x="4"
        y="4"
        width="36"
        height="36"
        rx="9"
        fill="#0D47A1"
        stroke="#1E40AF"
        strokeWidth="1.5"
      />
      {/* Subtle Inner Frame */}
      <rect
        x="6.5"
        y="6.5"
        width="31"
        height="31"
        rx="7"
        stroke="#60A5FA"
        strokeWidth="1"
        strokeOpacity="0.4"
      />
      {/* Top Dial / Display Window */}
      <circle cx="22" cy="14" r="5.5" fill="#FFFFFF" />
      <circle cx="22" cy="14" r="5.5" stroke="#93C5FD" strokeWidth="1" />
      {/* Dial Needle */}
      <line
        x1="22"
        y1="14"
        x2="22"
        y2="10"
        stroke="#0D47A1"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="22" cy="14" r="1.2" fill="#0D47A1" />
      {/* Platform footpad indicator groove */}
      <rect
        x="13"
        y="27"
        width="18"
        height="2"
        rx="1"
        fill="#FFFFFF"
        fillOpacity="0.45"
      />
    </svg>
  );
}

function MetricCards({
  unit,
  edwKg,
  todayWeightKg,
  edwNote,
  todayDateStr,
  onOpenEdwModal,
}: {
  unit: "kg" | "lbs";
  edwKg: number;
  todayWeightKg: number;
  edwNote: string;
  todayDateStr: string;
  onOpenEdwModal: () => void;
}) {
  const { language, dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  // Conversions based on active unit
  const isKg = unit === "kg";
  const displayEdw = isKg ? edwKg.toFixed(1) : (edwKg * 2.20462).toFixed(1);
  const displayToday = isKg
    ? todayWeightKg.toFixed(1)
    : (todayWeightKg * 2.20462).toFixed(1);

  const diffVal = Number(displayToday) - Number(displayEdw);
  const diffPct =
    Number(displayEdw) > 0
      ? ((Math.abs(diffVal) / Number(displayEdw)) * 100).toFixed(1)
      : "0.0";

  const isAbove = diffVal > 0.0001;
  const isBelow = diffVal < -0.0001;
  const isTarget = !isAbove && !isBelow;

  let statusTitle = w?.edwMetrics?.aboveEdw || "Above EDW";
  let statusSubtitle = `${diffPct}% ${w?.edwMetrics?.aboveEdwSuffix || "above EDW"}`;
  let diffSign = "+";
  let statusTextColor = "text-red-600";
  let statusIconBg = "bg-[#FEF2F2] border border-red-100";
  let StatusIcon = () => (
    <ArrowUp className="h-6 w-6 sm:h-7 sm:w-7 text-red-600 stroke-[2.5]" />
  );

  if (isBelow) {
    statusTitle = w?.edwMetrics?.belowEdw || "Below EDW";
    statusSubtitle = `${diffPct}% ${w?.edwMetrics?.belowEdwSuffix || "below EDW"}`;
    diffSign = "-";
    statusTextColor = "text-amber-600";
    statusIconBg = "bg-amber-50 border border-amber-100";
    StatusIcon = () => (
      <ArrowDown className="h-6 w-6 sm:h-7 sm:w-7 text-amber-600 stroke-[2.5]" />
    );
  } else if (isTarget) {
    statusTitle = w?.edwMetrics?.atEdw || "At Target EDW";
    statusSubtitle = w?.edwMetrics?.atEdwSuffix || "On target with EDW";
    diffSign = "";
    statusTextColor = "text-emerald-600";
    statusIconBg = "bg-emerald-50 border border-emerald-100";
    StatusIcon = () => (
      <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-600" />
    );
  }

  const dateStr = language === "ES" ? "31 May, 7:30 AM" : "May 31, 7:30 AM";

  const secondaryCards = [
    {
      label: w?.metrics?.avgFluidIntake?.label || "Avg. Fluid Intake",
      value: "18",
      unit: w?.metrics?.avgFluidIntake?.unit || "OZ",
      subtitle: w?.metrics?.avgFluidIntake?.note || "↓ 1.2 lbs vs yesterday",
      subtitleClass: "text-emerald-600 font-bold",
      icon: Droplets,
      iconBg: "bg-sky-50 border border-sky-100",
      iconClass: "text-sky-600",
    },
    {
      label: w?.metrics?.daysGoalMet?.label || "Days Goal Met",
      value: "21 / 30",
      unit: "60%",
      subtitle: w?.metrics?.daysGoalMet?.note || "This Month",
      subtitleClass: "text-slate-500 font-medium",
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 border border-emerald-100",
      iconClass: "text-emerald-600",
    },
    {
      label: w?.metrics?.swellingReports?.label || "Swelling Reports",
      value: "5",
      unit: "",
      subtitle: w?.metrics?.swellingReports?.note || "↓ 2 vs last month",
      subtitleClass: "text-emerald-600 font-bold",
      icon: FileText,
      iconBg: "bg-amber-50 border border-amber-100",
      iconClass: "text-amber-600",
    },
    {
      label: w?.metrics?.sobReports?.label || "SOB Reports",
      value: "3",
      unit: "",
      subtitle: w?.metrics?.sobReports?.note || "↓ 1 vs last month",
      subtitleClass: "text-emerald-600 font-bold",
      icon: Wind,
      iconBg: "bg-rose-50 border border-rose-100",
      iconClass: "text-rose-500",
    },
  ];

  return (
    <section className="space-y-3.5">
      {/* Primary EDW Comparison Cards - Exactly matching the screenshot */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {/* Card 1: Estimated Dry Weight */}
        <div
          onClick={onOpenEdwModal}
          className="group relative flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-blue-300 hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-13 w-13 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EFF6FF] border border-blue-100 shadow-2xs group-hover:scale-105 transition-transform">
              <BathroomScaleIcon className="h-8 w-8 sm:h-9 sm:w-9" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {w?.edwMetrics?.estimatedDryWeight || "Estimated Dry Weight"}
              </p>
              <p className="mt-0.5 text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-950">
                {displayEdw}
                <span className="ml-1 text-sm sm:text-base font-bold text-slate-800">
                  {unit}
                </span>
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {edwNote || (w?.edwMetrics?.edwSetBy || "Set by care team.")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenEdwModal();
            }}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 cursor-pointer shadow-2xs active:scale-95 shrink-0"
          >
            <Pencil className="h-3 w-3" />
            <span>{language === "ES" ? "Editar" : "Edit"}</span>
          </button>
        </div>

        {/* Card 2: Today's Weight */}
        <div
          onClick={onOpenEdwModal}
          className="group relative flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-blue-300 hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-13 w-13 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EFF6FF] border border-blue-100 shadow-2xs group-hover:scale-105 transition-transform">
              <BathroomScaleIcon className="h-8 w-8 sm:h-9 sm:w-9" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {w?.edwMetrics?.todaysWeight || "Today's Weight"}
              </p>
              <p className="mt-0.5 text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-950">
                {displayToday}
                <span className="ml-1 text-sm sm:text-base font-bold text-slate-800">
                  {unit}
                </span>
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {todayDateStr}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenEdwModal();
            }}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 cursor-pointer shadow-2xs active:scale-95 shrink-0"
          >
            <Pencil className="h-3 w-3" />
            <span>{language === "ES" ? "Editar" : "Edit"}</span>
          </button>
        </div>

        {/* Card 3: Difference Above / Below EDW */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-md">
          <div
            className={`flex h-13 w-13 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full ${statusIconBg} shadow-2xs`}
          >
            <StatusIcon />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {statusTitle}
            </p>
            <p className="mt-0.5 text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-950">
              {diffSign}
              {Math.abs(diffVal).toFixed(1)}
              <span className="ml-1 text-sm sm:text-base font-bold text-slate-800">
                {unit}
              </span>
            </p>
            <p className={`mt-0.5 text-xs sm:text-[13px] font-bold ${statusTextColor}`}>
              {statusSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Supporting Symptom & Fluid Tracking Cards - Identical Font Size & Colors to New Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {secondaryCards.map((card) => (
          <article
            key={card.label}
            className="group relative flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div
              className={`flex h-13 w-13 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl ${card.iconBg} shadow-2xs group-hover:scale-105 transition-transform`}
            >
              <card.icon className={`h-7 w-7 sm:h-8 sm:w-8 ${card.iconClass}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {card.label}
              </p>
              <p className="mt-0.5 text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-950">
                {card.value}
                {card.unit && (
                  <span className="ml-1 text-sm sm:text-base font-bold text-slate-800">
                    {card.unit}
                  </span>
                )}
              </p>
              <p className={`mt-0.5 text-xs sm:text-[13px] truncate ${card.subtitleClass}`}>
                {card.subtitle}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function WeightTrendChart() {
  const { language, dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState<number>(550);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        const measured = containerRef.current.clientWidth;
        if (measured > 0) setContainerWidth(measured);
      }
    };
    updateWidth();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.round(entry.contentRect.width));
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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

  // Inner usable width inside container (subtracting p-3.5 = 14px * 2 = 28px padding)
  const width = Math.max(containerWidth - 28, 300);
  const height = 200;
  const left = 24;
  const right = 10;
  const top = 10;
  const bottom = 10;
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
    <section
      ref={containerRef}
      className="h-full rounded-2xl border border-[#DFE3E8] bg-[#FCFDFD] p-3.5"
    >
      <div className="flex items-center gap-1.5">
        <h2 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
          {w?.weightTrend?.title || "Weight Trend"}
        </h2>
        <span className="text-xs text-slate-600">
          {w?.weightTrend?.subtitle || "(30 Day)"}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height + 26}`}
        className="mt-3 h-[236px] w-full"
      >
        {[8, 6, 4, 2, 0].map((tick, index) => {
          const y = top + (index / 4) * plotHeight;
          return (
            <g key={tick}>
              <text
                x={left - 8}
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
            y={height + 20}
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

interface WeightFluidEntry {
  id: string;
  dateEn: string;
  dateEs: string;
  morning: string;
  evening: string;
  uo: string;
  intake: string;
  goal: string;
  swelling: string;
  sob: string;
  weakness: string;
  notes: string;
  noteKey: string | null;
  rapidGain?: string;
  dizziness?: string;
  cramping?: string;
  nausea?: string;
  fluidStatus?: "Above EDW" | "Near EDW" | "Below EDW";
  fluidStatusMsg?: string;
}

const INITIAL_ENTRIES: WeightFluidEntry[] = [
  {
    id: "1",
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
    rapidGain: "NO",
    dizziness: "NO",
    cramping: "NO",
    nausea: "NO",
    fluidStatus: "Above EDW",
    fluidStatusMsg: "Possible Fluid Overload",
    notes: "--",
    noteKey: null,
  },
  {
    id: "2",
    dateEn: "May 31, 2024",
    dateEs: "31 May, 2024",
    morning: "123",
    evening: "122",
    uo: "High",
    intake: "40",
    goal: "Goal Met",
    swelling: "Mild",
    sob: "NO",
    weakness: "NO",
    rapidGain: "NO",
    dizziness: "NO",
    cramping: "NO",
    nausea: "NO",
    fluidStatus: "Near EDW",
    fluidStatusMsg: "Appears On Target",
    notes: "Felt good today",
    noteKey: "feltGood",
  },
  {
    id: "3",
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
    rapidGain: "NO",
    dizziness: "NO",
    cramping: "NO",
    nausea: "NO",
    fluidStatus: "Above EDW",
    fluidStatusMsg: "Possible Fluid Overload",
    notes: "Need to push harder",
    noteKey: "needToPush",
  },
  {
    id: "4",
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
    rapidGain: "NO",
    dizziness: "NO",
    cramping: "NO",
    nausea: "NO",
    fluidStatus: "Above EDW",
    fluidStatusMsg: "Possible Fluid Overload",
    notes: "Strong finish",
    noteKey: "strongFinish",
  },
  {
    id: "5",
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
    rapidGain: "NO",
    dizziness: "NO",
    cramping: "NO",
    nausea: "NO",
    fluidStatus: "Above EDW",
    fluidStatusMsg: "Possible Fluid Overload",
    notes: "Best performance yet",
    noteKey: "bestPerformance",
  },
  {
    id: "6",
    dateEn: "June 28, 2024",
    dateEs: "28 Jun, 2024",
    morning: "102",
    evening: "120",
    uo: "High",
    intake: "35",
    goal: "Goal Met",
    swelling: "None",
    sob: "NO",
    weakness: "NO",
    rapidGain: "NO",
    dizziness: "NO",
    cramping: "NO",
    nausea: "NO",
    fluidStatus: "Below EDW",
    fluidStatusMsg: "Possible Too Much Fluid Removed",
    notes: "Felt tired",
    noteKey: "feltTired",
  },
  {
    id: "7",
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
    rapidGain: "NO",
    dizziness: "NO",
    cramping: "NO",
    nausea: "NO",
    fluidStatus: "Above EDW",
    fluidStatusMsg: "Possible Fluid Overload",
    notes: "--",
    noteKey: null,
  },
];

interface AddWeightLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: WeightFluidEntry) => void;
  edwKg?: number;
  unit?: "kg" | "lbs";
}

function AddWeightLogModal({
  isOpen,
  onClose,
  onSave,
  edwKg = 72.5,
  unit = "kg",
}: AddWeightLogModalProps) {
  const { language } = useLanguage();

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [formDate, setFormDate] = useState(getTodayDateString);
  const [formMorning, setFormMorning] = useState("");
  const [formEvening, setFormEvening] = useState("");
  const [formIntake, setFormIntake] = useState("");
  const [formGoal, setFormGoal] = useState("48 OZ");
  const [formGoalMet, setFormGoalMet] = useState(true);

  // Reset inputs when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormDate(getTodayDateString());
      setFormMorning("");
      setFormEvening("");
      setFormIntake("");
      setFormGoal("48 OZ");
      setFormGoalMet(true);
      setFormSwelling(false);
      setFormSob(false);
      setFormRapidGain(false);
      setFormDizziness(false);
      setFormCramping(false);
      setFormWeakness(false);
      setFormNausea(false);
      setFormUoAmount("Moderate");
      setFormUoTrend("decreasing");
      setFormNotes("");
    }
  }, [isOpen]);

  // Symptoms: Possible Fluid Overload
  const [formSwelling, setFormSwelling] = useState(false);
  const [formSob, setFormSob] = useState(false);
  const [formRapidGain, setFormRapidGain] = useState(false);

  // Symptoms: Possible Too Much Fluid Removed
  const [formDizziness, setFormDizziness] = useState(false);
  const [formCramping, setFormCramping] = useState(false);
  const [formWeakness, setFormWeakness] = useState(false);
  const [formNausea, setFormNausea] = useState(false);

  const [formUoAmount, setFormUoAmount] = useState("Moderate");
  const [formUoTrend, setFormUoTrend] = useState<"decreasing" | "noChange" | "increasing">("decreasing");
  const [formNotes, setFormNotes] = useState("");

  // Estimated Dry Weight (EDW) Connection Logic
  const edwNum = unit === "kg" ? edwKg : parseFloat((edwKg * 2.20462).toFixed(1));
  const [weightCompareMode, setWeightCompareMode] = useState<"evening" | "morning">("evening");
  const morningWeightNum = parseFloat(formMorning.replace(/[^0-9.]/g, "")) || 0;
  const eveningWeightNum = parseFloat(formEvening.replace(/[^0-9.]/g, "")) || 0;

  // Active weight being evaluated against EDW
  const currentWeightNum =
    weightCompareMode === "morning"
      ? (morningWeightNum || eveningWeightNum)
      : (eveningWeightNum || morningWeightNum);

  const weightDiff = currentWeightNum > 0 ? parseFloat((currentWeightNum - edwNum).toFixed(1)) : 0;

  const overloadCount = [formSwelling, formSob, formRapidGain].filter(Boolean).length;
  const deficitCount = [formDizziness, formCramping, formWeakness, formNausea].filter(Boolean).length;

  let fluidStatus: "Above EDW" | "Near EDW" | "Below EDW" = "Near EDW";
  let fluidStatusMsg = "Appears On Target";

  if (weightDiff > 0.5 || (weightDiff >= 0 && overloadCount >= 2)) {
    fluidStatus = "Above EDW";
    fluidStatusMsg = "Possible Fluid Overload";
  } else if (weightDiff < -0.5 || (weightDiff <= 0 && deficitCount >= 2)) {
    fluidStatus = "Below EDW";
    fluidStatusMsg = "Possible Too Much Fluid Removed";
  } else {
    // Near EDW range (-0.5 to +0.5)
    if (overloadCount >= 2) {
      fluidStatus = "Above EDW";
      fluidStatusMsg = "Possible Fluid Overload";
    } else if (deficitCount >= 2) {
      fluidStatus = "Below EDW";
      fluidStatusMsg = "Possible Too Much Fluid Removed";
    } else {
      fluidStatus = "Near EDW";
      fluidStatusMsg = "Appears On Target";
    }
  }

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let dateEn = "Today";
    let dateEs = "Hoy";
    if (formDate) {
      const parts = formDate.split("-").map(Number);
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        const [y, m, d] = parts;
        const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthsEs = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        dateEn = `${monthsEn[m - 1]} ${d}, ${y}`;
        dateEs = `${d} ${monthsEs[m - 1]}, ${y}`;
      }
    }

    const newEntry: WeightFluidEntry = {
      id: Date.now().toString(),
      dateEn,
      dateEs,
      morning: formMorning.trim() || "--",
      evening: formEvening.trim() || "--",
      uo: formUoAmount,
      intake: formIntake.replace(/[^0-9.]/g, "") || "0",
      goal: formGoalMet ? "Goal Met" : "Above Goal",
      swelling: formSwelling ? "YES" : "NO",
      sob: formSob ? "YES" : "NO",
      weakness: formWeakness ? "YES" : "NO",
      rapidGain: formRapidGain ? "YES" : "NO",
      dizziness: formDizziness ? "YES" : "NO",
      cramping: formCramping ? "YES" : "NO",
      nausea: formNausea ? "YES" : "NO",
      fluidStatus,
      fluidStatusMsg,
      notes: formNotes.trim() || "--",
      noteKey: null,
    };
    onSave(newEntry);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-slate-200/80 space-y-4 animate-in zoom-in-95 duration-150 no-scrollbar">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Scale className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-bold text-slate-900">
              {language === "ES" ? "Registrar Nuevo Control de Peso" : "Entry New Weight Log"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          {/* Row 1: Date Input Box */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 block">
              {language === "ES" ? "Fecha" : "Date"}
            </label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              onClick={(e) => {
                try {
                  (e.target as HTMLInputElement).showPicker?.();
                } catch {}
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
            />
          </div>

          {/* Row 2: Morning Weight & Evening Weight Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 block">
                {language === "ES"
                  ? `Peso Mañana (${unit.toUpperCase()})`
                  : `Morning Weight (${unit.toUpperCase()})`}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={formMorning}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  setFormMorning(val);
                  setWeightCompareMode("morning");
                }}
                placeholder={
                  unit === "kg"
                    ? (language === "ES" ? "ej. 72.9" : "e.g. 72.9")
                    : (language === "ES" ? "ej. 125" : "e.g. 125")
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 block">
                {language === "ES"
                  ? `Peso Tarde (${unit.toUpperCase()})`
                  : `Evening Weight (${unit.toUpperCase()})`}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={formEvening}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  setFormEvening(val);
                  setWeightCompareMode("evening");
                }}
                placeholder={
                  unit === "kg"
                    ? (language === "ES" ? "ej. 73.2" : "e.g. 73.2")
                    : (language === "ES" ? "ej. 122" : "e.g. 122")
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Row 3: Fluid Intake & Fluid Goal Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 block">
                {language === "ES" ? "Ingesta de Líquidos" : "Fluid Intake"}
              </label>
              <input
                type="text"
                value={formIntake}
                onChange={(e) => setFormIntake(e.target.value)}
                placeholder={language === "ES" ? "ej. 48 OZ" : "e.g. 48 OZ"}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 block">
                {language === "ES" ? "Meta de Líquidos" : "Fluid Goal"}
              </label>
              <input
                type="text"
                value={formGoal}
                onChange={(e) => setFormGoal(e.target.value)}
                placeholder="48 OZ"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Goal Met Row */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5">
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              {language === "ES" ? "Meta Cumplida" : "Goal Met"}
            </span>
            <div className="flex items-center gap-1 rounded-xl bg-[#DBEAFE]/80 p-1">
              <button
                type="button"
                onClick={() => setFormGoalMet(true)}
                className={`px-4 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  formGoalMet
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                {language === "ES" ? "Sí" : "Yes"}
              </button>
              <button
                type="button"
                onClick={() => setFormGoalMet(false)}
                className={`px-4 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !formGoalMet
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                {language === "ES" ? "No" : "No"}
              </button>
            </div>
          </div>

          {/* Fluid Status Check Section */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 space-y-3 shadow-2xs">
            {/* Section Header */}
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Droplets className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {language === "ES" ? "Control del Estado Hídrico" : "Fluid Status Check"}
                </h3>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {language === "ES"
                  ? "Ayúdenos a comprender cómo se siente después de la diálisis."
                  : "Help us understand how you’re feeling after dialysis."}
              </p>
            </div>



            {/* Subsection 1: Possible Fluid Overload */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                <h4 className="text-xs font-bold text-slate-800">
                  {language === "ES" ? "Posible Sobrecarga de Líquidos" : "Possible Fluid Overload"}
                </h4>
              </div>

              <div className="space-y-1.5">
                {/* Swelling */}
                <div className="flex items-center justify-between rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100 px-3.5 py-2 transition-colors">
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    {language === "ES" ? "Hinchazón" : "Swelling"}
                  </span>
                  <div className="flex items-center gap-1 rounded-xl bg-[#DBEAFE]/80 p-1">
                    <button
                      type="button"
                      onClick={() => setFormSwelling(true)}
                      className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formSwelling
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      {language === "ES" ? "Sí" : "Yes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormSwelling(false)}
                      className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !formSwelling
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      {language === "ES" ? "No" : "No"}
                    </button>
                  </div>
                </div>

                {/* Shortness of Breath */}
                <div className="flex items-center justify-between rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100 px-3.5 py-2 transition-colors">
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    {language === "ES" ? "Falta de Aire" : "Shortness of Breath"}
                  </span>
                  <div className="flex items-center gap-1 rounded-xl bg-[#DBEAFE]/80 p-1">
                    <button
                      type="button"
                      onClick={() => setFormSob(true)}
                      className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formSob
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      {language === "ES" ? "Sí" : "Yes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormSob(false)}
                      className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !formSob
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      {language === "ES" ? "No" : "No"}
                    </button>
                  </div>
                </div>

                {/* Sudden / Rapid Weight Gain */}
                <div className="flex items-center justify-between rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100 px-3.5 py-2 transition-colors">
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    {language === "ES" ? "Aumento de Peso Repentino / Rápido" : "Sudden / Rapid Weight Gain"}
                  </span>
                  <div className="flex items-center gap-1 rounded-xl bg-[#DBEAFE]/80 p-1">
                    <button
                      type="button"
                      onClick={() => setFormRapidGain(true)}
                      className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formRapidGain
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      {language === "ES" ? "Sí" : "Yes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormRapidGain(false)}
                      className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !formRapidGain
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      {language === "ES" ? "No" : "No"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Subsection 2: Possible Too Much Fluid Removed */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                <h4 className="text-xs font-bold text-slate-800">
                  {language === "ES" ? "Posible Exceso de Líquido Eliminado" : "Possible Too Much Fluid Removed"}
                </h4>
              </div>

              <div className="space-y-1.5">
                {/* Dizziness */}
                <div className="flex items-center justify-between rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100 px-3.5 py-2 transition-colors">
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    {language === "ES" ? "Mareos" : "Dizziness"}
                  </span>
                  <div className="flex items-center gap-1 rounded-xl bg-[#DBEAFE]/80 p-1">
                    <button
                      type="button"
                      onClick={() => setFormDizziness(true)}
                      className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formDizziness
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      {language === "ES" ? "Sí" : "Yes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormDizziness(false)}
                      className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !formDizziness
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      {language === "ES" ? "No" : "No"}
                    </button>
                  </div>
                </div>

                {/* Cramping */}
                <div className="flex items-center justify-between rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100 px-3.5 py-2 transition-colors">
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    {language === "ES" ? "Calambres" : "Cramping"}
                  </span>
                  <div className="flex items-center gap-1 rounded-xl bg-[#DBEAFE]/80 p-1">
                    <button
                      type="button"
                      onClick={() => setFormCramping(true)}
                      className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formCramping
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      {language === "ES" ? "Sí" : "Yes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormCramping(false)}
                      className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !formCramping
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      {language === "ES" ? "No" : "No"}
                    </button>
                  </div>
                </div>

                {/* Weakness (Reused existing field) */}
                <div className="flex items-center justify-between rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100 px-3.5 py-2 transition-colors">
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    {language === "ES" ? "Debilidad" : "Weakness"}
                  </span>
                  <div className="flex items-center gap-1 rounded-xl bg-[#DBEAFE]/80 p-1">
                    <button
                      type="button"
                      onClick={() => setFormWeakness(true)}
                      className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formWeakness
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      {language === "ES" ? "Sí" : "Yes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormWeakness(false)}
                      className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !formWeakness
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      {language === "ES" ? "No" : "No"}
                    </button>
                  </div>
                </div>

                {/* Nausea */}
                <div className="flex items-center justify-between rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100 px-3.5 py-2 transition-colors">
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    {language === "ES" ? "Náuseas" : "Nausea"}
                  </span>
                  <div className="flex items-center gap-1 rounded-xl bg-[#DBEAFE]/80 p-1">
                    <button
                      type="button"
                      onClick={() => setFormNausea(true)}
                      className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formNausea
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      {language === "ES" ? "Sí" : "Yes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormNausea(false)}
                      className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !formNausea
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      {language === "ES" ? "No" : "No"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Urinary Output (24 Hours) Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 space-y-2.5">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                {language === "ES" ? "Gasto Urinario" : "Urinary Output"}
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                {language === "ES" ? "(24 Horas)" : "(24 Hours)"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 block">
                  {language === "ES" ? "Cantidad" : "Amount"}
                </label>
                <div className="relative">
                  <select
                    value={formUoAmount}
                    onChange={(e) => setFormUoAmount(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer pr-7 shadow-2xs"
                  >
                    <option value="Moderate">{language === "ES" ? "Moderada" : "Moderate"}</option>
                    <option value="Low">{language === "ES" ? "Baja" : "Low"}</option>
                    <option value="Normal">{language === "ES" ? "Normal" : "Normal"}</option>
                    <option value="High">{language === "ES" ? "Alta" : "High"}</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 block">
                  {language === "ES" ? "Tendencia" : "Trend"}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFormUoTrend("decreasing")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      formUoTrend === "decreasing"
                        ? "bg-red-50 border-2 border-red-500 text-red-700 shadow-2xs"
                        : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                      <ArrowDown className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                    <span className="truncate text-[11px] sm:text-xs">
                      {language === "ES" ? "Disminuyendo" : "Decreasing"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormUoTrend("noChange")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      formUoTrend === "noChange"
                        ? "bg-blue-50 border-2 border-blue-500 text-blue-700 shadow-2xs"
                        : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Minus className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                    <span className="truncate text-[11px] sm:text-xs">
                      {language === "ES" ? "Sin Cambios" : "No Change"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormUoTrend("increasing")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      formUoTrend === "increasing"
                        ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-700 shadow-2xs"
                        : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <ArrowUp className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                    <span className="truncate text-[11px] sm:text-xs">
                      {language === "ES" ? "Aumentando" : "Increasing"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notes (Optional) Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              {language === "ES" ? "Notas (Opcional)" : "Notes (Optional)"}
            </label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder={
                language === "ES"
                  ? "ej. Tomé todos los medicamentos después de la sesión."
                  : "e.g. Took all meds after session."
              }
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none shadow-2xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
            >
              {language === "ES" ? "Cancelar" : "Cancel"}
            </button>
            <button
              type="submit"
              className="flex h-11 items-center justify-center rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-xs hover:shadow cursor-pointer active:scale-[0.98]"
            >
              {language === "ES" ? "Guardar Registro" : "Save Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RecentEntries({
  entries,
  onOpenAddModal,
}: {
  entries: WeightFluidEntry[];
  onOpenAddModal: () => void;
}) {
  const { language, dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  const translateGoal = (goal: string) => {
    if (goal === "Goal Met") return w?.recentEntries?.values?.goalMet || "Goal Met";
    if (goal === "Above Goal") return w?.recentEntries?.values?.aboveGoal || "Above Goal";
    return goal;
  };

  const translateSwelling = (swelling: string) => {
    if (swelling === "None" || swelling === "NO") return w?.recentEntries?.values?.none || (language === "ES" ? "Ninguna" : "None");
    if (swelling === "YES") return language === "ES" ? "Sí" : "Yes";
    if (swelling === "Mild") return w?.recentEntries?.values?.mild || "Mild";
    if (swelling === "Moderate") return language === "ES" ? "Moderada" : "Moderate";
    if (swelling === "Severe") return language === "ES" ? "Grave" : "Severe";
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
          onClick={onOpenAddModal}
          className="flex h-12 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold tracking-[0.08px] text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700 cursor-pointer active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" />
          {w?.recentEntries?.addNewEntry || "New Entry"}
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
              {entries.map((entry, index) => {
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
                    key={entry.id || `${entry.dateEn}-${index}`}
                    className="border-b border-dashed border-[#C4CDD5] last:border-b-0 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-3 py-3 text-[#1C252E] font-semibold">{dateLabel}</td>
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
                      <div className="flex flex-col gap-1">
                        <GoalBadge status={goalLabel} isGoalMet={isGoalMet} />
                        {entry.fluidStatus && (
                          <span
                            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold w-fit ${
                              entry.fluidStatus === "Above EDW"
                                ? "bg-amber-50 text-amber-700"
                                : entry.fluidStatus === "Below EDW"
                                ? "bg-sky-50 text-sky-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            <span className="h-1 w-1 rounded-full bg-current" />
                            {language === "ES"
                              ? entry.fluidStatus === "Above EDW"
                                ? "Sobre EDW"
                                : entry.fluidStatus === "Below EDW"
                                ? "Bajo EDW"
                                : "En EDW"
                              : entry.fluidStatus}
                          </span>
                        )}
                      </div>
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

function EditEdwModal({
  isOpen,
  onClose,
  edwKg,
  todayWeightKg,
  edwNote,
  todayDateStr,
  unit,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  edwKg: number;
  todayWeightKg: number;
  edwNote: string;
  todayDateStr: string;
  unit: "kg" | "lbs";
  onSave: (data: {
    edwKg: number;
    todayWeightKg: number;
    edwNote: string;
    todayDateStr: string;
  }) => void;
}) {
  const { language, dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  const isKg = unit === "kg";
  const [formEdw, setFormEdw] = useState(
    isKg ? edwKg.toString() : (edwKg * 2.20462).toFixed(1)
  );
  const [formToday, setFormToday] = useState(
    isKg ? todayWeightKg.toString() : (todayWeightKg * 2.20462).toFixed(1)
  );
  const [formNote, setFormNote] = useState(edwNote);
  const [formDate, setFormDate] = useState(todayDateStr);

  useEffect(() => {
    if (isOpen) {
      setFormEdw(isKg ? edwKg.toString() : (edwKg * 2.20462).toFixed(1));
      setFormToday(
        isKg ? todayWeightKg.toString() : (todayWeightKg * 2.20462).toFixed(1)
      );
      setFormNote(edwNote);
      setFormDate(todayDateStr);
    }
  }, [isOpen, isKg, edwKg, todayWeightKg, edwNote, todayDateStr]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedEdw = parseFloat(formEdw) || edwKg;
    const parsedToday = parseFloat(formToday) || todayWeightKg;

    const finalEdwKg = isKg ? parsedEdw : parsedEdw / 2.20462;
    const finalTodayKg = isKg ? parsedToday : parsedToday / 2.20462;

    onSave({
      edwKg: parseFloat(finalEdwKg.toFixed(2)),
      todayWeightKg: parseFloat(finalTodayKg.toFixed(2)),
      edwNote:
        formNote.trim() ||
        (language === "ES"
          ? "Establecido por el equipo de atención."
          : "Set by care team."),
      todayDateStr:
        formDate.trim() ||
        (language === "ES" ? "31 May, 7:30 AM" : "May 31, 7:30 AM"),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200/80 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
              <BathroomScaleIcon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {w?.edwMetrics?.editSettings ||
                (language === "ES"
                  ? "Configuración de Peso y EDW"
                  : "Weight & EDW Settings")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              {w?.edwMetrics?.estimatedDryWeight || "Estimated Dry Weight"} ({unit})
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={formEdw}
              onChange={(e) => setFormEdw(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder={isKg ? "72.5" : "159.8"}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              {language === "ES"
                ? "Nota de EDW / Proveedor"
                : "EDW Care Team Note"}
            </label>
            <input
              type="text"
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder={
                language === "ES"
                  ? "ej. Establecido por el equipo de atención."
                  : "e.g. Set by care team."
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              {w?.edwMetrics?.todaysWeight || "Today's Weight"} ({unit})
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={formToday}
              onChange={(e) =>
                setFormToday(e.target.value.replace(/[^0-9.]/g, ""))
              }
              placeholder={isKg ? "72.9" : "160.7"}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              {language === "ES" ? "Fecha y Hora" : "Date & Timestamp"}
            </label>
            <input
              type="text"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              placeholder="May 31, 7:30 AM"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
            >
              {language === "ES" ? "Cancelar" : "Cancel"}
            </button>
            <button
              type="submit"
              className="flex h-11 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-xs hover:shadow cursor-pointer active:scale-[0.98]"
            >
              {w?.edwMetrics?.saveSettings ||
                (language === "ES" ? "Guardar" : "Save Settings")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FluidTrackerPage() {
  const { language, dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  const [entries, setEntries] = useState<WeightFluidEntry[]>(INITIAL_ENTRIES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdwModalOpen, setIsEdwModalOpen] = useState(false);

  // Unit toggle state: "kg" or "lbs", defaulting to "kg" as in screenshot
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");

  // EDW and Today's weight values stored in kg
  const [edwKg, setEdwKg] = useState<number>(72.5);
  const [todayWeightKg, setTodayWeightKg] = useState<number>(72.9);
  const [edwNote, setEdwNote] = useState<string>("Set by care team.");
  const [todayDateStr, setTodayDateStr] = useState<string>("May 31, 7:30 AM");

  const handleSaveEntry = (newEntry: WeightFluidEntry) => {
    setEntries([newEntry, ...entries]);
    setIsModalOpen(false);
    // If a morning weight is logged, sync it as Today's weight
    const weightVal = parseFloat(newEntry.morning);
    if (!isNaN(weightVal) && weightVal > 0) {
      if (unit === "kg") {
        setTodayWeightKg(parseFloat(weightVal.toFixed(1)));
      } else {
        setTodayWeightKg(parseFloat((weightVal / 2.20462).toFixed(1)));
      }
      setTodayDateStr(
        language === "ES"
          ? "Hoy, " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Today, " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }
  };

  const handleSaveEdwSettings = (data: {
    edwKg: number;
    todayWeightKg: number;
    edwNote: string;
    todayDateStr: string;
  }) => {
    setEdwKg(data.edwKg);
    setTodayWeightKg(data.todayWeightKg);
    setEdwNote(data.edwNote);
    setTodayDateStr(data.todayDateStr);
  };

  // Date Picker filter state: "today" or "custom"
  const [selectedDateFilter, setSelectedDateFilter] = useState<"today" | "custom">("today");
  const [selectedCustomDate, setSelectedCustomDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDatePickerOpen(false);
      }
    }
    if (isDatePickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDatePickerOpen]);

  const displayDateText = useMemo(() => {
    if (selectedDateFilter === "today") {
      return language === "ES" ? "Hoy" : "Today";
    }
    if (selectedDateFilter === "custom" && selectedCustomDate) {
      const parts = selectedCustomDate.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString(language === "ES" ? "es-ES" : "en-US", {
          month: "short",
          day: "numeric",
        });
      }
    }
    return language === "ES" ? "Hoy" : "Today";
  }, [selectedDateFilter, selectedCustomDate, language]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-medium leading-none text-slate-950 sm:text-[32px]">
            {w?.title || "Weight & Fluid Management Center"}
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          {/* Unit Switcher: kg / lbs */}
          <div className="flex h-10 sm:h-12 items-center rounded-xl border border-slate-200 bg-[#F1F5F9] p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setUnit("kg")}
              className={`h-full px-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                unit === "kg"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              kg
            </button>
            <button
              type="button"
              onClick={() => setUnit("lbs")}
              className={`h-full px-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                unit === "lbs"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              lbs
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex h-10 sm:h-12 items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-blue-600 px-3 sm:px-4 text-xs sm:text-base font-bold tracking-[0.08px] text-white shadow-xs transition-colors hover:bg-blue-700 cursor-pointer active:scale-[0.98] whitespace-nowrap"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span>{w?.recentEntries?.addNewEntry || "New Entry"}</span>
          </button>

          {/* Date Picker Selector with Today & Custom Date Options */}
          <div className="relative" ref={datePickerRef}>
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className={`flex h-10 sm:h-12 shrink-0 items-center justify-center gap-1.5 sm:gap-2 rounded-xl border px-3 sm:px-4 text-xs sm:text-base font-bold tracking-[0.08px] transition-all cursor-pointer whitespace-nowrap ${
                isDatePickerOpen
                  ? "border-blue-500 bg-blue-50/50 text-blue-700 shadow-xs"
                  : "border-slate-200 bg-[#F9F9F9] text-slate-950 hover:bg-white"
              }`}
            >
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-slate-700" />
              <span>{displayDateText}</span>
              <ChevronDown
                className={`h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-500 transition-transform duration-200 ${
                  isDatePickerOpen ? "rotate-180 text-blue-600" : ""
                }`}
              />
            </button>

            {/* Floating Date Picker Dropdown Popover */}
            {isDatePickerOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                {/* Header with Title and Close */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
                    {language === "ES" ? "Seleccionar Fecha" : "Select Date"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(false)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Quick Selection: Today Option */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDateFilter("today");
                      setIsDatePickerOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl p-2.5 sm:p-3 text-left transition-all cursor-pointer ${
                      selectedDateFilter === "today"
                        ? "bg-blue-50 border border-blue-200 text-blue-800"
                        : "hover:bg-slate-50 border border-transparent text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                          selectedDateFilter === "today"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold leading-tight">
                          {language === "ES" ? "Hoy (Fecha actual)" : "Today (Current Date)"}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {new Date().toLocaleDateString(language === "ES" ? "es-ES" : "en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                    {selectedDateFilter === "today" && (
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                </div>

                {/* Divider: Custom Date Picker */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {language === "ES" ? "Elegir Fecha (Date Picker):" : "Pick Date (Date Picker):"}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={selectedCustomDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedCustomDate(e.target.value);
                          setSelectedDateFilter("custom");
                        }
                      }}
                      onClick={(e) => {
                        try {
                          (e.target as HTMLInputElement).showPicker?.();
                        } catch {}
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDateFilter("custom");
                      setIsDatePickerOpen(false);
                    }}
                    className="mt-2.5 w-full flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 shadow-xs transition-colors cursor-pointer active:scale-[0.98]"
                  >
                    {language === "ES" ? "Aplicar Fecha" : "Apply Date"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <MetricCards
        unit={unit}
        edwKg={edwKg}
        todayWeightKg={todayWeightKg}
        edwNote={edwNote}
        todayDateStr={todayDateStr}
        onOpenEdwModal={() => setIsEdwModalOpen(true)}
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <WeightTrendChart />
        <GoalProgress />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,540px)_minmax(240px,262px)_minmax(240px,1fr)]">
        <FluidIntakeTrend />
        <UrinaryOutput />
        <AlertsInsights />
      </section>

      <RecentEntries
        entries={entries}
        onOpenAddModal={() => setIsModalOpen(true)}
      />

      {/* Entry New Weight Log Modal */}
      <AddWeightLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEntry}
        edwKg={edwKg}
        unit={unit}
      />

      {/* Quick Edit EDW & Weight Settings Modal */}
      <EditEdwModal
        isOpen={isEdwModalOpen}
        onClose={() => setIsEdwModalOpen(false)}
        edwKg={edwKg}
        todayWeightKg={todayWeightKg}
        edwNote={edwNote}
        todayDateStr={todayDateStr}
        unit={unit}
        onSave={handleSaveEdwSettings}
      />
    </div>
  );
}
