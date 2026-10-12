"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import DialysisDaySymptomLogForm from "@/features/personal-log/DialysisDaySymptomLogForm";
import { useLanguage } from "@/context/LanguageContext";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import { buttonStyles } from "@/components/ui";

/* ?edit=<id> changes a charted treatment; ?date=<yyyy-mm-dd> opens on a
   scheduled day (from "Did you miss a treatment?"). */
function Form() {
  const params = useSearchParams();
  return (
    <DialysisDaySymptomLogForm
      isModal={false}
      editId={params.get("edit") ?? undefined}
      initialDate={params.get("date") ?? undefined}
    />
  );
}

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

      <Suspense fallback={null}>
        <Form />
      </Suspense>
    </div>
  );
}
