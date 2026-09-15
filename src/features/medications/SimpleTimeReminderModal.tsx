"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Alert, Button, Input, Modal } from "@/components/ui";
import { formatTo12Hour, formatTo24Hour } from "./reminders.time";

export function SimpleTimeReminderModal({
  isOpen,
  onClose,
  medicationName,
  currentTime,
  onSaveTime,
  onDeleteReminder,
}: {
  isOpen: boolean;
  onClose: () => void;
  medicationName: string;
  currentTime?: string;
  /* Both return a promise now: "Saved successfully!" is only true once the
     write has landed, and a reminder for a medication is exactly the kind
     of thing a member must not be told was saved when it was not. */
  onSaveTime: (medicationName: string, newTime: string) => Promise<unknown>;
  onDeleteReminder?: (medicationName: string) => Promise<unknown>;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const [timeValue, setTimeValue] = useState(
    currentTime ? formatTo24Hour(currentTime) : "08:00",
  );
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
      await onSaveTime(medicationName, formatTo12Hour(timeValue));
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
          {currentTime && onDeleteReminder ? (
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
        <div className="flex flex-col items-center justify-center rounded-control border border-line bg-surface-sunken p-inset-sm">
          <Input
            type="time"
            value={timeValue}
            onChange={(e) => setTimeValue(e.target.value)}
            aria-label={language === "ES" ? "Seleccionar Hora" : "Select Time"}
            className="h-auto py-inset-xs text-center text-metric-md"
            required
          />
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
