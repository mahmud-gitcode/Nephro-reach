"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, Clock3, HeartPulse, Plus, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function AddBloodPressurePage() {
  const { language, t } = useLanguage();

  const [systolic, setSystolic] = useState("123");
  const [diastolic, setDiastolic] = useState("78");
  const [pulse, setPulse] = useState("72");
  const [selectedMood, setSelectedMood] = useState(1);
  const [medTaken, setMedTaken] = useState(true);
  const [notes, setNotes] = useState("");

  const moods = [
    { label: t("bloodPressure.add.moods.great"), mark: t("bloodPressure.add.moods.greatMark"), emoji: ":)" },
    { label: t("bloodPressure.add.moods.good"), mark: t("bloodPressure.add.moods.goodMark"), emoji: ":)" },
    { label: t("bloodPressure.add.moods.okay"), mark: t("bloodPressure.add.moods.okayMark"), emoji: ":|" },
    { label: t("bloodPressure.add.moods.tired"), mark: t("bloodPressure.add.moods.tiredMark"), emoji: "-_-" },
    { label: t("bloodPressure.add.moods.stressed"), mark: t("bloodPressure.add.moods.stressedMark"), emoji: ":/" },
  ];

  return (
    <div className="mx-auto max-w-[429px]">
      <section className="rounded-[14px] border border-[#E3E6F0] bg-[#F1F5FA] p-3">
        <header className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-red-100 text-red-500">
            <HeartPulse className="h-6 w-6" />
          </span>
          <h1 className="min-w-0 flex-1 text-lg font-medium leading-7 tracking-[0.09px] text-slate-950">
            {t("bloodPressure.add.title")}
          </h1>
          <Link
            href="/dashboard/personal-log/blood-pressure"
            className="rounded-full p-1 text-slate-950 transition-colors hover:bg-white"
            aria-label={t("bloodPressure.add.closeAria")}
          >
            <X className="h-6 w-6" />
          </Link>
        </header>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex min-h-[74px] items-center gap-3 rounded-lg border border-[#E3E6F0] bg-white p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium leading-4 text-slate-500">{t("bloodPressure.add.date")}</p>
              <p className="mt-1 text-sm font-semibold leading-5 text-slate-950">
                {language === "ES" ? "5 de mayo de 2026" : "May 5, 2026"}
              </p>
            </div>
          </div>

          <div className="flex min-h-[74px] items-center gap-3 rounded-lg border border-[#E3E6F0] bg-white p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Clock3 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium leading-4 text-slate-500">{t("bloodPressure.add.time")}</p>
              <p className="mt-1 text-sm font-semibold leading-5 text-slate-950">12:00 AM</p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-white p-3">
          <h2 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
            {t("bloodPressure.add.howIFelt")}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium leading-5 text-slate-950">
                {t("bloodPressure.add.systolic")}
              </span>
              <input
                type="number"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                className="mt-2 flex h-12 w-full items-center rounded border border-[#CBD5ED] bg-white px-3 text-base font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium leading-5 text-slate-950">
                {t("bloodPressure.add.diastolic")}
              </span>
              <input
                type="number"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                className="mt-2 flex h-12 w-full items-center rounded border border-[#CBD5ED] bg-white px-3 text-base font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium leading-5 text-slate-950">
                {t("bloodPressure.add.pulse")}
              </span>
              <input
                type="number"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                className="mt-2 flex h-12 w-full items-center rounded border border-[#CBD5ED] bg-white px-3 text-base font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-white p-3">
          <h2 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
            {t("bloodPressure.add.howIFeel")}
          </h2>
          <p className="mt-1 text-sm font-medium leading-5 text-slate-500">
            {t("bloodPressure.add.selectCurrentState")}
          </p>

          <div className="mt-3 space-y-2">
            {moods.map((mood, index) => (
              <button
                key={mood.label}
                type="button"
                onClick={() => setSelectedMood(index)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                  selectedMood === index
                    ? "border-blue-300 bg-blue-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F1F5FA] text-sm font-bold text-slate-700">
                  {mood.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-5 text-slate-950">
                    {mood.label}
                  </span>
                  <span className="block text-xs font-medium leading-4 text-slate-500">
                    {mood.mark}
                  </span>
                </span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    selectedMood === index ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
                  }`}
                >
                  {selectedMood === index && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-white p-3">
          <h2 className="text-base font-medium leading-6 tracking-[0.08px] text-slate-950">
            {t("bloodPressure.add.howIFeel")}
          </h2>
          <p className="mt-3 text-sm font-medium leading-5 text-slate-950">
            {t("bloodPressure.add.medicationQuestion")}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMedTaken(true)}
              className={`flex h-12 items-center justify-between rounded-lg border px-3 text-sm font-semibold cursor-pointer ${
                medTaken
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {t("bloodPressure.add.yes")}
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                  medTaken ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
                }`}
              >
                {medTaken && <Check className="h-3.5 w-3.5" />}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMedTaken(false)}
              className={`flex h-12 items-center justify-between rounded-lg border px-3 text-sm font-semibold cursor-pointer ${
                !medTaken
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {t("bloodPressure.add.no")}
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                  !medTaken ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
                }`}
              >
                {!medTaken && <Check className="h-3.5 w-3.5" />}
              </span>
            </button>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-medium leading-5 text-slate-950">
              {t("bloodPressure.add.notes")}
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("bloodPressure.add.notesPlaceholder")}
              className="mt-2 block min-h-[92px] w-full resize-none rounded border border-[#CBD5ED] bg-white p-3 text-sm font-medium leading-5 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href="/dashboard/personal-log/blood-pressure"
            className="flex h-12 items-center justify-center rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold text-slate-950 transition-colors hover:bg-white cursor-pointer"
          >
            {t("bloodPressure.add.cancel")}
          </Link>
          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            {t("bloodPressure.add.saveEntry")}
          </button>
        </div>
      </section>
    </div>
  );
}
