import React from "react";
import ClinicLiveClass from "@/features/clinic/ClinicLiveClass";

/* The client (2026-10-06): NephroReach hosts every live class, so the
   admin runs them with the full page the clinic used to have — schedule,
   edit, recordings and settings. The clinic now sees it read-only. No
   "Join in" here: the admin is the host, not an attendee. */
export default function Page() {
  return <ClinicLiveClass manage href="/dashboard/live-class" />;
}
