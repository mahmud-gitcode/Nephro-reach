"use client";

import { useExternalShare } from "@/features/sharing/ExternalShareNotice";
import { useLanguage } from "@/context/LanguageContext";
import { LogMediaBar, appendText } from "./LogMediaBar";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BinaryToggle,
  CounterField,
  MoodPicker,
  PanelTitle,
  SectionTitle,
  SeverityFiveToggle,
  SeverityRow,
  SymptomChips,
  VitalCard,
  formatDisplayDate,
} from "@/features/personal-log/symptom-log/SymptomFields";
import {
  PANEL,
  SEGMENT_ACTIVE,
  SEGMENT_IDLE,
  SEGMENT_ITEM,
  SEGMENT_TRACK,
} from "@/features/personal-log/symptom-log/symptomLog.styles";
import type { DialysisDayLogData } from "@/features/personal-log/symptom-log/symptomLog.types";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  Droplets,
  HeartPulse,
  Printer,
  Scale,
  X,
} from "lucide-react";

interface Props {
  onClose?: () => void;
  onSave?: (data: DialysisDayLogData) => void;
  isModal?: boolean;
}

export default function DialysisDaySymptomLogForm({
  onClose,
  onSave,
  isModal = false,
}: Props) {
  /* Leaves NephroReach: ask first (client, 2026-10-07). */
  const share = useExternalShare();
  const router = useRouter();
  const { language } = useLanguage();
  const isEs = language === "ES";
  /* English and Spanish for this form's own text; the symptom names and
     answers go through symptomLabel, so what is saved stays in English. */
  const tx = (en: string, es: string) => (isEs ? es : en);

  const [activeTab, setActiveTab] = useState<number>(1);

  // Date state
  const [selectedDate, setSelectedDate] = useState("2026-05-04");

  /* These thirteen read-only values still go through useState so that
     wiring the form later is a one-word change. Nothing sets them yet:
     this form renders but does not submit. See the functional audit. */
  // Session & Metadata state
  const [isDialysisDay, setIsDialysisDay] = useState(true);
  const [treatmentType] = useState("Hemodialysis");
  const [startTime] = useState("7:30 AM");
  const [endTime] = useState("11:45 AM");
  const [location] = useState("ABC Dialysis Center");
  const [careTeam] = useState("Jane Smith, RN");
  const [postWeightSummary] = useState("72.4 kg");

  // Options from user reference image
  const [attended, setAttended] = useState<"Yes" | "No">("Yes");
  const [arrivedLate, setArrivedLate] = useState<"Yes" | "No">("No");
  const [endedEarly, setEndedEarly] = useState<"Yes" | "No">("No");
  const [missedTreatments, setMissedTreatments] = useState<number>(0);
  const [rescheduled, setRescheduled] = useState<"Yes" | "No">("No");

  // Specific 5-level severity symptoms
  const [crampingSeverity, setCrampingSeverity] = useState<
    "Yes" | "No" | "Mild" | "Moderate" | "Severe"
  >("Yes");
  const [lowBpSeverity, setLowBpSeverity] = useState<
    "Yes" | "No" | "Mild" | "Moderate" | "Severe"
  >("No");
  const [highBpSeverity, setHighBpSeverity] = useState<
    "Yes" | "No" | "Mild" | "Moderate" | "Severe"
  >("No");
  const [fatigueSeverity, setFatigueSeverity] = useState<
    "Yes" | "No" | "Mild" | "Moderate" | "Severe"
  >("No");
  const [recoverySeverity, setRecoverySeverity] = useState<
    "Yes" | "No" | "Mild" | "Moderate" | "Severe"
  >("Yes");

  // Sequential for extra fluid removal
  const [sequentialFluidRemoval, setSequentialFluidRemoval] = useState<
    "Yes" | "No"
  >("No");

  // Medication compliance
  const [medsTakenPrescribed, setMedsTakenPrescribed] = useState<"Yes" | "No">(
    "Yes",
  );

  // Pre-treatment
  const [preFeel, setPreFeel] = useState(3);
  const [preSymptoms, setPreSymptoms] = useState<string[]>([
    "Fatigue",
    "Swelling",
    "Headache",
  ]);
  const [preOther] = useState("");
  const [preSeverity, setPreSeverity] = useState<Record<string, number>>({
    Fatigue: 6,
    Nausea: 2,
    Pain: 1,
    "Shortness of Breath": 3,
    Overall: 5,
  });

  // Intra-treatment
  const [hadIntraSymptoms] = useState(true);
  const [intraSymptoms, setIntraSymptoms] = useState<string[]>([
    "Low Blood Pressure",
    "Cramps",
    "Dizziness",
  ]);
  const [intraOther] = useState("");
  const [intraSeverity] = useState<Record<string, number>>({
    Fatigue: 6,
    Nausea: 2,
    Cramps: 7,
    Dizziness: 5,
    Overall: 6,
  });
  const [intraNotes, setIntraNotes] = useState(
    "Felt cramps in legs at 9:30 AM, BP dropped a little but got better after fluid was given.",
  );

  // Post-treatment
  const [postFeel, setPostFeel] = useState(4);
  const [postSymptoms, setPostSymptoms] = useState<string[]>([
    "Fatigue",
    "Muscle Cramps",
  ]);
  const [postOther] = useState("");
  const [postSeverity, setPostSeverity] = useState<Record<string, number>>({
    Fatigue: 4,
    Nausea: 1,
    Pain: 2,
    Overall: 3,
  });

  // Vitals & Meds
  const [fluidRemoved, setFluidRemoved] = useState("");
  const [preWeight] = useState("74.7");
  const [postWeight, setPostWeight] = useState("");
  const [bpPost, setBpPost] = useState("");
  const [pulsePost, setPulsePost] = useState("");
  const [medNotes] = useState("Took all meds after session.");
  const [generalNotes, setGeneralNotes] = useState(
    "Feeling better after treatment. Plan to rest and drink fluids.",
  );

  const toggleItem = (
    list: string[],
    setList: (l: string[]) => void,
    item: string,
  ) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSave = () => {
    const payload: DialysisDayLogData = {
      date: formatDisplayDate(selectedDate),
      isDialysisDay,
      treatmentType,
      startTime,
      endTime,
      location,
      careTeam,
      postWeightSummary,
      attended,
      arrivedLate,
      endedEarly,
      missedTreatments,
      rescheduled,
      cramping: crampingSeverity,
      lowBp: lowBpSeverity,
      highBp: highBpSeverity,
      fatigue: fatigueSeverity,
      recoveryTime: recoverySeverity,
      sequentialFluidRemoval,
      medsTakenPrescribed,
      preOverallFeel: preFeel,
      preSymptoms,
      preOtherSymptom: preOther,
      preSeverity,
      hadIntraSymptoms,
      intraSymptoms,
      intraOtherSymptom: intraOther,
      intraSeverity,
      intraNotes,
      postOverallFeel: postFeel,
      postSymptoms,
      postOtherSymptom: postOther,
      postSeverity,
      fluidRemoved,
      preWeight,
      postWeight,
      bloodPressurePost: bpPost,
      heartRatePost: pulsePost,
      // Recorded in the Medications Administered table on the treatment page
      medicationsGiven: [],
      medicationsOther: medNotes,
      otherNotes: generalNotes,
    };

    if (onSave) onSave(payload);
    if (onClose) onClose();
    else router.push("/dashboard/personal-log/dialysis-treatment");
  };

  const preOptions = [
    "Fatigue",
    "Swelling",
    "Shortness of Breath",
    "Nausea",
    "Itching",
    "Headache",
    "Dizziness",
    "Muscle Cramps",
    "Chest Pain",
    "Anxiety",
    "Poor Appetite",
  ];

  const intraOptions = [
    "Low BP",
    "High BP",
    "Cramps",
    "Nausea",
    "Vomiting",
    "Headache",
    "Dizziness",
    "Chest Discomfort",
    "Itching",
  ];

  const postOptions = [
    "Fatigue",
    "Dizziness",
    "Nausea",
    "Headache",
    "Muscle Cramps",
    "Low BP",
    "Itching",
    "Swelling",
    "Better / No Symptoms",
  ];

  const summaryItems = [
    {
      label: tx("Treatment Type", "Tipo de tratamiento"),
      value: treatmentType,
    },
    { label: tx("Start Time", "Hora de inicio"), value: startTime },
    { label: tx("End Time", "Hora de fin"), value: endTime },
    { label: tx("Location", "Lugar"), value: location },
    { label: tx("Care Team", "Equipo de atención"), value: careTeam },
    { label: tx("Post Weight", "Peso posterior"), value: postWeightSummary },
  ];

  const steps = [
    { id: 1, label: tx("Pre-Dialysis", "Antes de la diálisis") },
    { id: 2, label: tx("During Session", "Durante la sesión") },
    { id: 3, label: tx("Post & Vitals", "Después y signos vitales") },
    { id: 4, label: tx("Full View", "Vista completa") },
  ];

  return (
    <div className="w-full space-y-4 font-sans text-fg-secondary">
      {/* 1. CLINICAL SESSION INFORMATION CARD */}
      <div className="w-full rounded-card border border-line bg-surface p-6 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="text-heading-4 font-bold tracking-tight text-fg">
            {tx("Dialysis Day Log", "Registro del día de diálisis")}
          </h1>

          <div className="flex flex-wrap items-end gap-3">
            {/* Date Field with Label */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="dialysis-log-date"
                className="text-caption font-bold text-fg-muted"
              >
                {tx("Date", "Fecha")}
              </label>
              <input
                id="dialysis-log-date"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {}
                }}
                className="h-9 cursor-pointer rounded-control border border-line bg-surface px-3 text-caption font-bold text-fg-secondary transition-colors outline-none hover:border-line-strong focus:border-primary-edge focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Dialysis Day Toggle with Label */}
            <div className="flex flex-col gap-1.5">
              <span className="text-caption font-bold text-fg-muted">
                {tx("Dialysis Day", "Día de diálisis")}
              </span>
              <div className={`${SEGMENT_TRACK} h-9`}>
                <button
                  type="button"
                  onClick={() => setIsDialysisDay(true)}
                  className={`${SEGMENT_ITEM} min-w-[52px] ${
                    isDialysisDay ? SEGMENT_ACTIVE : SEGMENT_IDLE
                  }`}
                >
                  {tx("Yes", "Sí")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDialysisDay(false)}
                  className={`${SEGMENT_ITEM} min-w-[52px] ${
                    !isDialysisDay ? SEGMENT_ACTIVE : SEGMENT_IDLE
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {share.notice}
              <button
                type="button"
                onClick={() => share.guard(() => window.print())}
                className="flex size-9 cursor-pointer items-center justify-center rounded-control border border-line bg-surface text-fg-muted transition-colors hover:border-primary-edge hover:text-fg-brand"
                title={tx("Print", "Imprimir")}
                aria-label={tx("Print", "Imprimir")}
              >
                <Printer className="size-4" />
              </button>

              {isModal && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-9 cursor-pointer items-center justify-center rounded-control border border-line bg-surface text-fg-subtle transition-colors hover:border-line-strong hover:text-fg-secondary"
                  aria-label={tx("Close", "Cerrar")}
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Clinical Information Bar */}
        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-control border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="min-w-0 bg-surface-sunken px-3.5 py-3"
            >
              <p className="truncate text-caption font-medium text-fg-muted">
                {item.label}
              </p>
              <p className="mt-1 truncate text-body-sm font-bold text-fg">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. FORM CARD — step wizard, content and actions on one surface */}
      <div className="w-full overflow-hidden rounded-card border border-line bg-surface">
        {/* Step progress */}
        <div className="border-b border-line bg-surface-sunken px-4 py-4 sm:px-6">
          <div className="flex w-full items-center justify-between">
            {steps.map((step, idx, arr) => {
              const isCompleted = activeTab > step.id;
              const isCurrent = activeTab === step.id;

              return (
                <React.Fragment key={step.id}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(step.id)}
                    /* Shrinks on a phone, and the label wraps under its
                       circle: the Spanish step names are too long for one
                       line at 390px. */
                    className="group flex min-w-0 shrink cursor-pointer flex-col items-center gap-2 sm:flex-row"
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-pill text-caption font-bold transition-colors ${
                        isCurrent
                          ? "bg-primary-solid text-primary-on-solid ring-4 ring-ring"
                          : isCompleted
                            ? "bg-surface-inverse text-fg-inverse"
                            : "border border-line-strong bg-surface text-fg-subtle group-hover:border-line-strong"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="size-4 stroke-[3]" />
                      ) : step.id <= 3 ? (
                        step.id
                      ) : (
                        <span className="text-caption">
                          {tx("ALL", "TODO")}
                        </span>
                      )}
                    </span>
                    <span
                      className={`text-center text-caption font-bold text-balance transition-colors sm:text-left ${
                        isCurrent
                          ? "text-fg-brand"
                          : isCompleted
                            ? "text-fg"
                            : "text-fg-subtle group-hover:text-fg-muted"
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>

                  {idx < arr.length - 1 && (
                    <div
                      className={`mx-2 h-0.5 min-w-3 flex-1 rounded-pill transition-colors sm:mx-4 ${
                        activeTab > step.id ? "bg-primary-solid" : "bg-line"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="divide-y divide-line">
          {/* TAB 1: ATTENDANCE & PRE-DIALYSIS */}
          {(activeTab === 1 || activeTab === 4) && (
            <div className="space-y-6 p-5 sm:p-6">
              {/* All options from reference image: Attendance Tracking */}
              <section className="space-y-3">
                <SectionTitle>
                  {tx("Attendance & Schedule", "Asistencia y horario")}
                </SectionTitle>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <BinaryToggle
                    label={tx("Treatment attended", "Asistió al tratamiento")}
                    isEs={isEs}
                    value={attended}
                    onChange={setAttended}
                  />
                  <BinaryToggle
                    label={tx("Arrived late", "Llegó tarde")}
                    isEs={isEs}
                    value={arrivedLate}
                    onChange={setArrivedLate}
                  />
                  <CounterField
                    label={tx("Missed treatments", "Tratamientos perdidos")}
                    isEs={isEs}
                    value={missedTreatments}
                    onChange={setMissedTreatments}
                  />
                  <BinaryToggle
                    label={tx(
                      "Rescheduled missed treatment",
                      "Reprogramó el tratamiento perdido",
                    )}
                    isEs={isEs}
                    value={rescheduled}
                    onChange={setRescheduled}
                  />
                </div>
              </section>

              {/* Pre-dialysis condition */}
              <section className="space-y-3">
                <SectionTitle>
                  {tx(
                    "Pre-Treatment Condition",
                    "Estado antes del tratamiento",
                  )}
                </SectionTitle>

                {/* Mood */}
                <MoodPicker value={preFeel} onChange={setPreFeel} isEs={isEs} />

                {/* Pre Symptoms Chips */}
                <div className={`${PANEL} space-y-3`}>
                  <PanelTitle>
                    {tx(
                      "Pre-Dialysis Symptoms",
                      "Síntomas antes de la diálisis",
                    )}
                  </PanelTitle>
                  <SymptomChips
                    options={preOptions}
                    isEs={isEs}
                    selected={preSymptoms}
                    onToggle={(sym) =>
                      toggleItem(preSymptoms, setPreSymptoms, sym)
                    }
                  />
                </div>

                {/* Pre Severity Sliders */}
                <div className={`${PANEL} space-y-3`}>
                  <PanelTitle>
                    {tx(
                      "Symptom Severity (0–10)",
                      "Intensidad de los síntomas (0–10)",
                    )}
                  </PanelTitle>
                  <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
                    {Object.keys(preSeverity).map((key) => (
                      <SeverityRow
                        key={key}
                        label={key}
                        isEs={isEs}
                        value={preSeverity[key]}
                        onChange={(v) =>
                          setPreSeverity({ ...preSeverity, [key]: v })
                        }
                      />
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: DURING TREATMENT */}
          {(activeTab === 2 || activeTab === 4) && (
            <div className="space-y-6 p-5 sm:p-6">
              <section className="space-y-3">
                <SectionTitle>
                  {tx("During Treatment", "Durante el tratamiento")}
                </SectionTitle>

                {/* Sequential for extra fluid removal (yes/no) */}
                <BinaryToggle
                  label={tx(
                    "Sequential for extra fluid removal",
                    "Secuencial para retirar más líquido",
                  )}
                  isEs={isEs}
                  value={sequentialFluidRemoval}
                  onChange={setSequentialFluidRemoval}
                />
              </section>

              {/* Core 5-state symptoms from user reference image */}
              <section className="space-y-3">
                <SectionTitle>
                  {tx("Intra-Session Symptoms", "Síntomas durante la sesión")}
                </SectionTitle>

                <div className="space-y-2.5">
                  <SeverityFiveToggle
                    label={tx("Cramping", "Calambres")}
                    isEs={isEs}
                    value={crampingSeverity}
                    onChange={setCrampingSeverity}
                  />
                  <SeverityFiveToggle
                    label={tx("Low BP", "Presión baja")}
                    isEs={isEs}
                    value={lowBpSeverity}
                    onChange={setLowBpSeverity}
                  />
                  <SeverityFiveToggle
                    label={tx("High BP", "Presión alta")}
                    isEs={isEs}
                    value={highBpSeverity}
                    onChange={setHighBpSeverity}
                  />
                  <SeverityFiveToggle
                    label={tx("Fatigue", "Fatiga")}
                    isEs={isEs}
                    value={fatigueSeverity}
                    onChange={setFatigueSeverity}
                  />
                </div>
              </section>

              {/* Other intra symptoms */}
              <div className={`${PANEL} space-y-3`}>
                <PanelTitle>
                  {tx("Additional Symptoms", "Otros síntomas")}
                </PanelTitle>
                <SymptomChips
                  options={intraOptions}
                  isEs={isEs}
                  selected={intraSymptoms}
                  onToggle={(sym) =>
                    toggleItem(intraSymptoms, setIntraSymptoms, sym)
                  }
                />
              </div>

              {/* Notes */}
              <div className={`${PANEL} space-y-3`}>
                <PanelTitle>
                  {tx("Session Notes", "Notas de la sesión")}
                </PanelTitle>
                <textarea
                  rows={3}
                  value={intraNotes}
                  onChange={(e) => setIntraNotes(e.target.value)}
                  placeholder={tx(
                    "Session details, interventions, or notes...",
                    "Detalles de la sesión, intervenciones o notas...",
                  )}
                  className="w-full resize-none rounded-control border border-line bg-surface p-3 text-body-sm text-fg-secondary transition-colors outline-none focus:border-primary-edge focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {/* TAB 3: POST & RECOVERY */}
          {(activeTab === 3 || activeTab === 4) && (
            <div className="space-y-6 p-5 sm:p-6">
              {/* Post-dialysis condition — mirrors the Pre-Treatment block on Tab 1 */}
              <section className="space-y-3">
                <SectionTitle>
                  {tx(
                    "Post-Treatment Condition",
                    "Estado después del tratamiento",
                  )}
                </SectionTitle>

                {/* Mood */}
                <MoodPicker
                  value={postFeel}
                  onChange={setPostFeel}
                  isEs={isEs}
                />

                {/* Post Symptoms Chips */}
                <div className={`${PANEL} space-y-3`}>
                  <PanelTitle>
                    {tx(
                      "Post-Dialysis Symptoms",
                      "Síntomas después de la diálisis",
                    )}
                  </PanelTitle>
                  <SymptomChips
                    options={postOptions}
                    isEs={isEs}
                    selected={postSymptoms}
                    onToggle={(sym) =>
                      toggleItem(postSymptoms, setPostSymptoms, sym)
                    }
                  />
                </div>

                {/* Post Severity Sliders */}
                <div className={`${PANEL} space-y-3`}>
                  <PanelTitle>
                    {tx(
                      "Symptom Severity (0–10)",
                      "Intensidad de los síntomas (0–10)",
                    )}
                  </PanelTitle>
                  <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
                    {Object.keys(postSeverity).map((key) => (
                      <SeverityRow
                        key={key}
                        label={key}
                        isEs={isEs}
                        value={postSeverity[key]}
                        onChange={(v) =>
                          setPostSeverity({ ...postSeverity, [key]: v })
                        }
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* Recovery Time Severity Toggle */}
              <section className="space-y-3">
                <SectionTitle>
                  {tx(
                    "Post-Treatment Recovery",
                    "Recuperación después del tratamiento",
                  )}
                </SectionTitle>

                <div className="space-y-2.5">
                  <BinaryToggle
                    label={tx("Ended early", "Terminó antes")}
                    isEs={isEs}
                    value={endedEarly}
                    onChange={setEndedEarly}
                  />

                  <SeverityFiveToggle
                    label={tx("Recovery time", "Tiempo de recuperación")}
                    isEs={isEs}
                    value={recoverySeverity}
                    onChange={setRecoverySeverity}
                  />

                  {/* Medication Prescribed Compliance */}
                  <BinaryToggle
                    label={tx(
                      "Prescribed medications taken",
                      "Tomó los medicamentos recetados",
                    )}
                    isEs={isEs}
                    value={medsTakenPrescribed}
                    onChange={setMedsTakenPrescribed}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-primary-soft-line bg-primary-soft px-3.5 py-3">
                  <span className="text-caption font-medium text-fg-muted">
                    {tx(
                      "Need a prompt for your doses?",
                      "¿Necesitas un aviso para tus dosis?",
                    )}
                  </span>
                  <Link
                    href="/dashboard/personal-log/medications"
                    className="inline-flex items-center gap-1.5 text-caption font-bold text-fg-brand hover:text-fg-brand hover:underline"
                  >
                    <Bell className="size-3.5" />
                    <span>
                      {tx(
                        "Set Medication Reminders",
                        "Configurar recordatorios de medicamentos",
                      )}
                    </span>
                  </Link>
                </div>
              </section>

              {/* Clinical Vitals Cards */}
              <section className="space-y-3">
                <SectionTitle>
                  {tx("Clinical Measurements", "Mediciones clínicas")}
                </SectionTitle>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <VitalCard
                    label={tx("Fluid Removed", "Líquido retirado")}
                    icon={Droplets}
                    value={fluidRemoved}
                    onChange={setFluidRemoved}
                    placeholder="2.3"
                    unit={tx("Liters", "Litros")}
                    inputMode="decimal"
                  />
                  <VitalCard
                    label={tx("Post Weight", "Peso posterior")}
                    icon={Scale}
                    value={postWeight}
                    onChange={setPostWeight}
                    placeholder="72.4"
                    unit={`kg${preWeight ? ` (${tx("pre", "antes")}: ${preWeight})` : ""}`}
                    inputMode="decimal"
                  />
                  <VitalCard
                    label={tx("Blood Pressure", "Presión arterial")}
                    icon={HeartPulse}
                    value={bpPost}
                    onChange={setBpPost}
                    placeholder="120/80"
                    unit="mmHg"
                    inputMode="text"
                  />
                  <VitalCard
                    label={tx("Heart Rate", "Frecuencia cardíaca")}
                    icon={Activity}
                    value={pulsePost}
                    onChange={setPulsePost}
                    placeholder="72"
                    unit="bpm"
                    inputMode="numeric"
                  />
                </div>
              </section>

              {/* Notes field */}
              <div className={`${PANEL} space-y-3`}>
                <PanelTitle>
                  {tx("Recovery Notes", "Notas de recuperación")}
                </PanelTitle>
                <textarea
                  rows={3}
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder={tx(
                    "Post-dialysis notes or recovery observations...",
                    "Notas después de la diálisis u observaciones de la recuperación...",
                  )}
                  className="w-full resize-none rounded-control border border-line bg-surface p-3 text-body-sm text-fg-secondary transition-colors outline-none focus:border-primary-edge focus:ring-1 focus:ring-ring"
                />
                <LogMediaBar
                  logName={tx(
                    "Dialysis day log",
                    "Registro del día de diálisis",
                  )}
                  isEs={isEs}
                  onDictated={(text) =>
                    setGeneralNotes((current: string) =>
                      appendText(current, text),
                    )
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. FOOTER */}
        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-sunken px-5 py-4 sm:px-6">
          {activeTab > 1 ? (
            <button
              type="button"
              onClick={() => setActiveTab(activeTab - 1)}
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-control border border-line bg-surface px-4 text-caption font-bold text-fg-secondary transition-colors hover:bg-surface-sunken"
            >
              <ArrowLeft className="size-3.5" />
              <span>{tx("Previous Page", "Página anterior")}</span>
            </button>
          ) : onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 cursor-pointer items-center rounded-control border border-line bg-surface px-4 text-caption font-bold text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg"
            >
              {tx("Cancel", "Cancelar")}
            </button>
          ) : (
            <Link
              href="/dashboard/personal-log/dialysis-treatment"
              className="inline-flex h-10 items-center rounded-control border border-line bg-surface px-4 text-caption font-bold text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg"
            >
              {tx("Cancel", "Cancelar")}
            </Link>
          )}

          {activeTab < 4 ? (
            <button
              type="button"
              onClick={() => setActiveTab(activeTab + 1)}
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-control bg-primary-solid px-5 text-caption font-bold text-primary-on-solid transition-colors hover:bg-primary-solid-hover"
            >
              <span>{tx("Next Page", "Página siguiente")}</span>
              <ArrowRight className="size-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-control bg-primary-solid px-6 text-caption font-bold text-primary-on-solid transition-colors hover:bg-primary-solid-hover"
            >
              <Check className="size-4" />
              <span>{tx("Save Log", "Guardar registro")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
