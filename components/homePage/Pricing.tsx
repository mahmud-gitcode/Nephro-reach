"use client";

import React from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
      <div className="text-center space-y-3 mb-16">
        <span className="text-blue-600 text-sm font-bold tracking-widest uppercase">Pricing</span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Membership Options</h2>
        <p className="text-slate-500 text-base max-w-2xl mx-auto font-medium">
          Choose the path that fits your goals. Simple, transparent pricing.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
        
        {/* Card 1 */}
        <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100/80 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-800">Class Purchase</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">$10</span>
                <span className="text-slate-400 text-sm font-semibold">/Month</span>
              </div>
              <p className="text-slate-400 text-xs font-medium">Complete access to all platform features</p>
            </div>
            
            <Link 
              href="/registration"
              className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-center rounded-xl shadow-md shadow-blue-500/10 hover:shadow-blue-500/15 transition-all active:scale-[0.98] text-sm"
            >
              Get Started
            </Link>

            <hr className="border-slate-100" />

            <ul className="space-y-3.5">
              <li className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                <X className="w-4 h-4 text-rose-500 stroke-[3]" />
                <span>Digital Journal</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                <X className="w-4 h-4 text-rose-500 stroke-[3]" />
                <span>8-week educational curriculum</span>
              </li>
              <li className="flex items-center gap-3 text-slate-700 text-sm font-bold">
                <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                <span>Monthly live classes</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                <X className="w-4 h-4 text-rose-500 stroke-[3]" />
                <span>Weekly SMS check-ins</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                <X className="w-4 h-4 text-rose-500 stroke-[3]" />
                <span>Community support</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Card 2 - Most Popular */}
        <div className="bg-white rounded-3xl p-8 border-2 border-blue-500 flex flex-col justify-between shadow-xl relative scale-102 z-10">
          {/* Tag */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
            Most Popular
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-blue-600">Full Membership</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">$10</span>
                <span className="text-slate-400 text-sm font-semibold">/Month</span>
              </div>
              <p className="text-slate-400 text-xs font-medium">Complete access to all platform features</p>
            </div>
            
            <Link 
              href="/registration"
              className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-center rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/25 transition-all active:scale-[0.98] text-sm"
            >
              Get Started
            </Link>

            <hr className="border-slate-100" />

            <ul className="space-y-3.5">
              <li className="flex items-center gap-3 text-slate-700 text-sm font-bold">
                <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                <span>Digital Journal</span>
              </li>
              <li className="flex items-center gap-3 text-slate-700 text-sm font-bold">
                <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                <span>8-week educational curriculum</span>
              </li>
              <li className="flex items-center gap-3 text-slate-700 text-sm font-bold">
                <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                <span>Monthly live classes</span>
              </li>
              <li className="flex items-center gap-3 text-slate-700 text-sm font-bold">
                <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                <span>Weekly SMS check-ins</span>
              </li>
              <li className="flex items-center gap-3 text-slate-700 text-sm font-bold">
                <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                <span>Community support</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100/80 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-800">Journal Only</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">$5</span>
                <span className="text-slate-400 text-sm font-semibold">/Month</span>
              </div>
              <p className="text-slate-400 text-xs font-medium">Complete access to all platform features</p>
            </div>
            
            <Link 
              href="/registration"
              className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-center rounded-xl shadow-md shadow-blue-500/10 hover:shadow-blue-500/15 transition-all active:scale-[0.98] text-sm"
            >
              Get Started
            </Link>

            <hr className="border-slate-100" />

            <ul className="space-y-3.5">
              <li className="flex items-center gap-3 text-slate-700 text-sm font-bold">
                <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                <span>Digital Journal</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                <X className="w-4 h-4 text-rose-500 stroke-[3]" />
                <span>8-week educational curriculum</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                <X className="w-4 h-4 text-rose-500 stroke-[3]" />
                <span>Monthly live classes</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                <X className="w-4 h-4 text-rose-500 stroke-[3]" />
                <span>Weekly SMS check-ins</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                <X className="w-4 h-4 text-rose-500 stroke-[3]" />
                <span>Community support</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}
