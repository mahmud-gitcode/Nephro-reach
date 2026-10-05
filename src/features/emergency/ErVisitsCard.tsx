"use client";

import React from "react";
import { Alert, BarChart, Button, Card, Skeleton } from "@/components/ui";
import { useNow } from "@/lib/utils/useNow";
import {
  answerFor,
  monthKey,
  monthlyVisits,
  visitsIn,
  weekOf,
} from "./erVisits";
import { useErVisits } from "./useErVisits";

/* ==========================================================================
   ER Visit Tracking — the member's own box on Before the ER
   --------------------------------------------------------------------------
   This week's question, then the visits reported month by month. The same
   answer can come from the notification bell; either way it lands here,
   dated. A record of what the member reported, never advice.
   ========================================================================== */

const MONTHS_EN = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
const MONTHS_ES = "Ene Feb Mar Abr May Jun Jul Ago Sep Oct Nov Dic".split(" ");

function monthName(month: string, isEs: boolean) {
  const index = Number(month.slice(5, 7)) - 1;
  return (isEs ? MONTHS_ES : MONTHS_EN)[index] ?? month;
}

export function ErVisitsCard({ isEs }: { isEs: boolean }) {
  const now = useNow();
  const { log, isPending, answer, isSaving, saveError } = useErVisits();
  const thisWeek = answerFor(log, weekOf(now));
  const thisMonth = visitsIn(log, monthKey(now));
  const lastMonth = visitsIn(log, monthKey(now, 1));
  const months = monthlyVisits(log, now, 6);

  return (
    <Card as="section" padding="small" className="space-y-stack-md">
      <div>
        <h2 className="text-heading-4 text-fg">
          {isEs ? "Registro de Visitas a Urgencias" : "ER Visit Tracking"}
        </h2>
        <p className="mt-stack-xs text-body-sm text-fg-muted">
          {isEs
            ? "Su respuesta semanal, guardada con la fecha en que la reportó."
            : "Your weekly answer, saved with the date you reported it."}
        </p>
      </div>

      {saveError ? (
        <Alert tone="danger">
          {isEs
            ? "Su respuesta no se guardó. Inténtelo de nuevo."
            : "Your answer did not save. Try again."}
        </Alert>
      ) : null}

      {isPending ? (
        <Skeleton height={160} />
      ) : (
        <>
          <div className="flex flex-col gap-inline-md rounded-card-nested bg-surface-sunken p-inset-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-label-lg text-fg">
              {isEs
                ? "¿Ha ido a la sala de emergencias esta semana?"
                : "Have you been to the ER this week?"}
              {thisWeek ? (
                <span className="block text-caption font-normal text-fg-muted">
                  {isEs ? "Respondió: " : "You answered: "}
                  {thisWeek.answer === "yes" ? (isEs ? "Sí" : "Yes") : "No"}
                  {isEs
                    ? " · puede cambiar su respuesta"
                    : " · you can change your answer"}
                </span>
              ) : null}
            </p>
            <div className="flex shrink-0 gap-inline-sm">
              <Button
                size="small"
                variant={thisWeek?.answer === "yes" ? "primary" : "neutral"}
                appearance={thisWeek?.answer === "yes" ? "fill" : "fill-stroke"}
                aria-pressed={thisWeek?.answer === "yes"}
                disabled={isSaving}
                onClick={() => answer("yes")}
              >
                {isEs ? "Sí" : "Yes"}
              </Button>
              <Button
                size="small"
                variant={thisWeek?.answer === "no" ? "primary" : "neutral"}
                appearance={thisWeek?.answer === "no" ? "fill" : "fill-stroke"}
                aria-pressed={thisWeek?.answer === "no"}
                disabled={isSaving}
                onClick={() => answer("no")}
              >
                No
              </Button>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-inline-md">
            <div className="rounded-card-nested border border-line p-inset-sm">
              <dt className="text-caption text-fg-muted">
                {isEs ? "Este mes" : "This month"}
              </dt>
              <dd className="text-metric-sm text-fg tabular-nums">
                {thisMonth}
              </dd>
            </div>
            <div className="rounded-card-nested border border-line p-inset-sm">
              <dt className="text-caption text-fg-muted">
                {isEs ? "Mes pasado" : "Last month"}
              </dt>
              <dd className="text-metric-sm text-fg tabular-nums">
                {lastMonth}
              </dd>
            </div>
          </dl>

          <BarChart
            label={
              isEs
                ? "Visitas a urgencias reportadas por mes"
                : "ER visits reported per month"
            }
            bars={months.map((m) => ({
              label: monthName(m.month, isEs),
              value: m.visits,
            }))}
            yMax={Math.max(2, ...months.map((m) => m.visits))}
            yTicks={3}
            unit={isEs ? "visitas" : "visits"}
            height={160}
          />
        </>
      )}
    </Card>
  );
}
