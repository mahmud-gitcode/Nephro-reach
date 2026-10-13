"use client";

import React from "react";
import ClinicBilling from "@/features/clinic/ClinicBilling";
import { RequirePermission } from "@/features/staff/RequirePermission";
import { useHospital } from "@/features/hospital/useHospital";

/* Subscription, contract, invoices and renewal — the same page every office
   has, counting the hospital's own enrolled patients. */
export default function Page() {
  const hospital = useHospital();
  return (
    <RequirePermission permission="billing.view">
      <ClinicBilling
        href="/dashboard/hospital/billing"
        covered={hospital.enrollments.length}
      />
    </RequirePermission>
  );
}
