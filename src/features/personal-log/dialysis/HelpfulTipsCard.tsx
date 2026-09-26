"use client";

import React from "react";
import { Lightbulb } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Card } from "@/components/ui";
import type { DialysisModality } from "./modality";

/* ==========================================================================
   Helpful tips
   --------------------------------------------------------------------------
   Kept at the bottom of the treatment page, below the log rather than above
   it: a member opening this has come to record a session, and general
   advice that pushes the fields down the screen is advice in the way.

   Per modality, because "keep your water system clean" means nothing to a
   PD member and "keep your exit site dry" means nothing on haemo.
   ========================================================================== */

const TIPS: Record<DialysisModality, { en: string; es: string }[]> = {
  "in-center-hd": [
    {
      en: "Weigh yourself before and after every treatment.",
      es: "Pésate antes y después de cada tratamiento.",
    },
    {
      en: "Tell your nurse about cramps, dizziness or a dropping blood pressure.",
      es: "Avisa a tu enfermera si tienes calambres, mareos o baja la presión.",
    },
    {
      en: "Keep to your fluid limit between treatments.",
      es: "Respeta tu límite de líquidos entre tratamientos.",
    },
    {
      en: "Bring your medication list to every appointment.",
      es: "Lleva tu lista de medicamentos a cada cita.",
    },
  ],
  "home-hd": [
    {
      en: "Keep your treatment area clean and clear before you set up.",
      es: "Mantén tu área de tratamiento limpia y despejada antes de empezar.",
    },
    {
      en: "Check your water system and filters on schedule.",
      es: "Revisa tu sistema de agua y los filtros según el calendario.",
    },
    {
      en: "Track your supplies and reorder before you run low.",
      es: "Controla tus insumos y pide más antes de quedarte corto.",
    },
    {
      en: "Log every disinfection so the record is there when you need it.",
      es: "Registra cada desinfección para tener el historial cuando lo necesites.",
    },
    {
      en: "Call your care team if your access looks red, sore or swollen.",
      es: "Llama a tu equipo si tu acceso se ve rojo, adolorido o hinchado.",
    },
  ],
  pd: [
    {
      en: "Wash your hands and wear a mask for every exchange.",
      es: "Lávate las manos y usa mascarilla en cada intercambio.",
    },
    {
      en: "Look at your drained fluid each time — cloudy fluid needs a call today.",
      es: "Mira el líquido drenado cada vez: si está turbio, llama hoy mismo.",
    },
    {
      en: "Keep your exit site clean and dry.",
      es: "Mantén tu sitio de salida limpio y seco.",
    },
    {
      en: "Record your urine output daily, even small amounts.",
      es: "Registra tu orina a diario, aunque sea poca.",
    },
    {
      en: "Keep a spare transfer set and extra solution at home.",
      es: "Ten en casa un set de transferencia de repuesto y solución extra.",
    },
  ],
};

export default function HelpfulTipsCard({
  modality,
}: {
  modality: DialysisModality;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  return (
    <Card as="section" padding="small" tone="sunken">
      <h2 className="mb-stack-sm flex items-center gap-inline-md text-heading-5 text-fg">
        <Lightbulb aria-hidden="true" className="h-4 w-4 text-fg-brand" />
        {isEs ? "Consejos Útiles" : "Helpful Tips"}
      </h2>

      <ul className="space-y-inline-sm">
        {TIPS[modality].map((tip) => (
          <li
            key={tip.en}
            className="flex items-start gap-inline-md text-body-sm text-fg-secondary"
          >
            <span aria-hidden="true" className="mt-1.5 text-fg-brand">
              •
            </span>
            <span>{isEs ? tip.es : tip.en}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
