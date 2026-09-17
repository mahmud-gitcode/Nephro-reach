"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";

/* NOTE: the figures in this panel are fixed demo values. It renders the same
   numbers whatever the member has logged — see the header of
   fluid-tracker/page.tsx. */

export function WeightTrendChart() {
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
      className="h-full rounded-card border border-line bg-[var(--color-gray-50)] p-3.5"
    >
      <div className="flex items-center gap-inline-sm">
        <h2 className="text-heading-4 text-fg">
          {w?.weightTrend?.title || "Weight Trend"}
        </h2>
        <span className="text-xs text-fg-muted">
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
                stroke="var(--color-gray-200)"
                strokeDasharray="4 4"
              />
            </g>
          );
        })}
        <polyline
          fill="none"
          stroke="var(--color-accent-500)"
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
            stroke="var(--color-accent-500)"
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
