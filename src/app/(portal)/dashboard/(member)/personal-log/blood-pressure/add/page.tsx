"use client";

import { LogMediaBar, appendText } from "@/features/personal-log/LogMediaBar";
import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { HeartPulse, Plus, Save, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import {
  Alert,
  Badge,
  Button,
  buttonStyles,
  Card,
  FormField,
  Input,
  RadioCard,
  RadioGroup,
  SegmentedChoice,
  Select,
  Skeleton,
  Textarea,
} from "@/components/ui";
import {
  MEDICATION_STATES,
  POSITIONS,
  SYMPTOMS,
  bpError,
  statusOf,
  type BpDraft,
  type BpError,
  type BpReading,
  type MedicationState,
  type Position,
} from "@/features/personal-log/blood-pressure/bloodPressure";
import { useBloodPressure } from "@/features/personal-log/blood-pressure/useBloodPressure";
import { useNow } from "@/lib/utils/useNow";

const LIST = "/dashboard/personal-log/blood-pressure";

const statusTone = {
  High: "danger",
  Elevated: "warning",
  Normal: "success",
} as const;

const ERROR_EN: Record<BpError, string> = {
  date: "Pick a date on or before today",
  time: "Enter the time of the reading",
  systolic: "Systolic between 60 and 260",
  diastolic: "Diastolic between 30 and 160",
  pulse: "Pulse between 30 and 220",
  order: "The top number (systolic) should be higher than the bottom one",
};

const ERROR_ES: Record<BpError, string> = {
  date: "Elige una fecha de hoy o antes",
  time: "Escribe la hora de la lectura",
  systolic: "Sistólica entre 60 y 260",
  diastolic: "Diastólica entre 30 y 160",
  pulse: "Pulso entre 30 y 220",
  order: "El número de arriba (sistólica) debe ser mayor que el de abajo",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** The form, filled from `reading` when editing one. */
function ReadingForm({ reading }: { reading?: BpReading }) {
  const { language, t } = useLanguage();
  const isEs = language === "ES";
  const router = useRouter();
  const bp = useBloodPressure();
  const now = new Date(useNow());
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const [date, setDate] = useState(reading?.date ?? today);
  const [time, setTime] = useState(
    reading?.time ?? `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  );
  const [systolic, setSystolic] = useState(String(reading?.systolic ?? ""));
  const [diastolic, setDiastolic] = useState(String(reading?.diastolic ?? ""));
  const [pulse, setPulse] = useState(String(reading?.pulse ?? ""));
  const [position, setPosition] = useState<Position>(
    reading?.position ?? "Sitting",
  );
  const [symptoms, setSymptoms] = useState(reading?.symptoms ?? "None");
  const [mood, setMood] = useState(reading?.mood ?? "good");
  const [medication, setMedication] = useState<MedicationState>(
    reading?.medication ?? "Taken",
  );
  const [notes, setNotes] = useState(reading?.notes ?? "");
  const [tried, setTried] = useState(false);

  const draft: BpDraft = {
    date,
    time,
    systolic: Number(systolic),
    diastolic: Number(diastolic),
    pulse: Number(pulse),
    position,
    symptoms,
    medication,
    mood,
    notes,
  };
  const error = bpError(draft, today);
  const show = (field: BpError) =>
    tried && error === field ? (isEs ? ERROR_ES : ERROR_EN)[field] : undefined;
  const preview = systolic && diastolic && !error ? statusOf(draft) : null;

  const moods = ["great", "good", "okay", "tired", "stressed"].map((id) => ({
    id,
    label: t(`bloodPressure.add.moods.${id}`),
    mark: t(`bloodPressure.add.moods.${id}Mark`),
  }));

  async function save() {
    setTried(true);
    if (error) return;
    if (reading) await bp.update(reading.id, draft);
    else await bp.add(draft);
    router.push(LIST);
  }

  return (
    <Card as="section" tone="sunken" padding="small">
      <header className="flex items-center gap-inline-md px-inset-xs pt-inset-xs">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-panel bg-danger-soft text-danger"
        >
          <HeartPulse className="h-icon-big w-icon-big" />
        </span>
        <h1 className="min-w-0 flex-1 text-heading-4 text-fg">
          {reading
            ? isEs
              ? "Editar lectura"
              : "Edit Reading"
            : t("bloodPressure.add.title")}
        </h1>
        <Link
          href={LIST}
          className={buttonStyles({
            variant: "neutral",
            appearance: "stroke",
            size: "small",
            iconOnly: true,
          })}
          aria-label={t("bloodPressure.add.closeAria")}
        >
          <X />
        </Link>
      </header>

      {bp.saveError ? (
        <Alert tone="danger" className="mt-stack-md">
          {isEs
            ? "No se pudo guardar. Intenta de nuevo."
            : "That did not save. Try again."}
        </Alert>
      ) : null}

      <Card padding="small" className="mt-stack-lg">
        <div className="grid grid-cols-2 gap-inline-md">
          <FormField
            label={t("bloodPressure.add.date")}
            required
            error={show("date")}
          >
            {(props) => (
              <Input
                {...props}
                type="date"
                max={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            )}
          </FormField>
          <FormField
            label={t("bloodPressure.add.time")}
            required
            error={show("time")}
          >
            {(props) => (
              <Input
                {...props}
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            )}
          </FormField>
        </div>
      </Card>

      <Card padding="small" className="mt-stack-lg">
        <div className="flex flex-wrap items-center justify-between gap-inline-md">
          <h2 className="text-heading-4 text-fg">
            {t("bloodPressure.add.howIFelt")}
          </h2>
          {preview ? (
            <Badge tone={statusTone[preview]}>
              {t(`bloodPressure.statuses.${preview}`) || preview}
            </Badge>
          ) : null}
        </div>
        <div className="mt-stack-lg grid grid-cols-1 gap-stack-lg sm:grid-cols-3">
          <FormField
            label={t("bloodPressure.add.systolic")}
            required
            error={show("systolic") ?? show("order")}
          >
            {(props) => (
              <Input
                {...props}
                type="number"
                inputMode="numeric"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
              />
            )}
          </FormField>
          <FormField
            label={t("bloodPressure.add.diastolic")}
            required
            error={show("diastolic")}
          >
            {(props) => (
              <Input
                {...props}
                type="number"
                inputMode="numeric"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
              />
            )}
          </FormField>
          <FormField
            label={t("bloodPressure.add.pulse")}
            required
            error={show("pulse")}
          >
            {(props) => (
              <Input
                {...props}
                type="number"
                inputMode="numeric"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
              />
            )}
          </FormField>
        </div>
        <div className="mt-stack-lg grid grid-cols-1 gap-stack-lg sm:grid-cols-2">
          <SegmentedChoice
            label={t("bloodPressure.tableHeaders.position")}
            value={position}
            onChange={(next: Position) => setPosition(next)}
            options={POSITIONS.map((p) => ({
              value: p,
              label: t(`bloodPressure.positions.${p}`) || p,
            }))}
          />
          <FormField label={t("bloodPressure.tableHeaders.symptoms")}>
            {(props) => (
              <Select
                {...props}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              >
                {SYMPTOMS.map((s) => (
                  <option key={s} value={s}>
                    {t(`bloodPressure.symptoms.${s}`) || s}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </div>
      </Card>

      <Card padding="small" className="mt-stack-lg">
        <h2 className="text-heading-4 text-fg">
          {t("bloodPressure.add.howIFeel")}
        </h2>
        <p className="mt-0.5 text-body-md text-fg-muted">
          {t("bloodPressure.add.selectCurrentState")}
        </p>
        <RadioGroup
          label={t("bloodPressure.add.howIFeel")}
          value={mood}
          onChange={setMood}
          className="mt-stack-lg"
        >
          {moods.map((m) => (
            <RadioCard
              key={m.id}
              value={m.id}
              title={m.label}
              description={m.mark}
            />
          ))}
        </RadioGroup>
      </Card>

      <Card padding="small" className="mt-stack-lg">
        <SegmentedChoice
          label={t("bloodPressure.add.medicationQuestion")}
          value={medication}
          onChange={(next: MedicationState) => setMedication(next)}
          options={MEDICATION_STATES.map((m) => ({
            value: m,
            label:
              m === "Not taken"
                ? isEs
                  ? "No la tomé"
                  : "Not taken"
                : t(`bloodPressure.medications.${m}`) || m,
          }))}
        />
        <div className="mt-stack-lg">
          <FormField label={t("bloodPressure.add.notes")}>
            {(props) => (
              <Textarea
                {...props}
                rows={4}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("bloodPressure.add.notesPlaceholder")}
              />
            )}
          </FormField>
          <LogMediaBar
            logName="Blood pressure log"
            isEs={language === "ES"}
            onDictated={(text) =>
              setNotes((current) => appendText(current, text))
            }
          />
        </div>
      </Card>

      <div className="mt-stack-xl grid grid-cols-2 gap-inline-md">
        <Link
          href={LIST}
          className={buttonStyles({
            variant: "neutral",
            appearance: "fill-stroke",
            fullWidth: true,
          })}
        >
          {t("bloodPressure.add.cancel")}
        </Link>
        <Button
          fullWidth
          onClick={save}
          loading={bp.isSaving}
          leadingIcon={reading ? <Save /> : <Plus />}
        >
          {reading
            ? isEs
              ? "Guardar cambios"
              : "Save Changes"
            : t("bloodPressure.add.saveEntry")}
        </Button>
      </div>
    </Card>
  );
}

/** Reads `?id=` to edit a reading; without it, adds a new one. */
function AddOrEdit() {
  const id = useSearchParams().get("id");
  const bp = useBloodPressure();
  if (id && bp.isPending)
    return <Skeleton height={640} className="rounded-card" />;
  const reading = id ? bp.readings.find((r) => r.id === id) : undefined;
  return <ReadingForm key={reading?.id ?? "new"} reading={reading} />;
}

export default function AddBloodPressurePage() {
  return (
    <div className="mx-auto max-w-130 space-y-stack-lg">
      <PersonalLogDisclaimer />
      <Suspense fallback={<Skeleton height={640} className="rounded-card" />}>
        <AddOrEdit />
      </Suspense>
    </div>
  );
}
