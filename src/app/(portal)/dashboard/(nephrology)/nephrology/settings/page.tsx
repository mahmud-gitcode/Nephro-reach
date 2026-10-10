import React from "react";
import ClinicSettings from "@/features/clinic/ClinicSettings";
import { RequirePermission } from "@/features/staff/RequirePermission";

/* The nephrology office's own settings (client, 2026-10-09): its hours and
   on-call nurse manager, saved apart from the dialysis center's. */
export default function Page() {
  return (
    <RequirePermission permission="settings.manage">
      <ClinicSettings href="/dashboard/nephrology/settings" />
    </RequirePermission>
  );
}
