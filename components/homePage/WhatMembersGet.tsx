"use client";

import React from "react";
import { MessageSquare, BookOpen, Calendar, TrendingUp, Users, Shield } from "lucide-react";

export default function WhatMembersGet() {
  return (
    <section id="features" className="w-full border-y border-slate-100 bg-[#EEF3FA] py-20 md:py-24">
      <div className="mx-auto max-w-[1180px] px-6 md:px-8">
        <div className="mb-12 md:mb-16 text-center space-y-3 max-w-[760px] mx-auto">
          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[13px] font-semibold text-blue-600">
            What You Fet
          </span>
          <h2 className="text-[31px] leading-[1.06] sm:text-[40px] md:text-[46px] font-semibold text-slate-900 tracking-tight">
            What Members Get
          </h2>
          <p className="mx-auto max-w-[540px] text-[15px] leading-6 md:text-[16px] md:leading-7 text-slate-600 font-normal">
            everything you need to grow
          </p>
        </div>

        {/* 3x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Card 1 */}
          <div className="rounded-[10px] border border-slate-200/70 bg-white p-6 md:p-7 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#DCEBFF] text-[#2F69E8]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="mb-3 text-[18px] font-semibold text-slate-900">
              Daily SMS Prompts
            </h3>
            <p className="text-[15px] leading-6 text-slate-600 font-normal">
              Carefully crafted questions sent to your phone to spark reflection and mindfulness throughout your day.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-[10px] border border-slate-200/70 bg-white p-6 md:p-7 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#DCEBFF] text-[#2F69E8]">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="mb-3 text-[18px] font-semibold text-slate-900">
              Digital Journal
            </h3>
            <p className="text-[15px] leading-6 text-slate-600 font-normal">
              A beautiful, private space where all your SMS replies are automatically saved and organized by date.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-[10px] border border-slate-200/70 bg-white p-6 md:p-7 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#DCEBFF] text-[#2F69E8]">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="mb-3 text-[18px] font-semibold text-slate-900">
              Monthly Classes
            </h3>
            <p className="text-[15px] leading-6 text-slate-600 font-normal">
              Live, expert-led sessions focusing on personal growth, habit building, and intentional living.
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-[10px] border border-slate-200/70 bg-white p-6 md:p-7 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#DCEBFF] text-[#2F69E8]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="mb-3 text-[18px] font-semibold text-slate-900">
              Progress Tracking
            </h3>
            <p className="text-[15px] leading-6 text-slate-600 font-normal">
              Look back at your entries over time to see patterns, growth, and shifts in your perspective.
            </p>
          </div>

          {/* Card 5 */}
          <div className="rounded-[10px] border border-slate-200/70 bg-white p-6 md:p-7 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#DCEBFF] text-[#2F69E8]">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="mb-3 text-[18px] font-semibold text-slate-900">
              Community Access
            </h3>
            <p className="text-[15px] leading-6 text-slate-600 font-normal">
              Connect with other members in our moderated forum to share insights and discuss class topics.
            </p>
          </div>

          {/* Card 6 */}
          <div className="rounded-[10px] border border-slate-200/70 bg-white p-6 md:p-7 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#DCEBFF] text-[#2F69E8]">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="mb-3 text-[18px] font-semibold text-slate-900">
              Private & Secure
            </h3>
            <p className="text-[15px] leading-6 text-slate-600 font-normal">
              Your reflections are yours alone. We use industry-standard encryption to keep your journal safe.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
