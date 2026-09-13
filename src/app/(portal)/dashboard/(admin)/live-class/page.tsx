import React from "react";
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
    tone: "bg-blue-100",
    iconTone: "text-blue-600",
  },
  {
    title: "Upcoming",
    value: "01",
    icon: Radio,
    tone: "bg-emerald-100",
    iconTone: "text-emerald-600",
  },
  {
    title: "Completed",
    value: "146",
    icon: UserRoundCheck,
    tone: "bg-lime-100",
    iconTone: "text-lime-700",
  },
  {
    title: "Total Enrollments",
    value: "13",
    icon: Users,
    tone: "bg-red-100",
    iconTone: "text-red-500",
  },
];

const classColumns = [
  {
    title: "Next Upcoming",
    class: {
      status: "Active",
      statusClass: "bg-amber-100 text-amber-700",
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
      statusClass: "bg-emerald-50 text-emerald-600",
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
    <article className="min-h-[114px] rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <p className="text-base font-semibold tracking-[0.08px] text-slate-600">
          {card.title}
        </p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${card.tone}`}>
          <card.icon className={`h-5 w-5 ${card.iconTone}`} />
        </span>
      </div>
      <p className="text-2xl font-semibold leading-8 tracking-[0.12px] text-slate-900">
        {card.value}
      </p>
    </article>
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
    <li className="flex items-center gap-2 text-sm font-medium leading-5 text-slate-600">
      <Icon className="h-4 w-4 shrink-0 text-slate-500" />
      <span>{children}</span>
    </li>
  );
}

function ClassCard({ item }: { item: (typeof classColumns)[number]["class"] }) {
  const secondaryButtonClass = item.isComplete
    ? "border-slate-200 bg-slate-100 text-slate-400"
    : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50";
  const reminderButtonClass = item.isComplete
    ? "bg-slate-100 text-slate-400"
    : "bg-[#06265B] text-white hover:bg-[#0A3478]";

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`inline-flex h-6 items-center rounded px-2 text-sm font-semibold ${item.statusClass}`}>
        {item.status}
      </span>

      <div className="mt-5">
        <h3 className="text-xl font-semibold leading-7 text-slate-900">{item.title}</h3>
        <p className="mt-2 text-sm font-normal leading-5 text-slate-600">{item.description}</p>
      </div>

      <ul className="mt-5 space-y-3">
        <DetailRow icon={CalendarDays}>{item.date}</DetailRow>
        <DetailRow icon={Clock3}>{item.time}</DetailRow>
        <DetailRow icon={Users}>{item.enrollment}</DetailRow>
        <DetailRow icon={UserRoundCheck}>Instructor: {item.instructor}</DetailRow>
      </ul>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          disabled={item.isComplete}
          className={`flex h-10 w-full items-center justify-center rounded-lg text-sm font-bold transition-colors ${
            item.isComplete
              ? "cursor-not-allowed bg-slate-100 text-slate-400"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Join in
        </button>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            className={`flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold transition-colors ${secondaryButtonClass}`}
          >
            <Eye className="h-4 w-4" />
            View Enrollment
          </button>
          <button
            type="button"
            disabled={item.isComplete}
            className={`flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors ${reminderButtonClass}`}
          >
            <Send className="h-4 w-4" />
            Send Reminder
          </button>
        </div>
      </div>
    </article>
  );
}

function ClassRegistrations() {
  return (
    <section className="rounded-[14px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Class Registrations</h1>
        <button
          type="button"
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Schedule Class
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#C4CDD5] bg-[#F4F7FB]">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {classColumns.map((column) => (
            <section
              key={column.title}
              className="min-h-[540px] border-b border-[#C4CDD5] p-4 last:border-b-0 lg:border-b-0 lg:border-l lg:first:border-l-0"
            >
              <h2 className="mb-4 text-lg font-semibold leading-7 text-slate-900">{column.title}</h2>
              <ClassCard item={column.class} />
            </section>
          ))}
        </div>
      </div>
    </section>
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

      <div className="mt-4">
        <ClassRegistrations />
      </div>
    </>
  );
}
