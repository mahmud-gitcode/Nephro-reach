import React from "react";
import { Badge, Button, Card } from "@/components/ui";
import {
  CalendarDays,
  Clock3,
  Eye,
  Plus,
  Radio,
  Send,
  UserRoundCheck,
  Users,
  Video,
} from "lucide-react";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const summaryCards: Array<{
  title: string;
  value: string;
  icon: IconType;
  tone: string;
  iconTone: string;
}> = [
  {
    title: "Total Classes",
    value: "147",
    icon: Video,
    tone: "bg-brand-100",
    iconTone: "text-fg-brand",
  },
  {
    title: "Upcoming",
    value: "01",
    icon: Radio,
    tone: "bg-success-100",
    iconTone: "text-success",
  },
  {
    title: "Completed",
    value: "146",
    icon: UserRoundCheck,
    tone: "bg-cat-3-soft",
    iconTone: "text-cat-3",
  },
  {
    title: "Total Enrollments",
    value: "13",
    icon: Users,
    tone: "bg-danger-100",
    iconTone: "text-danger",
  },
];

const classColumns = [
  {
    title: "Next Upcoming",
    class: {
      status: "Active",
      statusClass: "bg-warning-100 text-warning",
      title: "Communication in Relationships",
      description:
        "As a translator, I want integrate Crowdin webhook to notify translators about changed strings",
      date: "Tuesday, July 7, 2026",
      time: "7:00 PM (75 min)",
      enrollment: "12/50 enrolled",
      instructor: "Dr. Emily Thompson",
      isComplete: false,
    },
  },
  {
    title: "Past Classes",
    class: {
      status: "Complete",
      statusClass: "bg-success-surface text-success",
      title: "Communication in Relationships",
      description:
        "As a translator, I want integrate Crowdin webhook to notify translators about changed strings",
      date: "Tuesday, July 7, 2026",
      time: "7:00 PM (75 min)",
      enrollment: "12/50 enrolled",
      instructor: "Dr. Emily Thompson",
      isComplete: true,
    },
  },
];

function SummaryCard({ card }: { card: (typeof summaryCards)[number] }) {
  return (
    <Card as="article" padding="none" className="min-h-[114px] p-inset-lg">
      <div className="mb-stack-xl flex items-start justify-between gap-inline-lg">
        <p className="text-body-md text-fg-muted">{card.title}</p>
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 items-center justify-center rounded-control ${card.tone}`}
        >
          <card.icon className={`h-5 w-5 ${card.iconTone}`} />
        </span>
      </div>
      <p className="text-metric-sm text-fg">{card.value}</p>
    </Card>
  );
}

function DetailRow({
  icon: Icon,
  children,
}: {
  icon: IconType;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-inline-md text-body-sm text-fg-muted">
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-fg-muted" />
      <span>{children}</span>
    </li>
  );
}

function ClassCard({ item }: { item: (typeof classColumns)[number]["class"] }) {
  return (
    <Card as="article" padding="small">
      <Badge tone={item.isComplete ? "neutral" : "success"}>
        {item.status}
      </Badge>

      <div className="mt-stack-xl">
        <h3 className="text-heading-4 text-fg">{item.title}</h3>
        <p className="mt-stack-sm measure text-body-sm text-fg-muted">
          {item.description}
        </p>
      </div>

      <ul className="mt-stack-xl space-y-stack-md">
        <DetailRow icon={CalendarDays}>{item.date}</DetailRow>
        <DetailRow icon={Clock3}>{item.time}</DetailRow>
        <DetailRow icon={Users}>{item.enrollment}</DetailRow>
        <DetailRow icon={UserRoundCheck}>
          Instructor: {item.instructor}
        </DetailRow>
      </ul>

      <div className="mt-stack-xl space-y-stack-md">
        <Button size="small" disabled={item.isComplete} className="w-full">
          Join in
        </Button>

        <div className="grid grid-cols-1 gap-inline-lg sm:grid-cols-2">
          <Button
            variant="neutral"
            appearance="fill-stroke"
            size="small"
            disabled={item.isComplete}
          >
            <Eye aria-hidden="true" />
            View Enrollment
          </Button>
          <Button
            variant="neutral"
            appearance="fill"
            size="small"
            disabled={item.isComplete}
          >
            <Send aria-hidden="true" />
            Send Reminder
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ClassRegistrations() {
  return (
    <Card as="section" padding="small">
      <div className="mb-stack-lg flex flex-col gap-inline-lg sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-heading-4 text-fg">Class Registrations</h1>
        <Button {...notBuiltYet("Scheduling a class")} size="small">
          <Plus aria-hidden="true" />
          Schedule Class
        </Button>
      </div>

      <div className="overflow-hidden rounded-control border border-line bg-surface-sunken">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {classColumns.map((column) => (
            <section
              key={column.title}
              className="min-h-[540px] border-b border-line p-inset-md last:border-b-0 lg:border-b-0 lg:border-l lg:first:border-l-0"
            >
              <h2 className="mb-stack-lg text-heading-5 text-fg">
                {column.title}
              </h2>
              <ClassCard item={column.class} />
            </section>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default function LiveClassPage() {
  return (
    <>
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} card={card} />
        ))}
      </section>

      <div className="mt-stack-lg">
        <ClassRegistrations />
      </div>
    </>
  );
}
