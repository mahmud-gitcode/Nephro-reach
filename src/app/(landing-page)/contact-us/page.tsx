"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const sources = [
  { value: "search", label: "Search Engine" },
  { value: "social", label: "Social Media" },
  { value: "referral", label: "Referral" },
  { value: "other", label: "Other" },
];

const fieldShell =
  "w-full rounded-[12px] border border-[#D6E6F2] bg-white px-5 py-3 text-base font-medium leading-6 tracking-[0.08px] text-[#0F172A] shadow-[0_1px_1px_rgba(0,0,0,0.05)] outline-none placeholder:text-[#9A948D] focus:border-[#2563EB] focus:shadow-[0_0_0_4px_#D7EDFF]";

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    source: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Message sent successfully!");
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-sf text-[#0F172A]">
      <Header />

      <main className="relative w-full flex-grow overflow-hidden border-t border-[#E9EEF4] lg:h-[900px]">
        {/* Blurred colour washes behind the form */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-full w-[1440px] -translate-x-1/2"
        >
          <div className="absolute left-[505px] top-[-535px] size-[992px] rounded-full bg-[#55A8F5] opacity-70 blur-[198px]" />
          <div className="absolute left-[1287px] top-[-460px] size-[992px] rounded-full bg-[#FF0000] opacity-70 blur-[198px]" />

          {/* Two pale diagonal pills sweeping in from the lower left */}
          <div className="absolute left-[-116px] top-[-46px] flex h-[557px] w-[584px] items-center justify-center">
            <div className="flex-none -scale-y-100 rotate-[42.14deg] skew-x-[2.07deg]">
              <div className="h-[155px] w-[652px] rounded-[105px] bg-[#DBE9FE] opacity-[0.47]" />
            </div>
          </div>
          <div className="absolute left-[-290px] top-[73px] flex h-[600px] w-[629px] items-center justify-center">
            <div className="flex-none -scale-y-100 rotate-[42.14deg] skew-x-[2.07deg]">
              <div className="h-[167px] w-[703px] rounded-[105px] bg-[#DBE9FE] opacity-[0.47]" />
            </div>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[614px] flex-col gap-10 px-5 py-16 sm:px-0 lg:pb-0 lg:pt-[113px]">
          <div className="flex w-full flex-col items-start gap-4">
            <h1 className="text-[40px] font-medium leading-none tracking-[0.3px] text-[#0F172A] sm:text-[60px]">
              Get in <span className="text-[#2563EB]">Touch</span>
            </h1>
            <p className="font-poppins text-lg font-normal leading-7 tracking-[0.09px] text-[#344056]">
              <span className="sm:block">
                Have a question or need assistance? Reach out to us via email,{" "}
              </span>
              <span className="sm:block">
                phone, or the contact form below. We&apos;re eager to assist you.
              </span>
            </p>
            <p className="font-poppins text-base font-medium leading-6 tracking-[0.08px] text-[#64748B]">
              Nice hearing from you!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              required
              className={`h-[50px] ${fieldShell}`}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className={`h-[50px] ${fieldShell}`}
            />
            <textarea
              name="message"
              placeholder="Label"
              value={formData.message}
              onChange={handleChange}
              required
              className="h-[138px] w-full resize-none rounded-[8px] border border-[#C4CDD5] bg-white py-3 pl-4 pr-3 text-base font-medium leading-6 tracking-[0.08px] text-[#0F172A] shadow-[0_1px_1px_rgba(0,0,0,0.05)] outline-none placeholder:text-[#9A948D] focus:border-[#2563EB] focus:shadow-[0_0_0_4px_#D7EDFF]"
            />
            <div className="relative">
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                required
                className={`h-[50px] cursor-pointer appearance-none pr-14 ${fieldShell} ${
                  formData.source ? "text-[#0F172A]" : "text-[#9A948D]"
                }`}
              >
                <option value="" disabled>
                  How did you find us?
                </option>
                {sources.map((source) => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-5 top-1/2 block size-6 -translate-y-1/2">
                <img
                  src="/images/contact/arrow-down.svg"
                  alt=""
                  className="size-full"
                />
              </span>
            </div>
            <button
              type="submit"
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[4px] bg-[#2563EB] px-3.5 py-3 text-base font-bold leading-6 tracking-[0.08px] text-white transition-colors hover:bg-[#1D4ED8]"
            >
              Send
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
