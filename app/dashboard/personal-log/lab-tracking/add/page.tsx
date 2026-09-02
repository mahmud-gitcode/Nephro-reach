"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Apple,
  Bone,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Droplets,
  Heart,
  Plus,
  Trash2,
  X,
} from "lucide-react";

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
    icon: Activity,
    tests: [
      { id: "bun", name: "BUN", unit: "mg/dL", refRange: "7 – 20 mg/dL", defaultVal: "48" },
      { id: "creatinine", name: "Creatinine", unit: "mg/dL", refRange: "0.6 – 1.3 mg/dL", defaultVal: "6.48" },
      { id: "egfr", name: "eGFR (CKD-EPI)", unit: "mL/min/1.73m²", refRange: "> 90 mL/min/1.73m²", defaultVal: "9" },
    ],
  },
  {
    id: "electrolytes",
    name: "ELECTROLYTES",
    icon: Droplets,
    tests: [
      { id: "sodium", name: "Sodium", unit: "mEq/L", refRange: "135 – 145 mEq/L", defaultVal: "138" },
      { id: "potassium", name: "Potassium", unit: "mEq/L", refRange: "3.5 – 5.0 mEq/L", defaultVal: "5.2" },
      { id: "chloride", name: "Chloride", unit: "mEq/L", refRange: "98 – 107 mEq/L", defaultVal: "99" },
      { id: "co2", name: "CO2 (Bicarbonate)", unit: "mEq/L", refRange: "22 – 29 mEq/L", defaultVal: "22" },
    ],
  },
  {
    id: "mineral-bone",
    name: "MINERAL & BONE",
    icon: Bone,
    tests: [
      { id: "calcium", name: "Calcium", unit: "mg/dL", refRange: "8.5 – 10.5 mg/dL", defaultVal: "9.1" },
      { id: "phosphorus", name: "Phosphorus", unit: "mg/dL", refRange: "2.5 – 4.5 mg/dL", defaultVal: "5.6" },
      { id: "pth", name: "PTH (Intact)", unit: "pg/mL", refRange: "15 – 65 pg/mL", defaultVal: "412" },
      { id: "vitamind", name: "Vitamin D 25-OH", unit: "ng/mL", refRange: "30 – 100 ng/mL", defaultVal: "28" },
    ],
  },
  {
    id: "blood-counts",
    name: "BLOOD COUNTS",
    icon: Droplets,
    tests: [
      { id: "hemoglobin", name: "Hemoglobin", unit: "g/dL", refRange: "11.0 – 16.0 g/dL", defaultVal: "10.2" },
      { id: "hematocrit", name: "Hematocrit", unit: "%", refRange: "33 – 47 %", defaultVal: "31" },
      { id: "ferritin", name: "Ferritin", unit: "ng/mL", refRange: "30 – 400 ng/mL", defaultVal: "456" },
      { id: "tsat", name: "Iron Saturation (TSAT)", unit: "%", refRange: "20 – 50 %", defaultVal: "28" },
    ],
  },
  {
    id: "nutrition",
    name: "NUTRITION",
    icon: Apple,
    tests: [
      { id: "albumin", name: "Albumin", unit: "g/dL", refRange: "3.5 – 5.0 g/dL", defaultVal: "3.8" },
      { id: "bicarbonate", name: "Bicarbonate", unit: "mEq/L", refRange: "22 – 29 mEq/L", defaultVal: "22" },
    ],
  },
  {
    id: "dialysis-adequacy",
    name: "DIALYSIS ADEQUACY",
    icon: Heart,
    tests: [
      { id: "ktv", name: "Kt/V", unit: "ratio", refRange: "≥ 1.20", defaultVal: "1.35" },
    ],
  },
];

export default function AddLabTrackingPage() {
  const router = useRouter();

  const [labDate, setLabDate] = useState<string>("2024-05-31");
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>(["kidney-function"]);
  const [selectedCatToAdd, setSelectedCatToAdd] = useState<string>("");
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

  const handleValueChange = (name: string, val: string) => {
    setTestValues((prev) => ({ ...prev, [name]: val }));
  };

  // Add category to active form view
  const handleAddCategorySection = (catId: string) => {
    if (!catId) return;
    if (!activeCategoryIds.includes(catId)) {
      setActiveCategoryIds((prev) => [...prev, catId]);
    }
    setSelectedCatToAdd("");
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
      {/* Top Banner / Notification */}
      {savedSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm transition-all">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
          <div>
            <p className="font-bold text-sm">Lab Results Saved Successfully!</p>
            <p className="text-xs text-emerald-700">Updating table info and redirecting to My Labs...</p>
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Enter New Lab Results</h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Select date, choose categories, fill out readings, and save your entry.
            </p>
          </div>
          <Link
            href="/dashboard/personal-log/lab-tracking"
            aria-label="Close form"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </Link>
        </header>

        {/* STEP 1: SELECT DATE */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
              1
            </span>
            <label htmlFor="lab-date" className="text-xs font-bold text-slate-900">
              Select Lab Draw Date:
            </label>
          </div>
          <div className="max-w-xs">
            <input
              id="lab-date"
              type="date"
              value={labDate}
              onChange={(e) => setLabDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 shadow-sm"
              required
            />
          </div>
        </div>

        {/* STEP 2 & 3: CATEGORIES & FILLING OUT LAB VALUES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                2
              </span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Fill Out Lab Category Results ({activeCategoryIds.length} Selected)
              </h2>
            </div>
          </div>

          {/* Active Category Input Tables */}
          {activeCategoryIds.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
              No categories selected yet. Pick a category below to start filling out results.
            </div>
          ) : (
            <div className="space-y-6">
              {designCategories
                .filter((cat) => activeCategoryIds.includes(cat.id))
                .map((category) => (
                  <div key={category.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm space-y-0">
                    {/* Category Header */}
                    <div className="flex items-center justify-between bg-[#F1F5FA] px-4 py-2.5 border-b border-slate-200">
                      <div className="flex items-center gap-2 font-bold text-xs text-[#06265B] tracking-wider">
                        <category.icon className="h-4 w-4 text-blue-600" />
                        {category.name}
                      </div>
                      {activeCategoryIds.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCategorySection(category.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-600 transition-colors"
                          title="Remove category section"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Test Inputs Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <tr>
                            <th className="px-4 py-2.5 min-w-[200px]">Test Name</th>
                            <th className="px-4 py-2.5 min-w-[160px]">Reference Range</th>
                            <th className="px-4 py-2.5 min-w-[180px]">New Result Value</th>
                            <th className="px-4 py-2.5 min-w-[80px]">Unit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {category.tests.map((test) => (
                            <tr key={test.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-4 py-3 font-semibold text-slate-900">{test.name}</td>
                              <td className="px-4 py-3 text-slate-500 font-medium">{test.refRange}</td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={testValues[test.name] || ""}
                                  onChange={(e) => handleValueChange(test.name, e.target.value)}
                                  placeholder={`e.g. ${test.defaultVal}`}
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-500">{test.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* STEP 4: ADD ANOTHER CATEGORY SELECTOR */}
          {availableCategoriesToAdd.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-[#F1F5FA] p-4 space-y-3">
              <label className="block text-xs font-bold text-[#06265B] tracking-wider uppercase">
                + Select Category to Fill Out Next:
              </label>

              {/* Category Select Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {availableCategoriesToAdd.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleAddCategorySection(cat.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5 text-blue-600" />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clinical Notes Section */}
        <section className="space-y-2">
          <label htmlFor="notes-input" className="block text-xs font-bold text-slate-700">
            Notes & Observations (Optional)
          </label>
          <textarea
            id="notes-input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes or questions about your phosphorus, potassium, or fluid levels..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Link
            href="/dashboard/personal-log/lab-tracking"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-6 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Save Entry
          </button>
        </div>
      </form>
    </div>
  );
}
