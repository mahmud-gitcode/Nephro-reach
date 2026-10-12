"use client";

import React from "react";
import { Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  Badge,
  Button,
  Card,
  FormField,
  Input,
  SectionTitle,
  Select,
} from "@/components/ui";
import { useHomeSystem } from "./useHomeHd";
import { MACHINE_TYPES, type DueState, type MachineType } from "./homeHd";

/* ==========================================================================
   Machine & water system
   --------------------------------------------------------------------------
   At a centre a technician owns this. At home the member does, so the two
   dated jobs — disinfection and the water filter — have to be visible
   rather than remembered.

   An unrecorded date shows as unknown, not as fine. A green tick over a
   blank field is the kind of reassurance that gets somebody hurt.
   ========================================================================== */

const STATE_TONES: Record<
  DueState,
  "neutral" | "success" | "warning" | "danger"
> = {
  unknown: "neutral",
  ok: "success",
  "due-soon": "warning",
  overdue: "danger",
};

function stateLabel(state: DueState, isEs: boolean): string {
  if (state === "overdue") return isEs ? "Vencido" : "Overdue";
  if (state === "due-soon") return isEs ? "Pronto" : "Due soon";
  if (state === "ok") return isEs ? "Al día" : "Up to date";
  return isEs ? "Sin registrar" : "Not recorded";
}

function checkLabel(id: "disinfection" | "filter", isEs: boolean): string {
  if (id === "disinfection") return isEs ? "Desinfección" : "Disinfection";
  return isEs ? "Filtro de agua" : "Water filter";
}

export default function MachineWaterCard() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const log = useHomeSystem();
  const { system } = log;

  /* Each dated job with its own "how often" and "done today" (client,
     2026-10-12): the warning asked the member to check dates there was
     nowhere to set, and the 7- and 30-day intervals were invisible. */
  const jobs = log.checks.map((check) =>
    check.id === "disinfection"
      ? {
          check,
          last: system.lastDisinfection,
          every: system.disinfectionIntervalDays,
          setLast: (value: string) => log.save({ lastDisinfection: value }),
          setEvery: (days: number) =>
            log.save({ disinfectionIntervalDays: days }),
        }
      : {
          check,
          last: system.lastFilterChange,
          every: system.filterIntervalDays,
          setLast: (value: string) => log.save({ lastFilterChange: value }),
          setEvery: (days: number) => log.save({ filterIntervalDays: days }),
        },
  );

  return (
    <Card as="section" padding="small">
      <SectionTitle title={isEs ? "Máquina y Agua" : "Machine & Water"} />

      {log.needsAttention ? (
        <Alert tone="warning" className="mb-stack-md">
          {isEs
            ? "Anote cuándo hizo cada tarea de mantenimiento y cada cuánto toca; le recordaremos la próxima."
            : "Record when you last did each maintenance job and how often it is due; we will remind you of the next one."}
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-inline-md md:grid-cols-2">
        <FormField label={isEs ? "Máquina" : "Machine"}>
          {(field) => (
            <Select
              {...field}
              selectSize="small"
              value={system.machine}
              onChange={(event) =>
                log.save({ machine: event.target.value as MachineType })
              }
            >
              {MACHINE_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {isEs ? option.labelEs : option.labelEn}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField label={isEs ? "Número de serie" : "Serial number"}>
          {(field) => (
            <Input
              {...field}
              inputSize="small"
              value={system.serial}
              onChange={(event) => log.save({ serial: event.target.value })}
            />
          )}
        </FormField>
      </div>

      <ul className="mt-stack-md space-y-stack-sm">
        {jobs.map(({ check, last, every, setLast, setEvery }) => (
          <li
            key={check.id}
            className="space-y-stack-sm rounded-card-nested border border-line bg-surface p-inset-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-inline-md">
              <h3 className="text-label-md text-fg">
                {checkLabel(check.id, isEs)}
              </h3>
              <span className="flex flex-wrap items-center gap-inline-md">
                {check.dueIso ? (
                  <span className="text-body-sm text-fg-muted tabular-nums">
                    {isEs ? "Próxima" : "Next due"} {check.dueIso}
                  </span>
                ) : null}
                <Badge tone={STATE_TONES[check.state]} variant="soft">
                  {stateLabel(check.state, isEs)}
                </Badge>
              </span>
            </div>
            <div className="grid grid-cols-1 gap-inline-md sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
              <FormField label={isEs ? "Última vez" : "Last done"}>
                {(field) => (
                  <Input
                    {...field}
                    type="date"
                    inputSize="small"
                    value={last}
                    onChange={(event) => setLast(event.target.value)}
                  />
                )}
              </FormField>
              <FormField label={isEs ? "Cada (días)" : "Every (days)"}>
                {(field) => (
                  <Input
                    {...field}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={365}
                    inputSize="small"
                    value={String(every)}
                    onChange={(event) => {
                      const days = Math.round(Number(event.target.value));
                      if (days >= 1 && days <= 365) setEvery(days);
                    }}
                  />
                )}
              </FormField>
              <Button
                size="small"
                variant="neutral"
                appearance="fill-stroke"
                leadingIcon={<Check />}
                onClick={() => setLast(log.today)}
              >
                {isEs ? "Hecho hoy" : "Done today"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
