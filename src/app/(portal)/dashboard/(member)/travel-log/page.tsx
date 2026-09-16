"use client";

import React from "react";
import TravelBanner from "@/features/travel/TravelBanner";
import TravelDialysisSection from "@/features/travel/TravelDialysisSection";
import {
  PastTravelPanel,
  TravelIntroBar,
} from "@/features/travel/TravelPanels";
import { useTrips } from "@/features/travel/useTrips";

/* ==========================================================================
   Dialysis Travel Log
   --------------------------------------------------------------------------
   The list. Ask for a trip, narrow what is shown, open one.

   Everything a trip has to say — its checklist, its documents, where the
   request has got to, what was booked, what happened in the chair — lives on
   that trip's own page at /dashboard/travel-log/[tripId]. It used to hang
   under this list, which meant picking a card rewrote a screen the member
   was not looking at, and left one page carrying eight panels about a trip
   nobody had chosen yet.
   ========================================================================== */

export default function TravelLogPage() {
  const { past } = useTrips();

  return (
    <div className="space-y-stack-lg">
      <TravelBanner />
      <TravelIntroBar />

      {/* Your trips, and the forms it opens. */}
      <TravelDialysisSection />

      {/* Kept on the list because it is about the log as a whole, not about
        any one trip. */}
      <PastTravelPanel trips={past} />
    </div>
  );
}
