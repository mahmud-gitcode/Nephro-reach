"use client";

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
import { notBuiltYet } from "@/lib/utils/notBuiltYet";

interface FieldConfig {
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
    labelKey: "nameLabel",
    placeholderKey: "namePlaceholder",
    helperKey: "nameHelper",
    full: true,
    search: true,
  },
  { labelKey: "doseLabel", placeholderKey: "dosePlaceholder" },
  { labelKey: "routeLabel", placeholderKey: "routePlaceholder", select: true },
  {
    labelKey: "frequencyLabel",
    placeholderKey: "frequencyPlaceholder",
    select: true,
  },
  { labelKey: "purposeLabel", placeholderKey: "purposePlaceholder" },
  {
    labelKey: "startDateLabel",
    placeholderKey: "startDatePlaceholder",
    type: "date",
  },
  {
    labelKey: "endDateLabel",
    placeholderKey: "endDatePlaceholder",
    type: "date",
  },
  { labelKey: "providerLabel", placeholderKey: "providerPlaceholder" },
  { labelKey: "pharmacyLabel", placeholderKey: "pharmacyPlaceholder" },
  {
    labelKey: "instructionsLabel",
    placeholderKey: "instructionsPlaceholder",
    full: true,
    textarea: true,
  },
];

export default function AddMedicationPage() {
  const { language, t } = useLanguage();
  const [enableReminder, setEnableReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState("08:00");

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
                  className={field.full ? "md:col-span-2" : undefined}
                >
                  {(props) =>
                    field.textarea ? (
                      <Textarea {...props} rows={4} placeholder={placeholder} />
                    ) : field.select ? (
                      <Select {...props} defaultValue="">
                        <option value="" disabled>
                          {placeholder}
                        </option>
                      </Select>
                    ) : (
                      <Input
                        {...props}
                        type={field.type}
                        placeholder={placeholder}
                        leadingIcon={field.search ? <Search /> : undefined}
                      />
                    )
                  }
                </FormField>
              );
            })}
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
            {...notBuiltYet("Adding a medication")}
            fullWidth
            leadingIcon={<Plus />}
          >
            {t("medicationsLog.addMedication")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
