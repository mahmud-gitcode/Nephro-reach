"use client";

import React from "react";
import {
  ClipboardList,
  FileText,
  History,
  MapPin,
  NotebookPen,
  Plane,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { PlacementCard } from "./TravelDialysisSection";
import TripStatusTimeline from "./TripStatusTimeline";
import { formatTripDates, isConfirmed } from "./trip.rules";
import type { TripRequest } from "./trip.types";
import { reflectionRemaining } from "./travelTreatment.rules";
import { REFLECTION_MAX } from "./travelTreatment.types";
import { useTravelTreatments } from "./useTravelTreatments";
import { Badge, Card, EmptyState, Textarea } from "@/components/ui";

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

/** The shared head of every panel: icon tile, title, one line of purpose. */
function PanelHead({
  icon,
  title,
  hint,
  action,
  id,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-inline-md">
      <div className="flex items-start gap-inline-md">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card border border-primary-soft-line bg-primary-soft text-fg-brand"
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h2 id={id} className="text-heading-5 text-fg">
            {title}
          </h2>
          {hint ? (
            <p className="mt-stack-xs text-body-sm text-fg-muted">{hint}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ========================================================================== */

export function RequestStatusPanel({ trip }: { trip: TripRequest }) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  return (
    <Card as="section" aria-labelledby="request-status">
      <PanelHead
        id="request-status"
        icon={<ClipboardList className="h-5 w-5" />}
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
    <Card as="section" aria-labelledby="confirmed-treatment">
      <PanelHead
        id="confirmed-treatment"
        icon={<FileText className="h-5 w-5" />}
        title={isEs ? "Detalles Confirmados" : "Confirmed Treatment Details"}
        action={
          <Badge tone={isConfirmed(trip) ? "success" : "neutral"}>
            {isConfirmed(trip)
              ? isEs
                ? "Confirmado"
                : "Confirmed"
              : isEs
                ? "Pendiente"
                : "Pending"}
          </Badge>
        }
      />
      <div className="mt-stack-md">
        <PlacementCard trip={trip} />
      </div>
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
    <Card as="section" aria-labelledby="travel-reflections">
      <PanelHead
        id="travel-reflections"
        icon={<NotebookPen className="h-5 w-5" />}
        title={isEs ? "Notas y Reflexiones" : "Notes & Reflections"}
        hint={
          isEs
            ? "¿Cómo te sentiste durante tus tratamientos de viaje?"
            : "How did you feel during your travel treatments?"
        }
      />

      <Textarea
        rows={5}
        className="mt-stack-md"
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

/** Where they have been, as a list rather than a stack of full trip cards. */
export function PastTravelPanel({ trips }: { trips: TripRequest[] }) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  return (
    <Card as="section" aria-labelledby="past-travel">
      <PanelHead
        id="past-travel"
        icon={<History className="h-5 w-5" />}
        title={isEs ? "Viajes Anteriores" : "Past Travel Treatments"}
        hint={
          isEs
            ? "Consulta tu historial de diálisis en viaje."
            : "View your previous travel dialysis history."
        }
      />

      {trips.length === 0 ? (
        <div className="mt-stack-md">
          <EmptyState
            icon={<History aria-hidden="true" />}
            title={isEs ? "Aún no hay historial" : "No past trips yet"}
            description={
              isEs
                ? "Cuando vuelvas de un viaje, aparecerá aquí."
                : "Once you are home from a trip, it appears here."
            }
          />
        </div>
      ) : (
        <ul className="mt-stack-md divide-y divide-line">
          {trips.map((trip) => (
            <li
              key={trip.id}
              className="flex items-center gap-inline-md py-stack-sm"
            >
              <MapPin
                aria-hidden="true"
                className="size-4 shrink-0 text-fg-subtle"
              />
              <span className="min-w-0 flex-1 truncate text-body-sm text-fg">
                {trip.destination || (isEs ? "Sin destino" : "No destination")}
              </span>
              <span className="shrink-0 text-body-sm text-fg-muted">
                {formatTripDates(trip, isEs)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ========================================================================== */

/** The one-line invitation above the grid, with the help link beside it. */
export function TravelIntroBar() {
  const { language } = useLanguage();
  const isEs = language === "ES";

  return (
    <div className="flex flex-wrap items-center justify-between gap-inline-md rounded-card border border-primary-soft-line bg-primary-soft px-inset-md py-inset-sm">
      <p className="flex items-center gap-inline-md text-body-sm text-fg-brand">
        <Plane aria-hidden="true" className="size-4 shrink-0" />
        {isEs
          ? "Planifica con tiempo, mantente en contacto y recibe la misma atención dondequiera que vayas."
          : "Plan ahead, stay connected, and receive the same quality care wherever you go."}
      </p>

      {/* Points at the library rather than inventing a page that is not
        built: a button that goes nowhere is worse than no button. */}
      <Link
        href="/dashboard/my-library"
        className="shrink-0 rounded-control-small text-label-sm text-fg-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {isEs ? "Ayuda de viaje" : "Travel Help"}
      </Link>
    </div>
  );
}
