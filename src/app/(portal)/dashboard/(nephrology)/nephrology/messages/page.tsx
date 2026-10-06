import React from "react";
import ClinicMessages from "@/features/clinic/ClinicMessages";
import { NEPHROLOGY_OFFICE } from "@/features/messaging/messaging.seed";

/* The nephrology office's patient messages, the same inbox the dialysis
   center works (client, 2026-10-06). Its threads with the access center
   are on Access Center Messages. */
export default function Page() {
  return (
    <ClinicMessages
      office={NEPHROLOGY_OFFICE}
      href="/dashboard/nephrology/messages"
    />
  );
}
