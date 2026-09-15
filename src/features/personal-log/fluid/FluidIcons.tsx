"use client";

import React from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

/* Three small presentational pieces shared by the panels. */

export function GoalBadge({
  status,
  isGoalMet,
}: {
  status: string;
  isGoalMet: boolean;
}) {
  const className = isGoalMet
    ? "bg-success-surface text-success"
    : "bg-warning-surface text-warning";

  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${className}`}
    >
      {status}
    </span>
  );
}

export function TrendIcon({ type }: { type: "up" | "down" | "level" }) {
  if (type === "up") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success-600 text-white">
        <ArrowUp className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (type === "down") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-danger-solid text-white">
        <ArrowDown className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white">
      <Minus className="h-3.5 w-3.5" />
    </span>
  );
}

export function BathroomScaleIcon({
  className = "h-9 w-9",
}: {
  className?: string;
}) {
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
        fill="var(--color-brand-900)"
        stroke="var(--color-brand-800)"
        strokeWidth="1.5"
      />
      {/* Subtle Inner Frame */}
      <rect
        x="6.5"
        y="6.5"
        width="31"
        height="31"
        rx="7"
        stroke="var(--color-brand-400)"
        strokeWidth="1"
        strokeOpacity="0.4"
      />
      {/* Top Dial / Display Window */}
      <circle cx="22" cy="14" r="5.5" fill="var(--color-surface)" />
      <circle
        cx="22"
        cy="14"
        r="5.5"
        stroke="var(--color-brand-300)"
        strokeWidth="1"
      />
      {/* Dial Needle */}
      <line
        x1="22"
        y1="14"
        x2="22"
        y2="10"
        stroke="var(--color-brand-900)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="22" cy="14" r="1.2" fill="var(--color-brand-900)" />
      {/* Platform footpad indicator groove */}
      <rect
        x="13"
        y="27"
        width="18"
        height="2"
        rx="1"
        fill="var(--color-surface)"
        fillOpacity="0.45"
      />
    </svg>
  );
}
