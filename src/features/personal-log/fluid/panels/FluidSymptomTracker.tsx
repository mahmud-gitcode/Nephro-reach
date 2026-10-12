"use client";

import React, { useState } from "react";
import { Card, Progress, SegmentedChoice } from "@/components/ui";
import { useNow } from "@/lib/utils/useNow";
import type { WeightFluidEntry } from "../fluid.types";
import { FLUID_SYMPTOMS, recentEntries, symptomCounts } from "../fluidSymptoms";

/* The fluid status symptom tracker (client, 2026-10-12): every symptom the
   entry form asks about, and on how many of the member's recent entries
   they recorded it. */

const GROUPS = [
  {
    id: "extra",
    en: "Swelling & breathing",
    es: "Hinchazón y respiración",
  },
  { id: "low", en: "Cramping & dizziness", es: "Calambres y mareo" },
  { id: "other", en: "Other", es: "Otros" },
] as const;

export function FluidSymptomTracker({
  entries,
  isEs,
}: {
  entries: WeightFluidEntry[];
  isEs: boolean;
}) {
  const [days, setDays] = useState<7 | 30>(30);
  const now = new Date(useNow());
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const recent = recentEntries(entries, today, days);
  const counts = symptomCounts(recent);

  return (
    <Card as="section" padding="small" className="space-y-stack-md">
      <div className="flex flex-wrap items-end justify-between gap-inline-md">
        <div>
          <h2 className="text-heading-4 text-fg">
            {isEs
              ? "Registro de Síntomas de Líquidos"
              : "Fluid Status Symptom Tracker"}
          </h2>
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            {isEs
              ? `En cuántas de sus ${recent.length} entradas registró cada síntoma.`
              : `On how many of your ${recent.length} entries you recorded each symptom.`}
          </p>
        </div>
        <SegmentedChoice<7 | 30>
          label={isEs ? "Periodo" : "Period"}
          value={days}
          onChange={setDays}
          options={[
            { value: 7, label: isEs ? "7 días" : "7 days" },
            { value: 30, label: isEs ? "30 días" : "30 days" },
          ]}
        />
      </div>

      <div className="grid gap-inline-lg md:grid-cols-3">
        {GROUPS.map((group) => (
          <div key={group.id} className="space-y-stack-sm">
            <h3 className="text-label-md text-fg-muted">
              {isEs ? group.es : group.en}
            </h3>
            {FLUID_SYMPTOMS.filter((s) => s.group === group.id).map(
              (symptom) => {
                const label = isEs ? symptom.es : symptom.en;
                return (
                  <div key={symptom.key}>
                    <div className="flex items-baseline justify-between gap-inline-md text-body-sm">
                      <span className="text-fg">{label}</span>
                      <span className="text-fg-muted tabular-nums">
                        {counts[symptom.key]} / {recent.length}
                      </span>
                    </div>
                    <Progress
                      className="mt-stack-xs"
                      value={counts[symptom.key]}
                      max={Math.max(recent.length, 1)}
                      label={label}
                      tone={counts[symptom.key] > 0 ? "warning" : "primary"}
                      size="small"
                    />
                  </div>
                );
              },
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
