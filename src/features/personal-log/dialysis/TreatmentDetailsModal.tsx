"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Button, Modal, buttonStyles } from "@/components/ui";
import type { IntervalRecord, TreatmentInterval } from "./treatment.types";

/* ==========================================================================
   TreatmentDetailsModal
   --------------------------------------------------------------------------
   The read-only summary of one treatment interval: the baselines it started
   from and the records logged against it. Lifted out of the dialysis
   management dashboard, where it was the third <Modal> inside an
   1,857-line component.

   It holds no state of its own, which is why it takes so few props — it
   shows what it is given and links out to the full view.
   ========================================================================== */

export function TreatmentDetailsModal({
  open,
  onClose,
  interval,
  records,
  viewHref,
}: {
  open: boolean;
  onClose: () => void;
  interval: TreatmentInterval;
  /** Every record; the modal picks out the ones for this interval. */
  records: IntervalRecord[];
  /** Where "View Full Details" goes. */
  viewHref: string;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title={interval.name}
      description={`${interval.startDate} – ${interval.endDate}`}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cerrar" : "Close"}
          </Button>
          <Link href={viewHref} className={buttonStyles()}>
            {isEs ? "Ver Detalles Completos" : "View Full Details"}
          </Link>
        </>
      }
    >
      {/* Baseline Metrics Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1 rounded-xl border border-line-subtle bg-surface-sunken p-3.5">
          <span className="block text-[11px] font-semibold tracking-wider text-fg-subtle uppercase">
            {isEs ? "Peso Post-Tx Previo" : "Previous Post-Weight"}
          </span>
          <h3 className="text-heading-5 text-fg">
            {interval.previousTxPostWeight} kg
          </h3>
        </div>
        <div className="space-y-1 rounded-xl border border-line-subtle bg-surface-sunken p-3.5">
          <span className="block text-[11px] font-semibold tracking-wider text-fg-subtle uppercase">
            {isEs ? "PA Post-Tx Previa" : "Previous Post-BP"}
          </span>
          <h3 className="text-heading-5 text-fg">
            {interval.previousTxPostBp}
          </h3>
        </div>
        <div className="space-y-1 rounded-xl border border-line-subtle bg-surface-sunken p-3.5">
          <span className="block text-[11px] font-semibold tracking-wider text-fg-subtle uppercase">
            {isEs ? "Peso Seco Objetivo" : "Target Dry Weight"}
          </span>
          <h3 className="text-heading-5 text-fg-brand">
            {interval.targetDryWeight.toFixed(1)} kg
          </h3>
        </div>
      </div>

      {/* Logged Interdialytic Records for this interval */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-fg">
          {isEs
            ? "Registros Registrados en este Intervalo"
            : "Logged Records in this Interval"}
        </h4>

        {records.filter((r) => r.intervalId === interval.id).length > 0 ? (
          <div className="space-y-2.5">
            {records
              .filter((r) => r.intervalId === interval.id)
              .map((rec) => (
                <div
                  key={rec.id}
                  className="space-y-2 rounded-xl border border-line bg-surface-sunken/40 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-fg">
                      {rec.date}
                    </span>
                    {rec.isExtraTreatment && (
                      <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-bold text-accent-800">
                        Extra Tx {rec.extraTreatmentNumber}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div>
                      <span className="block text-fg-subtle">
                        Morning Weight
                      </span>
                      <span className="font-bold text-fg-secondary">
                        {rec.morningWeight || "--"} kg
                      </span>
                    </div>
                    <div>
                      <span className="block text-fg-subtle">Fluid Gain</span>
                      <span className="font-bold text-fg-secondary">
                        +{rec.fluidGainedKg || "--"} kg
                      </span>
                    </div>
                    <div>
                      <span className="block text-fg-subtle">Home BP</span>
                      <span className="font-bold text-fg-secondary">
                        {rec.homeBp || "--"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-fg-subtle">Fluid Intake</span>
                      <span className="font-bold text-fg-secondary">
                        {rec.fluidOz || "--"} oz
                      </span>
                    </div>
                  </div>
                  {rec.notes && (
                    <p className="rounded-lg border border-line-subtle bg-surface p-2 text-xs text-fg-muted">
                      {rec.notes}
                    </p>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line p-6 text-center text-xs text-fg-subtle sm:text-sm">
            {isEs
              ? "Aún no hay registros para este intervalo de tratamiento."
              : "No records logged for this treatment interval yet."}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default TreatmentDetailsModal;
