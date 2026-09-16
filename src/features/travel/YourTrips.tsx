"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, Pencil, Plane, Plus, Trash2 } from "lucide-react";
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
import { Badge, Button, Card, EmptyState, Select } from "@/components/ui";

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

function TripTile({
  trip,
  onEdit,
  onCancel,
}: {
  trip: TripRequest;
  onEdit: () => void;
  onCancel: () => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const phase = tripPhase(trip);

  /* Where the member is in this trip, which is a different question from
     whether the clinic has booked it — that is what the badge answers. */
  const where =
    phase === "away"
      ? isEs
        ? "De viaje ahora"
        : "Away now"
      : phase === "home"
        ? isEs
          ? "Terminado"
          : "Finished"
        : isEs
          ? "Próximo"
          : "Coming up";

  return (
    <div className="flex h-full flex-col rounded-card border border-line bg-surface transition-shadow duration-150 ease-standard focus-within:shadow-raised hover:shadow-raised">
      <Link
        href={`/dashboard/travel-log/${trip.id}`}
        className="flex flex-1 flex-col gap-stack-xs rounded-card p-inset-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex items-start justify-between gap-inline-md">
          <span className="min-w-0 truncate text-label-md text-fg">
            {destinationLabel(trip) ||
              (isEs ? "Sin destino" : "No destination")}
          </span>
          <ChevronRight
            aria-hidden="true"
            className="size-4 shrink-0 text-fg-subtle"
          />
        </span>

        <span className="block text-body-sm text-fg-muted">
          {formatTripDates(trip, isEs)}
        </span>
        <span className="block text-body-sm text-fg-muted">{where}</span>

        <span className="mt-auto pt-stack-xs">
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

      {/* Kept out of the link so a press lands on the button it looks like,
        and only offered while the answer is still a form rather than a
        phone call. */}
      {isEditable(trip) || phase !== "home" ? (
        <div className="flex items-center justify-end gap-inline-sm border-t border-line px-inset-sm py-stack-xs">
          {isEditable(trip) ? (
            <Button
              size="small"
              variant="neutral"
              appearance="fill-stroke"
              onClick={onEdit}
            >
              <Pencil aria-hidden="true" className="size-4 shrink-0" />
              {isEs ? "Editar" : "Edit"}
            </Button>
          ) : null}
          {phase === "home" ? null : (
            <Button
              size="small"
              variant="danger"
              appearance="stroke"
              onClick={onCancel}
              aria-label={isEs ? "Cancelar viaje" : "Cancel trip"}
            >
              <Trash2 aria-hidden="true" className="size-4 shrink-0" />
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function YourTrips({
  trips,
  onRequest,
  onEdit,
  onCancel,
}: {
  trips: TripRequest[];
  onRequest: () => void;
  onEdit: (trip: TripRequest) => void;
  onCancel: (trip: TripRequest) => void;
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
    <Card as="section" aria-labelledby="your-trips">
      <div className="flex flex-wrap items-start justify-between gap-inline-md">
        <div className="flex items-start gap-inline-md">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card border border-primary-soft-line bg-primary-soft text-fg-brand"
          >
            <Plane className="h-5 w-5" />
          </span>
          <div>
            <h2 id="your-trips" className="text-heading-5 text-fg">
              {isEs ? "Tus viajes" : "Your trips"}
            </h2>
            <p className="mt-stack-xs text-body-sm text-fg-muted">
              {trips.length > 0
                ? isEs
                  ? "Abre un viaje para ver sus detalles."
                  : "Open a trip to see its details."
                : isEs
                  ? "Pide tus tratamientos fuera de casa. Tu clínica los coordina."
                  : "Ask for treatments away from home. Your clinic arranges them."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-inline-md">
          {/* Only once there is enough to narrow. A filter over two trips is
            a control that cannot help. */}
          {trips.length > 2 ? (
            <Select
              value={filter}
              onChange={(event) => setChosen(event.target.value as TripFilter)}
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
      </div>

      {trips.length === 0 ? (
        /* The explanation belongs here on an empty log, where it is the only
           thing to read, rather than in a panel of its own that stays on
           screen forever once it has been understood. */
        <p className="mt-stack-md measure text-body-sm text-fg-secondary">
          {isEs
            ? "Cuando planees un viaje, envía una solicitud a tu centro de diálisis. Ellos coordinarán tu tratamiento en un centro local y te enviarán la confirmación. Avisa con cuatro semanas si puedes."
            : "When you plan a trip, submit a request to your dialysis facility. They will coordinate your treatment at a local center and send you a confirmation. Give them four weeks if you can."}
        </p>
      ) : shown.length === 0 ? (
        <div className="mt-stack-md">
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
        <div className="mt-stack-md grid grid-cols-1 gap-inset-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((trip) => (
            <TripTile
              key={trip.id}
              trip={trip}
              onEdit={() => onEdit(trip)}
              onCancel={() => onCancel(trip)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

export default YourTrips;
