"use client";

import React from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";

export default function Pricing() {
  return (
    <section id="pricing" className="w-full bg-white py-20 md:py-24 scroll-mt-20">
      <div className="mx-auto max-w-[1180px] px-6 md:px-8">
        <div className="text-center space-y-3 mb-12 md:mb-16 max-w-[760px] mx-auto">
          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[13px] font-semibold text-blue-600">
            Pricing
          </span>
          <h2 className="text-[31px] leading-[1.06] sm:text-[40px] md:text-[46px] font-semibold text-slate-900 tracking-tight">
            Membership Options
          </h2>
          <p className="text-[15px] leading-6 md:text-[16px] md:leading-7 text-slate-500 font-normal max-w-[620px] mx-auto">
            Choose the path that fits your goals. Simple, transparent pricing.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        
        {/* Card 1 */}
        <div className="rounded-[32px] border border-slate-200 bg-[#EEF3FB] p-6 md:p-8 flex flex-col justify-between min-h-[520px]">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-[18px] font-semibold text-slate-700">Class Purchase</h3>
              <div className="flex items-end gap-2">
                <span className="text-[30px] md:text-[34px] font-semibold leading-none text-slate-900">$10</span>
                <span className="pb-1 text-[15px] text-slate-600 font-normal">/Month</span>
              </div>
              <p className="text-[15px] leading-6 text-slate-600 font-normal pt-2">
                Complete access to all platform features
              </p>
            </div>

            <Link
              href="/registration"
              className="inline-flex h-10 w-fit items-center justify-center rounded-[10px] bg-[#2F69E8] px-4 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-[#2459d1]"
            >
              Get Started
            </Link>

            <div className="border-t border-slate-200/80 pt-5">
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-[15px] text-slate-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white">
                    <X className="w-3.5 h-3.5 text-rose-400 stroke-[3]" />
                  </span>
                  <span>Digital Journal</span>
                </li>
                <li className="flex items-center gap-3 text-[15px] text-slate-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white">
                    <X className="w-3.5 h-3.5 text-rose-400 stroke-[3]" />
                  </span>
                  <span>8-week educational curriculum</span>
                </li>
                <li className="flex items-center gap-3 text-[15px] text-slate-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white">
                    <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                  </span>
                  <span>Monthly live classes</span>
                </li>
                <li className="flex items-center gap-3 text-[15px] text-slate-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white">
                    <X className="w-3.5 h-3.5 text-rose-400 stroke-[3]" />
                  </span>
                  <span>Weekly SMS check-ins</span>
                </li>
                <li className="flex items-center gap-3 text-[15px] text-slate-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white">
                    <X className="w-3.5 h-3.5 text-rose-400 stroke-[3]" />
                  </span>
                  <span>Community support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Card 2 - Most Popular */}
        <div className="relative rounded-[34px] p-[2px] bg-[linear-gradient(180deg,#67C7D3_0%,#78A7D6_36%,#A7A0E8_68%,#F1D56C_100%)] shadow-[0_16px_40px_rgba(59,130,246,0.10)] md:scale-[1.02] z-10">
          <div className="relative rounded-[32px] bg-white p-6 md:p-8 min-h-[520px]">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-[15px] bg-[linear-gradient(90deg,#67C7D3_0%,#6A9AD6_100%)] px-7 py-2 text-[13px] font-semibold text-white shadow-sm">
              Most Popular
            </div>

            <div className="space-y-6 pt-6">
              <div className="space-y-2">
                <h3 className="text-[18px] font-semibold text-[#2F69E8]">Full Membership</h3>
                <div className="flex items-end gap-2">
                  <span className="text-[32px] md:text-[36px] font-semibold leading-none text-slate-900">$10</span>
                  <span className="pb-1 text-[16px] text-slate-600 font-normal">/Month</span>
                </div>
                <p className="text-[15px] leading-6 text-slate-600 font-normal pt-2 max-w-[260px]">
                  Complete access to all platform features
                </p>
              </div>

              <Link
                href="/registration"
                className="inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-[#2F69E8] px-4 text-[14px] font-medium text-white shadow-[0_8px_20px_rgba(47,105,232,0.18)] transition-colors hover:bg-[#2459d1]"
              >
                Get Started
              </Link>

              <div className="border-t border-slate-200/80 pt-5">
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-[15px] text-slate-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
                      <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                    </span>
                    <span>Digital Journal</span>
                  </li>
                  <li className="flex items-center gap-3 text-[15px] text-slate-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
                      <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                    </span>
                    <span>8-week educational curriculum</span>
                  </li>
                  <li className="flex items-center gap-3 text-[15px] text-slate-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
                      <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                    </span>
                    <span>Monthly live classes</span>
                  </li>
                  <li className="flex items-center gap-3 text-[15px] text-slate-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
                      <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                    </span>
                    <span>Weekly SMS check-ins</span>
                  </li>
                  <li className="flex items-center gap-3 text-[15px] text-slate-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
                      <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                    </span>
                    <span>Community support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-[32px] border border-slate-200 bg-[#EEF3FB] p-6 md:p-8 flex flex-col justify-between min-h-[520px]">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-[18px] font-semibold text-slate-700">Journal Only</h3>
              <div className="flex items-end gap-2">
                <span className="text-[30px] md:text-[34px] font-semibold leading-none text-slate-900">$5</span>
                <span className="pb-1 text-[15px] text-slate-600 font-normal">/Month</span>
              </div>
              <p className="text-[15px] leading-6 text-slate-600 font-normal pt-2">
                Complete access to all platform features
              </p>
            </div>

            <Link
              href="/registration"
              className="inline-flex h-10 w-fit items-center justify-center rounded-[10px] bg-[#2F69E8] px-4 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-[#2459d1]"
            >
              Get Started
            </Link>

            <div className="border-t border-slate-200/80 pt-5">
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-[15px] text-slate-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white">
                    <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                  </span>
                  <span>Digital Journal</span>
                </li>
                <li className="flex items-center gap-3 text-[15px] text-slate-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white">
                    <X className="w-3.5 h-3.5 text-rose-400 stroke-[3]" />
                  </span>
                  <span>8-week educational curriculum</span>
                </li>
                <li className="flex items-center gap-3 text-[15px] text-slate-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white">
                    <X className="w-3.5 h-3.5 text-rose-400 stroke-[3]" />
                  </span>
                  <span>Monthly live classes</span>
                </li>
                <li className="flex items-center gap-3 text-[15px] text-slate-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white">
                    <X className="w-3.5 h-3.5 text-rose-400 stroke-[3]" />
                  </span>
                  <span>Weekly SMS check-ins</span>
                </li>
                <li className="flex items-center gap-3 text-[15px] text-slate-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white">
                    <X className="w-3.5 h-3.5 text-rose-400 stroke-[3]" />
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
