"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Pencil, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import WheresMyRideModal from "@/components/dashboard/WheresMyRideModal";

const asset = (name: string) => `/images/user-dashboard/${name}`;

function Icon({ src, className }: { src: string; className?: string }) {
  return (
    <span className={`relative block size-6 overflow-clip ${className ?? ""}`}>
      <img src={src} alt="" className="size-full" />
    </span>
  );
}

const quickActions = [
  {
    label: "Where's My Ride",
    href: "/dashboard/my-rides",
    icon: "quick-car.svg",
    tone: "bg-[#DBEAFE]",
  },
  {
    label: "Education Center",
    href: "/dashboard/education-center",
    icon: "quick-book.svg",
    tone: "bg-[#F3E8FF]",
  },
  {
    label: "Community",
    href: "/dashboard/community",
    icon: "quick-messages.svg",
    tone: "bg-[#DCFCE7]",
  },
  {
    label: "Before the ER™",
    href: "/dashboard/before-the-er",
    icon: "quick-info.svg",
    tone: "bg-[#FFE2E2]",
  },
];

const stats = [
  {
    label: "Journal Entries",
    value: "1,247",
    icon: "stat-users.svg",
    tone: "bg-[#DBEAFE]",
  },
  {
    label: "SMS Check-ins",
    value: "78%",
    icon: "stat-clipboard.svg",
    tone: "bg-[#EDFF9F]",
  },
  {
    label: "Curriculum Progress",
    value: "892",
    icon: "stat-book.svg",
    tone: "bg-[#F3E8FF]",
  },
  {
    label: "Classes Attended",
    value: "2",
    icon: "stat-video.svg",
    tone: "bg-[#D0FAE5]",
  },
];

const testimonials = [
  {
    name: "James Thompson",
    title: "From Fear to Hope: My Dialysis Journey",
  },
  {
    name: "James Thompson",
    title: "From Fear to Hope: My Dialysis Journey",
  },
  {
    name: "James Thompson",
    title: "From Fear to Hope: My Dialysis Journey",
  },
];

function greetingPrefix() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function UserDashboard() {
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0] || "Sarah";
  const greeting = useMemo(() => greetingPrefix(), []);
  const [isRideModalOpen, setIsRideModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      <h1 className="text-[32px] font-medium leading-none text-[#0F172A]">
        {greeting}, {firstName}
      </h1>

      <section>
        <h2 className="mb-3 text-lg font-medium tracking-[0.09px] text-[#344056]">
          Quick Action
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex min-h-[134px] flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-[25px] hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <span
                className={`flex size-12 items-center justify-center rounded-[14px] ${action.tone}`}
              >
                <Icon src={asset(action.icon)} />
              </span>
              <p className="text-base font-medium tracking-[0.08px] text-[#0F172A]">
                {action.label}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-xl border border-[#D6E6F2] bg-white p-3.5">
          <div className="flex items-center gap-2 py-2">
            <p className="flex-1 text-base font-medium tracking-[0.08px] text-[#0F172A]">
              Curriculum Progress
            </p>
            <Link
              href="/dashboard/education-center"
              className="flex items-center gap-2 text-sm font-medium tracking-[0.07px] text-[#2563EB]"
            >
              Week 1 of 8
              <Icon src={asset("arrow-right.svg")} />
            </Link>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
            <p className="text-base font-medium tracking-[0.08px] text-[#2563EB]">Week 1</p>
            <div className="mt-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-medium tracking-[0.09px] text-[#344056]">
                  Foundations of Awareness
                </p>
                <p className="shrink-0 text-sm font-medium tracking-[0.07px] text-[#4A4A68]">
                  25% complete
                </p>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#D7EDFF]">
                <div className="h-full w-1/4 rounded-full bg-[#2563EB]" />
              </div>
              <p className="mt-4 text-sm font-medium leading-5 tracking-[0.07px] text-[#344056]">
                You&apos;ve started reading the materials. Don&apos;t forget to complete the
                reflection exercise in your journal.
              </p>
            </div>
          </div>
        </article>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-[14px] border border-[#E2E8F0] bg-white p-px"
            >
              <div className="flex items-center justify-between px-6 pt-3">
                <p className="text-base font-medium tracking-[0.08px] text-[#344056]">
                  {stat.label}
                </p>
                <span
                  className={`flex size-10 items-center justify-center rounded-[10px] ${stat.tone}`}
                >
                  <Icon src={asset(stat.icon)} />
                </span>
              </div>
              <p className="px-6 pb-3 pt-4 text-2xl font-medium leading-8 tracking-[0.12px] text-[#0F172A]">
                {stat.value}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-start gap-4 rounded-2xl border border-[#BEDBFF] bg-[#F8FAFC] px-[25px] py-[25px] sm:flex-row sm:items-center">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-[#2563EB]">
          <Icon src={asset("class-video.svg")} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-5 text-[#4A5565]">Upcoming Live Class</p>
          <p className="text-lg font-medium tracking-[0.09px] text-[#0A0A0A]">
            Managing Dialysis Symptoms
          </p>
          <p className="text-sm leading-5 text-[#4A5565]">May 5, 2026 at 2:00 PM EST</p>
        </div>
        <button
          type="button"
          className="rounded bg-[#2563EB] px-3.5 py-3 text-base font-bold tracking-[0.08px] text-white"
        >
          Join Class
        </button>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-medium leading-7 text-[#0A0A0A]">
          Testimonials - You&apos;re Not Alone
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((item, index) => (
            <article
              key={`${item.name}-${index}`}
              className="overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white p-4 shadow-[0_0_60px_rgba(0,0,0,0.06)]"
            >
              <div className="relative h-[182px] overflow-hidden rounded-2xl">
                <Image
                  src={asset("testimonial.jpg")}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
                <span className="absolute left-1/2 top-1/2 flex size-[50px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90">
                  <Icon src={asset("play.svg")} />
                </span>
              </div>
              <p className="mt-4 text-sm leading-5 text-[#0A0A0A]">{item.name}</p>
              <p className="mt-1 text-xs leading-4 text-[#4A5565]">{item.title}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Where's My Ride Modal */}
      <WheresMyRideModal
        isOpen={isRideModalOpen}
        onClose={() => setIsRideModalOpen(false)}
      />
    </div>
  );
}
