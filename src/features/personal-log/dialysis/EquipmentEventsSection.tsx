"use client";

import React, { useState } from "react";
import { Plus, Trash2, Wrench } from "lucide-react";
import {
  Alert,
  AsyncSection,
  Button,
  EmptyState,
  FormField,
  Input,
  Select,
  Skeleton,
} from "@/components/ui";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { toDay } from "@/lib/api/paging";
import { saveErrorText } from "@/features/profile/saveError";
import {
  EQUIPMENT_EVENT_KINDS,
  type EquipmentEventKind,
} from "./homeDialysis.mapper";
import { useEquipmentEvents } from "./useEquipmentEvents";
import { dialysisText } from "./dialysisText";

/* ==========================================================================
   Home machine maintenance history (Phase 7, new)
   --------------------------------------------------------------------------
   The member logs a disinfection, a filter change, a service visit or an
   alarm, with the day it happened and a short note. A disinfection or a
   filter change also moves the "last done" date above forward (the server
   does it). The last 90 days are listed, newest first.
   ========================================================================== */

/** Dictionary key of each kind (memberDialysis.equipment.kinds). */
const KIND_KEY: Record<EquipmentEventKind, string> = {
  disinfection: "disinfection",
  "filter-change": "filterChange",
  service: "service",
  alarm: "alarm",
};

export function EquipmentEventsSection({ isEs }: { isEs: boolean }) {
  const log = useEquipmentEvents();
  const lang = isEs ? "es" : "en";
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<EquipmentEventKind>("disinfection");
  const [performedOn, setPerformedOn] = useState(() => toDay(new Date()));
  const [notes, setNotes] = useState("");
  const t = (path: string, vars?: Record<string, string>) =>
    dialysisText(isEs, `equipment.${path}`, vars);
  const label = (k: EquipmentEventKind) => t(`kinds.${KIND_KEY[k]}`);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!performedOn) return;
    void log
      .add({ kind, performedOn, notes })
      .then(() => {
        setNotes("");
        setOpen(false);
      })
      .catch(() => {});
  };

  return (
    <section
      aria-labelledby="equipment-events-title"
      className="mt-stack-lg space-y-stack-sm border-t border-line pt-stack-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-inline-md">
        <h3 id="equipment-events-title" className="text-label-md text-fg">
          {t("title")}
        </h3>
        <Button
          size="small"
          variant="neutral"
          appearance="fill-stroke"
          leadingIcon={<Plus aria-hidden="true" />}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {t("add")}
        </Button>
      </div>

      {log.saveError ? (
        <Alert tone="danger" onDismiss={log.dismissSaveError}>
          {saveErrorText(log.saveError, lang)}
        </Alert>
      ) : null}

      {open ? (
        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-inline-md rounded-card-nested border border-line bg-surface p-inset-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end"
        >
          <FormField label={t("what")}>
            {(field) => (
              <Select
                {...field}
                selectSize="small"
                value={kind}
                onChange={(event) =>
                  setKind(event.target.value as EquipmentEventKind)
                }
              >
                {EQUIPMENT_EVENT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {label(k)}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField label={t("day")}>
            {(field) => (
              <Input
                {...field}
                type="date"
                inputSize="small"
                required
                max={toDay(new Date())}
                value={performedOn}
                onChange={(event) => setPerformedOn(event.target.value)}
              />
            )}
          </FormField>
          <FormField label={t("note")}>
            {(field) => (
              <Input
                {...field}
                inputSize="small"
                maxLength={1000}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            )}
          </FormField>
          <Button type="submit" size="small" disabled={log.isSaving}>
            {t("save")}
          </Button>
        </form>
      ) : null}

      <AsyncSection
        pending={log.isPending}
        error={log.error}
        onRetry={canRetry(log.error) ? log.refetch : undefined}
        errorTitle={errorTitleFor(log.error, t("loadFailed"), lang)}
        errorMessage={errorMessageFor(log.error, undefined, lang)}
        skeleton={<Skeleton height={80} />}
        isEmpty={log.events.length === 0}
        empty={
          <EmptyState
            icon={<Wrench aria-hidden="true" />}
            title={t("emptyTitle")}
            description={t("emptyBody")}
          />
        }
      >
        <ul className="space-y-stack-xs">
          {log.events.map((event) => (
            <li
              key={event.id}
              className="flex items-center justify-between gap-inline-md rounded-card-nested border border-line bg-surface px-inset-sm py-inset-xs"
            >
              <span className="min-w-0 text-body-sm text-fg">
                <span className="font-semibold">{label(event.kind)}</span>
                <span className="text-fg-muted tabular-nums">
                  {" "}
                  · {event.performedOn}
                </span>
                {event.notes ? (
                  <span className="block truncate text-fg-muted">
                    {event.notes}
                  </span>
                ) : null}
              </span>
              <Button
                size="small"
                variant="danger"
                appearance="stroke"
                iconOnly
                disabled={log.isSaving}
                onClick={() => log.remove(event.id)}
                aria-label={t("deleteLabel", {
                  kind: label(event.kind),
                  date: event.performedOn,
                })}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
        {log.hasMore ? (
          <Button
            size="small"
            variant="neutral"
            appearance="ghost"
            onClick={log.loadMore}
          >
            {dialysisText(isEs, "common.showMore")}
          </Button>
        ) : null}
      </AsyncSection>
    </section>
  );
}

export default EquipmentEventsSection;
