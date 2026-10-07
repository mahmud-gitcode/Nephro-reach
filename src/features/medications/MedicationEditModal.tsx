"use client";

import React, { useState } from "react";
import {
  Alert,
  Button,
  FormField,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import {
  FREQUENCIES,
  ROUTES,
  changeFrom,
  type Medication,
  type MedicationChange,
} from "./medicationList";

/* ==========================================================================
   Edit a medication (client, 2026-10-07)
   --------------------------------------------------------------------------
   A dose going from 5 mg to 10 mg, or a new frequency, is changed here
   rather than by deleting and re-adding the medication, so its reminders,
   dose log and history stay with it. Each change is recorded with its date.
   ========================================================================== */

export function MedicationEditModal({
  medication,
  isEs,
  saving,
  onSave,
  onClose,
}: {
  medication: Medication;
  isEs: boolean;
  saving: boolean;
  onSave: (change: MedicationChange) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<MedicationChange>(() =>
    changeFrom(medication),
  );
  const [tried, setTried] = useState(false);
  const set = (patch: Partial<MedicationChange>) =>
    setDraft((current) => ({ ...current, ...patch }));
  const doseError = draft.dose.trim()
    ? undefined
    : isEs
      ? "Escriba la dosis."
      : "Enter the dose.";
  const history = [...(medication.history ?? [])].reverse();

  return (
    <Modal
      open
      onClose={onClose}
      title={isEs ? `Editar ${medication.name}` : `Edit ${medication.name}`}
      description={
        isEs
          ? "Los cambios se guardan con la fecha, para que su equipo vea qué cambió."
          : "Changes are saved with the date, so your care team can see what changed."
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            loading={saving}
            onClick={() => {
              setTried(true);
              if (doseError) return;
              onSave(draft);
            }}
          >
            {isEs ? "Guardar cambios" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        <div className="grid grid-cols-1 gap-inline-lg sm:grid-cols-2">
          <FormField
            label={isEs ? "Dosis" : "Dose"}
            required
            error={tried ? doseError : undefined}
          >
            {(field) => (
              <Input
                {...field}
                value={draft.dose}
                placeholder={isEs ? "ej. 10 mg" : "e.g. 10 mg"}
                onChange={(e) => set({ dose: e.target.value })}
              />
            )}
          </FormField>
          <FormField label={isEs ? "Frecuencia" : "Frequency"} required>
            {(field) => (
              <Select
                {...field}
                value={draft.frequency}
                onChange={(e) => set({ frequency: e.target.value })}
              >
                {/* A frequency saved before the list existed stays choosable. */}
                {FREQUENCIES.some((f) => f.en === draft.frequency) ? null : (
                  <option value={draft.frequency}>{draft.frequency}</option>
                )}
                {FREQUENCIES.map((f) => (
                  <option key={f.en} value={f.en}>
                    {isEs ? f.es : f.en}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField label={isEs ? "Vía" : "Route"}>
            {(field) => (
              <Select
                {...field}
                value={draft.route}
                onChange={(e) => set({ route: e.target.value })}
              >
                {ROUTES.some((r) => r.value === draft.route) ? null : (
                  <option value={draft.route}>{draft.route}</option>
                )}
                {ROUTES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {isEs ? r.es : r.en}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField
            label={isEs ? "Fecha de fin" : "End date"}
            optionalLabel={isEs ? "opcional" : "optional"}
          >
            {(field) => (
              <Input
                {...field}
                type="date"
                value={draft.endDate}
                onChange={(e) => set({ endDate: e.target.value })}
              />
            )}
          </FormField>
          <FormField label={isEs ? "Para qué es" : "Purpose"}>
            {(field) => (
              <Input
                {...field}
                value={draft.purpose}
                onChange={(e) => set({ purpose: e.target.value })}
              />
            )}
          </FormField>
          <FormField label={isEs ? "Recetado por" : "Prescribed by"}>
            {(field) => (
              <Input
                {...field}
                value={draft.provider}
                onChange={(e) => set({ provider: e.target.value })}
              />
            )}
          </FormField>
          <FormField label={isEs ? "Farmacia" : "Pharmacy"}>
            {(field) => (
              <Input
                {...field}
                value={draft.pharmacy}
                onChange={(e) => set({ pharmacy: e.target.value })}
              />
            )}
          </FormField>
        </div>
        <FormField label={isEs ? "Instrucciones" : "Instructions"}>
          {(field) => (
            <Textarea
              {...field}
              rows={2}
              value={draft.instructions}
              onChange={(e) => set({ instructions: e.target.value })}
            />
          )}
        </FormField>
        <Alert tone="info" live={false}>
          {isEs
            ? "Cambie su medicamento solo como se lo indicó su médico."
            : "Only change your medication as your doctor directed."}
        </Alert>

        {history.length > 0 ? (
          <section>
            <h3 className="text-heading-5 text-fg">
              {isEs ? "Historial de cambios" : "Change history"}
            </h3>
            <ul className="mt-stack-sm divide-y divide-line-subtle">
              {history.map((edit, i) => (
                <li
                  key={`${edit.date}-${edit.field}-${i}`}
                  className="flex flex-wrap justify-between gap-inline-md py-inset-xs text-body-sm"
                >
                  <span className="text-fg">
                    {edit.field}: {edit.from} → {edit.to}
                  </span>
                  <span className="text-fg-muted tabular-nums">
                    {edit.date}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Modal>
  );
}
