"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, User, Phone, X, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function RegistrationPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { t } = useLanguage();

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#F1F5F9] p-4 sm:p-6 md:p-8 font-sans">
      {/* Outer Card Container */}
      <div className="relative w-full max-w-[1040px] bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden border border-slate-100/80 flex flex-col md:flex-row">
        
        {/* Close Button at Top-Right */}
        <Link href="/" className="absolute top-6 right-6 z-30 flex items-center justify-center w-11 h-11 bg-white hover:bg-slate-50 border border-slate-100 rounded-full shadow-md text-slate-600 transition-all hover:scale-105 duration-200">
          <X className="w-5 h-5" />
        </Link>

        {/* Left Side: Form Container with soft lime/green gradient */}
        <div className="w-full md:w-[52%] p-6 sm:p-8 md:p-8 flex flex-col justify-between relative overflow-hidden min-h-[580px] md:min-h-[700px]">
          {/* Soft background gradient */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white via-white/95 to-[#86EFAC]/45 -z-10" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#4ADE80]/20 rounded-full blur-[80px] -z-10" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#22C55E]/10 rounded-full blur-[70px] -z-10" />

          {/* Top Logo - Using public/images/logo.svg */}
          <div className="mb-4 flex items-center">
            <Image
              src="/images/logo.svg"
              alt="NephroReach Logo"
              width={140}
              height={46}
              priority
              className="object-contain"
              style={{ height: "auto" }}
            />
          </div>

          {/* Form Content Area */}
          <div className="flex-1 flex flex-col justify-center max-w-[420px] w-full mx-auto">
            {/* SIGN UP FORM (Personal Details) */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                  {t("auth.createAccount")}
                </h1>
              </div>

              <form className="space-y-2.5" onSubmit={(e) => e.preventDefault()}>
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    {t("contactUs.namePlaceholder")}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Example"
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-sm font-medium shadow-sm placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    {t("contactUs.emailPlaceholder")}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      placeholder={t("auth.emailPlaceholder")}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-sm font-medium shadow-sm placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    {t("auth.emailOrPhone")}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      placeholder="Example123"
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-sm font-medium shadow-sm placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    {t("auth.password")}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.passwordPlaceholder")}
                      className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-sm font-medium shadow-sm placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    {t("auth.password")}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t("auth.passwordPlaceholder")}
                      className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-sm font-medium shadow-sm placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* HIPAA Verification Checkbox */}
                <div className="flex items-start gap-2 mt-1.5 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                  <input
                    type="checkbox"
                    id="hipaa-verify"
                    className="mt-0.5 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="hipaa-verify" className="text-[10px] text-slate-500 leading-normal select-none cursor-pointer">
                    I verify that I am at least 18 years of age and agree to the{" "}
                    <a href="#" className="text-blue-600 hover:underline font-semibold">{t("footer.terms")}</a> and acknowledge the{" "}
                    <a href="#" className="text-blue-600 hover:underline font-semibold">{t("footer.privacy")}</a>.
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-semibold rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] text-sm tracking-wide mt-1.5"
                >
                  {t("auth.signUp")}
                </button>
              </form>
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/80"></div>
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="bg-white/90 px-3 text-slate-400 font-semibold tracking-wider uppercase">{t("auth.or")}</span>
              </div>
            </div>

            {/* Google Sign-in */}
            <button className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-3 text-slate-700 font-semibold text-sm shadow-sm hover:shadow active:scale-[0.99]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {t("auth.signUp")} with Google
            </button>

            {/* Link to Login */}
            <p className="text-center text-xs font-semibold text-slate-500 mt-4">
              {t("auth.alreadyHaveAccount")}{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 hover:underline font-bold"
              >
                {t("auth.signIn")}
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side: Image/Banner Panel using public/images/subtract.png */}
        <div className="hidden md:block w-[48%] p-5 relative overflow-hidden bg-slate-50">
          <div className="w-full h-full rounded-[24px] overflow-hidden relative shadow-inner">
            <Image
              src="/images/subtract.png"
              alt="Sign Up Swirl Banner"
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
        </div>
      </div>
    </main>
  );
}
