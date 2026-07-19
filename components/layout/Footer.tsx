"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#DDE9FA] border-t border-blue-100/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1404px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Logo & Description */}
        <div className="md:col-span-2 space-y-6">
          <Image
            src="/images/logo.png"
            alt="NephroReach Logo"
            width={160}
            height={50}
            priority
            className="object-contain"
          />
          <p className="text-slate-600 text-sm leading-relaxed max-w-sm font-semibold">
            A non-clinical educational engagement platform for SMS check-ins, digital journaling, structured learning, and monthly live classes.
          </p>
          
          {/* Social Icons - Dark Rounded Buttons */}
          <div className="flex items-center gap-3">
            {/* Twitter/X */}
            <a 
              href="#" 
              aria-label="Twitter"
              className="w-9 h-9 rounded-lg bg-[#1E293B] text-white hover:bg-blue-600 transition-colors flex items-center justify-center shadow-sm"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>

            {/* Instagram */}
            <a 
              href="#" 
              aria-label="Instagram"
              className="w-9 h-9 rounded-lg bg-[#1E293B] text-white hover:bg-blue-600 transition-colors flex items-center justify-center shadow-sm"
            >
              <svg className="w-4 h-4 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>

            {/* LinkedIn */}
            <a 
              href="#" 
              aria-label="LinkedIn"
              className="w-9 h-9 rounded-lg bg-[#1E293B] text-white hover:bg-blue-600 transition-colors flex items-center justify-center shadow-sm"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.82a1.4 1.4 0 1 0 1.4 1.4 1.41 1.41 0 0 0-1.4-1.4z"/>
              </svg>
            </a>

            {/* YouTube */}
            <a 
              href="#" 
              aria-label="YouTube"
              className="w-9 h-9 rounded-lg bg-[#1E293B] text-white hover:bg-blue-600 transition-colors flex items-center justify-center shadow-sm"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Platform Links */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-900 tracking-wider">Platform</h4>
          <ul className="space-y-3 text-sm text-slate-600 font-semibold">
            <li><Link href="/#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</Link></li>
            <li><Link href="/#features" className="hover:text-blue-600 transition-colors">Product</Link></li>
            <li><Link href="/#pricing" className="hover:text-blue-600 transition-colors">Pricing</Link></li>
            <li><Link href="/about-us" className="hover:text-blue-600 transition-colors">About Us</Link></li>
            <li><Link href="/faq" className="hover:text-blue-600 transition-colors">FAQ</Link></li>
          </ul>
        </div>

        {/* Legal Links */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-900 tracking-wider">Legal</h4>
          <ul className="space-y-3 text-sm text-slate-600 font-semibold">
            <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
            <li><a href="mailto:support@nephroreach.com" className="hover:text-blue-600 transition-colors">Contact</a></li>
          </ul>
        </div>

      </div>

      <div className="max-w-[1404px] mx-auto mt-12 pt-8 border-t border-slate-300/40 text-center text-xs text-slate-600 font-semibold">
        <span>© 2025 DropClicker. All rights reserved.</span>
      </div>
    </footer>
  );
}
