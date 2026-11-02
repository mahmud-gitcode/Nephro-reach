"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  Button,
  FormField,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import type {
  AllergyRow,
  AllergySeverity,
  AllergyType,
  ConditionStatus,
  HistoryRow,
} from "./health.types";

/* The add/edit forms for both tables. */

/* Both modals go through here, so the focus trap, Escape and scroll lock
   arrive in both at once. The submit button lives in the footer and reaches
   the form through form="…", which is what lets <Modal> own the shell. */
export function ModalShell({
  title,
  formId,
  onClose,
  submitLabel,
  cancelLabel,
  saving = false,
  children,
}: {
  title: string;
  formId: string;
  onClose: () => void;
  submitLabel: string;
  cancelLabel: string;
  /** The save is on its way: the button waits (no double submit). */
  saving?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {submitLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

export function AllergyModal({
  initialData,
  onClose,
  onSave,
  saving = false,
  saveError = null,
}: {
  initialData?: AllergyRow | null;
  onClose: () => void;
  onSave: (row: Omit<AllergyRow, "id">, id?: string) => void;
  saving?: boolean;
  /** The server's refusal, shown in the form (it stays open). */
  saveError?: string | null;
}) {
  const { language, dictionary } = useLanguage();
  const h = dictionary?.myHealth;
  const isEs = language === "ES";
  const initialName = initialData?.name || "";
  const initialReaction = initialData?.reactionDefault ?? "";
  const initialNotes =
    initialData?.notes && initialData.notes !== "—" ? initialData.notes : "";

  const [name, setName] = React.useState(initialName);
  const [type, setType] = React.useState<AllergyType>(
    initialData?.type || "Medication",
  );
  const [reaction, setReaction] = React.useState(initialReaction);
  const [severity, setSeverity] = React.useState<AllergySeverity>(
    initialData?.severity || "Moderate",
  );
  const [notes, setNotes] = React.useState(initialNotes);
  const [error, setError] = React.useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(
        isEs ? "Ingrese el nombre de la alergia." : "Enter an allergy name.",
      );
      return;
    }
    if (!reaction.trim()) {
      setError(isEs ? "Ingrese la reacción." : "Enter a reaction.");
      return;
    }
    onSave(
      {
        name: name.trim(),
        type,
        reactionDefault: reaction.trim(),
        severity,
        notes: notes.trim() || "—",
      },
      initialData?.id,
    );
  };

  const title = initialData
    ? isEs
      ? "Editar Alergia"
      : "Edit Allergy"
    : h?.allergies?.addBtn || "Add Allergy";
  const submitLabel = initialData
    ? isEs
      ? "Guardar Cambios"
      : "Save Changes"
    : h?.allergies?.addBtn || "Add Allergy";

  return (
    <ModalShell
      title={title}
      formId="allergy-form"
      onClose={onClose}
      cancelLabel={isEs ? "Cancelar" : "Cancel"}
      submitLabel={submitLabel}
      saving={saving}
    >
      <form
        id="allergy-form"
        onSubmit={handleSubmit}
        className="space-y-stack-lg"
      >
        {error || saveError ? (
          <Alert tone="danger">{error || saveError}</Alert>
        ) : null}

        <FormField label={h?.allergies?.headers?.name || "Name"} required>
          {(props) => (
            <Input
              {...props}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={isEs ? "ej. Penicilina" : "e.g. Penicillin"}
              autoFocus
            />
          )}
        </FormField>

        <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
          <FormField label={h?.allergies?.headers?.type || "Type"}>
            {(props) => (
              <Select
                {...props}
                value={type}
                onChange={(event) => setType(event.target.value as AllergyType)}
              >
                <option value="Medication">
                  {h?.allergies?.types?.medication || "Medication"}
                </option>
                <option value="Food">
                  {h?.allergies?.types?.food || "Food"}
                </option>
                <option value="Environmental">
                  {h?.allergies?.types?.environmental || "Environmental"}
                </option>
              </Select>
            )}
          </FormField>

          <FormField label={h?.allergies?.headers?.severity || "Severity"}>
            {(props) => (
              <Select
                {...props}
                value={severity}
                onChange={(event) =>
                  setSeverity(event.target.value as AllergySeverity)
                }
              >
                <option value="Severe">
                  {h?.allergies?.severities?.severe || "Severe"}
                </option>
                <option value="Moderate">
                  {h?.allergies?.severities?.moderate || "Moderate"}
                </option>
                <option value="Mild">
                  {h?.allergies?.severities?.mild || "Mild"}
                </option>
              </Select>
            )}
          </FormField>
        </div>

        <FormField
          label={h?.allergies?.headers?.reaction || "Reaction"}
          required
        >
          {(props) => (
            <Input
              {...props}
              value={reaction}
              onChange={(event) => setReaction(event.target.value)}
              placeholder={
                isEs ? "ej. Sarpullido, urticaria" : "e.g. Rash, Hives"
              }
            />
          )}
        </FormField>

        <FormField
          label={h?.allergies?.headers?.notes || "Notes"}
          optionalLabel={isEs ? "Opcional" : "Optional"}
        >
          {(props) => (
            <Textarea
              {...props}
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="resize-none"
            />
          )}
        </FormField>
      </form>
    </ModalShell>
  );
}

export function ConditionModal({
  initialData,
  onClose,
  onSave,
  saving = false,
  saveError = null,
}: {
  initialData?: HistoryRow | null;
  onClose: () => void;
  onSave: (row: Omit<HistoryRow, "id">, id?: string) => void;
  saving?: boolean;
  saveError?: string | null;
}) {
  const { language, dictionary } = useLanguage();
  const h = dictionary?.myHealth;
  const isEs = language === "ES";

  /* MM/DD/YYYY, as everywhere else in the app (2026-10-08). */
  const parseToDateInput = (mmddyyyy?: string) => {
    if (!mmddyyyy || mmddyyyy === "—") return "";
    const parts = mmddyyyy.split("/");
    if (parts.length === 3) {
      const [month, day, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return mmddyyyy;
  };

  const initialCondition = initialData?.conditionDefault ?? "";
  const initialDiagnosed = parseToDateInput(initialData?.diagnosed);
  const initialNotes =
    initialData?.notes && initialData.notes !== "—" ? initialData.notes : "";

  const [condition, setCondition] = React.useState(initialCondition);
  const [status, setStatus] = React.useState<ConditionStatus>(
    initialData?.status || "Current",
  );
  const [diagnosed, setDiagnosed] = React.useState(initialDiagnosed);
  const [notes, setNotes] = React.useState(initialNotes);
  const [error, setError] = React.useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!condition.trim()) {
      setError(isEs ? "Ingrese la condición." : "Enter a condition.");
      return;
    }

    // The table shows MM/DD/YYYY; the date input hands back YYYY-MM-DD
    let diagnosedText = "—";
    if (diagnosed) {
      const [year, month, day] = diagnosed.split("-");
      diagnosedText = `${month}/${day}/${year}`;
    }

    onSave(
      {
        conditionDefault: condition.trim(),
        status,
        diagnosed: diagnosedText,
        notes: notes.trim() || "—",
      },
      initialData?.id,
    );
  };

  const title = initialData
    ? isEs
      ? "Editar Condición"
      : "Edit Condition"
    : h?.history?.addBtn || "Add Condition";
  const submitLabel = initialData
    ? isEs
      ? "Guardar Cambios"
      : "Save Changes"
    : h?.history?.addBtn || "Add Condition";

  return (
    <ModalShell
      title={title}
      formId="condition-form"
      onClose={onClose}
      cancelLabel={isEs ? "Cancelar" : "Cancel"}
      submitLabel={submitLabel}
      saving={saving}
    >
      <form
        id="condition-form"
        onSubmit={handleSubmit}
        className="space-y-stack-lg"
      >
        {error || saveError ? (
          <Alert tone="danger">{error || saveError}</Alert>
        ) : null}

        <FormField
          label={h?.history?.headers?.condition || "Condition / History"}
          required
        >
          {(props) => (
            <Input
              {...props}
              value={condition}
              onChange={(event) => setCondition(event.target.value)}
              placeholder={isEs ? "ej. Hipertensión" : "e.g. Hypertension"}
              autoFocus
            />
          )}
        </FormField>

        <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
          <FormField label={h?.history?.headers?.status || "Status"}>
            {(props) => (
              <Select
                {...props}
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ConditionStatus)
                }
              >
                <option value="Current">
                  {h?.history?.statuses?.current || "Current"}
                </option>
                <option value="Past">
                  {h?.history?.statuses?.past || "Past"}
                </option>
              </Select>
            )}
          </FormField>

          <FormField label={h?.history?.headers?.diagnosed || "Diagnosed"}>
            {(props) => (
              <Input
                {...props}
                type="date"
                value={diagnosed}
                onChange={(event) => setDiagnosed(event.target.value)}
              />
            )}
          </FormField>
        </div>

        <FormField
          label={h?.history?.headers?.notes || "Notes"}
          optionalLabel={isEs ? "Opcional" : "Optional"}
        >
          {(props) => (
            <Textarea
              {...props}
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="resize-none"
            />
          )}
        </FormField>
      </form>
    </ModalShell>
  );
}
