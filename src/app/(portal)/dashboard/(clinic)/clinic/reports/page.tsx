import React from "react";
import ClinicReports from "@/features/clinic/ClinicReports";
import { RequirePermission } from "@/features/staff/RequirePermission";

export default function Page() {
  return (
    <RequirePermission permission="reports.view">
      <ClinicReports />
    </RequirePermission>
  );
}
