"use client";

import React, { useId } from "react";
import { CATEGORICAL_TONES, SeriesTone, toneVar } from "./Chart";

/* ==========================================================================
   DonutChart
   --------------------------------------------------------------------------
   Three hand-written `conic-gradient(...)` rings, each with its degree stops
   typed out by hand — "0deg 180deg, 180deg 240deg, 240deg 282deg". Those
   numbers are the data, converted to degrees by a person, which means they
   drift the moment the data changes and nobody notices.

   Here the segments are values and the degrees are computed. As with the
   other charts: role="img" with a required label, and the numbers repeated
   as a visually-hidden table, because a ring of colour says nothing to a
   screen reader.

   Still a conic-gradient rather than SVG arcs — one element, no path maths,
   and the centre is a plain circle that anything can be written into.
   ========================================================================== */

export type DonutSegment = {
  label: string;
  value: number;
  tone?: SeriesTone;
};

export type DonutChartProps = {
  segments: DonutSegment[];
  /** What the ring is of. Required — it becomes the accessible name. */
  label: string;
  /** Big text in the hole. Usually the headline figure. */
  centerValue?: React.ReactNode;
  /** Small text under it. */
  centerLabel?: React.ReactNode;
  /** Outer diameter in px. */
  size?: number;
  /** Ring thickness in px. */
  thickness?: number;
  className?: string;
};

export function DonutChart({
  segments,
  label,
  centerValue,
  centerLabel,
  size = 180,
  thickness = 26,
  className,
}: DonutChartProps) {
  const tableId = useId();
  const total = segments.reduce((sum, s) => sum + Math.max(s.value, 0), 0);

  /* Degrees are computed from the values, and the last segment is closed at
     exactly 360 so rounding never leaves a hairline gap in the ring. */
  let cursor = 0;
  const stops = segments.map((segment, index) => {
    const tone =
      segment.tone ?? CATEGORICAL_TONES[index % CATEGORICAL_TONES.length];
    const share = total > 0 ? Math.max(segment.value, 0) / total : 0;
    const start = cursor;
    const end = index === segments.length - 1 ? 360 : cursor + share * 360;
    cursor = end;
    return `${toneVar[tone]} ${start}deg ${end}deg`;
  });

  const background =
    total > 0
      ? `conic-gradient(${stops.join(", ")})`
      : "conic-gradient(var(--color-line) 0deg 360deg)";

  return (
    <div className={className}>
      <div
        role="img"
        aria-label={label}
        aria-describedby={tableId}
        className="relative shrink-0 rounded-pill"
        style={{ width: size, height: size, background }}
      >
        <div
          className="absolute rounded-pill bg-surface"
          style={{ inset: thickness }}
        />
        {centerValue || centerLabel ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {centerValue ? (
              <span className="text-metric-sm text-fg">{centerValue}</span>
            ) : null}
            {centerLabel ? (
              <span className="text-caption text-fg-muted">{centerLabel}</span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* sr-only sits on a wrapper, not the table: a table ignores the
          1px width sr-only sets and keeps its natural width, which on a
          phone pushed the page wider than the screen. */}
      <div className="sr-only">
        <table id={tableId}>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">Segment</th>
              <th scope="col">Value</th>
              <th scope="col">Share</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((segment) => (
              <tr key={segment.label}>
                <th scope="row">{segment.label}</th>
                <td>{segment.value}</td>
                <td>
                  {total > 0
                    ? `${Math.round((segment.value / total) * 100)}%`
                    : "0%"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DonutChart;
