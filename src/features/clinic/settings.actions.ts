/* ==========================================================================
   Office settings: the data-sharing choices and the settings export
   (Phase 14)
   --------------------------------------------------------------------------
   The sharing choices are three office settings on the server
   (shareUsageAnalytics, shareOutcomes, shareResearch). The JSON export is
   built in the browser from what the page read from the API: the office
   profile and settings, and the staff list (names, emails, roles and
   statuses only; no patient data and no secret). It is a client-built file,
   not a server-audited export.
   ========================================================================== */

import type { ClinicSettings, SharingState } from "./settings.data";

export const SHARING_OPTIONS = [
  {
    id: "analytics",
    label: "Usage analytics",
    note: "Anonymous counts of which pages your office uses.",
  },
  {
    id: "outcomes",
    label: "Aggregate outcomes",
    note: "De-identified education outcomes, pooled across clinics.",
  },
  {
    id: "research",
    label: "Research partnerships",
    note: "De-identified data shared with named research partners.",
  },
] as const;

export type SharingId = (typeof SHARING_OPTIONS)[number]["id"] &
  keyof SharingState;

/** Everything this office has set, as JSON (no patient data). */
export function exportDocument(
  settings: ClinicSettings,
  exportedAt = new Date(),
  /** The office's staff (Staff & Roles). Never a password or a secret. */
  staff: Array<{
    name: string;
    email: string;
    role: string;
    status: string;
  }> = [],
): string {
  return JSON.stringify(
    {
      exportedAt: exportedAt.toISOString(),
      source: "NephroReach office portal",
      profile: settings.profile,
      notifications: settings.notifications,
      office: settings.office,
      sharing: settings.sharing,
      staff: staff.map(({ name, email, role, status }) => ({
        name,
        email,
        role,
        status,
      })),
    },
    null,
    2,
  );
}

/** The filename a downloaded export lands under, dated so two do not clash. */
export function exportFilename(exportedAt = new Date()): string {
  return `nephroreach-settings-${exportedAt.toISOString().slice(0, 10)}.json`;
}
