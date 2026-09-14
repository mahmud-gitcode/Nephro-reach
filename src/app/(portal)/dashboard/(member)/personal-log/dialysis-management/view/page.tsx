"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Clock,
  FileText,
  Activity,
  AlertCircle,
  Plus,
  Pencil,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import RecoveryPatternSection from "@/features/personal-log/RecoveryPatternSection";
import CareTeamQuestionsSection from "@/features/care-team/CareTeamQuestionsSection";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import {
  Badge,
  Button,
  Card,
  Chip,
  ChipGroup,
  FormField,
  Input,
  Modal,
  RadioCard,
  RadioGroup,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Textarea,
} from "@/components/ui";

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
  recoveryTime?: string;
  notes: string;
}

interface TreatmentIntervalMeta {
  id: string;
  name: string;
  label: string;
  startDate: string;
  endDate: string;
  orders: ProviderOrder[];
  symptomEntries: LoggedSymptomEntry[];
  isExtra?: boolean;
  clinicalReason?: string;
  additionalNotes?: string;
}

const INTERVAL_VIEW_DATA: Record<string, TreatmentIntervalMeta> = {
  "tx-1": {
    id: "tx-1",
    name: "Treatment 1",
    label: "Treatment 1 ➔ Treatment 2",
    startDate: "Friday, Jun 19, 2026",
    endDate: "Monday, Jun 22, 2026",
    isExtra: false,
    orders: [
      {
        id: "ord-1",
        date: "Jun 19, 2026",
        order: "Take phosphate binder with all solid meals",
        completed: true,
      },
      {
        id: "ord-2",
        date: "Jun 19, 2026",
        order:
          "Keep vascular access dressing clean and dry for 6 hours post-treatment",
        completed: true,
      },
      {
        id: "ord-3",
        date: "Jun 20, 2026",
        order: "Record morning dry weight before breakfast and log in portal",
        completed: true,
      },
      {
        id: "ord-4",
        date: "Jun 21, 2026",
        order: "Check standing BP before taking evening beta-blocker",
        completed: true,
      },
      {
        id: "ord-5",
        date: "Jun 21, 2026",
        order: "Maintain daily sodium restriction under 2,000 mg",
        completed: false,
      },
      {
        id: "ord-6",
        date: "Jun 22, 2026",
        order: "Report any access thrill or bruit changes immediately",
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
        recoveryTime: "2 – 4 hours",
        notes:
          "Rested for 3 hours after clinic. Felt back to baseline by evening.",
      },
      {
        id: "sym-2",
        date: "Saturday, Jun 20, 2026",
        dayLabel: "Day 2 (Interdialytic)",
        symptoms: ["Mild ankle swelling", "Itching"],
        severity: "Mild",
        recoveryTime: "< 2 hours",
        notes:
          "Elevated legs while watching TV. Applied prescribed moisturizing cream.",
      },
      {
        id: "sym-3",
        date: "Sunday, Jun 21, 2026",
        dayLabel: "Day 3 (Interdialytic)",
        symptoms: ["Restless legs", "Difficulty sleeping flat"],
        severity: "Moderate",
        recoveryTime: "4 – 6 hours",
        notes: "Used an extra pillow. Mentioned to care team log.",
      },
    ],
  },
  "tx-2": {
    id: "tx-2",
    name: "Treatment 2",
    label: "Treatment 2 ➔ Treatment 3",
    startDate: "Monday, Jun 22, 2026",
    endDate: "Wednesday, Jun 24, 2026",
    isExtra: false,
    orders: [
      {
        id: "ord-201",
        date: "Jun 22, 2026",
        order: "Schedule access ultrasound review with vascular surgeon",
        completed: false,
      },
      {
        id: "ord-202",
        date: "Jun 22, 2026",
        order: "Verify fistula thrill/bruit morning and evening",
        completed: true,
      },
      {
        id: "ord-203",
        date: "Jun 23, 2026",
        order: "Limit interdialytic fluid intake to 32 oz (1,000 mL) per day",
        completed: true,
      },
      {
        id: "ord-204",
        date: "Jun 23, 2026",
        order:
          "Hold morning antihypertensive if pre-dialysis systolic BP < 110 mmHg",
        completed: true,
      },
      {
        id: "ord-205",
        date: "Jun 24, 2026",
        order: "Review monthly lab Kt/V clearance results with dialysis nurse",
        completed: false,
      },
      {
        id: "ord-206",
        date: "Jun 24, 2026",
        order:
          "Apply cool compress to cannulation sites if mild tenderness occurs",
        completed: false,
      },
    ],
    symptomEntries: [
      {
        id: "sym-201",
        date: "Monday, Jun 22, 2026",
        dayLabel: "Day 1 (Post-Tx)",
        symptoms: ["Fatigue", "Muscle cramping"],
        severity: "Moderate",
        recoveryTime: "4 – 6 hours",
        notes: "Calf cramps resolved after warm compress.",
      },
      {
        id: "sym-202",
        date: "Tuesday, Jun 23, 2026",
        dayLabel: "Day 2 (Interdialytic)",
        symptoms: ["Mild swelling"],
        severity: "Mild",
        recoveryTime: "< 2 hours",
        notes: "Morning weight within target dry weight range (+1.4 kg).",
      },
    ],
  },
  "tx-3": {
    id: "tx-3",
    name: "Treatment 3",
    label: "Treatment 3 ➔ Treatment 4",
    startDate: "Wednesday, Jun 24, 2026",
    endDate: "Saturday, Jun 27, 2026",
    isExtra: false,
    orders: [
      {
        id: "ord-301",
        date: "Jun 24, 2026",
        order:
          "Increase dietary protein intake with high biological value snacks",
        completed: false,
      },
      {
        id: "ord-302",
        date: "Jun 24, 2026",
        order: "Take active Vitamin D analog (Hectorol) with dinner meal",
        completed: true,
      },
      {
        id: "ord-303",
        date: "Jun 25, 2026",
        order:
          "Elevate lower extremities for 30 minutes twice daily to reduce edema",
        completed: true,
      },
      {
        id: "ord-304",
        date: "Jun 26, 2026",
        order:
          "Avoid lifting heavy objects (> 10 lbs) with vascular access arm",
        completed: true,
      },
      {
        id: "ord-305",
        date: "Jun 27, 2026",
        order: "Check and log access arterial flow rate during treatment setup",
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
        recoveryTime: "2 – 4 hours",
        notes: "Ate protein snack in evening.",
      },
    ],
  },
  "tx-4": {
    id: "tx-4",
    name: "Treatment 4",
    label: "Treatment 4 ➔ Next Week Treatment 1",
    startDate: "Saturday, Jun 27, 2026",
    endDate: "Tuesday, Jun 30, 2026",
    isExtra: false,
    orders: [
      {
        id: "ord-401",
        date: "Jun 27, 2026",
        order: "Take iron supplement daily with Vitamin C",
        completed: true,
      },
      {
        id: "ord-402",
        date: "Jun 28, 2026",
        order:
          "Strict adherence to 3-day weekend fluid restriction (< 1.5 L total)",
        completed: true,
      },
      {
        id: "ord-403",
        date: "Jun 28, 2026",
        order:
          "Inspect access puncture sites daily for erythema, warmth, or drainage",
        completed: true,
      },
      {
        id: "ord-404",
        date: "Jun 29, 2026",
        order: "Take renal multivitamin in the morning after breakfast",
        completed: false,
      },
      {
        id: "ord-405",
        date: "Jun 30, 2026",
        order:
          "Notify on-call nephrologist if weekend weight gain exceeds 2.5 kg",
        completed: false,
      },
    ],
    symptomEntries: [
      {
        id: "sym-401",
        date: "Sunday, Jun 28, 2026",
        dayLabel: "Day 2 (Weekend Gap)",
        symptoms: ["Mild ankle tightness"],
        severity: "Mild",
        recoveryTime: "< 2 hours",
        notes: "Weekend fluid control maintained under 32 oz.",
      },
    ],
  },
  "tx-extra-3-1": {
    id: "tx-extra-3-1",
    name: "Treatment 3.1",
    label: "Between Treatment 3.1 to 4",
    startDate: "Friday, Jun 26, 2026",
    endDate: "Saturday, Jun 27, 2026",
    isExtra: true,
    clinicalReason: "Fluid Overload (Extra Ultrafiltration needed)",
    additionalNotes:
      "Unscheduled extra session between treatment 3 and 4 to remove excess interdialytic fluid (+2.4 kg) and alleviate shortness of breath.",
    orders: [
      {
        id: "ord-ext-1",
        date: "Jun 26, 2026",
        order:
          "Complete 3.5-hour ultrafiltration-only cycle to achieve target dry weight",
        completed: true,
      },
      {
        id: "ord-ext-2",
        date: "Jun 26, 2026",
        order: "Monitor standing BP every 30 minutes during fluid removal",
        completed: true,
      },
      {
        id: "ord-ext-3",
        date: "Jun 27, 2026",
        order:
          "Strict adherence to 32 oz interdialytic fluid limit over the weekend",
        completed: false,
      },
    ],
    symptomEntries: [
      {
        id: "sym-ext-1",
        date: "Friday, Jun 26, 2026",
        dayLabel: "Extra Session Day",
        symptoms: ["Shortness of breath", "Pedal edema"],
        severity: "Moderate",
        recoveryTime: "2 – 4 hours",
        notes:
          "Breathing significantly improved following 2.1 L fluid removal.",
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
    {
      dateStr: "Friday, Jun 19, 2026",
      dayLabel: "Friday",
      shortDate: "Jun 19, 2026",
    },
    {
      dateStr: "Saturday, Jun 20, 2026",
      dayLabel: "Saturday",
      shortDate: "Jun 20, 2026",
    },
    {
      dateStr: "Sunday, Jun 21, 2026",
      dayLabel: "Sunday",
      shortDate: "Jun 21, 2026",
    },
    {
      dateStr: "Monday, Jun 22, 2026",
      dayLabel: "Monday",
      shortDate: "Jun 22, 2026",
    },
  ],
  "tx-2": [
    {
      dateStr: "Monday, Jun 22, 2026",
      dayLabel: "Monday",
      shortDate: "Jun 22, 2026",
    },
    {
      dateStr: "Tuesday, Jun 23, 2026",
      dayLabel: "Tuesday",
      shortDate: "Jun 23, 2026",
    },
    {
      dateStr: "Wednesday, Jun 24, 2026",
      dayLabel: "Wednesday",
      shortDate: "Jun 24, 2026",
    },
  ],
  "tx-3": [
    {
      dateStr: "Wednesday, Jun 24, 2026",
      dayLabel: "Wednesday",
      shortDate: "Jun 24, 2026",
    },
    {
      dateStr: "Thursday, Jun 25, 2026",
      dayLabel: "Thursday",
      shortDate: "Jun 25, 2026",
    },
    {
      dateStr: "Friday, Jun 26, 2026",
      dayLabel: "Friday",
      shortDate: "Jun 26, 2026",
    },
    {
      dateStr: "Saturday, Jun 27, 2026",
      dayLabel: "Saturday",
      shortDate: "Jun 27, 2026",
    },
  ],
  "tx-4": [
    {
      dateStr: "Saturday, Jun 27, 2026",
      dayLabel: "Saturday",
      shortDate: "Jun 27, 2026",
    },
    {
      dateStr: "Sunday, Jun 28, 2026",
      dayLabel: "Sunday",
      shortDate: "Jun 28, 2026",
    },
    {
      dateStr: "Monday, Jun 29, 2026",
      dayLabel: "Monday",
      shortDate: "Jun 29, 2026",
    },
    {
      dateStr: "Tuesday, Jun 30, 2026",
      dayLabel: "Tuesday",
      shortDate: "Jun 30, 2026",
    },
  ],
  "tx-extra-3-1": [
    {
      dateStr: "Friday, Jun 26, 2026",
      dayLabel: "Friday",
      shortDate: "Jun 26, 2026",
    },
    {
      dateStr: "Saturday, Jun 27, 2026",
      dayLabel: "Saturday",
      shortDate: "Jun 27, 2026",
    },
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

const RECOVERY_TIME_OPTIONS = [
  "< 2 hours",
  "2 – 4 hours",
  "4 – 6 hours",
  "> 6 hours",
  "Next morning / Overnight",
];

const LOCALIZED_RECOVERY_TIME: Record<string, string> = {
  "< 2 hours": "< 2 horas",
  "2 – 4 hours": "2 – 4 horas",
  "4 – 6 hours": "4 – 6 horas",
  "> 6 hours": "> 6 horas",
  "Next morning / Overnight": "A la mañana siguiente / Durante la noche",
};

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
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      dayName = days[parsed.getDay()];
    }
  }

  const localizedDay =
    isEs && SPANISH_DAYS[dayName] ? SPANISH_DAYS[dayName] : dayName;

  return {
    day: localizedDay || "-",
    date: datePart,
  };
}

function ViewRecordContent() {
  const searchParams = useSearchParams();
  const treatmentParam = searchParams.get("treatment") || "tx-1";
  const queryTitle = searchParams.get("title");
  const queryReason = searchParams.get("reason");
  const queryNotes = searchParams.get("notes");
  const isExtraQuery =
    searchParams.get("isExtra") === "true" ||
    treatmentParam.toLowerCase().includes("extra");

  const activeKey = INTERVAL_VIEW_DATA[treatmentParam]
    ? treatmentParam
    : "tx-1";
  const baseData = INTERVAL_VIEW_DATA[activeKey] || INTERVAL_VIEW_DATA["tx-1"];
  const availableDates =
    TREATMENT_VALID_DATES[activeKey] || TREATMENT_VALID_DATES["tx-1"];

  const { language } = useLanguage();
  const isEs = language === "ES";

  const isExtra = isExtraQuery || Boolean(baseData.isExtra);
  const clinicalReason = isExtra
    ? queryReason || baseData.clinicalReason || ""
    : "";
  const additionalNotes = isExtra
    ? queryNotes || baseData.additionalNotes || ""
    : "";

  const intervalData: TreatmentIntervalMeta = {
    ...baseData,
    id: treatmentParam,
    name: queryTitle || baseData.name,
    label:
      isExtra && !INTERVAL_VIEW_DATA[treatmentParam]
        ? isEs
          ? "Sesión Extra de Diálisis"
          : "Extra Dialysis Session"
        : baseData.label,
    isExtra,
    clinicalReason,
    additionalNotes,
  };

  const startParsed = parseDayAndDate(intervalData.startDate);
  const endParsed = parseDayAndDate(intervalData.endDate);

  /* Edits are held per treatment and fall back to that treatment's seed, so
     switching treatments shows the right list without an effect copying it
     into state on every change. */
  const [orderEdits, setOrderEdits] = useState<Record<string, ProviderOrder[]>>(
    {},
  );
  const orders = orderEdits[activeKey] ?? intervalData.orders;
  const setOrders = (update: (prev: ProviderOrder[]) => ProviderOrder[]) =>
    setOrderEdits((prev) => ({ ...prev, [activeKey]: update(orders) }));
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [formOrderDate, setFormOrderDate] = useState(
    availableDates[0].shortDate,
  );
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
          : "Please enter the order instruction",
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
      prev.map((o) => (o.id === id ? { ...o, completed: !o.completed } : o)),
    );
  };

  // Symptoms state & handlers:
  const seededSymptoms = intervalData.symptomEntries.map((entry) => ({
    ...entry,
    date: entry.date.includes(",")
      ? entry.date.slice(entry.date.indexOf(",") + 1).trim()
      : entry.date,
  }));
  const [symptomEdits, setSymptomEdits] = useState<
    Record<string, LoggedSymptomEntry[]>
  >({});
  const symptomsList = symptomEdits[activeKey] ?? seededSymptoms;
  const setSymptomsList = (
    update: (prev: LoggedSymptomEntry[]) => LoggedSymptomEntry[],
  ) =>
    setSymptomEdits((prev) => ({ ...prev, [activeKey]: update(symptomsList) }));
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  const [editingSymptomId, setEditingSymptomId] = useState<string | null>(null);
  const [formSymptomDate, setFormSymptomDate] = useState(
    availableDates[0].shortDate,
  );
  const [formSelectedSymptoms, setFormSelectedSymptoms] = useState<string[]>(
    [],
  );
  const [formCustomSymptom, setFormCustomSymptom] = useState("");
  const [formRecoveryTime, setFormRecoveryTime] =
    useState<string>("2 – 4 hours");
  const [symptomFormError, setSymptomFormError] = useState("");

  const handleOpenAddSymptom = () => {
    setEditingSymptomId(null);
    setFormSymptomDate(availableDates[0].shortDate);
    setFormSelectedSymptoms([]);
    setFormCustomSymptom("");
    setFormRecoveryTime("2 – 4 hours");
    setSymptomFormError("");
    setIsSymptomModalOpen(true);
  };

  const handleOpenEditSymptom = (entry: LoggedSymptomEntry) => {
    setEditingSymptomId(entry.id);
    setFormSymptomDate(entry.date);
    setFormSelectedSymptoms([...entry.symptoms]);
    setFormCustomSymptom("");
    setFormRecoveryTime(entry.recoveryTime || "2 – 4 hours");
    setSymptomFormError("");
    setIsSymptomModalOpen(true);
  };

  const toggleSymptomSelection = (sym: string) => {
    setFormSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym],
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
        isEs
          ? "Selecciona al menos un síntoma"
          : "Please select at least one symptom",
      );
      return;
    }

    if (editingSymptomId) {
      setSymptomsList((prev) =>
        prev.map((s) =>
          s.id === editingSymptomId
            ? {
                ...s,
                date: formSymptomDate,
                symptoms: formSelectedSymptoms,
                recoveryTime: formRecoveryTime,
              }
            : s,
        ),
      );
    } else {
      const newEntry: LoggedSymptomEntry = {
        id: `sym-${Date.now()}`,
        date: formSymptomDate,
        dayLabel: "",
        symptoms: formSelectedSymptoms,
        severity: "Mild",
        recoveryTime: formRecoveryTime,
        notes: "",
      };
      setSymptomsList((prev) => [newEntry, ...prev]);
    }
    setIsSymptomModalOpen(false);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-16">
      {/* Top Breadcrumb Navigation */}
      <div>
        <Link
          href="/dashboard/personal-log/dialysis-management"
          className="inline-flex items-center gap-inline-sm rounded-control-small text-label-md text-fg-muted transition-colors duration-150 ease-standard hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEs
            ? "Volver a Gestión de Diálisis"
            : "Back to Dialysis Management"}
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* TOP HEADER CARD: TREATMENT TITLE, INTERVAL BADGE & DATES                 */}
      {/* ========================================================================= */}
      <Card as="section" padding="none" className="p-inset-lg">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          {/* Left: Treatment 1 and beside it Treatment 1 ➔ Treatment 2 */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-heading-2 text-fg">{intervalData.name}</h1>
            <Badge tone={intervalData.isExtra ? "accent" : "info"}>
              {intervalData.label}
            </Badge>
          </div>

          {/* Right: Date block in place of the removed record button */}
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            {intervalData.isExtra ? (
              <div className="text-right leading-snug">
                <span className="block text-label-md text-fg">
                  {startParsed.day}
                </span>
                <span className="block text-label-md text-accent-fg">
                  {startParsed.date}
                </span>
              </div>
            ) : (
              <>
                <div className="leading-snug">
                  <span className="block text-label-md text-fg">
                    {startParsed.day}
                  </span>
                  <span className="block text-body-sm text-fg-muted">
                    {startParsed.date}
                  </span>
                </div>
                <span className="text-body-md text-fg-subtle select-none">
                  -
                </span>
                <div className="leading-snug">
                  <span className="block text-label-md text-fg">
                    {endParsed.day}
                  </span>
                  <span className="block text-body-sm text-fg-muted">
                    {endParsed.date}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* CLINICAL REASON & ADDITIONAL NOTES CARD (ONLY FOR EXTRA TREATMENTS)       */}
      {/* ========================================================================= */}
      {intervalData.isExtra &&
        (intervalData.clinicalReason || intervalData.additionalNotes) && (
          <section className="animate-in fade-in space-y-4 rounded-card border border-accent-soft-line bg-gradient-to-br from-accent-soft/40 via-surface to-surface p-6 shadow-control duration-200 sm:rounded-panel sm:p-7">
            <div className="flex flex-col justify-between gap-3 border-b border-accent-soft-line pb-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-accent-soft-line bg-accent-soft text-accent-fg">
                  <Activity className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-heading-5 text-fg">
                    {isEs
                      ? "Información Clínica de la Sesión Extra"
                      : "Clinical Reason & Additional Notes"}
                  </h2>
                  <p className="text-caption text-fg-muted">
                    {isEs
                      ? "Motivo médico registrado y notas adicionales o síntomas para esta sesión extra"
                      : "Physician documented clinical indication and patient notes for this extra session"}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-accent-soft-line bg-accent-100 px-3 py-1 text-xs font-bold text-accent-900 shadow-control sm:self-center">
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent-solid" />
                {isEs
                  ? "Sesión de Tratamiento Extra"
                  : "Extra Treatment Session"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-1 md:grid-cols-2">
              {/* Box 1: Clinical Reason */}
              <div className="flex flex-col justify-between space-y-2 rounded-card border border-accent-soft-line bg-accent-soft/30 p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-accent-fg" />
                  <span className="text-overline text-accent-fg">
                    {isEs ? "Motivo Clínico" : "Clinical Reason"}
                  </span>
                </div>
                <div className="pt-1">
                  <span className="inline-flex items-center rounded-control border border-accent-soft-line bg-surface px-3.5 py-1.5 text-sm font-bold text-accent-900 shadow-control sm:text-base">
                    {intervalData.clinicalReason ||
                      (isEs
                        ? "Motivo no especificado"
                        : "Reason not specified")}
                  </span>
                </div>
              </div>

              {/* Box 2: Additional Notes / Symptoms */}
              <div className="flex flex-col justify-between space-y-2 rounded-card border border-accent-soft-line bg-accent-soft/30 p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-accent-fg" />
                  <span className="text-overline text-accent-fg">
                    {isEs
                      ? "Notas Adicionales / Síntomas"
                      : "Additional Notes / Symptoms"}
                  </span>
                </div>
                <div className="pt-1">
                  <p className="rounded-control border border-accent-soft-line bg-surface p-3 text-sm leading-relaxed font-medium text-fg-secondary shadow-control sm:p-3.5 sm:text-base">
                    {intervalData.additionalNotes ||
                      (isEs
                        ? "Sin notas adicionales registradas para esta sesión extra."
                        : "No additional notes or symptoms recorded for this extra session.")}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

      {/* ========================================================================= */}
      {/* 1. RECOVERY PATTERN TRACKING                                              */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <RecoveryPatternSection treatmentId={activeKey} />
      </section>

      {/* ========================================================================= */}
      {/* 2. PROVIDER ORDERS & INSTRUCTIONS                                         */}
      {/* ========================================================================= */}
      <section className="animate-in fade-in space-y-3.5 duration-200">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-heading-5 text-fg">
            {isEs
              ? "Órdenes e Instrucciones del Proveedor"
              : "Provider Orders & Instructions"}
          </h2>

          <Button size="small" onClick={handleOpenAddOrder}>
            <Plus aria-hidden="true" />
            {isEs ? "Nueva Orden" : "Add Order"}
          </Button>
        </div>

        <Card padding="none" className="overflow-hidden">
          <Table>
            <TableHead>
              <TableRow className="bg-surface-sunken">
                <TableHeaderCell className="w-28 sm:w-32">
                  {isEs ? "Día" : "Day"}
                </TableHeaderCell>
                <TableHeaderCell className="w-32 sm:w-36">
                  {isEs ? "Fecha" : "Date"}
                </TableHeaderCell>
                <TableHeaderCell>
                  {isEs ? "Orden / Instrucción" : "Order / Instruction"}
                </TableHeaderCell>
                <TableHeaderCell className="w-28 text-center">
                  {isEs ? "Completado" : "Completed"}
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((item) => {
                const { day, date } = getDayAndDate(item.date, isEs);
                return (
                  <TableRow key={item.id}>
                    <TableCell emphasis className="whitespace-nowrap">
                      {day}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{date}</TableCell>
                    <TableCell className="leading-snug">{item.order}</TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      {/* Was a bare <button>: a screen reader announced only
                          "button", never whether the order was done. */}
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={item.completed}
                        aria-label={
                          isEs
                            ? `Marcar como completado: ${item.order}`
                            : `Mark completed: ${item.order}`
                        }
                        onClick={() => toggleOrderCompleted(item.id)}
                        className={`inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-control-small border transition-colors duration-150 ease-standard select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                          item.completed
                            ? "border-primary-solid bg-primary-solid text-primary-on-solid"
                            : "border-line-strong bg-surface hover:border-fg-subtle"
                        }`}
                      >
                        {item.completed && (
                          <Check
                            aria-hidden="true"
                            className="h-3.5 w-3.5 stroke-[3]"
                          />
                        )}
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </section>

      {/* ========================================================================= */}
      {/* 3. SYMPTOMS BETWEEN TREATMENTS                                            */}
      {/* ========================================================================= */}
      <section className="animate-in fade-in space-y-3.5 duration-200">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-heading-5 text-fg">
            {isEs
              ? "Síntomas Entre Tratamientos"
              : "Symptoms Between Treatments"}
          </h2>

          <Button size="small" onClick={handleOpenAddSymptom}>
            <Plus aria-hidden="true" />
            {isEs ? "Agregar Nuevo" : "Add New"}
          </Button>
        </div>

        <Card padding="none" className="overflow-hidden">
          <Table minWidth={720}>
            <TableHead>
              <TableRow className="bg-surface-sunken">
                <TableHeaderCell className="w-28 sm:w-32">
                  {isEs ? "Día" : "Day"}
                </TableHeaderCell>
                <TableHeaderCell className="w-32 sm:w-36">
                  {isEs ? "Fecha" : "Date"}
                </TableHeaderCell>
                <TableHeaderCell>
                  {isEs ? "Síntomas" : "Symptoms"}
                </TableHeaderCell>
                <TableHeaderCell className="w-44">
                  {isEs ? "Tiempo de Recuperación" : "Recovery Time"}
                </TableHeaderCell>
                <TableHeaderCell className="w-24 text-center">
                  {isEs ? "Editar" : "Edit"}
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {symptomsList.map((entry) => {
                const { day, date } = getDayAndDate(entry.date, isEs);
                return (
                  <TableRow key={entry.id}>
                    <TableCell emphasis className="whitespace-nowrap">
                      {day}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{date}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-inline-sm">
                        {entry.symptoms.map((sym, idx) => (
                          <Badge key={idx} tone="info">
                            {sym}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {entry.recoveryTime ? (
                        <Badge
                          tone="success"
                          icon={<Clock aria-hidden="true" />}
                        >
                          {isEs
                            ? LOCALIZED_RECOVERY_TIME[entry.recoveryTime] ||
                              entry.recoveryTime
                            : entry.recoveryTime}
                        </Badge>
                      ) : (
                        <span className="text-caption text-fg-subtle italic">
                          {isEs ? "No registrado" : "Not logged"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <Button
                        variant="neutral"
                        appearance="fill-stroke"
                        size="small"
                        onClick={() => handleOpenEditSymptom(entry)}
                        aria-label={
                          isEs
                            ? `Editar síntomas del ${date}`
                            : `Edit symptoms for ${date}`
                        }
                        className="px-inset-xs"
                      >
                        <Pencil aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </section>

      {/* ========================================================================= */}
      {/* 4. CARE TEAM QUESTIONS                                                    */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <CareTeamQuestionsSection />
      </section>

      {/* ========================================================================= */}
      {/* ADD ORDER MODAL (RESTRICTED STRICTLY TO ACTIVE INTERVAL DATES)            */}
      {/* ========================================================================= */}
      <Modal
        open={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title={isEs ? "Agregar Nueva Orden" : "Add New Order"}
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setIsOrderModalOpen(false)}
            >
              {isEs ? "Cancelar" : "Cancel"}
            </Button>
            <Button type="submit" form="add-order-form">
              {isEs ? "Guardar Orden" : "Save Order"}
            </Button>
          </>
        }
      >
        <form
          id="add-order-form"
          onSubmit={handleAddOrderSubmit}
          className="space-y-stack-lg"
        >
          {/* Step 1: Select date strictly from this treatment interval.
                  One date out of a fixed set is a radio group, so it is one —
                  arrow keys move between days, Tab leaves the group. */}
          <div className="space-y-stack-sm">
            <span className="block text-label-md text-fg-secondary">
              {isEs
                ? "1. Seleccionar Fecha del Intervalo"
                : "1. Select Treatment Interval Date"}
            </span>
            <RadioGroup
              label={isEs ? "Fecha del intervalo" : "Treatment interval date"}
              value={formOrderDate}
              onChange={setFormOrderDate}
              orientation="horizontal"
              className="grid grid-cols-2 gap-inline-md sm:grid-cols-4"
            >
              {availableDates.map((d) => (
                <RadioCard
                  key={d.shortDate}
                  value={d.shortDate}
                  title={
                    isEs
                      ? LOCALIZED_SPANISH_DAYS[d.dayLabel] || d.dayLabel
                      : d.dayLabel
                  }
                  description={d.shortDate}
                />
              ))}
            </RadioGroup>
          </div>

          {/* Step 2: Order text */}
          <FormField
            label={isEs ? "2. Orden / Instrucción" : "2. Order / Instruction"}
            error={formOrderError || undefined}
          >
            {(props) => (
              <Textarea
                {...props}
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
              />
            )}
          </FormField>
        </form>
      </Modal>

      {/* Add / Edit Symptom Modal */}
      <Modal
        open={isSymptomModalOpen}
        onClose={() => setIsSymptomModalOpen(false)}
        title={
          editingSymptomId
            ? isEs
              ? "Editar Síntomas"
              : "Edit Symptoms"
            : isEs
              ? "Agregar Síntomas"
              : "Add Symptoms"
        }
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setIsSymptomModalOpen(false)}
            >
              {isEs ? "Cancelar" : "Cancel"}
            </Button>
            <Button type="submit" form="symptom-form">
              {editingSymptomId
                ? isEs
                  ? "Actualizar"
                  : "Update Symptoms"
                : isEs
                  ? "Guardar"
                  : "Save Symptoms"}
            </Button>
          </>
        }
      >
        <form
          id="symptom-form"
          onSubmit={handleSymptomSubmit}
          className="space-y-stack-lg"
        >
          {/* Step 1: Select Date */}
          <div className="space-y-stack-sm">
            <span className="block text-label-md text-fg-secondary">
              {isEs
                ? "1. Seleccionar Fecha del Tratamiento"
                : "1. Select Treatment Date"}
            </span>
            <RadioGroup
              label={isEs ? "Fecha del tratamiento" : "Treatment date"}
              value={formSymptomDate}
              onChange={setFormSymptomDate}
              orientation="horizontal"
              className="grid grid-cols-2 gap-inline-md sm:grid-cols-4"
            >
              {availableDates.map((d) => (
                <RadioCard
                  key={d.shortDate}
                  value={d.shortDate}
                  title={
                    isEs
                      ? LOCALIZED_SPANISH_DAYS[d.dayLabel] || d.dayLabel
                      : d.dayLabel
                  }
                  description={d.shortDate}
                />
              ))}
            </RadioGroup>
          </div>

          {/* Step 2: Select Symptoms — any number of them, so the chips
                  carry aria-pressed rather than posing as radio buttons. */}
          <div className="space-y-stack-sm">
            <span className="block text-label-md text-fg-secondary">
              {isEs ? "2. Seleccionar Síntomas" : "2. Select Symptoms"}
            </span>
            <div className="max-h-48 overflow-y-auto rounded-control border border-line bg-surface-sunken p-inset-xs">
              <ChipGroup
                selection="multiple"
                label={isEs ? "Síntomas" : "Symptoms"}
                className="gap-inline-md"
              >
                {COMMON_SYMPTOM_OPTIONS.map((sym) => {
                  const isSelected = formSelectedSymptoms.includes(sym);
                  return (
                    <Chip
                      key={sym}
                      selected={isSelected}
                      onClick={() => toggleSymptomSelection(sym)}
                      icon={
                        isSelected ? (
                          <Check aria-hidden="true" className="stroke-[3]" />
                        ) : undefined
                      }
                    >
                      {isEs ? LOCALIZED_SYMPTOMS[sym] || sym : sym}
                    </Chip>
                  );
                })}
              </ChipGroup>
            </div>
            {symptomFormError && (
              <p role="alert" className="text-caption text-danger">
                {symptomFormError}
              </p>
            )}
          </div>

          {/* Step 3: Custom Symptom Input */}
          <FormField
            label={isEs ? "3. Otro Síntoma" : "3. Other Symptom"}
            optionalLabel={isEs ? "Opcional" : "Optional"}
          >
            {(props) => (
              <div className="flex gap-inline-md">
                <Input
                  {...props}
                  type="text"
                  value={formCustomSymptom}
                  onChange={(e) => setFormCustomSymptom(e.target.value)}
                  placeholder={
                    isEs
                      ? "Escribir síntoma personalizado..."
                      : "Type custom symptom..."
                  }
                  className="flex-1"
                />
                <Button
                  variant="neutral"
                  appearance="fill"
                  onClick={handleAddCustomSymptom}
                >
                  {isEs ? "Agregar" : "Add"}
                </Button>
              </div>
            )}
          </FormField>

          {/* Step 4: Recovery Time Tracking */}
          <FormField
            label={
              isEs
                ? "4. ¿Cuánto tiempo te tomó sentirte mejor? (Tiempo de Recuperación)"
                : "4. How long did it take you to feel better? (Recovery Time)"
            }
            hint={
              isEs
                ? "Este dato alimenta el seguimiento del patrón de recuperación del paciente."
                : "This entry directly tracks your recovery pattern across dialysis treatments."
            }
          >
            {(props) => (
              <Select
                {...props}
                value={formRecoveryTime}
                onChange={(e) => setFormRecoveryTime(e.target.value)}
              >
                {RECOVERY_TIME_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {isEs ? LOCALIZED_RECOVERY_TIME[opt] || opt : opt}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

export default function DialysisManagementViewPage() {
  return (
    <>
      <PersonalLogDisclaimer />

      <Suspense
        fallback={
          <div className="p-inset-xl text-center text-body-md text-fg-muted">
            Loading...
          </div>
        }
      >
        <ViewRecordContent />
      </Suspense>
    </>
  );
}
