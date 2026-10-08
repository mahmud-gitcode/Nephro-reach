"use client";

import React, { useState } from "react";
import { Plus, Check, Pill, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  AsyncSection,
  Button,
  Input,
  Modal,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import {
  useTreatmentMedications,
  type TreatmentMedication,
} from "@/features/personal-log/useTreatmentMedications";

const OTHER_MEDICATION = "__other__";

/** In-clinic medications, matching the set used in the dialysis day log. */
const MEDICATION_OPTIONS = [
  "Epoetin Alfa (Epogen)",
  "Methoxy PEG-Epoetin Beta (Mircera)",
  "Iron Sucrose (Venofer)",
  "Doxercalciferol (Hectorol)",
  "Paricalcitol (Zemplar)",
  "Calcitriol",
  "Cinacalcet (Sensipar)",
  "Etelcalcetide (Parsabiv)",
  "Heparin",
  "Clonidine",
  "Midodrine",
  "Difelikefalin (Korsuva)",
  "Ondansetron (Zofran)",
  "Acetaminophen (Tylenol)",
  "Diphenhydramine (Benadryl)",
  "Antibiotics",
];

const OTHER_DOSE_UNIT = "__other_unit__";

/** Dose units. `value` is stored; the description is shown in the dropdown. */
const DOSE_UNITS: { value: string; descEn: string; descEs: string }[] = [
  { value: "mg", descEn: "milligrams", descEs: "miligramos" },
  { value: "mcg", descEn: "micrograms", descEs: "microgramos" },
  { value: "g", descEn: "grams", descEs: "gramos" },
  {
    value: "Units",
    descEn: "medication units",
    descEs: "unidades de medicamento",
  },
  { value: "mL", descEn: "milliliters", descEs: "mililitros" },
  {
    value: "mg/mL",
    descEn: "milligrams per milliliter",
    descEs: "miligramos por mililitro",
  },
  {
    value: "mcg/mL",
    descEn: "micrograms per milliliter",
    descEs: "microgramos por mililitro",
  },
  {
    value: "Units/mL",
    descEn: "units per milliliter",
    descEs: "unidades por mililitro",
  },
  {
    value: "mg/kg",
    descEn: "milligrams per kilogram",
    descEs: "miligramos por kilogramo",
  },
  {
    value: "mcg/kg",
    descEn: "micrograms per kilogram",
    descEs: "microgramos por kilogramo",
  },
  {
    value: "Units/kg",
    descEn: "units per kilogram",
    descEs: "unidades por kilogramo",
  },
  { value: "mEq", descEn: "milliequivalents", descEs: "miliequivalentes" },
  {
    value: "mEq/L",
    descEn: "milliequivalents per liter",
    descEs: "miliequivalentes por litro",
  },
  { value: "mmol", descEn: "millimoles", descEs: "milimoles" },
  { value: "tablet", descEn: "", descEs: "tableta" },
  { value: "capsule", descEn: "", descEs: "cápsula" },
  { value: "packet", descEn: "", descEs: "sobre" },
  { value: "dose", descEn: "", descEs: "dosis" },
];

export default function MedicationsGivenSection() {
  const { language } = useLanguage();

  const {
    medications,
    isPending,
    error,
    refetch,
    add,
    toggleGiven,
    remove,
    saveError,
    dismissSaveError,
  } = useTreatmentMedications();

  // Add Medication Modal State
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [formMedication, setFormMedication] = useState("");
  const [formMedicationOther, setFormMedicationOther] = useState("");
  const [formDose, setFormDose] = useState("");
  const [formDoseUnit, setFormDoseUnit] = useState("mg");
  const [formDoseUnitOther, setFormDoseUnitOther] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formDate, setFormDate] = useState("May 31, 2024");
  const [formMedError, setFormMedError] = useState("");

  const handleOpenAddMedModal = () => {
    setFormMedication("");
    setFormMedicationOther("");
    setFormDose("");
    setFormDoseUnit("mg");
    setFormDoseUnitOther("");
    setFormReason("");
    setFormDate("May 31, 2024");
    setFormMedError("");
    setIsMedModalOpen(true);
  };

  /* A write that fails is reported by the Alert below rather than thrown at
     the console: whether a dose was recorded as given is not a detail. */
  const handleToggleGiven = (id: string) => {
    void toggleGiven(id).catch(() => {});
  };

  const handleAddMedicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const medicationName =
      formMedication === OTHER_MEDICATION
        ? formMedicationOther.trim()
        : formMedication.trim();

    if (!medicationName) {
      setFormMedError(
        language === "ES"
          ? "Por favor seleccione un medicamento."
          : "Please select a medication.",
      );
      return;
    }
    if (!formDose.trim()) {
      setFormMedError(
        language === "ES"
          ? "Por favor ingrese la dosis."
          : "Please enter a dose.",
      );
      return;
    }

    const doseUnit =
      formDoseUnit === OTHER_DOSE_UNIT
        ? formDoseUnitOther.trim()
        : formDoseUnit;

    if (!doseUnit) {
      setFormMedError(
        language === "ES"
          ? "Por favor seleccione la unidad de la dosis."
          : "Please select a dose unit.",
      );
      return;
    }

    const newEntry: TreatmentMedication = {
      id: Date.now().toString(),
      date: formDate.trim() || "Today",
      medication: medicationName,
      dose: `${formDose.trim()} ${doseUnit}`,
      reason: formReason.trim() || "Dialysis Support",
      given: true,
    };

    /* The modal stays open until the entry is actually stored. */
    add(newEntry)
      .then(() => setIsMedModalOpen(false))
      .catch((cause: unknown) =>
        setFormMedError(
          cause instanceof Error
            ? cause.message
            : language === "ES"
              ? "No se pudo guardar."
              : "That could not be saved.",
        ),
      );
  };

  const handleDeleteMedication = (id: string) => {
    void remove(id).catch(() => {});
  };

  return (
    <section className="flex h-full flex-col justify-between space-y-4 rounded-panel border border-line bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-control border border-primary-soft-line bg-primary-soft">
            <Pill className="h-4 w-4 text-fg-brand" />
          </div>
          <div>
            <h2 className="text-heading-4 text-fg">
              {language === "ES"
                ? "Medicamentos Administrados Durante la Diálisis"
                : "Medications Given During Dialysis"}
            </h2>
          </div>
        </div>

        <Button
          size="small"
          onClick={handleOpenAddMedModal}
          leadingIcon={<Plus aria-hidden="true" />}
          className="shrink-0"
        >
          {language === "ES" ? "Agregar Medicamento" : "Add Medication"}
        </Button>
      </div>

      {saveError ? (
        <Alert
          tone="danger"
          title={
            language === "ES" ? "No se guardó el cambio" : "Change not saved"
          }
          onDismiss={dismissSaveError}
        >
          {saveError instanceof Error
            ? saveError.message
            : language === "ES"
              ? "Inténtelo de nuevo."
              : "Please try again."}
        </Alert>
      ) : null}

      {/* Table */}
      <AsyncSection
        pending={isPending}
        error={error}
        onRetry={refetch}
        errorTitle={
          language === "ES"
            ? "No se pudo cargar el registro"
            : "This record did not load"
        }
        skeleton={<Skeleton height={220} />}
      >
        <div className="flex-1 overflow-hidden rounded-card-nested border border-line">
          <Table minWidth={560}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>
                  {language === "ES" ? "Fecha" : "Date"}
                </TableHeaderCell>
                <TableHeaderCell>
                  {language === "ES" ? "Medicamento" : "Medication"}
                </TableHeaderCell>
                <TableHeaderCell>
                  {language === "ES" ? "Dosis" : "Dose"}
                </TableHeaderCell>
                <TableHeaderCell>
                  {language === "ES" ? "Razón" : "Reason"}
                </TableHeaderCell>
                <TableHeaderCell className="text-center">
                  {language === "ES" ? "Administrado" : "Given"}
                </TableHeaderCell>
                <TableHeaderCell>
                  <span className="sr-only">
                    {language === "ES" ? "Acciones" : "Actions"}
                  </span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {medications.length === 0 ? (
                <TableEmptyRow colSpan={6}>
                  <p className="text-center text-body-sm text-fg-muted">
                    {language === "ES"
                      ? "No hay medicamentos registrados para este tratamiento."
                      : "No medications recorded for this treatment."}
                  </p>
                </TableEmptyRow>
              ) : (
                medications.map((item) => {
                  const toggleLabel = item.given
                    ? language === "ES"
                      ? `Desmarcar ${item.medication}`
                      : `Uncheck ${item.medication}`
                    : language === "ES"
                      ? `Marcar ${item.medication} como administrado`
                      : `Mark ${item.medication} as given`;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap">
                        {item.date}
                      </TableCell>
                      <TableCell emphasis className="whitespace-nowrap">
                        {item.medication}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.dose}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-fg-muted">
                        {item.reason}
                      </TableCell>
                      <TableCell className="text-center">
                        {/* A checkbox drawn as a button: aria-pressed says
                            its state, the label says which medication. */}
                        <button
                          type="button"
                          aria-pressed={item.given}
                          aria-label={toggleLabel}
                          title={toggleLabel}
                          onClick={() => handleToggleGiven(item.id)}
                          /* A 44px tap area around the 20px box (client
                             review, 2026-10-08). */
                          className="-my-2.5 inline-flex size-11 cursor-pointer items-center justify-center rounded-control-small select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <span
                            aria-hidden="true"
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-control-small border transition-colors duration-150 ease-standard ${
                              item.given
                                ? "border-primary-edge bg-primary-solid text-primary-on-solid"
                                : "border-line-strong bg-surface text-transparent"
                            }`}
                          >
                            {item.given && (
                              <Check className="h-3.5 w-3.5 stroke-3" />
                            )}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="danger"
                          appearance="ghost"
                          size="small"
                          iconOnly
                          aria-label={
                            language === "ES"
                              ? `Eliminar ${item.medication}`
                              : `Delete ${item.medication}`
                          }
                          onClick={() => handleDeleteMedication(item.id)}
                        >
                          <Trash2 />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </AsyncSection>

      {/* ADD MEDICATION MODAL */}
      <Modal
        open={isMedModalOpen}
        onClose={() => setIsMedModalOpen(false)}
        title={
          language === "ES"
            ? "Agregar Registro de Medicamento"
            : "Add Medication Record"
        }
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setIsMedModalOpen(false)}
            >
              {language === "ES" ? "Cancelar" : "Cancel"}
            </Button>
            <Button type="submit" form="add-medication-form">
              {language === "ES" ? "Guardar Medicamento" : "Save Medication"}
            </Button>
          </>
        }
      >
        {formMedError && (
          <Alert tone="danger" className="mb-stack-lg">
            {formMedError}
          </Alert>
        )}

        <form
          id="add-medication-form"
          onSubmit={handleAddMedicationSubmit}
          className="space-y-stack-lg"
        >
          <div className="space-y-1.5">
            <label className="mb-stack-xs block text-overline text-fg-muted">
              {language === "ES" ? "Fecha" : "Date"}
            </label>
            <Input
              type="text"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              placeholder="May 31, 2024"
            />
          </div>

          <div className="space-y-1.5">
            <label className="mb-stack-xs block text-overline text-fg-muted">
              {language === "ES" ? "Medicamento" : "Medication"}{" "}
              <span className="text-danger">*</span>
            </label>
            <Select
              value={formMedication}
              onChange={(e) => setFormMedication(e.target.value)}
              autoFocus
            >
              <option value="">
                {language === "ES"
                  ? "Seleccione un medicamento"
                  : "Select a medication"}
              </option>
              {MEDICATION_OPTIONS.map((med) => (
                <option key={med} value={med}>
                  {med}
                </option>
              ))}
              <option value={OTHER_MEDICATION}>
                {language === "ES" ? "Otro (escribir)" : "Other (type it in)"}
              </option>
            </Select>

            {formMedication === OTHER_MEDICATION && (
              <Input
                type="text"
                value={formMedicationOther}
                onChange={(e) => setFormMedicationOther(e.target.value)}
                className="mt-stack-sm"
                placeholder={
                  language === "ES"
                    ? "Nombre del medicamento"
                    : "e.g. Epoetin Alfa (Epogen)"
                }
                autoFocus
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="mb-stack-xs block text-overline text-fg-muted">
              {language === "ES" ? "Dosis" : "Dose"}{" "}
              <span className="text-danger">*</span>
            </label>
            <Input
              type="text"
              inputMode="decimal"
              value={formDose}
              onChange={(e) => setFormDose(e.target.value)}
              placeholder={language === "ES" ? "ej. 8,000" : "e.g. 8,000"}
            />

            {/* Unit */}
            <Select
              value={formDoseUnit}
              onChange={(e) => setFormDoseUnit(e.target.value)}
              aria-label={language === "ES" ? "Unidad de dosis" : "Dose unit"}
            >
              {DOSE_UNITS.map((unit) => {
                const desc = language === "ES" ? unit.descEs : unit.descEn;
                return (
                  <option key={unit.value} value={unit.value}>
                    {desc ? `${unit.value} — ${desc}` : unit.value}
                  </option>
                );
              })}
              <option value={OTHER_DOSE_UNIT}>
                {language === "ES" ? "Otra (escribir)" : "Other (type it in)"}
              </option>
            </Select>

            {formDoseUnit === OTHER_DOSE_UNIT && (
              <Input
                type="text"
                value={formDoseUnitOther}
                onChange={(e) => setFormDoseUnitOther(e.target.value)}
                placeholder={language === "ES" ? "Unidad" : "Unit"}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="mb-stack-xs block text-overline text-fg-muted">
              {language === "ES" ? "Razón / Indicación" : "Reason / Indication"}
            </label>
            <Input
              type="text"
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              placeholder="e.g. Anemia"
            />
          </div>
        </form>
      </Modal>
    </section>
  );
}
