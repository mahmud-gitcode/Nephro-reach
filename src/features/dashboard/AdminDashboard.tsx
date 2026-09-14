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

import {
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

/* Five cards, eight log rows, five legend keys, three engagement bands —
   none of them a state, all of them a category. They now come off the
   categorical ramp instead of borrowing success / warning / danger. */
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
    tone: "bg-cat-5-soft",
    iconTone: "text-cat-5",
  },
  {
    title: "Monthly Revenue",
    value: "$8,340",
    growth: "+ 36%",
    icon: BarChart3,
    tone: "bg-cat-4-soft",
    iconTone: "text-cat-4",
  },
  {
    title: "Notification Response Rate",
    value: "78%",
    growth: "+ 36%",
    icon: MessageCircle,
    tone: "bg-cat-3-soft",
    iconTone: "text-cat-3",
  },
  {
    title: "Active Subscriptions",
    value: "892",
    growth: "+ 36%",
    icon: CircleDollarSign,
    tone: "bg-cat-7-soft",
    iconTone: "text-cat-7",
  },
  {
    title: "ER visits",
    value: "8,340",
    icon: Stethoscope,
    tone: "bg-cat-2-soft",
    iconTone: "text-cat-2",
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
  {
    label: "Blood Pressure Log",
    entries: "28,456",
    members: "6,231",
    rate: "85.3%",
    icon: HeartPulse,
    color: "text-cat-1",
  },
  {
    label: "Weight & Fluid Log",
    entries: "31,782",
    members: "7,142",
    rate: "85.3%",
    icon: Weight,
    color: "text-cat-6",
  },
  {
    label: "Medication Log",
    entries: "27,934",
    members: "5,987",
    rate: "85.3%",
    icon: Pill,
    color: "text-cat-7",
  },
  {
    label: "Lab Tracking Log",
    entries: "33,210",
    members: "8,450",
    rate: "85.3%",
    icon: Microscope,
    color: "text-cat-2",
  },
  {
    label: "Dialysis Treatment",
    entries: "29,865",
    members: "6,789",
    rate: "85.3%",
    icon: UserRoundCheck,
    color: "text-cat-4",
  },
  {
    label: "Nutrition & Meal Log",
    entries: "30,498",
    members: "7,305",
    rate: "85.3%",
    icon: Activity,
    color: "text-cat-3",
  },
  {
    label: "How I Feel Today Log",
    entries: "32,120",
    members: "5,623",
    rate: "85.3%",
    icon: MessageSquareText,
    color: "text-cat-5",
  },
  {
    label: "Before the ER Log",
    entries: "32,120",
    members: "5,623",
    rate: "85.3%",
    icon: Truck,
    color: "text-cat-8",
  },
];

const confidenceRows = [
  { label: "Understanding Dialysis", before: 8.9, after: 4.1, change: "+4.7" },
  {
    label: "Understanding Lab Results",
    before: 5.2,
    after: 3.8,
    change: "+1.4",
  },
  {
    label: "Fluid Management Knowledge",
    before: 7.4,
    after: 6.0,
    change: "+3.2",
  },
  {
    label: "Diet & Nutrition Knowledge",
    before: 2.1,
    after: 5.5,
    change: "-1.1",
    negative: true,
  },
  {
    label: "Medication Understanding",
    before: 4.9,
    after: 8.1,
    change: "+4.7",
  },
  { label: "Managing Symptoms", before: 9.0, after: 7.3, change: "+2.5" },
  {
    label: "Kidney Disease Understanding",
    before: 3.3,
    after: 4.4,
    change: "+0.9",
  },
];

const educationLegend = [
  { label: "Videos Watched", value: "19,428 (34%)", color: "bg-cat-6" },
  { label: "Modules Completed", value: "16,478 (29%)", color: "bg-cat-2" },
  { label: "Live Classes Attended", value: "8,321 (15%)", color: "bg-cat-5" },
  { label: "Members Downloaded", value: "4,421 (8%)", color: "bg-cat-4" },
  { label: "Quantities Submitted", value: "4,258 (7%)", color: "bg-cat-1" },
];

const engagementLegend = [
  {
    label: "High Engagement",
    detail: "Completed 5+ modules",
    value: "29 (50%)",
    color: "bg-cat-6",
  },
  {
    label: "Medium Engagement",
    detail: "Completed 2-4 modules",
    value: "16 (28%)",
    color: "bg-cat-2",
  },
  {
    label: "Low Engagement",
    detail: "No login or 30 days",
    value: "13 (22%)",
    color: "bg-cat-1",
  },
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
    <Card as="article" padding="small" className="min-h-[114px]">
      <div className="mb-stack-lg flex items-start justify-between gap-inline-lg">
        <p className="text-caption text-fg-muted">{card.title}</p>
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 items-center justify-center rounded-control ${card.tone}`}
        >
          <card.icon className={`h-5 w-5 ${card.iconTone}`} />
        </span>
      </div>
      <div className="flex items-end justify-between gap-inline-lg">
        <p className="text-metric-sm text-fg">{card.value}</p>
        {card.growth && (
          <p className="text-caption whitespace-nowrap text-success">
            {card.growth} up
          </p>
        )}
      </div>
    </Card>
  );
}

function LiveClassTable() {
  return (
    <Card as="section" padding="small">
      <div className="mb-stack-lg flex items-center justify-between gap-inset-md">
        <h2 className="text-heading-4 text-fg">Live Class</h2>
        <Button variant="neutral" appearance="fill-stroke" size="small">
          View all
        </Button>
      </div>
      <div className="overflow-hidden rounded-control border border-line">
        <Table minWidth={610}>
          <TableHead className="bg-surface-sunken">
            <TableRow>
              <TableHeaderCell>Log</TableHeaderCell>
              <TableHeaderCell>Total Entries</TableHeaderCell>
              <TableHeaderCell>Members Log</TableHeaderCell>
              <TableHeaderCell className="text-right">
                Completion Rate
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {liveClassLogs.map((log) => (
              <TableRow key={log.label}>
                <TableCell emphasis>
                  <span className="flex items-center gap-inline-lg">
                    <log.icon
                      aria-hidden="true"
                      className={`h-6 w-6 shrink-0 ${log.color}`}
                    />
                    <span className="whitespace-nowrap">{log.label}</span>
                  </span>
                </TableCell>
                <TableCell>{log.entries}</TableCell>
                <TableCell>{log.members}</TableCell>
                <TableCell>
                  <span className="flex items-center justify-end gap-inline-lg">
                    <span
                      role="progressbar"
                      aria-valuenow={85}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${log.label} completion rate`}
                      className="block h-1.5 w-16 rounded-pill bg-surface-sunken"
                    >
                      <span className="block h-full w-[85%] rounded-pill bg-primary-solid" />
                    </span>
                    {log.rate}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function ConfidencePanel() {
  return (
    <Card as="section" padding="small">
      <h2 className="mb-stack-sm text-heading-5 text-fg">
        Knowledge &amp; Confidence Improvement
      </h2>
      {/* Before / after is a comparison, not a status, so it takes two
          categorical steps rather than a red-to-green reading. */}
      <div className="mb-stack-lg flex flex-wrap gap-inset-md border-b border-line pb-inset-sm text-body-sm text-fg-secondary">
        <span className="flex items-center gap-inline-md">
          <span aria-hidden="true" className="h-4 w-4 rounded-pill bg-cat-6" />
          Before Program
        </span>
        <span className="flex items-center gap-inline-md">
          <span aria-hidden="true" className="h-4 w-4 rounded-pill bg-cat-7" />
          After Program
        </span>
      </div>

      <div className="space-y-5">
        {confidenceRows.map((row) => (
          <div key={row.label} className="space-y-2">
            <div className="flex items-center justify-between gap-inline-lg text-caption">
              <span className="text-label-sm text-fg-secondary">
                {row.label}
              </span>
              <span className="flex shrink-0 gap-inline-lg text-label-sm">
                <span className="text-cat-6">{row.before.toFixed(1)}</span>
                <span className="text-cat-7">{row.after.toFixed(1)}</span>
                {/* The change IS a judgement, so this one stays status-coloured. */}
                <span className={row.negative ? "text-danger" : "text-success"}>
                  {row.change}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-inline-xs">
              <div
                className="h-2 flex-1 rounded-pill bg-cat-6"
                style={{ maxWidth: `${row.before * 10}%` }}
              />
              <div
                className="h-2 flex-1 rounded-pill bg-cat-7"
                style={{ maxWidth: `${row.after * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-stack-xl flex items-center gap-inline-md text-caption text-fg-muted">
        <span
          aria-hidden="true"
          className="flex h-4 w-4 items-center justify-center rounded-pill border border-line-strong"
        >
          !
        </span>
        Confidence rated on a scale of 1 (Not Confident) to 10 (Very Confident)
      </p>
    </Card>
  );
}

function DonutPanel({
  title,
  legend,
  gradient,
  footer,
}: {
  title: string;
  legend: Array<{
    label: string;
    value: string;
    color: string;
    detail?: string;
  }>;
  gradient: string;
  footer?: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-line bg-surface p-4 shadow-card">
      <h2 className="mb-7 text-base font-semibold text-fg">{title}</h2>
      <div className="grid items-center gap-7 sm:grid-cols-[200px_minmax(0,1fr)]">
        <div
          className="mx-auto flex h-[200px] w-[200px] items-center justify-center rounded-pill"
          style={{ background: gradient }}
        >
          <div className="flex h-[118px] w-[118px] flex-col items-center justify-center rounded-pill bg-surface">
            <p className="text-2xl font-semibold text-fg">86%</p>
            <p className="text-sm text-fg-muted">Overall</p>
          </div>
        </div>

        <div className="space-y-4">
          {legend.map((item) => (
            <div
              key={item.label}
              className="grid grid-cols-[1fr_auto] items-start gap-4 text-sm"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1 h-4 w-4 shrink-0 rounded-pill ${item.color}`}
                />
                <div>
                  <p className="font-semibold text-fg-secondary">
                    {item.label}
                  </p>
                  {item.detail && (
                    <p className="mt-2 text-fg-muted">{item.detail}</p>
                  )}
                </div>
              </div>
              <p className="font-medium text-fg-muted">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
      {footer && <div className="mt-6 border-t border-line pt-4">{footer}</div>}
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
          <p className="min-h-10 text-sm leading-5 font-medium text-fg">
            {item.label}
          </p>
          <p className="text-xl leading-6 font-bold text-fg-brand">
            {item.value}
          </p>
          <p className="text-sm font-medium text-fg-secondary">{item.unit}</p>
        </div>
      ))}
    </div>
  );
}

function RecentActivity() {
  return (
    <section className="rounded-card border border-line bg-surface shadow-card">
      <div className="px-4 py-4">
        <h2 className="text-lg font-semibold text-fg">Recent Activity</h2>
        <p className="mt-2 text-xs font-medium text-fg-secondary">
          Recent Activity
        </p>
      </div>
      <div className="border-t border-line-subtle">
        {activityRows.map((row, index) => (
          <div
            key={`${row.name}-${index}`}
            className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line px-3 py-2 last:border-0"
          >
            <div className="relative h-8 w-8 overflow-hidden rounded-pill bg-surface-sunken">
              <Image
                src="/images/aboutImage.png"
                alt=""
                fill
                className="object-cover object-top"
              />
            </div>
            <div className="flex min-w-0 flex-wrap gap-x-5 gap-y-1 text-sm">
              <span className="font-semibold text-fg">{row.status}</span>
              <span className="font-medium text-fg-secondary">{row.name}</span>
            </div>
            <span className="flex items-center gap-2 text-xs font-medium whitespace-nowrap text-fg-muted">
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
    <section className="rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="mb-7 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-fg">Earnings Overview</h2>
        <button
          type="button"
          className="flex items-center gap-4 rounded-control-small border border-line bg-surface-sunken px-5 py-2 text-base font-bold text-fg"
        >
          This Week
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-[34px_minmax(0,1fr)] gap-3">
        <div className="flex h-[230px] flex-col justify-between text-sm font-medium text-fg-muted">
          {[100, 90, 80, 70, 60].map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <div className="relative h-[230px] border-b border-line-strong">
          <div className="absolute inset-0 flex flex-col justify-between">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="border-t border-dashed border-line" />
            ))}
          </div>
          <div className="relative z-10 flex h-full items-end justify-between gap-3 px-2">
            {weeklyBars.map((bar) => (
              <div
                key={bar.day}
                className="flex h-full flex-1 flex-col justify-end gap-2"
              >
                <div className="flex flex-1 items-end">
                  <div
                    className={`w-full rounded-t-md ${
                      bar.day === "Wed"
                        ? "bg-gradient-to-b from-primary-solid to-primary-soft"
                        : "bg-primary-soft"
                    }`}
                    style={{ height: `${bar.value}%` }}
                  />
                </div>
                <span className="text-center text-sm font-medium text-fg-muted">
                  {bar.day}
                </span>
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
            gradient="conic-gradient(var(--color-cat-6) 0deg 180deg, var(--color-cat-2) 180deg 240deg, var(--color-cat-5) 240deg 282deg, var(--color-cat-4) 282deg 330deg, var(--color-cat-1) 330deg 360deg)"
            footer={<EducationFooter />}
          />
          <RecentActivity />
        </div>

        <div className="space-y-5">
          <DonutPanel
            title="Engagement Level"
            legend={engagementLegend}
            gradient="conic-gradient(var(--color-cat-6) 0deg 180deg, var(--color-cat-2) 180deg 300deg, var(--color-cat-1) 300deg 360deg)"
          />
          <EarningsOverview />
        </div>
      </section>
    </>
  );
}
