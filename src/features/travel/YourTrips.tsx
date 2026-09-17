"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, Pencil, Plane, Plus } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  defaultTripFilter,
  destinationLabel,
  filterTrips,
  formatTripDates,
  isEditable,
  statusLabel,
  tripFilterCounts,
  tripPhase,
} from "./trip.rules";
import type { TripFilter } from "./trip.rules";
import type { TripRequest } from "./trip.types";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  SectionTitle,
  Select,
} from "@/components/ui";

/* ==========================================================================
   Your trips
   --------------------------------------------------------------------------
   The whole of the travel page's first screen: ask for a trip, narrow the
   list, and open one.

   A card is a link, not a selection. Everything there is to say about a trip
   — its checklist, its documents, where the request has got to, what was
   booked, what happened in the chair — fills a screen on its own, and hanging
   all of it under a list meant a member picked a card and watched a page they
   were not looking at rewrite itself. One trip, one page.

   Four across at the widest, because a fifth column leaves each card too
   narrow for a destination and a date range to sit on their own lines.
   ========================================================================== */

function TripTile({ trip, onEdit }: { trip: TripRequest; onEdit: () => void }) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const phase = tripPhase(trip);

  return (
    /* Same gradient as the dialysis schedule's day slots. */
    <div className="flex h-full min-h-[160px] flex-col rounded-card border border-line bg-gradient-to-r from-primary-soft via-surface to-surface p-inset-lg shadow-card transition-all duration-150 ease-standard focus-within:shadow-raised hover:border-line-strong hover:shadow-raised">
      <Link
        href={`/dashboard/travel-log/${trip.id}`}
        className="flex flex-1 flex-col gap-stack-xs rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex items-start justify-between gap-inline-md">
          <span className="min-w-0 text-heading-4 text-fg">
            {destinationLabel(trip) ||
              (isEs ? "Sin destino" : "No destination")}
          </span>
          <ChevronRight
            aria-hidden="true"
            className="mt-1.5 size-5 shrink-0 text-fg-subtle"
          />
        </span>

        <span className="block text-body-md text-fg-secondary">
          {formatTripDates(trip, isEs)}
        </span>

        <span className="mt-auto pt-stack-sm">
          <Badge
            tone={
              trip.status === "confirmed"
                ? "success"
                : phase === "home"
                  ? "neutral"
                  : "info"
            }
          >
            {statusLabel(trip.status, isEs)}
          </Badge>
        </span>
      </Link>

      {/* Kept out of the link so a press lands on the button it looks like.
        Cancelling lives on the trip's own page, behind a confirmation. */}
      {isEditable(trip) ? (
        <div className="mt-stack-sm">
          <Button
            size="small"
            variant="neutral"
            appearance="fill-stroke"
            onClick={onEdit}
          >
            <Pencil aria-hidden="true" className="size-4 shrink-0" />
            {isEs ? "Editar" : "Edit"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function YourTrips({
  trips,
  onRequest,
  onEdit,
}: {
  trips: TripRequest[];
  onRequest: () => void;
  onEdit: (trip: TripRequest) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  /* `null` until the member chooses, so the list can open on whatever is
     most useful without ever overriding a choice they made. */
  const [chosen, setChosen] = useState<TripFilter | null>(null);
  const filter = chosen ?? defaultTripFilter(trips);

  const counts = tripFilterCounts(trips);
  const shown = filterTrips(trips, filter);

  const OPTIONS: { value: TripFilter; labelEn: string; labelEs: string }[] = [
    { value: "all", labelEn: "All", labelEs: "Todos" },
    { value: "in-progress", labelEn: "In progress", labelEs: "En curso" },
    { value: "previous", labelEn: "Previous trips", labelEs: "Anteriores" },
  ];

  return (
    /* One card for the whole section; each trip is its own card inside. */
    <Card
      as="section"
      aria-labelledby="your-trips"
      className="space-y-stack-md"
    >
      <SectionTitle
        id="your-trips"
        title={isEs ? "Tus viajes" : "Your trips"}
        subtitle={
          trips.length === 0
            ? isEs
              ? "Pide tus tratamientos fuera de casa. Tu clínica los coordina."
              : "Ask for treatments away from home. Your clinic arranges them."
            : undefined
        }
        action={
          <div className="flex flex-wrap items-center gap-inline-md">
            {/* Only once there is enough to narrow. A filter over two trips is
                a control that cannot help. */}
            {trips.length > 2 ? (
              <Select
                value={filter}
                onChange={(event) =>
                  setChosen(event.target.value as TripFilter)
                }
                aria-label={isEs ? "Filtrar viajes" : "Filter trips"}
                className="sm:w-[200px]"
              >
                {OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {`${isEs ? option.labelEs : option.labelEn} (${counts[option.value]})`}
                  </option>
                ))}
              </Select>
            ) : null}

            <Button onClick={onRequest}>
              <Plus aria-hidden="true" className="size-4 shrink-0" />
              {isEs ? "Solicitar un viaje" : "Request a Trip"}
            </Button>
          </div>
        }
      />

      {trips.length === 0 ? (
        /* The explanation belongs here on an empty log, where it is the only
           thing to read, rather than in a panel of its own that stays on
           screen forever once it has been understood. */
        <p className="text-body-sm text-fg-secondary">
          {isEs
            ? "Cuando planees un viaje, envía una solicitud a tu centro de diálisis. Ellos coordinarán tu tratamiento en un centro local y te enviarán la confirmación. Avisa con cuatro semanas si puedes."
            : "When you plan a trip, submit a request to your dialysis facility. They will coordinate your treatment at a local center and send you a confirmation. Give them four weeks if you can."}
        </p>
      ) : shown.length === 0 ? (
        <div>
          <EmptyState
            icon={<Plane aria-hidden="true" />}
            title={
              filter === "previous"
                ? isEs
                  ? "Aún no hay viajes anteriores"
                  : "No previous trips yet"
                : isEs
                  ? "No tienes viajes en curso"
                  : "No trips in progress"
            }
            description={
              isEs
                ? "Cambia el filtro para ver los demás."
                : "Change the filter to see the others."
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((trip) => (
            <TripTile key={trip.id} trip={trip} onEdit={() => onEdit(trip)} />
          ))}
        </div>
      )}
    </Card>
  );
}

export default YourTrips;
