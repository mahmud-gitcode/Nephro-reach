"use client";

import React from "react";
import { PackageCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Badge, Card, Input, SectionTitle, Select } from "@/components/ui";
import { ShareLogCard } from "@/features/personal-log/ShareLogCard";
import { useSupplyChecklist } from "./useSupplyChecklist";
import {
  neededFor,
  statusAdvice,
  statusLabel,
  supplyGroupsFor,
  supplyStatus,
  toOrder,
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
  const monthLabel =
    months.find((m) => m.value === checklist.monthKey)?.label ??
    checklist.monthKey;

  return (
    <>
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

        {/* How to use it, said once (client, 2026-10-09: "the directions
          aren't clear"). Three steps, in the order the member does them. */}
        <ol className="mb-stack-md list-decimal space-y-stack-xs rounded-card-nested bg-surface-sunken py-inset-sm pr-inset-sm pl-8 text-body-sm text-fg-secondary">
          <li>
            {isEs
              ? "Una vez al mes, cuente lo que tiene en casa y escríbalo en «Tengo»."
              : "Once a month, count what you have at home and enter it under \u201cI have\u201d."}
          </li>
          <li>
            {isEs
              ? "«Necesito al mes» es lo que suele usar en un mes. Cámbielo si su clínica le indicó otra cantidad."
              : "\u201cNeed / month\u201d is what a typical month uses. Change it if your clinic gave you a different amount."}
          </li>
          <li>
            {isEs
              ? "Marque la casilla cuando haya contado el artículo. El estado le dice cuánto pedir."
              : "Tick the box once you have counted an item. The status tells you how many to order."}
          </li>
        </ol>

        {/* Where the month stands, in one line. Three numbers, no prose. */}
        <div className="mb-stack-md flex flex-wrap items-center gap-inline-md">
          <Badge tone="neutral" variant="soft">
            <PackageCheck aria-hidden="true" className="h-3.5 w-3.5" />
            {isEs ? "Contados" : "Counted"} {summary.checked}/{summary.total}
          </Badge>
          {summary.low > 0 ? (
            <Badge tone="warning" variant="soft">
              {isEs ? "Por pedir" : "To order"} {summary.low}
            </Badge>
          ) : null}
          {summary.missing > 0 ? (
            <Badge tone="danger" variant="soft">
              {isEs ? "Agotados" : "Out of stock"} {summary.missing}
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
                        aria-label={`${isEs ? "Contado" : "Counted"}: ${
                          isEs ? item.labelEs : item.labelEn
                        }`}
                        className="size-5 shrink-0 cursor-pointer accent-brand-600"
                      />

                      <label
                        htmlFor={`${inputId}-checked`}
                        className="min-w-32 flex-1 cursor-pointer text-body-sm text-fg"
                      >
                        {isEs ? item.labelEs : item.labelEn}
                      </label>

                      {/* "I have" first: it is the number the member types
                        each month. The month's figure follows, labelled,
                        so "20 of 0" can no longer read backwards. */}
                      <div className="flex items-end gap-inline-sm">
                        <label className="flex w-24 shrink-0 flex-col gap-0.5">
                          <span className="text-caption whitespace-nowrap text-fg-muted">
                            {isEs ? "Tengo" : "I have"}
                          </span>
                          <Input
                            type="number"
                            min={0}
                            inputSize="small"
                            className="w-full text-center"
                            value={String(count?.have ?? 0)}
                            onChange={(event) =>
                              checklist.setCount(item.id, {
                                have: Number(event.target.value) || 0,
                              })
                            }
                          />
                        </label>
                        <label className="flex w-24 shrink-0 flex-col gap-0.5">
                          <span className="text-caption whitespace-nowrap text-fg-muted">
                            {isEs ? "Al mes" : "Need / month"}
                          </span>
                          <Input
                            type="number"
                            min={0}
                            inputSize="small"
                            className="w-full text-center"
                            value={String(neededFor(item, count))}
                            onChange={(event) =>
                              checklist.setCount(item.id, {
                                needed: Number(event.target.value) || 0,
                              })
                            }
                          />
                        </label>
                        <Badge
                          tone={TONES[status]}
                          variant="soft"
                          className="mb-1.5 min-w-32 justify-center"
                        >
                          {statusAdvice(item, count, isEs)}
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

      {/* Send the month's list to the supplier, a caregiver or the care
        team (client, 2026-10-09: "it's also not shareable"). */}
      <ShareLogCard
        isEs={isEs}
        title={
          isEs
            ? `Mi lista de insumos — ${monthLabel}`
            : `My supply checklist — ${monthLabel}`
        }
        description={
          isEs
            ? "Envíe la lista de este mes a su proveedor de insumos, a un cuidador o a su equipo de atención."
            : "Send this month's list to your supply company, a caregiver or your care team."
        }
        fileName={`supply-checklist-${checklist.monthKey}`}
        table={{
          header: [
            "Category",
            "Item",
            "I have",
            "Need per month",
            "To order",
            "Status",
            "Counted",
          ],
          rows: groups.flatMap((group) =>
            group.items.map((item) => {
              const count = counts[item.id];
              return [
                isEs ? group.labelEs : group.labelEn,
                isEs ? item.labelEs : item.labelEn,
                count?.have ?? 0,
                neededFor(item, count),
                toOrder(item, count),
                statusLabel(supplyStatus(item, count), isEs),
                count?.checked ? "Yes" : "No",
              ];
            }),
          ),
        }}
      />
    </>
  );
}
