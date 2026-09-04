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
  Info,
  Pencil,
  Plus,
  Scale,
  Timer,
} from "lucide-react";
import { mockDialysisEntries, DialysisLogEntry } from "@/lib/dialysisTreatmentData";

const summaryCards = [
  {
    label: "Treatment attended",
    value: "90%",
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-100",
  },
  {
    label: "Arrived late",
    value: "2",
    icon: Clock,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-100",
  },
  {
    label: "Ended early",
    value: "4",
    icon: Timer,
    iconColor: "text-red-500",
    bgColor: "bg-red-50 border-red-100",
  },
  {
    label: "Missed treatments",
    value: "2",
    icon: CalendarX,
    iconColor: "text-rose-500",
    bgColor: "bg-rose-50 border-rose-100",
  },
];

const recoveryPoints = [
  { month: "Mar", good: 10, okay: 20, bad: 40 },
  { month: "Apr", good: 68, okay: 55, bad: 27 },
  { month: "May", good: 30, okay: 33, bad: 12 },
  { month: "Jun", good: 60, okay: 20, bad: 70 },
];

const symptomSlices = [
  { label: "Cramping", count: 29, percent: 50, color: "#2563EB" },
  { label: "Low BP", count: 16, percent: 28, color: "#F59E0B" },
  { label: "Fatigue", count: 13, percent: 22, color: "#EF4444" },
];

function SummaryCards() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => (
        <div
          key={card.label}
          className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs"
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${card.bgColor}`}
          >
            <card.icon className={`h-6 w-6 ${card.iconColor}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">{card.label}</p>
            <p className="mt-0.5 text-3xl font-bold text-slate-900 tracking-tight">
              {card.value}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}

const clinicalMeasurements = [
  {
    label: "Fluid Removed",
    value: "2.3",
    unit: "Liters",
    icon: Droplets,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-100",
  },
  {
    label: "Post Weight",
    value: "72.4",
    unit: "kg (pre: 74.7)",
    icon: Scale,
    iconColor: "text-teal-600",
    bgColor: "bg-teal-50 border-teal-100",
  },
  {
    label: "Blood Pressure",
    value: "118 / 72",
    unit: "mmHg",
    icon: Activity,
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-50 border-indigo-100",
  },
  {
    label: "Heart Rate",
    value: "78",
    unit: "bpm",
    icon: HeartPulse,
    iconColor: "text-rose-500",
    bgColor: "bg-rose-50 border-rose-100",
  },
];

function ClinicalMeasurementsCards() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#2563EB]" />
          <span>Clinical Measurements</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {clinicalMeasurements.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:shadow-xs transition-all"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${card.bgColor}`}
            >
              <card.icon className={`h-6 w-6 ${card.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-600">{card.label}</p>
              <div className="mt-0.5 flex items-baseline gap-1.5 flex-wrap">
                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  {card.value}
                </span>
                <span className="text-xs font-semibold text-slate-500">
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

function RecoveryPatternChart() {
  const width = 540;
  const height = 210;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 30;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const getX = (index: number) =>
    paddingLeft + (index / (recoveryPoints.length - 1)) * chartW;
  const getY = (val: number) =>
    paddingTop + chartH - (val / 100) * chartH;

  const getCurvePath = (key: "good" | "okay" | "bad") => {
    const coords = recoveryPoints.map((pt, idx) => ({
      x: getX(idx),
      y: getY(pt[key]),
    }));

    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 2;
      const cp1y = curr.y;
      const cp2x = curr.x + (next.x - curr.x) / 2;
      const cp2y = next.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return path;
  };

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">
          Recovery Pattern Tracking
        </h2>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#2563EB]" />
            Good
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#F59E0B]" />
            Okay
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#EF4444]" />
            Bad
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[420px]">
          {[100, 80, 60, 40, 20, 0].map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px] font-medium"
                >
                  {tick}
                </text>
                <line
                  x1={paddingLeft}
                  x2={width - paddingRight}
                  y1={y}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          <path
            d={getCurvePath("good")}
            fill="none"
            stroke="#2563EB"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d={getCurvePath("okay")}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={getCurvePath("bad")}
            fill="none"
            stroke="#EF4444"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {recoveryPoints.map((pt, idx) => {
            const cx = getX(idx);
            return (
              <g key={pt.month}>
                <circle cx={cx} cy={getY(pt.good)} r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx={cx} cy={getY(pt.okay)} r="4" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx={cx} cy={getY(pt.bad)} r="4" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />

                <text
                  x={cx}
                  y={height - 5}
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px] font-medium"
                >
                  {pt.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function SymptomsDonut() {
  const size = 210;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedOffset = 0;

  return (
    <section className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
      <h2 className="text-base font-bold text-slate-900">
        Symptoms During Treatment
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
            <span className="text-xs font-medium text-slate-500 mt-0.5">Overall</span>
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

export default function DialysisTreatmentPage() {
  const [selectedMonth, setSelectedMonth] = useState("Jun");

  return (
    <div className="w-full space-y-6">
      {/* TOP EDUCATIONAL BANNER, MONTH PICKER & ADD ENTRY BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200/80 bg-[#FFFBEB] px-4 py-3 text-xs sm:text-sm font-semibold text-[#92400E] shadow-2xs flex-1">
          <Info className="h-5 w-5 shrink-0 text-[#B45309]" />
          <span>Completing prescribed treatments is important for dialysis adequacy</span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Calendar className="h-4 w-4 text-slate-600" />
            <span>{selectedMonth}</span>
          </button>

          <Link
            href="/dashboard/personal-log/dialysis-treatment/add"
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Entry</span>
          </Link>
        </div>
      </div>

      {/* TOP 4 SUMMARY CARDS */}
      <SummaryCards />

      {/* CLINICAL MEASUREMENTS */}
      <ClinicalMeasurementsCards />

      {/* MAIN CHARTS SECTION: RECOVERY PATTERN & SYMPTOMS DONUT */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div className="xl:col-span-8">
          <RecoveryPatternChart />
        </div>
        <div className="xl:col-span-4">
          <SymptomsDonut />
        </div>
      </section>

      {/* DIALYSIS TREATMENT LOG ENTRIES TABLE */}
      <TreatmentEntriesTable />
    </div>
  );
}

function AttendanceBadge({ status }: { status: DialysisLogEntry["attendance"] }) {
  const styles = {
    Attended: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Arrived Late": "bg-amber-50 text-amber-700 border-amber-200",
    "Ended Early": "bg-red-50 text-red-700 border-red-200",
    Missed: "bg-rose-50 text-rose-700 border-rose-200",
  }[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${styles}`}
    >
      {status}
    </span>
  );
}

function TreatmentEntriesTable() {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
      {/* Table Content */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Treatment Type</th>
                <th className="px-4 py-3.5">Fluid Removed</th>
                <th className="px-4 py-3.5">Pre / Post Weight</th>
                <th className="px-4 py-3.5">Blood Pressure</th>
                <th className="px-4 py-3.5">Symptoms</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockDialysisEntries.map((entry) => {
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
                          <span className="text-slate-400 text-[11px]">None</span>
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
                          title="View Full Entry Details"
                          aria-label={`View full entry for ${entry.displayDate}`}
                        >
                          <Eye className="size-4" />
                        </Link>

                        {/* Edit Icon Button */}
                        <Link
                          href={`/dashboard/personal-log/dialysis-treatment/add?edit=${entry.id}`}
                          className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 shadow-2xs transition-colors cursor-pointer"
                          title="Edit Entry"
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
