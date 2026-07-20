"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, X, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
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
        <div className="w-full md:w-[52%] p-8 sm:p-10 md:p-12 flex flex-col justify-between relative overflow-hidden min-h-[600px] md:min-h-[720px]">
          {/* Soft background gradient */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white via-white/95 to-[#86EFAC]/45 -z-10" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#4ADE80]/20 rounded-full blur-[80px] -z-10" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#22C55E]/10 rounded-full blur-[70px] -z-10" />

          {/* Top Logo - Using public/images/logo.svg */}
          <div className="mb-8 flex items-center">
            <Image
              src="/images/logo.svg"
              alt="NephroReach Logo"
              width={150}
              height={50}
              priority
              className="object-contain"
              style={{ height: "auto" }}
            />
          </div>

          {/* Form Content Area */}
          <div className="flex-1 flex flex-col justify-center max-w-[420px] w-full mx-auto">
            {/* SIGN IN FORM */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                  {t("auth.welcomeBack")} <span className="animate-bounce">👋</span>
                </h1>
                <p className="text-sm font-medium text-slate-500 mt-2">
                  {t("auth.subTitle")}
                </p>
              </div>

              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                {/* Email / Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {t("auth.emailOrPhone")}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder={t("auth.emailPlaceholder")}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-sm font-medium shadow-sm placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      {t("auth.password")}
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.passwordPlaceholder")}
                      className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 text-sm font-medium shadow-sm placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                  <div className="text-right">
                    <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                      {t("auth.forgotPassword")}
                    </a>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-semibold rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.3)] text-sm tracking-wide mt-2"
                >
                  {t("auth.signIn")}
                </button>
              </form>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/80"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white/90 px-3.5 text-slate-400 font-semibold tracking-wider uppercase">{t("auth.or")}</span>
              </div>
            </div>

            {/* Google Sign-in */}
            <button className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-3 text-slate-700 font-semibold text-sm shadow-sm hover:shadow active:scale-[0.99]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {t("auth.signInWithGoogle")}
            </button>

            {/* Link to Registration */}
            <p className="text-center text-sm font-semibold text-slate-500 mt-6">
              {t("auth.dontHaveAccount")}{" "}
              <Link
                href="/registration"
                className="text-blue-600 hover:text-blue-700 hover:underline font-bold"
              >
                {t("auth.signUp")}
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side: Image/Banner Panel using public/images/login-page-image.png */}
        <div className="hidden md:block w-[48%] p-5 relative overflow-hidden bg-slate-50">
          <div className="w-full h-full rounded-[24px] overflow-hidden relative shadow-inner">
            <Image
              src="/images/subtract.png"
              alt="Sign In Swirl Banner"
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
