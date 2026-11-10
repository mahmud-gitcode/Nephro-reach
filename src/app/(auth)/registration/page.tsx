"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, type SignInOutcome } from "@/features/auth/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { routeAfterSignIn } from "@/features/auth/auth.mapping";
import { authErrorKind, authErrorPath } from "@/features/auth/authErrors";
import { useAuthText } from "@/features/auth/authText";
import { useAuthProviders } from "@/features/auth/providers";
import {
  fetchCurrentLegalDocuments,
  legalDocumentLinks,
  type LegalDocumentLinks,
} from "@/features/auth/consent";
import { LocalSvg } from "@/components/icons/LocalSvg";

const inputClassName =
  "h-12 w-full rounded border border-[#CBD5ED] bg-white py-3 pl-4 pr-3 text-base leading-6 tracking-[0.08px] text-[#0F172A] outline-none placeholder:text-[#64748B] focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBE9FE]";

const labelClassName =
  "text-base font-medium leading-6 tracking-[0.08px] text-[#0F172A]";

const legalLinkClassName = "text-[#1D4ED8] hover:underline";

/* D44: a document link opens the current version in a new tab, so the form
   keeps what was typed. Until the list arrives (or when a document has no
   safe address) the link stays the inert "#" it always was. */
function legalLinkProps(href: string | null) {
  return href
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : { href: "#" };
}

export default function RegistrationPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const { language, setLanguage, dictionary } = useLanguage();
  const s = dictionary?.signup;
  const t = useAuthText();
  const providers = useAuthProviders();
  const router = useRouter();
  const busy = useRef(false);
  const [legalLinks, setLegalLinks] = useState<LegalDocumentLinks>({
    terms: null,
    privacy: null,
  });

  /* D44: the consent text links the current Terms and Privacy Notice, read
     from the same public list the consent versions come from (spec 032).
     A failed read leaves the links inert; the submit reads the list again
     and the server refuses an outdated or missing version. */
  useEffect(() => {
    let live = true;
    fetchCurrentLegalDocuments()
      .then((documents) => {
        if (live) setLegalLinks(legalDocumentLinks(documents));
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  /* `next` survives registration (an invitation link, Phase 3). Read from
     the address bar at submit time: this page has no Suspense boundary for
     useSearchParams, and its markup must not change. */
  const nextParam = () =>
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("next");

  const submit = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      /* phone is collected but not sent (D6: whether phone is collected at
         sign-up is still to confirm). */
      const context = await register({ name, email, password }, agreed);
      router.push(routeAfterSignIn(context, nextParam()));
    } catch (cause) {
      busy.current = false;
      setError(
        authErrorKind(cause) === "exists"
          ? s?.errors?.emailExists ||
              "That email is already registered. Sign in instead."
          : t(authErrorPath(cause)),
      );
    }
  };

  const google = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const outcome: SignInOutcome = await loginWithGoogle();
      router.push(
        outcome.kind === "two-factor"
          ? "/two-factor"
          : routeAfterSignIn(outcome.context, nextParam()),
      );
    } catch (cause) {
      busy.current = false;
      setError(t(authErrorPath(cause)));
    }
  };

  return (
    <main className="font-sf relative min-h-screen w-full overflow-x-hidden bg-white">
      {/* Top right language switcher */}
      <div className="absolute top-5 right-5 z-30 sm:top-8 sm:right-8">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-1.5 rounded-xl border-b-2 border-[#111827] bg-[#F1F5FA] p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-colors hover:bg-slate-100"
            aria-label="Change language"
          >
            <LocalSvg
              src={
                language === "ES"
                  ? "/images/dashboard-header/spain-flag.svg"
                  : "/images/dashboard-header/usa-flag.svg"
              }
              alt={language === "ES" ? "Español" : "English"}
              className="h-6 w-[33px] rounded-xs object-cover"
            />
            <LocalSvg
              src="/images/dashboard-header/arrow-down.svg"
              alt=""
              className={`size-3 transition-transform duration-200 ${
                isLangOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isLangOpen && (
            <div className="absolute top-full right-0 z-50 mt-2 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
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
                <LocalSvg
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
                <LocalSvg
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
        <div className="absolute top-0 left-1/2 h-full w-[1440px] -translate-x-1/2">
          <div className="absolute top-[-398px] left-[266px] size-[992px] rounded-full bg-[#55A8F5] opacity-70 blur-[198px]" />
          <div className="absolute top-[-323px] left-[1048px] size-[992px] rounded-full bg-[#FF0000] opacity-70 blur-[198px]" />
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
              <h1 className="text-[36px] leading-10 font-medium tracking-[0.18px] text-[#0F172A]">
                {s?.title || "Personal Details"}
              </h1>

              <form
                className="flex w-full flex-col gap-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (password.length < 8) {
                    setError(
                      s?.errors?.passwordLength ||
                        "Password must be at least 8 characters.",
                    );
                    return;
                  }
                  if (password !== confirmPassword) {
                    setError(
                      s?.errors?.passwordMismatch || "Passwords do not match.",
                    );
                    return;
                  }
                  if (!agreed) {
                    setError(
                      s?.errors?.termsRequired ||
                        "Please agree to the terms to continue.",
                    );
                    return;
                  }
                  setError("");
                  void submit();
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
                        <LocalSvg
                          src="/images/registration/checkbox-unchecked.svg"
                          alt=""
                          className="size-full"
                        />
                      )}
                    </button>
                    <p className="flex-1 text-base leading-6 font-medium tracking-[0.08px] text-[#344056]">
                      {s?.agreeTerms ||
                        "I am 18 years or older and have read and agree to the"}{" "}
                      <Link
                        {...legalLinkProps(legalLinks.terms)}
                        className={legalLinkClassName}
                      >
                        {s?.termsLink || "Terms & Conditions"}
                      </Link>{" "}
                      {s?.agreeAnd || "and the"}{" "}
                      <Link
                        {...legalLinkProps(legalLinks.privacy)}
                        className={legalLinkClassName}
                      >
                        {s?.privacyLink || "Privacy Notice"}
                      </Link>
                      {s?.agreeEnd || "."}
                    </p>
                  </div>
                </div>

                {error ? (
                  <p className="text-sm font-medium text-red-500">{error}</p>
                ) : null}

                <button
                  type="submit"
                  className="relative flex h-12 w-full items-center justify-center gap-2 rounded bg-[#2563EB] px-3.5 py-3 text-base leading-6 font-bold tracking-[0.08px] text-white shadow-[inset_0_-1px_0_0_#DBE9FE] transition-colors hover:bg-[#1D4ED8]"
                >
                  {s?.signUpButton || "Sign up"}
                </button>
              </form>

              {/* D5-G: Google only when the API says it is configured. */}
              {providers.google ? (
                <div className="flex w-full flex-col gap-6">
                  <div className="flex w-full items-center justify-center gap-4 py-2.5">
                    <div className="h-px flex-1 bg-[#CBD5ED]/80" />
                    <span className="text-base leading-6 font-medium tracking-[0.08px] text-[#294957]">
                      {s?.dividerOr || "Or"}
                    </span>
                    <div className="h-px flex-1 bg-[#CBD5ED]/80" />
                  </div>

                  <button
                    type="button"
                    onClick={() => void google()}
                    className="flex h-[52px] w-full items-center justify-center gap-4 rounded-xl bg-[#F3F9FA] px-[9px] py-3 transition-colors hover:bg-[#E8F3F5]"
                  >
                    <span className="relative block size-7 shrink-0 overflow-clip">
                      <LocalSvg
                        src="/images/registration/google.svg"
                        alt=""
                        className="size-full"
                      />
                    </span>
                    <span className="text-base leading-none font-normal tracking-[0.16px] text-[#313957]">
                      {s?.googleSignUp || "Sign in with Google"}
                    </span>
                  </button>
                </div>
              ) : null}

              <p className="w-full text-center text-base leading-6 font-medium tracking-[0.08px] text-[#0F172A]">
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
