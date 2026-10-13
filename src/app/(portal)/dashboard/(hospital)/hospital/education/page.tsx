"use client";

import React from "react";
import HospitalEducation from "@/features/hospital/HospitalEducation";
import { RequirePermission } from "@/features/staff/RequirePermission";

export default function Page() {
  return (
    <RequirePermission permission="hospital.patients">
      <HospitalEducation />
    </RequirePermission>
  );
}
