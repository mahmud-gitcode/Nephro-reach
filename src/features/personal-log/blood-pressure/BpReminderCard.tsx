"use client";

import React, { useState } from "react";
import { Bell, Plus, X } from "lucide-react";
import { Alert, Button, Card, Input } from "@/components/ui";
import { useBpReminders } from "./useBpReminders";

/* ==========================================================================
   Blood pressure check reminders — the times the member picks
   --------------------------------------------------------------------------
   When one passes, the notification bell asks them to check and log, until
   a reading is logged (bpReminders.ts).
   ========================================================================== */

export function BpReminderCard({ isEs }: { isEs: boolean }) {
  const { times, isPending, save, isSaving, saveError } = useBpReminders();
  const [draft, setDraft] = useState<string[] | null>(null);
  const editing = draft !== null;
  const shown = draft ?? times;

  return (
    <Card as="section" padding="small" className="space-y-stack-md">
      <div className="flex flex-wrap items-center justify-between gap-inline-md">
        <div className="flex items-center gap-inline-sm">
          <Bell aria-hidden="true" className="size-5 text-fg-brand" />
          <h2 className="text-heading-4 text-fg">
            {isEs ? "Recordatorios de Presión" : "Check Reminders"}
          </h2>
        </div>
        {!editing ? (
          <Button
            size="small"
            variant="neutral"
            appearance="fill-stroke"
            disabled={isPending}
            onClick={() => setDraft(times.length > 0 ? times : ["08:00"])}
          >
            {times.length > 0
              ? isEs
                ? "Editar"
                : "Edit"
              : isEs
                ? "Agregar recordatorio"
                : "Add reminder"}
          </Button>
        ) : null}
      </div>

      {saveError ? (
        <Alert tone="danger">
          {isEs ? "No se guardó." : "That did not save."}
        </Alert>
      ) : null}

      {!editing ? (
        <p className="text-body-sm text-fg-secondary">
          {times.length > 0
            ? `${isEs ? "Le recordamos revisar y registrar su presión a las" : "We remind you to check and log your blood pressure at"} ${times.join(", ")}.`
            : isEs
              ? "Sin recordatorios. Agregue las horas en que revisa su presión."
              : "No reminders yet. Add the times you check your blood pressure."}
        </p>
      ) : (
        <div className="space-y-stack-sm">
          {shown.map((time, index) => (
            <div key={index} className="flex items-center gap-inline-sm">
              <Input
                type="time"
                value={time}
                aria-label={
                  isEs
                    ? `Hora del recordatorio ${index + 1}`
                    : `Reminder time ${index + 1}`
                }
                onChange={(e) =>
                  setDraft(
                    shown.map((t, i) => (i === index ? e.target.value : t)),
                  )
                }
                className="flex-1"
              />
              <Button
                variant="neutral"
                appearance="ghost"
                iconOnly
                aria-label={
                  isEs ? `Quitar hora ${index + 1}` : `Remove time ${index + 1}`
                }
                onClick={() => setDraft(shown.filter((_, i) => i !== index))}
              >
                <X />
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap gap-inline-sm">
            <Button
              size="small"
              variant="neutral"
              appearance="ghost"
              leadingIcon={<Plus aria-hidden="true" />}
              onClick={() => setDraft([...shown, "20:00"])}
            >
              {isEs ? "Agregar otra hora" : "Add another time"}
            </Button>
            <span className="ml-auto flex gap-inline-sm">
              <Button
                size="small"
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setDraft(null)}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                size="small"
                loading={isSaving}
                onClick={() => {
                  save(shown);
                  setDraft(null);
                }}
              >
                {isEs ? "Guardar" : "Save"}
              </Button>
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
