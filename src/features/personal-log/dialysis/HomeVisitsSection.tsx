"use client";

import React, { useState } from "react";
import { Bell, CalendarPlus, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  SectionTitle,
  Select,
} from "@/components/ui";
import { useHomeVisits } from "./useHomeVisits";
import {
  VISIT_PROVIDERS,
  VISIT_STATUSES,
  emptyVisitDraft,
  providerLabel,
  statusLabel,
  visitError,
  type HomeVisit,
  type HomeVisitDraft,
  type VisitProvider,
  type VisitStatus,
} from "./homeVisits";
import type { DialysisModalityLog } from "./useDialysisModality";

/* ==========================================================================
   Home visits
   --------------------------------------------------------------------------
   An appointment, so it belongs beside the schedule on the management tab
   rather than in the treatment log.

   Home members only. Somebody treated at a centre is already going to the
   unit; nobody is coming to them.
   ========================================================================== */

const STATUS_TONES: Record<VisitStatus, "info" | "success" | "warning"> = {
  scheduled: "info",
  completed: "success",
  missed: "warning",
};

function formatVisitDate(iso: string, time: string, isEs: boolean): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;

  const date = new Date(year, month - 1, day);
  const shown = date.toLocaleDateString(isEs ? "es" : "en", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return time ? `${shown} · ${time}` : shown;
}

export default function HomeVisitsSection({
  modalityLog,
}: {
  modalityLog: DialysisModalityLog;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const log = useHomeVisits();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<HomeVisit | null>(null);
  const [draft, setDraft] = useState<HomeVisitDraft>(() =>
    emptyVisitDraft(log.today),
  );

  // Nobody visits a member who goes to the unit — see the note above.
  if (!modalityLog.isHome) return null;

  const openNew = () => {
    setEditing(null);
    setDraft(emptyVisitDraft(log.today));
    setIsOpen(true);
  };

  const openEdit = (visit: HomeVisit) => {
    const { id: _id, ...rest } = visit;
    setEditing(visit);
    setDraft(rest);
    setIsOpen(true);
  };

  const error = visitError(draft, isEs);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (error) return;
    log.save(draft, editing?.id);
    setIsOpen(false);
  };

  const set = (patch: Partial<HomeVisitDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  return (
    <Card as="section" padding="small">
      <SectionTitle
        title={isEs ? "Visitas a Domicilio" : "Home Visits"}
        action={
          <Button size="small" onClick={openNew}>
            <CalendarPlus />
            <span>{isEs ? "Agregar Visita" : "Add Visit"}</span>
          </Button>
        }
      />

      {log.next ? (
        <Alert tone="info" className="mb-stack-md">
          {isEs ? "Próxima visita" : "Next visit"}:{" "}
          <strong>{formatVisitDate(log.next.date, log.next.time, isEs)}</strong>{" "}
          — {providerLabel(log.next.provider, isEs)}
        </Alert>
      ) : null}

      {log.ordered.length === 0 ? (
        <EmptyState
          title={isEs ? "Sin visitas" : "No visits yet"}
          description={
            isEs
              ? "Agrega la próxima visita de tu enfermera o biomédico."
              : "Add your next nurse or biomed visit."
          }
        />
      ) : (
        <ul className="space-y-inline-sm">
          {log.ordered.map((visit) => (
            <li
              key={visit.id}
              className="flex flex-wrap items-center gap-inline-md rounded-control border border-line bg-surface px-inset-sm py-inset-xs"
            >
              <button
                type="button"
                onClick={() => openEdit(visit)}
                className="min-w-0 flex-1 cursor-pointer text-left"
              >
                <span className="block truncate text-body-sm font-semibold text-fg">
                  {formatVisitDate(visit.date, visit.time, isEs)}
                </span>
                <span className="block truncate text-body-sm text-fg-muted">
                  {providerLabel(visit.provider, isEs)}
                  {visit.purpose ? ` · ${visit.purpose}` : ""}
                </span>
              </button>

              {visit.remind && visit.status === "scheduled" ? (
                <Bell
                  aria-label={isEs ? "Recordatorio activo" : "Reminder on"}
                  className="h-4 w-4 shrink-0 text-fg-muted"
                />
              ) : null}

              <Badge tone={STATUS_TONES[visit.status]} variant="soft">
                {statusLabel(visit.status, isEs)}
              </Badge>

              <button
                type="button"
                onClick={() => log.remove(visit.id)}
                aria-label={`${isEs ? "Eliminar visita" : "Delete visit"} — ${formatVisitDate(visit.date, visit.time, isEs)}`}
                className="cursor-pointer rounded-control p-1.5 text-fg-muted transition-colors hover:bg-danger-surface hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          editing
            ? isEs
              ? "Editar Visita"
              : "Edit Visit"
            : isEs
              ? "Agregar Visita"
              : "Add Visit"
        }
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setIsOpen(false)}
            >
              {isEs ? "Cancelar" : "Cancel"}
            </Button>
            <Button type="submit" form="home-visit-form" disabled={!!error}>
              {isEs ? "Guardar" : "Save"}
            </Button>
          </>
        }
      >
        <form
          id="home-visit-form"
          onSubmit={handleSubmit}
          className="space-y-stack-md"
        >
          <div className="grid grid-cols-1 gap-inline-md sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="visit-date"
                className="block text-label-md text-fg-secondary"
              >
                {isEs ? "Fecha" : "Date"}
              </label>
              <Input
                id="visit-date"
                type="date"
                inputSize="small"
                value={draft.date}
                onChange={(event) => set({ date: event.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="visit-time"
                className="block text-label-md text-fg-secondary"
              >
                {isEs ? "Hora" : "Time"}
              </label>
              <Input
                id="visit-time"
                type="time"
                inputSize="small"
                value={draft.time}
                onChange={(event) => set({ time: event.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="visit-provider"
                className="block text-label-md text-fg-secondary"
              >
                {isEs ? "Quién viene" : "Who is coming"}
              </label>
              <Select
                id="visit-provider"
                selectSize="small"
                value={draft.provider}
                onChange={(event) =>
                  set({ provider: event.target.value as VisitProvider })
                }
              >
                {VISIT_PROVIDERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {isEs ? option.labelEs : option.labelEn}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="visit-status"
                className="block text-label-md text-fg-secondary"
              >
                {isEs ? "Estado" : "Status"}
              </label>
              <Select
                id="visit-status"
                selectSize="small"
                value={draft.status}
                onChange={(event) =>
                  set({ status: event.target.value as VisitStatus })
                }
              >
                {VISIT_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {isEs ? option.labelEs : option.labelEn}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="visit-purpose"
              className="block text-label-md text-fg-secondary"
            >
              {isEs ? "Motivo" : "Purpose"}
            </label>
            <Input
              id="visit-purpose"
              inputSize="small"
              value={draft.purpose}
              onChange={(event) => set({ purpose: event.target.value })}
              placeholder={
                isEs ? "Revisión del sitio de salida" : "Exit site check"
              }
            />
          </div>

          <label className="flex cursor-pointer items-center gap-inline-md text-body-sm text-fg-secondary">
            <input
              type="checkbox"
              checked={draft.remind}
              onChange={(event) => set({ remind: event.target.checked })}
              className="h-4 w-4 cursor-pointer accent-[var(--color-brand-600)]"
            />
            {isEs ? "Recordarme el día anterior" : "Remind me the day before"}
          </label>

          {error ? <Alert tone="warning">{error}</Alert> : null}
        </form>
      </Modal>
    </Card>
  );
}
