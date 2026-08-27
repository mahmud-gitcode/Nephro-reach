"use client";

import React, { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { canAccessPath, DEMO_ACCOUNTS, homeForRole } from "@/lib/auth";

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
  const { login, loginAs } = useAuth();
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-[20%] -top-[30%] size-[70vmin] rounded-full bg-[#55A8F5] opacity-70 blur-[180px] sm:size-[992px] sm:blur-[198px]" />
        <div className="absolute -right-[25%] -top-[20%] size-[70vmin] rounded-full bg-[#FF4D4D] opacity-70 blur-[180px] sm:size-[992px] sm:blur-[198px]" />
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-white via-white/90 to-transparent" />
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
                  Welcome Back
                </h1>
                <p className="text-lg font-medium leading-7 tracking-[0.09px] text-[#0F172A]">
                  Access your nephrology care dashboard.
                </p>
              </div>

              <form
                className="flex w-full flex-col gap-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  const next = login(email, password);
                  if (!next) {
                    setError(
                      "Use a demo account or an email you registered.",
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
                      Email or Phone Number
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
                        placeholder="Example@email.com"
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
                      Password
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
                        placeholder="at least 8 characters"
                        className={inputClassName}
                        autoComplete="current-password"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Link
                        href="#"
                        className="text-sm font-medium leading-5 tracking-[0.07px] text-[#1D4ED8] hover:underline"
                      >
                        Forgot Password?
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
                  Sign in
                </button>
              </form>

              <div className="flex w-full flex-col gap-6">
                <div className="flex w-full items-center justify-center gap-4 py-2.5">
                  <div className="h-px flex-1 bg-[#CBD5ED]/80" />
                  <span className="text-base font-medium leading-6 tracking-[0.08px] text-[#294957]">
                    Or
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
                    Sign in with Google
                  </span>
                </button>
              </div>

              <p className="w-full text-center text-base font-medium leading-6 tracking-[0.08px] text-[#0F172A]">
                Don&apos;t you have an account?{" "}
                <Link
                  href="/registration"
                  className="text-[#1D4ED8] hover:underline"
                >
                  Sign up
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
