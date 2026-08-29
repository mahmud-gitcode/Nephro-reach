"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const socials = [
  { href: "#", label: "Twitter", icon: "/images/home/twitter.svg" },
  { href: "#", label: "Instagram", icon: "/images/home/instagram.svg" },
  { href: "#", label: "LinkedIn", icon: "/images/home/linkedin.svg" },
  { href: "#", label: "YouTube", icon: "/images/home/youtube.svg" },
];

const platformLinks = [
  { label: "How it Works", href: "/#how-it-works" },
  { label: "Product", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/about-us" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Contact", href: "/contact-us" },
];

export default function Footer() {
  return (
    <footer className="w-full bg-[#F8FAFF] px-5 pb-[84px] pt-16 font-sf sm:px-10 lg:px-[71px]">
      <div className="mx-auto flex w-full max-w-[1298px] flex-col gap-10">
        <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
          <div className="flex w-full flex-col items-start gap-4 lg:w-[500px] lg:shrink-0">
            <Image
              src="/images/home/footer-logo.svg"
              alt="NephroReach"
              width={86}
              height={68}
              className="h-[67.882px] w-[86px] object-contain"
            />
            <p className="text-[14px] font-medium leading-5 tracking-[0.07px] text-[#344056]">
              A non-clinical educational engagement platform for SMS check-ins,
              digital journaling, structured learning, and monthly live classes.
            </p>
            <div className="flex h-9 items-start gap-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-[10px] bg-[#2563EB] transition-colors hover:bg-[#1D4ED8]"
                >
                  <span className="relative block size-4 overflow-clip">
                    <img src={social.icon} alt="" className="size-full" />
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-8 self-stretch sm:flex-row sm:gap-[2px]">
            <div className="flex flex-col items-start gap-4">
              <h3 className="flex h-5 w-full items-start text-[14px] font-medium leading-5 tracking-[0.07px] text-[#0F172A] sm:w-[250px]">
                Platform
              </h3>
              <ul className="flex w-full flex-col items-start gap-3 sm:w-[250px]">
                {platformLinks.map((link) => (
                  <li key={link.label} className="h-6 w-full">
                    <Link
                      href={link.href}
                      className="text-[14px] font-medium leading-5 tracking-[0.07px] text-[#344056] hover:text-[#2563EB]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-start gap-4">
              <h3 className="flex h-5 w-full items-start text-[14px] font-medium leading-5 tracking-[0.07px] text-[#0F172A] sm:w-[250px]">
                Legal
              </h3>
              <ul className="flex flex-col items-start gap-3">
                {legalLinks.map((link) => (
                  <li key={link.label} className="h-6 w-full sm:w-[250px]">
                    <Link
                      href={link.href}
                      className="text-[14px] font-medium leading-5 tracking-[0.07px] text-[#344056] hover:text-[#2563EB]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex h-[53px] w-full items-center justify-center border-t border-[#DADADA] pt-px">
          <p className="text-[14px] font-medium leading-5 tracking-[0.07px] text-[#1D4ED8]">
            © 2025 NephroReach. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
