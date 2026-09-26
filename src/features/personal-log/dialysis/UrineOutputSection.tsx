"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  SectionTitle,
} from "@/components/ui";
import { useUrineOutput } from "./useUrineOutput";
import { entryError, parseMl } from "./urineOutput";

/* ==========================================================================
   Urine output
   --------------------------------------------------------------------------
   A running list for one day rather than a single box, because members are
   asked to record every passing however small, and one box at bedtime is a
   guess rather than a record.

   Shown on every modality. A member still making urine is worth watching
   whichever way they dialyse.
   ========================================================================== */

/** Now, as "HH:MM" — what a member reaching for the form almost always wants. */
function nowTime(): string {
  const now = new Date();
  return `${`${now.getHours()}`.padStart(2, "0")}:${`${now.getMinutes()}`.padStart(2, "0")}`;
}

export default function UrineOutputSection() {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const log = useUrineOutput();
  const [time, setTime] = useState(nowTime);
  const [amountMl, setAmountMl] = useState("");

  const draft = { date: log.date, time, amountMl };
  const error = entryError(draft, isEs);

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault();
    if (error) return;

    log.save(draft);
    setAmountMl("");
    setTime(nowTime());
  };

  return (
    <Card as="section" padding="small">
      <SectionTitle
        title={isEs ? "Orina (24 h)" : "Urine Output (24h)"}
        action={
          <Badge tone="info" variant="soft">
            {log.dayTotalMl} mL
          </Badge>
        }
      />

      <form
        onSubmit={handleAdd}
        className="mb-stack-md flex flex-wrap items-end gap-inline-md"
      >
        <div className="space-y-1.5">
          <label
            htmlFor="urine-date"
            className="block text-label-md text-fg-secondary"
          >
            {isEs ? "Fecha" : "Date"}
          </label>
          <Input
            id="urine-date"
            type="date"
            inputSize="small"
            className="w-auto"
            value={log.date}
            onChange={(event) => log.setDate(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="urine-time"
            className="block text-label-md text-fg-secondary"
          >
            {isEs ? "Hora" : "Time"}
          </label>
          <Input
            id="urine-time"
            type="time"
            inputSize="small"
            className="w-auto"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="urine-amount"
            className="block text-label-md text-fg-secondary"
          >
            {isEs ? "Cantidad (mL)" : "Amount (mL)"}
          </label>
          <Input
            id="urine-amount"
            inputSize="small"
            className="w-24"
            placeholder="200"
            value={amountMl}
            onChange={(event) => setAmountMl(event.target.value)}
          />
        </div>

        <Button type="submit" size="small" disabled={!!error}>
          <Plus />
          <span>{isEs ? "Agregar" : "Add"}</span>
        </Button>
      </form>

      {log.dayEntries.length === 0 ? (
        <EmptyState
          title={isEs ? "Sin registros hoy" : "Nothing recorded yet"}
          description={
            isEs
              ? "Registra cada vez que orines, aunque sea poco."
              : "Record every passing, however small."
          }
        />
      ) : (
        <ul className="space-y-inline-sm">
          {log.dayEntries.map((entry) => {
            const ml = parseMl(entry.amountMl);

            return (
              <li
                key={entry.id}
                className="flex items-center gap-inline-md rounded-control border border-line bg-surface px-inset-sm py-inset-xs"
              >
                <span className="w-16 shrink-0 text-body-sm text-fg-muted tabular-nums">
                  {entry.time || "—"}
                </span>
                <span className="min-w-0 flex-1 truncate text-body-sm text-fg tabular-nums">
                  {ml === null ? entry.amountMl : `${ml} mL`}
                </span>
                <button
                  type="button"
                  onClick={() => log.remove(entry.id)}
                  aria-label={`${isEs ? "Eliminar" : "Delete"} ${entry.time} ${entry.amountMl}`}
                  className="cursor-pointer rounded-control p-1.5 text-fg-muted transition-colors hover:bg-danger-surface hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {log.saveError ? (
        <Alert tone="danger" className="mt-stack-md">
          {isEs
            ? "No se pudo guardar. Intenta de nuevo."
            : "That did not save. Try again."}
        </Alert>
      ) : null}
    </Card>
  );
}
