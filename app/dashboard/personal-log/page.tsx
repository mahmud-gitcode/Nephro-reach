"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Activity,
  Apple,
  FileText,
  HeartPulse,
  Notebook,
  Pill,
  Plus,
  User,
} from "lucide-react";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type LogTile = {
  label: string;
  icon: IconType;
  iconClass: string;
  iconBg: string;
  href: string;
};

const tiles: LogTile[] = [
  {
    label: "Appointments",
    icon: User,
    iconClass: "text-[#16A34A]",
    iconBg: "bg-[#DCFCE7]",
    href: "/dashboard/personal-log/appointments",
  },
  {
    label: "Medications",
    icon: Pill,
    iconClass: "text-[#2563EB]",
    iconBg: "bg-[#DBEAFE]",
    href: "/dashboard/personal-log/medications",
  },
  {
    label: "Blood pressure",
    icon: HeartPulse,
    iconClass: "text-[#EF4444]",
    iconBg: "bg-[#FEE2E2]",
    href: "/dashboard/personal-log/blood-pressure",
  },
  {
    label: "My Labs",
    icon: FileText,
    iconClass: "text-[#9333EA]",
    iconBg: "bg-[#F3E8FF]",
    href: "/dashboard/personal-log/lab-tracking",
  },
  {
    label: "Nutrition",
    icon: Apple,
    iconClass: "text-[#16A34A]",
    iconBg: "bg-[#DCFCE7]",
    href: "/dashboard/personal-log/nutrition",
  },
  {
    label: "Weight & Fluid Tracker",
    icon: Activity,
    iconClass: "text-[#2563EB]",
    iconBg: "bg-[#DBEAFE]",
    href: "/dashboard/personal-log/fluid-tracker",
  },
  {
    label: "Dialysis Treatment",
    icon: Activity,
    iconClass: "text-[#2563EB]",
    iconBg: "bg-[#DBEAFE]",
    href: "/dashboard/personal-log/dialysis-treatment",
  },
  {
    label: "Dialysis Management",
    icon: Notebook,
    iconClass: "text-[#2563EB]",
    iconBg: "bg-[#DBEAFE]",
    href: "/dashboard/personal-log/dialysis-journal",
  },
];

function UpcomingAppointments() {
  return (
    <section className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#0F172A]">
          upcoming appointments
        </h2>
        <Link
          href="/dashboard/personal-log/appointments"
          className="rounded-md border border-[#CBD5E1] bg-white px-3 py-1 text-xs font-medium text-[#0F172A] shadow-sm hover:bg-slate-50 transition-colors"
        >
          View all
        </Link>
      </div>
      <div className="flex min-h-[140px] items-center justify-center rounded-xl border border-[#E2E8F0] bg-white p-6">
        <p className="text-base sm:text-lg font-normal text-[#64748B]">
          No upcoming appointments
        </p>
      </div>
    </section>
  );
}

function HealthcareTeam() {
  const [email, setEmail] = useState("");
  const [clinicians, setClinicians] = useState<string[]>([]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setClinicians((prev) => [...prev, email.trim()]);
      setEmail("");
    }
  };

  return (
    <section className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3">
      <div>
        <h2 className="text-base font-semibold text-[#0F172A]">
          My Healthcare Team
        </h2>
        <p className="text-xs text-[#64748B] mt-0.5">
          clinicians who can view your records
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Example@hospiatal.com"
          className="h-11 flex-1 rounded-lg border border-[#CBD5E1] bg-white px-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="submit"
          className="h-11 shrink-0 rounded-lg bg-[#2563EB] px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </form>

      <p className="text-xs text-[#64748B]">
        Enter your clinician&apos;s email. They&apos;ll get an invite to register if they haven&apos;t already.
      </p>

      <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-[#E2E8F0] bg-white p-6">
        {clinicians.length === 0 ? (
          <p className="text-sm font-normal text-[#64748B]">
            No clinicians linked yet.
          </p>
        ) : (
          <ul className="w-full space-y-2">
            {clinicians.map((c, i) => (
              <li
                key={i}
                className="flex items-center justify-between text-sm text-[#0F172A] bg-slate-50 p-2.5 rounded-lg border border-slate-200"
              >
                <span>{c}</span>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Invited</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default function PersonalLogPage() {
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(" ")[0] : "Sarah";

  return (
    <div className="w-full space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#0F172A]">
          Good morning, {firstName}
        </h1>
        <p className="mt-1 text-sm sm:text-base font-normal text-[#64748B]">
          Your personal log for each dialysis day
        </p>
      </header>

      {/* 8 Grid Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="flex flex-col items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white py-6 px-4 shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${tile.iconBg} mb-3.5`}
            >
              <tile.icon className={`h-6 w-6 ${tile.iconClass}`} />
            </div>
            <span className="text-center text-sm sm:text-base font-semibold text-[#0F172A]">
              {tile.label}
            </span>
          </Link>
        ))}
      </section>

      {/* Lower Sections */}
      <div className="space-y-6">
        <UpcomingAppointments />
        <HealthcareTeam />
      </div>
    </div>
  );
}
