import React from "react";
import {
  Calendar,
  CalendarX,
  ClipboardCheck,
  Clock,
  Info,
  Timer,
} from "lucide-react";

const summaryCards = [
  {
    label: "Treatment attended",
    value: "90%",
    icon: ClipboardCheck,
    iconClass: "text-emerald-600",
    iconBg: "bg-[#D7FFE4]",
  },
  {
    label: "Arrived late",
    value: "2",
    icon: Clock,
    iconClass: "text-amber-600",
    iconBg: "bg-[#FEF3C7]",
  },
  {
    label: "Ended early",
    value: "4",
    icon: Timer,
    iconClass: "text-red-500",
    iconBg: "bg-[#FEE2E2]",
  },
  {
    label: "Missed treatments",
    value: "2",
    icon: CalendarX,
    iconClass: "text-red-500",
    iconBg: "bg-[#FEE2E2]",
  },
];

const attendanceMonths = [
  { month: "Jan", attended: 40, missed: 16 },
  { month: "Feb", attended: 50, missed: 38 },
  { month: "Mar", attended: 36, missed: 58 },
  { month: "Apr", attended: 53, missed: 39 },
  { month: "May", attended: 79, missed: 41 },
  { month: "Jun", attended: 90, missed: 66 },
  { month: "Jul", attended: 64, missed: 49 },
  { month: "Aug", attended: 98, missed: 74 },
  { month: "Sep", attended: 100, missed: 74 },
];

const symptomSlices = [
  { label: "Cramping", count: 29, percent: 50, color: "#3B82F6" },
  { label: "Low BP", count: 16, percent: 28, color: "#F59E0B" },
  { label: "Fatigue", count: 13, percent: 22, color: "#EF4444" },
];

const recoveryPoints = [
  { month: "Mar", good: 40, okay: 10, bad: 20 },
  { month: "Apr", good: 27, okay: 67, bad: 55 },
  { month: "May", good: 12, okay: 30, bad: 33 },
  { month: "Jun", good: 70, okay: 60, bad: 20 },
];

const treatmentHours = [
  { month: "Jan", hours: 40 },
  { month: "Feb", hours: 50 },
  { month: "Mar", hours: 36 },
  { month: "Apr", hours: 53 },
  { month: "May", hours: 79 },
  { month: "Jun", hours: 90 },
  { month: "Jul", hours: 64 },
  { month: "Aug", hours: 98 },
  { month: "Sep", hours: 100 },
];

function SummaryCards() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => (
        <article
          key={card.label}
          className="flex items-start gap-5 rounded-[14px] border border-slate-200 bg-slate-50 p-4"
        >
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] ${card.iconBg}`}
          >
            <card.icon className={`h-6 w-6 ${card.iconClass}`} />
          </span>
          <div>
            <p className="text-base font-medium leading-6 tracking-[0.08px] text-[#1A130D]">
              {card.label}
            </p>
            <p className="mt-2 text-[32px] font-medium leading-none text-[#1A130D]">
              {card.value}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}

function AttendanceRateChart() {
  const maxHeight = 180;

  return (
    <section className="flex h-full flex-col rounded-[14px] border border-slate-200 bg-white p-4 shadow-[0_1.57px_0.79px_rgba(0,0,0,0.05)]">
      <div className="flex flex-wrap items-center gap-2.5">
        <Calendar className="h-6 w-6 text-blue-600" />
        <h2 className="flex-1 text-lg font-medium leading-7 text-[#1A130D]">
          Attendance Rate
        </h2>
        <div className="flex items-center gap-4 text-sm font-medium text-[#454F5B]">
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full bg-[#00A76F]" />
            Attended
          </span>
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full bg-[#EF4444]" />
            Missed
          </span>
        </div>
      </div>

      <div className="mt-4 flex min-h-[230px] flex-1 gap-3">
        <div className="flex flex-col justify-between pb-6 text-right text-sm text-[#454F5B]">
          {["100%", "80%", "60%", "40%", "20%", "0"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-x-0 bottom-6 top-0 flex flex-col justify-between">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="border-t border-dashed border-slate-200" />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-6 top-2 flex items-end justify-between px-1">
            {attendanceMonths.map((item) => (
              <div key={item.month} className="flex items-end gap-0.5">
                <div
                  className="w-4 rounded-t bg-[#00A76F]"
                  style={{ height: `${(item.attended / 100) * maxHeight}px` }}
                />
                <div
                  className="w-4 rounded-t bg-[#EF4444]"
                  style={{ height: `${(item.missed / 100) * maxHeight}px` }}
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex justify-between px-1 text-center text-sm text-[#1A130D]">
            {attendanceMonths.map((item) => (
              <span key={item.month} className="w-8">
                {item.month}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SymptomsDonut() {
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <section className="flex h-full flex-col items-center rounded-xl border border-[#E3E6F0] bg-white p-4">
      <h2 className="w-full text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
        Symptoms During Treatment
      </h2>
      <div className="relative my-3 size-[226px]">
        <svg viewBox="0 0 226 226" className="size-full -rotate-90">
          <circle
            cx="113"
            cy="113"
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="28"
          />
          {symptomSlices.map((slice) => {
            const dash = (slice.percent / 100) * circumference;
            const circle = (
              <circle
                key={slice.label}
                cx="113"
                cy="113"
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth="28"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return circle;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[22px] font-medium leading-9 tracking-[0.11px] text-slate-950">
            86%
          </p>
          <p className="text-[15px] leading-5 text-[#454F5B]">Overall</p>
        </div>
      </div>
      <div className="mt-auto grid w-full grid-cols-3 gap-3.5">
        {symptomSlices.map((slice) => (
          <div key={slice.label} className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span
                className="h-4 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-base font-medium leading-6 tracking-[0.08px] text-[#454F5B]">
                {slice.label}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium leading-5 tracking-[0.07px] text-[#454F5B]">
              {slice.count} ({slice.percent}%)
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecoveryPatternChart() {
  const width = 508;
  const height = 245;
  const left = 36;
  const right = 16;
  const top = 8;
  const bottom = 8;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const xFor = (index: number) =>
    left + (index / (recoveryPoints.length - 1)) * plotWidth;
  const yFor = (value: number) => top + ((100 - value) / 100) * plotHeight;
  const pathFor = (key: "good" | "okay" | "bad") =>
    recoveryPoints
      .map((point, index) => `${xFor(index)},${yFor(point[key])}`)
      .join(" ");

  return (
    <section className="flex h-full flex-col rounded-xl border border-[#DFE3E8] bg-[#FCFDFD] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
          Recovery Pattern Tracking
        </h2>
        <div className="flex items-center gap-3 text-base font-medium text-[#454F5B]">
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full bg-[#3B82F6]" />
            Good
          </span>
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full bg-[#F59E0B]" />
            Okay
          </span>
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full bg-[#EF4444]" />
            Bad
          </span>
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1">
        <svg viewBox={`0 0 ${width} ${height + 22}`} className="h-full w-full">
          {[0, 20, 40, 60, 80, 100].reverse().map((tick, index) => {
            const y = top + (index / 5) * plotHeight;
            return (
              <g key={tick}>
                <text
                  x={28}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-black/70 text-[12px]"
                >
                  {tick}
                </text>
                <line
                  x1={left}
                  x2={width - right}
                  y1={y}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                />
              </g>
            );
          })}
          <polyline
            fill="none"
            stroke="#EF4444"
            strokeWidth="2.5"
            points={pathFor("bad")}
          />
          <polyline
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.5"
            points={pathFor("okay")}
          />
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2.5"
            points={pathFor("good")}
          />
          {recoveryPoints.map((point, index) => (
            <g key={point.month}>
              <circle cx={xFor(index)} cy={yFor(point.bad)} r="4" fill="#EF4444" />
              <circle cx={xFor(index)} cy={yFor(point.okay)} r="4" fill="#F59E0B" />
              <circle cx={xFor(index)} cy={yFor(point.good)} r="4" fill="#3B82F6" />
              <text
                x={xFor(index)}
                y={height + 18}
                textAnchor="middle"
                className="fill-black/70 text-[12px]"
              >
                {point.month}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}

function TreatmentTimeChart() {
  const maxHours = 100;

  return (
    <section className="flex h-full flex-col rounded-xl border border-[#DFE3E8] bg-[#FCFDFD] p-4">
      <h2 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
        Dialysis Treatment Time
      </h2>
      <p className="mt-2 text-right text-xs text-slate-600">Hours</p>
      <div className="mt-1 flex min-h-[220px] flex-1 gap-3">
        <div className="flex flex-col justify-between pb-6 text-right text-sm font-medium text-slate-600">
          {["100", "80", "60", "40", "20", "0"].map((label) => (
            <span key={label} className="w-6">
              {label}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-x-0 bottom-6 top-0 flex flex-col justify-between">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="border-t border-dashed border-slate-200" />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-6 top-1 flex items-end justify-between px-2">
            {treatmentHours.map((item) => (
              <div
                key={item.month}
                className="w-6 rounded-t bg-[#00A76F]"
                style={{ height: `${(item.hours / maxHours) * 187}px` }}
              />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 text-center text-sm text-[#1A130D]">
            {treatmentHours.map((item) => (
              <span key={item.month} className="w-8">
                {item.month}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function DialysisTreatmentPage() {
  return (
    <div className="space-y-[21px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <aside className="flex items-start gap-2 rounded-xl border border-[#FEF9C3] bg-[#FFEA98] p-[13px]">
          <Info className="mt-0.5 h-6 w-6 shrink-0 text-[#9C6200]" />
          <p className="text-base font-medium leading-6 tracking-[0.08px] text-[#9C6200]">
            Completing prescribed treatments is important for dialysis adequacy
          </p>
        </aside>
        <button
          type="button"
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold tracking-[0.08px] text-slate-950 shadow-[0_1px_1.5px_rgba(0,0,0,0.1)] transition-colors hover:bg-white"
        >
          <Calendar className="h-6 w-6" />
          Jun
        </button>
      </div>

      <SummaryCards />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(280px,352px)]">
        <AttendanceRateChart />
        <SymptomsDonut />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RecoveryPatternChart />
        <TreatmentTimeChart />
      </section>
    </div>
  );
}
