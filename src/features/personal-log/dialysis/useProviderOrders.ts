"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listOrders, saveOrders } from "./orders.repository";
import type { ProviderOrder } from "../record/record.types";

export const ordersKey = ["dialysis", "provider-orders"] as const;

/** "yyyy-mm-ddTHH:MM" for a local time, as remindAt stores it. */
export function localStamp(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** Orders whose reminder time has come and that are not done yet
 *  (client, 2026-10-12: "what if they forget?"). */
export function ordersDue(orders: ProviderOrder[], now: Date): ProviderOrder[] {
  const stamp = localStamp(now);
  return orders.filter(
    (o) =>
      !o.completed && !o.reminderDone && !!o.remindAt && o.remindAt <= stamp,
  );
}

/** The member's provider orders and instructions. */
export function useProviderOrders() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ordersKey, queryFn: listOrders });
  const write = useMutation({
    mutationFn: async (
      transform: (current: ProviderOrder[]) => ProviderOrder[],
    ) => saveOrders(transform(await listOrders())),
    onSuccess: (orders) => queryClient.setQueryData(ordersKey, orders),
  });
  const { mutate } = write;
  const orders = useMemo(() => query.data ?? [], [query.data]);

  return {
    query,
    write,
    orders,
    mutate,
    toggle: useCallback(
      (id: string) =>
        mutate((current) =>
          current.map((order) =>
            order.id === id ? { ...order, completed: !order.completed } : order,
          ),
        ),
      [mutate],
    ),
    remove: useCallback(
      (id: string) => mutate((current) => current.filter((o) => o.id !== id)),
      [mutate],
    ),
    /** Stops the reminder without marking the order done. */
    dismissReminder: useCallback(
      (id: string) =>
        mutate((current) =>
          current.map((order) =>
            order.id === id ? { ...order, reminderDone: true } : order,
          ),
        ),
      [mutate],
    ),
  };
}
