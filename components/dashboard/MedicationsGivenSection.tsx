"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Check, Pill, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export interface TreatmentMedication {
  id: string;
  date: string;
  medication: string;
  dose: string;
  reason: string;
  given: boolean;
}

const INITIAL_MEDICATIONS: TreatmentMedication[] = [
  {
    id: "1",
    date: "May 31, 2024",
    medication: "Epoetin Alfa (Epogen)",
    dose: "8,000 units",
    reason: "Anemia",
    given: true,
  },
  {
    id: "2",
    date: "May 31, 2024",
    medication: "Iron Sucrose (Venofer)",
    dose: "100 mg",
    reason: "Iron Deficiency",
    given: true,
  },
  {
    id: "3",
    date: "May 31, 2024",
    medication: "Doxercalciferol (Hectorol)",
    dose: "2 mcg",
    reason: "Secondary Hyperparathyroidism",
    given: true,
  },
  {
    id: "4",
    date: "May 29, 2024",
    medication: "Epoetin Alfa (Epogen)",
    dose: "8,000 units",
    reason: "Anemia",
    given: true,
  },
  {
    id: "5",
    date: "May 29, 2024",
    medication: "Iron Sucrose (Venofer)",
    dose: "100 mg",
    reason: "Iron Deficiency",
    given: true,
  },
];

const LOCAL_STORAGE_KEY = "nephroreach_dialysis_treatment_medications_v2";

export default function MedicationsGivenSection() {
  const { language } = useLanguage();

  const [medications, setMedications] = useState<TreatmentMedication[]>(INITIAL_MEDICATIONS);

  // Add Medication Modal State
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [formMedication, setFormMedication] = useState("");
  const [formDose, setFormDose] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formDate, setFormDate] = useState("May 31, 2024");
  const [formGiven, setFormGiven] = useState(true);
  const [formMedError, setFormMedError] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMedications(parsed);
        }
      }
    } catch {
      // fallback
    }
  }, []);

  const saveMedications = (updated: TreatmentMedication[]) => {
    setMedications(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // fallback
    }
  };

  const handleOpenAddMedModal = () => {
    setFormMedication("");
    setFormDose("");
    setFormReason("");
    setFormDate("May 31, 2024");
    setFormGiven(true);
    setFormMedError("");
    setIsMedModalOpen(true);
  };

  const handleAddMedicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMedication.trim()) {
      setFormMedError(
        language === "ES" ? "Por favor ingrese el nombre del medicamento." : "Please enter a medication name."
      );
      return;
    }
    if (!formDose.trim()) {
      setFormMedError(
        language === "ES" ? "Por favor ingrese la dosis." : "Please enter a dose."
      );
      return;
    }

    const newEntry: TreatmentMedication = {
      id: Date.now().toString(),
      date: formDate.trim() || "Today",
      medication: formMedication.trim(),
      dose: formDose.trim(),
      reason: formReason.trim() || "Dialysis Support",
      given: formGiven,
    };

    saveMedications([newEntry, ...medications]);
    setIsMedModalOpen(false);
  };

  const handleDeleteMedication = (id: string) => {
    const updated = medications.filter((m) => m.id !== id);
    saveMedications(updated);
  };

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4 flex flex-col justify-between h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
            <Pill className="h-4 w-4 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {language === "ES"
                ? "Medicamentos Administrados Durante la Diálisis"
                : "Medications Given During Dialysis"}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddMedModal}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>{language === "ES" ? "Agregar Medicamento" : "Add Medication"}</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 flex-1">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50/90 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <th className="py-2.5 px-3.5">{language === "ES" ? "Fecha" : "Date"}</th>
              <th className="py-2.5 px-3.5">{language === "ES" ? "Medicamento" : "Medication"}</th>
              <th className="py-2.5 px-3.5">{language === "ES" ? "Dosis" : "Dose"}</th>
              <th className="py-2.5 px-3.5">{language === "ES" ? "Razón" : "Reason"}</th>
              <th className="py-2.5 px-3.5 text-center">{language === "ES" ? "Administrado" : "Given"}</th>
              <th className="py-2.5 px-2 text-center w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {medications.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                  {language === "ES"
                    ? "No hay medicamentos registrados para este tratamiento."
                    : "No medications recorded for this treatment."}
                </td>
              </tr>
            ) : (
              medications.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3.5 text-slate-900 whitespace-nowrap font-semibold text-xs">
                    {item.date}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-900 font-bold whitespace-nowrap text-xs">
                    {item.medication}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-700 whitespace-nowrap font-semibold text-xs">
                    {item.dose}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600 whitespace-nowrap text-xs">
                    {item.reason}
                  </td>
                  <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                    {item.given ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                        <Check className="h-4 w-4 stroke-[3] text-emerald-600 inline" />
                      </span>
                    ) : (
                      <span className="text-slate-400 font-semibold text-xs">Pending</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleDeleteMedication(item.id)}
                      className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title={language === "ES" ? "Eliminar" : "Delete"}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD MEDICATION MODAL */}
      {isMedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-left shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {language === "ES" ? "Agregar Registro de Medicamento" : "Add Medication Record"}
              </h3>
              <button
                type="button"
                onClick={() => setIsMedModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formMedError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
                {formMedError}
              </div>
            )}

            <form onSubmit={handleAddMedicationSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {language === "ES" ? "Fecha" : "Date"}
                </label>
                <input
                  type="text"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="May 31, 2024"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {language === "ES" ? "Medicamento" : "Medication"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formMedication}
                  onChange={(e) => setFormMedication(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Epoetin Alfa (Epogen)"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {language === "ES" ? "Dosis" : "Dose"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formDose}
                  onChange={(e) => setFormDose(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. 8,000 units"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {language === "ES" ? "Razón / Indicación" : "Reason / Indication"}
                </label>
                <input
                  type="text"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Anemia"
                />
              </div>

              <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formGiven}
                  onChange={(e) => setFormGiven(e.target.checked)}
                  className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="text-sm font-semibold text-slate-700">
                  {language === "ES" ? "Administrado durante el tratamiento" : "Given during treatment"}
                </span>
              </label>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-2.5 text-sm transition-colors shadow-sm cursor-pointer"
                >
                  {language === "ES" ? "Guardar Medicamento" : "Save Medication"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMedModalOpen(false)}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 text-sm transition-colors cursor-pointer"
                >
                  {language === "ES" ? "Cancelar" : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
