"use client";

import React from "react";
import { Plane } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { PlacementCard } from "./TravelDialysisSection";
import TripStatusTimeline from "./TripStatusTimeline";
import type { TripRequest } from "./trip.types";
import { reflectionRemaining } from "./travelTreatment.rules";
import { REFLECTION_MAX } from "./travelTreatment.types";
import { useTravelTreatments } from "./useTravelTreatments";
import { Card, SectionTitle, Textarea } from "@/components/ui";

/* ==========================================================================
   Travel panels
   --------------------------------------------------------------------------
   One card per idea, all of them siblings.

   What this replaces put every panel inside a single outer Card and then
   hid half of them behind an accordion, so the page was a card in a card in
   a card with the status timeline, the confirmed chair and the document list
   all one click out of sight. Two borders around the same content is not a
   hierarchy, it is a mistake the eye has to undo.

   Each panel below owns exactly one Card and takes a trip. The page arranges
   them on a grid; none of them decides where it sits.
   ========================================================================== */

/** The shared head of every panel: title and one line of purpose. */
function PanelHead({
  title,
  hint,
  action,
  id,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  id?: string;
}) {
  return <SectionTitle id={id} title={title} subtitle={hint} action={action} />;
}

/* ========================================================================== */

export function RequestStatusPanel({ trip }: { trip: TripRequest }) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  return (
    <Card as="section" aria-labelledby="request-status">
      <PanelHead
        id="request-status"
        title={isEs ? "Estado de la Solicitud" : "Travel Request Status"}
        hint={
          isEs
            ? "Sigue el progreso de tu solicitud."
            : "Track the progress of your travel request."
        }
      />
      <div className="mt-stack-md">
        <TripStatusTimeline trip={trip} />
      </div>
    </Card>
  );
}

/* ========================================================================== */

export function ConfirmedTreatmentPanel({ trip }: { trip: TripRequest }) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  return (
    /* No title: the center, how to reach it and the booked times say what
       this card is, and the trip card above already shows the status. */
    <Card
      as="section"
      aria-label={isEs ? "Detalles confirmados" : "Confirmed treatment details"}
    >
      <PlacementCard trip={trip} />
    </Card>
  );
}

/* ========================================================================== */

export function TravelReflectionsPanel({ trip }: { trip: TripRequest }) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const { reflectionFor, saveReflection } = useTravelTreatments();

  const reflection = reflectionFor(trip.id);
  const remaining = reflectionRemaining(reflection);

  return (
    /* Fills its grid row, so it stands as tall as the checklist beside
       it and the writing space takes whatever that leaves. */
    <Card
      as="section"
      aria-labelledby="travel-reflections"
      className="flex h-full flex-col"
    >
      <PanelHead
        id="travel-reflections"
        title={isEs ? "Notas y Reflexiones" : "Notes & Reflections"}
        hint={
          isEs
            ? "¿Cómo te sentiste durante tus tratamientos de viaje?"
            : "How did you feel during your travel treatments?"
        }
      />

      <Textarea
        rows={5}
        className="flex-1 resize-none"
        value={reflection}
        maxLength={REFLECTION_MAX}
        aria-label={isEs ? "Notas y reflexiones" : "Notes and reflections"}
        placeholder={
          isEs ? "Escribe tus notas aquí…" : "Write your notes here…"
        }
        onChange={(event) => saveReflection(trip.id, event.target.value)}
      />

      <p
        className={`mt-stack-xs text-right text-body-sm ${
          remaining <= 50 ? "text-warning" : "text-fg-muted"
        }`}
      >
        {reflection.length}/{REFLECTION_MAX}
      </p>
    </Card>
  );
}

/* ========================================================================== */

/** The one-line invitation above the grid, with the help link beside it. */
export function TravelIntroBar() {
  const { language } = useLanguage();
  const isEs = language === "ES";

  return (
    <div className="flex flex-wrap items-center justify-between gap-inline-md rounded-card border border-line bg-surface px-inset-md py-inset-sm">
      <p className="flex items-center gap-inline-md text-body-sm text-fg-brand">
        <Plane aria-hidden="true" className="size-4 shrink-0" />
        {isEs
          ? "Planifica con tiempo, mantente en contacto y recibe la misma atención dondequiera que vayas."
          : "Plan ahead, stay connected, and receive the same quality care wherever you go."}
      </p>

      {/* Goes to the care team, not the library. A member who needs travel
        help needs the people arranging it, and reading an article is not
        what "help" means when your chair is in another state. */}
      <Link
        href="/dashboard/team-questions"
        className="shrink-0 rounded-control-small text-label-sm text-fg-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {isEs ? "Preguntar a tu clínica" : "Ask your clinic"}
      </Link>
    </div>
  );
}
