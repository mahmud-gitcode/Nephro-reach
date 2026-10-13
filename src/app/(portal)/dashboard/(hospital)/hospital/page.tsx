"use client";

import React from "react";
import HospitalOverview from "@/features/hospital/HospitalOverview";
import { RequirePermission } from "@/features/staff/RequirePermission";

export default function Page() {
  return (
    <RequirePermission permission="hospital.overview">
      <HospitalOverview />
    </RequirePermission>
  );
}
