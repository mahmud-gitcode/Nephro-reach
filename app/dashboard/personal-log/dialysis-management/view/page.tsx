"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  ShieldCheck,
  FileText,
  HelpCircle,
  Activity,
  AlertCircle,
  Plus,
  X,
  Pencil,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import RecoveryPatternSection from "@/components/dashboard/RecoveryPatternSection";
import CareTeamQuestionsSection from "@/components/dashboard/CareTeamQuestionsSection";

interface ProviderOrder {
  id: string;
  date: string;
  order: string;
  completed: boolean;
}

interface LoggedSymptomEntry {
  id: string;
  date: string;
  dayLabel: string;
  symptoms: string[];
  severity: "Mild" | "Moderate" | "Severe";
  notes: string;
}

interface LoggedMedicationEntry {
  id: string;
  date: string;
  category: string;
  medications: string[];
  status: "Taken" | "Administered" | "Scheduled";
}

interface TreatmentIntervalMeta {
  id: string;
  name: string;
  label: string;
  startDate: string;
  endDate: string;
  orders: ProviderOrder[];
  symptomEntries: LoggedSymptomEntry[];
  medEntries: LoggedMedicationEntry[];
}

const INTERVAL_VIEW_DATA: Record<string, TreatmentIntervalMeta> = {
  "tx-1": {
    id: "tx-1",
    name: "Treatment 1",
    label: "Treatment 1 ➔ Treatment 2",
    startDate: "Friday, Jun 19, 2026",
    endDate: "Monday, Jun 22, 2026",
    orders: [
      {
        id: "ord-1",
        date: "Jun 19, 2026",
        order: "Take phosphate binder with all solid meals",
        completed: true,
      },
      {
        id: "ord-2",
        date: "Jun 21, 2026",
        order: "Check standing BP before taking evening beta-blocker",
        completed: true,
      },
      {
        id: "ord-3",
        date: "Jun 22, 2026",
        order: "Report any access thrill changes immediately",
        completed: false,
      },
    ],
    symptomEntries: [
      {
        id: "sym-1",
        date: "Friday, Jun 19, 2026",
        dayLabel: "Day 1 (Post-Tx)",
        symptoms: ["Fatigue", "Mild dizziness"],
        severity: "Mild",
        notes: "Rested for 3 hours after clinic. Felt back to baseline by evening.",
      },
      {
        id: "sym-2",
        date: "Saturday, Jun 20, 2026",
        dayLabel: "Day 2 (Interdialytic)",
        symptoms: ["Mild ankle swelling", "Itching"],
        severity: "Mild",
        notes: "Elevated legs while watching TV. Applied prescribed moisturizing cream.",
      },
      {
        id: "sym-3",
        date: "Sunday, Jun 21, 2026",
        dayLabel: "Day 3 (Interdialytic)",
        symptoms: ["Restless legs", "Difficulty sleeping flat"],
        severity: "Moderate",
        notes: "Used an extra pillow. Mentioned to care team log.",
      },
    ],
    medEntries: [
      {
        id: "med-1",
        date: "Friday, Jun 19, 2026",
        category: "Anemia & Iron Management",
        medications: ["Epogen", "Venofer"],
        status: "Administered",
      },
      {
        id: "med-2",
        date: "Saturday, Jun 20, 2026",
        category: "Bone & Mineral Management",
        medications: ["Hectorol", "Sensipar"],
        status: "Taken",
      },
      {
        id: "med-3",
        date: "Sunday, Jun 21, 2026",
        category: "Blood Pressure & Anticoagulation",
        medications: ["Heparin", "Clonidine"],
        status: "Taken",
      },
    ],
  },
  "tx-2": {
    id: "tx-2",
    name: "Treatment 2",
    label: "Treatment 2 ➔ Treatment 3",
    startDate: "Monday, Jun 22, 2026",
    endDate: "Wednesday, Jun 24, 2026",
    orders: [
      {
        id: "ord-201",
        date: "Jun 22, 2026",
        order: "Schedule access ultrasound review",
        completed: false,
      },
      {
        id: "ord-202",
        date: "Jun 23, 2026",
        order: "Limit fluid intake to 32 oz/day",
        completed: true,
      },
    ],
    symptomEntries: [
      {
        id: "sym-201",
        date: "Monday, Jun 22, 2026",
        dayLabel: "Day 1 (Post-Tx)",
        symptoms: ["Fatigue", "Muscle cramping"],
        severity: "Moderate",
        notes: "Calf cramps resolved after warm compress.",
      },
      {
        id: "sym-202",
        date: "Tuesday, Jun 23, 2026",
        dayLabel: "Day 2 (Interdialytic)",
        symptoms: ["Mild swelling"],
        severity: "Mild",
        notes: "Morning weight within target dry weight range (+1.4 kg).",
      },
    ],
    medEntries: [
      {
        id: "med-201",
        date: "Monday, Jun 22, 2026",
        category: "Anemia & Iron Management",
        medications: ["Epogen"],
        status: "Administered",
      },
      {
        id: "med-202",
        date: "Tuesday, Jun 23, 2026",
        category: "Bone & Mineral Management",
        medications: ["Hectorol"],
        status: "Taken",
      },
    ],
  },
  "tx-3": {
    id: "tx-3",
    name: "Treatment 3",
    label: "Treatment 3 ➔ Treatment 4",
    startDate: "Wednesday, Jun 24, 2026",
    endDate: "Saturday, Jun 27, 2026",
    orders: [
      {
        id: "ord-301",
        date: "Jun 24, 2026",
        order: "Increase dietary protein intake",
        completed: false,
      },
    ],
    symptomEntries: [
      {
        id: "sym-301",
        date: "Thursday, Jun 25, 2026",
        dayLabel: "Day 2 (Interdialytic)",
        symptoms: ["Fatigue", "Decreased appetite"],
        severity: "Mild",
        notes: "Ate protein snack in evening.",
      },
    ],
    medEntries: [
      {
        id: "med-301",
        date: "Wednesday, Jun 24, 2026",
        category: "Anemia & Iron Management",
        medications: ["Venofer"],
        status: "Administered",
      },
    ],
  },
  "tx-4": {
    id: "tx-4",
    name: "Treatment 4",
    label: "Treatment 4 ➔ Next Week Treatment 1",
    startDate: "Saturday, Jun 27, 2026",
    endDate: "Tuesday, Jun 30, 2026",
    orders: [
      {
        id: "ord-401",
        date: "Jun 27, 2026",
        order: "Take iron supplement daily with Vitamin C",
        completed: true,
      },
    ],
    symptomEntries: [
      {
        id: "sym-401",
        date: "Sunday, Jun 28, 2026",
        dayLabel: "Day 2 (Weekend Gap)",
        symptoms: ["Mild ankle tightness"],
        severity: "Mild",
        notes: "Weekend fluid control maintained under 32 oz.",
      },
    ],
    medEntries: [
      {
        id: "med-401",
        date: "Saturday, Jun 27, 2026",
        category: "Symptom Relief & Supportive Care",
        medications: ["Hectorol", "Tylenol"],
        status: "Taken",
      },
    ],
  },
};

const LOCALIZED_SPANISH_DAYS: Record<string, string> = {
  Friday: "Viernes",
  Saturday: "Sábado",
  Sunday: "Domingo",
  Monday: "Lunes",
  Tuesday: "Martes",
  Wednesday: "Miércoles",
  Thursday: "Jueves",
};

const TREATMENT_VALID_DATES: Record<
  string,
  { dateStr: string; dayLabel: string; shortDate: string }[]
> = {
  "tx-1": [
    { dateStr: "Friday, Jun 19, 2026", dayLabel: "Friday", shortDate: "Jun 19, 2026" },
    { dateStr: "Saturday, Jun 20, 2026", dayLabel: "Saturday", shortDate: "Jun 20, 2026" },
    { dateStr: "Sunday, Jun 21, 2026", dayLabel: "Sunday", shortDate: "Jun 21, 2026" },
    { dateStr: "Monday, Jun 22, 2026", dayLabel: "Monday", shortDate: "Jun 22, 2026" },
  ],
  "tx-2": [
    { dateStr: "Monday, Jun 22, 2026", dayLabel: "Monday", shortDate: "Jun 22, 2026" },
    { dateStr: "Tuesday, Jun 23, 2026", dayLabel: "Tuesday", shortDate: "Jun 23, 2026" },
    { dateStr: "Wednesday, Jun 24, 2026", dayLabel: "Wednesday", shortDate: "Jun 24, 2026" },
  ],
  "tx-3": [
    { dateStr: "Wednesday, Jun 24, 2026", dayLabel: "Wednesday", shortDate: "Jun 24, 2026" },
    { dateStr: "Thursday, Jun 25, 2026", dayLabel: "Thursday", shortDate: "Jun 25, 2026" },
    { dateStr: "Friday, Jun 26, 2026", dayLabel: "Friday", shortDate: "Jun 26, 2026" },
    { dateStr: "Saturday, Jun 27, 2026", dayLabel: "Saturday", shortDate: "Jun 27, 2026" },
  ],
  "tx-4": [
    { dateStr: "Saturday, Jun 27, 2026", dayLabel: "Saturday", shortDate: "Jun 27, 2026" },
    { dateStr: "Sunday, Jun 28, 2026", dayLabel: "Sunday", shortDate: "Jun 28, 2026" },
    { dateStr: "Monday, Jun 29, 2026", dayLabel: "Monday", shortDate: "Jun 29, 2026" },
    { dateStr: "Tuesday, Jun 30, 2026", dayLabel: "Tuesday", shortDate: "Jun 30, 2026" },
  ],
};

const COMMON_SYMPTOM_OPTIONS = [
  "Fatigue",
  "Mild dizziness",
  "Muscle cramps",
  "Mild ankle swelling",
  "Itching",
  "Restless legs",
  "Difficulty sleeping",
  "Nausea",
  "Headache",
  "Low energy",
  "Chest tightness",
  "Dry mouth",
];

const LOCALIZED_SYMPTOMS: Record<string, string> = {
  Fatigue: "Fatiga",
  "Mild dizziness": "Mareo leve",
  "Muscle cramps": "Calambres musculares",
  "Mild ankle swelling": "Hinchazón leve de tobillo",
  Itching: "Picazón",
  "Restless legs": "Piernas inquietas",
  "Difficulty sleeping": "Dificultad para dormir",
  Nausea: "Náuseas",
  Headache: "Dolor de cabeza",
  "Low energy": "Baja energía",
  "Chest tightness": "Opresión en el pecho",
  "Dry mouth": "Boca seca",
};

interface MedicationCategoryGroup {
  category: string;
  categoryEs: string;
  medications: string[];
}

const COMMON_MEDICATION_GROUPS: MedicationCategoryGroup[] = [
  {
    category: "Anemia & Iron Management",
    categoryEs: "Manejo de Anemia y Hierro",
    medications: ["Epogen", "Mircera", "Venofer"],
  },
  {
    category: "Bone & Mineral Management",
    categoryEs: "Salud Ósea y Mineral",
    medications: ["Calcitriol", "Hectorol", "Zemplar", "Sensipar", "Parsabiv"],
  },
  {
    category: "Blood Pressure & Anticoagulation",
    categoryEs: "Presión Arterial y Anticoagulación",
    medications: ["Heparin", "Clonidine", "Midodrine"],
  },
  {
    category: "Symptom Relief & Supportive Care",
    categoryEs: "Alivio de Síntomas y Cuidado de Soporte",
    medications: ["Korsuva", "Tylenol", "Benadryl", "Zofran", "Antibiotics"],
  },
];

function parseDayAndDate(str: string) {
  const commaIndex = str.indexOf(",");
  if (commaIndex !== -1) {
    return {
      day: str.slice(0, commaIndex).trim() + ",",
      date: str.slice(commaIndex + 1).trim(),
    };
  }
  return { day: str, date: "" };
}

const DATE_TO_DAY_MAP: Record<string, string> = {
  "Jun 19, 2026": "Friday",
  "Jun 20, 2026": "Saturday",
  "Jun 21, 2026": "Sunday",
  "Jun 22, 2026": "Monday",
  "Jun 23, 2026": "Tuesday",
  "Jun 24, 2026": "Wednesday",
  "Jun 25, 2026": "Thursday",
  "Jun 26, 2026": "Friday",
  "Jun 27, 2026": "Saturday",
  "Jun 28, 2026": "Sunday",
  "Jun 29, 2026": "Monday",
  "Jun 30, 2026": "Tuesday",
};

const SPANISH_DAYS: Record<string, string> = {
  Friday: "Viernes",
  Saturday: "Sábado",
  Sunday: "Domingo",
  Monday: "Lunes",
  Tuesday: "Martes",
  Wednesday: "Miércoles",
  Thursday: "Jueves",
};

function getDayAndDate(dateStr: string, isEs: boolean) {
  let dayName = "";
  let datePart = dateStr.trim();

  if (datePart.includes(",")) {
    const parts = datePart.split(",");
    if (parts.length === 3) {
      dayName = parts[0].trim();
      datePart = `${parts[1].trim()}, ${parts[2].trim()}`;
    }
  }

  if (!dayName && DATE_TO_DAY_MAP[datePart]) {
    dayName = DATE_TO_DAY_MAP[datePart];
  }

  if (!dayName) {
    const parsed = new Date(datePart);
    if (!isNaN(parsed.getTime())) {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      dayName = days[parsed.getDay()];
    }
  }

  const localizedDay = isEs && SPANISH_DAYS[dayName] ? SPANISH_DAYS[dayName] : dayName;

  return {
    day: localizedDay || "-",
    date: datePart,
  };
}

function ViewRecordContent() {
  const searchParams = useSearchParams();
  const treatmentParam = searchParams.get("treatment") || "tx-1";
  const activeKey = INTERVAL_VIEW_DATA[treatmentParam] ? treatmentParam : "tx-1";
  const intervalData = INTERVAL_VIEW_DATA[activeKey];
  const availableDates = TREATMENT_VALID_DATES[activeKey] || TREATMENT_VALID_DATES["tx-1"];

  const { language } = useLanguage();
  const isEs = language === "ES";

  const startParsed = parseDayAndDate(intervalData.startDate);
  const endParsed = parseDayAndDate(intervalData.endDate);

  const [orders, setOrders] = useState<ProviderOrder[]>(intervalData.orders);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [formOrderDate, setFormOrderDate] = useState(availableDates[0].shortDate);
  const [formOrderText, setFormOrderText] = useState("");
  const [formOrderError, setFormOrderError] = useState("");

  const handleOpenAddOrder = () => {
    setFormOrderDate(availableDates[0].shortDate);
    setFormOrderText("");
    setFormOrderError("");
    setIsOrderModalOpen(true);
  };

  const handleAddOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOrderText.trim()) {
      setFormOrderError(
        isEs
          ? "Por favor escribe la instrucción u orden"
          : "Please enter the order instruction"
      );
      return;
    }
    const newOrder: ProviderOrder = {
      id: `ord-${Date.now()}`,
      date: formOrderDate,
      order: formOrderText.trim(),
      completed: false,
    };
    setOrders((prev) => [newOrder, ...prev]);
    setIsOrderModalOpen(false);
  };

  const toggleOrderCompleted = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, completed: !o.completed } : o))
    );
  };

  // Symptoms state & handlers:
  const [symptomsList, setSymptomsList] = useState<LoggedSymptomEntry[]>(() =>
    intervalData.symptomEntries.map((s) => ({
      ...s,
      date: s.date.includes(",") ? s.date.slice(s.date.indexOf(",") + 1).trim() : s.date,
    }))
  );
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  const [editingSymptomId, setEditingSymptomId] = useState<string | null>(null);
  const [formSymptomDate, setFormSymptomDate] = useState(availableDates[0].shortDate);
  const [formSelectedSymptoms, setFormSelectedSymptoms] = useState<string[]>([]);
  const [formCustomSymptom, setFormCustomSymptom] = useState("");
  const [symptomFormError, setSymptomFormError] = useState("");

  const handleOpenAddSymptom = () => {
    setEditingSymptomId(null);
    setFormSymptomDate(availableDates[0].shortDate);
    setFormSelectedSymptoms([]);
    setFormCustomSymptom("");
    setSymptomFormError("");
    setIsSymptomModalOpen(true);
  };

  const handleOpenEditSymptom = (entry: LoggedSymptomEntry) => {
    setEditingSymptomId(entry.id);
    setFormSymptomDate(entry.date);
    setFormSelectedSymptoms([...entry.symptoms]);
    setFormCustomSymptom("");
    setSymptomFormError("");
    setIsSymptomModalOpen(true);
  };

  const toggleSymptomSelection = (sym: string) => {
    setFormSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
    if (symptomFormError) setSymptomFormError("");
  };

  const handleAddCustomSymptom = () => {
    const trimmed = formCustomSymptom.trim();
    if (trimmed && !formSelectedSymptoms.includes(trimmed)) {
      setFormSelectedSymptoms((prev) => [...prev, trimmed]);
      setFormCustomSymptom("");
      if (symptomFormError) setSymptomFormError("");
    }
  };

  const handleSymptomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formSelectedSymptoms.length === 0) {
      setSymptomFormError(
        isEs ? "Selecciona al menos un síntoma" : "Please select at least one symptom"
      );
      return;
    }

    if (editingSymptomId) {
      setSymptomsList((prev) =>
        prev.map((s) =>
          s.id === editingSymptomId
            ? { ...s, date: formSymptomDate, symptoms: formSelectedSymptoms }
            : s
        )
      );
    } else {
      const newEntry: LoggedSymptomEntry = {
        id: `sym-${Date.now()}`,
        date: formSymptomDate,
        dayLabel: "",
        symptoms: formSelectedSymptoms,
        severity: "Mild",
        notes: "",
      };
      setSymptomsList((prev) => [newEntry, ...prev]);
    }
    setIsSymptomModalOpen(false);
  };

  // Medications state & handlers:
  const [medicationsList, setMedicationsList] = useState<LoggedMedicationEntry[]>(() =>
    intervalData.medEntries.map((m) => ({
      ...m,
      date: m.date.includes(",") ? m.date.slice(m.date.indexOf(",") + 1).trim() : m.date,
    }))
  );
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [formMedDate, setFormMedDate] = useState(availableDates[0].shortDate);
  const [formSelectedMeds, setFormSelectedMeds] = useState<string[]>([]);
  const [formCustomMed, setFormCustomMed] = useState("");
  const [medFormError, setMedFormError] = useState("");

  useEffect(() => {
    setOrders(intervalData.orders);
    setSymptomsList(
      intervalData.symptomEntries.map((s) => ({
        ...s,
        date: s.date.includes(",") ? s.date.slice(s.date.indexOf(",") + 1).trim() : s.date,
      }))
    );
    setMedicationsList(
      intervalData.medEntries.map((m) => ({
        ...m,
        date: m.date.includes(",") ? m.date.slice(m.date.indexOf(",") + 1).trim() : m.date,
      }))
    );
  }, [activeKey]);

  const handleOpenAddMed = () => {
    setEditingMedId(null);
    setFormMedDate(availableDates[0].shortDate);
    setFormSelectedMeds([]);
    setFormCustomMed("");
    setMedFormError("");
    setIsMedModalOpen(true);
  };

  const handleOpenEditMed = (entry: LoggedMedicationEntry) => {
    setEditingMedId(entry.id);
    const parsed = getDayAndDate(entry.date, false);
    setFormMedDate(parsed.date);
    setFormSelectedMeds([...entry.medications]);
    setFormCustomMed("");
    setMedFormError("");
    setIsMedModalOpen(true);
  };

  const toggleMedSelection = (medName: string) => {
    setFormSelectedMeds((prev) =>
      prev.includes(medName) ? prev.filter((m) => m !== medName) : [...prev, medName]
    );
    if (medFormError) setMedFormError("");
  };

  const handleAddCustomMed = () => {
    const trimmed = formCustomMed.trim();
    if (trimmed && !formSelectedMeds.includes(trimmed)) {
      setFormSelectedMeds((prev) => [...prev, trimmed]);
      setFormCustomMed("");
      if (medFormError) setMedFormError("");
    }
  };

  const handleMedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formSelectedMeds.length === 0) {
      setMedFormError(
        isEs ? "Selecciona al menos un medicamento" : "Please select at least one medication"
      );
      return;
    }

    if (editingMedId) {
      setMedicationsList((prev) =>
        prev.map((m) =>
          m.id === editingMedId
            ? { ...m, date: formMedDate, medications: formSelectedMeds }
            : m
        )
      );
    } else {
      const newEntry: LoggedMedicationEntry = {
        id: `med-${Date.now()}`,
        date: formMedDate,
        category: "General",
        medications: formSelectedMeds,
        status: "Administered",
      };
      setMedicationsList((prev) => [newEntry, ...prev]);
    }
    setIsMedModalOpen(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      {/* Top Breadcrumb Navigation */}
      <div>
        <Link
          href="/dashboard/personal-log/dialysis-management"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEs ? "Volver a Gestión de Diálisis" : "Back to Dialysis Management"}
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* TOP HEADER CARD: TREATMENT TITLE, INTERVAL BADGE & DATES                 */}
      {/* ========================================================================= */}
      <section className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Treatment 1 and beside it Treatment 1 ➔ Treatment 2 */}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {intervalData.name}
            </h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2563EB] border border-blue-100">
              {intervalData.label}
            </span>
          </div>

          {/* Right: Date block in place of the removed record button */}
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <div className="leading-snug">
              <span className="block font-bold text-slate-900">{startParsed.day}</span>
              <span className="block text-slate-600 font-medium">{startParsed.date}</span>
            </div>
            <span className="text-slate-400 font-bold text-base select-none">-</span>
            <div className="leading-snug">
              <span className="block font-bold text-slate-900">{endParsed.day}</span>
              <span className="block text-slate-600 font-medium">{endParsed.date}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 1. RECOVERY PATTERN TRACKING                                              */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <RecoveryPatternSection treatmentId={activeKey} />
      </section>

      {/* ========================================================================= */}
      {/* 2. PROVIDER ORDERS & INSTRUCTIONS                                         */}
      {/* ========================================================================= */}
      <section className="space-y-3.5 animate-in fade-in duration-200">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {isEs ? "Órdenes e Instrucciones del Proveedor" : "Provider Orders & Instructions"}
          </h2>

          <button
            type="button"
            onClick={handleOpenAddOrder}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>{isEs ? "Nueva Orden" : "Add Order"}</span>
          </button>
        </div>

        {/* Orders Table - Matched with Add Page format */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/90 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 w-28 sm:w-32">{isEs ? "Día" : "Day"}</th>
                <th className="py-3 px-4 w-32 sm:w-36">{isEs ? "Fecha" : "Date"}</th>
                <th className="py-3 px-4">{isEs ? "Orden / Instrucción" : "Order / Instruction"}</th>
                <th className="py-3 px-4 text-center w-28">{isEs ? "Completado" : "Completed"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {orders.map((item) => {
                const { day, date } = getDayAndDate(item.date, isEs);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-slate-900 whitespace-nowrap font-bold text-xs sm:text-sm">
                      {day}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-medium text-xs sm:text-sm">
                      {date}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SYMPTOMS BETWEEN TREATMENTS                                            */}
      {/* ========================================================================= */}
      <section className="space-y-3.5 animate-in fade-in duration-200">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {isEs ? "Síntomas Entre Tratamientos" : "Symptoms Between Treatments"}
          </h2>

          <button
            type="button"
            onClick={handleOpenAddSymptom}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>{isEs ? "Agregar Nuevo" : "Add New"}</span>
          </button>
        </div>

        {/* Symptoms Table - Normal Clean Design (Day, Date, Symptoms, Edit Icon) */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/90 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 w-28 sm:w-32">{isEs ? "Día" : "Day"}</th>
                <th className="py-3 px-4 w-32 sm:w-36">{isEs ? "Fecha" : "Date"}</th>
                <th className="py-3 px-4">{isEs ? "Síntomas" : "Symptoms"}</th>
                <th className="py-3 px-4 text-center w-24">{isEs ? "Editar" : "Edit"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {symptomsList.map((entry) => {
                const { day, date } = getDayAndDate(entry.date, isEs);
                return (
                  <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-slate-900 whitespace-nowrap font-bold text-xs sm:text-sm">
                      {day}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-medium text-xs sm:text-sm">
                      {date}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {entry.symptoms.map((sym, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-[#2563EB] border border-blue-100"
                          >
                            {sym}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEditSymptom(entry)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-600 hover:text-[#2563EB] transition-colors cursor-pointer select-none active:scale-95"
                        title={isEs ? "Editar Síntomas" : "Edit Symptoms"}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. COMMON DIALYSIS MEDICATIONS                                            */}
      {/* ========================================================================= */}
      <section className="space-y-3.5 animate-in fade-in duration-200">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {isEs ? "Medicamentos Comunes de Diálisis" : "Common Dialysis Medications"}
          </h2>

          <button
            type="button"
            onClick={handleOpenAddMed}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>{isEs ? "Agregar Nuevo" : "Add New"}</span>
          </button>
        </div>

        {/* Medications Table - Same Simple Clean Design as Symptoms & Orders */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/90 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 w-28 sm:w-32">{isEs ? "Día" : "Day"}</th>
                <th className="py-3 px-4 w-32 sm:w-36">{isEs ? "Fecha" : "Date"}</th>
                <th className="py-3 px-4">{isEs ? "Medicamentos Administrados" : "Medications Confirmed"}</th>
                <th className="py-3 px-4 text-center w-24">{isEs ? "Editar" : "Edit"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {medicationsList.map((entry) => {
                const { day, date } = getDayAndDate(entry.date, isEs);
                return (
                  <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-slate-900 whitespace-nowrap font-bold text-xs sm:text-sm">
                      {day}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-medium text-xs sm:text-sm">
                      {date}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {entry.medications.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">
                            {isEs ? "Ninguno seleccionado" : "None selected"}
                          </span>
                        ) : (
                          entry.medications.map((m, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200"
                            >
                              {m}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEditMed(entry)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-600 hover:text-[#2563EB] transition-colors cursor-pointer select-none active:scale-95"
                        title={isEs ? "Editar Medicamentos" : "Edit Medications"}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CARE TEAM QUESTIONS                                                    */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <CareTeamQuestionsSection />
      </section>

      {/* ========================================================================= */}
      {/* ADD ORDER MODAL (RESTRICTED STRICTLY TO ACTIVE INTERVAL DATES)            */}
      {/* ========================================================================= */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900">
                {isEs ? "Agregar Nueva Orden" : "Add New Order"}
              </h4>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddOrderSubmit} className="space-y-4">
              {/* Step 1: Select date strictly from this treatment interval */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isEs ? "1. Seleccionar Fecha del Intervalo" : "1. Select Treatment Interval Date"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableDates.map((d) => {
                    const isSelected = formOrderDate === d.shortDate;
                    return (
                      <button
                        key={d.shortDate}
                        type="button"
                        onClick={() => setFormOrderDate(d.shortDate)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none ${
                          isSelected
                            ? "border-[#2563EB] bg-blue-50/80 ring-2 ring-[#2563EB]/20 text-[#2563EB]"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span className="block text-xs font-bold">
                          {isEs ? LOCALIZED_SPANISH_DAYS[d.dayLabel] || d.dayLabel : d.dayLabel}
                        </span>
                        <span className="block text-[11px] font-semibold text-slate-500">
                          {d.shortDate}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Order text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isEs ? "2. Orden / Instrucción" : "2. Order / Instruction"}
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
                      ? "Ej: Tomar aglutinante de fosfato con todas las comidas sólidas..."
                      : "e.g. Take phosphate binder with all solid meals or schedule access ultrasound..."
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none shadow-2xs"
                />
                {formOrderError && (
                  <p className="text-xs font-medium text-rose-500 mt-1">
                    {formOrderError}
                  </p>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {isEs ? "Cancelar" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-colors shadow-2xs cursor-pointer"
                >
                  {isEs ? "Guardar Orden" : "Save Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Symptom Modal */}
      {isSymptomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900">
                {editingSymptomId
                  ? isEs
                    ? "Editar Síntomas"
                    : "Edit Symptoms"
                  : isEs
                  ? "Agregar Síntomas"
                  : "Add Symptoms"}
              </h4>
              <button
                type="button"
                onClick={() => setIsSymptomModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSymptomSubmit} className="space-y-4">
              {/* Step 1: Select Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isEs ? "1. Seleccionar Fecha del Tratamiento" : "1. Select Treatment Date"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableDates.map((d) => {
                    const isSelected = formSymptomDate === d.shortDate;
                    return (
                      <button
                        key={d.shortDate}
                        type="button"
                        onClick={() => setFormSymptomDate(d.shortDate)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none ${
                          isSelected
                            ? "border-[#2563EB] bg-blue-50/80 ring-2 ring-[#2563EB]/20 text-[#2563EB]"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span className="block text-xs font-bold">
                          {isEs ? LOCALIZED_SPANISH_DAYS[d.dayLabel] || d.dayLabel : d.dayLabel}
                        </span>
                        <span className="block text-[11px] font-semibold text-slate-500">
                          {d.shortDate}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select Symptoms */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isEs ? "2. Seleccionar Síntomas" : "2. Select Symptoms"}
                </label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
                  {COMMON_SYMPTOM_OPTIONS.map((sym) => {
                    const isSelected = formSelectedSymptoms.includes(sym);
                    return (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => toggleSymptomSelection(sym)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                          isSelected
                            ? "bg-[#2563EB] text-white shadow-2xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        <span>{isEs ? LOCALIZED_SYMPTOMS[sym] || sym : sym}</span>
                      </button>
                    );
                  })}
                </div>
                {symptomFormError && (
                  <p className="text-xs font-medium text-rose-500 mt-1">
                    {symptomFormError}
                  </p>
                )}
              </div>

              {/* Step 3: Custom Symptom Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isEs ? "Otro Síntoma (Opcional)" : "Other Symptom (Optional)"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formCustomSymptom}
                    onChange={(e) => setFormCustomSymptom(e.target.value)}
                    placeholder={
                      isEs ? "Escribir síntoma personalizado..." : "Type custom symptom..."
                    }
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSymptom}
                    className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    {isEs ? "Agregar" : "Add"}
                  </button>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSymptomModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {isEs ? "Cancelar" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-colors shadow-2xs cursor-pointer"
                >
                  {editingSymptomId
                    ? isEs
                      ? "Actualizar"
                      : "Update Symptoms"
                    : isEs
                    ? "Guardar"
                    : "Save Symptoms"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* ADD / EDIT MEDICATIONS MODAL                                              */}
      {/* ========================================================================= */}
      {isMedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900">
                {editingMedId
                  ? isEs
                    ? "Editar Medicamentos de Diálisis"
                    : "Edit Dialysis Medications"
                  : isEs
                  ? "Registrar Medicamentos de Diálisis"
                  : "Log Dialysis Medications"}
              </h4>
              <button
                type="button"
                onClick={() => setIsMedModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <form onSubmit={handleMedSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Step 1: Select Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isEs ? "1. Seleccionar Fecha del Intervalo" : "1. Select Treatment Interval Date"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableDates.map((d) => {
                    const isSelected = formMedDate === d.shortDate;
                    return (
                      <button
                        key={d.shortDate}
                        type="button"
                        onClick={() => setFormMedDate(d.shortDate)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none ${
                          isSelected
                            ? "border-[#2563EB] bg-blue-50/80 ring-2 ring-[#2563EB]/20 text-[#2563EB]"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span className="block text-xs font-bold">
                          {isEs && SPANISH_DAYS[d.dayLabel] ? SPANISH_DAYS[d.dayLabel] : d.dayLabel}
                        </span>
                        <span className="block text-[11px] font-semibold text-slate-500">
                          {d.shortDate}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select/Mark Medications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    {isEs
                      ? "2. Marcar Medicamentos Administrados / Tomados"
                      : "2. Mark Administered / Taken Medications"}
                  </label>
                  <span className="text-xs text-slate-500 font-semibold">
                    {formSelectedMeds.length} {isEs ? "seleccionados" : "selected"}
                  </span>
                </div>

                <div className="space-y-4">
                  {COMMON_MEDICATION_GROUPS.map((grp, gIdx) => (
                    <div key={gIdx} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 space-y-2.5">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        {isEs ? grp.categoryEs : grp.category}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {grp.medications.map((med) => {
                          const isSelected = formSelectedMeds.includes(med);
                          return (
                            <button
                              key={med}
                              type="button"
                              onClick={() => toggleMedSelection(med)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                                isSelected
                                  ? "bg-[#2563EB] text-white border-[#2563EB] shadow-2xs"
                                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <span>{med}</span>
                              {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom Medication Input */}
                <div className="pt-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isEs ? "Otro Medicamento (Opcional)" : "Other Medication (Optional)"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formCustomMed}
                      onChange={(e) => setFormCustomMed(e.target.value)}
                      placeholder={isEs ? "Escribir otro medicamento..." : "Type other medication..."}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomMed}
                      className="rounded-xl bg-slate-800 hover:bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      {isEs ? "Agregar" : "Add"}
                    </button>
                  </div>
                </div>

                {medFormError && (
                  <p className="text-xs font-semibold text-rose-500">{medFormError}</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMedModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {isEs ? "Cancelar" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2563EB] hover:bg-blue-700 px-5 py-2 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer"
                >
                  {editingMedId
                    ? isEs
                      ? "Actualizar"
                      : "Update Medications"
                    : isEs
                    ? "Guardar"
                    : "Save Medications"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DialysisManagementViewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
      <ViewRecordContent />
    </Suspense>
  );
}
