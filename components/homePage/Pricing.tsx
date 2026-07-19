"use client";

import React from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";

export default function Pricing() {
  return (
    <section id="pricing" className="w-full bg-white py-16 md:py-24 scroll-mt-20">
      <div className="mx-auto max-w-[1404px] px-4 sm:px-6 lg:px-8">

        {/* Section Title */}
        <div className="text-center space-y-3 mb-16 max-w-3xl mx-auto">
          <span className="text-[#2563EB] text-sm font-bold tracking-widest uppercase">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Membership Options
          </h2>
          <p className="text-slate-500 text-base md:text-lg font-medium max-w-2xl mx-auto">
            Choose the path that fits your goals. Simple, transparent pricing.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">

          {/* Card 1: Class Purchase */}
          <div className="rounded-[32px] border border-slate-100 bg-[#F1F6FE] p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300">
            <div className="space-y-6">
              <div className="space-y-2 text-left">
                <h3 className="text-lg font-bold text-slate-800">Class Purchase</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">$10</span>
                  <span className="text-sm font-semibold text-slate-500">/Month</span>
                </div>
                <p className="text-sm text-slate-500 font-semibold pt-1">
                  Complete access to all platform features
                </p>
              </div>

              <div>
                <Link
                  href="/registration"
                  className="inline-block px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98]"
                >
                  Get Started
                </Link>
              </div>

              {/* Dotted Divider */}
              <div className="border-t border-dotted border-slate-300/80 pt-6">
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-rose-500">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                    <span>Digital Journal</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-rose-500">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                    <span>8-week educational curriculum</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                    <span>Monthly live classes</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-rose-500">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                    <span>Weekly SMS check-ins</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-rose-500">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                    <span>Community support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Card 2: Full Membership (Most Popular with Gradient Border & Top Bar) */}
          <div className="relative rounded-[34px] p-[2px] bg-[linear-gradient(180deg,#67C7D3_0%,#78A7D6_36%,#A7A0E8_68%,#F1D56C_100%)] shadow-xl md:scale-105 z-10">
            <div className="rounded-[32px] bg-white overflow-hidden flex flex-col justify-between h-full">
              {/* Top Most Popular Banner */}
              <div className="bg-[linear-gradient(90deg,#67C7D3_0%,#6A9AD6_100%)] text-white text-center py-2.5 text-xs font-bold tracking-wider uppercase">
                Most Popular
              </div>

              <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="space-y-2 text-left">
                    <h3 className="text-lg font-bold text-[#2563EB]">Full Membership</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-slate-900">$10</span>
                      <span className="text-sm font-semibold text-slate-500">/Month</span>
                    </div>
                    <p className="text-sm text-slate-500 font-semibold pt-1">
                      Complete access to all platform features
                    </p>
                  </div>

                  <Link
                    href="/registration"
                    className="w-full inline-flex h-11 items-center justify-center rounded-xl bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98]"
                  >
                    Get Started
                  </Link>

                  {/* Dotted Divider */}
                  <div className="border-t border-dotted border-slate-300/80 pt-6">
                    <ul className="space-y-4">
                      <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                        <span>Digital Journal</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                        <span>8-week educational curriculum</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                        <span>Monthly live classes</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                        <span>Weekly SMS check-ins</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                        <span>Community support</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Journal Only */}
          <div className="rounded-[32px] border border-slate-100 bg-[#F1F6FE] p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300">
            <div className="space-y-6">
              <div className="space-y-2 text-left">
                <h3 className="text-lg font-bold text-slate-800">Journal Only</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">$5</span>
                  <span className="text-sm font-semibold text-slate-500">/Month</span>
                </div>
                <p className="text-sm text-slate-500 font-semibold pt-1">
                  Complete access to all platform features
                </p>
              </div>

              <div>
                <Link
                  href="/registration"
                  className="inline-block px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98]"
                >
                  Get Started
                </Link>
              </div>

              {/* Dotted Divider */}
              <div className="border-t border-dotted border-slate-300/80 pt-6">
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                    <span>Digital Journal</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-rose-500">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                    <span>8-week educational curriculum</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-rose-500">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                    <span>Monthly live classes</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-rose-500">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                    <span>Weekly SMS check-ins</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-rose-500">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                    <span>Community support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
