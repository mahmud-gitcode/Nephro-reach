"use client";

import React from "react";
import Link from "next/link";
import {
  Download,
  Edit3,
  HeartPulse,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PersonalLogDisclaimer from "@/components/dashboard/PersonalLogDisclaimer";

const readingGroupsData = [
  {
    dateEn: "May 5, 2026",
    dateEs: "5 de mayo de 2026",
    readings: [
      {
        time: "12:00 AM",
        systolic: 123,
        diastolic: 78,
        pulse: 72,
        position: "Sitting",
        symptoms: "None",
        medication: "Taken",
        status: "Normal",
      },
      {
        time: "08:15 AM",
        systolic: 132,
        diastolic: 84,
        pulse: 76,
        position: "Standing",
        symptoms: "Mild headache",
        medication: "Taken",
        status: "Elevated",
      },
      {
        time: "09:30 PM",
        systolic: 118,
        diastolic: 74,
        pulse: 70,
        position: "Sitting",
        symptoms: "None",
        medication: "Taken",
        status: "Normal",
      },
    ],
  },
  {
    dateEn: "May 4, 2026",
    dateEs: "4 de mayo de 2026",
    readings: [
      {
        time: "07:45 AM",
        systolic: 145,
        diastolic: 92,
        pulse: 81,
        position: "Sitting",
        symptoms: "Dizzy",
        medication: "Late",
        status: "High",
      },
      {
        time: "01:20 PM",
        systolic: 138,
        diastolic: 86,
        pulse: 78,
        position: "Standing",
        symptoms: "Tired",
        medication: "Taken",
        status: "Elevated",
      },
      {
        time: "10:10 PM",
        systolic: 129,
        diastolic: 80,
        pulse: 74,
        position: "Sitting",
        symptoms: "None",
        medication: "Taken",
        status: "Normal",
      },
    ],
  },
  {
    dateEn: "May 3, 2026",
    dateEs: "3 de mayo de 2026",
    readings: [
      {
        time: "06:55 AM",
        systolic: 126,
        diastolic: 79,
        pulse: 73,
        position: "Sitting",
        symptoms: "None",
        medication: "Taken",
        status: "Normal",
      },
      {
        time: "03:00 PM",
        systolic: 141,
        diastolic: 89,
        pulse: 82,
        position: "Standing",
        symptoms: "Short breath",
        medication: "Taken",
        status: "High",
      },
      {
        time: "09:05 PM",
        systolic: 122,
        diastolic: 77,
        pulse: 71,
        position: "Sitting",
        symptoms: "None",
        medication: "Taken",
        status: "Normal",
      },
    ],
  },
];

const trendPointsBase = [
  { dayEn: "Sun", dayEs: "Dom", systolic: 146, diastolic: 92 },
  { dayEn: "Mon", dayEs: "Lun", systolic: 112, diastolic: 74 },
  { dayEn: "Tue", dayEs: "Mar", systolic: 101, diastolic: 70 },
  { dayEn: "Wed", dayEs: "Mié", systolic: 108, diastolic: 78 },
  { dayEn: "Thu", dayEs: "Jue", systolic: 148, diastolic: 88 },
  { dayEn: "Fri", dayEs: "Vie", systolic: 154, diastolic: 91 },
  { dayEn: "Sat", dayEs: "Sáb", systolic: 130, diastolic: 82 },
];

function ReadingStatus({ status }: { status: string }) {
  const { t } = useLanguage();
  const label = t(`bloodPressure.statuses.${status}`) || status;
  const className =
    status === "High"
      ? "bg-red-50 text-red-600"
      : status === "Elevated"
        ? "bg-amber-50 text-amber-600"
        : "bg-emerald-50 text-emerald-600";

  return (
    <span className={`inline-flex h-6 items-center rounded px-2 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function DailyBloodPressureList() {
  const { language, t } = useLanguage();

  return (
    <section className="rounded-[14px] border border-[#E3E6F0] bg-white p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">
          {t("bloodPressure.listTitle")}
        </h1>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/personal-log/blood-pressure/add"
            className="flex h-12 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold tracking-[0.08px] text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            {t("bloodPressure.addReading")}
          </Link>
          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold tracking-[0.08px] text-slate-950 transition-colors hover:bg-white cursor-pointer"
          >
            <Download className="h-5 w-5" />
            {t("bloodPressure.export")}
          </button>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full text-left text-sm">
            <thead className="bg-[#F1F5FA] text-sm font-medium leading-5 text-slate-950">
              <tr>
                <th className="border-b border-slate-200 px-3 py-4">{t("bloodPressure.tableHeaders.date")}</th>
                <th className="border-b border-slate-200 px-3 py-4">{t("bloodPressure.tableHeaders.time")}</th>
                <th className="border-b border-slate-200 px-3 py-4">{t("bloodPressure.tableHeaders.systolic")}</th>
                <th className="border-b border-slate-200 px-3 py-4">{t("bloodPressure.tableHeaders.diastolic")}</th>
                <th className="border-b border-slate-200 px-3 py-4">{t("bloodPressure.tableHeaders.pulse")}</th>
                <th className="border-b border-slate-200 px-3 py-4">{t("bloodPressure.tableHeaders.position")}</th>
                <th className="border-b border-slate-200 px-3 py-4">{t("bloodPressure.tableHeaders.symptoms")}</th>
                <th className="border-b border-slate-200 px-3 py-4">{t("bloodPressure.tableHeaders.medication")}</th>
                <th className="border-b border-slate-200 px-3 py-4">{t("bloodPressure.tableHeaders.action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-slate-200">
              {readingGroupsData.map((group) => {
                const dateLabel = language === "ES" ? group.dateEs : group.dateEn;
                return group.readings.map((reading, index) => {
                  const positionLabel = t(`bloodPressure.positions.${reading.position}`) || reading.position;
                  const symptomsLabel = t(`bloodPressure.symptoms.${reading.symptoms}`) || reading.symptoms;
                  const medicationLabel = t(`bloodPressure.medications.${reading.medication}`) || reading.medication;

                  return (
                    <tr key={`${dateLabel}-${reading.time}`}>
                      {index === 0 && (
                        <td
                          rowSpan={group.readings.length}
                          className="border-r border-dashed border-slate-200 px-3 py-3 align-top font-medium text-slate-800"
                        >
                          {dateLabel}
                        </td>
                      )}
                      <td className="px-3 py-3 font-medium text-slate-800">{reading.time}</td>
                      <td className="px-3 py-3 font-semibold text-slate-950">{reading.systolic}</td>
                      <td className="px-3 py-3 font-semibold text-slate-950">{reading.diastolic}</td>
                      <td className="px-3 py-3 font-medium text-slate-800">{reading.pulse}</td>
                      <td className="px-3 py-3 font-medium text-slate-800">{positionLabel}</td>
                      <td className="px-3 py-3 font-medium text-slate-800">{symptomsLabel}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <ReadingStatus status={reading.status} />
                          <span className="text-sm font-medium text-slate-700">{medicationLabel}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-full p-1 text-slate-700 transition-colors hover:bg-slate-100 cursor-pointer"
                            aria-label={`Edit reading from ${dateLabel} at ${reading.time}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="rounded-full p-1 text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                            aria-label={`Delete reading from ${dateLabel} at ${reading.time}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="rounded-full p-1 text-slate-700 transition-colors hover:bg-slate-100 cursor-pointer"
                            aria-label={`More actions for ${dateLabel} at ${reading.time}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function TrendChart() {
  const { language, t } = useLanguage();

  const chartWidth = 640;
  const chartHeight = 184;
  const xFor = (index: number) => 26 + index * 96;
  const yFor = (value: number) => 12 + ((160 - value) / 80) * 156;
  const systolicLine = trendPointsBase.map((point, index) => `${xFor(index)},${yFor(point.systolic)}`).join(" ");
  const diastolicLine = trendPointsBase.map((point, index) => `${xFor(index)},${yFor(point.diastolic)}`).join(" ");

  return (
    <section className="rounded-[14px] border border-[#E3E6F0] bg-white p-3.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">
          {t("bloodPressure.trendsTitle")}
        </h2>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium leading-4 text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#6D5DFB]" />
            {t("bloodPressure.systolicLegend")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF6F61]" />
            {t("bloodPressure.diastolicLegend")}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <div className="grid h-[206px] grid-cols-[38px_minmax(0,1fr)] gap-3">
          <div className="flex flex-col justify-between text-right text-[13px] leading-5 tracking-[0.2px] text-slate-600">
            {[160, 140, 120, 100, 80].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="relative overflow-hidden rounded-lg">
            <div className="absolute inset-0 flex flex-col justify-between py-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <span key={index} className="border-t border-dashed border-slate-200" />
              ))}
            </div>
            <div className="absolute inset-x-5 inset-y-0 flex justify-between">
              {Array.from({ length: 7 }).map((_, index) => (
                <span key={index} className="border-l border-dashed border-slate-200" />
              ))}
            </div>
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polyline
                points={systolicLine}
                fill="none"
                stroke="#6D5DFB"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                points={diastolicLine}
                fill="none"
                stroke="#FF6F61"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              {trendPointsBase.map((point, index) => (
                <React.Fragment key={index}>
                  <circle cx={xFor(index)} cy={yFor(point.systolic)} r="4" fill="white" stroke="#6D5DFB" strokeWidth="2" />
                  <circle cx={xFor(index)} cy={yFor(point.diastolic)} r="4" fill="white" stroke="#FF6F61" strokeWidth="2" />
                </React.Fragment>
              ))}
            </svg>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-[38px_minmax(0,1fr)] gap-3">
          <span />
          <div className="flex justify-between px-3 text-xs leading-4 tracking-[0.06px] text-slate-700 font-medium">
            {trendPointsBase.map((point, idx) => (
              <span key={idx} className="w-9 text-center">
                {language === "ES" ? point.dayEs : point.dayEn}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReadingGuide() {
  const { t } = useLanguage();

  const guideRows = [
    { label: t("bloodPressure.guide.high"), status: t("bloodPressure.statuses.High"), color: "bg-red-50 text-red-600" },
    { label: t("bloodPressure.guide.elevated"), status: t("bloodPressure.statuses.Elevated"), color: "bg-amber-50 text-amber-600" },
    { label: t("bloodPressure.guide.normal"), status: t("bloodPressure.statuses.Normal"), color: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <aside className="rounded-[14px] border border-[#E3E6F0] bg-white p-3.5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500">
          <HeartPulse className="h-5 w-5" />
        </span>
        <h2 className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">
          {t("bloodPressure.bpGuideTitle")}
        </h2>
      </div>

      <div className="mt-6 space-y-4">
        {guideRows.map((row) => (
          <div key={row.label} className="rounded-lg border border-slate-200 bg-[#FCFDFD] p-3">
            <p className="text-sm font-medium leading-5 text-slate-700">{row.label}</p>
            <span className={`mt-2 inline-flex h-7 items-center rounded px-2 text-sm font-semibold ${row.color}`}>
              {row.status}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default function BloodPressureLogPage() {
  return (
    <div className="space-y-4">
      <PersonalLogDisclaimer />

      <DailyBloodPressureList />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_257px]">
        <TrendChart />
        <ReadingGuide />
      </section>
    </div>
  );
}
