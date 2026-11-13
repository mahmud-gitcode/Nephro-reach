"use client";

import React from "react";
import ClinicMessages from "@/features/clinic/ClinicMessages";
import type { CareTeamContact } from "@/features/messaging/messaging.types";
import { useLanguageCode } from "@/context/LanguageContext";
import { useHospitalOffice } from "./useHospital";

/* ==========================================================================
   Hospital messages — simple and secure, not care coordination
   --------------------------------------------------------------------------
   The client (2026-10-13): staff write to the patients enrolled through the
   hospital, one thread each, never copied to other offices automatically,
   and never automated clinical advice. The same inbox the offices use,
   without ride requests. The recipients are this hospital's own roster
   from the server (the office context picked at sign-in), never a list
   kept in the browser.
   ========================================================================== */

export default function HospitalMessages() {
  const isEs = useLanguageCode() === "ES";
  const { hospitalName } = useHospitalOffice();
  const office: CareTeamContact = {
    name: hospitalName || (isEs ? "Su hospital" : "Your hospital"),
    role: isEs
      ? "Su equipo de educación del hospital"
      : "Your Hospital Education Team",
    kind: "facility",
  };

  return (
    <ClinicMessages
      office={office}
      href="/dashboard/hospital/messages"
      showRides={false}
    />
  );
}
