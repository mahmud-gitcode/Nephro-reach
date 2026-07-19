"use client";

import React from "react";
import { X, ChevronRight, Calendar, User, Flag, MoreHorizontal } from "lucide-react";

export default function Engagement() {
  return (
    <section className="py-24 w-full bg-white flex flex-col items-center gap-[48px] scroll-mt-20">
      <div className="max-w-[1440px] w-full mx-auto px-6 md:px-[71px] flex flex-col items-center gap-[48px]">
        
        {/* Header Block */}
        <div className="text-center space-y-3 max-w-4xl">
          <span className="text-blue-600 text-sm font-bold tracking-widest uppercase">What's Include</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">Everything members need to stay engaged</h2>
          <p className="text-slate-500 text-base md:text-lg font-medium max-w-3xl mx-auto">
            NephroReach combines automated SMS check-ins, digital journaling, guided education, and class access in one simple non-clinical membership platform.
          </p>
        </div>

        {/* Content Row */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-[48px] w-full mt-8">
          
          {/* Left Column - Interactive UI Card Mockup */}
          <div className="w-full lg:w-[48%] flex justify-center sticky top-24">
            <div className="w-full max-w-[460px] aspect-[1.1] bg-[#FFFBEB] rounded-[36px] border border-amber-100 flex items-center justify-center p-8 relative overflow-hidden">
              
              {/* Mockup Card */}
              <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-10">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-400">check-in</span>
                  <button className="text-slate-300 hover:text-slate-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Body */}
                <div className="p-5 space-y-5">
                  {/* Selector chips */}
                  <div className="flex flex-wrap gap-2.5 items-center">
                    <div className="border border-slate-200 bg-white hover:bg-slate-50 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-slate-500 font-semibold cursor-pointer">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due date</span>
                    </div>
                    <div className="border border-slate-200 bg-white hover:bg-slate-50 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-slate-500 font-semibold cursor-pointer">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Assignee</span>
                    </div>
                    <div className="border border-slate-200 bg-white hover:bg-slate-50 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-slate-500 font-semibold cursor-pointer">
                      <Flag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Priority</span>
                    </div>
                    <div className="border border-slate-200 bg-white hover:bg-slate-50 rounded-lg p-2 flex items-center justify-center text-slate-500 cursor-pointer">
                      <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Dropdown selectors */}
                  <div className="border border-slate-200 rounded-lg px-4 py-3.5 text-xs font-semibold text-slate-500 flex items-center justify-between bg-white cursor-pointer hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center">
                        <span className="text-xs text-amber-600 font-bold">📥</span>
                      </div>
                      <span>Inbox</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* Add task button */}
                  <div className="flex justify-end pt-2">
                    <button className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-md transition-colors uppercase tracking-wider">
                      Add task
                    </button>
                  </div>
                </div>
              </div>

              {/* Decorative soft glowing backgrounds */}
              <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-amber-200/30 rounded-full blur-3xl -z-1" />
              <div className="absolute -top-20 -left-20 w-48 h-48 bg-orange-200/20 rounded-full blur-3xl -z-1" />
            </div>
          </div>

          {/* Right Column - Step by Step engagement items */}
          <div className="w-full lg:w-[48%] space-y-[48px] text-left">
            
            {/* Item 1 */}
            <div className="space-y-3">
              <span className="text-[#D97706] text-sm font-bold uppercase tracking-wider">Start with ease</span>
              <h3 className="text-3xl lg:text-[32px] font-extrabold text-[#1E293B] tracking-tight leading-tight">Create your account in minutes</h3>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-semibold">
                Sign up with your email and phone number, choose your membership level, and receive your unique NephroReach member ID.
              </p>
            </div>

            {/* Item 2 */}
            <div className="space-y-3">
              <span className="text-[#0D9488] text-sm font-bold uppercase tracking-wider">Build consistency</span>
              <h3 className="text-3xl lg:text-[32px] font-extrabold text-[#1E293B] tracking-tight leading-tight">Stay connected through weekly texts</h3>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-semibold">
                Receive automated educational SMS check-ins, reminders, and follow-up messages that help you stay engaged without needing real-time human support.
              </p>
            </div>

            {/* Item 3 */}
            <div className="space-y-3">
              <span className="text-[#EA580C] text-sm font-bold uppercase tracking-wider">Learn at your pace</span>
              <h3 className="text-3xl lg:text-[32px] font-extrabold text-[#1E293B] tracking-tight leading-tight">Follow a guided 8-week education path</h3>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-semibold">
                Full members can access structured educational content designed to support steady learning, reflection, and continued engagement.
              </p>
            </div>

            {/* Item 4 */}
            <div className="space-y-3">
              <span className="text-[#16A34A] text-sm font-bold uppercase tracking-wider">Reflect and participate</span>
              <h3 className="text-3xl lg:text-[32px] font-extrabold text-[#1E293B] tracking-tight leading-tight">Journal, learn, and join live classes</h3>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-semibold">
                Use your digital journal, respond to guided prompts, and register for monthly live educational classes based on your membership access.
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
