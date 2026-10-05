"use client";

import React, { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Alert, Button, Input, Modal } from "@/components/ui";
import { formatTo12Hour, formatTo24Hour } from "./reminders.time";

export function SimpleTimeReminderModal({
  isOpen,
  onClose,
  medicationName,
  currentTimes = [],
  onSaveTimes,
  onDeleteReminder,
}: {
  isOpen: boolean;
  onClose: () => void;
  medicationName: string;
  /** Every time of day the reminder rings now (empty when there is none). */
  currentTimes?: string[];
  /* Both return a promise now: "Saved successfully!" is only true once the
     write has landed, and a reminder for a medication is exactly the kind
     of thing a member must not be told was saved when it was not. */
  /** One or more times a day (client, 2026-10-05: a medication taken
   *  several times a day needs several reminders). */
  onSaveTimes: (medicationName: string, times: string[]) => Promise<unknown>;
  onDeleteReminder?: (medicationName: string) => Promise<unknown>;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const [times, setTimes] = useState<string[]>(
    currentTimes.length > 0 ? currentTimes.map(formatTo24Hour) : ["08:00"],
  );
  const setAt = (index: number, value: string) =>
    setTimes((current) => current.map((t, i) => (i === index ? value : t)));
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const failureText = (error: unknown) =>
    error instanceof Error
      ? error.message
      : isEs
        ? "Inténtelo de nuevo."
        : "Please try again.";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setFailure(null);
    try {
      await onSaveTimes(
        medicationName,
        times.filter(Boolean).map(formatTo12Hour),
      );
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 450);
    } catch (error) {
      setFailure(failureText(error));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteReminder || busy) return;
    setBusy(true);
    setFailure(null);
    try {
      await onDeleteReminder(medicationName);
      onClose();
    } catch (error) {
      setFailure(failureText(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="small"
      title={language === "ES" ? "Alerta de Recordatorio" : "Reminder Alert"}
      description={medicationName}
      footer={
        <>
          {currentTimes.length > 0 && onDeleteReminder ? (
            <Button
              variant="danger"
              appearance="stroke"
              onClick={handleDelete}
              disabled={busy}
              className="mr-auto"
            >
              {isEs ? "Eliminar alerta" : "Remove alert"}
            </Button>
          ) : null}
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={onClose}
            disabled={busy}
          >
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button type="submit" form="reminder-time-form" loading={busy}>
            <Check aria-hidden="true" />
            {isEs ? "Guardar" : "Save"}
          </Button>
        </>
      }
    >
      <form
        id="reminder-time-form"
        onSubmit={handleSave}
        className="space-y-stack-lg"
      >
        <div className="space-y-stack-sm">
          {times.map((time, index) => (
            <div key={index} className="flex items-center gap-inline-sm">
              <Input
                type="time"
                value={time}
                onChange={(e) => setAt(index, e.target.value)}
                aria-label={
                  isEs
                    ? `Hora del recordatorio ${index + 1}`
                    : `Reminder time ${index + 1}`
                }
                className="flex-1 text-center"
                required
              />
              {times.length > 1 ? (
                <Button
                  variant="neutral"
                  appearance="ghost"
                  iconOnly
                  aria-label={
                    isEs
                      ? `Quitar hora ${index + 1}`
                      : `Remove time ${index + 1}`
                  }
                  onClick={() =>
                    setTimes((current) => current.filter((_, i) => i !== index))
                  }
                >
                  <X />
                </Button>
              ) : null}
            </div>
          ))}
          <Button
            variant="neutral"
            appearance="ghost"
            size="small"
            leadingIcon={<Plus aria-hidden="true" />}
            onClick={() => setTimes((current) => [...current, "20:00"])}
          >
            {isEs ? "Agregar otra hora" : "Add another time"}
          </Button>
        </div>

        {failure ? (
          <Alert tone="danger" title={isEs ? "No se guardó" : "Not saved"}>
            {failure}
          </Alert>
        ) : null}

        {/* role="status" so the confirmation is announced, not just shown. */}
        {savedSuccess && (
          <p
            role="status"
            className="flex items-center justify-center gap-inline-sm rounded-control border border-success-line bg-success-surface py-inset-xs text-label-md text-success"
          >
            <Check aria-hidden="true" className="h-4 w-4" />
            <span>
              {language === "ES"
                ? "¡Guardado exitosamente!"
                : "Saved successfully!"}
            </span>
          </p>
        )}
      </form>
    </Modal>
  );
}
