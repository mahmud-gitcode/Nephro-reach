"use client";

import React from "react";
import ClinicBilling from "@/features/clinic/ClinicBilling";
import { RequirePermission } from "@/features/staff/RequirePermission";

/* Subscription, contract, invoices and renewal — the same page every office
   has; the seats in use are the server's count for this hospital. */
export default function Page() {
  return (
    <RequirePermission permission="billing.view">
      <ClinicBilling href="/dashboard/hospital/billing" />
    </RequirePermission>
  );
}
