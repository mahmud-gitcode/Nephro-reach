"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { formatEventTime, statusDetail, tripMilestones } from "./trip.rules";
import type { TripRequest } from "./trip.types";

/* ==========================================================================
   Travel request status — a vertical timeline
   --------------------------------------------------------------------------
   Four moments down the page, each with a dot, a connecting rail, and the
   date it happened.

   What this replaces was a horizontal six-segment bar. A bar tells you how
   far along something is; it cannot tell you what happened or when, and a
   member watching a request they cannot chase themselves wants exactly
   those two things.

   The rail is drawn per-row rather than as one line behind the dots, so it
   can be a different colour above and below the step a request is on — the
   journey so far reads as travelled, the rest as still to come.
   ========================================================================== */

export function TripStatusTimeline({ trip }: { trip: TripRequest }) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const milestones = tripMilestones(trip);

  return (
    <ol
      className="space-y-0"
      aria-label={isEs ? "Estado de la solicitud" : "Travel request status"}
    >
      {milestones.map((milestone, index) => {
        const last = index === milestones.length - 1;
        const reached = milestone.state !== "todo";

        return (
          <li key={milestone.id} className="flex gap-inline-md">
            {/* The rail column: dot on top, connector below it. */}
            <div className="flex w-4 shrink-0 flex-col items-center">
              <span
                aria-hidden="true"
                className={`mt-1 size-4 shrink-0 rounded-pill border-2 transition-colors duration-150 ease-standard ${
                  milestone.state === "current"
                    ? "border-primary-solid bg-primary-solid"
                    : milestone.state === "done"
                      ? "border-primary-solid bg-primary-solid"
                      : "border-line-strong bg-surface"
                }`}
              />
              {!last ? (
                <span
                  aria-hidden="true"
                  className={`w-0.5 flex-1 ${
                    milestone.state === "done" ? "bg-primary-solid" : "bg-line"
                  }`}
                />
              ) : null}
            </div>

            <div className={`min-w-0 flex-1 ${last ? "pb-0" : "pb-stack-md"}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-inline-md">
                <p
                  className={`text-label-md ${
                    reached ? "text-fg" : "text-fg-muted"
                  }`}
                >
                  {isEs ? milestone.labelEs : milestone.labelEn}
                </p>

                {/* Absent rather than guessed: an older request has no
                  record of the rungs between its first and its current. */}
                {milestone.at ? (
                  <p className="shrink-0 text-body-sm text-fg-muted tabular-nums">
                    {formatEventTime(milestone.at, isEs)}
                  </p>
                ) : null}
              </div>

              <p className="mt-stack-xs text-body-sm text-fg-muted">
                {isEs ? milestone.detailEs : milestone.detailEn}
              </p>

              {/* The six-rung ladder still exists for the coordinator, so
                the step a request is actually on is named here rather than
                lost inside "In Progress". */}
              {milestone.state === "current" &&
              milestone.id === "in-progress" ? (
                <p className="mt-stack-xs text-body-sm text-fg-brand">
                  {statusDetail(trip.status, isEs)}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default TripStatusTimeline;
