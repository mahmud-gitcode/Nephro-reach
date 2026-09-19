"use client";

import React from "react";
import { Activity } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Card, RadioCard, RadioGroup, Select } from "@/components/ui";
import {
  MODALITY_OPTIONS,
  PD_SCHEDULE_OPTIONS,
  type DialysisModality,
  type PdSchedule,
} from "./modality";
import type { DialysisModalityLog } from "./useDialysisModality";

/* ==========================================================================
   My dialysis type
   --------------------------------------------------------------------------
   Shown at the top of both the treatment log and the management tab,
   because it is the setting that decides what the rest of each page should
   be asking for. It is one choice a member makes once, not a question per
   session.

   The PD follow-ups appear only when PD is chosen. A member on in-center
   haemodialysis should never be asked how many exchanges they do a day.
   ========================================================================== */

export default function ModalityCard({
  log,
  className,
}: {
  log: DialysisModalityLog;
  className?: string;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const { settings, modality } = log;

  return (
    <Card as="section" padding="small" className={className}>
      <div className="flex items-start gap-inline-md">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-soft text-fg-brand"
        >
          <Activity className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-heading-5 text-fg">
            {isEs ? "Mi tipo de diálisis" : "My dialysis type"}
          </h2>
          <p className="mt-0.5 text-body-sm text-fg-secondary">
            {isEs
              ? "Decide qué te pide registrar esta página. Cámbialo si cambia tu tratamiento."
              : "This decides what the rest of this page asks you to record. Change it if your treatment changes."}
          </p>
        </div>
      </div>

      <RadioGroup
        label={isEs ? "Tipo de diálisis" : "Dialysis type"}
        value={modality}
        onChange={(next) => log.setModality(next as DialysisModality)}
        className="mt-stack-md grid grid-cols-1 gap-inline-md sm:grid-cols-3"
      >
        {MODALITY_OPTIONS.map((option) => (
          <RadioCard
            key={option.value}
            value={option.value}
            title={isEs ? option.labelEs : option.labelEn}
            description={isEs ? option.hintEs : option.hintEn}
          />
        ))}
      </RadioGroup>

      {/* Only PD has a rhythm to ask about. Haemodialysis of either kind is
          already described by the weekly schedule further down the page. */}
      {modality === "pd" ? (
        <div className="mt-stack-md grid grid-cols-1 gap-inline-md border-t border-line-subtle pt-inset-sm sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="pd-schedule"
              className="block text-label-md text-fg-secondary"
            >
              {isEs ? "¿Cómo hace sus intercambios?" : "How do you exchange?"}
            </label>
            <Select
              id="pd-schedule"
              selectSize="small"
              value={settings.pdSchedule}
              onChange={(event) =>
                log.saveSettings({
                  pdSchedule: event.target.value as PdSchedule,
                })
              }
            >
              {PD_SCHEDULE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {isEs ? option.labelEs : option.labelEn}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="pd-exchanges"
              className="block text-label-md text-fg-secondary"
            >
              {settings.pdSchedule === "apd"
                ? isEs
                  ? "Ciclos por noche"
                  : "Cycles per night"
                : isEs
                  ? "Intercambios por día"
                  : "Exchanges per day"}
            </label>
            <Select
              id="pd-exchanges"
              selectSize="small"
              value={String(settings.exchangesPerDay)}
              onChange={(event) =>
                log.saveSettings({
                  exchangesPerDay: Number(event.target.value),
                })
              }
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                <option key={count} value={String(count)}>
                  {count}
                </option>
              ))}
            </Select>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
