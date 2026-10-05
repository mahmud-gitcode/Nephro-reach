"use client";

import React from "react";
import Link from "next/link";
import { MessageSquareText, Phone, TriangleAlert } from "lucide-react";
import { buttonStyles, Card } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useClinicEnrollment } from "@/features/profile/useClinicEnrollment";
import { toTelHref } from "@/features/travel/useDialysisClinic";
import { EMERGENCY_INFORMATION } from "./beforeTheEr.topics";

/* ==========================================================================
   Before the ER — the pieces both pages share
   ========================================================================== */

/** The client's emergency text, always apart from topics and search. */
export function EmergencyInformationCard({
  isEs,
  className,
}: {
  isEs: boolean;
  className?: string;
}) {
  return (
    <Card
      as="section"
      padding="small"
      aria-labelledby="emergency-information"
      className={cn("border-danger-line bg-danger-surface", className)}
    >
      <div className="flex gap-inline-md">
        <TriangleAlert
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-danger"
        />
        <div className="space-y-stack-sm">
          <h2 id="emergency-information" className="text-heading-5 text-fg">
            {isEs
              ? EMERGENCY_INFORMATION.titleEs
              : EMERGENCY_INFORMATION.titleEn}
          </h2>
          {(isEs ? EMERGENCY_INFORMATION.es : EMERGENCY_INFORMATION.en).map(
            (paragraph) => (
              <p key={paragraph} className="text-body-sm text-fg-secondary">
                {paragraph}
              </p>
            ),
          )}
          <a href="tel:911" className={buttonStyles({ variant: "danger" })}>
            <Phone aria-hidden="true" />
            {isEs ? "Llamar al 911" : "Call 911"}
          </a>
        </div>
      </div>
    </Card>
  );
}

/**
 * The same button on every topic. Messages when the member's clinic is on
 * NephroReach (someone there reads them); the clinic's phone either way.
 */
export function ContactClinic({ isEs }: { isEs: boolean }) {
  const { enrolled, clinic, ready } = useClinicEnrollment();
  if (!ready) return null;
  const phone = clinic?.phone.trim();

  return (
    <div className="space-y-stack-sm">
      <div className="flex flex-wrap gap-inline-sm">
        {enrolled ? (
          <Link href="/dashboard/messages" className={buttonStyles({})}>
            <MessageSquareText aria-hidden="true" />
            {isEs
              ? "Contactar a mi Clínica de Diálisis"
              : "Contact My Dialysis Clinic"}
          </Link>
        ) : null}
        {phone ? (
          <a
            href={toTelHref(phone)}
            className={buttonStyles(
              enrolled ? { variant: "neutral", appearance: "fill-stroke" } : {},
            )}
          >
            <Phone aria-hidden="true" />
            {enrolled
              ? `${isEs ? "Llamar" : "Call"} ${phone}`
              : isEs
                ? "Contactar a mi Clínica de Diálisis"
                : "Contact My Dialysis Clinic"}
          </a>
        ) : null}
        {!enrolled && !phone ? (
          <Link
            href="/dashboard/settings"
            className={buttonStyles({
              variant: "neutral",
              appearance: "fill-stroke",
            })}
          >
            {isEs ? "Agregar mi clínica de diálisis" : "Add my dialysis clinic"}
          </Link>
        ) : null}
      </div>
      <p className="text-caption text-fg-muted">
        {isEs
          ? "No use los mensajes de NephroReach para pedir ayuda en una emergencia."
          : "Do not use NephroReach messaging for emergency assistance."}
      </p>
    </div>
  );
}
