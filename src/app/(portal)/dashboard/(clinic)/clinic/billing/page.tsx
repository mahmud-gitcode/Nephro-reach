import React from "react";
import ClinicBilling from "@/features/clinic/ClinicBilling";
import { RequirePermission } from "@/features/staff/RequirePermission";

export default function Page() {
  return (
    <RequirePermission permission="billing.view">
      <ClinicBilling />
    </RequirePermission>
  );
}
