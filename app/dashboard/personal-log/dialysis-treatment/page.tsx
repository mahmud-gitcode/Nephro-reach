"use client";

import React, { useState } from "react";
import {
  Calendar,
  CalendarX,
  CheckCircle2,
  Clock,
  Info,
  Plus,
  Timer,
} from "lucide-react";
import AddDialysisEntryModal from "@/components/dashboard/AddDialysisEntryModal";

const summaryCards = [
  {
    label: "Treatment attended",
    value: "90%",
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-100",
  },
  {
    label: "Arrived late",
    value: "2",
    icon: Clock,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-100",
  },
  {
    label: "Ended early",
    value: "4",
    icon: Timer,
    iconColor: "text-red-500",
    bgColor: "bg-red-50 border-red-100",
  },
  {
    label: "Missed treatments",
    value: "2",
    icon: CalendarX,
    iconColor: "text-rose-500",
    bgColor: "bg-rose-50 border-rose-100",
  },
];

const recoveryPoints = [
  { month: "Mar", good: 10, okay: 20, bad: 40 },
  { month: "Apr", good: 68, okay: 55, bad: 27 },
  { month: "May", good: 30, okay: 33, bad: 12 },
  { month: "Jun", good: 60, okay: 20, bad: 70 },
];

const symptomSlices = [
  { label: "Cramping", count: 29, percent: 50, color: "#2563EB" },
  { label: "Low BP", count: 16, percent: 28, color: "#F59E0B" },
  { label: "Fatigue", count: 13, percent: 22, color: "#EF4444" },
];

function SummaryCards() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => (
        <div
          key={card.label}
          className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs"
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${card.bgColor}`}
          >
            <card.icon className={`h-6 w-6 ${card.iconColor}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">{card.label}</p>
            <p className="mt-0.5 text-3xl font-bold text-slate-900 tracking-tight">
              {card.value}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}

function RecoveryPatternChart() {
  const width = 540;
  const height = 210;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 30;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const getX = (index: number) =>
    paddingLeft + (index / (recoveryPoints.length - 1)) * chartW;
  const getY = (val: number) =>
    paddingTop + chartH - (val / 100) * chartH;

  const getCurvePath = (key: "good" | "okay" | "bad") => {
    const coords = recoveryPoints.map((pt, idx) => ({
      x: getX(idx),
      y: getY(pt[key]),
    }));

    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 2;
      const cp1y = curr.y;
      const cp2x = curr.x + (next.x - curr.x) / 2;
      const cp2y = next.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return path;
  };

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">
          Recovery Pattern Tracking
        </h2>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#2563EB]" />
            Good
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#F59E0B]" />
            Okay
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#EF4444]" />
            Bad
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[420px]">
          {[100, 80, 60, 40, 20, 0].map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px] font-medium"
                >
                  {tick}
                </text>
                <line
                  x1={paddingLeft}
                  x2={width - paddingRight}
                  y1={y}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          <path
            d={getCurvePath("good")}
            fill="none"
            stroke="#2563EB"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d={getCurvePath("okay")}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={getCurvePath("bad")}
            fill="none"
            stroke="#EF4444"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {recoveryPoints.map((pt, idx) => {
            const cx = getX(idx);
            return (
              <g key={pt.month}>
                <circle cx={cx} cy={getY(pt.good)} r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx={cx} cy={getY(pt.okay)} r="4" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx={cx} cy={getY(pt.bad)} r="4" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />

                <text
                  x={cx}
                  y={height - 5}
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px] font-medium"
                >
                  {pt.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function SymptomsDonut() {
  const size = 210;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedOffset = 0;

  return (
    <section className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
      <h2 className="text-base font-bold text-slate-900">
        Symptoms During Treatment
      </h2>

      <div className="relative flex justify-center items-center py-2">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
            />
            {symptomSlices.map((slice) => {
              const strokeDasharray = `${(slice.percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedOffset;
              accumulatedOffset += (slice.percent / 100) * circumference;

              return (
                <circle
                  key={slice.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-slate-900">86%</span>
            <span className="text-xs font-medium text-slate-500 mt-0.5">Overall</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
        {symptomSlices.map((slice) => (
          <div key={slice.label} className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span>{slice.label}</span>
            </div>
            <p className="text-xs font-bold text-slate-900">
              {slice.count} ({slice.percent}%)
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DialysisTreatmentPage() {
  const [selectedMonth, setSelectedMonth] = useState("Jun");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="w-full space-y-6">
      {/* TOP EDUCATIONAL BANNER, MONTH PICKER & ADD ENTRY BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200/80 bg-[#FFFBEB] px-4 py-3 text-xs sm:text-sm font-semibold text-[#92400E] shadow-2xs flex-1">
          <Info className="h-5 w-5 shrink-0 text-[#B45309]" />
          <span>Completing prescribed treatments is important for dialysis adequacy</span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Calendar className="h-4 w-4 text-slate-600" />
            <span>{selectedMonth}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* TOP 4 SUMMARY CARDS */}
      <SummaryCards />

      {/* MAIN CHARTS SECTION: RECOVERY PATTERN & SYMPTOMS DONUT */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div className="xl:col-span-8">
          <RecoveryPatternChart />
        </div>
        <div className="xl:col-span-4">
          <SymptomsDonut />
        </div>
      </section>

      {/* ADD DIALYSIS ENTRY MODAL */}
      <AddDialysisEntryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
