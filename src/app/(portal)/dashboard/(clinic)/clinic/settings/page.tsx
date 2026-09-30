import React from "react";
import ClinicSettings from "@/features/clinic/ClinicSettings";
import { RequirePermission } from "@/features/staff/RequirePermission";

export default function Page() {
  return (
    <RequirePermission permission="settings.manage">
      <ClinicSettings />
    </RequirePermission>
  );
}
