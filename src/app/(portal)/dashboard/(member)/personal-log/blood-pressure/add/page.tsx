"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, HeartPulse, Plus, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import {
  Button,
  buttonStyles,
  Card,
  FormField,
  Input,
  RadioCard,
  RadioGroup,
  Textarea,
} from "@/components/ui";

function MetaTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card
      tone="flat"
      padding="small"
      className="flex items-center gap-inline-md"
    >
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-soft text-fg-brand [&_svg]:h-icon-small [&_svg]:w-icon-small"
      >
        {icon}
      </span>
      <div>
        <p className="text-caption text-fg-muted">{label}</p>
        <p className="mt-stack-xs text-label-md text-fg">{value}</p>
      </div>
    </Card>
  );
}

export default function AddBloodPressurePage() {
  const { language, t } = useLanguage();

  const [systolic, setSystolic] = useState("123");
  const [diastolic, setDiastolic] = useState("78");
  const [pulse, setPulse] = useState("72");
  const [selectedMood, setSelectedMood] = useState("good");
  const [medTaken, setMedTaken] = useState("yes");
  const [notes, setNotes] = useState("");

  const moods = [
    {
      id: "great",
      label: t("bloodPressure.add.moods.great"),
      mark: t("bloodPressure.add.moods.greatMark"),
      emoji: ":)",
    },
    {
      id: "good",
      label: t("bloodPressure.add.moods.good"),
      mark: t("bloodPressure.add.moods.goodMark"),
      emoji: ":)",
    },
    {
      id: "okay",
      label: t("bloodPressure.add.moods.okay"),
      mark: t("bloodPressure.add.moods.okayMark"),
      emoji: ":|",
    },
    {
      id: "tired",
      label: t("bloodPressure.add.moods.tired"),
      mark: t("bloodPressure.add.moods.tiredMark"),
      emoji: "-_-",
    },
    {
      id: "stressed",
      label: t("bloodPressure.add.moods.stressed"),
      mark: t("bloodPressure.add.moods.stressedMark"),
      emoji: ":/",
    },
  ];

  const vitals = [
    {
      label: t("bloodPressure.add.systolic"),
      value: systolic,
      set: setSystolic,
    },
    {
      label: t("bloodPressure.add.diastolic"),
      value: diastolic,
      set: setDiastolic,
    },
    { label: t("bloodPressure.add.pulse"), value: pulse, set: setPulse },
  ];

  return (
    <div className="mx-auto max-w-[429px] space-y-stack-lg">
      <PersonalLogDisclaimer />

      <Card as="section" tone="sunken" padding="small">
        <header className="flex items-center gap-inline-md px-inset-xs pt-inset-xs">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-panel bg-danger-soft text-danger"
          >
            <HeartPulse className="h-icon-big w-icon-big" />
          </span>
          <h1 className="min-w-0 flex-1 text-heading-4 text-fg">
            {t("bloodPressure.add.title")}
          </h1>
          <Link
            href="/dashboard/personal-log/blood-pressure"
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

        <div className="mt-stack-lg grid grid-cols-2 gap-inline-md">
          <MetaTile
            icon={<CalendarDays />}
            label={t("bloodPressure.add.date")}
            value={language === "ES" ? "5 de mayo de 2026" : "May 5, 2026"}
          />
          <MetaTile
            icon={<Clock3 />}
            label={t("bloodPressure.add.time")}
            value="12:00 AM"
          />
        </div>

        <Card padding="small" className="mt-stack-lg">
          <h2 className="text-heading-5 text-fg">
            {t("bloodPressure.add.howIFelt")}
          </h2>
          <div className="mt-stack-md grid grid-cols-1 gap-stack-lg sm:grid-cols-3">
            {vitals.map((v) => (
              <FormField key={v.label} label={v.label}>
                {(props) => (
                  <Input
                    {...props}
                    type="number"
                    inputMode="numeric"
                    value={v.value}
                    onChange={(e) => v.set(e.target.value)}
                  />
                )}
              </FormField>
            ))}
          </div>
        </Card>

        <Card padding="small" className="mt-stack-lg">
          <h2 className="text-heading-5 text-fg">
            {t("bloodPressure.add.howIFeel")}
          </h2>
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            {t("bloodPressure.add.selectCurrentState")}
          </p>

          <RadioGroup
            label={t("bloodPressure.add.howIFeel")}
            value={selectedMood}
            onChange={setSelectedMood}
            className="mt-stack-md"
          >
            {moods.map((mood) => (
              <RadioCard
                key={mood.id}
                value={mood.id}
                title={mood.label}
                description={mood.mark}
                icon={mood.emoji}
              />
            ))}
          </RadioGroup>
        </Card>

        <Card padding="small" className="mt-stack-lg">
          <h2 className="text-heading-5 text-fg">
            {t("bloodPressure.add.howIFeel")}
          </h2>
          <p className="mt-stack-md text-label-md text-fg">
            {t("bloodPressure.add.medicationQuestion")}
          </p>

          <RadioGroup
            label={t("bloodPressure.add.medicationQuestion")}
            orientation="horizontal"
            value={medTaken}
            onChange={setMedTaken}
            className="mt-stack-md"
          >
            <RadioCard value="yes" title={t("bloodPressure.add.yes")} />
            <RadioCard value="no" title={t("bloodPressure.add.no")} />
          </RadioGroup>

          <div className="mt-stack-lg">
            <FormField label={t("bloodPressure.add.notes")}>
              {(props) => (
                <Textarea
                  {...props}
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("bloodPressure.add.notesPlaceholder")}
                />
              )}
            </FormField>
          </div>
        </Card>

        <div className="mt-stack-xl grid grid-cols-2 gap-inline-md">
          <Link
            href="/dashboard/personal-log/blood-pressure"
            className={buttonStyles({
              variant: "neutral",
              appearance: "fill-stroke",
              fullWidth: true,
            })}
          >
            {t("bloodPressure.add.cancel")}
          </Link>
          <Button fullWidth leadingIcon={<Plus />}>
            {t("bloodPressure.add.saveEntry")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
