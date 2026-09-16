"use client";

import React from "react";
import { ClipboardCheck, Lock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  checklistProgress,
  travelChecklist,
  toggleDocument,
  togglePrep,
} from "./trip.rules";
import type {
  TravelDocumentKey,
  TravelPrepKey,
  TripRequest,
} from "./trip.types";
import { Badge, Card } from "@/components/ui";

/* ==========================================================================
   Travel Checklist
   --------------------------------------------------------------------------
   Everything that has to be true before a member gets on a plane, in one
   list, drawn from the places that already know the answer rather than a
   fourth copy of it: the placement says whether a chair exists, the request
   says which documents are ready, and the prep flags carry the rest.

   The facility row is the one a member cannot tick. A chair at the other end
   is arranged by the coordinating unit, and a checkbox that let someone mark
   their own placement done would be the app telling them they have a bed
   waiting when nobody has booked one.
   ========================================================================== */

export function TravelChecklist({
  trip,
  onToggleDocument,
  onTogglePrep,
}: {
  trip: TripRequest;
  onToggleDocument: (next: TravelDocumentKey[]) => void;
  onTogglePrep: (next: TravelPrepKey[]) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const items = travelChecklist(trip);
  const progress = checklistProgress(trip);

  return (
    <Card as="section" aria-labelledby="travel-checklist">
      <div className="flex flex-wrap items-start justify-between gap-inline-md">
        <div className="flex items-start gap-inline-md">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card border border-primary-soft-line bg-primary-soft text-fg-brand"
          >
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <div>
            <h3 id="travel-checklist" className="text-heading-5 text-fg">
              {isEs ? "Lista de Viaje" : "Travel Checklist"}
            </h3>
            <p className="mt-stack-xs text-body-sm text-fg-muted">
              {isEs
                ? "Asegúrate de estar listo antes de salir."
                : "Make sure you're ready before you go."}
            </p>
          </div>
        </div>

        <Badge tone={progress.complete ? "success" : "neutral"}>
          {isEs
            ? `${progress.done} de ${progress.total} completo`
            : `${progress.done} of ${progress.total} Complete`}
        </Badge>
      </div>

      {/* One column: each row is now two lines, and a two-column grid of
        wrapped rows is harder to scan than a single list. */}
      <ul className="mt-stack-md space-y-stack-xs">
        {items.map((item) => {
          const label = isEs ? item.labelEs : item.labelEn;
          const hint = isEs ? item.hintEs : item.hintEn;

          /* Not a disabled checkbox: a greyed-out box still reads as "you
             forgot this one". A padlock says who it belongs to. */
          if (!item.memberControlled) {
            return (
              <li
                key={item.id}
                className="flex items-start gap-inline-md py-stack-xs"
              >
                <Lock
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-fg-subtle"
                />
                <span className="min-w-0">
                  <span
                    className={`text-body-sm ${
                      item.done
                        ? "text-fg-secondary line-through"
                        : "text-fg-secondary"
                    }`}
                  >
                    {label}
                  </span>
                  <span className="block text-caption text-fg-muted">
                    {item.done
                      ? isEs
                        ? "Confirmado por tu clínica"
                        : "Confirmed by your clinic"
                      : isEs
                        ? "Lo organiza tu clínica"
                        : "Your clinic arranges this"}
                  </span>
                </span>
              </li>
            );
          }

          return (
            <li key={item.id}>
              <label className="flex cursor-pointer items-start gap-inline-md rounded-control-small py-stack-xs transition-colors duration-150 ease-standard hover:bg-surface-sunken">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() =>
                    item.kind === "document"
                      ? onToggleDocument(
                          toggleDocument(
                            trip.documentsReady,
                            item.id as TravelDocumentKey,
                          ),
                        )
                      : onTogglePrep(
                          togglePrep(trip.prepDone, item.id as TravelPrepKey),
                        )
                  }
                  className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--color-primary-solid)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                />
                <span className="min-w-0">
                  <span
                    className={`block text-body-sm ${
                      item.done
                        ? "text-fg-muted line-through"
                        : "text-fg-secondary"
                    }`}
                  >
                    {label}
                  </span>
                  {/* What it is and who usually sends it. A member has no way
                    to know that their unit posts the orders for them. */}
                  {hint ? (
                    <span className="block text-caption text-fg-muted">
                      {hint}
                    </span>
                  ) : null}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default TravelChecklist;
