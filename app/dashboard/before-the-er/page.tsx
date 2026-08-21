"use client";

import React, { useState } from "react";
import { AlertCircle, Check, Eye } from "lucide-react";

const actionItems = [
  "Call Dialysis Clinic First",
  "Seek Medical Attention.",
  "Monitor Symptoms",
  "Call 911 immediately.",
];

const symptoms = [
  { label: "Chest Pain", urgent: true },
  { label: "Severe Fluid Overload", urgent: false },
  { label: "Signs of Stroke", urgent: true },
  { label: "Loss of Consciousness", urgent: false },
  { label: "Severe Allergic Reactions", urgent: true },
  { label: "Severe Shortness of Breath", urgent: false },
  { label: "Seizures", urgent: true },
  { label: "Dialysis Access Emergencies", urgent: false },
  { label: "Severe Bleeding", urgent: true },
  { label: "Severe Hyperkalemia Symptoms", urgent: false },
  { label: "Fever With Dialysis Catheter", urgent: false },
  { label: "CONFUSION OR MENTAL STATUS CHANGES", urgent: false },
];

export default function BeforeTheErPage() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const selectedCount = selectedSymptoms.length;
  function toggleSymptom(label: string) {
    setSelectedSymptoms((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[#FFC9C9] bg-gradient-to-r from-red-50 to-orange-50 px-6 py-6">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
          <div>
            <h1 className="text-lg font-medium leading-7 text-[#0A0A0A]">
              Important Disclaimer
            </h1>
            <p className="mt-2 text-sm font-normal leading-5 text-slate-700">
              This is not medical advice. If this is a medical emergency, call 911 immediately.
              This tool is for education only and does not replace professional medical care.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[14px] border border-[#E3E6F0] bg-white px-3 py-4 shadow-sm">
        <h2 className="mb-[14px] text-2xl font-medium leading-8 text-slate-900">
          Important Before The ER&trade;
        </h2>

        <div className="rounded-lg border border-[#C4CDD5]">
          <div className="rounded-[14px] border border-slate-200 bg-[#F8FAFC] p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {actionItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="flex min-h-[60px] items-center justify-between gap-3 rounded-[10px] border border-slate-200 bg-white p-4 text-left text-lg font-medium leading-7 text-slate-900 transition-colors hover:border-blue-200 hover:bg-blue-50"
                >
                  <span>{item}</span>
                  <Eye className="h-5 w-5 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[14px] border border-[#E3E6F0] bg-white px-3 py-4 shadow-sm">
        <div className="mb-[14px] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-medium leading-8 text-slate-900">
              Not feeling your best?
            </h2>
            <p className="mt-2 text-base font-medium leading-6 text-slate-700">
              Select the symptoms you&apos;re experiencing:
            </p>
          </div>
          <button
            type="button"
            disabled={selectedCount === 0}
            className={`flex h-12 items-center justify-center rounded border px-4 text-base font-bold transition-colors ${
              selectedCount === 0
                ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500"
                : "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Get Guidance
          </button>
        </div>

        <div className="rounded-lg border border-[#C4CDD5]">
          <div className="rounded-[14px] border border-slate-200 bg-[#F8FAFC] p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {symptoms.map((symptom) => {
                const checked = selectedSymptoms.includes(symptom.label);

                return (
                  <button
                    key={symptom.label}
                    type="button"
                    onClick={() => toggleSymptom(symptom.label)}
                    className={`flex min-h-16 items-center gap-3 rounded-[10px] bg-white p-[18px] text-left transition-colors ${
                      symptom.urgent
                        ? "border-2 border-red-300 hover:bg-red-50"
                        : "border border-slate-200 hover:bg-blue-50"
                    } ${checked ? "ring-2 ring-blue-200" : ""}`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                        checked
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      {checked && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className="text-lg font-medium leading-7 text-slate-900">
                      {symptom.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
