"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Select, Tabs } from "@/components/ui";
import {
  MODALITY_OPTIONS,
  PD_SCHEDULE_OPTIONS,
  type DialysisModality,
  type PdSchedule,
} from "./modality";
import type { DialysisModalityLog } from "./useDialysisModality";

/* ==========================================================================
   Which dialysis this member is on
   --------------------------------------------------------------------------
   The same strip heads both the treatment log and the management tab, and
   switching it switches what either page asks for. In-center, home haemo
   and PD are three different treatments, not three settings of one.

   Label-only, by the client's instruction: a member picks their modality
   once, so an explanatory sentence under each tab is noise on every visit
   after the first. The full sentences still live on MODALITY_OPTIONS for
   the settings screen, where the choice is actually being made.

   Full names on a wide screen, short names below `sm` — "Peritoneal
   dialysis" cannot share a phone's width with two siblings.
   ========================================================================== */

export default function ModalityTabs({
  log,
  /**
   * Show the PD rhythm follow-ups under the strip. Only the treatment log
   * needs them; the management tab is about appointments and supplies, and
   * would just be asking the same question in a second place.
   */
  showPdRhythm = false,
  className,
}: {
  log: DialysisModalityLog;
  showPdRhythm?: boolean;
  className?: string;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const { settings, modality } = log;

  const items = MODALITY_OPTIONS.map((option) => ({
    id: option.value,
    label: (
      /* Both variants are in the DOM and CSS picks one, so both would be
         announced — "Peritoneal dialysis PD". The visible pair is hidden
         from assistive tech and the full name given once instead. */
      <>
        <span aria-hidden="true" className="hidden sm:inline">
          {isEs ? option.labelEs : option.labelEn}
        </span>
        <span aria-hidden="true" className="sm:hidden">
          {isEs ? option.shortEs : option.shortEn}
        </span>
        <span className="sr-only">
          {isEs ? option.labelEs : option.labelEn}
        </span>
      </>
    ),
  }));

  return (
    <div className={className}>
      <Tabs
        items={items}
        value={modality}
        onChange={(next) => log.setModality(next as DialysisModality)}
        label={isEs ? "Tipo de diálisis" : "Dialysis type"}
        fullWidth
      />

      {/* Only PD has a rhythm to ask about. Haemodialysis of either kind is
          already described by the weekly schedule on the management tab. */}
      {showPdRhythm && modality === "pd" ? (
        <div className="mt-stack-md grid grid-cols-1 gap-inline-md sm:grid-cols-2">
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
    </div>
  );
}
