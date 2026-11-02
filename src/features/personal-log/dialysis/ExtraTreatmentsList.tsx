"use client";

import React from "react";
import { CalendarPlus, Trash2 } from "lucide-react";
import { Alert, Button, Card, EmptyState, SectionTitle } from "@/components/ui";
import { saveErrorText } from "@/features/profile/saveError";
import { formatFullDate, fromDateKey } from "./schedule";
import type { useExtraTreatments } from "./useExtraTreatments";

/* ==========================================================================
   Extra (unscheduled) treatments: the list (Phase 7)
   --------------------------------------------------------------------------
   The Take Extra Treatment form existed with nowhere to see what it saved
   (the sessions were page state). They are on the server now: listed here,
   newest window around today, added through the existing form and removed
   one at a time. The server has no edit, so there is none here either.
   ========================================================================== */

const REASON_ES: Record<string, string> = {
  "Fluid Overload": "Exceso de líquido",
  "High Potassium": "Potasio alto",
  "Doctor Order": "Orden médica",
  "Missed Session": "Sesión perdida",
};

export function ExtraTreatmentsList({
  log,
  onAdd,
  isEs,
}: {
  log: ReturnType<typeof useExtraTreatments>;
  onAdd: () => void;
  isEs: boolean;
}) {
  return (
    <Card as="section" padding="small">
      <SectionTitle
        title={isEs ? "Tratamientos extra" : "Extra Treatments"}
        action={
          <Button size="small" onClick={onAdd} disabled={log.isSaving}>
            <CalendarPlus aria-hidden="true" />
            {isEs ? "Tomar tratamiento extra" : "Take extra treatment"}
          </Button>
        }
      />

      {log.saveError ? (
        <Alert
          tone="danger"
          className="mb-stack-md"
          onDismiss={log.dismissSaveError}
        >
          {saveErrorText(log.saveError, isEs ? "es" : "en")}
        </Alert>
      ) : null}

      {log.extras.length === 0 ? (
        <EmptyState
          title={isEs ? "Sin tratamientos extra" : "No extra treatments"}
          description={
            isEs
              ? "Una sesión fuera de tu horario aparece aquí."
              : "A session outside your schedule shows here."
          }
        />
      ) : (
        <ul className="space-y-stack-sm">
          {log.extras.map((extra) => {
            const when = formatFullDate(fromDateKey(extra.dateKey), isEs);
            const reason = isEs
              ? (REASON_ES[extra.reason] ?? extra.reason)
              : extra.reason;
            return (
              <li
                key={extra.id}
                className="flex items-start justify-between gap-inline-md rounded-card-nested border border-line bg-surface p-inset-sm"
              >
                <div className="min-w-0">
                  <p className="text-label-md text-fg">{when}</p>
                  <p className="text-body-sm text-fg-secondary">{reason}</p>
                  {extra.notes ? (
                    <p className="text-body-sm text-fg-muted">{extra.notes}</p>
                  ) : null}
                </div>
                <Button
                  size="small"
                  variant="danger"
                  appearance="stroke"
                  iconOnly
                  disabled={log.isSaving}
                  onClick={() => log.remove(extra.id)}
                  aria-label={
                    isEs
                      ? `Eliminar el tratamiento extra del ${when}`
                      : `Delete the extra treatment on ${when}`
                  }
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {log.hasMore ? (
        <Button
          size="small"
          variant="neutral"
          appearance="ghost"
          className="mt-stack-sm"
          onClick={log.loadMore}
        >
          {isEs ? "Ver más" : "Show more"}
        </Button>
      ) : null}
    </Card>
  );
}

export default ExtraTreatmentsList;
