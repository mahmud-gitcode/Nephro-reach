import React from "react";
import ClinicVascularAccess from "@/features/clinic/ClinicVascularAccess";

/* The Vascular Access Center's home: the same access records as the
   dialysis clinic's tab, worked from the access center's side. */
export default function Page() {
  return <ClinicVascularAccess party="access" />;
}
