"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DialysisDaySymptomLogForm from "@/features/personal-log/DialysisDaySymptomLogForm";
import { useLanguage } from "@/context/LanguageContext";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import { buttonStyles } from "@/components/ui";

export default function AddDialysisTreatmentPage() {
  const { dictionary } = useLanguage();
  const dt = dictionary.dialysisTreatment;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-stack-lg">
      <PersonalLogDisclaimer />

      <Link
        href="/dashboard/personal-log/dialysis-treatment"
        className={buttonStyles({
          variant: "neutral",
          appearance: "stroke",
          size: "small",
        })}
      >
        <ArrowLeft />
        <span>{dt?.backToTreatment || "Back to Dialysis Treatment"}</span>
      </Link>

      <DialysisDaySymptomLogForm isModal={false} />
    </div>
  );
}
