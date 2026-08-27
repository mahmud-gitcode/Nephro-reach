"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DEMO_ACCOUNTS, USER_HOME } from "@/lib/auth";

const inputClassName =
  "h-12 w-full rounded border border-[#CBD5ED] bg-white px-4 py-3 text-base leading-6 tracking-[0.08px] text-[#0F172A] outline-none placeholder:text-[#64748B] focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBE9FE]";

export default function RegistrationPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const { register, loginAs } = useAuth();
  const router = useRouter();

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-white font-sans">
      {/* Soft gradient orbs from Figma Desktop frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-[20%] -top-[30%] size-[70vmin] rounded-full bg-[#55A8F5] opacity-70 blur-[180px] sm:size-[992px] sm:blur-[198px]" />
        <div className="absolute -right-[25%] -top-[20%] size-[70vmin] rounded-full bg-[#FF4D4D] opacity-70 blur-[180px] sm:size-[992px] sm:blur-[198px]" />
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-white via-white/90 to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-screen w-full justify-center">
        <div className="flex w-full max-w-[528px] flex-col px-5 py-8 sm:px-0 sm:py-8">
          <Link
            href="/"
            className="mb-6 inline-flex w-[86px] shrink-0 self-start"
          >
            <Image
              src="/images/registration/logo.svg"
              alt="NephroReach"
              width={86}
              height={68}
              priority
              className="h-[68px] w-[86px] object-contain"
            />
          </Link>

          <div className="flex w-full flex-col gap-3 sm:px-5">
            <h1 className="text-[36px] font-medium leading-10 tracking-[0.18px] text-[#0F172A]">
              Personal Details
            </h1>

            <form
              className="flex w-full flex-col gap-6"
              onSubmit={(event) => {
                event.preventDefault();
                if (password.length < 8) {
                  setError("Password must be at least 8 characters.");
                  return;
                }
                if (password !== confirmPassword) {
                  setError("Passwords do not match.");
                  return;
                }
                if (!agreed) {
                  setError("Please agree to the terms to continue.");
                  return;
                }
                const result = register({ name, email, password });
                if (result === "exists") {
                  setError(
                    "That email is already registered. Sign in instead.",
                  );
                  return;
                }
                router.push(USER_HOME);
              }}
            >
              <div className="flex w-full flex-col gap-3.5">
                <div className="flex w-full flex-col gap-2">
                  <label
                    htmlFor="full-name"
                    className="text-base font-medium leading-6 tracking-[0.08px] text-[#0F172A]"
                  >
                    Full Name
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setError("");
                    }}
                    placeholder="Example"
                    className={inputClassName}
                    autoComplete="name"
                  />
                </div>

                <div className="flex w-full flex-col gap-2">
                  <label
                    htmlFor="email"
                    className="text-base font-medium leading-6 tracking-[0.08px] text-[#0F172A]"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                    }}
                    placeholder="Example@email.com"
                    className={inputClassName}
                    autoComplete="email"
                  />
                </div>

                <div className="flex w-full flex-col gap-2">
                  <label
                    htmlFor="phone"
                    className="text-base font-medium leading-6 tracking-[0.08px] text-[#0F172A]"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Example123"
                    className={inputClassName}
                    autoComplete="tel"
                  />
                </div>

                <div className="flex w-full flex-col gap-2">
                  <label
                    htmlFor="password"
                    className="text-base font-medium leading-6 tracking-[0.08px] text-[#0F172A]"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="at least 8 characters"
                    className={inputClassName}
                    autoComplete="new-password"
                  />
                </div>

                <div className="flex w-full flex-col gap-2">
                  <label
                    htmlFor="confirm-password"
                    className="text-base font-medium leading-6 tracking-[0.08px] text-[#0F172A]"
                  >
                    Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="at least 8 characters"
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
                    className="relative mt-0.5 size-6 shrink-0 overflow-clip"
                    aria-label="Agree to terms and conditions"
                  >
                    {agreed ? (
                      <span className="flex size-full items-center justify-center rounded-[4px] border-[1.5px] border-[#2563EB] bg-[#2563EB]">
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
                    I am 18 years or older and have read and agree to the{" "}
                    <Link href="#" className="text-[#1D4ED8] hover:underline">
                      Terms & Conditions.
                    </Link>
                  </p>
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
                <span className="text-base font-normal tracking-[0.16px] text-[#313957]">
                  Sign in with Google
                </span>
              </button>
            </div>

            <p className="w-full text-center text-base font-medium leading-6 tracking-[0.08px] text-[#0F172A]">
              Don&apos;t you have an account?{" "}
              <Link href="/login" className="text-[#1D4ED8] hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
