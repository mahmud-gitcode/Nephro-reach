"use client";

import React, { useState } from "react";
import { Droplets, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Alert, Button, Card, EmptyState, Select } from "@/components/ui";
import {
  CLARITY_OPTIONS,
  DEXTROSE_OPTIONS,
  clarityLabel,
  dextroseLabel,
  exchangeError,
  isUrgentClarity,
  ultrafiltrationMl,
  type DextroseStrength,
  type EffluentClarity,
  type PdExchangeDraft,
  type PdExchangeError,
} from "./pdExchange";
import type { DialysisModalityLog } from "./useDialysisModality";

/* ==========================================================================
   PD exchange log
   --------------------------------------------------------------------------
   What a peritoneal dialysis member actually does four or five times a day.
   The haemodialysis log next to it asks for chair times and fluid removed
   against a dry weight; none of that happens here, which is why this is a
   separate surface rather than a variant of that form.

   Ultrafiltration is never typed in — it is drain minus fill, shown back
   as the member fills the row in.
   ========================================================================== */

const FIELD_LABEL = "block text-label-md text-fg-secondary";

const ERROR_TEXT: Record<PdExchangeError, { en: string; es: string }> = {
  "missing-time": {
    en: "Enter the time you started this exchange.",
    es: "Ingrese la hora en que empezó este intercambio.",
  },
  "missing-fill": {
    en: "Enter how many millilitres went in.",
    es: "Ingrese cuántos mililitros entraron.",
  },
  "missing-drain": {
    en: "Enter how many millilitres drained out.",
    es: "Ingrese cuántos mililitros salieron.",
  },
  "missing-dwell": {
    en: "Enter how long the fluid stayed in.",
    es: "Ingrese cuánto tiempo permaneció el líquido.",
  },
};

interface Row {
  startTime: string;
  dextrose: DextroseStrength;
  fillMl: string;
  drainMl: string;
  dwellMinutes: string;
  clarity: EffluentClarity;
  exitSiteOk: boolean;
  notes: string;
}

const emptyRow = (): Row => ({
  startTime: "",
  dextrose: "2.5",
  fillMl: "2000",
  drainMl: "",
  dwellMinutes: "240",
  clarity: "clear",
  exitSiteOk: true,
  notes: "",
});

const toDraft = (row: Row, date: string): PdExchangeDraft => ({
  date,
  startTime: row.startTime.trim(),
  dextrose: row.dextrose,
  fillMl: Number(row.fillMl) || 0,
  drainMl: Number(row.drainMl) || 0,
  dwellMinutes: Number(row.dwellMinutes) || 0,
  clarity: row.clarity,
  exitSiteOk: row.exitSiteOk,
  notes: row.notes.trim(),
});

function formatMl(value: number, isEs: boolean): string {
  return `${value.toLocaleString(isEs ? "es-ES" : "en-US")} ml`;
}

export default function PdExchangeLog({
  log,
  date,
  dayLabel,
}: {
  log: DialysisModalityLog;
  /** ISO `yyyy-mm-dd` the exchanges belong to. */
  date: string;
  dayLabel: string;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [open, setOpen] = useState(false);
  const [row, setRow] = useState<Row>(emptyRow);
  const [error, setError] = useState<PdExchangeError | null>(null);

  const exchanges = log.exchangesOn(date);
  const dailyUf = log.dailyUltrafiltrationMl(date);
  const urgent = log.urgentExchangesOn(date);

  const update = (patch: Partial<Row>) => {
    setRow((current) => ({ ...current, ...patch }));
    setError(null);
  };

  const draft = toDraft(row, date);
  /* Shown live as the row is filled in, so the member sees the number
     their unit will ask for without working it out. */
  const previewUf = ultrafiltrationMl(draft);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const problem = exchangeError(draft);
    if (problem) {
      setError(problem);
      return;
    }
    log.saveExchange(draft);
    setRow(emptyRow());
  };

  return (
    <Card as="section" padding="small">
      <div className="flex flex-col gap-inline-md sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-inline-md">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-soft text-fg-brand"
          >
            <Droplets className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-heading-5 text-fg">
              {isEs ? "Intercambios" : "Exchanges"}
            </h2>
            <p className="mt-0.5 text-body-sm text-fg-secondary">{dayLabel}</p>
          </div>
        </div>

        <Button
          size="small"
          variant="neutral"
          appearance="fill-stroke"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
        >
          <Plus aria-hidden="true" />
          {isEs ? "Registrar intercambio" : "Log an exchange"}
        </Button>
      </div>

      {/* The day in one line, because this is the figure a unit asks for. */}
      {exchanges.length > 0 ? (
        <div className="mt-stack-md flex flex-wrap items-center gap-inline-lg rounded-control border border-line bg-surface-sunken p-inset-sm">
          <p className="text-body-sm text-fg-secondary">
            {isEs ? "Intercambios hoy" : "Exchanges today"}
            <span className="ml-inline-sm text-label-lg text-fg">
              {exchanges.length}
            </span>
          </p>
          <p className="text-body-sm text-fg-secondary">
            {isEs ? "Ultrafiltración total" : "Total ultrafiltration"}
            <span
              className={`ml-inline-sm text-label-lg ${
                dailyUf < 0 ? "text-warning" : "text-fg"
              }`}
            >
              {formatMl(dailyUf, isEs)}
            </span>
          </p>
        </div>
      ) : null}

      {/* Not a row in a table. Cloudy or blood-stained effluent is how
          peritonitis first shows itself, and a member is taught to call
          their unit the day they see it. */}
      {urgent.length > 0 ? (
        <Alert
          tone="danger"
          className="mt-stack-md"
          title={
            isEs
              ? "Llama hoy a tu unidad de diálisis"
              : "Call your dialysis unit today"
          }
        >
          {isEs
            ? "Registraste líquido drenado turbio o con sangre. Puede ser el primer signo de una infección (peritonitis). No esperes a tu próxima cita: llama a tu unidad hoy. Si tienes fiebre, dolor abdominal fuerte o vómitos, busca atención urgente."
            : "You recorded drained fluid that was cloudy or blood-stained. That can be the first sign of an infection (peritonitis). Do not wait for your next appointment — call your unit today. If you also have a fever, bad stomach pain or vomiting, seek urgent care."}
        </Alert>
      ) : null}

      {open ? (
        <form
          onSubmit={handleSubmit}
          className="mt-stack-md space-y-stack-md rounded-control border border-primary-soft-line bg-surface p-inset-md"
        >
          {error ? (
            <Alert tone="danger">
              {isEs ? ERROR_TEXT[error].es : ERROR_TEXT[error].en}
            </Alert>
          ) : null}

          <div className="grid grid-cols-1 gap-inline-md sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label htmlFor="pd-start" className={FIELD_LABEL}>
                {isEs ? "Hora de inicio" : "Start time"}
              </label>
              <input
                id="pd-start"
                type="time"
                value={row.startTime}
                onChange={(event) => update({ startTime: event.target.value })}
                className="h-control-small w-full rounded-control-small border border-line bg-surface px-control-x-small text-body-sm text-fg outline-none focus-visible:border-neutral-edge focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-edge"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pd-dextrose" className={FIELD_LABEL}>
                {isEs ? "Concentración" : "Dextrose"}
              </label>
              <Select
                id="pd-dextrose"
                selectSize="small"
                value={row.dextrose}
                onChange={(event) =>
                  update({ dextrose: event.target.value as DextroseStrength })
                }
              >
                {DEXTROSE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {isEs ? option.labelEs : option.labelEn}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pd-fill" className={FIELD_LABEL}>
                {isEs ? "Llenado (ml)" : "Fill (ml)"}
              </label>
              <input
                id="pd-fill"
                type="text"
                inputMode="numeric"
                value={row.fillMl}
                onChange={(event) => update({ fillMl: event.target.value })}
                className="h-control-small w-full rounded-control-small border border-line bg-surface px-control-x-small text-body-sm text-fg outline-none focus-visible:border-neutral-edge focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-edge"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pd-drain" className={FIELD_LABEL}>
                {isEs ? "Drenado (ml)" : "Drain (ml)"}
              </label>
              <input
                id="pd-drain"
                type="text"
                inputMode="numeric"
                value={row.drainMl}
                onChange={(event) => update({ drainMl: event.target.value })}
                className="h-control-small w-full rounded-control-small border border-line bg-surface px-control-x-small text-body-sm text-fg outline-none focus-visible:border-neutral-edge focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-edge"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pd-dwell" className={FIELD_LABEL}>
                {isEs ? "Permanencia (min)" : "Dwell (min)"}
              </label>
              <input
                id="pd-dwell"
                type="text"
                inputMode="numeric"
                value={row.dwellMinutes}
                onChange={(event) =>
                  update({ dwellMinutes: event.target.value })
                }
                className="h-control-small w-full rounded-control-small border border-line bg-surface px-control-x-small text-body-sm text-fg outline-none focus-visible:border-neutral-edge focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-edge"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pd-clarity" className={FIELD_LABEL}>
                {isEs ? "Aspecto del líquido" : "Drained fluid looked"}
              </label>
              <Select
                id="pd-clarity"
                selectSize="small"
                value={row.clarity}
                onChange={(event) =>
                  update({ clarity: event.target.value as EffluentClarity })
                }
                className={
                  isUrgentClarity(row.clarity) ? "text-danger" : undefined
                }
              >
                {CLARITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {isEs ? option.labelEs : option.labelEn}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pd-exit" className={FIELD_LABEL}>
                {isEs ? "Sitio de salida" : "Exit site"}
              </label>
              <Select
                id="pd-exit"
                selectSize="small"
                value={row.exitSiteOk ? "ok" : "not-ok"}
                onChange={(event) =>
                  update({ exitSiteOk: event.target.value === "ok" })
                }
                className={row.exitSiteOk ? undefined : "text-warning"}
              >
                <option value="ok">{isEs ? "Normal" : "Looks normal"}</option>
                <option value="not-ok">
                  {isEs ? "Rojo o con secreción" : "Red or draining"}
                </option>
              </Select>
            </div>

            {/* Shown, never typed: it is drain minus fill, and asking a
                member to copy out their own subtraction is a second chance
                to get it wrong. */}
            <div className="space-y-1.5">
              <p className={FIELD_LABEL}>
                {isEs ? "Ultrafiltración" : "Ultrafiltration"}
              </p>
              <p
                className={`flex h-control-small items-center text-label-lg ${
                  previewUf < 0 ? "text-warning" : "text-fg"
                }`}
              >
                {row.drainMl.trim() ? formatMl(previewUf, isEs) : "—"}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pd-notes" className={FIELD_LABEL}>
              {isEs ? "Notas (opcional)" : "Notes (optional)"}
            </label>
            <textarea
              id="pd-notes"
              rows={2}
              value={row.notes}
              onChange={(event) => update({ notes: event.target.value })}
              placeholder={
                isEs
                  ? "Dolor, dificultad para drenar, cualquier cosa fuera de lo normal…"
                  : "Pain, trouble draining, anything out of the ordinary…"
              }
              className="w-full resize-y rounded-control border border-line bg-surface px-control-x-small py-inset-xs text-body-sm text-fg outline-none placeholder:text-fg-muted focus-visible:border-neutral-edge focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-edge"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-inline-md border-t border-line-subtle pt-inset-sm">
            <Button
              type="button"
              variant="neutral"
              appearance="stroke"
              size="small"
              onClick={() => {
                setRow(emptyRow());
                setError(null);
                setOpen(false);
              }}
            >
              {isEs ? "Cancelar" : "Cancel"}
            </Button>
            <Button type="submit" size="small" disabled={log.isSaving}>
              <Plus aria-hidden="true" />
              {isEs ? "Guardar intercambio" : "Save exchange"}
            </Button>
          </div>
        </form>
      ) : null}

      {exchanges.length === 0 ? (
        <div className="mt-stack-md">
          <EmptyState
            icon={<Droplets aria-hidden="true" />}
            title={
              isEs
                ? "Aún no hay intercambios este día"
                : "No exchanges logged on this day"
            }
            description={
              isEs
                ? "Registra cada intercambio para llevar la cuenta de cuánto líquido retiras."
                : "Log each exchange to keep track of how much fluid you are taking off."
            }
          />
        </div>
      ) : (
        <ul className="mt-stack-md space-y-stack-sm">
          {exchanges.map((exchange) => {
            const uf = ultrafiltrationMl(exchange);
            return (
              <li
                key={exchange.id}
                className="flex flex-col gap-inline-md rounded-control border border-line bg-surface p-inset-sm sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-inline-md text-label-md text-fg">
                    <span>{exchange.startTime || "—"}</span>
                    <span className="text-fg-muted">
                      {dextroseLabel(exchange.dextrose, isEs)}
                    </span>
                    <span
                      className={
                        isUrgentClarity(exchange.clarity)
                          ? "text-danger"
                          : "text-fg-muted"
                      }
                    >
                      {clarityLabel(exchange.clarity, isEs)}
                    </span>
                    {!exchange.exitSiteOk ? (
                      <span className="text-warning">
                        {isEs ? "Sitio de salida" : "Exit site"}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-body-sm text-fg-secondary">
                    {isEs ? "Entró" : "In"} {formatMl(exchange.fillMl, isEs)} ·{" "}
                    {isEs ? "salió" : "out"} {formatMl(exchange.drainMl, isEs)}{" "}
                    · {exchange.dwellMinutes} {isEs ? "min" : "min"}
                  </p>
                  {exchange.notes ? (
                    <p className="mt-0.5 text-body-sm text-fg-muted">
                      {exchange.notes}
                    </p>
                  ) : null}
                </div>

                <p
                  className={`shrink-0 text-label-lg ${
                    uf < 0 ? "text-warning" : "text-fg"
                  }`}
                >
                  {formatMl(uf, isEs)}
                </p>

                <Button
                  variant="danger"
                  appearance="stroke"
                  size="small"
                  iconOnly
                  onClick={() => log.deleteExchange(exchange.id)}
                  aria-label={
                    isEs
                      ? `Eliminar el intercambio de las ${exchange.startTime}`
                      : `Delete the exchange at ${exchange.startTime}`
                  }
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
