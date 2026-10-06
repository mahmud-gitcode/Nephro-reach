"use client";

import { LogMediaBar, appendText } from "@/features/personal-log/LogMediaBar";
import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  BriefcaseMedical,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import {
  Button,
  buttonStyles,
  Card,
  FormField,
  Input,
  Select,
  Switch,
  Textarea,
} from "@/components/ui";
import { useRouter } from "next/navigation";
import {
  FREQUENCIES,
  ROUTES,
  medicationError,
  reminderClock,
  type MedicationDraft,
} from "@/features/medications/medicationList";
import { useMedications } from "@/features/medications/useMedications";
import { useReminders } from "@/features/medications/useReminders";
import { useNow } from "@/lib/utils/useNow";

interface FieldConfig {
  /** Which part of the draft the field edits. */
  key: keyof MedicationDraft;
  required?: boolean;
  labelKey: string;
  placeholderKey: string;
  helperKey?: string;
  full?: boolean;
  search?: boolean;
  select?: boolean;
  textarea?: boolean;
  type?: string;
}

const FIELD_CONFIGS: FieldConfig[] = [
  {
    key: "name",
    required: true,
    labelKey: "nameLabel",
    placeholderKey: "namePlaceholder",
    helperKey: "nameHelper",
    full: true,
    search: true,
  },
  {
    key: "dose",
    required: true,
    labelKey: "doseLabel",
    placeholderKey: "dosePlaceholder",
  },
  {
    key: "route",
    required: true,
    labelKey: "routeLabel",
    placeholderKey: "routePlaceholder",
    select: true,
  },
  {
    key: "frequency",
    required: true,
    labelKey: "frequencyLabel",
    placeholderKey: "frequencyPlaceholder",
    select: true,
  },
  {
    key: "purpose",
    labelKey: "purposeLabel",
    placeholderKey: "purposePlaceholder",
  },
  {
    key: "startDate",
    required: true,
    labelKey: "startDateLabel",
    placeholderKey: "startDatePlaceholder",
    type: "date",
  },
  {
    key: "endDate",
    labelKey: "endDateLabel",
    placeholderKey: "endDatePlaceholder",
    type: "date",
  },
  {
    key: "provider",
    labelKey: "providerLabel",
    placeholderKey: "providerPlaceholder",
  },
  {
    key: "pharmacy",
    labelKey: "pharmacyLabel",
    placeholderKey: "pharmacyPlaceholder",
  },
  {
    key: "instructions",
    labelKey: "instructionsLabel",
    placeholderKey: "instructionsPlaceholder",
    full: true,
    textarea: true,
  },
];

export default function AddMedicationPage() {
  const { language, t } = useLanguage();
  const isEs = language === "ES";
  const router = useRouter();
  const meds = useMedications();
  const reminders = useReminders();
  const now = new Date(useNow());
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const [enableReminder, setEnableReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [draft, setDraft] = useState<MedicationDraft>({
    name: "",
    dose: "",
    route: "",
    frequency: "",
    purpose: "",
    startDate: today,
    endDate: "",
    provider: "",
    pharmacy: "",
    instructions: "",
  });
  const [tried, setTried] = useState(false);
  const error = medicationError(draft);
  const set = (key: keyof MedicationDraft, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  async function save() {
    setTried(true);
    if (error) return;
    await meds.add(draft, today);
    if (enableReminder)
      await reminders.setTime(draft.name.trim(), reminderClock(reminderTime));
    router.push("/dashboard/personal-log/medications");
  }

  return (
    <div className="mx-auto max-w-[672px] space-y-stack-lg">
      <PersonalLogDisclaimer />

      <Link
        href="/dashboard/personal-log/medications"
        className={buttonStyles({
          variant: "neutral",
          appearance: "stroke",
          size: "small",
        })}
      >
        <ArrowLeft />
        {t("medicationsLog.backToLog")}
      </Link>

      <Card as="section" tone="sunken" padding="small">
        <header className="flex items-start gap-inline-lg px-inset-xs pt-inset-xs">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-panel bg-primary-soft text-fg-brand"
          >
            <BriefcaseMedical className="h-icon-big w-icon-big" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-heading-4 text-fg">
              {t("medicationsLog.addNewMedication")}
            </h1>
          </div>
          <Link
            href="/dashboard/personal-log/medications"
            className={buttonStyles({
              variant: "neutral",
              appearance: "stroke",
              size: "small",
              iconOnly: true,
            })}
            aria-label="Close add medication"
          >
            <X />
          </Link>
        </header>

        {/* These were <span> elements dressed up to look like inputs — no real
            form controls existed on this page at all. They are proper fields
            now, so the labels are actually associated with something. */}
        <Card padding="small" className="mt-stack-lg">
          <div className="grid grid-cols-1 gap-stack-xl md:grid-cols-2">
            {FIELD_CONFIGS.map((field) => {
              const label = t(`medicationsLog.addForm.${field.labelKey}`);
              const placeholder = t(
                `medicationsLog.addForm.${field.placeholderKey}`,
              );
              const hint = field.helperKey
                ? t(`medicationsLog.addForm.${field.helperKey}`)
                : undefined;

              return (
                <FormField
                  key={field.labelKey}
                  label={label}
                  hint={hint}
                  required={field.required}
                  error={
                    tried && error === field.key
                      ? isEs
                        ? "Revisa este campo"
                        : field.key === "endDate"
                          ? "The end date is before the start date"
                          : "This is needed"
                      : undefined
                  }
                  className={field.full ? "md:col-span-2" : undefined}
                >
                  {(props) =>
                    field.textarea ? (
                      <Textarea
                        {...props}
                        rows={4}
                        placeholder={placeholder}
                        value={draft[field.key]}
                        onChange={(e) => set(field.key, e.target.value)}
                      />
                    ) : field.select ? (
                      <Select
                        {...props}
                        value={draft[field.key]}
                        onChange={(e) => set(field.key, e.target.value)}
                      >
                        <option value="" disabled>
                          {placeholder}
                        </option>
                        {field.key === "route"
                          ? ROUTES.map((o) => (
                              <option key={o.value} value={o.value}>
                                {isEs ? o.es : o.en}
                              </option>
                            ))
                          : FREQUENCIES.map((o) => (
                              <option key={o.en} value={o.en}>
                                {isEs ? o.es : o.en}
                              </option>
                            ))}
                      </Select>
                    ) : (
                      <Input
                        {...props}
                        type={field.type}
                        placeholder={placeholder}
                        leadingIcon={field.search ? <Search /> : undefined}
                        value={draft[field.key]}
                        onChange={(e) => set(field.key, e.target.value)}
                      />
                    )
                  }
                </FormField>
              );
            })}
          </div>
          {/* Camera and voice (client, 2026-10-06): a photo of the bottle
              or label stays with this medication; speech goes into the
              instructions. */}
          <div className="mt-stack-md border-t border-line-subtle pt-stack-md">
            <p className="mb-stack-xs text-label-md text-fg">
              {isEs ? "Foto y voz" : "Photo and voice"}
            </p>
            <LogMediaBar
              logName="Medication log"
              isEs={isEs}
              onDictated={(text) =>
                setDraft((d) => ({
                  ...d,
                  instructions: appendText(d.instructions, text),
                }))
              }
              photo={draft.photo ?? null}
              onPhoto={(photo) =>
                setDraft((d) => ({ ...d, photo: photo ?? undefined }))
              }
            />
          </div>
        </Card>

        <Card className="mt-stack-lg space-y-stack-md">
          <div className="flex items-center justify-between gap-inline-lg">
            <div className="flex items-center gap-inline-md">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-control bg-primary-soft text-fg-brand"
              >
                <Bell className="h-icon-small w-icon-small" />
              </span>
              <p id="reminder-label" className="text-label-lg text-fg">
                {language === "ES"
                  ? "Recordatorio de Medicamento"
                  : "Medication Reminder"}
              </p>
            </div>
            <Switch
              checked={enableReminder}
              onChange={setEnableReminder}
              aria-labelledby="reminder-label"
            />
          </div>

          {enableReminder ? (
            <div className="border-t border-line-subtle pt-inset-sm">
              <FormField
                label={
                  language === "ES"
                    ? "Seleccionar Hora"
                    : "Select Reminder Time"
                }
              >
                {(props) => (
                  <Input
                    {...props}
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="text-center text-metric-md"
                  />
                )}
              </FormField>
            </div>
          ) : null}
        </Card>

        <div className="mt-stack-lg grid grid-cols-1 gap-inline-md md:grid-cols-2">
          <Link
            href="/dashboard/personal-log/medications"
            className={buttonStyles({
              variant: "neutral",
              appearance: "fill-stroke",
              fullWidth: true,
            })}
          >
            {t("medicationsLog.cancel")}
          </Link>
          <Button
            fullWidth
            leadingIcon={<Plus />}
            onClick={save}
            loading={meds.isSaving}
          >
            {t("medicationsLog.addMedication")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
