"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardList, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { listOrders, saveOrders } from "./orders.repository";
import type { ProviderOrder } from "../record/record.types";
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

const ordersKey = ["dialysis", "provider-orders"] as const;

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
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ordersKey, queryFn: listOrders });

  const write = useMutation({
    mutationFn: async (
      transform: (current: ProviderOrder[]) => ProviderOrder[],
    ) => saveOrders(transform(await listOrders())),
    onSuccess: (orders) => queryClient.setQueryData(ordersKey, orders),
  });

  const { mutate, reset } = write;
  const orders = useMemo(() => query.data ?? [], [query.data]);

  /* Newest first: a member checking what they were told reads the most
     recent instruction, not the oldest one still on the list. */
  const sorted = useMemo(
    () => [...orders].sort((a, b) => b.date.localeCompare(a.date)),
    [orders],
  );

  const toggle = useCallback(
    (id: string) =>
      mutate((current) =>
        current.map((order) =>
          order.id === id ? { ...order, completed: !order.completed } : order,
        ),
      ),
    [mutate],
  );

  const remove = useCallback(
    (id: string) => mutate((current) => current.filter((o) => o.id !== id)),
    [mutate],
  );

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => todayIso());
  const [text, setText] = useState("");
  const [touched, setTouched] = useState(false);

  const add = () => {
    setTouched(true);
    if (text.trim().length === 0) return;

    mutate((current) => [
      {
        id: `ord-${Date.now().toString(36)}`,
        date,
        order: text.trim(),
        completed: false,
      },
      ...current,
    ]);
    setOpen(false);
    setText("");
    setTouched(false);
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
                    <TableCell className="leading-snug">{item.order}</TableCell>
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
          </div>
        </Modal>
      ) : null}
    </Card>
  );
}

export default ProviderOrdersSection;
