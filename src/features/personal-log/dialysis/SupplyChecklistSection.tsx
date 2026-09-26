"use client";

import React from "react";
import { PackageCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Badge, Card, Input, SectionTitle, Select } from "@/components/ui";
import { useSupplyChecklist } from "./useSupplyChecklist";
import {
  neededFor,
  statusLabel,
  supplyGroupsFor,
  supplyStatus,
  type SupplyStatus,
} from "./supplies";
import type { DialysisModalityLog } from "./useDialysisModality";

/* ==========================================================================
   Monthly supply checklist
   --------------------------------------------------------------------------
   Lives on the management tab, not the treatment log: counting the cupboard
   is something a member does once a month at the kitchen table, not
   something that happens during a run.

   Shown only to home members. An in-center member's stock sits at the unit,
   so there is nothing here for them to count and the section stays away
   rather than appearing empty.
   ========================================================================== */

const TONES: Record<SupplyStatus, "success" | "warning" | "danger"> = {
  ok: "success",
  low: "warning",
  missing: "danger",
};

/** The last twelve months, newest first — far enough back to look up an order. */
function recentMonths(isEs: boolean): { value: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, back) => {
    const date = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    return {
      value: `${date.getFullYear()}-${month}`,
      label: date.toLocaleDateString(isEs ? "es" : "en", {
        month: "long",
        year: "numeric",
      }),
    };
  });
}

export default function SupplyChecklistSection({
  modalityLog,
}: {
  modalityLog: DialysisModalityLog;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const { modality } = modalityLog;

  const groups = supplyGroupsFor(modality);
  const checklist = useSupplyChecklist(modality);
  const { counts, summary } = checklist;

  // Nothing to count at a centre — see the note at the top of this file.
  if (groups.length === 0) return null;

  const months = recentMonths(isEs);

  return (
    <Card as="section" padding="small">
      <SectionTitle
        title={isEs ? "Lista de Insumos" : "Supply Checklist"}
        action={
          <Select
            selectSize="small"
            aria-label={isEs ? "Mes" : "Month"}
            value={checklist.monthKey}
            onChange={(event) => checklist.setMonthKey(event.target.value)}
            className="w-auto"
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </Select>
        }
      />

      {/* Where the month stands, in one line. Three numbers, no prose. */}
      <div className="mb-stack-md flex flex-wrap items-center gap-inline-md">
        <Badge tone="neutral" variant="soft">
          <PackageCheck aria-hidden="true" className="h-3.5 w-3.5" />
          {isEs ? "Revisados" : "Checked"} {summary.checked}/{summary.total}
        </Badge>
        {summary.low > 0 ? (
          <Badge tone="warning" variant="soft">
            {isEs ? "Bajos" : "Low"} {summary.low}
          </Badge>
        ) : null}
        {summary.missing > 0 ? (
          <Badge tone="danger" variant="soft">
            {isEs ? "Faltan" : "Missing"} {summary.missing}
          </Badge>
        ) : null}
        {summary.stocked ? (
          <Badge tone="success" variant="soft">
            {isEs ? "Todo en existencia" : "Fully stocked"}
          </Badge>
        ) : null}
      </div>

      <div className="space-y-stack-lg">
        {groups.map((group) => (
          <section
            key={group.id}
            aria-label={isEs ? group.labelEs : group.labelEn}
          >
            <h3 className="mb-inline-md text-label-lg text-fg-secondary">
              {isEs ? group.labelEs : group.labelEn}
            </h3>

            <ul className="space-y-inline-sm">
              {group.items.map((item) => {
                const count = counts[item.id];
                const status = supplyStatus(item, count);
                const inputId = `supply-${item.id}`;

                return (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center gap-inline-md rounded-control border border-line bg-surface px-inset-sm py-inset-xs"
                  >
                    <input
                      type="checkbox"
                      id={`${inputId}-checked`}
                      checked={count?.checked ?? false}
                      onChange={(event) =>
                        checklist.setCount(item.id, {
                          checked: event.target.checked,
                        })
                      }
                      className="h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-brand-600)]"
                    />

                    <label
                      htmlFor={`${inputId}-checked`}
                      className="min-w-0 flex-1 cursor-pointer truncate text-body-sm text-fg"
                    >
                      {isEs ? item.labelEs : item.labelEn}
                    </label>

                    <div className="flex items-center gap-inline-sm">
                      <Input
                        type="number"
                        min={0}
                        inputSize="small"
                        aria-label={`${isEs ? "Necesito" : "Needed"} — ${
                          isEs ? item.labelEs : item.labelEn
                        }`}
                        className="w-16 text-center"
                        value={String(neededFor(item, count))}
                        onChange={(event) =>
                          checklist.setCount(item.id, {
                            needed: Number(event.target.value) || 0,
                          })
                        }
                      />
                      <span className="text-body-sm text-fg-muted">
                        {isEs ? "de" : "of"}
                      </span>
                      <Input
                        type="number"
                        min={0}
                        inputSize="small"
                        aria-label={`${isEs ? "Tengo" : "Have"} — ${
                          isEs ? item.labelEs : item.labelEn
                        }`}
                        className="w-16 text-center"
                        value={String(count?.have ?? 0)}
                        onChange={(event) =>
                          checklist.setCount(item.id, {
                            have: Number(event.target.value) || 0,
                          })
                        }
                      />
                      <Badge
                        tone={TONES[status]}
                        variant="soft"
                        className="w-20 justify-center"
                      >
                        {statusLabel(status, isEs)}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-stack-lg">
        <label
          htmlFor="supply-notes"
          className="mb-inline-sm block text-label-md text-fg-secondary"
        >
          {isEs ? "Notas" : "Notes"}
        </label>
        <textarea
          id="supply-notes"
          rows={2}
          maxLength={500}
          value={checklist.month.notes}
          onChange={(event) => checklist.setNotes(event.target.value)}
          placeholder={
            isEs
              ? "Qué pedir, fechas de caducidad..."
              : "What to order, expiry dates..."
          }
          className="w-full resize-none rounded-control border border-line bg-surface px-inset-sm py-inset-xs text-body-sm text-fg outline-none placeholder:text-fg-subtle focus:border-primary-soft-line focus:ring-2 focus:ring-ring/60"
        />
      </div>
    </Card>
  );
}
