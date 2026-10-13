"use client";

import React from "react";
import HospitalPatients from "@/features/hospital/HospitalPatients";
import { RequirePermission } from "@/features/staff/RequirePermission";

export default function Page() {
  return (
    <RequirePermission permission="hospital.patients">
      <HospitalPatients />
    </RequirePermission>
  );
}
