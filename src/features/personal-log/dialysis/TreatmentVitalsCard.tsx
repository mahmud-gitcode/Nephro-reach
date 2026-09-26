"use client";

import React from "react";
import { HeartPulse } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Badge, Card, Input, SectionTitle, Select } from "@/components/ui";
import { useTreatmentVitals } from "./useHomeHd";
import { FEELINGS, bpFlag, type BpFlag, type Feeling } from "./homeHd";

/* ==========================================================================
   Vitals & weight, either side of a run
   --------------------------------------------------------------------------
   Pre and post sit on the same row for each measure, because the pair is
   the fact: a weight on its own says nothing, the difference between two
   says how much came off.

   Every field is free text. Members type "74.8", "74,8" and "74.8 kg", and
   a number input that silently refuses the last two loses the reading
   rather than recording it.
   ========================================================================== */

const BP_TONES: Record<BpFlag, "neutral" | "success" | "warning"> = {
  unknown: "neutral",
  normal: "success",
  low: "warning",
  high: "warning",
};

function bpLabel(flag: BpFlag, isEs: boolean): string {
  if (flag === "low") return isEs ? "Baja" : "Low";
  if (flag === "high") return isEs ? "Alta" : "High";
  if (flag === "normal") return isEs ? "Normal" : "Normal";
  return "";
}

/** One measure, asked twice: before the run and after it. */
function PrePostRow({
  label,
  unit,
  idBase,
  pre,
  post,
  onPre,
  onPost,
  placeholder,
  isEs,
  after,
}: {
  label: string;
  unit?: string;
  idBase: string;
  pre: string;
  post: string;
  onPre: (value: string) => void;
  onPost: (value: string) => void;
  placeholder?: string;
  isEs: boolean;
  after?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <span className="block text-label-md text-fg-secondary">
        {label}
        {unit ? <span className="ml-1 text-fg-muted">({unit})</span> : null}
      </span>
      <div className="flex items-center gap-inline-sm">
        <Input
          id={`${idBase}-pre`}
          inputSize="small"
          aria-label={`${label} — ${isEs ? "antes" : "before"}`}
          placeholder={placeholder}
          value={pre}
          onChange={(event) => onPre(event.target.value)}
        />
        <span className="shrink-0 text-body-sm text-fg-muted">→</span>
        <Input
          id={`${idBase}-post`}
          inputSize="small"
          aria-label={`${label} — ${isEs ? "después" : "after"}`}
          placeholder={placeholder}
          value={post}
          onChange={(event) => onPost(event.target.value)}
        />
        {after}
      </div>
    </div>
  );
}

export default function TreatmentVitalsCard({ date }: { date: string }) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const log = useTreatmentVitals(date);
  const { vitals } = log;
  const postBp = bpFlag(vitals.postBp);

  return (
    <Card as="section" padding="small">
      <SectionTitle
        title={isEs ? "Signos Vitales y Peso" : "Vitals & Weight"}
        action={
          log.fluidRemovedL !== null ? (
            <Badge tone="info" variant="soft">
              {isEs ? "Líquido retirado" : "Fluid removed"} {log.fluidRemovedL}{" "}
              L
            </Badge>
          ) : (
            <HeartPulse aria-hidden="true" className="h-4 w-4 text-fg-muted" />
          )
        }
      />

      {/* Before → after, one row per measure. */}
      <div className="grid grid-cols-1 gap-inline-md sm:grid-cols-2">
        <PrePostRow
          label={isEs ? "Peso" : "Weight"}
          unit="kg"
          idBase="vitals-weight"
          placeholder="74.8"
          isEs={isEs}
          pre={vitals.preWeightKg}
          post={vitals.postWeightKg}
          onPre={(value) => log.save({ preWeightKg: value })}
          onPost={(value) => log.save({ postWeightKg: value })}
        />

        <PrePostRow
          label={isEs ? "Presión arterial" : "Blood pressure"}
          unit="mmHg"
          idBase="vitals-bp"
          placeholder="120/80"
          isEs={isEs}
          pre={vitals.preBp}
          post={vitals.postBp}
          onPre={(value) => log.save({ preBp: value })}
          onPost={(value) => log.save({ postBp: value })}
          after={
            postBp !== "unknown" ? (
              <Badge tone={BP_TONES[postBp]} variant="soft">
                {bpLabel(postBp, isEs)}
              </Badge>
            ) : null
          }
        />

        <PrePostRow
          label={isEs ? "Pulso" : "Heart rate"}
          unit="bpm"
          idBase="vitals-hr"
          placeholder="78"
          isEs={isEs}
          pre={vitals.preHeartRate}
          post={vitals.postHeartRate}
          onPre={(value) => log.save({ preHeartRate: value })}
          onPost={(value) => log.save({ postHeartRate: value })}
        />

        <div className="grid grid-cols-2 gap-inline-md">
          <div className="space-y-1.5">
            <label
              htmlFor="vitals-temp"
              className="block text-label-md text-fg-secondary"
            >
              {isEs ? "Temperatura" : "Temperature"}
            </label>
            <Input
              id="vitals-temp"
              inputSize="small"
              placeholder="98.4"
              value={vitals.temperature}
              onChange={(event) =>
                log.save({ temperature: event.target.value })
              }
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="vitals-feeling"
              className="block text-label-md text-fg-secondary"
            >
              {isEs ? "Cómo te sientes" : "How you feel"}
            </label>
            <Select
              id="vitals-feeling"
              selectSize="small"
              value={vitals.feeling}
              onChange={(event) =>
                log.save({ feeling: event.target.value as Feeling })
              }
            >
              {FEELINGS.map((option) => (
                <option key={option.value} value={option.value}>
                  {isEs ? option.labelEs : option.labelEn}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>
    </Card>
  );
}
