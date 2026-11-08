"use client";

/* ==========================================================================
   Platform overview and notification analytics (Phase 14.9)
   --------------------------------------------------------------------------
   The only sourced numbers for the admin dashboard and the members page:
   - `GET /platform/reports/overview` (members READ): member count,
     subscriptions by status, organizations by type and status, active
     contracts, open support tickets;
   - `GET /platform/notifications/analytics` (campaigns READ): deliveries in
     the last 30 days (the server's default window, UTC days).
   A 403 is a state (no access), never a zero. Nothing is cached in the
   browser beyond TanStack Query's memory.
   ========================================================================== */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { platformKey } from "@/lib/data/queryKeys";

export type PlatformOverview = {
  members: number;
  memberSubscriptionsByStatus: { key: string; count: number }[];
  organizations: { type: string; status: string; count: number }[];
  activeContracts: number;
  openSupportTickets: number;
};

export type NotificationAnalytics = {
  from: string;
  to: string;
  total: number;
  byKind: { kind: string; count: number }[];
  byChannel: { channel: "IN_APP" | "EMAIL" | "SMS" | "PUSH"; count: number }[];
  byStatus: {
    status: "QUEUED" | "SENT" | "DELIVERED" | "FAILED" | "READ";
    count: number;
  }[];
  perDay: { day: string; count: number }[];
};

export function getPlatformOverview(): Promise<PlatformOverview> {
  return api<PlatformOverview>("/platform/reports/overview", {
    organizationId: null,
  });
}

export function getNotificationAnalytics(): Promise<NotificationAnalytics> {
  return api<NotificationAnalytics>("/platform/notifications/analytics", {
    organizationId: null,
  });
}

export function usePlatformOverview() {
  const query = useQuery({
    queryKey: platformKey("overview"),
    queryFn: getPlatformOverview,
  });
  return {
    data: query.data,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

export function useNotificationAnalytics() {
  const query = useQuery({
    queryKey: platformKey("notification-analytics", "last-30-days"),
    queryFn: getNotificationAnalytics,
  });
  return {
    data: query.data,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

/** READ / all deliveries, or null when nothing was delivered. */
export function readRate(analytics: NotificationAnalytics): number | null {
  if (analytics.total <= 0) return null;
  const read =
    analytics.byStatus.find((row) => row.status === "READ")?.count ?? 0;
  return read / analytics.total;
}

/** Deliveries on one channel in the window. */
export function channelCount(
  analytics: NotificationAnalytics,
  channel: NotificationAnalytics["byChannel"][number]["channel"],
): number {
  return analytics.byChannel.find((row) => row.channel === channel)?.count ?? 0;
}
