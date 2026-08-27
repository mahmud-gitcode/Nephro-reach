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

export default function Footer() {
  return (
    <footer className="w-full bg-[#D7EDFF] px-5 py-16 sm:px-10 lg:px-[71px]">
      <div className="mx-auto flex w-full max-w-[1298px] flex-col gap-10">
        <div className="flex flex-col justify-between gap-10 lg:flex-row">
          <div className="max-w-[357px] space-y-5">
            <Image
              src="/images/home/footer-logo.svg"
              alt="NephroReach"
              width={86}
              height={68}
              className="h-[68px] w-[86px] object-contain"
            />
            <p className="text-base font-medium leading-5 text-[#344056]">
              A non-clinical educational engagement platform for SMS check-ins,
              digital journaling, structured learning, and monthly live classes.
            </p>
            <div className="flex items-center gap-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-[10px] bg-[#111827]"
                >
                  <img src={social.icon} alt="" className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-8 sm:flex-row sm:gap-12">
            <div className="w-[250px] space-y-4">
              <h4 className="text-sm font-semibold text-[#0F172A]">Platform</h4>
              <ul className="space-y-4 text-sm font-medium text-[#344056]">
                <li>
                  <Link href="/#how-it-works" className="hover:text-[#2563EB]">
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link href="/#features" className="hover:text-[#2563EB]">
                    Product
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-[#2563EB]">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/about-us" className="hover:text-[#2563EB]">
                    Resources
                  </Link>
                </li>
              </ul>
            </div>
            <div className="w-[250px] space-y-4">
              <h4 className="text-sm font-semibold text-[#0F172A]">Legal</h4>
              <ul className="space-y-4 text-sm font-medium text-[#344056]">
                <li>
                  <a href="#" className="hover:text-[#2563EB]">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#2563EB]">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <Link href="/contact-us" className="hover:text-[#2563EB]">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-[#CBD5ED]/70 pt-4 text-center text-sm font-medium text-[#344056]">
          © 2025 NephroReach. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
