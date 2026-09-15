"use client";

import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LOCALIZED_SYMPTOMS } from "../record/record.options";
import { analyseTrends } from "./checkIn.trends";
import type { BetweenTreatmentCheckIn } from "./checkIn.types";
import { Card } from "@/components/ui";

/* ==========================================================================
   Recovery trends
   --------------------------------------------------------------------------
   The figures the architecture guide asks this tab to be able to trend.

   Every one of them hides itself when there is not enough behind it. A mean
   drawn from one entry is not a trend, and showing it as one would invite a
   member to read a single bad Tuesday as a decline in their health — which
   is exactly the kind of false signal a log like this must not produce.
   ========================================================================== */

function Stat({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "good" | "bad";
}) {
  return (
    <div className="rounded-card border border-line bg-surface-sunken p-inset-sm">
      <p className="text-body-sm text-fg-muted">{label}</p>
      <p
        className={`mt-stack-xs text-heading-4 ${
          tone === "good"
            ? "text-success"
            : tone === "bad"
              ? "text-danger"
              : "text-fg"
        }`}
      >
        {value}
      </p>
      {detail ? (
        <p className="mt-stack-xs text-body-sm text-fg-muted">{detail}</p>
      ) : null}
    </div>
  );
}

export function RecoveryTrendsCard({
  entries,
}: {
  entries: BetweenTreatmentCheckIn[];
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const trends = analyseTrends(entries);

  /* Nothing to say yet is said once, rather than as eight empty tiles. */
  if (!trends.hasAnything) {
    return (
      <Card>
        <h2 className="text-heading-5 text-fg">
          {isEs ? "Tendencias de recuperación" : "Recovery trends"}
        </h2>
        <p className="mt-stack-xs measure text-body-sm text-fg-muted">
          {isEs
            ? "Después de unos días de registros aparecerán aquí tus tendencias: cuánto tardas en recuperarte, qué síntomas se repiten y cómo cambian tu peso y tu presión."
            : "After a few days of check-ins your trends appear here: how long recovery takes, which symptoms keep coming back, and how your weight and blood pressure are moving."}
        </p>
      </Card>
    );
  }

  const faster =
    trends.recoveryChangeHours !== null && trends.recoveryChangeHours < 0;
  const topSymptoms = trends.symptomFrequency.slice(0, 5);

  return (
    <Card className="space-y-stack-md">
      <h2 className="text-heading-5 text-fg">
        {isEs ? "Tendencias de recuperación" : "Recovery trends"}
      </h2>

      <div className="grid grid-cols-1 gap-inset-sm sm:grid-cols-2 xl:grid-cols-4">
        {trends.averageRecoveryHours !== null ? (
          <Stat
            label={isEs ? "Recuperación promedio" : "Average recovery"}
            value={`${trends.averageRecoveryHours} ${isEs ? "h" : "hrs"}`}
            detail={
              trends.recoveryChangeHours !== null
                ? `${faster ? "▼" : "▲"} ${Math.abs(trends.recoveryChangeHours)} ${
                    isEs ? "h vs. antes" : "hrs vs earlier"
                  }`
                : undefined
            }
            tone={
              trends.recoveryChangeHours === null
                ? "default"
                : faster
                  ? "good"
                  : "bad"
            }
          />
        ) : null}

        {trends.stillNotRecoveredCount > 0 ? (
          <Stat
            label={isEs ? "Sin recuperarse" : "Never recovered"}
            value={String(trends.stillNotRecoveredCount)}
            detail={
              isEs
                ? "días antes del siguiente tratamiento"
                : "days before the next treatment"
            }
            tone="bad"
          />
        ) : null}

        {trends.weightChange !== null ? (
          <Stat
            label={isEs ? "Cambio de peso" : "Weight change"}
            value={`${trends.weightChange > 0 ? "+" : ""}${trends.weightChange}`}
            detail={
              isEs ? "entre el primero y el último" : "first entry to latest"
            }
          />
        ) : null}

        {trends.averageSystolic !== null && trends.averageDiastolic !== null ? (
          <Stat
            label={isEs ? "Presión promedio" : "Average blood pressure"}
            value={`${trends.averageSystolic}/${trends.averageDiastolic}`}
          />
        ) : null}

        {trends.averageUrineOutputMl !== null ? (
          <Stat
            label={isEs ? "Orina promedio (24 h)" : "Average urine (24h)"}
            value={`${trends.averageUrineOutputMl} mL`}
          />
        ) : null}
      </div>

      {/* The comparison the guide singles out, and the one a care team reads
          first: does this member pay for treatment days afterwards. */}
      {trends.treatmentDayRoughPercent !== null &&
      trends.nonTreatmentDayRoughPercent !== null ? (
        <div className="rounded-card border border-line bg-surface-sunken p-inset-sm">
          <p className="text-label-md text-fg">
            {isEs
              ? "Días de tratamiento vs. los demás"
              : "Treatment days vs the days between"}
          </p>
          <div className="mt-stack-sm grid grid-cols-1 gap-inline-md sm:grid-cols-2">
            <p className="flex items-center gap-inline-md text-body-sm text-fg-secondary">
              {trends.treatmentDayRoughPercent >
              trends.nonTreatmentDayRoughPercent ? (
                <TrendingUp
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-danger"
                />
              ) : (
                <TrendingDown
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-success"
                />
              )}
              {isEs
                ? `${trends.treatmentDayRoughPercent}% de los días de tratamiento fueron malos`
                : `${trends.treatmentDayRoughPercent}% of treatment days were rough`}
            </p>
            <p className="text-body-sm text-fg-secondary">
              {isEs
                ? `${trends.nonTreatmentDayRoughPercent}% de los otros días fueron malos`
                : `${trends.nonTreatmentDayRoughPercent}% of other days were rough`}
            </p>
          </div>

          {trends.treatmentDayEnergy !== null &&
          trends.nonTreatmentDayEnergy !== null ? (
            <p className="mt-stack-sm text-body-sm text-fg-muted">
              {isEs
                ? `Energía promedio ${trends.treatmentDayEnergy}/5 en días de tratamiento y ${trends.nonTreatmentDayEnergy}/5 en los demás.`
                : `Average energy ${trends.treatmentDayEnergy}/5 on treatment days and ${trends.nonTreatmentDayEnergy}/5 on the days between.`}
            </p>
          ) : null}
        </div>
      ) : null}

      {topSymptoms.length > 0 ? (
        <div>
          <p className="text-label-md text-fg">
            {isEs ? "Síntomas más frecuentes" : "Most frequent symptoms"}
          </p>
          <ul className="mt-stack-sm space-y-stack-xs">
            {topSymptoms.map((item) => (
              <li
                key={item.symptom}
                className="flex items-center gap-inline-md text-body-sm"
              >
                <span className="min-w-0 flex-1 truncate text-fg-secondary">
                  {isEs
                    ? LOCALIZED_SYMPTOMS[item.symptom] || item.symptom
                    : item.symptom}
                </span>
                {/* A bar rather than a number alone: five counts are easier
                    to rank by length than by reading five digits. */}
                <span
                  aria-hidden="true"
                  className="h-2 w-24 shrink-0 overflow-hidden rounded-pill bg-surface-sunken"
                >
                  <span
                    className="block h-full rounded-pill bg-primary-solid"
                    style={{ width: `${Math.max(6, item.percent)}%` }}
                  />
                </span>
                <span className="w-24 shrink-0 text-right text-fg-muted">
                  {isEs
                    ? `${item.count} de ${item.percent}%`
                    : `${item.count} · ${item.percent}%`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}

export default RecoveryTrendsCard;
