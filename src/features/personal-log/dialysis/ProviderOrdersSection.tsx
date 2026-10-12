"use client";

import React, { useMemo, useState } from "react";
import { BellRing, Check, ClipboardList, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useProviderOrders } from "./useProviderOrders";
import {
  Alert,
  AsyncSection,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Modal,
  SectionTitle,
  Skeleton,
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
   Provider orders and instructions
   --------------------------------------------------------------------------
   What the care team has told the member to do. Part of Dialysis Management
   because it is prescribed, not performed.
   ========================================================================== */

function reminderLabel(stamp: string, isEs: boolean): string {
  const [date, time] = stamp.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = (time ?? "09:00").split(":").map(Number);
  return new Date(y, m - 1, d, h, min).toLocaleString(
    isEs ? "es-ES" : "en-US",
    { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
  );
}

function todayIso(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatOrderDate(
  iso: string,
  isEs: boolean,
): { day: string; date: string } {
  const [year, month, dayNum] = iso.split("-").map(Number);
  const parsed = new Date(year, (month ?? 1) - 1, dayNum ?? 1);
  if (Number.isNaN(parsed.getTime())) return { day: "", date: iso };

  const locale = isEs ? "es-ES" : "en-US";
  return {
    day: parsed.toLocaleDateString(locale, { weekday: "long" }),
    date: parsed.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
}

export function ProviderOrdersSection() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const { query, write, orders, mutate, toggle, remove } = useProviderOrders();
  const { reset } = write;

  /* Newest first: a member checking what they were told reads the most
     recent instruction, not the oldest one still on the list. */
  const sorted = useMemo(
    () => [...orders].sort((a, b) => b.date.localeCompare(a.date)),
    [orders],
  );

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => todayIso());
  const [text, setText] = useState("");
  const [touched, setTouched] = useState(false);
  /* "Do you want to set a reminder for it?" (client, 2026-10-12). */
  const [remind, setRemind] = useState(false);
  const [remindDate, setRemindDate] = useState(() => todayIso());
  const [remindTime, setRemindTime] = useState("09:00");

  const add = () => {
    setTouched(true);
    if (text.trim().length === 0) return;

    mutate((current) => [
      {
        id: `ord-${Date.now().toString(36)}`,
        date,
        order: text.trim(),
        completed: false,
        ...(remind ? { remindAt: `${remindDate}T${remindTime}` } : {}),
      },
      ...current,
    ]);
    setOpen(false);
    setText("");
    setTouched(false);
    setRemind(false);
  };

  return (
    <Card as="section">
      <SectionTitle
        title={
          isEs ? "Órdenes e Instrucciones" : "Provider Orders & Instructions"
        }
        action={
          <Button
            onClick={() => {
              setDate(todayIso());
              setText("");
              setTouched(false);
              setOpen(true);
            }}
          >
            <Plus aria-hidden="true" className="size-4 shrink-0" />
            {isEs ? "Nueva Orden" : "Add Order"}
          </Button>
        }
      />

      {write.error ? (
        <Alert tone="danger" className="mt-stack-md" onDismiss={reset}>
          {isEs
            ? "Ese cambio no se guardó. Tus órdenes no cambiaron."
            : "That change did not save. Your orders are unchanged."}
        </Alert>
      ) : null}

      <AsyncSection
        pending={query.isPending}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={sorted.length === 0}
        errorTitle={
          isEs ? "Tus órdenes no se cargaron" : "Your orders did not load"
        }
        skeleton={<Skeleton height={140} className="mt-stack-md" />}
        empty={
          <EmptyState
            className="mt-stack-md"
            icon={<ClipboardList aria-hidden="true" />}
            title={isEs ? "Sin órdenes todavía" : "No orders yet"}
            description={
              isEs
                ? "Anota lo que te indique tu enfermera o tu nefrólogo para no olvidarlo entre citas."
                : "Write down what your nurse or nephrologist tells you, so it is not lost between appointments."
            }
          />
        }
      >
        <Card padding="none" className="mt-stack-md overflow-hidden">
          <Table>
            <TableHead>
              <TableRow className="bg-surface-sunken">
                <TableHeaderCell className="w-28 sm:w-32">
                  {isEs ? "Día" : "Day"}
                </TableHeaderCell>
                <TableHeaderCell className="w-32 sm:w-36">
                  {isEs ? "Fecha" : "Date"}
                </TableHeaderCell>
                <TableHeaderCell>
                  {isEs ? "Orden / Instrucción" : "Order / Instruction"}
                </TableHeaderCell>
                <TableHeaderCell className="w-28 text-center">
                  {isEs ? "Completado" : "Completed"}
                </TableHeaderCell>
                <TableHeaderCell className="w-16" />
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((item) => {
                const { day, date: shown } = formatOrderDate(item.date, isEs);
                return (
                  <TableRow key={item.id}>
                    <TableCell emphasis className="whitespace-nowrap">
                      {day}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{shown}</TableCell>
                    <TableCell className="leading-snug">
                      {item.order}
                      {item.remindAt && !item.completed ? (
                        <span className="mt-stack-xs flex items-center gap-inline-xs text-caption text-fg-muted">
                          <BellRing
                            aria-hidden="true"
                            className="size-3.5 shrink-0"
                          />
                          {isEs ? "Recordatorio:" : "Reminder:"}{" "}
                          {reminderLabel(item.remindAt, isEs)}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      {/* A real checkbox role, so a screen reader announces
                          whether the order is done rather than "button". */}
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={item.completed}
                        aria-label={
                          isEs
                            ? `Marcar como completado: ${item.order}`
                            : `Mark completed: ${item.order}`
                        }
                        onClick={() => toggle(item.id)}
                        className={`inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-control-small border transition-colors duration-150 ease-standard select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                          item.completed
                            ? "border-primary-solid bg-primary-solid text-primary-on-solid"
                            : "border-line-strong bg-surface hover:border-fg-subtle"
                        }`}
                      >
                        {item.completed && (
                          <Check
                            aria-hidden="true"
                            className="h-3.5 w-3.5 stroke-[3]"
                          />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="small"
                        variant="danger"
                        appearance="stroke"
                        onClick={() => remove(item.id)}
                        aria-label={
                          isEs
                            ? `Eliminar orden: ${item.order}`
                            : `Delete order: ${item.order}`
                        }
                      >
                        <Trash2
                          aria-hidden="true"
                          className="size-4 shrink-0"
                        />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </AsyncSection>

      {open ? (
        <Modal
          open
          size="big"
          onClose={() => setOpen(false)}
          title={isEs ? "Agregar Nueva Orden" : "Add New Order"}
          footer={
            <div className="flex flex-wrap items-center justify-end gap-inline-md">
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setOpen(false)}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button onClick={add} disabled={write.isPending}>
                {isEs ? "Guardar" : "Save Order"}
              </Button>
            </div>
          }
        >
          <div className="space-y-stack-md">
            <FormField label={isEs ? "Fecha" : "Date"} required>
              {(props) => (
                <Input
                  {...props}
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="sm:w-[240px]"
                />
              )}
            </FormField>

            <FormField
              label={isEs ? "Orden / Instrucción" : "Order / Instruction"}
              required
              error={
                touched && text.trim().length === 0
                  ? isEs
                    ? "Escribe la instrucción."
                    : "Write the instruction."
                  : undefined
              }
            >
              {(props) => (
                <Textarea
                  {...props}
                  rows={3}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={
                    isEs
                      ? "Ej: Tomar el quelante con todas las comidas sólidas..."
                      : "e.g. Take phosphate binder with all solid meals..."
                  }
                />
              )}
            </FormField>

            <SwitchRow
              checked={remind}
              onChange={setRemind}
              title={isEs ? "Recordármelo" : "Set a reminder"}
              description={
                isEs
                  ? "Le avisaremos en Notificaciones, por si lo olvida."
                  : "We will remind you in Notifications, in case you forget."
              }
            />
            {remind ? (
              <div className="grid gap-stack-md sm:grid-cols-2">
                <FormField
                  label={isEs ? "Día del recordatorio" : "Reminder day"}
                >
                  {(props) => (
                    <Input
                      {...props}
                      type="date"
                      value={remindDate}
                      onChange={(event) => setRemindDate(event.target.value)}
                    />
                  )}
                </FormField>
                <FormField label={isEs ? "Hora" : "Time"}>
                  {(props) => (
                    <Input
                      {...props}
                      type="time"
                      value={remindTime}
                      onChange={(event) => setRemindTime(event.target.value)}
                    />
                  )}
                </FormField>
              </div>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </Card>
  );
}

export default ProviderOrdersSection;
