"use client";

import React from "react";
import HospitalMessages from "@/features/hospital/HospitalMessages";
import { RequirePermission } from "@/features/staff/RequirePermission";

export default function Page() {
  return (
    <RequirePermission permission="hospital.messages">
      <HospitalMessages />
    </RequirePermission>
  );
}
