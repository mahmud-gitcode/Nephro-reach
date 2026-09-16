"use client";

import React from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

/* ==========================================================================
   Travel Dialysis Log — masthead
   --------------------------------------------------------------------------
   The artwork already carries the name, the promise and the four words of
   the journey, so it stands in for the heading rather than sitting above a
   second copy of the same words: the `h1` wraps it and the alt text is the
   heading.

   It is an English asset with its wording baked into the pixels. Spanish
   readers get that wording back as text underneath rather than a headline
   they cannot read.
   ========================================================================== */

/** Intrinsic size of `travelbanner.png`, so the space is reserved exactly. */
const BANNER_WIDTH = 1536;
const BANNER_HEIGHT = 365;

export function TravelBanner() {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const steps = isEs
    ? ["Planifica", "Conecta", "Viaja", "Mantén el rumbo"]
    : null;

  return (
    <section className="overflow-hidden rounded-card border border-primary-soft-line">
      <h1 className="m-0">
        {/* Intrinsic width and height rather than `fill`: the browser
          reserves the exact space before the bytes arrive, and nothing
          depends on a parent resolving a height. */}
        <Image
          src="/images/Travel/travelbanner.png"
          alt={
            isEs
              ? "Registro de Diálisis en Viaje. La misma atención. Más posibilidades. Planifica, conecta, viaja y mantén el rumbo."
              : "Travel Dialysis Log. Same Care. More Possibilities. Plan, Connect, Travel, Stay on Track."
          }
          width={BANNER_WIDTH}
          height={BANNER_HEIGHT}
          /* Top of the page and above the fold, so it is not lazy. */
          priority
          sizes="100vw"
          className="block h-auto w-full"
        />
      </h1>

      {/* Only for Spanish: the artwork says all of this already in English,
        and repeating it there would be the same line twice. */}
      {steps ? (
        <div className="border-t border-line bg-surface px-inset-md py-inset-sm">
          <p className="text-body-sm text-fg-secondary">
            La misma atención. Más posibilidades.
          </p>
          <p className="mt-stack-xs text-label-md text-fg-brand">
            {steps.join(" · ")}
          </p>
        </div>
      ) : null}
    </section>
  );
}

export default TravelBanner;
