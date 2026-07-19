"use client";

import React from "react";
import { X, ChevronRight } from "lucide-react";

export default function Engagement() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <span className="text-blue-600 text-sm font-bold tracking-widest uppercase">What's Include</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Everything members need to stay engaged</h2>
          <p className="text-slate-500 text-base max-w-3xl mx-auto font-medium">
            NephroReach combines automated SMS check-ins, digital journaling, guided education, and class access in one simple non-clinical membership platform.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Side - Interactive UI Card Mockup */}
          <div className="w-full lg:w-[48%] flex justify-center">
            <div className="w-full max-w-[440px] bg-gradient-to-tr from-amber-100/40 to-orange-100/30 p-8 rounded-[36px] shadow-[0_15px_40px_rgba(251,191,36,0.05)] border border-amber-200/30 flex items-center justify-center relative overflow-hidden">
              
              {/* Mockup Card */}
              <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-10">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">check-in</span>
                  <button className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-5 space-y-4">
                  {/* Fake form selectors */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="border border-slate-100 bg-slate-50/50 rounded-lg p-2.5 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Due date</span>
                      <span className="text-xs font-semibold text-slate-700 mt-1">Today</span>
                    </div>
                    <div className="border border-slate-100 bg-slate-50/50 rounded-lg p-2.5 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Assignee</span>
                      <span className="text-xs font-semibold text-slate-700 mt-1">Me</span>
                    </div>
                    <div className="border border-slate-100 bg-slate-50/50 rounded-lg p-2.5 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Priority</span>
                      <span className="text-xs font-semibold text-slate-700 mt-1">High</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Inbox</label>
                    <div className="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-700 flex items-center justify-between">
                      <span>Personal Care Journal</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors uppercase tracking-wider">
                    Add task
                  </button>
                </div>
              </div>

              {/* Floating decor circle */}
              <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-amber-200/30 rounded-full blur-3xl -z-1" />
            </div>
          </div>

          {/* Right Side - Step by Step engagement items */}
          <div className="w-full lg:w-[48%] space-y-8 text-left">
            
            {/* Item 1 */}
            <div className="space-y-2">
              <span className="text-amber-600 text-xs font-bold uppercase tracking-wider">Start with ease</span>
              <h3 className="text-xl font-bold text-slate-900">Create your account in minutes</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Sign up with your email and phone number, choose your membership level, and receive your unique NephroReach member ID.
              </p>
            </div>

            {/* Item 2 */}
            <div className="space-y-2">
              <span className="text-teal-600 text-xs font-bold uppercase tracking-wider">Build consistency</span>
              <h3 className="text-xl font-bold text-slate-900">Stay connected through weekly texts</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Receive automated educational SMS check-ins, reminders, and follow-up messages that help you stay engaged without needing real-time human support.
              </p>
            </div>

            {/* Item 3 */}
            <div className="space-y-2">
              <span className="text-orange-600 text-xs font-bold uppercase tracking-wider">Learn at your pace</span>
              <h3 className="text-xl font-bold text-slate-900">Follow a guided 8-week education path</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Full members can access structured educational content designed to support steady learning, reflection, and continued engagement.
              </p>
            </div>

            {/* Item 4 */}
            <div className="space-y-2">
              <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">Reflect and participate</span>
              <h3 className="text-xl font-bold text-slate-900">Journal, learn, and join live classes</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Use your digital journal, respond to guided prompts, and register for monthly live educational classes based on your membership access.
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
