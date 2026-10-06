"use client";

import React from "react";
import { Badge, BarChart, Card, Skeleton } from "@/components/ui";
import { useNow } from "@/lib/utils/useNow";
import { monthKey } from "@/features/emergency/erVisits";
import { useErVisits } from "@/features/emergency/useErVisits";
import { LINKED_MEMBER } from "./memberFeed";
import {
  clinicErReports,
  clinicMonthly,
  patientsWithVisits,
  visitsInMonth,
} from "./clinicEr.data";

/* ==========================================================================
   ER Visits — the clinic's view of its patients' weekly answers
   --------------------------------------------------------------------------
   Fed by the patients' "Have you been to the ER this week?" answers
   (client, 2026-10-05). A count of what patients reported, month by month,
   and who reported a visit in the last 90 days.
   ========================================================================== */

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

function monthName(month: string) {
  return MONTHS[Number(month.slice(5, 7)) - 1] ?? month;
}

function day(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ClinicErVisits() {
  const now = useNow();
  const { log, isPending } = useErVisits();
  const reports = clinicErReports(LINKED_MEMBER, log, now);
  const thisMonth = visitsInMonth(reports, monthKey(now));
  const lastMonth = visitsInMonth(reports, monthKey(now, 1));
  const change = thisMonth - lastMonth;
  const months = clinicMonthly(reports, now, 6);
  const recent = patientsWithVisits(reports, now - 90 * 86_400_000);

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card as="section" padding="small" className="h-full xl:col-span-2">
        <div className="mb-stack-md flex flex-wrap items-start justify-between gap-inline-md">
          <div>
            <h2 className="text-heading-4 text-fg">ER Visits</h2>
            <p className="mt-stack-xs text-body-sm text-fg-muted">
              Reported by your patients in their weekly check-in question.
            </p>
          </div>
          <dl className="flex gap-inline-lg">
            <div>
              <dt className="text-caption text-fg-muted">This month</dt>
              <dd className="text-metric-sm text-fg tabular-nums">
                {thisMonth}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-fg-muted">Last month</dt>
              <dd className="text-metric-sm text-fg tabular-nums">
                {lastMonth}
              </dd>
            </div>
            <div className="self-end">
              <Badge
                tone={
                  change > 0 ? "danger" : change < 0 ? "success" : "neutral"
                }
              >
                {change > 0
                  ? `▲ ${change}`
                  : change < 0
                    ? `▼ ${-change}`
                    : "No change"}
              </Badge>
            </div>
          </dl>
        </div>
        {isPending ? (
          <Skeleton height={200} />
        ) : (
          <BarChart
            label="ER visits reported per month, all patients"
            bars={months.map((m) => ({
              label: monthName(m.month),
              value: m.visits,
            }))}
            yMax={Math.max(4, ...months.map((m) => m.visits))}
            yTicks={3}
            unit="visits"
            height={200}
          />
        )}
      </Card>

      <Card as="section" padding="small" className="h-full">
        <h2 className="text-heading-4 text-fg">Patients With ER Visits</h2>
        <p className="mt-stack-xs mb-stack-md text-body-sm text-fg-muted">
          Last 90 days
        </p>
        {recent.length === 0 ? (
          <p className="text-body-sm text-fg-muted">No ER visits reported.</p>
        ) : (
          <ul className="divide-y divide-line-subtle">
            {recent.slice(0, 6).map((patient) => (
              <li
                key={patient.mrn}
                className="flex items-center justify-between gap-inline-md py-inset-xs"
              >
                <span className="min-w-0">
                  <span className="block truncate text-label-md text-fg">
                    {patient.name}
                  </span>
                  <span className="block text-caption text-fg-muted">
                    MRN {patient.mrn} · last {day(patient.latest)}
                  </span>
                </span>
                <Badge tone="warning">
                  {patient.visits} visit{patient.visits === 1 ? "" : "s"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
