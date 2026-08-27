"use client";

import React from "react";

const features = [
  {
    title: "Daily SMS Prompts",
    desc: "Carefully crafted questions sent to your phone to spark reflection and mindfulness throughout your day.",
    icon: "/images/home/feat-sms.svg",
  },
  {
    title: "Digital Journal",
    desc: "A beautiful, private space where all your SMS replies are automatically saved and organized by date.",
    icon: "/images/home/feat-book.svg",
  },
  {
    title: "Monthly Classes",
    desc: "Live, expert-led sessions focusing on personal growth, habit building, and intentional living.",
    icon: "/images/home/feat-calendar.svg",
  },
  {
    title: "Progress Tracking",
    desc: "Look back at your entries over time to see patterns, growth, and shifts in your perspective.",
    icon: "/images/home/feat-chart.svg",
  },
  {
    title: "Community Access",
    desc: "Connect with other members in our moderated forum to share insights and discuss class topics.",
    icon: "/images/home/feat-users.svg",
  },
  {
    title: "Private & Secure",
    desc: "Your reflections are yours alone. We use industry-standard encryption to keep your journal safe.",
    icon: "/images/home/feat-lock.svg",
  },
];

export default function WhatMembersGet() {
  return (
    <section
      id="features"
      className="w-full scroll-mt-24 bg-[#F1F5FA] px-5 py-16 sm:px-10 lg:px-[71px] lg:py-20"
    >
      <div className="mx-auto flex w-full max-w-[1298px] flex-col gap-14">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-lg font-medium text-[#2563EB]">What You Get</p>
          <h2 className="text-[28px] font-semibold leading-10 text-[#0F172A] sm:text-[36px]">
            What Members Get
          </h2>
          <p className="text-lg font-medium leading-8 text-[#344056] sm:text-xl">
            everything you need to grow
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-[#E2E8F0] bg-white p-6"
            >
              <div className="mb-4 flex size-[52px] items-center justify-center rounded-lg bg-[#D7EDFF]">
                <span className="relative block size-8 overflow-clip">
                  <img src={feature.icon} alt="" className="size-full" />
                </span>
              </div>
              <h3 className="mb-3 text-xl font-medium leading-8 text-[#0F172A]">
                {feature.title}
              </h3>
              <p className="text-base font-medium leading-6 text-[#344056]">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
