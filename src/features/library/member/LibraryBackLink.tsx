"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonStyles } from "@/components/ui";

/* ==========================================================================
   The way back from the Library
   --------------------------------------------------------------------------
   The client (2026-10-12): a member who opens the Library from My Labs, or
   a resource from Nutrition, needs a way back to where they were. The page
   that links in adds ?from=…; anything else falls back to the default.
   ========================================================================== */

export const LIBRARY_BACK_TO: Record<
  string,
  { href: string; en: string; es: string }
> = {
  labs: {
    href: "/dashboard/personal-log/lab-tracking",
    en: "Back to My Labs",
    es: "Volver a Mis Laboratorios",
  },
  nutrition: {
    href: "/dashboard/personal-log/nutrition",
    en: "Back to Nutrition",
    es: "Volver a Nutrición",
  },
};

const linkClass = buttonStyles({
  size: "small",
  variant: "neutral",
  appearance: "fill-stroke",
});

function BackLink({
  isEs,
  fallback,
}: {
  isEs: boolean;
  fallback?: { href: string; en: string; es: string };
}) {
  const from = useSearchParams().get("from") ?? "";
  const target = LIBRARY_BACK_TO[from] ?? fallback;
  if (!target) return null;
  return (
    <Link href={target.href} className={linkClass}>
      <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
      {isEs ? target.es : target.en}
    </Link>
  );
}

export function LibraryBackLink({
  isEs,
  fallback,
}: {
  isEs: boolean;
  /** Shown when the page was not opened from another page. */
  fallback?: { href: string; en: string; es: string };
}) {
  return (
    <Suspense fallback={null}>
      <BackLink isEs={isEs} fallback={fallback} />
    </Suspense>
  );
}
