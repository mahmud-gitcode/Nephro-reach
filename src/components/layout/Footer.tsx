"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const socials = [
  { href: "#", label: "Twitter", icon: "/images/home/twitter.svg" },
  { href: "#", label: "Instagram", icon: "/images/home/instagram.svg" },
  { href: "#", label: "LinkedIn", icon: "/images/home/linkedin.svg" },
  { href: "#", label: "YouTube", icon: "/images/home/youtube.svg" },
];

export default function Footer() {
  const { t } = useLanguage();

  const platformLinks = [
    { label: t("footer.howItWorks"), href: "/#how-it-works" },
    { label: t("footer.product"), href: "/#features" },
    { label: t("footer.pricing"), href: "/pricing" },
    { label: t("footer.aboutUs"), href: "/about-us" },
  ];

  const legalLinks = [
    { label: t("footer.privacy"), href: "#" },
    { label: t("footer.terms"), href: "#" },
    { label: t("footer.contact"), href: "/contact-us" },
  ];

  return (
    <footer className="font-sf w-full border-t border-slate-200 bg-[#F8FAFF] pt-16 pb-[84px]">
      <div className="mx-auto flex w-full max-w-[1344px] flex-col gap-10 px-5 min-[1344px]:px-0 sm:px-8 lg:px-12">
        <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
          <div className="flex w-full flex-col items-start gap-4 lg:w-[500px] lg:shrink-0">
            <Image
              src="/images/home/footer-logo.svg"
              alt="NephroReach"
              width={86}
              height={68}
              className="h-[67.882px] w-[86px] object-contain"
            />
            <p className="text-[16px] leading-relaxed font-medium tracking-[0.07px] text-[#344056]">
              {t("footer.description")}
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
              <h3 className="flex w-full items-start text-[16px] leading-6 font-semibold tracking-[0.07px] text-[#0F172A] sm:w-[250px]">
                {t("footer.platform")}
              </h3>
              <ul className="flex w-full flex-col items-start gap-3 sm:w-[250px]">
                {platformLinks.map((link) => (
                  <li key={link.label} className="w-full">
                    <Link
                      href={link.href}
                      className="text-[16px] leading-6 font-medium tracking-[0.07px] text-[#344056] transition-colors hover:text-[#2563EB]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-start gap-4">
              <h3 className="flex w-full items-start text-[16px] leading-6 font-semibold tracking-[0.07px] text-[#0F172A] sm:w-[250px]">
                {t("footer.legal")}
              </h3>
              <ul className="flex flex-col items-start gap-3">
                {legalLinks.map((link) => (
                  <li key={link.label} className="w-full sm:w-[250px]">
                    <Link
                      href={link.href}
                      className="text-[16px] leading-6 font-medium tracking-[0.07px] text-[#344056] transition-colors hover:text-[#2563EB]"
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
          <p className="text-[16px] leading-6 font-medium tracking-[0.07px] text-[#1D4ED8]">
            © {new Date().getFullYear()} NephroReach. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
