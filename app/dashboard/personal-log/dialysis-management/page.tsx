"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Syringe,
  Droplets,
  Pill,
  FileText,
  RotateCcw,
  Check,
  Plus,
  X,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface TreatmentMedication {
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

interface ProviderOrder {
  id: string;
  date: string;
  order: string;
  completed: boolean;
}

const INITIAL_PROVIDER_ORDERS: ProviderOrder[] = [
  {
    id: "ord-1",
    date: "May 31, 2024",
    order: "Start phosphate binder with meals",
    completed: true,
  },
  {
    id: "ord-2",
    date: "May 28, 2024",
    order: "Schedule access ultrasound",
    completed: false,
  },
  {
    id: "ord-3",
    date: "May 24, 2024",
    order: "Increase protein intake",
    completed: false,
  },
  {
    id: "ord-4",
    date: "May 20, 2024",
    order: "Limit fluid intake to 48 oz/day",
    completed: true,
  },
  {
    id: "ord-5",
    date: "May 15, 2024",
    order: "Take iron supplement daily",
    completed: false,
  },
];

interface CommonMedCategory {
  title: string;
  items: { id: string; name: string; defaultChecked: boolean }[];
}

const COMMON_MEDICATION_GROUPS: CommonMedCategory[] = [
  {
    title: "Anemia Management",
    items: [
      { id: "epogen", name: "Epogen / Epoetin Alfa", defaultChecked: true },
      { id: "mircera", name: "Mircera", defaultChecked: true },
      { id: "aranesp", name: "Aranesp", defaultChecked: false },
    ],
  },
  {
    title: "Iron Therapy",
    items: [
      { id: "venofer", name: "Venofer (Iron Sucrose)", defaultChecked: true },
      { id: "ferrlecit", name: "Ferrlecit", defaultChecked: false },
      { id: "injectafer", name: "Injectafer", defaultChecked: false },
    ],
  },
  {
    title: "Bone & Mineral Management",
    items: [
      { id: "hectorol", name: "Hectorol", defaultChecked: true },
      { id: "zemplar", name: "Zemplar", defaultChecked: false },
      { id: "calcitriol", name: "Calcitriol", defaultChecked: false },
    ],
  },
  {
    title: "Other Dialysis Medications",
    items: [
      { id: "albumin", name: "Albumin", defaultChecked: false },
      { id: "antibiotics", name: "Antibiotics", defaultChecked: false },
      { id: "benadryl", name: "Benadryl", defaultChecked: false },
      { id: "heparin", name: "Heparin", defaultChecked: true },
      { id: "midodrine", name: "Midodrine", defaultChecked: false },
      { id: "other", name: "Other", defaultChecked: false },
    ],
  },
];

export default function DialysisManagementPage() {
  const { language } = useLanguage();

  const [medications, setMedications] = useState<TreatmentMedication[]>(INITIAL_MEDICATIONS);
  const [providerOrders, setProviderOrders] = useState<ProviderOrder[]>(INITIAL_PROVIDER_ORDERS);

  const [checkedCommonMeds, setCheckedCommonMeds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    COMMON_MEDICATION_GROUPS.forEach((group) => {
      group.items.forEach((item) => {
        initial[item.id] = item.defaultChecked;
      });
    });
    return initial;
  });

  // Add Medication Modal State
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [formMedication, setFormMedication] = useState("");
  const [formDose, setFormDose] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formDate, setFormDate] = useState("May 31, 2024");
  const [formGiven, setFormGiven] = useState(true);
  const [formMedError, setFormMedError] = useState("");

  // Add Provider Order Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [formOrderDate, setFormOrderDate] = useState("May 31, 2024");
  const [formOrderText, setFormOrderText] = useState("");
  const [formOrderCompleted, setFormOrderCompleted] = useState(false);
  const [formOrderError, setFormOrderError] = useState("");

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
      setFormMedError("Please enter a medication name.");
      return;
    }
    if (!formDose.trim()) {
      setFormMedError("Please enter a dose.");
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

    setMedications([newEntry, ...medications]);
    setIsMedModalOpen(false);
  };

  const handleOpenAddOrderModal = () => {
    setFormOrderDate("May 31, 2024");
    setFormOrderText("");
    setFormOrderCompleted(false);
    setFormOrderError("");
    setIsOrderModalOpen(true);
  };

  const handleAddOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOrderText.trim()) {
      setFormOrderError(
        language === "ES"
          ? "Por favor ingrese la orden o instrucción."
          : "Please enter the order or instruction."
      );
      return;
    }

    const newOrder: ProviderOrder = {
      id: Date.now().toString(),
      date: formOrderDate.trim() || "Today",
      order: formOrderText.trim(),
      completed: formOrderCompleted,
    };

    setProviderOrders([newOrder, ...providerOrders]);
    setIsOrderModalOpen(false);
  };

  // KPI stats
  const kpiStats = [
    {
      label: language === "ES" ? "Dosis ESA Este Mes" : "ESA Doses This Month",
      value: 5,
      icon: Syringe,
      color: "text-purple-600",
      bg: "bg-purple-50 border-purple-100",
    },
    {
      label: language === "ES" ? "Administraciones de Hierro IV" : "IV Iron Administrations",
      value: 3,
      icon: Droplets,
      color: "text-indigo-600",
      bg: "bg-indigo-50 border-indigo-100",
    },
    {
      label: language === "ES" ? "Tratamientos de Vitamina D" : "Vitamin D Treatments",
      value: 4,
      icon: Pill,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100",
    },
    {
      label: language === "ES" ? "Cambios de Medicación" : "Medication Changes",
      value: 3,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-100",
    },
    {
      label: language === "ES" ? "Medicamentos Omitidos" : "Missed Medications",
      value: 0,
      icon: RotateCcw,
      color: "text-rose-600",
      bg: "bg-rose-50 border-rose-100",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-12">
      {/* Top Navigation */}
      <div>
        <Link
          href="/dashboard/personal-log"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {language === "ES" ? "Volver a Registro Personal" : "Back to Personal Log"}
        </Link>
      </div>

      {/* 5 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiStats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:shadow-xs transition-shadow"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${stat.bg}`}
            >
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate" title={stat.label}>
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 1: MEDICATIONS GIVEN DURING DIALYSIS TABLE */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-[#1e3a8a] tracking-tight uppercase">
              {language === "ES"
                ? "Medicamentos Administrados Durante la Diálisis"
                : "Medications Given During Dialysis"}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleOpenAddMedModal}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:shadow transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>{language === "ES" ? "Agregar Medicamento" : "Add Medication"}</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/90 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="py-3.5 px-4">{language === "ES" ? "Fecha" : "Date"}</th>
                <th className="py-3.5 px-4">{language === "ES" ? "Medicamento" : "Medication"}</th>
                <th className="py-3.5 px-4">{language === "ES" ? "Dosis" : "Dose"}</th>
                <th className="py-3.5 px-4">{language === "ES" ? "Razón" : "Reason"}</th>
                <th className="py-3.5 px-4 text-center">{language === "ES" ? "Administrado" : "Given"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {medications.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 text-slate-900 whitespace-nowrap font-semibold">
                    {item.date}
                  </td>
                  <td className="py-3.5 px-4 text-slate-900 font-bold whitespace-nowrap">
                    {item.medication}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap font-semibold">
                    {item.dose}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    {item.reason}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {item.given ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-base">
                        <Check className="h-5 w-5 stroke-[3] text-emerald-600 inline" />
                      </span>
                    ) : (
                      <span className="text-slate-400 font-semibold text-xs">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 2: PROVIDER ORDERS & INSTRUCTIONS */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-[#1e3a8a] tracking-tight uppercase">
              {language === "ES"
                ? "Órdenes e Instrucciones del Proveedor"
                : "Provider Orders & Instructions"}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleOpenAddOrderModal}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:shadow transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>{language === "ES" ? "Agregar Orden" : "Add Order"}</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/90 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="py-3.5 px-4 sm:px-6 w-36 sm:w-48">
                  {language === "ES" ? "Fecha" : "Date"}
                </th>
                <th className="py-3.5 px-4 sm:px-6">
                  {language === "ES" ? "Orden / Instrucción" : "Order / Instruction"}
                </th>
                <th className="py-3.5 px-4 sm:px-6 text-center w-28 sm:w-36">
                  {language === "ES" ? "Completado" : "Completed"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {providerOrders.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-xs text-slate-400">
                    {language === "ES"
                      ? "No hay órdenes ni instrucciones registradas."
                      : "No orders or instructions recorded yet."}
                  </td>
                </tr>
              ) : (
                providerOrders.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4 sm:px-6 text-[#1e3a8a] whitespace-nowrap font-bold text-sm">
                      {item.date}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-[#1e3a8a] font-semibold text-sm leading-snug">
                      {item.order}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleOrderCompleted(item.id)}
                        aria-label={item.completed ? "Mark as incomplete" : "Mark as completed"}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 3: COMMON DIALYSIS MEDICATIONS */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
            {language === "ES"
              ? "Medicamentos Comunes de Diálisis"
              : "Common Dialysis Medications"}
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            {language === "ES"
              ? "Selecciona y consulta medicamentos comunes organizados por categoría terapéutica"
              : "Select and review standard medications organized by therapeutic category"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {COMMON_MEDICATION_GROUPS.map((group) => (
            <div
              key={group.title}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 space-y-3"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900 truncate" title={group.title}>
                  {group.title}
                </h3>
              </div>

              <div className="space-y-2.5">
                {group.items.map((item) => {
                  const isChecked = Boolean(checkedCommonMeds[item.id]);
                  return (
                    <label
                      key={item.id}
                      onClick={() => toggleCommonMed(item.id)}
                      className="flex items-center gap-2.5 cursor-pointer select-none group"
                    >
                      <div
                        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors ${
                          isChecked
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white border-slate-300 group-hover:border-slate-400"
                        }`}
                      >
                        {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
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
                  {language === "ES" ? "Medicamento" : "Medication"} <span className="text-rose-500">*</span>
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
                  {language === "ES" ? "Dosis" : "Dose"} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formDose}
                  onChange={(e) => setFormDose(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. 8,000 units or 100 mg"
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
                  placeholder="e.g. Anemia or Iron Deficiency"
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
                  {language === "ES" ? "Marcar como administrado" : "Mark as administered (Given)"}
                </span>
              </label>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3 text-sm transition-colors shadow-sm cursor-pointer"
                >
                  {language === "ES" ? "Guardar Medicamento" : "Save Medication"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMedModalOpen(false)}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-3 text-sm transition-colors cursor-pointer"
                >
                  {language === "ES" ? "Cancelar" : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PROVIDER ORDER MODAL */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-left shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {language === "ES"
                  ? "Agregar Orden o Instrucción"
                  : "Add Provider Order / Instruction"}
              </h3>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formOrderError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
                {formOrderError}
              </div>
            )}

            <form onSubmit={handleAddOrderSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {language === "ES" ? "Fecha" : "Date"}
                </label>
                <input
                  type="text"
                  value={formOrderDate}
                  onChange={(e) => setFormOrderDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="May 31, 2024"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {language === "ES" ? "Orden / Instrucción" : "Order / Instruction"} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formOrderText}
                  onChange={(e) => setFormOrderText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Start phosphate binder with meals"
                  autoFocus
                />
              </div>

              <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formOrderCompleted}
                  onChange={(e) => setFormOrderCompleted(e.target.checked)}
                  className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="text-sm font-semibold text-slate-700">
                  {language === "ES" ? "Marcar como completado" : "Mark as completed"}
                </span>
              </label>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3 text-sm transition-colors shadow-sm cursor-pointer"
                >
                  {language === "ES" ? "Guardar Orden" : "Add Order"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-3 text-sm transition-colors cursor-pointer"
                >
                  {language === "ES" ? "Cancelar" : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
