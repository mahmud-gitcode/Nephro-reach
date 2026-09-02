"use client";

import React, { useState } from "react";
import { Calendar, X, Minus, Plus, Check } from "lucide-react";

export default function AddDialysisEntryModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
}) {
  const [date, setDate] = useState("May 26, 2026");
  const [attended, setAttended] = useState<"Yes" | "No">("Yes");
  const [arrivedLate, setArrivedLate] = useState<"Yes" | "No">("No");
  const [endedEarly, setEndedEarly] = useState<"Yes" | "No">("No");

  // Symptoms
  const [cramping, setCramping] = useState<"Yes" | "No" | "Mild" | "Moderate" | "Severe">("Yes");
  const [lowBp, setLowBp] = useState<"Yes" | "No" | "Mild" | "Moderate" | "Severe">("No");
  const [fatigue, setFatigue] = useState<"Yes" | "No" | "Mild" | "Moderate" | "Severe">("No");

  const [recoveryTime, setRecoveryTime] = useState<"Yes" | "No" | "Mild" | "Moderate" | "Severe">("Yes");
  const [missedTreatments, setMissedTreatments] = useState<number>(0);
  const [rescheduled, setRescheduled] = useState<"Yes" | "No">("No");

  const [medsPrescribed, setMedsPrescribed] = useState<"Yes" | "No" | null>("Yes");
  const [notes, setNotes] = useState("Took all meds after session.");

  if (!isOpen) return null;

  const severityOptions = ["Yes", "No", "Mild", "Moderate", "Severe"] as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="flex flex-col w-full max-w-xl max-h-[92vh] rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-[#F8FAFC] shrink-0">
          <h2 className="text-xl font-bold text-slate-900">
            Entry New LAB Results
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
              <span>{date}</span>
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* MODAL SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Field 1: Treatment attended */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <span className="text-sm font-bold text-slate-800">Treatment attended</span>
            <div className="flex items-center rounded-xl bg-blue-50/70 p-1 border border-blue-100">
              <button
                type="button"
                onClick={() => setAttended("Yes")}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  attended === "Yes"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setAttended("No")}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  attended === "No"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Field 2: Arrived late */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <span className="text-sm font-bold text-slate-800">Arrived late</span>
            <div className="flex items-center rounded-xl bg-blue-50/70 p-1 border border-blue-100">
              <button
                type="button"
                onClick={() => setArrivedLate("Yes")}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  arrivedLate === "Yes"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setArrivedLate("No")}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  arrivedLate === "No"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Field 3: Ended early */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <span className="text-sm font-bold text-slate-800">Ended early</span>
            <div className="flex items-center rounded-xl bg-blue-50/70 p-1 border border-blue-100">
              <button
                type="button"
                onClick={() => setEndedEarly("Yes")}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  endedEarly === "Yes"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setEndedEarly("No")}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  endedEarly === "No"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* SECTION: Symptoms during treatment */}
          <div className="rounded-xl bg-slate-100/80 p-3 text-xs font-bold text-slate-800 uppercase tracking-wider">
            Symptoms during treatment
          </div>

          {/* Symptom 1: Cramping */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <span className="text-sm font-bold text-slate-800">Cramping</span>
            <div className="flex flex-wrap items-center rounded-xl bg-blue-50/70 p-1 border border-blue-100">
              {severityOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setCramping(opt)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    cramping === opt
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Symptom 2: Low BP */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <span className="text-sm font-bold text-slate-800">Low BP</span>
            <div className="flex flex-wrap items-center rounded-xl bg-blue-50/70 p-1 border border-blue-100">
              {severityOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setLowBp(opt)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    lowBp === opt
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Symptom 3: Fatigue */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <span className="text-sm font-bold text-slate-800">Fatigue</span>
            <div className="flex flex-wrap items-center rounded-xl bg-blue-50/70 p-1 border border-blue-100">
              {severityOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFatigue(opt)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    fatigue === opt
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-200/60 my-2" />

          {/* Recovery time after dialysis */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <span className="text-sm font-bold text-slate-800">Recovery time after dialysis</span>
            <div className="flex flex-wrap items-center rounded-xl bg-blue-50/70 p-1 border border-blue-100">
              {severityOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setRecoveryTime(opt)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    recoveryTime === opt
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Missed treatments Counter */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <span className="text-sm font-bold text-slate-800">Missed treatments</span>
            <div className="flex items-center rounded-xl bg-blue-50/70 p-1 border border-blue-100 gap-3">
              <button
                type="button"
                onClick={() => setMissedTreatments(Math.max(0, missedTreatments - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-sm font-bold text-slate-900 w-6 text-center">
                {missedTreatments}
              </span>
              <button
                type="button"
                onClick={() => setMissedTreatments(missedTreatments + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Did you reschedule your missed treatment? */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <span className="text-sm font-bold text-slate-800">Did you reschedule your missed treatment?</span>
            <div className="flex items-center rounded-xl bg-blue-50/70 p-1 border border-blue-100">
              <button
                type="button"
                onClick={() => setRescheduled("Yes")}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  rescheduled === "Yes"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setRescheduled("No")}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  rescheduled === "No"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Did I take my medications as prescribed today? */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
            <span className="block text-sm font-bold text-slate-800">
              Did I take my medications as prescribed today?
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMedsPrescribed("Yes")}
                className={`flex items-center gap-3 rounded-2xl border p-4 text-left font-bold text-sm transition-all cursor-pointer ${
                  medsPrescribed === "Yes"
                    ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-500 text-blue-950"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                    medsPrescribed === "Yes"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {medsPrescribed === "Yes" && <Check className="h-3.5 w-3.5" />}
                </span>
                <span>Yes</span>
              </button>

              <button
                type="button"
                onClick={() => setMedsPrescribed("No")}
                className={`flex items-center gap-3 rounded-2xl border p-4 text-left font-bold text-sm transition-all cursor-pointer ${
                  medsPrescribed === "No"
                    ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-500 text-blue-950"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                    medsPrescribed === "No"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {medsPrescribed === "No" && <Check className="h-3.5 w-3.5" />}
                </span>
                <span>No</span>
              </button>
            </div>

            {/* Notes */}
            <div className="pt-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Took all meds after session."
                className="w-full rounded-2xl border border-slate-200/80 bg-white p-3.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-5 bg-[#F8FAFC] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (onSave) onSave({ date, attended, arrivedLate, endedEarly, cramping, lowBp, fatigue, recoveryTime, missedTreatments, rescheduled, medsPrescribed, notes });
              onClose();
            }}
            className="rounded-xl bg-[#2563EB] hover:bg-blue-700 px-7 py-3 text-sm font-bold text-white transition-colors shadow-sm cursor-pointer"
          >
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
}
