"use client";

import React from "react";
import Link from "next/link";

export default function ContactUs() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="bg-[#1E3A8A] rounded-[40px] text-white overflow-hidden relative flex flex-col md:flex-row items-center justify-between p-8 sm:p-12 md:p-16 gap-8 shadow-2xl">
        {/* Subtle curved graphics */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-amber-400/20 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-400/30 rounded-full blur-[120px] -z-10" />

        {/* Left side - Styled Support Avatar Vector */}
        <div className="w-full md:w-[48%] flex justify-center md:justify-start">
          <div className="relative flex items-center -space-x-4">
            <div className="w-16 h-16 rounded-full border-4 border-[#1E3A8A] bg-teal-500 overflow-hidden flex items-center justify-center text-white font-bold text-lg select-none">JS</div>
            <div className="w-16 h-16 rounded-full border-4 border-[#1E3A8A] bg-indigo-500 overflow-hidden flex items-center justify-center text-white font-bold text-lg select-none">MD</div>
            <div className="w-16 h-16 rounded-full border-4 border-[#1E3A8A] bg-rose-500 overflow-hidden flex items-center justify-center text-white font-bold text-lg select-none">AJ</div>
            <div className="w-16 h-16 rounded-full border-4 border-[#1E3A8A] bg-amber-500 overflow-hidden flex items-center justify-center text-white font-bold text-lg select-none">TL</div>
            <div className="w-16 h-16 rounded-full border-4 border-[#1E3A8A] bg-slate-600 overflow-hidden flex items-center justify-center text-white font-bold text-lg select-none">➕</div>
          </div>
        </div>

        {/* Middle/Right - CTA text and button */}
        <div className="w-full md:w-[48%] flex flex-col md:flex-row items-center md:justify-end gap-6 text-center md:text-right">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Still have questions?
          </h2>
          <Link 
            href="mailto:support@nephroreach.com"
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98] text-sm tracking-wide shrink-0"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
