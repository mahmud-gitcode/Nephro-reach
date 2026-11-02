"use client";

import React from "react";
import { CalendarPlus, Trash2 } from "lucide-react";
import { Alert, Button, Card, EmptyState, SectionTitle } from "@/components/ui";
import { saveErrorText } from "@/features/profile/saveError";
import { formatFullDate, fromDateKey } from "./schedule";
import type { useExtraTreatments } from "./useExtraTreatments";
import { dialysisText } from "./dialysisText";

/* ==========================================================================
   Extra (unscheduled) treatments: the list (Phase 7)
   --------------------------------------------------------------------------
   The Take Extra Treatment form existed with nowhere to see what it saved
   (the sessions were page state). They are on the server now: listed here,
   newest window around today, added through the existing form and removed
   one at a time. The server has no edit, so there is none here either.
   ========================================================================== */

/** Dictionary key of each reason the server stores
 *  (memberDialysis.extras.reasons); anything else is shown as stored. */
const REASON_KEY: Record<string, string> = {
  "Fluid Overload": "fluidOverload",
  "High Potassium": "highPotassium",
  "Doctor Order": "doctorOrder",
  "Missed Session": "missedSession",
};

export function ExtraTreatmentsList({
  log,
  onAdd,
  isEs,
}: {
  log: ReturnType<typeof useExtraTreatments>;
  onAdd: () => void;
  isEs: boolean;
}) {
  const t = (path: string, vars?: Record<string, string>) =>
    dialysisText(isEs, `extras.${path}`, vars);
  return (
    <Card as="section" padding="small">
      <SectionTitle
        title={t("title")}
        action={
          <Button size="small" onClick={onAdd} disabled={log.isSaving}>
            <CalendarPlus aria-hidden="true" />
            {t("take")}
          </Button>
        }
      />

      {log.saveError ? (
        <Alert
          tone="danger"
          className="mb-stack-md"
          onDismiss={log.dismissSaveError}
        >
          {saveErrorText(log.saveError, isEs ? "es" : "en")}
        </Alert>
      ) : null}

      {log.extras.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyBody")} />
      ) : (
        <ul className="space-y-stack-sm">
          {log.extras.map((extra) => {
            const when = formatFullDate(fromDateKey(extra.dateKey), isEs);
            const reasonKey = REASON_KEY[extra.reason];
            const reason = reasonKey ? t(`reasons.${reasonKey}`) : extra.reason;
            return (
              <li
                key={extra.id}
                className="flex items-start justify-between gap-inline-md rounded-card-nested border border-line bg-surface p-inset-sm"
              >
                <div className="min-w-0">
                  <p className="text-label-md text-fg">{when}</p>
                  <p className="text-body-sm text-fg-secondary">{reason}</p>
                  {extra.notes ? (
                    <p className="text-body-sm text-fg-muted">{extra.notes}</p>
                  ) : null}
                </div>
                <Button
                  size="small"
                  variant="danger"
                  appearance="stroke"
                  iconOnly
                  disabled={log.isSaving}
                  onClick={() => log.remove(extra.id)}
                  aria-label={t("deleteLabel", { date: when })}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {log.hasMore ? (
        <Button
          size="small"
          variant="neutral"
          appearance="ghost"
          className="mt-stack-sm"
          onClick={log.loadMore}
        >
          {dialysisText(isEs, "common.showMore")}
        </Button>
      ) : null}
    </Card>
  );
}

export default ExtraTreatmentsList;
