"use client";

import React from "react";
import ClinicMessages from "@/features/clinic/ClinicMessages";
import type { CareTeamContact } from "@/features/messaging/messaging.types";
import { useHospital } from "./useHospital";
import { programById } from "./hospital.data";

/* ==========================================================================
   Hospital messages — simple and secure, not care coordination
   --------------------------------------------------------------------------
   The client (2026-10-13): staff write to the patients enrolled through the
   hospital, one thread each, never copied to other offices automatically,
   and never automated clinical advice. The same inbox the offices use,
   limited to the hospital's own patients and without ride requests. An
   outpatient office not on NephroReach gets the secure external link.
   ========================================================================== */

export default function HospitalMessages() {
  const hospital = useHospital();
  const office: CareTeamContact = {
    name: hospital.hospitalName || "Riverside General Hospital",
    role: "Your Hospital Education Team",
    kind: "facility",
  };
  const patients = hospital.enrollments
    .filter((e) => e.status !== "withdrawn")
    .map((e) => ({
      name: e.patientName,
      mrn: e.mrn,
      program: programById(e.programId)?.nameEn ?? "",
      enrolledOn: e.enrolledAt,
      status: e.status,
    }));

  return (
    <ClinicMessages
      office={office}
      href="/dashboard/hospital/messages"
      patients={patients}
      showRides={false}
    />
  );
}
