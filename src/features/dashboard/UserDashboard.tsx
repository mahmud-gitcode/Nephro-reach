"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import WheresMyRideModal from "@/features/travel/WheresMyRideModal";
import { Button, Card, Progress } from "@/components/ui";
import { LocalSvg } from "@/components/icons/LocalSvg";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";

const asset = (name: string) => `/images/user-dashboard/${name}`;

function Icon({ src, className }: { src: string; className?: string }) {
  return (
    <span className={`relative block size-6 overflow-clip ${className ?? ""}`}>
      <LocalSvg src={src} alt="" className="size-full" />
    </span>
  );
}

/* Eight tints, all categories rather than states, so they come off the
   categorical ramp. They briefly borrowed the status surfaces, which made
   "Community" look like a success and "Classes Attended" like one too. */
const quickActions = [
  {
    label: "Where's My Ride",
    href: "/dashboard/my-rides",
    icon: "quick-car.svg",
    tone: "bg-cat-6-soft",
  },
  {
    label: "Education Center",
    href: "/dashboard/education-center",
    icon: "quick-book.svg",
    tone: "bg-cat-7-soft",
  },
  {
    label: "Community",
    href: "/dashboard/community",
    icon: "quick-messages.svg",
    tone: "bg-cat-4-soft",
  },
  {
    label: "Before the ER™",
    href: "/dashboard/before-the-er",
    icon: "quick-info.svg",
    tone: "bg-cat-1-soft",
  },
];

const stats = [
  {
    label: "Journal Entries",
    value: "1,247",
    icon: "stat-users.svg",
    tone: "bg-cat-6-soft",
  },
  {
    label: "Notification Check-ins",
    value: "78%",
    icon: "stat-clipboard.svg",
    tone: "bg-cat-3-soft",
  },
  {
    label: "Curriculum Progress",
    value: "892",
    icon: "stat-book.svg",
    tone: "bg-cat-7-soft",
  },
  {
    label: "Classes Attended",
    value: "2",
    icon: "stat-video.svg",
    tone: "bg-cat-5-soft",
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

type GreetingStrings = {
  greetingMorning?: string;
  greetingAfternoon?: string;
  greetingEvening?: string;
};

function getGreeting(dh?: GreetingStrings) {
  const hour = new Date().getHours();
  if (hour < 12) return dh?.greetingMorning || "Good morning";
  if (hour < 17) return dh?.greetingAfternoon || "Good afternoon";
  return dh?.greetingEvening || "Good evening";
}

export default function UserDashboard() {
  const { user } = useAuth();
  const { language, dictionary } = useLanguage();
  const dh = dictionary?.dashboardHome;
  const firstName = user?.name.split(" ")[0] || "Sarah";
  const greeting = useMemo(() => getGreeting(dh), [dh]);
  const [isRideModalOpen, setIsRideModalOpen] = useState(false);

  const getQuickActionLabel = (action: (typeof quickActions)[0]) => {
    switch (action.href) {
      case "/dashboard/my-rides":
        return dh?.quickActions?.wheresMyRide || action.label;
      case "/dashboard/education-center":
        return dh?.quickActions?.educationCenter || action.label;
      case "/dashboard/community":
        return dh?.quickActions?.community || action.label;
      case "/dashboard/before-the-er":
        return dh?.quickActions?.beforeTheEr || action.label;
      default:
        return action.label;
    }
  };

  const getStatLabel = (statKey: string, fallback: string) => {
    switch (statKey) {
      case "Journal Entries":
        return dh?.stats?.journalEntries || fallback;
      case "Notification Check-ins":
      case "SMS Check-ins":
        return dh?.stats?.smsCheckIns || fallback;
      case "Curriculum Progress":
        return dh?.stats?.curriculumProgress || fallback;
      case "Classes Attended":
        return dh?.stats?.classesAttended || fallback;
      default:
        return fallback;
    }
  };

  return (
    <div className="space-y-stack-lg">
      <h1 className="text-heading-1 text-fg">
        {greeting}, {firstName}
      </h1>

      <section>
        <h2 className="mb-stack-md text-heading-5 text-fg-secondary">
          {dh?.quickActionTitle ||
            (language === "ES" ? "Acción Rápida" : "Quick Action")}
        </h2>
        <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const label = getQuickActionLabel(action);

            return (
              <Link
                key={action.label}
                href={action.href}
                className="flex min-h-[134px] flex-col gap-inline-lg rounded-card border border-line bg-surface p-inset-lg transition-colors duration-150 ease-standard hover:border-line-strong hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span
                  aria-hidden="true"
                  className={`flex size-12 items-center justify-center rounded-card ${action.tone}`}
                >
                  <Icon src={asset(action.icon)} />
                </span>
                <p className="text-body-md text-fg">{label}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-inset-lg xl:grid-cols-2">
        <Card as="article" padding="small">
          <div className="flex items-center gap-inline-md py-inset-xs">
            <p className="flex-1 text-body-md text-fg">
              {dh?.curriculum?.title || "Curriculum Progress"}
            </p>
            <Link
              href="/dashboard/education-center"
              className="flex items-center gap-inline-md rounded-control-small text-label-md text-fg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {dh?.curriculum?.weekBadge || "Day 1 of 21"}
              <Icon src={asset("arrow-right.svg")} />
            </Link>
          </div>
          <Card tone="sunken" padding="small">
            <p className="text-body-md text-fg-brand">
              {dh?.curriculum?.weekLabel || "Day 1"}
            </p>
            <div className="mt-stack-lg">
              <div className="flex items-center justify-between gap-inline-lg">
                <p className="text-heading-5 text-fg-secondary">
                  {dh?.curriculum?.moduleTitle || "Foundations of Awareness"}
                </p>
                <p className="shrink-0 text-label-md text-fg-muted">
                  {dh?.curriculum?.completed || "25% complete"}
                </p>
              </div>
              <Progress
                value={25}
                label={dh?.curriculum?.title || "Curriculum Progress"}
                className="mt-stack-sm"
              />
              <p className="mt-stack-lg measure text-body-sm text-fg-secondary">
                {dh?.curriculum?.description ||
                  "You've started reading the materials. Don't forget to complete the reflection exercise in your journal."}
              </p>
            </div>
          </Card>
        </Card>

        <div className="grid grid-cols-1 gap-inset-lg sm:grid-cols-2">
          {stats.map((stat) => (
            <Card
              as="article"
              key={stat.label}
              padding="none"
              className="p-inset-md"
            >
              <div className="flex items-center justify-between gap-inline-md">
                <p className="text-body-md text-fg-secondary">
                  {getStatLabel(stat.label, stat.label)}
                </p>
                <span
                  aria-hidden="true"
                  className={`flex size-10 items-center justify-center rounded-control ${stat.tone}`}
                >
                  <Icon src={asset(stat.icon)} />
                </span>
              </div>
              <p className="mt-stack-lg text-metric-sm text-fg">{stat.value}</p>
            </Card>
          ))}
        </div>
      </section>

      <Card
        as="section"
        tone="flat"
        padding="none"
        className="flex flex-col items-start gap-inset-md border-primary-soft-line bg-surface-sunken p-inset-lg sm:flex-row sm:items-center"
      >
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-card bg-primary-solid"
        >
          <Icon src={asset("class-video.svg")} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body-sm text-fg-muted">
            {dh?.upcomingClass?.badge || "Upcoming Live Class"}
          </p>
          <p className="text-heading-5 text-fg">
            {dh?.upcomingClass?.title || "Managing Dialysis Symptoms"}
          </p>
          <p className="text-body-sm text-fg-muted">
            {dh?.upcomingClass?.datetime || "May 5, 2026 at 2:00 PM EST"}
          </p>
        </div>
        <Button {...notBuiltYet("Joining a class")}>
          {dh?.upcomingClass?.joinButton || "Join Class"}
        </Button>
      </Card>

      <section>
        <div className="mb-stack-lg flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-heading-4 text-fg">
            {dh?.testimonials?.title || "Testimonials - You're Not Alone"}
          </h2>
          <Link
            href="/dashboard/reviews"
            className="inline-flex items-center gap-inline-sm rounded-control-small text-label-md text-fg-brand transition-colors duration-150 ease-standard hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Star
              aria-hidden="true"
              className="h-4 w-4 fill-warning-500 text-warning-500"
            />
            {language === "ES" ? "Dejar una Reseña" : "Leave a Review"}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-inset-lg md:grid-cols-3">
          {testimonials.map((item, index) => (
            <Card
              as="article"
              key={`${item.name}-${index}`}
              padding="small"
              className="overflow-hidden"
            >
              <div className="relative h-[182px] max-w-full overflow-hidden rounded-card">
                <Image
                  src={asset("testimonial.jpg")}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 left-1/2 flex size-[50px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill bg-surface/90"
                >
                  <Icon src={asset("play.svg")} />
                </span>
              </div>
              <p className="mt-stack-lg text-label-md text-fg">{item.name}</p>
              <p className="mt-stack-xs text-caption text-fg-muted">
                {dh?.testimonials?.storyTitle || item.title}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Where's My Ride Modal.
          NOTE: nothing on this page sets isRideModalOpen — the Quick Action
          tile is a <Link> to /dashboard/my-rides instead. Left wired so the
          modal can be opened from here once that is decided. */}
      <WheresMyRideModal
        isOpen={isRideModalOpen}
        onClose={() => setIsRideModalOpen(false)}
      />
    </div>
  );
}
