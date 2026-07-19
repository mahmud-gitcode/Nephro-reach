"use client";

import React from "react";
import { X, ChevronRight, Calendar, User, Flag, MoreHorizontal } from "lucide-react";

export default function Engagement() {
  return (
    <section className="w-full bg-white py-20 md:py-24 scroll-mt-20">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center px-6 md:px-8 gap-10 md:gap-14">
        
        {/* Header Block */}
        <div className="text-center space-y-3 max-w-[840px]">
          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[13px] font-semibold text-blue-600">
            What's Include
          </span>
          <h2 className="text-[31px] leading-[1.06] sm:text-[40px] md:text-[46px] font-semibold text-slate-900 tracking-tight">
            Everything members need to stay engaged
          </h2>
          <p className="mx-auto max-w-[760px] text-[15px] leading-6 md:text-[16px] md:leading-7 text-slate-500 font-normal">
            NephroReach combines automated SMS check-ins, digital journaling, guided education, and class access in one simple non-clinical membership platform.
          </p>
        </div>

        {/* Content Row */}
        <div className="grid w-full grid-cols-1 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] items-start gap-10 lg:gap-16">
          
          {/* Left Column - Interactive UI Card Mockup */}
          <div className="w-full flex justify-center lg:justify-start">
            <div className="relative w-full max-w-[345px] sm:max-w-[380px] aspect-[1.05] rounded-[10px] bg-[#FFF6DC] overflow-hidden">
              
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.85),transparent_34%),radial-gradient(circle_at_85%_80%,rgba(255,223,140,0.34),transparent_28%)]" />

              {/* Mockup Card */}
              <div className="absolute inset-0 flex items-center justify-center p-5 sm:p-6">
                <div className="w-full bg-white rounded-[8px] border border-slate-100 shadow-[0_16px_45px_rgba(15,23,42,0.12)] overflow-hidden z-10">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-slate-400">check-in</span>
                    <button className="text-slate-300 hover:text-slate-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="px-4 py-4 space-y-4">
                    {/* Selector chips */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="border border-slate-200 bg-white rounded-[6px] px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium cursor-pointer">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Due date</span>
                      </div>
                      <div className="border border-slate-200 bg-white rounded-[6px] px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium cursor-pointer">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Assignee</span>
                      </div>
                      <div className="border border-slate-200 bg-white rounded-[6px] px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium cursor-pointer">
                        <Flag className="w-3.5 h-3.5 text-slate-400" />
                        <span>Priority</span>
                      </div>
                      <div className="border border-slate-200 bg-white rounded-[6px] p-1.5 flex items-center justify-center text-slate-500 cursor-pointer">
                        <MoreHorizontal className="w-3 h-3 text-slate-400" />
                      </div>
                    </div>

                    {/* Dropdown selectors */}
                    <div className="border border-slate-200 rounded-[6px] px-3.5 py-2.5 text-[11px] font-medium text-slate-500 flex items-center justify-between bg-white cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center">
                          <span className="text-[10px] text-amber-600 font-bold">📥</span>
                        </div>
                        <span>Inbox</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>

                    {/* Add task button */}
                    <div className="flex justify-end pt-2">
                      <button className="px-4 py-2 bg-[#2563EB] text-white font-semibold text-[11px] rounded-[6px] shadow-sm uppercase tracking-wide">
                        Add task
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Step by Step engagement items */}
          <div className="w-full space-y-12 text-left pt-1 lg:pt-4">
            
            {/* Item 1 */}
            <div className="space-y-2.5 max-w-[430px]">
              <span className="text-[#D97706] text-[12px] font-semibold uppercase tracking-wide">Start with ease</span>
              <h3 className="text-[26px] sm:text-[30px] leading-[1.08] font-medium text-slate-700 tracking-tight">Create your account in minutes</h3>
              <p className="text-[14px] sm:text-[15px] leading-6 text-slate-400 font-normal">
                Sign up with your email and phone number, choose your membership level, and receive your unique NephroReach member ID.
              </p>
            </div>

            {/* Item 2 */}
            <div className="space-y-2.5 max-w-[430px]">
              <span className="text-[#3E7C82] text-[12px] font-semibold uppercase tracking-wide">Build consistency</span>
              <h3 className="text-[26px] sm:text-[30px] leading-[1.08] font-medium text-slate-700 tracking-tight">Stay connected through weekly texts</h3>
              <p className="text-[14px] sm:text-[15px] leading-6 text-slate-400 font-normal">
                Receive automated educational SMS check-ins, reminders, and follow-up messages that help you stay engaged without needing real-time human support.
              </p>
            </div>

            {/* Item 3 */}
            <div className="space-y-2.5 max-w-[430px]">
              <span className="text-[#FB6A57] text-[12px] font-semibold uppercase tracking-wide">Learn at your pace</span>
              <h3 className="text-[26px] sm:text-[30px] leading-[1.08] font-medium text-slate-700 tracking-tight">Follow a guided 8-week education path</h3>
              <p className="text-[14px] sm:text-[15px] leading-6 text-slate-400 font-normal">
                Full members can access structured educational content designed to support steady learning, reflection, and continued engagement.
              </p>
            </div>

            {/* Item 4 */}
            <div className="space-y-2.5 max-w-[430px]">
              <span className="text-[#6C9F63] text-[12px] font-semibold uppercase tracking-wide">Reflect and participate</span>
              <h3 className="text-[26px] sm:text-[30px] leading-[1.08] font-medium text-slate-700 tracking-tight">Journal, learn, and join live classes</h3>
              <p className="text-[14px] sm:text-[15px] leading-6 text-slate-400 font-normal">
                Use your digital journal, respond to guided prompts, and register for monthly live educational classes based on your membership access.
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
