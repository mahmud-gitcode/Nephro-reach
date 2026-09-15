"use client";

import React from "react";

/* Whether a reading sits inside its reference range. Status colour, not
   categorical: In Range / High / Low say good or bad, which is exactly what
   status tones are for. */

export function StatusBadge({
  status,
  label,
}: {
  status: "In Range" | "High" | "Low";
  label?: string;
}) {
  if (status === "In Range") {
    return (
      <span className="inline-flex items-center rounded-md bg-success-100 px-2.5 py-1 text-xs font-semibold text-success">
        {label || "In Range"}
      </span>
    );
  }
  if (status === "High") {
    return (
      <span className="inline-flex items-center rounded-md bg-danger-100 px-2.5 py-1 text-xs font-semibold text-danger">
        {label || "High"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md bg-warning-100 px-2.5 py-1 text-xs font-semibold text-warning-800">
      {label || "Low"}
    </span>
  );
}

/**
 * The chart tone that matches a reading's status.
 *
 * Status colour, not categorical: In Range / High / Low say good or bad,
 * so the trend line should agree with the badge beside it rather than
 * picking a colour from the categorical ramp.
 */
export function sparklineTone(
  status: "In Range" | "High" | "Low",
): "success" | "danger" | "warning" {
  if (status === "In Range") return "success";
  return status === "High" ? "danger" : "warning";
}
