"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DialysisDaySymptomLogForm from "@/components/dashboard/DialysisDaySymptomLogForm";
import { useLanguage } from "@/context/LanguageContext";
import PersonalLogDisclaimer from "@/components/dashboard/PersonalLogDisclaimer";

export default function AddDialysisTreatmentPage() {
  const { dictionary } = useLanguage();
  const dt = dictionary.dialysisTreatment;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 py-2">
      <PersonalLogDisclaimer />

      <Link
        href="/dashboard/personal-log/dialysis-treatment"
        className="inline-flex items-center gap-2 rounded-lg px-1 py-1 text-xs font-bold text-slate-500 transition-colors hover:text-[#2563EB]"
      >
        <ArrowLeft className="size-4" />
        <span>{dt?.backToTreatment || "Back to Dialysis Treatment"}</span>
      </Link>

      <DialysisDaySymptomLogForm isModal={false} />
    </div>
  );
}
