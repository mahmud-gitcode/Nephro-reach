"use client";

import React from "react";
import { AlertTriangle, BookOpen } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

/* NOTE: the figures in this panel are fixed demo values. It renders the same
   numbers whatever the member has logged — see the header of
   fluid-tracker/page.tsx. */

export function AlertsInsights() {
  const { dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  const toneClass = {
    warning: "border-warning-line bg-warning-surface",
    error: "border-danger-line bg-danger-surface",
    success: "border-success-line bg-success-surface",
    info: "border-primary-soft-line bg-primary-soft",
  };

  const alerts = [
    {
      title: w?.alerts?.items?.weightGain?.title || "Weight Gain Notice",
      body:
        w?.alerts?.items?.weightGain?.body ||
        "+2.6 lbs this month. Possible fluid retention — contact your nurse if swelling increases.",
      tone: "warning",
    },
    {
      title: w?.alerts?.items?.missedLogging?.title || "Missed Logging",
      body:
        w?.alerts?.items?.missedLogging?.body ||
        "3 days without logging detected. Consistent tracking helps your care team.",
      tone: "error",
    },
    {
      title: w?.alerts?.items?.fluidGoal?.title || "Fluid Goal On Track",
      body:
        w?.alerts?.items?.fluidGoal?.body ||
        "Average 42 oz/day, within your 48 oz limit. Keep it up.",
      tone: "success",
    },
    {
      title: w?.alerts?.items?.education?.title || "Education Tip",
      body:
        w?.alerts?.items?.education?.body ||
        'Watch "Understanding Fluid Retention" module to learn practical daily tips.',
      tone: "info",
    },
  ];

  return (
    <section className="h-full rounded-xl border border-line bg-surface p-4">
      <h2 className="text-heading-4 text-fg">
        {w?.alerts?.title || "Alerts & Insights"}
      </h2>
      <div className="mt-3 space-y-2">
        {alerts.map((alert) => (
          <article
            key={alert.title}
            className={`rounded-lg border p-2.5 ${
              toneClass[alert.tone as keyof typeof toneClass]
            }`}
          >
            <div className="flex gap-2">
              {alert.tone === "info" ? (
                <BookOpen className="mt-0.5 h-3 w-3 shrink-0 text-fg-brand" />
              ) : (
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
              )}
              <div>
                <p className="text-xs font-medium text-fg">{alert.title}</p>
                <p className="mt-0.5 text-[11px] leading-[13px] text-fg-muted">
                  {alert.body}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
