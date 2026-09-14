"use client";

import React, { useState } from "react";
import { TrendingUp, Clock, Smile } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export interface RecoveryPoint {
  day: string;
  good: number;
  okay: number;
  bad: number;
}

const DEFAULT_DAYS_BY_TREATMENT: Record<string, RecoveryPoint[]> = {
  "tx-1": [
    { day: "Fri", good: 22, okay: 46, bad: 36 },
    { day: "Sat", good: 68, okay: 28, bad: 14 },
    { day: "Sun", good: 44, okay: 55, bad: 20 },
  ],
  "tx-2": [
    { day: "Mon", good: 28, okay: 50, bad: 32 },
    { day: "Tue", good: 72, okay: 24, bad: 12 },
    { day: "Wed", good: 48, okay: 58, bad: 18 },
  ],
  "tx-3": [
    { day: "Wed", good: 24, okay: 44, bad: 38 },
    { day: "Thu", good: 66, okay: 28, bad: 15 },
    { day: "Fri", good: 42, okay: 54, bad: 22 },
  ],
  "tx-4": [
    { day: "Fri", good: 25, okay: 45, bad: 35 },
    { day: "Sat", good: 70, okay: 25, bad: 12 },
    { day: "Sun", good: 46, okay: 52, bad: 18 },
  ],
};

const DEFAULT_POINTS: RecoveryPoint[] = [
  { day: "Fri", good: 22, okay: 46, bad: 36 },
  { day: "Sat", good: 68, okay: 28, bad: 14 },
  { day: "Sun", good: 44, okay: 55, bad: 20 },
];

const DEFAULT_WEEKLY_POINTS_4W: RecoveryPoint[] = [
  { day: "Week 1", good: 15, okay: 22, bad: 40 },
  { day: "Week 2", good: 68, okay: 55, bad: 27 },
  { day: "Week 3", good: 30, okay: 33, bad: 12 },
  { day: "Week 4", good: 60, okay: 20, bad: 70 },
];

const DEFAULT_WEEKLY_POINTS_8W: RecoveryPoint[] = [
  { day: "Week 1", good: 18, okay: 26, bad: 42 },
  { day: "Week 2", good: 64, okay: 52, bad: 28 },
  { day: "Week 3", good: 32, okay: 36, bad: 16 },
  { day: "Week 4", good: 68, okay: 24, bad: 58 },
  { day: "Week 5", good: 42, okay: 54, bad: 22 },
  { day: "Week 6", good: 76, okay: 34, bad: 20 },
  { day: "Week 7", good: 52, okay: 44, bad: 14 },
  { day: "Week 8", good: 82, okay: 22, bad: 28 },
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
  mode?: "daily" | "weekly";
}

export default function RecoveryPatternSection({
  treatmentId,
  points,
  mode = "daily",
}: RecoveryPatternSectionProps) {
  const { language, dictionary } = useLanguage();
  const dt = dictionary?.dialysisTreatment;

  const isWeekly = mode === "weekly";
  const [weeklyRange, setWeeklyRange] = useState<"4w" | "8w">("4w");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const recoveryPoints =
    points ||
    (isWeekly
      ? weeklyRange === "8w"
        ? DEFAULT_WEEKLY_POINTS_8W
        : DEFAULT_WEEKLY_POINTS_4W
      : treatmentId
      ? DEFAULT_DAYS_BY_TREATMENT[treatmentId]
      : null) ||
    (isWeekly ? DEFAULT_WEEKLY_POINTS_4W : DEFAULT_POINTS);

  const formatLabel = (val: string) => {
    if (isWeekly) {
      if (language === "ES") {
        return val.replace(/^Week\s*/i, "Semana ");
      }
      return val;
    }
    return LOCALIZED_DAYS[language]?.[val] || val;
  };

  // SVG Chart Geometry
  const width = 720;
  const height = 250;
  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 45;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (recoveryPoints.length <= 1) {
      return paddingLeft + chartW / 2;
    }
    return paddingLeft + (index / (recoveryPoints.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    return paddingTop + chartH - (val / 100) * chartH;
  };

  // Smooth Catmull-Rom spline converting to Cubic Bezier for natural fluid curve
  const getCurvePath = (key: "good" | "okay" | "bad") => {
    if (recoveryPoints.length === 0) return "";
    const coords = recoveryPoints.map((pt, idx) => ({
      x: getX(idx),
      y: getY(pt[key]),
    }));

    if (coords.length === 1) {
      return `M ${coords[0].x} ${coords[0].y}`;
    }

    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = i > 0 ? coords[i - 1] : coords[i];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = i < coords.length - 2 ? coords[i + 2] : p2;

      // Catmull-Rom to Cubic Bezier control points
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const hoveredPoint = hoveredIndex !== null ? recoveryPoints[hoveredIndex] : null;

  return (
    <section className="rounded-panel border border-line bg-surface p-6 sm:p-8 shadow-control space-y-6 animate-in fade-in duration-200">
      {/* Header matching reference mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-fg tracking-tight">
            {isWeekly
              ? language === "ES"
                ? "Tendencia Semanal de Recuperación"
                : "Weekly Recovery Trend Tracking"
              : dt?.recoveryPattern?.title || "Recovery Pattern Tracking"}
          </h2>
          {isWeekly && (
            <p className="text-xs text-fg-muted font-medium mt-1">
              {language === "ES"
                ? "Progreso de recuperación post-diálisis organizado por semanas"
                : "Post-dialysis recovery progress aggregated week-by-week"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Time range selector in weekly mode */}
          {isWeekly && (
            <div className="flex items-center rounded-control bg-surface-sunken p-1 border border-line text-xs font-semibold text-fg-muted">
              <button
                type="button"
                onClick={() => setWeeklyRange("4w")}
                className={`px-3 py-1 rounded-control transition-all cursor-pointer ${
                  weeklyRange === "4w"
                    ? "bg-surface text-fg shadow-control"
                    : "text-fg-muted hover:text-fg-secondary"
                }`}
              >
                {language === "ES" ? "4 Semanas" : "4 Weeks"}
              </button>
              <button
                type="button"
                onClick={() => setWeeklyRange("8w")}
                className={`px-3 py-1 rounded-control transition-all cursor-pointer ${
                  weeklyRange === "8w"
                    ? "bg-surface text-fg shadow-control"
                    : "text-fg-muted hover:text-fg-secondary"
                }`}
              >
                {language === "ES" ? "8 Semanas" : "8 Weeks"}
              </button>
            </div>
          )}

          {/* Clean Inline Legend exactly as in reference */}
          <div className="flex items-center gap-5 sm:gap-6 text-sm font-medium text-fg-secondary">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-pill bg-primary-solid" />
              <span>{dt?.recoveryPattern?.good || (language === "ES" ? "Bueno" : "Good")}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-pill bg-warning-600" />
              <span>{dt?.recoveryPattern?.okay || (language === "ES" ? "Regular" : "Okay")}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-pill bg-danger-solid" />
              <span>{dt?.recoveryPattern?.bad || (language === "ES" ? "Malo" : "Bad")}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main SVG Chart Container */}
      <div className="relative w-full overflow-x-auto pt-2 pb-1">
        {/* Floating Tooltip when hovering over a day */}
        {hoveredPoint && (
          <div className="absolute top-0 right-4 rounded-control border border-line bg-surface/95 backdrop-blur-md px-3.5 py-2 shadow-raised text-xs pointer-events-none animate-in fade-in duration-150 z-10">
            <span className="font-bold text-fg block mb-1">
              {formatLabel(hoveredPoint.day)}
            </span>
            <div className="flex items-center gap-3 font-semibold">
              <span className="flex items-center gap-1 text-fg-brand">
                <span className="h-2 w-2 rounded-pill bg-primary-solid" />
                {dt?.recoveryPattern?.good || "Good"}: {hoveredPoint.good}%
              </span>
              <span className="flex items-center gap-1 text-warning">
                <span className="h-2 w-2 rounded-pill bg-warning-600" />
                {dt?.recoveryPattern?.okay || "Okay"}: {hoveredPoint.okay}%
              </span>
              <span className="flex items-center gap-1 text-danger">
                <span className="h-2 w-2 rounded-pill bg-danger-solid" />
                {dt?.recoveryPattern?.bad || "Bad"}: {hoveredPoint.bad}%
              </span>
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[500px] overflow-visible"
        >
          <defs>
            {/* Soft Drop Glow Filters matching reference mockup */}
            <filter id="glow-good" x="-10%" y="-20%" width="120%" height="180%">
              <feDropShadow dx="0" dy="7" stdDeviation="5.5" floodColor="var(--color-primary-solid)" floodOpacity="0.26" />
            </filter>
            <filter id="glow-okay" x="-10%" y="-20%" width="120%" height="180%">
              <feDropShadow dx="0" dy="7" stdDeviation="5.5" floodColor="var(--color-warning-600)" floodOpacity="0.24" />
            </filter>
            <filter id="glow-bad" x="-10%" y="-20%" width="120%" height="180%">
              <feDropShadow dx="0" dy="7" stdDeviation="5.5" floodColor="var(--color-danger-solid)" floodOpacity="0.24" />
            </filter>
          </defs>

          {/* 1. Horizontal Grid Lines (100 to 20 are dashed; 0 is solid baseline) */}
          {[100, 80, 60, 40, 20, 0].map((tick) => {
            const y = getY(tick);
            const isBaseLine = tick === 0;

            return (
              <g key={tick}>
                <text
                  x={paddingLeft - 12}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  className="fill-slate-500 font-normal select-none"
                  style={{ fontSize: "12px" }}
                >
                  {tick}
                </text>
                {isBaseLine ? (
                  // Solid baseline at 0
                  <line
                    x1={paddingLeft}
                    x2={width - paddingRight}
                    y1={y}
                    y2={y}
                    stroke="var(--color-line-strong)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                ) : (
                  // Dashed grid line for 20, 40, 60, 80, 100
                  <line
                    x1={paddingLeft}
                    x2={width - paddingRight}
                    y1={y}
                    y2={y}
                    stroke="var(--color-line)"
                    strokeDasharray="4 4"
                    strokeWidth="1.2"
                  />
                )}
              </g>
            );
          })}

          {/* 2. Vertical Dashed Grid Lines rising from each X coordinate up to 100 */}
          {recoveryPoints.map((pt, idx) => {
            const cx = getX(idx);
            const isHovered = hoveredIndex === idx;

            return (
              <g key={`v-grid-${pt.day}-${idx}`}>
                <line
                  x1={cx}
                  x2={cx}
                  y1={paddingTop}
                  y2={paddingTop + chartH}
                  stroke={isHovered ? "var(--color-fg-subtle)" : "var(--color-line)"}
                  strokeDasharray="4 4"
                  strokeWidth={isHovered ? "1.5" : "1.2"}
                  className="transition-colors duration-150"
                />
                {/* X-Axis Day/Week Label matching 0, 20.. 100 Y-axis font styling */}
                <text
                  x={cx}
                  y={paddingTop + chartH + 22}
                  textAnchor="middle"
                  fontSize="12"
                  className={`select-none transition-colors ${
                    isHovered ? "fill-slate-800 font-medium" : "fill-slate-500 font-normal"
                  }`}
                  style={{ fontSize: "12px" }}
                >
                  {formatLabel(pt.day)}
                </text>
              </g>
            );
          })}

          {/* 3. Smooth Curved Splines with Soft Glowing Drop Shadow */}
          <path
            d={getCurvePath("good")}
            fill="none"
            stroke="var(--color-primary-solid)"
            strokeWidth="2.2"
            strokeLinecap="round"
            filter="url(#glow-good)"
          />
          <path
            d={getCurvePath("okay")}
            fill="none"
            stroke="var(--color-warning-600)"
            strokeWidth="2.2"
            strokeLinecap="round"
            filter="url(#glow-okay)"
          />
          <path
            d={getCurvePath("bad")}
            fill="none"
            stroke="var(--color-danger-solid)"
            strokeWidth="2.2"
            strokeLinecap="round"
            filter="url(#glow-bad)"
          />

          {/* 4. Signature Concentric Halo Data Points & Interactive Hover Columns */}
          {recoveryPoints.map((pt, idx) => {
            const cx = getX(idx);
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={`halo-${pt.day}-${idx}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Invisible wide vertical hit area */}
                <rect
                  x={cx - 30}
                  y={paddingTop}
                  width={60}
                  height={chartH}
                  fill="transparent"
                />

                {/* --- GOOD Point (Blue) --- */}
                {/* Outer halo ring */}
                <circle
                  cx={cx}
                  cy={getY(pt.good)}
                  r={isHovered ? 9.5 : 8}
                  fill="var(--color-surface)"
                  stroke="var(--color-primary-solid)"
                  strokeOpacity="0.32"
                  strokeWidth="1.5"
                  className="transition-all duration-150"
                />
                {/* Inner solid dot */}
                <circle
                  cx={cx}
                  cy={getY(pt.good)}
                  r={isHovered ? 4 : 3.2}
                  fill="var(--color-primary-solid)"
                  className="transition-all duration-150"
                />

                {/* --- OKAY Point (Amber) --- */}
                {/* Outer halo ring */}
                <circle
                  cx={cx}
                  cy={getY(pt.okay)}
                  r={isHovered ? 9.5 : 8}
                  fill="var(--color-surface)"
                  stroke="var(--color-warning-600)"
                  strokeOpacity="0.32"
                  strokeWidth="1.5"
                  className="transition-all duration-150"
                />
                {/* Inner solid dot */}
                <circle
                  cx={cx}
                  cy={getY(pt.okay)}
                  r={isHovered ? 4 : 3.2}
                  fill="var(--color-warning-600)"
                  className="transition-all duration-150"
                />

                {/* --- BAD Point (Red) --- */}
                {/* Outer halo ring */}
                <circle
                  cx={cx}
                  cy={getY(pt.bad)}
                  r={isHovered ? 9.5 : 8}
                  fill="var(--color-surface)"
                  stroke="var(--color-danger-solid)"
                  strokeOpacity="0.32"
                  strokeWidth="1.5"
                  className="transition-all duration-150"
                />
                {/* Inner solid dot */}
                <circle
                  cx={cx}
                  cy={getY(pt.bad)}
                  r={isHovered ? 4 : 3.2}
                  fill="var(--color-danger-solid)"
                  className="transition-all duration-150"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="rounded-card border border-line bg-surface-sunken p-4 shadow-control flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-soft border border-primary-soft-line">
            <Clock className="h-5 w-5 text-fg-brand" />
          </div>
          <div>
            <p className="text-xs font-medium text-fg-muted">
              {language === "ES" ? "Tiempo Promedio de Recuperación" : "Average Recovery Time"}
            </p>
            <p className="text-lg font-bold text-fg mt-0.5">
              {isWeekly ? "2.7 hrs" : "3.2 hrs"}
            </p>
          </div>
        </div>

        <div className="rounded-card border border-line bg-surface-sunken p-4 shadow-control flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-success-surface border border-success-line">
            <Smile className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-xs font-medium text-fg-muted">
              {language === "ES" ? "Sesiones con Buena Recuperación" : "Good Recovery Rate"}
            </p>
            <p className="text-lg font-bold text-fg mt-0.5">
              {isWeekly ? "76%" : "68%"}
            </p>
          </div>
        </div>

        <div className="rounded-card border border-line bg-surface-sunken p-4 shadow-control flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent-soft border border-accent-soft-line">
            <TrendingUp className="h-5 w-5 text-accent-fg" />
          </div>
          <div>
            <p className="text-xs font-medium text-fg-muted">
              {language === "ES" ? "Tendencia General" : "Overall Trend"}
            </p>
            <p className="text-lg font-bold text-fg mt-0.5">
              {isWeekly
                ? language === "ES"
                  ? "Mejorando (+18%)"
                  : "Improving (+18%)"
                : language === "ES"
                ? "Mejorando"
                : "Improving"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
