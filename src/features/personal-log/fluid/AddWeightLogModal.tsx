"use client";

import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Droplets,
  Minus,
  Scale,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button, Input, Modal, Textarea } from "@/components/ui";
import type { WeightFluidEntry } from "./fluid.types";
import { YesNoChoice } from "./YesNoChoice";

export interface AddWeightLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: WeightFluidEntry) => void;
  edwKg?: number;
  unit?: "kg" | "lbs";
}

export function AddWeightLogModal({
  isOpen,
  onClose,
  onSave,
  edwKg = 72.5,
  unit = "kg",
}: AddWeightLogModalProps) {
  const { language } = useLanguage();

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [formDate, setFormDate] = useState(getTodayDateString);
  const [formMorning, setFormMorning] = useState("");
  const [formEvening, setFormEvening] = useState("");
  const [formIntake, setFormIntake] = useState("");
  const [formGoal, setFormGoal] = useState("48 OZ");
  const [formGoalMet, setFormGoalMet] = useState(true);

  // Symptoms: Possible Fluid Overload
  const [formSwelling, setFormSwelling] = useState(false);
  const [formSob, setFormSob] = useState(false);
  const [formRapidGain, setFormRapidGain] = useState(false);

  // Symptoms: Possible Too Much Fluid Removed
  const [formDizziness, setFormDizziness] = useState(false);
  const [formCramping, setFormCramping] = useState(false);
  const [formWeakness, setFormWeakness] = useState(false);
  const [formNausea, setFormNausea] = useState(false);

  const [formUoAmount, setFormUoAmount] = useState("Moderate");
  const [formUoTrend, setFormUoTrend] = useState<
    "decreasing" | "noChange" | "increasing"
  >("decreasing");
  const [formNotes, setFormNotes] = useState("");

  // Estimated Dry Weight (EDW) Connection Logic
  const edwNum =
    unit === "kg" ? edwKg : parseFloat((edwKg * 2.20462).toFixed(1));
  const [weightCompareMode, setWeightCompareMode] = useState<
    "evening" | "morning"
  >("evening");
  const morningWeightNum = parseFloat(formMorning.replace(/[^0-9.]/g, "")) || 0;
  const eveningWeightNum = parseFloat(formEvening.replace(/[^0-9.]/g, "")) || 0;

  // Active weight being evaluated against EDW
  const currentWeightNum =
    weightCompareMode === "morning"
      ? morningWeightNum || eveningWeightNum
      : eveningWeightNum || morningWeightNum;

  const weightDiff =
    currentWeightNum > 0
      ? parseFloat((currentWeightNum - edwNum).toFixed(1))
      : 0;

  const overloadCount = [formSwelling, formSob, formRapidGain].filter(
    Boolean,
  ).length;
  const deficitCount = [
    formDizziness,
    formCramping,
    formWeakness,
    formNausea,
  ].filter(Boolean).length;

  let fluidStatus: "Above EDW" | "Near EDW" | "Below EDW" = "Near EDW";
  let fluidStatusMsg = "Appears On Target";

  if (weightDiff > 0.5 || (weightDiff >= 0 && overloadCount >= 2)) {
    fluidStatus = "Above EDW";
    fluidStatusMsg = "Possible Fluid Overload";
  } else if (weightDiff < -0.5 || (weightDiff <= 0 && deficitCount >= 2)) {
    fluidStatus = "Below EDW";
    fluidStatusMsg = "Possible Too Much Fluid Removed";
  } else {
    // Near EDW range (-0.5 to +0.5)
    if (overloadCount >= 2) {
      fluidStatus = "Above EDW";
      fluidStatusMsg = "Possible Fluid Overload";
    } else if (deficitCount >= 2) {
      fluidStatus = "Below EDW";
      fluidStatusMsg = "Possible Too Much Fluid Removed";
    } else {
      fluidStatus = "Near EDW";
      fluidStatusMsg = "Appears On Target";
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let dateEn = "Today";
    let dateEs = "Hoy";
    if (formDate) {
      const parts = formDate.split("-").map(Number);
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        const [y, m, d] = parts;
        const monthsEn = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const monthsEs = [
          "Ene",
          "Feb",
          "Mar",
          "Abr",
          "May",
          "Jun",
          "Jul",
          "Ago",
          "Sep",
          "Oct",
          "Nov",
          "Dic",
        ];
        dateEn = `${monthsEn[m - 1]} ${d}, ${y}`;
        dateEs = `${d} ${monthsEs[m - 1]}, ${y}`;
      }
    }

    const newEntry: WeightFluidEntry = {
      id: Date.now().toString(),
      dateEn,
      dateEs,
      morning: formMorning.trim() || "--",
      evening: formEvening.trim() || "--",
      uo: formUoAmount,
      intake: formIntake.replace(/[^0-9.]/g, "") || "0",
      goal: formGoalMet ? "Goal Met" : "Above Goal",
      swelling: formSwelling ? "YES" : "NO",
      sob: formSob ? "YES" : "NO",
      weakness: formWeakness ? "YES" : "NO",
      rapidGain: formRapidGain ? "YES" : "NO",
      dizziness: formDizziness ? "YES" : "NO",
      cramping: formCramping ? "YES" : "NO",
      nausea: formNausea ? "YES" : "NO",
      fluidStatus,
      fluidStatusMsg,
      notes: formNotes.trim() || "--",
      noteKey: null,
    };
    onSave(newEntry);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="wide"
      title={
        <span className="flex items-center gap-inline-md">
          <Scale
            aria-hidden="true"
            className="h-icon-big w-icon-big text-fg-brand"
          />
          {language === "ES"
            ? "Registrar Nuevo Control de Peso"
            : "Entry New Weight Log"}
        </span>
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {language === "ES" ? "Cancelar" : "Cancel"}
          </Button>
          <Button type="submit" form="weight-log-form">
            {language === "ES" ? "Guardar Registro" : "Save Entry"}
          </Button>
        </>
      }
    >
      <form
        id="weight-log-form"
        onSubmit={handleSave}
        className="space-y-stack-lg"
      >
        {/* Row 1: Date Input Box */}
        <div className="space-y-1">
          <label className="block text-label-md text-fg">
            {language === "ES" ? "Fecha" : "Date"}
          </label>
          <input
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            onClick={(e) => {
              try {
                (e.target as HTMLInputElement).showPicker?.();
              } catch {}
            }}
            className="w-full cursor-pointer rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-semibold text-fg shadow-control outline-none focus:border-primary-edge focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Row 2: Morning Weight & Evening Weight Inputs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-label-md text-fg">
              {language === "ES"
                ? `Peso Mañana (${unit.toUpperCase()})`
                : `Morning Weight (${unit.toUpperCase()})`}
            </label>
            <Input
              type="text"
              inputMode="decimal"
              value={formMorning}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, "");
                setFormMorning(val);
                setWeightCompareMode("morning");
              }}
              placeholder={
                unit === "kg"
                  ? language === "ES"
                    ? "ej. 72.9"
                    : "e.g. 72.9"
                  : language === "ES"
                    ? "ej. 125"
                    : "e.g. 125"
              }
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-semibold text-fg shadow-control outline-none placeholder:text-fg-subtle focus:border-primary-edge focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-label-md text-fg">
              {language === "ES"
                ? `Peso Tarde (${unit.toUpperCase()})`
                : `Evening Weight (${unit.toUpperCase()})`}
            </label>
            <Input
              type="text"
              inputMode="decimal"
              value={formEvening}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, "");
                setFormEvening(val);
                setWeightCompareMode("evening");
              }}
              placeholder={
                unit === "kg"
                  ? language === "ES"
                    ? "ej. 73.2"
                    : "e.g. 73.2"
                  : language === "ES"
                    ? "ej. 122"
                    : "e.g. 122"
              }
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-semibold text-fg shadow-control outline-none placeholder:text-fg-subtle focus:border-primary-edge focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Row 3: Fluid Intake & Fluid Goal Inputs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-label-md text-fg">
              {language === "ES" ? "Ingesta de Líquidos" : "Fluid Intake"}
            </label>
            <input
              type="text"
              value={formIntake}
              onChange={(e) => setFormIntake(e.target.value)}
              placeholder={language === "ES" ? "ej. 48 OZ" : "e.g. 48 OZ"}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-semibold text-fg shadow-control outline-none placeholder:text-fg-subtle focus:border-primary-edge focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-label-md text-fg">
              {language === "ES" ? "Meta de Líquidos" : "Fluid Goal"}
            </label>
            <input
              type="text"
              value={formGoal}
              onChange={(e) => setFormGoal(e.target.value)}
              placeholder="48 OZ"
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-semibold text-fg shadow-control outline-none placeholder:text-fg-subtle focus:border-primary-edge focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Goal Met Row */}
        <div className="flex items-center justify-between rounded-card border border-line bg-surface px-4 py-2.5">
          <span className="text-xs font-bold text-fg-secondary sm:text-sm">
            {language === "ES" ? "Meta Cumplida" : "Goal Met"}
          </span>
          <div className="flex items-center gap-inline-xs rounded-control bg-primary-soft p-1">
            <button
              type="button"
              onClick={() => setFormGoalMet(true)}
              className={`cursor-pointer rounded-lg px-4 py-1 text-xs font-bold transition-all ${
                formGoalMet
                  ? "bg-surface text-fg shadow-control"
                  : "text-fg-secondary hover:text-fg"
              }`}
            >
              {language === "ES" ? "Sí" : "Yes"}
            </button>
            <button
              type="button"
              onClick={() => setFormGoalMet(false)}
              className={`cursor-pointer rounded-lg px-4 py-1 text-xs font-bold transition-all ${
                !formGoalMet
                  ? "bg-surface text-fg shadow-control"
                  : "text-fg-secondary hover:text-fg"
              }`}
            >
              {language === "ES" ? "No" : "No"}
            </button>
          </div>
        </div>

        {/* Fluid Status Check Section */}
        <div className="space-y-3 rounded-card border border-line bg-surface p-3.5 shadow-control">
          {/* Section Header */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-fg-brand">
                <Droplets className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-bold text-fg">
                {language === "ES"
                  ? "Control del Estado Hídrico"
                  : "Fluid Status Check"}
              </h3>
            </div>
            <p className="mt-1 text-xs font-medium text-fg-muted">
              {language === "ES"
                ? "Ayúdenos a comprender cómo se siente después de la diálisis."
                : "Help us understand how you’re feeling after dialysis."}
            </p>
          </div>

          {/* Subsection 1: Possible Fluid Overload */}
          <div className="space-y-2 border-t border-line-subtle pt-1">
            <div className="flex items-center gap-inline-sm">
              <span className="h-2 w-2 rounded-full bg-primary-solid" />
              <h4 className="text-label-md text-fg">
                {language === "ES"
                  ? "Posible Sobrecarga de Líquidos"
                  : "Possible Fluid Overload"}
              </h4>
            </div>

            <div className="space-y-1.5">
              <YesNoChoice
                label={language === "ES" ? "Hinchazón" : "Swelling"}
                value={formSwelling}
                onChange={setFormSwelling}
              />

              <YesNoChoice
                label={
                  language === "ES" ? "Falta de Aire" : "Shortness of Breath"
                }
                value={formSob}
                onChange={setFormSob}
              />

              <YesNoChoice
                label={
                  language === "ES"
                    ? "Aumento de Peso Repentino / Rápido"
                    : "Sudden / Rapid Weight Gain"
                }
                value={formRapidGain}
                onChange={setFormRapidGain}
              />
            </div>
          </div>

          {/* Subsection 2: Possible Too Much Fluid Removed */}
          <div className="space-y-2 border-t border-line-subtle pt-2">
            <div className="flex items-center gap-inline-sm">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              <h4 className="text-label-md text-fg">
                {language === "ES"
                  ? "Posible Exceso de Líquido Eliminado"
                  : "Possible Too Much Fluid Removed"}
              </h4>
            </div>

            <div className="space-y-1.5">
              <YesNoChoice
                label={language === "ES" ? "Mareos" : "Dizziness"}
                value={formDizziness}
                onChange={setFormDizziness}
              />

              <YesNoChoice
                label={language === "ES" ? "Calambres" : "Cramping"}
                value={formCramping}
                onChange={setFormCramping}
              />

              <YesNoChoice
                label={language === "ES" ? "Debilidad" : "Weakness"}
                value={formWeakness}
                onChange={setFormWeakness}
              />

              <YesNoChoice
                label={language === "ES" ? "Náuseas" : "Nausea"}
                value={formNausea}
                onChange={setFormNausea}
              />
            </div>
          </div>
        </div>

        {/* Urinary Output (24 Hours) Card */}
        <div className="space-y-2.5 rounded-card border border-line bg-surface p-3.5">
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-xs font-bold text-fg sm:text-sm">
              {language === "ES" ? "Gasto Urinario" : "Urinary Output"}
            </h3>
            <span className="text-[11px] font-semibold text-fg-muted">
              {language === "ES" ? "(24 Horas)" : "(24 Hours)"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[130px_1fr]">
            <div className="space-y-1">
              <label className="block text-caption text-fg-muted">
                {language === "ES" ? "Cantidad" : "Amount"}
              </label>
              <div className="relative">
                <select
                  value={formUoAmount}
                  onChange={(e) => setFormUoAmount(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-line bg-surface px-3 py-2 pr-7 text-xs font-bold text-fg-secondary shadow-control outline-none focus:border-primary-edge"
                >
                  <option value="Moderate">
                    {language === "ES" ? "Moderada" : "Moderate"}
                  </option>
                  <option value="Low">
                    {language === "ES" ? "Baja" : "Low"}
                  </option>
                  <option value="Normal">
                    {language === "ES" ? "Normal" : "Normal"}
                  </option>
                  <option value="High">
                    {language === "ES" ? "Alta" : "High"}
                  </option>
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-caption text-fg-muted">
                {language === "ES" ? "Tendencia" : "Trend"}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setFormUoTrend("decreasing")}
                  className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-1.5 py-2 text-xs font-bold transition-all ${
                    formUoTrend === "decreasing"
                      ? "border-2 border-danger-edge bg-danger-surface text-danger shadow-control"
                      : "border border-line bg-surface-sunken text-fg-secondary hover:bg-surface-sunken"
                  }`}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-danger-solid text-white">
                    <ArrowDown className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                  <span className="truncate text-caption">
                    {language === "ES" ? "Disminuyendo" : "Decreasing"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormUoTrend("noChange")}
                  className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-1.5 py-2 text-xs font-bold transition-all ${
                    formUoTrend === "noChange"
                      ? "border-2 border-primary-edge bg-primary-soft text-fg-brand shadow-control"
                      : "border border-line bg-surface-sunken text-fg-secondary hover:bg-surface-sunken"
                  }`}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-solid text-white">
                    <Minus className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                  <span className="truncate text-caption">
                    {language === "ES" ? "Sin Cambios" : "No Change"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormUoTrend("increasing")}
                  className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-1.5 py-2 text-xs font-bold transition-all ${
                    formUoTrend === "increasing"
                      ? "border-2 border-success-600 bg-success-surface text-success shadow-control"
                      : "border border-line bg-surface-sunken text-fg-secondary hover:bg-surface-sunken"
                  }`}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-600 text-white">
                    <ArrowUp className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                  <span className="truncate text-caption">
                    {language === "ES" ? "Aumentando" : "Increasing"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notes (Optional) Card */}
        <div className="space-y-1.5 rounded-card border border-line bg-surface p-3.5">
          <label className="block text-label-md text-fg">
            {language === "ES" ? "Notas (Opcional)" : "Notes (Optional)"}
          </label>
          <Textarea
            rows={2}
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            placeholder={
              language === "ES"
                ? "ej. Tomé todos los medicamentos después de la sesión."
                : "e.g. Took all meds after session."
            }
          />
        </div>
      </form>
    </Modal>
  );
}
