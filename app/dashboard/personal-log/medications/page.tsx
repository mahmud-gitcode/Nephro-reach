import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Pill,
  Plus,
  Share2,
  Smile,
  UserPlus,
} from "lucide-react";

const medications = [
  {
    name: "Potassium",
    dose: "10 mg",
    route: "PO",
    frequency: "Once daily",
    purpose: "Blood pressure",
    startDate: "15/08/2017",
    endDate: "---",
    pharmacy: "HealthPlus",
    status: "Active",
  },
  {
    name: "Norvasc",
    dose: "10 mg",
    route: "PO",
    frequency: "Once daily",
    purpose: "Blood pressure",
    startDate: "15/08/2017",
    endDate: "---",
    pharmacy: "HealthPlus",
    status: "Active",
  },
  {
    name: "Sevelamer",
    dose: "800 mg",
    route: "PO",
    frequency: "With meals",
    purpose: "Phosphorus binder",
    startDate: "03/02/2024",
    endDate: "---",
    pharmacy: "Kidney Care Rx",
    status: "Active",
  },
  {
    name: "Calcitriol",
    dose: "0.25 mcg",
    route: "PO",
    frequency: "Mon/Wed/Fri",
    purpose: "Bone health",
    startDate: "09/11/2023",
    endDate: "---",
    pharmacy: "HealthPlus",
    status: "Active",
  },
  {
    name: "PTH",
    dose: "10 mg",
    route: "PO",
    frequency: "PRN",
    purpose: "Provider Goal",
    startDate: "07/05/2016",
    endDate: "---",
    pharmacy: "HealthPlus",
    status: "PRN",
  },
  {
    name: "A1C",
    dose: "10 mg",
    route: "PO",
    frequency: "Once daily (HS)",
    purpose: "Cholesterol",
    startDate: "16/08/2013",
    endDate: "16/08/2013",
    pharmacy: "HealthPlus",
    status: "Stopped",
  },
];

const doseSchedule = [
  {
    time: "07:40 am",
    medication: "Norvasc",
    generic: "Amlodipine",
    instructions: "Take with food",
    status: "Taken",
    stamp: "8:02 AM",
    stampDate: "Today",
    sideEffects: "Fatigue",
  },
  {
    time: "01:09 am",
    medication: "Norvasc",
    generic: "Amlodipine",
    instructions: "Take with food",
    status: "Taken",
    stamp: "8:02 AM",
    stampDate: "Today",
    sideEffects: "None",
  },
  {
    time: "02:30 pm",
    medication: "Norvasc",
    generic: "Amlodipine",
    instructions: "Take with food",
    status: "Late",
    stamp: "8:02 AM",
    stampDate: "Today",
    sideEffects: "None",
  },
  {
    time: "12:01 pm",
    medication: "Norvasc",
    generic: "Amlodipine",
    instructions: "Take with food",
    status: "Missed",
    stamp: "---",
    stampDate: "Today",
    sideEffects: "None",
  },
];

const alerts = [
  {
    title: "Medication Taken Confirmation",
    time: "Just now",
    body: "You have taken your 9:00 AM dose of Metformin 500 mg.",
  },
  { title: "Missed Dose: Sevelamer", time: "10 min ago", body: "You missed your 12:00 PM dose today." },
  { title: "Upcoming: Calcitriol", time: "5 min ago", body: "Take with your evening meal." },
  { title: "Refill Alert", time: "In 15 min", body: "Atorvastatin supply is running low." },
  {
    title: "Doctor's Appointment Reminder",
    time: "Tomorrow at 3:00 PM",
    body: "Don't forget your appointment with Dr. Smith regarding your hypertension treatment.",
  },
  { title: "Refill Alert", time: "2 days left", body: "Your prescription for Atorvastatin 20 mg will run out soon." },
];

const reports = [
  {
    title: "Weekly Summary (PDF)",
    body: "Detailed report on adherence, symptoms, and missed doses for your doctor.",
    action: "Generate PDF",
    icon: FileText,
  },
  {
    title: "Full Medication List",
    body: "A clean, high-density printout of all current medications and providers.",
    action: "Generate PDF",
    icon: FileText,
  },
  {
    title: "Share with Provider",
    body: "Securely share report with your care team.",
    action: "Share Now",
    icon: UserPlus,
  },
];

const statusClass = {
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

function StatusBadge({ status }: { status: keyof typeof statusClass }) {
  return (
    <span className={`inline-flex h-6 items-center rounded px-2 text-sm font-semibold ${statusClass[status]}`}>
      {status}
    </span>
  );
}

function MedicationMasterList() {
  return (
    <section className="rounded-[14px] border border-[#E3E6F0] bg-white p-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle number="1" title="Medication Master List" />
        <Link
          href="/dashboard/personal-log/medications/add"
          className="flex h-12 w-fit items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold tracking-[0.08px] text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Add Medication
        </Link>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full text-left text-sm">
            <thead className="bg-[#F1F5FA] text-sm font-medium text-slate-950">
              <tr>
                {[
                  "Medication Name (Brand/Generic)",
                  "Dose/Strength",
                  "Route",
                  "Frequency",
                  "Purpose",
                  "Start Date",
                  "End Date",
                  "Pharmacy",
                  "Status",
                ].map((header) => (
                  <th key={header} className="border-b border-slate-200 px-3 py-3">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-slate-200">
              {medications.map((medication) => (
                <tr key={`${medication.name}-${medication.startDate}`}>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{medication.name}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{medication.dose}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-950">{medication.route}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{medication.frequency}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{medication.purpose}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{medication.startDate}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{medication.endDate}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">{medication.pharmacy}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={medication.status as keyof typeof statusClass} />
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
  return (
    <section className="rounded-[14px] border border-[#E3E6F0] bg-white p-3.5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SectionTitle number="2" title="Medication Master List" />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold text-slate-950"
          >
            <ChevronLeft className="h-5 w-5" />
            May 20
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="h-12 rounded border border-slate-200 bg-[#F1F5FA] px-4 text-base font-bold text-slate-950"
          >
            Today
          </button>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-[#F1F5FA] text-sm font-medium text-slate-950">
              <tr>
                {["Time", "Medication", "Instructions", "Status", "Time Stamp", "Side Effects"].map((header) => (
                  <th key={header} className="border-b border-slate-200 px-3 py-3">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-slate-200">
              {doseSchedule.map((dose) => (
                <tr key={`${dose.time}-${dose.status}`}>
                  <td className="px-3 py-3 font-medium text-slate-800">{dose.time}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-950">{dose.medication}</p>
                    <p className="text-xs text-slate-600">{dose.generic}</p>
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-950">{dose.instructions}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={dose.status as keyof typeof statusClass} />
                  </td>
                  <td className="px-3 py-3">
                    <p className={`font-medium ${dose.status === "Late" ? "text-amber-600" : "text-slate-800"}`}>
                      {dose.stamp}
                    </p>
                    <p className="text-xs text-slate-600">{dose.stampDate}</p>
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-800">{dose.sideEffects}</td>
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
  const missedDoses = [
    { day: "Sun", value: 2 },
    { day: "Mon", value: 1.4 },
    { day: "Tue", value: 0.1 },
    { day: "Wed", value: 2 },
    { day: "Thu", value: 0.1 },
    { day: "Fri", value: 2 },
    { day: "Set", value: 1.4 },
  ];
  const bpPoints = [
    { day: "Sun", bp: 148, adherence: 78 },
    { day: "Mon", bp: 110, adherence: 22 },
    { day: "Tue", bp: 94, adherence: 25 },
    { day: "Wed", bp: 103, adherence: 78 },
    { day: "Thu", bp: 148, adherence: 76 },
    { day: "Fri", bp: 153, adherence: 96 },
    { day: "Set", bp: 130, adherence: 95 },
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
      <SectionTitle number="3" title="Adherence & Insights Dashboard" />

      <div className="mt-3 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-xl border border-[#E3E6F0] bg-white p-3.5">
          <div>
            <h3 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
              Overall Adherence (This Week)
            </h3>
            <p className="mt-2 text-xs font-medium leading-4 tracking-[0.06px] text-slate-500">
              Total Doses: 12
            </p>
          </div>

          <div className="mt-5 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <div className="relative h-[182px] w-[182px] shrink-0 rounded-full bg-[conic-gradient(#0AA76F_0deg_180deg,#F59E0B_180deg_288deg,#FF5536_288deg_360deg)]">
              <div className="absolute inset-[26px] rounded-full bg-white" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-lg font-medium leading-7 tracking-[0.09px] text-slate-950">86%</p>
                <p className="text-xs leading-4 tracking-[0.06px] text-slate-600">Overall</p>
              </div>
            </div>

            <div className="w-[103px] space-y-3.5">
              {[
                { label: "Taken", value: "50%", color: "bg-[#0AA76F]" },
                { label: "Late", value: "30%", color: "bg-[#F59E0B]" },
                { label: "Missed", value: "20%", color: "bg-[#FF5536]" },
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
            Missed Doses (This Week)
          </h3>
          <p className="mt-2 text-sm font-medium leading-5 tracking-[0.07px] text-slate-500">
            Total Missed Doses: <span className="text-red-500">8</span>
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
              <div className="flex justify-between text-xs leading-4 tracking-[0.06px] text-slate-700">
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
            BP vs. Medication Adherence
          </h3>
          <div className="mt-2 flex items-center gap-3 text-xs leading-4 text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#7C6CFF]" />
              BP
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF7A70]" />
              Adherence(%)
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
              <div className="flex justify-between text-xs leading-4 tracking-[0.06px] text-slate-700">
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
  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="rounded-[14px] border border-[#E3E6F0] bg-white p-3.5">
        <SectionTitle number="4" title="Alerts & Reminders" />
        <div className="mt-3 max-h-[342px] space-y-1 overflow-y-auto pr-1">
          {alerts.map((alert) => (
            <article key={`${alert.title}-${alert.time}`} className="rounded-lg px-3 py-2 hover:bg-slate-50">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-medium leading-5 text-slate-950">{alert.title}</h3>
                <p className="shrink-0 text-xs leading-4 text-slate-500">{alert.time}</p>
              </div>
              <p className="mt-1 text-sm leading-5 text-slate-600">{alert.body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-[14px] border border-[#E3E6F0] bg-white p-3.5">
        <SectionTitle number="5" title="How i Feel" />
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3.5">
          <p className="text-base font-medium leading-6 text-slate-950">How do you feel today?</p>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {["Very Good", "Good", "Okay", "Poor", "Very Poor"].map((mood, index) => (
              <button
                key={mood}
                type="button"
                className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border px-2 text-center text-sm font-medium ${
                  index === 1 ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"
                }`}
              >
                <Smile className="h-8 w-8" />
                {mood}
              </button>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="text-base font-medium leading-6 text-slate-950">Notes</p>
            <textarea
              className="mt-2 h-24 w-full resize-none rounded border border-[#CBD5ED] bg-white p-3 text-sm text-slate-700 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Add how you feel, side effects, or symptoms..."
            />
          </div>
          <button
            type="button"
            className="mt-3 flex h-12 w-full items-center justify-center rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </section>
  );
}

function ExportReporting() {
  return (
    <section className="rounded-[14px] border border-[#E3E6F0] bg-white p-3.5">
      <SectionTitle number="6" title="Export / Reporting" />
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
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded border border-slate-200 bg-[#F1F5FA] px-4 text-base font-bold text-slate-950 transition-colors hover:bg-white"
            >
              {report.action === "Share Now" ? <Share2 className="h-5 w-5" /> : <Download className="h-5 w-5" />}
              {report.action}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function Disclaimer() {
  return (
    <aside className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-3.5">
      <div className="flex gap-2">
        <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
        <div>
          <h2 className="text-lg font-medium leading-7 text-slate-950">Important Disclaimer</h2>
          <p className="mt-2 max-w-[840px] text-sm leading-5 text-slate-700">
            This is not medical advice. If this is a medical emergency, contact your care team or
            emergency services. Always confirm medication changes with your clinician or pharmacist.
          </p>
        </div>
      </div>
    </aside>
  );
}

export default function MedicationLogPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[32px] font-medium leading-none text-slate-950">Medication Log</h1>
        <p className="mt-1 text-lg font-medium leading-7 tracking-[0.09px] text-slate-700">
          Track prescriptions, dose history, reminders, and medication reports.
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
