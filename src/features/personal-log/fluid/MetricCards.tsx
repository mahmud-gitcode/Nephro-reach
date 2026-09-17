"use client";

import React from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Droplets,
  FileText,
  Pencil,
  Wind,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { BathroomScaleIcon } from "./FluidIcons";

export function MetricCards({
  unit,
  edwKg,
  todayWeightKg,
  edwNote,
  todayDateStr,
  onOpenEdwModal,
}: {
  unit: "kg" | "lbs";
  edwKg: number;
  todayWeightKg: number;
  edwNote: string;
  todayDateStr: string;
  onOpenEdwModal: () => void;
}) {
  const { language, dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  // Conversions based on active unit
  const isKg = unit === "kg";
  const displayEdw = isKg ? edwKg.toFixed(1) : (edwKg * 2.20462).toFixed(1);
  const displayToday = isKg
    ? todayWeightKg.toFixed(1)
    : (todayWeightKg * 2.20462).toFixed(1);

  const diffVal = Number(displayToday) - Number(displayEdw);
  const diffPct =
    Number(displayEdw) > 0
      ? ((Math.abs(diffVal) / Number(displayEdw)) * 100).toFixed(1)
      : "0.0";

  const isAbove = diffVal > 0.0001;
  const isBelow = diffVal < -0.0001;
  const isTarget = !isAbove && !isBelow;

  let statusTitle = w?.edwMetrics?.aboveEdw || "Above EDW";
  let statusSubtitle = `${diffPct}% ${w?.edwMetrics?.aboveEdwSuffix || "above EDW"}`;
  let diffSign = "+";
  let statusTextColor = "text-danger";
  let statusIconBg = "bg-danger-surface border border-danger-line";
  let statusIcon = (
    <ArrowUp className="h-6 w-6 stroke-[2.5] text-danger sm:h-7 sm:w-7" />
  );

  if (isBelow) {
    statusTitle = w?.edwMetrics?.belowEdw || "Below EDW";
    statusSubtitle = `${diffPct}% ${w?.edwMetrics?.belowEdwSuffix || "below EDW"}`;
    diffSign = "-";
    statusTextColor = "text-warning";
    statusIconBg = "bg-warning-surface border border-warning-line";
    statusIcon = (
      <ArrowDown className="h-6 w-6 stroke-[2.5] text-warning sm:h-7 sm:w-7" />
    );
  } else if (isTarget) {
    statusTitle = w?.edwMetrics?.atEdw || "At Target EDW";
    statusSubtitle = w?.edwMetrics?.atEdwSuffix || "On target with EDW";
    diffSign = "";
    statusTextColor = "text-success";
    statusIconBg = "bg-success-surface border border-success-line";
    statusIcon = (
      <CheckCircle2 className="h-6 w-6 text-success sm:h-7 sm:w-7" />
    );
  }

  const secondaryCards = [
    {
      label: w?.metrics?.avgFluidIntake?.label || "Avg. Fluid Intake",
      value: "18",
      unit: w?.metrics?.avgFluidIntake?.unit || "OZ",
      subtitle: w?.metrics?.avgFluidIntake?.note || "↓ 1.2 lbs vs yesterday",
      subtitleClass: "text-success font-bold",
      icon: Droplets,
      iconBg: "bg-brand-50 border border-primary-soft-line",
      iconClass: "text-brand-600",
    },
    {
      label: w?.metrics?.daysGoalMet?.label || "Days Goal Met",
      value: "21 / 30",
      unit: "60%",
      subtitle: w?.metrics?.daysGoalMet?.note || "This Month",
      subtitleClass: "text-fg-muted font-medium",
      icon: CheckCircle2,
      iconBg: "bg-success-surface border border-success-line",
      iconClass: "text-success",
    },
    {
      label: w?.metrics?.swellingReports?.label || "Swelling Reports",
      value: "5",
      unit: "",
      subtitle: w?.metrics?.swellingReports?.note || "↓ 2 vs last month",
      subtitleClass: "text-success font-bold",
      icon: FileText,
      iconBg: "bg-warning-surface border border-warning-line",
      iconClass: "text-warning",
    },
    {
      label: w?.metrics?.sobReports?.label || "SOB Reports",
      value: "3",
      unit: "",
      subtitle: w?.metrics?.sobReports?.note || "↓ 1 vs last month",
      subtitleClass: "text-success font-bold",
      icon: Wind,
      iconBg: "bg-danger-surface border border-danger-line",
      iconClass: "text-danger",
    },
  ];

  return (
    <section className="space-y-3.5">
      {/* Primary EDW Comparison Cards - Exactly matching the screenshot */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {/* Card 1: Estimated Dry Weight */}
        <div className="group relative flex items-center justify-between rounded-card border border-line/90 bg-surface p-6 transition-all hover:border-primary-soft-line">
          <div className="flex items-center gap-4">
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-card border border-primary-soft-line bg-[var(--color-brand-50)] transition-transform group-hover:scale-105 sm:h-14 sm:w-14">
              <BathroomScaleIcon className="h-8 w-8 sm:h-9 sm:w-9" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-label-md text-fg">
                {w?.edwMetrics?.estimatedDryWeight || "Estimated Dry Weight"}
              </p>
              <p className="mt-stack-xs text-metric-md text-fg">
                {displayEdw}
                <span className="ml-1 text-body-sm text-fg-secondary">
                  {unit}
                </span>
              </p>
              <p className="mt-stack-xs text-caption text-fg-muted">
                {edwNote || w?.edwMetrics?.edwSetBy || "Set by care team."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenEdwModal}
            className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-line bg-surface-sunken px-2.5 py-1 text-xs font-semibold text-fg-secondary shadow-control transition-all hover:border-primary-soft-line hover:bg-primary-soft hover:text-fg-brand active:scale-95"
          >
            <Pencil className="h-3 w-3" />
            <span>{language === "ES" ? "Editar" : "Edit"}</span>
          </button>
        </div>

        {/* Card 2: Today's Weight */}
        <div className="group relative flex items-center justify-between rounded-card border border-line/90 bg-surface p-6 transition-all hover:border-primary-soft-line">
          <div className="flex items-center gap-4">
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-card border border-primary-soft-line bg-[var(--color-brand-50)] transition-transform group-hover:scale-105 sm:h-14 sm:w-14">
              <BathroomScaleIcon className="h-8 w-8 sm:h-9 sm:w-9" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-label-md text-fg">
                {w?.edwMetrics?.todaysWeight || "Today's Weight"}
              </p>
              <p className="mt-stack-xs text-metric-md text-fg">
                {displayToday}
                <span className="ml-1 text-body-sm text-fg-secondary">
                  {unit}
                </span>
              </p>
              <p className="mt-stack-xs text-caption text-fg-muted">
                {todayDateStr}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenEdwModal}
            className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-line bg-surface-sunken px-2.5 py-1 text-xs font-semibold text-fg-secondary shadow-control transition-all hover:border-primary-soft-line hover:bg-primary-soft hover:text-fg-brand active:scale-95"
          >
            <Pencil className="h-3 w-3" />
            <span>{language === "ES" ? "Editar" : "Edit"}</span>
          </button>
        </div>

        {/* Card 3: Difference Above / Below EDW */}
        <div className="flex items-center gap-4 rounded-card border border-line/90 bg-surface p-6 transition-all">
          <div
            className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14 ${statusIconBg} shadow-control`}
          >
            {statusIcon}
          </div>
          <div className="min-w-0">
            <p className="truncate text-label-md text-fg">{statusTitle}</p>
            <p className="mt-stack-xs text-metric-md text-fg">
              {diffSign}
              {Math.abs(diffVal).toFixed(1)}
              <span className="ml-1 text-body-sm text-fg-secondary">
                {unit}
              </span>
            </p>
            <p
              className={`mt-0.5 text-xs font-bold sm:text-[13px] ${statusTextColor}`}
            >
              {statusSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Supporting Symptom & Fluid Tracking Cards - Identical Font Size & Colors to New Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {secondaryCards.map((card) => (
          <article
            key={card.label}
            className="group relative flex items-center gap-4 rounded-card border border-line/90 bg-surface p-6 transition-all hover:border-primary-soft-line"
          >
            <div
              className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-card sm:h-14 sm:w-14 ${card.iconBg} shadow-control transition-transform group-hover:scale-105`}
            >
              <card.icon
                className={`h-7 w-7 sm:h-8 sm:w-8 ${card.iconClass}`}
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-label-md text-fg">{card.label}</p>
              <p className="mt-stack-xs text-metric-md text-fg">
                {card.value}
                {card.unit && (
                  <span className="ml-1 text-body-sm text-fg-secondary">
                    {card.unit}
                  </span>
                )}
              </p>
              <p
                className={`mt-0.5 truncate text-xs sm:text-[13px] ${card.subtitleClass}`}
              >
                {card.subtitle}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
