import React from "react";
import Image from "next/image";
import {
  Activity,
  BarChart3,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  HeartPulse,
  MessageCircle,
  MessageSquareText,
  Microscope,
  Pill,
  Stethoscope,
  Truck,
  UserRoundCheck,
  Users,
  Weight,
} from "lucide-react";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const metricCards: Array<{
  title: string;
  value: string;
  growth?: string;
  icon: IconType;
  tone: string;
  iconTone: string;
}> = [
  {
    title: "Total Members",
    value: "1,247",
    growth: "+ 36%",
    icon: Users,
    tone: "bg-blue-100",
    iconTone: "text-blue-600",
  },
  {
    title: "Monthly Revenue",
    value: "$8,340",
    growth: "+ 36%",
    icon: BarChart3,
    tone: "bg-emerald-100",
    iconTone: "text-emerald-600",
  },
  {
    title: "Notification Response Rate",
    value: "78%",
    growth: "+ 36%",
    icon: MessageCircle,
    tone: "bg-lime-100",
    iconTone: "text-lime-700",
  },
  {
    title: "Active Subscriptions",
    value: "892",
    growth: "+ 36%",
    icon: CircleDollarSign,
    tone: "bg-purple-100",
    iconTone: "text-purple-600",
  },
  {
    title: "ER visits",
    value: "8,340",
    icon: Stethoscope,
    tone: "bg-amber-100",
    iconTone: "text-amber-600",
  },
];

const liveClassLogs: Array<{
  label: string;
  entries: string;
  members: string;
  rate: string;
  icon: IconType;
  color: string;
}> = [
  { label: "Blood Pressure Log", entries: "28,456", members: "6,231", rate: "85.3%", icon: HeartPulse, color: "text-red-500" },
  { label: "Weight & Fluid Log", entries: "31,782", members: "7,142", rate: "85.3%", icon: Weight, color: "text-blue-500" },
  { label: "Medication Log", entries: "27,934", members: "5,987", rate: "85.3%", icon: Pill, color: "text-blue-500" },
  { label: "Lab Tracking Log", entries: "33,210", members: "8,450", rate: "85.3%", icon: Microscope, color: "text-amber-500" },
  { label: "Dialysis Treatment", entries: "29,865", members: "6,789", rate: "85.3%", icon: UserRoundCheck, color: "text-emerald-600" },
  { label: "Nutrition & Meal Log", entries: "30,498", members: "7,305", rate: "85.3%", icon: Activity, color: "text-emerald-500" },
  { label: "How I Feel Today Log", entries: "32,120", members: "5,623", rate: "85.3%", icon: MessageSquareText, color: "text-blue-500" },
  { label: "Before the ER Log", entries: "32,120", members: "5,623", rate: "85.3%", icon: Truck, color: "text-red-500" },
];

const confidenceRows = [
  { label: "Understanding Dialysis", before: 8.9, after: 4.1, change: "+4.7" },
  { label: "Understanding Lab Results", before: 5.2, after: 3.8, change: "+1.4" },
  { label: "Fluid Management Knowledge", before: 7.4, after: 6.0, change: "+3.2" },
  { label: "Diet & Nutrition Knowledge", before: 2.1, after: 5.5, change: "-1.1", negative: true },
  { label: "Medication Understanding", before: 4.9, after: 8.1, change: "+4.7" },
  { label: "Managing Symptoms", before: 9.0, after: 7.3, change: "+2.5" },
  { label: "Kidney Disease Understanding", before: 3.3, after: 4.4, change: "+0.9" },
];

const educationLegend = [
  { label: "Videos Watched", value: "19,428 (34%)", color: "bg-blue-600" },
  { label: "Modules Completed", value: "16,478 (29%)", color: "bg-amber-500" },
  { label: "Live Classes Attended", value: "8,321 (15%)", color: "bg-cyan-500" },
  { label: "Members Downloaded", value: "4,421 (8%)", color: "bg-emerald-500" },
  { label: "Quantities Submitted", value: "4,258 (7%)", color: "bg-orange-600" },
];

const engagementLegend = [
  { label: "High Engagement", detail: "Completed 5+ modules", value: "29 (50%)", color: "bg-blue-600" },
  { label: "Medium Engagement", detail: "Completed 2-4 modules", value: "16 (28%)", color: "bg-amber-500" },
  { label: "Low Engagement", detail: "No login or 30 days", value: "13 (22%)", color: "bg-orange-600" },
];

const activityRows = [
  { status: "New Member", name: "Rakib Roy", time: "10 min ago" },
  { status: "Active Member", name: "Luna Smith", time: "2 hours ago" },
  { status: "Guest", name: "Miguel Alvarez", time: "Yesterday" },
  { status: "Guest", name: "Miguel Alvarez", time: "Yesterday" },
];

const weeklyBars = [
  { day: "Mon", value: 72 },
  { day: "Tue", value: 76 },
  { day: "Wed", value: 91 },
  { day: "Thu", value: 74 },
  { day: "Fri", value: 72 },
  { day: "Sta", value: 74 },
  { day: "Sun", value: 78 },
];

function MetricCard({ card }: { card: (typeof metricCards)[number] }) {
  return (
    <article className="min-h-[114px] rounded-[14px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="pt-3 text-xs font-medium tracking-[0.06px] text-slate-600">
          {card.title}
        </p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${card.tone}`}>
          <card.icon className={`h-5 w-5 ${card.iconTone}`} />
        </span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold leading-8 tracking-[0.12px] text-slate-900">
          {card.value}
        </p>
        {card.growth && (
          <p className="whitespace-nowrap text-xs font-medium text-emerald-600">
            {card.growth} up
          </p>
        )}
      </div>
    </article>
  );
}

function LiveClassTable() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-950">Live Class</h2>
        <button
          type="button"
          className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-950"
        >
          view all
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[610px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-700">
              <th className="px-3 py-4 font-medium">Log</th>
              <th className="px-3 py-4 font-medium">Total Entries</th>
              <th className="px-3 py-4 font-medium">Members Log</th>
              <th className="px-3 py-4 text-right font-medium">Completion Rate</th>
            </tr>
          </thead>
          <tbody>
            {liveClassLogs.map((log) => (
              <tr key={log.label} className="border-b border-dashed border-slate-300 last:border-0">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <log.icon className={`h-6 w-6 shrink-0 ${log.color}`} />
                    <span className="whitespace-nowrap font-medium text-slate-700">{log.label}</span>
                  </div>
                </td>
                <td className="px-3 py-3 font-medium text-slate-700">{log.entries}</td>
                <td className="px-3 py-3 font-medium text-slate-700">{log.members}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <div className="h-1.5 w-16 rounded-full bg-emerald-100">
                      <div className="h-full w-[85%] rounded-full bg-emerald-600" />
                    </div>
                    <span className="font-medium text-slate-700">{log.rate}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ConfidencePanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold text-slate-900">
        Knowledge & Confidence Improvement
      </h2>
      <div className="mb-4 flex flex-wrap gap-5 border-b border-slate-200 pb-3 text-sm text-slate-700">
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full bg-blue-500" />
          Before Program
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full bg-slate-700" />
          After Program
        </span>
      </div>

      <div className="space-y-5">
        {confidenceRows.map((row) => (
          <div key={row.label} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-slate-800">{row.label}</span>
              <span className="flex shrink-0 gap-3 font-semibold">
                <span className="text-blue-600">{row.before.toFixed(1)}</span>
                <span className="text-slate-700">{row.after.toFixed(1)}</span>
                <span className={row.negative ? "text-red-600" : "text-emerald-600"}>
                  {row.change}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 flex-1 rounded-full bg-blue-500" style={{ maxWidth: `${row.before * 10}%` }} />
              <div className="h-2 flex-1 rounded-full bg-slate-700" style={{ maxWidth: `${row.after * 10}%` }} />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 flex items-center gap-2 text-[10px] font-medium text-slate-700">
        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-700 text-[10px]">!</span>
        Confidence rated on a scale of 1 (Not Confident) to 10 (Very Confident)
      </p>
    </section>
  );
}

function DonutPanel({
  title,
  legend,
  gradient,
  footer,
}: {
  title: string;
  legend: Array<{ label: string; value: string; color: string; detail?: string }>;
  gradient: string;
  footer?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-7 text-base font-semibold text-slate-900">{title}</h2>
      <div className="grid items-center gap-7 sm:grid-cols-[200px_minmax(0,1fr)]">
        <div
          className="mx-auto flex h-[200px] w-[200px] items-center justify-center rounded-full"
          style={{ background: gradient }}
        >
          <div className="flex h-[118px] w-[118px] flex-col items-center justify-center rounded-full bg-white">
            <p className="text-2xl font-semibold text-slate-900">86%</p>
            <p className="text-sm text-slate-600">Overall</p>
          </div>
        </div>

        <div className="space-y-4">
          {legend.map((item) => (
            <div key={item.label} className="grid grid-cols-[1fr_auto] items-start gap-4 text-sm">
              <div className="flex items-start gap-3">
                <span className={`mt-1 h-4 w-4 shrink-0 rounded-full ${item.color}`} />
                <div>
                  <p className="font-semibold text-slate-800">{item.label}</p>
                  {item.detail && <p className="mt-2 text-slate-600">{item.detail}</p>}
                </div>
              </div>
              <p className="font-medium text-slate-600">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
      {footer && <div className="mt-6 border-t border-slate-200 pt-4">{footer}</div>}
    </section>
  );
}

function EducationFooter() {
  const items = [
    { label: "Avg Time Spent Learning", value: "42", unit: "min/member/mo" },
    { label: "Modules Completed", value: "2.7", unit: "avg per member" },
    { label: "Live Events Attended", value: "1.6", unit: "avg/member" },
    { label: "Handouts Downloaded", value: "3.1", unit: "avg/member" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label}>
          <p className="min-h-10 text-sm font-medium leading-5 text-slate-900">{item.label}</p>
          <p className="text-xl font-bold leading-6 text-blue-600">{item.value}</p>
          <p className="text-sm font-medium text-slate-700">{item.unit}</p>
        </div>
      ))}
    </div>
  );
}

function RecentActivity() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="px-4 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
        <p className="mt-2 text-xs font-medium text-slate-700">Recent Activity</p>
      </div>
      <div className="border-t border-slate-100">
        {activityRows.map((row, index) => (
          <div
            key={`${row.name}-${index}`}
            className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-200 px-3 py-2 last:border-0"
          >
            <div className="relative h-8 w-8 overflow-hidden rounded-full bg-pink-100">
              <Image src="/images/aboutImage.png" alt="" fill className="object-cover object-top" />
            </div>
            <div className="flex min-w-0 flex-wrap gap-x-5 gap-y-1 text-sm">
              <span className="font-semibold text-slate-900">{row.status}</span>
              <span className="font-medium text-slate-700">{row.name}</span>
            </div>
            <span className="flex items-center gap-2 whitespace-nowrap text-xs font-medium text-slate-600">
              <Clock3 className="h-4 w-4" />
              {row.time}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function EarningsOverview() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-7 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Earnings Overview</h2>
        <button
          type="button"
          className="flex items-center gap-4 rounded-md border border-slate-200 bg-slate-50 px-5 py-2 text-base font-bold text-slate-900"
        >
          This Week
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-[34px_minmax(0,1fr)] gap-3">
        <div className="flex h-[230px] flex-col justify-between text-sm font-medium text-slate-500">
          {[100, 90, 80, 70, 60].map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <div className="relative h-[230px] border-b border-slate-400">
          <div className="absolute inset-0 flex flex-col justify-between">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="border-t border-dashed border-slate-200" />
            ))}
          </div>
          <div className="relative z-10 flex h-full items-end justify-between gap-3 px-2">
            {weeklyBars.map((bar) => (
              <div key={bar.day} className="flex h-full flex-1 flex-col justify-end gap-2">
                <div className="flex flex-1 items-end">
                  <div
                    className={`w-full rounded-t-md ${
                      bar.day === "Wed"
                        ? "bg-gradient-to-b from-blue-600 to-blue-100"
                        : "bg-blue-100"
                    }`}
                    style={{ height: `${bar.value}%` }}
                  />
                </div>
                <span className="text-center text-sm font-medium text-slate-500">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AdminDashboard() {
  return (
    <>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((card) => (
          <MetricCard key={card.title} card={card} />
        ))}
      </section>

      <section className="mt-4 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.76fr)]">
        <LiveClassTable />
        <ConfidencePanel />
      </section>

      <section className="mt-3 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)]">
        <div className="space-y-3">
          <DonutPanel
            title="Education Engagement"
            legend={educationLegend}
            gradient="conic-gradient(#2563eb 0deg 180deg, #f59e0b 180deg 240deg, #06b6d4 240deg 282deg, #22c55e 282deg 330deg, #fb4b2b 330deg 360deg)"
            footer={<EducationFooter />}
          />
          <RecentActivity />
        </div>

        <div className="space-y-5">
          <DonutPanel
            title="Engagement Level"
            legend={engagementLegend}
            gradient="conic-gradient(#2563eb 0deg 180deg, #f59e0b 180deg 300deg, #fb4b2b 300deg 360deg)"
          />
          <EarningsOverview />
        </div>
      </section>
    </>
  );
}
