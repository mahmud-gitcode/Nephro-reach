"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, Bell, Check, Eye, X, Phone, Calendar, BookOpen, PlusCircle } from "lucide-react";

interface ActionDetail {
  title: string;
  purpose: string;
  reminder: string;
  colorTheme: "blue" | "yellow" | "orange" | "red";
  symptoms: string[];
  callAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
}

const ACTION_DETAILS: Record<string, ActionDetail> = {
  "Call Dialysis Clinic First": {
    title: "Call Dialysis Clinic First",
    purpose:
      "Educational prompts encouraging members to contact their dialysis team for non-life-threatening dialysis-related concerns that may potentially be addressed by the clinic.",
    reminder:
      "Your dialysis clinic may be able to help guide next steps for dialysis-related concerns.",
    colorTheme: "blue",
    callAction: { label: "Tap to Call Clinic", href: "tel:5550100" },
    secondaryAction: {
      label: "Find My Dialysis Schedule",
      href: "/dashboard/personal-log/appointments",
    },
    symptoms: [
      "Missed or shortened dialysis treatment",
      "Questions about dry weight",
      "Mild swelling in feet/legs",
      "Mild shortness of breath while resting comfortably",
      "Rapid fluid gain between treatments",
      "Cramping during or after dialysis",
      "Access soreness without severe bleeding",
      "Mild redness near access",
      "Questions about medications prescribed by dialysis provider",
      "Feeling “more fluid overloaded than usual”",
      "Difficulty reaching target weight",
      "Dialysis machine alarms at home",
      "Home dialysis supply concerns",
      "Mild dizziness after treatment",
      "Fatigue after missed treatments",
      "Questions about phosphorus binders",
      "Elevated blood pressure without emergency symptoms",
      "Problems tolerating dialysis treatment",
      "Increased thirst/fluid management struggles",
      "Questions about potassium or diet choices",
      "Transportation issues causing missed treatments",
      "Questions about changing dialysis schedule",
      "Access dressing concerns",
      "Minor bruising near access",
      "Increased interdialytic weight gains",
      "Questions about dialysis-related labs",
      "Mild nausea after dialysis",
      "Questions about home dialysis training",
      "Mild headaches after treatment",
      "Difficulty completing treatments",
    ],
  },
  "Monitor Symptoms": {
    title: "Monitor Symptoms",
    purpose:
      "Educational awareness section for mild symptoms that may still require monitoring and communication if worsening.",
    reminder:
      "Monitor symptoms closely and contact your healthcare team if symptoms worsen or concern you.",
    colorTheme: "yellow",
    callAction: {
      label: "Log Symptom",
      href: "/dashboard/personal-log/dialysis-journal",
    },
    secondaryAction: {
      label: "Learn More Education",
      href: "/dashboard/education-center",
    },
    symptoms: [
      "Mild fatigue",
      "Trouble sleeping",
      "Mild itching",
      "Mild restless legs",
      "Occasional muscle cramps",
      "Mild appetite changes",
      "Mild constipation",
      "Mild nausea",
      "Mild dizziness when standing",
      "Mild headaches",
      "Feeling tired after dialysis",
      "Mild swelling",
      "Mild anxiety about treatments",
      "Dry mouth",
      "Mild metallic taste in mouth",
      "Mild low energy",
      "Difficulty sticking to fluid restrictions",
      "Mild sadness/frustration",
      "Mild cold intolerance",
      "Mild weakness",
      "Skin dryness",
      "Mild access discomfort",
      "Mild brain fog",
      "Changes in sleep patterns",
      "Mild stress related to dialysis",
    ],
  },
  "Seek Medical Attention.": {
    title: "Seek Medical Attention",
    purpose:
      "Educational prompts encouraging members to seek urgent medical evaluation for worsening or concerning symptoms.",
    reminder: "Some symptoms may require prompt medical evaluation.",
    colorTheme: "orange",
    callAction: { label: "Contact Healthcare Provider", href: "tel:5550199" },
    secondaryAction: {
      label: "Urgent Symptoms Education",
      href: "/dashboard/education-center",
    },
    symptoms: [
      "Fever or chills",
      "Vomiting that won’t stop",
      "Severe nausea",
      "Increasing shortness of breath",
      "Rapid swelling",
      "Sudden large weight gain",
      "Signs of infection near access",
      "Access not working properly",
      "Persistent chest discomfort",
      "Severe weakness",
      "Severe dehydration symptoms",
      "Severe headaches",
      "Very high or very low blood pressure symptoms",
      "Confusion",
      "New irregular heartbeat sensations",
      "Severe abdominal pain",
      "Fainting episodes",
      "Significant bleeding from access",
      "Oxygen levels dropping (if monitoring at home)",
      "Unable to complete dialysis repeatedly",
      "Severe diarrhea",
      "Signs of severe fluid overload",
      "Sudden inability to lie flat due to breathing issues",
      "Worsening symptoms after missed treatments",
    ],
  },
  "Call 911 immediately.": {
    title: "Call 911 Immediately",
    purpose:
      "Emergency awareness section for potentially life-threatening symptoms.",
    reminder: "Call 911 immediately for life-threatening emergencies.",
    colorTheme: "red",
    callAction: { label: "Call 911 Now", href: "tel:911" },
    symptoms: [
      "Severe trouble breathing",
      "Chest pain",
      "Blue lips or face",
      "Severe confusion",
      "Loss of consciousness",
      "Seizure",
      "Signs of stroke",
      "Severe bleeding that will not stop",
      "Unresponsiveness",
      "Severe allergic reaction",
      "Unable to speak in full sentences due to breathing difficulty",
      "Sudden collapse",
      "Severe burns",
      "Suicidal thoughts/emergency mental health crisis",
      "Severe trauma or injury",
      "Severe weakness on one side of body",
      "Sudden vision loss",
      "Severe oxygen deprivation symptoms",
      "Choking",
      "Cardiac arrest symptoms",
    ],
  },
};

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
  const [activeModalItem, setActiveModalItem] = useState<string | null>(null);

  const selectedCount = selectedSymptoms.length;

  function toggleSymptom(label: string) {
    setSelectedSymptoms((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
  }

  const currentDetail = activeModalItem ? ACTION_DETAILS[activeModalItem] : null;

  return (
    <div className="space-y-4">
      {/* Disclaimer Box */}
      <section className="rounded-2xl border border-[#FFC9C9] bg-gradient-to-r from-red-50 to-orange-50 px-6 py-6">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
          <div>
            <h1 className="text-lg font-medium leading-7 text-[#0A0A0A]">
              Important Disclaimer
            </h1>
            <p className="mt-2 text-sm font-normal leading-5 text-slate-700">
              Before The ER™ is an educational support feature only and does not provide medical advice, diagnosis, emergency services, or clinical triage. Information provided is general education and may not apply to every individual or situation. Always use your judgment and contact emergency services if you believe you are experiencing a medical emergency.
            </p>
          </div>
        </div>
      </section>

      {/* Action Items Grid with Eye Icon Trigger */}
      <section className="rounded-[14px] border border-[#E3E6F0] bg-white px-3 py-4 shadow-xs">
        <h2 className="mb-[14px] text-2xl font-medium leading-8 text-slate-900">
          Important Before The ER™
        </h2>

        <div className="rounded-lg border border-[#C4CDD5]">
          <div className="rounded-[14px] border border-slate-200 bg-[#F8FAFC] p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {actionItems.map((item) => (
                <div
                  key={item}
                  className="flex min-h-[60px] items-center justify-between gap-3 rounded-[10px] border border-slate-200 bg-white p-4 text-left text-lg font-medium leading-7 text-slate-900 transition-colors hover:border-blue-300 hover:bg-blue-50/50"
                >
                  <span className="truncate">{item}</span>
                  <button
                    type="button"
                    onClick={() => setActiveModalItem(item)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors cursor-pointer"
                    title={`View details for ${item}`}
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Symptoms Checkbox List */}
      <section className="rounded-[14px] border border-[#E3E6F0] bg-white px-3 py-4 shadow-xs">
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
                : "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
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
                    className={`flex min-h-16 items-center gap-3 rounded-[10px] bg-white p-[18px] text-left transition-colors cursor-pointer ${
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

      {/* EYE BUTTON DETAILS POPUP MODAL */}
      {currentDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity"
          onClick={() => setActiveModalItem(null)}
        >
          <div
            className="flex flex-col w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6 pb-4 bg-white shrink-0">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 leading-tight">
                  {currentDetail.title}
                </h3>
                <p className="text-sm font-medium text-slate-600 mt-1 leading-relaxed">
                  {currentDetail.purpose}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Reminder Banner */}
              <div
                className={`flex items-start gap-3 rounded-2xl p-4 text-sm font-bold leading-relaxed ${
                  currentDetail.colorTheme === "red"
                    ? "bg-red-50 text-red-900 border border-red-200"
                    : currentDetail.colorTheme === "orange"
                    ? "bg-amber-50 text-amber-900 border border-amber-200"
                    : currentDetail.colorTheme === "yellow"
                    ? "bg-yellow-50 text-yellow-900 border border-yellow-200"
                    : "bg-blue-50 text-blue-900 border border-blue-200"
                }`}
              >
                <Bell className="h-5 w-5 shrink-0 mt-0.5" />
                <span className="break-words">{currentDetail.reminder}</span>
              </div>

              {/* Symptoms Bullet List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Suggested Symptoms / Topics:
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-medium text-slate-700">
                  {currentDetail.symptoms.map((symptomName, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-200/80 break-words whitespace-normal"
                    >
                      <span className="text-blue-600 font-bold text-base leading-none">•</span>
                      <span className="leading-snug">{symptomName}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 p-6 pt-4 bg-slate-50/50 shrink-0">
              {currentDetail.callAction && (
                <a
                  href={currentDetail.callAction.href}
                  className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-colors shadow-sm ${
                    currentDetail.colorTheme === "red"
                      ? "bg-red-600 hover:bg-red-700"
                      : currentDetail.colorTheme === "orange"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : currentDetail.colorTheme === "yellow"
                      ? "bg-yellow-500 hover:bg-yellow-600 text-slate-950"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <Phone className="h-4 w-4" />
                  {currentDetail.callAction.label}
                </a>
              )}

              {currentDetail.secondaryAction && (
                <Link
                  href={currentDetail.secondaryAction.href}
                  className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors shadow-xs"
                >
                  {currentDetail.secondaryAction.label}
                </Link>
              )}

              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
