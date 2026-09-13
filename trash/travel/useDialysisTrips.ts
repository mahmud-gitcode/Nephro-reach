"use client";

import { useCallback, useMemo, useState } from "react";

export interface DialysisTrip {
  id: string;
  destination: string;
  /** ISO `YYYY-MM-DD`. */
  startDate: string;
  endDate: string;
  awayCenter: string;
  awayCenterPhone: string;
  /** Which preparation steps are ticked, keyed by step id. */
  checklist: Record<string, boolean>;
}

export type TripStatus = "planned" | "active" | "completed";

export const TRIP_CHECKLIST = [
  {
    id: "book",
    labelEn: "Book transient dialysis (4-6 weeks ahead)",
    labelEs: "Reservar diálisis transitoria (4-6 semanas antes)",
  },
  {
    id: "records",
    labelEn: "Send records to the away center",
    labelEs: "Enviar registros al centro de destino",
  },
  {
    id: "medications",
    labelEn: "Print current medication list",
    labelEs: "Imprimir la lista de medicamentos actual",
  },
  {
    id: "summary",
    labelEn: "Pack portable medical summary",
    labelEs: "Llevar el resumen médico portátil",
  },
];

const STORAGE_KEY = "nephroreach_dialysis_trips";

/** Local date as `YYYY-MM-DD`, avoiding the UTC shift of toISOString. */
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatTripDate(value: string, isEs: boolean): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  const months = isEs
    ? ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${months[month - 1]} ${year}`;
}

export function tripStatus(trip: DialysisTrip, todayKey: string): TripStatus {
  if (todayKey < trip.startDate) return "planned";
  if (todayKey > trip.endDate) return "completed";
  return "active";
}

/** Whole days between two date keys, inclusive of both ends. */
export function tripLengthDays(trip: DialysisTrip): number {
  const start = new Date(`${trip.startDate}T00:00:00`);
  const end = new Date(`${trip.endDate}T00:00:00`);
  const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return Number.isFinite(diff) ? Math.max(1, diff + 1) : 1;
}

export function isDateInTrip(trip: DialysisTrip, dateKey: string): boolean {
  return dateKey >= trip.startDate && dateKey <= trip.endDate;
}

/**
 * One seeded trip so the summary has something to show. It covers two of the
 * logged treatments, which is what makes them read as away sessions.
 */
function buildSeedTrips(): DialysisTrip[] {
  return [
    {
      id: "trip-seed-miami",
      destination: "Miami, FL",
      startDate: "2026-06-18",
      endDate: "2026-06-23",
      awayCenter: "Bayside Dialysis Center",
      awayCenterPhone: "(305) 555-0188",
      checklist: { book: true, records: true, medications: true, summary: true },
    },
  ];
}

function readStoredTrips(): DialysisTrip[] {
  if (typeof window === "undefined") return buildSeedTrips();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeedTrips();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return buildSeedTrips();
    return parsed as DialysisTrip[];
  } catch {
    return buildSeedTrips();
  }
}

function persistTrips(trips: DialysisTrip[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch {
    // Storage can be unavailable (private window, blocked site data). Trips
    // still work for this session rather than breaking the page.
  }
}

export function createTripId(): string {
  return `trip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Trips a member takes away from their home center.
 *
 * A trip's date range is what marks a treatment as an away session, so nothing
 * has to be flagged on the treatment record itself.
 */
export function useDialysisTrips() {
  const [trips, setTrips] = useState<DialysisTrip[]>(readStoredTrips);

  const commit = useCallback((next: DialysisTrip[]) => {
    const sorted = [...next].sort((a, b) =>
      a.startDate.localeCompare(b.startDate),
    );
    persistTrips(sorted);
    setTrips(sorted);
  }, []);

  const saveTrip = useCallback(
    (trip: DialysisTrip) => {
      const exists = trips.some((entry) => entry.id === trip.id);
      commit(
        exists
          ? trips.map((entry) => (entry.id === trip.id ? trip : entry))
          : [...trips, trip],
      );
    },
    [trips, commit],
  );

  const deleteTrip = useCallback(
    (tripId: string) => commit(trips.filter((entry) => entry.id !== tripId)),
    [trips, commit],
  );

  const toggleChecklistItem = useCallback(
    (tripId: string, itemId: string) => {
      commit(
        trips.map((entry) =>
          entry.id === tripId
            ? {
                ...entry,
                checklist: {
                  ...entry.checklist,
                  [itemId]: !entry.checklist[itemId],
                },
              }
            : entry,
        ),
      );
    },
    [trips, commit],
  );

  const todayKey = toDateKey(new Date());

  const activeTrip = useMemo(
    () => trips.find((trip) => isDateInTrip(trip, todayKey)) ?? null,
    [trips, todayKey],
  );

  const nextTrip = useMemo(
    () => trips.find((trip) => trip.startDate > todayKey) ?? null,
    [trips, todayKey],
  );

  const tripForDate = useCallback(
    (dateKey: string) =>
      trips.find((trip) => isDateInTrip(trip, dateKey)) ?? null,
    [trips],
  );

  return {
    trips,
    todayKey,
    activeTrip,
    nextTrip,
    tripForDate,
    saveTrip,
    deleteTrip,
    toggleChecklistItem,
  };
}
