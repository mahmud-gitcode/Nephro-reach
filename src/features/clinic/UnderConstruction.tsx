"use client";

import React from "react";
import { HardHat } from "lucide-react";
import { PageTitle } from "@/components/layout/PageTitle";
import { EmptyState } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";

/* ==========================================================================
   UnderConstruction
   --------------------------------------------------------------------------
   The clinic portal's routes exist before their screens do. Each one still
   renders its real heading and breadcrumb — so the sidebar, the active
   state and the trail can all be walked and checked now — over a single
   honest placeholder instead of a half-built screen.

   Each page is designed in its own pass; when one lands, delete its call
   here. `grep UnderConstruction` is the list of what is left.
   ========================================================================== */

export function UnderConstruction({ href }: { href: string }) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  return (
    <div className="space-y-stack-lg">
      <PageTitle href={href} />
      <EmptyState
        icon={<HardHat aria-hidden="true" />}
        title={isEs ? "En construcción" : "In construction"}
        description={
          isEs
            ? "Esta página del portal de la clínica aún no se ha diseñado."
            : "This clinic portal page has not been designed yet."
        }
      />
    </div>
  );
}

export default UnderConstruction;
