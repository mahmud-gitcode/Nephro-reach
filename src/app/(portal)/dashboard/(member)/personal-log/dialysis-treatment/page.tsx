"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Calendar,
  CalendarX,
  CheckCircle2,
  Clock,
  Droplets,
  Eye,
  HeartPulse,
  Pencil,
  Plus,
  Scale,
  Timer,
} from "lucide-react";
import { mockDialysisEntries, DialysisLogEntry } from "@/features/personal-log/dialysisTreatmentData";
import { useLanguage } from "@/context/LanguageContext";
import MedicationsGivenSection from "@/features/personal-log/MedicationsGivenSection";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";

function SummaryCards() {
  const { dictionary } = useLanguage();
  const dt = dictionary.dialysisTreatment;
  const summaryCards = [
    {
      label: dt?.summary?.attended || "Treatment attended",
      value: "90%",
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50 border-emerald-100",
    },
    {
      label: dt?.summary?.arrivedLate || "Arrived late",
      value: "2",
      icon: Clock,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50 border-amber-100",
    },
    {
      label: dt?.summary?.endedEarly || "Ended early",
      value: "4",
      icon: Timer,
      iconColor: "text-red-500",
      bgColor: "bg-red-50 border-red-100",
    },
    {
      label: dt?.summary?.missed || "Missed treatments",
      value: "2",
      icon: CalendarX,
      iconColor: "text-rose-500",
      bgColor: "bg-rose-50 border-rose-100",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => (
        <div
          key={card.label}
          className="flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-blue-300 hover:shadow-md"
        >
          <div
            className={`flex h-13 w-13 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border ${card.bgColor} shadow-2xs`}
          >
            <card.icon className={`h-7 w-7 sm:h-8 sm:w-8 ${card.iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{card.label}</p>
            <p className="mt-0.5 text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-950">
              {card.value}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}

function ClinicalMeasurementsCards() {
  const { dictionary } = useLanguage();
  const dt = dictionary.dialysisTreatment;
  const clinicalMeasurements = [
    {
      label: dt?.clinicalMeasurements?.fluidRemoved || "Fluid Removed",
      value: "2.3",
      unit: dt?.clinicalMeasurements?.liters || "Liters",
      icon: Droplets,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50 border-blue-100",
    },
    {
      label: dt?.clinicalMeasurements?.postWeight || "Post Weight",
      value: "72.4",
      unit: "kg (pre: 74.7)",
      icon: Scale,
      iconColor: "text-teal-600",
      bgColor: "bg-teal-50 border-teal-100",
    },
    {
      label: dt?.clinicalMeasurements?.bloodPressure || "Blood Pressure",
      value: "118 / 72",
      unit: dt?.clinicalMeasurements?.mmHg || "mmHg",
      icon: Activity,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50 border-indigo-100",
    },
    {
      label: dt?.clinicalMeasurements?.heartRate || "Heart Rate",
      value: "78",
      unit: dt?.clinicalMeasurements?.bpm || "bpm",
      icon: HeartPulse,
      iconColor: "text-rose-500",
      bgColor: "bg-rose-50 border-rose-100",
    },
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#2563EB]" />
          <span>{dt?.clinicalMeasurements?.title || "Clinical Measurements"}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {clinicalMeasurements.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div
              className={`flex h-13 w-13 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border ${card.bgColor} shadow-2xs`}
            >
              <card.icon className={`h-7 w-7 sm:h-8 sm:w-8 ${card.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{card.label}</p>
              <div className="mt-0.5 flex items-baseline">
                <span className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-950">
                  {card.value}
                </span>
                <span className="ml-1.5 text-sm sm:text-base font-bold text-slate-800">
                  {card.unit}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SymptomsDonut() {
  const { dictionary } = useLanguage();
  const dt = dictionary.dialysisTreatment;
  const symptomSlices = [
    {
      label: dt?.symptomsDonut?.cramping || "Cramping",
      count: 29,
      percent: 50,
      color: "#2563EB",
    },
    {
      label: dt?.symptomsDonut?.lowBp || "Low BP",
      count: 16,
      percent: 28,
      color: "#F59E0B",
    },
    {
      label: dt?.symptomsDonut?.fatigue || "Fatigue",
      count: 13,
      percent: 22,
      color: "#EF4444",
    },
  ];

  const size = 210;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedOffset = 0;

  return (
    <section className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
      <h2 className="text-base font-bold text-slate-900">
        {dt?.symptomsDonut?.title || "Symptoms During Treatment"}
      </h2>

      <div className="relative flex justify-center items-center py-2">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
            />
            {symptomSlices.map((slice) => {
              const strokeDasharray = `${(slice.percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedOffset;
              accumulatedOffset += (slice.percent / 100) * circumference;

              return (
                <circle
                  key={slice.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-slate-900">86%</span>
            <span className="text-xs font-medium text-slate-500 mt-0.5">
              {dt?.symptomsDonut?.overall || "Overall"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
        {symptomSlices.map((slice) => (
          <div key={slice.label} className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span>{slice.label}</span>
            </div>
            <p className="text-xs font-bold text-slate-900">
              {slice.count} ({slice.percent}%)
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** `2026-06-24` for a date input. */
function toDateInputValue(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Newest logged treatment, so the page opens on a day that has data. */
const LATEST_ENTRY_DATE =
  [...mockDialysisEntries]
    .map((entry) => entry.date)
    .sort()
    .pop() ?? toDateInputValue(new Date());

export default function DialysisTreatmentPage() {
  const { language, dictionary } = useLanguage();
  const dt = dictionary.dialysisTreatment;
  const isEs = language === "ES";
  const [selectedDate, setSelectedDate] = useState<string | null>(
    LATEST_ENTRY_DATE,
  );

  const visibleEntries = selectedDate
    ? mockDialysisEntries.filter((entry) => entry.date === selectedDate)
    : mockDialysisEntries;

  return (
    <div className="w-full space-y-6">
      <PersonalLogDisclaimer />

      {/* MONTH PICKER & ADD ENTRY BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative flex shrink-0 items-center">
            <Calendar className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-600" />
            <input
              type="date"
              value={selectedDate ?? ""}
              aria-label={isEs ? "Elegir fecha" : "Pick a date"}
              onChange={(event) => setSelectedDate(event.target.value || null)}
              onClick={(event) => {
                // Tapping anywhere on the field opens the calendar, not just
                // the browser's own small icon.
                const input = event.currentTarget;
                if (typeof input.showPicker === "function") {
                  try {
                    input.showPicker();
                  } catch {
                    // Some browsers refuse outside a user gesture; focusing
                    // still lets the field be typed into.
                  }
                }
              }}
              className="h-[42px] cursor-pointer rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm font-bold tabular-nums text-slate-800 shadow-2xs outline-none transition-colors hover:bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(toDateInputValue(new Date()))}
            className="flex shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-2xs transition-colors hover:bg-slate-50 cursor-pointer"
          >
            {isEs ? "Hoy" : "Today"}
          </button>

          <Link
            href="/dashboard/personal-log/dialysis-treatment/add"
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{dt?.addEntry || "Add Treatment"}</span>
          </Link>
        </div>
      </div>

      {/* TOP 4 SUMMARY CARDS */}
      <SummaryCards />

      {/* CLINICAL MEASUREMENTS */}
      <ClinicalMeasurementsCards />

      {/* MEDICATIONS GIVEN DURING DIALYSIS & SYMPTOMS DONUT */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div className="xl:col-span-8">
          <MedicationsGivenSection />
        </div>
        <div className="xl:col-span-4">
          <SymptomsDonut />
        </div>
      </section>

      {/* DIALYSIS TREATMENT LOG ENTRIES TABLE */}
      <TreatmentEntriesTable
        entries={visibleEntries}
        onShowAll={() => setSelectedDate(null)}
      />
    </div>
  );
}

function AttendanceBadge({ status }: { status: DialysisLogEntry["attendance"] }) {
  const { dictionary } = useLanguage();
  const dt = dictionary.dialysisTreatment;
  const styles = {
    Attended: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Arrived Late": "bg-amber-50 text-amber-700 border-amber-200",
    "Ended Early": "bg-red-50 text-red-700 border-red-200",
    Missed: "bg-rose-50 text-rose-700 border-rose-200",
  }[status];

  const labels: Record<DialysisLogEntry["attendance"], string> = {
    Attended: dt?.table?.statusAttended || "Attended",
    "Arrived Late": dt?.table?.statusLate || "Arrived Late",
    "Ended Early": dt?.table?.statusEarly || "Ended Early",
    Missed: dt?.table?.statusMissed || "Missed",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${styles}`}
    >
      {labels[status] || status}
    </span>
  );
}

function TreatmentEntriesTable({
  entries,
  onShowAll,
}: {
  entries: DialysisLogEntry[];
  onShowAll: () => void;
}) {
  const { language, dictionary } = useLanguage();
  const isEs = language === "ES";
  const dt = dictionary.dialysisTreatment;

  if (entries.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200/80 bg-white p-10 text-center shadow-2xs">
        <p className="text-sm font-semibold text-slate-600">
          {isEs
            ? "No hay tratamiento registrado en esta fecha."
            : "No treatment logged on this date."}
        </p>
        <button
          type="button"
          onClick={onShowAll}
          className="mt-4 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-2xs transition-colors hover:bg-slate-50 cursor-pointer"
        >
          {isEs ? "Ver todas las fechas" : "Show all dates"}
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
      {/* Table Content */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">{dt?.table?.date || "Date"}</th>
                <th className="px-4 py-3.5">{dt?.table?.treatmentType || "Treatment Type"}</th>
                <th className="px-4 py-3.5">{dt?.table?.fluidRemoved || "Fluid Removed"}</th>
                <th className="px-4 py-3.5">{dt?.table?.weight || "Pre / Post Weight"}</th>
                <th className="px-4 py-3.5">{dt?.table?.bloodPressure || "Blood Pressure"}</th>
                <th className="px-4 py-3.5">{dt?.table?.symptoms || "Symptoms"}</th>
                <th className="px-4 py-3.5">{dt?.table?.status || "Status"}</th>
                <th className="px-4 py-3.5 text-center w-24">{dt?.table?.actions || "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => {
                const symptomsList = entry.preSymptoms
                  .concat(entry.intraSymptoms)
                  .filter((s) => s !== "None / Comfortable")
                  .slice(0, 2);

                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Date & Time */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{entry.displayDate.split(",")[1]}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{entry.startTime} – {entry.endTime}</div>
                    </td>

                    {/* Treatment Type */}
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {entry.treatmentType}
                    </td>

                    {/* Fluid Removed */}
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {entry.fluidRemoved}
                      </span>
                    </td>

                    {/* Pre / Post Weight */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">
                        {entry.preWeight} → {entry.postWeight}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-bold">
                        {entry.weightDiff}
                      </div>
                    </td>

                    {/* Blood Pressure */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{entry.bloodPressurePost}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{entry.heartRatePost}</div>
                    </td>

                    {/* Symptoms */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {symptomsList.length > 0 ? (
                          symptomsList.map((s) => (
                            <span
                              key={s}
                              className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[11px]">
                            {dt?.table?.none || "None"}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Attendance Status */}
                    <td className="px-4 py-3.5">
                      <AttendanceBadge status={entry.attendance} />
                    </td>

                    {/* Actions: View (Full Page) & Edit */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Icon Button (Links to dedicated full page!) */}
                        <Link
                          href={`/dashboard/personal-log/dialysis-treatment/view?id=${entry.id}`}
                          className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 shadow-2xs transition-colors cursor-pointer"
                          title={dt?.table?.viewTooltip || "View Full Entry Details"}
                          aria-label={`View full entry for ${entry.displayDate}`}
                        >
                          <Eye className="size-4" />
                        </Link>

                        {/* Edit Icon Button */}
                        <Link
                          href={`/dashboard/personal-log/dialysis-treatment/add?edit=${entry.id}`}
                          className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 shadow-2xs transition-colors cursor-pointer"
                          title={dt?.table?.editTooltip || "Edit Entry"}
                          aria-label={`Edit entry for ${entry.displayDate}`}
                        >
                          <Pencil className="size-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
