"use client";

import React from "react";

/* ==========================================================================
   TrendLineCard
   --------------------------------------------------------------------------
   A single test's readings over time, drawn as an SVG path.

   NOTE: this is a hand-drawn chart, not the design system's LineChart, so
   it carries no accessible name and no data table — a screen reader gets
   nothing from it. Swapping it is a visual change on six cards and wants
   doing deliberately, alongside the other hand-drawn charts in
   personal-log/fluid/panels.
   ========================================================================== */

export function TrendLineCard({
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
  /* One lab panel, six series — these say "different test", not "good" or
     "bad", so they come off the categorical ramp. They used to sit on the
     status ramps, which put green and teal on success-600 and success-400:
     two lines a member could barely tell apart, both reading as "healthy". */
  const themeMap = {
    purple: { stroke: "var(--color-cat-7)" },
    green: { stroke: "var(--color-cat-4)" },
    orange: { stroke: "var(--color-cat-2)" },
    blue: { stroke: "var(--color-cat-6)" },
    rose: { stroke: "var(--color-cat-1)" },
    teal: { stroke: "var(--color-cat-5)" },
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
    <div className="space-y-3 rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-fg">{testName}</h4>
          <p className="text-xs text-fg-muted">
            {refRangeLabel || "Ref Range"}: {unit ? `(${unit})` : ""}
          </p>
        </div>
        <div className="text-right">
          <span className="text-base font-bold text-fg">
            {latestVal} {unit}
          </span>
          <span className="block text-[11px] font-medium text-fg-subtle">
            {latestLabel || "Latest"}
          </span>
        </div>
      </div>

      <div className="w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-28 w-full overflow-visible"
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
                stroke="var(--color-gray-100)"
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
            className="fill-gray-400 text-xs font-medium"
          >
            {dates[0]}
          </text>
          <text
            x={width - paddingRight}
            y={height - 3}
            textAnchor="end"
            className="fill-gray-400 text-xs font-medium"
          >
            {dates[dates.length - 1]}
          </text>
        </svg>
      </div>
    </div>
  );
}
