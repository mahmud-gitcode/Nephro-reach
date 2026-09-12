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
    <div className="w-full max-w-5xl mx-auto space-y-4 py-2">
      <PersonalLogDisclaimer />

      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/personal-log/dialysis-treatment"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{dt?.backToTreatment || "Back to Dialysis Treatment"}</span>
        </Link>
      </div>

      <DialysisDaySymptomLogForm isModal={false} />
    </div>
  );
}
