"use client";

import React, { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { canAccessPath, DEMO_ACCOUNTS, homeForRole } from "@/features/auth/auth";

const inputClassName =
  "h-12 w-full rounded border border-[#CBD5ED] bg-white py-3 pl-12 pr-3 text-base leading-6 tracking-[0.08px] text-[#0F172A] outline-none placeholder:text-[#64748B] focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBE9FE]";

function FieldIcon({ src }: { src: string }) {
  return (
    <span className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 overflow-clip">
      <img src={src} alt="" className="size-full" />
    </span>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { login, loginAs } = useAuth();
  const { language, setLanguage, dictionary } = useLanguage();
  const l = dictionary?.login;
  const router = useRouter();
  const searchParams = useSearchParams();

  const goAfterLogin = (role: "admin" | "user") => {
    const next = searchParams.get("next");
    if (next && next.startsWith("/dashboard") && canAccessPath(role, next)) {
      router.push(next);
      return;
    }
    router.push(homeForRole(role));
  };

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-white font-sans">
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
          <div className="absolute left-[510px] top-[-217px] size-[992px] rounded-full bg-[#55A8F5] opacity-70 blur-[198px]" />
          <div className="absolute left-[1293px] top-[-142px] size-[992px] rounded-full bg-[#FF0000] opacity-70 blur-[198px]" />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1440px] items-center px-5 py-8 lg:px-8">
        <div className="flex w-full flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-8 xl:px-[105px]">
          {/* Left brand logo */}
          <div className="flex w-full max-w-[517px] flex-1 items-center justify-center lg:justify-start">
            <Link href="/" className="block w-full max-w-[517px]">
              <Image
                src="/images/login/logo.svg"
                alt="NephroReach"
                width={517}
                height={408}
                priority
                className="h-auto w-full max-h-[220px] object-contain sm:max-h-[280px] lg:max-h-[408px]"
              />
            </Link>
          </div>

          {/* Right login form */}
          <div className="w-full max-w-[548px] shrink-0">
            <div className="flex w-full flex-col gap-10 px-0 sm:px-5">
              <div className="flex flex-col gap-2">
                <h1 className="text-[36px] font-medium leading-10 tracking-[0.18px] text-[#0F172A]">
                  {l?.title || "Welcome Back"}
                </h1>
                <p className="text-lg font-medium leading-7 tracking-[0.09px] text-[#0F172A]">
                  {l?.subtitle || "Access your nephrology care dashboard."}
                </p>
              </div>

              <form
                className="flex w-full flex-col gap-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  const next = login(email, password);
                  if (!next) {
                    setError(
                      l?.errors?.invalid ||
                        "Use a demo account or an email you registered."
                    );
                    return;
                  }
                  goAfterLogin(next.role);
                }}
              >
                <div className="flex w-full flex-col gap-3.5">
                  <div className="flex w-full flex-col gap-2">
                    <label
                      htmlFor="login-email"
                      className="text-base font-medium leading-6 tracking-[0.08px] text-[#0F172A]"
                    >
                      {l?.emailLabel || "Email or Phone Number"}
                    </label>
                    <div className="relative">
                      <FieldIcon src="/images/login/sms.svg" />
                      <input
                        id="login-email"
                        type="text"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setError("");
                        }}
                        placeholder={l?.emailPlaceholder || "Example@email.com"}
                        className={inputClassName}
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2">
                    <label
                      htmlFor="login-password"
                      className="text-base font-medium leading-6 tracking-[0.08px] text-[#0F172A]"
                    >
                      {l?.passwordLabel || "Password"}
                    </label>
                    <div className="relative">
                      <FieldIcon src="/images/login/lock.svg" />
                      <input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setError("");
                        }}
                        placeholder={
                          l?.passwordPlaceholder || "at least 8 characters"
                        }
                        className={inputClassName}
                        autoComplete="current-password"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Link
                        href="#"
                        className="text-sm font-medium leading-5 tracking-[0.07px] text-[#1D4ED8] hover:underline"
                      >
                        {l?.forgotPassword || "Forgot Password?"}
                      </Link>
                    </div>
                  </div>
                </div>

                {error ? (
                  <p className="text-sm font-medium text-red-500">{error}</p>
                ) : null}

                <button
                  type="submit"
                  className="relative flex h-12 w-full items-center justify-center rounded bg-[#2563EB] px-3.5 py-3 text-base font-bold leading-6 tracking-[0.08px] text-white shadow-[inset_0_-1px_0_0_#DBE9FE] transition-colors hover:bg-[#1D4ED8]"
                >
                  {l?.signInButton || "Sign in"}
                </button>
              </form>

              <div className="flex w-full flex-col gap-6">
                <div className="flex w-full items-center justify-center gap-4 py-2.5">
                  <div className="h-px flex-1 bg-[#CBD5ED]/80" />
                  <span className="text-base font-medium leading-6 tracking-[0.08px] text-[#294957]">
                    {l?.dividerOr || "Or"}
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
                    goAfterLogin("user");
                  }}
                  className="flex h-[52px] w-full items-center justify-center gap-4 rounded-xl border border-[#E2E8F0] bg-white px-[9px] py-3 transition-colors hover:bg-[#F8FAFC]"
                >
                  <span className="relative block size-7 shrink-0 overflow-clip">
                    <img
                      src="/images/login/google.svg"
                      alt=""
                      className="size-full"
                    />
                  </span>
                  <span className="text-base font-normal tracking-[0.16px] text-[#313957]">
                    {l?.googleSignIn || "Sign in with Google"}
                  </span>
                </button>
              </div>

              <p className="w-full text-center text-base font-medium leading-6 tracking-[0.08px] text-[#0F172A]">
                {l?.noAccount || "Don't you have an account?"}{" "}
                <Link
                  href="/registration"
                  className="text-[#1D4ED8] hover:underline"
                >
                  {l?.signUpLink || "Sign up"}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginForm />
    </Suspense>
  );
}
