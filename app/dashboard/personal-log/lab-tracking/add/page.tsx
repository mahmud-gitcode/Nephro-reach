"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Plus, X } from "lucide-react";

import { GiKidneys } from "react-icons/gi";
import {
  FaFlask,
  FaBone,
  FaDroplet,
  FaAppleWhole,
  FaHeartPulse,
} from "react-icons/fa6";
import { useLanguage } from "@/context/LanguageContext";

interface TestItem {
  id: string;
  name: string;
  unit: string;
  refRange: string;
  defaultVal: string;
}

interface CategoryGroup {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  tests: TestItem[];
}

const designCategories: CategoryGroup[] = [
  {
    id: "kidney-function",
    name: "KIDNEY FUNCTION",
    icon: GiKidneys,
    tests: [
      {
        id: "bun",
        name: "BUN",
        unit: "mg/dL",
        refRange: "7 – 20 mg/dL",
        defaultVal: "48",
      },
      {
        id: "creatinine",
        name: "Creatinine",
        unit: "mg/dL",
        refRange: "0.6 – 1.3 mg/dL",
        defaultVal: "6.48",
      },
      {
        id: "egfr",
        name: "eGFR (CKD-EPI)",
        unit: "mL/min/1.73m²",
        refRange: "> 90 mL/min/1.73m²",
        defaultVal: "9",
      },
    ],
  },
  {
    id: "electrolytes",
    name: "ELECTROLYTES",
    icon: FaFlask,
    tests: [
      {
        id: "sodium",
        name: "Sodium",
        unit: "mEq/L",
        refRange: "135 – 145 mEq/L",
        defaultVal: "138",
      },
      {
        id: "potassium",
        name: "Potassium",
        unit: "mEq/L",
        refRange: "3.5 – 5.0 mEq/L",
        defaultVal: "5.2",
      },
      {
        id: "chloride",
        name: "Chloride",
        unit: "mEq/L",
        refRange: "98 – 107 mEq/L",
        defaultVal: "99",
      },
      {
        id: "co2",
        name: "CO2 (Bicarbonate)",
        unit: "mEq/L",
        refRange: "22 – 29 mEq/L",
        defaultVal: "22",
      },
    ],
  },
  {
    id: "mineral-bone",
    name: "MINERAL & BONE",
    icon: FaBone,
    tests: [
      {
        id: "calcium",
        name: "Calcium",
        unit: "mg/dL",
        refRange: "8.5 – 10.5 mg/dL",
        defaultVal: "9.1",
      },
      {
        id: "phosphorus",
        name: "Phosphorus",
        unit: "mg/dL",
        refRange: "2.5 – 4.5 mg/dL",
        defaultVal: "5.6",
      },
      {
        id: "pth",
        name: "PTH (Intact)",
        unit: "pg/mL",
        refRange: "15 – 65 pg/mL",
        defaultVal: "412",
      },
      {
        id: "vitamind",
        name: "Vitamin D 25-OH",
        unit: "ng/mL",
        refRange: "30 – 100 ng/mL",
        defaultVal: "28",
      },
    ],
  },
  {
    id: "blood-counts",
    name: "BLOOD COUNTS",
    icon: FaDroplet,
    tests: [
      {
        id: "hemoglobin",
        name: "Hemoglobin",
        unit: "g/dL",
        refRange: "11.0 – 16.0 g/dL",
        defaultVal: "10.2",
      },
      {
        id: "hematocrit",
        name: "Hematocrit",
        unit: "%",
        refRange: "33 – 47 %",
        defaultVal: "31",
      },
      {
        id: "ferritin",
        name: "Ferritin",
        unit: "ng/mL",
        refRange: "30 – 400 ng/mL",
        defaultVal: "456",
      },
      {
        id: "tsat",
        name: "Iron Saturation (TSAT)",
        unit: "%",
        refRange: "20 – 50 %",
        defaultVal: "28",
      },
    ],
  },
  {
    id: "nutrition",
    name: "NUTRITION",
    icon: FaAppleWhole,
    tests: [
      {
        id: "albumin",
        name: "Albumin",
        unit: "g/dL",
        refRange: "3.5 – 5.0 g/dL",
        defaultVal: "3.8",
      },
      {
        id: "bicarbonate",
        name: "Bicarbonate",
        unit: "mEq/L",
        refRange: "22 – 29 mEq/L",
        defaultVal: "22",
      },
    ],
  },
  {
    id: "dialysis-adequacy",
    name: "DIALYSIS ADEQUACY",
    icon: FaHeartPulse,
    tests: [
      {
        id: "ktv",
        name: "Kt/V",
        unit: "ratio",
        refRange: "≥ 1.20",
        defaultVal: "1.35",
      },
    ],
  },
];

export default function AddLabTrackingPage() {
  const router = useRouter();
  const { dictionary } = useLanguage();
  const l = dictionary?.labTracking;

  const [labDate, setLabDate] = useState<string>("2024-05-31");
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");

  const [testValues, setTestValues] = useState<{ [key: string]: string }>(() => {
    const initial: { [key: string]: string } = {};
    designCategories.forEach((cat) => {
      cat.tests.forEach((t) => {
        initial[t.name] = t.defaultVal;
      });
    });
    return initial;
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const getCategoryName = (catId: string, fallback: string) => {
    if (catId === "kidney-function")
      return l?.categories?.kidneyFunction || fallback;
    if (catId === "electrolytes")
      return l?.categories?.electrolytes || fallback;
    if (catId === "mineral-bone")
      return l?.categories?.mineralBone || fallback;
    if (catId === "blood-counts")
      return l?.categories?.bloodCounts || fallback;
    if (catId === "nutrition")
      return l?.categories?.nutrition || fallback;
    if (catId === "dialysis-adequacy")
      return l?.categories?.dialysisAdequacy || fallback;
    return fallback;
  };

  const getTestDisplayName = (testId: string, fallback: string) => {
    const testsDict = l?.tests;
    if (!testsDict) return fallback;
    if (testId === "bun") return testsDict.bun || fallback;
    if (testId === "creatinine") return testsDict.creatinine || fallback;
    if (testId === "egfr") return testsDict.egfr || fallback;
    if (testId === "sodium") return testsDict.sodium || fallback;
    if (testId === "potassium") return testsDict.potassium || fallback;
    if (testId === "chloride") return testsDict.chloride || fallback;
    if (testId === "co2") return testsDict.co2 || fallback;
    if (testId === "calcium") return testsDict.calcium || fallback;
    if (testId === "phosphorus") return testsDict.phosphorus || fallback;
    if (testId === "pth") return testsDict.pth || fallback;
    if (testId === "vitamind") return testsDict.vitaminD || fallback;
    if (testId === "hemoglobin") return testsDict.hemoglobin || fallback;
    if (testId === "hematocrit") return testsDict.hematocrit || fallback;
    if (testId === "ferritin") return testsDict.ferritin || fallback;
    if (testId === "tsat") return testsDict.tsat || fallback;
    if (testId === "albumin") return testsDict.albumin || fallback;
    if (testId === "bicarbonate") return testsDict.bicarbonate || fallback;
    if (testId === "ktv") return testsDict.ktv || fallback;
    return fallback;
  };

  const handleValueChange = (name: string, val: string) => {
    setTestValues((prev) => ({ ...prev, [name]: val }));
  };

  // Add category to active form view
  const handleAddCategorySection = (catId: string) => {
    if (!catId) return;
    if (!activeCategoryIds.includes(catId)) {
      setActiveCategoryIds((prev) => [...prev, catId]);
    }
  };

  // Remove category section
  const handleRemoveCategorySection = (catId: string) => {
    setActiveCategoryIds((prev) => prev.filter((id) => id !== catId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);

    const payload = {
      date: labDate,
      values: testValues,
      notes,
    };
    try {
      localStorage.setItem("nr_custom_lab_results", JSON.stringify(payload));
    } catch {
      // ignore
    }

    setTimeout(() => {
      router.push("/dashboard/personal-log/lab-tracking");
    }, 1000);
  };

  const availableCategoriesToAdd = designCategories.filter(
    (c) => !activeCategoryIds.includes(c.id)
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {savedSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 transition-all">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
          <div>
            <p className="font-bold text-sm">
              {l?.addModal?.successTitle || "Lab Results Saved Successfully!"}
            </p>
            <p className="text-xs text-emerald-700">
              {l?.addModal?.successDesc ||
                "Updating table info and redirecting to My Labs..."}
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6"
      >
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {l?.addModal?.title || "Add Lab Result"}
            </h1>
          </div>
          <Link
            href="/dashboard/personal-log/lab-tracking"
            aria-label="Close form"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </Link>
        </header>

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
          <label
            htmlFor="lab-date"
            className="block text-xs font-bold text-slate-900"
          >
            {l?.addModal?.drawDateLabel || "Lab Draw Date"}
          </label>
          <div className="max-w-xs">
            <input
              id="lab-date"
              type="date"
              value={labDate}
              onChange={(e) => setLabDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          {activeCategoryIds.length > 0 && (
            <div className="space-y-6">
              {designCategories
                .filter((cat) => activeCategoryIds.includes(cat.id))
                .map((category) => (
                  <div
                    key={category.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white space-y-0"
                  >
                    <div className="flex items-center justify-between bg-[#F1F5FA] px-4 py-2.5 border-b border-slate-200">
                      <div className="flex items-center gap-2 font-bold text-xs text-[#06265B] tracking-wider uppercase">
                        <category.icon className="h-4.5 w-4.5 fill-current text-blue-600 shrink-0" />
                        {getCategoryName(category.id, category.name)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategorySection(category.id)}
                        className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline transition-colors cursor-pointer"
                      >
                        {l?.addModal?.remove || "Remove"}
                      </button>
                    </div>

                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5">
                            {l?.addModal?.headers?.test || "Test"}
                          </th>
                          <th className="px-4 py-2.5">
                            {l?.addModal?.headers?.resultValue || "Result Value"}
                          </th>
                          <th className="px-4 py-2.5">
                            {l?.addModal?.headers?.unit || "Unit"}
                          </th>
                          <th className="px-4 py-2.5">
                            {l?.addModal?.headers?.refRange ||
                              "Reference Range"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {category.tests.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 font-bold text-slate-900">
                              {getTestDisplayName(t.id, t.name)}
                            </td>
                            <td className="px-4 py-2.5">
                              <input
                                type="text"
                                value={testValues[t.name] || ""}
                                onChange={(e) =>
                                  handleValueChange(t.name, e.target.value)
                                }
                                placeholder={
                                  l?.addModal?.enterValuePlaceholder ||
                                  "Enter value"
                                }
                                className="w-32 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-4 py-2.5 font-medium text-slate-500">
                              {t.unit}
                            </td>
                            <td className="px-4 py-2.5 font-medium text-slate-500">
                              {t.refRange}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
            </div>
          )}

          {availableCategoriesToAdd.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-[#F1F5FA] p-4 space-y-3">
              <label className="block text-xs font-bold text-[#06265B] tracking-wider uppercase">
                {l?.addModal?.addCategoryLabel || "+ Add Category:"}
              </label>

              <div className="flex flex-wrap items-center gap-2">
                {availableCategoriesToAdd.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleAddCategorySection(cat.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-blue-600" />
                    {getCategoryName(cat.id, cat.name)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <section className="space-y-2">
          <label
            htmlFor="notes-input"
            className="block text-xs font-bold text-slate-700"
          >
            {l?.addModal?.notesLabel || "Notes & Observations (Optional)"}
          </label>
          <textarea
            id="notes-input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              l?.addModal?.notesPlaceholder ||
              "Add any notes or questions about your phosphorus, potassium, or fluid levels..."
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </section>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Link
            href="/dashboard/personal-log/lab-tracking"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {l?.addModal?.cancel || "Cancel"}
          </Link>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-6 text-xs font-bold text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {l?.addModal?.saveEntry || "Save Entry"}
          </button>
        </div>
      </form>
    </div>
  );
}
