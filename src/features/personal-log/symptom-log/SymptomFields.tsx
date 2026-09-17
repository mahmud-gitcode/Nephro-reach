"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";
import { SegmentedChoice } from "@/components/ui";
import {
  CHIP_BASE,
  FIELD_LABEL,
  FIELD_ROW,
  MOODS,
  SEGMENT_ACTIVE,
  SEGMENT_IDLE,
  SEGMENT_ITEM,
  SEGMENT_TRACK,
} from "./symptomLog.styles";

/* The form's controls. Every one of them is a row: a question on the left
   and the answer on the right. */

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold tracking-tight text-fg">{children}</h3>
  );
}

export function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold text-fg-muted">{children}</h3>;
}

/* Both toggles below go through SegmentedChoice, which owns the radiogroup
   semantics. They were plain <button>s until now: a screen reader heard the
   options but never which one was chosen, on a form recording symptoms. */
export function BinaryToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "Yes" | "No";
  onChange: (v: "Yes" | "No") => void;
}) {
  return (
    <SegmentedChoice
      label={label}
      value={value}
      onChange={onChange}
      options={[
        { value: "Yes" as const, label: "Yes" },
        { value: "No" as const, label: "No" },
      ]}
      className={`${FIELD_ROW} h-full`}
      labelClassName={FIELD_LABEL}
      trackClassName={`${SEGMENT_TRACK} shrink-0 self-start sm:self-auto`}
      optionClassName={`${SEGMENT_ITEM} min-w-[52px]`}
      selectedClassName={SEGMENT_ACTIVE}
      unselectedClassName={SEGMENT_IDLE}
    />
  );
}

export function SeverityFiveToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "Yes" | "No" | "Mild" | "Moderate" | "Severe";
  onChange: (v: "Yes" | "No" | "Mild" | "Moderate" | "Severe") => void;
}) {
  return (
    <SegmentedChoice
      label={label}
      value={value}
      onChange={onChange}
      options={(["Yes", "No", "Mild", "Moderate", "Severe"] as const).map(
        (option) => ({ value: option, label: option }),
      )}
      className={FIELD_ROW}
      labelClassName={FIELD_LABEL}
      trackClassName={`${SEGMENT_TRACK} w-full sm:w-auto sm:shrink-0`}
      optionClassName={`${SEGMENT_ITEM} flex-1 px-2 sm:flex-none sm:px-3`}
      selectedClassName={SEGMENT_ACTIVE}
      unselectedClassName={SEGMENT_IDLE}
    />
  );
}

export function CounterField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className={`${FIELD_ROW} h-full`}>
      <span className={FIELD_LABEL}>{label}</span>
      <div className="flex shrink-0 items-center gap-1 self-start rounded-control border border-line bg-surface-sunken p-1 sm:self-auto">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex size-7 cursor-pointer items-center justify-center rounded-control-small bg-surface text-fg-muted shadow-control transition-colors hover:text-fg-brand"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-9 text-center text-sm font-bold text-fg">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex size-7 cursor-pointer items-center justify-center rounded-control-small bg-surface text-fg-muted shadow-control transition-colors hover:text-fg-brand"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function SeverityRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = Math.min(100, Math.max(0, (value / 10) * 100));

  return (
    <div className="flex items-center gap-3 rounded-control border border-line bg-surface px-3.5 py-3 transition-colors hover:border-line-strong">
      <span className="w-32 shrink-0 truncate text-sm font-semibold text-fg-secondary sm:w-36">
        {label}
      </span>
      <input
        type="range"
        min="0"
        max="10"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, var(--color-primary-solid) ${pct}%, var(--color-line) ${pct}%)`,
        }}
        className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-pill accent-[var(--color-primary-solid)] outline-none"
      />
      <span className="flex size-7 shrink-0 items-center justify-center rounded-control-small bg-primary-solid text-xs font-bold text-primary-on-solid">
        {value}
      </span>
    </div>
  );
}

export function VitalCard({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  unit,
  inputMode,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  unit: string;
  inputMode: "decimal" | "numeric" | "text";
}) {
  return (
    <div className="space-y-2.5 rounded-control border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-fg-muted">{label}</span>
        <Icon className="size-4 shrink-0 text-fg-brand" />
      </div>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-control border border-line bg-surface px-3 py-2 text-lg font-bold text-fg transition-colors outline-none placeholder:font-semibold placeholder:text-fg-subtle focus:border-primary-edge focus:ring-1 focus:ring-ring"
      />
      <p className="truncate text-xs font-medium text-fg-muted">{unit}</p>
    </div>
  );
}

export function SymptomChips({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((sym) => {
        const sel = selected.includes(sym);
        return (
          <button
            key={sym}
            type="button"
            onClick={() => onToggle(sym)}
            className={`${CHIP_BASE} ${
              sel
                ? "border-primary-edge bg-primary-solid text-primary-on-solid shadow-control"
                : "border-line bg-surface text-fg-secondary hover:border-primary-edge hover:text-fg-brand"
            }`}
          >
            {sym}
          </button>
        );
      })}
    </div>
  );
}

export function MoodPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {MOODS.map((m) => {
        const active = value === m.level;
        const Icon = m.icon;
        return (
          <button
            key={m.level}
            type="button"
            onClick={() => onChange(m.level)}
            className={`group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-control border p-3 transition-colors ${
              active
                ? "border-primary-edge bg-primary-soft ring-1 ring-ring"
                : "border-line bg-surface hover:border-line-strong hover:bg-surface-sunken"
            }`}
          >
            <Icon
              className={`size-7 shrink-0 transition-transform group-hover:scale-110 sm:size-8 ${m.color}`}
            />
            <span
              className={`text-xs font-bold ${
                active ? "text-fg-brand" : "text-fg-muted"
              }`}
            >
              {m.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function formatDisplayDate(isoDate: string) {
  if (!isoDate) return "";
  const parts = isoDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return isoDate;
  const [y, m, d] = parts;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    weekday: "short",
  });
}
