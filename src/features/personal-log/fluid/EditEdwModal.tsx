"use client";

import React, { useId, useState } from "react";
import { Button, Input, Modal } from "@/components/ui";
import { AlertCircle, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { BathroomScaleIcon } from "./FluidIcons";
import { formatNowStamp } from "./fluid.format";

/** A typed weight, or null when it cannot be saved: empty, unreadable, or
 *  not above 0 (P16b QA round 4: an emptied field silently kept the old
 *  value, and a typed "-5" lost its sign and was saved as 5, with the form
 *  closing and no message). */
export function parseWeight(value: string): number | null {
  const n = Number.parseFloat(value.trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p
      id={id}
      role="alert"
      className="mt-stack-xs flex items-start gap-inline-xs text-caption text-danger"
    >
      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

export function EditEdwModal({
  isOpen,
  onClose,
  edwKg,
  todayWeightKg,
  edwNote,
  unit,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  edwKg: number;
  todayWeightKg: number;
  edwNote: string;
  unit: "kg" | "lbs";
  onSave: (data: {
    edwKg: number;
    todayWeightKg: number;
    edwNote: string;
    todayDateStr: string;
  }) => void;
}) {
  const { language, dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  const isKg = unit === "kg";
  const [formEdw, setFormEdw] = useState(
    isKg ? edwKg.toString() : (edwKg * 2.20462).toFixed(1),
  );
  const [formToday, setFormToday] = useState(
    isKg ? todayWeightKg.toString() : (todayWeightKg * 2.20462).toFixed(1),
  );
  const [formNote, setFormNote] = useState(edwNote);
  const [edwError, setEdwError] = useState(false);
  const [todayError, setTodayError] = useState(false);
  const fieldId = useId();
  const edwId = `${fieldId}-edw`;
  const noteId = `${fieldId}-note`;
  const todayId = `${fieldId}-today`;
  const weightMessage =
    language === "ES"
      ? "Introduzca un peso mayor que 0."
      : "Enter a weight greater than 0.";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedEdw = parseWeight(formEdw);
    const parsedToday = parseWeight(formToday);
    setEdwError(parsedEdw === null);
    setTodayError(parsedToday === null);
    if (parsedEdw === null || parsedToday === null) return;

    const finalEdwKg = isKg ? parsedEdw : parsedEdw / 2.20462;
    const finalTodayKg = isKg ? parsedToday : parsedToday / 2.20462;

    onSave({
      edwKg: parseFloat(finalEdwKg.toFixed(2)),
      todayWeightKg: parseFloat(finalTodayKg.toFixed(2)),
      edwNote:
        formNote.trim() ||
        (language === "ES"
          ? "Establecido por el equipo de atención."
          : "Set by care team."),
      // Stamped with the moment the settings are saved
      todayDateStr: formatNowStamp(language),
    });
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-inline-md">
          <BathroomScaleIcon className="h-icon-small w-icon-small" />
          {w?.edwMetrics?.editSettings ||
            (language === "ES"
              ? "Configuración de Peso y EDW"
              : "Weight & EDW Settings")}
        </span>
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {language === "ES" ? "Cancelar" : "Cancel"}
          </Button>
          <Button type="submit" form="edw-form">
            {w?.edwMetrics?.saveSettings ||
              (language === "ES" ? "Guardar" : "Save Settings")}
          </Button>
        </>
      }
    >
      <form id="edw-form" onSubmit={handleSave} className="space-y-stack-lg">
        <div>
          <label
            htmlFor={edwId}
            className="mb-stack-xs block text-label-md text-fg"
          >
            {w?.edwMetrics?.estimatedDryWeight || "Estimated Dry Weight"} (
            {unit})
          </label>
          <Input
            id={edwId}
            type="text"
            inputMode="decimal"
            value={formEdw}
            aria-invalid={edwError || undefined}
            aria-describedby={edwError ? `${edwId}-error` : undefined}
            onChange={(e) => {
              setFormEdw(e.target.value.replace(/[^0-9.-]/g, ""));
              setEdwError(false);
            }}
            placeholder={isKg ? "72.5" : "159.8"}
          />
          {edwError ? (
            <FieldError id={`${edwId}-error`}>{weightMessage}</FieldError>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={noteId}
            className="mb-stack-xs block text-label-md text-fg"
          >
            {language === "ES"
              ? "Nota de EDW / Proveedor"
              : "EDW Care Team Note"}
          </label>
          <input
            id={noteId}
            type="text"
            value={formNote}
            onChange={(e) => setFormNote(e.target.value)}
            placeholder={
              language === "ES"
                ? "ej. Establecido por el equipo de atención."
                : "e.g. Set by care team."
            }
          />
        </div>

        <div>
          <label
            htmlFor={todayId}
            className="mb-stack-xs block text-label-md text-fg"
          >
            {w?.edwMetrics?.todaysWeight || "Today's Weight"} ({unit})
          </label>
          <Input
            id={todayId}
            type="text"
            inputMode="decimal"
            value={formToday}
            aria-invalid={todayError || undefined}
            aria-describedby={todayError ? `${todayId}-error` : undefined}
            onChange={(e) => {
              setFormToday(e.target.value.replace(/[^0-9.-]/g, ""));
              setTodayError(false);
            }}
            placeholder={isKg ? "72.9" : "160.7"}
          />
          {todayError ? (
            <FieldError id={`${todayId}-error`}>{weightMessage}</FieldError>
          ) : null}
        </div>

        <div>
          <label className="mb-stack-xs block text-label-md text-fg">
            {language === "ES" ? "Fecha y Hora" : "Date & Timestamp"}
          </label>
          {/* Recorded automatically from the clock when the settings are saved */}
          <div className="flex items-center gap-2 rounded-card border border-line bg-surface-sunken px-3.5 py-2.5">
            <Clock className="h-4 w-4 shrink-0 text-fg-brand" />
            <span className="text-body-sm font-semibold text-fg">
              {formatNowStamp(language)}
            </span>
            <span className="ml-auto text-caption font-semibold text-fg-muted">
              {language === "ES" ? "Automático" : "Automatic"}
            </span>
          </div>
        </div>
      </form>
    </Modal>
  );
}
