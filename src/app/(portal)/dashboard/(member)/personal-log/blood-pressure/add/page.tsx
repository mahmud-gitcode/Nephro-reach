"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, Clock3, HeartPulse, Plus, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import {
  Button,
  buttonStyles,
  Card,
  FormField,
  Input,
  Textarea,
} from "@/components/ui";

/** The tick that shows which option in a radio group is chosen. */
function RadioMark({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-chip border ${
        selected
          ? "border-primary-edge bg-primary-solid text-primary-on-solid"
          : "border-field bg-surface"
      }`}
    >
      {selected ? <Check className="h-3.5 w-3.5" /> : null}
    </span>
  );
}

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
    <Card tone="flat" padding="small" className="flex items-center gap-inline-md">
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
  const [selectedMood, setSelectedMood] = useState(1);
  const [medTaken, setMedTaken] = useState(true);
  const [notes, setNotes] = useState("");

  const moods = [
    { label: t("bloodPressure.add.moods.great"), mark: t("bloodPressure.add.moods.greatMark"), emoji: ":)" },
    { label: t("bloodPressure.add.moods.good"), mark: t("bloodPressure.add.moods.goodMark"), emoji: ":)" },
    { label: t("bloodPressure.add.moods.okay"), mark: t("bloodPressure.add.moods.okayMark"), emoji: ":|" },
    { label: t("bloodPressure.add.moods.tired"), mark: t("bloodPressure.add.moods.tiredMark"), emoji: "-_-" },
    { label: t("bloodPressure.add.moods.stressed"), mark: t("bloodPressure.add.moods.stressedMark"), emoji: ":/" },
  ];

  const vitals = [
    { label: t("bloodPressure.add.systolic"), value: systolic, set: setSystolic },
    { label: t("bloodPressure.add.diastolic"), value: diastolic, set: setDiastolic },
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

        {/* Was a list of plain buttons: a screen reader could not tell these
            were one choice, nor which one was picked. It is a radio group. */}
        <Card padding="small" className="mt-stack-lg">
          <h2 id="mood-label" className="text-heading-5 text-fg">
            {t("bloodPressure.add.howIFeel")}
          </h2>
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            {t("bloodPressure.add.selectCurrentState")}
          </p>

          <div
            role="radiogroup"
            aria-labelledby="mood-label"
            className="mt-stack-md space-y-stack-sm"
          >
            {moods.map((mood, index) => {
              const selected = selectedMood === index;
              return (
                <button
                  key={mood.label}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setSelectedMood(index)}
                  className={`flex w-full cursor-pointer items-center gap-inline-md rounded-card border p-inset-sm text-left transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                    selected
                      ? "border-primary-soft-line bg-primary-soft"
                      : "border-line bg-surface hover:bg-surface-sunken"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-surface-sunken text-label-md text-fg-secondary"
                  >
                    {mood.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-label-md text-fg">
                      {mood.label}
                    </span>
                    <span className="block text-caption text-fg-muted">
                      {mood.mark}
                    </span>
                  </span>
                  <RadioMark selected={selected} />
                </button>
              );
            })}
          </div>
        </Card>

        <Card padding="small" className="mt-stack-lg">
          <h2 className="text-heading-5 text-fg">
            {t("bloodPressure.add.howIFeel")}
          </h2>
          <p id="med-label" className="mt-stack-md text-label-md text-fg">
            {t("bloodPressure.add.medicationQuestion")}
          </p>

          <div
            role="radiogroup"
            aria-labelledby="med-label"
            className="mt-stack-md grid grid-cols-2 gap-inline-md"
          >
            {[
              { label: t("bloodPressure.add.yes"), value: true },
              { label: t("bloodPressure.add.no"), value: false },
            ].map((opt) => {
              const selected = medTaken === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setMedTaken(opt.value)}
                  className={`flex h-control-big cursor-pointer items-center justify-between rounded-card border px-inset-sm text-label-md transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                    selected
                      ? "border-primary-soft-line bg-primary-soft text-primary-fg"
                      : "border-line bg-surface text-fg-secondary hover:bg-surface-sunken"
                  }`}
                >
                  {opt.label}
                  <RadioMark selected={selected} />
                </button>
              );
            })}
          </div>

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
