"use client";

import React from "react";
import HospitalReports from "@/features/hospital/HospitalReports";
import { RequirePermission } from "@/features/staff/RequirePermission";

export default function Page() {
  return (
    <RequirePermission permission="hospital.reports">
      <HospitalReports />
    </RequirePermission>
  );
}
