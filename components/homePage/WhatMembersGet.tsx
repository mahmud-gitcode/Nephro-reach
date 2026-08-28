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
      className="w-full scroll-mt-24 bg-[#F8FAFF] px-5 py-16 sm:px-10 lg:px-[72px] lg:py-20"
    >
      <div className="mx-auto flex w-full max-w-[1296px] flex-col gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-[28px] font-semibold leading-10 tracking-[0.18px] text-[#0F172A] sm:text-[36px]">
            What Members Get
          </h2>
          <p className="text-lg font-normal leading-8 tracking-[0.12px] text-[#344056] sm:text-2xl">
            everything you need to grow
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-start gap-[14px] rounded-[12px] border border-[#E2E8F0] bg-white p-6"
            >
              <div className="flex items-center rounded-lg bg-[#D7EDFF] p-2.5">
                <span className="relative block size-8 overflow-clip">
                  <img src={feature.icon} alt="" className="size-full" />
                </span>
              </div>
              <div className="flex w-full flex-col gap-3">
                <h3 className="text-xl font-medium leading-8 tracking-[0.12px] text-[#0F172A] sm:text-2xl">
                  {feature.title}
                </h3>
                <p className="text-lg font-normal leading-8 tracking-[0.12px] text-[#344056] sm:text-2xl">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
