"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { DEMO_ACCOUNTS, USER_HOME } from "@/lib/auth";

const inputClassName =
  "h-12 w-full rounded border border-[#CBD5ED] bg-white py-3 pl-4 pr-3 text-base leading-6 tracking-[0.08px] text-[#0F172A] outline-none placeholder:text-[#64748B] focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBE9FE]";

const labelClassName =
  "text-base font-medium leading-6 tracking-[0.08px] text-[#0F172A]";

export default function RegistrationPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { register, loginAs } = useAuth();
  const { language, setLanguage, dictionary } = useLanguage();
  const s = dictionary?.signup;
  const router = useRouter();

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-white font-sf">
      {/* Top right language switcher */}
      <div className="absolute right-5 top-5 sm:right-8 sm:top-8 z-30">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-1.5 rounded-xl border-b-2 border-[#111827] bg-[#F1F5FA] p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-colors hover:bg-slate-100"
            aria-label="Change language"
          >
            <img
              src={
                language === "ES"
                  ? "/images/dashboard-header/spain-flag.svg"
                  : "/images/dashboard-header/usa-flag.svg"
              }
              alt={language === "ES" ? "Español" : "English"}
              className="h-6 w-[33px] rounded-xs object-cover"
            />
            <img
              src="/images/dashboard-header/arrow-down.svg"
              alt=""
              className={`size-3 transition-transform duration-200 ${
                isLangOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isLangOpen && (
            <div className="absolute right-0 top-full mt-2 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-50">
              <button
                type="button"
                onClick={() => {
                  setLanguage("EN");
                  setIsLangOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm ${
                  language === "EN"
                    ? "bg-blue-50 font-semibold text-blue-600"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <img
                  src="/images/dashboard-header/usa-flag.svg"
                  alt=""
                  className="h-4 w-6 rounded-xs object-cover"
                />
                English
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage("ES");
                  setIsLangOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm ${
                  language === "ES"
                    ? "bg-blue-50 font-semibold text-blue-600"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <img
                  src="/images/dashboard-header/spain-flag.svg"
                  alt=""
                  className="h-4 w-6 rounded-xs object-cover"
                />
                Español
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-0 h-full w-[1440px] -translate-x-1/2">
          <div className="absolute left-[266px] top-[-398px] size-[992px] rounded-full bg-[#55A8F5] opacity-70 blur-[198px]" />
          <div className="absolute left-[1048px] top-[-323px] size-[992px] rounded-full bg-[#FF0000] opacity-70 blur-[198px]" />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1440px] items-center px-5 py-8 lg:px-8">
        <div className="flex w-full flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-8 xl:px-[142px]">
          {/* Left brand logo */}
          <div className="flex w-full max-w-[517px] flex-1 items-center justify-center lg:justify-start">
            <Link href="/" className="block w-full max-w-[517px]">
              <Image
                src="/images/registration/logo.svg"
                alt="NephroReach"
                width={517}
                height={408}
                priority
                className="h-auto max-h-[220px] w-full object-contain sm:max-h-[280px] lg:max-h-[408px]"
              />
            </Link>
          </div>

          {/* Right registration form */}
          <div className="w-full max-w-[538px] shrink-0">
            <div className="flex w-full flex-col items-start gap-3 px-0 sm:px-5">
              <h1 className="text-[36px] font-medium leading-10 tracking-[0.18px] text-[#0F172A]">
                {s?.title || "Personal Details"}
              </h1>

              <form
                className="flex w-full flex-col gap-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (password.length < 8) {
                    setError(
                      s?.errors?.passwordLength ||
                        "Password must be at least 8 characters."
                    );
                    return;
                  }
                  if (password !== confirmPassword) {
                    setError(
                      s?.errors?.passwordMismatch ||
                        "Passwords do not match."
                    );
                    return;
                  }
                  if (!agreed) {
                    setError(
                      s?.errors?.termsRequired ||
                        "Please agree to the terms to continue."
                    );
                    return;
                  }
                  const result = register({ name, email, password });
                  if (result === "exists") {
                    setError(
                      s?.errors?.emailExists ||
                        "That email is already registered. Sign in instead."
                    );
                    return;
                  }
                  router.push(USER_HOME);
                }}
              >
                <div className="flex w-full flex-col gap-3.5">
                  <div className="flex w-full flex-col gap-2">
                    <label htmlFor="full-name" className={labelClassName}>
                      {s?.nameLabel || "Full Name"}
                    </label>
                    <input
                      id="full-name"
                      type="text"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        setError("");
                      }}
                      placeholder={s?.namePlaceholder || "Example"}
                      className={inputClassName}
                      autoComplete="name"
                    />
                  </div>

                  <div className="flex w-full flex-col gap-2">
                    <label htmlFor="email" className={labelClassName}>
                      {s?.emailLabel || "Email Address"}
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError("");
                      }}
                      placeholder={s?.emailPlaceholder || "Example@email.com"}
                      className={inputClassName}
                      autoComplete="email"
                    />
                  </div>

                  <div className="flex w-full flex-col gap-2">
                    <label htmlFor="phone" className={labelClassName}>
                      {s?.phoneLabel || "Phone Number"}
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder={s?.phonePlaceholder || "Example123"}
                      className={inputClassName}
                      autoComplete="tel"
                    />
                  </div>

                  <div className="flex w-full flex-col gap-2">
                    <label htmlFor="password" className={labelClassName}>
                      {s?.passwordLabel || "Password"}
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setError("");
                      }}
                      placeholder={
                        s?.passwordPlaceholder || "at least 8 characters"
                      }
                      className={inputClassName}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="flex w-full flex-col gap-2">
                    <label
                      htmlFor="confirm-password"
                      className={labelClassName}
                    >
                      {s?.confirmPasswordLabel || "Confirm Password"}
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setError("");
                      }}
                      placeholder={
                        s?.confirmPasswordPlaceholder || "at least 8 characters"
                      }
                      className={inputClassName}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="flex w-full items-start gap-3 rounded-md py-3">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={agreed}
                      onClick={() => {
                        setAgreed((value) => !value);
                        setError("");
                      }}
                      className="relative size-6 shrink-0 overflow-clip"
                      aria-label={
                        s?.checkboxAria || "Agree to terms and conditions"
                      }
                    >
                      {agreed ? (
                        <span className="absolute inset-[10.42%] flex items-center justify-center rounded-[4px] border-[1.5px] border-[#2563EB] bg-[#2563EB]">
                          <svg
                            width="12"
                            height="10"
                            viewBox="0 0 12 10"
                            fill="none"
                            aria-hidden
                          >
                            <path
                              d="M1 5L4.5 8.5L11 1.5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      ) : (
                        <img
                          src="/images/registration/checkbox-unchecked.svg"
                          alt=""
                          className="size-full"
                        />
                      )}
                    </button>
                    <p className="flex-1 text-base font-medium leading-6 tracking-[0.08px] text-[#344056]">
                      {s?.agreeTerms ||
                        "I am 18 years or older and have read and agree to the"}{" "}
                      <Link href="#" className="text-[#1D4ED8] hover:underline">
                        {s?.termsLink || "Terms & Conditions."}
                      </Link>
                    </p>
                  </div>
                </div>

                {error ? (
                  <p className="text-sm font-medium text-red-500">{error}</p>
                ) : null}

                <button
                  type="submit"
                  className="relative flex h-12 w-full items-center justify-center gap-2 rounded bg-[#2563EB] px-3.5 py-3 text-base font-bold leading-6 tracking-[0.08px] text-white shadow-[inset_0_-1px_0_0_#DBE9FE] transition-colors hover:bg-[#1D4ED8]"
                >
                  {s?.signUpButton || "Sign up"}
                </button>
              </form>

              <div className="flex w-full flex-col gap-6">
                <div className="flex w-full items-center justify-center gap-4 py-2.5">
                  <div className="h-px flex-1 bg-[#CBD5ED]/80" />
                  <span className="text-base font-medium leading-6 tracking-[0.08px] text-[#294957]">
                    {s?.dividerOr || "Or"}
                  </span>
                  <div className="h-px flex-1 bg-[#CBD5ED]/80" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    loginAs({
                      email: DEMO_ACCOUNTS[1].email,
                      name: DEMO_ACCOUNTS[1].name,
                      role: "user",
                    });
                    router.push(USER_HOME);
                  }}
                  className="flex h-[52px] w-full items-center justify-center gap-4 rounded-xl bg-[#F3F9FA] px-[9px] py-3 transition-colors hover:bg-[#E8F3F5]"
                >
                  <span className="relative block size-7 shrink-0 overflow-clip">
                    <img
                      src="/images/registration/google.svg"
                      alt=""
                      className="size-full"
                    />
                  </span>
                  <span className="text-base font-normal leading-none tracking-[0.16px] text-[#313957]">
                    {s?.googleSignUp || "Sign in with Google"}
                  </span>
                </button>
              </div>

              <p className="w-full text-center text-base font-medium leading-6 tracking-[0.08px] text-[#0F172A]">
                {s?.haveAccount || "Already have an account?"}{" "}
                <Link href="/login" className="text-[#1D4ED8] hover:underline">
                  {s?.signInLink || "Sign In"}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
