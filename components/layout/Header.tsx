"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLinkActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 transition-all duration-300">
      <div className="max-w-[1404px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo on the left */}
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

        {/* Right Grouped Nav Links and Action Buttons */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-8 text-sm font-semibold">
            <Link 
              href="/" 
              className={`transition-colors ${
                isLinkActive("/") && !pathname.includes("#")
                  ? "text-blue-600 font-bold"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              Home
            </Link>
            <Link 
              href="/faq" 
              className={`transition-colors ${
                isLinkActive("/faq")
                  ? "text-blue-600 font-bold"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              FAQ
            </Link>
            <Link 
              href="/about-us" 
              className={`transition-colors ${
                isLinkActive("/about-us")
                  ? "text-blue-600 font-bold"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              About us
            </Link>
            <Link 
              href="/pricing" 
              className={`transition-colors ${
                isLinkActive("/pricing")
                  ? "text-blue-600 font-bold"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-6">
            <div className="text-slate-300">|</div>
            <Link 
              href="/login" 
              className={`text-sm font-semibold transition-colors px-1 py-2 ${
                isLinkActive("/login") ? "text-blue-600 font-bold" : "text-slate-700 hover:text-blue-600"
              }`}
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

        {/* Mobile Hamburger Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <Link 
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-slate-700 hover:text-blue-600"
          >
            Home
          </Link>
          <Link 
            href="/faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-slate-700 hover:text-blue-600"
          >
            FAQ
          </Link>
          <Link 
            href="/about-us"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-slate-700 hover:text-blue-600"
          >
            About us
          </Link>
          <Link 
            href="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-slate-700 hover:text-blue-600"
          >
            Pricing
          </Link>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
            <Link 
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2.5 font-semibold text-slate-700 hover:text-blue-600"
            >
              Log in
            </Link>
            <Link 
              href="/registration"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-3 bg-[#2563EB] text-white font-bold rounded-xl shadow-md"
            >
              Try it free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
