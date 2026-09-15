"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import RecoveryPatternSection from "@/features/personal-log/RecoveryPatternSection";

/* ==========================================================================
   TreatmentAnalyticsTab
   --------------------------------------------------------------------------
   The week-by-week breakdown behind the Analytics tab. It reads nothing
   from the dashboard except the member's language, which is why it was the
   easiest 177 lines to lift out of that component — and the clearest sign
   they did not belong in it.

   NOTE: the figures in the table below are fixed. This tab does not yet
   aggregate the member's own records; it shows the shape the report will
   take. Wiring it to `records` is a separate piece of work.
   ========================================================================== */

export function TreatmentAnalyticsTab() {
  const { language } = useLanguage();
  const isEs = language === "ES";

  return (
    <section className="animate-in fade-in space-y-6 duration-200">
      <RecoveryPatternSection mode="weekly" />

      {/* Weekly Performance Breakdown */}
      <div className="space-y-4 rounded-panel border border-line bg-surface p-6 shadow-control sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-fg">
              {isEs
                ? "Desglose de Desempeño Semanal"
                : "Weekly Performance Breakdown"}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-fg-muted">
              {isEs
                ? "Historial de tratamientos y recuperación organizado por semanas"
                : "Treatment completion and recovery outcomes aggregated week-by-week"}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-card border border-line/80">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-sunken/90 text-xs font-bold tracking-wider text-fg-muted uppercase">
                <th className="w-32 px-4 py-3">{isEs ? "Semana" : "Week"}</th>
                <th className="w-44 px-4 py-3">
                  {isEs ? "Período" : "Period"}
                </th>
                <th className="px-4 py-3">
                  {isEs ? "Tratamientos" : "Treatments Completed"}
                </th>
                <th className="px-4 py-3">
                  {isEs ? "Tiempo Promedio" : "Avg Recovery Time"}
                </th>
                <th className="px-4 py-3">
                  {isEs ? "Tasa de Recuperación" : "Good Recovery Rate"}
                </th>
                <th className="px-4 py-3 text-center">
                  {isEs ? "Estado" : "Status"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle font-medium text-fg-secondary">
              <tr className="transition-colors duration-150 ease-standard hover:bg-surface-sunken">
                <td className="px-inset-md py-inset-sm text-label-md whitespace-nowrap text-fg">
                  {isEs ? "Semana 4 (Actual)" : "Week 4 (Current)"}
                </td>
                <td className="px-inset-md py-inset-sm text-body-sm whitespace-nowrap text-fg-secondary">
                  Jun 22, 2026 - Jun 28, 2026
                </td>
                <td className="px-inset-md py-inset-sm text-overline text-fg-muted">
                  3 / 3 {isEs ? "sesiones" : "sessions"} (100%)
                </td>
                <td className="px-inset-md py-inset-sm text-overline text-fg-muted">
                  2.4 hrs
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-pill bg-surface-sunken">
                      <div
                        className="h-2 rounded-pill bg-action"
                        style={{ width: "85%" }}
                      />
                    </div>
                    <span className="text-label-md text-fg">85%</span>
                  </div>
                </td>
                <td className="px-inset-md py-inset-sm text-center whitespace-nowrap">
                  <span className="inline-flex items-center rounded-lg border border-success-line bg-success-surface px-2.5 py-1 text-xs font-bold text-success">
                    {isEs ? "En Objetivo" : "On Target"}
                  </span>
                </td>
              </tr>

              <tr className="transition-colors duration-150 ease-standard hover:bg-surface-sunken">
                <td className="px-inset-md py-inset-sm text-label-md whitespace-nowrap text-fg">
                  {isEs ? "Semana 3" : "Week 3"}
                </td>
                <td className="px-inset-md py-inset-sm text-body-sm whitespace-nowrap text-fg-secondary">
                  Jun 15, 2026 - Jun 21, 2026
                </td>
                <td className="px-inset-md py-inset-sm text-overline text-fg-muted">
                  3 / 3 {isEs ? "sesiones" : "sessions"} (100%)
                </td>
                <td className="px-inset-md py-inset-sm text-overline text-fg-muted">
                  2.9 hrs
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-pill bg-surface-sunken">
                      <div
                        className="h-2 rounded-pill bg-action"
                        style={{ width: "74%" }}
                      />
                    </div>
                    <span className="text-label-md text-fg">74%</span>
                  </div>
                </td>
                <td className="px-inset-md py-inset-sm text-center whitespace-nowrap">
                  <span className="inline-flex items-center rounded-lg border border-primary-soft-line bg-primary-soft px-2.5 py-1 text-xs font-bold text-fg-brand">
                    {isEs ? "Estable" : "Stable"}
                  </span>
                </td>
              </tr>

              <tr className="transition-colors duration-150 ease-standard hover:bg-surface-sunken">
                <td className="px-inset-md py-inset-sm text-label-md whitespace-nowrap text-fg">
                  {isEs ? "Semana 2" : "Week 2"}
                </td>
                <td className="px-inset-md py-inset-sm text-body-sm whitespace-nowrap text-fg-secondary">
                  Jun 08, 2026 - Jun 14, 2026
                </td>
                <td className="px-inset-md py-inset-sm text-overline text-fg-muted">
                  3 / 3 {isEs ? "sesiones" : "sessions"} (100%)
                </td>
                <td className="px-inset-md py-inset-sm text-overline text-fg-muted">
                  3.2 hrs
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-pill bg-surface-sunken">
                      <div
                        className="h-2 rounded-pill bg-action"
                        style={{ width: "64%" }}
                      />
                    </div>
                    <span className="text-label-md text-fg">64%</span>
                  </div>
                </td>
                <td className="px-inset-md py-inset-sm text-center whitespace-nowrap">
                  <span className="inline-flex items-center rounded-lg border border-accent-soft-line bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-fg">
                    {isEs ? "Mejorando" : "Improving"}
                  </span>
                </td>
              </tr>

              <tr className="transition-colors duration-150 ease-standard hover:bg-surface-sunken">
                <td className="px-inset-md py-inset-sm text-label-md whitespace-nowrap text-fg">
                  {isEs ? "Semana 1" : "Week 1"}
                </td>
                <td className="px-inset-md py-inset-sm text-body-sm whitespace-nowrap text-fg-secondary">
                  Jun 01, 2026 - Jun 07, 2026
                </td>
                <td className="px-inset-md py-inset-sm text-overline text-fg-muted">
                  3 / 3 {isEs ? "sesiones" : "sessions"} (100%)
                </td>
                <td className="px-inset-md py-inset-sm text-overline text-fg-muted">
                  3.8 hrs
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-pill bg-surface-sunken">
                      <div
                        className="h-2 rounded-pill bg-action"
                        style={{ width: "52%" }}
                      />
                    </div>
                    <span className="text-label-md text-fg">52%</span>
                  </div>
                </td>
                <td className="px-inset-md py-inset-sm text-center whitespace-nowrap">
                  <span className="inline-flex items-center rounded-lg border border-warning-line bg-warning-surface px-2.5 py-1 text-xs font-bold text-warning">
                    {isEs ? "Monitoreado" : "Monitored"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default TreatmentAnalyticsTab;
