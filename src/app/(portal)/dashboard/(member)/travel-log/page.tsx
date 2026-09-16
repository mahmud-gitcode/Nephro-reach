"use client";

import React from "react";
import TravelBanner from "@/features/travel/TravelBanner";
import TravelDialysisSection from "@/features/travel/TravelDialysisSection";
import { TravelIntroBar } from "@/features/travel/TravelPanels";

/* ==========================================================================
   Dialysis Travel Log
   --------------------------------------------------------------------------
   The list. Ask for a trip, narrow what is shown, open one.

   Everything a trip has to say — its checklist, where the request has got
   to, what was booked, what happened in the chair — lives on that trip's own
   page at /dashboard/travel-log/[tripId].

   There is no separate history panel here either. Finished trips are trips,
   and Your trips already lists them behind its "Previous trips" filter; a
   second list of the same cards on the same screen is one more place for
   the two to disagree.
   ========================================================================== */

export default function TravelLogPage() {
  return (
    <div className="space-y-stack-lg">
      <TravelBanner />
      <TravelIntroBar />

      {/* Your trips, and the forms it opens. */}
      <TravelDialysisSection />
    </div>
  );
}
