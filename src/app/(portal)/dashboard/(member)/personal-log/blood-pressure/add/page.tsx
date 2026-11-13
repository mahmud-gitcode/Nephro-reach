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
  AsyncSection,
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
  categoryOf,
  type BpDraft,
  type BpError,
  type BpReading,
  type MedicationState,
  type Position,
} from "@/features/personal-log/blood-pressure/bloodPressure";
import { useBloodPressure } from "@/features/personal-log/blood-pressure/useBloodPressure";
import { useNow } from "@/lib/utils/useNow";
import { isApiError } from "@/lib/api/client";
import { UploadError, uploadErrorMessage } from "@/lib/api/upload";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";

/** Why a save failed, when the server or the upload said why. */
function uploadErrorOrServer(error: unknown, isEs: boolean): string | null {
  if (error instanceof UploadError) return uploadErrorMessage(error, isEs);
  if (isApiError(error) && error.status === 403)
    return String(errorMessageFor(error, "", isEs ? "es" : "en"));
  if (isApiError(error) && error.status === 400 && error.messages.length > 0)
    return error.messages.join(" ");
  return null;
}

const LIST = "/dashboard/personal-log/blood-pressure";

const ERROR_EN: Record<BpError, string> = {
  date: "Pick a date on or before today",
  time: "Enter the time of the reading",
  systolic: "Systolic between 60 and 260",
  diastolic: "Diastolic between 30 and 160",
  pulse: "Pulse between 30 and 220",
  order: "The top number (systolic) should be higher than the bottom one",
};

const ERROR_ES: Record<BpError, string> = {
  date: "Elija una fecha de hoy o anterior",
  time: "Escriba la hora de la lectura",
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
  /* The photo: kept (undefined), a newly picked file, or removed (null).
     A new file is uploaded through /files on save; only its id is sent. */
  const [photoChange, setPhotoChange] = useState<File | null | undefined>(
    undefined,
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const hasPhoto =
    photoChange === undefined ? !!reading?.photoFileId : photoChange !== null;
  const pickPhoto = (file: File | null) => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
    setPhotoChange(file);
  };
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
    if (error || bp.isSaving) return;
    /* Back to the list only once the server kept it; a failure shows below
       and the form keeps what was typed. */
    try {
      if (reading) await bp.update(reading.id, draft, photoChange);
      else await bp.add(draft, photoChange);
    } catch {
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
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
            : "That did not save. Try again."}{" "}
          {isApiError(bp.saveError) || bp.saveError instanceof UploadError
            ? uploadErrorOrServer(bp.saveError, isEs)
            : null}
        </Alert>
      ) : null}

      <Card padding="small" className="mt-stack-lg">
        {/* Stacked on a phone: side by side, both fields cut off the date
            and the time (client review, 2026-10-08). */}
        <div className="grid grid-cols-1 gap-inline-md min-[480px]:grid-cols-2">
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
            <Badge tone={categoryOf(preview).tone}>
              {isEs ? categoryOf(preview).es : categoryOf(preview).en}
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
          label={
            isEs
              ? "¿Tomé hoy mi medicamento para la presión arterial según lo recetado?"
              : "Did I take my blood pressure medication as prescribed today?"
          }
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
            onPhotoFile={pickPhoto}
            hasPhoto={hasPhoto}
            photoPreview={photoPreview}
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
  const { language } = useLanguage();
  const isEs = language === "ES";
  const lang = isEs ? "es" : "en";
  if (id && bp.isPending)
    return <Skeleton height={640} className="rounded-card" />;
  /* Editing needs the reading; a failed read is an error, never a blank
     form that would save over it. */
  if (id && bp.error)
    return (
      <AsyncSection
        pending={false}
        skeleton={null}
        error={bp.error}
        onRetry={canRetry(bp.error) ? bp.refetch : undefined}
        errorTitle={errorTitleFor(
          bp.error,
          isEs
            ? "No se pudieron cargar sus lecturas"
            : "Your readings could not be loaded",
          lang,
        )}
        errorMessage={errorMessageFor(bp.error, undefined, lang)}
      >
        {null}
      </AsyncSection>
    );
  const reading = id ? bp.readings.find((r) => r.id === id) : undefined;
  /* An id outside the loaded window (or someone else's) is not a new
     reading: saying so beats a blank form that would add a duplicate. */
  if (id && !reading)
    return (
      <Alert tone="warning">
        {isEs
          ? "Esa lectura no se encontró en su registro reciente."
          : "That reading was not found in your recent log."}
      </Alert>
    );
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
