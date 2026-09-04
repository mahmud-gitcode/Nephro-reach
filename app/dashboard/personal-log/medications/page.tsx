"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Plus,
  Share2,
  Smile,
  UserPlus,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

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
    timeEn: "Tomorrow at 3:00 PM",
    timeEs: "Mañana a las 3:00 PM",
    bodyEn: "Don't forget your appointment with Dr. Smith regarding your hypertension treatment.",
    bodyEs: "No olvide su cita con el Dr. Smith con respecto a su tratamiento de hipertensión.",
  },
  {
    titleEn: "Refill Alert",
    titleEs: "Alerta de Resurtido",
    timeEn: "2 days left",
    timeEs: "Faltan 2 días",
    bodyEn: "Your prescription for Atorvastatin 20 mg will run out soon.",
    bodyEs: "Su receta de Atorvastatina 20 mg se terminará pronto.",
  },
];

const statusClass: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-600",
  PRN: "bg-amber-50 text-amber-600",
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

function MedicationMasterList() {
  const { language, t } = useLanguage();

  return (
    <section className="rounded-[14px] border border-[#E3E6F0] bg-white p-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle number="1" title={t("medicationsLog.section1")} />
        <Link
          href="/dashboard/personal-log/medications/add"
          className="flex h-12 w-fit items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold tracking-[0.08px] text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          {t("medicationsLog.addMedication")}
        </Link>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full text-left text-sm">
            <thead className="bg-[#F1F5FA] text-sm font-medium text-slate-950">
              <tr>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.name")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.dose")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.route")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.frequency")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.purpose")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.startDate")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.endDate")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.pharmacy")}</th>
                <th className="border-b border-slate-200 px-3 py-3">{t("medicationsLog.tableHeaders.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-slate-200">
              {medicationsData.map((medication) => (
                <tr key={`${medication.name}-${medication.startDate}`}>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{medication.name}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{medication.dose}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-950">{medication.route}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">
                    {language === "ES" ? medication.frequencyEs : medication.frequencyEn}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">
                    {language === "ES" ? medication.purposeEs : medication.purposeEn}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{medication.startDate}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{medication.endDate}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{medication.pharmacy}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={medication.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function DoseSchedule() {
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
              {doseScheduleData.map((dose, idx) => (
                <tr key={`${dose.time}-${idx}`}>
                  <td className="px-3 py-3 font-medium text-slate-800">{dose.time}</td>
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
              ))}
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

function AlertsAndMood() {
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
        <SectionTitle number="4" title={t("medicationsLog.section4")} />
        <div className="mt-3 max-h-[342px] space-y-1 overflow-y-auto pr-1">
          {alertsData.map((alert, idx) => (
            <article key={idx} className="rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors">
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
            {t("medicationsLog.mood.save")}
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
      title: t("medicationsLog.reports.weeklySummary"),
      body: t("medicationsLog.reports.weeklySummaryDesc"),
      action: t("medicationsLog.reports.generatePdf"),
      icon: FileText,
      isShare: false,
    },
    {
      title: t("medicationsLog.reports.fullList"),
      body: t("medicationsLog.reports.fullListDesc"),
      action: t("medicationsLog.reports.generatePdf"),
      icon: FileText,
      isShare: false,
    },
    {
      title: t("medicationsLog.reports.shareProvider"),
      body: t("medicationsLog.reports.shareProviderDesc"),
      action: t("medicationsLog.reports.shareNow"),
      icon: UserPlus,
      isShare: true,
    },
  ];

  return (
    <section className="rounded-[14px] border border-[#E3E6F0] bg-white p-3.5">
      <SectionTitle number="6" title={t("medicationsLog.section6")} />
      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {reports.map((report) => (
          <article key={report.title} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                <report.icon className="h-5 w-5 text-slate-800" />
              </span>
              <div>
                <h3 className="text-xl font-medium leading-8 text-slate-950">{report.title}</h3>
                <p className="mt-2 text-base leading-6 text-slate-600">{report.body}</p>
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

function Disclaimer() {
  const { t } = useLanguage();

  return (
    <aside className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-3.5">
      <div className="flex gap-2">
        <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
        <div>
          <h2 className="text-lg font-medium leading-7 text-slate-950">
            {t("medicationsLog.disclaimerTitle")}
          </h2>
          <p className="mt-2 max-w-[840px] text-sm leading-5 text-slate-700">
            {t("medicationsLog.disclaimerText")}
          </p>
        </div>
      </div>
    </aside>
  );
}

export default function MedicationLogPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[32px] font-medium leading-none text-slate-950">
          {t("medicationsLog.title")}
        </h1>
        <p className="mt-1 text-lg font-medium leading-7 tracking-[0.09px] text-slate-700">
          {t("medicationsLog.subtitle")}
        </p>
      </header>

      <MedicationMasterList />
      <DoseSchedule />
      <AdherenceChart />
      <AlertsAndMood />
      <ExportReporting />
      <Disclaimer />
    </div>
  );
}
