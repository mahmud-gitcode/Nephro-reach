"use client";

import React from "react";
import SupportCenter from "@/features/support/SupportCenter";

/* The patient's Support tab. Requests now reach NephroReach's Support
   Inbox instead of staying on this page (client, 2026-10-07). */
export default function SupportPage() {
  return <SupportCenter href="/dashboard/support" />;
}
