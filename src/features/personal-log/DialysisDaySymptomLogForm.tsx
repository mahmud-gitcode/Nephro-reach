"use client";

import { useExternalShare } from "@/features/sharing/ExternalShareNotice";
import { useLanguage } from "@/context/LanguageContext";
import { LogMediaBar, appendText } from "./LogMediaBar";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BinaryToggle,
  MoodPicker,
  PanelTitle,
  SectionTitle,
  SeverityFiveToggle,
  SeverityRow,
  SymptomChips,
  VitalCard,
} from "@/features/personal-log/symptom-log/SymptomFields";
import { PANEL } from "@/features/personal-log/symptom-log/symptomLog.styles";
import type { DialysisLogEntry } from "./dialysisTreatmentData";
import { useTreatmentLog } from "./dialysis/useTreatmentLog";
import { useDialysisSchedule } from "./dialysis/useDialysisSchedule";
import { useDialysisModality } from "./dialysis/useDialysisModality";
import {
  addMinutes,
  clock12,
  displayDate,
  durationLabel,
  fluidRemovedKg,
  minutesBetween,
  recentSessions,
  type SessionStatus,
} from "./dialysis/treatmentLog";
import {
  Alert,
  FormField,
  Input,
  SegmentedChoice,
  Select,
} from "@/components/ui";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  HeartPulse,
  Printer,
  Scale,
  X,
} from "lucide-react";

type Severity = "Yes" | "No" | "Mild" | "Moderate" | "Severe";

interface Props {
  onClose?: () => void;
  isModal?: boolean;
  /** An entry to change rather than a new one. */
  editId?: string;
  /** Open on this scheduled day (from "Did you miss a treatment?"). */
  initialDate?: string;
}

const MAKEUP = "__makeup__";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "7:30 AM" (the sample entries) or "07:30" → "07:30". */
function to24(value: string): string {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(value.trim());
  if (!match) return "";
  let h = Number(match[1]);
  const pm = match[3]?.toUpperCase() === "PM";
  const am = match[3]?.toUpperCase() === "AM";
  if (pm && h < 12) h += 12;
  if (am && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${match[2]}`;
}

export default function DialysisDaySymptomLogForm(props: Props) {
  const log = useTreatmentLog();
  const schedule = useDialysisSchedule();
  if (log.isPending || schedule.isPending) {
    return (
      <div className="h-96 animate-pulse rounded-card border border-line bg-surface-sunken" />
    );
  }
  const editing = props.editId
    ? log.entries.find((e) => e.id === props.editId)
    : undefined;
  return (
    <TreatmentForm
      /* Keyed so the form starts again from the entry it was opened on. */
      key={editing?.id ?? "new"}
      {...props}
      editing={editing}
    />
  );
}

function TreatmentForm({
  onClose,
  isModal = false,
  initialDate,
  editing,
}: Props & { editing?: DialysisLogEntry }) {
  /* Leaves NephroReach: ask first (client, 2026-10-07). */
  const share = useExternalShare();
  const router = useRouter();
  const { language } = useLanguage();
  const isEs = language === "ES";
  /* English and Spanish for this form's own text; the symptom names and
     answers go through symptomLabel, so what is saved stays in English. */
  const tx = (en: string, es: string) => (isEs ? es : en);

  const log = useTreatmentLog();
  const schedule = useDialysisSchedule();
  const modalityLog = useDialysisModality();
  const modality: "in-center-hd" | "home-hd" =
    editing?.modality ??
    (modalityLog.modality === "home-hd" ? "home-hd" : "in-center-hd");
  const isHome = modality === "home-hd";

  const [activeTab, setActiveTab] = useState<number>(1);
  const today = todayKey();

  /* The session being charted (client, 2026-10-12): one of the member's
     scheduled days, or a make-up session on another day. */
  const sessions = recentSessions(schedule.periods, log.entries, today, 28);
  const openSessions = sessions.filter(
    (s) => !s.entry || s.entry.id === editing?.id,
  );
  const missedDays = log.entries
    .filter((e) => e.status === "missed" || e.attendance === "Missed")
    .map((e) => e.date);
  const startChoice = editing
    ? editing.status === "rescheduled"
      ? MAKEUP
      : editing.date
    : initialDate && openSessions.some((s) => s.date === initialDate)
      ? initialDate
      : (openSessions[0]?.date ?? MAKEUP);
  const [choice, setChoice] = useState(startChoice);
  const session = sessions.find((s) => s.date === choice);
  const isMakeup = choice === MAKEUP;
  const [makeupDate, setMakeupDate] = useState(
    editing?.status === "rescheduled" ? editing.date : today,
  );
  const [makeupFor, setMakeupFor] = useState(editing?.makeupFor ?? "");
  const [status, setStatus] = useState<"attended" | "missed">(
    editing?.status === "missed" || editing?.attendance === "Missed"
      ? "missed"
      : "attended",
  );
  const sessionStatus: SessionStatus = isMakeup ? "rescheduled" : status;
  const date = isMakeup ? makeupDate : choice;

  /* Start, end and care team, editable (client: a pencil, because members
     keep up with when they got on and off, and who looked after them).
     Treatment type, location and post weight came out of the header. */
  const chair = session?.chairTime ?? "07:30";
  const [startTime, setStartTime] = useState(
    editing ? to24(editing.startTime) : chair,
  );
  const [endTime, setEndTime] = useState(
    editing
      ? to24(editing.endTime)
      : addMinutes(chair, session?.durationMinutes ?? 240),
  );
  const [careTeam, setCareTeam] = useState(editing?.careTeam ?? "");

  // Attendance (arriving late means nothing at home)
  const [arrivedLate, setArrivedLate] = useState<"Yes" | "No">(
    editing?.arrivedLate ?? "No",
  );
  const [endedEarly, setEndedEarly] = useState<"Yes" | "No">(
    editing?.endedEarly ?? "No",
  );
  const [extraRecovery, setExtraRecovery] = useState<"Yes" | "No">(
    editing?.extraRecovery ?? "No",
  );
  const [extraMinutes, setExtraMinutes] = useState(
    editing?.extraRecoveryMinutes ? String(editing.extraRecoveryMinutes) : "15",
  );

  // Symptoms during treatment: the four the client named, then the rest
  const [crampingSeverity, setCrampingSeverity] = useState<Severity>(
    editing?.cramping ?? "No",
  );
  const [dizzinessSeverity, setDizzinessSeverity] = useState<Severity>(
    editing?.dizziness ?? "No",
  );
  const [swellingSeverity, setSwellingSeverity] = useState<Severity>(
    editing?.swelling ?? "No",
  );
  const [sobSeverity, setSobSeverity] = useState<Severity>(
    editing?.shortnessOfBreath ?? "No",
  );
  const [lowBpSeverity, setLowBpSeverity] = useState<Severity>(
    editing?.lowBp ?? "No",
  );
  const [highBpSeverity, setHighBpSeverity] = useState<Severity>(
    editing?.highBp ?? "No",
  );
  const [fatigueSeverity, setFatigueSeverity] = useState<Severity>(
    editing?.fatigue ?? "No",
  );
  const [recoverySeverity, setRecoverySeverity] = useState<Severity>(
    editing?.recoveryTime ?? "No",
  );

  // Sequential for extra fluid removal
  const [sequentialFluidRemoval, setSequentialFluidRemoval] = useState<
    "Yes" | "No"
  >(editing?.sequentialFluidRemoval ?? "No");

  // Medication compliance
  const [medsTakenPrescribed, setMedsTakenPrescribed] = useState<"Yes" | "No">(
    editing?.medsTakenPrescribed ?? "Yes",
  );

  // Pre-treatment
  const [preFeel, setPreFeel] = useState(editing?.preOverallFeel ?? 3);
  const [preSymptoms, setPreSymptoms] = useState<string[]>(
    editing?.preSymptoms ?? [],
  );
  const [preSeverity, setPreSeverity] = useState<Record<string, number>>(
    editing?.preSeverity && Object.keys(editing.preSeverity).length > 0
      ? editing.preSeverity
      : {
          Fatigue: 0,
          Nausea: 0,
          Pain: 0,
          "Shortness of Breath": 0,
          Overall: 0,
        },
  );

  // Intra-treatment
  const [intraSymptoms, setIntraSymptoms] = useState<string[]>(
    editing?.intraSymptoms ?? [],
  );
  const [intraNotes, setIntraNotes] = useState(editing?.intraNotes ?? "");

  // Post-treatment
  const [postFeel, setPostFeel] = useState(editing?.postOverallFeel ?? 3);
  const [postSymptoms, setPostSymptoms] = useState<string[]>([]);
  const [postSeverity, setPostSeverity] = useState<Record<string, number>>({
    Fatigue: 0,
    Nausea: 0,
    Pain: 0,
    Overall: 0,
  });

  /* Clinical measurements: the pre-screen and the post-screen ask the same
     three things, so they can be compared; fluid removed is worked out from
     the two weights rather than typed (client, 2026-10-12). */
  const [preWeight, setPreWeight] = useState(editing?.preWeight ?? "");
  const [preBp, setPreBp] = useState(editing?.preBloodPressure ?? "");
  const [preHr, setPreHr] = useState(editing?.preHeartRate ?? "");
  const [postWeight, setPostWeight] = useState(editing?.postWeight ?? "");
  const [bpPost, setBpPost] = useState(editing?.bloodPressurePost ?? "");
  const [pulsePost, setPulsePost] = useState(editing?.heartRatePost ?? "");
  const [generalNotes, setGeneralNotes] = useState(editing?.otherNotes ?? "");

  const removed = fluidRemovedKg(preWeight, postWeight);
  const runMinutes = minutesBetween(startTime, endTime);
  const extra =
    extraRecovery === "Yes" ? Math.max(0, Number(extraMinutes) || 0) : 0;

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

  const [saveFailed, setSaveFailed] = useState(false);
  const dateTaken = log.entries.some(
    (e) => e.date === date && e.id !== editing?.id && e.status !== "missed",
  );

  const handleSave = async () => {
    const isMissed = sessionStatus === "missed";
    const entry: DialysisLogEntry = {
      // A new entry gets its id when it is stored.
      id: editing?.id ?? "",
      date,
      displayDate: displayDate(date),
      isDialysisDay: true,
      treatmentType: isHome ? "Home hemodialysis" : "In-center hemodialysis",
      modality,
      status: sessionStatus,
      ...(isMakeup && makeupFor ? { makeupFor } : {}),
      startTime: isMissed ? "" : clock12(startTime),
      endTime: isMissed ? "" : clock12(endTime),
      duration: isMissed ? "" : durationLabel(runMinutes),
      location: "",
      careTeam: isMissed ? "" : careTeam.trim(),
      postWeightSummary: postWeight ? `${postWeight} kg` : "",
      attendance: isMissed
        ? "Missed"
        : endedEarly === "Yes"
          ? "Ended Early"
          : !isHome && arrivedLate === "Yes"
            ? "Arrived Late"
            : "Attended",
      attended: isMissed ? "No" : "Yes",
      arrivedLate: isHome ? "No" : arrivedLate,
      endedEarly,
      missedTreatments: isMissed ? 1 : 0,
      rescheduled: isMakeup ? "Yes" : "No",
      preOverallFeel: preFeel,
      preSymptoms,
      preSeverity,
      hadIntraSymptoms:
        intraSymptoms.length > 0 ||
        [
          crampingSeverity,
          dizzinessSeverity,
          swellingSeverity,
          sobSeverity,
        ].some((v) => v !== "No"),
      sequentialFluidRemoval,
      cramping: crampingSeverity,
      dizziness: dizzinessSeverity,
      swelling: swellingSeverity,
      shortnessOfBreath: sobSeverity,
      lowBp: lowBpSeverity,
      highBp: highBpSeverity,
      fatigue: fatigueSeverity,
      intraSymptoms,
      intraSeverity: {},
      intraNotes,
      postOverallFeel: postFeel,
      recoveryTime: recoverySeverity,
      medsTakenPrescribed,
      extraRecovery,
      ...(extra ? { extraRecoveryMinutes: extra } : {}),
      fluidRemoved: removed === null ? "" : `${removed} L`,
      preWeight,
      postWeight,
      weightDiff: removed === null ? "" : `-${removed} kg`,
      preBloodPressure: preBp,
      preHeartRate: preHr,
      bloodPressurePost: bpPost,
      heartRatePost: pulsePost,
      medicationsGiven: editing?.medicationsGiven ?? [],
      otherNotes: generalNotes,
    };
    try {
      setSaveFailed(false);
      await log.save(entry);
      if (onClose) onClose();
      else router.push("/dashboard/personal-log/dialysis-treatment");
    } catch {
      setSaveFailed(true);
    }
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
    "Nausea",
    "Vomiting",
    "Headache",
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

  const sessionLabel = (s: (typeof sessions)[number]) =>
    `${new Date(`${s.date}T00:00`).toLocaleDateString(
      isEs ? "es-ES" : "en-US",
      {
        weekday: "short",
        month: "short",
        day: "numeric",
      },
    )} · ${clock12(s.chairTime)}${s.date === today ? (isEs ? " (hoy)" : " (today)") : ""}`;

  const steps = [
    { id: 1, label: tx("Pre-Dialysis", "Antes de la diálisis") },
    { id: 2, label: tx("During Session", "Durante la sesión") },
    { id: 3, label: tx("Post & Vitals", "Después y signos vitales") },
    { id: 4, label: tx("Full View", "Vista completa") },
  ];

  const isMissed = sessionStatus === "missed";

  return (
    <div className="w-full space-y-4 font-sans text-fg-secondary">
      {/* 1. WHICH SESSION, AND THE HEADER FACTS */}
      <div className="w-full space-y-stack-md rounded-card border border-line bg-surface p-6 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-heading-4 font-bold tracking-tight text-fg">
            {editing
              ? tx("Edit Treatment", "Editar tratamiento")
              : tx("Chart a Treatment", "Registrar un tratamiento")}
          </h1>
          <div className="flex items-center gap-2">
            {share.notice}
            <button
              type="button"
              onClick={() => share.guard(() => window.print(), "print")}
              className="flex size-10 cursor-pointer items-center justify-center rounded-control border border-line bg-surface text-fg-muted transition-colors hover:border-primary-edge hover:text-fg-brand"
              title={tx("Print", "Imprimir")}
              aria-label={tx("Print", "Imprimir")}
            >
              <Printer className="size-4" />
            </button>
            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex size-10 cursor-pointer items-center justify-center rounded-control border border-line bg-surface text-fg-subtle transition-colors hover:border-line-strong hover:text-fg-secondary"
                aria-label={tx("Close", "Cerrar")}
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-inline-md md:grid-cols-2">
          <FormField
            label={tx("Scheduled session", "Sesión programada")}
            hint={tx(
              "From your dialysis schedule on Dialysis Management.",
              "De su horario de diálisis en Manejo de Diálisis.",
            )}
          >
            {(field) => (
              <Select
                {...field}
                value={choice}
                onChange={(e) => setChoice(e.target.value)}
              >
                {openSessions.map((s) => (
                  <option key={s.date} value={s.date}>
                    {sessionLabel(s)}
                  </option>
                ))}
                <option value={MAKEUP}>
                  {tx(
                    "Make-up / extra session (another day)",
                    "Sesión de reposición o extra (otro día)",
                  )}
                </option>
              </Select>
            )}
          </FormField>
          {isMakeup ? (
            <div className="grid grid-cols-1 gap-inline-md sm:grid-cols-2">
              <FormField label={tx("Date", "Fecha")}>
                {(field) => (
                  <Input
                    {...field}
                    type="date"
                    max={today}
                    value={makeupDate}
                    onChange={(e) => setMakeupDate(e.target.value || today)}
                  />
                )}
              </FormField>
              <FormField label={tx("Makes up for", "Reemplaza a")}>
                {(field) => (
                  <Select
                    {...field}
                    value={makeupFor}
                    onChange={(e) => setMakeupFor(e.target.value)}
                  >
                    <option value="">
                      {tx("An extra session", "Una sesión extra")}
                    </option>
                    {missedDays.map((d) => (
                      <option key={d} value={d}>
                        {tx("Missed on", "Perdida el")} {d}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>
            </div>
          ) : (
            <SegmentedChoice<"attended" | "missed">
              label={tx(
                "Did you have this treatment?",
                "¿Tuvo este tratamiento?",
              )}
              value={status}
              onChange={setStatus}
              options={[
                {
                  value: "attended",
                  label: tx("Yes, I had it", "Sí, lo tuve"),
                },
                {
                  value: "missed",
                  label: tx("No, I missed it", "No, lo perdí"),
                },
              ]}
            />
          )}
        </div>

        {dateTaken ? (
          <Alert tone="warning">
            {tx(
              "There is already a treatment charted on this day. Saving adds a second one.",
              "Ya hay un tratamiento registrado este día. Guardar agrega otro.",
            )}
          </Alert>
        ) : null}

        {!isMissed ? (
          <div className="grid grid-cols-1 gap-inline-md sm:grid-cols-2 lg:grid-cols-4">
            <FormField label={tx("Start time", "Hora de inicio")}>
              {(field) => (
                <Input
                  {...field}
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              )}
            </FormField>
            <FormField label={tx("End time", "Hora de fin")}>
              {(field) => (
                <Input
                  {...field}
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              )}
            </FormField>
            <FormField
              label={tx(
                "Care team (nurse / tech)",
                "Equipo (enfermera / técnico)",
              )}
              className="sm:col-span-2"
            >
              {(field) => (
                <Input
                  {...field}
                  value={careTeam}
                  onChange={(e) => setCareTeam(e.target.value)}
                  placeholder={tx("e.g. Lisa, RN", "p. ej. Lisa, RN")}
                />
              )}
            </FormField>
          </div>
        ) : (
          <Alert tone="info">
            {tx(
              "Saved as a missed treatment. When you make it up, chart the make-up session and pick this day under “Makes up for”.",
              "Se guarda como tratamiento perdido. Cuando lo reponga, registre la sesión de reposición y elija este día en «Reemplaza a».",
            )}
          </Alert>
        )}
      </div>

      {saveFailed ? (
        <Alert tone="danger">
          {tx(
            "That did not save. Your log is unchanged — please try again.",
            "No se guardó. Su registro no cambió; inténtelo de nuevo.",
          )}
        </Alert>
      ) : null}

      {isMissed ? (
        <div className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-5 py-4 sm:px-6">
          <Link
            href="/dashboard/personal-log/dialysis-treatment"
            className="inline-flex h-10 items-center rounded-control border border-line bg-surface px-4 text-caption font-bold text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg"
          >
            {tx("Cancel", "Cancelar")}
          </Link>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={log.isSaving}
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-control bg-primary-solid px-6 text-caption font-bold text-primary-on-solid transition-colors hover:bg-primary-solid-hover"
          >
            <Check className="size-4" />
            <span>{tx("Save as missed", "Guardar como perdido")}</span>
          </button>
        </div>
      ) : (
        /* 2. FORM CARD — step wizard, content and actions on one surface */
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
                {/* Arriving late is an in-center question; at home there is no
                  chair time to miss (client, 2026-10-12). */}
                {!isHome ? (
                  <section className="space-y-3">
                    <SectionTitle>
                      {tx("Attendance", "Asistencia")}
                    </SectionTitle>
                    <BinaryToggle
                      label={tx("Arrived late", "Llegó tarde")}
                      isEs={isEs}
                      value={arrivedLate}
                      onChange={setArrivedLate}
                    />
                  </section>
                ) : null}

                {/* The pre-screen: weight, blood pressure, heart rate. The
                  post-screen on page 3 asks the same three. */}
                <section className="space-y-3">
                  <SectionTitle>
                    {tx(
                      "Pre-Treatment Measurements",
                      "Mediciones antes del tratamiento",
                    )}
                  </SectionTitle>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <VitalCard
                      label={tx("Pre-weight", "Peso previo")}
                      icon={Scale}
                      value={preWeight}
                      onChange={setPreWeight}
                      placeholder="74.7"
                      unit="kg"
                      inputMode="decimal"
                    />
                    <VitalCard
                      label={tx("Blood Pressure", "Presión arterial")}
                      icon={HeartPulse}
                      value={preBp}
                      onChange={setPreBp}
                      placeholder="140/85"
                      unit="mmHg"
                      inputMode="text"
                    />
                    <VitalCard
                      label={tx("Heart Rate", "Frecuencia cardíaca")}
                      icon={Activity}
                      value={preHr}
                      onChange={setPreHr}
                      placeholder="78"
                      unit="bpm"
                      inputMode="numeric"
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
                  <MoodPicker
                    value={preFeel}
                    onChange={setPreFeel}
                    isEs={isEs}
                  />

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
                      label={tx("Dizziness", "Mareo")}
                      isEs={isEs}
                      value={dizzinessSeverity}
                      onChange={setDizzinessSeverity}
                    />
                    <SeverityFiveToggle
                      label={tx("Swelling", "Hinchazón")}
                      isEs={isEs}
                      value={swellingSeverity}
                      onChange={setSwellingSeverity}
                    />
                    <SeverityFiveToggle
                      label={tx("Shortness of breath", "Falta de aire")}
                      isEs={isEs}
                      value={sobSeverity}
                      onChange={setSobSeverity}
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
                    <BinaryToggle
                      label={tx(
                        "Extra recovery time in the chair",
                        "Tiempo extra de recuperación en el sillón",
                      )}
                      isEs={isEs}
                      value={extraRecovery}
                      onChange={setExtraRecovery}
                    />
                    {extraRecovery === "Yes" ? (
                      <FormField
                        label={tx("How many minutes?", "¿Cuántos minutos?")}
                        className="sm:max-w-[220px]"
                      >
                        {(field) => (
                          <Input
                            {...field}
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={240}
                            value={extraMinutes}
                            onChange={(e) => setExtraMinutes(e.target.value)}
                          />
                        )}
                      </FormField>
                    ) : null}

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

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <VitalCard
                      label={tx("Post-weight", "Peso posterior")}
                      icon={Scale}
                      value={postWeight}
                      onChange={setPostWeight}
                      placeholder="72.4"
                      unit="kg"
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

                  {/* Worked out, not typed: the difference between the two
                    weights, and the run from start to end. */}
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className={PANEL}>
                      <dt className="text-caption font-medium text-fg-muted">
                        {tx(
                          "Fluid removed (pre − post)",
                          "Líquido retirado (antes − después)",
                        )}
                      </dt>
                      <dd className="mt-1 text-heading-5 text-fg tabular-nums">
                        {removed === null
                          ? tx("Enter both weights", "Anote ambos pesos")
                          : `${removed} kg ≈ ${removed} L`}
                      </dd>
                    </div>
                    <div className={PANEL}>
                      <dt className="text-caption font-medium text-fg-muted">
                        {tx("Time on treatment", "Tiempo de tratamiento")}
                      </dt>
                      <dd className="mt-1 text-heading-5 text-fg tabular-nums">
                        {durationLabel(runMinutes)}
                        {extra
                          ? ` + ${extra} ${tx("min recovery", "min de recuperación")}`
                          : ""}
                      </dd>
                    </div>
                  </dl>
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
                onClick={() => void handleSave()}
                disabled={log.isSaving}
                className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-control bg-primary-solid px-6 text-caption font-bold text-primary-on-solid transition-colors hover:bg-primary-solid-hover"
              >
                <Check className="size-4" />
                <span>{tx("Save Log", "Guardar registro")}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
