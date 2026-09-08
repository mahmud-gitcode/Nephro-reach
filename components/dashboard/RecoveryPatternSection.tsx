"use client";

import React from "react";
import { Activity, TrendingUp, Clock, Smile } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export interface RecoveryPoint {
  day: string;
  good: number;
  okay: number;
  bad: number;
}

const DEFAULT_DAYS_BY_TREATMENT: Record<string, RecoveryPoint[]> = {
  "tx-1": [
    { day: "Fri", good: 35, okay: 45, bad: 20 },
    { day: "Sat", good: 65, okay: 25, bad: 10 },
    { day: "Sun", good: 80, okay: 15, bad: 5 },
  ],
  "tx-2": [
    { day: "Mon", good: 40, okay: 45, bad: 15 },
    { day: "Tue", good: 70, okay: 20, bad: 10 },
    { day: "Wed", good: 80, okay: 15, bad: 5 },
  ],
  "tx-3": [
    { day: "Wed", good: 45, okay: 35, bad: 20 },
    { day: "Thu", good: 65, okay: 25, bad: 10 },
    { day: "Fri", good: 80, okay: 15, bad: 5 },
  ],
  "tx-4": [
    { day: "Fri", good: 35, okay: 45, bad: 20 },
    { day: "Sat", good: 65, okay: 25, bad: 10 },
    { day: "Sun", good: 75, okay: 20, bad: 5 },
  ],
};

const DEFAULT_POINTS: RecoveryPoint[] = [
  { day: "Fri", good: 35, okay: 45, bad: 20 },
  { day: "Sat", good: 65, okay: 25, bad: 10 },
  { day: "Sun", good: 80, okay: 15, bad: 5 },
];

const LOCALIZED_DAYS: Record<string, Record<string, string>> = {
  ES: {
    Fri: "Vie",
    Sat: "Sáb",
    Sun: "Dom",
    Mon: "Lun",
    Tue: "Mar",
    Wed: "Mié",
    Thu: "Jue",
  },
  EN: {
    Fri: "Fri",
    Sat: "Sat",
    Sun: "Sun",
    Mon: "Mon",
    Tue: "Tue",
    Wed: "Wed",
    Thu: "Thu",
  },
};

interface RecoveryPatternSectionProps {
  treatmentId?: string;
  points?: RecoveryPoint[];
}

export default function RecoveryPatternSection({
  treatmentId,
  points,
}: RecoveryPatternSectionProps) {
  const { language, dictionary } = useLanguage();
  const dt = dictionary.dialysisTreatment;

  const recoveryPoints =
    points ||
    (treatmentId ? DEFAULT_DAYS_BY_TREATMENT[treatmentId] : null) ||
    DEFAULT_POINTS;

  const width = 640;
  const height = 230;
  const paddingLeft = 40;
  const paddingRight = 25;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const getX = (index: number) =>
    recoveryPoints.length <= 1
      ? paddingLeft + chartW / 2
      : paddingLeft + (index / (recoveryPoints.length - 1)) * chartW;
  const getY = (val: number) =>
    paddingTop + chartH - (val / 100) * chartH;

  const getCurvePath = (key: "good" | "okay" | "bad") => {
    if (recoveryPoints.length === 0) return "";
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
    <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1e3a8a] tracking-tight uppercase">
            {dt?.recoveryPattern?.title || "Recovery Pattern Tracking"}
          </h2>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-2xl shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#2563EB]" />
            {dt?.recoveryPattern?.good || (language === "ES" ? "Bueno" : "Good")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#F59E0B]" />
            {dt?.recoveryPattern?.okay || (language === "ES" ? "Regular" : "Okay")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#EF4444]" />
            {dt?.recoveryPattern?.bad || (language === "ES" ? "Malo" : "Bad")}
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-x-auto rounded-2xl bg-slate-50/40 border border-slate-100 p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[500px]">
          {[100, 80, 60, 40, 20, 0].map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px] font-medium"
                >
                  {tick}%
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
              <g key={pt.day + idx}>
                <circle cx={cx} cy={getY(pt.good)} r="4.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx={cx} cy={getY(pt.okay)} r="4.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx={cx} cy={getY(pt.bad)} r="4.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />

                <text
                  x={cx}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-slate-600 text-xs font-bold"
                >
                  {LOCALIZED_DAYS[language]?.[pt.day] || pt.day}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              {language === "ES" ? "Tiempo Promedio de Recuperación" : "Average Recovery Time"}
            </p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">3.2 hrs</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100">
            <Smile className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              {language === "ES" ? "Sesiones con Buena Recuperación" : "Good Recovery Rate"}
            </p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">68%</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 border border-purple-100">
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              {language === "ES" ? "Tendencia General" : "Overall Trend"}
            </p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {language === "ES" ? "Mejorando" : "Improving"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
