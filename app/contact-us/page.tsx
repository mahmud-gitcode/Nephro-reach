"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    source: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Message sent successfully!");
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F9FBFF] overflow-hidden">
      <Header />
      
      <main className="relative flex-grow flex w-full">
        {/* Right side teal background block - approx 33% of screen */}
        <div className="absolute top-0 right-0 w-full lg:w-[33%] h-full bg-[#3AA5A5] z-0" />
        
        {/* Background diagonal graphics for left side */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[150%] bg-[#EAF2FF] transform rotate-[-45deg] z-0 hidden lg:block pointer-events-none" />
        
        {/* Main Content Flex Container */}
        <div className="w-full flex flex-col lg:flex-row relative z-10">
          
          {/* Left Column (Form) */}
          <div className="w-full lg:w-[55%] px-6 sm:px-12 md:px-[60px] lg:pl-[120px] py-16 md:py-24 flex flex-col justify-center bg-[#F9FBFF]/90 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none">
            <h1 className="text-4xl sm:text-[44px] md:text-[54px] font-bold text-[#1E293B] tracking-tight leading-tight mb-4">
              Get in <span className="text-[#2563EB]">Touch</span>
            </h1>
            <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed mb-2 max-w-lg">
              Have a question or need assistance? Reach out to us via email, phone, or the contact form below. We're eager to assist you.
            </p>
            <p className="text-slate-500 text-xs md:text-sm font-semibold mb-8">
              Nice hearing from you!
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm placeholder-slate-400 bg-white"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm placeholder-slate-400 bg-white"
              />
              <textarea
                name="message"
                placeholder="Label"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm placeholder-slate-400 bg-white resize-none"
              />
              <div className="relative">
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm text-slate-500 bg-white appearance-none cursor-pointer"
                >
                  <option value="" disabled>How did you find us?</option>
                  <option value="search">Search Engine</option>
                  <option value="social">Social Media</option>
                  <option value="referral">Referral</option>
                  <option value="other">Other</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4 stroke-[3]" />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all"
              >
                Send
              </button>
            </form>
          </div>
          
          {/* Right Column (Image) */}
          <div className="w-full lg:w-[45%] relative px-6 sm:px-12 md:px-[60px] lg:px-0 py-12 lg:py-20 flex justify-center items-center">
            {/* The image overlaps the white and teal sections precisely */}
            <div className="relative w-full max-w-[540px] aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] rounded-[32px] overflow-hidden shadow-2xl lg:-translate-x-[15%]">
              <Image
                src="/images/contactUs-top.png"
                alt="Get in Touch"
                fill
                className="object-cover"
              />
            </div>
          </div>
          
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
