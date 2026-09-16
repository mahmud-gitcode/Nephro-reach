"use client";

import React, { useState } from "react";
import { CircleAlert, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  TIME_PREFERENCES,
  WEEKDAYS,
  canSubmitTimeChange,
  emptyTimeChange,
  formatDateLabel,
  timeChangeError,
  toggleDay,
} from "./trip.rules";
import type { TimeChangeRequest, TripRequest, Weekday } from "./trip.types";
import {
  Alert,
  Button,
  Chip,
  ChipGroup,
  FormField,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";

/* ==========================================================================
   Asking to move the booked times
   --------------------------------------------------------------------------
   The form behind "Request a time change".

   It opens with what the unit has actually booked in front of the member,
   because "move my treatments" means nothing until you can see what you are
   moving, and half the reasons for asking disappear once somebody re-reads
   the times they were given.
   ========================================================================== */

export function TimeChangeRequestModal({
  trip,
  onSubmit,
  onCancel,
  saving,
}: {
  trip: TripRequest;
  onSubmit: (request: TimeChangeRequest) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [draft, setDraft] = useState<TimeChangeRequest>(() =>
    emptyTimeChange(trip),
  );
  const [submitted, setSubmitted] = useState(false);

  const set = (patch: Partial<TimeChangeRequest>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const error = timeChangeError(draft);

  const send = () => {
    setSubmitted(true);
    if (!canSubmitTimeChange(draft)) return;
    onSubmit(draft);
  };

  return (
    <Modal
      open
      size="wide"
      onClose={onCancel}
      title={isEs ? "Pedir otro horario" : "Request a time change"}
      description={
        isEs
          ? "Tu clínica coordina el cambio con el centro que te recibe. Nada se mueve hasta que ellos confirmen."
          : "Your clinic arranges this with the unit receiving you. Nothing moves until they confirm it."
      }
      footer={
        <div className="flex flex-wrap items-center justify-end gap-inline-md">
          <Button variant="neutral" appearance="fill-stroke" onClick={onCancel}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button onClick={send} disabled={saving}>
            {saving
              ? isEs
                ? "Enviando…"
                : "Sending…"
              : isEs
                ? "Enviar solicitud"
                : "Send request"}
          </Button>
        </div>
      }
    >
      <div className="space-y-stack-lg">
        {/* What is booked now, so the ask is made against something real. */}
        {trip.placement?.treatments.length ? (
          <section className="rounded-card border border-line bg-surface-sunken p-inset-sm">
            <p className="text-label-md text-fg">
              {isEs ? "Lo que tienes reservado" : "What you have booked"}
            </p>
            <ul className="mt-stack-xs space-y-stack-xs">
              {trip.placement.treatments.map((treatment) => (
                <li
                  key={treatment.id}
                  className="flex items-center gap-inline-md text-body-sm text-fg-secondary"
                >
                  <Clock
                    aria-hidden="true"
                    className="size-4 shrink-0 text-fg-subtle"
                  />
                  {formatDateLabel(treatment.date, isEs)} · {treatment.time}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <FormField
          label={
            isEs
              ? "¿Qué horario te vendría mejor?"
              : "What time would suit you better?"
          }
        >
          {(props) => (
            <Select
              {...props}
              value={draft.preferredTime}
              onChange={(event) =>
                set({
                  preferredTime: event.target
                    .value as TimeChangeRequest["preferredTime"],
                })
              }
            >
              {TIME_PREFERENCES.map((option) => (
                <option key={option.value} value={option.value}>
                  {isEs ? option.labelEs : option.labelEn}
                </option>
              ))}
            </Select>
          )}
        </FormField>

        <FormField
          label={isEs ? "¿Qué días?" : "Which days?"}
          optionalLabel={isEs ? "opcional" : "optional"}
          hint={
            isEs
              ? "Déjalo en blanco si solo quieres cambiar la hora."
              : "Leave these alone if only the time needs to move."
          }
        >
          {() => (
            <ChipGroup label={isEs ? "Días" : "Days"}>
              {WEEKDAYS.map((day) => (
                <Chip
                  key={day.value}
                  selected={draft.preferredDays.includes(day.value)}
                  onClick={() =>
                    set({
                      preferredDays: toggleDay(
                        draft.preferredDays,
                        day.value as Weekday,
                      ),
                    })
                  }
                >
                  {isEs ? day.labelEs : day.labelEn}
                </Chip>
              ))}
            </ChipGroup>
          )}
        </FormField>

        <FormField
          label={
            isEs
              ? "¿Por qué necesitas cambiarlo?"
              : "Why does it need to change?"
          }
          error={
            submitted && error === "note-required"
              ? isEs
                ? "Cuéntale a tu clínica qué necesitas."
                : "Tell your clinic what you need."
              : undefined
          }
          hint={
            isEs
              ? "Esto es lo primero que lee tu coordinador."
              : "This is the first thing your coordinator reads."
          }
        >
          {(props) => (
            <Textarea
              {...props}
              rows={4}
              value={draft.note}
              onChange={(event) => set({ note: event.target.value })}
              placeholder={
                isEs
                  ? "Por ejemplo: mi vuelo sale a las 2pm el viernes, necesito la sesión temprano."
                  : "For example: my flight leaves at 2pm on Friday, so I need that session early."
              }
            />
          )}
        </FormField>

        <Alert tone="info" icon={<CircleAlert aria-hidden="true" />}>
          {isEs
            ? "Tus horarios actuales siguen en pie hasta que tu clínica confirme el cambio. No dejes de ir."
            : "Your current times stand until your clinic confirms the change. Keep going to them."}
        </Alert>
      </div>
    </Modal>
  );
}

export default TimeChangeRequestModal;
