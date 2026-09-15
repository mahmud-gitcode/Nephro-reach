"use client";

import React, { useState } from "react";
import { CalendarCheck, CircleAlert, Pencil, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import CheckInForm from "@/features/personal-log/check-in/CheckInForm";
import { useCheckIns } from "@/features/personal-log/check-in/useCheckIns";
import {
  relativeDayLabel,
  todayIso,
} from "@/features/personal-log/check-in/checkIn.rules";
import { LOCALIZED_SYMPTOMS } from "@/features/personal-log/record/record.options";
import type {
  BetweenTreatmentCheckIn,
  CheckInFeeling,
} from "@/features/personal-log/check-in/checkIn.types";
import RecoveryTrendsCard from "@/features/personal-log/check-in/RecoveryTrendsCard";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  Skeleton,
} from "@/components/ui";

/* ==========================================================================
   Between Treatment Check-in
   --------------------------------------------------------------------------
   One screen, one question: how was this day. The member picks the day and
   says how it went.

   What it replaces asked them to place themselves inside a numbered gap —
   "Treatment 1 ➔ Treatment 2", "Day 2 (Interdialytic)" — laid out as fixed
   blocks that only lined up if nothing in the schedule had moved.
   ========================================================================== */

const FEELING_TONE: Record<CheckInFeeling, "success" | "warning" | "danger"> = {
  good: "success",
  okay: "warning",
  rough: "danger",
};

function feelingLabel(feeling: CheckInFeeling, isEs: boolean): string {
  if (feeling === "good") return isEs ? "Bien" : "Good";
  if (feeling === "okay") return isEs ? "Regular" : "Okay";
  return isEs ? "Mal" : "Rough";
}

/** Fourteen days as dots, gaps included, so a thin fortnight looks thin. */
function DayStrip({
  days,
  onPick,
}: {
  days: { date: string; entry: BetweenTreatmentCheckIn | null }[];
  onPick: (date: string) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  return (
    <div className="flex flex-wrap gap-inline-sm">
      {days.map(({ date, entry }) => {
        const tone = entry ? FEELING_TONE[entry.feeling] : null;
        const label = relativeDayLabel(date, isEs);

        return (
          <button
            key={date}
            type="button"
            onClick={() => onPick(date)}
            title={
              entry
                ? `${label} · ${feelingLabel(entry.feeling, isEs)}`
                : `${label} · ${isEs ? "sin registro" : "not logged"}`
            }
            aria-label={
              entry
                ? `${label}, ${feelingLabel(entry.feeling, isEs)}`
                : `${label}, ${isEs ? "sin registro" : "not logged"}`
            }
            className={`h-8 w-8 cursor-pointer rounded-control-small border text-label-sm transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              tone === "success"
                ? "border-success-line bg-success-surface text-success"
                : tone === "warning"
                  ? "border-warning-line bg-warning-surface text-warning"
                  : tone === "danger"
                    ? "border-danger-line bg-danger-surface text-danger"
                    : "border-dashed border-line-strong bg-canvas text-fg-subtle hover:bg-surface-sunken"
            }`}
          >
            {Number(date.slice(-2))}
          </button>
        );
      })}
    </div>
  );
}

function CheckInRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: BetweenTreatmentCheckIn;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  return (
    <li className="flex flex-col gap-inset-sm rounded-card border border-line bg-surface p-inset-md sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-inline-md">
          <p className="text-label-md text-fg">
            {relativeDayLabel(entry.date, isEs)}
          </p>
          <Badge tone={FEELING_TONE[entry.feeling]}>
            {feelingLabel(entry.feeling, isEs)}
          </Badge>
          {entry.missedTreatment ? (
            <Badge tone="danger" icon={<CircleAlert aria-hidden="true" />}>
              {isEs ? "Tratamiento perdido" : "Missed treatment"}
            </Badge>
          ) : null}
        </div>

        {entry.symptoms.length > 0 ? (
          <p className="mt-stack-xs text-body-sm text-fg-secondary">
            {entry.symptoms
              .map((symptom) =>
                isEs ? LOCALIZED_SYMPTOMS[symptom] || symptom : symptom,
              )
              .join(", ")}
          </p>
        ) : (
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            {isEs ? "Sin síntomas registrados" : "No symptoms logged"}
          </p>
        )}

        {entry.notes.trim() ? (
          <p className="mt-stack-xs line-clamp-2 text-body-sm text-fg-muted">
            {entry.notes}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-inline-md">
        <Button
          size="small"
          variant="neutral"
          appearance="fill-stroke"
          onClick={onEdit}
        >
          <Pencil aria-hidden="true" className="size-4 shrink-0" />
          {isEs ? "Editar" : "Edit"}
        </Button>
        <Button
          size="small"
          variant="danger"
          appearance="stroke"
          onClick={onDelete}
          aria-label={isEs ? "Eliminar registro" : "Delete check-in"}
        >
          <Trash2 aria-hidden="true" className="size-4 shrink-0" />
        </Button>
      </div>
    </li>
  );
}

export default function BetweenTreatmentPage() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const {
    entries,
    summary,
    recentDays,
    getByDate,
    saveCheckIn,
    deleteCheckIn,
    isPending,
    error,
    refetch,
    saveError,
    dismissSaveError,
    isSaving,
  } = useCheckIns();

  /* The date being written, or null when the form is closed. Holding a date
     rather than a boolean is what makes tapping any day in the strip open
     that day — new or already written. */
  const [openDate, setOpenDate] = useState<string | null>(null);

  const openEntry = openDate ? getByDate(openDate) : undefined;
  const [pendingDelete, setPendingDelete] =
    useState<BetweenTreatmentCheckIn | null>(null);

  const handleSave = (entry: BetweenTreatmentCheckIn) => {
    saveCheckIn(entry);
    setOpenDate(null);
  };

  return (
    <div className="space-y-stack-lg">
      <div className="flex flex-col gap-inline-md sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-heading-1 text-fg">
            {isEs ? "Más Allá del Sillón" : "Beyond the Chair"}
          </h1>
          <p className="mt-stack-xs measure text-body-md text-fg-muted">
            {isEs
              ? "Registra cómo te sientes, cómo te recuperas y cómo cuidas tu salud entre tratamientos de diálisis."
              : "Track how you feel, recover, and manage your health between dialysis treatments."}
          </p>
        </div>

        <Button onClick={() => setOpenDate(todayIso())}>
          <Plus aria-hidden="true" className="size-4 shrink-0" />
          {isEs ? "Registrar hoy" : "Check in for today"}
        </Button>
      </div>

      {saveError ? (
        <Alert
          tone="danger"
          title={
            isEs ? "No se guardó tu registro" : "Your check-in did not save"
          }
          onDismiss={dismissSaveError}
        >
          {isEs
            ? "Nada se perdió de la pantalla. Inténtalo de nuevo."
            : "Nothing was lost from the screen. Please try again."}
        </Alert>
      ) : null}

      <AsyncSection
        pending={isPending}
        error={error}
        onRetry={refetch}
        errorTitle={
          isEs ? "Tus registros no se cargaron" : "Your check-ins did not load"
        }
        skeleton={
          <Card className="flex flex-col gap-stack-md">
            <Skeleton height={40} />
            <Skeleton height={96} />
            <Skeleton height={96} />
          </Card>
        }
      >
        <div className="space-y-stack-lg">
          <Card className="space-y-stack-md">
            <div className="flex flex-wrap items-baseline justify-between gap-inline-md">
              <h2 className="text-heading-5 text-fg">
                {isEs ? "Últimos 14 días" : "Last 14 days"}
              </h2>
              <p className="text-body-sm text-fg-muted">
                {isEs
                  ? `${summary.logged} registrados · racha de ${summary.streak}`
                  : `${summary.logged} logged · ${summary.streak}-day streak`}
              </p>
            </div>

            <DayStrip days={recentDays} onPick={setOpenDate} />

            {summary.missedTreatments > 0 ? (
              <p className="text-body-sm text-danger">
                {isEs
                  ? `${summary.missedTreatments} tratamiento(s) perdido(s) registrado(s)`
                  : `${summary.missedTreatments} missed treatment(s) logged`}
              </p>
            ) : null}
            {summary.topSymptom ? (
              <p className="text-body-sm text-fg-muted">
                {isEs ? "Más frecuente: " : "Most often: "}
                {isEs
                  ? LOCALIZED_SYMPTOMS[summary.topSymptom] || summary.topSymptom
                  : summary.topSymptom}
              </p>
            ) : null}
          </Card>

          {entries.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck aria-hidden="true" />}
              title={isEs ? "Aún no hay registros" : "No check-ins yet"}
              description={
                isEs
                  ? "Registra cómo te sientes entre tratamientos. Con unos días, el patrón le dice mucho más a tu equipo que un solo mal día."
                  : "Log how you feel between treatments. After a few days the pattern tells your team far more than one bad day does."
              }
              action={
                <Button onClick={() => setOpenDate(todayIso())}>
                  <Plus aria-hidden="true" className="size-4 shrink-0" />
                  {isEs ? "Registrar hoy" : "Check in for today"}
                </Button>
              }
            />
          ) : (
            <ul className="space-y-stack-sm">
              {entries.map((entry) => (
                <CheckInRow
                  key={entry.date}
                  entry={entry}
                  onEdit={() => setOpenDate(entry.date)}
                  onDelete={() => setPendingDelete(entry)}
                />
              ))}
            </ul>
          )}
        </div>
      </AsyncSection>

      <RecoveryTrendsCard entries={entries} />

      <PersonalLogDisclaimer />

      {openDate ? (
        /* `key` remounts the form when the day changes, so the fields hold
           the day that was opened rather than the one before it. */
        <CheckInForm
          key={openDate}
          entry={openEntry ?? undefined}
          onSave={handleSave}
          onCancel={() => setOpenDate(null)}
          saving={isSaving}
        />
      ) : null}

      {pendingDelete ? (
        <Modal
          open
          size="small"
          closeOnBackdrop={false}
          onClose={() => setPendingDelete(null)}
          title={isEs ? "¿Eliminar este registro?" : "Delete this check-in?"}
          description={
            isEs
              ? `Se eliminará lo que anotaste para ${relativeDayLabel(pendingDelete.date, true)}. No se puede deshacer.`
              : `What you wrote for ${relativeDayLabel(pendingDelete.date, false)} will be removed. This cannot be undone.`
          }
          footer={
            <div className="flex flex-wrap items-center justify-end gap-inline-md">
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setPendingDelete(null)}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  deleteCheckIn(pendingDelete.date);
                  setPendingDelete(null);
                }}
              >
                {isEs ? "Eliminar" : "Delete"}
              </Button>
            </div>
          }
        />
      ) : null}
    </div>
  );
}
