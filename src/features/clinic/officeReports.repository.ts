/* ==========================================================================
   Office reports: one function per server operation (Phase 14; ADR 0007)
   --------------------------------------------------------------------------
   GET /organizations/:org/reports/<report> returns aggregate counts only
   (no names, no MRNs). GET /organizations/:org/reports/<report>/export
   returns the same counts as a CSV file; the server writes an audit row for
   every download (it appears in the office's activity log), so an export is
   never built in the browser from patient rows.

   The export answers with a file, not the JSON envelope, so it is read with
   fetch directly (same origin rules, cookies and office header as the API
   client). A 401 first lets the API client refresh the session through the
   report's JSON route, then retries once.
   ========================================================================== */

import { ApiError, api, buildUrl } from "@/lib/api/client";
import { officePath } from "./office.scope";

export const OFFICE_REPORTS = [
  "roster",
  "programs",
  "check-in-notices",
  "messages",
  "lab-imports",
  "ccm",
  "travel",
  "education",
] as const;
export type OfficeReport = (typeof OFFICE_REPORTS)[number];

/** The reports that take a `months` window (1-24). */
export const MONTHLY_REPORTS: readonly OfficeReport[] = [
  "roster",
  "check-in-notices",
  "messages",
];

export const REPORT_MONTHS = { DEFAULT: 6, MIN: 1, MAX: 24 } as const;

export function clampMonths(months: number | undefined): number {
  if (months === undefined || !Number.isFinite(months))
    return REPORT_MONTHS.DEFAULT;
  return Math.min(
    REPORT_MONTHS.MAX,
    Math.max(REPORT_MONTHS.MIN, Math.trunc(months)),
  );
}

function reportQuery(report: OfficeReport, months?: number) {
  return MONTHLY_REPORTS.includes(report)
    ? { months: clampMonths(months) }
    : undefined;
}

export function getReport<T>(
  organizationId: string,
  report: OfficeReport,
  months?: number,
): Promise<T> {
  return api<T>(officePath(organizationId, `/reports/${report}`), {
    organizationId,
    query: reportQuery(report, months),
  });
}

export type ReportFile = { filename: string; csv: string };

const FILENAME = /filename="?([^";]+)"?/i;

/** A safe local file name (the server's, or a fallback). */
function fileNameFrom(header: string | null, report: OfficeReport): string {
  const raw = header?.match(FILENAME)?.[1] ?? "";
  const clean = raw.replace(/[^A-Za-z0-9._-]/g, "");
  return clean.endsWith(".csv") ? clean : `${report}-report.csv`;
}

async function errorFrom(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => null)) as {
    message?: string | string[];
    code?: string;
  } | null;
  return new ApiError(
    res.status,
    body?.message,
    typeof body?.code === "string" ? body.code : null,
  );
}

function fetchExport(
  organizationId: string,
  report: OfficeReport,
  months?: number,
): Promise<Response> {
  return fetch(
    buildUrl(
      officePath(organizationId, `/reports/${report}/export`),
      reportQuery(report, months),
    ),
    {
      method: "GET",
      credentials: "include",
      headers: { Accept: "text/csv", "X-Organization-Id": organizationId },
    },
  );
}

/** The server's audited CSV of one report. */
export async function exportReport(
  organizationId: string,
  report: OfficeReport,
  months?: number,
): Promise<ReportFile> {
  let res = await fetchExport(organizationId, report, months);
  if (res.status === 401) {
    /* The API client refreshes (or ends) the session on its own route. */
    await getReport(organizationId, report, months);
    res = await fetchExport(organizationId, report, months);
  }
  if (!res.ok) throw await errorFrom(res);
  return {
    filename: fileNameFrom(res.headers.get("Content-Disposition"), report),
    csv: await res.text(),
  };
}
