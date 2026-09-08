"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  Plus,
  X,
  ShieldCheck,
  FileText,
  Save,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ProviderOrder {
  id: string;
  date: string;
  order: string;
  completed: boolean;
}

const INITIAL_PROVIDER_ORDERS: ProviderOrder[] = [
  {
    id: "ord-1",
    date: "Jun 19, 2026",
    order: "Start phosphate binder with meals",
    completed: true,
  },
  {
    id: "ord-2",
    date: "Jun 20, 2026",
    order: "Schedule access ultrasound",
    completed: false,
  },
  {
    id: "ord-3",
    date: "Jun 22, 2026",
    order: "Increase dietary protein intake",
    completed: false,
  },
  {
    id: "ord-4",
    date: "Jun 23, 2026",
    order: "Limit fluid intake to 32 oz/day",
    completed: true,
  },
];

interface CommonMedCategory {
  title: string;
  titleEs: string;
  items: { id: string; name: string; defaultChecked: boolean }[];
}

const COMMON_MEDICATION_GROUPS: CommonMedCategory[] = [
  {
    title: "Anemia & Iron Management",
    titleEs: "Manejo de Anemia y Hierro",
    items: [
      { id: "epogen", name: "Epogen", defaultChecked: true },
      { id: "mircera", name: "Mircera", defaultChecked: false },
      { id: "venofer", name: "Venofer", defaultChecked: true },
    ],
  },
  {
    title: "Bone & Mineral Management",
    titleEs: "Salud Ósea y Mineral",
    items: [
      { id: "calcitriol", name: "Calcitriol", defaultChecked: false },
      { id: "hectorol", name: "Hectorol", defaultChecked: true },
      { id: "zemplar", name: "Zemplar", defaultChecked: false },
      { id: "sensipar", name: "Sensipar", defaultChecked: false },
      { id: "parsabiv", name: "Parsabiv", defaultChecked: false },
    ],
  },
  {
    title: "Blood Pressure & Anticoagulation",
    titleEs: "Presión Arterial y Anticoagulación",
    items: [
      { id: "heparin", name: "Heparin", defaultChecked: true },
      { id: "clonidine", name: "Clonidine", defaultChecked: false },
      { id: "midodrine", name: "Midodrine", defaultChecked: false },
    ],
  },
  {
    title: "Symptom Relief & Supportive Care",
    titleEs: "Alivio de Síntomas y Cuidado de Soporte",
    items: [
      { id: "korsuva", name: "Korsuva", defaultChecked: false },
      { id: "tylenol", name: "Tylenol", defaultChecked: false },
      { id: "benadryl", name: "Benadryl", defaultChecked: false },
      { id: "zofran", name: "Zofran", defaultChecked: false },
      { id: "antibiotics", name: "Antibiotics", defaultChecked: false },
    ],
  },
];

interface SymptomItem {
  id: string;
  label: string;
  labelEs: string;
  defaultChecked: boolean;
}

const SYMPTOM_COLUMNS: SymptomItem[][] = [
  // Column 1
  [
    { id: "swelling", label: "Swelling", labelEs: "Hinchazón", defaultChecked: true },
    { id: "shortness_breath", label: "Shortness of Breath", labelEs: "Falta de aire", defaultChecked: false },
    { id: "diff_sleeping_flat", label: "Difficulty Sleeping Flat", labelEs: "Dificultad para dormir plano", defaultChecked: false },
    { id: "rapid_weight_gain", label: "Rapid Weight Gain", labelEs: "Aumento rápido de peso", defaultChecked: false },
    { id: "decreased_appetite", label: "Decreased Appetite", labelEs: "Disminución del apetito", defaultChecked: false },
    { id: "fatigue", label: "Fatigue", labelEs: "Fatiga", defaultChecked: true },
    { id: "itching", label: "Itching", labelEs: "Picazón", defaultChecked: true },
  ],
  // Column 2
  [
    { id: "restless_legs", label: "Restless Legs", labelEs: "Piernas inquietas", defaultChecked: false },
    { id: "constipation", label: "Constipation", labelEs: "Estreñimiento", defaultChecked: false },
    { id: "diarrhea", label: "Diarrhea", labelEs: "Diarrea", defaultChecked: false },
    { id: "nausea", label: "Nausea", labelEs: "Náuseas", defaultChecked: false },
    { id: "access_redness", label: "Access Redness", labelEs: "Enrojecimiento del acceso", defaultChecked: false },
    { id: "access_bleeding", label: "Access Bleeding", labelEs: "Sangrado del acceso", defaultChecked: false },
    { id: "fever", label: "Fever", labelEs: "Fiebre", defaultChecked: false },
  ],
  // Column 3
  [
    { id: "chills", label: "Chills", labelEs: "Escalofríos", defaultChecked: false },
    { id: "muscle_aches", label: "Muscle Aches", labelEs: "Dolores musculares", defaultChecked: false },
    { id: "anxiety", label: "Anxiety", labelEs: "Ansiedad", defaultChecked: false },
    { id: "depression", label: "Depression", labelEs: "Depresión", defaultChecked: false },
    { id: "other", label: "Other", labelEs: "Otro", defaultChecked: false },
  ],
];

interface IntervalInfo {
  name: string;
  label: string;
  dates: { dateStr: string; dayLabel: string; shortDate: string }[];
}

const TREATMENT_INTERVAL_DATES: Record<string, IntervalInfo> = {
  "tx-1": {
    name: "Treatment 1",
    label: "Treatment 1 ➔ Treatment 2",
    dates: [
      { dateStr: "Friday, Jun 19, 2026", dayLabel: "Friday", shortDate: "Jun 19" },
      { dateStr: "Saturday, Jun 20, 2026", dayLabel: "Saturday", shortDate: "Jun 20" },
      { dateStr: "Sunday, Jun 21, 2026", dayLabel: "Sunday", shortDate: "Jun 21" },
      { dateStr: "Monday, Jun 22, 2026", dayLabel: "Monday", shortDate: "Jun 22" },
    ],
  },
  "tx-2": {
    name: "Treatment 2",
    label: "Treatment 2 ➔ Treatment 3",
    dates: [
      { dateStr: "Monday, Jun 22, 2026", dayLabel: "Monday", shortDate: "Jun 22" },
      { dateStr: "Tuesday, Jun 23, 2026", dayLabel: "Tuesday", shortDate: "Jun 23" },
      { dateStr: "Wednesday, Jun 24, 2026", dayLabel: "Wednesday", shortDate: "Jun 24" },
    ],
  },
  "tx-3": {
    name: "Treatment 3",
    label: "Treatment 3 ➔ Treatment 4",
    dates: [
      { dateStr: "Wednesday, Jun 24, 2026", dayLabel: "Wednesday", shortDate: "Jun 24" },
      { dateStr: "Thursday, Jun 25, 2026", dayLabel: "Thursday", shortDate: "Jun 25" },
      { dateStr: "Friday, Jun 26, 2026", dayLabel: "Friday", shortDate: "Jun 26" },
      { dateStr: "Saturday, Jun 27, 2026", dayLabel: "Saturday", shortDate: "Jun 27" },
    ],
  },
  "tx-4": {
    name: "Treatment 4",
    label: "Treatment 4 ➔ Next Week Treatment 1",
    dates: [
      { dateStr: "Saturday, Jun 27, 2026", dayLabel: "Saturday", shortDate: "Jun 27" },
      { dateStr: "Sunday, Jun 28, 2026", dayLabel: "Sunday", shortDate: "Jun 28" },
      { dateStr: "Monday, Jun 29, 2026", dayLabel: "Monday", shortDate: "Jun 29" },
      { dateStr: "Tuesday, Jun 30, 2026", dayLabel: "Tuesday", shortDate: "Jun 30" },
    ],
  },
};

function AddRecordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const treatmentParam = searchParams.get("treatment") || "tx-1";
  const activeTreatmentKey = TREATMENT_INTERVAL_DATES[treatmentParam] ? treatmentParam : "tx-1";
  const currentIntervalInfo = TREATMENT_INTERVAL_DATES[activeTreatmentKey];

  const { language } = useLanguage();
  const isEs = language === "ES";

  // Selected date state strictly from the interval dates:
  const [selectedDateStr, setSelectedDateStr] = useState(
    currentIntervalInfo.dates[0].dateStr
  );

  useEffect(() => {
    if (currentIntervalInfo.dates.length > 0) {
      setSelectedDateStr(currentIntervalInfo.dates[0].dateStr);
    }
  }, [treatmentParam]);

  // Provider Orders State
  const [providerOrders, setProviderOrders] = useState<ProviderOrder[]>(
    INITIAL_PROVIDER_ORDERS
  );
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [formOrderText, setFormOrderText] = useState("");
  const [formOrderCompleted, setFormOrderCompleted] = useState(false);
  const [formOrderError, setFormOrderError] = useState("");

  // Symptoms State
  const [symptoms, setSymptoms] = useState<Record<string, boolean>>({
    swelling: true,
    fatigue: true,
  });
  const [otherSymptomText, setOtherSymptomText] = useState("");

  // Common Medications State
  const [checkedCommonMeds, setCheckedCommonMeds] = useState<Record<string, boolean>>({
    epogen: true,
    venofer: true,
    heparin: true,
    hectorol: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const toggleSymptom = (id: string) => {
    setSymptoms((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleCommonMed = (id: string) => {
    setCheckedCommonMeds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleOrderCompleted = (id: string) => {
    setProviderOrders((prev) =>
      prev.map((ord) =>
        ord.id === id ? { ...ord, completed: !ord.completed } : ord
      )
    );
  };

  const handleAddOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOrderText.trim()) {
      setFormOrderError(
        isEs
          ? "Por favor ingrese la orden o instrucción."
          : "Please enter the order or instruction."
      );
      return;
    }

    const newOrder: ProviderOrder = {
      id: Date.now().toString(),
      date: selectedDateStr.split(",")[1]?.trim() || selectedDateStr,
      order: formOrderText.trim(),
      completed: formOrderCompleted,
    };

    setProviderOrders([newOrder, ...providerOrders]);
    setFormOrderText("");
    setIsOrderModalOpen(false);
  };

  const handleSaveRecord = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/personal-log/dialysis-management/view?treatment=${activeTreatmentKey}`);
      }, 700);
    }, 400);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-7 pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/personal-log/dialysis-management"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEs ? "Volver a Gestión de Diálisis" : "Back to Dialysis Management"}
        </Link>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2563EB] border border-blue-100">
          {currentIntervalInfo.name} ({currentIntervalInfo.label})
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 1. DATE SELECTOR (ONLY SHOWS VALID DATES FOR THIS TREATMENT INTERVAL)     */}
      {/* ========================================================================= */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-[#2563EB]" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {isEs ? "Seleccionar Fecha del Registro" : "Select Record Date"}
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {isEs
              ? `Mostrando solo las fechas pertenecientes a ${currentIntervalInfo.name}:`
              : `Showing only dates belonging to ${currentIntervalInfo.name}:`}
          </p>
        </div>

        {/* Date Selector Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {currentIntervalInfo.dates.map((d) => {
            const isSelected = selectedDateStr === d.dateStr;
            return (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => setSelectedDateStr(d.dateStr)}
                className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all cursor-pointer select-none active:scale-[0.98] ${
                  isSelected
                    ? "border-[#2563EB] bg-blue-50/40 ring-2 ring-[#2563EB]/20 shadow-xs"
                    : "border-slate-200/90 bg-white hover:border-blue-300 hover:bg-slate-50/50"
                }`}
              >
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    isSelected ? "text-[#2563EB]" : "text-slate-400"
                  }`}
                >
                  {d.dayLabel}
                </span>
                <span
                  className={`text-sm sm:text-base font-bold tracking-tight mt-0.5 ${
                    isSelected ? "text-[#2563EB]" : "text-slate-800"
                  }`}
                >
                  {d.shortDate}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. PROVIDER ORDERS & INSTRUCTIONS                                         */}
      {/* ========================================================================= */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {isEs ? "Órdenes e Instrucciones del Proveedor" : "Provider Orders & Instructions"}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {isEs
                ? "Agrega o marca las indicaciones médicas recibidas para este intervalo"
                : "Add or review medical instructions received for this interval"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormOrderText("");
              setFormOrderError("");
              setIsOrderModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>{isEs ? "Nueva Orden" : "Add Order"}</span>
          </button>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/90 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 w-36">{isEs ? "Fecha" : "Date"}</th>
                <th className="py-3 px-4">{isEs ? "Orden / Instrucción" : "Order / Instruction"}</th>
                <th className="py-3 px-4 text-center w-28">{isEs ? "Completado" : "Completed"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {providerOrders.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 text-[#2563EB] whitespace-nowrap font-bold text-xs sm:text-sm">
                    {item.date}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 text-xs sm:text-sm leading-snug">
                    {item.order}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleOrderCompleted(item.id)}
                      className={`inline-flex h-5 w-5 items-center justify-center rounded border transition-colors cursor-pointer select-none active:scale-95 ${
                        item.completed
                          ? "bg-[#2563EB] border-[#2563EB] text-white"
                          : "bg-white border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {item.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SYMPTOMS BETWEEN TREATMENTS                                            */}
      {/* ========================================================================= */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5 animate-in fade-in duration-200">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {isEs ? "Síntomas Entre Tratamientos" : "Symptoms Between Treatments"}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isEs
              ? `Selecciona los síntomas experimentados el ${selectedDateStr}:`
              : `Select symptoms experienced on ${selectedDateStr}:`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3.5 gap-x-8">
          {SYMPTOM_COLUMNS.map((col, colIdx) => (
            <div key={colIdx} className="space-y-3">
              {col.map((item) => {
                const isChecked = Boolean(symptoms[item.id]);
                return (
                  <div key={item.id} className="space-y-1.5">
                    <label
                      onClick={() => toggleSymptom(item.id)}
                      className="flex items-center gap-2.5 cursor-pointer select-none group"
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          isChecked
                            ? "bg-[#2563EB] border-[#2563EB] text-white"
                            : "bg-white border-slate-300 group-hover:border-slate-400"
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-blue-900 transition-colors">
                        {isEs ? item.labelEs : item.label}
                      </span>
                    </label>

                    {item.id === "other" && (
                      <div className="pt-1">
                        <input
                          type="text"
                          value={otherSymptomText}
                          onChange={(e) => {
                            setOtherSymptomText(e.target.value);
                            if (!symptoms["other"] && e.target.value.trim()) {
                              setSymptoms((prev) => ({ ...prev, other: true }));
                            }
                          }}
                          placeholder={isEs ? "Especificar otro..." : "Please specify..."}
                          className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. COMMON DIALYSIS MEDICATIONS                                            */}
      {/* ========================================================================= */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5 animate-in fade-in duration-200">
        <div className="pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {isEs ? "Medicamentos Comunes de Diálisis" : "Common Dialysis Medications"}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isEs
                ? `Marca los medicamentos administrados o tomados el ${selectedDateStr}:`
                : `Select medications taken or administered on ${selectedDateStr}:`}
            </p>
          </div>
          <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-700">
            16 Standard Meds
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COMMON_MEDICATION_GROUPS.map((group) => (
            <div
              key={group.title}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 space-y-2.5"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                <ShieldCheck className="h-4 w-4 text-[#2563EB] shrink-0" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={isEs ? group.titleEs : group.title}>
                  {isEs ? group.titleEs : group.title}
                </h4>
              </div>

              <div className="space-y-2">
                {group.items.map((item) => {
                  const isChecked = Boolean(checkedCommonMeds[item.id]);
                  return (
                    <label
                      key={item.id}
                      onClick={() => toggleCommonMed(item.id)}
                      className="flex items-center gap-2.5 cursor-pointer select-none group"
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          isChecked
                            ? "bg-[#2563EB] border-[#2563EB] text-white"
                            : "bg-white border-slate-300 group-hover:border-slate-400"
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span
                        className={`text-xs font-semibold transition-colors ${
                          isChecked ? "text-slate-900" : "text-slate-600 group-hover:text-slate-800"
                        }`}
                      >
                        {item.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SUBMIT / SAVE RECORD BUTTON                                            */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
        <Link
          href="/dashboard/personal-log/dialysis-management"
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          {isEs ? "Cancelar" : "Cancel"}
        </Link>

        <button
          type="button"
          onClick={handleSaveRecord}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-7 py-3 text-sm font-bold text-white shadow-xs hover:shadow transition-all active:scale-[0.98] cursor-pointer"
        >
          {saveSuccess ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>{isEs ? "¡Guardado con Éxito!" : "Saved Successfully!"}</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>{isEs ? `Guardar Registro (${selectedDateStr.split(",")[0]})` : `Save Record (${selectedDateStr.split(",")[0]})`}</span>
            </>
          )}
        </button>
      </div>

      {/* Add Order Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900">
                {isEs ? "Agregar Nueva Orden" : "Add New Order"}
              </h4>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isEs ? "Fecha Asignada" : "Assigned Date"}
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedDateStr}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isEs ? "Orden / Instrucción" : "Order / Instruction"}
                </label>
                <textarea
                  rows={3}
                  value={formOrderText}
                  onChange={(e) => {
                    setFormOrderText(e.target.value);
                    if (formOrderError) setFormOrderError("");
                  }}
                  placeholder={
                    isEs
                      ? "Ej: Tomar aglutinante de fosfato con las comidas..."
                      : "e.g. Schedule access ultrasound or take supplement..."
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none shadow-2xs"
                />
                {formOrderError && (
                  <p className="text-xs font-medium text-rose-500 mt-1">
                    {formOrderError}
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formOrderCompleted}
                  onChange={(e) => setFormOrderCompleted(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-700">
                  {isEs ? "Marcar como completado" : "Mark as completed"}
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {isEs ? "Cancelar" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-colors shadow-2xs"
                >
                  {isEs ? "Guardar Orden" : "Save Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AddDialysisManagementRecordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
      <AddRecordContent />
    </Suspense>
  );
}
