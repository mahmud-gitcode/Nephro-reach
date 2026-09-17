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

import type { DonutSegment } from "@/components/ui";
import {
  BarChart,
  Button,
  Card,
  ChartLegend,
  DonutChart,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";

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

/* Values, not percentages and degrees. DonutChart works the shares out, so
   the ring and the legend can no longer disagree. */
const educationSegments: DonutSegment[] = [
  { label: "Videos Watched", value: 19428, tone: "cat-6" },
  { label: "Modules Completed", value: 16478, tone: "cat-2" },
  { label: "Live Classes Attended", value: 8321, tone: "cat-5" },
  { label: "Members Downloaded", value: 4421, tone: "cat-4" },
  { label: "Quantities Submitted", value: 4258, tone: "cat-1" },
];

const engagementSegments: DonutSegment[] = [
  { label: "High Engagement", value: 29, tone: "cat-6" },
  { label: "Medium Engagement", value: 16, tone: "cat-2" },
  { label: "Low Engagement", value: 13, tone: "cat-1" },
];

const engagementDetail: Record<string, string> = {
  "High Engagement": "Completed 5+ modules",
  "Medium Engagement": "Completed 2-4 modules",
  "Low Engagement": "No login for 30 days",
};

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
        <Button
          {...notBuiltYet("The full live-class list")}
          variant="neutral"
          appearance="fill-stroke"
          size="small"
        >
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
                    <Progress
                      value={85}
                      label={`${log.label} completion rate`}
                      size="small"
                      className="w-16"
                    />
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
      <h2 className="mb-stack-sm text-heading-4 text-fg">
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
  segments,
  detail,
  footer,
}: {
  title: string;
  segments: DonutSegment[];
  /** Optional second line per segment, keyed by label. */
  detail?: Record<string, string>;
  footer?: React.ReactNode;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <Card as="section" padding="small">
      <h2 className="mb-stack-2xl text-heading-4 text-fg">{title}</h2>
      <div className="grid items-center gap-inset-lg sm:grid-cols-[200px_minmax(0,1fr)]">
        <DonutChart
          segments={segments}
          label={title}
          size={200}
          thickness={41}
          centerValue="86%"
          centerLabel="Overall"
          className="mx-auto"
        />

        <ChartLegend
          items={segments.map((segment) => ({
            label: segment.label,
            tone: segment.tone ?? "cat-1",
            detail: detail?.[segment.label],
            value: `${segment.value.toLocaleString()} (${Math.round(
              (segment.value / total) * 100,
            )}%)`,
          }))}
        />
      </div>
      {footer && (
        <div className="mt-stack-xl border-t border-line pt-inset-md">
          {footer}
        </div>
      )}
    </Card>
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
        <h2 className="text-heading-4 text-fg">Recent Activity</h2>
        <p className="mt-0.5 text-body-md text-fg-muted">Recent Activity</p>
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
    <Card as="section" padding="small">
      <div className="mb-stack-2xl flex items-center justify-between gap-inset-md">
        <h2 className="text-heading-4 text-fg">Earnings Overview</h2>
        <button
          {...notBuiltYet("Changing the date range")}
          type="button"
          className="flex items-center gap-4 rounded-control-small border border-line bg-surface-sunken px-5 py-2 text-base font-bold text-fg"
        >
          This Week
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

      <BarChart
        bars={weeklyBars.map((bar) => ({
          label: bar.day,
          value: bar.value,
          // Wednesday is the peak and was picked out by a gradient; a solid
          // brand fill against the soft one says the same thing.
          tone: bar.day === "Wed" ? "brand" : undefined,
        }))}
        label="Earnings this week"
        yMax={100}
        height={230}
      />
    </Card>
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
            segments={educationSegments}
            footer={<EducationFooter />}
          />
          <RecentActivity />
        </div>

        <div className="space-y-5">
          <DonutPanel
            title="Engagement Level"
            segments={engagementSegments}
            detail={engagementDetail}
          />
          <EarningsOverview />
        </div>
      </section>
    </>
  );
}
