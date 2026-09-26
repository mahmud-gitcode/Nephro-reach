"use client";

import React from "react";
import { Settings2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  Badge,
  Card,
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

  return (
    <Card as="section" padding="small">
      <SectionTitle
        title={isEs ? "Máquina y Agua" : "Machine & Water"}
        action={
          <Settings2 aria-hidden="true" className="h-4 w-4 text-fg-muted" />
        }
      />

      {log.needsAttention ? (
        <Alert tone="warning" className="mb-stack-md">
          {isEs
            ? "Revisa las fechas de mantenimiento abajo."
            : "Check the maintenance dates below."}
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-inline-md sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="machine-type"
            className="block text-label-md text-fg-secondary"
          >
            {isEs ? "Máquina" : "Machine"}
          </label>
          <Select
            id="machine-type"
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
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="machine-serial"
            className="block text-label-md text-fg-secondary"
          >
            {isEs ? "Número de serie" : "Serial number"}
          </label>
          <Input
            id="machine-serial"
            inputSize="small"
            value={system.serial}
            onChange={(event) => log.save({ serial: event.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="last-disinfection"
            className="block text-label-md text-fg-secondary"
          >
            {isEs ? "Última desinfección" : "Last disinfection"}
          </label>
          <Input
            id="last-disinfection"
            type="date"
            inputSize="small"
            value={system.lastDisinfection}
            onChange={(event) =>
              log.save({ lastDisinfection: event.target.value })
            }
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="last-filter"
            className="block text-label-md text-fg-secondary"
          >
            {isEs ? "Último cambio de filtro" : "Last filter change"}
          </label>
          <Input
            id="last-filter"
            type="date"
            inputSize="small"
            value={system.lastFilterChange}
            onChange={(event) =>
              log.save({ lastFilterChange: event.target.value })
            }
          />
        </div>
      </div>

      {/* What each dated job is doing, derived from the dates above rather
          than kept as a separate status the member has to maintain. */}
      <ul className="mt-stack-md space-y-inline-sm">
        {log.checks.map((check) => (
          <li
            key={check.id}
            className="flex flex-wrap items-center justify-between gap-inline-md rounded-control border border-line bg-surface px-inset-sm py-inset-xs"
          >
            <span className="text-body-sm text-fg">
              {checkLabel(check.id, isEs)}
            </span>
            <span className="flex items-center gap-inline-md">
              {check.dueIso ? (
                <span className="text-body-sm text-fg-muted tabular-nums">
                  {isEs ? "Vence" : "Due"} {check.dueIso}
                </span>
              ) : null}
              <Badge tone={STATE_TONES[check.state]} variant="soft">
                {stateLabel(check.state, isEs)}
              </Badge>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
