"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { downloadText } from "@/lib/utils/download";
import { officeKey, requireOffice, useOfficeScope } from "./office.scope";
import {
  clampMonths,
  exportReport,
  getReport,
  MONTHLY_REPORTS,
  type OfficeReport,
} from "./officeReports.repository";

/* ==========================================================================
   Office reports from the API (Phase 14; ADR 0007)
   --------------------------------------------------------------------------
   One query per report, keyed by the office, the report and the window.
   A failed read is that card's error (a 403 is "no access"), never a zero.
   Downloads are the server's audited CSV.
   ========================================================================== */

export function useOfficeReport<T>(
  report: OfficeReport,
  months?: number,
  enabled = true,
) {
  const { organizationId: orgId } = useOfficeScope();
  const span = MONTHLY_REPORTS.includes(report) ? clampMonths(months) : null;
  const query = useQuery({
    queryKey: officeKey(orgId, "reports", report, span),
    queryFn: () =>
      getReport<T>(requireOffice(orgId), report, span ?? undefined),
    enabled,
  });
  return {
    data: query.data ?? null,
    isPending: enabled && query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

/** Downloads one report as the server's CSV (audited by the server). */
export function useReportExport() {
  const { organizationId: orgId } = useOfficeScope();
  return useMutation({
    mutationFn: ({
      report,
      months,
    }: {
      report: OfficeReport;
      months?: number;
    }) => exportReport(requireOffice(orgId), report, months),
    onSuccess: (file) => downloadText(file.filename, file.csv, "text/csv"),
  });
}
