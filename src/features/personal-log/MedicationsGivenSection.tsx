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
    <section className="flex h-full flex-col justify-between space-y-4 rounded-panel border border-line bg-surface p-6 shadow-control">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-control border border-primary-soft-line bg-primary-soft">
            <Pill className="h-4 w-4 text-fg-brand" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-fg">
              {language === "ES"
                ? "Medicamentos Administrados Durante la Diálisis"
                : "Medications Given During Dialysis"}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddMedModal}
          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-control bg-primary-solid px-3.5 py-1.5 text-xs font-bold text-primary-on-solid shadow-control transition-all hover:bg-primary-solid-hover active:scale-95"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>
            {language === "ES" ? "Agregar Medicamento" : "Add Medication"}
          </span>
        </button>
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
        <div className="flex-1 overflow-x-auto rounded-card border border-line">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-sunken text-xs font-bold tracking-wider text-fg-muted uppercase">
                <th className="px-3.5 py-2.5">
                  {language === "ES" ? "Fecha" : "Date"}
                </th>
                <th className="px-3.5 py-2.5">
                  {language === "ES" ? "Medicamento" : "Medication"}
                </th>
                <th className="px-3.5 py-2.5">
                  {language === "ES" ? "Dosis" : "Dose"}
                </th>
                <th className="px-3.5 py-2.5">
                  {language === "ES" ? "Razón" : "Reason"}
                </th>
                <th className="px-3.5 py-2.5 text-center">
                  {language === "ES" ? "Administrado" : "Given"}
                </th>
                <th className="w-8 px-2 py-2.5 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle font-medium text-fg-secondary">
              {medications.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-xs text-fg-subtle"
                  >
                    {language === "ES"
                      ? "No hay medicamentos registrados para este tratamiento."
                      : "No medications recorded for this treatment."}
                  </td>
                </tr>
              ) : (
                medications.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-surface-sunken"
                  >
                    <td className="px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap text-fg">
                      {item.date}
                    </td>
                    <td className="px-3.5 py-2.5 text-xs font-bold whitespace-nowrap text-fg">
                      {item.medication}
                    </td>
                    <td className="px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap text-fg-secondary">
                      {item.dose}
                    </td>
                    <td className="px-3.5 py-2.5 text-xs whitespace-nowrap text-fg-muted">
                      {item.reason}
                    </td>
                    <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleGiven(item.id)}
                        className={`inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded border transition-colors select-none active:scale-95 ${
                          item.given
                            ? "border-primary-edge bg-primary-solid text-primary-on-solid shadow-control"
                            : "border-line-strong bg-surface text-transparent hover:border-line-strong"
                        }`}
                        title={
                          item.given
                            ? language === "ES"
                              ? "Desmarcar medicamento"
                              : "Uncheck medication"
                            : language === "ES"
                              ? "Marcar como administrado"
                              : "Mark as given"
                        }
                      >
                        {item.given && (
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        )}
                      </button>
                    </td>
                    <td className="px-2 py-2.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteMedication(item.id)}
                        className="cursor-pointer rounded-control-small p-1 text-fg-subtle transition-colors hover:bg-danger-surface hover:text-danger"
                        title={language === "ES" ? "Eliminar" : "Delete"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
