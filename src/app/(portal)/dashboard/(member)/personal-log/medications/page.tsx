"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Plus,
  Share2,
  Smile,
  UserPlus,
  X,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";

export interface MedicationReminder {
  id: string;
  medicationName: string;
  time: string;
  frequency: string;
  channels: ("in_app" | "sms")[];
  enabled: boolean;
  notes?: string;
}

const medicationsData = [
  {
    name: "Potassium",
    dose: "10 mg",
    route: "PO",
    frequencyEn: "Once daily",
    frequencyEs: "Una vez al día",
    purposeEn: "Blood pressure",
    purposeEs: "Presión arterial",
    startDate: "15/08/2017",
    endDate: "---",
    pharmacy: "HealthPlus",
    status: "Active",
  },
  {
    name: "Norvasc",
    dose: "10 mg",
    route: "PO",
    frequencyEn: "Once daily",
    frequencyEs: "Una vez al día",
    purposeEn: "Blood pressure",
    purposeEs: "Presión arterial",
    startDate: "15/08/2017",
    endDate: "---",
    pharmacy: "HealthPlus",
    status: "Active",
  },
  {
    name: "Sevelamer",
    dose: "800 mg",
    route: "PO",
    frequencyEn: "With meals",
    frequencyEs: "Con las comidas",
    purposeEn: "Phosphorus binder",
    purposeEs: "Quelante de fósforo",
    startDate: "03/02/2024",
    endDate: "---",
    pharmacy: "Kidney Care Rx",
    status: "Active",
  },
  {
    name: "Calcitriol",
    dose: "0.25 mcg",
    route: "PO",
    frequencyEn: "Mon/Wed/Fri",
    frequencyEs: "Lun/Mié/Vie",
    purposeEn: "Bone health",
    purposeEs: "Salud ósea",
    startDate: "09/11/2023",
    endDate: "---",
    pharmacy: "HealthPlus",
    status: "Active",
  },
  {
    name: "PTH",
    dose: "10 mg",
    route: "PO",
    frequencyEn: "PRN",
    frequencyEs: "PRN",
    purposeEn: "Provider Goal",
    purposeEs: "Meta del proveedor",
    startDate: "07/05/2016",
    endDate: "---",
    pharmacy: "HealthPlus",
    status: "PRN",
  },
  {
    name: "A1C",
    dose: "10 mg",
    route: "PO",
    frequencyEn: "Once daily (HS)",
    frequencyEs: "Una vez al día (noche)",
    purposeEn: "Cholesterol",
    purposeEs: "Colesterol",
    startDate: "16/08/2013",
    endDate: "16/08/2013",
    pharmacy: "HealthPlus",
    status: "Stopped",
  },
];

const INITIAL_REMINDERS: MedicationReminder[] = [
  {
    id: "r1",
    medicationName: "Potassium",
    time: "08:00 AM",
    frequency: "Daily",
    channels: ["in_app"],
    enabled: true,
    notes: "Take with breakfast",
  },
  {
    id: "r2",
    medicationName: "Norvasc",
    time: "08:00 AM",
    frequency: "Daily",
    channels: ["in_app"],
    enabled: true,
    notes: "Hold morning dose on dialysis days until after run",
  },
  {
    id: "r3",
    medicationName: "Sevelamer",
    time: "12:30 PM",
    frequency: "With meals",
    channels: ["in_app"],
    enabled: true,
    notes: "Chew thoroughly with first bite of lunch",
  },
  {
    id: "r4",
    medicationName: "Calcitriol",
    time: "07:00 PM",
    frequency: "Mon/Wed/Fri",
    channels: ["in_app"],
    enabled: true,
    notes: "Take with evening meal",
  },
];

const doseScheduleData = [
  {
    time: "07:40 am",
    medication: "Norvasc",
    generic: "Amlodipine",
    instructionsEn: "Take with food",
    instructionsEs: "Tomar con alimentos",
    status: "Taken",
    stamp: "8:02 AM",
    sideEffectsEn: "Fatigue",
    sideEffectsEs: "Fatiga",
  },
  {
    time: "01:09 am",
    medication: "Norvasc",
    generic: "Amlodipine",
    instructionsEn: "Take with food",
    instructionsEs: "Tomar con alimentos",
    status: "Taken",
    stamp: "8:02 AM",
    sideEffectsEn: "None",
    sideEffectsEs: "Ninguno",
  },
  {
    time: "02:30 pm",
    medication: "Norvasc",
    generic: "Amlodipine",
    instructionsEn: "Take with food",
    instructionsEs: "Tomar con alimentos",
    status: "Late",
    stamp: "8:02 AM",
    sideEffectsEn: "None",
    sideEffectsEs: "Ninguno",
  },
  {
    time: "12:01 pm",
    medication: "Norvasc",
    generic: "Amlodipine",
    instructionsEn: "Take with food",
    instructionsEs: "Tomar con alimentos",
    status: "Missed",
    stamp: "---",
    sideEffectsEn: "None",
    sideEffectsEs: "Ninguno",
  },
];

const alertsData = [
  {
    titleEn: "Medication Taken Confirmation",
    titleEs: "Confirmación de Medicamento Tomado",
    timeEn: "Just now",
    timeEs: "Hace un momento",
    bodyEn: "You have taken your 9:00 AM dose of Metformin 500 mg.",
    bodyEs: "Ha tomado su dosis de las 9:00 AM de Metformina 500 mg.",
  },
  {
    titleEn: "Missed Dose: Sevelamer",
    titleEs: "Dosis Omitida: Sevelámero",
    timeEn: "10 min ago",
    timeEs: "Hace 10 min",
    bodyEn: "You missed your 12:00 PM dose today.",
    bodyEs: "Omitió su dosis de las 12:00 PM de hoy.",
  },
  {
    titleEn: "Upcoming: Calcitriol",
    titleEs: "Próximo: Calcitriol",
    timeEn: "5 min ago",
    timeEs: "Hace 5 min",
    bodyEn: "Take with your evening meal.",
    bodyEs: "Tomar con la cena.",
  },
  {
    titleEn: "Refill Alert",
    titleEs: "Alerta de Resurtido",
    timeEn: "In 15 min",
    timeEs: "En 15 min",
    bodyEn: "Atorvastatin supply is running low.",
    bodyEs: "El suministro de Atorvastatina se está agotando.",
  },
  {
    titleEn: "Doctor's Appointment Reminder",
    titleEs: "Recordatorio de Cita Médica",
    timeEn: "Tomorrow",
    timeEs: "Mañana",
    bodyEn: "Nephrology follow-up at 10:00 AM.",
    bodyEs: "Seguimiento de nefrología a las 10:00 AM.",
  },
];

const statusClass: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-600",
  PRN: "bg-blue-50 text-blue-600",
  Stopped: "bg-red-50 text-red-500",
  Taken: "bg-emerald-50 text-emerald-600",
  Late: "bg-amber-50 text-amber-600",
  Missed: "bg-red-50 text-red-500",
};

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-blue-700 text-base font-medium text-white">
        {number}
      </span>
      <h2 className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">{title}</h2>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const label = t(`medicationsLog.statuses.${status}`) || status;
  return (
    <span className={`inline-flex h-6 items-center rounded px-2 text-sm font-semibold ${statusClass[status] || "bg-slate-100 text-slate-700"}`}>
      {label}
    </span>
  );
}

function MedicationMasterList({
  reminders,
  onOpenReminderModal,
}: {
  reminders: MedicationReminder[];
  onOpenReminderModal: (medName?: string) => void;
}) {
  const { language, t } = useLanguage();

  return (
    <section className="rounded-[14px] border border-[#E3E6F0] bg-white p-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle number="1" title={t("medicationsLog.section1")} />
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/personal-log/medications/add"
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm sm:text-base font-bold tracking-[0.08px] text-white shadow-sm transition-colors hover:bg-blue-700 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span>{t("medicationsLog.addMedication")}</span>
          </Link>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[1140px] w-full text-left text-sm">
            <thead className="bg-[#F1F5FA] text-sm font-medium text-slate-950">
              <tr>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.name")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.dose")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.route")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.frequency")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.purpose")}</th>
                <th className="border-b border-slate-200 px-3 py-3 text-center">
                  {language === "ES" ? "Hora Recordatorio" : "Reminder Alert"}
                </th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.startDate")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.endDate")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.pharmacy")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-slate-200">
              {medicationsData.map((medication) => {
                const rem = reminders.find(
                  (r) => r.medicationName.toLowerCase() === medication.name.toLowerCase() && r.enabled
                );

                return (
                  <tr key={`${medication.name}-${medication.startDate}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-slate-800">{medication.name}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{medication.dose}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-950">{medication.route}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">
                      {language === "ES" ? medication.frequencyEs : medication.frequencyEn}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">
                      {language === "ES" ? medication.purposeEs : medication.purposeEn}
                    </td>
                    <td
                      className="px-3 py-2.5 text-center cursor-pointer hover:bg-blue-50/40 transition-colors"
                      onClick={() => onOpenReminderModal(medication.name)}
                      title={language === "ES" ? "Haga clic para establecer hora de recordatorio" : "Click to set reminder time"}
                    >
                      {rem ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenReminderModal(medication.name);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all cursor-pointer shadow-2xs"
                          title="Click to edit reminder time"
                        >
                          <Bell className="h-3 w-3 text-blue-600" />
                          <span>{rem.time}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenReminderModal(medication.name);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 hover:underline cursor-pointer"
                        >
                          <Bell className="h-3 w-3" />
                          <span>{language === "ES" ? "+ Recordatorio" : "+ Set Alert"}</span>
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{medication.startDate}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{medication.endDate}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{medication.pharmacy}</td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={medication.status} />
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

function DoseSchedule({
  reminders,
  onOpenReminderModal,
}: {
  reminders: MedicationReminder[];
  onOpenReminderModal: (medName?: string) => void;
}) {
  const { language, t } = useLanguage();

  return (
    <section className="rounded-[14px] border border-[#E3E6F0] bg-white p-3.5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SectionTitle number="2" title={t("medicationsLog.section2")} />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold text-slate-950 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
            {language === "ES" ? "Mayo 20" : "May 20"}
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="h-12 rounded border border-slate-200 bg-[#F1F5FA] px-4 text-base font-bold text-slate-950 cursor-pointer"
          >
            {t("medicationsLog.today")}
          </button>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-[#F1F5FA] text-sm font-medium text-slate-950">
              <tr>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.time")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.medication")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.instructions")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.status")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.timeStamp")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.sideEffects")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-slate-200">
              {doseScheduleData.map((dose, idx) => {
                const rem = reminders.find(
                  (r) => r.medicationName.toLowerCase() === dose.medication.toLowerCase() && r.enabled
                );

                return (
                  <tr key={`${dose.time}-${idx}`}>
                    <td className="px-3 py-3 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span>{dose.time}</span>
                        {rem && (
                          <span title={`Reminder set for ${rem.time}`}>
                            <Bell className="h-3 w-3 text-blue-600 shrink-0" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-950">{dose.medication}</p>
                      <p className="text-xs text-slate-600">{dose.generic}</p>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-950">
                      {language === "ES" ? dose.instructionsEs : dose.instructionsEn}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={dose.status} />
                    </td>
                    <td className="px-3 py-3">
                      <p className={`font-medium ${dose.status === "Late" ? "text-amber-600" : "text-slate-800"}`}>
                        {dose.stamp}
                      </p>
                      <p className="text-xs text-slate-600">{t("medicationsLog.today")}</p>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-800">
                      {language === "ES" ? dose.sideEffectsEs : dose.sideEffectsEn}
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

function AdherenceChart() {
  const { language, t } = useLanguage();

  const dayLabels = language === "ES"
    ? ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const missedDoses = [
    { day: dayLabels[0], value: 2 },
    { day: dayLabels[1], value: 1.4 },
    { day: dayLabels[2], value: 0.1 },
    { day: dayLabels[3], value: 2 },
    { day: dayLabels[4], value: 0.1 },
    { day: dayLabels[5], value: 2 },
    { day: dayLabels[6], value: 1.4 },
  ];

  const bpPoints = [
    { day: dayLabels[0], bp: 148, adherence: 78 },
    { day: dayLabels[1], bp: 110, adherence: 22 },
    { day: dayLabels[2], bp: 94, adherence: 25 },
    { day: dayLabels[3], bp: 103, adherence: 78 },
    { day: dayLabels[4], bp: 148, adherence: 76 },
    { day: dayLabels[5], bp: 153, adherence: 96 },
    { day: dayLabels[6], bp: 130, adherence: 95 },
  ];

  const chartWidth = 252;
  const chartHeight = 152;
  const xFor = (index: number) => 18 + index * 36;
  const bpY = (value: number) => 8 + ((160 - value) / 80) * 136;
  const adherenceY = (value: number) => 8 + ((100 - value) / 100) * 136;
  const bpLine = bpPoints.map((point, index) => `${xFor(index)},${bpY(point.bp)}`).join(" ");
  const adherenceLine = bpPoints
    .map((point, index) => `${xFor(index)},${adherenceY(point.adherence)}`)
    .join(" ");

  return (
    <section className="rounded-[14px] border border-[#E3E6F0] bg-white p-3.5">
      <SectionTitle number="3" title={t("medicationsLog.section3")} />

      <div className="mt-3 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-xl border border-[#E3E6F0] bg-white p-3.5">
          <div>
            <h3 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
              {t("medicationsLog.adherence.overallTitle")}
            </h3>
            <p className="mt-2 text-xs font-medium leading-4 tracking-[0.06px] text-slate-500">
              {t("medicationsLog.adherence.totalDoses")}
            </p>
          </div>

          <div className="mt-5 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <div className="relative h-[182px] w-[182px] shrink-0 rounded-full bg-[conic-gradient(#0AA76F_0deg_180deg,#F59E0B_180deg_288deg,#FF5536_288deg_360deg)]">
              <div className="absolute inset-[26px] rounded-full bg-white" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-lg font-medium leading-7 tracking-[0.09px] text-slate-950">86%</p>
                <p className="text-xs leading-4 tracking-[0.06px] text-slate-600">{t("medicationsLog.adherence.overall")}</p>
              </div>
            </div>

            <div className="w-[103px] space-y-3.5">
              {[
                { label: t("medicationsLog.adherence.taken"), value: "50%", color: "bg-[#0AA76F]" },
                { label: t("medicationsLog.adherence.late"), value: "30%", color: "bg-[#F59E0B]" },
                { label: t("medicationsLog.adherence.missed"), value: "20%", color: "bg-[#FF5536]" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="flex items-center gap-2">
                    <span className={`h-4 w-4 rounded-full ${item.color}`} />
                    <span className="text-base font-medium leading-6 tracking-[0.08px] text-slate-600">
                      {item.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-5 tracking-[0.07px] text-slate-600">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-[#FCFDFD] p-3.5">
          <h3 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
            {t("medicationsLog.adherence.missedTitle")}
          </h3>
          <p className="mt-2 text-sm font-medium leading-5 tracking-[0.07px] text-slate-500">
            {t("medicationsLog.adherence.totalMissed")} <span className="text-red-500 font-bold">8</span>
          </p>

          <div className="mt-5">
            <div className="grid h-[137px] grid-cols-[24px_minmax(0,1fr)] gap-3">
              <div className="flex flex-col justify-between text-right text-[13px] leading-5 tracking-[0.2px] text-slate-600">
                {[10, 8, 6, 4, 2, 0].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex flex-col justify-between">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <span key={index} className="border-t border-dashed border-slate-200" />
                  ))}
                </div>
                <div className="absolute inset-x-0 bottom-0 flex h-full items-end justify-between">
                  {missedDoses.map((dose) => (
                    <span
                      key={dose.day}
                      className="w-[22px] rounded-t bg-blue-500"
                      style={{ height: `${Math.max((dose.value / 10) * 137, 2)}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-[36px_minmax(0,1fr)] gap-3">
              <span />
              <div className="flex justify-between text-xs leading-4 tracking-[0.06px] text-slate-700 font-medium">
                {missedDoses.map((dose) => (
                  <span key={dose.day} className="w-[30px] text-center">
                    {dose.day}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-[#E3E6F0] bg-white p-3.5">
          <h3 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
            {t("medicationsLog.adherence.bpVsAdherence")}
          </h3>
          <div className="mt-2 flex items-center gap-3 text-xs leading-4 text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#7C6CFF]" />
              {t("medicationsLog.adherence.bp")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF7A70]" />
              {t("medicationsLog.adherence.adherencePercent")}
            </span>
          </div>

          <div className="mt-4">
            <div className="grid h-[166px] grid-cols-[32px_minmax(0,1fr)_40px] gap-2">
              <div className="flex flex-col justify-between text-right text-xs leading-4 tracking-[0.06px] text-slate-500">
                {[160, 140, 120, 100, 80].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 flex flex-col justify-between py-1.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span key={index} className="border-t border-dashed border-slate-200" />
                  ))}
                </div>
                <div className="absolute inset-0 flex justify-between px-px">
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
                    points={bpLine}
                    fill="none"
                    stroke="#7C6CFF"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                  <polyline
                    points={adherenceLine}
                    fill="none"
                    stroke="#FF7A70"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                  {bpPoints.map((point, index) => (
                    <React.Fragment key={point.day}>
                      <circle cx={xFor(index)} cy={bpY(point.bp)} r="4" fill="white" stroke="#7C6CFF" strokeWidth="2" />
                      <circle
                        cx={xFor(index)}
                        cy={adherenceY(point.adherence)}
                        r="4"
                        fill="white"
                        stroke="#FF7A70"
                        strokeWidth="2"
                      />
                    </React.Fragment>
                  ))}
                </svg>
              </div>
              <div className="flex flex-col justify-between text-xs leading-4 tracking-[0.06px] text-slate-500">
                {["100%", "75%", "50%", "25%", "0%"].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
            <div className="mt-2 grid grid-cols-[32px_minmax(0,1fr)_40px] gap-2">
              <span />
              <div className="flex justify-between text-xs leading-4 tracking-[0.06px] text-slate-700 font-medium">
                {bpPoints.map((point) => (
                  <span key={point.day} className="w-[30px] text-center">
                    {point.day}
                  </span>
                ))}
              </div>
              <span />
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function AlertsAndMood({
  reminders,
  onOpenReminderModal,
}: {
  reminders: MedicationReminder[];
  onOpenReminderModal: (medName?: string) => void;
}) {
  const { language, t } = useLanguage();
  const [selectedMood, setSelectedMood] = useState(1);
  const [notes, setNotes] = useState("");

  const moods = [
    { label: t("medicationsLog.mood.veryGood") },
    { label: t("medicationsLog.mood.good") },
    { label: t("medicationsLog.mood.okay") },
    { label: t("medicationsLog.mood.poor") },
    { label: t("medicationsLog.mood.veryPoor") },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="rounded-[14px] border border-[#E3E6F0] bg-white p-3.5">
        <div className="flex items-center justify-between">
          <SectionTitle number="4" title={t("medicationsLog.section4")} />
        </div>

        {/* Scheduled Reminders Ribbon */}
        {reminders && reminders.filter((r) => r.enabled).length > 0 && (
          <div className="mt-3 p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-blue-600" />
              <span>{language === "ES" ? "Recordatorios Programados Activos" : "Active Scheduled Dose Reminders"}</span>
            </p>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {reminders
                .filter((r) => r.enabled)
                .map((rem) => (
                  <button
                    key={rem.id}
                    type="button"
                    onClick={() => onOpenReminderModal(rem.medicationName)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-xs font-semibold text-slate-800 hover:border-blue-400 hover:shadow-2xs transition-all cursor-pointer"
                    title={language === "ES" ? "Haga clic para editar hora" : "Click to edit time"}
                  >
                    <span className="font-bold text-blue-700">{rem.medicationName}</span>
                    <span className="text-slate-500">• {rem.time}</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        <div className="mt-3 max-h-[290px] space-y-1 overflow-y-auto pr-1">
          {alertsData.map((alert, idx) => (
            <article key={idx} className="rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-medium leading-5 text-slate-950">
                  {language === "ES" ? alert.titleEs : alert.titleEn}
                </h3>
                <p className="shrink-0 text-xs leading-4 text-slate-500">
                  {language === "ES" ? alert.timeEs : alert.timeEn}
                </p>
              </div>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                {language === "ES" ? alert.bodyEs : alert.bodyEn}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-[14px] border border-[#E3E6F0] bg-white p-3.5">
        <SectionTitle number="5" title={t("medicationsLog.section5")} />
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3.5">
          <p className="text-base font-medium leading-6 text-slate-950">
            {t("medicationsLog.mood.howDoYouFeel")}
          </p>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {moods.map((m, index) => (
              <button
                key={m.label}
                type="button"
                onClick={() => setSelectedMood(index)}
                className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border px-2 text-center text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  selectedMood === index
                    ? "border-blue-300 bg-blue-50 text-blue-700 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Smile className="h-7 w-7 sm:h-8 sm:w-8" />
                <span className="leading-tight">{m.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="text-base font-medium leading-6 text-slate-950">
              {t("medicationsLog.mood.notes")}
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 h-24 w-full resize-none rounded border border-[#CBD5ED] bg-white p-3 text-sm text-slate-700 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder={t("medicationsLog.mood.notesPlaceholder")}
            />
          </div>
          <button
            type="button"
            className="mt-3 flex h-12 w-full items-center justify-center rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700 cursor-pointer"
          >
            {t("medicationsLog.mood.saveLog")}
          </button>
        </div>
      </div>
    </section>
  );
}

function ExportReporting() {
  const { t } = useLanguage();

  const reports = [
    {
      title: t("medicationsLog.export.pdfTitle"),
      desc: t("medicationsLog.export.pdfDesc"),
      action: t("medicationsLog.export.downloadPdf"),
      isShare: false,
    },
    {
      title: t("medicationsLog.export.excelTitle"),
      desc: t("medicationsLog.export.excelDesc"),
      action: t("medicationsLog.export.downloadExcel"),
      isShare: false,
    },
    {
      title: t("medicationsLog.export.shareTitle"),
      desc: t("medicationsLog.export.shareDesc"),
      action: t("medicationsLog.export.shareReport"),
      isShare: true,
    },
  ];

  return (
    <section className="rounded-[14px] border border-[#E3E6F0] bg-white p-3.5">
      <SectionTitle number="6" title={t("medicationsLog.section6")} />

      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {reports.map((report) => (
          <article
            key={report.title}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  {report.isShare ? <UserPlus className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                </span>
                <h3 className="text-lg font-medium leading-7 tracking-[0.09px] text-slate-950">
                  {report.title}
                </h3>
              </div>
              <div className="mt-4 border-t border-slate-200 pt-2">
                <p className="text-sm leading-5 tracking-[0.07px] text-slate-500">{report.desc}</p>
              </div>
            </div>
            <button
              type="button"
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded border border-slate-200 bg-[#F1F5FA] px-4 text-base font-bold text-slate-950 transition-colors hover:bg-white cursor-pointer"
            >
              {report.isShare ? <Share2 className="h-5 w-5" /> : <Download className="h-5 w-5" />}
              {report.action}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatTo12Hour(time24: string): string {
  if (!time24) return "08:00 AM";
  const parts = time24.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  if (isNaN(h)) return "08:00 AM";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  const hFormatted = h < 10 ? `0${h}` : `${h}`;
  return `${hFormatted}:${m} ${ampm}`;
}

function formatTo24Hour(time12: string): string {
  if (!time12) return "08:00";
  const trimmed = time12.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return "08:00";
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = match[3]?.toUpperCase();

  if (ampm === "PM" && h < 12) {
    h += 12;
  } else if (ampm === "AM" && h === 12) {
    h = 0;
  }
  const hFormatted = h < 10 ? `0${h}` : `${h}`;
  return `${hFormatted}:${m}`;
}

function SimpleTimeReminderModal({
  isOpen,
  onClose,
  medicationName,
  currentTime,
  onSaveTime,
  onDeleteReminder,
}: {
  isOpen: boolean;
  onClose: () => void;
  medicationName: string;
  currentTime?: string;
  onSaveTime: (medicationName: string, newTime: string) => void;
  onDeleteReminder?: (medicationName: string) => void;
}) {
  const { language } = useLanguage();
  const [timeValue, setTimeValue] = useState("08:00");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentTime) {
      setTimeValue(formatTo24Hour(currentTime));
    } else {
      setTimeValue("08:00");
    }
    setSavedSuccess(false);
  }, [currentTime, isOpen, medicationName]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = formatTo12Hour(timeValue);
    onSaveTime(medicationName, formatted);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 450);
  };

  const handleDelete = () => {
    if (onDeleteReminder) {
      onDeleteReminder(medicationName);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[340px] rounded-2xl bg-white p-5 text-left shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === "ES" ? "Alerta de Recordatorio" : "Reminder Alert"}
              </h3>
              <p className="text-xs font-semibold text-blue-600 truncate max-w-[190px]">
                {medicationName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Simple Form: only timepicker and save button */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col items-center justify-center bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <input
              type="time"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              aria-label={language === "ES" ? "Seleccionar Hora" : "Select Time"}
              className="w-full text-center text-3xl font-extrabold tracking-wider text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-2xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              required
            />
          </div>

          {savedSuccess && (
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl py-2 animate-in fade-in duration-100">
              <Check className="h-4 w-4" />
              <span>{language === "ES" ? "¡Guardado exitosamente!" : "Saved successfully!"}</span>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-sm transition-colors shadow-sm cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>{language === "ES" ? "Guardar" : "Save"}</span>
            </button>

            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
              >
                {language === "ES" ? "Cancelar" : "Cancel"}
              </button>

              {currentTime && onDeleteReminder && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  {language === "ES" ? "Eliminar alerta" : "Remove alert"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const LOCAL_STORAGE_REMINDERS_KEY = "nephroreach_medication_reminders_v1";

export default function MedicationLogPage() {
  const { t } = useLanguage();

  const [reminders, setReminders] = useState<MedicationReminder[]>(INITIAL_REMINDERS);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedMedForReminder, setSelectedMedForReminder] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_REMINDERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReminders(parsed);
        }
      }
    } catch {
      // fallback
    }
  }, []);

  const saveReminders = (updated: MedicationReminder[]) => {
    setReminders(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_REMINDERS_KEY, JSON.stringify(updated));
    } catch {
      // fallback
    }
  };

  const handleOpenReminderModal = (medName?: string) => {
    setSelectedMedForReminder(medName || medicationsData[0]?.name || "Potassium");
    setIsReminderModalOpen(true);
  };

  const handleSaveReminderTime = (medicationName: string, time: string) => {
    const existingIndex = reminders.findIndex(
      (r) => r.medicationName.toLowerCase() === medicationName.toLowerCase()
    );
    let updated: MedicationReminder[];
    if (existingIndex >= 0) {
      updated = [...reminders];
      updated[existingIndex] = {
        ...updated[existingIndex],
        time,
        enabled: true,
      };
    } else {
      const newReminder: MedicationReminder = {
        id: Date.now().toString(),
        medicationName,
        time,
        frequency: "Daily",
        channels: ["in_app"],
        enabled: true,
      };
      updated = [newReminder, ...reminders];
    }
    saveReminders(updated);
  };

  const handleDeleteReminder = (medicationName: string) => {
    const updated = reminders.filter(
      (r) => r.medicationName.toLowerCase() !== medicationName.toLowerCase()
    );
    saveReminders(updated);
  };

  const activeExistingReminder = selectedMedForReminder
    ? reminders.find(
        (r) => r.medicationName.toLowerCase() === selectedMedForReminder.toLowerCase()
      )
    : null;

  return (
    <div className="space-y-6">
      <PersonalLogDisclaimer />

      <header>
        <h1 className="text-[32px] font-medium leading-none text-slate-950">
          {t("medicationsLog.title")}
        </h1>
        <p className="mt-1 text-lg font-medium leading-7 tracking-[0.09px] text-slate-700">
          {t("medicationsLog.subtitle")}
        </p>
      </header>

      <MedicationMasterList
        reminders={reminders}
        onOpenReminderModal={handleOpenReminderModal}
      />
      <DoseSchedule
        reminders={reminders}
        onOpenReminderModal={handleOpenReminderModal}
      />
      <AdherenceChart />
      <AlertsAndMood
        reminders={reminders}
        onOpenReminderModal={handleOpenReminderModal}
      />
      <ExportReporting />
      <SimpleTimeReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        medicationName={selectedMedForReminder || ""}
        currentTime={activeExistingReminder?.time}
        onSaveTime={handleSaveReminderTime}
        onDeleteReminder={handleDeleteReminder}
      />
    </div>
  );
}
