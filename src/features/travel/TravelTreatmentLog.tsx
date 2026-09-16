"use client";

import React, { useState } from "react";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { todayIso } from "./trip.rules";
import type { TripRequest } from "./trip.types";
import {
  canSaveTreatment,
  emptyTreatment,
  treatmentError,
  treatmentProgress,
} from "./travelTreatment.rules";
import type { TravelTreatment } from "./travelTreatment.types";
import { useTravelTreatments } from "./useTravelTreatments";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Modal,
  SwitchRow,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Textarea,
} from "@/components/ui";

/* ==========================================================================
   Travel Dialysis Log
   --------------------------------------------------------------------------
   What actually happened in the chair, one row per treatment, for the trip
   the member is on.

   A member treating away from home has no history at that unit: nobody there
   knows their usual post weight or what their pressure normally runs. This is
   the record they carry between units and bring home afterwards, so every
   column is something a nurse would ask for, and nothing here is required
   except the day it happened.
   ========================================================================== */

/** The editor. One treatment, all of it optional except the date. */
function TreatmentForm({
  treatment,
  onSave,
  onCancel,
  saving,
}: {
  treatment: TravelTreatment;
  onSave: (treatment: TravelTreatment) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [draft, setDraft] = useState(treatment);
  const set = (patch: Partial<TravelTreatment>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const error = treatmentError(draft);

  /* Every clinical field goes through here: an empty box means "not
     recorded", which is different from a recorded zero. */
  const optional = (value: string) => value || undefined;

  return (
    <Modal
      open
      size="wide"
      onClose={onCancel}
      title={isEs ? "Tratamiento en viaje" : "Travel treatment"}
      description={
        isEs
          ? "Anota lo que te dijeron en la unidad. Todo menos el día es opcional."
          : "Write down what the unit told you. Everything except the day is optional."
      }
      footer={
        <div className="flex flex-wrap items-center justify-end gap-inline-md">
          <Button variant="neutral" appearance="fill-stroke" onClick={onCancel}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            disabled={!canSaveTreatment(draft) || saving}
            onClick={() =>
              onSave({ ...draft, savedAt: new Date().toISOString() })
            }
          >
            {saving
              ? isEs
                ? "Guardando…"
                : "Saving…"
              : isEs
                ? "Guardar tratamiento"
                : "Save treatment"}
          </Button>
        </div>
      }
    >
      <div className="space-y-stack-md">
        <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
          <FormField
            label={isEs ? "Fecha" : "Date"}
            error={
              error === "future-date"
                ? isEs
                  ? "Ese día aún no ha llegado."
                  : "That day has not happened yet."
                : error === "invalid-date"
                  ? isEs
                    ? "Elige un día válido."
                    : "Pick a valid day."
                  : undefined
            }
          >
            {(props) => (
              <Input
                {...props}
                type="date"
                value={draft.date}
                max={todayIso()}
                onChange={(event) => set({ date: event.target.value })}
              />
            )}
          </FormField>

          <FormField label={isEs ? "Centro" : "Facility"}>
            {(props) => (
              <Input
                {...props}
                value={draft.facilityName}
                onChange={(event) => set({ facilityName: event.target.value })}
                placeholder={isEs ? "Nombre de la unidad" : "Name of the unit"}
              />
            )}
          </FormField>

          <FormField
            label={isEs ? "Peso antes" : "Pre-weight"}
            optionalLabel={isEs ? "opcional" : "optional"}
          >
            {(props) => (
              <Input
                {...props}
                value={draft.preWeight ?? ""}
                onChange={(event) =>
                  set({ preWeight: optional(event.target.value) })
                }
                placeholder="97.5"
              />
            )}
          </FormField>

          <FormField
            label={isEs ? "Peso después" : "Post-weight"}
            optionalLabel={isEs ? "opcional" : "optional"}
          >
            {(props) => (
              <Input
                {...props}
                value={draft.postWeight ?? ""}
                onChange={(event) =>
                  set({ postWeight: optional(event.target.value) })
                }
                placeholder="95.1"
              />
            )}
          </FormField>

          <FormField
            label={isEs ? "Presión arterial" : "Blood pressure"}
            optionalLabel={isEs ? "opcional" : "optional"}
            hint={isEs ? "Por ejemplo 142/78" : "For example 142/78"}
          >
            {(props) => (
              <Input
                {...props}
                value={draft.bloodPressure ?? ""}
                onChange={(event) =>
                  set({ bloodPressure: optional(event.target.value) })
                }
                placeholder="142/78"
              />
            )}
          </FormField>

          <FormField
            label={isEs ? "Duración" : "Treatment time"}
            optionalLabel={isEs ? "opcional" : "optional"}
          >
            {(props) => (
              <Input
                {...props}
                value={draft.treatmentTime ?? ""}
                onChange={(event) =>
                  set({ treatmentTime: optional(event.target.value) })
                }
                placeholder={isEs ? "3.5 h" : "3.5 hrs"}
              />
            )}
          </FormField>

          <FormField
            label={isEs ? "Líquido retirado (L)" : "Fluid removed (L)"}
            optionalLabel={isEs ? "opcional" : "optional"}
          >
            {(props) => (
              <Input
                {...props}
                value={draft.fluidRemoved ?? ""}
                onChange={(event) =>
                  set({ fluidRemoved: optional(event.target.value) })
                }
                placeholder="2.4"
              />
            )}
          </FormField>
        </div>

        {/* Its own control, not an inference from blank numbers: a run cut
          short is the most useful thing on this log for the team at home. */}
        <SwitchRow
          checked={draft.completed}
          onChange={(checked) => set({ completed: checked })}
          title={
            isEs ? "Completé este tratamiento" : "I completed this treatment"
          }
          description={
            isEs
              ? "Si terminó antes de tiempo, déjalo apagado y cuéntalo en las notas."
              : "If it ended early, leave this off and say what happened in the notes."
          }
        />

        <FormField
          label={isEs ? "Notas" : "Notes"}
          optionalLabel={isEs ? "opcional" : "optional"}
        >
          {(props) => (
            <Textarea
              {...props}
              rows={3}
              value={draft.notes}
              onChange={(event) => set({ notes: event.target.value })}
              placeholder={
                isEs
                  ? "Cómo fue, qué te dijeron, algo distinto de lo habitual."
                  : "How it went, what they told you, anything different from usual."
              }
            />
          )}
        </FormField>
      </div>
    </Modal>
  );
}

export function TravelTreatmentLog({ trip }: { trip: TripRequest }) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const { forTrip, saveTreatment, deleteTreatment, isSaving } =
    useTravelTreatments();

  const rows = forTrip(trip.id);
  const progress = treatmentProgress(rows, trip);

  const [editing, setEditing] = useState<TravelTreatment | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TravelTreatment | null>(
    null,
  );

  const openNew = () =>
    setEditing(emptyTreatment(trip.id, trip.placement?.facilityName ?? ""));

  /* An unrecorded number is a dash, never a zero — the two mean opposite
     things to whoever reads this next. */
  const cell = (value?: string) => value?.trim() || "—";

  return (
    <>
      <Card as="section" aria-labelledby="travel-treatment-log">
        <div className="flex flex-wrap items-start justify-between gap-inline-lg">
          <div className="flex items-start gap-inline-md">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card border border-primary-soft-line bg-primary-soft text-fg-brand"
            >
              <ClipboardList className="h-5 w-5" />
            </span>
            <div>
              <h3 id="travel-treatment-log" className="text-heading-5 text-fg">
                {isEs ? "Registro de Tratamientos" : "Travel Dialysis Log"}
              </h3>
              <p className="mt-stack-xs text-body-sm text-fg-muted">
                {isEs
                  ? "Registra tus tratamientos mientras estás fuera."
                  : "Track your treatments while away."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-inline-md">
            <Badge tone={progress.incomplete > 0 ? "warning" : "neutral"}>
              {isEs
                ? `${progress.logged} de ${progress.expected} registrados`
                : `${progress.logged} of ${progress.expected} logged`}
            </Badge>
            <Button size="small" onClick={openNew}>
              <Plus aria-hidden="true" className="size-4 shrink-0" />
              {isEs ? "Añadir tratamiento" : "Add Treatment"}
            </Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="mt-stack-md">
            <EmptyState
              icon={<ClipboardList aria-hidden="true" />}
              title={
                isEs ? "Aún no hay tratamientos" : "No treatments logged yet"
              }
              description={
                isEs
                  ? "Después de cada sesión, anota tu peso, la presión y el líquido retirado. Es el historial que llevas a la siguiente unidad."
                  : "After each session, note your weights, pressure and fluid removed. This is the history you carry to the next unit."
              }
              action={
                <Button onClick={openNew}>
                  <Plus aria-hidden="true" className="size-4 shrink-0" />
                  {isEs ? "Añadir tratamiento" : "Add Treatment"}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-stack-md overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{isEs ? "Fecha" : "Date"}</TableHeaderCell>
                  <TableHeaderCell>
                    {isEs ? "Centro" : "Facility"}
                  </TableHeaderCell>
                  <TableHeaderCell>
                    {isEs ? "Peso antes" : "Pre-weight"}
                  </TableHeaderCell>
                  <TableHeaderCell>
                    {isEs ? "Peso después" : "Post-weight"}
                  </TableHeaderCell>
                  <TableHeaderCell>{isEs ? "Presión" : "BP"}</TableHeaderCell>
                  <TableHeaderCell>
                    {isEs ? "Duración" : "Time"}
                  </TableHeaderCell>
                  <TableHeaderCell>
                    {isEs ? "Líquido (L)" : "Fluid (L)"}
                  </TableHeaderCell>
                  <TableHeaderCell>
                    {isEs ? "Completado" : "Completed"}
                  </TableHeaderCell>
                  <TableHeaderCell>{isEs ? "Notas" : "Notes"}</TableHeaderCell>
                  <TableHeaderCell>
                    <span className="sr-only">
                      {isEs ? "Acciones" : "Actions"}
                    </span>
                  </TableHeaderCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{cell(row.facilityName)}</TableCell>
                    <TableCell>{cell(row.preWeight)}</TableCell>
                    <TableCell>{cell(row.postWeight)}</TableCell>
                    <TableCell>{cell(row.bloodPressure)}</TableCell>
                    <TableCell>{cell(row.treatmentTime)}</TableCell>
                    <TableCell>{cell(row.fluidRemoved)}</TableCell>
                    <TableCell>
                      <Badge tone={row.completed ? "success" : "warning"}>
                        {row.completed
                          ? isEs
                            ? "Sí"
                            : "Yes"
                          : isEs
                            ? "Incompleto"
                            : "Cut short"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-2 max-w-[220px]">
                        {cell(row.notes)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-inline-sm">
                        <Button
                          size="small"
                          variant="neutral"
                          appearance="fill-stroke"
                          onClick={() => setEditing(row)}
                        >
                          {isEs ? "Editar" : "Edit"}
                        </Button>
                        <Button
                          size="small"
                          variant="danger"
                          appearance="stroke"
                          onClick={() => setPendingDelete(row)}
                          aria-label={
                            isEs ? "Eliminar tratamiento" : "Delete treatment"
                          }
                        >
                          <Trash2
                            aria-hidden="true"
                            className="size-4 shrink-0"
                          />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {editing ? (
        <TreatmentForm
          key={editing.id}
          treatment={editing}
          saving={isSaving}
          onCancel={() => setEditing(null)}
          onSave={(treatment) => {
            saveTreatment(treatment);
            setEditing(null);
          }}
        />
      ) : null}

      {pendingDelete ? (
        <Modal
          open
          size="small"
          closeOnBackdrop={false}
          onClose={() => setPendingDelete(null)}
          title={
            isEs ? "¿Eliminar este tratamiento?" : "Delete this treatment?"
          }
          description={
            isEs
              ? `Se eliminará lo que anotaste del ${pendingDelete.date}. No se puede deshacer.`
              : `What you logged for ${pendingDelete.date} will be removed. This cannot be undone.`
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
                  deleteTreatment(pendingDelete.id);
                  setPendingDelete(null);
                }}
              >
                {isEs ? "Eliminar" : "Delete"}
              </Button>
            </div>
          }
        />
      ) : null}
    </>
  );
}

export default TravelTreatmentLog;
