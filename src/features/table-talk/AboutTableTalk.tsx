"use client";

import React from "react";
import { Mic } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Card } from "@/components/ui";

/* ==========================================================================
   About Dialysis Table Talk
   --------------------------------------------------------------------------
   What the series is, for the member who arrived without being told.

   It sits above the shelf rather than below it because the question it
   answers — "whose voices are these, and can I trust them" — is the one a
   member asks before they spend twelve minutes on a video, not after.
   ========================================================================== */

export function AboutTableTalk() {
  const { language } = useLanguage();
  const isEs = language === "ES";

  return (
    <Card as="section" aria-labelledby="about-table-talk">
      <div className="flex flex-col gap-inline-md">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card border border-primary-soft-line bg-primary-soft text-fg-brand"
        >
          <Mic className="h-5 w-5" />
        </span>

        <div className="min-w-0 space-y-stack-sm">
          <h2 id="about-table-talk" className="text-heading-5 text-fg">
            {isEs ? "Sobre Dialysis Table Talk" : "About Dialysis Table Talk"}
          </h2>

          <p className="text-justify text-body-sm text-fg-secondary">
            {isEs
              ? "Conversaciones cortas, reales y honestas sobre la vida con enfermedad renal. Escucha a proveedores, dietistas, trabajadores sociales, pacientes y cuidadores hablar de los temas que más te importan."
              : "Short, real, and honest conversations about life with kidney disease. Hear from providers, dietitians, social workers, patients, and caregivers on the topics that matter most to you."}
          </p>

          {/* The promise of the series, set apart so it reads as a statement
            rather than the last sentence of a paragraph. */}
          <p className="border-l-2 border-danger-line pl-inset-sm text-label-md text-fg">
            {isEs
              ? "Voces distintas. La misma meta. Un mañana más sano y brillante."
              : "Different voices. Same goal. A healthier, brighter tomorrow."}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default AboutTableTalk;
