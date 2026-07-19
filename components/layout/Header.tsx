"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 transition-all duration-300">
      <div className="max-w-[1404px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Image
            src="/images/logo.png"
            alt="NephroReach Logo"
            width={100}
            height={50}
            priority
            className="object-contain"
            style={{ height: "auto" }}
          />
        </Link>

        {/* Nav Links - Desktop */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700">
          <Link 
            href="/" 
            className="hover:text-blue-600 transition-colors"
          >
            Home
          </Link>
          <Link 
            href="/faq" 
            className="hover:text-blue-600 transition-colors"
          >
            FAQ
          </Link>
          <Link 
            href="/about-us" 
            className="hover:text-blue-600 transition-colors"
          >
            About us
          </Link>
          <Link 
            href="/#pricing" 
            className="hover:text-blue-600 transition-colors"
          >
            Pricing
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-slate-300">|</div>
          <Link 
            href="/login" 
            className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors px-3 py-2"
          >
            Log in
          </Link>
          <Link 
            href="/registration" 
            className="bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            Try it free
          </Link>
        </div>
      </div>
    </header>
  );
}
