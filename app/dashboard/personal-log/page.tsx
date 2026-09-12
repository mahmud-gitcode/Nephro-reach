"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
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
import PersonalLogDisclaimer from "@/components/dashboard/PersonalLogDisclaimer";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type LogTileConfig = {
  key: string;
  icon: IconType;
  iconClass: string;
  iconBg: string;
  href: string;
};

const tileConfigs: LogTileConfig[] = [
  {
    key: "appointments",
    icon: User,
    iconClass: "text-[#16A34A]",
    iconBg: "bg-[#DCFCE7]",
    href: "/dashboard/personal-log/appointments",
  },
  {
    key: "medications",
    icon: Pill,
    iconClass: "text-[#2563EB]",
    iconBg: "bg-[#DBEAFE]",
    href: "/dashboard/personal-log/medications",
  },
  {
    key: "bloodPressure",
    icon: HeartPulse,
    iconClass: "text-[#EF4444]",
    iconBg: "bg-[#FEE2E2]",
    href: "/dashboard/personal-log/blood-pressure",
  },
  {
    key: "myLabs",
    icon: FileText,
    iconClass: "text-[#9333EA]",
    iconBg: "bg-[#F3E8FF]",
    href: "/dashboard/personal-log/lab-tracking",
  },
  {
    key: "nutrition",
    icon: Apple,
    iconClass: "text-[#16A34A]",
    iconBg: "bg-[#DCFCE7]",
    href: "/dashboard/personal-log/nutrition",
  },
  {
    key: "fluidTracker",
    icon: Activity,
    iconClass: "text-[#2563EB]",
    iconBg: "bg-[#DBEAFE]",
    href: "/dashboard/personal-log/fluid-tracker",
  },
  {
    key: "dialysisTreatment",
    icon: Activity,
    iconClass: "text-[#2563EB]",
    iconBg: "bg-[#DBEAFE]",
    href: "/dashboard/personal-log/dialysis-treatment",
  },
  {
    key: "dialysisJournal",
    icon: Notebook,
    iconClass: "text-[#2563EB]",
    iconBg: "bg-[#DBEAFE]",
    href: "/dashboard/personal-log/dialysis-management",
  },
];

function UpcomingAppointments() {
  const { t } = useLanguage();

  return (
    <section className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#0F172A]">
          {t("personalLogHub.upcoming.title")}
        </h2>
        <Link
          href="/dashboard/personal-log/appointments"
          className="rounded-md border border-[#CBD5E1] bg-white px-3 py-1 text-xs font-medium text-[#0F172A] shadow-sm hover:bg-slate-50 transition-colors"
        >
          {t("personalLogHub.upcoming.viewAll")}
        </Link>
      </div>
      <div className="flex min-h-[140px] items-center justify-center rounded-xl border border-[#E2E8F0] bg-white p-6">
        <p className="text-base sm:text-lg font-normal text-[#64748B]">
          {t("personalLogHub.upcoming.empty")}
        </p>
      </div>
    </section>
  );
}

function HealthcareTeam() {
  const { t } = useLanguage();
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
          {t("personalLogHub.team.title")}
        </h2>
        <p className="text-xs text-[#64748B] mt-0.5">
          {t("personalLogHub.team.subtitle")}
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("personalLogHub.team.placeholder")}
          className="h-11 flex-1 rounded-lg border border-[#CBD5E1] bg-white px-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="submit"
          className="h-11 shrink-0 rounded-lg bg-[#2563EB] px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {t("personalLogHub.team.add")}
        </button>
      </form>

      <p className="text-xs text-[#64748B]">
        {t("personalLogHub.team.note")}
      </p>

      <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-[#E2E8F0] bg-white p-6">
        {clinicians.length === 0 ? (
          <p className="text-sm font-normal text-[#64748B]">
            {t("personalLogHub.team.empty")}
          </p>
        ) : (
          <ul className="w-full space-y-2">
            {clinicians.map((c, i) => (
              <li
                key={i}
                className="flex items-center justify-between text-sm text-[#0F172A] bg-slate-50 p-2.5 rounded-lg border border-slate-200"
              >
                <span>{c}</span>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {t("personalLogHub.team.invited")}
                </span>
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
  const { t } = useLanguage();
  const firstName = user?.name ? user.name.split(" ")[0] : "Sarah";

  const greetingPrefix = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t("personalLogHub.goodMorning");
    if (hour < 17) return t("personalLogHub.goodAfternoon");
    return t("personalLogHub.goodEvening");
  }, [t]);

  return (
    <div className="w-full space-y-6">
      <PersonalLogDisclaimer />

      <header>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#0F172A]">
          {greetingPrefix}, {firstName}
        </h1>
        <p className="mt-1 text-sm sm:text-base font-normal text-[#64748B]">
          {t("personalLogHub.title")}
        </p>
      </header>

      {/* 8 Grid Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tileConfigs.map((tile) => (
          <Link
            key={tile.key}
            href={tile.href}
            className="flex flex-col items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white py-6 px-4 shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${tile.iconBg} mb-3.5`}
            >
              <tile.icon className={`h-6 w-6 ${tile.iconClass}`} />
            </div>
            <span className="text-center text-sm sm:text-base font-semibold text-[#0F172A]">
              {t(`personalLogHub.tiles.${tile.key}`)}
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
