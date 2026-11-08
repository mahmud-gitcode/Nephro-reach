"use client";

import React from "react";
import { useQueries } from "@tanstack/react-query";
import { AsyncSection, Badge, BarChart, Card, Skeleton } from "@/components/ui";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { useNow } from "@/lib/utils/useNow";
import { erVisitSummary, nameOf } from "./checkInNotices.repository";
import {
  last90Days,
  monthWindows,
  officeErWeeks,
  patientsWithVisits,
} from "./clinicEr.data";
import { requireOffice, useOfficeOrg } from "./officeContext";
import { checkInKeys, useErSummary } from "./useOfficeCheckIns";

/* ==========================================================================
   ER Visits: the office's view of its patients' weekly answers
   --------------------------------------------------------------------------
   Fed by the patients' "Have you been to the ER this week?" answers
   (client, 2026-10-05), read from the server's office summary (spec 034)
   for the patients who share ER visits with this office. A count of the
   weeks they reported a visit, month by month, and who reported one in the
   last 90 days. Never a triage signal.
   ========================================================================== */

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

function monthName(month: string) {
  return MONTHS[Number(month.slice(5, 7)) - 1] ?? month;
}

function weekOf(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ClinicErVisits() {
  const now = useNow();
  const { orgId } = useOfficeOrg();
  const windows = monthWindows(now, 6);
  const months = useQueries({
    queries: windows.map((w) => ({
      queryKey: orgId
        ? checkInKeys.er(orgId, { from: w.from, to: w.to })
        : ["org", "none", "er-visits", "summary", w.month],
      queryFn: () =>
        erVisitSummary(requireOffice(orgId), { from: w.from, to: w.to }),
      enabled: orgId !== null,
    })),
  });
  const recentRead = useErSummary(last90Days(now));
  const totals = months.map((q) => officeErWeeks(q.data));
  const error = months.find((q) => q.error)?.error ?? recentRead.error;
  const pending =
    orgId === null || months.some((q) => q.isPending) || recentRead.isPending;
  const thisMonth = totals[totals.length - 1];
  const lastMonth = totals[totals.length - 2];
  const change =
    thisMonth !== null && lastMonth !== null ? thisMonth - lastMonth : null;
  /* A list longer than one page has no honest total: say so. */
  const partial = months.some(
    (q) => q.data !== undefined && officeErWeeks(q.data) === null,
  );
  const recent = patientsWithVisits(recentRead.data?.items ?? []);
  const retry = () => {
    for (const q of months) void q.refetch();
    recentRead.refetch();
  };

  return (
    <AsyncSection
      pending={pending}
      error={error}
      errorTitle={errorTitleFor(error, "ER visits could not be loaded")}
      errorMessage={errorMessageFor(error, undefined)}
      onRetry={canRetry(error) ? retry : undefined}
      skeleton={<Skeleton height={260} className="rounded-card" />}
    >
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card as="section" padding="small" className="h-full xl:col-span-2">
          <div className="mb-stack-md flex flex-wrap items-start justify-between gap-inline-md">
            <div>
              <h2 className="text-heading-4 text-fg">
                Self-Reported ER Visits
              </h2>
              <p className="mt-stack-xs text-body-sm text-fg-muted">
                Weeks your patients answered yes in their weekly check-in
                question. Only patients who share ER visits with your office are
                counted.
              </p>
            </div>
            <dl className="flex gap-inline-lg">
              <div>
                <dt className="text-caption text-fg-muted">This month</dt>
                <dd className="text-metric-sm text-fg tabular-nums">
                  {thisMonth ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-caption text-fg-muted">Last month</dt>
                <dd className="text-metric-sm text-fg tabular-nums">
                  {lastMonth ?? "—"}
                </dd>
              </div>
              {change !== null ? (
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
              ) : null}
            </dl>
          </div>
          {!partial ? (
            <BarChart
              label="Weeks with a self-reported ER visit per month, all sharing patients"
              bars={windows.map((w, i) => ({
                label: monthName(w.month),
                value: totals[i] ?? 0,
              }))}
              yMax={Math.max(4, ...totals.map((t) => t ?? 0))}
              yTicks={3}
              unit="visits"
              height={200}
            />
          ) : (
            <p className="text-body-sm text-fg-muted">
              Monthly totals are shown for up to 150 sharing patients. Your
              office has more, so totals are not shown here.
            </p>
          )}
        </Card>

        <Card as="section" padding="small" className="h-full">
          <h2 className="text-heading-4 text-fg">
            Patients With Self-Reported ER Visits
          </h2>
          <p className="mt-stack-xs mb-stack-md text-body-sm text-fg-muted">
            Last 90 days
          </p>
          {recent.length === 0 ? (
            <p className="text-body-sm text-fg-muted">
              No self-reported ER visits.
            </p>
          ) : (
            <ul className="divide-y divide-line-subtle">
              {recent.slice(0, 6).map((patient) => (
                <li
                  key={patient.patientId}
                  className="flex items-center justify-between gap-inline-md py-inset-xs"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-label-md text-fg">
                      {nameOf(patient)}
                    </span>
                    <span className="block text-caption text-fg-muted">
                      {patient.mrn ? `MRN ${patient.mrn} · ` : ""}
                      {patient.lastErVisitWeekOf
                        ? `last week of ${weekOf(patient.lastErVisitWeekOf)}`
                        : ""}
                    </span>
                  </span>
                  <Badge tone="warning">
                    {patient.erVisitWeeks} visit
                    {patient.erVisitWeeks === 1 ? "" : "s"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </AsyncSection>
  );
}
