import React from "react";
import Link from "next/link";
import {
  Apple,
  ClipboardPlus,
  Droplet,
  FileHeart,
  FileText,
  HeartPulse,
  Pill,
  Plus,
  Stethoscope,
  TestTube2,
} from "lucide-react";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const logTiles: Array<{
  label: string;
  icon: IconType;
  iconClass: string;
  iconBg: string;
  href?: string;
}> = [
  {
    label: "Blood Result",
    icon: HeartPulse,
    iconClass: "text-red-500",
    iconBg: "bg-red-100",
    href: "/dashboard/personal-log/blood-results",
  },
  {
    label: "Blood pressure",
    icon: HeartPulse,
    iconClass: "text-red-500",
    iconBg: "bg-red-100",
    href: "/dashboard/personal-log/blood-pressure",
  },
  {
    label: "CKD Labs",
    icon: Droplet,
    iconClass: "text-red-500",
    iconBg: "bg-red-100",
    href: "/dashboard/personal-log/lab-tracking",
  },
  {
    label: "Appointments",
    icon: Stethoscope,
    iconClass: "text-emerald-600",
    iconBg: "bg-emerald-100",
    href: "/dashboard/personal-log/appointments",
  },
  {
    label: "Medications",
    icon: Pill,
    iconClass: "text-blue-600",
    iconBg: "bg-blue-100",
    href: "/dashboard/personal-log/medications",
  },
  {
    label: "Nutrition",
    icon: Apple,
    iconClass: "text-emerald-600",
    iconBg: "bg-emerald-100",
    href: "/dashboard/personal-log/nutrition",
  },
  {
    label: "Dialysis Monthly Labs",
    icon: FileText,
    iconClass: "text-purple-600",
    iconBg: "bg-purple-100",
  },
  {
    label: "Dialysis Treatment",
    icon: FileHeart,
    iconClass: "text-blue-600",
    iconBg: "bg-blue-100",
  },
  {
    label: "Symptom Tracker",
    icon: ClipboardPlus,
    iconClass: "text-blue-600",
    iconBg: "bg-blue-100",
  },
  {
    label: "Fluid tracker",
    icon: TestTube2,
    iconClass: "text-blue-600",
    iconBg: "bg-blue-100",
  },
];

function LogTile({ tile }: { tile: (typeof logTiles)[number] }) {
  const content = (
    <>
      <span className={`flex h-12 w-12 items-center justify-center rounded-[14px] ${tile.iconBg}`}>
        <tile.icon className={`h-6 w-6 ${tile.iconClass}`} />
      </span>
      <span className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
        {tile.label}
      </span>
    </>
  );
  const className =
    "flex min-h-[134px] flex-col items-center justify-center gap-3.5 rounded-xl border-[3px] border-white bg-gradient-to-b from-[#F4F4F4] to-white p-6 text-center shadow-[0_2.7px_2.9px_rgba(0,0,0,0.20),0_0.9px_3.6px_rgba(0,0,0,0.10)] transition-transform hover:-translate-y-0.5";

  if (tile.href) {
    return (
      <Link href={tile.href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={className}>
      {content}
    </button>
  );
}

function EmptyPanel({
  title,
  action,
}: {
  title: string;
  action?: string;
}) {
  return (
    <section className="rounded-xl border border-[#D6E6F2] bg-[#F1F5FA] p-3.5">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="flex-1 text-lg font-medium leading-7 tracking-[0.09px] text-slate-950">
          {title}
        </h2>
        {action && (
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-950 underline"
          >
            {action}
          </button>
        )}
      </div>
      <div className="flex h-[168px] items-center justify-center rounded-xl border border-[#E9EEF4] bg-white p-3.5">
        <p className="text-center text-2xl font-normal leading-8 tracking-[0.12px] text-slate-500">
          No upcoming appointments
        </p>
      </div>
    </section>
  );
}

function HealthcareTeam() {
  return (
    <section className="rounded-[10px] border border-slate-200 bg-[#F1F5FA] p-3">
      <div>
        <h2 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
          My Healthcare Team
        </h2>
        <p className="mt-1.5 text-sm font-medium leading-5 tracking-[0.07px] text-slate-700">
          clinicians who can view your records
        </p>
      </div>

      <div className="mt-2 flex gap-3">
        <input
          type="email"
          defaultValue="Example@hospiatal.com"
          className="h-12 min-w-0 flex-1 rounded-lg border border-[#CBD5ED] bg-white px-4 text-base font-medium text-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="button"
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Add
        </button>
      </div>

      <p className="mt-2 text-sm font-medium leading-5 tracking-[0.07px] text-slate-500">
        Enter your clinician&apos;s email. They&apos;ll get an invite to register if they haven&apos;t already.
      </p>

      <div className="mt-3 flex min-h-[113px] items-center justify-center rounded-xl border border-[#E9EEF4] bg-white p-3.5">
        <p className="text-center text-sm font-medium leading-5 tracking-[0.07px] text-slate-500">
          No clinicians linked yet.
        </p>
      </div>
    </section>
  );
}

function LatestReadings() {
  return (
    <section className="rounded-xl border border-[#D6E6F2] bg-[#F1F5FA] p-3.5">
      <h2 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
        Latest Readings
      </h2>
      <div className="mt-3 flex min-h-[109px] items-start rounded-xl border border-[#E9EEF4] bg-white p-3.5">
        <div className="p-1.5 text-xs leading-4 tracking-[0.06px] text-slate-500">
          <p>Recorded on</p>
          <p className="mt-1.5">15/05/2026</p>
        </div>
      </div>
    </section>
  );
}

export default function PersonalLogPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[32px] font-medium leading-none text-slate-950">
          Good morning, Sarah
        </h1>
        <p className="mt-1 text-lg font-medium leading-7 tracking-[0.09px] text-slate-700">
          Your personal log for each dialysis day
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {logTiles.slice(0, 4).map((tile) => (
          <LogTile key={tile.label} tile={tile} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {logTiles.slice(4, 7).map((tile) => (
          <LogTile key={tile.label} tile={tile} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {logTiles.slice(7).map((tile) => (
          <LogTile key={tile.label} tile={tile} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,636px)_minmax(360px,446px)]">
        <div className="space-y-3.5">
          <EmptyPanel title="Latest Blood Results" action="dd/mm/yyyy" />
          <EmptyPanel title="upcoming appointments" action="View all" />
        </div>
        <div className="space-y-3.5">
          <HealthcareTeam />
          <LatestReadings />
        </div>
      </section>
    </div>
  );
}
