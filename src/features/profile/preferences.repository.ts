/* ==========================================================================
   Account preferences (Phase 4): `GET/PUT /me/preferences`,
   `POST /me/preferences/tour-completed`
   --------------------------------------------------------------------------
   Preferences belong to the signed-in account, not to a patient, so they
   are read without a patient id and cached under ["me", "preferences"].
   A caregiver changes only their own. The notification toggles are on the
   same row (spec 020, decision D21 open) and are not written from here.
   ========================================================================== */

import { api } from "@/lib/api/client";
import type { QuickActionId } from "@/features/dashboard/quickActions";

export type FluidUnitPref = "oz" | "ml";

/** `GET /me/preferences` (only the fields the client reads). */
export type Preferences = {
  quickActions: QuickActionId[];
  fluidUnit: FluidUnitPref;
  tourCompletedAt: string | null;
};

export type PreferencesPatch = {
  quickActions?: QuickActionId[];
  fluidUnit?: FluidUnitPref;
};

export const preferencesKey = ["me", "preferences"] as const;

/** The server's row, trimmed to what the screens read. */
export function fromApiPreferences(raw: unknown): Preferences {
  const row = (raw ?? {}) as Partial<Record<keyof Preferences, unknown>>;
  return {
    quickActions: Array.isArray(row.quickActions)
      ? (row.quickActions.filter(
          (id) => typeof id === "string",
        ) as QuickActionId[])
      : [],
    fluidUnit: row.fluidUnit === "ml" ? "ml" : "oz",
    tourCompletedAt:
      typeof row.tourCompletedAt === "string" ? row.tourCompletedAt : null,
  };
}

export async function getPreferences(): Promise<Preferences> {
  return fromApiPreferences(await api<unknown>("/me/preferences"));
}

/** Sends only the fields that change. */
export async function updatePreferences(
  patch: PreferencesPatch,
): Promise<Preferences> {
  return fromApiPreferences(
    await api<unknown>("/me/preferences", { method: "PUT", body: patch }),
  );
}

export async function completeTour(): Promise<void> {
  await api<unknown>("/me/preferences/tour-completed", { method: "POST" });
}
